class ClippySystem {
  constructor() {
    this.knownGames = null;
    this.knownPurchases = null;
    this.nekoSeen = false;
    this.nekoNap = false;
    this.binLine = false;
    this.trayPinged = false;
  }

  clippy() {
    return window.appClippy;
  }

  talk() {
    return window.clippyTalk;
  }

  esc(text) {
    return String(text).replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
  }

  boot() {
    this.watchGames();
    this.syncIcq();
  }

  processList() {
    const clippy = this.clippy();
    if (!clippy || !clippy.isRunning()) return [];
    const sleeping = clippy.state === 'sleeping';
    return [{ pid: 1997, imageName: 'clippy.exe', cpu: sleeping ? 0 : 0.4, mem: 2380, priority: 'Normal', user: 'User', isClippy: true }];
  }

  onEndTask() {
    const clippy = this.clippy();
    const wm = window.winManager;
    if (!clippy || !wm) return;
    const talk = this.talk();
    const cold = talk && talk.tier && talk.tier() === 'cold';
    const message = cold
      ? '<div>Программа <b>Скрепыш (clippy.exe)</b> не отвечает.<br><br>Возможно, он обиделся. Если завершить программу сейчас, его настроение не будет сохранено.</div>'
      : '<div>Программа <b>Скрепыш (clippy.exe)</b> занята: она пишет вам письмо.<br><br>Если завершить программу сейчас, письмо не будет сохранено.</div>';
    if (clippy.visible) {
      clippy.flash('panic-shake', 2400);
      clippy.speak('Подождите! Я как раз... Я почти дописал!', [], '😰', 4000);
    }
    wm.openDialog({
      title: 'Завершение программы',
      icon: 'warning',
      message,
      buttons: [
        { text: 'Завершить сейчас', onClick: () => this.endTaskConfirmed() },
        { text: 'Cancel', primary: true, onClick: () => this.endTaskCancelled() }
      ]
    });
  }

  endTaskConfirmed() {
    const talk = this.talk();
    if (talk) {
      talk.state.kills = (talk.state.kills || 0) + 1;
      talk.state.killedAt = Date.now();
      talk.adjustAffinity(-1);
      talk.saveState();
    }
    const clippy = this.clippy();
    if (clippy) clippy.kill();
    const tm = window.appTaskManager;
    if (tm) {
      tm.selectedProcPid = null;
      if (typeof tm.renderProcessTableRows === 'function') tm.renderProcessTableRows();
      if (typeof tm.updateMetrics === 'function') tm.updateMetrics();
    }
  }

  endTaskCancelled() {
    const clippy = this.clippy();
    if (clippy && clippy.visible) clippy.speak('Фух. Спасибо. Письмо, кстати, было вам.', [], '😮‍💨', 6000);
  }

  onLaunched(reason) {
    const talk = this.talk();
    if (!talk) return;
    const afterKill = talk.afterKillNode && talk.afterKillNode();
    if (afterKill) {
      talk.play(afterKill);
      return;
    }
    if (window.clippyOptions && window.clippyOptions.get('enabled') === false) {
      talk.play(talk.hasFlag('xpOff') ? 'backFromXp' : 'backFromAutostart');
      return;
    }
    if (reason !== 'ask') talk.onShown();
  }

  onEnabledChanged(enabled, source) {
    const clippy = this.clippy();
    const talk = this.talk();
    if (!clippy) return;
    if (!enabled) {
      if (source === 'msconfig') {
        if (clippy.visible) clippy.speak('Меня убрали из автозагрузки. До перезагрузки я ещё здесь, а потом буду ждать в трее.', [], '🙂', 9000);
        return;
      }
      if (!clippy.isRunning()) return;
      if (talk) talk.play(talk.state.arc >= 5 ? 'optionsOffCalm' : 'optionsOff');
      else clippy.retire();
      return;
    }
    if (source === 'msconfig') {
      if (clippy.visible) clippy.speak('Меня вернули в автозагрузку! Там хранится всё самое важное.', [], '🥹', 8000);
      return;
    }
    if (!clippy.isRunning()) clippy.launch('enabled');
    else if (clippy.visible) clippy.speak('Галочка снова стоит. Я на месте.', [], '😊', 6000);
  }

