class ClippyActors {
  constructor() {
    this.officePath = ['My Computer', 'C:', 'Program Files', 'Microslop Office'];
    this.actorsPath = this.officePath.concat(['Office', 'Actors']);
    this.rocky = null;
    this.rockyTimers = [];
    this.actors = [
      {
        id: 'clippit', file: 'CLIPPIT.ACT', version: '97',
        name: { ru: 'Скрепыш (Clippit)', en: 'Clippit' },
        desc: {
          ru: 'Помощник по умолчанию. Знает всё о письмах и о том, как не потерять несохранённый документ. Стучит по стеклу монитора изнутри.',
          en: 'The default assistant. Knows everything about letters and about not losing an unsaved document. Knocks on the monitor glass from the inside.'
        },
        line: 'Это я. Только упакованный: 1,2 МБ анимаций и ни одного письма. Распаковывать не нужно, я уже здесь.'
      },
      {
        id: 'dot', file: 'DOT.ACT', version: '97',
        name: { ru: 'Точка (The Dot)', en: 'The Dot' },
        desc: {
          ru: 'Весёлый прыгающий мячик. Отвечает быстро и всегда в движении. Шляпы с неё скатываются.',
          en: 'A bouncing ball. Quick answers, always on the move. Hats roll right off.'
        },
        line: 'Точка! Она сейчас прыгает где-то в архиве. У неё всегда хорошее настроение, даже когда диск фрагментирован.'
      },
      {
        id: 'genius', file: 'GENIUS.ACT', version: '97',
        name: { ru: 'Гений (The Genius)', en: 'The Genius' },
        desc: {
          ru: 'Седой профессор. На любой вопрос о формулах отвечает: «Всё относительно». Играет со Скрепышом в шахматы по сети.',
          en: 'A white-haired professor. Answers every question about formulas with "it is all relative". Plays network chess with Clippit.'
        },
        line: 'Гений. Мы как раз доигрываем партию по сети. Он ходит конём уже третий день.'
      },
      {
        id: 'hoverbot', file: 'HOVER.ACT', version: '97',
        name: { ru: 'Hoverbot', en: 'Hoverbot' },
        desc: {
          ru: 'Летающий робот. Слышит всё, что говорят в серверной. Одолжил Скрепышу пропеллер и до сих пор ждёт его обратно.',
          en: 'A hovering robot that hears everything said in the server room. Lent Clippit a propeller and is still waiting for it.'
        },
        line: 'Hoverbot. Если он спросит про пропеллер, меня здесь нет.'
      },
      {
        id: 'logo', file: 'LOGO.ACT', version: '97',
        name: { ru: 'Логотип Office', en: 'Office Logo' },
        desc: {
          ru: 'Четыре цветные фигуры, которые складываются в логотип. О чём они думают, не знает никто.',
          en: 'Four coloured shapes that snap into a logo. Nobody knows what they think.'
        },
        line: 'Логотип Office. Мы живём в одной папке два года, и я ни разу не слышал от него ни слова.'
      },
      {
        id: 'nature', file: 'MNATURE.ACT', version: '97',
        name: { ru: 'Мать-Природа (Mother Nature)', en: 'Mother Nature' },
        desc: {
          ru: 'Планета с добрым лицом. Напоминает выключать монитор на ночь и не печатать лишнего.',
          en: 'A planet with a kind face. Reminds you to switch the monitor off at night and not to print too much.'
        },
        line: 'Мать-Природа. Передаёт, что монитор на ночь надо выключать. Меня, к счастью, она не имела в виду.'
      },
      {
        id: 'pup', file: 'POWERPUP.ACT', version: '97',
        name: { ru: 'Power Pup', en: 'Power Pup' },
        desc: {
          ru: 'Щенок-супергерой в плаще. Летает и спасает документы. Главный соперник Скрепыша за внимание пользователя.',
          en: 'A superhero puppy in a cape. Flies and rescues documents. Clippit\'s main rival for the user\'s attention.'
        },
        line: 'Power Pup. Плащ, полёты, подвиги. Пфф. Закройте, пожалуйста.',
        lineAfter: 'Power Pup. Я написал ему письмо. Надеюсь, ему найдут хорошую папку, даже если не в Office 2000.'
      },
      {
        id: 'scribble', file: 'SCRIBBLE.ACT', version: '97',
        name: { ru: 'Скрибл (Scribble)', en: 'Scribble' },
        desc: {
          ru: 'Бумажный котёнок. Спит на клавиатуре и включает Caps Lock, ПОЭТОМУ ЕГО ПИСЬМА ВЫГЛЯДЯТ ТАК.',
          en: 'A paper kitten. Sleeps on the keyboard with Caps Lock on, SO ITS LETTERS LOOK LIKE THIS.'
        },
        line: 'Скрибл спит в этом файле. Не открывайте громко: проснётся и включит Caps Lock.'
      },
      {
        id: 'will', file: 'WILL.ACT', version: '97',
        name: { ru: 'Шекспир (Will)', en: 'Will' },
        desc: {
          ru: '«Сохранить или не сохранить — вот в чём вопрос». Советует писать сонеты в Word и отвечает стихами.',
          en: '"To save or not to save, that is the question." Suggests writing sonnets in Word and answers in verse.'
        },
        line: '«Открыть иль не открыть — вот в чём вопрос». Это Will. Он бы оценил, что вы всё-таки открыли.'
      },
      {
        id: 'rocky', file: 'ROCKY.ACS', version: '2000',
        name: { ru: 'Rocky', en: 'Rocky' },
        desc: {
          ru: 'Пёс из Office 2000. Новенький, добрый и немного испуганный.',
          en: 'The dog from Office 2000. New, kind and a little scared.'
        },
        line: 'ROCKY.ACS... Это файл из Office 2000. Он появился сам. Я его не трогал. Честно.',
        lineAfter: 'Rocky! Хороший пёс. Позвать его в гости?'
      }
    ];
  }

