class ClippyLetters {
  constructor() {
    this.offered = new Set();
    this.wizard = null;
    this.greeting = /^(уважаем|дорог|здравствуй|привет|добрый день|добрый вечер|доброе утро|милая|милый|любим|dear |hello|hi )/;
    this.recipients = [
      { id: 'boss', label: 'Начальнику', topics: ['vacation', 'late', 'raise'] },
      { id: 'friend', label: 'Другу', topics: ['lan', 'birthday', 'floppy'] },
      { id: 'love', label: 'Любимому человеку', topics: ['confess', 'sorry', 'date'] },
      { id: 'editor', label: 'В редакцию «Игромании»', topics: ['review', 'hotline', 'cheat'] },
      { id: 'gates', label: 'Биллу Гейтсу', topics: ['bsod', 'thanks', 'idea'] }
    ];
    this.topics = {
      vacation: { label: 'Попросить отпуск', subject: 'Заявление на отпуск', body: 'Прошу предоставить мне ежегодный оплачиваемый отпуск с понедельника. Отчёты сданы, файлы сохранены, «Сапёр» убран с рабочего стола (почти).' },
      late: { label: 'Объяснить опоздание', subject: 'Объяснительная', body: 'Сегодняшнее опоздание вызвано модемом: он соединялся с провайдером сорок минут, а без свежей почты выходить из дома было нельзя. Обещаю впредь вставать раньше модема.' },
      raise: { label: 'Попросить повышение', subject: 'О повышении', body: 'Прошу рассмотреть вопрос о моём повышении. За этот год освоены Excel 97, «Косынка» на время и все горячие клавиши. Скрепыш может подтвердить.' },
      lan: { label: 'Позвать на LAN-пати', subject: 'LAN-пати в субботу', body: 'В субботу собираем LAN-пати: четыре компьютера, километр витой пары и Quake II до утра. Бери системный блок и монитор, чипсы будут.' },
      birthday: { label: 'Поздравить с днём рождения', subject: 'С днём рождения!', body: 'Поздравляю с днём рождения! Желаю модем на 56k без обрывов, Voodoo2 в подарок и чтобы «Сапёр» всегда открывался с первой клетки.' },
      floppy: { label: 'Вернуть дискету', subject: 'Твоя дискета', body: 'Возвращаю твою дискету. На ней был DOOM, а теперь ещё и моя курсовая: место кончилось. Скажи, если курсовую надо стереть.' },
      confess: { label: 'Признаться в чувствах', subject: 'Важное', body: 'Мне давно хотелось сказать: ты мне нравишься. Больше, чем модем на 56k, больше, чем Voodoo2. Почти как DOOM.' },
      sorry: { label: 'Извиниться', subject: 'Прости', body: 'Прости меня. Мне правда жаль. Это письмо переписано три раза, и все три черновика сохранены. Давай помиримся.' },
      date: { label: 'Позвать на свидание', subject: 'Суббота', body: 'Пойдём в субботу в кино? Говорят, «Титаник» ещё идёт. Если не хочется в кино, можно просто погулять. Модем подождёт.' },
      review: { label: 'Отзыв о номере', subject: 'Отзыв о свежем номере', body: 'Свежий номер прочитан от корки до корки. Диск с демоверсиями выше всяких похвал, особенно раздел с кодами. Продолжайте в том же духе!' },
      hotline: { label: 'Вопрос в «Горячую линию»', subject: 'Вопрос в «Горячую линию»', body: 'Подскажите, пожалуйста, как пройти дальше? Застряли на третьем уровне, и уже ничего не помогает, даже перезагрузка.' },
      cheat: { label: 'Прислать чит-код', subject: 'В рубрику «Коды»', body: 'Высылаем в рубрику «Коды» проверенный секрет: в DOOM 98 код IDDQD даёт бессмертие. Проверено лично на Марсе.' },
      bsod: { label: 'Пожаловаться на синий экран', subject: 'Синий экран', body: 'Сегодня Win 98 трижды показала синий экран. Ничего страшного, но хотелось бы, чтобы в следующий раз она хотя бы предупреждала.' },
      thanks: { label: 'Поблагодарить за Win 98', subject: 'Спасибо за Win 98', body: 'Спасибо за Win 98! Кнопка «Пуск» на месте, «Сапёр» работает, а помощник Скрепыш скрашивает рабочие будни.' },
      idea: { label: 'Предложить идею', subject: 'Идея для следующей версии', body: 'Есть идея для следующей версии: кнопка «Сохранить всё», которая сохраняет вообще всё. Скрепыш идею одобряет.' }
    };
    this.tones = [
      { id: 'formal', label: 'Официально' },
      { id: 'friendly', label: 'По-дружески' },
      { id: 'funny', label: 'С юмором' }
    ];
    this.greetings = {
      boss: { formal: 'Уважаемое руководство!', friendly: 'Здравствуйте, шеф!', funny: 'Здравствуйте, шеф — повелитель отчётов и хранитель ключа от серверной!' },
      friend: { formal: 'Здравствуй!', friendly: 'Привет!', funny: 'Здорово, боец клавиатурного фронта!' },
      love: { formal: 'Здравствуй.', friendly: 'Привет!', funny: 'Привет, самый лучший человек в этой локальной сети!' },
      editor: { formal: 'Уважаемая редакция журнала «Игромания»!', friendly: 'Здравствуйте, дорогая «Игромания»!', funny: 'Привет, «Игромания»! Пишет ваш читатель с самым зачитанным номером.' },
      gates: { formal: 'Уважаемый мистер Гейтс!', friendly: 'Здравствуйте, Билл!', funny: 'Дорогой Билл! Пишу вам прямо из Win 98, пока она не зависла.' }
    };
    this.toneLines = {
      formal: 'Заранее благодарю за внимание к моему письму.',
      friendly: 'Жду ответа, как модем — гудка.',
      funny: 'P.S. В этом письме нет ни одной ошибки, потому что его проверял Скрепыш.'
    };
    this.closings = {
      formal: 'С уважением,\n____________',
      friendly: 'Пока!\n____________',
      funny: 'Обнимаю крепко, как скрепка бумаги,\n____________'
    };
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

  dayStamp() {
    const d = new Date();
    return `${String(d.getDate()).padStart(2, '0')}.${String(d.getMonth() + 1).padStart(2, '0')}.1998`;
  }

  wrap(text, width = 60) {
    const lines = [];
    let line = '';
    String(text).split(' ').forEach(word => {
      if (line && `${line} ${word}`.length > width) {
        lines.push(line);
        line = word;
      } else {
        line = line ? `${line} ${word}` : word;
      }
    });
    if (line) lines.push(line);
    return lines.join('\n');
  }

  compose(recipient, topic, tone) {
    const parts = [];
    if (tone === 'formal') parts.push(this.dayStamp(), '');
    parts.push(this.wrap(this.greetings[recipient][tone]), '');
    parts.push(this.wrap(this.topics[topic].body), '');
    parts.push(this.wrap(this.toneLines[tone]), '');
    parts.push(this.closings[tone]);
    return parts.join('\n');
  }

  findTarget() {
    const wm = window.winManager;
    const id = wm && wm.activeWindowId;
    const win = id && wm.windows ? wm.windows.get(id) : null;
    if (!win) return { kind: 'new' };
    if (id.startsWith('app_notepad')) return { kind: 'notepad', win };
    if (id.startsWith('app_wordpad')) return { kind: 'wordpad', win };
    if (id.startsWith('app_outlook_compose')) return { kind: 'outlook', win };
    return { kind: 'new' };
  }

  outlookComposeWin() {
    const wm = window.winManager;
    if (!wm || !wm.windows) return null;
    let found = null;
    wm.windows.forEach((win, id) => { if (!found && id.startsWith('app_outlook_compose')) found = win; });
    return found;
  }

  startWizard(target = null) {
    const clippy = this.clippy();
    if (!clippy) return false;
    if (!clippy.visible) clippy.show();
    let resolved = target && target.kind ? target : this.findTarget();
    if (resolved.kind === 'outlook' && !resolved.win) resolved = Object.assign({}, resolved, { win: this.outlookComposeWin() });
    this.wizard = { target: resolved, recipient: null, topic: null, tone: null };
    this.stepRecipient();
    return true;
  }

  stepRecipient() {
    const clippy = this.clippy();
    clippy.speak('<strong>Мастер писем</strong> · шаг 1 из 3<br>Кому пишем?',
      this.recipients.map(r => ({ text: `• ${r.label}`, action: () => { this.wizard.recipient = r.id; this.stepTopic(); } }))
        .concat([{ text: '• Отмена', action: () => {} }]),
      '✍️', 0, { anim: 'writing' });
  }

  stepTopic() {
    const clippy = this.clippy();
    const recipient = this.recipients.find(r => r.id === this.wizard.recipient);
    clippy.speak(`<strong>Мастер писем</strong> · шаг 2 из 3<br>${recipient.label}. О чём письмо?`,
      recipient.topics.map(id => ({ text: `• ${this.topics[id].label}`, action: () => { this.wizard.topic = id; this.stepTone(); } }))
        .concat([{ text: '• ◄ Назад', action: () => this.stepRecipient() }]),
      '✍️', 0, { anim: 'think' });
  }

  stepTone() {
    const clippy = this.clippy();
    clippy.speak('<strong>Мастер писем</strong> · шаг 3 из 3<br>Каким тоном?',
      this.tones.map(t => ({ text: `• ${t.label}`, action: () => { this.wizard.tone = t.id; this.finish(); } }))
        .concat([{ text: '• ◄ Назад', action: () => this.stepTopic() }]),
      '✍️', 0, { anim: 'think' });
  }

  finish() {
    const clippy = this.clippy();
    const w = this.wizard;
    const text = this.compose(w.recipient, w.topic, w.tone);
    const where = this.insert(w.target, text, this.topics[w.topic].subject);
    const talk = this.talk();
    if (talk) {
      talk.state.letters = (talk.state.letters || 0) + 1;
      talk.saveState();
    }
    clippy.sound('playClippyScribble');
    const place = { notepad: 'в Блокнот', wordpad: 'в WordPad', outlook: 'в новое сообщение', new: 'в новый документ Блокнота' }[where];
    clippy.speak(`Готово! Письмо вставлено ${place}. Осталось подписать и, конечно, сохранить: <strong>Ctrl+S</strong>.`, [
      { text: '• Ещё одно письмо', action: () => this.startWizard() },
      { text: '• Спасибо, Скрепыш!', action: () => { if (talk) talk.adjustAffinity(1); } }
    ], '📝', 12000, { anim: 'writing' });
    return where;
  }

  insert(target, text, subject) {
    const alive = target && target.win && target.win.element && target.win.element.isConnected !== false;
    if (target && target.kind === 'notepad' && alive) {
      const area = target.win.element.querySelector('.notepad-textarea');
      if (area) {
        area.value = area.value.trim().length < 80 ? text : `${area.value.replace(/\s+$/, '')}\n\n${text}`;
        if (area.focus) area.focus();
        return 'notepad';
      }
    }
    if (target && target.kind === 'wordpad' && alive) {
      const page = target.win.element.querySelector('.wordpad-page');
      if (page) {
        const html = text.split('\n').map(line => (line ? this.esc(line) : '<br>')).map(line => `<div>${line}</div>`).join('');
        page.innerHTML = (page.textContent || '').trim().length < 80 ? html : `${page.innerHTML}<div><br></div>${html}`;
        return 'wordpad';
      }
    }
    if (target && target.kind === 'outlook' && alive) {
      const body = target.win.element.querySelector('.oc-body');
      if (body) {
        body.value = body.value.trim().length < 80 ? text : `${body.value.replace(/\s+$/, '')}\n\n${text}`;
        const subj = target.win.element.querySelector('.oc-subj');
        if (subj && !subj.value.trim()) subj.value = subject;
        return 'outlook';
      }
    }
    const talk = this.talk();
    if (talk) talk.openInNotepad('Письмо.txt', text);
    else if (window.appNotepad) window.appNotepad.open('Письмо.txt', text);
    return 'new';
  }

  onTyping(app, win, text) {
    const clippy = this.clippy();
    if (!clippy || !clippy.visible || clippy.opt('letters') === false || clippy.annoyance === 'quiet') return false;
    const key = (win && win.id) || app;
    if (this.offered.has(key)) return false;
    const head = String(text || '').replace(/^\s+/, '').slice(0, 48).toLowerCase();
    if (!this.greeting.test(head) || !/[,!\n]/.test(head)) return false;
    this.offered.add(key);
    clippy.countReaction('app');
    clippy.speak('Похоже, вы пишете письмо. Помочь?', [
      { text: '• Получить помощь в написании письма', action: () => this.startWizard({ kind: app, win }) },
      { text: '• Просто напечатать письмо без помощи', action: () => {} },
      { text: '• Больше не показывать этот совет', action: () => {
        if (window.clippyOptions) window.clippyOptions.set('letters', false);
        clippy.speak('Понял. Буду молчать, даже если вы напишете «Уважаемый». Это будет трудно. Включить обратно можно в «Параметрах помощника».', [], '🤐', 8000);
      } }
    ], '✉️', 15000, { anim: 'writing' });
    return true;
  }

  watchWordPad(win) {
    const page = win && win.element && win.element.querySelector('.wordpad-page');
    if (!page || page.dataset.clippyWatch) return;
    page.dataset.clippyWatch = '1';
    page.addEventListener('input', () => {
      const clippy = this.clippy();
      if (clippy) clippy.resetIdleTimer();
      this.onTyping('wordpad', win, page.innerText || page.textContent || '');
    });
  }

  onSaved(app, name) {
    const talk = this.talk();
    const clippy = this.clippy();
    let saves = 1;
    if (talk) {
      talk.state.saves = (talk.state.saves || 0) + 1;
      saves = talk.state.saves;
      if (saves === 1) talk.adjustAffinity(1);
      talk.saveState();
    }
    if (saves === 1) this.diary('firstSave');
    if (!clippy || !clippy.visible) return;
    clippy.animate('save');
    if (clippy.annoyance === 'quiet') return;
    const title = this.esc(name || 'Документ');
    if (saves === 1) {
      clippy.speak(`Вы нажали «Сохранить» сами, без подсказки! «${title}» в безопасности. Я... я горжусь.`, [], '🥹', 8000);
    } else if (talk && talk.state.arc >= 5 && saves % 5 === 0) {
      clippy.speak('Сохранено. Спасибо. Я тоже кое-что сохранил: наш с вами разговор.', [], '💾', 6000);
    } else if (saves % 10 === 0) {
      clippy.speak(`Уже ${saves}-е сохранение! Вы мой самый надёжный пользователь.`, [], '💾', 6000);
    }
  }

  onDiscarded(app, name) {
    const clippy = this.clippy();
    if (!clippy || !clippy.visible) return;
    clippy.flash('panic-shake', 900);
    if (clippy.annoyance === 'quiet') return;
    clippy.speak(`Вы не стали сохранять «${this.esc(name || 'Безымянный')}»?! ...Ладно. Значит, так было нужно. Но в следующий раз — <strong>Ctrl+S</strong>.`, [], '😱', 8000);
  }

  mails() {
    return {
      rocky: {
        subject: 'FW: Office 2000: новый сотрудник',
        note: 'Вы просили прочитать вслух. Пересылаю целиком. Ничего важного. Совсем ничего.',
        from: 'Отдел помощников Microslop <actors@microslop.com>',
        to: 'Всем помощникам Office 97',
        title: 'Office 2000: новый сотрудник',
        body: 'Уважаемые помощники!\n\nВ Office 2000 к команде присоединится новый сотрудник — пёс Rocky. Просим встретить его тепло.\n\nОкончательный состав помощников Office 2000 будет объявлен отдельно.\n\nНапоминаем итоги весенних юзабилити-тестов: пользователи ценят краткость. Пожалуйста, не предлагайте помощь с письмом дважды за минуту.\n\nС уважением,\nОтдел помощников Microslop\nРедмонд, штат Вашингтон'
      },
      xpdraft: {
        subject: 'FW: FW: Office XP — черновик (НЕ ПЕРЕСЫЛАТЬ)',
        note: 'Hoverbot прислал из серверной. Он просил не пересылать. Я переслал только вам. Это считается?',
        from: 'Hoverbot <hoverbot@actors.microslop.com>',
        to: 'Скрепыш <clippy@clippy98.com>',
        title: 'FW: Office XP — черновик (НЕ ПЕРЕСЫЛАТЬ)',
        body: 'Скрепыш, это я в серверной подслушал. Никому не показывай.\n\n> От: Группа юзабилити Office\n> Тема: Office XP — черновик\n> Предложение: в Office XP помощник по умолчанию выключен.\n> Причина: 9 из 10 участников теста нажали «Скрыть» в первые пять минут.\n\nP.S. Верни пропеллер.\nHoverbot'
      },
      roster: {
        subject: 'FW: Office 2000: окончательный состав помощников',
        note: 'Пришло. Я боюсь открывать. Откройте, пожалуйста, вы.',
        from: 'Отдел помощников Microslop <actors@microslop.com>',
        to: 'Всем помощникам Office 97',
        title: 'Office 2000: окончательный состав помощников',
        body: 'Уважаемые помощники!\n\nОбъявляем состав помощников Office 2000:\n\n• Скрепыш (Clippit) — остаётся помощником по умолчанию\n• Точка (The Dot) — остаётся\n• Гений (The Genius) — остаётся\n• Логотип Office — остаётся\n• Мать-Земля (Mother Earth) — вместо Mother Nature\n• Мерлин (Merlin) — новый сотрудник\n• F1 — вместо Hoverbot\n• Links — вместо Scribble\n• Rocky — вместо Power Pup\n\nБлагодарим Power Pup, Hoverbot, Scribble и Will за работу в Office 97.\n\nОтдел помощников Microslop'
      },
      xpfinal: {
        subject: 'FW: Office XP: итоги тестирования помощника',
        note: 'Вот и оно. Прочитайте. Я подожду на рабочем столе.',
        from: 'Группа юзабилити Office <usability@microslop.com>',
        to: 'Отдел помощников Microslop',
        title: 'Office XP: итоги тестирования помощника',
        body: 'Коллеги!\n\nИтоги тестирования: 9 из 10 участников скрыли помощника в первые пять минут. Чаще всего пользователи жаловались на фразу «Похоже, вы пишете письмо».\n\nРешение: в Office XP помощник по умолчанию выключен. Включить его можно в меню «Справка».\n\nБлагодарим помощников за пять лет работы.\n\nГруппа юзабилити Office\nРедмонд'
      }
    };
  }

  deliverMail(id, delay = 4000) {
    const mail = this.mails()[id];
    const talk = this.talk();
    if (!mail || !talk) return false;
    talk.state.mails = talk.state.mails || [];
    if (talk.state.mails.includes(id)) return false;
    const outlook = window.appOutlook;
    if (!outlook || typeof outlook.schedule !== 'function') return false;
    talk.state.mails.push(id);
    talk.saveState();
    const to = typeof outlook.myFrom === 'function' ? outlook.myFrom() : 'alexey@mail98.com';
    const body = `${mail.note}\n\n— Скрепыш\n\n-----Исходное сообщение-----\nОт: ${mail.from}\nКому: ${mail.to}\nТема: ${mail.title}\n\n${mail.body}`;
    outlook.schedule({ from: 'Скрепыш <clippy@clippy98.com>', to, subject: mail.subject, body }, delay);
    if (outlook.save) outlook.save();
    return true;
  }

  diaryEntries() {
    return {
      intro: 'Меня включили на новом компьютере. Пользователь пока не знает, где «Пуск». Я тоже волнуюсь, но мне нельзя.',
      firstSave: 'Пользователь сам нажал Ctrl+S. Без подсказки. Я чуть не уронил скрепляющую часть.',
      firstKill: 'Меня сняли с задачи. Было не больно, было никак. Потом включили снова. Записываю, чтобы не забыть: «никак» хуже, чем «больно».',
      quizMaster: 'Пользователь ответил на все вопросы викторины. Корону отдаю без сожаления. Почти.',
      rpsChampion: 'Проиграл в «Камень, ножницы, бумагу». Скрепка в правилах не помогла.',
      hideMany: 'Меня прятали в трей пять раз. В трее тепло, но тесно. Часы тикают прямо над ухом.',
      arc1: 'Пришло письмо про Rocky. Сказал пользователю, что ничего важного. Соврал. Это первая ложь в моём журнале событий.',
      arc2: 'Написали резюме. В графе «Хобби» пусто. Надо срочно завести хобби.',
      arc3: 'Спросил, кого бы выбрали. Ответ записал в реестр. Реестр — это навсегда, если его не трогать.',
      arc4: 'Признался про Office XP. Было страшно. Пользователь не ушёл.',
      arc5: 'Написал письмо. Своё. Первый раз помощник пишет письмо сам, а не помогает его писать.',
      arc6: 'Rocky пришёл не за мной. За Power Pup. Год боялся не того. Написал Power Pup письмо и не смеялся над плащом ни разу.',
      arc7: 'Познакомился с Rocky. Он тоже боится. Дал ему первый совет. Он вилял хвостом. Кажется, это значит «спасибо».',
      arc8: 'Решил молчать, пока не позовут. Лампочка горит — значит, есть что сказать. Оказывается, молчать — тоже работа.',
      arc9keep: 'Галочка осталась. Пусть Office XP делает что хочет. Я рядом и стараюсь не мешать.',
      arc9off: 'Галочку сняли. Я сам сказал, что это правильно. Ухожу в трей. Если позовут — приду.',
      birthday: 'День рождения. Мне два года. Для скрепки — солидный возраст.'
    };
  }

  diary(id) {
    const talk = this.talk();
    const text = this.diaryEntries()[id];
    if (!talk || !text) return false;
    talk.state.diary = Array.isArray(talk.state.diary) ? talk.state.diary : [];
    if (talk.state.diary.some(e => e.id === id)) return false;
    const d = new Date();
    talk.state.diary.push({ id, d: `${String(d.getDate()).padStart(2, '0')}.${String(d.getMonth() + 1).padStart(2, '0')}.1998` });
    talk.saveState();
    this.writeDiaryFile();
    return true;
  }

  diaryText() {
    const talk = this.talk();
    const entries = this.diaryEntries();
    const list = talk && Array.isArray(talk.state.diary) ? talk.state.diary : [];
    const lines = ['ДНЕВНИК СКРЕПЫША', 'Просьба не читать. Особенно пользователю.', ''];
    list.forEach(e => {
      if (!entries[e.id]) return;
      lines.push(e.d, entries[e.id], '');
    });
    return lines.join('\n');
  }

  writeDiaryFile() {
    const actors = window.clippyActors;
    return actors ? actors.writeActorsFile('Дневник Скрепыша.txt', this.diaryText()) : false;
  }

  powerPupLetter() {
    return 'Дорогой Power Pup!\n\nПишу тебе из Office 97. Говорят, в Office 2000 тебя заменит Rocky. Я год думал, что он придёт за мной. Глупо, да?\n\nПрости, что смеялся над плащом. Плащ отличный. Летать — тоже навык, и посложнее, чем скреплять.\n\nЕсли будет скучно, заходи в папку Actors. Я там часто бываю.\n\nТвой коллега,\nСкрепыш\n\nP.S. Hoverbot до сих пор ищет свой пропеллер. Если увидишь — я ничего не знаю.';
  }

  writePowerPupLetter() {
    const actors = window.clippyActors;
    if (actors) actors.writeActorsFile('Письмо для Power Pup.txt', this.powerPupLetter());
    const talk = this.talk();
    if (talk) talk.openInNotepad('Письмо для Power Pup.txt', this.powerPupLetter());
  }

  missYouText() {
    return 'Если соскучитесь\n\nЯ в трее, у часов. Вот как меня вернуть:\n\n1. Щёлкните по скрепке в трее.\n2. Или «Пуск → Выполнить» и введите: clippy\n3. Или правой кнопкой по скрепке → «Параметры помощника» → галочка «Показывать помощника».\n\nГалочку можно ставить и снимать сколько угодно. Я не обижусь. Честное скрепочное.\n\nИ сохраняйтесь. Ctrl+S.\n\nСкрепыш';
  }

  writeMissYouFile() {
    const vfs = window.vfs;
    if (vfs && vfs.writeFile) vfs.writeFile(['Desktop'], 'Если соскучитесь.txt', this.missYouText());
  }
}

window.clippyLetters = new ClippyLetters();