  icqContactData() {
    return {
      id: 'clippy',
      nick: 'Скрепыш',
      uin: '199898',
      name: 'Clippit',
      email: 'clippy@clippy98.com',
      city: 'Редмонд',
      country: 'США',
      age: '2',
      gender: 'Скрепка',
      interests: 'Письма, Ctrl+S, «Косынка», шляпы, Ретро-Викторина',
      status: 'online',
      statusNote: 'Справа внизу, у часов',
      group: 'Microslop',
      unread: false,
      messages: [
        { sender: 'them', time: '09:00:00', text: 'Привет! Это Скрепыш. Если меня не видно на рабочем столе, пишите сюда. Отвечаю быстрее, чем модем соединяется.' }
      ],
      replies: []
    };
  }

  icqStatus() {
    const clippy = this.clippy();
    const talk = this.talk();
    if (!clippy || !clippy.isRunning()) {
      const disabled = window.clippyOptions && window.clippyOptions.get('enabled') === false;
      return ['offline', disabled ? 'Автозагрузка выключена' : 'Снят с задачи'];
    }
    if (!clippy.visible) return ['na', 'В трее, у часов'];
    if (clippy.state === 'sleeping') return ['away', 'Сплю. Будить можно'];
    if (talk && talk.isSulking && talk.isSulking()) return ['dnd', 'Обижаюсь'];
    const tier = talk && talk.tier ? talk.tier() : 'neutral';
    return ['online', { cold: 'На связи. По делу', neutral: 'Справа внизу, у часов', warm: 'Жду ваших писем', friend: 'Рядом с любимым пользователем' }[tier]];
  }

  syncIcq() {
    const icq = window.appICQ;
    if (!icq || typeof icq.ensureContact !== 'function') return false;
    icq.ensureContact(this.icqContactData());
    const [status, note] = this.icqStatus();
    if (typeof icq.setContactStatus === 'function') icq.setContactStatus('clippy', status, note);
    return true;
  }

  icqReply(text) {
    const talk = this.talk();
    const help = window.clippyHelp;
    const lower = String(text || '').toLowerCase().replace(/ё/g, 'е');
    const tier = talk && talk.tier ? talk.tier() : 'neutral';
    if (talk && talk.isSulking && talk.isSulking()) return 'Я обижаюсь. Но отвечаю, потому что вежливый.';
    if (/^(привет|здравств[а-я]*|хай|хэй|hi|hello|ку)(?![a-zа-я])/.test(lower)) {
      return { cold: 'Здравствуйте.', neutral: 'Привет! Это Скрепыш. Чем помочь?', warm: 'Привет! Рад, что вы написали.', friend: 'Привет-привет! Мой любимый пользователь в сети!' }[tier];
    }
    if (lower.includes('как дела') || lower.includes('как ты')) {
      const arc = talk ? talk.state.arc : 0;
      if (arc >= 1 && arc <= 3) return 'Нормально. Всё нормально. Кстати, вы давно сохранялись? Ctrl+S.';
      return { cold: 'Штатно. Ошибок не обнаружено.', neutral: 'Отлично! Драйверы на месте, кофе виртуальный, но горячий.', warm: 'Лучше всех: вы же пишете мне в ICQ!', friend: 'Когда вы рядом — как на свежеотформатированном диске!' }[tier];
    }
    if (lower.includes('rocky') || lower.includes('роки')) {
      const arc = talk ? talk.state.arc : 0;
      if (arc >= 7) return 'Rocky хороший. Мы иногда видимся. Он передаёт «Гав». Это значит «привет».';
      if (arc >= 1) return 'Rocky? Не знаю такого. То есть знаю. То есть давайте про Ctrl+S.';
      return 'Rocky? Первый раз слышу. Это какая-то новая программа?';
    }
    if (lower.includes('люблю') || lower.includes('спасибо') || lower.includes('молодец')) {
      if (talk) talk.adjustAffinity(1);
      return 'Ой. Я бы покраснел, но я из нержавеющей стали. Спасибо!';
    }
    const answer = help && help.icqAnswer ? help.icqAnswer(text) : null;
    if (answer) return `Похоже, вы спрашиваете ${answer} Если хотите, сделаю сам: нажмите F1 на рабочем столе.`;
    if (lower.includes('?')) return 'Хороший вопрос. Точного ответа нет, но на рабочем столе я умею искать: нажмите F1 и спросите своими словами.';
    const small = {
      cold: ['Принято.', 'Записал.', 'Хорошо.'],
      neutral: ['Интересно! Расскажите ещё.', 'Записал в журнал событий.', 'Похоже, вы пишете письмо. Шучу, это ICQ. Привычка.'],
      warm: ['Обожаю наши разговоры. Даже по модему.', 'Ха! Сохраню это сообщение. Ctrl+S.', 'Пишите ещё. Я подожду, у меня как раз свободный такт процессора.'],
      friend: ['Вы лучший собеседник в этой локальной сети.', 'Сохранил в особый файл. Скрытый. Только для чтения.', 'Знаете, без вас было бы совсем тихо.']
    }[tier];
    return small[Math.floor(Math.random() * small.length)];
  }