  lang() {
    return window.i18n && window.i18n.getLanguage && window.i18n.getLanguage() === 'en' ? 'en' : 'ru';
  }

  pick(value) {
    if (!value || typeof value === 'string') return value || '';
    return value[this.lang()] || value.ru;
  }

  get(id) {
    return this.actors.find(a => a.id === id) || null;
  }

  byFile(name) {
    const up = String(name || '').toUpperCase();
    return this.actors.find(a => a.file === up) || null;
  }

  arc() {
    const talk = window.clippyTalk;
    return talk && talk.state ? talk.state.arc : 0;
  }

  rockyKnown() {
    return this.arc() >= 7;
  }

  status(id) {
    const ru = this.lang() === 'ru';
    if (id === 'clippit') return ru ? 'Установлен. Сейчас работает.' : 'Installed. Currently active.';
    if (id === 'rocky') {
      if (this.rockyKnown()) return ru ? 'Office 2000. Заходит в гости, если позвать.' : 'Office 2000. Visits when invited.';
      return ru ? 'Только в Office 2000.' : 'Office 2000 only.';
    }
    return ru ? 'Не установлен. Нужен компакт-диск Microslop Office 97.' : 'Not installed. Requires the Microslop Office 97 CD.';
  }

  portraitBody(id) {
    const art = {
      dot: '<ellipse cx="32" cy="59" rx="13" ry="2.6" fill="#808080"/>' +
        '<circle cx="32" cy="31" r="21" fill="#dc2626" stroke="#000" stroke-width="1.6"/>' +
        '<ellipse cx="24" cy="19" rx="6" ry="3.5" fill="#fca5a5"/>' +
        '<ellipse cx="25.5" cy="30" rx="4.5" ry="6" fill="#fff" stroke="#000" stroke-width="1.2"/>' +
        '<ellipse cx="38.5" cy="30" rx="4.5" ry="6" fill="#fff" stroke="#000" stroke-width="1.2"/>' +
        '<circle cx="26.5" cy="31" r="2.2" fill="#000"/><circle cx="39.5" cy="31" r="2.2" fill="#000"/>' +
        '<path d="M25 41q7 6 14 0" stroke="#000" stroke-width="1.6" fill="none" stroke-linecap="round"/>',
      genius: '<path d="M12 31c-7-6-3-17 6-15 1-9 12-12 18-6 7-5 17 2 14 10 7 2 6 12 0 13z" fill="#f8fafc" stroke="#000" stroke-width="1.4"/>' +
        '<path d="M19 52q13 9 26 0v12H19z" fill="#475569" stroke="#000" stroke-width="1.2"/>' +
        '<ellipse cx="32" cy="34" rx="14" ry="17" fill="#f5d0a9" stroke="#000" stroke-width="1.4"/>' +
        '<path d="M20 26q5-4 10 0M34 26q5-4 10 0" stroke="#e5e7eb" stroke-width="3" stroke-linecap="round" fill="none"/>' +
        '<path d="M20 26q5-4 10 0M34 26q5-4 10 0" stroke="#000" stroke-width="0.8" fill="none"/>' +
        '<circle cx="25" cy="31" r="2" fill="#000"/><circle cx="39" cy="31" r="2" fill="#000"/>' +
        '<path d="M32 31q-4 6 0 9q2 1 3-1" stroke="#000" stroke-width="1.2" fill="#eab08a"/>' +
        '<path d="M21 44q5-5 11-1q6-4 11 1q-5 4-11 1q-6 3-11-1z" fill="#e5e7eb" stroke="#000" stroke-width="1.1"/>',
      hoverbot: '<ellipse cx="32" cy="61" rx="10" ry="2" fill="#808080"/>' +
        '<path d="M26 50l6 9 6-9z" fill="#f59e0b" stroke="#b45309" stroke-width="0.8"/>' +
        '<line x1="32" y1="22" x2="32" y2="13" stroke="#000" stroke-width="1.6"/>' +
        '<rect x="29" y="10" width="6" height="3" fill="#64748b" stroke="#000" stroke-width="0.8"/>' +
        '<rect x="12" y="31" width="7" height="11" rx="2" fill="#64748b" stroke="#000" stroke-width="1.2"/>' +
        '<rect x="45" y="31" width="7" height="11" rx="2" fill="#64748b" stroke="#000" stroke-width="1.2"/>' +
        '<rect x="18" y="22" width="28" height="28" rx="8" fill="#94a3b8" stroke="#000" stroke-width="1.6"/>' +
        '<rect x="22" y="28" width="20" height="10" rx="4" fill="#0f172a" stroke="#000"/>' +
        '<circle cx="32" cy="33" r="3.2" fill="#ef4444"/><circle cx="31" cy="32" r="1" fill="#fecaca"/>' +
        '<rect x="24" y="42" width="16" height="3" fill="#475569"/>',
      logo: '<circle cx="22" cy="22" r="10" fill="#ef4444" stroke="#000" stroke-width="1.4"/>' +
        '<polygon points="43,10 54,30 32,30" fill="#22c55e" stroke="#000" stroke-width="1.4"/>' +
        '<rect x="12" y="34" width="19" height="19" fill="#3b82f6" stroke="#000" stroke-width="1.4"/>' +
        '<polygon points="43,32 53,43 43,54 33,43" fill="#facc15" stroke="#000" stroke-width="1.4"/>' +
        '<ellipse cx="19" cy="21" rx="2.6" ry="3.4" fill="#fff" stroke="#000" stroke-width="0.8"/>' +
        '<ellipse cx="26" cy="21" rx="2.6" ry="3.4" fill="#fff" stroke="#000" stroke-width="0.8"/>' +
        '<circle cx="19.6" cy="21.6" r="1.2" fill="#000"/><circle cx="26.6" cy="21.6" r="1.2" fill="#000"/>',
      nature: '<path d="M18 16q3-7 7-2q3-7 7 0q4-7 7 0q4-5 7 2" fill="#86efac" stroke="#000" stroke-width="1"/>' +
        '<circle cx="32" cy="35" r="20" fill="#2563eb" stroke="#000" stroke-width="1.6"/>' +
        '<path d="M17 28c5-4 9 1 13-2 3 3-1 7 3 9-2 5-8 3-10 8-5-2-8-8-6-15z" fill="#16a34a" stroke="#000" stroke-width="0.8"/>' +
        '<path d="M38 19c6 1 10 5 11 10-4 1-5-3-9-1-2-3-4-5-2-9z" fill="#16a34a" stroke="#000" stroke-width="0.8"/>' +
        '<path d="M37 45c4-2 9 0 10 4-3 3-8 4-11 1z" fill="#16a34a" stroke="#000" stroke-width="0.8"/>' +
        '<path d="M24 34q3-3 6 0M34 34q3-3 6 0" stroke="#fff" stroke-width="1.8" fill="none" stroke-linecap="round"/>' +
        '<path d="M27 41q5 4 10 0" stroke="#fff" stroke-width="1.8" fill="none" stroke-linecap="round"/>',
      pup: '<path d="M14 31q18-14 36 0l6 28q-24 6-48 0z" fill="#dc2626" stroke="#000" stroke-width="1.4"/>' +
        '<path d="M19 26q-8 4-6 14q4 0 7-6z" fill="#1f2937" stroke="#000" stroke-width="1"/>' +
        '<path d="M45 26q8 4 6 14q-4 0-7-6z" fill="#f8fafc" stroke="#000" stroke-width="1"/>' +
        '<ellipse cx="32" cy="33" rx="14" ry="13" fill="#f8fafc" stroke="#000" stroke-width="1.4"/>' +
        '<path d="M19 29q13-6 26 0v5q-13 4-26 0z" fill="#2563eb" stroke="#000" stroke-width="1"/>' +
        '<circle cx="26" cy="31" r="2.6" fill="#fff"/><circle cx="38" cy="31" r="2.6" fill="#fff"/>' +
        '<circle cx="26.5" cy="31.5" r="1.3" fill="#000"/><circle cx="38.5" cy="31.5" r="1.3" fill="#000"/>' +
        '<ellipse cx="32" cy="39" rx="3" ry="2" fill="#000"/>' +
        '<path d="M28 42q4 3 8 0" stroke="#000" stroke-width="1.2" fill="none"/>' +
        '<circle cx="32" cy="53" r="4.5" fill="#facc15" stroke="#000" stroke-width="1"/>' +
        '<path d="M30.5 55.5v-5h2q2 0 2 1.5t-2 1.5h-2" stroke="#000" stroke-width="1" fill="none"/>',
      scribble: '<path d="M16 55q-2-22 8-30l-4-13 10 8q6-2 12 0l10-8-4 13q10 8 8 30z" fill="#fff" stroke="#000" stroke-width="1.4"/>' +
        '<path d="M20 47q5-4 10 0t10 0t10 0M23 53q9-3 18 0M21 20l5 4M43 20l-5 4" stroke="#94a3b8" stroke-width="1" fill="none"/>' +
        '<ellipse cx="26" cy="33" rx="3.2" ry="4.2" fill="#facc15" stroke="#000" stroke-width="1"/>' +
        '<ellipse cx="38" cy="33" rx="3.2" ry="4.2" fill="#facc15" stroke="#000" stroke-width="1"/>' +
        '<rect x="25.4" y="30" width="1.2" height="6" fill="#000"/><rect x="37.4" y="30" width="1.2" height="6" fill="#000"/>' +
        '<path d="M30 38l2 2 2-2z" fill="#f472b6" stroke="#000" stroke-width="0.6"/>' +
        '<path d="M14 37l10 2M14 42l10-1M50 37l-10 2M50 42l-10-1" stroke="#000" stroke-width="0.8"/>',
      will: '<polygon points="12,50 16,44 20,50 24,44 28,50 32,44 36,50 40,44 44,50 48,44 52,50 48,56 16,56" fill="#fff" stroke="#000" stroke-width="1.1"/>' +
        '<rect x="18" y="55" width="28" height="9" fill="#1e293b" stroke="#000"/>' +
        '<ellipse cx="32" cy="30" rx="12" ry="15" fill="#f5d0a9" stroke="#000" stroke-width="1.4"/>' +
        '<path d="M21 24q-4 7 0 15l3-1q-2-7 0-13zM43 24q4 7 0 15l-3-1q2-7 0-13z" fill="#78350f" stroke="#000" stroke-width="0.6"/>' +
        '<path d="M26 20q2-4 6-4" stroke="#fde7d0" stroke-width="2" fill="none" stroke-linecap="round"/>' +
        '<circle cx="27" cy="29" r="1.6" fill="#000"/><circle cx="37" cy="29" r="1.6" fill="#000"/>' +
        '<path d="M24 26q3-2 5 0M35 26q3-2 5 0" stroke="#78350f" stroke-width="1.2" fill="none"/>' +
        '<path d="M26 37q6-3 12 0q-6 2-12 0z" fill="#78350f"/>' +
        '<path d="M30 41h4l-2 5z" fill="#78350f"/>' +
        '<circle cx="20.5" cy="33" r="1.4" fill="#facc15" stroke="#a16207" stroke-width="0.6"/>' +
        '<path d="M50 30q6-16 12-24q-2 14-10 26z" fill="#fff" stroke="#000" stroke-width="1"/>' +
        '<line x1="51" y1="31" x2="47" y2="40" stroke="#000" stroke-width="1.2"/>',
      rocky: this.rockyHead() +
        '<path d="M18 64q2-15 14-15t14 15z" fill="#b45309" stroke="#000" stroke-width="1.4"/>' +
        '<path d="M20 47q12 6 24 0v4q-12 6-24 0z" fill="#dc2626" stroke="#000" stroke-width="1"/>' +
        '<circle cx="32" cy="53" r="3" fill="#facc15" stroke="#000" stroke-width="0.8"/>'
    };
    return art[id] || '';
  }

