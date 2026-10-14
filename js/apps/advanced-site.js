class AdvancedSite {
  constructor() {
    this.baseUrl = 'http://www.3advanced.com';
    this.subscribersKey = 'win98_3advanced_subscribers';
    this.introShown = false;
    this.motion = true;
    this.updatesOffset = 0;
    this.category = 'all';
    this.selectedId = null;

    this.categories = [
      { id: 'all', label: 'ALL.MODULES', ru: 'Все программы' },
      { id: 'system', label: 'SYSTEM.CORE', ru: 'Система' },
      { id: 'office', label: 'OFFICE.DATA', ru: 'Офис и текст' },
      { id: 'internet', label: 'NET.COMM', ru: 'Интернет и связь' },
      { id: 'media', label: 'AUDIO.VISUAL', ru: 'Мультимедиа' },
      { id: 'graphics', label: 'GRAPHIC.LAB', ru: 'Графика и 3D' }
    ];

    this.programs = [
      { id: 'explorer', name: 'Проводник', exe: 'EXPLORER.EXE', cat: 'system', icon: 'my-computer', app: 'appExplorer', args: [['My Computer']], ver: '4.72', size: '240 КБ', dev: 'Microslop', desc: 'Оболочка рабочего стола и файловый менеджер: диски, папки, ярлыки, корзина и панель управления в одном окне.', feats: ['Дерево папок и адресная строка', 'Копирование и перетаскивание файлов', 'Доступ к панели управления'] },
      { id: 'taskmgr', name: 'Диспетчер задач', exe: 'TASKMAN.EXE', cat: 'system', icon: 'taskmgr', app: 'appTaskManager', ver: '98.0', size: '46 КБ', dev: 'Microslop', desc: 'Список запущенных программ и процессов, графики загрузки процессора и памяти. Снимает зависшие задачи одним нажатием.', feats: ['Живой график CPU', 'Завершение процессов', 'Ctrl+Alt+Del'] },
      { id: 'regedit', name: 'Редактор реестра', exe: 'REGEDIT.EXE', cat: 'system', icon: 'regedit', app: 'appRegEdit', ver: '4.10', size: '120 КБ', dev: 'Microslop', desc: 'Прямой доступ к реестру системы: ключи HKEY_LOCAL_MACHINE, HKEY_CURRENT_USER и параметры программ.', feats: ['Дерево ключей', 'Изменение значений', 'Для опытных пользователей'] },
      { id: 'defrag', name: 'Дефрагментация диска', exe: 'DEFRAG.EXE', cat: 'system', icon: 'defrag', app: 'appDefrag', ver: '98.0', size: '210 КБ', dev: 'Microslop', desc: 'Собирает фрагменты файлов на диске C: и ускоряет загрузку программ. Знаменитая сетка разноцветных кластеров.', feats: ['Карта кластеров', 'Подробная легенда', 'Пауза и возобновление'] },
      { id: 'winrar', name: 'WinRAR 2.x', exe: 'WINRAR.EXE', cat: 'system', icon: 'winrar', app: 'appWinRAR', ver: '2.71', size: '640 КБ', dev: 'Eugene Roshal', desc: 'Архиватор RAR и ZIP с легендарным окном «Пожалуйста, купите лицензию» через 40 дней.', feats: ['Упаковка RAR/ZIP', 'Распаковка в папку', 'Вечный пробный период'] },
      { id: 'wincommander', name: 'WinCommander 98', exe: 'WINCMD.EXE', cat: 'system', icon: 'wincommander', app: 'appWinCommander', gm: 'wincommander', ver: '3.51', size: '1.2 МБ', dev: 'C. Ghisler Clone', desc: 'Двухпанельный файловый менеджер для тех, кто вырос на Norton Commander. Горячие клавиши F5, F6, F8.', feats: ['Две панели', 'Функциональные клавиши', 'Быстрый просмотр'] },
      { id: 'avp', name: 'Антивирус Касперского AVP', exe: 'AVP32.EXE', cat: 'system', icon: 'avp', app: 'appAVP', gm: 'avp', ver: '3.0', size: '4.8 МБ', dev: 'Kaspersky Lab', desc: 'Сканер и монитор от вирусов CIH, Melissa и прочей нечисти 1999 года. Хрюкает при обнаружении угрозы.', feats: ['Проверка дисков', 'Антивирусные базы', 'Лечение файлов'] },
      { id: 'dialup', name: 'Удалённый доступ', exe: 'RNAAPP.EXE', cat: 'internet', icon: 'dialup', app: 'appDialUp', ver: '1.3', size: '88 КБ', dev: 'Microslop', desc: 'Подключение к Интернету через модем 56K: набор номера, писк, шипение и заветное «Соединение установлено».', feats: ['Звуки модема', 'Скорость соединения', 'Счётчик времени'] },
      { id: 'ie', name: 'Internet Explorer', exe: 'IEXPLORE.EXE', cat: 'internet', icon: 'internet-explorer', app: 'appIE', ver: '5.0', size: '2.1 МБ', dev: 'Microslop', desc: 'Браузер, в котором вы сейчас читаете эту страницу. Избранное, история, поиск и десятки сайтов эпохи.', feats: ['Избранное', 'Просмотр HTML-кода', 'Сайты 1998–2001'] },
      { id: 'netscape', name: 'Netscape 6', exe: 'NETSCP6.EXE', cat: 'internet', icon: 'netscape', app: 'appNetscape', ver: '6.0', size: '3.4 МБ', dev: 'Netscape Communications', desc: 'Главный соперник IE в браузерных войнах. Собственный движок отрисовки и тот самый логотип-штурвал.', feats: ['Вкладка Sidebar', 'Свой движок', 'Альтернатива IE'] },
      { id: 'outlook', name: 'Outlook Express', exe: 'MSIMN.EXE', cat: 'internet', icon: 'outlook', app: 'appOutlook', ver: '5.0', size: '1.6 МБ', dev: 'Microslop', desc: 'Почтовый клиент: входящие, отправленные, адресная книга и письма «ПИСЬМО СЧАСТЬЯ — перешли 10 друзьям».', feats: ['Почтовые папки', 'Создание писем', 'Адресная книга'] },
      { id: 'icq', name: 'ICQ 98a', exe: 'ICQ.EXE', cat: 'internet', icon: 'icq-online', app: 'appICQ', ver: '98a', size: '1.9 МБ', dev: 'Mirabilis', desc: 'Пейджер с зелёным цветком и культовым «О-оу!» при новом сообщении. Список контактов и статусы.', feats: ['Звук «Uh-oh!»', 'Статусы и контакты', 'Мгновенные сообщения'] },
      { id: 'notepad', name: 'Блокнот', exe: 'NOTEPAD.EXE', cat: 'office', icon: 'notepad', app: 'appNotepad', ver: '4.10', size: '52 КБ', dev: 'Microslop', desc: 'Простейший текстовый редактор для .TXT, .INI и .BAT. Открывает и сохраняет файлы виртуального диска.', feats: ['Открыть / Сохранить', 'Поиск текста', 'Перенос по словам'] },
      { id: 'wordpad', name: 'WordPad', exe: 'WORDPAD.EXE', cat: 'office', icon: 'wordpad', app: 'appWordPad', ver: '5.0', size: '190 КБ', dev: 'Microslop', desc: 'Редактор документов с форматированием: шрифты, жирный, курсив, выравнивание и файлы .RTF.', feats: ['Форматирование', 'Документы RTF', 'Панель инструментов'] },
      { id: 'calc', name: 'Калькулятор', exe: 'CALC.EXE', cat: 'office', icon: 'calculator', app: 'appCalculator', ver: '4.0', size: '60 КБ', dev: 'Microslop', desc: 'Обычный калькулятор с памятью MC/MR/MS/M+. Вычисляет всё — кроме налоговой декларации.', feats: ['Память', 'Проценты и корни', 'Ввод с клавиатуры'] },
      { id: 'excel', name: 'Excel 97', exe: 'EXCEL.EXE', cat: 'office', icon: 'file-xls', app: 'appExcel', ver: '8.0', size: '7.2 МБ', dev: 'Microslop', desc: 'Электронные таблицы с формулами. По умолчанию открывает бюджет отдела на 1998 год.', feats: ['Ячейки и формулы', 'Файлы .XLS', 'Бюджет 1998'] },
      { id: 'winamp', name: 'WinAmp 98', exe: 'WINAMP.EXE', cat: 'media', icon: 'winamp', app: 'appWinamp', gm: 'winamp', ver: '2.24', size: '1.1 МБ', dev: 'Nullsoft', desc: '«It really whips the llama\'s ass!» — плеер MP3, WAV и MIDI с эквалайзером, плейлистом и скинами.', feats: ['Эквалайзер', 'Плейлист', 'Визуализация'] },
      { id: 'videoplayer', name: 'ActiveMovie Player', exe: 'AMOVIE.EXE', cat: 'media', icon: 'video-player', app: 'appVideoPlayer', gm: 'videoplayer', ver: '98', size: '2.3 МБ', dev: 'Microslop', desc: 'Проигрыватель видеороликов и мультимедиа: AVI, MPEG и клипы, скачанные с WebCinema \'98.', feats: ['Видео и звук', 'Перемотка', 'Полноэкранный режим'] },
      { id: 'soundrec', name: 'Звукозапись', exe: 'SNDREC32.EXE', cat: 'media', icon: 'sound-recorder', app: 'appSoundRecorder', ver: '4.0', size: '70 КБ', dev: 'Microslop', desc: 'Запись и воспроизведение .WAV с зелёной осциллограммой. Ровно 60 секунд творчества.', feats: ['Осциллограмма', 'Запись WAV', 'Эффекты'] },
      { id: 'imageviewer', name: 'Imaging', exe: 'KODAKIMG.EXE', cat: 'media', icon: 'imaging', app: 'appImageViewer', ver: '2.0', size: '410 КБ', dev: 'Kodak / Wang', desc: 'Просмотр изображений и отсканированных документов: масштаб, поворот и обои.', feats: ['Масштаб', 'Поворот', 'Просмотр BMP'] },
      { id: 'paint', name: 'Paint', exe: 'MSPAINT.EXE', cat: 'graphics', icon: 'paint', app: 'appPaint', ver: '4.10', size: '340 КБ', dev: 'Microslop', desc: 'Карандаш, кисть, распылитель, заливка и палитра на 28 цветов. Первая цифровая мастерская каждого ребёнка.', feats: ['Инструменты рисования', 'Палитра', 'Сохранение BMP'] },
      { id: 'photoshop', name: 'RetroShop 98', exe: 'RSHOP.EXE', cat: 'graphics', icon: 'photoshop', app: 'appPhotoshop', gm: 'photoshop', ver: '5.0', size: '12 МБ', dev: 'Adobo Systems', desc: 'Профессиональный фоторедактор со слоями, фильтрами и файлами .PSD. Требует 32 МБ ОЗУ и терпения.', feats: ['Слои', 'Фильтры', 'Формат PSD'] },
      { id: 'blender', name: 'Blender 1.60', exe: 'BLENDER.EXE', cat: 'graphics', icon: 'blender', app: 'appBlender', gm: 'blender', ver: '1.60', size: '1.8 МБ', dev: 'Not a Number', desc: 'Компактный 3D-пакет: полигональное моделирование, Extrude, OpenGL-вьюпорт и рендер по F12.', feats: ['Моделирование', 'OpenGL-вьюпорт', 'Рендер F12'] },
      { id: 'blender204', name: 'Blender 2.04', exe: 'BLENDER.EXE', cat: 'graphics', icon: 'blender204', app: 'appBlender204', gm: 'blender204', ver: '2.04', size: '2.9 МБ', dev: 'Not a Number', desc: 'Пакет для 3D и интерактивной 3D-графики: NURBS, метаболы, 3D-текст, рендер с тенями, IPO-анимация и игровой движок на логических блоках.', feats: ['Игровой движок', 'NURBS и метаболы', 'Рендер с тенями'] },
      { id: 'minesweeper', name: 'Сапёр', exe: 'WINMINE.EXE', cat: 'games', icon: 'minesweeper', app: 'appMinesweeper', ver: '98', size: '28 КБ', dev: 'Microslop', desc: 'Классика офисных перерывов: откройте поле, не наступив на мину. Смайлик переживает вместе с вами.', feats: ['3 уровня сложности', 'Флажки', 'Таблица рекордов'] },
      { id: 'solitaire', name: 'Косынка', exe: 'SOL.EXE', cat: 'games', icon: 'solitaire', app: 'appSolitaire', ver: '98', size: '56 КБ', dev: 'Microslop', desc: 'Пасьянс «Косынка» с тем самым водопадом карт после победы.', feats: ['Перетаскивание карт', 'Водопад победы', 'Счёт'] },
      { id: 'freecell', name: 'FreeCell', exe: 'FREECELL.EXE', cat: 'games', icon: 'freecell', app: 'appFreeCell', ver: '98', size: '34 КБ', dev: 'Microslop', desc: 'Пасьянс со свободными ячейками: почти любая раздача решаема — если думать заранее.', feats: ['Свободные ячейки', 'Номер раздачи', 'Статистика'] },
      { id: 'pinball', name: '3D Pinball', exe: 'PINBALL.EXE', cat: 'games', icon: 'pinball', app: 'appPinball', ver: '1.0', size: '1.1 МБ', dev: 'Cinematronics', desc: 'Space Cadet: флипперы, миссии и звёздный стол. Клавиши Z и /.', feats: ['Физика шарика', 'Миссии', 'Рекорды'] },
      { id: 'doom', name: 'DOOM 98', exe: 'DOOM.EXE', cat: 'games', icon: 'doom', app: 'appDoom', gm: 'doom', ver: '1.9', size: '11 МБ', dev: 'id Software', desc: 'Марсианская база, демоны и дробовик. Легендарный шутер, с которого всё началось.', feats: ['Эпизоды и уровни', 'Арсенал', 'IDDQD'] },
      { id: 'moh98', name: 'Medal of Honor 98', exe: 'MOH.EXE', cat: 'games', icon: 'moh98', app: 'appMoh98', gm: 'moh98', ver: '1.0', size: '18 МБ', dev: 'DreamWorks Interactive', desc: 'Операции УСС 1944–1945: шесть миссий, работа под прикрытием, взрывчатка, «Тигр» и медали за каждое задание.', feats: ['WebGL-3D', 'Шесть миссий', 'Медали и пароли'] },
      { id: 'mc98', name: 'Minecraft 98', exe: 'MINECRAFT.EXE', cat: 'games', icon: 'mc98', app: 'appMc98', gm: 'mc98', ver: 'Alpha 1.0.17', size: '2 МБ', dev: 'Mojang Specifications', desc: 'Бесконечный мир из кубов: копай, строй, крафти, выживай ночью. Биомы, пещеры, руды, мобы, вода и лава, день и ночь.', feats: ['Бесконечный мир', 'Крафт', 'Выживание и творчество'] },
      { id: 'hsr98', name: 'Honkai: Star Rail 98', exe: 'STARRAIL.EXE', cat: 'games', icon: 'hsr98', app: 'appHsr98', gm: 'hsr98', ver: '1.2 «Ярило-VI»', size: '3 МБ', dev: 'miHoYo Shanghai', desc: 'Пошаговая JRPG о Звёздном экспрессе: станция «Герта», Белобог, Подземье и Коколия. Шкала хода, пробитие уязвимостей, Контакт, Слияния и Слухи.', feats: ['Пробитие уязвимостей', 'Контакт и Слияния', 'Слухи становятся правдой'] },
      { id: 'dao98', name: 'Dragon Age: Origins 98', exe: 'DAORIGINS.EXE', cat: 'games', icon: 'dao98', app: 'appDao98', gm: 'dao98', ver: '1.0 «Мор»', size: '1.9 ГБ', dev: 'BioWare', desc: 'Тёмное фэнтези о Серых Стражах: шесть предысторий, бои с паузой, тактика спутников, Остагар и Лотеринг.', feats: ['Шесть предысторий', 'Тактика спутников', 'Бои с паузой'] },
      { id: 'quake3', name: 'Quake III Arena', exe: 'QUAKE3.EXE', cat: 'games', icon: 'quake3', app: 'appQuake3', gm: 'quake3', ver: '1.32', size: '480 МБ', dev: 'id Software', desc: 'Арена Вечности: дезматч против ботов с характером, два тира одиночной кампании и восемь арен от Arena Gate до The Proving Grounds. Девять стволов, Quad Damage, распрыжка и рокет-джампы.', feats: ['8 арен, 2 тира', '9 видов оружия', 'Боты 5 уровней'] },
      { id: 'hl2', name: 'Half-Life 2', exe: 'HL2.EXE', cat: 'games', icon: 'hl2', app: 'appHl2', gm: 'hl2', ver: '1.0.0.4', size: '620 МБ', dev: 'Valve Software', desc: 'Сити 17 под властью Альянса. Гравипушка, аэролодка, багги, Рейвенхолм, Нова Проспект и восстание против Цитадели. Четырнадцать глав.', feats: ['Физика предметов', 'Гравипушка', '14 глав'] },
      { id: 'tekken3', name: 'Tekken 3 98', exe: 'TEKKEN3.EXE', cat: 'games', icon: 'tekken3', app: 'appTekken3', gm: 'tekken3', ver: '1.0', size: '420 МБ', dev: 'Namco', desc: 'Трёхмерный файтинг на четыре кнопки: шестнадцать бойцов, уходы в сторону, подбросы и броски. Аркада с Колоссом, штурм «Курогане» и пляжный мяч.', feats: ['16 бойцов', '9 режимов', 'Бой вдвоём'] },
      { id: 'ow98', name: 'Overwatch 98', exe: 'OVERWATCH.EXE', cat: 'games', icon: 'ow98', app: 'appOw98', gm: 'ow98', ver: '1.0', size: '1.1 ГБ', dev: 'Blizzard Entertainment', desc: 'Командный шутер 6 на 6: двенадцать героев, восемь карт, захват точек, сопровождение груза, гибрид и контроль. Боты, тренировочный полигон и лутбоксы.', feats: ['12 героев', '8 карт', '4 режима'] },
      { id: 'sammax', name: 'Sam & Max: Culture Shock', exe: 'SAMMAX.EXE', cat: 'games', icon: 'sammax', app: 'appSamMax', gm: 'sammax', ver: '1.0', size: '38 МБ', dev: 'LucasArts', desc: 'Сэм и Макс против гипнотических кассет «Ай-Бо»: крыса с телефоном, лавка Боско, тесты доктора Сибил, погоня на Де Сото и сон с четырьмя Брэди Калчерами.', feats: ['Квест', 'Графика 320×200', 'Диалоги иконками'] },
      { id: 'sammax102', name: 'Sam & Max: Situation: Comedy', exe: 'SAMMAX2.EXE', cat: 'games', icon: 'sammax102', app: 'appSamMax102', gm: 'sammax102', ver: '1.0', size: '41 МБ', dev: 'LucasArts', desc: 'Сэм и Макс штурмуют телестудию WARP: роль в ситкоме с коровой в абажуре, песня на гелии в «Позорном идоле», скандал в жёлтой газете Сибил и прямой эфир «Майры!» с подозрительным мишкой.', feats: ['Квест', 'Графика 320×200', 'Диалоги иконками'] },
      { id: 'sammax103', name: 'Sam & Max: The Mole, the Mob and the Meatball', exe: 'SAMMAX3.EXE', cat: 'games', icon: 'sammax103', app: 'appSamMax103', gm: 'sammax103', ver: '1.0', size: '44 МБ', dev: 'LucasArts', desc: 'Сэм и Макс ищут полицейского крота в Игрушечной мафии: индейский покер с шулером, жучок-ветеран, три поручения мафии с кетчупом и магнитом, погоня за розовым лимузином и фабрика гипнотических мишек.', feats: ['Квест', 'Графика 320×200', 'Диалоги иконками'] },
      { id: 'sammax104', name: 'Sam & Max: Abe Lincoln Must Die!', exe: 'SAMMAX4.EXE', cat: 'games', icon: 'sammax104', app: 'appSamMax104', gm: 'sammax104', ver: '1.0', size: '46 МБ', dev: 'LucasArts', desc: 'Сэм и Макс едут в Белый дом: агент Суперболл на линии, перевод для губернатора Уиззера, дебаты с мемориалом Линкольна, свидание для Сибил, сыворотка правды за сто миллионов, военная песня и погоня за статуей с радиомаяком.', feats: ['Квест', 'Графика 320×200', 'Диалоги иконками'] },
      { id: 'sammax105', name: 'Sam & Max: Reality 2.0', exe: 'SAMMAX5.EXE', cat: 'games', icon: 'sammax105', app: 'appSamMax105', gm: 'sammax105', ver: '1.0', size: '48 МБ', dev: 'LucasArts', desc: 'Сэм и Макс надевают очки и входят в Реальность 2.0: клуб пожилых компьютеров, жучок в настройках мира, плоский пёс под дверью, бой со слизью, файрвол, банк с поворотными стрелками, простуда Боско за миллиард и текстовая Реальность 1.5.', feats: ['Квест', 'Графика 320×200', 'Два мира в один клик'] },
      { id: 'sammax106', name: 'Sam & Max: Bright Side of the Moon', exe: 'SAMMAX6.EXE', cat: 'games', icon: 'sammax106', app: 'appSamMax106', gm: 'sammax106', ver: '1.0', size: '50 МБ', dev: 'LucasArts', desc: 'Сэм и Макс летят на Луну на Де Сото: единорог вместо пропуска, три талисмана «Эметики», лунный модуль с ключом, звонок головы Линкольна королеве Канады, крестики-нолики, в которые надо проиграть, Макс в трёх цветах и четыре фокуса Хью Блисса.', feats: ['Квест', 'Графика 320×200', 'Финал сезона'] },
      { id: 'sammax201', name: 'Sam & Max: Ice Station Santa', exe: 'SAMMAX21.EXE', cat: 'games', icon: 'sammax201', app: 'appSamMax201', gm: 'sammax201', ver: '1.0', size: '52 МБ', dev: 'LucasArts', desc: 'Робот-убийца в подарок, Северный полюс, Санта с автоматом, эльф, который не умеет плакать, викторина у Стинки, ринг в груди робота, песенка для демона и три Рождества за тремя порталами.', feats: ['Квест', 'Графика 320×200', 'Начало второго сезона'] },
      { id: 'sammax202', name: 'Sam & Max: Moai Better Blues', exe: 'SAMMAX22.EXE', cat: 'games', icon: 'sammax202', app: 'appSamMax202', gm: 'sammax202', ver: '1.0', size: '54 МБ', dev: 'LucasArts', desc: 'Бермудский портал посреди улицы, остров Пасхи, плачущий и хохочущий истуканы, свидание Линкольна и Сибил, грот молодости, мариачи в треугольнике и вулкан Беллависта с Мистером Лопаткой.', feats: ['Квест', 'Графика 320×200', 'Второй эпизод'] },
      { id: 'bttf', name: 'Back to the Future: The Game', exe: 'BTTF.EXE', cat: 'games', icon: 'bttf', app: 'appBTTF', gm: 'bttf', ver: '1.0', size: '64 МБ', dev: 'Telltale Games', desc: 'Марти Макфлай едет в 1931 год спасать Дока из тюрьмы: юный Эмметт Браун, гангстер Кид Таннен, суп в бочках, ракетный бур и погоня за фургоном на велосипеде с ракетой. Эпизод 1.' },
      { id: 'diablo2', name: 'Diablo II', exe: 'DIABLO2.EXE', cat: 'games', icon: 'diablo2', app: 'appDiablo2', gm: 'diablo2', ver: '1.09', size: '980 МБ', dev: 'Blizzard North', desc: 'Ролевой экшен: семь классов, три ветви навыков, Лагерь разбойниц, Тристрам, Графиня и Андариэль. Случайные подземелья, руны, рунные слова и три уровня сложности.', feats: ['7 классов и 107 навыков', 'Случайные карты каждую игру', 'Руны, самоцветы и рунные слова', 'Норма, Кошмар, Ад и Хардкор'] },
      { id: 'xiii', name: 'XIII', exe: 'XIII.EXE', cat: 'games', icon: 'xiii', app: 'appXiii', gm: 'xiii', ver: '1.0', size: '1.2 ГБ', dev: 'Ubisoft Paris', desc: 'Шутер-комикс: амнезия, заговор Двадцати и татуировка XIII. Десять глав от Брайтон-Бич до тюрьмы Плейн-Рок, скрытность, заложники, метательные ножи и арбалет, панели-врезки при попаданиях и комиксные сцены.' },
      { id: 'maxpayne', name: 'Max Payne', exe: 'MAXPAYNE.EXE', cat: 'games', icon: 'maxpayne', app: 'appMaxPayne', gm: 'maxpayne', ver: '1.0', size: '780 МБ', dev: 'Remedy Entertainment', desc: 'Нуарный экшен от третьего лица: метель в Нью-Йорке, наркотик «Валькирия», семья Пунчинелло и полицейский, которому нечего терять. Замедление времени, прыжки с двумя пистолетами и сюжет в страницах графического романа.', feats: ['Замедление времени', 'Графический роман', '11 уровней первой части', '4 уровня сложности'] },
      { id: 'gtann', name: 'Grand Theft Auto: Нижний Сити', exe: 'GTANN.EXE', cat: 'games', icon: 'gtann', app: 'appGtaNN', gm: 'gtann', ver: '1.0 «Заречье»', size: '1.1 ГБ', dev: 'Rockstar North', desc: 'Открытый трёхмерный Нижний Новгород 2000 года: Ленинский и Автозаводский районы, ГАЗ, Соцгород и набережная Оки. Десять заданий, 24 машины от «Копейки» до «Кабана», такси и милиция.', feats: ['Открытый 3D-город', '24 машины', '10 заданий', 'Радио и пейджер'] },
      { id: 'legion', name: 'Legion Arena', exe: 'ARENA.EXE', cat: 'games', icon: 'legion', app: 'appLegion', gm: 'legion', ver: '1.0', size: '690 МБ', dev: 'Slitherine Software', desc: 'Тактика римских легионов: план битвы, строи и приказы, сотни воинов в реальном времени, 68 битв римской кампании в 14 эпохах, опыт и снаряжение отрядов, Арена и энциклопедия.' },
      { id: 'anotherwar', name: 'Another War', exe: 'AW.EXE', cat: 'games', icon: 'anotherwar', app: 'appAnotherWar', gm: 'anotherwar', ver: '1.0', size: '600 МБ', dev: 'Mirage Interactive', desc: 'Ролевая игра о Второй мировой: оккупированный французский городок Аннет, три героя, пьяный немец Иоганн в напарниках и карта, за которой охотится немецкий генерал. Весь первый акт.', feats: ['Три героя', 'Бой с паузой', 'Дневник Иоганна'] },
      { id: 'fallout', name: 'Fallout', exe: 'FALLOUTW.EXE', cat: 'games', icon: 'fallout', app: 'appFallout', gm: 'fallout', ver: '1.2', size: '590 МБ', dev: 'Interplay Productions', desc: 'Постъядерная ролевая игра: 2161 год, в Убежище 13 сломался водяной чип, и воды осталось на 150 дней. Пустоши Южной Калифорнии, пошаговый бой и концовка по вашим поступкам.', feats: ['S.P.E.C.I.A.L.', 'Пошаговый бой', 'Говорящие головы'] },
      { id: 'falloutzp', name: 'Fallout: Запорожье', exe: 'FALLOUTZP.EXE', cat: 'games', icon: 'falloutzp', app: 'appFalloutZP', gm: 'falloutzp', ver: '1.0 «Вознесенка»', size: '1.6 ГБ', dev: 'Obsidian Entertainment', desc: 'Ролевая игра в открытом мире: Запорожье через двести лет после войны, Вознесеновский район и Хортица, Комендатура, Новая Сечь и АСУ «Плановик-77». Фельдъегерь с пулей в банке ищет перфокарту от плотины.', feats: ['Открытый мир по реальной карте', 'С.Т.Р.Е.Л.А.', '4 финала'] },
      { id: 'plov', name: 'Хаято, Где плов?', exe: 'PLOV.EXE', cat: 'games', icon: 'plov', app: 'appPlov', gm: 'plov', ver: '1.0', size: '36 МБ', dev: 'Kishlak Soft', desc: 'Чайхана во дворе махалли: рассаживайте гостей, держите казан в работе, заваривайте чай и пеките самсу. Десять дней, от открытия до свадебного плова.', feats: ['Казан и тандыр', '10 дней', 'Базар улучшений'] },
      { id: 'sims3', name: 'The Sims 3', exe: 'SIMS3.EXE', cat: 'games', icon: 'sims3', app: 'appSims3', gm: 'sims3', ver: '1.0 «Сансет Вэлли»', size: '1.4 ГБ', dev: 'Maxis', desc: 'Симулятор жизни в открытом городке у моря: редактор семьи, черты характера, желания и мечты, карьеры, навыки, режимы покупки и строительства. Графика в духе первой части.', feats: ['56 черт характера', '11 карьер', 'Открытый город', 'Покупка и строительство'] },
      { id: 'forza', name: 'Forza Horizon: Рига', exe: 'FORZA.EXE', cat: 'games', icon: 'forza', app: 'appForza', gm: 'forza', ver: '1.0 «Рига»', size: '1.3 ГБ', dev: 'Playground Games', desc: 'Гоночный фестиваль в открытой Риге 2000 года: Старый город, мосты через Даугаву, Межапарк, Бикерниеки и пляжи Юрмалы. От Lada 2105 до McLaren F1, шесть браслетов, трюки, сараи с редкими машинами и вид из кабины.', feats: ['33 машины', '29 событий фестиваля', 'Смена дня и ночи, дождь', 'Вид из кабины'] },
      { id: 'gta90', name: "Grand Theft Auto: Екатеринбург '90", exe: 'GTA90.EXE', cat: 'games', icon: 'gta90', app: 'appGta90', gm: 'gta90', ver: '1.1 «Свердловск»', size: '52 МБ', dev: 'DMA Design', desc: 'Угоны, таксофоны и милиция в Свердловске 1990 года: Плотинка, проспект Ленина с трамваями, Дом Советов, цирк и недостроенная телебашня. Три главы до возвращения городу имени Екатеринбург.', feats: ['Реальный центр города', 'Милиция и КГБ', '25 заданий'] },
      { id: 'kotor98', name: 'Star Wars: Knights of the Old Republic 98', exe: 'KOTOR.EXE', cat: 'games', icon: 'kotor98', app: 'appKotor98', gm: 'kotor98', ver: '1.0 «Тарис»', size: '1.2 ГБ', dev: 'BioWare', desc: 'Ролевая игра по вселенной «Звёздных войн»: Тарис, Бастила Шан, «Эбеновый ястреб». Бои с паузой по правилам d20, спутники, пазаак и гонки на свупах.', feats: ['Бои с паузой d20', 'Светлая и Тёмная сторона', 'Пазаак и свупы'] },
      { id: 'cop98', name: 'Зов Припяти 98', exe: 'ZATON.EXE', cat: 'games', icon: 'cop98', app: 'appCop98', gm: 'cop98', ver: '1.0', size: '10 МБ', dev: 'GSC Game World', desc: 'Затон в духе 1999 года: воксельный ландшафт, пре-рендеренные мутанты, выбросы, артефакты и расследование гибели вертолётов «Скат».', feats: ['Открытый мир', 'Выбросы', 'Выборы с последствиями'] },
      { id: 'stalker98', name: 'S.T.A.L.K.E.R. 98', exe: 'XR98.EXE', cat: 'games', icon: 'stalker98', app: 'appStalker98', gm: 'stalker98', ver: '1.0', size: '23 МБ', dev: 'GSC Game World', desc: 'Тень Чернобыля в 3D: Кордон и Свалка, аномалии, артефакты, мутанты, КПК, торговля и сюжет о Стрелке.', feats: ['WebGL-3D', 'Аномалии', 'Смена суток'] },
      { id: 'serioussam', name: 'Serious Sam 98', exe: 'SAM.EXE', cat: 'games', icon: 'serioussam', app: 'appSeriousSam', gm: 'serioussam', ver: '1.0', size: '24 МБ', dev: 'Croteam', desc: 'Древний Египет, орды безголовых камикадзе и огромные открытые арены на WebGL.', feats: ['WebGL-3D', 'Орды врагов', 'Секреты'] },
      { id: 'half-life', name: 'Half-Life 98', exe: 'HL.EXE', cat: 'games', icon: 'half-life', app: 'appHalfLife', gm: 'half-life', ver: '1.0', size: '38 МБ', dev: 'Valve', desc: 'Гордон Фримен, комплекс Чёрная Меза и каскадный резонанс. Монтировка прилагается.', feats: ['Сюжетный шутер', 'Монтировка', 'Black Mesa'] },
      { id: 'diablo', name: 'Diablo', exe: 'DIABLO.EXE', cat: 'games', icon: 'diablo', app: 'appDiablo', gm: 'diablo', ver: '1.09', size: '18 МБ', dev: 'Blizzard North', desc: 'Тристрам, собор и 16 уровней подземелий. «Stay awhile and listen!»', feats: ['Action-RPG', 'Лут и заклинания', 'Подземелья'] },
      { id: 'avatar98', name: 'Аватар: Тихий цикл', exe: 'SILENT.EXE', cat: 'games', icon: 'avatar98', app: 'appAvatar98', gm: 'avatar98', ver: '0.9 demo', size: '1 МБ', dev: 'Студия «Кузница»', desc: 'JRPG с активной шкалой времени: Аватар, рождённый в Народе Огня, и тайна «тишины цикла».', feats: ['ATB-бои и стойки огня', 'Пай Шо', 'Сохранения .SAV'] },
      { id: 'dota', name: 'Dota 98', exe: 'DOTA.EXE', cat: 'games', icon: 'dota', app: 'appDota', gm: 'dota', ver: '6.48', size: '32 МБ', dev: 'IceFrog Clone', desc: 'Силы Света против Сил Тьмы в изометрии: герои, крипы, башни и боты.', feats: ['Изометрия', 'Герои и предметы', 'Боты'] },
      { id: 'lol', name: 'League of Legends 98', exe: 'LOL.EXE', cat: 'games', icon: 'lol', app: 'appLoL', gm: 'lol', ver: '1.0', size: '28 МБ', dev: 'Riot Clone', desc: 'Ущелье призывателей 5 на 5 против ботов: чемпионы, умения QWER и башни.', feats: ['MOBA 5×5', 'Чемпионы', 'Боты'] },
      { id: 'hockey', name: 'NHL 98', exe: 'NHL98.EXE', cat: 'games', icon: 'hockey', app: 'appHockey', gm: 'hockey', ver: '1.0', size: '22 МБ', dev: 'EA Sports', desc: 'Официальный хоккейный симулятор: команды, шайба, силовые приёмы и комментатор.', feats: ['Команды НХЛ', 'Силовые приёмы', 'Турнир'] },
      { id: 'neon-racer', name: 'Midnight Glide', exe: 'GLIDE.EXE', cat: 'games', icon: 'burnout', app: 'appNeonRacer', gm: 'neon-racer', ver: '1.0', size: '26 МБ', dev: '3ADVANCED Interactive', desc: 'Аркадные ночные гонки по неоновому мегаполису: гараж, трафик и соперники.', feats: ['Ночной город', 'Гараж', 'Трафик'] },
      { id: 'wolf3d', name: 'Wolfenstein 3D', exe: 'WOLF3D.EXE', cat: 'games', icon: 'wolf3d', app: 'appWolf3D', gm: 'wolf3d', ver: '1.4', size: '1.2 МБ', dev: 'id Software', desc: 'Побег из замка Вольфенштайн: коридоры, секретные стены и рейкастинг.', feats: ['Рейкастинг', 'Секреты', 'Классика'] },
      { id: 'quest', name: 'LucasQuest 98', exe: 'QUEST.EXE', cat: 'games', icon: 'lucas-quest', app: 'appScummQuest', gm: 'quest', ver: '1.0', size: '9 МБ', dev: 'LucasArts Clone', desc: 'Пиратский квест в стиле SCUMM: глаголы, инвентарь и остроумные диалоги.', feats: ['Point & Click', 'Инвентарь', 'Диалоги'] },
      { id: 'stalker', name: 'S.T.A.L.K.E.R.', exe: 'XR_3DA.EXE', cat: 'games', icon: 'stalker', app: 'appStalker', gm: 'stalker', ver: 'Alpha', size: '48 МБ', dev: 'GSC Game World', desc: 'Тень Чернобыля, альфа-версия 1998 года: Зона, аномалии и артефакты.', feats: ['Зона', 'Аномалии', 'Артефакты'] },
      { id: 'fallout2', name: 'Fallout 2 Demo', exe: 'FALLOUT2.EXE', cat: 'games', icon: 'fallout2', app: 'appFallout2', gm: 'fallout2', ver: 'Demo', size: '31 МБ', dev: 'Black Isle', desc: 'Храм Испытаний: пошаговые бои, очки действия и S.P.E.C.I.A.L.', feats: ['Пошаговый бой', 'S.P.E.C.I.A.L.', 'Храм Испытаний'] },
      { id: 'burnout', name: 'Burnout Drag Racing', exe: 'BURNOUT.EXE', cat: 'games', icon: 'burnout', app: 'appBurnout', gm: 'burnout', ver: 'Demo', size: '14 МБ', dev: 'Bethesda Softworks', desc: 'Симулятор дрэг-рейсинга: тюнинг, переключение передач и четверть мили.', feats: ['Дрэг-рейсинг', 'Тюнинг', 'Четверть мили'] }
    ];

    this.updates = [
      { date: '22.9.01', text: '3A.V4 EXPANSIONS: новый интерфейс портала на Flash 5. Каталог из 40 программ с мгновенным запуском прямо со страницы.' },
      { date: '14.9.01', text: 'В раздел GAMES добавлены Dota 98 и League of Legends 98 — сражения 5×5 против ботов.' },
      { date: '02.9.01', text: 'Serious Sam 98 теперь работает на WebGL. Требуется 3D-ускоритель уровня Voodoo 3 и выше.' },
      { date: '21.8.01', text: 'Blender 1.60 от Not a Number доступен для скачивания: 1.8 МБ, установка за 3 минуты по модему 56K.' },
      { date: '09.8.01', text: 'WinAmp 98: новый скин 3ADVANCED.WSZ в фирменной сине-стальной гамме.' },
      { date: '30.7.01', text: 'Антивирус AVP обновил базы: обнаружение CIH, Melissa, ILOVEYOU и Code Red.' },
      { date: '12.7.01', text: 'Открыт раздел PROFILE: история студии и технологии Progressive Software.' }
    ];
  }

  esc(s) {
    return String(s == null ? '' : s).replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
  }

  icon(name, size) {
    if (typeof window !== 'undefined' && typeof window.getIcon === 'function') return window.getIcon(name, size);
    return `<div class="icon-svg-wrapper" style="width:${size}px;height:${size}px;"></div>`;
  }

  getProgram(id) {
    return this.programs.find(p => p.id === id) || null;
  }

  isInstalled(p) {
    if (!p.gm) return true;
    const gm = typeof window !== 'undefined' ? window.gameManager : null;
    return !gm || gm.isInstalled(p.gm);
  }

  getList(section) {
    if (section === 'games') return this.programs.filter(p => p.cat === 'games');
    const soft = this.programs.filter(p => p.cat !== 'games');
    return this.category === 'all' ? soft : soft.filter(p => p.cat === this.category);
  }

  getSubscribers() {
    try {
      const raw = localStorage.getItem(this.subscribersKey);
      const arr = raw ? JSON.parse(raw) : [];
      return Array.isArray(arr) ? arr : [];
    } catch (e) {
      return [];
    }
  }

  addSubscriber(email) {
    const list = this.getSubscribers();
    if (!list.includes(email)) list.push(email);
    try { localStorage.setItem(this.subscribersKey, JSON.stringify(list)); } catch (e) {}
    return list.length;
  }

  parseUrl(url) {
    const clean = String(url || '').toLowerCase();
    const m = clean.match(/\/(?:program|app)\/([a-z0-9-]+)/);
    if (m && this.getProgram(m[1])) {
      const p = this.getProgram(m[1]);
      return { section: p.cat === 'games' ? 'games' : 'software', programId: p.id };
    }
    if (clean.includes('/profile')) return { section: 'profile' };
    if (clean.includes('/software') || clean.includes('/programs')) return { section: 'software' };
    if (clean.includes('/games')) return { section: 'games' };
    if (clean.includes('/archive') || clean.includes('/updates')) return { section: 'archive' };
    if (clean.includes('/contact')) return { section: 'contact' };
    return { section: 'home' };
  }

  renderSite(url) {
    const { section, programId } = this.parseUrl(url);
    this.section = section;
    if (programId) this.selectedId = programId;
    if ((section === 'software' || section === 'games')) {
      const list = this.getList(section);
      const sel = this.getProgram(this.selectedId);
      if (!sel || !list.includes(sel)) this.selectedId = list.length ? list[0].id : null;
    }

    const intro = !this.introShown;
    this.introShown = true;

    return `
      <div class="adv-root${this.motion ? '' : ' adv-still'}">
        ${intro ? this.renderPreloader() : ''}
        <div class="adv-page">
          <div class="adv-topstrip"><div class="adv-topstrip-inner"></div></div>
          ${this.renderHeader()}
          ${this.renderNav(section)}
          <div class="adv-stage">
            ${this.renderHero(section)}
            <div class="adv-stage-bar">
              <span><span class="adv-arrow-down">&#8595;</span> <a class="adv-scroll-link" data-adv-scroll="1">SCROLL.EXTENDED.CONTENT</a></span>
              <a class="adv-motion-toggle">${this.motion ? 'AMBIENCE.MUTE' : 'AMBIENCE.PLAY'} <span class="adv-tiny-arrow">&#9658;</span></a>
            </div>
          </div>
          <div class="adv-body">
            ${this.renderBody(section)}
          </div>
          ${this.renderFooter()}
        </div>
      </div>
    `;
  }

  renderPreloader() {
    return `
      <div class="adv-preloader">
        <div class="adv-preloader-box">
          <div class="adv-preloader-logo">${this.renderLogoMark(30)} 3ADVANCED</div>
          <div class="adv-preloader-label">LOADING.INTERFACE.MODULE // 3A.V4</div>
          <div class="adv-preloader-bar"><div class="adv-preloader-fill"></div></div>
          <div class="adv-preloader-sub">FLASH 5 PLUG-IN DETECTED &nbsp;//&nbsp; 56K OPTIMIZED</div>
        </div>
      </div>
    `;
  }

  renderLogoMark(size) {
    return `
      <svg class="adv-logomark" width="${size}" height="${size}" viewBox="0 0 32 32" xmlns="http://www.w3.org/2000/svg">
        <circle cx="16" cy="16" r="14.5" fill="none" stroke="#e8eefc" stroke-width="2"/>
        <circle cx="16" cy="16" r="11" fill="#1c2c55" stroke="#9fb3e0" stroke-width="1"/>
        <rect x="9" y="10" width="14" height="3" fill="#e8eefc"/>
        <rect x="9" y="14.5" width="14" height="3" fill="#e8eefc"/>
        <rect x="9" y="19" width="14" height="3" fill="#e8eefc"/>
        <rect x="9" y="10" width="3" height="12" fill="#1c2c55"/>
      </svg>
    `;
  }

  renderHeader() {
    return `
      <div class="adv-header">
        <a class="adv-logo" data-url="${this.baseUrl}">
          ${this.renderLogoMark(34)}
          <span class="adv-logo-text">
            <span class="adv-logo-name">3ADVANCED SOFTWORKS<sup>&trade;</sup></span>
            <span class="adv-logo-sub">PROGRESSIVE SOFTWARE TECHNOLOGY</span>
          </span>
        </a>
        <div class="adv-header-deco">
          <div class="adv-header-code">SYS.ID 0x3A04 // WIN98.PLATFORM<br>MODULES.ONLINE: ${this.programs.length}</div>
          <div class="adv-header-rings"><span></span><span></span><span></span></div>
        </div>
      </div>
    `;
  }

  renderNav(section) {
    const items = [
      { id: 'profile', label: 'PROFILE' },
      { id: 'software', label: 'SOFTWARE' },
      { id: 'games', label: 'GAMES' },
      { id: 'archive', label: 'ARCHIVE' },
      { id: 'contact', label: 'CONTACT' }
    ];
    const crumb = section === 'home' ? 'EXPANSIONS' : section.toUpperCase();
    return `
      <div class="adv-nav">
        <a class="adv-nav-crumb" data-url="${this.baseUrl}"><span>&raquo;</span> 3A.V4.2001 // ${crumb}</a>
        ${items.map(i => `<a class="adv-nav-item${section === i.id ? ' active' : ''}" data-url="${this.baseUrl}/${i.id}">${i.label}</a>`).join('')}
      </div>
    `;
  }

  renderHero(section) {
    if ((section === 'software' || section === 'games') && this.getProgram(this.selectedId)) {
      return this.renderProgramHero(this.getProgram(this.selectedId), section);
    }
    const headings = {
      home: ['3A.VFOUR.EXPANSIONS', 'NEW.METHODS.OF.COMPUTING'],
      profile: ['3A.PROFILE.MODULE', 'WHO.WE.ARE // SINCE.1998'],
      archive: ['3A.ARCHIVE.MODULE', 'TRANSMISSIONS.FROM.THE.PAST'],
      contact: ['3A.CONTACT.MODULE', 'OPEN.CHANNEL.TRANSMISSION']
    };
    const [h1, h2] = headings[section] || headings.home;
    return `
      <div class="adv-hero">
        ${this.renderHeroArt()}
        <div class="adv-hero-corner">NEW.MEDIA<br><span>&#9632;&#9632;&#9633; 0110 1001<br>&#9632;&#9633;&#9633; 3A-V4-EXP</span></div>
        <div class="adv-hero-title">
          <div class="adv-hero-h1"><span class="adv-chev">&laquo;</span> ${h1}</div>
          <div class="adv-hero-h2">${h2}</div>
          <div class="adv-hero-chevrons">&#8744;<br>&#8744;</div>
        </div>
        <div class="adv-hero-rings"><span></span><span></span><span></span><span></span></div>
      </div>
    `;
  }

  renderHeroArt() {
    return `
      <div class="adv-art">
        <div class="adv-art-sky"></div>
        <div class="adv-art-cloud c1"></div>
        <div class="adv-art-cloud c2"></div>
        <div class="adv-art-beam b1"></div>
        <div class="adv-art-beam b2"></div>
        <div class="adv-art-beam b3"></div>
        <div class="adv-art-beam b4"></div>
        <div class="adv-art-grille"></div>
        <div class="adv-art-scan"></div>
        <div class="adv-art-grid"></div>
      </div>
    `;
  }

  renderProgramHero(p, section) {
    const list = this.getList(section);
    const idx = list.indexOf(p);
    const prev = list[(idx - 1 + list.length) % list.length];
    const next = list[(idx + 1) % list.length];
    const installed = this.isInstalled(p);
    const catLabel = p.cat === 'games' ? 'ENTERTAINMENT' : (this.categories.find(c => c.id === p.cat) || {}).label;
    return `
      <div class="adv-hero adv-hero-program">
        ${this.renderHeroArt()}
        <div class="adv-prog-visual">
          <div class="adv-prog-orbit"><span></span><span></span></div>
          <div class="adv-prog-icon">${this.icon(p.icon, 72)}</div>
          <div class="adv-prog-exe">C:\\PROGRAM FILES\\${this.esc(p.exe)}</div>
        </div>
        <div class="adv-prog-info">
          <div class="adv-hero-h1"><span class="adv-chev">&laquo;</span> ${this.esc(p.exe.replace(/\.EXE$/, '').toUpperCase())}.MODULE</div>
          <div class="adv-hero-h2">${this.esc(p.name)} // ${this.esc(catLabel)}</div>
          <p class="adv-prog-desc">${this.esc(p.desc)}</p>
          <table class="adv-spec">
            <tr><td>VERSION</td><td>${this.esc(p.ver)}</td><td>SIZE</td><td>${this.esc(p.size)}</td></tr>
            <tr><td>DEVELOPER</td><td>${this.esc(p.dev)}</td><td>STATUS</td><td class="${installed ? 'adv-ok' : 'adv-warn'}">${installed ? 'INSTALLED' : 'NOT.INSTALLED'}</td></tr>
          </table>
          <ul class="adv-feats">${p.feats.map(f => `<li><span class="adv-bullet"></span>${this.esc(f)}</li>`).join('')}</ul>
          <div class="adv-prog-actions">
            <button class="adv-btn adv-btn-primary adv-launch" data-id="${p.id}">${installed ? '&#9658; ЗАПУСТИТЬ' : '&#8595; УСТАНОВИТЬ'}</button>
            <a class="adv-btn" data-url="${this.baseUrl}/program/${prev.id}">&laquo; PREV</a>
            <a class="adv-btn" data-url="${this.baseUrl}/program/${next.id}">NEXT &raquo;</a>
            <span class="adv-prog-count">${String(idx + 1).padStart(2, '0')} / ${String(list.length).padStart(2, '0')}</span>
          </div>
        </div>
      </div>
    `;
  }

  panel(icon, title, body, extraClass = '') {
    return `
      <div class="adv-panel ${extraClass}">
        <div class="adv-panel-head"><span class="adv-panel-ico">${icon}</span>${title}</div>
        <div class="adv-panel-body">${body}</div>
      </div>
    `;
  }

  subHead(title) {
    return `<div class="adv-subhead">${title}</div>`;
  }

  renderBody(section) {
    switch (section) {
      case 'software':
      case 'games': return this.renderCatalog(section);
      case 'profile': return this.renderProfile();
      case 'archive': return this.renderArchive();
      case 'contact': return this.renderContact();
      default: return this.renderHome();
    }
  }

  renderHome() {
    const feat = this.getProgram('blender');
    const updates = this.updates.slice(this.updatesOffset, this.updatesOffset + 3);
    return `
      <div class="adv-row adv-row-main">
        ${this.panel('F', 'FEATURE', `
          <div class="adv-feature">
            <a class="adv-boxart" data-url="${this.baseUrl}/program/${feat.id}">
              <div class="adv-boxart-top">${this.icon(feat.icon, 30)}<span>Blender</span></div>
              <div class="adv-boxart-mid">1.60 &nbsp;3D</div>
              <div class="adv-boxart-btn">VIEW</div>
            </a>
            <div class="adv-feature-text">
              <div class="adv-label"><span class="adv-led"></span> AVAILABLE FOR DOWNLOAD</div>
              КОМПАКТНЫЙ 3D-ПАКЕТ ОТ NOT A NUMBER. МОДЕЛИРОВАНИЕ, OPENGL-ВЬЮПОРТ И РЕНДЕР — ВСЕГО 1.8 МБ.
              БЕСПЛАТНАЯ ВЕРСИЯ ДЛЯ WIN 98 УСТАНАВЛИВАЕТСЯ ПРЯМО С ЭТОЙ СТРАНИЦЫ.
            </div>
          </div>
        `)}
        ${this.panel('S', 'SUB.DATA', `
          <div class="adv-subdata">
            <div class="adv-subdata-title">NOW AVAILABLE: "EXPANSIONS" SOFTWARE CATALOG</div>
            <div class="adv-subdata-row">
              <a class="adv-thumb" data-url="${this.baseUrl}/software">${this.icon('programs', 22)}</a>
              <div class="adv-links">
                <a data-url="${this.baseUrl}/software"><span class="adv-mini-bar"></span> SOFTWARE // ${this.programs.filter(p => p.cat !== 'games').length} MODULES</a>
                <a data-url="${this.baseUrl}/games"><span class="adv-mini-bar"></span> GAMES // ${this.programs.filter(p => p.cat === 'games').length} MODULES</a>
              </div>
            </div>
            <div class="adv-subdata-title">3ADVANCED // WINAMP SKIN</div>
            <div class="adv-subdata-row">
              <a class="adv-thumb adv-thumb-wide" data-url="${this.baseUrl}/program/winamp">${this.icon('winamp', 22)}</a>
              <div class="adv-links">
                <a class="adv-launch" data-id="winamp"><span class="adv-mini-bar"></span> DOWNLOAD // AUTOINSTALL</a>
              </div>
            </div>
          </div>
        `)}
        ${this.panel('U', 'UPDATES', `
          <div class="adv-updates">
            <div class="adv-updates-list">
              ${updates.map(u => `<div class="adv-update"><div class="adv-update-date">${u.date}</div>${this.esc(u.text).toUpperCase()}</div>`).join('')}
            </div>
            <div class="adv-updates-scroll">
              <a class="adv-scroll-btn adv-upd-up" title="Вверх">&#9650;</a>
              <div class="adv-scroll-track"><div class="adv-scroll-thumb" style="top:${Math.round(this.updatesOffset / Math.max(1, this.updates.length - 3) * 100)}%"></div></div>
              <a class="adv-scroll-btn adv-upd-down" title="Вниз">&#9660;</a>
            </div>
          </div>
        `)}
      </div>
      <div class="adv-row adv-row-sub">
        <div class="adv-cell">
          ${this.subHead('MAILING LIST')}
          <div class="adv-cell-body">
            <div class="adv-label">ENTER EMAIL ADDRESS:</div>
            <div class="adv-mail">
              <input class="adv-input adv-mail-input" type="text" value="emailaddress@domain.com">
              <button class="adv-btn adv-mail-submit">SUBMIT</button>
            </div>
            <div class="adv-mail-status"></div>
          </div>
        </div>
        <div class="adv-cell">
          ${this.subHead('EQUIPMENT')}
          <div class="adv-cell-body">
            <div class="adv-label">3ADVANCED SYSTEM // OFFICE // MEDIA</div>
            <div class="adv-subdata-row">
              <a class="adv-thumb adv-thumb-wide" data-url="${this.baseUrl}/software">${this.icon('my-computer', 22)}</a>
              <div class="adv-links">
                <a class="adv-cat-link" data-cat="system"><span class="adv-mini-bar"></span> // SYSTEM.CORE UTILITIES</a>
                <a class="adv-cat-link" data-cat="graphics"><span class="adv-mini-bar"></span> // 3A.GRAPHIC.LAB</a>
              </div>
            </div>
          </div>
        </div>
        <div class="adv-cell">
          ${this.subHead('TRANSMISSIONS')}
          <div class="adv-cell-body adv-links adv-links-right">
            <a data-url="${this.baseUrl}/archive"><span class="adv-mini-bar"></span> // VIEW UPDATES ARCHIVE MODULE</a>
            <a data-url="${this.baseUrl}/contact"><span class="adv-mini-bar"></span> // EMPLOYMENT OPPORTUNITIES</a>
            <a data-url="http://www.retro-web.net"><span class="adv-mini-bar"></span> // PREVIOUS VERSIONS OF 3ADVANCED</a>
          </div>
        </div>
      </div>
    `;
  }

  renderCatalog(section) {
    const list = this.getList(section);
    const cats = section === 'games' ? '' : `
      <div class="adv-cats">
        ${this.categories.map(c => `<a class="adv-cat-link${this.category === c.id ? ' active' : ''}" data-cat="${c.id}" title="${this.esc(c.ru)}">${c.label}</a>`).join('')}
      </div>`;
    const installedCount = list.filter(p => this.isInstalled(p)).length;
    return `
      <div class="adv-row">
        ${this.panel(section === 'games' ? 'G' : 'M', section === 'games' ? 'GAMES.MODULES // РАЗВЛЕЧЕНИЯ' : 'SOFTWARE.MODULES // ПРОГРАММЫ', `
          ${cats}
          <div class="adv-grid">
            ${list.map(p => {
              const inst = this.isInstalled(p);
              return `
                <a class="adv-tile${p.id === this.selectedId ? ' active' : ''}${inst ? '' : ' adv-tile-missing'}" data-url="${this.baseUrl}/program/${p.id}" title="${this.esc(p.desc)}">
                  <span class="adv-tile-icon">${this.icon(p.icon, 32)}</span>
                  <span class="adv-tile-name">${this.esc(p.name)}</span>
                  <span class="adv-tile-exe">${this.esc(p.exe)}</span>
                  <span class="adv-tile-status">${inst ? '<span class="adv-led"></span> READY' : '<span class="adv-led off"></span> SETUP'}</span>
                </a>`;
            }).join('')}
          </div>
          <div class="adv-catalog-foot">MODULES: ${list.length} &nbsp;//&nbsp; INSTALLED: ${installedCount} &nbsp;//&nbsp; ВЫБЕРИТЕ МОДУЛЬ, ЧТОБЫ УВИДЕТЬ ПОДРОБНОСТИ</div>
        `, 'adv-panel-wide')}
      </div>
    `;
  }

  renderProfile() {
    const counts = this.categories.filter(c => c.id !== 'all').map(c => ({ c, n: this.programs.filter(p => p.cat === c.id).length }));
    counts.push({ c: { label: 'ENTERTAINMENT', ru: 'Игры' }, n: this.programs.filter(p => p.cat === 'games').length });
    const max = Math.max(...counts.map(x => x.n));
    return `
      <div class="adv-row">
        ${this.panel('P', 'PROFILE // О СТУДИИ', `
          <div class="adv-text">
            <p><b>3ADVANCED SOFTWORKS</b> — ЦИФРОВАЯ СТУДИЯ, КОТОРАЯ С 1998 ГОДА СОБИРАЕТ, ТЕСТИРУЕТ И КАТАЛОГИЗИРУЕТ
            ПРОГРАММЫ ДЛЯ ПЛАТФОРМЫ WIN 98.</p>
            <p>ЭТОТ ПОРТАЛ — ЖИВАЯ КАРТА ВАШЕЙ СИСТЕМЫ: КАЖДЫЙ МОДУЛЬ КАТАЛОГА ЗАПУСКАЕТСЯ ПРЯМО ИЗ ОКНА БРАУЗЕРА,
            А НЕУСТАНОВЛЕННЫЕ ПРОГРАММЫ СТАВЯТСЯ ЧЕРЕЗ МАСТЕР УСТАНОВКИ ОДНИМ НАЖАТИЕМ.</p>
            <p>ФИЛОСОФИЯ «PROGRESSIVE SOFTWARE TECHNOLOGY»: СТАЛЬНОЙ СИНИЙ, ТОНКИЕ ЛИНИИ, ТОЧНЫЕ ДАННЫЕ И НИ ОДНОГО ЛИШНЕГО ПИКСЕЛЯ.</p>
          </div>
        `)}
        ${this.panel('D', 'SYSTEM.DATA // СТАТИСТИКА', `
          <div class="adv-bars">
            ${counts.map(x => `
              <div class="adv-bar-row" title="${this.esc(x.c.ru)}">
                <span class="adv-bar-label">${x.c.label}</span>
                <span class="adv-bar"><span style="width:${Math.round(x.n / max * 100)}%"></span></span>
                <span class="adv-bar-num">${String(x.n).padStart(2, '0')}</span>
              </div>`).join('')}
          </div>
        `)}
        ${this.panel('T', 'TECHNOLOGY', `
          <div class="adv-links">
            <span><span class="adv-mini-bar"></span> FLASH 5 // ACTIONSCRIPT</span>
            <span><span class="adv-mini-bar"></span> DHTML // JAVASCRIPT 1.3</span>
            <span><span class="adv-mini-bar"></span> OPTIMIZED FOR IE 5.0 // 800×600</span>
            <span><span class="adv-mini-bar"></span> 56K MODEM FRIENDLY</span>
            <a data-url="${this.baseUrl}/software"><span class="adv-mini-bar"></span> ОТКРЫТЬ КАТАЛОГ ПРОГРАММ &raquo;</a>
          </div>
        `)}
      </div>
    `;
  }

  renderArchive() {
    return `
      <div class="adv-row">
        ${this.panel('A', 'UPDATES.ARCHIVE // ВСЕ НОВОСТИ', `
          <div class="adv-timeline">
            ${this.updates.map(u => `
              <div class="adv-tl-item">
                <span class="adv-tl-date">${u.date}</span>
                <span class="adv-tl-dot"></span>
                <span class="adv-tl-text">${this.esc(u.text)}</span>
              </div>`).join('')}
          </div>
        `, 'adv-panel-wide')}
      </div>
    `;
  }

  renderContact() {
    return `
      <div class="adv-row">
        ${this.panel('C', 'CONTACT // ОБРАТНАЯ СВЯЗЬ', `
          <div class="adv-form">
            <label>NAME.ID</label><input class="adv-input adv-contact-name" type="text" value="">
            <label>SUBJECT</label>
            <select class="adv-input adv-contact-subject">
              <option>Вопрос о программе</option>
              <option>Сообщить об ошибке</option>
              <option>Вакансии (Employment)</option>
            </select>
            <label>MESSAGE</label><textarea class="adv-input adv-contact-msg" rows="4"></textarea>
            <div><button class="adv-btn adv-btn-primary adv-contact-send">TRANSMIT &raquo;</button> <span class="adv-contact-status"></span></div>
          </div>
        `)}
        ${this.panel('L', 'LOCATION', `
          <div class="adv-links">
            <span><span class="adv-mini-bar"></span> 3ADVANCED SOFTWORKS HQ</span>
            <span><span class="adv-mini-bar"></span> C:\\WINDOWS\\SYSTEM // SECTOR 3A</span>
            <span><span class="adv-mini-bar"></span> ICQ UIN: 3345-1998</span>
            <span><span class="adv-mini-bar"></span> INFO@3ADVANCED.COM</span>
          </div>
        `)}
      </div>
    `;
  }

  renderFooter() {
    return `
      <div class="adv-footer">
        <span>(C) 2001 3ADVANCED SOFTWORKS &nbsp;//&nbsp; <a data-url="${this.baseUrl}/profile">CONDITIONS OF USE</a> &nbsp;//&nbsp; <a data-url="${this.baseUrl}/contact">PRIVACY POLICY</a> &nbsp;//&nbsp; <a href="mailto:studio@3advanced.com">STUDIO@3ADVANCED.COM</a></span>
        <span>HOSTING PARTNER: <b class="adv-host">[geo]</b></span>
      </div>
    `;
  }

  launch(id) {
    const p = this.getProgram(id);
    if (!p) return false;
    if (window.soundSys && window.soundSys.playClick) window.soundSys.playClick();
    if (!this.isInstalled(p)) {
      if (window.gameManager && window.gameManager.openSetupWizard) window.gameManager.openSetupWizard(p.gm);
      return true;
    }
    const app = window[p.app];
    if (app && typeof app.open === 'function') {
      app.open(...(p.args || []));
      return true;
    }
    if (window.winManager && window.winManager.openDialog) {
      window.winManager.openDialog({ title: '3ADVANCED', icon: 'error', message: `Модуль ${p.exe} не найден в системе.` });
    }
    return false;
  }

  attachEvents(win, container) {
    const rerender = () => {
      if (window.appIE) window.appIE.renderPage(win, window.appIE.currentUrl);
    };

    container.querySelectorAll('.adv-launch').forEach(btn => {
      btn.addEventListener('click', (e) => {
        e.preventDefault();
        this.launch(btn.dataset.id);
      });
    });

    container.querySelectorAll('.adv-cat-link').forEach(link => {
      link.addEventListener('click', (e) => {
        e.preventDefault();
        this.category = link.dataset.cat;
        if (window.appIE) window.appIE.navigate(win, `${this.baseUrl}/software`);
      });
    });

    const toggle = container.querySelector('.adv-motion-toggle');
    if (toggle) {
      toggle.addEventListener('click', () => {
        this.motion = !this.motion;
        const root = container.querySelector('.adv-root');
        if (root) root.classList.toggle('adv-still', !this.motion);
        toggle.firstChild.textContent = this.motion ? 'AMBIENCE.MUTE ' : 'AMBIENCE.PLAY ';
      });
    }

    const scroll = container.querySelector('[data-adv-scroll]');
    if (scroll) {
      scroll.addEventListener('click', () => {
        const body = container.querySelector('.adv-body');
        if (body && body.scrollIntoView) body.scrollIntoView({ behavior: 'smooth', block: 'start' });
      });
    }

    const up = container.querySelector('.adv-upd-up');
    const down = container.querySelector('.adv-upd-down');
    if (up) up.addEventListener('click', () => { if (this.updatesOffset > 0) { this.updatesOffset--; rerender(); } });
    if (down) down.addEventListener('click', () => { if (this.updatesOffset < this.updates.length - 3) { this.updatesOffset++; rerender(); } });

    const mailInput = container.querySelector('.adv-mail-input');
    const mailBtn = container.querySelector('.adv-mail-submit');
    const mailStatus = container.querySelector('.adv-mail-status');
    if (mailInput) {
      mailInput.addEventListener('focus', () => { if (mailInput.value === 'emailaddress@domain.com') mailInput.value = ''; });
    }
    if (mailBtn && mailInput && mailStatus) {
      const submit = () => {
        const v = mailInput.value.trim();
        if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v) || v === 'emailaddress@domain.com') {
          mailStatus.textContent = 'ERROR // НЕВЕРНЫЙ АДРЕС';
          mailStatus.className = 'adv-mail-status adv-warn';
          return;
        }
        const n = this.addSubscriber(v);
        mailStatus.textContent = `SUBSCRIBED // ПОДПИСЧИК #${String(n + 4180).padStart(5, '0')}`;
        mailStatus.className = 'adv-mail-status adv-ok';
        if (window.soundSys && window.soundSys.playDing) window.soundSys.playDing();
      };
      mailBtn.addEventListener('click', submit);
      mailInput.addEventListener('keydown', (e) => { if (e.key === 'Enter') submit(); });
    }

    const send = container.querySelector('.adv-contact-send');
    if (send) {
      send.addEventListener('click', () => {
        const msg = container.querySelector('.adv-contact-msg');
        const status = container.querySelector('.adv-contact-status');
        if (!msg || !status) return;
        if (!msg.value.trim()) {
          status.textContent = 'ERROR // ПУСТОЕ СООБЩЕНИЕ';
          status.className = 'adv-contact-status adv-warn';
          return;
        }
        msg.value = '';
        status.textContent = 'TRANSMISSION COMPLETE // СПАСИБО!';
        status.className = 'adv-contact-status adv-ok';
      });
    }
  }
}

window.advancedSite = new AdvancedSite();