  tick() {
    const clippy = this.clippy();
    const talk = this.talk();
    const icq = window.appICQ;
    if (!clippy || !talk || !icq || this.trayPinged || !clippy.isRunning() || clippy.visible) return;
    if (!talk.hiddenAt || Date.now() - talk.hiddenAt < 15 * 60000 || typeof icq.receiveMessage !== 'function') return;
    this.trayPinged = true;
    icq.receiveMessage('clippy', 'Я тут, в трее, у часов. Ничего не надо, просто напоминаю. Щёлкните по скрепке, если что.');
  }

  watchGames() {
    const gm = window.gameManager;
    if (this.knownGames || !gm || typeof gm.addListener !== 'function' || !gm.state) return;
    this.knownGames = new Set(gm.state.installed || []);
    this.knownPurchases = new Set(gm.state.purchased || []);
    gm.addListener(state => this.onGamesChanged(state));
  }

  onGamesChanged(state) {
    const gm = window.gameManager;
    const fresh = (state.installed || []).filter(id => !this.knownGames.has(id));
    const bought = (state.purchased || []).filter(id => !this.knownPurchases.has(id));
    fresh.forEach(id => this.knownGames.add(id));
    bought.forEach(id => this.knownPurchases.add(id));
    const clippy = this.clippy();
    if (!clippy || !clippy.visible || clippy.annoyance === 'quiet' || clippy.opt('appReactions') === false || !gm) return;
    const installed = fresh.find(id => gm.catalog[id] && gm.catalog[id].steam);
    if (installed) {
      const game = gm.catalog[installed];
      clippy.animate('congratulate');
      clippy.speak(`Установка завершена: <strong>${this.esc(game.title)}</strong>. Ярлык уже на рабочем столе. Запустим?`, [
        { text: '▶ Играть', action: () => { if (game.launch) game.launch(); } },
        { text: '• Потом', action: () => {} }
      ], '🎮', 14000);
      return;
    }
    const purchased = bought.find(id => gm.catalog[id] && gm.catalog[id].steam);
    if (purchased) clippy.speak(`Покупка оформлена: <strong>${this.esc(gm.catalog[purchased].title)}</strong>. Чек придёт на почту. Спрячьте его от бухгалтерии.`, [], '🧾', 8000);
  }