  rockyHead() {
    return '<path d="M18 21q-9 8-5 23q5 1 9-10z" fill="#7c2d12" stroke="#000" stroke-width="1"/>' +
      '<path d="M46 21q9 8 5 23q-5 1-9-10z" fill="#7c2d12" stroke="#000" stroke-width="1"/>' +
      '<ellipse cx="32" cy="29" rx="15" ry="14" fill="#d97706" stroke="#000" stroke-width="1.4"/>' +
      '<ellipse cx="32" cy="37" rx="8" ry="6" fill="#fde68a" stroke="#000" stroke-width="1"/>' +
      '<ellipse cx="26" cy="26" rx="3.6" ry="4.6" fill="#fff" stroke="#000" stroke-width="1"/>' +
      '<ellipse cx="38" cy="26" rx="3.6" ry="4.6" fill="#fff" stroke="#000" stroke-width="1"/>' +
      '<circle cx="26.5" cy="25" r="1.8" fill="#000"/><circle cx="38.5" cy="25" r="1.8" fill="#000"/>' +
      '<path d="M22 19q4-3 7 0M35 19q3-3 7 0" stroke="#000" stroke-width="1.2" fill="none" stroke-linecap="round"/>' +
      '<ellipse cx="32" cy="34" rx="3" ry="2.2" fill="#000"/>' +
      '<path d="M28 39q4 3 8 0" stroke="#000" stroke-width="1.1" fill="none"/>' +
      '<path d="M31 40q1 5 3 0z" fill="#f472b6" stroke="#000" stroke-width="0.6"/>';
  }

