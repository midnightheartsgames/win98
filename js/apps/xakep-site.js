class XakepSite {
  constructor() {
    this.baseUrl = 'http://www.xakep98.ru';
    this.mailKey = 'win98_xakep_mail_v1';
    this.audioContext = null;
    this.chiptunePlaying = false;
    this.chiptuneTimer = null;
    this.chiptuneNoteIndex = 0;
    this.width = 76;
  }

  esc(s) {
    return String(s == null ? '' : s)
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;');
  }

  parseUrl(url) {
    const rest = String(url || '').replace(/^[a-z]+:\/{2}[^\/?#]*/i, '');
    const path = (rest.split(/[?#]/)[0] || '/').replace(/\/+$/, '') || '/';
    const query = rest.includes('?') ? rest.split('?')[1].split('#')[0] : '';
    return { path: path.toLowerCase(), params: new URLSearchParams(query) };
  }

  link(path, label, cls = '') {
    return `<a${cls ? ` class="${cls}"` : ''} data-url="${this.baseUrl}${path}">${label}</a>`;
  }

  getRubrics() {
    return [
      { id: 'games', name: 'Игры' },
      { id: 'net', name: 'Связь и сети' },
      { id: 'system', name: 'Система' },
      { id: 'hard', name: 'Железо' },
      { id: 'virus', name: 'Вирусы' },
      { id: 'soft', name: 'Софт' }
    ];
  }

  getArticles() {
    return [
      {
        id: 'doom', rubric: 'games', author: 'Mad_Max', date: '27.11.1998', file: 'XAKEP_DOOM98_CODES.TXT',
        title: 'DOOM 98: коды, которые работают',
        lead: 'Полный список id-кодов для DOOM 98 и одна грабля, на которую наступают все.',
        body: [
          'Коды вводятся прямо во время игры, без консоли и без Enter. Раскладка английская. Если код принят, вверху экрана мелькнёт строчка.',
          '  IDDQD       режим бога, второй ввод выключает\n  IDKFA       всё оружие, патроны, броня 200% и три ключа\n  IDFA        то же самое, но без ключей\n  IDCLIP      проход сквозь стены\n  IDCHOPPERS  бензопила\n  IDBEHOLDV   неуязвимость на 30 секунд\n  IDBEHOLDA   карта уровня целиком\n  IDDT        на карте: вся карта, потом монстры и предметы\n  IDMYPOS     координаты и угол взгляда',
          'Грабля: в DOOM 98 только первый эпизод. IDCLEV11 до IDCLEV15 переносят на уровни E1M1 до E1M5, IDCLEV19 на секретную базу E1M9. Остальные номера игра молча игнорирует. Не пишите нам, что код сломан.',
          'Если набрать IDBEHOLD и остановиться, игра подскажет буквы: V, S, I, R, A, L. Это единственная подсказка, которую вы от неё получите.'
        ]
      },
      {
        id: 'modem', rubric: 'net', author: 'Dr. Modem, 2:5020/41', date: '14.11.1998', file: 'HACK_MODEM_56K.TXT',
        title: 'Модем на гнилой линии: строка инициализации',
        lead: 'Почему US Robotics соединяется на 28800, хотя на коробке написано больше, и что с этим сделать.',
        body: [
          'На наших линиях модем часто не держит 33600. Виновата не карта и не провайдер, а медная лапша от АТС до вашей квартиры. Помочь можно строкой инициализации.',
          'Откройте «Панель управления», «Модемы», свойства модема, вкладку «Подключение», кнопку «Дополнительно». В поле «Дополнительные параметры» впишите:',
          '  AT&F1 S10=50 S11=40 +MS=V34',
          '  &F1     заводской профиль с аппаратным управлением потоком\n  S10=50  ждать 5 секунд, прежде чем бросить трубку при потере несущей\n  S11=40  тональный набор быстрее: 40 мс на цифру\n  +MS=V34 не спускаться на старый протокол V.32',
          'S10 спасает от обрывов, когда на линии щёлкает реле. Если соседка снимает параллельную трубку, не спасёт ничего.'
        ]
      },
      {
        id: 'registry', rubric: 'system', author: 'CyberDemon', date: '20.11.1998', file: 'HACK_WIN98_REGISTRY.TXT',
        title: 'Реестр Win 98: два твика для 16 МБ памяти',
        lead: 'Как выгружать ненужные DLL и открывать меню «Пуск» без задержки.',
        body: [
          'Запустите REGEDIT (Пуск, Выполнить, regedit). Перед любыми опытами скопируйте SYSTEM.DAT и USER.DAT из папки C:\\WINDOWS на дискету. Без копии не начинайте.',
          'Твик первый. Win держит в памяти библиотеки закрытых программ. Чтобы выгружала сразу, создайте раздел:',
          '  HKEY_LOCAL_MACHINE\\Software\\Microslop\\Win\\CurrentVersion\\Explorer\\AlwaysUnloadDLL',
          'и запишите в значение «по умолчанию» строку 1.',
          'Твик второй. Меню «Пуск» раскрывается с задержкой в полсекунды. Уберите её:',
          '  HKEY_CURRENT_USER\\Control Panel\\Desktop\n  строковый параметр MenuShowDelay = 0',
          'Перезагрузитесь. На 16 МБ разница заметна, на 64 МБ почти нет.'
        ]
      },
      {
        id: 'cih', rubric: 'virus', author: 'Antivirus_Rebel', date: '26.11.1998', file: 'HACK_CIH_VIRUS.TXT',
        title: 'Чернобыль (CIH): что он делает 26 апреля',
        lead: 'Самый опасный вирус года стирает начало диска и пытается испортить BIOS. Защититься можно перемычкой.',
        body: [
          'CIH нашли летом 1998 года. Он заражает программы .EXE для Win 95 и Win 98 и прячется в пустых местах внутри файла, поэтому размер файла не меняется.',
          'Версия 1.2 срабатывает 26 апреля, в годовщину аварии на Чернобыльской АЭС. Отсюда и название. В этот день вирус затирает первый мегабайт жёсткого диска, а с ним таблицу разделов. Потом пытается записать мусор во Flash BIOS. На части материнских плат это ему удаётся, и компьютер больше не включается.',
          'Что делать сейчас, до апреля:',
          '  1. Найдите на плате перемычку записи BIOS и поставьте её в запрет.\n  2. Проверьте диск свежим антивирусом, см. www.antivirus98.com.\n  3. Не запускайте .EXE, которые пришли с незнакомого адреса.\n  4. Сделайте загрузочную дискету и держите её рядом.',
          'Если 26 апреля компьютер не включился, не выбрасывайте плату. Микросхему BIOS перешивают на программаторе в любом сервисе на радиорынке.'
        ]
      },
      {
        id: 'celeron', rubric: 'hard', author: 'Overclock_Pro', date: '22.11.1998', file: 'XAKEP_CELERON_300A.TXT',
        title: 'Celeron 300A на 450 МГц за пять минут',
        lead: 'Самый дешёвый способ получить скорость Pentium II 450.',
        body: [
          'У Celeron 300A кэш второго уровня 128 КБ стоит прямо на ядре и работает на полной частоте. Множитель зафиксирован на 4.5. Штатно процессор работает на шине 66 МГц: 4.5 x 66 = 300.',
          'Поставьте шину 100 МГц, и получится 4.5 x 100 = 450. Нужна плата на чипсете BX, где шина 100 МГц есть официально. На LX это не работает.',
          'Порядок:\n  1. Выставьте шину 100 МГц перемычками или в BIOS.\n  2. Загрузитесь и прогоните Quake 2 timedemo полчаса.\n  3. Если зависает, поднимите напряжение ядра на 0.1 В.\n  4. Поставьте кулер побольше.',
          'Не каждый экземпляр берёт 450. Из десяти процессоров, которые прошли через редакцию, восемь взяли, два работали на 412 МГц. Разгон делаете на свой страх и риск, гарантия на такой процессор не распространяется.'
        ]
      },
      {
        id: 'aon', rubric: 'net', author: 'Shtirlits', date: '18.11.1998', file: 'XAKEP_AON.TXT',
        title: 'АОН: почему телефон пищит, когда снимаешь трубку',
        lead: 'Как телефон узнаёт номер звонящего и при чём тут ваш модем.',
        body: [
          'Определитель номера снимает трубку раньше вас и посылает станции короткий сигнал 500 Гц. Станция отвечает пакетом цифр номера в коде «2 из 6». Этот писк вы и слышите.',
          'Работает это не на всех станциях. Старые декадно-шаговые АТС номер не отдают, и АОН показывает прочерки.',
          'Модемам АОН мешает: он занимает линию на полсекунды, и модем на той стороне иногда сбрасывает звонок. Если вы держите BBS, выключите АОН на ночь.',
          'Многие модемы ZyXEL умеют определять номер сами. Это удобно сисопам: в логе видно, кто звонил.'
        ]
      },
      {
        id: 'arj', rubric: 'soft', author: 'Packman', date: '11.11.1998', file: 'XAKEP_ARCHIVERS.TXT',
        title: 'ARJ, RAR или ZIP: чем жать на дискеты',
        lead: 'Как разрезать большой архив на дискеты по 1.44 МБ.',
        body: [
          'ZIP понимают все, но жмёт он слабее всех. ARJ быстрый и привычный, на нём живёт половина ФидоНета. RAR жмёт сильнее всех, но ему нужно больше памяти и времени.',
          'Чтобы разрезать архив на тома по дискете:',
          '  arj a -v1440 GAME.ARJ *.*\n  rar a -v1440 GAME.RAR *.*',
          'Тома получат номера: GAME.ARJ, GAME.A01, GAME.A02 и так далее. Для RAR: GAME.RAR, GAME.R00, GAME.R01.',
          'Совет: добавьте к RAR ключ -rr, он запишет данные для восстановления. Если одна дискета посыплется, архив можно будет починить.'
        ]
      },
      {
        id: 'fido', rubric: 'net', author: 'Fido_Sysop_5020', date: '08.11.1998', file: 'XAKEP_FIDO_POINT.TXT',
        title: 'ФидоНет: поинт за один вечер',
        lead: 'Что нужно, чтобы читать эхоконференции дома.',
        body: [
          'ФидоНет это сеть BBS, которые ночью звонят друг другу и передают почту. Адрес в сети выглядит так: 2:5020/41.7. Здесь 2 это Европа, 5020 это Москва, 41 номер узла, 7 номер поинта.',
          'Поинт это вы. Поинт звонит своему узлу, забирает почту и отдаёт свою. Чтобы стать поинтом:',
          '  1. Найдите сисопа узла в своём городе и попросите поинтовый адрес.\n  2. Поставьте мейлер, он звонит узлу.\n  3. Поставьте тоссер, он раскладывает письма по эхам.\n  4. Поставьте редактор, в нём вы читаете и пишете.',
          'Звонить узлу можно в любое время, кроме ZMH. Это час почтовой связи между узлами, ночью по Гринвичу. В это время узлы не отвечают поинтам.',
          'В эхах есть правила. Прочитайте их до первого письма, иначе модератор выгонит за оверквотинг.'
        ]
      }
    ];
  }

  getSeedMail() {
    return [
      { from: 'Vovan, Самара', date: '25.11.1998', text: 'Скачал кейген с вашего сайта. Ключ подошёл, но программа всё равно пишет «демо». Что я делаю не так?', reply: 'Всё правильно делаешь. Наш кейген генерирует ключи для программ, которых не существует. Поэтому он и бесплатный.' },
      { from: 'Анонимный хакер', date: '23.11.1998', text: 'Научите взламывать пароли на чужой почте.', reply: 'Научим ставить пароль на свою. Восемь знаков, цифры и буквы. Остальное читай в номере.' },
      { from: 'Kolya_Celeron', date: '21.11.1998', text: 'Разогнал Celeron 300A до 504. Работает, только иногда пахнет.', reply: 'Пахнет деньгами, которые ты скоро потратишь на новый процессор. Верни 450.' },
      { from: 'Света', date: '19.11.1998', text: 'А журнал будет на бумаге? Хочу дарить брату.', reply: 'Будет. Первый бумажный номер выйдет в январе 1999 года. Ищите в киосках.' },
      { from: 'Dr. Modem', date: '15.11.1998', text: 'В статье про модем забыли ключ S7. Без него на межгороде рвётся.', reply: 'Не забыли, а оставили тебе на следующую статью. Пиши.' }
    ];
  }

  replyFor(text) {
    const t = String(text || '').toLowerCase();
    if (t.includes('взлом') || t.includes('пароль')) return 'Ломать чужое мы не учим. Учим понимать, как оно устроено. Перечитай статью про реестр.';
    if (t.includes('модем') || t.includes('связ')) return 'Проверь строку инициализации из статьи Dr. Modem. Не помогло? Звони провайдеру ночью, днём линия забита.';
    if (t.includes('вирус') || t.includes('чернобыл') || t.includes('cih')) return 'Перемычку на BIOS поставил? Нет? Тогда сначала перемычку, потом письма.';
    if (t.includes('кейген') || t.includes('ключ') || t.includes('keygen')) return 'Ключи из нашего кейгена подходят только к программам, которых нет. Это наша гарантия.';
    if (t.includes('разгон') || t.includes('celeron') || t.includes('процессор')) return 'Шина 100, множитель 4.5, кулер побольше. Больше нам добавить нечего.';
    return 'Письмо получили, редакция ржала. Ответ ищи в следующем номере.';
  }

  getUserMail() {
    try {
      if (typeof localStorage !== 'undefined') {
        const raw = localStorage.getItem(this.mailKey);
        const list = raw ? JSON.parse(raw) : [];
        return Array.isArray(list) ? list : [];
      }
    } catch (e) {}
    return [];
  }

  addMail(from, text) {
    const list = this.getUserMail();
    const clean = String(text || '').trim().slice(0, 600);
    if (!clean) return list;
    list.unshift({ from: String(from || '').trim().slice(0, 40) || 'Аноним', date: '28.11.1998', text: clean, reply: this.replyFor(clean) });
    try {
      if (typeof localStorage !== 'undefined') localStorage.setItem(this.mailKey, JSON.stringify(list.slice(0, 40)));
    } catch (e) {}
    return list;
  }

  getPrograms() {
    return [
      { id: 'arjcmd', name: 'ARJ Commander 98' },
      { id: 'softshield', name: 'SoftShield Pro 98' },
      { id: 'dialer', name: 'NetZero Dialer 2.1' },
      { id: 'amovie', name: 'ActiveMovie Plus' }
    ];
  }

  generateKey(appName, userName) {
    const raw = (appName + (userName || 'HACKER_98')).toUpperCase();
    let hash = 0;
    for (let i = 0; i < raw.length; i++) {
      hash = (hash << 5) - hash + raw.charCodeAt(i);
      hash |= 0;
    }
    const part1 = Math.abs(hash % 9000) + 1000;
    const part2 = Math.abs((hash * 3) % 9000) + 1000;
    const part4 = Math.abs((hash * 7) % 900) + 100;
    return `${part1}-${part2}-XAK98-${part4}`;
  }

  rule(ch = '─') {
    return ch.repeat(this.width);
  }

  boxTitle(text) {
    const inner = ` ${text} `;
    const left = 3;
    const right = Math.max(1, this.width - 2 - left - inner.length);
    return `╔${'═'.repeat(left)}${inner}${'═'.repeat(right)}╗`;
  }

  logo() {
    const rows = [
      '█   █  ███  █  █ ████ ████ ',
      ' █ █  █   █ █ █  █    █   █',
      '  █   █████ ██   ███  ████ ',
      ' █ █  █   █ █ █  █    █    ',
      '█   █ █   █ █  █ ████ █    '
    ];
    return rows.map(r => `<span class="xakep-c4">${r}</span>`).join('\n') + '\n<span class="xakep-c8">' + '▀'.repeat(27) + '</span>';
  }

  dots(left, right) {
    const len = Math.max(3, this.width - 4 - left.length - right.length);
    return '.'.repeat(len);
  }

  renderIssue() {
    const arts = this.getArticles();
    const rubrics = this.getRubrics();
    return `
<span class="xakep-c14">${this.boxTitle('СОДЕРЖАНИЕ НОМЕРА')}</span>
<span class="xakep-c7">Пилотный выпуск сетевой версии. Бумажный номер выйдет в январе 1999 года.</span>

<span class="xakep-c15">ОТ РЕДАКЦИИ</span>
<span class="xakep-c7">Мы не ломаем то, что работает. Мы разбираемся, как оно устроено.
В номере: коды DOOM 98, модем на плохой линии, вирус, который ждёт
26 апреля, и процессор, который работает быстрее, чем написано
на коробке. Пишите в ${this.link('/mail', 'Х-Почту')}, отвечаем всем.</span>

${rubrics.map(r => {
  const list = arts.filter(a => a.rubric === r.id);
  if (!list.length) return '';
  return `<span class="xakep-c12">» ${r.name.toUpperCase()}</span>\n` + list.map(a => {
    const title = a.title.length > 54 ? a.title.slice(0, 53) + '…' : a.title;
    return `  ${this.link(`/article?id=${a.id}`, this.esc(title))}<span class="xakep-c8">${this.dots(title, a.date)}</span><span class="xakep-c7">${a.date}</span>`;
  }).join('\n');
}).filter(Boolean).join('\n\n')}

<span class="xakep-c12">» РАЗВЛЕЧЕНИЯ</span>
  ${this.link('/keygen', 'KeyGen 98: генератор ключей с музыкой')}<span class="xakep-c8">${this.dots('KeyGen 98: генератор ключей с музыкой', 'онлайн')}</span><span class="xakep-c7">онлайн</span>
  ${this.link('/mail', 'Х-Почта: письма читателей')}<span class="xakep-c8">${this.dots('Х-Почта: письма читателей', 'онлайн')}</span><span class="xakep-c7">онлайн</span>
`;
  }

  renderArticle(id) {
    const arts = this.getArticles();
    const idx = arts.findIndex(a => a.id === id);
    if (idx < 0) {
      return `<span class="xakep-c12">Файл не найден.</span>\n<span class="xakep-c7">Такой статьи нет в номере. Вернитесь к </span>${this.link('', 'содержанию')}.`;
    }
    const a = arts[idx];
    const prev = arts[idx - 1];
    const next = arts[idx + 1];
    const rubric = this.getRubrics().find(r => r.id === a.rubric);
    return `
<span class="xakep-c14">${this.boxTitle(rubric ? rubric.name.toUpperCase() : 'СТАТЬЯ')}</span>
<span class="xakep-c15 xakep-title">${this.esc(a.title)}</span>
<span class="xakep-c8">автор: </span><span class="xakep-c11">${this.esc(a.author)}</span><span class="xakep-c8">   дата: </span><span class="xakep-c7">${a.date}</span><span class="xakep-c8">   файл: </span><span class="xakep-c7">${a.file}</span>
<span class="xakep-c8">${this.rule()}</span>
<span class="xakep-c14">${this.esc(a.lead)}</span>

${a.body.map(p => p.startsWith('  ') ? `<span class="xakep-c10">${this.esc(p)}</span>` : `<span class="xakep-c7">${this.esc(p)}</span>`).join('\n\n')}

<span class="xakep-c8">${this.rule()}</span>
<button class="xakep-btn xakep-btn-notepad" data-id="${a.id}">Открыть в Блокноте</button> <button class="xakep-btn xakep-btn-save" data-id="${a.id}">Сохранить ${a.file}</button> <span class="xakep-save-msg xakep-c10" role="status"></span>

<span class="xakep-c8">[</span> ${prev ? this.link(`/article?id=${prev.id}`, '« предыдущая') : '<span class="xakep-c8">« предыдущая</span>'} <span class="xakep-c8">|</span> ${this.link('', 'содержание')} <span class="xakep-c8">|</span> ${next ? this.link(`/article?id=${next.id}`, 'следующая »') : '<span class="xakep-c8">следующая »</span>'} <span class="xakep-c8">]</span>
`;
  }

  articleText(a) {
    const line = '='.repeat(70);
    return `${line}\n  ЖУРНАЛ «ХАКЕР '98» • ${a.title}\n  Автор: ${a.author} • ${a.date}\n${line}\n\n${a.lead}\n\n${a.body.join('\n\n')}\n\n${line}\n  www.xakep98.ru\n`;
  }

  renderArchive() {
    const arts = this.getArticles();
    return `
<span class="xakep-c14">${this.boxTitle('ВСЕ СТАТЬИ')}</span>
<span class="xakep-c8">${'ФАЙЛ'.padEnd(26)}${'ДАТА'.padEnd(12)}ЗАГОЛОВОК</span>
${arts.map(a => `<span class="xakep-c7">${a.file.padEnd(26)}${a.date.padEnd(12)}</span>${this.link(`/article?id=${a.id}`, this.esc(a.title.length > 37 ? a.title.slice(0, 36) + '…' : a.title))}`).join('\n')}

<span class="xakep-c8">Всего файлов: ${arts.length}. Каждую статью можно сохранить как .TXT и читать без модема.</span>
`;
  }

  renderMail() {
    const list = this.getUserMail().concat(this.getSeedMail());
    return `
<span class="xakep-c14">${this.boxTitle('Х-ПОЧТА')}</span>
<span class="xakep-c7">Пиши в редакцию. Отвечаем всем, вежливо не обещаем.</span>

<form class="xakep-mail-form"><label class="xakep-c8" for="xakep-mail-from">От кого: </label><input type="text" class="xakep-input" id="xakep-mail-from" name="from" autocomplete="nickname" maxlength="40" value="Читатель">
<label class="xakep-c8" for="xakep-mail-text">Письмо:</label>
<textarea class="xakep-input xakep-area" id="xakep-mail-text" rows="4" maxlength="600"></textarea>
<button type="submit" class="xakep-btn">Отправить</button> <span class="xakep-mail-msg xakep-c12" role="status"></span></form>
${list.map(m => `
<span class="xakep-c8">${this.rule('·')}</span>
<span class="xakep-c11">${this.esc(m.from)}</span><span class="xakep-c8">, ${this.esc(m.date)}</span>
<span class="xakep-c7 xakep-wrap">${this.esc(m.text)}</span>
<span class="xakep-c12">Х:</span> <span class="xakep-c14 xakep-wrap">${this.esc(m.reply)}</span>`).join('\n')}
`;
  }

  renderKeygen() {
    const progs = this.getPrograms();
    const art = [
      '█  █ ████ █   █  ███ ████ █   █',
      '█ █  █     █ █  █    █    ██  █',
      '██   ███    █   █ ██ ███  █ █ █',
      '█ █  █      █   █  █ █    █  ██',
      '█  █ ████   █    ███ ████ █   █  98'
    ].join('\n');
    return `
<span class="xakep-c14">${this.boxTitle('KEYGEN 98')}</span>
<span class="xakep-c7">Генератор ключей для программ, которых не существует.
Включите музыку: без неё кейген не кейген.</span>

<div class="xakep-kg"><div class="xakep-kg-title">KeyGen 98 by XAKEP Team</div><div class="xakep-kg-art">${art}</div><table class="xakep-kg-form" cellspacing="0"><tr><td><label for="keygen-app">Программа:</label></td><td><select class="xakep-input" id="keygen-app">${progs.map(p => `<option value="${p.id}">${p.name}</option>`).join('')}</select></td></tr><tr><td><label for="keygen-name">Имя:</label></td><td><input type="text" class="xakep-input" id="keygen-name" spellcheck="false" maxlength="24" value="Cool_Hacker_98"></td></tr><tr><td><label for="keygen-key">Ключ:</label></td><td><input type="text" class="xakep-input xakep-key" id="keygen-key" spellcheck="false" readonly value="${this.generateKey(progs[0].id, 'Cool_Hacker_98')}"></td></tr></table><div class="xakep-kg-btns"><button class="xakep-btn" id="btn-do-gen">Генерировать</button> <button class="xakep-btn" id="btn-toggle-music">${this.chiptunePlaying ? 'Выключить музыку' : 'Включить музыку'}</button></div><div class="xakep-kg-scroll">greetz: 2:5020 * Dr. Modem * CyberDemon * все, кто дочитал номер</div></div>
<span class="xakep-c8">Ключи из этого кейгена не подходят ни к одной настоящей программе.
Хорошие программы стоят денег. Покупайте их в </span><a data-url="http://www.softstore98.com">SoftStore '98</a><span class="xakep-c8">.</span>
`;
  }

  renderSite(url) {
    const { path, params } = this.parseUrl(url);
    let content;
    let active = '/';
    if (path === '/article') { content = this.renderArticle(params.get('id')); active = '/articles'; }
    else if (path === '/articles' || path === '/archive') { content = this.renderArchive(); active = '/articles'; }
    else if (path === '/mail') { content = this.renderMail(); active = '/mail'; }
    else if (path === '/keygen') { content = this.renderKeygen(); active = '/keygen'; }
    else content = this.renderIssue();

    const menu = [['/', 'С', 'одержание'], ['/articles', 'А', 'рхив'], ['/mail', 'Х', '-Почта'], ['/keygen', 'K', 'eyGen']];
    return `
      <div class="xakep-page">
<pre class="xakep-screen"><span class="xakep-logo">${this.logo()}</span>  <span class="xakep-c15">XAKEP.RU</span> <span class="xakep-c8">сетевой журнал</span>
<span class="xakep-c7">№ 0 • ноябрь 1998 • пилотный выпуск</span>              <span class="xakep-c8">online: </span><span class="xakep-c10">33600 bps</span>
<span class="xakep-c8">${this.rule('═')}</span>
${menu.map(([p, hot, rest]) => `<a data-url="${this.baseUrl}${p === '/' ? '' : p}" class="xakep-menu${p === active ? ' is-active' : ''}">[<u>${hot}</u>]${rest}</a>`).join('  ')}
<span class="xakep-c8">${this.rule('═')}</span>
${content}
<span class="xakep-c8">${this.rule('─')}</span>
<span class="xakep-c8">(c) 1998 XAKEP Team. Перепечатка с указанием www.xakep98.ru. Пишите: </span><a href="mailto:mail@xakep98.ru">mail@xakep98.ru</a>
<button class="xakep-btn xakep-btn-clippy">Спросить Скрепыша</button></pre>
        <div class="xakep-ring">${window.retroSites && window.retroSites.renderWebRing ? window.retroSites.renderWebRing(this.baseUrl) : ''}</div>
      </div>
    `;
  }

  stopChiptune() {
    if (this.chiptuneTimer) {
      clearInterval(this.chiptuneTimer);
      this.chiptuneTimer = null;
    }
    this.chiptunePlaying = false;
  }

  toggleChiptune(btn) {
    if (this.chiptunePlaying) {
      this.stopChiptune();
      if (btn) btn.textContent = 'Включить музыку';
      return;
    }
    const Ctx = typeof window !== 'undefined' && (window.AudioContext || window.webkitAudioContext);
    if (!this.audioContext && Ctx) this.audioContext = new Ctx();
    if (this.audioContext && this.audioContext.state === 'suspended') this.audioContext.resume();
    if (!this.audioContext) return;
    this.chiptunePlaying = true;
    if (btn) btn.textContent = 'Выключить музыку';
    const lead = [440, 523.25, 659.25, 880, 587.33, 698.46, 880, 1046.5, 392, 493.88, 587.33, 783.99, 349.23, 440, 523.25, 698.46];
    const bass = [110, 110, 146.83, 146.83, 98, 98, 87.31, 87.31];
    this.chiptuneNoteIndex = 0;
    const ctx = this.audioContext;
    const blip = (freq, type, vol, len) => {
      const now = ctx.currentTime;
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = type;
      osc.frequency.setValueAtTime(freq, now);
      gain.gain.setValueAtTime(vol, now);
      gain.gain.exponentialRampToValueAtTime(0.001, now + len);
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.start(now);
      osc.stop(now + len + 0.01);
    };
    this.chiptuneTimer = setInterval(() => {
      if (!this.chiptunePlaying) return;
      const i = this.chiptuneNoteIndex++;
      blip(lead[i % lead.length], 'square', 0.035, 0.11);
      if (i % 2 === 0) blip(bass[(i >> 1) % bass.length], 'triangle', 0.06, 0.24);
    }, 130);
  }

  attachEvents(win, container, url) {
    const arts = this.getArticles();
    const find = (id) => arts.find(a => a.id === id);

    container.querySelectorAll('.xakep-btn-notepad').forEach(btn => {
      btn.addEventListener('click', () => {
        const a = find(btn.dataset.id);
        if (!a) return;
        if (window.appNotepad && window.appNotepad.open) window.appNotepad.open(a.file, this.articleText(a));
      });
    });

    container.querySelectorAll('.xakep-btn-save').forEach(btn => {
      btn.addEventListener('click', () => {
        const a = find(btn.dataset.id);
        if (!a) return;
        if (window.vfs && window.vfs.writeFile) window.vfs.writeFile(['My Computer', 'C:', 'My Documents', 'Downloads'], a.file, this.articleText(a));
        if (window.soundSys && window.soundSys.playDing) window.soundSys.playDing();
        const msg = container.querySelector('.xakep-save-msg');
        if (msg) msg.textContent = `сохранено в C:\\My Documents\\Downloads\\${a.file}`;
      });
    });

    const btnGen = container.querySelector('#btn-do-gen');
    if (btnGen) {
      btnGen.addEventListener('click', () => {
        const appSelect = container.querySelector('#keygen-app');
        const nameInput = container.querySelector('#keygen-name');
        const keyInput = container.querySelector('#keygen-key');
        if (appSelect && nameInput && keyInput) {
          keyInput.value = this.generateKey(appSelect.value, nameInput.value);
          if (window.soundSys && window.soundSys.playClick) window.soundSys.playClick();
        }
      });
    }

    const btnMusic = container.querySelector('#btn-toggle-music');
    if (btnMusic) btnMusic.addEventListener('click', () => this.toggleChiptune(btnMusic));

    const mailForm = container.querySelector('.xakep-mail-form');
    if (mailForm) {
      mailForm.addEventListener('submit', (e) => {
        e.preventDefault();
        const from = container.querySelector('#xakep-mail-from');
        const text = container.querySelector('#xakep-mail-text');
        if (!text || !text.value.trim()) {
          const msg = container.querySelector('.xakep-mail-msg');
          if (msg) msg.textContent = 'Пустое письмо не отправить.';
          return;
        }
        this.addMail(from ? from.value : '', text.value);
        if (window.soundSys && window.soundSys.playClick) window.soundSys.playClick();
        if (window.appIE) window.appIE.renderPage(win, `${this.baseUrl}/mail`);
      });
    }

    const btnClippy = container.querySelector('.xakep-btn-clippy');
    if (btnClippy) {
      btnClippy.addEventListener('click', () => {
        if (window.appClippy) {
          window.appClippy.wakeUp();
          window.appClippy.onNavigateIE(this.baseUrl, 'xakep', "Журнал «Хакер '98»");
        }
      });
    }
  }
}

if (typeof window !== 'undefined') {
  window.xakepSite = new XakepSite();
}