  onFileDeleted(pathParts, item) {
    const vfs = window.vfs;
    const bin = vfs && vfs.getRecycleBinItems ? vfs.getRecycleBinItems() : [];
    if (window.clippyTips) window.clippyTips.onBinCount(bin.length);
    const clippy = this.clippy();
    const name = item ? (item.name || '') : '';
    if (!clippy || !clippy.visible || !name) return false;
    if (name === 'Письмо от Скрепыша.txt') {
      clippy.flash('sulking', 3000);
      clippy.speak('Вы выбросили моё письмо? ...Ничего. Я помню его наизусть.', [
        { text: '• Ой, верни его', action: () => this.restoreFromBin(name) },
        { text: '• Пусть лежит', action: () => {} }
      ], '🥲', 14000);
      return true;
    }
    if (name === 'Дневник Скрепыша.txt') {
      clippy.speak('Мой дневник! ...Ладно. Значит, вы его прочитали. Он всё равно допишется сам.', [], '😳', 9000);
      return true;
    }
    if (name === 'Если соскучитесь.txt') {
      clippy.speak('Правильно. Вы и так знаете, как меня позвать.', [], '🙂', 7000);
      return true;
    }
    if (/\.ac[ts]$/i.test(name)) {
      clippy.speak(`Вы удалили ${this.esc(name)}? Это же коллега! Вернуть его можно из Корзины.`, [
        { text: '• Восстановить', action: () => this.restoreFromBin(name) },
        { text: '• Так надо', action: () => {} }
      ], '😟', 10000);
      return true;
    }
    return false;
  }

  restoreFromBin(name) {
    const vfs = window.vfs;
    const result = vfs && vfs.restoreRecycleBinItem ? vfs.restoreRecycleBinItem(name) : null;
    const clippy = this.clippy();
    if (result && result.success && clippy) clippy.speak('Вернул на место. Спасибо.', [], '😊', 5000);
    return Boolean(result && result.success);
  }

  onRecycleBinEmptied(items) {
    const clippy = this.clippy();
    if (!clippy || !clippy.visible) return;
    clippy.animate('trash');
    const names = (items || []).map(i => i.name);
    if (names.includes('Письмо от Скрепыша.txt')) {
      clippy.speak('Письмо стёрто. Но я его сохранил. В себе. Ctrl+S.', [], '🫡', 9000);
      return;
    }
    if (clippy.annoyance === 'quiet' || (this.binLine && clippy.annoyance !== 'chaos') || !names.length) return;
    this.binLine = true;
    clippy.speak(`Корзина пуста! Удалено объектов: ${names.length}. Диск C: дышит свободнее.`, [], '🗑️', 6000);
  }

  unsavedDocuments() {
    const wm = window.winManager;
    const out = [];
    if (!wm || !wm.windows) return out;
    wm.windows.forEach((win, id) => {
      if (typeof win.isModified === 'function' && win.isModified()) out.push({ id, title: win.title || id });
    });
    return out;
  }

  onShutdownDialog() {
    const clippy = this.clippy();
    if (!clippy || !clippy.visible) return;
    const unsaved = this.unsavedDocuments();
    if (unsaved.length) {
      const first = unsaved[0];
      const what = unsaved.length === 1 ? `В окне «${this.esc(first.title)}» есть несохранённый текст.` : `Несохранённых документов: ${unsaved.length}.`;
      clippy.speak(`Подождите! ${what} Сохранить перед выключением?`, [
        { text: '• Показать документ', action: () => {
          const wm = window.winManager;
          if (wm.windows.has('app_shutdown_dialog')) wm.closeWindow('app_shutdown_dialog');
          if (wm.windows.has(first.id)) {
            if (wm.windows.get(first.id).isMinimized) wm.restoreWindow(first.id);
            else wm.bringToTop(first.id);
          }
        } },
        { text: '• Выключать всё равно', action: () => {} }
      ], '💾', 0, { anim: 'save' });
      return;
    }
    if (clippy.annoyance === 'quiet') return;
    const hour = new Date().getHours();
    clippy.speak(hour >= 18 || hour < 5
      ? 'Уже уходите? Несохранённого нет, я проверил. До завтра! Я посторожу рабочий стол.'
      : 'Выключаемся? Несохранённого нет, я проверил. До встречи!', [], '👋', 8000, { anim: 'wave' });
  }