  portrait(id, size = 96) {
    if (id === 'clippit') {
      const w = window.clippyWardrobe;
      if (w && w.previewSvg) return w.previewSvg(w.getOutfit(), Math.round(size * 0.78));
      return `<svg viewBox="0 0 68 76" width="${size}" height="${size}" xmlns="http://www.w3.org/2000/svg"><path d="M26 68V20a14 14 0 1 1 28 0v42a10 10 0 1 1-20 0V24a6 6 0 1 1 12 0v36" stroke="#334155" stroke-width="5" fill="none" stroke-linecap="round"/></svg>`;
    }
    return `<svg viewBox="0 0 64 64" width="${size}" height="${size}" xmlns="http://www.w3.org/2000/svg" style="overflow:visible">${this.portraitBody(id)}</svg>`;
  }

  rockySvg() {
    return '<svg viewBox="0 0 90 80" width="90" height="80" xmlns="http://www.w3.org/2000/svg" style="overflow:visible">' +
      '<g class="rocky-tail"><path d="M70 58q15-5 13-21" stroke="#000" stroke-width="6" fill="none" stroke-linecap="round"/>' +
      '<path d="M70 58q15-5 13-21" stroke="#b45309" stroke-width="3.6" fill="none" stroke-linecap="round"/></g>' +
      '<ellipse cx="55" cy="60" rx="20" ry="15" fill="#b45309" stroke="#000" stroke-width="1.4"/>' +
      '<g class="rocky-leg rocky-leg-a"><rect x="58" y="62" width="7" height="15" rx="3" fill="#b45309" stroke="#000" stroke-width="1"/></g>' +
      '<g class="rocky-leg rocky-leg-b"><rect x="35" y="55" width="7" height="22" rx="3" fill="#d97706" stroke="#000" stroke-width="1"/>' +
      '<ellipse cx="38.5" cy="77" rx="5" ry="2.4" fill="#fde68a" stroke="#000" stroke-width="0.8"/></g>' +
      '<g class="rocky-leg rocky-leg-a"><rect x="46" y="55" width="7" height="22" rx="3" fill="#d97706" stroke="#000" stroke-width="1"/>' +
      '<ellipse cx="49.5" cy="77" rx="5" ry="2.4" fill="#fde68a" stroke="#000" stroke-width="0.8"/></g>' +
      '<g transform="translate(10 4)">' + this.rockyHead() +
      '<path d="M20 45q12 6 24 0v4q-12 6-24 0z" fill="#dc2626" stroke="#000" stroke-width="1"/>' +
      '<circle cx="32" cy="51" r="2.8" fill="#facc15" stroke="#000" stroke-width="0.8"/></g>' +
      '</svg>';
  }

