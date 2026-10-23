class AppClippy {
  constructor() {
    this.running = this.opt('enabled') !== false;
    this.visible = this.running;
    this.annoyance = this.opt('annoyance') || 'normal';
    this.state = 'idle';
    this.balloonTimeout = null;
    this.idleTimer = null;
    this.idleSeconds = 0;
    this.blinkInterval = null;

    this.posX = null;
    this.posY = null;
    this.isDragging = false;
    this.dragStartX = 0;
    this.dragStartY = 0;
    this.containerStartX = 0;
    this.containerStartY = 0;

    this.currentQuizIndex = 0;
    this.quizScore = 0;

    this.quizRoundSize = 5;
    this.quizRound = [];
    try {
      this.persistentGlasses = localStorage.getItem('win98_clippy_glasses') === 'true';
      this.quizHighScore = parseInt(localStorage.getItem('win98_clippy_quiz_best') || '0', 10);
      this.quizAced = localStorage.getItem('win98_clippy_quiz_aced') === 'true';
      if (!this.quizAced && parseInt(localStorage.getItem('win98_clippy_quiz_highscore') || '0', 10) >= 3) {
        this.quizAced = true;
        localStorage.setItem('win98_clippy_quiz_aced', 'true');
      }
    } catch (e) {
      this.persistentGlasses = false;
      this.quizHighScore = 0;
      this.quizAced = false;
    }

    this.activeAccessories = new Set();

    this.tips = [
      'Похоже, вы работаете в Win 98! Не забывайте регулярно сохранять файлы в Блокноте (Ctrl+S).',
      'Хотите сыграть в «Косынку»? Я никому не расскажу, что вы делаете это на работе.',
      'Совет дня: если компьютер зависнет, нажмите Ctrl+Alt+Del и снимите зависшую задачу.',
      'Вы знали? В 1998 году процессор Pentium II 300 МГц и Voodoo2 считались вершиной прогресса!',
      'Если вам одиноко в сети, запустите ICQ 98 («Аську») и найдите друзей по номеру UIN.',
      'Чтобы освободить место на диске C:, запустите Дефрагментатор или очистите Корзину!',
      'Знаете ли вы? Если потрясти шариковую мышку над ухом — услышите перекатывающийся металлический шарик!',
      'Модемный совет: если связь обрывается на 33.6k, попробуйте строку инициализации AT&F1!',
      'В DOOM 98 наберите IDDQD прямо во время игры — и демоны Марса станут вам не страшны!',
      'Мечтаете о 3D? Blender 1.60 от Not a Number весит всего 1.8 МБ, а рендер запускается клавишей F12!',
      'Каталог 3ADVANCED (www.3advanced.com) запускает любую программу прямо со страницы браузера!',
      'В Dota 98 и League of Legends 98 можно сразиться 5 на 5 с ботами — даже без модема!',
      'Stay awhile and listen! Декард Каин в Diablo всегда подскажет, куда идти в соборе Тристрама.',
      'Архиватор WinRAR бесплатен ровно 40 дней. А потом... тоже бесплатен, только с напоминанием!',
      'Нажмите F1 на рабочем столе, и я спрошу, что вы хотите сделать. Можно писать своими словами.',
      'Мой номер в ICQ — 199898. Если меня не видно на рабочем столе, напишите туда.',
      'Если я мешаю, щёлкните по скрепке в трее. А если мешаю совсем, в «Параметрах помощника» есть галочка.',
      'Перетащите меня к заголовку окна, и я сяду на него, как на жёрдочку.',
      'Рядом со мной загорелась лампочка? Значит, у меня есть совет. Щёлкните по ней, когда будет минутка.',
      'Игры теперь продаются в Steam. Клиент скачивается с www.steampowered.com прямо в Internet Explorer.',
      'В Блокноте клавиша F5 вставляет дату и время. Удобно, если вы ведёте дневник.',
      'Двойной щелчок по заголовку окна разворачивает его на весь экран. И обратно.'
    ];

    this.quizQuestions = [
      {
        q: 'Какой объём у стандартной 3.5" дискеты в 1998 году?',
        options: [
          { text: '1.44 МБ', correct: true },
          { text: '700 МБ', correct: false },
          { text: '128 КБ', correct: false }
        ],
        winText: 'Верно! Именно на таких дискетах переносили курсовые и DOOM.',
        failText: 'Неверно! 1.44 МБ — классика эпохи дискет 3.5" HD.'
      },
      {
        q: 'Что делать, если мышка плохо ездит по коврику?',
        options: [
          { text: 'Почистить шарик и валики от пыли', correct: true },
          { text: 'Переустановить Win 98', correct: false },
          { text: 'Сменить монитор на 17 дюймов', correct: false }
        ],
        winText: 'В яблочко! Снять кольцо, вынуть шарик и почистить спиртом.',
        failText: 'Нет! Нужно было просто вынуть шарик и почистить грязь с двух валиков.'
      },
      {
        q: 'Какой 3D-ускоритель был абсолютной мечтой геймера в 1998 году?',
        options: [
          { text: '3dfx Voodoo2 (Glide API)', correct: true },
          { text: 'GeForce RTX 4090', correct: false },
          { text: 'Intel 810 Graphics', correct: false }
        ],
        winText: 'Абсолютно точно! Voodoo2 выдавал невероятную графику в Quake II!',
        failText: 'Увы! Легендой 1998 года был именно 3dfx Voodoo2.'
      },
      {
        q: 'Какой чит-код в DOOM 98 делает вас бессмертным?',
        options: [
          { text: 'IDDQD', correct: true },
          { text: 'IDKFA', correct: false },
          { text: 'XYZZY', correct: false }
        ],
        winText: 'Точно! А IDKFA даёт всё оружие и ключи. Я никому не скажу.',
        failText: 'Бессмертие даёт IDDQD. IDKFA — это всё оружие и ключи.'
      },
      {
        q: 'Что делает сочетание клавиш Ctrl+S?',
        options: [
          { text: 'Сохраняет документ', correct: true },
          { text: 'Выключает звук', correct: false },
          { text: 'Вызывает Скрепыша', correct: false }
        ],
        winText: 'Да! Моё любимое сочетание клавиш. Нажимайте почаще.',
        failText: 'Ctrl+S сохраняет документ. Запомните, пожалуйста. Ради меня.'
      },
      {
        q: 'Сколько дней длится пробный период WinRAR?',
        options: [
          { text: '40 дней', correct: true },
          { text: '7 дней', correct: false },
          { text: 'Ровно год', correct: false }
        ],
        winText: 'Верно. А потом WinRAR просто вежливо напоминает. Вечно.',
        failText: '40 дней. А потом WinRAR просто вежливо напоминает. Вечно.'
      },
      {
        q: 'Какой звук издаёт ICQ, когда приходит сообщение?',
        options: [
          { text: '«О-оу!»', correct: true },
          { text: '«Динь-дон»', correct: false },
          { text: '«Гав!»', correct: false }
        ],
        winText: 'О-оу! Именно так. Сердце замирает каждый раз.',
        failText: 'ICQ говорит «О-оу!». «Гав» — это совсем другой звук. Собачий.'
      },
      {
        q: 'Программа зависла. Какое сочетание вызывает Диспетчер задач?',
        options: [
          { text: 'Ctrl+Alt+Del', correct: true },
          { text: 'Alt+F4', correct: false },
          { text: 'Shift+Esc', correct: false }
        ],
        winText: 'Правильно. Только меня оттуда не снимайте, пожалуйста.',
        failText: 'Ctrl+Alt+Del. Alt+F4 закрывает окно, а зависшее окно его не слышит.'
      },
      {
        q: 'Когда вышла Win 98?',
        options: [
          { text: '25 июня 1998 года', correct: true },
          { text: '1 января 1998 года', correct: false },
          { text: '31 декабря 1999 года', correct: false }
        ],
        winText: 'Правильно! Летом. Я помню этот день: все помощники надели бабочки.',
        failText: '25 июня 1998 года. Я помню этот день: все помощники надели бабочки.'
      },
      {
        q: '«Модем на 56k» — это 56 тысяч чего?',
        options: [
          { text: 'Бит в секунду', correct: true },
          { text: 'Байт в секунду', correct: false },
          { text: 'Звонков в минуту', correct: false }
        ],
        winText: 'Бит в секунду. В теории. На практике около 44, и то ночью.',
        failText: 'Бит в секунду. И то в теории: на практике ночью выходит около 44k.'
      },
      {
        q: 'Какой клавишей Blender 1.60 запускает рендер?',
        options: [
          { text: 'F12', correct: true },
          { text: 'F5', correct: false },
          { text: 'Enter', correct: false }
        ],
        winText: 'F12! Теперь можно отрендерить меня. Я простая модель: цилиндр и два глаза.',
        failText: 'F12. F5 в Блокноте вставляет дату, а в Blender — нет.'
      },
      {
        q: 'Что делает секретный код xyzzy в «Сапёре»?',
        options: [
          { text: 'Подсказывает, где мина', correct: true },
          { text: 'Добавляет лишнюю жизнь', correct: false },
          { text: 'Открывает всё поле', correct: false }
        ],
        winText: 'Да: пиксель в углу экрана гаснет над миной. Только тсс.',
        failText: 'Подсказывает мины: пиксель в углу экрана гаснет над миной. Только тсс.'
      },
      {
        q: 'В каких файлах хранятся наряды с www.clippy98.com?',
        options: [
          { text: '.ACS', correct: true },
          { text: '.EXE', correct: false },
          { text: '.BMP', correct: false }
        ],
        winText: 'Верно! ACS — формат персонажей Microslop Agent. Вы явно заглядывали в мой шкаф.',
        failText: '.ACS — формат персонажей Microslop Agent. EXE я бы скачивать не советовал.'
      },
      {
        q: 'Сколько весит Скрепыш?',
        options: [
          { text: 'Около грамма', correct: true },
          { text: '1.44 МБ', correct: false },
          { text: 'Полкилограмма', correct: false }
        ],
        winText: 'Один грамм нержавеющей стали. И ни одного лишнего бита.',
        failText: 'Около грамма. 1.44 МБ весит дискета, а я — скрепка.'
      },
      {
        q: 'Как зовут бумажного кота из коллег Скрепыша, который включает Caps Lock?',
        options: [
          { text: 'Скрибл', correct: true },
          { text: 'Neko', correct: false },
          { text: 'Мурзик', correct: false }
        ],
        winText: 'ДА! ИЗВИНИТЕ, ЭТО ОН ОПЯТЬ ЛЁГ НА КЛАВИАТУРУ.',
        failText: 'Скрибл. Neko — это кот, который бегает по рабочему столу за мышкой.'
      }
    ];

    this.initDOM();
    if (this.persistentGlasses) {
      this.setAccessory('glasses', true);
    }
    this.applyWardrobe();
    this.initDragging();
    this.initEyeTracking();
    this.initIdleSystem();
    this.initSystemListeners();
    this.initAppMonitors();
    this.initMoveAway();
    if (!this.running) this.container.style.display = 'none';

    if (typeof document !== 'undefined' && document.readyState && document.readyState !== 'loading') setTimeout(() => this.afterBoot(), 0);
    else window.addEventListener('DOMContentLoaded', () => this.afterBoot());
    setTimeout(() => this.greetOnBoot(), 2800);
  }

  t(k, ...args) {
    return window.i18n ? window.i18n.t(k, ...args) : k;
  }

  opt(name) {
    const options = window.clippyOptions;
    if (options) return options.get(name);
    return {
      enabled: true, respondF1: true, letters: true, appReactions: true, siteReactions: true,
      moveAway: true, sounds: true, tipOfDay: true, tipsMode: 'bulb', annoyance: 'normal'
    }[name];
  }

  sound(method) {
    if (this.opt('sounds') === false) return;
    const sys = window.soundSys;
    if (sys && typeof sys[method] === 'function') sys[method]();
  }

  flash(cls, ms) {
    if (!this.charEl) return;
    this.charEl.classList.add(cls);
    setTimeout(() => this.charEl.classList.remove(cls), ms);
  }

  greetOnBoot() {
    const talk = window.clippyTalk;
    if (!this.running) {
      if (talk) talk.registerVisit();
      this.updateTray();
      return;
    }
    if (talk) {
      talk.greet();
      this.updateTray();
      setTimeout(() => {
        if (window.clippyTips) window.clippyTips.tipOfDay();
      }, 9000);
      return;
    }
    this.speak('Привет! Я ваш помощник Скрепыш. Чем я могу помочь вам в Win 98?', [
      { text: '• Расскажи что-нибудь интересное', action: () => this.sayRandomTip() },
      { text: '• Сыграть в Ретро-Викторину 1998', action: () => this.startQuiz() },
      { text: '• Покажи фокус!', action: () => this.showRandomTrick() }
    ]);
  }

  afterBoot() {
    if (window.clippyOptions) window.clippyOptions.writeRegistry();
    if (window.clippyActors) window.clippyActors.ensureFolder();
    if (window.clippySystem) window.clippySystem.boot();
    this.updateTray();
  }

  isRunning() {
    return this.running !== false;
  }

  initDOM() {
    this.container = document.createElement('div');
    this.container.id = 'clippy-container';

    this.container.innerHTML = `
      <div class="clippy-balloon" id="clippy-balloon" style="display:none;">
        <div class="clippy-header">
          <div class="clippy-header-title">
            <span class="clippy-mood-icon" id="clippy-mood">📎</span>
            <span id="clippy-title">Скрепыш</span>
          </div>
          <span class="clippy-close-btn" id="clippy-close" title="Закрыть совет">✕</span>
        </div>
        <div class="clippy-body" id="clippy-text"></div>
        <div class="clippy-ask" id="clippy-ask"></div>
        <div class="clippy-actions" id="clippy-actions"></div>
        <div class="clippy-footer" id="clippy-footer"></div>
      </div>

      <div class="clippy-bulb" id="clippy-bulb" title="У Скрепыша есть совет">
        <svg viewBox="0 0 16 22" width="16" height="22" shape-rendering="crispEdges" xmlns="http://www.w3.org/2000/svg">
          <path d="M5 0h6v1h2v2h1v2h1v5h-1v2h-1v2h-1v3H4v-3H3v-2H2v-2H1V5h1V3h1V1h2z" fill="#000"/>
          <path d="M5 1h6v1h2v2h1v6h-1v2h-1v2h-1v2H5v-2H4v-2H3v-2H2V4h1V2h2z" fill="#ffff00"/>
          <path d="M5 2h3v1H6v1H5v2H4V4h1z" fill="#ffffff"/>
          <path d="M4 17h8v1H4zM4 19h8v1H4z" fill="#808080"/>
          <path d="M4 18h8v1H4zM5 20h6v2H5z" fill="#c0c0c0"/>
        </svg>
      </div>

      <div class="clippy-character" id="clippy-char" title="Скрепыш (ЛКМ - говорить/тянуть, ПКМ - меню)">
        <div class="clippy-zzz-wrap" id="clippy-zzz">
          <span class="clippy-z-bubble">Z</span>
          <span class="clippy-z-bubble">z</span>
          <span class="clippy-z-bubble">z</span>
        </div>

        <svg id="clippy-svg" viewBox="0 0 68 76" width="68" height="76" fill="none" xmlns="http://www.w3.org/2000/svg">
          <path id="clippy-wire-shadow" d="M26 68V20a14 14 0 1 1 28 0v42a10 10 0 1 1-20 0V24a6 6 0 1 1 12 0v36"
                stroke="#334155" stroke-width="5.5" stroke-linecap="round" stroke-linejoin="round"/>
          <path id="clippy-wire-main" d="M26 68V20a14 14 0 1 1 28 0v42a10 10 0 1 1-20 0V24a6 6 0 1 1 12 0v36"
                stroke="#e2e8f0" stroke-width="2.8" stroke-linecap="round" stroke-linejoin="round"/>
          <path id="clippy-wire-highlight" d="M27 66V21a13 13 0 0 1 13-13"
                stroke="#ffffff" stroke-width="1.2" stroke-linecap="round" stroke-dasharray="20 4"/>

          <g id="clippy-eyes-group">
            <ellipse cx="28" cy="26" rx="7.5" ry="9.5" fill="#ffffff" stroke="#0f172a" stroke-width="1.8"/>
            <ellipse id="clippy-pupil-l" cx="29" cy="26" rx="3.6" ry="4.8" fill="#000000"/>
            <circle cx="28" cy="24" r="1.5" fill="#ffffff"/>
            <path id="clippy-eyelid-l" class="clippy-eyelid" d="M20.5 24a7.5 7.5 0 0 1 15 0v3h-15z" fill="#cbd5e1" stroke="#0f172a" stroke-width="1.2"/>

            <ellipse cx="43" cy="26" rx="7.5" ry="9.5" fill="#ffffff" stroke="#0f172a" stroke-width="1.8"/>
            <ellipse id="clippy-pupil-r" cx="44" cy="26" rx="3.6" ry="4.8" fill="#000000"/>
            <circle cx="43" cy="24" r="1.5" fill="#ffffff"/>
            <path id="clippy-eyelid-r" class="clippy-eyelid" d="M35.5 24a7.5 7.5 0 0 1 15 0v3h-15z" fill="#cbd5e1" stroke="#0f172a" stroke-width="1.2"/>
          </g>

          <path id="clippy-brow-l" d="M21 16c2.5-3 7-3 9 0" stroke="#0f172a" stroke-width="2.4" stroke-linecap="round"/>
          <path id="clippy-brow-r" d="M40 16c2.5-3 7-3 9 0" stroke="#0f172a" stroke-width="2.4" stroke-linecap="round"/>

          <g id="clippy-slot-neck" class="clippy-slot" transform="translate(0 3)"></g>
          <g id="clippy-slot-mouth" class="clippy-slot"></g>
          <g id="clippy-slot-eyes" class="clippy-slot"></g>
          <g id="clippy-slot-head" class="clippy-slot"></g>

          <g id="clippy-headphones" class="clippy-accessory">
            <path d="M16 26C16 8 55 8 55 26" stroke="#1e293b" stroke-width="3" fill="none" stroke-linecap="round"/>
            <rect x="13" y="22" width="6" height="12" rx="3" fill="#ff7700" stroke="#000" stroke-width="1.2"/>
            <rect x="52" y="22" width="6" height="12" rx="3" fill="#ff7700" stroke="#000" stroke-width="1.2"/>
          </g>

          <g id="clippy-glasses" class="clippy-accessory">
            <rect x="20" y="23" width="14" height="8" fill="#000000" stroke="#ffffff" stroke-width="1"/>
            <rect x="37" y="23" width="14" height="8" fill="#000000" stroke="#ffffff" stroke-width="1"/>
            <rect x="34" y="25" width="3" height="3" fill="#000000"/>
            <rect x="22" y="25" width="2" height="2" fill="#ffffff"/>
            <rect x="39" y="25" width="2" height="2" fill="#ffffff"/>
          </g>

          <g id="clippy-halo" class="clippy-accessory">
            <ellipse cx="36" cy="6" rx="16" ry="4.5" fill="none" stroke="#facc15" stroke-width="2.8"/>
            <ellipse cx="36" cy="6" rx="14" ry="3.5" fill="none" stroke="#fef08a" stroke-width="1.5"/>
          </g>

          <g id="clippy-coffee" class="clippy-accessory">
            <rect x="8" y="52" width="14" height="15" rx="2" fill="#e0e7ff" stroke="#1e1b4b" stroke-width="1.5"/>
            <path d="M8 55H4a3 3 0 0 0 0 6h4" stroke="#1e1b4b" stroke-width="1.5" fill="none"/>
            <path d="M12 50c-1-2 1-3 0-5" stroke="#94a3b8" stroke-width="1.2" stroke-linecap="round" fill="none"/>
            <path d="M16 50c-1-2 1-3 0-5" stroke="#94a3b8" stroke-width="1.2" stroke-linecap="round" fill="none"/>
          </g>

          <g id="clippy-blush" class="clippy-accessory">
            <ellipse cx="23" cy="38" rx="4.5" ry="2.2" fill="#fb7185" opacity="0.75"/>
            <ellipse cx="48" cy="38" rx="4.5" ry="2.2" fill="#fb7185" opacity="0.75"/>
          </g>

          <g id="clippy-boss-sign" class="clippy-accessory">
            <rect x="38" y="44" width="28" height="14" rx="2" fill="#dc2626" stroke="#ffffff" stroke-width="1"/>
            <text x="41" y="54" font-family="'Courier New', monospace" font-size="8" font-weight="bold" fill="#ffffff">BOSS!</text>
          </g>

          <g id="clippy-prop-writing" class="clippy-prop">
            <rect x="-8" y="46" width="22" height="27" fill="#ffffff" stroke="#000" stroke-width="1"/>
            <path d="M-5 52h16M-5 56h16M-5 60h11M-5 64h15M-5 68h9" stroke="#808080" stroke-width="1"/>
            <g class="clippy-pencil">
              <polygon points="15,38 19,42 7,56 3,56 3,52" fill="#facc15" stroke="#000" stroke-width="1"/>
              <polygon points="3,52 3,56 7,56" fill="#f5d0a9" stroke="#000" stroke-width="0.6"/>
              <polygon points="3,54.5 3,56 4.5,56" fill="#000"/>
              <polygon points="15,38 19,42 21,40 17,36" fill="#f472b6" stroke="#000" stroke-width="0.8"/>
            </g>
          </g>

          <g id="clippy-prop-search" class="clippy-prop">
            <g class="clippy-magnifier">
              <line x1="61" y1="51" x2="70" y2="60" stroke="#000" stroke-width="5" stroke-linecap="round"/>
              <line x1="61" y1="51" x2="70" y2="60" stroke="#92400e" stroke-width="3" stroke-linecap="round"/>
              <circle cx="55" cy="45" r="8.5" fill="#dbeafe" stroke="#000" stroke-width="2"/>
              <path d="M50 42a6 6 0 0 1 4-3" stroke="#ffffff" stroke-width="1.6" fill="none" stroke-linecap="round"/>
            </g>
          </g>

          <g id="clippy-prop-save" class="clippy-prop">
            <rect x="-6" y="50" width="21" height="21" fill="#1e3a8a" stroke="#000" stroke-width="1"/>
            <rect x="-2" y="50" width="13" height="7" fill="#c0c0c0" stroke="#000" stroke-width="0.6"/>
            <rect x="6" y="51" width="3" height="5" fill="#1e3a8a"/>
            <rect x="-2" y="61" width="13" height="10" fill="#ffffff" stroke="#000" stroke-width="0.6"/>
            <path d="M0 64h9M0 67h9" stroke="#808080" stroke-width="0.8"/>
            <path class="clippy-save-check" d="M17 48l4 4 8-9" stroke="#16a34a" stroke-width="3" fill="none" stroke-linecap="round" stroke-linejoin="round"/>
          </g>

          <g id="clippy-prop-mail" class="clippy-prop">
            <g class="clippy-envelope">
              <rect x="42" y="50" width="22" height="15" fill="#ffffff" stroke="#000" stroke-width="1"/>
              <path d="M42 50l11 8 11-8" fill="none" stroke="#000" stroke-width="1"/>
              <rect x="57" y="52" width="5" height="5" fill="#dc2626"/>
            </g>
          </g>

          <g id="clippy-prop-trash" class="clippy-prop">
            <circle class="clippy-trash-ball" cx="5" cy="30" r="3.2" fill="#ffffff" stroke="#000" stroke-width="1"/>
            <path d="M-4 55h18l-2 18H-2z" fill="#9ca3af" stroke="#000" stroke-width="1"/>
            <path d="M1 58v12M5 58v12M9 58v12" stroke="#4b5563" stroke-width="1"/>
            <g class="clippy-trash-lid">
              <rect x="-6" y="51" width="22" height="4" fill="#6b7280" stroke="#000" stroke-width="1"/>
              <rect x="2" y="49" width="6" height="2" fill="#6b7280" stroke="#000" stroke-width="0.8"/>
            </g>
          </g>

          <g id="clippy-prop-think" class="clippy-prop">
            <circle cx="55" cy="9" r="2" fill="#ffffff" stroke="#000080" stroke-width="1"/>
            <circle cx="61" cy="3" r="2.8" fill="#ffffff" stroke="#000080" stroke-width="1"/>
            <circle cx="69" cy="-5" r="3.6" fill="#ffffff" stroke="#000080" stroke-width="1"/>
          </g>

          <g id="clippy-prop-confetti" class="clippy-prop">
            <rect class="cf cf1" x="34" y="6" width="4" height="2" fill="#ef4444"/>
            <rect class="cf cf2" x="34" y="6" width="3" height="3" fill="#facc15"/>
            <rect class="cf cf3" x="34" y="6" width="4" height="2" fill="#22c55e"/>
            <rect class="cf cf4" x="34" y="6" width="2" height="4" fill="#3b82f6"/>
            <rect class="cf cf5" x="34" y="6" width="3" height="3" fill="#a855f7"/>
            <rect class="cf cf6" x="34" y="6" width="4" height="2" fill="#f97316"/>
            <rect class="cf cf7" x="34" y="6" width="2" height="4" fill="#ec4899"/>
            <rect class="cf cf8" x="34" y="6" width="3" height="3" fill="#14b8a6"/>
          </g>
        </svg>
      </div>
    `;

    document.body.appendChild(this.container);

    this.balloon = this.container.querySelector('#clippy-balloon');
    this.charEl = this.container.querySelector('#clippy-char');
    this.pupilL = this.container.querySelector('#clippy-pupil-l');
    this.pupilR = this.container.querySelector('#clippy-pupil-r');
    this.browL = this.container.querySelector('#clippy-brow-l');
    this.browR = this.container.querySelector('#clippy-brow-r');

    this.bulbEl = this.container.querySelector('#clippy-bulb');

    this.container.querySelector('#clippy-close').addEventListener('click', (e) => {
      e.stopPropagation();
      this.hideBalloon();
    });

    this.bulbEl.addEventListener('click', (e) => {
      e.stopPropagation();
      this.sound('playClick');
      if (window.clippyTips) window.clippyTips.showNext();
    });

    this.charEl.addEventListener('contextmenu', (e) => {
      e.preventDefault();
      e.stopPropagation();
      this.openContextMenu(e.clientX, e.clientY);
    });
  }

  animate(name, ms) {
    const lengths = {
      writing: 3200, search: 2600, save: 1900, mail: 1800, trash: 2000, think: 3000,
      congratulate: 2200, wave: 1800, lookAround: 2400, stretch: 1400, spin: 1200, greet: 1200
    };
    if (!this.container || !lengths[name]) return false;
    const duration = ms || lengths[name];
    if (this.currentAnim) this.container.classList.remove(`clippy-anim-${this.currentAnim}`);
    clearTimeout(this.animTimer);
    this.currentAnim = name;
    if (this.container.getBoundingClientRect) this.container.getBoundingClientRect();
    this.container.classList.add(`clippy-anim-${name}`);
    this.animTimer = setTimeout(() => {
      this.container.classList.remove(`clippy-anim-${name}`);
      this.currentAnim = null;
    }, duration);
    return true;
  }

  playRandomAnimation() {
    const pool = ['writing', 'search', 'save', 'mail', 'trash', 'think', 'congratulate', 'wave', 'lookAround', 'stretch', 'spin'];
    const name = pool[Math.floor(Math.random() * pool.length)];
    this.wakeUp(false);
    this.animate(name);
    if (name === 'congratulate') this.sound('playClippyVictory');
    else if (name === 'mail' || name === 'spin') this.sound('playClippyWoosh');
    else if (name === 'writing') this.sound('playClippyScribble');
    else this.sound('playClippyTap');
  }

  setBulb(on) {
    if (!this.container) return;
    this.container.classList.toggle('has-bulb', Boolean(on));
    this.updateTray();
  }

  updateTray() {
    const tray = window.taskbar && window.taskbar.clippyTrayEl;
    if (!tray || !tray.classList) return;
    const talk = window.clippyTalk;
    const running = this.isRunning();
    const letter = running && Boolean(talk && talk.arcReady && talk.arcReady());
    const tip = running && Boolean(window.clippyTips && window.clippyTips.pending && window.clippyTips.pending.length);
    tray.classList.toggle('is-off', !this.isRunning());
    tray.classList.toggle('has-letter', letter);
    tray.classList.toggle('has-tip', tip && !letter);
    const base = this.t('tray.clippy');
    let note = '';
    if (!this.isRunning()) note = this.t(this.opt('enabled') === false ? 'clippy.trayDisabled' : 'clippy.trayOff');
    else if (letter) note = this.t('clippy.trayLetter');
    else if (tip) note = this.t('clippy.trayTip');
    else if (!this.visible) note = this.t('clippy.trayHidden');
    else if (this.state === 'sleeping') note = this.t('clippy.traySleeping');
    const text = note ? `${base}: ${note}` : base;
    if (tray.dataset && tray.dataset.winTip !== undefined) tray.dataset.winTip = text;
    else tray.title = text;
  }

  initDragging() {
    this.charEl.addEventListener('mousedown', (e) => {
      if (e.button !== 0) return;
      e.preventDefault();

      this.isDragging = false;
      const startX = e.clientX;
      const startY = e.clientY;

      const charRect = this.charEl.getBoundingClientRect();
      const grabOffsetX = e.clientX - charRect.left;
      const grabOffsetY = e.clientY - charRect.top;

      const onMouseMove = (moveEvent) => {
        const dist = Math.hypot(moveEvent.clientX - startX, moveEvent.clientY - startY);

        if (!this.isDragging && dist > 4) {
          this.isDragging = true;
          this.charEl.classList.add('dragging');
          this.container.classList.add('is-custom-pos');
          this.wakeUp(false);
          this.hideBalloon();
        }

        if (this.isDragging) {
          let newX = moveEvent.clientX - grabOffsetX;
          let newY = moveEvent.clientY - grabOffsetY;

          const maxX = window.innerWidth - this.charEl.offsetWidth - 10;
          const maxY = window.innerHeight - this.charEl.offsetHeight - 36;
          newX = Math.max(10, Math.min(newX, maxX));
          newY = Math.max(10, Math.min(newY, maxY));

          this.container.style.left = `${newX}px`;
          this.container.style.top = `${newY}px`;
          this.posX = newX;
          this.posY = newY;
        }
      };

      const onMouseUp = () => {
        window.removeEventListener('mousemove', onMouseMove);
        window.removeEventListener('mouseup', onMouseUp);

        if (this.isDragging) {
          this.charEl.classList.remove('dragging');
          this.isDragging = false;
          this.sound('playClick');
          this.snapToNearestWindow();
          if (window.clippyTalk) window.clippyTalk.onDragged();
        } else {
          this.poke();
        }
      };

      window.addEventListener('mousemove', onMouseMove);
      window.addEventListener('mouseup', onMouseUp);
    });
  }

  snapToNearestWindow() {
    if (!window.winManager) return;
    const clippyRect = this.charEl.getBoundingClientRect();
    const clippyCenterX = clippyRect.left + clippyRect.width / 2;
    const clippyCenterY = clippyRect.top + clippyRect.height / 2;

    let nearestWin = null;
    let minDistance = 120;

    window.winManager.windows.forEach((win) => {
      if (win.isMinimized) return;
      const winRect = win.element.getBoundingClientRect();
      const dist = Math.hypot(clippyCenterX - (winRect.right - 40), clippyCenterY - winRect.top);
      if (dist < minDistance) {
        minDistance = dist;
        nearestWin = { win, winRect };
      }
    });

    if (nearestWin) {
      const snapX = Math.max(10, nearestWin.winRect.right - this.charEl.offsetWidth - 20);
      const snapY = Math.max(10, nearestWin.winRect.top - this.charEl.offsetHeight + 10);
      this.container.style.left = `${snapX}px`;
      this.container.style.top = `${snapY}px`;
      this.posX = snapX;
      this.posY = snapY;
      this.sound('playClippyWhistle');
    }
  }

  initEyeTracking() {
    window.addEventListener('mousemove', (e) => {
      this.resetIdleTimer();

      if (this.state === 'sleeping' || this.isDragging) return;

      const rect = this.charEl.getBoundingClientRect();
      const eyesX = rect.left + 36;
      const eyesY = rect.top + 26;

      const dx = e.clientX - eyesX;
      const dy = e.clientY - eyesY;
      const dist = Math.hypot(dx, dy);

      if (dist < 48) {
        this.pupilL.setAttribute('transform', 'translate(1.8, 0.4)');
        this.pupilR.setAttribute('transform', 'translate(-1.8, 0.4)');
        this.browL.setAttribute('transform', 'translate(0, -3)');
        this.browR.setAttribute('transform', 'translate(0, -3)');
        return;
      }

      const maxOffset = 2.6;
      const angle = Math.atan2(dy, dx);
      const offsetX = Math.cos(angle) * maxOffset;
      const offsetY = Math.sin(angle) * maxOffset;

      this.pupilL.setAttribute('transform', `translate(${offsetX.toFixed(2)}, ${offsetY.toFixed(2)})`);
      this.pupilR.setAttribute('transform', `translate(${offsetX.toFixed(2)}, ${offsetY.toFixed(2)})`);

      const browTilt = Math.max(-2, Math.min(2, -dy / 100));
      this.browL.setAttribute('transform', `translate(0, ${browTilt.toFixed(1)})`);
      this.browR.setAttribute('transform', `translate(0, ${browTilt.toFixed(1)})`);
    });

    const scheduleBlink = () => {
      const nextBlinkMs = 4000 + Math.random() * 4000;
      setTimeout(() => {
        if (this.state !== 'sleeping') {
          this.charEl.classList.add('blinking');
          setTimeout(() => {
            this.charEl.classList.remove('blinking');
          }, 180);
        }
        scheduleBlink();
      }, nextBlinkMs);
    };
    scheduleBlink();
  }

  initIdleSystem() {
    window.addEventListener('keydown', () => this.resetIdleTimer());
    window.addEventListener('click', () => this.resetIdleTimer());

    this.uptime = 0;
    this.nextIdleAnimAt = 12 + Math.floor(Math.random() * 10);
    this.idleTimer = setInterval(() => {
      this.idleSeconds++;
      this.uptime++;

      const boredThreshold = this.annoyance === 'chaos' ? 15 : 30;
      const sleepThreshold = this.annoyance === 'chaos' ? 35 : (this.annoyance === 'quiet' ? 90 : 60);

      if (this.idleSeconds === boredThreshold && this.state === 'idle') {
        this.performBoredomAction();
      } else if (this.idleSeconds >= sleepThreshold && this.state !== 'sleeping') {
        this.goToSleep();
      } else if (this.idleSeconds >= this.nextIdleAnimAt && this.idleSeconds < sleepThreshold) {
        this.idleFidget();
      }
      if (this.uptime % 60 === 0) {
        if (window.clippyTips) window.clippyTips.tick(this.uptime);
        if (window.clippySystem) window.clippySystem.tick(this.uptime);
      }
    }, 1000);
  }

  idleFidget() {
    this.nextIdleAnimAt = this.idleSeconds + 14 + Math.floor(Math.random() * 12);
    if (!this.visible || this.state !== 'idle' || this.isDragging || this.currentAnim || this.balloonOpen()) return;
    const pool = ['lookAround', 'lookAround', 'stretch', 'think', 'spin'];
    this.animate(pool[Math.floor(Math.random() * pool.length)]);
  }

  balloonOpen() {
    return Boolean(this.balloon && this.balloon.style && this.balloon.style.display === 'block');
  }

  resetIdleTimer() {
    if (this.state === 'sleeping') {
      this.wakeUp(true);
    }
    this.idleSeconds = 0;
    this.nextIdleAnimAt = 12 + Math.floor(Math.random() * 10);
  }

  performBoredomAction() {
    if (this.annoyance === 'quiet' || !this.visible) return;

    const roll = Math.random();
    if (roll < 0.3 && window.clippyTalk) {
      window.clippyTalk.idleChat();
    } else if (roll < 0.55) {
      this.tapScreen();
      this.speak('Эй, вы там не уснули? Я всё вижу через стекло монитора!', [
        { text: '• Я тут, работаю!', action: () => this.speak('Отлично! Не забудьте делать перерывы для глаз.') },
        { text: '• Не мешай мне', action: () => {
          if (window.clippyTalk) window.clippyTalk.adjustAffinity(-1);
          this.hideBalloon();
        }}
      ]);
    } else if (roll < 0.8) {
      this.setAccessory('coffee', true);
      this.speak('Пока вы отошли, я заварил себе виртуальный кофе ☕.');
      setTimeout(() => this.setAccessory('coffee', false), 8000);
    } else {
      this.speak('Скучно... Может, пока разложим «Косынку» или запустим Сапёра?', [
        { text: '• Запустить Косынку', action: () => window.appSolitaire && window.appSolitaire.open() },
        { text: '• Запустить Сапёра', action: () => window.appMinesweeper && window.appMinesweeper.open() }
      ]);
    }
  }

  goToSleep() {
    this.state = 'sleeping';
    this.charEl.classList.add('sleeping');
    this.hideBalloon();
    if (this.visible) this.sound('playClippySnore');
    this.updateTray();
    if (window.clippySystem) window.clippySystem.syncIcq();
  }

  wakeUp(notify = true) {
    if (this.state !== 'sleeping') return;
    this.state = 'idle';
    this.charEl.classList.remove('sleeping');
    this.clearAccessories();
    this.updateTray();
    if (window.clippySystem) window.clippySystem.syncIcq();

    if (!notify || !this.visible) return;
    const now = Date.now();
    const chatty = this.annoyance !== 'quiet' && now - (this.lastWakeLine || 0) > 600000;
    if (!chatty) {
      this.animate('stretch');
      return;
    }
    this.lastWakeLine = now;
    this.sound('playClippyWhistle');
    const lines = [
      'Ой! Я не спал, я просто проверял целостность драйверов с закрытыми глазами!',
      'Я не спал! Я... дефрагментировал мысли. С закрытыми глазами так быстрее.',
      'А? Да! Я здесь. Это был не сон, а режим энергосбережения.'
    ];
    this.speak(lines[Math.floor(Math.random() * lines.length)], [], '😳', 6000);
  }

  poke() {
    this.wakeUp(false);
    this.tapScreen();
    if (window.clippyTalk) window.clippyTalk.onPoke();
    else this.sayRandomTip();
  }

  tapScreen() {
    this.charEl.classList.add('tapping');
    this.sound('playClippyTap');
    setTimeout(() => {
      this.charEl.classList.remove('tapping');
    }, 1100);
  }

  ask(query = '') {
    if (!this.isRunning()) this.launch('ask');
    else this.show();
    if (window.clippyHelp) window.clippyHelp.openAsk(query);
    else this.sayRandomTip();
  }

  speak(text, actions = [], moodIcon = '📎', durationMs = 12000, opts = {}) {
    if (!this.visible) return;

    this._speakCount = (this._speakCount || 0) + 1;
    const currentSpeakId = this._speakCount;

    this.wakeUp(false);
    const txtEl = this.container.querySelector('#clippy-text');
    const actEl = this.container.querySelector('#clippy-actions');
    const moodEl = this.container.querySelector('#clippy-mood');
    const askEl = this.container.querySelector('#clippy-ask');
    const footEl = this.container.querySelector('#clippy-footer');

    txtEl.innerHTML = text;
    moodEl.textContent = moodIcon;
    actEl.innerHTML = '';
    if (askEl) askEl.innerHTML = '';
    if (footEl) footEl.innerHTML = '';

    const press = (a, e) => {
      e.stopPropagation();
      this.sound('playClick');
      if (a.action) a.action();
      if (!a.keepOpen && this._speakCount === currentSpeakId) this.hideBalloon();
    };

    actions.forEach(a => {
      const btn = document.createElement('button');
      btn.className = 'clippy-action-btn' + (a.danger ? ' clippy-btn-danger' : '');
      btn.innerHTML = a.text;
      btn.addEventListener('click', (e) => press(a, e));
      actEl.appendChild(btn);
    });

    if (opts.input && askEl) this.renderAskRow(askEl, opts.input);

    if (opts.footer && footEl) {
      opts.footer.forEach(a => {
        const btn = document.createElement('button');
        btn.className = 'clippy-footer-btn';
        btn.innerHTML = a.text;
        btn.addEventListener('click', (e) => press(a, e));
        footEl.appendChild(btn);
      });
    }

    this.updateBalloonPlacement();
    this.balloon.style.display = 'block';
    if (opts.anim) this.animate(opts.anim);

    clearTimeout(this.balloonTimeout);
    if (durationMs > 0) {
      this.balloonTimeout = setTimeout(() => {
        this.hideBalloon();
      }, durationMs);
    }
    if (opts.input && askEl) {
      const field = askEl.querySelector('input');
      if (field) setTimeout(() => field.focus(), 30);
    }
  }

  renderAskRow(askEl, input) {
    const row = document.createElement('div');
    row.className = 'clippy-ask-row';
    const field = document.createElement('input');
    field.type = 'text';
    field.className = 'clippy-ask-input';
    field.placeholder = input.placeholder || '';
    field.value = input.value || '';
    field.spellcheck = false;
    const go = document.createElement('button');
    go.className = 'clippy-action-btn clippy-ask-go';
    go.textContent = input.button || 'Найти';
    const submit = () => {
      const value = field.value.trim();
      if (!value) {
        field.focus();
        return;
      }
      this.sound('playClick');
      input.onSubmit(value);
    };
    go.addEventListener('click', (e) => {
      e.stopPropagation();
      submit();
    });
    field.addEventListener('keydown', (e) => {
      e.stopPropagation();
      this.resetIdleTimer();
      if (e.key === 'Enter') submit();
      if (e.key === 'Escape') this.hideBalloon();
    });
    field.addEventListener('mousedown', (e) => e.stopPropagation());
    row.appendChild(field);
    row.appendChild(go);
    askEl.appendChild(row);
  }

  updateBalloonPlacement() {
    if (!this.balloon) return;
    const rect = this.charEl.getBoundingClientRect();
    const isNearTop = rect.top < 220;
    const isNearLeft = rect.left < 260;

    this.balloon.classList.remove('balloon-above', 'balloon-below', 'balloon-left', 'balloon-right');

    if (isNearTop) {
      this.balloon.classList.add('balloon-below');
    } else {
      this.balloon.classList.add('balloon-above');
    }

    if (isNearLeft) {
      this.balloon.classList.add('balloon-left');
    } else {
      this.balloon.classList.add('balloon-right');
    }
  }

  hideBalloon() {
    if (this.balloon) this.balloon.style.display = 'none';
  }

  sayRandomTip() {
    const tip = this.tips[Math.floor(Math.random() * this.tips.length)];
    this.speak(tip, [
      { text: '• Спасибо, Скрепыш!', action: () => {
        if (window.clippyTalk) window.clippyTalk.adjustAffinity(1);
      }},
      { text: '• Еще один совет', action: () => this.sayRandomTip() },
      { text: '• Ретро-Викторина 1998', action: () => this.startQuiz() }
    ]);
  }

  showRandomTrick() {
    const tricks = [
      () => {
        this.setGlasses(true);
        this.speak('Смотрите, какие у меня крутые 8-битные очки! Стиль 1998 года.', [
          { text: '• Круто, оставь навсегда!', action: () => { this.setGlasses(true); } },
          { text: '• Сними очки', action: () => { this.setGlasses(false); } }
        ], '🕶️');
      },
      () => {
        this.tapScreen();
        this.speak('Тук-тук! Проверка герметичности кинескопа монитора завершена успешно!', [], '🔨');
      },
      () => {
        this.setAccessory('coffee', true);
        this.speak('Минутка релаксации: чашка свежесваренного байтового кофе.', [], '☕');
        setTimeout(() => this.setAccessory('coffee', false), 7000);
      }
    ];
    const trick = tricks[Math.floor(Math.random() * tricks.length)];
    trick();
  }

  shuffled(list) {
    const out = list.slice();
    for (let i = out.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [out[i], out[j]] = [out[j], out[i]];
    }
    return out;
  }

  quizTotal() {
    return this.quizRound && this.quizRound.length ? this.quizRound.length : this.quizQuestions.length;
  }

  startQuiz() {
    this.quizRound = this.shuffled(this.quizQuestions).slice(0, Math.min(this.quizRoundSize || 5, this.quizQuestions.length));
    this.currentQuizIndex = 0;
    this.quizScore = 0;
    this.renderQuizQuestion();
  }

  renderQuizQuestion() {
    const round = this.quizRound && this.quizRound.length ? this.quizRound : this.quizQuestions;
    if (this.currentQuizIndex >= round.length) {
      this.finishQuiz();
      return;
    }

    const qData = round[this.currentQuizIndex];
    const letters = ['A', 'B', 'C', 'D'];
    const actions = this.shuffled(qData.options).map((opt, i) => ({
      text: `<span class="clippy-quiz-badge">[${letters[i]}]</span> ${opt.text}`,
      action: () => this.handleQuizAnswer(opt.correct, qData)
    }));

    this.speak(`<strong>Ретро-Викторина 1998</strong> · вопрос ${this.currentQuizIndex + 1} из ${round.length}<br>${qData.q}`, actions, '❓', 0, { anim: 'think' });
  }

  handleQuizAnswer(isCorrect, qData) {
    if (isCorrect) {
      this.quizScore++;
      this.sound('playDing');
      this.speak(`🎉 <strong>Правильно!</strong><br>${qData.winText}`, [
        { text: '• Следующий вопрос ▶', action: () => {
          this.currentQuizIndex++;
          this.renderQuizQuestion();
        }}
      ], '✨', 0);
    } else {
      this.sound('playError');
      this.speak(`❌ <strong>Ошибочка!</strong><br>${qData.failText}`, [
        { text: '• Продолжить дальше ▶', action: () => {
          this.currentQuizIndex++;
          this.renderQuizQuestion();
        }}
      ], '💡', 0);
    }
  }

  finishQuiz() {
    const total = this.quizTotal();
    const isMaster = this.quizScore === total;
    if (this.quizScore > this.quizHighScore) {
      this.quizHighScore = this.quizScore;
      try {
        localStorage.setItem('win98_clippy_quiz_best', String(this.quizHighScore));
      } catch (e) {}
    }
    if (isMaster) {
      const first = !this.quizAced;
      this.quizAced = true;
      try { localStorage.setItem('win98_clippy_quiz_aced', 'true'); } catch (e) {}
      if (window.clippyTalk) window.clippyTalk.adjustAffinity(2);
      if (first && window.clippyLetters) window.clippyLetters.diary('quizMaster');
      this.setGlasses(true);
      this.sound('playClippyVictory');
      this.animate('congratulate');
      this.speak(`🏆 <strong>ПОТРЯСАЮЩЕ! ${this.quizScore} из ${total}!</strong><br>Вы — настоящий олдфаг и эксперт эпохи Win 98! Очки победителя остаются на мне навсегда.${first ? ' А в гардеробе на www.clippy98.com для вас открыта Золотая корона.' : ''}`, [
        { text: '• Горжусь собой!', action: () => {} },
        { text: '• Сыграть ещё раз', action: () => this.startQuiz() }
      ], '🕶️', 0);
    } else {
      this.speak(`Викторина окончена! Ваш результат: <strong>${this.quizScore} из ${total}</strong> (рекорд: ${this.quizHighScore}).<br>В 90-х годах было непросто, но вы держались молодцом!`, [
        { text: '• Попробовать снова', action: () => this.startQuiz() },
        { text: '• Закрыть', action: () => this.hideBalloon() }
      ], '📜', 0);
    }
  }

  isGameWindow(id) {
    const fixed = ['app_wolf3d', 'app_stalker', 'app_half_life', 'app_fallout2', 'app_burnout', 'app_neon_racer', 'app_hockey',
      'app_minesweeper', 'app_solitaire', 'app_pinball', 'app_freecell', 'app_scumm_quest'];
    if (fixed.some(gid => id === gid || id.startsWith(`${gid}_`))) return true;
    const gm = window.gameManager;
    if (!gm || !gm.catalog) return false;
    return Object.keys(gm.catalog).some(gid => !gm.catalog[gid].isApp && (id === `app_${gid}` || id.startsWith(`app_${gid}_`)));
  }

  triggerBossKey() {
    let minimizedCount = 0;
    if (window.winManager) {
      window.winManager.windows.forEach((win, id) => {
        if (this.isGameWindow(id) && !win.isMinimized) {
          window.winManager.minimizeWindow(id);
          minimizedCount++;
        }
      });
    }

    if (window.appExcel) {
      window.appExcel.open();
    }

    this.setAccessory('boss-sign', false);
    this.speak(`🤫 <strong>Шеф идет!</strong><br>Я свернул ${minimizedCount} игровых окон и открыл отчет в Excel. Вы выглядите как самый усердный работник года!`, [
      { text: '• Спас мою карьеру!', action: () => {} }
    ], '💼', 8000);
  }

  setAccessory(name, enable) {
    const className = `has-${name}`;
    if (enable) {
      this.container.classList.add(className);
      this.activeAccessories.add(name);
    } else {
      this.container.classList.remove(className);
      this.activeAccessories.delete(name);
    }
  }

  setGlasses(enable) {
    this.persistentGlasses = Boolean(enable);
    try {
      localStorage.setItem('win98_clippy_glasses', this.persistentGlasses ? 'true' : 'false');
    } catch (e) {}
    if (this.persistentGlasses && window.clippyWardrobe) {
      window.clippyWardrobe.clearEyesForGlasses();
    }
    this.setAccessory('glasses', this.persistentGlasses);
    this.applyWardrobe();
  }

  applyWardrobe() {
    const wardrobe = window.clippyWardrobe;
    if (!wardrobe || !this.container) return;
    wardrobe.slots.forEach(slot => {
      const layer = this.container.querySelector(`#clippy-slot-${slot.id}`);
      if (!layer) return;
      const id = wardrobe.getEquippedId(slot.id);
      layer.innerHTML = id && id !== 'sunglasses' ? wardrobe.itemSvg(id) : '';
    });
    this.container.classList.toggle('has-hat', Boolean(wardrobe.getEquippedId('head')));
  }

  openWardrobeSite() {
    if (window.appIE) window.appIE.open('http://www.clippy98.com/wardrobe');
    if (window.appIE && window.winManager && window.winManager.windows.has('app_ie')) {
      window.appIE.navigate(window.winManager.windows.get('app_ie'), 'http://www.clippy98.com/wardrobe');
    }
  }

  wearRandomOutfit() {
    const wardrobe = window.clippyWardrobe;
    if (!wardrobe) return;
    const owned = wardrobe.items.filter(i => wardrobe.isOwned(i.id));
    if (!owned.length) {
      this.speak('В моём шкафу пока пусто! Загляните на <strong>www.clippy98.com</strong> — там можно бесплатно скачать шляпы, галстуки и очки.', [
        { text: '• Открыть гардероб', action: () => this.openWardrobeSite() }
      ], '👔');
      return;
    }
    const item = owned[Math.floor(Math.random() * owned.length)];
    wardrobe.equip(item.id);
    this.speak(`Надел: <strong>${item.name}</strong>! ${item.quip}`, [], '✨');
  }

  toggleGlasses() {
    this.setGlasses(!this.persistentGlasses);
    if (this.persistentGlasses) {
      this.speak('Солнцезащитные очки надеты! Стиль 1998 года сохранен навсегда.', [], '🕶️');
    } else {
      this.speak('Очки сняты.', [], '📎');
    }
  }

  clearAccessories() {
    ['headphones', 'halo', 'coffee', 'boss-sign'].forEach(name => {
      this.container.classList.remove(`has-${name}`);
      this.activeAccessories.delete(name);
    });
    if (!this.persistentGlasses) {
      this.container.classList.remove('has-glasses');
      this.activeAccessories.delete('glasses');
    }
  }

  openContextMenu(x, y) {
    if (!window.contextMenu) return;

    const isRu = !window.i18n || window.i18n.getLanguage() === 'ru';
    const tips = window.clippyTips;
    const tipPending = Boolean(tips && tips.pending && tips.pending.length);

    if (!this.isRunning()) {
      window.contextMenu.show(x, y, [
        { label: this.t('clippy.launch'), bold: true, action: () => this.launch('tray') },
        { label: this.t('clippy.ask'), action: () => this.ask() },
        { separator: true },
        { label: this.t('clippy.options'), action: () => window.clippyOptions && window.clippyOptions.openDialog('options') }
      ]);
      return;
    }

    window.contextMenu.show(x, y, [
      {
        label: this.t('clippy.talk'),
        bold: true,
        action: () => window.clippyTalk ? window.clippyTalk.openHub() : this.sayRandomTip()
      },
      {
        label: this.t('clippy.ask'),
        action: () => this.ask()
      },
      {
        label: this.t(tipPending ? 'clippy.showTip' : 'clippy.askTip'),
        action: () => (tipPending ? tips.showNext() : this.sayRandomTip())
      },
      {
        label: this.t('clippy.letterWizard'),
        action: () => window.clippyLetters ? window.clippyLetters.startWizard() : this.sayRandomTip()
      },
      {
        label: this.t('clippy.quiz'),
        action: () => this.startQuiz()
      },
      { separator: true },
      {
        label: this.t('clippy.animate'),
        action: () => this.playRandomAnimation()
      },
      {
        label: this.t('clippy.knock'),
        action: () => this.tapScreen()
      },
      {
        label: this.t('clippy.coffee'),
        action: () => {
          this.setAccessory('coffee', true);
          setTimeout(() => this.setAccessory('coffee', false), 8000);
        }
      },
      {
        label: this.t('clippy.sleep'),
        action: () => this.goToSleep()
      },
      {
        label: this.t('clippy.glasses'),
        checked: this.persistentGlasses,
        action: () => this.toggleGlasses()
      },
      { separator: true },
      {
        label: this.t('clippy.wardrobe'),
        action: () => this.openWardrobeSite()
      },
      {
        label: this.t('clippy.wardrobeRandom'),
        action: () => this.wearRandomOutfit()
      },
      {
        label: this.t('clippy.wardrobeUndress'),
        action: () => {
          if (window.clippyWardrobe) window.clippyWardrobe.unequipAll();
          this.speak(isRu ? 'Все образы сняты. Я снова обычная скрепка!' : 'All outfits removed. Just a plain paperclip again!', [], '📎');
        }
      },
      { separator: true },
      {
        label: this.t('clippy.bossKey'),
        action: () => this.triggerBossKey()
      },
      { separator: true },
      {
        label: this.t('clippy.options'),
        action: () => window.clippyOptions && window.clippyOptions.openDialog('options')
      },
      {
        label: this.t('clippy.hide'),
        action: () => window.clippyTalk ? window.clippyTalk.requestHide() : this.hide()
      }
    ]);
  }

  trayDelta() {
    const tray = window.taskbar && window.taskbar.clippyTrayEl;
    if (!tray || !tray.getBoundingClientRect || !this.charEl || !this.charEl.getBoundingClientRect) return null;
    const a = this.charEl.getBoundingClientRect();
    const b = tray.getBoundingClientRect();
    if (!a.width || !b.width) return null;
    return { x: b.left + b.width / 2 - (a.left + a.width / 2), y: b.top + b.height / 2 - (a.top + a.height / 2) };
  }

  flyOut() {
    const d = this.trayDelta();
    if (!d) return false;
    this.container.classList.add('is-flying');
    this.container.style.transform = `translate(${Math.round(d.x)}px, ${Math.round(d.y)}px) scale(0.2)`;
    this.container.style.opacity = '0';
    return true;
  }

  flyIn() {
    this.container.style.display = 'flex';
    const d = this.trayDelta();
    if (!d) return false;
    this.container.classList.remove('is-flying');
    this.container.style.transform = `translate(${Math.round(d.x)}px, ${Math.round(d.y)}px) scale(0.2)`;
    this.container.style.opacity = '0';
    this.container.getBoundingClientRect();
    this.container.classList.add('is-flying');
    this.container.style.transform = '';
    this.container.style.opacity = '';
    clearTimeout(this.flyTimer);
    this.flyTimer = setTimeout(() => this.container.classList.remove('is-flying'), 480);
    return true;
  }

  hide(opts = {}) {
    if (!this.container) return;
    if (this.visible && window.clippyTalk) window.clippyTalk.onHidden();
    this.visible = false;
    this.hideBalloon();
    if (window.clippyActors && window.clippyActors.rockyHere()) window.clippyActors.rockyLeave();
    const done = () => {
      this.container.classList.remove('is-flying');
      this.container.style.transform = '';
      this.container.style.opacity = '';
      if (!this.visible) this.container.style.display = 'none';
      this.updateTray();
      if (window.clippySystem) window.clippySystem.syncIcq();
    };
    if (opts.instant || !this.flyOut()) {
      done();
      return;
    }
    this.sound('playClippyWoosh');
    clearTimeout(this.flyTimer);
    this.flyTimer = setTimeout(done, 480);
  }

  show(opts = {}) {
    if (!this.container) return;
    const wasVisible = this.visible;
    this.running = true;
    this.visible = true;
    if (!wasVisible && !opts.instant && this.flyIn()) this.sound('playClippyWoosh');
    else this.container.style.display = 'flex';
    this.wakeUp(false);
    this.updateTray();
    if (window.clippySystem) window.clippySystem.syncIcq();
  }

  toggleVisible() {
    if (!this.isRunning()) {
      this.launch('tray');
      return;
    }
    const talk = window.clippyTalk;
    if (this.visible) {
      if (talk && talk.arcReady && talk.arcReady() && !this.balloonOpen()) {
        talk.play('greetArc');
        return;
      }
      this.hide();
      return;
    }
    this.show();
    if (talk) talk.onShown();
    else this.speak('Я снова с вами! Готов помогать в любое время.');
  }

  launch(reason = 'run') {
    const wasRunning = this.isRunning();
    this.state = 'idle';
    this.show();
    if (wasRunning) {
      if (reason !== 'ask' && window.clippyTalk) window.clippyTalk.onShown();
      return;
    }
    if (window.clippySystem) window.clippySystem.onLaunched(reason);
    this.updateTray();
  }

  kill() {
    this.running = false;
    this.visible = false;
    this.hideBalloon();
    if (this.container) {
      this.container.classList.remove('is-flying');
      this.container.style.transform = '';
      this.container.style.opacity = '';
      this.container.style.display = 'none';
    }
    if (window.clippyActors) window.clippyActors.removeRocky();
    this.updateTray();
    if (window.clippySystem) window.clippySystem.syncIcq();
  }

  retire() {
    this.animate('wave');
    setTimeout(() => {
      this.hide();
      this.running = false;
      this.updateTray();
    }, 1500);
  }

  setEnabled(value, source = 'options') {
    const enabled = Boolean(value);
    if (window.clippyOptions) window.clippyOptions.set('enabled', enabled);
    if (window.clippySystem) window.clippySystem.onEnabledChanged(enabled, source);
    this.updateTray();
  }

  setAnnoyance(level) {
    if (!['quiet', 'normal', 'chaos'].includes(level)) return;
    this.annoyance = level;
    if (window.clippyOptions) window.clippyOptions.set('annoyance', level);
    const lines = {
      normal: 'Установлен классический уровень подсказок Office 97.',
      quiet: 'Буду говорить, только когда вы сами меня позовёте. Советы оставлю под лампочкой.',
      chaos: 'Хаос активирован! Теперь я комментирую буквально каждый ваш шаг!'
    };
    this.speak(lines[level], [], level === 'chaos' ? '🤪' : '📎', 7000);
  }

  reactToSwitch(actorId) {
    if (!this.visible) return;
    const actors = window.clippyActors;
    const actor = actors && actors.get(actorId);
    if (actorId === 'rocky') {
      if (actors && actors.rockyKnown()) {
        this.speak('Rocky живёт в Office 2000, но в гости заходит с удовольствием. Кнопка «Позвать в гости» в «Коллекции».', [], '🐕');
        return;
      }
      this.flash('panic-shake', 1200);
      this.speak('Вы хотели выбрать Rocky? ...Понимаю. Он милый. Но Office 2000 ещё не вышел, так что пока я. Ура. То есть — сожалею.', [], '😬');
      return;
    }
    const name = actor && actors ? actors.pick(actor.name) : 'другого помощника';
    this.speak(`Вы хотели выбрать «${name}»? Без компакт-диска Office 97 не получится. Значит, пока я. Ура... То есть — сожалею. Очень.`, [], '😅');
  }

  initSystemListeners() {
    const wm = window.winManager;
    if (!wm) return;
    const origCreate = wm.createWindow.bind(wm);
    wm.createWindow = (cfg) => {
      const win = origCreate(cfg);
      this.onWindowOpened(cfg.id, cfg.title, win);
      return win;
    };
    if (typeof wm.minimizeWindow === 'function') {
      const origMinimize = wm.minimizeWindow.bind(wm);
      wm.minimizeWindow = (id) => {
        const result = origMinimize(id);
        if (!this.minimizingAll && window.clippyTips) window.clippyTips.onMinimize(id);
        return result;
      };
    }
    if (typeof wm.minimizeAll === 'function') {
      const origMinimizeAll = wm.minimizeAll.bind(wm);
      wm.minimizeAll = (...args) => {
        this.minimizingAll = true;
        try {
          return origMinimizeAll(...args);
        } finally {
          this.minimizingAll = false;
        }
      };
    }
  }

  initMoveAway() {
    window.addEventListener('focusin', (e) => this.maybeMoveAway(e.target));
  }

  maybeMoveAway(target) {
    if (!target || !this.visible || this.isDragging || this.opt('moveAway') === false || !this.charEl.getBoundingClientRect) return false;
    if (!target.matches || !target.matches('input[type="text"], input:not([type]), textarea, [contenteditable="true"]')) return false;
    if (this.container.contains(target) || !target.getBoundingClientRect) return false;
    const r = target.getBoundingClientRect();
    const me = this.charEl.getBoundingClientRect();
    const vw = window.innerWidth || 800;
    const vh = window.innerHeight || 600;
    if (!r.width || !me.width || r.width * r.height > vw * vh * 0.35) return false;
    const pad = 8;
    const hits = (x, y) => !(x + me.width + pad < r.left || x - pad > r.right || y + me.height + pad < r.top || y - pad > r.bottom);
    if (!hits(me.left, me.top)) return false;
    const spots = [
      [vw - me.width - 20, vh - me.height - 38],
      [20, vh - me.height - 38],
      [vw - me.width - 20, 20],
      [20, 20],
      [Math.round(vw / 2 - me.width / 2), vh - me.height - 38]
    ];
    const spot = spots.find(([x, y]) => !hits(x, y));
    if (!spot) return false;
    this.moveTo(spot[0], spot[1]);
    return true;
  }

  moveTo(x, y) {
    this.container.classList.add('is-custom-pos', 'is-moving');
    this.container.style.left = `${Math.round(x)}px`;
    this.container.style.top = `${Math.round(y)}px`;
    this.posX = x;
    this.posY = y;
    this.animate('greet');
    clearTimeout(this.moveTimer);
    this.moveTimer = setTimeout(() => {
      this.container.classList.remove('is-moving');
      this.updateBalloonPlacement();
    }, 520);
  }

  launchProgram(catalogId, appName) {
    if (window.advancedSite && window.advancedSite.launch(catalogId)) return;
    const app = window[appName];
    if (app && typeof app.open === 'function') app.open();
  }

  openInIE(url) {
    if (!window.appIE) return;
    const ieWin = window.winManager && window.winManager.windows.get('app_ie');
    if (ieWin) window.appIE.navigate(ieWin, url);
    else window.appIE.open(url);
  }

  getAppReactions() {
    const bossKeyActions = (busyText) => [
      { text: '🚨 Шеф идет! (Прикрыть Excel)', action: () => this.triggerBossKey() },
      { text: busyText, action: () => this.setAccessory('boss-sign', false) }
    ];
    return [
      {
        match: (id) => id.startsWith('app_doom'),
        mood: '👹', delay: 1500, bossSign: true,
        text: '<strong>DOOM 98</strong>! Марсианская база UAC кишит демонами. Совет от профессионала: наберите <strong>IDDQD</strong> во время игры, и вы бессмертны!',
        actions: [
          ...bossKeyActions('• Rip and tear!'),
          { text: '• Ещё читы?', action: () => this.speak('<strong>IDKFA</strong> — всё оружие и ключи, <strong>IDCLIP</strong> — проход сквозь стены, <strong>IDDT</strong> — полная карта уровня. Только тссс!', [], '🤫') }
        ]
      },
      {
        match: (id) => id.startsWith('app_serioussam'),
        mood: '💣', delay: 1500, bossSign: true,
        text: '<strong>Serious Sam 98</strong>! Слышите этот крик «А-а-а-а-а!»? Это безголовый камикадзе бежит к вам через пустыню Египта. Стреляйте первым!',
        actions: [
          ...bossKeyActions('• Серьёзно, не мешай!'),
          { text: '• Где секреты?', action: () => this.speak('Ищите за колоннами и в тёмных углах арен. Сэм любит, когда игроки шарят по стенам!', [], '🔎') }
        ]
      },
      {
        match: (id) => id.startsWith('app_moh98'),
        mood: '🎖️', delay: 1500, bossSign: true,
        text: '<strong>Medal of Honor 98</strong>! Лейтенант Паттерсон, УСС на связи. Шесть операций в тылу врага — и ни одна газета о них не напишет.',
        actions: [
          ...bossKeyActions('• Не мешай, я на задании!'),
          { text: '• Совет новобранцу', action: () => this.speak('Стреляйте в голову — каска слетает с первого попадания. А если немец бросил гранату обратно, не стойте на месте!', [], '🪖') },
          { text: '• Как пройти проверку документов?', action: () => this.speak('Уберите оружие: нажмите 7, чтобы достать документы, подойдите к офицеру и нажмите F. «Danke. Weitermachen.»', [], '📄') }
        ]
      },
      {
        match: (id) => id.startsWith('app_dao98'),
        mood: '🐉', delay: 1500, bossSign: true,
        text: '<strong>Dragon Age: Origins 98</strong>! Мор вернулся, а Серых Стражей в Ферелдене раз-два и обчёлся. Пробел ставит бой на паузу, пользуйтесь!',
        actions: [
          ...bossKeyActions('• Не мешай, я прохожу Посвящение!'),
          { text: '• Как победить огра на башне?', action: () => this.speak('Держите Алистера со щитом перед огром, а мага и лучника подальше. Когда огр хватает кого-то, бейте его всем отрядом. И не забывайте про припарки!', [], '🏰') },
          { text: '• Какую предысторию выбрать?', action: () => this.speak('Для первого раза подойдёт человек-дворянин: там есть мабари с первых минут. Магам понравится Истязание, а гномы попадут на арену Испытания.', [], '📜') }
        ]
      },
      {
        match: (id) => id.startsWith('app_quake3'),
        mood: '🔥', delay: 1500, bossSign: true,
        text: '<strong>Quake III Arena</strong>! Добро пожаловать на Арену Вечности. Не стойте на месте: здесь выживают только те, кто прыгает и стрейфится.',
        actions: [
          ...bossKeyActions('• Не мешай, у меня дуэль с Сарджем!'),
          { text: '• Как попасть к ракетнице на мосту?', action: () => this.speak('В Camping Grounds встаньте на длинную прыжковую площадку в атриуме — она забросит вас прямо на мост к ракетнице. А опытные бойцы просто делают рокет-джамп.', [], '🚀') },
          { text: '• Что такое распрыжка?', action: () => this.speak('Прыгайте без остановки, держите W и стрейф в сторону поворота и плавно ведите мышью. С каждым прыжком скорость растёт. Выглядит как колдовство, работает как физика.', [], '🐇') }
        ]
      },
      {
        match: (id) => id.startsWith('app_hl2'),
        mood: 'λ', delay: 1500, bossSign: true,
        text: '<strong>Half-Life 2</strong>! Похоже, вы собираетесь спасать человечество. Гравипушкой можно швырять почти всё, что не прибито к полу.',
        actions: [
          ...bossKeyActions('• Не мешай, я в Рейвенхолме!'),
          { text: '• Как убить страйдера?', action: () => this.speak('Только ракетами. Держите лазерную точку на цели, пока ракета не долетит. Семь попаданий, и он рухнет.', [], '🚀') },
          { text: '• Где взять ракеты?', action: () => this.speak('Ищите зелёные ящики с жёлтой полосой. Удерживайте E рядом с ними, и они выдадут ракету за ракетой.', [], '📦') }
        ]
      },
      {
        match: (id) => id.startsWith('app_ow98'),
        mood: '🎯', delay: 1500, bossSign: true,
        text: '<strong>Overwatch 98</strong>! Двенадцать героев, и у каждого своя работа. Если команда проигрывает бой за боем, смените героя клавишей H прямо на базе.',
        actions: [
          ...bossKeyActions('• Не мешай, мы толкаем груз!'),
          { text: '• Кого взять новичку?', action: () => this.speak('Солдат-76: простая винтовка, спринт и лечащее поле. Пройдите обучение в меню «Тренировка» — это пять минут.', [], '🔫') },
          { text: '• Почему груз стоит?', action: () => this.speak('Груз едет, только когда рядом атакующие, а защитников нет. Встаньте вплотную к нему и выбейте врагов с дороги.', [], '🚚') }
        ]
      },
      {
        match: (id) => id.startsWith('app_tekken3'),
        mood: '🥊', delay: 1500, bossSign: true,
        text: '<strong>Tekken 3 98</strong>! Четыре кнопки — две руки и две ноги. Коротко нажмите вверх или вниз, чтобы уйти в сторону от прямого удара.',
        actions: [
          ...bossKeyActions('• Не мешай, у меня финальный раунд!'),
          { text: '• Как вырваться из броска?', action: () => this.speak('Бросок 1+3 разрывается кнопкой 1, бросок 2+4 — кнопкой 2. Нажимайте сразу, как только вас схватили: времени меньше трети секунды.', [], '🤼') },
          { text: '• Как открыть новых бойцов?', action: () => this.speak('Пройдите аркаду любым бойцом. Каждое прохождение открывает нового скрытого бойца, а первое — ещё и штурм «Курогане» и кинозал.', [], '🏆') }
        ]
      },
      {
        match: (id) => id.startsWith('app_bttf'),
        mood: '⚡', delay: 1500, bossSign: true,
        text: '<strong>Back to the Future: The Game</strong>! Док пропал, а ДеЛориан вернулся сам. Где искать Дока, знают только старые газеты Хилл-Вэлли.',
        actions: [
          ...bossKeyActions('• Не мешай, у меня восемьдесят восемь миль в час!'),
          { text: '• Я застрял. Что делать?', action: () => this.speak('Нажмите F1 или кнопку «Думай, Макфлай!» в полосе карманов внизу экрана. У каждой цели до четырёх подсказок, от лёгкого намёка до точного действия.', [], '💡') },
          { text: '• Как набрать дату?', action: () => this.speak('Включите временные контуры тумблером в машине и наберите на пульте месяц, день, год, часы и минуты. Какой день нужен, подскажет газета.', [], '📅') },
          { text: '• Что это за фильмы?', action: () => this.openInIE('http://www.interpedia.org/wiki/bttf') }
        ]
      },
      {
        match: (id) => id.startsWith('app_sammax202'),
        mood: '🗿', delay: 1500, bossSign: true,
        text: '<strong>Sam &amp; Max: Moai Better Blues</strong>! На улице сияет Бермудский портал, соединяющий Бруклин с островом Пасхи. Истуканы на пляже плачут и хохочут, а вулкан Беллависта готовится к извержению.',
        actions: [
          ...bossKeyActions('• Не мешай, я успокаиваю истуканов!'),
          { text: '• Я застрял. Что делать?', action: () => this.speak('Поговорите с Максом: он всегда готов дать ценный совет. Поговорите с тремя истуканами на пляже, организуйте свидание Сибил и Линкольна и найдите ступни Билли в подземелье.', [], '🐰') },
          { text: '• Как усмирить вулкан?', action: () => this.speak('Получите сейсмический инвертор у Боско в обмен на гранитный сэндвич от Вонючки, настройте порталы камертоном Педро и используйте инвертор у алтаря в кратере вулкана.', [], '🌋') }
        ]
      },
      {
        match: (id) => id.startsWith('app_sammax201'),
        mood: '🎅', delay: 1500, bossSign: true,
        text: '<strong>Sam &amp; Max: Ice Station Santa</strong>! До Рождества неделя, а на улице стоит робот, которого прислали из мастерской Санты. Де Сото у подъезда летает на Северный полюс и обратно.',
        actions: [
          ...bossKeyActions('• Не мешай, я пою демону!'),
          { text: '• Я застрял. Что делать?', action: () => this.speak('Поговорите с Максом: он подскажет следующий шаг. Журнал отправок на зелёном компьютере в мастерской скажет, куда разослали всадников, а список желаний подскажет, кому что подарить.', [], '🐰') },
          { text: '• Как выиграть викторину Стинки?', action: () => this.speak('Стинки засчитывает букву, которую никто не назвал. Сибил всегда отвечает правильно, Жучок всегда говорит «Г». Шепните Линкольну оставшуюся букву, а себе возьмите ответ, где Стинки хвастается.', [], '❓') }
        ]
      },
      {
        match: (id) => id.startsWith('app_sammax106'),
        mood: '🌙', delay: 1500, bossSign: true,
        text: '<strong>Sam &amp; Max: Bright Side of the Moon</strong>! Над городом ночная радуга, и идёт она с Луны. Де Сото у подъезда летает туда и обратно: примените машину и выберите, куда лететь.',
        actions: [
          ...bossKeyActions('• Не мешай, я гну ложки!'),
          { text: '• Я застрял. Что делать?', action: () => this.speak('Поговорите с Максом: он подскажет следующий шаг, даже когда его разберут на три цвета. Рог единорога краснеет от тепла, а несокрушимую витрину берёт только жар ракетного двигателя.', [], '🐰') },
          { text: '• Как выиграть в крестики-нолики?', action: () => this.speak('Выигрывать не нужно. Талисман получит тот, кто проиграет машине. Она ставит нолики по порядку и пропускает победную клетку, пока у неё есть выбор. Займите четыре угла.', [], '⭕') }
        ]
      },
      {
        match: (id) => id.startsWith('app_sammax105'),
        mood: '👓', delay: 1500, bossSign: true,
        text: '<strong>Sam &amp; Max: Reality 2.0</strong>! Компьютеры сошли с ума, а соседи не снимают очки. Значок очков в правом нижнем углу переносит Сэма в Реальность 2.0 и обратно, на то же самое место.',
        actions: [
          ...bossKeyActions('• Не мешай, я ломаю гравитацию!'),
          { text: '• Я застрял. Что делать?', action: () => this.speak('Поговорите с Максом: он подскажет следующий шаг. В зале управления плавают четыре программы. Посадите жучка в трубу, и в мире сломается глубина, рост или сила тяжести.', [], '🐰') },
          { text: '• Как проехать файрвол?', action: () => this.speak('Буквы на номере машины значат цвета. Покрасьте нос, середину и хвост Де Сото 2.0 радужным набором в том же порядке, что и буквы на номере.', [], '🚗') }
        ]
      },
      {
        match: (id) => id.startsWith('app_sammax104'),
        mood: '🎩', delay: 1500, bossSign: true,
        text: '<strong>Sam &amp; Max: Abe Lincoln Must Die!</strong>! Президент запретил пудинг, а у двери Белого дома стоит агент Суперболл. Он отвечает на служебный телефон и выполняет всё, что скажут по линии.',
        actions: [
          ...bossKeyActions('• Не мешай, я веду дебаты!'),
          { text: '• Я застрял. Что делать?', action: () => this.speak('Поговорите с Максом: он подскажет следующий шаг. На дебатах Линкольн читает ответ с верхней карточки на стойке. Карточку можно заменить любой табличкой.', [], '🐰') },
          { text: '• Как попасть в Военную комнату?', action: () => this.speak('Нужны два условия. Дверь отпирает война, а агент Суперболл уходит с поста только в свой профессиональный праздник. Календарь стоит рядом с дверью.', [], '📅') }
        ]
      },
      {
        match: (id) => id.startsWith('app_sammax103'),
        mood: '🧸', delay: 1500, bossSign: true,
        text: '<strong>Sam &amp; Max: The Mole, the Mob and the Meatball</strong>! Комиссар потерял своего крота в Игрушечной мафии. Спрашивайте всех: «Ковёр подходит к шторам?» Настоящий крот ответит и даст пощёчину.',
        actions: [
          ...bossKeyActions('• Не мешай, я играю в индейский покер!'),
          { text: '• Я застрял. Что делать?', action: () => this.speak('Поговорите с Максом: он подскажет следующий шаг. А в казино присмотритесь к Леонарду. Перед каждой ставкой он смотрит вам за спину.', [], '🐰') },
          { text: '• Можно ли проиграться?', action: () => this.speak('Жетон проиграть можно, игру нельзя. Лапочка у входа всегда даст новый жетон: грустных гостей в казино не держат.', [], '🎰') }
        ]
      },
      {
        match: (id) => id.startsWith('app_sammax102'),
        mood: '📺', delay: 1500, bossSign: true,
        text: '<strong>Sam &amp; Max: Situation: Comedy</strong>! Майра Стамп пускает на свой диван только звёзд. Звезде нужны роль в сериале, песня и скандал. Всё это можно добыть на телестудии WARP.',
        actions: [
          ...bossKeyActions('• Не мешай, я переодеваю корову!'),
          { text: '• Я застрял. Что делать?', action: () => this.speak('Поговорите с Максом: он подскажет следующий шаг. Если застряли на съёмках ситкома, спросите режиссёршу, как идёт дубль.', [], '🐰') },
          { text: '• Можно ли провалить съёмки?', action: () => this.speak('Провалить можно, застрять нельзя. Режиссёрша крикнет «Стоп!», и вы начнёте новый дубль. Плёнки у неё много.', [], '🎬') }
        ]
      },
      {
        match: (id) => id.startsWith('app_sammax'),
        mood: '🐶', delay: 1500, bossSign: true,
        text: '<strong>Sam &amp; Max</strong>! Правая кнопка мыши меняет курсор: идти, смотреть, взять, говорить. Коробка в углу — это инвентарь Сэма.',
        actions: [
          ...bossKeyActions('• Не мешай, я выманиваю крысу!'),
          { text: '• Я застрял. Что делать?', action: () => this.speak('Поговорите с Максом: наведите курсор «говорить» на кролика. Он всегда знает, что делать дальше. Обычно что-нибудь разрушительное.', [], '🐰') },
          { text: '• Можно ли тут умереть?', action: () => this.speak('Нет! Это квест старой школы: здесь нельзя умереть и нельзя застрять навсегда. Можно только очень долго смотреть в глаза Брэди Калчеру.', [], '👁️') }
        ]
      },
      {
        match: (id) => id.startsWith('app_dmc98'),
        mood: '😈', delay: 1500, bossSign: true,
        text: '<strong>Devil May Cry 4</strong>! Неро, меч и рука дьявола. Не повторяйте один и тот же удар: оценка стиля растёт только от разнообразия.',
        actions: [
          ...bossKeyActions('• Не мешай, я иду на SSS!'),
          { text: '• Как пройти Затерянный лес?', action: () => this.speak('Подсказка выбита на камне у входа: вперёд, направо, налево. Неверный поворот ведёт в засаду, зато там лежит осколок синей сферы.', [], '🌲') },
          { text: '• Что делает рука дьявола?', action: () => this.speak('Клавиша [L]. Вблизи Buster бросает врага, издалека Snatch притягивает его к Неро. К синим точкам над пропастью рука тянет самого Неро.', [], '🤚') }
        ]
      },
      {
        match: (id) => id.startsWith('app_diablo2'),
        mood: '🔥', delay: 1500, bossSign: true,
        text: '<strong>Diablo II</strong>! Оставайтесь ненадолго и послушайте... Левая кнопка — идти и бить, правая — навык. Зелья на поясе пьются клавишами 1–4.',
        actions: [
          ...bossKeyActions('• Не мешай, я бегу за Андариэль!'),
          { text: '• Кем играть впервые?', action: () => this.speak('Паладин с аурой «Мощь» и навыком «Жертва» прост и живуч. Волшебнице с «Огненной стрелой» нужно держать дистанцию, зато она сильна с первых уровней.', [], '🛡️') },
          { text: '• Я умер. Что с вещами?', action: () => this.speak('Снаряжение осталось на теле там, где вы погибли. Вернитесь к нему и щёлкните — вещи вернутся. В режиме «Хардкор» смерть окончательна.', [], '💀') }
        ]
      },
      {
        match: (id) => id.startsWith('app_xiii'),
        mood: '🕵️', delay: 1500, bossSign: true,
        text: '<strong>XIII</strong>! Вы проснулись на пляже без памяти и с татуировкой на ключице. Стреляйте в голову — комикс покажет это крупным планом. А документы, разбросанные по уровням, складываются в досье на Двадцатку.',
        actions: [
          ...bossKeyActions('• Тихо, я прячусь от охраны в вентиляции!'),
          { text: '• Как не поднять тревогу?', action: () => this.speak('Ходите пригнувшись или с [Shift], держитесь в тени и прячьте тела. Если враг заметил вас, но ещё не выстрелил, над головой появится «?». Успейте скрыться. Тревожные кнопки на стенах лучше обходить стороной.', [], '🤫') },
          { text: '• Что за шаги сквозь стену?', action: () => this.speak('Это «шестое чувство». XIII слышит шаги врагов и видит их как ТАП-ТАП за стенами. Новые навыки открываются, когда герой что-то вспоминает.', [], '👣') }
        ]
      },
      {
        match: (id) => id.startsWith('app_maxpayne'),
        mood: '🌨️', delay: 1500, bossSign: true,
        text: '<strong>Max Payne</strong>! На улице метель, а у Макса очень плохая неделя. Правая кнопка мыши замедляет время. В прыжке она делает то же самое, только красивее.',
        actions: [
          ...bossKeyActions('• Тихо, у меня перестрелка в метро!'),
          { text: '• Как не умереть сразу?', action: () => this.speak('Не стойте в дверях. Выманите врагов за угол, включите замедление [Shift] и стреляйте первым. Обезболивающее [H] лечит не сразу, так что пейте его до боя, а не когда уже поздно.', [], '💊') },
          { text: '• Песочные часы пустые!', action: () => this.speak('Шкала замедления наполняется, когда вы кого-нибудь убиваете. Прыжок в сторону [Q] тратит её меньше, чем обычное замедление.', [], '⏳') }
        ]
      },
      {
        match: (id) => id.startsWith('app_legion'),
        mood: '🏛️', delay: 1500, bossSign: true,
        text: '<strong>Legion Arena</strong>! Рим еще маленький, а вы уже командуете. Главное здесь план: строй и приказ задаются до боя, а в бою очков приказов мало.',
        actions: [
          ...bossKeyActions('• Я изучаю историю Древнего Рима!'),
          { text: '• Почему конница проиграла копейщикам?', action: () => this.speak('Не бросайте конницу в лоб на копейщиков и триариев: у них стена копий. Бейте во фланг или по застрельщикам, а после натиска выводите всадников из боя клавишей [X].', [], '🐎') },
          { text: '• Отряд бежит, что делать?', action: () => this.speak('Держите генерала ближе к центру и берегите очки на «Воодушевить» [R]. Бегущий отряд, которого не преследуют, может вернуться в строй.', [], '📯') }
        ]
      },
      {
        match: (id) => id === 'app_fallout',
        mood: '☢️', delay: 1500, bossSign: true,
        text: '<strong>Fallout</strong>! Воды в Убежище 13 осталось на 150 дней, и счетчик уже идет. Перед выходом загляните в инвентарь: у вас есть нож, пистолет и немного патронов.',
        actions: [
          ...bossKeyActions('• Я изучаю систему водоснабжения!'),
          { text: '• Меня загрызли крысы в пещере', action: () => this.speak('Жмите [A], чтобы начать бой на своих условиях. Каждый шаг и выстрел стоит очков действия, а остаток хода можно потратить на укрытие. Раны лечите стимуляторами из инвентаря.', [], '🐀') },
          { text: '• Как сохраниться?', action: () => this.speak('[F4] открывает сохранение, [F5] загрузку. [F6] и [F7] работают с быстрым слотом: в первый раз игра спросит, какой слот взять.', [], '💾') }
        ]
      },
      {
        match: (id) => id.startsWith('app_falloutzp'),
        mood: '☢️', delay: 1500, bossSign: true,
        text: '<strong>Fallout: Запорожье</strong>! Двести лет после войны, а талоны на электричество всё ещё в ходу. Не спешите на мост: сначала поговорите с доктором Ласточкиной и Тимофеем у груши.',
        actions: [
          ...bossKeyActions('• Я изучаю карту Запорожья!'),
          { text: '• Как попасть на Хортицу?', action: () => this.speak('На мосту КПП Комендатуры. Пропуск даёт полковник Савченко, сержант Дуб берёт «благодарность». Можно пройти нижним ярусом под мостом или переплыть Днепр, но вода фонит.', [], '🌉') },
          { text: '• Меня всё время убивают', action: () => this.speak('Жмите [V]: С.Т.Р.Е.Л.А. остановит время, и можно бить в ноги, в фильтр противогаза или в антенну лунохода. У колорадов крепкий панцирь спереди, а у подсолнухов плохое зрение в темноте.', [], '🎯') }
        ]
      },
      {
        match: (id) => id.startsWith('app_anotherwar'),
        mood: '🎖️', delay: 1500, bossSign: true,
        text: '<strong>Another War</strong>! Городок Аннет, оккупированная Франция. Осматривайте все подряд левой кнопкой: почти у каждой мелочи есть свой комментарий, а иногда и что-нибудь полезное.',
        actions: [
          ...bossKeyActions('• Я изучаю историю Франции!'),
          { text: '• Как выбраться из камеры?', action: () => this.speak('У каждого героя свой путь. Силач ломает, Вор возится с замком, Интеллектуал берет хитростью. Осмотрите койку, дверь и все, что лежит на полу.', [], '🔑') },
          { text: '• В лесу меня всё время убивают', action: () => this.speak('Жмите [P]: на паузе можно спокойно выбрать цель. Лечитесь предметами с пояса, клавиши [1-7]. А если все-таки убьют, Иоганн в пабе «вспомнит», как вы выжили.', [], '🍺') }
        ]
      },
      {
        match: (id) => id.startsWith('app_plov'),
        mood: '🍚', delay: 1500, bossSign: true,
        text: '<strong>Хаято, Где плов?</strong> Чайхана открывается! Главное тут казан: пока одни гости едят, заложите новый плов, иначе в обед будет очень неловко.',
        actions: [
          ...bossKeyActions('• Я считаю себестоимость плова!'),
          { text: '• Казан сгорел, что делать?', action: () => this.speak('Когда над казаном красное кольцо, мясо или зирвак вот-вот пригорят. Морковь с луком нарежьте заранее, пока мясо жарится, и держите её в руках. Сгоревший казан щёлкните ещё раз, Хаято его отчистит.', [], '🔥') },
          { text: '• Гости уходят злые', action: () => this.speak('Сажайте гостей сразу, даже если плова пока нет: за столом ждать веселее. Щёлкайте по нескольким местам подряд, Хаято запомнит до пяти дел. А на базаре есть ичиги, в них бегать быстрее.', [], '🥾') }
        ]
      },
      {
        match: (id) => id.startsWith('app_gtann'),
        mood: '😎', delay: 1500, bossSign: true,
        text: '<strong>GTA: Нижний Сити</strong>! Нижний Новгород, лето 2000-го. Жёлтые кружки на радаре с буквами — это люди, которые дадут работу. Розовый квадрат — куда ехать.',
        actions: [
          ...bossKeyActions('• Я не угоняю «Волгу», я её тестирую для ГАЗа!'),
          { text: '• Как оторваться от милиции?', action: () => this.speak('Уйдите из поля зрения постовых — мигалки начнут мигать и погаснут. Быстрее всего перекраситься в автосервисе «Жестянщик» за 500 рублей или подобрать конверт со взяткой.', [], '🚨') },
          { text: '• Где сохраниться?', action: () => this.speak('В гостинице «Заречная» на проспекте Ленина — розовая дверь у входа. Позже можно купить квартиру на Мончегорской.', [], '💾') }
        ]
      },
      {
        match: (id) => id.startsWith('app_sims3'),
        mood: '💎', delay: 1500, bossSign: true,
        text: '<strong>The Sims 3</strong>! Щёлкните по предмету или симу, и появится меню действий. Жёлтые пузыри на панели желаний можно пообещать исполнить, и за каждое сим получит очки счастья.',
        actions: [
          ...bossKeyActions('• Не мешай, у меня сим тонет в бассейне... то есть моет посуду!'),
          { text: '• Как заработать денег?', action: () => this.speak('Найдите работу через газету, компьютер или прямо на здании в режиме карты. Пока ждёте повышения, продавайте урожай, рыбу и картины. Хорошее настроение на работе помогает расти по карьере.', [], '💼') },
          { text: '• Почему сим грустит?', action: () => this.speak('Посмотрите мудлеты справа от шкалы настроения. Отрицательные уходят, если исправить причину: поесть, выспаться, прибраться. Черты характера тоже влияют на то, что радует сима.', [], '🙂') }
        ]
      },
      {
        match: (id) => id.startsWith('app_forza'),
        mood: '🏎️', delay: 1500, bossSign: true,
        text: '<strong>Forza Horizon: Рига</strong>! Фестиваль ждёт в Межапарксе. Синие стрелки на дороге показывают маршрут, а если врезались — нажмите R и перемотайте время назад.',
        actions: [
          ...bossKeyActions('• Не мешай, я обгоняю электричку!'),
          { text: '• Как получить новый браслет?', action: () => this.speak('Побеждайте в событиях фестиваля: первое место даёт 3 очка, второе — 2, третье — 1, а победа в витрине — сразу 5. Набрали очки — открылся следующий браслет и события более быстрого класса.', [], '🏁') },
          { text: '• Где взять машину быстрее «пятёрки»?', action: () => this.speak('Кредиты за гонки и цепочки навыков тратьте в Автосалоне. А ещё по сараям Риги спрятаны редкие машины: слухи о них приходят вместе с новыми браслетами.', [], '🚗') }
        ]
      },
      {
        match: (id) => id.startsWith('app_gta90'),
        mood: '🚕', delay: 1500, bossSign: true,
        text: '<strong>GTA: Екатеринбург \'90</strong>! Свердловск, девяностый год. Слышите — звонит таксофон? Подойдите к нему пешком, и Валера Плотинка даст вам работу.',
        actions: [
          ...bossKeyActions('• Не мешай, я угоняю «Волгу»!'),
          { text: '• Как оторваться от милиции?', action: () => this.speak('Не попадайтесь им на глаза — фуражки в углу погаснут. Быстрее всего — заехать в «Покраску» за тысячу рублей или найти зелёный ящик со взяткой.', [], '🚓') },
          { text: '• Где взять оружие?', action: () => this.speak('Ящики с оружием лежат во дворах и на площадях: ПМ, обрез, АКМ, коктейли Молотова. А в кремле на выставке стоит настоящий Т-34 — и он заводится!', [], '🔫') }
        ]
      },
      {
        match: (id) => id.startsWith('app_kotor98'),
        mood: '⚔️', delay: 1500, bossSign: true,
        text: '<strong>Knights of the Old Republic 98</strong>! Давным-давно в далёкой-далёкой галактике… Тарис в карантине, а Бастила где-то в Нижнем городе. Пробел ставит бой на паузу!',
        actions: [
          ...bossKeyActions('• Не мешай, я спасаю Республику!'),
          { text: '• Как победить ранкора?', action: () => this.speak('Не лезьте к нему в лоб! Найдите в канализации труп вулкара, спрячьте в останках осколочную гранату и оставьте приманку у логова.', [], '💣') },
          { text: '• Где взять кредиты на дроида?', action: () => this.speak('Дуэльный ринг Аджуура в кантине Верхнего города, пазаак с Леной и продажа трофеев. А Т3-М4 можно сторговать через Убеждение.', [], '💰') }
        ]
      },
      {
        match: (id) => id.startsWith('app_hsr98'),
        mood: '🚂', delay: 1500, bossSign: true,
        text: '<strong>Honkai: Star Rail 98</strong>! Звёздный экспресс отправляется на Ярило-VI. Не забудьте: очки навыка общие на всю команду!',
        actions: [
          ...bossKeyActions('• Не мешай, я в бою!'),
          { text: '• Как пробить уязвимость?', action: () => this.speak('Смотрите на значки стихий над врагом. Бейте нужной стихией, пока белая полоска не опустеет — враг потеряет ход и получит урон.', [], '💥') },
          { text: '• Что за Контакт?', action: () => this.speak('Нажмите T в бою и поговорите с врагом. Интерес или Довольство — и он уйдёт с подарком. Злость — разозлится. Слухи у Сампо тоже работают, проверено!', [], '💬') }
        ]
      },
      {
        match: (id) => id === 'hsrs_setup',
        mood: '🎩', delay: 1200,
        text: 'Похоже, у этого мастера установки свой помощник. Пом-Пом, проводник Звёздного экспресса. Я не ревную. Почти.',
        actions: [
          { text: '• Вы бы подружились', action: () => this.speak('Наверное. Он открывает двери вагонов, я открываю документы. Почти коллеги.', [], '🤝') },
          { text: '• Не мешай установке', action: () => {} }
        ]
      },
      {
        match: (id) => id.startsWith('app_mc98'),
        mood: '⛏️', delay: 1500, bossSign: true,
        text: '<strong>Minecraft 98</strong>! Мир из кубиков, а вы — с голыми руками. Первым делом бейте дерево, потом верстак, потом кирку. И до темноты закопайтесь!',
        actions: [
          ...bossKeyActions('• Не мешай, я строю!'),
          { text: '• Как сделать кирку?', action: () => this.speak('Бревно → доски (в сетке 2x2), доски → палки. Из четырёх досок — верстак. На верстаке: три доски сверху, две палки вниз по центру — деревянная кирка.', [], '⛏️') },
          { text: '• Что шипит за спиной?', action: () => this.speak('Крипер. Зелёный, без рук, взрывается через полторы секунды. Бегите или бейте мечом издалека. И не стройте дом из песка.', [], '💥') }
        ]
      },
      {
        match: (id) => id.startsWith('app_cop98'),
        mood: '☢️', delay: 1500, bossSign: true,
        text: '<strong>S.T.A.L.K.E.R.: Зов Припяти 98</strong>! Затон, ржавый «Скадовск» и пропавшие вертолёты. Майор, ваша легенда — простой сталкер. Не проболтайтесь Бороде!',
        actions: [
          ...bossKeyActions('• Не мешай, я на задании СБУ!'),
          { text: '• Как пережить выброс?', action: () => this.speak('Когда Борода кричит по КПК «Выброс!» — бегите в любое помещение: трюм, сарай, кабину крана. На открытом месте выброс не пережить.', [], '🌩️') },
          { text: '• Как найти артефакт?', action: () => this.speak('Нажмите O и держите детектор в руке. Чем чаще писк — тем ближе артефакт. Без детектора его просто не видно!', [], '📟') }
        ]
      },
      {
        match: (id) => id.startsWith('app_stalker98'),
        mood: '☢️', delay: 1500, bossSign: true,
        text: '<strong>S.T.A.L.K.E.R. 98: Тень Чернобыля</strong>! Кордон, Свалка, аномалии и артефакты. Держите дозиметр под рукой — я слышу его треск даже из системного лотка!',
        actions: [
          ...bossKeyActions('• Не мешай, я в Зоне!'),
          { text: '• Совет для сталкера', action: () => this.speak('Бросайте болты перед собой — так видно аномалии. И не забудьте антирад: водка тоже подойдёт!', [], '🔩') },
          { text: '• Убить Стрелка?', action: () => this.speak('Сначала найдите флешку для Сидоровича. И не спрашивайте, кто такой Стрелок, пока не пройдёте Свалку!', [], '💾') }
        ]
      },
      {
        match: (id) => id.startsWith('app_diablo'),
        mood: '🔥', delay: 1500, bossSign: true,
        text: '<strong>Diablo</strong>! «Stay awhile and listen!» Под собором Тристрама 16 уровней подземелий. Не забудьте Town Portal, чтобы вернуться за зельями!',
        actions: [
          ...bossKeyActions('• Ещё один уровень!'),
          { text: '• Совет от Декарда Каина', action: () => this.speak('Сначала Мясник на 2-м уровне: «Ah... fresh meat!» Держитесь от него подальше, пока не прокачаетесь!', [], '📜') }
        ]
      },
      {
        match: (id) => id.startsWith('app_avatar98'),
        mood: '🔥', delay: 1400,
        text: '<strong>Аватар: Тихий цикл</strong>! Сохраняться можно только у святилищ, а стойку огня можно менять бесплатно раз в ход. И не спорьте с бабушкой Ханой!'
      },
      {
        match: (id) => id.startsWith('app_dota'),
        mood: '⚔️', delay: 1400,
        text: '<strong>Dota 98</strong>! Силы Света против Сил Тьмы. Главное правило: добивайте крипов, не рвитесь под башню на первом уровне и покупайте курьера!',
        actions: [
          { text: '• Написать союзникам «gl hf»', action: () => this.speak('Боты ответили: «gl hf»! Хотя, кажется, они уже фидят на миде...', [], '💬') },
          { text: '• Какого героя взять?', action: () => this.speak('Берите того, у кого самая большая скрепка! Шучу — начните с героя попроще и учитесь фармить лес.', [], '🗡️') }
        ]
      },
      {
        match: (id) => id.startsWith('app_lol'),
        mood: '🏰', delay: 1400,
        text: '<strong>League of Legends 98</strong>! Ущелье призывателей 5 на 5 против ботов. Умения на QWER, а я пока посторожу вашу базу!',
        actions: [
          { text: '• Позвать в джангл', action: () => this.speak('Я скрепка, а не лесник! Но совет дам: следите за мини-картой и ставьте варды.', [], '🌲') },
          { text: '• Написать «gg wp»', action: () => this.speak('«gg wp»! Спортивное поведение — ключ к победе. Даже над ботами.', [], '🤝') }
        ]
      },
      {
        match: (id) => id.startsWith('app_hockey'),
        mood: '🏒', delay: 1200,
        text: '<strong>NHL 98</strong>! Шайба, клюшка, два вратаря. Бросайте по воротам почаще — даже вратарь EA Sports иногда пропускает!',
        actions: [
          { text: '• Шайбу! Шайбу!', action: () => this.speak('ШАЙБУ! ШАЙБУ! Трибуны ревут, а я машу канцелярским флажком!', [], '📣') }
        ]
      },
      {
        match: (id) => id.startsWith('app_neon_racer'),
        mood: '🏎️', delay: 1200,
        text: '<strong>Midnight Glide</strong>! Ночные гонки по неоновому городу. Пристегнитесь — я уже сел на пассажирское и держусь за скрепку!',
        actions: [
          { text: '• Жми на газ!', action: () => this.speak('Втоо-оо-ом! Только осторожнее с трафиком на перекрёстках!', [], '💨') }
        ]
      },
      {
        match: (id) => id.startsWith('app_burnout'),
        mood: '🏁', delay: 1200,
        text: '<strong>Burnout Drag Racing</strong>! Четверть мили за секунды. Секрет прост: идеальный старт и переключение передач в красной зоне!',
        actions: [
          { text: '• Прогреть шины', action: () => this.speak('Бёрнаут! Дым столбом, резина визжит — вы готовы к старту!', [], '🔥') }
        ]
      },
      {
        match: (id) => id.startsWith('app_scumm_quest'),
        mood: '🏴‍☠️', delay: 1200,
        text: '<strong>LucasQuest 98</strong>! Пиратский квест в стиле SCUMM. Застряли? Попробуйте «Использовать» каждый предмет со всем подряд — классика жанра!',
        actions: [
          { text: '• Резиновая курица с блоком?', action: () => this.speak('Вот это правильное мышление квестера! В играх LucasArts возможно всё.', [], '🐔') }
        ]
      },
      {
        match: (id) => id === 'app_freecell',
        mood: '🂡', delay: 800,
        text: '<strong>FreeCell</strong>! Почти любая раздача решаема. Секрет: не занимайте все свободные ячейки сразу!',
        actions: []
      },
      {
        match: (id) => id === 'app_blender',
        mood: '🧊', delay: 1200,
        text: 'Похоже, вы создаёте 3D-модель! <strong>Blender 1.60</strong>: <strong>E</strong> — Extrude, <strong>Tab</strong> — режим редактирования, <strong>F12</strong> — рендер. Хотите, открою официальный сайт?',
        actions: [
          { text: '• Открыть blender3d.com', action: () => this.openInIE('http://www.blender3d.com') },
          { text: '• Смоделируй меня!', action: () => this.speak('Цилиндр, изогнутый в двух местах, и два глаза-сферы. Я — самая простая модель в мире!', [], '📎') }
        ]
      },
      {
        match: (id) => id === 'app_blender204',
        mood: '🧊', delay: 1200,
        text: '<strong>Blender 2.04</strong>! Наведите мышь на 3D-окно и нажмите <strong>SPACE</strong> — откроется меню инструментов. Выделение — <strong>правой</strong> кнопкой мыши, рендер — <strong>F12</strong>.',
        actions: [
          { text: '• Как сделать игру?', action: () => this.speak('Добавьте сферу, в кнопках <strong>F8</strong> включите Actor и Dynamic, соедините сенсор Keyboard через контроллер AND с актуатором Object и нажмите <strong>P</strong> над 3D-окном. ESC — выход из игры.', [], '🎮') },
          { text: '• Открыть blender3d.com', action: () => this.openInIE('http://www.blender3d.com') }
        ]
      },
      {
        match: (id) => id === 'app_icq',
        mood: '🌸', delay: 1000,
        text: '<strong>ICQ 98a</strong>! Зелёный цветочек расцвёл — вы в сети! Не забудьте записать свой UIN на бумажке и приклеить к монитору.',
        actions: [
          { text: '• О-оу!', action: () => {
            if (window.soundSys && window.soundSys.playIcqUhOh) window.soundSys.playIcqUhOh();
            this.speak('Тот самый звук! Кто-то уже пишет вам «Привет, как дела? Асл плз».', [], '🔔');
          }}
        ]
      },
      {
        match: (id) => id === 'app_outlook_compose',
        mood: '✉️', delay: 800,
        text: 'Похоже, вы пишете письмо! Это мой звёздный час. Помочь с текстом? И, пожалуйста, не пересылайте «письма счастья» десяти друзьям.',
        actions: [
          { text: '• Да, помоги написать', action: () => window.clippyLetters && window.clippyLetters.startWizard({ kind: 'outlook' }) },
          { text: '• Справлюсь сам', action: () => {} }
        ]
      },
      {
        match: (id) => id === 'app_outlook',
        mood: '📬', delay: 1000,
        text: '<strong>Outlook Express</strong>! У вас новые письма. Осторожно с вложениями .EXE и .VBS — особенно от незнакомцев с темой «ILOVEYOU»!',
        actions: []
      },
      {
        match: (id) => id === 'app_winrar_nag',
        mood: '🧾', delay: 300,
        text: 'Ваш пробный период WinRAR истёк... ещё в прошлом тысячелетии! Не волнуйтесь, это окно можно просто закрыть. Я никому не скажу.',
        actions: [
          { text: '• Купить лицензию', action: () => this.speak('Серьёзно?! Вы первый человек в истории, кто купил WinRAR! Евгений Рошал будет счастлив.', [], '🏆') }
        ]
      },
      {
        match: (id) => id.startsWith('app_winrar_'),
        mood: '🗜️', delay: 1000,
        text: '<strong>WinRAR</strong>! Упакуем что-нибудь в многотомный архив на 1.44 МБ, чтобы унести на дискетах?',
        actions: []
      },
      {
        match: (id) => id === 'app_avp_alert',
        mood: '🐷', delay: 200, panic: true,
        text: '⚠️ <strong>Хрю-хрю!</strong> Антивирус Касперского обнаружил угрозу! Скорее жмите «Лечить» — я не хочу стать заражённой скрепкой!',
        actions: []
      },
      {
        match: (id) => id === 'app_avp',
        mood: '🛡️', delay: 1000,
        text: '<strong>AVP</strong> от Лаборатории Касперского! Отличная идея — проверьте диск C: на CIH и Melissa. Если услышите хрюканье — это нормально!',
        actions: []
      },
      {
        match: (id) => id === 'app_dialup',
        mood: '📞', delay: 900,
        text: 'Подключаемся к Интернету! Предупредите домашних, чтобы никто не снимал трубку: «ПИИИ-КРРР-ШШШ» — это модем здоровается с провайдером.',
        actions: []
      },
      {
        match: (id) => id === 'app_regedit',
        mood: '⚠️', delay: 900,
        text: 'Ого, <strong>Редактор реестра</strong>! Неправильное изменение ключей может привести к переустановке Win 98. Советую сначала сделать резервную копию (Реестр → Экспорт)!',
        actions: [
          { text: '• Я опытный пользователь', action: () => this.speak('Тогда вы знаете, что HKEY_LOCAL_MACHINE — не место для экспериментов в пятницу вечером!', [], '🧐') }
        ]
      },
      {
        match: (id) => id === 'app_taskmgr',
        mood: '📈', delay: 800,
        text: 'Что-то зависло? В <strong>Диспетчере задач</strong> выберите программу и нажмите «Снять задачу». На вкладке «Процессы» есть и я: <strong>clippy.exe</strong>. Только меня не снимайте, пожалуйста!',
        actions: []
      },
      {
        match: (id) => id.startsWith('app_dos_prompt'),
        mood: '⌨️', delay: 800,
        text: '<strong>Сеанс MS-DOS</strong>! Настоящий хакер в деле. Подсказка: <strong>DIR</strong> — список файлов, <strong>CD</strong> — смена папки, <strong>CLS</strong> — очистить экран. А <strong>CLIPPY /?</strong> — это про меня.',
        actions: []
      },
      {
        match: (id) => id === 'app_dxdiag',
        mood: '🎮', delay: 800,
        text: 'Средство диагностики <strong>DirectX</strong>! Проверим, потянет ли ваш Voodoo2 новый Serious Sam 98?',
        actions: []
      },
      {
        match: (id) => id === 'app_scandisk',
        mood: '🩺', delay: 800,
        text: '<strong>ScanDisk</strong> проверяет диск! Если компьютер выключили кнопкой — он обязательно найдёт потерянные кластеры.',
        actions: []
      },
      {
        match: (id) => id === 'app_calculator',
        mood: '🧮', delay: 800,
        text: 'Похоже, вы что-то считаете! Хотите, помогу? 2 + 2 = 4. Для остального есть Excel 97!',
        actions: [
          { text: '• Открыть Excel', action: () => window.appExcel && window.appExcel.open() }
        ]
      },
      {
        match: (id) => id.startsWith('app_wordpad'),
        mood: '📄', delay: 1000,
        text: 'Похоже, вы пишете документ в <strong>WordPad</strong>! Выделите заголовок и нажмите «Ж», чтобы сделать его жирным.',
        actions: []
      },
      {
        match: (id) => id.startsWith('app_wincmd'),
        mood: '🗂️', delay: 1000,
        text: '<strong>WinCommander</strong>! Две панели — как в старом добром Norton Commander. <strong>F5</strong> — копировать, <strong>F6</strong> — переместить, <strong>F8</strong> — удалить.',
        actions: []
      },
      {
        match: (id) => id === 'app_sound_recorder',
        mood: '🎙️', delay: 900,
        text: '<strong>Звукозапись</strong>! Ровно 60 секунд на запись. Скажите в микрофон «Привет, Скрепыш!» — я послушаю!',
        actions: []
      },
      {
        match: (id) => id === 'app_igroman',
        mood: '💿', delay: 1000,
        text: 'Диск «Игромании» в приводе! Демоверсии, видеоролики и патчи — целых 650 МБ счастья.',
        actions: []
      }
    ];
  }

  countReaction(kind) {
    if (window.clippyTalk && window.clippyTalk.countReaction) window.clippyTalk.countReaction(kind);
  }

  onWindowOpened(id, title, win) {
    if (!id) return;
    if (window.clippyTips) window.clippyTips.onWindowOpened(id);
    if (id.startsWith('app_notepad')) this.attachNotepadTypingMonitor(win);
    if (id.startsWith('app_wordpad') && window.clippyLetters) window.clippyLetters.watchWordPad(win);
    if (id.startsWith('app_minesweeper')) this.attachMinesweeperMonitor(win);
    if (!this.visible) return;
    if (Date.now() < (this.reactionsMutedUntil || 0)) return;
    if (this.annoyance === 'quiet' || this.opt('appReactions') === false) return;
    if (id === 'app_outlook_compose' && this.opt('letters') === false) return;

    const appReaction = this.getAppReactions().find(r => r.match(id));
    if (appReaction) {
      this.countReaction('app');
      setTimeout(() => {
        if (appReaction.bossSign) this.setAccessory('boss-sign', true);
        if (appReaction.panic) {
          this.charEl.classList.add('panic-shake');
          setTimeout(() => this.charEl.classList.remove('panic-shake'), 3000);
        }
        this.speak(appReaction.text, appReaction.actions, appReaction.mood);
      }, appReaction.delay);
      return;
    }

    if (this.reactToBuiltinWindow(id)) this.countReaction('app');
  }

  reactToBuiltinWindow(id) {
    if (id.startsWith('app_wolf3d') || id.startsWith('app_stalker') || id.startsWith('app_half_life') || id.startsWith('app_fallout2')) {
      setTimeout(() => {
        this.setAccessory('boss-sign', true);
        this.speak('Ого, 3D-шутер в разгар рабочего дня! Я на страже — если войдет начальник, нажмите «Шеф идет!»', [
          { text: '🚨 Шеф идет! (Прикрыть Excel)', action: () => this.triggerBossKey() },
          { text: '• Не мешай, я на войне!', action: () => this.setAccessory('boss-sign', false) }
        ], '🎮');
      }, 1500);
      return true;
    }

    if (id.startsWith('app_excel')) {
      setTimeout(() => {
        this.speak('Электронные таблицы Excel 97! 299$ на 3dfx Voodoo2 — полностью одобряю!', [
          { text: '• Спасибо, Скрепыш!', action: () => {} }
        ], '📊');
      }, 1000);
      return true;
    }

    if (id.startsWith('app_minesweeper')) {
      setTimeout(() => {
        this.speak('«Сапёр»! Золотое правило: жмите в центр поля, а если подорветесь — первая мина учебная!', [], '💣');
      }, 800);
      return true;
    }

    if (id.startsWith('app_solitaire')) {
      setTimeout(() => {
        this.speak('«Косынка»! Классика офисного релакса. Если застрянете — пересдайте колоду!', [], '🃏');
      }, 800);
      return true;
    }

    if (id.startsWith('app_pinball')) {
      setTimeout(() => {
        this.speak('Space Cadet Pinball! Цельтесь в гиперпространственный туннель и берегите стол от TILT!', [], '🚀');
      }, 1000);
      return true;
    }

    if (id.startsWith('app_paint') || id.startsWith('app_photoshop')) {
      setTimeout(() => {
        this.speak('Осторожно с ведерком «Заливка»! Если контур не замкнут на 1 пиксель, краска зальет весь холст!', [], '🎨');
      }, 1200);
      return true;
    }

    if (id.startsWith('app_virus')) {
      setTimeout(() => {
        this.charEl.classList.add('panic-shake');
        this.sound('playError');
        this.speak('⚠️ <strong>ТРЕВОГА!</strong><br>Файл totally_not_a_virus.exe не подписан Microslop! Я чувствую приближение вирусной эпидемии!', [
          { text: '🛡️ Скрепыш, обезвредить вирус!', danger: true, action: () => {
            this.charEl.classList.remove('panic-shake');
            if (window.winManager) window.winManager.closeWindow(id);
            this.sound('playClippyVictory');
            this.speak('Вирус успешно нейтрализован моим высокоточным канцелярским сканером!');
          }},
          { text: '• Спокойно, я люблю смайлики', action: () => this.charEl.classList.remove('panic-shake') }
        ], '☣️', 0);
      }, 1000);
      return true;
    }

    if (id.startsWith('app_defrag')) {
      setTimeout(() => {
        this.setAccessory('coffee', true);
        this.speak('Дефрагментация жесткого диска! Заваривайте чай, наблюдать за цветными квадратиками можно вечно.', [], '☕');
      }, 1000);
      return true;
    }

    if (id.startsWith('app_recycle_bin')) {
      setTimeout(() => {
        this.speak('Корзина! Не забудьте очистить ее, чтобы освободить ценные мегабайты на диске C:.', [], '🗑️');
      }, 1000);
      return true;
    }

    if (id.startsWith('app_netscape')) {
      setTimeout(() => {
        this.speak('Netscape Navigator?! Должен предупредить: Билл Гейтс настаивает, что Internet Explorer работает быстрее и лучше интегрирован с Win 98!', [
          { text: '• Запустить Internet Explorer', action: () => window.appIE && window.appIE.open() },
          { text: '• Мне нравится штурвал Netscape', action: () => this.speak('Что ж, логотип со штурвалом у них действительно стильный...', [], '🧭') }
        ], '🧭');
      }, 1200);
      return true;
    }
    return false;
  }

  attachNotepadTypingMonitor(win) {
    if (!win || !win.element) return;
    const textarea = win.element.querySelector('.notepad-textarea');
    if (!textarea || textarea.dataset.clippyWatch) return;
    textarea.dataset.clippyWatch = '1';

    const said = new Set();
    const once = (key, line, mood) => {
      if (said.has(key)) return;
      said.add(key);
      this.speak(line, [], mood, 7000);
    };
    textarea.addEventListener('input', () => {
      this.resetIdleTimer();
      if (window.clippyLetters) window.clippyLetters.onTyping('notepad', win, textarea.value);
      if (window.clippyTips) window.clippyTips.onTyping(win.id || 'notepad', textarea.value.length);
      if (!this.visible || this.annoyance === 'quiet') return;
      const val = textarea.value.toLowerCase();
      if (val.includes('bill gates') || val.includes('гейтс')) {
        once('gates', 'О, вы упомянули Билла Гейтса? Передайте ему, что я верный помощник!', '👑');
      } else if (val.includes('пароль') || val.includes('password')) {
        once('password', 'Тссс! Пароль в Блокноте? Обещаю, никому не подглядывать.', '🔒');
      } else if (val.includes('doom') || val.includes('quake')) {
        once('doom', 'IDDQD? IDKFA? Я тоже знаю чит-коды!', '👾');
      } else if (val.includes('скрепыш') || val.includes('clippy')) {
        once('clippy', 'Вы пишете обо мне? Я ничего не читаю. Почти ничего. Ладно, читаю. Пишите хорошее.', '😳');
      }
    });
  }

  attachMinesweeperMonitor(win) {
    if (!win || !win.element) return;
    const board = win.element.querySelector('.ms-canvas');
    if (!board || board.dataset.clippyWatch) return;
    board.dataset.clippyWatch = '1';

    let last = window.appMinesweeper ? window.appMinesweeper.gameState : 'ready';
    const check = () => {
      const game = window.appMinesweeper;
      if (!game || game.gameState === last) return;
      last = game.gameState;
      if (!this.visible) return;
      if (last === 'lost') {
        this.speak('БА-БАХ! Ничего страшного, первая мина всегда учебная! Жмите жёлтый смайлик вверху для реванша.', [
          { text: '• Ещё разок!', action: () => {
            if (window.appMinesweeper) window.appMinesweeper.resetGame();
          }}
        ], '💥');
      } else if (last === 'won') {
        this.setGlasses(true);
        this.sound('playClippyVictory');
        this.animate('congratulate');
        this.speak('ПОБЕДА! Поле разминировано с ювелирной точностью! Крутые очки победителя надеты и сохранены!', [
          { text: '• Ура!', action: () => {} }
        ], '🏆');
      }
    };
    ['mouseup', 'click'].forEach(evt => board.addEventListener(evt, () => setTimeout(check, 80)));
  }

  initAppMonitors() {
    setInterval(() => {
      this.syncListening();
      this.watchDesktopGames();
    }, 1500);
  }

  watchDesktopGames() {
    const sol = window.appSolitaire;
    const won = Boolean(sol && sol.isWon);
    if (won && !this.solitaireWon && this.visible && this.annoyance !== 'quiet') {
      this.animate('congratulate');
      this.sound('playClippyVictory');
      this.speak('Карты скачут по столу! Вы разложили «Косынку». Начальник бы не одобрил, а я одобряю очень.', [
        { text: '• Ещё партию', action: () => { if (sol.startNewGame) sol.startNewGame(); } },
        { text: '• Спасибо!', action: () => {} }
      ], '🃏', 9000);
    }
    this.solitaireWon = won;
    if (window.clippySystem) window.clippySystem.checkNeko();
  }

  playingPoligonClip() {
    const player = window.poligonSite && window.poligonSite.player;
    return player && player.state === 'playing' ? player.clip : null;
  }

  syncListening() {
    const winamp = Boolean(window.appWinamp && window.appWinamp.isPlaying);
    const clip = this.playingPoligonClip();
    const midi = Boolean(window.appIE && window.appIE.dimaMidiPlaying);
    const listening = winamp || Boolean(clip) || midi;
    if (clip && clip.bpm) this.charEl.style.setProperty('--clippy-beat', `${(60 / clip.bpm).toFixed(3)}s`);
    else this.charEl.style.removeProperty('--clippy-beat');
    if (listening && !this.activeAccessories.has('headphones')) {
      this.setAccessory('headphones', true);
      this.charEl.classList.add('bobbing');
      if (winamp && this.annoyance !== 'quiet' && this.opt('appReactions') !== false) {
        this.speak('Winamp, it really whips the llama\'s ass! Отличный трек играет!', [], '🎧');
      }
    } else if (!listening && this.activeAccessories.has('headphones')) {
      this.setAccessory('headphones', false);
      this.charEl.classList.remove('bobbing');
    }
  }

  plural(n, one, few, many) {
    const tens = n % 100;
    const units = n % 10;
    if (tens > 10 && tens < 20) return `${n} ${many}`;
    if (units === 1) return `${n} ${one}`;
    if (units >= 2 && units <= 4) return `${n} ${few}`;
    return `${n} ${many}`;
  }

  poligonClipsInOrder() {
    const site = window.poligonSite;
    return site ? site.clips().slice().sort((a, b) => a.number - b.number) : [];
  }

  poligonReaction() {
    const site = window.poligonSite;
    const player = site && site.player;
    if (!player) return null;
    if (player.state === 'broken') {
      return {
        mood: '🖥️',
        text: 'Клипы <strong>«Полигона»</strong> рисует 3D-ускоритель прямо во время просмотра. А браузер не дал доступ к WebGL, поэтому вместо клипа чёрный экран.',
        actions: [
          { text: '• Где взять 3D-ускоритель?', action: () => this.openInIE('http://www.3dfx-zone.com') },
          { text: '• Понятно', action: () => {} }
        ]
      };
    }
    const clip = player.clip;
    const lines = {
      'never-gonna-give-you-up': ['🕺', 'Rick Astley, 1987 год, и всё из треугольников! <strong>Never Gonna Give You Up</strong> — прямо мой девиз: я вас никогда не брошу. Даже если в Office XP меня выключат по умолчанию...'],
      'heartsteel-paranoia': ['👀', '<strong>PARANOIA</strong>! Мне тоже всё время кажется, что за мной следят. Особенно пёс Rocky из Office 2000. Он точно метит на моё место.'],
      'vladik-v-depressii': ['📝', 'Похоже, вы смотрите песню про депрессию. Хотите, помогу написать Владику письмо поддержки? Хотя лучше досмотреть кавер до конца: от унитаза-карта настроение поднимается само.'],
      'tarakan-i-chervyachok': ['🎸', '<strong>Таракан и червячок</strong> в стиле visual-kei: грим, шипы, дым! Цензурную плашку я не трогал, честное скрепочное.'],
      'neck-hurts': ['🍈', '<strong>Neck Hurts</strong>: DJ Мелон кивает в такт так старательно, что зал из дынь кивает вместе с ней. Совет от Скрепыша: после 126 ударов в минуту сделайте разминку для шеи.'],
      'war-song': ['🎺', 'Сэм и Макс, <strong>War Song</strong>! Агент Суперболл поёт про войну, а президент Макс даже не моргнул. Совет от Скрепыша: если над дверью замигала красная надпись, сначала сохраните документ.']
    };
    const [mood, line] = lines[clip.id] || ['📼', `<strong>${clip.artist} — ${clip.title}</strong>, собранный заново из полигонов!`];
    const others = this.poligonClipsInOrder().filter(c => c.id !== clip.id);
    const actions = [];
    if (player.state !== 'playing') {
      actions.push({
        text: '► Смотреть вместе',
        action: () => {
          player.play();
          this.syncListening();
          this.speak(`Надел наушники! Качаю головой точно в такт: у этого клипа ${this.plural(Math.round(clip.bpm), 'удар', 'удара', 'ударов')} в минуту.`, [], '🎧', 6000);
        }
      });
    }
    actions.push({
      text: '• Случайная сцена',
      action: () => {
        const loc = clip.locations[Math.floor(Math.random() * clip.locations.length)];
        player.jumpTo(loc.id);
        if (player.state !== 'playing') player.play();
        this.syncListening();
        this.speak(`Переношу в место съёмки <strong>«${loc.name}»</strong>. Кнопки под плеером делают то же самое.`, [], '🎬', 6000);
      }
    });
    if (others.length) {
      actions.push({
        text: '• Другой клип',
        action: () => this.speak('Какой клип включить?', others.map(c => ({
          text: `• ${c.artist} — ${c.title}`,
          action: () => {
            this._lastIePageKey = null;
            this.openInIE(`${site.baseUrl}/clip/${c.id}`);
          }
        })), '📼')
      });
    }
    actions.push({ text: '• Спасибо, я сам', action: () => {} });
    return {
      mood,
      text: `${line}<br><small>${this.plural(clip.shots.length - 1, 'склейка', 'склейки', 'склеек')}, ${this.plural(clip.locations.length, 'место', 'места', 'мест')} съёмки.</small>`,
      actions
    };
  }

  onPoligonClipEnded(clip) {
    if (!this.visible || this.annoyance === 'quiet' || this.isBrowserMinimized()) return;
    const site = window.poligonSite;
    const clips = this.poligonClipsInOrder();
    const next = clips[(clips.findIndex(c => c.id === clip.id) + 1) % clips.length];
    const actions = [{
      text: '↺ Ещё раз',
      action: () => {
        if (site && site.player) site.player.play();
        this.syncListening();
      }
    }];
    if (next && next.id !== clip.id) {
      actions.push({
        text: `► Дальше: ${next.artist}`,
        action: () => {
          this._lastIePageKey = null;
          this.openInIE(`${site.baseUrl}/clip/${next.id}`);
        }
      });
    }
    actions.push({ text: '• Хватит на сегодня', action: () => {} });
    this.syncListening();
    this.speak(`Финальная склейка! ${this.plural(clip.shots.length - 1, 'склейка', 'склейки', 'склеек')} за ${window.PoligonPlayer ? window.PoligonPlayer.fmt(clip.duration) : Math.round(clip.duration) + ' с'}. Монтажёр «Полигона» явно не спал ночами.`, actions, '👏');
  }

  youvidElement(selector) {
    const page = document.querySelector('.yv-root');
    return page ? page.querySelector(selector) : null;
  }

  youvidWatchUrl(site, v) {
    return `${site.baseUrl}/watch?v=${v.id}`;
  }

  youvidNotes(site, v) {
    const ch = site.channels[v.channel];
    const user = site.state.user;
    const notes = {
      jNQXAC9IVRw: {
        mood: '🐘',
        line: '<strong>jawed</strong> стоит у вольера и рассказывает про слонов. Всё видео короче, чем загрузка одной картинки по модему!',
        end: 'Девятнадцать секунд, и ни слова лишнего. Коротко и по делу, прямо как хорошая подсказка.',
        draft: `Здравствуйте, ${ch.name}!\nСпасибо за видео о слонах. Интересно было бы узнать, что они едят.\nС уважением, ${user}`
      },
      hArMoNy_hsr: {
        mood: '🎻',
        line: '<strong>Hayato</strong> проходит игру отрядом из одних гармонистов. Видео длинное: можно заварить чай, а я покараулю плеер.',
        end: 'Челлендж досмотрен! Гармонисты справились. А вы сохраняетесь так же часто, как тут крутят баннеры? Ctrl+S, на всякий случай.',
        draft: `Здравствуйте, ${ch.name}!\nОтряд из одних гармонистов — смелое решение. Жду продолжения челленджа.\nС уважением, ${user}`
      },
      i9AyI356ye4: {
        mood: '😴',
        line: '<strong>Влад</strong> ложится спать: снимает толстовку, воюет с одеялом и ищет позицию получше. Полторы минуты, а событий как в целом сериале!',
        end: 'Одеяло побеждено, Влад уснул. Если компьютеру тоже пора спать, есть «Пуск» → «Завершение работы». Там обходится без «почти».',
        draft: `Здравствуйте!\nСпасибо за видео про Влада. Совет: одеяло удобнее расправить, пока сидишь, а потом уже ложиться. Так оно реже падает.\nС уважением, ${user}`
      },
      vEryN1ceGdN: {
        mood: '🎤',
        line: 'Караоке со стрима: <strong>«Very nice, good nice»</strong> по прайсу за 1000 рублей. Убавьте громкость, ноты будут длинные!',
        end: 'Десять секунд чистого вокала. Захотите спеть так же — «Пуск» → «Программы» → «Стандартные» → «Развлечения» → «Звукозапись». Микрофон только держите подальше от рта.',
        draft: `Здравствуйте!\nСпасибо за исполнение. Предлагаю добавить в прайс пункт «вери найс с припевом». Готов задонатить.\nС уважением, ${user}`
      },
      eXtr3meSlay: {
        mood: '💇',
        line: '<strong>Мистер Бакс</strong> выходит из барбершопа с новой стрижкой, а папа не верит своим глазам. Восемь секунд, а целая история преображения!',
        end: 'Был человек, стал extremely slay. Меня бы так переименовать: был Скрепыш, стал Скрепыш Pro. Волос у меня, правда, нет, стричь нечего.',
        draft: `Здравствуйте, ${ch.name}!\nПоздравляю с новой стрижкой. Коротко по бокам — практично: меньше волос, меньше расчёсывать, больше времени на важные дела.\nС уважением, ${user}`
      },
      Str3yUltr498: {
        mood: '⚡',
        line: '<strong>Стрей Ультра Гипер Осуждает</strong>! Обычного осуждения тут мало: в ход идут максимальное, сверхосуждение и ультра-гипер подряд!',
        end: 'Двойной залп осуждения завершён! С такой формулировкой никакая проверка точно не страшна.',
        draft: `Здравствуйте, ${ch.name}!\nУльтра-гипер-сверхосуждение на 0:12 — это новый золотой стандарт для всех стримеров. Полностью поддерживаю!\nС уважением, ${user}`
      },
      Str3yP0dsk0: {
        mood: '🚀',
        line: '<strong>Стрей Подскочил</strong>! На седьмой секунде он так взлетает с кресла от доната, что даже моя пружинка подпрыгнула вместе с ним.',
        end: 'Прыжок в кресле выполнен на отлично, донат осуждён трижды. Можете ставить пятёрку за реакцию!',
        draft: `Здравствуйте, ${ch.name}!\nПрыжок на 0:07 в ролике «Стрей Подскочил» — рекорд высоты среди всех стримеров. Осуждаем и поддерживаем!\nС уважением, ${user}`
      }
    };
    return notes[v.id] || {
      mood: '📼',
      line: `<strong>${site.esc(v.title)}</strong> на канале ${site.esc(ch.name)}.`,
      end: 'Видео закончилось.',
      draft: `Здравствуйте, ${ch.name}!\nСпасибо за видео «${v.title}».\nС уважением, ${user}`
    };
  }

  youvidLoginPrompt(site, next, why) {
    this.speak(`${why} Для этого нужен аккаунт на YouVid. Открыть вход?`, [
      { text: '• Войти', action: () => this.openInIE(`${site.baseUrl}/login?next=${encodeURIComponent(next)}`) },
      { text: '• Не сейчас', action: () => {} }
    ], '🔑');
  }

  youvidRateMenu(site, v) {
    if (!site.state.user) {
      this.youvidLoginPrompt(site, this.youvidWatchUrl(site, v), 'Оценки ставят только зрители с аккаунтом.');
      return;
    }
    const labels = ['плохо', 'так себе', 'нормально', 'хорошо', 'отлично'];
    this.speak(`Сколько звёзд поставим видео <strong>«${site.esc(v.title)}»</strong>?`, [5, 4, 3, 2, 1].map(n => ({
      text: `${'★'.repeat(n)} ${labels[n - 1]}`,
      action: () => {
        const btn = this.youvidElement(`.yv-rate-btn[data-rate="${n}"]`);
        if (!btn) return;
        btn.click();
        this.speak(n >= 4 ? 'Оценка сохранена! Автору будет приятно.' : 'Оценка сохранена. Честная оценка тоже помогает автору.', [], '⭐', 6000);
      }
    })), '⭐');
  }

  youvidDraftComment(site, v) {
    if (!site.state.user) {
      this.youvidLoginPrompt(site, this.youvidWatchUrl(site, v), 'Комментарии пишут только зрители с аккаунтом.');
      return;
    }
    const field = this.youvidElement('.yv-comment-text');
    if (!field) return;
    field.value = this.youvidNotes(site, v).draft;
    field.focus();
    this.speak('Похоже, вы пишете комментарий! Я набросал черновик по всем правилам делового письма. Поправьте его и нажмите «Отправить комментарий».', [], '📝', 9000);
  }

  youvidVideoMenu(site, list, question) {
    this.speak(question, list.map(x => ({
      text: `• ${site.esc(x.title)} (${site.esc(site.channels[x.channel].name)})`,
      action: () => {
        this._lastIePageKey = null;
        this.openInIE(this.youvidWatchUrl(site, x));
      }
    })), '📼');
  }

  youvidWatchReaction(site, v) {
    const player = site.player;
    if (player && player.state === 'broken') {
      return {
        mood: '🖥️',
        text: 'Картинку в плеере YouVid рисует 3D-ускоритель. А браузер не дал доступ к WebGL, поэтому вместо видео пустой экран.',
        actions: [
          { text: '• Где взять 3D-ускоритель?', action: () => this.openInIE('http://www.3dfx-zone.com') },
          { text: '• Понятно', action: () => {} }
        ]
      };
    }
    const ch = site.channels[v.channel];
    const notes = this.youvidNotes(site, v);
    const others = site.videos.filter(x => x.id !== v.id);
    const actions = [];
    if (player && (player.state === 'paused' || player.state === 'ended')) {
      actions.push({
        text: '► Смотреть вместе',
        action: () => {
          player.play();
          this.speak('Смотрю вместе с вами! Пауза — щелчок по картинке или пробел.', [], '🍿', 6000);
        }
      });
    }
    if (!site.state.rated[v.id]) actions.push({ text: '★ Оценить видео', action: () => this.youvidRateMenu(site, v) });
    actions.push({ text: '✎ Помочь с комментарием', action: () => this.youvidDraftComment(site, v) });
    if (others.length) actions.push({ text: '• Другое видео', action: () => this.youvidVideoMenu(site, others, 'Какое видео включить?') });
    actions.push({ text: '• Спасибо, я сам', action: () => {} });
    const length = window.YouVidPlayer ? window.YouVidPlayer.fmt(site.duration(v)) : '';
    return {
      mood: notes.mood,
      text: `${notes.line}<br><small>Канал ${site.esc(ch.name)}, длина ${length}.</small>`,
      actions
    };
  }

  youvidChannelReaction(site, ch) {
    const lines = {
      jawed: ['🐘', 'У <strong>jawed</strong> пока одно видео, зато про слонов.'],
      Hayato_me: ['🎮', `<strong>Hayato</strong> снимает игровые челленджи. В профиле подпись «${site.esc(ch.about)}» — я тоже так думаю каждый раз, когда меня закрывают крестиком.`],
      EbatoriyaPlanet: ['🪐', `Девиз канала: «${site.esc(ch.about.replace(/\.$/, ''))}». Похоже на мою папку «Мои документы»: файлы туда попадают, а обратно уже никто не находит.`],
      MisterBucks: ['💸', `<strong>Мистер Бакс</strong> — самый большой канал на YouVid: ${site.num(ch.subs)} подписчиков! Название звучит так, будто тут платят за просмотры. Я проверил: не платят.`]
    };
    const [mood, line] = lines[ch.user] || ['📺', `Канал <strong>${site.esc(ch.name)}</strong>.`];
    const vids = site.videosOf(ch);
    const actions = [];
    if (!site.state.subs.includes(ch.user)) {
      actions.push({
        text: '+ Подписаться',
        action: () => {
          if (!site.state.user) {
            this.youvidLoginPrompt(site, `${site.baseUrl}/user/${ch.user}`, 'Подписки есть только у зрителей с аккаунтом.');
            return;
          }
          const btn = this.youvidElement(`.yv-sub[data-channel="${ch.user}"]`);
          if (!btn) return;
          btn.click();
          this.speak(`Готово! Новые видео <strong>${site.esc(ch.name)}</strong> будут в разделе «Мои подписки».`, [], '📬', 6000);
        }
      });
    }
    if (vids.length) {
      actions.push({
        text: '► Смотреть видео канала',
        action: () => {
          this._lastIePageKey = null;
          this.openInIE(this.youvidWatchUrl(site, vids[0]));
        }
      });
    }
    actions.push({
      text: '• А у тебя есть канал?',
      action: () => this.speak('Пока нет. Я бы выложил урок «Как сохранить документ за одну секунду». Только пёс Rocky наверняка снимет, как гоняется за мячиком, и подписчики уйдут к нему...', [], '😔', 9000)
    });
    actions.push({ text: '• Спасибо', action: () => {} });
    return { mood, text: line, actions };
  }

  youvidHomeReaction(site) {
    const actions = [{ text: '• Что посмотреть?', action: () => this.youvidVideoMenu(site, site.videos, 'Вот что сейчас есть на сайте:') }];
    if (!site.state.user) actions.push({ text: '• Завести аккаунт', action: () => this.openInIE(`${site.baseUrl}/signup`) });
    actions.push({ text: '• Спасибо, я сам', action: () => {} });
    return {
      mood: '📺',
      text: '<strong>YouVid</strong>! Сюда любой может выложить своё видео, а смотреть его можно прямо в окне браузера, без плагинов и скачивания .avi.',
      actions
    };
  }

  youvidReaction() {
    const site = window.youvidSite;
    if (!site) return null;
    const r = site.route(site.lastUrl);
    if (r.page === 'watch') {
      const v = site.video(r.params.v);
      return v ? this.youvidWatchReaction(site, v) : null;
    }
    if (r.page === 'user') {
      const key = Object.keys(site.channels).find(k => k.toLowerCase() === String(r.user).toLowerCase());
      return key ? this.youvidChannelReaction(site, site.channels[key]) : null;
    }
    if (r.page === 'home') return this.youvidHomeReaction(site);
    if (r.page === 'login' && !site.state.user) {
      return { mood: '🔑', text: 'Пароль никому не говорите. Даже мне. Хотя я бы никому не рассказал, честное скрепочное.', actions: [] };
    }
    return null;
  }

  onYouVidEnded(v) {
    if (!this.visible || this.annoyance === 'quiet' || this.isBrowserMinimized()) return;
    const site = window.youvidSite;
    if (!site) return;
    const next = site.videos.find(x => x.id !== v.id);
    const actions = [];
    if (!site.state.rated[v.id]) actions.push({ text: '★ Оценить видео', action: () => this.youvidRateMenu(site, v) });
    actions.push({ text: '↺ Ещё раз', action: () => { if (site.player) site.player.play(); } });
    if (next) {
      actions.push({
        text: `► Дальше: ${site.esc(next.title)}`,
        action: () => {
          this._lastIePageKey = null;
          this.openInIE(this.youvidWatchUrl(site, next));
        }
      });
    }
    actions.push({ text: '• Хватит на сегодня', action: () => {} });
    this.speak(this.youvidNotes(site, v).end, actions, '👏');
  }

  onYouVidComment(v, text) {
    if (!this.visible || this.annoyance === 'quiet') return;
    const site = window.youvidSite;
    const ch = site && site.channels[v.channel];
    if (!ch) return;
    if (text.includes('С уважением')) {
      this.speak(`Письмо ушло! То есть комментарий. Деловой стиль на YouVid пока редкость, <strong>${site.esc(ch.name)}</strong> точно заметит.`, [], '📨', 8000);
    } else {
      this.speak('Комментарий опубликован! В следующий раз могу набросать черновик: с письмами у меня большой опыт.', [], '💬', 8000);
    }
  }

  onBSOD(isActive) {
    if (!this.isRunning()) return;
    if (isActive) {
      this.show();
      this.setAccessory('halo', true);
      this.charEl.classList.remove('sleeping');
      this.speak('Кажется, произошел фатальный сбой 0E... Нажмите любую клавишу, а я помолюсь за сохранение данных.', [], '😇', 0);
    } else {
      this.setAccessory('halo', false);
      this.speak('Фух! Мы вернулись из синего экрана смерти. Win 98 снова жива!');
    }
  }

  onScreensaver(isActive) {
    if (isActive) {
      this._wasVisibleBeforeScreensaver = this.visible;
      this.hideBalloon();
      if (this.container) {
        this.container.style.display = 'none';
      }
    } else {
      if (this._wasVisibleBeforeScreensaver && this.visible) {
        if (this.container) {
          this.container.style.display = 'flex';
        }
      }
    }
  }

  isBrowserMinimized() {
    const win = window.winManager && window.winManager.windows.get('app_ie');
    return Boolean(win && win.isMinimized);
  }

  onNavigateIE(url, pageKey, pageTitle) {
    if (window.clippyTips) window.clippyTips.onSiteVisited(pageKey);
    if (!this.visible || this.annoyance === 'quiet' || this.isBrowserMinimized()) return;
    if (this.opt('siteReactions') === false) return;

    const now = Date.now();
    if (this._lastIePageKey === pageKey && now - (this._lastIeTime || 0) < 6000) return;
    this._lastIePageKey = pageKey;
    this._lastIeTime = now;

    const navigateIE = (targetUrl) => {
      if (window.appIE && window.winManager && window.winManager.windows.has('app_ie')) {
        const win = window.winManager.windows.get('app_ie');
        window.appIE.navigate(win, targetUrl);
      }
    };

    const siteReactions = {
      'search': {
        mood: '🔍',
        text: '<strong>WebSeeker 98</strong> — главная поисковая машина! Что ищем во Всемирной Паутине?',
        actions: [
          { text: '• Найти «чит-коды DOOM»', action: () => navigateIE('http://www.search98.com/search?q=чит-коды+DOOM') },
          { text: '• Найти «скачать MP3»', action: () => navigateIE('http://www.search98.com/search?q=скачать+MP3') },
          { text: '• Спасибо, я сам', action: () => {} }
        ]
      },
      'microslop': {
        mood: '💻',
        text: '<strong>Microslop Win 98 Portal</strong>! Мой родной дом. Не забудьте проверить обновления безопасности и компонентов!',
        actions: [
          { text: '• Загрузить Service Pack 1', action: () => this.speak('Загрузка Service Pack 1 начнется... как только модем освободит домашнюю телефонную линию!', [], '💾') },
          { text: '• Привет Биллу Гейтсу!', action: () => this.speak('Билл передает вам спасибо за верность операционной системе Win 98!', [], '👑') }
        ]
      },
      'rambler': {
        mood: '🔴',
        text: '<strong>Рамблер \'98</strong> — первый российский поисковый портал и ТОП-100 Рунета! Погода, курс доллара и новости.',
        actions: [
          { text: '• Перейти в Анекдоты', action: () => navigateIE('http://www.anekdot98.ru') },
          { text: '• Погода в Москве: +18°C', action: () => this.speak('Погода отличная, самое время остаться дома за компьютером и серфить сеть!', [], '☀️') }
        ]
      },
      'steam': {
        mood: '🎮',
        text: '<strong>Steam</strong>! Ставите клиент, и игры сами приходят по модему. Никаких дисков — даже мне непривычно!',
        actions: [
          { text: '• Открыть Steam', action: () => window.gameManager && window.gameManager.showInSteam() }
        ]
      },
      'softstore': {
        mood: '💾',
        text: '<strong>SoftStore \'98</strong> — каталог программ! Обязательно загрузите Winamp и Office 97 — со мной ваши таблицы станут веселее!',
        actions: [
          { text: '• Открыть Excel 97', action: () => window.appExcel && window.appExcel.open() },
          { text: '• Запустить Winamp', action: () => window.appWinamp && window.appWinamp.open() }
        ]
      },
      'mp3vault': {
        mood: '🎵',
        text: '<strong>MP3 Vault \'98</strong>! Скорость загрузки: 3.5 КБ/с. Всего 25 минут на одну песню — и хит группы «Руки Вверх!» у вас на диске C:!',
        actions: [
          { text: '• Включить Winamp', action: () => {
            if (window.appWinamp) window.appWinamp.open();
            this.setAccessory('headphones', true);
            this.charEl.classList.add('bobbing');
          }}
        ]
      },
      'kinomania': {
        mood: '🎬',
        text: '<strong>Киномания \'98</strong>! В прокате гремят «Титаник», «Армагеддон» и «Люди в черном». Приготовьте носовые платки и попкорн!',
        actions: [
          { text: '• Кто сыграл Джека в Титанике?', action: () => this.speak('Леонардо Ди Каприо, конечно! Плакаты с ним сейчас висят в каждой комнате.', [], '🚢') }
        ]
      },
      'webvideo': {
        mood: '📹',
        text: '<strong>WebCinema \'98</strong>! Видео в интернете через модем — это фантастика! Разрешение 160х120 пикселей, зато настоящее кино!',
        actions: [
          { text: '• Открыть Медиаплеер', action: () => window.appVideoPlayer && window.appVideoPlayer.open() }
        ]
      },
      'forum': {
        mood: '💬',
        text: '<strong>GamerZone Forum</strong>! Игровые баталии 1998 года. Не флудите и соблюдайте нетикет, иначе модератор выпишет бан по IP!',
        actions: [
          { text: '• Создать тему', action: () => this.speak('Обязательно поставьте в подпись анимацию и характеристики вашего Pentium II 300 МГц!', [], '✍️') },
          { text: '• Где здесь коды?', action: () => navigateIE('http://forum.games98.com/forum?id=codes') }
        ]
      },
      'chat': {
        mood: '🛋️',
        text: '<strong>Чат «Кроватка \'98»</strong>! Легендарный веб-чат эпохи Dial-up. Придумайте никнейм и напишите: «Всем ку, кто откуда?»',
        actions: [
          { text: '• Написать в чат', action: () => this.speak('Вы отправили в чат: «Всем чмоки в этом чате! Как настроение?» — чат бурлит!', [], '💬') }
        ]
      },
      'news': {
        mood: '📰',
        text: '<strong>Cyberspace Times</strong>! Новости киберпространства. Ученые спорят, вызовет ли переход в 2000 год (проблема Y2K) глобальный сбой.',
        actions: [
          { text: '• Чем опасен Y2K?', action: () => this.speak('Для меня — ничем! Я сделан из нержавеющей стали и готов жить хоть до 3000 года!', [], '🕰️') }
        ]
      },
      'anekdot': {
        mood: '😂',
        text: '<strong>Анекдот.ru 1998</strong>! Главный поставщик улыбок в офисах. Хотите свежий ретро-анекдот?',
        actions: [
          { text: '• Анекдот про модем', action: () => this.speak('Приходит мужик в магазин: «Дайте мне килобайт двадцать интернета, только посвежее, чтобы модем не подавился!»', [], '🤣') },
          { text: '• Анекдот про нового русского', action: () => this.speak('Новый русский звонит сисадмину: «Слушай, братан, мышь не пашет!» — «А вы коврик купили?» — «Конечно, персидский, ручной работы!»', [], '🎩') }
        ]
      },
      'hardware': {
        mood: '⚡',
        text: '<strong>3dfx Voodoo Zone</strong>! 12 МБ памяти, чипсет Voodoo2 и Glide API! Осторожно с разгоном шины — не спалите материнскую плату!',
        actions: [
          { text: '• Разогнать до 100 МГц!', action: () => this.speak('Кулеры загудели на максимум! Температура в норме, прирост в Quake II целых +5 FPS!', [], '🔥') }
        ]
      },
      'antivirus': {
        mood: '🛡️',
        text: '<strong>AntiVirus Lab</strong>! В сети бродит опасный вирус CIH (Чернобыль), портящий Flash BIOS! Обновите антивирусные базы!',
        actions: [
          { text: '• Проверить систему', action: () => {
            if (window.soundSys && window.soundSys.playDing) window.soundSys.playDing();
            this.speak('Сканирование завершено: вирусов не обнаружено, система Win 98 чиста!', [], '✨');
          }}
        ]
      },
      'hsr': () => this.hsrSiteReaction(url, navigateIE),
      'digicharat': {
        mood: '🎀',
        text: '<strong>Di Gi Charat Fan Club</strong>! Все 16 серий по 3 минуты, и есть русские субтитры. Дедзико передаёт фанатам: «Ня-ня-ня!»',
        actions: [
          {
            text: '• Смотреть 1-ю серию по-русски',
            action: () => {
              if (window.diGiCharatSite) window.diGiCharatSite.currentSubtitleTrack = 'rus';
              navigateIE('http://www.digicharat.net/episodes?ep=1');
            }
          },
          { text: '• Включить «Party Night»', action: () => navigateIE('http://www.digicharat.net/music') },
          { text: '• Ня! :3', action: () => this.speak('Дедзико довольно улыбнулась и выпустила лазерный луч из глаз!', [], '✨') }
        ]
      },
      'dima_webmaster': {
        mood: '👶',
        text: '<strong>DIMA\'s CYBER LAIR \'98</strong> на GeoCities! О боже, это же культовый 3D Танцующий Ребёнок! А из колонок играет MIDI «Крошка моя»!',
        actions: [
          {
            text: '• Танцевать вместе с ребенком!',
            action: () => {
              this.setAccessory('headphones', true);
              this.charEl.classList.add('bobbing');
              if (window.appIE && !window.appIE.dimaMidiPlaying) {
                const btnMidi = document.querySelector('#btn-dima-midi-toggle');
                if (btnMidi) btnMidi.click();
              }
              const btnBaby = document.querySelector('.btn-baby-speed[data-speed="chacha"]') || document.querySelector('.btn-baby-speed[data-speed="turbo"]');
              if (btnBaby) btnBaby.click();
              this.speak('Уга-чака, уга-уга! Танцуем под Руки Вверх в 1998 году! 🎵 Baby Cha-Cha зажигает!', [
                {
                  text: '• ТУРБО-РЕЖИМ танца! 🚀',
                  action: () => {
                    const btnTurbo = document.querySelector('.btn-baby-speed[data-speed="turbo"]');
                    if (btnTurbo) btnTurbo.click();
                    this.speak('Скорость на максимуме! Модем трещит от перегрузки фреймов!', [], '🔥');
                  }
                },
                {
                  text: '• Хватит танцевать',
                  action: () => {
                    this.charEl.classList.remove('bobbing');
                    this.setAccessory('headphones', false);
                    this.speak('Уф, натанцевался! Но ребенок в мониторе всё еще не устает.', [], '😅');
                  }
                }
              ], '🕺');
            }
          },
          {
            text: '• Конфиг ПК Вебмастера Димы',
            action: () => {
              const tabAbout = document.querySelector('.dima-nav-link[data-tab="about"]');
              if (tabAbout) tabAbout.click();
              this.speak('Pentium II 300 МГц, материнка ASUS P2B и 3dfx Voodoo2 12 МБ! Дима собрал настоящую ракету для Quake II!', [
                {
                  text: '• Тактика на q2dm1 «The Edge»',
                  action: () => {
                    const tabGames = document.querySelector('.dima-nav-link[data-tab="games"]');
                    if (tabGames) tabGames.click();
                    this.speak('Главное правило Quake II: хватай рельсу (Railgun) на балконе и кемпери лифт!', [], '🎯');
                  }
                }
              ], '💻');
            }
          },
          {
            text: '• Оставить отзыв в Гостевой',
            action: () => {
              const tabGb = document.querySelector('.dima-nav-link[data-tab="guestbook"]');
              if (tabGb) tabGb.click();
              setTimeout(() => {
                const nameInp = document.querySelector('#gb-inp-name');
                const uinInp = document.querySelector('#gb-inp-uin');
                const msgInp = document.querySelector('#gb-inp-msg');
                if (nameInp) nameInp.value = 'Скрепыш (Clippy 98)';
                if (uinInp) uinInp.value = '199898';
                if (msgInp) msgInp.value = 'Привет, Дима! Отличный сайт, 3D ребенок огонь! Рельса в Quake 2 решает! 📎';
                const submitBtn = document.querySelector('#btn-gb-submit');
                if (submitBtn) submitBtn.click();
              }, 150);
              this.speak('Я оставил крутой отзыв Вебмастеру Диме в его Гостевой книге от имени Скрепыша!', [], '✍️');
            }
          }
        ]
      },
      'geocities': {
        mood: '🌐',
        text: '<strong>GeoCities \'98</strong>! Мигающие гифки, пламя, тег &lt;blink&gt; и счетчик: «Вы 00042-й посетитель!». Настоящий дух Web 1.0!',
        actions: [
          { text: '• Создать свою страничку', action: () => this.speak('Откройте Блокнот, напишите &lt;h1&gt;Привет, мир!&lt;/h1&gt; и загрузите по FTP!', [], '📄') }
        ]
      },
      'retro-games': {
        mood: '🎮',
        text: 'Каталог ретро-игр Retro-Web! Все хиты от Wolfenstein 3D до классических квестов SCUMM.',
        actions: [
          { text: '• Запустить Wolf3D', action: () => window.appWolf3D && window.appWolf3D.open() }
        ]
      },
      'retro-guestbook': {
        mood: '📖',
        text: '<strong>Гостевая книга</strong>! Оставьте запись на память: «Здесь был Вася, сайт супер, ставлю 5 звезд»!',
        actions: [
          { text: '• Оставить автограф', action: () => this.speak('Скрепыш расписался в гостевой книге: «📎 Clippy was here 1998!»', [], '✍️') }
        ]
      },
      'interpedia': {
        mood: '🌐',
        text: '<strong>Интерпедия (Interpedia)</strong>! Первая в мире свободная интернет-энциклопедия! Знания обо всех технологиях и играх 1998 года — на русском и английском языках!',
        actions: [
          {
            text: '• Статья о Win 98',
            action: () => {
              if (window.appIE) {
                const ieWin = window.winManager ? window.winManager.windows.get('app_ie') : null;
                if (ieWin) window.appIE.navigate(ieWin, 'http://www.interpedia.org/wiki/windows98');
              }
              this.speak('Открываю статью о лучшей операционной системе человечества — Microslop Win 98!', [], '🖥️');
            }
          },
          {
            text: '• Switch to English',
            action: () => {
              const enBtn = document.querySelector('.interpedia-lang-btn[data-lang="en"]');
              if (enBtn) enBtn.click();
              this.speak('Switched Interpedia language to English! Enjoy free collaborative knowledge!', [], '🇬🇧');
            }
          },
          {
            text: '• Открыть в Блокноте',
            action: () => {
              const btn = document.querySelector('#btn-tool-notepad');
              if (btn) btn.click();
              this.speak('Статья экспортирована в Блокнот! Всегда готов помочь с форматированием текста!', [], '📝');
            }
          }
        ]
      },
      'libru': {
        mood: '📚',
        text: '<strong>Lib.ru: Библиотека Мошкова</strong>! Какая библиотека без главного помощника по документам? Я вижу, вы читаете книгу! Хотите, открою её в Блокноте?',
        actions: [
          {
            text: '• Открыть в Блокноте (Notepad)',
            action: () => {
              const btn = document.querySelector('.btn-libru-open-notepad');
              if (btn) btn.click();
              this.speak('Текст открыт в Блокноте! Теперь его можно редактировать или распечатать на матричном принтере!', [], '📝');
            }
          },
          {
            text: '• Цитата Стругацких',
            action: () => this.speak('«Понедельник начинается в субботу!» — девиз каждого истинного программиста и сисадмина!', [], '🐱')
          },
          {
            text: '• Сохранить в «Мои документы»',
            action: () => {
              const btn = document.querySelector('.btn-libru-save-txt');
              if (btn) btn.click();
              this.speak('Книга сохранена в «Мои документы»! На диске C: еще полно места!', [], '💾');
            }
          }
        ]
      },
      'igromania': {
        mood: '💿',
        text: '<strong>Журнал «Игромания» \'98</strong>! Обожаю этот журнал! В номере за ноябрь 1998 года — Half-Life и Fallout 2 получили «Выбор редакции»!',
        actions: [
          {
            text: '• Вставить CD Игромании',
            action: () => {
              if (window.appIgroman) window.appIgroman.open();
              this.speak('Оболочка Macromedia Director запущена с компакт-диска! Приятного чтения!', [], '💿');
            }
          },
          {
            text: '• Включить видео Turok 2',
            action: () => {
              const btn = document.querySelector('.btn-igro-select-video[data-src="content/igromania/TUROK2.mp4"]') || document.querySelector('.btn-igro-play-direct[data-src="content/igromania/TUROK2.mp4"]');
              if (btn) btn.click();
              this.speak('Мозгобур Cerebral Bore в действии на чипе 3dfx Voodoo 2! Фантастическая 3D-графика!', [], '🦖');
            }
          },
          {
            text: '• Мнение Скрепыша об играх',
            action: () => this.speak('Мой выбор редакции: Сапёр и Косынка — 100%! В них я всегда готов дать совет (хоть и не всегда полезный)!', [], '💣')
          }
        ]
      },
      'cheatcc': {
        mood: '🤫',
        text: 'Застряли на сложном боссе? <strong>Cheat Code Central</strong> спешит на помощь! Обещаю, я никому не скажу, что вы включили бессмертие! 🤐',
        actions: [
          {
            text: '• Код IDDQD для DOOM 98',
            action: () => {
              if (window.appIE && window.appIE.copyToClipboard) window.appIE.copyToClipboard('IDDQD');
              this.speak('Код <strong>IDDQD</strong> скопирован в буфер! Наберите его в DOOM 98 прямо во время игры, в английской раскладке. Бесы будут очень разочарованы.', [], '⚡');
            }
          },
          {
            text: '• Что делает F7?',
            action: () => this.speak('Во многих играх из Steam <strong>F7</strong> открывает меню разработчиков: деньги, телепорт, погода. Но в «Тени Чернобыля 98» это быстрая загрузка. Сохранитесь, прежде чем экспериментировать!', [], '🕵️')
          },
          {
            text: '• Я играю честно!',
            action: () => this.speak('Уважаю! Я тоже играю в Сапёра честно. Пиксель в углу экрана всё равно не загорается, я проверял.', [], '🏆')
          }
        ]
      },
      'winampskins': {
        mood: '🦙',
        text: '<strong>Nullsoft Winamp Skins Archive</strong>! «It really whips the llama\'s ass!» Хотите примерить новый крутой скин на плеер?',
        actions: [
          {
            text: '• Включить скин Матрицы',
            action: () => {
              if (window.appWinamp) {
                window.appWinamp.setSkin('matrix');
                window.appWinamp.open();
              }
              this.speak('Зеленый терминал активирован! Ты избранный, Нео!', [], '🕶️');
            }
          },
          {
            text: '• Включить скин Gold Luxury',
            action: () => {
              if (window.appWinamp) {
                window.appWinamp.setSkin('gold');
                window.appWinamp.open();
              }
              this.speak('Золотой Hi-Fi плеер запущен! Звук льется с кристальной аудиофильской чистотой!', [], '✨');
            }
          },
          {
            text: '• Станцевать под музыку',
            action: () => {
              this.setAccessory('headphones', true);
              this.charEl.classList.add('bobbing');
              this.speak('Скрепыш надел наушники и качает головой под биты Nullsoft!', [], '🎧');
            }
          }
        ]
      },
      'spacejam': {
        mood: '🏀',
        text: '<strong>SPACE JAM (1996)</strong>! Майкл Джордан и Looney Tunes против Монстаров! Этот сайт сделан на века — он переживет нас всех!',
        actions: [
          {
            text: '• За кого болеешь, Скрепыш?',
            action: () => this.speak('Конечно за TuneSquad! Багз Банни и Лола Банни просто разорвут инопланетян на паркете!', [], '🐰')
          },
          {
            text: '• Скачать обои Space Jam',
            action: () => {
              const btn = document.querySelector('.btn-spacejam-dl-wall');
              if (btn) btn.click();
              this.speak('Обои Space Jam сохранены! Теперь рабочий стол под защитой Майкла Джордана!', [], '⭐');
            }
          }
        ]
      },
      'icqportal': {
        mood: '🌸',
        text: '<strong>Mirabilis ICQ World</strong>! Зеленый цветочек — главный символ дружбы в интернете 90-х! Отправим кому-нибудь пейджерное сообщение?',
        actions: [
          {
            text: '• Сказать «О-оу!»',
            action: () => {
              if (window.soundSys && window.soundSys.playIcqUhOh) window.soundSys.playIcqUhOh();
              this.speak('О-оу! Тот самый легендарный звук входящего сообщения ICQ!', [], '🔔');
            }
          },
          {
            text: '• Открыть ICQ 98a',
            action: () => {
              if (window.appICQ) window.appICQ.open();
            }
          }
        ]
      },
      'y2k': {
        mood: '⚠️',
        text: '<strong>Центр тревоги: Ошибка 2000 года!</strong> Паника нарастает! Говорят, в новогоднюю ночь остановятся банки и лифты! Проверьте систему!',
        actions: [
          {
            text: '• Протестировать ПК на Y2K',
            action: () => {
              const btn = document.querySelector('.btn-y2k-run-test');
              if (btn) btn.click();
              this.speak('Тестирую регистры CMOS... Всё в порядке! Наш ПК сертифицирован как Y2K-Compliant!', [], '🛡️');
            }
          },
          {
            text: '• Скрепыш, ты боишься 2000 года?',
            action: () => this.speak('Я сделан из нержавеющей стали Office 97! Я готов встретить хоть 3000 год!', [], '😎')
          }
        ]
      },
      'fidonet': {
        mood: '📟',
        text: '<strong>FidoNet Web-Gateway</strong>! Сеть 5020 (Москва)! Ламповая сеть друзей без спама, коммерции и рекламы. Только поинты, ноды и сисопы!',
        actions: [
          {
            text: '• Привет сисопам!',
            action: () => this.speak('«SysOp спит, а почта идет!» — главный закон ночных модемных аплинков.', [], '☕')
          },
          {
            text: '• Написать в RU.GAME',
            action: () => {
              const subj = document.querySelector('#fido-new-subj');
              if (subj) subj.focus();
              this.speak('Напишите свой вопрос по прохождению Fallout 2 — на пойнтовке разберут!', [], '✉️');
            }
          }
        ]
      },
      'yandex': {
        mood: '🔴',
        text: '<strong>Яndex 1998</strong>! «Найдётся всё!». Первый отечественный поисковик с учетом русской грамматики и морфологии!',
        actions: [
          {
            text: '• Что умеет Яндекс?',
            action: () => this.speak('Яндекс знает точные склонения: найдет и «скрепку», и «скрепке», и «скрепкой»!', [], '🔍')
          },
          {
            text: '• Народная примета',
            action: () => this.speak('Если модем коннектится на 56K — быть хорошему скачиванию!', [], '🌤️')
          }
        ]
      },
      'clippy': {
        mood: '🥰',
        text: 'Ой! Это же сайт <strong>обо мне</strong>! Здесь моя биография, коллеги по Office 97 и целый гардероб: шляпы, галстуки, очки и даже усы!',
        actions: [
          { text: '• Открыть гардероб', action: () => navigateIE('http://www.clippy98.com/wardrobe') },
          { text: '• Надень что-нибудь!', action: () => this.wearRandomOutfit() },
          { text: '• Прочитать досье', action: () => navigateIE('http://www.clippy98.com') }
        ]
      },
      'advanced': {
        mood: '🧬',
        text: '<strong>3ADVANCED SOFTWORKS</strong>! Каталог из 40 программ на Flash 5 — любую можно установить и запустить прямо со страницы. Что запустим?',
        actions: [
          { text: '• DOOM 98', action: () => this.launchProgram('doom', 'appDoom') },
          { text: '• S.T.A.L.K.E.R. 98', action: () => this.launchProgram('stalker98', 'appStalker98') },
          { text: '• Medal of Honor 98', action: () => this.launchProgram('moh98', 'appMoh98') },
          { text: '• Зов Припяти 98', action: () => this.launchProgram('cop98', 'appCop98') },
          { text: '• Minecraft 98', action: () => this.launchProgram('mc98', 'appMc98') },
          { text: '• Honkai: Star Rail 98', action: () => this.launchProgram('hsr98', 'appHsr98') },
          { text: '• Dragon Age: Origins 98', action: () => this.launchProgram('dao98', 'appDao98') },
          { text: '• Star Wars: KOTOR 98', action: () => this.launchProgram('kotor98', 'appKotor98') },
          { text: '• Tekken 3 98', action: () => this.launchProgram('tekken3', 'appTekken3') },
          { text: '• Overwatch 98', action: () => this.launchProgram('ow98', 'appOw98') },
          { text: '• Sam & Max: Culture Shock', action: () => this.launchProgram('sammax', 'appSamMax') },
          { text: '• Sam & Max: Situation: Comedy', action: () => this.launchProgram('sammax102', 'appSamMax102') },
          { text: '• Sam & Max: The Mole, the Mob and the Meatball', action: () => this.launchProgram('sammax103', 'appSamMax103') },
          { text: '• Sam & Max: Abe Lincoln Must Die!', action: () => this.launchProgram('sammax104', 'appSamMax104') },
          { text: '• Sam & Max: Reality 2.0', action: () => this.launchProgram('sammax105', 'appSamMax105') },
          { text: '• Sam & Max: Bright Side of the Moon', action: () => this.launchProgram('sammax106', 'appSamMax106') },
          { text: '• Sam & Max: Ice Station Santa', action: () => this.launchProgram('sammax201', 'appSamMax201') },
          { text: '• Sam & Max: Moai Better Blues', action: () => this.launchProgram('sammax202', 'appSamMax202') },
          { text: '• Back to the Future: The Game', action: () => this.launchProgram('bttf', 'appBTTF') },
          { text: '• Diablo II', action: () => this.launchProgram('diablo2', 'appDiablo2') },
          { text: '• XIII', action: () => this.launchProgram('xiii', 'appXiii') },
          { text: '• Max Payne', action: () => this.launchProgram('maxpayne', 'appMaxPayne') },
          { text: '• GTA: Нижний Сити', action: () => this.launchProgram('gtann', 'appGtaNN') },
          { text: '• Legion Arena', action: () => this.launchProgram('legion', 'appLegion') },
          { text: '• Another War', action: () => this.launchProgram('anotherwar', 'appAnotherWar') },
          { text: '• Fallout', action: () => this.launchProgram('fallout', 'appFallout') },
          { text: '• Fallout: Запорожье', action: () => this.launchProgram('falloutzp', 'appFalloutZP') },
          { text: '• Хаято, Где плов?', action: () => this.launchProgram('plov', 'appPlov') },
          { text: '• The Sims 3', action: () => this.launchProgram('sims3', 'appSims3') },
          { text: '• Forza Horizon: Рига', action: () => this.launchProgram('forza', 'appForza') },
          { text: "• GTA: Екатеринбург '90", action: () => this.launchProgram('gta90', 'appGta90') },
          { text: '• Half-Life 2', action: () => this.launchProgram('hl2', 'appHl2') },
          { text: '• Quake III Arena', action: () => this.launchProgram('quake3', 'appQuake3') },
          { text: '• Dota 98', action: () => this.launchProgram('dota', 'appDota') },
          { text: '• Аватар: Тихий цикл', action: () => this.launchProgram('avatar98', 'appAvatar98') },
          { text: '• Раздел игр', action: () => navigateIE('http://www.3advanced.com/games') }
        ]
      },
      'blender': {
        mood: '🧊',
        text: '<strong>Blender 2.04</strong> от Not a Number! Бесплатный 3D-пакет на 2.9 МБ, а внутри — целый игровой движок. Установим?',
        actions: [
          { text: '• Скачать и запустить Blender 2.04', action: () => this.launchProgram('blender204', 'appBlender204') },
          { text: '• Горячие клавиши', action: () => {
            navigateIE('http://www.blender3d.com/tutorials');
            this.speak('Правая кнопка мыши выделяет, левая ставит 3D-курсор. SPACE — меню инструментов, Tab — режим редактирования, F12 — рендер, P — запустить игру!', [], '⌨️');
          }}
        ]
      },
      'poligon': () => this.poligonReaction(),
      'youvid': () => this.youvidReaction(),
      'themeworld': {
        mood: '🎨',
        text: '<strong>ThemeWorld \'98</strong>! Пора преобразить ваш рабочий стол! Заставки с падающими буквами Матрицы и темы Microslop Plus! 98!',
        actions: [
          {
            text: '• Включить заставку Матрицы',
            action: () => {
              if (window.themeWorldSite && window.themeWorldSite.applyScreensaver) {
                window.themeWorldSite.applyScreensaver('matrix');
              }
              this.speak('Зеленый цифровой дождь Матрицы активирован!', [], '🕶️');
            }
          },
          {
            text: '• Поставить космические обои',
            action: () => {
              if (window.themeWorldSite && window.themeWorldSite.applyWallpaper) {
                window.themeWorldSite.applyWallpaper('space');
              }
              this.speak('Рабочий стол преобразился в глубокий космос!', [], '🚀');
            }
          }
        ]
      },
      'fargus': {
        mood: '🐟',
        text: '<strong>«Фаргус Мультимедиа»</strong>! «Только полный и качественный перевод». BFG 9000 у них, например, «Большая Фиговина».',
        actions: [
          {
            text: '• Послушать «Охлади траханье»',
            action: () => {
              if (window.fargusSite) window.fargusSite.playQuoteTone('cool');
              this.speak('Профессиональный актёр театра. Говорят, сорок дублей.', [], '🎭');
            }
          },
          {
            text: '• Фраза «Потрачено»',
            action: () => {
              if (window.fargusSite) window.fargusSite.playQuoteTone('wasted');
              this.speak('Коротко и по-русски. Так в «Великом автоугоне» сообщают о гибели героя.', [], '💀');
            }
          },
          {
            text: '• Скачать файл для DOOM 98',
            action: () => {
              const file = window.fargusSite && window.fargusSite.savePatch('FARGUS_DOOM98_RUS.TXT');
              this.speak(file ? `${file} лежит в «Мои документы\\Downloads». Коды там по-английски, игра других не понимает.` : 'Сайт «Фаргуса» не отвечает.', [], '💾');
            }
          },
          {
            text: '• Голос за «Великий автоугон»',
            action: () => {
              if (window.fargusSite) window.fargusSite.saveVote('gta90');
              this.openInIE('http://www.goldfargus.ru/vote');
              this.speak('Голос отдан. «Потрачено» должно победить!', [], '🏆');
            }
          }
        ]
      },
      'molotok': {
        mood: '🔨',
        text: '<strong>Молоток \'98</strong>! Минута на ваших часах здесь равна часу торгов. Кто зевнул, тот без Voodoo 2.',
        actions: [
          {
            text: '• Ставка на Voodoo 2',
            action: () => {
              const res = window.molotokSite ? window.molotokSite.placeBid('voodoo2') : null;
              this.openInIE('http://www.molotok98.ru/lot?id=voodoo2');
              this.speak(res ? `${res.msg} У других участников стоят роботы, они перебивают на шаг.` : 'Аукцион не отвечает.', [], '🔥');
            }
          },
          {
            text: '• Купить мышь Genius сразу',
            action: () => {
              const res = window.molotokSite ? window.molotokSite.buyNow('genius_mouse') : null;
              this.openInIE('http://www.molotok98.ru/mybids');
              this.speak(res ? res.msg : 'Аукцион не отвечает.', [], '🎉');
            }
          },
          {
            text: '• Какой курс доллара?',
            action: () => this.speak('На «Молотке» считают 1 у.е. за 20 рублей 50 копеек. Торгуйтесь аккуратно!', [], '💵')
          }
        ]
      },
      'xakep': {
        mood: '🕶️',
        text: '<strong>Журнал «Хакер \'98»</strong>! Осторожнее с AT-командами модема, не спалите линию. А кейген играет отличную музыку.',
        actions: [
          {
            text: '• Включить музыку кейгена',
            action: () => {
              if (window.xakepSite) window.xakepSite.toggleChiptune(document.querySelector('#btn-toggle-music'));
              this.setAccessory('headphones', true);
              this.charEl.classList.add('bobbing');
              this.speak('Восемь бит, три ноты, и я уже хакер!', [], '🎧');
            }
          },
          {
            text: '• Сгенерировать ключ',
            action: () => {
              const key = window.xakepSite ? window.xakepSite.generateKey('arjcmd', 'Скрепыш') : '';
              this.speak(`Ключ для ARJ Commander 98 на имя Скрепыш: <b>${key}</b>. Подходит только к программе, которой не существует.`, [], '✨');
            }
          },
          {
            text: '• Статья про модем в Блокноте',
            action: () => {
              const site = window.xakepSite;
              const art = site && site.getArticles().find(a => a.id === 'modem');
              if (art && window.appNotepad) window.appNotepad.open(art.file, site.articleText(art));
              this.speak('Открыл. Строку инициализации вписывайте в свойства модема.', [], '📝');
            }
          }
        ]
      },
      'mult': {
        mood: '🎨',
        text: '<strong>Мульт.ру</strong>! Масяня и Хрюндель. Новая серия про проблему 2000 года, очень жизненная.',
        actions: [
          {
            text: '• Смотреть новую серию',
            action: () => {
              this.openInIE('http://www.mult98.ru');
              setTimeout(() => {
                const btn = document.querySelector('.mult-btn-play');
                if (btn) btn.click();
              }, 700);
              this.speak('Включаю. Звук погромче!', [], '🍿');
            }
          },
          {
            text: '• Цитата «Пошли пить чай»',
            action: () => {
              if (window.multSite) window.multSite.speakLine('mas', 'Всё, начальник при деле. Пошли пить чай.');
              this.speak('«Всё, начальник при деле. Пошли пить чай.» Лучший план на понедельник.', [], '☕');
            }
          },
          {
            text: '• Масяню на рабочий стол',
            action: () => {
              const ok = window.multSite && window.multSite.setWallpaper('kitchen');
              this.speak(ok ? 'Готово! Вернуть старые обои можно в свойствах экрана.' : 'Обои не встали. Попробуйте кнопку на странице «Обои и звуки».', [], '🖼️');
            }
          }
        ]
      },
      'emuland': {
        mood: '🕹️',
        text: '<strong>Emu-Land</strong>! Картриджи Dendy и Sega. Помните код Konami: Вверх, Вверх, Вниз, Вниз, Влево, Вправо, Влево, Вправо, B, A?',
        actions: [
          {
            text: '• Скачать Танчики',
            action: () => {
              const file = window.emuLandSite && window.emuLandSite.downloadRom('battlecity');
              this.speak(file ? `${file} в папке Downloads. Защищайте штаб с орлом!` : 'Архив не отвечает.', [], '🎮');
            }
          },
          {
            text: '• Код на 30 жизней в Contra',
            action: () => {
              this.openInIE('http://www.emuland98.ru/rom?id=contra');
              this.speak('На заставке: Вверх, Вверх, Вниз, Вниз, Влево, Вправо, Влево, Вправо, B, A, Start. 30 жизней ваши.', [], '👾');
            }
          },
          {
            text: '• Скачать Mortal Kombat 3',
            action: () => {
              const file = window.emuLandSite && window.emuLandSite.downloadRom('umk3');
              this.speak(file ? `${file} сохранён. Нужен эмулятор Genecyst.` : 'Архив не отвечает.', [], '🥋');
            }
          }
        ]
      },
      'xfiles': {
        mood: '👽',
        text: '<strong>Истина где-то рядом</strong>! В документах чёрные полосы. Ключ я знаю: город, где в 1947 году нашли обломки.',
        actions: [
          {
            text: '• Ввести ROSWELL',
            action: () => {
              const site = window.xFilesSite;
              if (site && site.tryCode('ROSWELL')) site.playSpookyTone();
              this.openInIE('http://www.xfiles98.ru/case?id=urals');
              this.speak('Полосы сняты во всех делах. Открыта особая папка 1947-URALS.', [], '🛸');
            }
          },
          {
            text: '• Досье в Блокнот',
            action: () => {
              const site = window.xFilesSite;
              if (site && site.decrypted && window.appNotepad) {
                window.appNotepad.open('DOSSIER_1947.TXT', site.dossierText());
                this.speak('Досье открыто. Никому не показывайте!', [], '📝');
              } else {
                this.speak('Сначала снимите гриф: введите ROSWELL в дешифраторе.', [], '🔒');
              }
            }
          },
          {
            text: '• Я верю в НЛО!',
            action: () => {
              if (window.xFilesSite) window.xFilesSite.savePollVote('sawUfo');
              this.openInIE('http://www.xfiles98.ru/reports');
              this.speak('Ответ записан. Петрович_астроном уже пишет, что это спутник.', [], '👽');
            }
          }
        ]
      }
    };

    let reaction = siteReactions[pageKey];
    if (!reaction && pageKey.startsWith('retro-')) {
      reaction = siteReactions['retro-guestbook'];
    }

    if (reaction) {
      setTimeout(() => {
        const current = typeof reaction === 'function' ? reaction() : reaction;
        if (!current) return;
        this.countReaction('site');
        this.speak(current.text, current.actions || [], current.mood || '🌐', 14000);
      }, 700);
    }
  }

  hsrSiteReaction(url, navigateIE) {
    const site = window.hsrSite;
    const gm = window.gameManager;
    const H = globalThis.Hsr98;
    if (!site || this.hsrQuiet) return null;
    this.hsrSeen = this.hsrSeen || new Set();
    const rerender = url === this.hsrLastUrl;
    this.hsrLastUrl = url;
    const route = site.parseUrl(url);
    const state = site.gameState();
    const page = (path) => navigateIE(site.host + path);
    const key = {
      download: `download:${state}`,
      character: `character:${route.id}`,
      article: `article:${route.id}`,
      picture: 'gallery'
    }[route.view] || route.view;
    if (rerender) this.hsrSeen.add(key);
    if (this.hsrSeen.has(key)) return null;
    const play = () => { if (gm && gm.isInstalled('hsr98')) gm.catalog.hsr98.launch(); };
    const startMsk = () => {
      this.hsrSeen.add('download:downloading');
      site.mirror = 'msk';
      site.startDownload('msk');
    };
    const mirrorTip = () => {
      this.hsrSeen.add('download:none');
      this.speak('На модеме 56K быстрее всех зеркало в Москве: 5,1 КБ/с, около десяти минут. Шанхай дальше, днём он перегружен.', [
        { text: '• Загрузить с Москвы', action: () => startMsk() },
        { text: '• Я выберу сам', action: () => {} }
      ], '📡');
    };
    const primary = {
      none: { text: '• Помогите загрузить', action: () => { page('/download'); mirrorTip(); } },
      downloading: { text: '• Показать окно загрузки', action: () => site.dl && window.winManager.bringToTop(site.dl.winId) },
      installer: { text: '• Запустить установку', action: () => site.openSetup() },
      installed: { text: '• Играть', action: play }
    }[state];
    const quiet = {
      text: '• Я сам разберусь',
      action: () => {
        this.hsrQuiet = true;
        this.speak('Понял. На этом сайте молчу. Если что, я в углу.', [], '🤐', 5000);
      }
    };
    const pity = H && H.TUNING ? H.TUNING.pity5 * H.TUNING.warpCost : 9600;
    const CHAR_LINES = {
      trail: ['Первопроходец проснулся без памяти. Со мной так каждый раз, когда меня снимают с задачи в Диспетчере.', '😵'],
      march: ['Март 7 фотографирует всё, что хочет запомнить. Я тоже храню моменты: у меня в папке Actors есть дневник.', '📷'],
      himeko: ['Химико варит кофе на весь Экспресс. Mother Nature напомнила бы выключить кофеварку на ночь.', '☕'],
      herta: ['Герта делает кукол самой себя. Похоже, в Редмонде с помощниками поступают так же: рисуют новых.', '🎎'],
      sampo: ['Сампо продаёт слухи. Хорошо, что Hoverbot не знает про этот сайт. Он бы открыл лавку по соседству.', '🗞️'],
      pela: ['Пела ведёт протоколы разведки. Если ей понадобится шаблон отчёта, у меня их двадцать.', '📋'],
      clara: ['Огромный робот работает у маленькой девочки. Сварога даже звать не надо, он и так рядом. Уважаю.', '🤖'],
      ruanmei: [`Жуань Мэй сейчас в прыжке события. Я посчитал: гарант стоит ${pity.toLocaleString('ru-RU')} нефрита. Как три лицензии Office.`, '🌸'],
      phrolova: [`Фролова дирижирует Гекатой из оперного зала. Шанс на неё 50%, поэтому полный гарант стоит ${(pity * 2).toLocaleString('ru-RU')} нефрита.`, '🎻'],
      scar: ['Скар рассказывает сказки про ягнят и улыбается до ушей. Я тоже всегда улыбаюсь, но мне почему-то верят больше.', '🐑'],
      seele: [`Зеле тоже в прыжке события. Гарант ${pity.toLocaleString('ru-RU')} нефрита, героя можно сменить в любой момент.`, '🦋'],
      yu: [`Ю Наруками носит в себе сразу несколько Персон и меняет их прямо в бою. Шанс на него 50%, поэтому полный гарант стоит ${(pity * 2).toLocaleString('ru-RU')} нефрита.`, '🃏'],
      kanji: ['Канджи вяжет зайчиков и дерётся складным стулом. Уважаю такой разброс навыков. Я тоже умею и письма писать, и таблицы считать.', '🧶'],
      rise: ['Рисе заранее говорит, кого ударит враг. Я тоже заранее вижу, что вы пишете письмо. Почему-то её за это любят больше.', '🎤'],
      yosuke: ['Ёсуке добивает каждого врага, которого пробил другой. Как я: кто бы ни начал письмо, заканчиваю его я.', '🎧'],
      chie: ['Чие любит мясо и кунг-фу. А я люблю скрепки и Справку. У каждого своё.', '🥋'],
      yukiko: ['Юкико лечит отряд, пока враги горят. Говорят, от плохой шутки она смеётся минут десять. Мне бы такого зрителя.', '🔥'],
      lynx: ['Рысь уходит за стену одна, потому что говорить с людьми утомительно. Я её понимаю: меня тоже часто просят просто помолчать.', '⛺'],
      luka: ['У Луки механическая рука и золотой пояс в планах. Я тоже работаю одной скрепкой, и ничего, справляюсь.', '🥊'],
      sushang: ['Сушан делает одно доброе дело в день. Я делаю их сто, но мне почему-то говорят «закрой это окно».', '🗡️'],
      xueyi: ['Сюэи живёт в теле куклы и работает за полдня жизни. А я живу в папке Actors и работаю бесплатно.', '⛓️'],
      tingyun: ['Тинъюнь уговорит кого угодно. Я тоже пытался уговорить вас сохранить документ. Не вышло.', '🦊'],
      hanya: ['Ханья записывает чужие грехи кистью оракула. У меня для этого есть Журнал событий, но его никто не читает.', '🖌️'],
      qingque: ['Цинцюэ играет в кости в рабочее время и ничего не делает сверх нужного. Сочувствую её начальству.', '🀄'],
      yukong: ['Юйкун когда-то была лучшим пилотом Лофу. Я тоже когда-то был самым полезным помощником в Office.', '🪁'],
      guinaifen: ['Гуйнайфэнь глотает мечи и ведёт стримы. Подписаться на неё, к сожалению, можно только в игре.', '🔥']
    };
    const roster = site.characterIds();
    const n10 = roster.length % 10, n100 = roster.length % 100;
    const heroCount = roster.length + (n10 === 1 && n100 !== 11 ? ' герой' : n10 >= 2 && n10 <= 4 && (n100 < 12 || n100 > 14) ? ' героя' : ' героев');
    const healNames = roster.filter(id => H && H.CHARS[id].path === 'abundance').map(id => H.CHARS[id].name);
    const healers = healNames.length > 1 ? healNames.slice(0, -1).join(', ') + ' и ' + healNames[healNames.length - 1] : healNames.join('');
    let reaction = null;
    if (route.view === 'home') {
      reaction = {
        mood: '🚂',
        text: '<strong>Honkai: Star Rail 98</strong>! Похоже, вы собрались в космос? Игра бесплатная, а установщик весит всего 3,1 МБ. Дискеты не понадобятся.',
        actions: [primary, { text: '• Кто все эти люди?', action: () => page('/characters') }, quiet]
      };
    } else if (route.view === 'download') {
      reaction = {
        none: { mood: '📡', text: 'Похоже, вы выбираете зеркало. На модеме 56K быстрее всех Москва: 5,1 КБ/с. Шанхай дальше, днём он перегружен.', actions: [{ text: '• Загрузить с Москвы', action: () => startMsk() }, { text: '• Сколько ждать?', action: () => this.speak('Около десяти минут. Как раз успеете сохранить все открытые документы. Ctrl+S!', [], '⏳') }, quiet] },
        downloading: { mood: '📞', text: 'Загрузка идёт. Не снимайте трубку параллельного телефона, а то модем потеряет связь!', actions: [primary] },
        installer: { mood: '💾', text: 'StarRail98_Setup.exe уже лежит в «Мои документы\\Downloads». Запустим установку?', actions: [primary, quiet] },
        installed: { mood: '🎫', text: 'Игра уже установлена. Билет у вас на руках.', actions: [primary] }
      }[state];
    } else if (route.view === 'characters') {
      reaction = {
        mood: '👥',
        text: `${heroCount}! Похоже, вы выбираете, кого взять в команду. Лечат ${healers}.`,
        actions: [
          { text: '• Покажи Март 7', action: () => page('/characters?id=march') },
          { text: '• Кто лечит лучше?', action: () => page('/characters?id=natasha') },
          quiet
        ]
      };
    } else if (route.view === 'character' && CHAR_LINES[route.id]) {
      const [text, mood] = CHAR_LINES[route.id];
      reaction = { mood, text, actions: [] };
    } else if (route.view === 'worlds') {
      reaction = {
        mood: '❄️',
        text: 'Белобог семьсот лет живёт за стеной. Я бы столько не выдержал. Мне и в трее бывает тесно.',
        actions: [{ text: '• Кто там главный?', action: () => this.speak('Верховный хранитель Коколия. Дальше не скажу: спойлеры портят сюжет, как макровирусы документы.', [], '🤫') }]
      };
    } else if (route.view === 'play') {
      reaction = {
        mood: '⚔️',
        text: 'Очки навыка общие на всю команду. Как буфер обмена: один кладёт, другой берёт.',
        actions: [
          { text: '• А что такое пробитие?', action: () => this.speak('Бейте врага той стихией, к которой он уязвим. Шкала стойкости опустеет, и враг пропустит ход.', [], '💥') },
          { text: '• Можно с врагом поговорить?', action: () => this.speak('Можно, клавиша T. Только с боссами не выйдет. Боссы, как начальство, не слушают.', [], '💬') }
        ]
      };
    } else if (route.view === 'gallery' || route.view === 'picture') {
      reaction = {
        mood: '🖼️',
        text: 'Картины Эйдолонов собираются по кусочку, с каждой копией героя. Как мой гардероб на clippy98.com.',
        actions: [{ text: '• Показать гардероб', action: () => navigateIE('http://www.clippy98.com/wardrobe') }]
      };
    } else if (route.view === 'article' && route.id === 'v16d') {
      reaction = {
        mood: '⛽',
        text: 'Пом-Пом раздаёт талоны на топливо, а я раздаю советы. Мои, правда, бесплатные и без предела в тысячу штук.',
        actions: [{ text: '• Купонами фармить выгоднее?', action: () => this.speak('Быстрее, но не выгоднее. Опыт героям и трофеи с врагов дают только бои. Купоны берегите для скучных чашелистов.', [], '⛽') }]
      };
    } else if (route.view === 'article' && route.id === 'v16g') {
      reaction = {
        mood: '📖',
        text: 'Путеводитель Корпорации сам говорит, куда идти и что взять. Почти как моя справка по F1, только за выполненное ещё и платят.',
        actions: [{ text: '• А зачем расщеплять реликвии?', action: () => this.speak('Из ста Обломков выходит реликвия нужного набора. Это как переплавить десять скрепок в одну, но правильной формы.', [], '♻️') }]
      };
    } else if (route.view === 'article' && route.id === 'steam') {
      reaction = {
        mood: '🎮',
        text: 'Игра теперь и в Steam. Сохранения общие, ставить второй раз не нужно.',
        actions: [{ text: '• Открыть Steam', action: () => gm && gm.showInSteam('hsr98') }]
      };
    } else if (route.view === 'support') {
      reaction = {
        mood: '❓',
        text: 'Поддержка отвечает в течение дня. Я отвечаю сразу. Спросите меня?',
        actions: [
          { text: '• Спросить Скрепыша', action: () => this.ask('') },
          { text: '• Написать в поддержку', action: () => window.appOutlook && window.appOutlook.openCompose({ to: 'support@hoyoverse.com', subject: 'Вопрос по Honkai: Star Rail 98', body: '' }) }
        ]
      };
    } else if (route.view === 'guestbook') {
      const signed = site.readGuestbook().some(e => e.name === 'Скрепыш');
      reaction = signed
        ? { mood: '😊', text: 'Моя запись всё ещё здесь. Приятно, когда тебя сохраняют.', actions: [] }
        : {
          mood: '✍️',
          text: 'Похоже, вы хотите оставить запись? Могу расписаться первым.',
          actions: [
            { text: '• Распишись, Скрепыш', action: () => this.signHsrGuestbook() },
            { text: '• Не надо', action: () => {} }
          ]
        };
    } else if (route.view === 'missing') {
      reaction = {
        mood: '🚉',
        text: 'Станция не найдена. Похоже, вы сошли не на той остановке.',
        actions: [{ text: '• На главную', action: () => page('') }]
      };
    }
    if (reaction) this.hsrSeen.add(key);
    return reaction;
  }

  signHsrGuestbook() {
    const site = window.hsrSite;
    if (!site) return;
    const d = new Date();
    const date = `${String(d.getDate()).padStart(2, '0')}.${String(d.getMonth() + 1).padStart(2, '0')}.${d.getFullYear()}`;
    site.addGuestbookEntry('Скрепыш', 'Редмонд', 'Хороший сайт: всё на своих местах. Экспрессу счастливого пути! И сохраняйтесь.', date);
    if (window.appIE && window.winManager && window.winManager.windows.has('app_ie') && window.appIE.currentUrl) {
      window.appIE.renderPage(window.winManager.windows.get('app_ie'), window.appIE.currentUrl);
    }
    this.speak('Готово, я в гостевой книге. Теперь ваша очередь, если захотите.', [], '✍️', 6000);
  }

  onHsrDownloaded() {
    this.hsrSeen = this.hsrSeen || new Set();
    this.hsrSeen.add('download:installer');
    if (!this.visible || this.hsrQuiet || this.annoyance === 'quiet' || this.opt('siteReactions') === false) return;
    const site = window.hsrSite;
    this.speak('Похоже, загрузка закончилась. StarRail98_Setup.exe в «Мои документы\\Downloads». Запустим установку?', [
      { text: '• Установить', action: () => site && site.openSetup() },
      { text: '• Позже', action: () => {} }
    ], '💾');
  }

  onDocumentSaved(app, name, text, docId) {
    if (window.clippyTips) window.clippyTips.onSaved(app, name, docId, String(text || '').length);
    if (window.clippyLetters) window.clippyLetters.onSaved(app, name, text);
  }

  onDocumentDiscarded(app, name) {
    if (window.clippyLetters) window.clippyLetters.onDiscarded(app, name);
  }

  onFileDeleted(pathParts, item) {
    if (window.clippySystem) window.clippySystem.onFileDeleted(pathParts, item);
  }

  onRecycleBinEmptied(items) {
    if (window.clippySystem) window.clippySystem.onRecycleBinEmptied(items);
  }

  onShutdownDialog() {
    if (window.clippySystem) window.clippySystem.onShutdownDialog();
  }

  onEndTask() {
    if (window.clippySystem) window.clippySystem.onEndTask();
  }

  icqReply(text) {
    return window.clippySystem ? window.clippySystem.icqReply(text) : 'Привет! Это Скрепыш.';
  }

  onActorFile(name) {
    return window.clippyActors ? window.clippyActors.openFile(name) : false;
  }

  dosCommand(args) {
    return window.clippySystem ? window.clippySystem.dosCommand(args) : ['Bad command or file name: "clippy"'];
  }
}

window.appClippy = new AppClippy();
