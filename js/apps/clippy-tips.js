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