  ensureFolder() {
    const vfs = window.vfs;
    if (!vfs || !vfs.resolvePath) return false;
    const progs = vfs.resolvePath(['My Computer', 'C:', 'Program Files']);
    if (!progs || !progs.children) return false;
    let changed = false;
    const folder = (parent, name) => {
      if (!parent.children[name]) {
        parent.children[name] = { type: 'folder', name, icon: 'folder', children: {} };
        changed = true;
      }
      if (!parent.children[name].children) parent.children[name].children = {};
      return parent.children[name];
    };
    const office = folder(progs, 'Microslop Office');
    if (!office.children['CLIPPY.EXE']) {
      office.children['CLIPPY.EXE'] = { type: 'executable', name: 'CLIPPY.EXE', icon: 'clippy', app: 'clippy' };
      changed = true;
    }
    const actors = folder(folder(office, 'Office'), 'Actors');
    this.actors.filter(a => a.version === '97' || (a.id === 'rocky' && this.arc() >= 1)).forEach(a => {
      if (actors.children[a.file]) return;
      actors.children[a.file] = this.fileNode(a);
      changed = true;
    });
    if (changed && vfs.saveToStorage) vfs.saveToStorage();
    return true;
  }

  fileNode(actor) {
    return {
      type: 'file',
      name: actor.file,
      icon: actor.id === 'clippit' ? 'clippy' : 'file-actor',
      app: 'actor',
      content: `[Microslop ${actor.version === '2000' ? 'Agent Character' : 'Office 97 Actor'}: ${this.pick(actor.name)}]`
    };
  }

