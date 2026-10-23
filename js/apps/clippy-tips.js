class ClippyTips {
  constructor() {
    this.storageKey = 'win98_clippy_tips';
    this.state = this.load();
    this.pending = [];
    this.session = { minimizes: [], sites: 0, games: 0, notepads: 0, typed: {}, longShown: false };
    this.catalog = this.buildCatalog();
  }

  load() {
    const base = { seen: {}, muted: [], lastTipOfDay: null };
    try {
      const saved = JSON.parse(localStorage.getItem(this.storageKey) || 'null');
      if (saved && typeof saved === 'object') {
        return {
          seen: saved.seen && typeof saved.seen === 'object' ? saved.seen : {},
          muted: Array.isArray(saved.muted) ? saved.muted : [],
          lastTipOfDay: saved.lastTipOfDay || null
        };
      }
    } catch (e) {}
    return base;
  }

  save() {
    try { localStorage.setItem(this.storageKey, JSON.stringify(this.state)); } catch (e) {}
  }

  clippy() {
    return window.appClippy;
  }

  buildCatalog() {
    return {
      'save-reminder': {
        mood: '💾', anim: 'save', cooldown: 30,
        text: 'Вы давно печатаете и ни разу не сохранились. <strong>Ctrl+S</strong> — и пусть свет мигает сколько угодно.'
      },
      'many-windows': {
        mood: '🪟', cooldown: 120,
        text: 'Открыто много окон. Щёлкните правой кнопкой по панели задач и выберите «Окна каскадом»: они встанут лесенкой.',
        action: { text: '▶ Окна каскадом', run: () => window.winManager && window.winManager.cascadeWindows() }
      },
      'show-desktop': {
        mood: '🖥️', cooldown: 240,
        text: 'Вы свернули несколько окон подряд. Кнопка «Показать рабочий стол» на панели быстрого запуска сворачивает всё одним щелчком.',
        action: { text: '▶ Свернуть все окна', run: () => window.winManager && window.winManager.minimizeAll() }
      },
      'boss-key': {
        mood: '🤫', cooldown: 1440,
        text: 'Игра в рабочее время? Щёлкните по мне правой кнопкой и выберите «Шеф идет!»: я сверну все игры и открою отчёт в Excel.'
      },
      'long-session': {
        mood: '👀', cooldown: 60,
        text: 'Вы за компьютером уже час. Правило 20-20-20: каждые 20 минут смотрите 20 секунд на что-нибудь далёкое. Не на меня, я близко.'
      },
      'night': {
        mood: '🌙', cooldown: 600,
        text: 'Уже за полночь. Сохраните всё и ложитесь спать: модем никуда не денется, а я посторожу рабочий стол.'
      },
      'bin-full': {
        mood: '🗑️', cooldown: 720,
        text: 'В Корзине уже много файлов. Если они точно не нужны, очистка освободит место на диске C:.',
        action: { text: '▶ Открыть Корзину', run: () => window.appRecycleBin && window.appRecycleBin.open() }
      },
      'ie-favorites': {
        mood: '⭐', cooldown: 1440,
        text: 'Вы обошли полсети! В меню «Избранное» Internet Explorer уже собраны адреса лучших сайтов 1998 года, их не нужно набирать руками.'
      },
      'notepad-f5': {
        mood: '🕒', cooldown: 4320,
        text: 'В Блокноте клавиша F5 вставляет текущие дату и время. Удобно для дневника и протоколов.'
      },
      'ask-f1': {
        mood: '❓', cooldown: 4320,
        text: 'Нажмите F1 на рабочем столе, и я спрошу, что вы хотите сделать. Отвечать можно своими словами: «сменить обои», «где игры».'
      },
      'fargus-voice': {
        mood: '🐟', cooldown: 360,
        text: 'Любите играть на русском? У <strong>«Фаргус Мультимедиа»</strong> всё «полностью на русском языке», даже BFG 9000.',
        action: { text: '▶ Открыть «Фаргус»', run: () => window.appClippy && window.appClippy.openInIE('http://www.goldfargus.ru') }
      },
      'molotok-lots': {
        mood: '🔨', cooldown: 360,
        text: 'Ищете 3dfx Voodoo 2? На аукционе <strong>Молоток \'98</strong> торги идут быстро: минута там равна часу.',
        action: { text: '▶ Открыть «Молоток»', run: () => window.appClippy && window.appClippy.openInIE('http://www.molotok98.ru') }
      },
      'xakep-zine': {
        mood: '🕶️', cooldown: 360,
        text: 'Модем не держит 33600? В <strong>журнале «Хакер \'98»</strong> есть строка инициализации для плохих линий.',
        action: { text: '▶ Читать «Хакер»', run: () => window.appClippy && window.appClippy.openInIE('http://www.xakep98.ru') }
      },
      'mult-episodes': {
        mood: '🎨', cooldown: 360,
        text: 'Время сделать перерыв! На <strong>Мульт.ру</strong> вышла новая серия про Масяню и проблему 2000 года.',
        action: { text: '▶ Смотреть Масяню', run: () => window.appClippy && window.appClippy.openInIE('http://www.mult98.ru') }
      },
      'emuland-games': {
        mood: '🕹️', cooldown: 360,
        text: 'Хотите вспомнить Танчики и Контру? В архиве <strong>Emu-Land</strong> собраны дампы любимых картриджей Dendy и Sega!',
        action: { text: '▶ Открыть Emu-Land', run: () => window.appClippy && window.appClippy.openInIE('http://www.emuland98.ru') }
      },
      'xfiles-ufo': {
        mood: '👽', cooldown: 360,
        text: 'Видели странные огоньки в ночном небе? В архиве <strong>«Истина где-то рядом»</strong> собирают рассекреченные досье НЛО!',
        action: { text: '▶ Открыть досье', run: () => window.appClippy && window.appClippy.openInIE('http://www.xfiles98.ru') }
      },
      'muzzone-mtv': {
        mood: '🎸', cooldown: 360,
        text: 'Ищете аккорды «Выхода нет» или разбор клипов MTV? На <strong>«МузЗоне \'98»</strong> можно сохранить табулатуру в Блокнот и собрать плейлист .M3U для Winamp!',
        action: { text: '▶ Открыть «МузЗону \'98»', run: () => window.appClippy && window.appClippy.openInIE('http://www.muzzone98.ru') }
      },
      'svodka-99': {
        mood: '📰', cooldown: 360,
        text: 'Хотите узнать, чем живёт страна за три дня до 2000 года? В интернет-газете <strong>«Сводка.ру \'99»</strong> (<code>www.svodka99.ru</code>) есть суточная лента, справочная из 18 карточек, курсы ЦБ с калькулятором (26,95 за доллар) и памятка к ночи двух нулей. А телеграмму в редакцию телеграф сам перепишет с ТЧК и ЗПТ!',
        action: { text: '▶ Открыть «Сводку.ру \'99»', run: () => window.appClippy && window.appClippy.openInIE('http://www.svodka99.ru') }
      },
      'carman-99': {
        mood: '🎹', cooldown: 360,
        text: 'Любите «Лондон, гуд-бай!», «Сан-Франциско» и «Чио-Чио-сан»? На фан-сайте <strong>«Кар-Мэн \'99»</strong> (<code>www.carman99.ru</code>) есть треклисты всех альбомов, карта городов из песен и вкладыши для кассет, которые открываются в Блокноте.',
        action: { text: '▶ Открыть «Кар-Мэн \'99»', run: () => window.appClippy && window.appClippy.openInIE('http://www.carman99.ru') }
      },
      'kish-99': {
        mood: '🎸', cooldown: 360,
        text: 'Ищете аккорды «Прыгну со скалы» или «Куклы колдуна»? В трактире <strong>«Король и Шут \'99»</strong> (<code>www.kish99.ru</code>) есть дворовый песенник с переключателем тональности, карта сказочного леса и вкладыши для кассет.',
        action: { text: '▶ Открыть «Король и Шут \'99»', run: () => window.appClippy && window.appClippy.openInIE('http://www.kish99.ru') }
      },
      'prodigy-99': {
        mood: '🎧', cooldown: 360,
        text: 'Купили на Горбушке «новый альбом Prodigy 1999»? В рейв-бункере <strong>«The Prodigy \'99»</strong> (<code>www.prodigy99.ru</code>) детектор фейков раскроет, чей это трек на самом деле, а в лаборатории сэмплов можно набить бит на пэдах.',
        action: { text: '▶ Открыть «The Prodigy \'99»', run: () => window.appClippy && window.appClippy.openInIE('http://www.prodigy99.ru') }
      },
      'lucasarts-scumm': {
        mood: '🐰', cooldown: 360,
        text: 'Застряли в <strong>Sam &amp; Max</strong> или <strong>LucasQuest 98</strong>? На сайте <strong>LucasArts</strong> есть линия подсказок 1-900-740-JEDI: три подсказки на каждую загадку, от намёка до решения.',
        action: { text: '▶ Открыть LucasArts', run: () => window.appClippy && window.appClippy.openInIE('http://www.lucasarts.com') }
      },
      'gsc-zone': {
        mood: '☢️', cooldown: 360,
        text: 'Собираетесь за Периметр? На узле <strong>GSC Game World</strong> (<code>www.gsc-game.com</code>) есть досье всех трёх игр <strong>S.T.A.L.K.E.R.</strong>, стенд проверки аномалий болтом М12 и пошаговые сводки по Кордону, Свалке, Затону и комнате №26 в Припяти!',
        action: { text: '▶ Открыть GSC Game World', run: () => window.appClippy && window.appClippy.openInIE('http://www.gsc-game.com') }
      },
      'valve-cabal': {
        mood: '🔧', cooldown: 360,
        text: 'Загляните на сайт <strong>Valve Software</strong> (<code>www.valvesoftware.com</code>): там страницы <strong>Half-Life 98</strong>, <strong>Half-Life 2</strong>, <strong>Steam</strong> и <strong>Dota 98</strong>, пресс-релизы, почта с ответами разработчиков и испытательная камера λ. Сколько ракет нужно на страйдера? Там посчитают!',
        action: { text: '▶ Открыть Valve Software', run: () => window.appClippy && window.appClippy.openInIE('http://www.valvesoftware.com') }
      },
      'ferrum-lab': {
        mood: '🔧', cooldown: 360,
        text: 'Разгоняете <strong>Celeron 300A</strong> до 450 МГц или защищаете Flash BIOS от вируса <strong>CIH</strong>? В <strong>«Железном Цехе \'98»</strong> есть схема изоляции контакта B21, стенд FPS и прайс Савёловского и Митино!',
        action: { text: '▶ Открыть «Железный Цех \'98»', run: () => window.appClippy && window.appClippy.openInIE('http://www.ferrum98.ru') }
      },
      'blizzard-bnet': {
        mood: '⚔️', cooldown: 360,
        text: 'Ищете рунные слова для <strong>Diablo II</strong> или новости о грядущем <strong>Warcraft</strong>? На сайте <strong>Blizzard Entertainment</strong> (<code>www.blizzard.com</code>) есть кузница рун, свитки Декарда Каина и казарма отрядов Азерота!',
        action: { text: '▶ Открыть Blizzard.com', run: () => window.appClippy && window.appClippy.openInIE('http://www.blizzard.com') }
      },
      'sunsetvalley-sims': {
        mood: '🏡', cooldown: 360,
        text: 'Выбираете участок в <strong>The Sims 3</strong> или рецепт Амброзии? На узле <strong>Сансет Вэлли и бюро Maxis</strong> (<code>www.sunsetvalley98.com</code>) есть интерактивный кадастр 39 участков, перепись 10 семей и паспортный стол CAS с печатью анкеты в Блокнот!',
        action: { text: '▶ Открыть Сансет Вэлли', run: () => window.appClippy && window.appClippy.openInIE('http://www.sunsetvalley98.com') }
      },
      'bioware-rpg': {
        mood: '🐉', cooldown: 360,
        text: 'Готовитесь к Посвящению Серых Стражей в <strong>Dragon Age: Origins 98</strong> или штурму базы ситхов на Тарисе в <strong>Star Wars: KOTOR 98</strong>? На портале <strong>BioWare Edmonton</strong> (<code>www.bioware98.com</code>) можно собрать матрицу тактики отряда, рассчитать билд d20 и сыграть партию в Пазаак!',
        action: { text: '▶ Открыть BioWare Edmonton', run: () => window.appClippy && window.appClippy.openInIE('http://www.bioware98.com') }
      },
      'softstore-esheep': {
        mood: '🐑', cooldown: 360,
        text: 'В каталоге <strong>SoftStore \'98</strong> бесплатно раздают <strong>eSheep 98 (Sheep.exe)</strong>. Скачайте овечку По — её можно перетаскивать мышью на заголовки окон или прямо на меня!',
        action: { text: '▶ Страница eSheep 98', run: () => window.appClippy && window.appClippy.openInIE('http://www.softstore98.com/product?id=esheep') }
      },
      'office-games-cd': {
        mood: '💿', cooldown: 360,
        text: 'Через значок CD-ROM в трее можно вставить в привод D: сборник <strong>«Офисные игры ’98»</strong>: восемь игр от «Цветных Линий 98» до «Гонок на креслах» с маскировкой под Excel по клавише <strong>F12</strong>!',
        action: {
          text: '▶ Открыть «Офисные игры ’98»',
          run: () => {
            if (window.vfs && (!window.vfs.cdRomState || window.vfs.cdRomState.discId !== 'office_games_98') && typeof window.vfs.insertCdRom === 'function') {
              window.vfs.insertCdRom('D:', 'office_games_98');
            }
            if (window.appOfficeLauncher) window.appOfficeLauncher.open();
          }
        }
      },
      'neko-pet': {
        mood: '🐈', cooldown: 360,
        text: 'В папке <code>C:\\WINDOWS\\NEKO.EXE</code> живёт экранный кот <strong>Neko 98</strong>! Его можно таскать за шкирку, перекрашивать в корзинке и перекидываться с ним моими бумажными шариками.',
        action: {
          text: '▶ Выпустить Neko 98',
          run: () => window.appNeko && window.appNeko.open()
        }
      },
      'ashroad-mmo': {
        mood: '⚔️', cooldown: 360,
        text: 'В браузерной MMO <strong>«Пепельный Тракт \'98»</strong> (<code>www.ashroad98.ru</code>) берегите факел: в темноте не видно замаха врага! Выпад сбивает тяжёлый Размах, а если враг закрылся, бейте Финтом в закрытую зону. И не жадничайте с мешком: у костра есть гонец.',
        action: {
          text: '▶ Открыть «Пепельный Тракт \'98»',
          run: () => window.appClippy && window.appClippy.openInIE('http://www.ashroad98.ru')
        }
      }
    };
  }

  trigger(id) {
    const tip = this.catalog[id];
    if (!tip || this.state.muted.includes(id)) return false;
    if (this.pending.some(p => p.id === id)) return false;
    const last = this.state.seen[id] || 0;
    if (Date.now() - last < (tip.cooldown || 60) * 60000) return false;
    this.state.seen[id] = Date.now();
    this.save();
    return this.deliver({ id, text: tip.text, mood: tip.mood, action: tip.action, anim: tip.anim });
  }

  deliver(entry) {
    const clippy = this.clippy();
    if (!clippy || !clippy.isRunning || !clippy.isRunning()) return false;
    const balloonMode = clippy.opt('tipsMode') === 'balloon' || clippy.annoyance === 'chaos';
    if (balloonMode && clippy.visible && clippy.annoyance !== 'quiet' && !clippy.balloonOpen()) {
      this.show(entry);
      return true;
    }
    this.pending.push(entry);
    if (this.pending.length > 4) this.pending.shift();
    clippy.setBulb(true);
    if (clippy.visible && clippy.annoyance !== 'quiet') clippy.sound('playClippyBulb');
    return true;
  }

  show(entry) {
    const clippy = this.clippy();
    if (!clippy) return;
    const actions = [];
    if (entry.action) actions.push({ text: entry.action.text, action: entry.action.run });
    if (this.pending.length) actions.push({ text: `• Следующий совет (${this.pending.length})`, action: () => this.showNext() });
    if (entry.id !== 'tip-of-day') actions.push({ text: '• Больше не показывать такой совет', action: () => this.mute(entry.id) });
    actions.push({ text: '• Спасибо', action: () => {} });
    clippy.speak(`<strong>Совет</strong><br>${entry.text}`, actions, entry.mood || '💡', 20000, entry.anim ? { anim: entry.anim } : {});
  }

  showNext() {
    const clippy = this.clippy();
    if (!clippy) return;
    if (!clippy.visible) clippy.show();
    const entry = this.pending.shift();
    clippy.setBulb(this.pending.length > 0);
    if (entry) this.show(entry);
    else clippy.sayRandomTip();
  }

  mute(id) {
    if (!this.state.muted.includes(id)) this.state.muted.push(id);
    this.save();
    const clippy = this.clippy();
    if (clippy) clippy.speak('Понял. Этот совет больше не покажу. Сбросить можно в «Параметрах помощника».', [], '👌', 5000);
  }

  reset() {
    this.state = { seen: {}, muted: [], lastTipOfDay: null };
    this.save();
  }

  tipOfDay() {
    const clippy = this.clippy();
    if (!clippy || clippy.opt('tipOfDay') === false || !clippy.isRunning()) return false;
    if (window.clippyTalk && window.clippyTalk.state.visits <= 1) return false;
    const day = new Date().toDateString();
    if (this.state.lastTipOfDay === day) return false;
    this.state.lastTipOfDay = day;
    this.save();
    const pool = clippy.tips || [];
    if (!pool.length) return false;
    this.pending.push({ id: 'tip-of-day', text: `<em>Совет дня.</em> ${pool[Math.floor(Math.random() * pool.length)]}`, mood: '💡' });
    clippy.setBulb(true);
    return true;
  }

  onWindowOpened(id) {
    const wm = window.winManager;
    if (wm && wm.windows && wm.windows.size >= 6) this.trigger('many-windows');
    const clippy = this.clippy();
    const desk = ['app_minesweeper', 'app_solitaire', 'app_freecell', 'app_pinball'];
    if (clippy && clippy.isGameWindow && clippy.isGameWindow(id) && !desk.includes(id)) {
      this.session.games++;
      if (this.session.games === 1) setTimeout(() => this.trigger('boss-key'), 9000);
    }
    if (id.startsWith('app_notepad')) {
      this.session.notepads++;
      if (this.session.notepads === 2) this.trigger('notepad-f5');
    }
  }

  onMinimize() {
    const now = Date.now();
    this.session.minimizes = this.session.minimizes.filter(t => now - t < 60000);
    this.session.minimizes.push(now);
    if (this.session.minimizes.length >= 3) this.trigger('show-desktop');
  }

  onSiteVisited(pageKey) {
    this.session.sites++;
    if (this.session.sites === 8) this.trigger('ie-favorites');
    if (pageKey === 'fargus') this.trigger('fargus-voice');
    else if (pageKey === 'molotok') this.trigger('molotok-lots');
    else if (pageKey === 'xakep') this.trigger('xakep-zine');
    else if (pageKey === 'mult') this.trigger('mult-episodes');
    else if (pageKey === 'emuland') this.trigger('emuland-games');
    else if (pageKey === 'xfiles') this.trigger('xfiles-ufo');
    else if (pageKey === 'muzzone') this.trigger('muzzone-mtv');
    else if (pageKey === 'svodka') this.trigger('svodka-99');
    else if (pageKey === 'carman') this.trigger('carman-99');
    else if (pageKey === 'kish') this.trigger('kish-99');
    else if (pageKey === 'prodigy') this.trigger('prodigy-99');
    else if (pageKey === 'lucasarts') this.trigger('lucasarts-scumm');
    else if (pageKey === 'gsc') this.trigger('gsc-zone');
    else if (pageKey === 'valve') this.trigger('valve-cabal');
    else if (pageKey === 'ferrum') this.trigger('ferrum-lab');
    else if (pageKey === 'blizzard') this.trigger('blizzard-bnet');
    else if (pageKey === 'sunsetvalley') this.trigger('sunsetvalley-sims');
    else if (pageKey === 'ashroad') this.trigger('ashroad-mmo');
    else if (pageKey === 'softstore') this.trigger('softstore-esheep');
  }

  onTyping(docId, length) {
    const base = this.session.typed[docId] || 0;
    if (length - base >= 400) {
      this.session.typed[docId] = length;
      this.trigger('save-reminder');
    }
  }

  onSaved(app, name, docId, length) {
    if (docId) this.session.typed[docId] = length || 0;
  }

  onBinCount(count) {
    if (count >= 8) this.trigger('bin-full');
  }

  tick(uptime) {
    const clippy = this.clippy();
    if (!clippy) return;
    if (uptime >= 3600 && !this.session.longShown) {
      this.session.longShown = true;
      this.trigger('long-session');
    }
    const hour = new Date().getHours();
    if (hour < 5 && (clippy.idleSeconds || 0) < 120) this.trigger('night');
    if (uptime === 600) this.trigger('ask-f1');
  }
}

window.clippyTips = new ClippyTips();