  checkNeko() {
    const neko = window.appNeko;
    const clippy = this.clippy();
    if (!neko || !neko.enabled || !clippy || !clippy.visible || !clippy.charEl || !clippy.charEl.getBoundingClientRect) return;
    if (clippy.balloonOpen()) return;
    const r = clippy.charEl.getBoundingClientRect();
    const d = Math.hypot(neko.x - (r.left + r.width / 2), neko.y - (r.top + r.height / 2));
    if (d < 110 && !this.nekoSeen) {
      this.nekoSeen = true;
      clippy.animate('lookAround');
      clippy.speak('Скрибл?! Ты как сюда... А, это Neko. Тоже кот, но не из Office. Привет, коллега. Только Caps Lock не трогай.', [], '🐈', 8000);
      return;
    }
    if (d < 70 && neko.state === 'sleeping' && !this.nekoNap) {
      this.nekoNap = true;
      clippy.speak('Тсс. Кот уснул у меня под боком. Не двигайте мышь, пожалуйста. Хотя бы минутку.', [], '😴', 7000);
    }
  }

  dayOfYear(date) {
    return Math.round((Date.UTC(date.getFullYear(), date.getMonth(), date.getDate()) - Date.UTC(date.getFullYear(), 0, 0)) / 86400000);
  }

  todayEvent(date = new Date()) {
    const md = `${date.getMonth() + 1}-${date.getDate()}`;
    if (md === '11-19') return 'dayBirthday';
    if (md === '6-25') return 'dayWin98';
    if (md === '12-31' || md === '1-1') return 'dayNewYear';
    if (md === '4-1') return 'dayAprilFools';
    if (this.dayOfYear(date) === 256) return 'dayProgrammer';
    return null;
  }

  statusLines() {
    const clippy = this.clippy();
    const talk = this.talk();
    const options = window.clippyOptions;
    const running = Boolean(clippy && clippy.isRunning());
    const where = !running ? 'нет' : (clippy.visible ? (clippy.state === 'sleeping' ? 'спит на рабочем столе' : 'на рабочем столе') : 'в трее');
    return [
      `CLIPPY.EXE   PID 1997   ${running ? 'работает' : 'не запущен'}`,
      `Где сейчас:      ${where}`,
      `Автозагрузка:    ${options && options.get('enabled') === false ? 'выключена' : 'включена'}`,
      `Назойливость:    ${clippy ? { quiet: 'спокойная', normal: 'обычная', chaos: 'полный хаос' }[clippy.annoyance] : '-'}`,
      `Привязанность:   ${talk ? talk.state.affinity : 0}`,
      `Глава истории:   ${talk ? talk.state.arc : 0} из 9`
    ];
  }

  dosCommand(args = []) {
    const clippy = this.clippy();
    const arg = String(args[0] || '').toLowerCase();
    if (arg === '/?' || arg === '-?' || arg === '/help') {
      return [
        'Запускает помощника Office.',
        '',
        'CLIPPY [/SHOW | /HIDE | /STATUS | вопрос]',
        '',
        '  /SHOW     Показать Скрепыша на рабочем столе.',
        '  /HIDE     Спрятать Скрепыша в трей.',
        '  /STATUS   Показать состояние помощника.',
        '  вопрос    Спросить Скрепыша, например: CLIPPY как сменить обои'
      ];
    }
    if (arg === '/status') return this.statusLines();
    if (arg === '/hide') {
      if (clippy && clippy.visible) clippy.hide();
      return ['Скрепыш спрятан в трей.'];
    }
    if (!args.length || arg === '/show') {
      if (clippy) clippy.launch('dos');
      return ['Скрепыш запущен. Смотрите в правый нижний угол.'];
    }
    const question = args.join(' ');
    if (clippy) clippy.ask(question);
    return [`Вопрос передан Скрепышу: «${question}»`];
  }
}

window.clippySystem = new ClippySystem();