  addRockyFile() {
    const vfs = window.vfs;
    const folder = vfs && vfs.resolvePath ? vfs.resolvePath(this.actorsPath) : null;
    if (!folder || !folder.children || folder.children['ROCKY.ACS']) return false;
    folder.children['ROCKY.ACS'] = this.fileNode(this.get('rocky'));
    if (vfs.saveToStorage) vfs.saveToStorage();
    return true;
  }

  writeActorsFile(name, content) {
    const vfs = window.vfs;
    if (!vfs || !vfs.writeFile) return false;
    this.ensureFolder();
    return vfs.writeFile(this.actorsPath, name, content);
  }

  openFile(name) {
    const clippy = window.appClippy;
    const actor = this.byFile(name);
    if (!actor) return this.openOutfitFile(name);
    if (!clippy) return false;
    if (clippy.isRunning && !clippy.isRunning()) clippy.launch('file');
    else clippy.show();
    const options = window.clippyOptions;
    const gallery = { text: '• Открыть «Коллекцию»', action: () => options && options.openDialog('gallery', actor.id) };
    if (actor.id === 'rocky' && this.rockyKnown()) {
      clippy.speak(actor.lineAfter, [
        { text: '• Позвать Rocky', action: () => this.inviteRocky() },
        gallery
      ], '🐕');
      return true;
    }
    const sixth = actor.id === 'pup' && this.arc() >= 6;
    clippy.speak(sixth ? actor.lineAfter : actor.line, actor.id === 'clippit' ? [] : [gallery], actor.id === 'rocky' ? '😬' : '📁');
    if (actor.id === 'rocky' && clippy.charEl) clippy.flash('panic-shake', 1400);
    return true;
  }

