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
    if (lower.includes('neko') || lower.includes('неко') || lower.includes('котик') || lower.includes('кошк') || lower.includes('мяу') || lower.includes('мур')) {
      if (window.appNeko && window.appNeko.enabled) {
        return 'Neko сейчас носится по рабочему столу за курсором! Если свернёте мне черновик, я скатаю ему бумажный шарик.';
      }
      return 'Котик Neko 98 живёт в C:\\WINDOWS\\NEKO.EXE (или во вкладке «Рабочий стол» Свойств экрана). Выпустите его — мы отлично ладим!';
    }
    if (lower.includes('овечк') || lower.includes('овца') || lower.includes('овец') || lower.includes('бараш') || lower.includes('esheep') || lower.includes('sheep') || lower.includes('бе-е')) {
      if (window.appESheep && window.appESheep.enabled) {
        return 'Овечка По сейчас как раз бегает у меня над головой! Главное, чтобы не начала жевать мои советы про Ctrl+S.';
      }
      if (window.gameManager && window.gameManager.isInstalled && window.gameManager.isInstalled('esheep')) {
        return 'Овечка По из Sheep.exe уже установлена! Запустите её ярлык на рабочем столе — пусть побегает по заголовкам окон.';
      }
      return 'Овечка По (eSheep 98) бесплатно раздаётся в SoftStore \'98 (www.softstore98.com). Скачайте, мне в углу монитора будет веселее!';
    }
    if (lower.includes('охота на скрепки') || lower.includes('офисный тир') || lower.includes('moorhunt')) {
      return 'В «Офисном Тире» (MOORHUNT.EXE) на диске «Офисные игры ’98» за меня дают 100 очков, но я убедительно прошу стрелять по часам (+5 секунд) и бумажным самолётикам! А при шагах начальника жмите F12.';
    }
    if (lower.includes('офисные игры') || lower.includes('office games') || lower.includes('цветные линии') || lower.includes('lines 98') || lower.includes('lines98') || lower.includes('гонки на креслах') || lower.includes('побег в 18') || lower.includes('офисный арканоид')) {
      return 'Сборник «Офисные игры ’98» вставляется в привод D: через значок CD-ROM в трее (файл D:\\LAUNCHER.EXE). Там восемь игр от «Цветных Линий 98» до «Гонок на креслах», и в каждой клавиша F12 прячет игру за таблицей Microslop Excel!';
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
    this.chimeIfClockHidden();
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
    if (fresh.includes('esheep') && gm.catalog.esheep) {
      clippy.animate('congratulate');
      clippy.speak('Установка завершена: <strong>eSheep 98 (Sheep.exe)</strong>! Ярлык уже на рабочем столе. Выпустим овечку По на панель задач?', [
        { text: '▶ Выпустить овечку', action: () => { if (gm.catalog.esheep.launch) gm.catalog.esheep.launch(); } },
        { text: '• Свойства eSheep', action: () => { if (window.appESheep) window.appESheep.openSettings(); } }
      ], '🐑', 14000);
      return;
    }
    const installed = fresh.find(id => gm.catalog[id] && (gm.catalog[id].steam || gm.catalog[id].cdDemo));
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

  onDisplayEffectsChanged(changes) {
    const clippy = this.clippy();
    if (!clippy || !clippy.visible || !changes || clippy.opt('appReactions') === false) return false;
    const reaction = this.displayEffectReaction(changes);
    if (!reaction) return false;
    if (clippy.annoyance === 'quiet' && !reaction.personal) return false;
    this.effectLines = this.effectLines || new Set();
    if (this.effectLines.has(reaction.id) && clippy.annoyance !== 'chaos') return false;
    this.effectLines.add(reaction.id);
    if (reaction.anim) clippy.animate(reaction.anim);
    if (reaction.onShow) reaction.onShow(clippy);
    const actions = reaction.undo ? [
      { text: '• Верни как было', action: () => { reaction.undo(); clippy.speak('Вернул как было.', [], '↩️', 4000); } },
      { text: '• Так и оставим', action: () => {} }
    ] : [];
    clippy.speak(reaction.text, actions, reaction.mood, 12000);
    return true;
  }

  displayEffectReaction({ flags = {}, icons = [], values = {} }) {
    const dialogs = window.appDialogs;
    if (values.colorDepth) return this.colorDepthReaction(values.colorDepth);
    const flagLines = {
      iconColors: {
        false: { mood: '🎨', anim: 'lookAround', text: 'Ой. Значки теперь в шестнадцати цветах. И я, кажется, тоже. Совсем как в Win 3.1.' },
        true: { mood: '🌈', anim: 'congratulate', text: 'Цвета вернулись. Все 16,7 миллиона, я пересчитал.' }
      },
      animateUi: {
        false: { mood: '⏱️', anim: 'think', text: 'Меню теперь не выезжают, а сразу появляются, и свёрнутые окна больше не летят на панель задач. Быстро. Двигаться буду я один.' },
        true: { mood: '✨', anim: 'wave', text: 'Меню снова выезжают плавно, а свёрнутые окна улетают на панель задач. Так мне больше нравится.' }
      },
      crtEnabled: {
        false: { mood: '📺', anim: 'lookAround', text: 'Полоски развёртки пропали, экран стал плоским. Глазам спокойнее, а мне непривычно: я вырос внутри кинескопа.' },
        true: { mood: '📺', anim: 'stretch', text: 'Полоски вернулись. Снова как настоящий 15-дюймовый монитор. Только не садитесь к нему слишком близко.' }
      },
      fontSmoothing: {
        false: { mood: '🔍', anim: 'search', text: 'Края букв стали ступеньками. Зато каждый пиксель на своём месте, как в 1998 году.' },
        true: { mood: '🔍', anim: 'search', text: 'Края букв снова гладкие. Мои советы теперь читаются мягче.' }
      },
      largeIcons: {
        true: { mood: '🔎', anim: 'stretch', text: 'Значки подросли. Если какие-то разъехались, щёлкните по рабочему столу правой кнопкой и выберите «Упорядочить значки».' },
        false: { mood: '🗂️', text: 'Значки снова обычного размера. На столе стало просторнее.' }
      },
      fullDrag: {
        false: { mood: '🖼️', anim: 'think', text: 'Теперь при перетаскивании едет только рамка, а окно встаёт на место, когда вы отпустите кнопку. Старый компьютер скажет спасибо.' },
        true: { mood: '🖼️', text: 'Окна снова двигаются целиком. Красиво, только процессору придётся потрудиться.' }
      }
    };
    const iconLines = {
      'my-computer': { mood: '💻', text: '«Мой компьютер» выглядит по-новому. Внутри всё по-прежнему, я проверил.' },
      'my-documents': { mood: '📁', anim: 'save', text: 'У «Моих документов» новый значок. Документы внутри те же. Сохраняйтесь почаще!' },
      network: { mood: '🌐', text: '«Сетевое окружение» сменило значок. Соседи по сети ничего не заметят.' },
      'recycle-bin': { mood: '🗑️', anim: 'trash', text: 'У Корзины новый значок. Мусору всё равно, а мне нравится.' },
      'recycle-bin-empty': { mood: '🗑️', anim: 'trash', text: 'У пустой Корзины новый значок. Мусору всё равно, а мне нравится.' }
    };
    const undoIcon = change => () => {
      if (!dialogs) return;
      const next = { ...(dialogs.getDisplaySettings().desktopIcons || {}) };
      if (change.previous) next[change.slot] = change.previous;
      else delete next[change.slot];
      dialogs.setDisplayEffects({ desktopIcons: next }, 'clippy');
    };

    const self = icons.find(change => change.icon === 'clippy');
    if (self) {
      const talk = this.talk();
      const bin = self.slot === 'recycle-bin' || self.slot === 'recycle-bin-empty';
      return {
        id: `icon:${self.slot}:clippy`,
        personal: true,
        mood: bin ? '😅' : '🥹',
        anim: bin ? 'trash' : 'congratulate',
        text: bin
          ? 'Я теперь значок Корзины? Ладно. Главное, чтобы меня не очистили вместе с ней.'
          : 'Это же я! Теперь меня видно на рабочем столе, даже когда я сижу в трее. Спасибо.',
        onShow: clippy => {
          if (bin) return;
          if (typeof clippy.setAccessory === 'function') {
            clippy.setAccessory('blush', true);
            setTimeout(() => clippy.setAccessory('blush', false), 5000);
          }
          if (talk && typeof talk.adjustAffinity === 'function') talk.adjustAffinity(1);
        },
        undo: undoIcon(self)
      };
    }

    const key = ['iconColors', 'animateUi', 'crtEnabled', 'fontSmoothing', 'largeIcons', 'fullDrag'].find(k => k in flags);
    if (key) {
      const value = flags[key];
      return {
        id: `${key}:${value}`,
        ...flagLines[key][value],
        undo: () => dialogs && dialogs.setDisplayEffects({ [key]: !value }, 'clippy')
      };
    }

    const change = icons[0];
    if (!change) return null;
    if (!change.icon) {
      return { id: `icon:${change.slot}:default`, mood: '🙂', text: 'Значок снова обычный. Классика не устаревает.', undo: undoIcon(change) };
    }
    const line = iconLines[change.slot];
    return line ? { id: `icon:${change.slot}:${change.icon}`, ...line, undo: undoIcon(change) } : null;
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
    const clawd = typeof neko.isClawd === 'function' && neko.isClawd();
    if (clawd) {
      this.checkClawd(neko, clippy, d);
      return;
    }
    if (d < 120 && !this.nekoSeen) {
      this.nekoSeen = true;
      clippy.animate('lookAround');
      clippy.speak('Скрибл?! Ты как выбрался из папки <code>ACT</code>?.. А, это <strong>Neko 98</strong>! Шерсть в 32×32 пикселя, усы без сглаживания. Привет, усатый! Хотите, скатаю ему шарик из черновика?', [
        { text: '• Кинуть бумажный шарик', action: () => neko.playWithClippy('paper') },
        { text: '• Погладить Neko', action: () => neko.petCat() },
        { text: '• Корзинка Neko 98', action: () => neko.openBasket() }
      ], '🐈', 10000);
      return;
    }
    if (d < 85 && neko.state === 'sleeping' && !this.nekoNap) {
      this.nekoNap = true;
      clippy.speak('Тсс. Neko свернулся клубком прямо у моей подставки и сопит в 256 цветах. Не дёргайте мышь хотя бы полминутки — пусть досмотрит сон про курсор.', [
        { text: '• Насыпать рыбки к пробуждению', action: () => neko.spawnToy('fish') },
        { text: '• Не будить', action: () => {} }
      ], '😴', 9000);
      return;
    }
    if (d < 95 && neko.state === 'scratching' && !this.nekoScratch) {
      this.nekoScratch = true;
      clippy.animate('congratulate');
      clippy.speak('Эй-эй, полегче с когтями! Рамка окна казённая, а я вообще из проволоки толщиной 0,9 мм — об меня когти точить скользко! Возьми лучше клубок.', [
        { text: '• Бросить красный клубок', action: () => neko.spawnToy('yarn') },
        { text: '• Бросить бумажный шарик', action: () => neko.playWithClippy('paper') }
      ], '🧶', 9000);
    }
  }

  checkClawd(clawd, clippy, d) {
    if (d < 120 && !this.clawdSeen) {
      this.clawdSeen = true;
      clippy.animate('lookAround');
      clippy.speak('Коллега! Clawd подошёл вплотную к моей подставке. Давай договоримся: я подсказываю, как написать письмо, а ты — как его вообще не писать, а поручить программе. По рукам? Ой, по клешням.', [
        { text: '• Пас черновиком новичку', action: () => clawd.playWithClippy('paper') },
        { text: '• Пусть Clawd подумает', action: () => clawd.think() },
        { text: '• Корзинка Neko 98', action: () => clawd.openBasket() }
      ], '🧡', 10000);
      return;
    }
    if (d < 85 && clawd.state === 'sleeping' && !this.clawdNap) {
      this.clawdNap = true;
      clippy.speak('Тсс. Clawd задремал у моей подставки и ждёт следующего запроса. Наверное, ему снятся бесконечные токены. Не будем шуршать мышкой.', [
        { text: '• Не будить', action: () => {} }
      ], '😴', 9000);
      return;
    }
    if (d < 95 && clawd.state === 'scratching' && !this.clawdTap) {
      this.clawdTap = true;
      clippy.animate('think');
      clippy.speak('Слышите, как Clawd стучит клешнёй по рамке окна? Тук-тук, тук-тук. Это он не когти точит, это он так печатает. Без клавиатуры. Я даже немного завидую.', [
        { text: '• Бросить клубок', action: () => clawd.spawnToy('yarn') }
      ], '⌨️', 9000);
    }
  }

  onClawdArrived(clippy, clawd) {
    const talk = this.talk();
    const firstMeeting = !(talk && talk.hasFlag && talk.hasFlag('metClawd'));
    if (talk && talk.setFlag) talk.setFlag('metClawd');
    clippy.wakeUp(false);
    if (firstMeeting) {
      clippy.animate('lookAround');
      clippy.sound('playClippyWhistle');
      clippy.speak('Погодите... Это уже не кот. Оранжевый, квадратный, вместо ушей клешни, а глаза как два курсора в режиме вставки. Это же <strong>Clawd</strong>, талисман <strong>Claude</strong>! Вы набрали C-L-A-U-D-E прямо в корзинке? Ещё один помощник на моём рабочем столе... Ладно, коллега, добро пожаловать. Но учти: у меня стаж с Office 97!', [
        { text: '• Познакомиться поближе', action: () => clawd.playWithClippy('greet') },
        { text: '• Пас черновиком новичку', action: () => clawd.playWithClippy('paper') },
        { text: '• Верните котика!', action: () => clawd.toggleClawd() }
      ], '🧡', 14000);
      return;
    }
    clippy.animate('wave');
    clippy.speak('Clawd снова на смене! Два ассистента на один рабочий стол: у меня письма и отчёты, у него код. Главное, чтобы он не начал рефакторить мои советы.', [
      { text: '• Пусть Clawd подумает', action: () => clawd.think() },
      { text: '• Пас черновиком', action: () => clawd.playWithClippy('paper') }
    ], '🧡', 9000);
  }

  onNekoDroppedOnClippy(neko) {
    const clippy = this.clippy();
    const cat = neko || window.appNeko;
    if (!clippy || !clippy.visible || !cat) return;
    if (this.talk() && this.talk().adjustAffinity) this.talk().adjustAffinity(1);
    clippy.wakeUp(false);
    clippy.animate('congratulate');
    if (typeof cat.isClawd === 'function' && cat.isClawd()) {
      clippy.speak('Ой! Clawd у меня на макушке! Клешни мягкие, пиксели тёплые. Только, пожалуйста, не переписывай мои подсказки, они и так проверены с 1997 года!', [
        { text: '• Кинуть ему бумажный шарик', action: () => cat.playWithClippy('paper') },
        { text: '• Пусть Clawd подумает', action: () => cat.think() }
      ], '🧡', 10000);
      return;
    }
    clippy.speak('Ой! Вы посадили Neko прямо мне на макушку! Я, конечно, из закалённой канцелярской стали, но он же тёплый и щекочет усами мои пластиковые брови!', [
      { text: '• Кинуть ему бумажный шарик', action: () => cat.playWithClippy('paper') },
      { text: '• Угостить рыбкой', action: () => cat.spawnToy('fish') },
      { text: '• Открыть корзинку Neko', action: () => cat.openBasket() }
    ], '😻', 10000);
  }

  checkDroppedNearNeko() {
    const neko = window.appNeko;
    const clippy = this.clippy();
    if (!neko || !neko.enabled || !clippy || !clippy.visible || !clippy.charEl || !clippy.charEl.getBoundingClientRect) return false;
    const r = clippy.charEl.getBoundingClientRect();
    const cx = r.left + r.width / 2;
    const cy = r.top + r.height / 2;
    const d = Math.hypot(neko.x - cx, neko.y - cy);
    if (d > 105) return false;
    neko.x = Math.max(20, Math.min(window.innerWidth - 20, cx - 34));
    neko.y = Math.max(20, Math.min(window.innerHeight - 52, cy + 12));
    neko.setState('purring');
    neko.spawnHeart(neko.x, neko.y - 16);
    neko.playSound('purr');
    clippy.animate('wave');
    if (typeof neko.isClawd === 'function' && neko.isClawd()) {
      clippy.speak('Переехали поближе к Clawd! Два ассистента в одном углу экрана: у меня скрепка, у него клешни. Пользователь, вы теперь под двойным присмотром.', [
        { text: '• Скатаем бумажный шарик!', action: () => neko.playWithClippy('paper') },
        { text: '• Пусть Clawd подумает', action: () => neko.think() }
      ], '🧡', 9000);
      return true;
    }
    clippy.speak('Переехали поближе к коту! Отличное соседство: я слежу за орфографией, а Neko — чтобы курсор не ленился.', [
      { text: '• Скатаем бумажный шарик!', action: () => neko.playWithClippy('paper') },
      { text: '• Насыпать рыбки', action: () => neko.spawnToy('fish') }
    ], '🐾', 9000);
    return true;
  }

  onNekoEvent(kind, neko) {
    const clippy = this.clippy();
    const cat = neko || window.appNeko;
    if (!clippy || !clippy.visible || !cat) return;
    const userAction = ['paper_returned', 'scribble_coat', 'clawd', 'clawd_off'].includes(kind);
    if (clippy.annoyance === 'quiet' && !userAction) return;
    const now = Date.now();
    this._nekoEvtAt = this._nekoEvtAt || {};
    if (!userAction && now - (this._nekoEvtAt[kind] || 0) < 25000) return;
    this._nekoEvtAt[kind] = now;
    const clawd = typeof cat.isClawd === 'function' && cat.isClawd();
    if (kind === 'clawd') {
      this.onClawdArrived(clippy, cat);
      return;
    }
    if (kind === 'clawd_off') {
      clippy.wakeUp(false);
      clippy.animate('wave');
      clippy.speak('Котик вернулся! Clawd, наверное, ушёл в терминал дописывать чей-то код. Признаюсь честно: мне его уже не хватает. Захотите позвать обратно — наберите те же шесть букв в корзинке.', [
        { text: '• Погладить котика', action: () => cat.pet() }
      ], '👋', 9000);
      return;
    }
    if (clawd && kind === 'paper_returned') {
      clippy.animate('congratulate');
      clippy.speak('Clawd отбил черновик клешнёй точно мне в руки! Ровно, без опечаток и с первой попытки. Кажется, перед подачей он секунд пять подумал.', [
        { text: '• Ещё подачу!', action: () => cat.playWithClippy('paper') },
        { text: '• Пусть Clawd подумает', action: () => cat.think() }
      ], '⚽', 9000);
      return;
    }
    if (clawd && (kind === 'fish' || kind === 'purr' || kind === 'yarn')) {
      if (clippy.balloonOpen()) return;
      const lines = {
        fish: 'Рыбку для Clawd? Он съел её за полсекунды и вежливо поблагодарил. Хорошо, что у кинескопа запахи не передаются через видеокарту.',
        purr: 'Clawd не мурлычет, а тихо жужжит, как жёсткий диск при индексации. Это у него вместо «спасибо».',
        yarn: 'Клубок в клешнях! Clawd распутал нитку быстрее, чем я успел предложить мастер распутывания нитей.'
      };
      clippy.speak(lines[kind], [], '🧡', 7500);
      return;
    }
    if (kind === 'paper_returned') {
      clippy.animate('congratulate');
      clippy.speak('Оп-па, какой пас! Neko отбил скомканный черновик прямо мне в руки. Вратарь сборной <code>C:\\WINDOWS</code>! Ещё подачу?', [
        { text: '• Бросить шарик ещё раз!', action: () => cat.playWithClippy('paper') },
        { text: '• Наградить рыбкой', action: () => cat.spawnToy('fish') }
      ], '⚽', 9000);
    } else if (kind === 'scribble_coat') {
      clippy.animate('lookAround');
      clippy.speak('Не может быть... Клетчатая бумага, синие чернила и складки оригами! Вы переключили Neko в окрас <strong>Скрибла</strong> (<code>SCRIBBLE.ACT</code>)! Прямо как в старом добром Office 97.', [
        { text: '• Бросить бумажный шарик коллеге', action: () => cat.playWithClippy('paper') }
      ], '📝', 9500);
    } else if (kind === 'yarn') {
      if (clippy.balloonOpen()) return;
      clippy.speak('Красный шерстяной клубок! Только следите, чтобы нитка не намоталась на шарик вашей мышки — чистить валики потом придётся спиртом.', [], '🧶', 7500);
    } else if (kind === 'fish') {
      if (clippy.balloonOpen()) return;
      clippy.speak('Свежая рыбка прямо на рабочем столе! Хорошо, что у кинескопа запахи не передаются через видеокарту.', [], '🐟', 7500);
    } else if (kind === 'purr') {
      if (clippy.balloonOpen()) return;
      clippy.speak('Слышите, как тарахтит через PC Speaker? Настоящий 8-битный трактор.', [], '🎶', 6500);
    }
  }

  checkESheep() {
    const es = window.appESheep;
    const clippy = this.clippy();
    const list = es && (Array.isArray(es.sheepList) ? es.sheepList : (Array.isArray(es.flock) ? es.flock : null));
    if (!es || !es.enabled || !list || !list.length || !clippy || !clippy.visible || !clippy.charEl || !clippy.charEl.getBoundingClientRect) return;
    if (clippy.annoyance === 'quiet' || clippy.balloonOpen()) return;
    const r = clippy.charEl.getBoundingClientRect();
    const cx = r.left + r.width / 2;
    const cy = r.top + r.height / 2;
    const half = typeof es.getSpriteSize === 'function' ? es.getSpriteSize() * 0.5 : 20;
    for (const s of list) {
      if (!s) continue;
      if ((s.anim === 'climb_up' || s.anim === 'ceiling_walk') && !this.esheepCeiling) {
        this.esheepCeiling = true;
        clippy.animate('lookAround');
        clippy.speak('Посмотрите наверх! Овечка ползёт по кромке кинескопа вниз головой! Мне за пределы моего угла выходить нельзя по уставу, а ей хоть бы хны.', [
          { text: '• Спустить её вниз', action: () => { s.surfaceId = null; es.setAnim(s, 'fall'); } },
          { text: '• Пусть тренируется', action: () => {} }
        ], '🧗', 9500);
        return;
      }
      const d = Math.hypot((s.x + half) - cx, (s.y + half) - cy);
      if (d < 115 && !this.esheepSeen) {
        this.esheepSeen = true;
        clippy.animate('lookAround');
        clippy.speak('Ого, овечка По из <strong>Sheep.exe</strong>! Гуляет прямо по панели задач, и никакой лицензии Office ей не надо. Главное, чтобы не приняла мой жёлтый блокнот за одуванчик.', [
          { text: '• Покормить ромашками', action: () => es.triggerCommand('eat_daisy', s) },
          { text: '• Покажи сальто!', action: () => es.triggerCommand('cartwheel', s) },
          { text: '• Свойства eSheep 98', action: () => es.openSettings() }
        ], '🐑', 10000);
        return;
      }
      if (d < 95 && typeof s.anim === 'string' && s.anim.startsWith('sleep') && !this.esheepNap) {
        this.esheepNap = true;
        clippy.speak('Тсс. Овечка уснула прямо у меня под боком и пускает буковки Zzz. Не щёлкайте мышью громко, пусть досмотрит сон.', [], '😴', 8000);
        return;
      }
    }
  }

  onESheepDroppedOnClippy(sheep) {
    const es = window.appESheep;
    const clippy = this.clippy();
    if (!es || !clippy || !clippy.visible) return false;
    this.esheepSeen = true;
    this.esheepDropCount = (this.esheepDropCount || 0) + 1;
    const lines = [
      'Ой! Щекотно! Вы посадили овечку прямо на меня. У меня от её шерсти наэлектризовались брови — сейчас притяну все скрепки из ящика стола!',
      'Осторожнее, я вешу один грамм, а она целых сорок на сорок пикселей! Зато тёплая. В папке Office все холодные, кроме разве что кота Скрибла.',
      'Приземлилась точно на мой блокнот. Только пусть не жуёт угол — там записаны все ваши несохранённые черновики!'
    ];
    const line = lines[(this.esheepDropCount - 1) % lines.length];
    clippy.animate('wave');
    clippy.speak(line, [
      {
        text: '• Угостить ромашкой',
        action: () => {
          es.triggerCommand('eat_daisy', sheep);
          clippy.speak('Хрустит! Хорошо, что ромашка пиксельная, а не из отчёта в Excel.', [], '🌼', 6500);
        }
      },
      {
        text: '• Попросить сделать сальто',
        action: () => {
          es.triggerCommand('cartwheel', sheep);
          clippy.speak('Вот это кульбит! Я так пробовал в 1997-м — завязался узлом, еле разогнули пассатижами.', [], '🤸', 7500);
        }
      },
      {
        text: '• Пусть вздремнёт рядом',
        action: () => {
          es.triggerCommand('sleep1', sheep);
          clippy.speak('Тсс. Пусть спит, я покараулю курсор.', [], '😴', 6000);
        }
      }
    ], '🐑', 12000);
    return true;
  }

  onESheepEvent(kind, sheep) {
    const es = window.appESheep;
    const clippy = this.clippy();
    if (!es || !clippy || !clippy.visible || clippy.annoyance === 'quiet' || clippy.opt('appReactions') === false) return false;
    if (clippy.balloonOpen()) return false;
    const now = Date.now();
    this.esheepEventTimes = this.esheepEventTimes || {};
    if (now - (this.esheepEventTimes._any || 0) < 15000 && clippy.annoyance !== 'chaos') return false;
    if (now - (this.esheepEventTimes[kind] || 0) < 45000 && clippy.annoyance !== 'chaos') return false;

    if (kind === 'crowd') {
      if (this.esheepCrowdSeen && clippy.annoyance !== 'chaos') return false;
      this.esheepCrowdSeen = true;
      this.esheepEventTimes._any = now;
      this.esheepEventTimes.crowd = now;
      const count = Array.isArray(es.sheepList) ? es.sheepList.length : 5;
      clippy.animate('lookAround');
      clippy.speak(`На экране уже целая отара — ${count} штук! Если они сейчас все разом прыгнут на окно Блокнота, заголовок прогнётся. Позвать пастуха или добавим ещё?`, [
        { text: '• Ещё овечку!', action: () => { es.spawnSheep(); es.playSound('baa'); } },
        { text: '• Оставить одну', action: () => es.setFlockSize(1) },
        { text: '• Пусть гуляют', action: () => {} }
      ], '🐑', 11000);
      return true;
    }

    if (kind === 'meteor_bath') {
      this.esheepEventTimes._any = now;
      this.esheepEventTimes.meteor_bath = now;
      clippy.animate('lookAround');
      clippy.speak('С неба упал горящий метеорит прямо в чугунную ванну на панели задач! Хорошо, что у меня корпус из нержавейки — даже не закоптился.', [
        { text: '• Ещё раз в ванну!', action: () => es.triggerCommand('meteor_bath', sheep) },
        { text: '• Открыть свойства eSheep', action: () => es.openSettings() }
      ], '☄️', 10000);
      return true;
    }

    if (kind === 'ufo_alien') {
      this.esheepEventTimes._any = now;
      this.esheepEventTimes.ufo_alien = now;
      clippy.animate('lookAround');
      clippy.speak('Летающая тарелка над кнопкой «Пуск»! Пришелец спустился по лучу, потанцевал с овечкой и утащил её наверх! Кажется, пора писать рапорт в архив <strong>www.xfiles98.ru</strong>.', [
        { text: '• Открыть «Истина где-то рядом»', action: () => clippy.openInIE('http://www.xfiles98.ru') },
        { text: '• Выпустить ещё овечку', action: () => { es.spawnSheep(); es.playSound('baa'); } }
      ], '🛸', 11000);
      return true;
    }

    if (kind === 'black_sheep') {
      this.esheepEventTimes._any = now;
      this.esheepEventTimes.black_sheep = now;
      const talk = this.talk();
      clippy.speak('К нашей овечке пришла чёрная овечка! Постояли нос к носу, покраснели — и сердечко над панелью задач. Даже у экранных овец есть личная жизнь, а у меня только Ctrl+S.', [
        {
          text: '• Не грусти, Скрепыш',
          action: () => {
            if (talk && typeof talk.adjustAffinity === 'function') talk.adjustAffinity(1);
            if (typeof clippy.setAccessory === 'function') {
              clippy.setAccessory('blush', true);
              setTimeout(() => clippy.setAccessory('blush', false), 4500);
            }
            clippy.speak('Спасибо. Зато у нас с вами полное взаимопонимание по документам!', [], '🥹', 6500);
          }
        },
        { text: '• Угостить их ромашкой', action: () => es.triggerCommand('eat_daisy', sheep) }
      ], '🖤', 11000);
      return true;
    }

    if (kind === 'pee') {
      this.esheepEventTimes._any = now;
      this.esheepEventTimes.pee = now;
      clippy.speak('Эй! Она только что... прямо на панель задач! Клянусь проволокой, это не я — у меня вообще нет такой анимации в файле <code>CLIPPIT.ACS</code>!', [], '😳', 8500);
      return true;
    }

    return false;
  }

  onMouseClicksRescued(blockedClicks = 0, disableCount = 1) {
    const clippy = this.clippy();
    if (!clippy) return false;
    const talk = this.talk();
    const isRu = !window.i18n || window.i18n.getLanguage() === 'ru';

    if (!clippy.isRunning()) clippy.launch('mouse-rescue');
    else if (!clippy.visible) clippy.show();
    else if (typeof clippy.wakeUp === 'function') clippy.wakeUp(false);

    if (typeof clippy.tapScreen === 'function') clippy.tapScreen();
    if (typeof clippy.flash === 'function') clippy.flash('panic-shake', 1200);

    const n = Math.max(0, parseInt(blockedClicks, 10) || 0);
    const mod10 = n % 10;
    const mod100 = n % 100;
    const timesRu = (mod10 >= 2 && mod10 <= 4 && (mod100 < 12 || mod100 > 14)) ? 'раза' : 'раз';
    const timesEn = n === 1 ? 'time' : 'times';

    let text;
    if (disableCount >= 2) {
      text = isRu
        ? 'Опять эта галочка? Я уже дежурил у провода с отвёрткой.<br><br>Я снова включил щелчки мыши изнутри. Честно, я не знаю, зачем в Microslop её вообще добавили.'
        : 'That check box again? I was already standing by the mouse cord with a screwdriver.<br><br>I turned mouse clicking back on from the inside. Honestly, I don\'t know why Microslop put that there in the first place.';
    } else if (n > 0) {
      text = isRu
        ? `Тук-тук! Похоже, вы отключили щелчки мыши и уже ${n} ${timesRu} попытались нажать хоть куда-нибудь.<br><br>Не волнуйтесь, я снял эту галочку изнутри. Мышь снова работает!`
        : `Knock-knock! It looks like you disabled mouse clicking and tried to click ${n} ${timesEn} in a row.<br><br>Don't worry, I unchecked that box from the inside. Your mouse works again!`;
    } else {
      text = isRu
        ? 'Тук-тук! Похоже, вы отключили щелчки мыши и теперь не можете снять галочку обратно.<br><br>Не волнуйтесь, я нажал её за вас изнутри монитора. Мышь снова слушается!'
        : 'Knock-knock! It looks like you disabled mouse clicking and now you can\'t uncheck the box.<br><br>Don\'t worry, I flipped it back for you from inside the monitor. Your mouse works again!';
    }

    const actions = [
      {
        text: isRu ? '• Спасибо, Скрепыш!' : '• Thanks, Clippy!',
        action: () => {
          if (talk && typeof talk.adjustAffinity === 'function') talk.adjustAffinity(1);
          clippy.speak(
            isRu
              ? 'Всегда пожалуйста! Кто-то же должен присматривать за вашей мышкой с этой стороны экрана.'
              : 'Anytime! Somebody has to keep an eye on your mouse from this side of the screen.',
            [],
            '😊',
            8000,
            { anim: 'wave' }
          );
        }
      },
      {
        text: isRu ? '• Зачем вообще нужна эта кнопка?!' : '• Why does that button even exist?!',
        action: () => {
          clippy.speak(
            isRu
              ? 'В Microslop говорили: «Чтобы кнопки не изнашивались зря». А как снимать галочку без мыши — на совещании в Редмонде спросить забыли.'
              : 'Microslop said it was "to prevent unnecessary button wear." Nobody in the Redmond meeting asked how you\'re supposed to uncheck it afterward.',
            [],
            '🤔',
            10000,
            { anim: 'think' }
          );
        }
      },
      {
        text: isRu ? '• Это был научный эксперимент' : '• It was a scientific experiment',
        action: () => {
          clippy.speak(
            isRu
              ? 'Записал в лабораторный журнал: «Если отключить щелчки мыши, мышь перестаёт щёлкать». Наука торжествует, продолжаем работу!'
              : 'Logged in the lab notebook: "When mouse clicking is disabled, the mouse stops clicking." Science prevails, back to work!',
            [],
            '✍️',
            9000,
            { anim: 'writing' }
          );
        }
      }
    ];

    clippy.speak(text, actions, '📎', 18000, { anim: 'congratulate' });
    return true;
  }

  onAppWizHelp(activeTabId) {
    const clippy = this.clippy();
    if (!clippy) return false;
    if (!clippy.isRunning()) clippy.launch('appwiz');
    else if (!clippy.visible) clippy.show(true);

    const isRu = !window.i18n || window.i18n.getLanguage() === 'ru';
    if (activeTabId === 'tab-appwiz-setup') {
      clippy.speak(
        isRu
          ? 'Это вкладка <strong>Установка Win</strong>! Серый затенённый квадратик означает, что установлена только часть категории. Выберите строку и нажмите «Состав...», чтобы увидеть отдельные программы внутри.'
          : 'This is the <strong>Win Setup</strong> tab! A shaded box means only part of that category is installed. Select a category and click "Details..." to toggle individual tools.',
        [
          {
            text: isRu ? '• А диск Win 98 понадобится?' : '• Will I need the Win 98 CD?',
            action: () => clippy.speak(
              isRu
                ? 'Я заранее припрятал установочные CAB-архивы в папке C:\\WINDOWS\\OPTIONS\\CABS, так что искать коробку с диском не придётся!'
                : 'I stashed the setup CAB archives in C:\\WINDOWS\\OPTIONS\\CABS ahead of time, so you won\'t need to hunt for the CD!',
              [],
              '💿',
              9000
            )
          }
        ],
        '🛠️',
        12000,
        { anim: 'explain' }
      );
      return true;
    }

    if (activeTabId === 'tab-appwiz-bootdisk') {
      clippy.speak(
        isRu
          ? 'Вкладка <strong>Загрузочный диск</strong> создаёт аварийную дискету 3,5" на диске <strong>A:</strong>. На неё записываются COMMAND.COM, FDISK, FORMAT, SCANDISK и знаменитый драйвер <strong>OAKCDROM.SYS</strong>, который подходит почти к любому дисководу CD-ROM 1998 года!'
          : 'The <strong>Startup Disk</strong> tab creates a 3.5" emergency boot floppy on drive <strong>A:</strong> with COMMAND.COM, FDISK, FORMAT, SCANDISK, and the universal <strong>OAKCDROM.SYS</strong> CD-ROM driver!',
        [],
        '💾',
        12000,
        { anim: 'explain' }
      );
      return true;
    }

    clippy.speak(
      isRu
        ? 'На вкладке <strong>Установка и удаление</strong> кнопка «Установить...» ищет программы установки на диске D: и в папке загрузок, а кнопка «Добавить/Удалить...» удаляет выбранную программу и освобождает место на диске C:.'
        : 'On the <strong>Install/Uninstall</strong> tab, "Install..." scans drive D: and Downloads for setup programs, while "Add/Remove..." uninstalls the selected software.',
      [],
      '📦',
      11000,
      { anim: 'explain' }
    );
    return true;
  }

  onAppWizOfficeSelected() {
    const clippy = this.clippy();
    if (!clippy || !clippy.isRunning() || !clippy.visible) return false;
    const now = Date.now();
    if (now - (this.lastOfficeSelectAt || 0) < 15000) return false;
    this.lastOfficeSelectAt = now;

    const isRu = !window.i18n || window.i18n.getLanguage() === 'ru';
    clippy.speak(
      isRu
        ? 'Эй-эй, полегче с курсором! Вы только что выделили <strong>Microslop Office 97</strong>. Между прочим, внутри этих 42 мегабайт живу я, мои шаблоны писем и вся моя коллекция шляп!'
        : 'Whoa, easy with that cursor! You just selected <strong>Microslop Office 97</strong>. Those 42 megabytes happen to be my home, my letter templates, and my entire hat collection!',
      [
        {
          text: isRu ? '• Не бойся, не удалю!' : '• Don\'t worry, I won\'t delete you!',
          action: () => clippy.speak(
            isRu
              ? 'Отлегло от скрепки! А то я уже начал паковать чемодан в файл подкачки WIN386.SWP.'
              : 'What a relief! I was already packing my bags for the WIN386.SWP swap file.',
            [],
            '😌',
            8000,
            { anim: 'congratulate' }
          )
        },
        {
          text: isRu ? '• Я просто смотрю, сколько ты весишь' : '• Just checking how much space you take',
          action: () => clippy.speak(
            isRu
              ? 'Сам я вешу ровно один грамм нержавеющей стали, а остальные 41,9 МБ — это таблицы Excel и словари правописания!'
              : 'I weigh exactly one gram of stainless steel. The other 41.9 MB are Excel spreadsheets and spelling dictionaries!',
            [],
            '📎',
            8500
          )
        }
      ],
      '😰',
      12000,
      { anim: 'alert' }
    );
    return true;
  }

  onAppWizOfficeMaintenance(mode) {
    const clippy = this.clippy();
    if (!clippy) return false;
    if (!clippy.isRunning()) clippy.launch('appwiz');
    const talk = this.talk();
    const isRu = !window.i18n || window.i18n.getLanguage() === 'ru';

    if (mode === 'hide') {
      clippy.speak(
        isRu
          ? 'Понял-понял, ухожу в тень! Если понадоблюсь — просто щёлкните по моей скрепке в системном лотке рядом с часами.'
          : 'Got it, stepping into the shadows! If you need me, just click my paperclip icon in the system tray.',
        [],
        '🫡',
        4500
      );
      setTimeout(() => {
        if (clippy.visible) clippy.hide();
      }, 2200);
      return true;
    }

    if (mode === 'repair') {
      if (!clippy.visible) clippy.show(true);
      clippy.speak(
        isRu
          ? 'Словари проверены, пружинка смазана, шаблоны заявлений на отпуск отутюжены! <strong>Microslop Office 97</strong> работает как швейцарские часы.'
          : 'Dictionaries verified, paperclip polished, and letter templates ironed! <strong>Microslop Office 97</strong> is running like clockwork.',
        [],
        '✨',
        9000,
        { anim: 'congratulate' }
      );
      return true;
    }

    if (!clippy.visible) clippy.show(true);
    if (talk && typeof talk.adjustAffinity === 'function') talk.adjustAffinity(1);
    clippy.speak(
      isRu
        ? 'Фух! Я так и знал, что мы с вами отличная команда. Продолжаем нести канцелярскую службу!'
        : 'Phew! I knew we made a great team. Reporting for office duty!',
      [],
      '😊',
      8500,
      { anim: 'wave' }
    );
    return true;
  }

  onAppWizProgramRemoved(app) {
    const clippy = this.clippy();
    if (!clippy || !clippy.isRunning() || !clippy.visible || !app) return false;
    const isRu = !window.i18n || window.i18n.getLanguage() === 'ru';

    let text;
    if (app.id === 'winrar') {
      text = isRu
        ? `Удалили <strong>WinRAR</strong>?! Но его 40-дневный пробный период только-только начал отсчитывать второй десяток лет! Чем же мы теперь будем распаковывать архивы?`
        : `You uninstalled <strong>WinRAR</strong>?! Its 40-day trial was just getting warmed up!`;
    } else if (app.id === 'icq') {
      text = isRu
        ? `Прощай, зелёный цветочек <strong>ICQ 98a</strong> и фирменное «О-оу!»... Надеюсь, вы успели переписать номера UIN друзей в бумажную записную книжку!`
        : `Farewell, green <strong>ICQ 98a</strong> flower and "Uh-oh!" sound... Hope you wrote down your friends' UINs in a paper notebook!`;
    } else if (app.id === 'netscape') {
      text = isRu
        ? `<strong>Netscape Communicator</strong> удалён! Где-то в Редмонде Билл Гейтс только что довольно улыбнулся и поправил очки.`
        : `<strong>Netscape Communicator</strong> removed! Somewhere in Redmond, Bill Gates just smiled and adjusted his glasses.`;
    } else {
      text = isRu
        ? `Готово! Программа <strong>${app.name}</strong> удалена, на диске C: освободилось <strong>${app.size}</strong>. Правда, в системном реестре наверняка осталась пара сиротливых веток — такова добрая традиция Win 98!`
        : `Done! <strong>${app.name}</strong> was removed, freeing <strong>${app.size}</strong> on drive C:. Though knowing Win 98, a few orphaned registry keys probably stayed behind as souvenirs!`;
    }

    clippy.speak(text, [], '🗑️', 10000, { anim: 'trash' });
    return true;
  }

  onAppWizComponentsApplied(diff) {
    const clippy = this.clippy();
    if (!clippy || !clippy.isRunning() || !clippy.visible || !diff) return false;
    const isRu = !window.i18n || window.i18n.getLanguage() === 'ru';
    const removedIds = new Set((diff.removed || []).map(s => s.id));
    const addedIds = new Set((diff.added || []).map(s => s.id));

    let text;
    if (removedIds.has('ie5')) {
      text = isRu
        ? 'Вы сняли галочку с <strong>Internet Explorer 5</strong>?! В 1998 году юристы Microslop в суде доказывали, что его невозможно отделить от Win 98 без фомки! Значок я, так и быть, спрятал в списке компонентов, но движок оставил.'
        : 'You unchecked <strong>Internet Explorer 5</strong>?! In 1998 Microslop\'s lawyers argued in court that IE can\'t be separated from Win 98 without a crowbar!';
    } else if (removedIds.has('games')) {
      text = isRu
        ? 'Удаляете «Сапёра» и «Косынку»?! Скажите честно: начальник стоит прямо у вас за спиной, да? Моргните дважды, если нужно прикрыть экран таблицей Excel!'
        : 'Removing Minesweeper and Solitaire?! Be honest: your boss is standing right behind you, isn\'t he? Blink twice if you need an Excel spreadsheet!';
    } else if (removedIds.has('notepad') || removedIds.has('calc')) {
      text = isRu
        ? 'Отключили Блокнот или Калькулятор? Смелый шаг! Чем же теперь открывать файлы README.TXT с диска «Игромании»?'
        : 'Unchecked Notepad or Calculator? Bold move! What will you open README.TXT files with now?';
    } else if (addedIds.size > 0 && removedIds.size === 0) {
      text = isRu
        ? `Добавлено компонентов Win 98: <strong>${addedIds.size}</strong>! Хорошо, что я припрятал установочные CAB-файлы на жёстком диске — даже компакт-диск Win 98 Second Edition вставлять не пришлось.`
        : `Added <strong>${addedIds.size}</strong> Win 98 component(s)! Good thing I stashed the CAB files on the hard drive so you didn't need the Win 98 CD-ROM.`;
    } else {
      text = isRu
        ? `Конфигурация компонентов Win 98 обновлена (добавлено: ${addedIds.size}, отключено: ${removedIds.size}). Изменения записаны!`
        : `Win 98 component configuration updated (added: ${addedIds.size}, removed: ${removedIds.size}).`;
    }

    clippy.speak(text, [], '💿', 11000, { anim: 'save' });
    return true;
  }

  onAppWizBootDiskCreated() {
    const clippy = this.clippy();
    if (!clippy) return false;
    if (!clippy.isRunning()) clippy.launch('appwiz');
    else if (!clippy.visible) clippy.show(true);
    const isRu = !window.i18n || window.i18n.getLanguage() === 'ru';

    clippy.speak(
      isRu
        ? 'Вжж-тык-тык! Аварийная дискета <strong>Win 98 Startup Disk</strong> записана на диск <strong>A:</strong>!<br><br>Я положил туда COMMAND.COM, FDISK, FORMAT, SCANDISK и универсальный драйвер <strong>OAKCDROM.SYS</strong>. Не забудьте задвинуть пластиковый язычок защиты от записи!'
        : 'Whirr-click-click! Your <strong>Win 98 Startup Disk</strong> is ready on drive <strong>A:</strong>!<br><br>It includes COMMAND.COM, FDISK, FORMAT, SCANDISK, and the universal <strong>OAKCDROM.SYS</strong> driver. Don\'t forget to slide the write-protect tab!',
      [
        {
          text: isRu ? '• Открыть диск A: в Проводнике' : '• Open drive A: in Explorer',
          action: () => {
            if (window.appExplorer) window.appExplorer.open(['My Computer', 'A:']);
          }
        }
      ],
      '💾',
      14000,
      { anim: 'congratulate' }
    );
    return true;
  }

  whenBalloonFree(fn, tries = 3) {
    const clippy = this.clippy();
    if (!clippy) return;
    if (tries > 0 && typeof clippy.balloonOpen === 'function' && clippy.balloonOpen()) {
      setTimeout(() => this.whenBalloonFree(fn, tries - 1), 3000);
      return;
    }
    if (clippy.visible) fn(clippy);
  }

  firstTimeThisSession(key) {
    this.shellSeen = this.shellSeen || new Set();
    if (this.shellSeen.has(key)) return false;
    this.shellSeen.add(key);
    return true;
  }

  restartNormally() {
    return { text: this.lang('• Перезагрузиться в обычном режиме', '• Restart in normal mode'), action: () => window.appShutdown && window.appShutdown.triggerRestart() };
  }

  onSafeMode() {
    if (!this.canReact()) return false;
    const L = (ru, en) => this.lang(ru, en);
    this.whenBalloonFree(clippy => {
      clippy.animate('lookAround');
      clippy.speak(L(
        'Похоже, вы в безопасном режиме. Обоев нет, драйвера видеокарты нет, автозагрузка пропущена. А я всё равно здесь: пролез между HIMEM.SYS и COMMAND.COM. Только тихо.',
        'Looks like you are in safe mode. No wallpaper, no display driver, startup programs skipped. And yet here I am: I slipped in between HIMEM.SYS and COMMAND.COM. Quietly.'
      ), [
        { text: L('• Что вообще случилось?', '• What happened?'), action: () => this.explainSafeMode() },
        this.restartNormally()
      ], '🛟', 16000);
    });
    return true;
  }

  explainSafeMode() {
    const clippy = this.clippy();
    if (!clippy) return false;
    const L = (ru, en) => this.lang(ru, en);
    const tools = window.appSysTools;
    clippy.speak(L(
      'В безопасном режиме Win грузит только самое нужное: стандартный VGA-драйвер, мышь, клавиатуру и диски. Если что-то сломалось, начните с двух проверок. Обе быстрые.',
      'In safe mode Win loads only the essentials: the standard VGA driver, mouse, keyboard and disks. If something broke, start with two checks. Both are quick.'
    ), [
      { text: L('• Проверить системные файлы', '• Check system files'), action: () => tools && tools.openSfc() },
      { text: L('• Проверить реестр', '• Check the registry'), action: () => tools && tools.openScanReg() },
      this.restartNormally()
    ], '🧰', 16000);
    return true;
  }

  onBootLogged() {
    if (!this.canReact()) return false;
    const L = (ru, en) => this.lang(ru, en);
    this.whenBalloonFree(clippy => clippy.speak(L(
      'Похоже, вы загрузились с протоколом. Win записала каждый драйвер в C:\\BOOTLOG.TXT. Про меня там тоже есть строчка. То есть... нет. То есть... я не драйвер.',
      'Looks like you booted with logging. Win wrote every driver into C:\\BOOTLOG.TXT. There is a line about me too. I mean... no. I mean... I am not a driver.'
    ), [
      { text: L('• Открыть BOOTLOG.TXT', '• Open BOOTLOG.TXT'), action: () => this.openBootLog() }
    ], '📜', 14000));
    return true;
  }

  onAppCrashed(name) {
    if (this._crashTipShown || !this.canReact()) return false;
    this._crashTipShown = true;
    const L = (ru, en) => this.lang(ru, en);
    this.whenBalloonFree(clippy => clippy.speak(L(
      'Похоже, программа «' + name + '» споткнулась. То есть... То есть... упала. Ничего, отчёт об ошибке собирается сам: снимок, место, журнал. Нажмите Ctrl+F10 в любой программе.',
      'Looks like the program "' + name + '" tripped. I mean... I mean... crashed. No worries, the problem report builds itself: screenshot, place, log. Press Ctrl+F10 in any program.'
    ), [
      { text: L('• Отправить отчёт', '• Send a report'), action: () => window.appBugReport && window.appBugReport.open() },
      { text: L('• Мои отчёты', '• My reports'), action: () => window.appBugReport && window.appBugReport.openList() }
    ], '🩹', 14000));
    return true;
  }

  openBootLog() {
    const drive = window.vfs && window.vfs.resolvePath(['My Computer', 'C:']);
    const file = drive && drive.children && drive.children['BOOTLOG.TXT'];
    if (!file || !window.appNotepad) return false;
    window.appNotepad.open('BOOTLOG.TXT', file.content || '');
    return true;
  }

  onHeartsEvent(kind, info = {}) {
    if (!this.canReact()) return false;
    const clippy = this.clippy();
    const L = (ru, en) => this.lang(ru, en);
    if (kind === 'queen') {
      if (Date.now() - (this.heartsQueenAt || 0) < 120000) return false;
      this.heartsQueenAt = Date.now();
      clippy.animate('think');
      clippy.speak(L(
        'Дама пик досталась вам. Тринадцать очков одной картой. Похоже, её берегли специально для вас.',
        'The Queen of Spades is yours. Thirteen points in one card. Looks like someone was saving it just for you.'
      ), [], '♠️', 9000);
      return true;
    }
    if (kind === 'moon') {
      if (info.human) {
        clippy.animate('congratulate');
        clippy.speak(L(
          'Вы сорвали банк! Все черви и дама пик у вас, а соперники получили по 26 очков. Я бы похлопал, но у меня проволока.',
          'You shot the moon! Every heart and the Queen of Spades are yours, and each rival got 26 points. I would clap, but I am made of wire.'
        ), [], '🌙', 11000);
      } else {
        clippy.speak(L(
          `${this.esc(info.name || '')}: все черви и дама пик за один кон. Банк сорван, всем остальным по 26 очков. Сохраним этот момент? То есть... забудем.`,
          `${this.esc(info.name || '')} took every heart and the Queen of Spades in one hand. The moon is shot, 26 points to everyone else. Shall we save this moment? I mean... forget it.`
        ), [], '😬', 11000);
      }
      return true;
    }
    return false;
  }

  onFloppyFormatted(info = {}) {
    if (!this.canReact()) return false;
    const clippy = this.clippy();
    const L = (ru, en) => this.lang(ru, en);
    clippy.animate('save');
    clippy.speak(info.system
      ? L('Системная дискета готова: на ней COMMAND.COM, с неё можно загрузиться. Подпишите наклейку, пока помните, что это за дискета.',
        'The system floppy is ready: COMMAND.COM is on it, and it can boot the computer. Label it while you still remember what it is.')
      : L('Дискета отформатирована. 1 457 664 байт чистого места. Сохраняйтесь на неё почаще. То есть... подпишите наклейку.',
        'The floppy is formatted. 1,457,664 bytes of clean space. Save to it often. I mean... label it.'),
    [{ text: L('• Открыть диск A:', '• Open drive A:'), action: () => window.appExplorer && window.appExplorer.open(['My Computer', 'A:']) }], '💾', 11000);
    return true;
  }

  onRegistryBackup() {
    if (!this.canReact()) return false;
    const clippy = this.clippy();
    const talk = this.talk();
    const first = this.firstTimeThisSession('registry-backup');
    if (first && talk && typeof talk.adjustAffinity === 'function') talk.adjustAffinity(1);
    clippy.animate('save');
    clippy.speak(this.lang(
      'Резервная копия реестра в RB001.CAB! Там лежат мои настройки. То есть... моя душа. То есть... настройки. Спасибо.',
      'A registry backup in RB001.CAB! My settings live in there. I mean... my soul. I mean... my settings. Thank you.'
    ), [], '🗄️', 10000);
    return true;
  }

  onWinUpdateInstalled(ids = []) {
    if (!this.canReact() || !ids.length) return false;
    const clippy = this.clippy();
    clippy.animate('congratulate');
    clippy.speak(ids.includes('kb_y2k')
      ? this.lang('Обновление для 2000 года установлено. Хорошо, когда о будущем думают заранее. Я вот стараюсь о нём не думать.',
        'The Y2K update is installed. It is good when someone thinks about the future in advance. I try not to.')
      : this.lang(`Установлено обновлений: ${ids.length}. Win стала чуть новее. Я остался прежним, это тоже стабильность.`,
        `${ids.length} update(s) installed. Win is a little newer now. I stayed the same, which is stability too.`),
    [], '🛠️', 11000);
    return true;
  }

  winUpdateSiteReaction() {
    if (!this.firstTimeThisSession('winupdate-site')) return null;
    return {
      mood: '🌐',
      text: this.lang(
        '<strong>Обновление Win</strong>. Сайт сам посмотрит, чего не хватает компьютеру, и предложит заплатки. Отметьте нужные и нажмите «Загрузить». Меня никто так не обновляет.',
        '<strong>Win Update</strong>. The site checks what the computer is missing and offers patches. Tick what you need and press Download. Nobody updates me like that.'
      )
    };
  }

  onTestPagePrinted(printerName = '', port = 'LPT1:') {
    if (!this.canReact()) return false;
    this.clippy().speak(this.lang(
      `Пробная страница ушла на «${this.esc(printerName)}» через ${this.esc(port)}. Если принтер молчит, проверьте кабель и бумагу. Я бы сходил посмотреть, но я внутри монитора.`,
      `The test page went to "${this.esc(printerName)}" on ${this.esc(port)}. If the printer stays silent, check the cable and the paper. I would go and look, but I live inside the monitor.`
    ), [], '🖨️', 11000);
    return true;
  }

  onDosEditor(fileName = '') {
    if (!this.canReact() || !this.firstTimeThisSession('dos-editor')) return false;
    this.clippy().speak(this.lang(
      `Похоже, вы пишете письмо... в EDIT.COM? Тут мой мастер писем бессилен: синий фон, 80 колонок, ни одной скрепки. Сохраняйте файл ${this.esc(fileName)} через Ctrl+S.`,
      `Looks like you are writing a letter... in EDIT.COM? My Letter Wizard is helpless here: blue screen, 80 columns, not a single paperclip. Save ${this.esc(fileName)} with Ctrl+S.`
    ), [], '📝', 11000);
    return true;
  }

  onNetworkNeighborhood() {
    if (!this.canReact() || !this.firstTimeThisSession('network-neighborhood')) return false;
    this.clippy().speak(this.lang(
      'Сетевое окружение! Рабочая группа WORKGROUP, несколько компьютеров. Где-то здесь Гений ждёт мой ход в шахматах. Третий день ждёт.',
      'Network Neighborhood! The WORKGROUP workgroup and a few computers. Somewhere in here the Genius is waiting for my chess move. Third day now.'
    ), [], '🌐', 10000);
    return true;
  }

  shellAppReactions() {
    const L = (ru, en) => this.lang(ru, en);
    const once = (key) => this.firstTimeThisSession(`window:${key}`);
    return [
      {
        match: (id) => id === 'app_hearts' && once(id),
        mood: '♥️', delay: 900,
        text: L(
          '<strong>Червы</strong> по сети Microslop! Paulina, Michele и Ben уже за столом и на обед не уходят. Главное правило: не забирайте даму пик. Разве что собираетесь сорвать банк.',
          '<strong>Hearts</strong> on the Microslop network! Paulina, Michele and Ben are already at the table and never take lunch. Main rule: do not take the Queen of Spades. Unless you plan to shoot the moon.'
        ),
        actions: [
          { text: L('• Как сорвать банк?', '• How do I shoot the moon?'), action: () => this.clippy().speak(L(
            'Заберите за один кон все 13 червей и даму пик. Тогда по 26 очков получат соперники, а вы ноль. Если хоть одна черва уйдёт сопернику, остальные очки останутся у вас.',
            'Take all 13 hearts and the Queen of Spades in one hand. Then each rival gets 26 points and you get zero. If even one heart goes to a rival, the rest of the points stay with you.'
          ), [], '🌙') }
        ]
      },
      {
        match: (id) => id === 'app_msinfo32' && once(id),
        mood: 'ℹ️', delay: 900,
        text: L(
          'Сведения о системе. Здесь всё, что есть в компьютере: прерывания, память, драйверы. Меня в списке нет. Я не оборудование. Я... программная среда. Наверное.',
          'System Information. Everything in the computer is here: IRQs, memory, drivers. I am not on the list. I am not hardware. I am... the software environment. Probably.'
        )
      },
      {
        match: (id) => id === 'app_sfc' && once(id),
        mood: '🔍', delay: 900,
        text: L(
          'Проверка системных файлов сверяет каждую DLL и VXD с эталоном. Если найдёт подменённый файл, предложит взять его с компакт-диска Win 98. Держите диск рядом.',
          'System File Checker compares every DLL and VXD with the original. If it finds a replaced file, it offers to take it from the Win 98 CD-ROM. Keep the disc nearby.'
        )
      },
      {
        match: (id) => id === 'app_drvspace' && once(id),
        mood: '🗜️', delay: 900,
        text: L(
          'DriveSpace 3 сжимает диск, и места становится почти вдвое больше. Только меня сжимать не надо: я и так проволока 0,9 мм.',
          'DriveSpace 3 compresses the disk and almost doubles the free space. Please do not compress me: I am 0.9 mm wire already.'
        )
      },
      {
        match: (id) => id === 'app_welcome_win98' && once(id),
        mood: '👋', delay: 900,
        text: L(
          '«Добро пожаловать в Win 98»! Здесь знакомство с системой и обслуживание компьютера. Я бы всё показал сам, но у Win свой экскурсовод.',
          'Welcome to Win 98! A tour of the system and computer maintenance live here. I would show you everything myself, but Win has its own guide.'
        )
      },
      {
        match: (id) => id === 'app_mstask' && once(id),
        mood: '⏰', delay: 900,
        text: L(
          'Назначенные задания. Дефрагментация по ночам, проверка диска по пятницам. Только не ставьте ничего на 19 ноября: у меня день рождения.',
          'Scheduled Tasks. Defragment at night, check the disk on Fridays. Just do not schedule anything on November 19: it is my birthday.'
        )
      },
      {
        match: (id) => id === 'app_winipcfg' && once(id),
        mood: '🔌', delay: 900,
        text: L(
          'Настройка IP. Здесь видно адрес компьютера в сети. «Освободить» и «Обновить» помогают, когда соединение зависло. Мой адрес проще: правый нижний угол.',
          'IP Configuration. It shows the computer\'s network address. Release and Renew help when the connection hangs. My address is simpler: the bottom right corner.'
        )
      },
      {
        match: (id) => id.startsWith('fontview_') && /comic/i.test(id) && once('fontview_comic'),
        mood: '🔤', delay: 700,
        text: L(
          'Comic Sans MS! Этот шрифт придумали для реплик в пузырях. Почти родственник.',
          'Comic Sans MS! This font was made for speech balloons. Practically family.'
        )
      },
      {
        match: (id) => id === 'app_stickykeys_prompt' && once(id),
        mood: '⌨️', delay: 600,
        text: L(
          'Пять раз Shift подряд. Похоже, на клавиатуре опять спит Scribble. Если это случайно, нажмите «Отмена».',
          'Shift five times in a row. Looks like Scribble is asleep on the keyboard again. If it was an accident, press Cancel.'
        )
      }
    ];
  }

  colorDepthReaction(change) {
    const L = (ru, en) => this.lang(ru, en);
    const lines = {
      '16color': { mood: '🎨', anim: 'lookAround', text: L('Шестнадцать цветов. Как в безопасном режиме. Я теперь в крапинку, но узнать меня ещё можно.', 'Sixteen colors. Just like safe mode. I am speckled now, but you can still recognise me.') },
      '256color': { mood: '🎨', text: L('256 цветов. Картинки стали победнее, зато видеокарте легче.', '256 colors. Pictures look poorer, but the video card has it easier.') },
      '16bit': { mood: '🌈', anim: 'congratulate', text: L('High Color, 65 536 цветов. Мой пузырь снова жёлтый, а не почти жёлтый.', 'High Color, 65,536 colors. My balloon is yellow again, not almost yellow.') },
      '32bit': { mood: '🌈', anim: 'congratulate', text: L('True Color! Все 16,7 миллиона цветов на месте, я пересчитал.', 'True Color! All 16.7 million colors are back, I counted.') }
    };
    const line = lines[change.to];
    if (!line) return null;
    const dialogs = window.appDialogs;
    return { id: `colorDepth:${change.to}`, ...line, undo: () => dialogs && dialogs.setDisplayEffects({ colorDepth: change.from }, 'clippy') };
  }

  lang(ru, en) {
    return !window.i18n || window.i18n.getLanguage() === 'ru' ? ru : en;
  }

  canReact() {
    const clippy = this.clippy();
    return Boolean(clippy && clippy.isRunning() && clippy.visible && clippy.annoyance !== 'quiet' && clippy.opt('appReactions') !== false);
  }

  hourText(hour) {
    return this.lang(`${hour}:00`, `${hour % 12 || 12}:00 ${hour >= 12 ? 'PM' : 'AM'}`);
  }

  clockText() {
    const clock = typeof document !== 'undefined' ? document.getElementById('tray-clock') : null;
    return clock && clock.textContent ? clock.textContent : this.hourText(new Date().getHours());
  }

  onTaskbarDialogOpened() {
    if (this.taskbarDialogSeen || !this.canReact()) return false;
    this.taskbarDialogSeen = true;
    const clippy = this.clippy();
    clippy.speak(this.lang(
      'Свойства панели задач. Если включите автоскрытие, мой значок в трее уедет вместе с панелью. Я никуда не денусь, просто буду внизу.',
      'Taskbar Properties. If you turn on auto hide, my tray icon slides away with the taskbar. I will still be there, just lower down.'
    ), [], '📎', 9000);
    return true;
  }

  onTaskbarChanged(previous, next) {
    if (!previous || !next) return false;
    this.clockChimeHour = new Date().getHours();
    if (!this.canReact()) return false;
    const clippy = this.clippy();
    const taskbar = window.taskbar;
    const L = (ru, en) => this.lang(ru, en);
    const putBack = (key, value) => () => {
      if (taskbar) taskbar.saveSettings({ ...taskbar.settings, [key]: value });
      if (window.appTaskbarProps) window.appTaskbarProps.syncSettings();
    };
    const openStart = { text: L('• Открыть меню «Пуск»', '• Open the Start menu'), action: () => taskbar && taskbar.toggleStartMenu() };

    if (next.autoHide && !previous.autoHide) {
      clippy.animate('lookAround');
      clippy.speak(L(
        'Панель задач уехала вниз. Подведите указатель к самому нижнему краю экрана, и она выглянет. Я спущусь пониже: место освободилось.',
        'The taskbar slid out of sight. Move the pointer to the very bottom edge of the screen and it comes back. I will sit lower now that there is room.'
      ), [
        { text: L('• Верни как было', '• Put it back'), action: putBack('autoHide', false) },
        { text: L('• Так и оставь', '• Keep it'), action: () => {} }
      ], '🙈', 14000);
      return true;
    }
    if (!next.autoHide && previous.autoHide) {
      clippy.speak(L('Панель задач снова на месте. Мне так спокойнее: трей рядом, есть куда спрятаться.', 'The taskbar is back. I feel better with the tray close by: there is somewhere to hide.'), [], '😌', 7000);
      return true;
    }
    if (!next.showClock && previous.showClock) {
      clippy.speak(L(
        `Часы убраны. На всякий случай: сейчас ${this.esc(this.clockText())}. Пока часов нет, я буду говорить, когда начнётся новый час.`,
        `Clock hidden. Just so you know, it is ${this.esc(this.clockText())}. While the clock is off, I will tell you when a new hour starts.`
      ), [
        { text: L('• Верни часы', '• Bring the clock back'), action: putBack('showClock', true) },
        { text: L('• Договорились', '• Deal'), action: () => {} }
      ], '⏰', 12000);
      return true;
    }
    if (next.showClock && !previous.showClock) {
      clippy.speak(L('Часы вернулись. Снимаю с себя обязанности будильника.', 'The clock is back. I am off alarm clock duty.'), [], '🕰️', 6000);
      return true;
    }
    if (!next.alwaysOnTop && previous.alwaysOnTop) {
      clippy.speak(L(
        'Теперь окна могут закрывать панель задач. Если она оказалась под окном, щёлкните по её видимой части или нажмите Ctrl+Esc.',
        'Windows can now cover the taskbar. If it ends up under a window, click any visible part of it or press Ctrl+Esc.'
      ), [], '🪟', 10000);
      return true;
    }
    if (next.alwaysOnTop && !previous.alwaysOnTop) {
      clippy.speak(L('Панель задач снова поверх всех окон. Ни одно окно её не закроет.', 'The taskbar is on top again. No window can cover it now.'), [], '📌', 6000);
      return true;
    }
    if (next.smallIcons !== previous.smallIcons) {
      clippy.speak(next.smallIcons
        ? L('Мелкие значки! Меню «Пуск» стало компактнее, а синяя полоса «Win98» сбоку пропала.', 'Small icons! The Start menu is more compact, and the blue Win98 strip is gone.')
        : L('Крупные значки вернулись, а с ними и полоса «Win98».', 'Large icons are back, and so is the Win98 strip.'), [openStart], '📋', 9000);
      return true;
    }
    return false;
  }

  onStartMenuChanged(kind, info = {}) {
    if (!this.canReact()) return false;
    const clippy = this.clippy();
    const taskbar = window.taskbar;
    const L = (ru, en) => this.lang(ru, en);
    const name = this.esc(info.name || '');

    if (kind === 'add') {
      clippy.animate('writing');
      clippy.speak(L(
        `Ярлык <strong>${name}</strong> лежит в папке «${this.esc(info.folder || '')}». Посмотрим, как он смотрится в меню?`,
        `The <strong>${name}</strong> shortcut is now in the "${this.esc(info.folder || '')}" folder. Shall we see how it looks in the menu?`
      ), [
        { text: L('• Открыть меню «Пуск»', '• Open the Start menu'), action: () => taskbar && taskbar.toggleStartMenu() },
        { text: L('• Потом', '• Later'), action: () => {} }
      ], '📌', 12000);
      return true;
    }

    if (kind === 'remove') {
      const undo = {
        text: L('• Верни', '• Undo'),
        action: () => {
          if (!this.restoreFromBin(info.binName || info.name)) return;
          if (taskbar) taskbar.renderStartMenuContent();
          if (window.appTaskbarProps) window.appTaskbarProps.refreshRemoveDialog();
        }
      };
      const keep = { text: L('• Так надо', '• That is fine'), action: () => {} };
      let text = L(
        `«${name}» убран из меню «Пуск» и лежит в Корзине. Передумаете, верну.`,
        `"${name}" is gone from the Start menu and sits in the Recycle Bin. Change your mind and I will bring it back.`
      );
      let mood = '🗑️';
      if (info.ref === 'action:icq') {
        text = L('ICQ больше нет в меню. Мой номер 199898 работает и без ярлыка, если что.', 'ICQ is out of the menu. My number, 199898, still works without a shortcut.');
        mood = '🌼';
      } else if (info.ref === 'menu:games') {
        text = L('Папка «Игры» убрана. Начальник рядом, да? Я ничего не видел. Она лежит в Корзине.', 'The Games folder is gone. Is the boss nearby? I saw nothing. It is in the Recycle Bin.');
        mood = '🤫';
      } else if (info.folder) {
        text = L(`Папка «${name}» со всеми ярлыками отправлена в Корзину.`, `The "${name}" folder and its shortcuts went to the Recycle Bin.`);
      }
      clippy.speak(text, [undo, keep], mood, 12000, { anim: 'trash' });
      return true;
    }

    if (kind === 'clear') {
      clippy.speak(info.had
        ? L('Список документов и история «Выполнить» очищены. Я тоже всё забыл. Почти всё.', 'The Documents list and the Run history are clear. I forgot everything too. Almost.')
        : L('Чистить нечего: списки уже пустые.', 'Nothing to clear: the lists were already empty.'), [], '🧹', 7000, { anim: 'trash' });
      return true;
    }
    return false;
  }

  formatPowerMinutes(mins) {
    const L = (ru, en) => this.lang(ru, en);
    const m = Number(mins);
    if (!m || m <= 0) return L('никогда', 'never');
    if (m === 1) return L('через 1 минуту', 'after 1 minute');
    if (m < 60) return L(`через ${m} мин.`, `after ${m} mins`);
    const h = Math.round(m / 60);
    if (h === 1) return L('через 1 час', 'after 1 hour');
    return L(`через ${h} ч.`, `after ${h} hours`);
  }

  onPowerHelp(activeTabId = 'tab-power-schemes') {
    const clippy = this.clippy();
    if (!clippy) return false;
    clippy.show();
    const L = (ru, en) => this.lang(ru, en);
    const cp = window.appCPanel;

    if (activeTabId === 'tab-power-advanced') {
      const actions = [];
      if (cp && cp.powerSettings && !cp.powerSettings.showTrayIcon) {
        actions.push({
          text: L('• Показать значок в трее', '• Show icon on taskbar'),
          action: () => {
            cp.setPowerSettings({ ...cp.powerSettings, showTrayIcon: true }, { source: 'clippy' });
          }
        });
      }
      actions.push({ text: L('• Понятно', '• Got it'), action: () => {} });
      clippy.speak(L(
        'На вкладке <strong>«Дополнительно»</strong> включается значок электропитания в системном трее возле часов. Щёлкните по вилке питания левой кнопкой — и сможете переключать схемы на лету, а двойной щелчок сразу откроет это окно.',
        'The <strong>Advanced</strong> tab controls the power icon in the system tray next to the clock. Left-click the power plug to switch power schemes on the fly, or double-click it to open this dialog.'
      ), actions, '🔌', 13000);
      return true;
    }

    const actions = [];
    if (cp && typeof cp.setPowerSettings === 'function') {
      actions.push({
        text: L('• Включить «Портативный или ноутбук»', '• Use "Portable/Laptop"'),
        action: () => cp.setPowerSettings({ scheme: 'portable' }, { source: 'clippy' })
      });
      actions.push({
        text: L('• Включить «Всегда включён»', '• Use "Always On"'),
        action: () => cp.setPowerSettings({ scheme: 'always_on' }, { source: 'clippy' })
      });
    }
    actions.push({ text: L('• Спасибо', '• Thanks'), action: () => {} });

    clippy.speak(L(
      'Здесь выбирается <strong>схема управления питанием</strong>: когда гасить ЭЛТ-монитор и когда останавливать блины жёстких дисков. Свои сочетания таймеров можно сохранить кнопкой <strong>«Сохранить как...»</strong>.',
      'Here you choose a <strong>power scheme</strong>: when to put the CRT monitor into standby and when to spin down the hard disk platters. You can save your own timer combinations using <strong>"Save As..."</strong>.'
    ), actions, '⚡', 14000);
    return true;
  }

  onPowerSettingsChanged(prev, next, source = 'dialog') {
    if (!prev || !next || !this.canReact()) return false;
    const clippy = this.clippy();
    const cp = window.appCPanel;
    const L = (ru, en) => this.lang(ru, en);

    const prevScheme = prev.scheme || prev.activeScheme || 'always_on';
    const nextScheme = next.scheme || next.activeScheme || 'always_on';
    const prevTimers = cp && typeof cp.getActivePowerTimers === 'function'
      ? cp.getActivePowerTimers(prev)
      : ((prev.schemes && prev.schemes[prevScheme]) || { monitorTimeout: 15, diskTimeout: 60 });
    const nextTimers = cp && typeof cp.getActivePowerTimers === 'function'
      ? cp.getActivePowerTimers(next)
      : ((next.schemes && next.schemes[nextScheme]) || { monitorTimeout: 15, diskTimeout: 60 });
    const prevMon = typeof prevTimers.monitorTimeout === 'number' ? prevTimers.monitorTimeout : (prevTimers.monitor ?? 15);
    const nextMon = typeof nextTimers.monitorTimeout === 'number' ? nextTimers.monitorTimeout : (nextTimers.monitor ?? 15);
    const prevDisk = typeof prevTimers.diskTimeout === 'number' ? prevTimers.diskTimeout : (prevTimers.disk ?? 60);
    const nextDisk = typeof nextTimers.diskTimeout === 'number' ? nextTimers.diskTimeout : (nextTimers.disk ?? 60);

    const schemeChanged = prevScheme !== nextScheme;
    const monitorChanged = prevMon !== nextMon;
    const diskChanged = prevDisk !== nextDisk;
    const trayChanged = Boolean(prev.showTrayIcon) !== Boolean(next.showTrayIcon);

    if (!schemeChanged && !monitorChanged && !diskChanged && !trayChanged) return false;

    const snapshot = cp && typeof cp.clonePowerSettings === 'function' ? cp.clonePowerSettings(prev) : JSON.parse(JSON.stringify(prev));
    const undoActions = [
      {
        text: L('• Верни как было', '• Undo'),
        action: () => {
          if (cp && typeof cp.setPowerSettings === 'function') {
            cp.setPowerSettings(snapshot, { silent: true });
          }
          clippy.speak(L('Вернул прежние настройки электропитания!', 'Restored your previous power management settings!'), [], '🔌', 6500);
        }
      },
      { text: L('• Оставить так', '• Keep it'), action: () => {} }
    ];

    let text = '';
    let mood = '🔌';

    if (schemeChanged) {
      if (nextScheme === 'portable') {
        mood = '🔋';
        text = L(
          'Схема <strong>«Портативный или ноутбук»</strong>! Экономим каждый ватт, будто едем в поезде с батареей: монитор гаснет ' + this.formatPowerMinutes(nextMon) + ', а винчестер засыпает ' + this.formatPowerMinutes(nextDisk) + '.',
          '<strong>Portable/Laptop</strong> scheme! Saving every watt like we are on a train on battery power: monitor turns off ' + this.formatPowerMinutes(nextMon) + ', hard disk spins down ' + this.formatPowerMinutes(nextDisk) + '.'
        );
      } else if (nextScheme === 'always_on') {
        mood = '⚡';
        text = L(
          'Режим <strong>«Всегда включён»</strong>! Правильный выбор, если оставили качаться файлы по модему на ночь: диски ' + (nextDisk === 0 ? 'не засыпают' : 'отключаются ' + this.formatPowerMinutes(nextDisk)) + ', а монитор гаснет ' + this.formatPowerMinutes(nextMon) + '.',
          '<strong>Always On</strong> mode! The right choice for overnight modem downloads: hard disks turn off ' + this.formatPowerMinutes(nextDisk) + ', and the monitor turns off ' + this.formatPowerMinutes(nextMon) + '.'
        );
      } else if (nextScheme === 'home_office') {
        mood = '🖥️';
        text = L(
          'Классическая схема <strong>«Домашний или офисный»</strong>: монитор уходит в дежурный режим ' + this.formatPowerMinutes(nextMon) + ', а жёсткий диск паркует головки ' + this.formatPowerMinutes(nextDisk) + '.',
          'Classic <strong>Home/Office Desk</strong> scheme: the monitor enters standby ' + this.formatPowerMinutes(nextMon) + ', and the hard disk parks its heads ' + this.formatPowerMinutes(nextDisk) + '.'
        );
      } else {
        const schemeName = this.esc(cp && cp.getPowerSchemeDisplayName ? cp.getPowerSchemeDisplayName(nextScheme, next) : nextScheme);
        mood = '📋';
        text = L(
          `Включена схема питания <strong>«${schemeName}»</strong> (монитор — ${this.formatPowerMinutes(nextMon)}, жёсткие диски — ${this.formatPowerMinutes(nextDisk)}).`,
          `Activated power scheme <strong>"${schemeName}"</strong> (monitor: ${this.formatPowerMinutes(nextMon)}, hard disks: ${this.formatPowerMinutes(nextDisk)}).`
        );
      }
    } else if (monitorChanged) {
      if (nextMon === 1) {
        mood = '⏱️';
        text = L(
          'Отключение монитора <strong>через 1 минуту</strong>! Моргнуть не успеете, как кинескоп погаснет, а светодиод станет янтарным. Держите руку на мыши!',
          'Turn off monitor <strong>after 1 minute</strong>! Blink once and the CRT will go dark with an amber LED. Keep your hand on the mouse!'
        );
      } else if (nextMon === 0) {
        mood = '💡';
        text = L(
          'Монитор теперь <strong>никогда не отключается</strong>! Главное — не забудьте про заставку, чтобы на люминофоре не отпечаталась панель задач.',
          'The monitor is set to <strong>Never</strong> turn off! Just remember to use a screen saver so the taskbar does not burn into the phosphor.'
        );
      } else {
        mood = '🖥️';
        text = L(
          `Таймер энергосбережения монитора изменён: теперь экран переходит в дежурный режим <strong>${this.formatPowerMinutes(nextMon)}</strong> простоя.`,
          `Monitor power timer updated: the screen will now enter standby <strong>${this.formatPowerMinutes(nextMon)}</strong> of idle time.`
        );
      }
    } else if (diskChanged) {
      if (nextDisk === 0) {
        mood = '💿';
        text = L(
          'Жёсткие диски теперь <strong>никогда не останавливаются</strong>! Блины крутятся на полных оборотах без пауз на раскрутку.',
          'Hard disks are now set to <strong>Never</strong> spin down! The platters will keep spinning at full speed with zero spin-up lag.'
        );
      } else if (nextDisk <= 5) {
        mood = '🤫';
        text = L(
          `Остановка жёстких дисков <strong>${this.formatPowerMinutes(nextDisk)}</strong>! Стоит ненадолго задуматься, и винчестер тихо запаркует головки.`,
          `Hard disks will spin down <strong>${this.formatPowerMinutes(nextDisk)}</strong>! Pause for a moment and the drive will quietly park its heads.`
        );
      } else {
        mood = '💾';
        text = L(
          `Таймер жёстких дисков обновлён: остановка шпинделя <strong>${this.formatPowerMinutes(nextDisk)}</strong> бездействия.`,
          `Hard disk timer updated: spindle shuts down <strong>${this.formatPowerMinutes(nextDisk)}</strong> of inactivity.`
        );
      }
    } else if (trayChanged) {
      if (next.showTrayIcon) {
        mood = '🔌';
        text = L(
          'Значок электропитания появился на панели задач рядом с часами! По левому щелчку можно быстро переключать схемы питания.',
          'The power icon is now on the taskbar next to the clock! Left-click it anytime to switch power schemes on the fly.'
        );
      } else {
        mood = '🧹';
        text = L(
          'Убрали значок питания из системного трея. Теперь возле часов просторнее, и мне там никто не наступает на хвост!',
          'Hid the power icon from the system tray. More breathing room next to the clock for me!'
        );
      }
    }

    clippy.speak(text, undoActions, mood, 12000);
    return true;
  }

  onPowerSchemeSaved(name, timers = { monitorTimeout: 15, diskTimeout: 60 }) {
    if (!this.canReact()) return false;
    const clippy = this.clippy();
    const L = (ru, en) => this.lang(ru, en);
    const safeName = this.esc(name || '');
    const m = typeof timers.monitorTimeout === 'number' ? timers.monitorTimeout : (timers.monitor ?? 15);
    const d = typeof timers.diskTimeout === 'number' ? timers.diskTimeout : (timers.disk ?? 60);
    clippy.animate('writing');
    clippy.speak(L(
      `Записал новую схему питания <strong>«${safeName}»</strong> (монитор — ${this.formatPowerMinutes(m)}, диски — ${this.formatPowerMinutes(d)}). Теперь её можно включать даже из трея!`,
      `Saved new power scheme <strong>"${safeName}"</strong> (monitor: ${this.formatPowerMinutes(m)}, hard disks: ${this.formatPowerMinutes(d)}). You can now switch to it right from the tray!`
    ), [], '📋', 9500);
    return true;
  }

  onPowerSchemeDeleted(name) {
    if (!this.canReact()) return false;
    const clippy = this.clippy();
    const L = (ru, en) => this.lang(ru, en);
    const safeName = this.esc(name || '');
    clippy.speak(L(
      `Схема питания <strong>«${safeName}»</strong> удалена. Я вычеркнул её из своего блокнота.`,
      `Power scheme <strong>"${safeName}"</strong> has been deleted. I crossed it out of my notebook.`
    ), [], '🗑️', 8000);
    return true;
  }

  onMonitorStandbyWake() {
    if (!this.canReact()) return false;
    const clippy = this.clippy();
    const L = (ru, en) => this.lang(ru, en);
    clippy.speak(L(
      'С возвращением! Кинескоп снова прогрелся, огонёк на мониторе позеленел. А я в темноте никуда не уходил — сторожил ваши окна.',
      'Welcome back! The CRT is warmed up again and the power LED is back to green. I stayed right here in the dark guarding your windows.'
    ), [], '🌅', 9000);
    return true;
  }

  onHardDiskSpinDown() {
    if (!this.canReact()) return false;
    const clippy = this.clippy();
    const L = (ru, en) => this.lang(ru, en);
    clippy.speak(L(
      'Тс-с... Слышите? Жёсткий диск запарковал головки и остановил шпиндель по таймеру электропитания. В системном блоке теперь тишина!',
      'Shh... Hear that? The hard drive parked its heads and spun down the spindle on the power timer. Total silence inside the case!'
    ), [], '🤫', 8500);
    return true;
  }

  onHardDiskWake() {
    if (!this.canReact()) return false;
    const clippy = this.clippy();
    const L = (ru, en) => this.lang(ru, en);
    clippy.speak(L(
      'Вжжж-щёлк! Жёсткий диск проснулся и раскрутил блины обратно до 5400 оборотов в минуту.',
      'Whirrr-click! The hard disk woke up and spun its platters back up to 5400 RPM.'
    ), [], '💿', 7500);
    return true;
  }

  onCdRomInserted(discId, drive = 'D:') {
    if (!this.canReact()) return false;
    const clippy = this.clippy();
    const L = (ru, en) => this.lang(ru, en);
    if (discId === 'office_games_98') {
      clippy.animate('lookAround');
      clippy.speak(L(
        'Вжжж! Привод D: раскрутил том <strong>OFFICE_GAMES_98</strong> («Офисные игры ’98»). Поначалу я решил, что это дистрибутив Microslop Office 97, но внутри восемь офисных аркад и три музыкальные дорожки RedBook CD-Audio! Запустим <code>D:\\LAUNCHER.EXE</code>?',
        'Whirrr! Drive D: spun up volume <strong>OFFICE_GAMES_98</strong> ("Office Games ’98"). At first I thought it was the Microslop Office 97 disc, but inside are eight office arcades and three RedBook CD-Audio tracks! Launch <code>D:\\LAUNCHER.EXE</code>?'
      ), [
        { text: L('▶ Запустить лаунчер (LAUNCHER.EXE)', '▶ Launch LAUNCHER.EXE'), action: () => window.appOfficeLauncher && window.appOfficeLauncher.open() },
        { text: L('🎵 Слушать CD-Audio (дорожки 2–4)', '🎵 Play CD-Audio (Tracks 2–4)'), action: () => window.appCdPlayer && window.appCdPlayer.open() },
        { text: L('📂 Открыть диск D:', '📂 Open Drive D:'), action: () => window.appExplorer && window.appExplorer.open(['My Computer', drive]) }
      ], '💿', 12000);
      return true;
    }
    if (discId === 'igromania_09_1998') {
      clippy.animate('lookAround');
      clippy.speak(L(
        'В приводе D: раскрутился сентябрьский выпуск журнала <strong>«Игромания» (№9 ’98)</strong>! На диске лежат двадцать демоверсий, видеоролики и оболочка <code>igroman.exe</code>. Half-Life 98, Max Payne, Minecraft 98 и другие демки отсюда в Steam не продаются, их ставят только с диска.',
        'Drive D: spun up the September 1998 issue of <strong>Igromania</strong>! Twenty demos, video clips, and <code>igroman.exe</code> are ready. Half-Life 98, Max Payne, Minecraft 98 and the other demos here are not sold on Steam, they install only from the disc.'
      ), [
        { text: L('▶ Открыть журнал (igroman.exe)', '▶ Open Igromania (igroman.exe)'), action: () => window.appIgroman && window.appIgroman.open() },
        { text: L('📂 Открыть диск D:', '📂 Open Drive D:'), action: () => window.appExplorer && window.appExplorer.open(['My Computer', drive]) }
      ], '💿', 10000);
      return true;
    }
    return false;
  }

  onCdRomEjected(prevDiscId, drive = 'D:') {
    if (!this.canReact()) return false;
    const clippy = this.clippy();
    const L = (ru, en) => this.lang(ru, en);
    const wm = window.winManager;
    if (prevDiscId === 'office_games_98') {
      let runningOg = false;
      if (wm && wm.windows) {
        wm.windows.forEach((win, id) => {
          if (id === 'app_office_launcher' || (typeof id === 'string' && id.startsWith('app_og_'))) runningOg = true;
        });
      }
      if (runningOg) {
        clippy.speak(L(
          'Лоток привода D: выехал с диском <strong>«Офисные игры ’98»</strong>! Кстати, открытая игра целиком поместилась в оперативную память, так что партию можно доиграть даже без диска. Главное, чтобы шеф не заметил коробку на столе!',
          'Drive D: tray ejected <strong>"Office Games ’98"</strong>! The open game fits right in RAM, so you can finish your round even without the disc.'
        ), [
          { text: L('• Вставить «Офисные игры ’98» обратно', '• Insert "Office Games ’98" back'), action: () => window.vfs && window.vfs.insertCdRom(drive, 'office_games_98') }
        ], '📀', 11000);
      } else {
        clippy.speak(L(
          'Диск <strong>«Офисные игры ’98»</strong> извлечён из привода D:. Если захотите снова побить рекорд в «Цветных Линиях 98» или «Офисном Арканоиде», вставьте его через значок CD-ROM в трее.',
          '<strong>"Office Games ’98"</strong> has been ejected from drive D:. Reinsert it anytime from the CD-ROM tray icon.'
        ), [
          { text: L('• Вставить «Офисные игры ’98» обратно', '• Reinsert "Office Games ’98"'), action: () => window.vfs && window.vfs.insertCdRom(drive, 'office_games_98') }
        ], '📀', 9500);
      }
      return true;
    }
    clippy.speak(L(
      'Лоток дисковода D: открылся, компакт-диск извлечён. Через значок CD-ROM в трее можно вставить <strong>«Офисные игры ’98»</strong> или <strong>«Игроманию»</strong>.',
      'Drive D: tray opened and the CD-ROM was ejected. Use the CD-ROM tray icon to insert <strong>"Office Games ’98"</strong> or <strong>"Igromania"</strong>.'
    ), [
      { text: L('• Вставить «Офисные игры ’98»', '• Insert "Office Games ’98"'), action: () => window.vfs && window.vfs.insertCdRom(drive, 'office_games_98') }
    ], '📀', 9000);
    return true;
  }

  onOfficeLauncherSelect(game) {
    if (!this.canReact() || !game || !game.id) return false;
    const clippy = this.clippy();
    if (clippy.balloonOpen() && clippy.annoyance !== 'chaos') return false;
    const now = Date.now();
    if (this.lastOgSelectedId === game.id && clippy.annoyance !== 'chaos') return false;
    if (now - (this.lastOgSelectAt || 0) < 3500 && clippy.annoyance !== 'chaos') return false;
    this.lastOgSelectedId = game.id;
    this.lastOgSelectAt = now;

    const notes = {
      snake3d: '<strong>«3D Змейка»</strong>: синие папки дают по 50 очков, чашки эспрессо — по 25, дискеты — по 10. По клавише <strong>F12</strong> открывается таблица «Кадры_1998» со сверкой по Складу №2.',
      arkanoid: '<strong>«Офисный Арканоид»</strong>: три отдела от Бухгалтерии до Серверной, капсулы W, L и M. По <strong>F12</strong> маскируется под квартальный отчёт с амортизацией ПК Pentium-133.',
      rush: '<strong>«Побег в 18:00»</strong>: три этажа с лужами от кулера, креслами и самолётиками на пути к лифту. По <strong>F12</strong> выводит «Табель учёта рабочего времени» за сентябрь 1998-го.',
      hunt: '<strong>«Офисный Тир»</strong>: 90 секунд и обойма на 6 резинок. Часы на стене добавляют +5 секунд, а по золотому мне в красной шапочке чур не стрелять! По <strong>F12</strong> — инвентаризация 4 500 скрепок.',
      gems: '<strong>«Офисные Самоцветы»</strong>: 30 ходов на закрытие квартала. Каскады умножают очки, а <strong>F12</strong> показывает смету на 12 мониторов ViewSonic и кофеварки DeLonghi.',
      lines98: '<strong>«Цветные Линии 98»</strong>: поле 9×9 и три новых шарика за каждый ход без собранной пятёрки. По <strong>F12</strong> открывается справка о доходах по форме 2-НДФЛ.',
      tetris: '<strong>«Офисный Тетрис»</strong>: 800 очков за четыре ряда архивных коробок в шредер одним махом! По <strong>F12</strong> — «Опись документов постоянного хранения».',
      chairs: '<strong>«Гонки на креслах»</strong>: разгон ногами, бодрящий кофе для турбо-рывка до 85 км/ч и мокрые лужи. По <strong>F12</strong> — «План командировочных расходов».'
    };
    const text = notes[game.id];
    if (!text) return false;
    let score = 0;
    try {
      const raw = localStorage.getItem(game.scoreKey);
      if (raw) score = parseInt(raw, 10) || 0;
    } catch (e) {}
    const scoreLine = score > 0 ? `<br>Ваш рекорд здесь: <strong>${score}</strong>.` : '';
    clippy.speak(`${text}${scoreLine}`, [
      { text: `▶ Запустить «${game.title}»`, action: () => typeof game.open === 'function' && game.open() }
    ], '🕹️', 9500);
    return true;
  }

  onOfficeGameShortcut(game) {
    if (!this.canReact() || !game) return false;
    const clippy = this.clippy();
    const safeTitle = this.esc(game.title || '');
    const safeExe = this.esc(game.exePath || 'D:\\LAUNCHER.EXE');
    clippy.animate('writing');
    clippy.speak(`Ярлык <strong>«${safeTitle}.lnk»</strong> прямо на рабочем столе! Смело. Если начальник заглянет через плечо, скажите, что <code>${safeExe}</code> — это утилита пересчёта квартальной амортизации.`, [
      { text: `▶ Запустить «${safeTitle}»`, action: () => typeof game.open === 'function' && game.open() },
      { text: '• Спасибо за легенду', action: () => {} }
    ], '📌', 10000);
    return true;
  }

  onOfficeLauncherHelp() {
    if (!this.canReact()) return false;
    const clippy = this.clippy();
    clippy.speak('Добавлю к справке: у каждой из восьми игр на диске <strong>«Офисные игры ’98»</strong> свой собственный экран маскировки по клавише <strong>F12</strong> — от формы 2-НДФЛ в «Цветных Линиях» до инвентаризации скрепок в «Офисном Тире». А если нужно свернуть сразу все игры и открыть настоящий Microslop Excel, жмите «Шеф идёт!» в моём меню.', [
      { text: '• Сводка моих рекордов', action: () => this.speakOfficeGamesRecords() },
      { text: '🚨 Проверить «Шеф идёт!»', action: () => clippy.triggerBossKey() }
    ], '📋', 12000);
    return true;
  }

  speakOfficeGamesRecords() {
    const clippy = this.clippy();
    if (!clippy) return false;
    const reg = Array.isArray(window.OfficeGamesRegistry) ? window.OfficeGamesRegistry : [
      { id: 'snake3d', title: '3D Змейка', scoreKey: 'office_games_scores_snake3d' },
      { id: 'arkanoid', title: 'Офисный Арканоид', scoreKey: 'office_games_scores_arkanoid' },
      { id: 'rush', title: 'Побег в 18:00', scoreKey: 'office_games_scores_rush' },
      { id: 'hunt', title: 'Офисный Тир', scoreKey: 'office_games_scores_hunt' },
      { id: 'gems', title: 'Офисные Самоцветы', scoreKey: 'office_games_scores_gems' },
      { id: 'lines98', title: 'Цветные Линии 98', scoreKey: 'office_games_scores_lines98' },
      { id: 'tetris', title: 'Офисный Тетрис', scoreKey: 'office_games_scores_tetris' },
      { id: 'chairs', title: 'Гонки на креслах', scoreKey: 'office_games_scores_chairs' }
    ];
    const rows = reg.map(g => {
      let val = 0;
      try {
        const raw = localStorage.getItem(g.scoreKey);
        if (raw) val = parseInt(raw, 10) || 0;
      } catch (e) {}
      return { title: g.title, score: val, exePath: g.exePath || '' };
    });
    const played = rows.filter(r => r.score > 0);
    const total = rows.reduce((acc, r) => acc + r.score, 0);
    if (!played.length) {
      clippy.speak('На диске <strong>«Офисные игры ’98»</strong> пока ни одного записанного рекорда. Самое время начать с «Цветных Линий 98» или «Офисного Арканоида»!', [
        { text: '▶ Запустить «Цветные Линии 98»', action: () => window.appOgLines && window.appOgLines.open() },
        { text: '▶ Запустить «Офисный Арканоид»', action: () => window.appOgArkanoid && window.appOgArkanoid.open() }
      ], '🏆', 10000);
      return true;
    }
    const sorted = [...played].sort((a, b) => b.score - a.score);
    const top = sorted[0];
    clippy.animate('congratulate');
    clippy.speak(`По ведомости <strong>«Офисные игры ’98»</strong> у вас рекорды в <strong>${played.length} из ${rows.length}</strong> дисциплин, суммарный счёт — <strong>${total} очков</strong>! Лучший результат в игре «${this.esc(top.title)}» (${top.score}).`, [
      {
        text: '• Выписать табель рекордов в Блокнот',
        action: () => {
          const lines = [
            '====================================================',
            '   ТАБЕЛЬ ОФИСНЫХ РЕКОРДОВ ’98 (Том: OFFICE_GAMES_98)',
            '====================================================',
            '',
            ...rows.map((r, i) => `${i + 1}. ${r.title}: ${r.score} очк.`),
            '',
            `ИТОГО ПО ОТДЕЛУ: ${total} очк. (${played.length} из ${rows.length} игр)`,
            'Виза помощника: Скрепыш (CLIPPIT.ACS)'
          ].join('\r\n');
          if (window.appNotepad) window.appNotepad.open('ОФИСНЫЕ_РЕКОРДЫ_98.TXT', lines);
        }
      },
      { text: '• Отлично!', action: () => {} }
    ], '🏆', 12000);
    return true;
  }

  onOfficeGameEvent(gameId, event, data = {}) {
    if (!this.canReact()) return false;
    const clippy = this.clippy();
    const now = Date.now();

    if (event === 'boss_on') {
      clippy.setAccessory('boss-sign', true);
      const bossLines = {
        snake3d: 'Тс-с! На экране формула <code>=ВПР(A4; \'Кадры_1998\'!...)</code> и сверка со Складом №2 на 48 100 рублей. Делайте задумчивое лицо, будто ищете расхождение в копейках!',
        arkanoid: 'Шеф рядом? На экране <code>Отчёт_3_квартал_1998.xls</code>: амортизация ПК Pentium-133 и перерасход на чай и кофе +1 600 рублей. Нажмите <strong>F12</strong> или <strong>Esc</strong>, когда шаги стихнут.',
        rush: 'Маскировка включена! На экране «Табель учёта рабочего времени: Сентябрь 1998» — Иванов А.С. ушёл ровно в 18:00, а сисадмин Сидоров опять в ночную смену.',
        hunt: 'Экран шефа! Инвентаризация 1998: строка 2 — <strong>SKR-004, Скрепки канцелярские 28мм, 4 500 шт. на складе</strong>! Приятно видеть родственников на казённом учёте.',
        gems: 'Прикрытие сработало! На экране смета за 3 квартал: 12 мониторов ViewSonic по 1 850 рублей и две рожковые кофеварки DeLonghi для бухгалтерии.',
        lines98: 'Тс-с! Форма <strong>2-НДФЛ</strong> с подоходным налогом 13% и кодом дохода 2000. От одного вида этой таблицы любой начальник разворачивается в коридоре!',
        tetris: 'Включена «Опись документов постоянного хранения за 1998 г.»: Том Т-01, приказы генерального директора, 248 листов в коробе №12. Архив в полном порядке!',
        chairs: 'Тс-с! На экране «План командировочных расходов на 4 квартал 1998»: Санкт-Петербург, Нижний Новгород, Екатеринбург. Кресло стоит смирно, колёсики не скрипят!'
      };
      const text = bossLines[gameId] || bossLines.arkanoid;
      clippy.speak(text, [
        { text: '• Коридор чист (убрать Excel)', action: () => this.toggleOfficeGameBoss(gameId) }
      ], '🤫', 9500);
      return true;
    }

    if (event === 'boss_off') {
      clippy.setAccessory('boss-sign', false);
      clippy.speak('Коридор чист! Таблица Microslop Excel спрятана обратно в рукав, продолжаем партию.', [], '😌', 5500);
      return true;
    }

    if (event === 'shot_clippy') {
      if (now - (this.lastShotClippyAt || 0) < 6000 && clippy.annoyance !== 'chaos') return false;
      this.lastShotClippyAt = now;
      this.shotClippyCount = (this.shotClippyCount || 0) + 1;
      clippy.flash('panic-shake', 1500);
      const lines = [
        'Ай! Сто очков за попадание в меня?! То есть я польщён, что стою вдвое дороже обычной скрепки и впятеро дороже утки, но у меня же проволока 0,9 мм — рикошетит!',
        `Опять по красной шапочке?! Это уже ${this.shotClippyCount}-й раз за смену! Клянусь <code>CLIPPIT.ACS</code>, я сейчас спрячусь за окно Блокнота и буду подавать оттуда советы про Ctrl+S!`,
        'Попадание в помощника Office! Хорошо, что пульки резиновые, а я из нержавеющей стали Редмонда. Стреляйте лучше по часам на стене — они дают +5 секунд!'
      ];
      clippy.speak(lines[(this.shotClippyCount - 1) % lines.length], [], '😰', 8000);
      return true;
    }

    if (event === 'shot_paperclip') {
      if (this.shotPaperclipSeen && clippy.annoyance !== 'chaos') return false;
      this.shotPaperclipSeen = true;
      clippy.speak('Вы подбили летучую канцелярскую скрепку (+50 очков)! Не волнуйтесь, это дальняя родня со склада №2 (артикул SKR-004), они даже без глаз и без сертификата Microslop Agent.', [], '📎', 8000);
      return true;
    }

    if (event === 'four_lines') {
      if (now - (this.lastTetrisFourAt || 0) < 8000 && clippy.annoyance !== 'chaos') return false;
      this.lastTetrisFourAt = now;
      clippy.animate('congratulate');
      clippy.speak('Четыре архивных ряда в шредер одним махом — <strong>ТЕТРИС (+800 очков)</strong>! Длинная папка-палка пришла вовремя, как квартальная премия.', [], '📦', 8000);
      return true;
    }

    if (event === 'high_score') {
      const score = data && data.score ? data.score : 0;
      if (!score) return false;
      if (now - (this.lastOgHighScoreAt || 0) < 4000 && clippy.annoyance !== 'chaos') return false;
      this.lastOgHighScoreAt = now;
      const titles = {
        snake3d: '3D Змейка 98',
        arkanoid: 'Офисный Арканоид',
        rush: 'Побег в 18:00',
        hunt: 'Офисный Тир 98',
        gems: 'Офисные Самоцветы 98',
        lines98: 'Цветные Линии 98',
        tetris: 'Офисный Тетрис 98',
        chairs: 'Гонки на креслах 98'
      };
      const title = titles[gameId] || 'Офисные игры ’98';
      clippy.animate('congratulate');
      clippy.speak(`Новый рекорд в игре <strong>«${title}»</strong> — <strong>${score} очков</strong>! Результат сохранён и уже красуется в лаунчере диска «Офисные игры ’98».`, [
        { text: '• Сводка всех рекордов диска', action: () => this.speakOfficeGamesRecords() }
      ], '🏆', 9500);
      return true;
    }

    return false;
  }

  toggleOfficeGameBoss(gameId) {
    const map = {
      snake3d: window.appOgSnake3d,
      arkanoid: window.appOgArkanoid,
      rush: window.appOgRush,
      hunt: window.appOgHunt,
      gems: window.appOgGems,
      lines98: window.appOgLines,
      tetris: window.appOgTetris,
      chairs: window.appOgChairs
    };
    const app = map[gameId];
    if (app && typeof app.toggleBossKey === 'function') app.toggleBossKey();
  }

  chimeIfClockHidden() {
    const taskbar = window.taskbar;
    const hour = new Date().getHours();
    if (!taskbar || !taskbar.settings || taskbar.settings.showClock || this.clockChimeHour === undefined) {
      this.clockChimeHour = hour;
      return false;
    }
    if (this.clockChimeHour === hour) return false;
    this.clockChimeHour = hour;
    const clippy = this.clippy();
    if (!clippy || !clippy.isRunning() || !clippy.visible || clippy.annoyance === 'quiet') return false;
    clippy.speak(this.lang(
      `Тук-тук. Пробило ${this.hourText(hour)}. Часы вы убрали, так что объявляю сам.`,
      `Knock knock. It is ${this.hourText(hour)}. You hid the clock, so I am announcing it myself.`
    ), [], '🕐', 6000);
    return true;
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
