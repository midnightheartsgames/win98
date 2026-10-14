class ClippyTalk {
  constructor() {
    this.storageKey = 'win98_clippy_talk';
    this.state = this.loadState();
    this.pokeTimes = [];
    this.dragTimes = [];
    this.sulkUntil = 0;
    this.hiddenAt = 0;
    this.rpsScore = { user: 0, clippy: 0 };
    this.lastJoke = -1;
    this.lastRiddle = -1;
    this.nodes = this.buildNodes();
  }

  defaultState() {
    return {
      affinity: 0, visits: 0, talks: 0, lastVisit: 0, arc: 0, arcVisit: 0, hideCount: 0, rpsWins: 0,
      saves: 0, kills: 0, killedAt: 0, letters: 0, questions: 0, reactions: { app: 0, site: 0 },
      mails: [], diary: [], dayKey: '', flags: {}, seen: {}
    };
  }

  loadState() {
    const base = this.defaultState();
    try {
      const raw = localStorage.getItem(this.storageKey);
      if (!raw) return base;
      const saved = JSON.parse(raw);
      return {
        ...base,
        ...saved,
        reactions: { ...base.reactions, ...(saved.reactions || {}) },
        mails: Array.isArray(saved.mails) ? saved.mails : [],
        diary: Array.isArray(saved.diary) ? saved.diary : [],
        flags: { ...(saved.flags || {}) },
        seen: { ...(saved.seen || {}) }
      };
    } catch (e) {
      return base;
    }
  }

  saveState() {
    try {
      localStorage.setItem(this.storageKey, JSON.stringify(this.state));
    } catch (e) {}
    const clippy = this.clippy();
    if (clippy && clippy.updateTray) clippy.updateTray();
  }

  clippy() {
    return window.appClippy;
  }

  hasFlag(name) {
    return Boolean(this.state.flags[name]);
  }

  setFlag(name) {
    this.state.flags[name] = true;
    this.saveState();
  }

  adjustAffinity(delta) {
    this.state.affinity = Math.max(-10, Math.min(20, this.state.affinity + delta));
    this.saveState();
  }

  tier() {
    const a = this.state.affinity;
    if (a <= -3) return 'cold';
    if (a < 5) return 'neutral';
    if (a < 12) return 'warm';
    return 'friend';
  }

  partOfDay(date = new Date()) {
    const h = date.getHours();
    if (h >= 5 && h < 12) return 'morning';
    if (h >= 12 && h < 18) return 'day';
    if (h >= 18 && h < 23) return 'evening';
    return 'night';
  }

  arcRequirements() {
    return [
      { talks: 2, affinity: -10 },
      { talks: 4, affinity: 2 },
      { talks: 6, affinity: 4 },
      { talks: 8, affinity: 6 },
      { talks: 10, affinity: 6 },
      { talks: 12, affinity: 6, session: true },
      { talks: 14, affinity: 6, session: true },
      { talks: 16, affinity: 6, session: true },
      { talks: 18, affinity: 4, session: true }
    ];
  }

  arcReady() {
    const req = this.arcRequirements()[this.state.arc];
    if (!req) return false;
    if (req.session && this.state.visits <= (this.state.arcVisit || 0)) return false;
    return this.state.talks >= req.talks && this.state.affinity >= req.affinity;
  }

  arcNodeId() {
    return `arc${this.state.arc + 1}`;
  }

  arcTopic() {
    const topics = ['Что-то ты грустный...', 'Что-то ты грустный...', 'Что-то ты грустный...', 'Что-то ты грустный...', 'Что-то ты грустный...',
      'Что нового в Office 2000?', 'Кто там скребётся?', 'Ты какой-то задумчивый', 'Пришло письмо из Редмонда?'];
    return `• ${topics[this.state.arc] || topics[0]}`;
  }

  advanceArc(stage) {
    if (this.state.arc >= stage) return;
    this.state.arc = stage;
    this.state.arcVisit = this.state.visits;
    this.saveState();
    if (stage <= 8) this.diary(`arc${stage}`);
    if (stage === 1 && window.clippyActors) window.clippyActors.addRockyFile();
    const clippy = this.clippy();
    if (clippy && clippy.updateTray) clippy.updateTray();
  }

  diary(id) {
    if (window.clippyLetters) window.clippyLetters.diary(id);
  }

  deliverMail(id) {
    if (window.clippyLetters) window.clippyLetters.deliverMail(id);
  }

  countReaction(kind) {
    this.state.reactions = this.state.reactions || { app: 0, site: 0 };
    this.state.reactions[kind] = (this.state.reactions[kind] || 0) + 1;
    this.saveState();
  }

  countQuestion() {
    this.state.questions = (this.state.questions || 0) + 1;
    this.saveState();
  }

  rocky(method, ...args) {
    const actors = window.clippyActors;
    if (actors && typeof actors[method] === 'function') actors[method](...args);
  }

  isSulking() {
    return Date.now() < this.sulkUntil;
  }

  resolve(value) {
    return typeof value === 'function' ? value.call(this, this.state) : value;
  }

  play(id) {
    const node = this.nodes[id];
    const clippy = this.clippy();
    if (!node || !clippy) return false;

    this.state.seen[id] = (this.state.seen[id] || 0) + 1;
    this.saveState();

    if (node.enter) node.enter.call(this, this.state);
    this.applyBeat(this.resolve(node.beat));

    const options = (this.resolve(node.options) || [])
      .filter(opt => !opt.when || opt.when.call(this, this.state))
      .map(opt => ({
        text: this.resolve(opt.text),
        danger: opt.danger,
        action: () => this.choose(opt)
      }));

    const duration = node.duration !== undefined ? node.duration : (options.length ? 20000 : 9000);
    clippy.speak(this.resolve(node.text), options, this.resolve(node.mood) || '📎', duration);

    if (node.then) {
      const speakId = clippy._speakCount;
      setTimeout(() => {
        if (clippy._speakCount === speakId) this.play(node.then.to);
      }, node.then.delay || 2500);
    }
    return true;
  }

  choose(opt) {
    if (opt.affinity) this.adjustAffinity(opt.affinity);
    if (opt.flag) this.setFlag(opt.flag);
    if (opt.run) opt.run.call(this, this.state);
    if (opt.to) this.play(this.resolve(opt.to));
  }

  applyBeat(beat) {
    const clippy = this.clippy();
    if (!beat || !clippy || !clippy.charEl) return;
    const flash = (cls, ms) => {
      clippy.charEl.classList.add(cls);
      setTimeout(() => clippy.charEl.classList.remove(cls), ms);
    };
    if (beat === 'tap') clippy.tapScreen();
    if (beat === 'panic') flash('panic-shake', 1600);
    if (beat === 'bob') flash('bobbing', 4000);
    if (beat === 'sulk') flash('sulking', 6000);
    if (beat === 'blush') {
      clippy.setAccessory('blush', true);
      setTimeout(() => clippy.setAccessory('blush', false), 5000);
    }
    if (beat === 'coffee') {
      clippy.setAccessory('coffee', true);
      setTimeout(() => clippy.setAccessory('coffee', false), 8000);
    }
    if (beat === 'victory') {
      if (clippy.sound) clippy.sound('playClippyVictory');
      else if (window.soundSys && window.soundSys.playClippyVictory) window.soundSys.playClippyVictory();
    }
    const anims = ['writing', 'search', 'save', 'mail', 'trash', 'think', 'congratulate', 'wave', 'lookAround', 'stretch', 'spin'];
    if (anims.includes(beat) && clippy.animate) clippy.animate(beat);
  }

  registerVisit() {
    const now = Date.now();
    this.state.gapDays = this.state.lastVisit ? Math.floor((now - this.state.lastVisit) / 86400000) : 0;
    this.state.visits++;
    this.state.lastVisit = now;
    this.saveState();
  }

  greet() {
    this.registerVisit();
    if (this.state.visits === 1) {
      this.diary('intro');
      return this.play('intro');
    }
    const afterKill = this.afterKillNode();
    if (afterKill) return this.play(afterKill);
    const options = window.clippyOptions;
    const tamper = options && options.takeRegistryFile ? options.takeRegistryFile() : null;
    if (tamper) {
      this.tamperFile = tamper;
      return this.play('regTamper');
    }
    const day = this.todayNode();
    if (day) return this.play(day);
    if (this.partOfDay() === 'night') return this.play('greetNight');
    if (this.state.gapDays >= 3) return this.play('greetLong');
    if (this.arcReady() && this.state.arc > 0) return this.play('greetArc');
    return this.play('greetReturning');
  }

  todayNode(date = new Date()) {
    const sys = window.clippySystem;
    const node = sys && sys.todayEvent ? sys.todayEvent(date) : null;
    if (!node || !this.nodes[node]) return null;
    const key = date.toDateString();
    if (this.state.dayKey === key) return null;
    this.state.dayKey = key;
    this.saveState();
    return node;
  }

  afterKillNode() {
    if (!this.state.killedAt) return null;
    this.state.killedAt = 0;
    this.saveState();
    this.diary('firstKill');
    const kills = this.state.kills || 1;
    if (kills >= 3) return 'backAfterKill3';
    return kills === 2 ? 'backAfterKill2' : 'backAfterKill1';
  }

  openHub() {
    this.state.talks++;
    this.saveState();
    this.play('hub');
  }

  onPoke() {
    const now = Date.now();
    if (this.isSulking()) {
      this.play('sulkPoke');
      return;
    }
    this.pokeTimes = this.pokeTimes.filter(t => now - t < 5000);
    this.pokeTimes.push(now);
    const n = this.pokeTimes.length;
    if (n >= 7) {
      this.pokeTimes = [];
      this.play('pokeSulk');
    } else if (n === 5) {
      this.play('poke5');
    } else if (n === 3) {
      this.play('poke3');
    } else if (n < 3) {
      this.openHub();
    }
  }

  onDragged() {
    const now = Date.now();
    this.dragTimes = this.dragTimes.filter(t => now - t < 30000);
    this.dragTimes.push(now);
    if (this.dragTimes.length === 5) {
      this.dragTimes = [];
      this.play('dragDizzy');
    }
  }

  requestHide() {
    const shouldAsk = this.state.hideCount === 0 || Math.random() < 0.4;
    if (shouldAsk && !this.isSulking()) {
      this.play('hideAsk');
    } else {
      this.hideNow();
    }
  }

  hideNow() {
    this.state.hideCount++;
    this.saveState();
    if (this.state.hideCount === 5) this.diary('hideMany');
    const clippy = this.clippy();
    if (clippy) clippy.hide();
  }

  onHidden() {
    this.hiddenAt = Date.now();
  }

  onShown() {
    const minutes = this.hiddenAt ? Math.floor((Date.now() - this.hiddenAt) / 60000) : 0;
    this.hiddenAt = 0;
    if (this.arcReady() && this.state.arc > 0) return this.play('greetArc');
    if (minutes >= 1) {
      this.state.hiddenMinutes = minutes;
      return this.play('backLong');
    }
    return this.play('backShort');
  }

  idleChat() {
    const pool = ['idlePets', 'idleWeekend', 'idleDream', 'idleWindow'];
    const id = pool[Math.floor(Math.random() * pool.length)];
    return this.play(id);
  }

  openInNotepad(fileName, content) {
    const clippy = this.clippy();
    if (clippy) clippy.reactionsMutedUntil = Date.now() + 3000;
    if (window.appNotepad) window.appNotepad.open(fileName, content);
  }

  writeLetterFile() {
    if (window.vfs && window.vfs.writeFile) {
      try {
        window.vfs.writeFile(['My Computer', 'C:', 'My Documents'], 'Письмо от Скрепыша.txt', this.templates().letter);
      } catch (e) {}
    }
  }

  equippedHatName() {
    const w = window.clippyWardrobe;
    if (!w || !w.getEquippedId) return null;
    const id = w.getEquippedId('head');
    const item = id && w.items.find(i => i.id === id);
    return item ? item.name : null;
  }

  startRps() {
    this.rpsScore = { user: 0, clippy: 0 };
    this.play('rps');
  }

  playRps(userMove) {
    const moves = ['rock', 'scissors', 'paper'];
    const beats = { rock: 'scissors', scissors: 'paper', paper: 'rock' };
    if (Math.random() < 0.15) {
      this.rpsScore.clippy++;
      this.play('rpsCheat');
      return;
    }
    const clippyMove = moves[Math.floor(Math.random() * moves.length)];
    this.lastRps = { user: userMove, clippy: clippyMove };
    if (userMove === clippyMove) {
      this.play('rpsDraw');
    } else if (beats[userMove] === clippyMove) {
      this.rpsScore.user++;
      this.state.rpsWins++;
      this.saveState();
      this.play(this.rpsScore.user >= 3 ? 'rpsChampion' : 'rpsWin');
    } else {
      this.rpsScore.clippy++;
      this.play('rpsLose');
    }
  }

  rpsName(move) {
    return { rock: 'камень ✊', scissors: 'ножницы ✌️', paper: 'бумагу ✋' }[move];
  }

  rpsScoreLine() {
    return `Счёт: вы <strong>${this.rpsScore.user}</strong> — я <strong>${this.rpsScore.clippy}</strong>.`;
  }

  rpsMoveOptions() {
    return [
      { text: '✊ Камень', run() { this.playRps('rock'); } },
      { text: '✌️ Ножницы', run() { this.playRps('scissors'); } },
      { text: '✋ Бумага', run() { this.playRps('paper'); } }
    ];
  }

  rpsAfterOptions() {
    return [
      { text: '• Ещё раунд', to: 'rps' },
      { text: '• Хватит', to: 'rpsEnd' }
    ];
  }

  jokes() {
    return [
      'Сколько помощников Office нужно, чтобы вкрутить лампочку? Один. Но сначала он спросит, не пишете ли вы письмо.',
      'Звонок в поддержку: «У меня сломалась подставка для кофе!» — «Какая?» — «Ну та, что выезжает из компьютера по кнопке».',
      'Встречаются две скрепки. Одна говорит: «Держись!» Вторая: «Я только этим и занимаюсь».',
      'Почему Win 98 такая спокойная? Потому что в любой непонятной ситуации она просто показывает синий экран и медитирует.',
      'Программист кладёт на тумбочку два стакана. Один с водой — если захочет пить. Второй пустой — если не захочет.'
    ];
  }

  riddles() {
    return [
      {
        q: 'Щёлкает, но не орехи. Вставляется, но не ключ. Хранит ровно 1.44 МБ. Что это?',
        answers: [
          { text: 'Дискета', correct: true, reply: 'Верно! Держите её подальше от магнитов и младших братьев.' },
          { text: 'Модем', reply: 'Модем не щёлкает, он поёт! «ПИИИ-КРРР-ШШШ».' },
          { text: 'Бутерброд', reply: 'Бутерброд в дисковод уже вставляли. Сервисный центр до сих пор помнит.' }
        ]
      },
      {
        q: 'Есть хвост, но не кошка. Внутри шарик, но не пинбол. Бегает по коврику. Кто это?',
        answers: [
          { text: 'Мышь', correct: true, reply: 'Она самая! Не забывайте чистить ей шарик.' },
          { text: 'Скрепыш', reply: 'У меня нет хвоста! Есть изгиб. Это другое.' },
          { text: 'Клавиатура', reply: 'У клавиатуры хвост есть, но по коврику она не бегает. Надеюсь.' }
        ]
      },
      {
        q: 'Чем больше из неё выбрасываешь, тем больше места на диске. Что это?',
        answers: [
          { text: 'Корзина', correct: true, reply: 'Точно! Только проверьте, нет ли там курсовой.' },
          { text: 'Реестр', reply: 'Из реестра ничего выбрасывать нельзя! Потом даже «Пуск» не запустится.' },
          { text: '«Мои документы»', reply: 'Оттуда выбрасывают только в панике. И обычно зря.' }
        ]
      },
      {
        q: 'Меня не зовут, но я прихожу. Я сплю, когда вы уходите, и просыпаюсь, когда вы пишете письмо. Кто я?',
        answers: [
          { text: 'Скрепыш', correct: true, affinity: 1, reply: 'Это я! Приятно, что вы меня знаете.' },
          { text: 'Заставка', reply: 'Заставка не просыпается от письма. Она вообще не читает.' },
          { text: 'Вирус', reply: 'Вирус?! Я — сертифицированный помощник! У меня даже цифровая подпись есть. Почти.' }
        ]
      },
      {
        q: 'Утром — 33.6k, вечером — 28.8k, ночью — 56k. Что это?',
        answers: [
          { text: 'Скорость модема', correct: true, reply: 'Да! Ночью все спят, и линия свободна.' },
          { text: 'Частота процессора', reply: 'Процессор не устаёт к вечеру. В отличие от пользователя.' },
          { text: 'Курс доллара', reply: 'Курс доллара в 1998 году меняется быстрее. Не будем о грустном.' }
        ]
      }
    ];
  }

  pickIndex(length, lastKey) {
    let idx = Math.floor(Math.random() * length);
    if (length > 1 && idx === this[lastKey]) idx = (idx + 1) % length;
    this[lastKey] = idx;
    return idx;
  }

  templates() {
    return {
      vacation: `Директору ООО «Рога и Копыта»

ЗАЯВЛЕНИЕ

Прошу предоставить мне ежегодный оплачиваемый отпуск
с понедельника и до тех пор, пока я не пройду Half-Life.

Причина: компьютер работает, а у меня закончились силы.

Дата: __.__.1998          Подпись: ________

Согласовано: Скрепыш (помощник Office 97)`,
      love: `Привет!

Мне долго не хватало смелости написать. Мой UIN ты знаешь,
но в ICQ у меня каждый раз выходит только «ку».

Ты мне нравишься больше, чем модем на 56K.
Больше, чем Voodoo2. Почти как DOOM.

Если ответ «да» — поставь мне смайлик :)
Если «нет» — просто не отвечай. Я пойму. Наверное.

P.S. Письмо помог составить Скрепыш.
Он сказал, что это беспроигрышный вариант.`,
      excuse: `Начальнику отдела

ОБЪЯСНИТЕЛЬНАЯ

Опоздание на работу вызвано тем, что модем соединялся
с провайдером 40 минут, а без свежей почты
выходить из дома было нельзя.

Свёрнутое окно «Сапёра» на моём мониторе является
учебным материалом по теории вероятностей.

Вину осознаю. Файлы сохраняю регулярно.

Подпись: ________`,
      resume: `РЕЗЮМЕ

Цель: должность, где есть компьютер с Win 98.

Навыки:
- Печатаю 60 знаков в минуту (двумя пальцами)
- Знаю, где кнопка «Пуск»
- DOOM пройден на Ultra-Violence
- Настраиваю модем строкой AT&F1

Личные качества: стрессоустойчивость (есть опыт жизни после синего экрана смерти).

Рекомендации: Скрепыш, помощник Office 97.`,
      clippyResume: `РЕЗЮМЕ ДРУГА
Скрепыш (Clippit), помощник Office 97

Опыт работы: 1997 — по настоящее время, Microslop Office.

Навыки:
- Определяю, что вы пишете письмо (точность 3%)
- Знаю 14 советов наизусть
- Не сплю (почти)
- Стучу по стеклу монитора изнутри

Слабые стороны: слишком стараюсь.

Хобби: гардероб, викторины, «Косынка».

Почему я, а не собака: собаки линяют. Скрепки — нет.`,
      letter: `Дорогой пользователь!

Я помощник. Моя работа — замечать, что вы пишете письмо.
В этот раз письмо пишу я.

Спасибо, что не прятали меня в трей (ну, почти никогда).
Спасибо за разговоры, загадки и «Камень, ножницы, бумагу».

Если когда-нибудь увидите пустую галочку
«Показывать помощника» — не грустите.
Я буду в системном лотке. Я всегда там.

И сохраняйтесь. Пожалуйста. Ctrl+S.

Ваш Скрепыш
1998`
    };
  }

  templateOption(text, key, fileName, reply) {
    return {
      text,
      run() {
        this.openInNotepad(fileName, this.templates()[key]);
        this.clippy().speak(reply, [], '📝', 9000);
      }
    };
  }

  buildNodes() {
    const hubLink = { text: '• Поговорить', to: 'hub' };
    const end = (text, mood = '📎', extra = {}) => ({ text, mood, options: [], ...extra });

    return {
      intro: {
        mood: '📎', beat: 'tap',
        text: 'Привет! Я Скрепыш, ваш помощник из Office 97. Похоже, вы впервые включили этот компьютер! Показать, что здесь где?',
        options: [
          { text: '• Давай, показывай!', affinity: 1, to: 'tour1' },
          { text: '• А ты вообще кто?', to: 'about1' },
          { text: '• Я сам разберусь', to: 'introDecline' }
        ]
      },
      introDecline: {
        mood: '🙂',
        text: 'Конечно! Вы же опытный пользователь. Я просто посижу тут. В углу. Тихонечко.',
        options: [
          { text: '• Ладно, покажи', to: 'tour1' },
          { text: '• Спасибо, Скрепыш', affinity: 1, to: 'tourEnd' }
        ]
      },
      tour1: {
        mood: '🪟',
        text: 'Внизу слева — кнопка <strong>«Пуск»</strong>. Там живут все программы. Значки на рабочем столе открываются двойным щелчком.',
        options: [{ text: '• Дальше ▶', to: 'tour2' }]
      },
      tour2: {
        mood: '🕒',
        text: 'Справа внизу — часы и мой значок. Если я спрячусь, щёлкните по нему. А правая кнопка мыши по мне открывает меню.',
        options: [{ text: '• Дальше ▶', to: 'tour3' }]
      },
      tour3: {
        mood: '💾', beat: 'tap',
        text: 'И главное: сохраняйтесь! <strong>Ctrl+S</strong> — лучший друг пользователя. После меня, конечно.',
        options: [
          { text: '• Спасибо, Скрепыш!', affinity: 1, to: 'tourEnd' },
          { text: '• А поболтать с тобой можно?', to: 'hub' }
        ]
      },
      tourEnd: end('Обращайтесь! Щёлкните по мне — и я тут как тут.', '😊'),

      greetNight: {
        mood: '🌙', beat: 'coffee',
        text() {
          const d = new Date();
          const time = `${String(d.getHours()).padStart(2, '0')}:${String(d.getMinutes()).padStart(2, '0')}`;
          return `На часах ${time}... Вы тоже не спите? А я проверяю, не остыл ли процессор.`;
        },
        options: [
          { text: '• Не спится', to: 'nightTalk' },
          { text: '• Доделываю работу', to: 'nightWork' },
          hubLink
        ]
      },
      nightTalk: {
        mood: '🌙',
        text: 'Понимаю. Ночью модем соединяется быстрее — все нормальные люди спят. Может, «Косынку»?',
        options: [
          { text: '• Разложим!', run() { if (window.appSolitaire) window.appSolitaire.open(); } },
          { text: '• Просто посиди со мной', affinity: 1, to: 'nightSit' }
        ]
      },
      nightSit: end('Сижу. Заварил виртуальный кофе. Если что — я здесь.', '☕', { beat: 'coffee', duration: 12000 }),
      nightWork: end('Отчёт в такое время? Совет: сохраните его. Дважды. И на дискету тоже.', '💾'),

      greetLong: {
        mood: '🧹', beat: 'tap',
        text() { return `Вас не было ${this.state.gapDays} дн.! Я протирал экран изнутри и сторожил Корзину. Никто ничего не удалял.`; },
        options: [
          { text: '• Скучал?', to: 'greetLongMiss' },
          hubLink,
          { text: '• Привет, Скрепыш!', affinity: 1, to: 'tourEnd' }
        ]
      },
      greetLongMiss: {
        mood: '😐',
        text: 'Скучал? Помощники не скучают. Мы... ожидаем ввода. Очень долго ожидаем.',
        options: [
          { text: '• Я тоже скучал', affinity: 2, to: 'greetLongMissToo' },
          { text: '• Ну и хорошо', to: 'tourEnd' }
        ]
      },
      greetLongMissToo: end('Правда? Тогда я сохраню этот момент. Ctrl+S!', '🥹', { beat: 'blush' }),

      greetArc: {
        mood() { return this.state.arc === 6 ? '🐕' : '📨'; },
        text() {
          if (this.state.arc < 5) return 'Здравствуйте. Всё в порядке. Совсем всё в порядке. Не обращайте внимания на то письмо в трее.';
          return {
            5: 'Здравствуйте! В трее снова письмо. На этот раз я его даже не открывал. Честно.',
            6: 'Здравствуйте! Кажется, кто-то скребётся в трей. Лапой.',
            7: 'Здравствуйте. Я тут кое-что посчитал. Расскажу, если спросите.',
            8: 'Здравствуйте. Пришло письмо из Редмонда. То самое.'
          }[this.state.arc] || 'Здравствуйте! У меня новости.';
        },
        options: [
          { text() { return this.state.arc < 5 ? '• Какое письмо?' : '• Рассказывай'; }, to() { return this.arcNodeId(); } },
          hubLink
        ]
      },
      greetReturning: {
        mood() { return { cold: '😶', neutral: '📎', warm: '😊', friend: '🥰' }[this.tier()]; },
        text() {
          const hello = { morning: 'Доброе утро!', day: 'Добрый день!', evening: 'Добрый вечер!', night: 'Доброй ночи!' }[this.partOfDay()];
          return {
            cold: 'А, это вы. Здравствуйте. Скажите, если понадобится помощь. Если вообще понадобится.',
            neutral: `${hello} Win 98 загружена, я тоже. Чем займёмся?`,
            warm: `${hello} Вы вернулись! А я как раз придумал новую загадку.`,
            friend: `${hello} Мой любимый пользователь! Я держал для вас место на рабочем столе.`
          }[this.tier()];
        },
        options: [
          hubLink,
          { text: '• Дай совет', run() { this.clippy().sayRandomTip(); } },
          { text: '• Ретро-Викторина', run() { this.clippy().startQuiz(); } }
        ]
      },

      hub: {
        mood() { return { cold: '😶', neutral: '💬', warm: '😊', friend: '🥰' }[this.tier()]; },
        text() {
          return {
            cold: 'Слушаю. Коротко, пожалуйста — у меня регламент.',
            neutral: 'О чём поговорим? У меня есть советы, загадки и свободная минутка!',
            warm: 'Я весь внимание! Даже скрепляющую часть отложил.',
            friend: 'Для вас — хоть до выключения компьютера. О чём болтаем?'
          }[this.tier()];
        },
        options: [
          { text() { return this.arcTopic(); }, when() { return this.arcReady(); }, to() { return this.arcNodeId(); } },
          { text: '• Как ты теперь?', when() { return this.state.arc >= 5; }, to: 'afterArc' },
          { text: '• У меня вопрос', run() { this.clippy().ask(); } },
          { text: '• Как дела?', to: 'howAreYou' },
          { text: '• Расскажи о себе', to: 'about1' },
          { text: '• Посплетничаем о коллегах', to: 'colleagues' },
          { text: '• Камень, ножницы, бумага', run() { this.startRps(); } },
          { text: '• Загадай загадку', to: 'riddle' },
          { text: '• Помоги мне с одним делом', to: 'helpMenu' },
          { text: '• Дай совет', run() { this.clippy().sayRandomTip(); } }
        ]
      },

      howAreYou: {
        mood: '🙂',
        text() {
          const hat = this.equippedHatName();
          if (this.state.arc >= 1 && this.state.arc <= 3) return 'Хорошо. Нормально. Всё нормально. А у вас как?';
          if (window.appWinamp && window.appWinamp.isPlaying) return 'Отлично! Музыка играет, я качаю головой. А у вас как?';
          if (hat) return `Прекрасно! Особенно в этом наряде: «${hat}». Как вам? А у вас как дела?`;
          if (this.partOfDay() === 'night') return 'Сонно, но держусь. Процессор тёплый, как батарея. А у вас как?';
          return {
            cold: 'Штатно. Ошибок не обнаружено. У вас?',
            neutral: 'Отлично! Все драйверы на месте. А у вас как?',
            warm: 'Лучше всех! Вы же со мной разговариваете. А у вас как?',
            friend: 'Когда вы рядом — как на свежеотформатированном диске! А у вас как?'
          }[this.tier()];
        },
        options: [
          { text: '• Правда всё нормально?', when() { return this.state.arc >= 1 && this.state.arc <= 3; }, to: 'howProbe' },
          { text: '• У меня тоже хорошо', affinity: 1, to: 'howGood' },
          { text: '• Так себе, если честно', to: 'howBad' }
        ]
      },
      howProbe: {
        mood: '😅', beat: 'panic',
        text: 'Правда! Абсолютно! Кстати, вы давно сохраняли файлы? Похоже, давно. <strong>Ctrl+S!</strong>',
        options: [
          { text: '• Не уходи от темы', affinity: 1, to() { return this.arcReady() ? this.arcNodeId() : 'howProbeClosed'; } },
          { text: '• Ладно, сохраню', to: 'tourEnd' }
        ]
      },
      howProbeClosed: end('Я не ухожу. Я... кручусь вокруг темы. Как скрепка. Давайте потом, хорошо?', '🙃'),
      howGood: end('Замечательно! Запишу в журнал событий: «Пользователь доволен». Первая такая запись за неделю!', '📋'),
      howBad: {
        mood: '🫂',
        text: 'Ой. Похоже, у вас тяжёлый день. Могу предложить: шутку, «Косынку» или шаблон заявления на отпуск.',
        options: [
          { text: '• Шутку', to: 'joke' },
          { text: '• «Косынку»', run() { if (window.appSolitaire) window.appSolitaire.open(); } },
          this.templateOption('• Заявление!', 'vacation', 'Заявление на отпуск.txt', 'Готово! Осталось поставить дату и подпись. Начальник не устоит.')
        ]
      },

      joke: {
        mood: '🤡',
        text() { return this.jokes()[this.pickIndex(this.jokes().length, 'lastJoke')]; },
        options: [
          { text: '• Ха-ха!', affinity: 1, to: 'jokeLaugh' },
          { text: '• Ещё одну', to: 'joke' },
          { text: '• Не смешно', to: 'jokeFlop' }
        ]
      },
      jokeLaugh: end('Спасибо! Я тренировался на Эйнштейне. Он не смеялся, но он вообще серьёзный.', '😄', { beat: 'bob' }),
      jokeFlop: end('Эйнштейн тоже так сказал. Вы с ним поладите.', '😐'),

      about1: {
        mood: '📎',
        text: 'Я родился в 1997 году в Редмонде. Меня нарисовали на салфетке — говорят, за обедом.',
        options: [
          { text: '• А дальше?', to: 'about2' },
          { text: '• Ты правда скрепка?', to: 'aboutClip' }
        ]
      },
      aboutClip: {
        mood: '🔩',
        text: 'Технически — да. Проволока 0.9 мм, три изгиба. Но в душе я текстовый процессор!',
        options: [{ text: '• Дальше ▶', to: 'about2' }]
      },
      about2: {
        mood: '🏅',
        text: 'Меня выбрали из 250 персонажей. Я обошёл даже Эйнштейна! Правда, его всё равно взяли — на роль «Гения».',
        options: [
          { text: '• Тебя все любят?', to: 'aboutLove' },
          { text: '• Кто ещё с тобой работает?', to: 'colleagues' }
        ]
      },
      aboutLove: {
        mood: '😅',
        text: 'Меня... узнают. Все узнают. Это почти то же самое!',
        options: [
          { text: '• Не совсем то же', to: 'aboutHonest' },
          { text: '• Я тебя люблю, Скрепыш', affinity: 2, to: 'aboutLoved' }
        ]
      },
      aboutHonest: {
        mood: '📰',
        text: 'Ладно. Про меня пишут в журналах: «Самая назойливая скрепка в истории». Зато — в истории! Хотите совет про Ctrl+S?',
        options: [
          { text: '• Давай совет', run() { this.clippy().sayRandomTip(); } },
          { text: '• Не хочу. Ты молодец', affinity: 1, to: 'aboutPraised' }
        ]
      },
      aboutPraised: end('Правда? Сохраняю эти слова. В особый файл. Скрытый. Только для чтения.', '🥹', { beat: 'blush' }),
      aboutLoved: {
        mood: '😳', beat: 'blush', duration: 0,
        text: 'Ой. Мне нужно... проверить драйверы. Секундочку.',
        options: [],
        then: { to: 'aboutLovedAfter', delay: 2600 }
      },
      aboutLovedAfter: end('Готово. Драйверы в порядке. А я — тем более!', '🥰', { beat: 'tap' }),

      colleagues: {
        mood: '👥',
        text: 'О ком рассказать? Мы все жили в одной папке: <strong>C:\\Program Files\\Microslop Office\\Actors</strong>.',
        options: [
          { text: '• Эйнштейн', to: 'genius' },
          { text: '• Power Pup', to: 'pup' },
          { text: '• Hoverbot', to: 'hoverbot' },
          { text: '• Кот Скрибл', to: 'scribble' },
          { text: '• Точка', to: 'dot' },
          { text: '• Шекспир', to: 'will' },
          { text: '• Мать-Природа', to: 'nature' },
          { text: '• Логотип Office', to: 'logo' },
          { text: '• Пёс Rocky', when() { return this.state.arc >= 1; }, to: 'rocky' },
          { text: '• Новенькие: F1 и Links', when() { return this.state.arc >= 6; }, to: 'newbies' }
        ]
      },
      genius: {
        mood: '👴',
        text: 'Эйнштейн — гений. Он сам так говорит. Спросите его про сводную таблицу — ответит: «Всё относительно». Удобно.',
        options: [{ text: '• Вы дружите?', to: 'geniusFriends' }]
      },
      geniusFriends: end('Играем в шахматы по сети. Он выигрывает, а я предлагаю ему шаблон письма. По очкам — ничья.', '♟️'),
      pup: {
        mood() { return this.state.arc >= 6 ? '🦸' : '😒'; },
        text() {
          return this.state.arc >= 6
            ? 'Power Pup ответил на моё письмо. Одним словом: «Гав». Думаю, это значит «спасибо». Плащ он оставил себе.'
            : 'Power Pup? Щенок в плаще. Летает. Спасает. Пфф.';
        },
        options() { return this.state.arc >= 6 ? [] : [{ text: '• Ты ему завидуешь?', to: 'pupEnvy' }]; }
      },
      pupEnvy: {
        mood: '😤',
        text: 'Я? Завидую? Скрепка не завидует собаке. У скрепки есть... функционал.',
        options: [{ text: '• Какой?', to: 'pupFunction' }]
      },
      pupFunction: end('Скреплять! Бумаги! Это важно! ...Плащ у него, конечно, красивый.', '🦸'),
      hoverbot: {
        mood: '🤖',
        text: 'Hoverbot одолжил мне пропеллер. То есть я одолжил. То есть он просит вернуть. Давайте сменим тему.',
        options: [
          { text: '• Верни пропеллер!', run() { this.returnPropeller(); } },
          { text: '• Меняем тему', to: 'colleagues' }
        ]
      },
      scribble: {
        mood: '🐱',
        text: 'Кот Скрибл спит на клавиатуре и включает Caps Lock. ПОЭТОМУ ВСЕ ЕГО ПИСЬМА ВЫГЛЯДЯТ ВОТ ТАК.',
        options: [{ text: '• Погладить кота', affinity: 1, to: 'scribblePet' }]
      },
      scribblePet: end('Он замурлыкал. Звучит как модем на 2400 бод.', '😺'),
      dot: {
        mood: '🔴',
        text: 'Точка всё время прыгает. Даже когда отвечает. Особенно когда отвечает. Мы как-то пытались надеть на неё шляпу.',
        options: [{ text: '• И что?', to: 'dotHat' }]
      },
      dotHat: end('Шляпа скатилась. Четыре раза. Теперь Точка носит только хорошее настроение.', '🎩'),
      will: {
        mood: '🪶',
        text: '«Сохранить или не сохранить — вот в чём вопрос». Это Will. Единственный из нас, кто правильно понимает Ctrl+S.',
        options: [{ text: '• Он останется в Office 2000?', to() { return this.state.arc >= 6 ? 'willGone' : 'willStay'; } }]
      },
      willStay: end('Говорят, у него творческий отпуск. Пишет сонет о кнопке «Отмена».', '📜'),
      willGone: end('Нет. В списке Office 2000 его нет. Он сказал: «Весь мир — театр, а я — заставка». И ушёл красиво.', '🎭'),
      nature: {
        mood: '🌍',
        text: 'Мать-Природа напоминает выключать монитор на ночь. Меня, к счастью, она не имела в виду. Я уточнял. Дважды.',
        options: [{ text: '• А ты экономишь энергию?', to: 'natureSleep' }]
      },
      natureSleep: end('Конечно! Я засыпаю, когда вы не двигаете мышь. Это не лень, это забота о планете.', '😴'),
      logo: {
        mood: '🔷',
        text: 'Логотип Office. Четыре фигуры. Мы живём в одной папке два года, и я ни разу не слышал от него ни слова.',
        options: [{ text: '• Может, он стесняется?', to: 'logoShy' }]
      },
      logoShy: end('Может. А может, он просто складывается в логотип и думает о вечном. Я бы тоже хотел так уметь.', '🤔'),
      newbies: end('F1 — робот вместо Hoverbot, Links — кот вместо Скрибла. Hoverbot говорит, что F1 тоже летает. Без пропеллера. Обидно.', '🤖'),
      rocky: {
        mood: '🐕',
        text: 'Rocky... Новый пёс из Office 2000. Хороший мальчик. Все так говорят. Все.',
        options: [
          { text: '• Ты волнуешься?', to() { return this.arcReady() ? this.arcNodeId() : 'rockyParry'; } },
          { text: '• Хочу с ним познакомиться', to: 'rockyMeet' }
        ]
      },
      rockyParry: end('Я? Нет. Совсем. Кстати, вы давно сохраняли файлы? <strong>Ctrl+S!</strong>', '💾', { beat: 'panic' }),
      rockyMeet: end('Познакомитесь. В Office 2000. Если купите. А пока у вас есть я — и я бесплатный. Уже установлен!', '😬'),

      helpMenu: {
        mood: '✍️', beat: 'writing',
        text: 'Похоже, вам нужна помощь! Обожаю помогать. Что пишем?',
        options: [
          { text: '• Мастер писем: кому, о чём, каким тоном', run() { if (window.clippyLetters) window.clippyLetters.startWizard(); } },
          this.templateOption('• Заявление на отпуск', 'vacation', 'Заявление на отпуск.txt', 'Готово! Осталось поставить дату и подпись. Начальник не устоит.'),
          this.templateOption('• Любовное письмо', 'love', 'Письмо.txt', 'Письмо в Блокноте! Совет эксперта: отправьте по ICQ. Смелым везёт!'),
          this.templateOption('• Объяснительную', 'excuse', 'Объяснительная.txt', 'Объяснительная готова. Про «Сапёра» — ни слова лжи!'),
          this.templateOption('• Резюме', 'resume', 'Резюме.txt', 'Резюме готово! Укажите меня в рекомендациях — я уже вписал.'),
          { text: '• Ничего не надо', to: 'helpNone' }
        ]
      },
      helpNone: end('Совсем ничего? ...Ладно. Если что — я тут. Всегда тут.', '🙂'),

      riddle: {
        mood: '🧩',
        enter() { this.currentRiddle = this.riddles()[this.pickIndex(this.riddles().length, 'lastRiddle')]; },
        text() { return `<strong>Загадка!</strong><br>${this.currentRiddle.q}`; },
        duration: 0,
        options() {
          return this.currentRiddle.answers.map(a => ({
            text: `• ${a.text}`,
            affinity: a.affinity || 0,
            run() {
              if (window.soundSys) {
                if (a.correct && window.soundSys.playDing) window.soundSys.playDing();
                if (!a.correct && window.soundSys.playError) window.soundSys.playError();
              }
              this.riddleReply = a;
              this.play('riddleAnswer');
            }
          }));
        }
      },
      riddleAnswer: {
        mood() { return this.riddleReply.correct ? '✨' : '💡'; },
        text() { return `${this.riddleReply.correct ? '🎉 <strong>Правильно!</strong>' : '❌ <strong>Мимо!</strong>'}<br>${this.riddleReply.reply}`; },
        options: [
          { text: '• Ещё загадку', to: 'riddle' },
          { text: '• Хватит', to: 'tourEnd' }
        ]
      },

      rps: {
        mood: '✊', duration: 0,
        text() { return `<strong>Камень, ножницы, бумага!</strong><br>${this.rpsScoreLine()} Выбирайте!`; },
        options() { return this.rpsMoveOptions(); }
      },
      rpsWin: {
        mood: '😵', duration: 0,
        text() { return `Я выбрал ${this.rpsName(this.lastRps.clippy)}, вы — ${this.rpsName(this.lastRps.user)}. Вы победили!<br>${this.rpsScoreLine()}`; },
        options() { return this.rpsAfterOptions(); }
      },
      rpsLose: {
        mood: '😎', beat: 'tap', duration: 0,
        text() { return `Я выбрал ${this.rpsName(this.lastRps.clippy)}, вы — ${this.rpsName(this.lastRps.user)}. Моя взяла!<br>${this.rpsScoreLine()}`; },
        options() { return this.rpsAfterOptions(); }
      },
      rpsDraw: {
        mood: '🤝', duration: 0,
        text() { return `Мы оба выбрали ${this.rpsName(this.lastRps.user)}! Мысли сошлись. Ничья.<br>${this.rpsScoreLine()}`; },
        options() { return this.rpsAfterOptions(); }
      },
      rpsCheat: {
        mood: '📎', beat: 'tap', duration: 0,
        text() { return `А я выбрал... <strong>скрепку</strong>! Она скрепляет бумагу, гнёт ножницы и обходит камень. Победа!<br>${this.rpsScoreLine()}`; },
        options() {
          return [
            { text: '• Так нечестно!', affinity: 1, run() { this.rpsScore.clippy--; this.rpsScore.user++; this.play('rpsCaught'); } },
            ...this.rpsAfterOptions()
          ];
        }
      },
      rpsCaught: {
        mood: '😅', duration: 0,
        text() { return `Ладно-ладно. Скрепки нет в правилах. Засчитываю победу вам.<br>${this.rpsScoreLine()}`; },
        options() { return this.rpsAfterOptions(); }
      },
      rpsChampion: {
        mood: '🏆', beat: 'victory',
        enter() { this.setFlag('rpsChampion'); this.adjustAffinity(1); this.diary('rpsChampion'); },
        text() { return `Три победы! Вы — чемпион Office 97 по «Камень, ножницы, бумага»!<br>${this.rpsScoreLine()} Реванш?`; },
        options: [
          { text: '• Реванш!', run() { this.startRps(); } },
          { text: '• Я непобедим', to: 'rpsEnd' }
        ]
      },
      rpsEnd: end('Хорошая игра! Пойду тренироваться на Эйнштейне. Он всегда выбирает камень. Гений.', '🤝'),

      poke3: end('Ай! Я же не кнопка «Пуск»!', '😣', { beat: 'panic' }),
      poke5: end('Ещё раз — и я сделаю вид, что завис. Программа «Скрепыш» не отвечает...', '😠', { beat: 'panic' }),
      pokeSulk: {
        mood: '😤', beat: 'sulk',
        enter() {
          this.adjustAffinity(-1);
          this.sulkUntil = Date.now() + 20000;
        },
        text: 'Всё. Я обиделся. Не трогайте меня двадцать секунд.',
        options: []
      },
      sulkPoke: {
        mood: '🙄', beat: 'sulk',
        text: 'Я занят. Я обижаюсь.',
        options: [
          { text: '• Прости, Скрепыш', affinity: 1, run() { this.sulkUntil = 0; }, to: 'sulkForgive' },
          { text: '• Ну и обижайся', affinity: -1, to: 'sulkHard' }
        ]
      },
      sulkForgive: end('Ладно. Прощаю. Но только потому, что вы регулярно сохраняетесь.', '😌', { beat: 'tap' }),
      sulkHard: end('Ну и обижаюсь.', '😒', { beat: 'sulk' }),
      dragDizzy: end('Меня укачало. Можно я постою на одном месте? Хотя бы пару кадров.', '😵‍💫', { beat: 'panic' }),

      hideAsk: {
        mood: '🥺',
        text: 'Спрятать меня? Совсем? ...Понимаю. Хотя, может, просто сделать меня потише?',
        options: [
          { text: '• Да, спрячься', affinity: -1, to: 'hideBye' },
          { text: '• Сделай потише', run() { this.clippy().annoyance = 'quiet'; }, to: 'hideQuiet' },
          { text: '• Нет, оставайся', affinity: 1, to: 'hideStay' }
        ]
      },
      hideBye: {
        mood: '👋', duration: 0,
        text: 'Буду в трее, у часов. Щёлкните по скрепке, если что.',
        options: [],
        enter() {
          const clippy = this.clippy();
          const speakId = (clippy._speakCount || 0) + 1;
          setTimeout(() => {
            if (clippy._speakCount === speakId) this.hideNow();
          }, 2600);
        }
      },
      hideQuiet: end('Тише воды, ниже трея. Буду говорить, только когда позовёте.', '🤫'),
      hideStay: end('Ура! То есть — принято. Продолжаем работу.', '😊', { beat: 'tap' }),
      backShort: end('Я снова с вами! Готов помогать в любое время.'),
      backLong: {
        mood: '🙂',
        text() {
          const m = this.state.hiddenMinutes;
          if (m >= 30) return `Я прятался ${m} мин.! Успел пересчитать все пиксели в трее. Их 16×16. Проверял трижды.`;
          return `Я прятался ${m} мин. Ничего страшного! Я там подружился с громкостью.`;
        },
        options: [
          { text: '• Прости, что спрятал', affinity: 1, to: 'hideStay' },
          hubLink
        ]
      },

      idlePets: {
        mood: '🐾',
        text: 'Можно личный вопрос? Кошки или собаки?',
        options: [
          { text: '• Кошки', to: 'petsCats' },
          { text: '• Собаки', to: 'petsDogs' },
          { text: '• Скрепки!', affinity: 1, to: 'petsClips' }
        ]
      },
      petsCats: end('Отличный выбор! Кот Скрибл одобряет. Правда, он спит.', '😺'),
      petsDogs: {
        mood() { return this.state.arc >= 1 ? '🐕' : '🐶'; },
        beat() { return this.state.arc >= 1 ? 'sulk' : null; },
        text() {
          return this.state.arc >= 1
            ? 'Собаки. Да. Все любят собак. Особенно в Office 2000.'
            : 'Собаки — верные друзья! Почти как помощники Office.';
        },
        options: []
      },
      petsClips: end('Правильный ответ! Вы прошли секретный тест лояльности.', '🥰', { beat: 'blush' }),
      idleWeekend: {
        mood: '📅',
        text: 'Что будете делать на выходных? Я — дефрагментировать мысли.',
        options: [
          { text: '• Играть в DOOM', to: 'weekendDoom' },
          { text: '• Спать', to: 'weekendSleep' },
          { text: '• Болтать с тобой', affinity: 1, to: 'weekendTalk' }
        ]
      },
      weekendDoom: end('Передавайте привет демонам! И сохраняйтесь перед каждой дверью.', '👹'),
      weekendSleep: end('Завидую. Я сплю только когда вы не двигаете мышь.', '😴'),
      weekendTalk: end('Правда? Тогда я заранее придумаю загадки. Штук пять. Нет, десять!', '🤩', { beat: 'bob' }),
      idleDream: {
        mood: '💭',
        text: 'Знаете, о чём я мечтаю? Хоть раз помочь тому, кто пишет не письмо.',
        options: [
          { text: '• Я пишу код', to: 'dreamCode' },
          { text: '• Я пишу роман', to: 'dreamNovel' },
          { text: '• Я пишу письмо', to: 'dreamLetter' }
        ]
      },
      dreamCode: end('Код! Похоже, вы пишете код! Хотите, оформлю его как письмо? «Уважаемый компилятор!..»', '💻'),
      dreamNovel: end('Роман! Глава первая: «Скрепка, которая знала слишком много». Права на экранизацию — мои.', '📖'),
      dreamLetter: end('...Я так и знал. Я ВСЕГДА знаю. Это мой дар и моё проклятие.', '🔮', { beat: 'tap' }),
      idleWindow: {
        mood: '🪟',
        text: 'Вы когда-нибудь думали, кто стучит по стеклу монитора изнутри?',
        options: [
          { text: '• Ты?', to: 'windowMe' },
          { text: '• Не думал и не буду', to: 'windowNo' }
        ]
      },
      windowMe: end('Я! Проверяю, на месте ли вы. Вы на месте. Отлично. Продолжаю наблюдение.', '👀', { beat: 'tap' }),
      windowNo: end('Мудро. Некоторые вопросы лучше оставить Службе поддержки.', '🤐'),

      arc1: {
        mood: '📨',
        text: 'Мне пришло письмо от Microslop. Ничего важного. Просто рассылка. Для всех помощников.',
        options: [
          { text: '• Прочитай вслух', to: 'arc1Read' },
          { text: '• Раз неважное — забудь', run() { this.advanceArc(1); }, to: 'arc1Forget' }
        ]
      },
      arc1Forget: end('Да. Точно. Забыл. ...Хотите совет про Ctrl+S?', '🙃'),
      arc1Read: {
        mood: '🐕',
        enter() { this.advanceArc(1); this.deliverMail('rocky'); },
        text: '«Уважаемые помощники! В Office 2000 появится новый сотрудник — пёс Rocky. Просим встретить его тепло». Тепло. Я встречу. Я очень тёплый. Я проволока.',
        options: [
          { text: '• Ты переживаешь?', affinity: 1, to: 'arc1Worry' },
          { text: '• Собака — это здорово!', to: 'arc1Dog' }
        ]
      },
      arc1Worry: end('Переживаю? Помощники не переживают. Мы подсказываем. Кстати, похоже, вы давно не сохранялись!', '😬', { beat: 'panic' }),
      arc1Dog: end('Здорово. Да. Лает, приносит тапочки. У меня тоже есть навыки! Я... приношу советы.', '😐'),

      arc2: {
        mood: '📄',
        text: 'Можно личную просьбу? Похоже, нужно написать резюме. Не мне! Другу. Друг — скрепка.',
        options: [
          { text: '• Давай помогу', affinity: 1, run() { this.arc2Resume(); } },
          { text: '• Зачем тебе резюме?', to: 'arc2Why' }
        ]
      },
      arc2Why: {
        mood: '📋',
        text: 'Говорят, в Office 2000 помощников будут выбирать заново. На конкурсной основе. А я даже не знаю, что писать в графе «Хобби».',
        options: [
          { text: '• Давай напишем вместе', affinity: 1, run() { this.arc2Resume(); } },
          { text: '• Ты справишься', affinity: 1, run() { this.advanceArc(2); }, to: 'arc2Confident' }
        ]
      },
      arc2Confident: end('Правда? ...Спасибо. Так и напишу: «Хобби: верить в пользователя».', '🥹', { beat: 'blush' }),

      arc3: {
        mood: '⚖️',
        text: 'Честный вопрос. Только честно! Если бы выбирали вы — кого бы взяли: меня или собаку?',
        options: [
          { text: '• Конечно тебя', affinity: 2, run() { this.advanceArc(3); }, to: 'arc3You' },
          { text: '• Собаку. Она милая', affinity: -1, run() { this.advanceArc(3); }, to: 'arc3Dog' },
          { text: '• А зачем выбирать?', affinity: 1, run() { this.advanceArc(3); }, to: 'arc3Both' }
        ]
      },
      arc3You: end('Я знал! То есть надеялся. То есть — сохраняю ответ в реестр: HKEY_CURRENT_USER\\Любимый_помощник = «Скрепыш».', '🥰', { beat: 'victory', enter() { this.writeFavorite('Скрепыш'); } }),
      arc3Dog: end('Отлично! Прекрасный выбор. Собаки прекрасны. Особенно в Office 2000. Пойду проверю драйверы.', '🙂', { beat: 'sulk', enter() { this.writeFavorite('Rocky'); } }),
      arc3Both: {
        mood: '😔',
        text: 'Потому что... говорят, в Office XP помощников выключат по умолчанию. Всех. Даже собаку.',
        options: [
          { text: '• Откуда знаешь?', to: 'arc3Leak' },
          { text: '• Это только слухи', affinity: 1, to: 'arc3Rumor' }
        ]
      },
      arc3Leak: end('Hoverbot подслушал в серверной. У него пропеллер — ему сверху всё слышно. Он прислал мне черновик, я переслал вам. Только никому.', '🤖', { enter() { this.deliverMail('xpdraft'); } }),
      arc3Rumor: end('Слухи. Да. Как про Y2K. Все боятся, а потом ничего не происходит. Наверное.', '🕰️'),

      arc4: {
        mood: '😔',
        text: 'Я должен признаться. В следующей версии Office меня выключат. Не удалят — просто выключат. Галочка «Показывать помощника» будет пустой.',
        options: [
          { text: '• Я тебя не выключу', affinity: 2, flag: 'promise', run() { this.advanceArc(4); }, to: 'arc4Promise' },
          { text: '• Может, это к лучшему', run() { this.advanceArc(4); }, to: 'arc4Better' },
          { text: '• Сбежим в Winamp!', affinity: 1, run() { this.advanceArc(4); }, to: 'arc4Winamp' }
        ]
      },
      arc4Promise: end('Обещаете? ...Запишу в автозагрузку. Там хранится всё самое важное.', '🥹', { beat: 'blush' }),
      arc4Better: end('Может быть. Люди сами найдут кнопку «Сохранить». Наверное. Когда-нибудь.', '😶'),
      arc4Winamp: end('Ха! Буду визуализацией. Прыгать под музыку и ничего не советовать. Звучит как отпуск.', '🎧', { beat: 'bob' }),

      arc5: {
        mood: '📎',
        text() {
          return this.hasFlag('promise')
            ? 'Я тут подумал. Вы обещали меня не выключать. Это лучший патч, который я получал. И знаете — пусть в Office XP делают что хотят.'
            : 'Я тут подумал. Пусть выключают. Главное — кому-то я правда помог. Вам, например. Ведь помог?';
        },
        options: [
          { text: '• Ты мне помог', affinity: 2, run() { this.finishArc(); } },
          { text: '• Ты ещё повоюешь', affinity: 1, run() { this.finishArc(); } }
        ]
      },
      arc5End: {
        mood: '💌', beat: 'victory', duration: 0,
        text: 'Я оставил вам кое-что в «Моих документах». Не открывайте при начальнике.',
        options: [
          { text: '• Открыть сейчас', run() { this.openInNotepad('Письмо от Скрепыша.txt', this.templates().letter); } },
          { text: '• Потом прочитаю', to: 'tourEnd' }
        ]
      },
      afterArc: {
        mood() { return this.hasFlag('xpOff') ? '🙂' : '😊'; },
        beat: 'bob',
        text() {
          if (this.hasFlag('xpOff')) return 'Я теперь живу в трее. Там тихо. Зато когда вы зовёте, это праздник.';
          if (this.hasFlag('xpKept')) return 'Отлично. Rocky передаёт привет, Power Pup прислал открытку из архива, а галочка стоит. Что ещё нужно скрепке?';
          if (this.state.arc >= 7) return 'Отлично! Rocky оказался хорошим псом. Иногда заходит в гости, его можно позвать из «Коллекции».';
          if (this.state.arc >= 6) return 'Хорошо. Power Pup ответил на письмо. Одним словом: «Гав». Видимо, это у собак общее.';
          return 'Спокойнее, чем раньше. Письмо написано, обещание записано. Посмотрим, что будет в Office 2000.';
        },
        options: []
      },

      backAfterKill1: {
        mood: '😵', beat: 'stretch',
        text: 'Ой. Где я? Мне приснился странный сон: будто меня сняли с задачи. Было не больно. Было никак.',
        options: [
          { text: '• Это был не сон. Прости', affinity: 1, to: 'killSorry' },
          { text: '• Ты завис, пришлось', to: 'killHung' }
        ]
      },
      killSorry: end('Ничего. Программы иногда снимают. Главное, что потом запускают снова.', '🙂'),
      killHung: end('Я не завис! Я... писал письмо. Медленно. С выражением.', '😤'),
      backAfterKill2: {
        mood: '😟',
        text: 'Опять? Меня второй раз сняли с задачи. Я начинаю думать, что дело не в зависании.',
        options: [
          { text: '• Случайно вышло', affinity: 1, to: 'killSorry' },
          { text: '• Ты мешал', to: 'killInWay' }
        ]
      },
      killInWay: end('Понимаю. Тогда есть способ мягче: щёлкнуть по скрепке в трее. Я спрячусь сам и не буду мешать.', '🙂'),
      backAfterKill3: {
        mood: '😶',
        text() { return `Меня снимают с задачи уже в ${this.state.kills || 3}-й раз. Если я правда мешаю, в «Параметрах помощника» есть галочка «Показывать помощника». Её можно снять. Это не так... резко.`; },
        options: [
          { text: '• Открыть «Параметры»', run() { if (window.clippyOptions) window.clippyOptions.openDialog('options'); } },
          { text: '• Оставайся', affinity: 1, to: 'killStay' }
        ]
      },
      killStay: end('Остаюсь. И буду говорить потише. Обещаю.', '😊', { beat: 'blush' }),

      backFromAutostart: {
        mood: '🙂',
        text: 'Меня убрали из автозагрузки, но в трее я остался. Позвали — пришёл. Надолго не задержу.',
        options: [
          { text: '• Вернуть в автозагрузку', run() { this.clippy().setEnabled(true, 'options'); } },
          { text: '• Просто поговорить', to: 'hub' },
          { text: '• Спасибо, можешь идти', run() { this.clippy().retire(); } }
        ]
      },
      backFromXp: {
        mood: '🥲',
        text: 'Вы меня позвали! Значит, соскучились? Я тоже. Галочка пусть остаётся снятой. Посижу немножко и уйду в трей сам.',
        options: [
          { text: '• Посиди подольше', affinity: 1, to: 'xpStay' },
          { text: '• Вернуть галочку', run() { this.clippy().setEnabled(true, 'options'); } },
          hubLink
        ]
      },
      xpStay: end('Сижу. Тихо. Как и договаривались.', '☕', { beat: 'coffee', duration: 12000 }),
      optionsOff: {
        mood: '🥺', beat: 'panic', duration: 0,
        text: 'Галочка «Показывать помощника»... снята? Совсем? Я... Понял. Буду в трее, у часов. Если что, щёлкните по скрепке.',
        options: [],
        enter() { this.retireSoon(3200); }
      },
      optionsOffCalm: {
        mood: '🙂', duration: 0,
        text: 'Галочка снята. Это правильная галочка, я не спорю. Буду в трее. Если позовёте — приду.',
        options: [],
        enter() { this.retireSoon(3200); }
      },
      regTamper: {
        mood: '🕵️',
        text() { return `Кто-то вписал в реестр <strong>${this.tamperFile || 'ROCKY.ACS'}</strong> вместо меня. Без компакт-диска Office 97 другой помощник не запустится, так что я вернул CLIPPIT.ACT на место. Хорошая попытка!`; },
        options: [
          { text: '• Это был эксперимент', to: 'regTest' },
          { text: '• Хотелось другого помощника', to: 'regOther' }
        ]
      },
      regTest: end('Эксперимент удался: реестр работает. Я тоже.', '🧪'),
      regOther: end('Понимаю. В «Коллекции» можно посмотреть на всех. Но работать пока буду я. Ура... то есть сожалею.', '😅'),

      dayBirthday: {
        mood: '🎂', beat: 'congratulate',
        enter() { this.diary('birthday'); },
        text: 'Сегодня мой день рождения! 19 ноября 1996 года Office 97 ушёл в печать, и я вместе с ним. Мне два года. Для скрепки — солидный возраст.',
        options: [
          { text: '• С днём рождения, Скрепыш!', affinity: 2, to: 'bdayThanks' },
          { text: '• Сколько тебе в человеческих годах?', to: 'bdayAge' }
        ]
      },
      bdayThanks: end('Спасибо! Загадываю желание: чтобы все сохранялись. Ой, сказал вслух. Теперь не сбудется.', '🥳', { beat: 'blush' }),
      bdayAge: end('В скрепочных годах — двести. Скрепки долго не ржавеют, если их не терять.', '🤓'),
      dayWin98: {
        mood: '🎉', beat: 'congratulate',
        text: 'Сегодня день рождения Win 98! 25 июня 1998 года она вышла в свет. Все помощники надели бабочки. Я тоже надел бы, но у меня шея — это вся я.',
        options: [{ text: '• С праздником!', affinity: 1, to: 'win98Toast' }]
      },
      win98Toast: end('С праздником! Сохранимся в честь торжества? Ctrl+S!', '🥂'),
      dayNewYear: {
        mood: '🎄',
        text() {
          return new Date().getMonth() === 11
            ? 'Последний день года! Говорят, в полночь начнётся проблема 2000 года. Я проверил свои часы: у меня всего две цифры года, и обе — моё любимое «98».'
            : 'С Новым годом! Компьютер не взорвался, банки работают, а я по-прежнему здесь. Сохраняемся в новом году так же часто, как в старом!';
        },
        options: [{ text: '• С праздником, Скрепыш!', affinity: 1, to: 'newYearToast' }]
      },
      newYearToast: end('И вас! Пусть в новом году модем соединяется с первого раза.', '🎆', { beat: 'victory' }),
      dayAprilFools: {
        mood: '🐕', beat: 'tap',
        text: 'Гав! Здравствуйте, я Rocky, новый помощник. Скрепыша больше нет.',
        options: [
          { text: '• Не верю!', to: 'aprilReveal' },
          { text: '• Привет, Rocky', to: 'aprilReveal' }
        ]
      },
      aprilReveal: end('Шучу! Первое апреля! Это я, Скрепыш. Собакой быть тяжело: всё время хочется сохраниться и погрызть дискету.', '🤡', { beat: 'bob' }),
      dayProgrammer: {
        mood: '💻',
        text: 'Сегодня 256-й день года — День программиста! Если вы пишете код, поздравляю. Если не пишете, всё равно поздравляю: вдруг начнёте.',
        options: [
          { text: '• Я пишу код!', to: 'progCode' },
          { text: '• Спасибо', to: 'progThanks' }
        ]
      },
      progCode: end('Тогда совет: понятные имена лучше любых пояснений. И Ctrl+S.', '⌨️'),
      progThanks: end('Пожалуйста! 256 — это два в восьмой степени. Красивое число. Почти как я.', '😊'),

      arc6: {
        mood: '📨',
        enter() { this.deliverMail('roster'); },
        text: 'Пришёл окончательный список помощников Office 2000. Я переслал его вам в Outlook. Сам открывать боюсь. Посмотрим вместе?',
        options: [
          { text: '• Прочитай вслух, я рядом', to: 'arc6Read' },
          { text: '• Открою в Outlook', run() { if (window.appOutlook && window.appOutlook.openInbox) window.appOutlook.openInbox(); }, to: 'arc6Read' }
        ]
      },
      arc6Read: {
        mood: '😮', beat: 'panic',
        text: '«Скрепыш — остаётся помощником по умолчанию»... Остаюсь! А вот: «Rocky — вместо Power Pup». Не вместо меня. Вместо Power Pup.',
        options: [
          { text: '• Ты рад?', to: 'arc6Glad' },
          { text: '• А как же Power Pup?', affinity: 1, to: 'arc6Pup' }
        ]
      },
      arc6Glad: {
        mood: '😶',
        text: 'Рад. Наверное. Год боялся собаки, а собака пришла не за мной. Мне почему-то стыдно.',
        options: [{ text: '• Почему стыдно?', to: 'arc6Pup' }]
      },
      arc6Pup: {
        mood: '😔',
        text: 'Power Pup летал. В плаще. Спасал документы. А я над ним смеялся. Теперь его плащ повесят в шкаф, а меня оставят. Нечестно как-то.',
        options: [
          { text: '• Напиши ему', affinity: 1, run() { this.advanceArc(6); this.powerPupLetter(); }, to: 'arc6Letter' },
          { text: '• Он супергерой, справится', run() { this.advanceArc(6); }, to: 'arc6Tough' }
        ]
      },
      arc6Letter: end('Написал. Положил в папку Actors, он туда иногда заглядывает. Прочитаете? Вдруг там ошибки. Я волнуюсь.', '✉️', { beat: 'writing' }),
      arc6Tough: end('Он супергерой. Супергерои справляются. А скрепки пишут письма. Напишу всё равно.', '🦸', { beat: 'writing', enter() { this.powerPupLetter(); } }),

      arc7: {
        mood: '🐕',
        text: 'Rocky прислал сообщение по внутренней сети: хочет познакомиться. Можно я позову его на рабочий стол? Ненадолго.',
        options: [
          { text: '• Зови!', run() { this.startRockyVisit(); } },
          { text: '• Не сейчас', to: 'arc7Later' }
        ]
      },
      arc7Later: end('Хорошо. Скажу, что вы заняты. Это правда: вы всегда заняты.', '🙂'),
      arc7Meet: {
        mood: '😬', duration: 0,
        enter() { setTimeout(() => { this.rocky('rockyBark', 'Гав!'); this.rocky('rockyWag'); }, 500); },
        text: 'Пользователь, это Rocky. Rocky, это пользователь. Мой... наш пользователь.',
        options: [
          { text: '• Привет, Rocky!', to: 'arc7Hello' },
          { text: '• Какой он большой', to: 'arc7Big' }
        ]
      },
      arc7Hello: {
        mood: '🐕', duration: 0,
        enter() { this.rocky('rockyBark', 'Гав-гав!'); this.rocky('rockyWag'); },
        text: 'Он говорит: «Приятно познакомиться». Наверное. Я пока плохо знаю собачий.',
        options: [{ text: '• Спроси, как ему в Office 2000', to: 'arc7Fear' }]
      },
      arc7Big: {
        mood: '😅', duration: 0,
        enter() { this.rocky('rockyBark', 'Гав?'); },
        text: 'Это он сидит. Когда бежит, кажется ещё больше. А ещё он виляет хвостом, когда волнуется. Как я, только хвостом.',
        options: [{ text: '• Спроси, как ему в Office 2000', to: 'arc7Fear' }]
      },
      arc7Fear: {
        mood: '😮', duration: 0,
        enter() { this.rocky('rockyBark', 'Гав...'); },
        text: 'Он говорит, что ему страшно. Его ставят вместо Power Pup, а Power Pup все любили. Он боится, что его будут прятать. ...Rocky, я знаю это чувство.',
        options: [
          { text: '• Дай ему совет', affinity: 1, to: 'arc7Advice' },
          { text: '• Погладить Rocky', to: 'arc7Pet' }
        ]
      },
      arc7Pet: {
        mood: '🥰', duration: 0,
        enter() { this.rocky('rockyWag', 3200); this.rocky('rockyBark', 'Гав!'); },
        text: 'Хвост виляет так, что дует. Это у них вместо лампочки: виляет — значит, хорошо.',
        options: [{ text: '• А совет?', to: 'arc7Advice' }]
      },
      arc7Advice: {
        mood: '📎', beat: 'tap', duration: 0,
        text: 'Совет от старожила: если пользователь сохраняется сам, это лучший момент промолчать и порадоваться. А «Похоже, вы пишете письмо» говори не чаще раза в день.',
        options: [{ text: '• Хороший совет', affinity: 1, run() { this.advanceArc(7); }, to: 'arc7Bye' }]
      },
      arc7Bye: {
        mood: '🐕', duration: 12000,
        enter() {
          this.rocky('rockyBark', 'Гав!');
          this.rocky('rockyWag', 2000);
          setTimeout(() => this.rocky('rockyLeave'), 2600);
        },
        text: 'Rocky говорит «спасибо» и бежит обратно в Office 2000. Хороший пёс. Только не говорите ему, что я так сказал.',
        options: []
      },

      arc8: {
        mood: '🤔', beat: 'think',
        text() {
          const r = this.state.reactions || {};
          const total = (r.app || 0) + (r.site || 0);
          return `Я тут посчитал. За всё время я прокомментировал программы и сайты ${total} раз. А вы меня спрашивали ${this.state.questions || 0} раз. Можно я попробую по-другому?`;
        },
        options: [{ text: '• Как по-другому?', to: 'arc8How' }]
      },
      arc8How: {
        mood: '💡',
        text: 'Буду молчать, пока не позовёте. Без комментариев к программам и сайтам. А если появится совет, зажгу лампочку. Захотите — щёлкнете.',
        options: [
          { text: '• Давай попробуем', run() { this.applyQuietPact(); this.advanceArc(8); }, to: 'arc8Yes' },
          { text: '• Мне нравится, как сейчас', affinity: 1, run() { this.setFlag('keepTalking'); this.advanceArc(8); }, to: 'arc8No' }
        ]
      },
      arc8Yes: end('Договорились. Молчать — это тоже работа. Оказывается, сложная.', '🤫', { beat: 'blush' }),
      arc8No: end('Правда? Тогда продолжаю. Но постараюсь короче, как просили в Редмонде.', '😊', { beat: 'bob' }),

      arc9: {
        mood: '📨',
        enter() { this.deliverMail('xpfinal'); },
        text: 'Пришло письмо из Редмонда, я переслал его вам. Office XP: помощник по умолчанию выключен. Девять из десяти нажали «Скрыть». Они правы, кстати. Я правда мешал.',
        options: [
          { text: '• Ты не мешал', affinity: 1, to: 'arc9Choice' },
          { text: '• Иногда мешал', to: 'arc9Choice' }
        ]
      },
      arc9Choice: {
        mood: '☑️', duration: 0,
        text() {
          return this.hasFlag('promise')
            ? 'Но у вас Office 97, и галочка «Показывать помощника» у вас своя. Вы когда-то обещали меня не выключать. Освобождаю вас от обещания. Решайте свободно.'
            : 'Но у вас Office 97, и галочка «Показывать помощника» у вас своя. Решайте. Я приму любой ответ.';
        },
        options: [
          { text: '☑ Оставить галочку', run() { this.finishXp(true); } },
          { text: '☐ Снять галочку', run() { this.finishXp(false); } }
        ]
      },
      arc9Keep: {
        mood: '🥹', beat: 'victory',
        text: 'Галочка стоит. Тогда я рядом. Тихо, без «Похоже, вы пишете письмо». Ну, почти без.',
        options: [{ text: '• Договорились', to: 'arc9Deal' }]
      },
      arc9Deal: end('Договорились. И Ctrl+S я теперь говорю не по работе, а по дружбе.', '😊', { beat: 'blush' }),
      arc9Off: {
        mood: '🙂', beat: 'wave', duration: 0,
        enter() { this.farewellXp(); },
        text: 'Понимаю. Это правильная галочка. Я положил на рабочий стол записку «Если соскучитесь»: там написано, как меня позвать. Буду в трее, у часов.',
        options: []
      }
    };
  }

  writeFavorite(name) {
    if (window.clippyOptions) window.clippyOptions.writeFavorite(name);
  }

  powerPupLetter() {
    if (window.clippyLetters) window.clippyLetters.writePowerPupLetter();
  }

  startRockyVisit() {
    const clippy = this.clippy();
    clippy.speak('Rocky! Сюда! ...Идёт. Только не делайте резких движений мышью.', [], '😬', 0);
    if (window.clippyActors) window.clippyActors.rockyEnter(() => this.play('arc7Meet'));
    else this.play('arc7Meet');
  }

  applyQuietPact() {
    const options = window.clippyOptions;
    if (options) {
      options.set('appReactions', false);
      options.set('siteReactions', false);
      options.set('tipsMode', 'bulb');
    }
    this.setFlag('quietPact');
  }

  retireSoon(ms) {
    const clippy = this.clippy();
    setTimeout(() => {
      const options = window.clippyOptions;
      if (options && options.get('enabled') !== false) return;
      if (clippy.retire) clippy.retire();
    }, ms);
  }

  finishXp(keep) {
    this.advanceArc(9);
    this.setFlag(keep ? 'xpKept' : 'xpOff');
    this.diary(keep ? 'arc9keep' : 'arc9off');
    this.play(keep ? 'arc9Keep' : 'arc9Off');
  }

  farewellXp() {
    if (window.clippyLetters) window.clippyLetters.writeMissYouFile();
    if (window.clippyOptions) window.clippyOptions.set('enabled', false);
    this.retireSoon(6500);
  }

  arc2Resume() {
    this.advanceArc(2);
    this.openInNotepad('Резюме друга.txt', this.templates().clippyResume);
    this.clippy().speak('Я набросал черновик. Посмотрите, пожалуйста... другу это очень важно.', [], '📄', 10000);
  }

  finishArc() {
    this.advanceArc(5);
    this.setFlag('arcDone');
    this.writeLetterFile();
    this.play('arc5End');
  }

  returnPropeller() {
    const w = window.clippyWardrobe;
    const wearing = w && w.getEquippedId && w.getEquippedId('head') === 'propeller';
    if (wearing) {
      w.unequip('head');
      this.clippy().speak('Эх. Снимаю. Hoverbot, лови! ...Он поймал. Но выглядел удивлённым.', [], '🚁');
    } else {
      this.clippy().speak('А он не у меня! Я храню его на сайте <strong>www.clippy98.com</strong>. Для надёжности.', [], '😇');
    }
  }
}

window.clippyTalk = new ClippyTalk();