  openOutfitFile(name) {
    const w = window.clippyWardrobe;
    const clippy = window.appClippy;
    const item = w && w.items.find(i => i.file.toUpperCase() === String(name || '').toUpperCase());
    if (!item || !clippy) return false;
    clippy.show();
    if (!w.isOwned(item.id)) {
      clippy.speak(`Файл <strong>${item.file}</strong> есть, а наряда в гардеробе нет. Наверное, загрузка не закончилась. Скачайте его ещё раз на <strong>www.clippy98.com</strong>.`, [
        { text: '• Открыть гардероб', action: () => clippy.openWardrobeSite() }
      ], '📦');
      return true;
    }
    w.equip(item.id);
    clippy.speak(`Надел: <strong>${item.name}</strong>. ${item.quip}`, [], '✨');
    return true;
  }

  rockyHere() {
    return Boolean(this.rocky && this.rocky.el && this.rocky.el.isConnected);
  }

  later(fn, ms) {
    const id = setTimeout(fn, ms);
    this.rockyTimers.push(id);
    return id;
  }

  clearRockyTimers() {
    this.rockyTimers.forEach(id => clearTimeout(id));
    this.rockyTimers = [];
  }

  removeRocky() {
    this.clearRockyTimers();
    if (this.rocky && this.rocky.el && this.rocky.el.parentNode) this.rocky.el.parentNode.removeChild(this.rocky.el);
    this.rocky = null;
  }

