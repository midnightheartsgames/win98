class ClippyHelp {
  constructor() {
    this.stopWords = new Set(['как', 'где', 'что', 'это', 'мне', 'меня', 'хочу', 'можно', 'нужно', 'надо', 'мой', 'моя', 'мои', 'на', 'во', 'по', 'за', 'для', 'или', 'не', 'ли', 'бы', 'же', 'вы', 'ты', 'он', 'она', 'они', 'его', 'ее', 'их', 'все', 'так', 'там', 'тут', 'еще', 'уже', 'очень', 'пожалуйста', 'помоги', 'помогите', 'сделать', 'какой', 'какая', 'какие', 'чтобы', 'то', 'из', 'со', 'от', 'до', 'the', 'how', 'to', 'do', 'what', 'where', 'my']);
    this.entries = this.buildEntries();
    this.lastQuery = '';
    this.lastResults = [];
  }

  clippy() {
    return window.appClippy;
  }

  esc(text) {
    return String(text).replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
  }

  normalize(text) {
    return String(text || '').toLowerCase().replace(/ё/g, 'е').replace(/[«»"'.,!?;:()[\]{}<>\\/]/g, ' ').replace(/\s+/g, ' ').trim();
  }

  tokens(text) {
    return this.normalize(text).split(' ').filter(t => t.length >= 2 && !this.stopWords.has(t));
  }

  buildEntries() {
    const clippy = () => this.clippy();
    return [
      { id: 'save', q: 'Как сохранить документ', keys: ['сохран', 'ctrl+s', 'save', 'записать файл', 'не потерять'], a: 'Нажмите <strong>Ctrl+S</strong> или выберите «Файл → Сохранить». В первый раз программа спросит имя файла и папку. Это мой любимый вопрос.', anim: 'save' },
      { id: 'saveas', q: 'Как сохранить под другим именем', keys: ['сохранить как', 'другим именем', 'копию', 'save as'], a: '«Файл → Сохранить как...». Выберите папку, впишите новое имя и нажмите «Сохранить». Старый файл останется на месте.' },
      { id: 'find-file', q: 'Как найти файл на компьютере', keys: ['найти файл', 'поиск файл', 'где файл', 'потерял', 'потерялся', 'find'], a: '«Пуск → Найти → Файлы и папки». Впишите часть имени, и поиск пройдёт по всему диску C:. На рабочем столе то же самое делает клавиша F3.', go: () => window.appFind && window.appFind.open(), label: 'Открыть поиск' },
      { id: 'find-text', q: 'Как найти слово в тексте', keys: ['найти слово', 'найти текст', 'поиск текст', 'f3'], a: 'В Блокноте: «Поиск → Найти», а F3 ищет следующее совпадение. В WordPad — «Правка → Найти».' },
      { id: 'wallpaper', q: 'Как сменить обои', keys: ['обои', 'фон', 'wallpaper', 'картинку на рабочий стол'], a: 'Щёлкните правой кнопкой по рабочему столу → «Свойства», вкладка «Фон». Выберите картинку и нажмите «Применить».', go: 'cmd:desk.cpl', label: 'Открыть «Свойства экрана»' },
      { id: 'screensaver', q: 'Как поставить заставку', keys: ['заставк', 'screensaver', 'хранитель экрана'], a: '«Свойства экрана» → вкладка «Заставка». Трубы, звёзды, Матрица — выбирайте, пока не заснёте.', go: 'cmd:desk.cpl', label: 'Открыть «Свойства экрана»' },
      { id: 'themes', q: 'Где взять новые темы и обои', keys: ['тем', 'скачать обои', 'themeworld', 'оформлени'], a: 'На сайте <strong>ThemeWorld \'98</strong> есть обои, заставки и темы Microslop Plus! 98. Скачанное появится в «Свойствах экрана».', go: 'url:http://www.themeworld98.com', label: 'Открыть ThemeWorld \'98' },
      { id: 'resolution', q: 'Как изменить разрешение экрана', keys: ['разрешени', 'размер экрана', '800', 'монитор'], a: '«Свойства экрана» → вкладка «Настройка». Самое модное разрешение 1998 года — 800×600.', go: 'cmd:desk.cpl', label: 'Открыть «Свойства экрана»' },
      { id: 'time', q: 'Как настроить дату и время', keys: ['врем', 'дат', 'час', 'календар'], a: 'Дважды щёлкните по часам в правом нижнем углу или откройте «Панель управления → Дата/время».', go: 'cmd:timedate.cpl', label: 'Открыть «Дату и время»' },
      { id: 'volume', q: 'Как изменить громкость', keys: ['громк', 'звук', 'тише', 'громче', 'volume', 'динамик'], a: 'Щёлкните по значку динамика в трее. Для подробной настройки есть «Регулятор громкости».', go: 'cmd:sndvol32', label: 'Открыть регулятор громкости' },
      { id: 'mouse', q: 'Как настроить мышь', keys: ['мыш', 'курсор', 'двойной щелчок', 'указател'], a: '«Панель управления → Мышь». Там скорость двойного щелчка и указатели. А если мышь ездит рывками, почистите шарик.', go: 'cmd:main.cpl', label: 'Открыть «Свойства мыши»' },
      { id: 'language', q: 'Как переключить язык', keys: ['язык', 'english', 'английск', 'русск', 'раскладк'], a: 'Щёлкните индикатор языка в трее рядом с часами. Интерфейс Win 98 переключится между русским и английским. Я, правда, говорю только по-русски.' },
      { id: 'hang', q: 'Программа зависла', keys: ['завис', 'не отвеча', 'снять задачу', 'ctrl+alt+del', 'тормоз', 'глючит'], a: 'Откройте Диспетчер задач, выберите программу и нажмите «Снять задачу». Я там тоже есть, clippy.exe. Меня снимать не нужно.', go: 'cmd:taskmgr', label: 'Открыть Диспетчер задач' },
      { id: 'shutdown', q: 'Как выключить компьютер', keys: ['выключ', 'завершени', 'перезагруз', 'shutdown'], a: '«Пуск → Завершение работы». Перед этим я проверю, не осталось ли несохранённых документов.', go: () => window.appShutdown && window.appShutdown.openDialog(), label: 'Завершение работы...' },
      { id: 'delete', q: 'Как удалить файл', keys: ['удал', 'стереть', 'delete', 'выбросить'], a: 'Выделите файл и нажмите Delete. Файл попадёт в Корзину, и его ещё можно будет вернуть.' },
      { id: 'restore', q: 'Как вернуть удалённый файл', keys: ['восстанов', 'вернуть файл', 'удалил случайно', 'удалила случайно'], a: 'Откройте Корзину, щёлкните файл правой кнопкой и выберите «Восстановить». Пока Корзину не очистили, всё можно вернуть.', go: () => window.appRecycleBin && window.appRecycleBin.open(), label: 'Открыть Корзину' },
      { id: 'empty-bin', q: 'Как очистить Корзину', keys: ['корзин', 'очистить корзину', 'пустая корзина'], a: 'Щёлкните по Корзине правой кнопкой и выберите «Очистить корзину». Только сначала загляните внутрь: вдруг там курсовая.', go: () => window.appRecycleBin && window.appRecycleBin.open(), label: 'Открыть Корзину', anim: 'trash' },
      { id: 'diskspace', q: 'Как освободить место на диске', keys: ['мест', 'освобод', 'очист', 'мало места', 'переполнен'], a: 'Запустите «Очистку диска»: она удалит временные файлы. И загляните в Корзину: там мегабайты, о которых все забыли.', go: 'cmd:cleanmgr', label: 'Запустить очистку диска' },
      { id: 'defrag', q: 'Как ускорить диск', keys: ['дефрагмент', 'ускор', 'медленн', 'defrag'], a: 'Дефрагментация собирает куски файлов вместе. Заварите чай: на квадратики можно смотреть вечно.', go: 'cmd:defrag', label: 'Запустить дефрагментацию' },
      { id: 'scandisk', q: 'Как проверить диск на ошибки', keys: ['провер', 'ошибк', 'scandisk', 'кластер'], a: 'ScanDisk найдёт потерянные кластеры. Особенно после того, как компьютер выключили кнопкой.', go: 'cmd:scandisk', label: 'Запустить ScanDisk' },
      { id: 'registry', q: 'Что такое реестр', keys: ['реестр', 'regedit', 'registry'], a: 'База настроек Win 98 и программ. Мои настройки там тоже есть: <strong>HKEY_CURRENT_USER\\Software\\Microslop\\Office\\8.0\\Common\\Assistant</strong>. Меняйте осторожно и перезагружайтесь.', go: 'cmd:regedit', label: 'Открыть редактор реестра' },
      { id: 'startup', q: 'Что запускается вместе с Win 98', keys: ['автозагруз', 'автозапуск', 'msconfig', 'при старте', 'при запуске'], a: 'Посмотрите вкладку «Автозагрузка» в «Настройке системы». Я там записан как ClippyOffice. Там хранится всё самое важное.', go: 'cmd:msconfig', label: 'Открыть «Настройку системы»' },
      { id: 'dos', q: 'Как открыть MS-DOS', keys: ['dos', 'командн', 'консол', 'command'], a: 'Сеанс MS-DOS открывается командой <strong>command</strong> в окне «Выполнить». Наберите там <strong>clippy /?</strong>, если соскучитесь.', go: 'cmd:command', label: 'Открыть сеанс MS-DOS' },
      { id: 'run', q: 'Как запустить программу по имени', keys: ['выполнить', 'run', 'по имени'], a: '«Пуск → Выполнить» и введите имя: calc, notepad, regedit, winmine. Или clippy — это я.', go: () => window.appDialogs && window.appDialogs.openRunDialog(), label: 'Открыть «Выполнить»' },
      { id: 'help', q: 'Справка Win 98', keys: ['справк', 'help', 'инструкц', 'руководств'], a: 'Справка Win 98 — книга с разделами про рабочий стол, программы и настройки.', go: 'help:welcome', label: 'Открыть справку' },
      { id: 'internet', q: 'Как подключиться к Интернету', keys: ['интернет', 'модем', 'подключ', 'dial', 'онлайн'], a: 'Откройте «Удалённый доступ к сети» и нажмите «Подключить». Предупредите домашних: телефон будет занят.', go: () => window.appDialUp && window.appDialUp.open(), label: 'Открыть «Удалённый доступ»' },
      { id: 'mail', q: 'Как отправить электронное письмо', keys: ['почт', 'e-mail', 'email', 'mail', 'outlook', 'электронн'], a: 'Откройте Outlook Express и нажмите «Создать сообщение». Я помогу с текстом, если позовёте.', go: () => window.appOutlook && (window.appOutlook.openCompose ? window.appOutlook.openCompose() : window.appOutlook.open()), label: 'Написать письмо' },
      { id: 'letters', q: 'Мастер писем', keys: ['мастер', 'шаблон', 'заявлени', 'объяснительн', 'резюме', 'письм', 'написать'], a: 'Я задам три вопроса — кому, о чём и каким тоном — и составлю письмо. Это моё любимое занятие.', go: () => window.clippyLetters && window.clippyLetters.startWizard(), label: 'Запустить Мастер писем', anim: 'writing' },
      { id: 'icq', q: 'Как найти друзей в сети', keys: ['icq', 'аськ', 'друз', 'чат', 'общени', 'uin'], a: 'Запустите ICQ 98: там уже есть контакты. Мой UIN — 199898, я всегда отвечаю.', go: 'cmd:icq', label: 'Запустить ICQ' },
      { id: 'music', q: 'Как послушать музыку', keys: ['музык', 'mp3', 'песн', 'winamp', 'плеер', 'послушать'], a: 'Winamp играет MP3 из папки «Моя музыка». Я надену наушники и буду качать головой в такт.', go: 'cmd:winamp', label: 'Запустить Winamp' },
      { id: 'video', q: 'Как посмотреть видео', keys: ['видео', 'фильм', 'ролик', 'кино', 'youvid'], a: 'Видео из папки «Мои видео» открывает Медиаплеер. А в Интернете есть YouVid: туда любой может выложить свой ролик.', go: 'url:http://www.youvid.com', label: 'Открыть YouVid' },
      { id: 'paint', q: 'Как нарисовать картинку', keys: ['рисова', 'нарисова', 'paint', 'картинк', 'рисунок'], a: 'В Paint шестнадцать инструментов и целая палитра. Нарисуйте меня, я постою смирно.', go: 'cmd:mspaint', label: 'Запустить Paint' },
      { id: 'paint-fill', q: 'Как залить фон в Paint', keys: ['залить', 'заливк', 'ведро', 'ведерк'], a: 'Инструмент «Заливка» (ведёрко). Проверьте, что контур замкнут: щель в один пиксель — и краска зальёт весь холст.' },
      { id: 'calc', q: 'Как посчитать', keys: ['посчита', 'калькул', 'считать', 'сложить', 'calc'], a: 'Калькулятор умеет обычный и инженерный режимы. Для таблиц лучше Excel.', go: 'cmd:calc', label: 'Запустить Калькулятор' },
      { id: 'excel-sum', q: 'Как посчитать сумму в Excel', keys: ['сумм', 'автосумм', 'excel', 'таблиц', 'бюджет'], a: 'Выделите ячейку под числами и нажмите кнопку Σ «Автосумма». Excel сам найдёт, что сложить.', go: 'cmd:excel', label: 'Открыть Excel' },
      { id: 'bold', q: 'Как сделать текст жирным', keys: ['жирн', 'шрифт', 'курсив', 'подчерк', 'wordpad'], a: 'В WordPad выделите текст и нажмите кнопку «Ж» на панели форматирования. В Блокноте шрифтов нет: он для серьёзных людей.', go: () => window.appWordPad && window.appWordPad.open(), label: 'Открыть WordPad' },
      { id: 'print', q: 'Как напечатать документ', keys: ['печат', 'принтер', 'распечат', 'print'], a: '«Файл → Печать». Принтер матричный, так что предупредите соседей.' },
      { id: 'games', q: 'Где взять игры', keys: ['игр', 'steam', 'купить', 'поиграть', 'game'], a: 'Игры продаются и скачиваются через Steam. Клиент загружается с www.steampowered.com, а дальше игры сами приходят по модему.', go: () => window.gameManager && window.gameManager.showInSteam(), label: 'Открыть Steam' },
      { id: 'minesweeper', q: 'Сыграть в «Сапёра»', keys: ['сапер', 'мины', 'minesweeper', 'winmine'], a: 'Начинайте с центра поля. Цифра — это число мин вокруг клетки. Правая кнопка ставит флажок.', go: 'cmd:winmine', label: 'Запустить «Сапёра»' },
      { id: 'solitaire', q: 'Разложить «Косынку»', keys: ['косынк', 'пасьянс', 'карты', 'solitaire'], a: 'Перекладывайте карты по убыванию с чередованием цвета. Двойной щелчок отправляет карту в «дом».', go: 'cmd:sol', label: 'Запустить «Косынку»' },
      {
        id: 'virus', q: 'Проверить компьютер на вирусы', keys: ['вирус', 'антивирус', 'avp', 'касперск', 'заражен'],
        a: () => this.avpInstalled() ? 'Антивирус Касперского уже установлен. Запустите проверку диска C:.' : 'Антивирус Касперского продаётся в SoftStore \'98, а про свежие вирусы пишет AntiVirus Lab.',
        go: () => (this.avpInstalled() && window.appAVP ? window.appAVP.open() : clippy().openInIE('http://www.antivirus98.com')),
        label: 'Проверить'
      },
      { id: 'cdrom', q: 'Что на компакт-диске', keys: ['компакт', 'cd', 'игромани', 'сидюк'], a: 'В дисководе D: может лежать диск журнала «Игромания» с демоверсиями и роликами.', go: () => window.appExplorer && window.appExplorer.open(['My Computer', 'D:']), label: 'Открыть диск D:' },
      { id: 'bios', q: 'Как зайти в BIOS', keys: ['bios', 'биос', 'cmos'], a: 'Выберите в «Завершении работы» перезагрузку в режим настройки BIOS. Только ничего не разгоняйте без меня.', go: () => window.appShutdown && window.appShutdown.openDialog(), label: 'Завершение работы...' },
      { id: 'bsod', q: 'Синий экран', keys: ['синий', 'bsod', 'фатальн'], a: 'Синий экран — это Win 98 так медитирует. Нажмите любую клавишу и сохраняйтесь почаще. Я помолюсь за ваши данные.' },
      { id: 'neko', q: 'Выпустить кошку на рабочий стол', keys: ['кошк', 'кот', 'neko', 'котик'], a: 'Neko бегает за курсором и спит, когда мышь не двигается. Прямо как я.', go: () => window.appNeko && window.appNeko.toggle(), label: 'Выпустить Neko' },
      { id: 'desktop', q: 'Свернуть все окна', keys: ['свернуть', 'показать рабочий стол', 'все окна'], a: 'Кнопка «Показать рабочий стол» на панели быстрого запуска сворачивает всё сразу. Или правой кнопкой по панели задач.', go: () => window.winManager && window.winManager.minimizeAll(), label: 'Свернуть все окна' },
      { id: 'cascade', q: 'Упорядочить окна', keys: ['каскад', 'упорядоч', 'окна мешают', 'расставить окна'], a: 'Щёлкните правой кнопкой по панели задач и выберите «Окна каскадом».', go: () => window.winManager && window.winManager.cascadeWindows(), label: 'Окна каскадом' },
      { id: 'documents', q: 'Где мои документы', keys: ['мои документ', 'документы', 'папк'], a: 'Папка «Мои документы» на диске C:. Там же лежат загрузки.', go: () => window.appExplorer && window.appExplorer.open(['My Computer', 'C:', 'My Documents']), label: 'Открыть «Мои документы»' },
      { id: 'downloads', q: 'Где скачанные файлы', keys: ['скачан', 'загрузк', 'downloads', 'загружен'], a: 'Всё скачанное сохраняется в «Мои документы → Downloads». Даже мои наряды.', go: () => window.appExplorer && window.appExplorer.open(['My Computer', 'C:', 'My Documents', 'Downloads']), label: 'Открыть «Downloads»' },
      { id: 'search-web', q: 'Как искать в Интернете', keys: ['поиск в интернет', 'найти в интернет', 'поисков', 'search', 'яндекс', 'рамблер'], a: 'WebSeeker 98 ищет по всей Сети. Ещё есть Яndex и Рамблер.', go: 'url:http://www.search98.com', label: 'Открыть WebSeeker 98' },
      { id: 'fargus-site', q: 'Где найти русские переводы игр', keys: ['фаргус', 'fargus', 'перевод', 'озвучк', 'дубляж', 'потрачено'], a: 'На сайте «Фаргус Мультимедиа» (www.goldfargus.ru) есть каталог изданий «Полностью на русском языке», голоса озвучки, патчи и техподдержка. Сами игры продаются в Steam.', go: 'url:http://www.goldfargus.ru', label: 'Открыть «Фаргус»' },
      { id: 'hsr-site', q: 'Где скачать Honkai: Star Rail 98', keys: ['хонкай', 'honkai', 'star rail', 'стар рейл', 'звездный экспресс', 'hoyoverse'], a: 'Игра бесплатная. Установщик на 3,1 МБ лежит на официальном сайте hsr.hoyoverse.com, там же персонажи и новости. Ещё её можно взять в Steam.', go: 'url:http://hsr.hoyoverse.com/download', label: 'Открыть сайт' },
      { id: 'molotok-site', q: 'Где купить или продать ретро-железо', keys: ['молоток', 'аукцион', 'железо', 'voodoo', 'барахолк', 'ставк'], a: 'На аукционе «Молоток \'98» (www.molotok98.ru) продают видеокарты, модемы и приставки. Минута там равна часу торгов, а у других участников стоят автоставки.', go: 'url:http://www.molotok98.ru', label: 'Открыть «Молоток \'98»' },
      { id: 'xakep-site', q: 'Где почитать журнал «Хакер»', keys: ['хакер', 'xakep', 'взлом', 'keygen', 'кейген', 'чиптюн'], a: 'Сетевой журнал «Хакер \'98» (www.xakep98.ru): статьи про модемы, реестр Win 98, вирус CIH и разгон Celeron. Каждую статью можно сохранить как .TXT.', go: 'url:http://www.xakep98.ru', label: 'Открыть «Хакер \'98»' },
      { id: 'mult-site', q: 'Где посмотреть серии Масяни', keys: ['мульт', 'масяня', 'хрюндель', 'анимация', 'мультфильм'], a: 'На Мульт.ру (www.mult98.ru) четыре серии про Масяню и Хрюнделя со сценариями. Там же обои, которые ставятся на рабочий стол одной кнопкой.', go: 'url:http://www.mult98.ru', label: 'Открыть «Мульт.ру»' },
      { id: 'emuland-site', q: 'Где скачать игры для Dendy и Sega', keys: ['эмулятор', 'dendy', 'денди', 'sega', 'сега', 'rom', 'картридж', 'танчики', 'контра'], a: 'Emu-Land (www.emuland98.ru): дампы картриджей Dendy, Sega, SNES и Game Boy со скриншотами, коды и список эмуляторов.', go: 'url:http://www.emuland98.ru', label: 'Открыть Emu-Land' },
      { id: 'xfiles-site', q: 'Где найти секретные архивы об НЛО', keys: ['нло', 'пришельцы', 'истина', 'розуэлл', 'аномалии', 'xfiles', 'секретн'], a: 'Архив «Истина где-то рядом» (www.xfiles98.ru): дела об НЛО с чёрными полосами, дешифратор, рассказы очевидцев и мнение скептика.', go: 'url:http://www.xfiles98.ru', label: 'Открыть «Истина где-то рядом»' },
      { id: 'y2k', q: 'Проблема 2000 года', keys: ['2000', 'y2k', 'миллениум'], a: 'Говорят, в новогоднюю ночь остановятся банки и лифты. На сайте Y2K Bug Survival Center можно проверить компьютер.', go: 'url:http://www.y2k-countdown.org', label: 'Открыть сайт' },
      { id: 'clippy-hide', q: 'Как спрятать Скрепыша', keys: ['спрят', 'убери', 'надоел', 'отключ', 'исчезни', 'мешаешь'], a: 'Щёлкните по скрепке в трее, и я спрячусь. Если мешаю совсем, в «Параметрах помощника» есть галочка «Показывать помощника». Я пойму.', go: () => (window.clippyTalk ? window.clippyTalk.requestHide() : clippy().hide()), label: 'Спрятаться в трей' },
      { id: 'clippy-options', q: 'Параметры помощника', keys: ['параметр', 'настройк', 'назойлив', 'лампочк', 'коллекци'], a: 'В «Параметрах» можно выбрать, о чём мне молчать, включить лампочку вместо выносок и полистать «Коллекцию» помощников.', go: () => window.clippyOptions && window.clippyOptions.openDialog('options'), label: 'Открыть «Параметры»' },
      { id: 'clippy-wardrobe', q: 'Гардероб Скрепыша', keys: ['гардероб', 'шляп', 'наряд', 'одежд', 'галстук', 'усы', 'clippy98'], a: 'На www.clippy98.com можно бесплатно скачать шляпы, очки, усы и галстуки. Я примерю всё.', go: () => clippy().openWardrobeSite(), label: 'Открыть гардероб' },
      { id: 'clippy-talk', q: 'Поговорить со Скрепышом', keys: ['поговор', 'поболта', 'как дела', 'скучно', 'привет', 'скрепыш', 'clippy'], a: 'Всегда рад. У меня есть загадки, сплетни про коллег и одна история, которую я пока не рассказал.', go: () => window.clippyTalk && window.clippyTalk.openHub(), label: 'Поговорить' },
      { id: 'clippy-quiz', q: 'Ретро-Викторина 1998', keys: ['викторин', 'тест', 'вопрос'], a: 'Пять вопросов про компьютеры 1998 года. Ответите на все — получите корону в гардеробе.', go: () => clippy().startQuiz(), label: 'Начать викторину' },
      { id: 'clippy-riddle', q: 'Загадай загадку', keys: ['загадк'], a: 'Загадки у меня компьютерные. Отгадка всегда где-то рядом с вами.', go: () => window.clippyTalk && window.clippyTalk.play('riddle'), label: 'Слушаю загадку' },
      { id: 'clippy-rps', q: 'Камень, ножницы, бумага', keys: ['камень', 'ножниц', 'бумаг'], a: 'Играем до трёх побед. Скрепку не выбирать, это мой приём.', go: () => window.clippyTalk && window.clippyTalk.startRps(), label: 'Играть' },
      { id: 'clippy-joke', q: 'Расскажи анекдот', keys: ['анекдот', 'шутк', 'посмеши', 'смешн'], a: 'Анекдоты у меня офисные. Смеяться не обязательно, но приятно.', go: () => window.clippyTalk && window.clippyTalk.play('joke'), label: 'Рассказать' },
      { id: 'boss', q: 'Шеф идёт!', keys: ['шеф', 'начальник', 'босс', 'boss', 'спрятать игру'], a: 'Я сверну все игры и открою отчёт в Excel. Вы будете выглядеть как самый усердный работник года.', go: () => clippy().triggerBossKey(), label: 'Шеф идёт!' }
    ];
  }

  avpInstalled() {
    return Boolean(window.gameManager && window.gameManager.isInstalled && window.gameManager.isInstalled('avp'));
  }

  dynamicEntries() {
    const out = [];
    const gm = window.gameManager;
    if (gm && gm.catalog) {
      Object.keys(gm.catalog).forEach(id => {
        const game = gm.catalog[id];
        if (!game || !game.steam) return;
        const installed = gm.isInstalled && gm.isInstalled(id);
        out.push({
          id: `game:${id}`,
          q: `${installed ? 'Играть' : game.price > 0 ? 'Купить в Steam' : 'Получить в Steam'}: ${game.title}`,
          keys: [game.title, id, game.genre || ''].concat(game.tags || []).map(k => this.normalize(k)).filter(Boolean),
          a: installed
            ? `<strong>${this.esc(game.title)}</strong> установлена. ${this.esc(game.subtitle || '')}`
            : `<strong>${this.esc(game.title)}</strong> ${game.price > 0 ? `продаётся в Steam за ${this.esc(game.priceDisplay)}` : 'бесплатно в Steam'}. ${this.esc(game.subtitle || '')}`,
          go: () => (installed && game.launch ? game.launch() : gm.showInSteam(id)),
          label: installed ? 'Запустить игру' : 'Открыть в Steam'
        });
      });
    }
    let favorites = [];
    try { favorites = window.appIE && window.appIE.favorites ? window.appIE.favorites : []; } catch (e) {}
    favorites.forEach(([url, title]) => {
      out.push({
        id: `site:${url}`,
        q: `Сайт: ${title}`,
        keys: [this.normalize(title), url.replace('http://', '').replace('www.', '')],
        a: `Сайт <strong>${this.esc(title)}</strong>. Открыть его в Internet Explorer?`,
        go: `url:${url}`,
        label: 'Открыть сайт'
      });
    });
    return out;
  }

  allEntries() {
    return this.entries.concat(this.dynamicEntries());
  }

  score(entry, query, queryTokens) {
    let score = 0;
    let matched = 0;
    const keys = entry.keys.map(k => this.normalize(k)).filter(Boolean);
    keys.forEach(key => {
      if (key.length >= 4 && key.includes(' ') && query.includes(key)) {
        score += 4;
        matched++;
      }
    });
    const keyTokens = [];
    keys.forEach(key => {
      if (!key.includes(' ')) keyTokens.push(key);
      else key.split(' ').forEach(t => { if (t.length >= 4) keyTokens.push(t); });
    });
    const titleTokens = this.tokens(entry.q);
    queryTokens.forEach(token => {
      if (token.length < 3 && !keyTokens.includes(token)) return;
      const hit = keyTokens.some(k => k === token || (k.length >= 3 && token.startsWith(k)) || (token.length >= 3 && k.startsWith(token)));
      if (hit) {
        score += 3;
        matched++;
        return;
      }
      if (titleTokens.some(k => k.length >= 4 && token.length >= 4 && (k.startsWith(token) || token.startsWith(k)))) score += 1;
    });
    return matched ? score : 0;
  }

  search(query, limit = 5) {
    const norm = this.normalize(query);
    const queryTokens = this.tokens(query);
    if (!queryTokens.length) return [];
    return this.allEntries()
      .map(entry => ({ entry, score: this.score(entry, norm, queryTokens) }))
      .filter(r => r.score >= 3)
      .sort((a, b) => b.score - a.score)
      .slice(0, limit);
  }

  byId(id) {
    return this.entries.find(e => e.id === id) || null;
  }

  suggestions() {
    const wm = window.winManager;
    const id = (wm && wm.activeWindowId) || '';
    const clippy = this.clippy();
    let ids = ['wallpaper', 'find-file', 'games'];
    if (id.startsWith('app_notepad')) ids = ['save', 'find-text', 'letters'];
    else if (id.startsWith('app_wordpad')) ids = ['bold', 'save', 'letters'];
    else if (id === 'app_ie') ids = ['search-web', 'games', 'clippy-wardrobe'];
    else if (id.startsWith('app_paint')) ids = ['paint-fill', 'save', 'wallpaper'];
    else if (id.startsWith('app_excel')) ids = ['excel-sum', 'boss', 'save'];
    else if (id.startsWith('app_outlook')) ids = ['letters', 'mail', 'icq'];
    else if (clippy && clippy.isGameWindow && clippy.isGameWindow(id)) ids = ['boss', 'hang', 'games'];
    return ids.map(x => this.byId(x)).filter(Boolean);
  }

  footer() {
    const clippy = this.clippy();
    return [
      { text: 'Советы', action: () => (window.clippyTips ? window.clippyTips.showNext(true) : clippy.sayRandomTip()) },
      { text: 'Параметры', action: () => window.clippyOptions && window.clippyOptions.openDialog('options') },
      { text: 'Закрыть', action: () => {} }
    ];
  }

  askInput(value = '') {
    return { placeholder: 'Например: как сменить обои', value, button: 'Найти', onSubmit: q => this.showResults(q) };
  }

  openAsk(query = '') {
    const clippy = this.clippy();
    if (!clippy) return;
    if (query) {
      this.showResults(query);
      return;
    }
    clippy.speak('<strong>Что вы хотите сделать?</strong><br><span class="clippy-hint">Напишите своими словами, например «найти файл» или «где игры».</span>',
      this.suggestions().map(e => ({ text: `• ${e.q}`, action: () => this.showAnswer(e) })),
      '🔎', 0, { input: this.askInput(), footer: this.footer(), anim: 'search' });
  }

  showResults(query) {
    const clippy = this.clippy();
    if (!clippy) return;
    this.lastQuery = query;
    this.lastResults = this.search(query, 5);
    if (window.clippyTalk && window.clippyTalk.countQuestion) window.clippyTalk.countQuestion();
    if (!this.lastResults.length) {
      clippy.speak(`По запросу «${this.esc(query)}» я ничего не нашёл. Попробуйте другие слова. Или поищем в Интернете?`, [
        { text: '• Искать в WebSeeker 98', action: () => clippy.openInIE(`http://www.search98.com/search?q=${encodeURIComponent(query)}`) },
        { text: '• Открыть справку Win 98', action: () => this.run({ go: 'help:welcome' }) }
      ], '🤔', 0, { input: this.askInput(query), footer: this.footer(), anim: 'think' });
      return;
    }
    clippy.speak(`Вот что я нашёл по запросу «${this.esc(query)}»:`,
      this.lastResults.map(r => ({ text: `• ${r.entry.q}`, action: () => this.showAnswer(r.entry) })),
      '🔎', 0, { input: this.askInput(query), footer: this.footer(), anim: 'search' });
  }

  answerText(entry) {
    return typeof entry.a === 'function' ? entry.a() : entry.a;
  }

  showAnswer(entry) {
    const clippy = this.clippy();
    if (!clippy || !entry) return;
    const actions = [];
    if (entry.go) actions.push({ text: `▶ ${entry.label || 'Сделать это'}`, action: () => this.run(entry) });
    if (this.lastResults.length > 1) actions.push({ text: '• Назад к результатам', action: () => this.showResults(this.lastQuery) });
    actions.push({ text: '• Другой вопрос', action: () => this.openAsk() });
    clippy.speak(`<strong>${entry.q}</strong><br>${this.answerText(entry)}`, actions, '💡', 0, entry.anim ? { anim: entry.anim } : {});
  }

  run(entry) {
    const go = entry && entry.go;
    if (!go) return false;
    if (typeof go === 'function') {
      go();
      return true;
    }
    const sep = go.indexOf(':');
    const kind = go.slice(0, sep);
    const value = go.slice(sep + 1);
    if (kind === 'cmd' && window.appDialogs) window.appDialogs.executeRunCommand(value);
    else if (kind === 'url' && this.clippy()) this.clippy().openInIE(value);
    else if (kind === 'help' && window.appDialogs) window.appDialogs.openHelp(value);
    else return false;
    return true;
  }

  plain(html) {
    return String(html || '').replace(/<[^>]+>/g, '').replace(/&nbsp;/g, ' ').replace(/&amp;/g, '&').replace(/&lt;/g, '<').replace(/&gt;/g, '>').replace(/&quot;/g, '"').replace(/&#39;/g, "'");
  }

  icqAnswer(text) {
    const best = this.search(text, 1)[0];
    if (!best || best.score < 4) return null;
    return `«${best.entry.q}». ${this.plain(this.answerText(best.entry))}`;
  }
}

window.clippyHelp = new ClippyHelp();