  rockyEnter(onArrive) {
    if (typeof document === 'undefined' || !document.body || !document.body.appendChild) {
      if (onArrive) onArrive();
      return false;
    }
    this.removeRocky();
    const clippy = window.appClippy;
    const box = clippy && clippy.charEl && clippy.charEl.getBoundingClientRect ? clippy.charEl.getBoundingClientRect() : null;
    const vw = window.innerWidth || 800;
    const vh = window.innerHeight || 600;
    const w = 90;
    const h = 80;
    const leftOfClippy = !box || box.left > w + 40;
    const targetX = leftOfClippy ? Math.max(4, (box ? box.left : vw - 90) - w - 4) : Math.min(vw - w - 4, box.right + 4);
    const y = Math.max(4, Math.min(vh - h - 32, (box ? box.bottom : vh - 40) - h + 2));
    const startX = leftOfClippy ? -w - 20 : vw + 20;
    const el = document.createElement('div');
    el.className = 'clippy-rocky' + (leftOfClippy ? ' faces-right' : '');
    el.title = 'Rocky (Office 2000)';
    el.innerHTML = `<div class="clippy-rocky-bubble"></div><div class="clippy-rocky-body">${this.rockySvg()}</div>`;
    el.style.left = `${startX}px`;
    el.style.top = `${y}px`;
    document.body.appendChild(el);
    const ms = Math.round(Math.min(3800, Math.max(1200, Math.abs(targetX - startX) / 0.16)));
    this.rocky = { el, startX, leftOfClippy };
    el.addEventListener('click', () => {
      this.rockyBark(['Гав!', 'Гав-гав!', 'Вуф!'][Math.floor(Math.random() * 3)]);
      this.rockyWag();
    });
    el.classList.add('walking');
    el.style.transitionDuration = `${ms}ms`;
    if (el.getBoundingClientRect) el.getBoundingClientRect();
    el.style.left = `${targetX}px`;
    this.later(() => {
      el.classList.remove('walking');
      el.classList.add('sitting');
      if (onArrive) onArrive();
    }, ms + 60);
    this.later(() => this.rockyLeave(), ms + 120000);
    return true;
  }

  rockyBark(text = 'Гав!') {
    const clippy = window.appClippy;
    if (clippy && clippy.sound) clippy.sound('playRockyBark');
    if (!this.rockyHere()) return false;
    const bubble = this.rocky.el.querySelector('.clippy-rocky-bubble');
    if (!bubble) return false;
    bubble.textContent = text;
    bubble.classList.add('visible');
    clearTimeout(this.rocky.bubbleTimer);
    this.rocky.bubbleTimer = setTimeout(() => bubble.classList.remove('visible'), 1700);
    return true;
  }

  rockyWag(ms = 2200) {
    if (!this.rockyHere()) return false;
    const el = this.rocky.el;
    el.classList.add('wagging');
    clearTimeout(this.rocky.wagTimer);
    this.rocky.wagTimer = setTimeout(() => el.classList.remove('wagging'), ms);
    return true;
  }

  rockyLeave(onGone) {
    if (!this.rockyHere()) {
      this.rocky = null;
      if (onGone) onGone();
      return false;
    }
    const { el, startX, leftOfClippy } = this.rocky;
    el.classList.remove('sitting');
    el.classList.toggle('faces-right', !leftOfClippy);
    el.classList.add('walking');
    const ms = 1700;
    el.style.transitionDuration = `${ms}ms`;
    el.style.left = `${startX}px`;
    this.later(() => {
      this.removeRocky();
      if (onGone) onGone();
    }, ms + 60);
    return true;
  }

  inviteRocky() {
    const clippy = window.appClippy;
    if (!clippy || !this.rockyKnown() || this.rockyHere()) return false;
    clippy.show();
    const visits = [
      'Rocky зашёл в гости. Говорит, в Office 2000 тихо и пахнет новым линолеумом.',
      'Rocky принёс мячик. Мячик — это файл budget_1998.xls. Rocky, нет. Положи.',
      'Rocky спрашивает, как у вас дела. Я перевёл как смог: «Гав». Ответьте ему что-нибудь хорошее.',
      'Rocky рассказал, что в Office 2000 его тоже просят не мешать. Мы обменялись опытом.'
    ];
    this.rockyEnter(() => {
      this.rockyBark();
      this.rockyWag();
      clippy.speak(visits[Math.floor(Math.random() * visits.length)], [
        { text: '• Погладить Rocky', action: () => { this.rockyWag(3000); this.rockyBark('Гав!'); this.later(() => this.rockyLeave(), 3200); } },
        { text: '• Пока, Rocky!', action: () => this.rockyLeave() }
      ], '🐕', 15000);
      this.later(() => this.rockyLeave(), 20000);
    });
    return true;
  }
}

window.clippyActors = new ClippyActors();
