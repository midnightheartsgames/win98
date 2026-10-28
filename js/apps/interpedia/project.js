window.interpediaReg('win98clone', 'project', {
  title: 'Проект «Microslop Win 98 Web Clone»',
  hatnote: 'Статья портала «Наш проект» — о компьютере и системе, на которых вы читаете Интерпедию.',
  infobox: {
    title: 'Microslop Win 98 Web Clone',
    badgeText: 'Интерактивная реконструкция',
    fields: [
      { label: 'Тип', value: 'реконструкция операционной системы в браузере' },
      { label: 'Технологии', value: 'HTML, CSS, JavaScript без библиотек' },
      { label: 'Настольная версия', value: 'отдельное приложение для Win' },
      { label: 'Языки интерфейса', value: 'русский, английский' },
      { label: 'Загрузка', value: '[[bios|Award BIOS]] → экран запуска → рабочий стол' },
      { label: 'Браузер', value: '[[ie5|Internet Explorer 5.0]] с десятками сайтов' },
      { label: 'Игры', value: 'покупаются и скачиваются через Steam' },
      { label: 'Помощник', value: '[[clippy|Скрепыш]]' }
    ]
  },
  lead: `<strong>Microslop Win 98 Web Clone</strong> — интерактивная реконструкция операционной системы [[windows98|Microslop Win 98]], работающая прямо в браузере. Это не картинка и не видеозапись: окна перетаскиваются и сворачиваются, программы открываются и сохраняют файлы, а при включении компьютер проходит проверку [[bios|BIOS]] и загружает рабочий стол.

Проект воссоздаёт не только систему, но и её эпоху: стандартные программы, [[ie5|Internet Explorer]] с сайтами конца 1990-х, помощника [[clippy|Скрепыша]], проигрыватель Winamp и магазин игр Steam. Интерпедия, которую вы читаете, — один из сайтов этого мира, а её портал «Наш проект» рассказывает о программах этого компьютера.`,
  sections: [
    { id: 'goals', title: 'Цели', content: `Проект стремится передать ощущение работы за домашним компьютером 1998–1999 годов: звук загрузки, синие экраны настроек BIOS, щелчок кнопки «Пуск», ожидание модемного соединения. Каждая программа делается как самостоятельное приложение со своим интерфейсом и поведением, а внешний вид следует языку Win 98 — серым рамкам, объёмным кнопкам и пиксельным значкам.` },
    { id: 'structure', title: 'Устройство', content: `<ul>
<li><strong>Диспетчер окон</strong> — перетаскивание, сворачивание, развёртывание, панель задач с кнопками окон и часами.</li>
<li><strong>Файловая система</strong> — виртуальный диск C: с папками «Мои документы», «Program Files» и системными каталогами; программы сохраняют и открывают файлы, а «Корзина» хранит удалённое.</li>
<li><strong>Два языка</strong> — интерфейс переключается между русским и английским.</li>
<li><strong>Звук</strong> — системные звуки и общий микшер громкости для всех программ.</li>
<li><strong>Настольная версия</strong> — систему можно запустить и как отдельное приложение, без браузера.</li>
</ul>` },
    { id: 'boot', title: 'Загрузка', content: `При включении на экране появляется [[bios|Award Modular BIOS v4.51PG]]: подсчёт памяти, определение дисков и приглашение нажать Del для входа в настройки. Из BIOS можно изменить параметры, установить пароль или испортить загрузку неудачной настройкой. Затем идёт заставка системы и рабочий стол со значками «Мой компьютер», «Корзина» и «Internet Explorer».` },
    { id: 'apps', title: 'Программы', content: `<table class="interpedia-wikitable">
<tr><th>Группа</th><th>Программы</th></tr>
<tr><td>Стандартные</td><td>[[notepad|Блокнот]], [[wordpad|WordPad]], [[mspaint|Paint]], [[calc|Калькулятор]], звукозапись, просмотр изображений</td></tr>
<tr><td>Игры</td><td>[[minesweeper|Сапёр]], пасьянсы «Косынка» и FreeCell, [[pinball|3D Pinball]]</td></tr>
<tr><td>Служебные</td><td>Проводник, поиск, диспетчер задач, редактор реестра, дефрагментация, панель управления, заставки</td></tr>
<tr><td>Сеть</td><td>[[ie5|Internet Explorer]], [[netscape|Netscape]], почта, [[icq|ICQ]], [[dialup|удалённый доступ]]</td></tr>
<tr><td>Мультимедиа и графика</td><td>[[winamp|Winamp]], видеопроигрыватель, [[blender|Blender 1.60]], графический редактор со слоями</td></tr>
<tr><td>Прочее</td><td>[[avp|антивирус]], [[totalcommander|Win Commander]], [[winrar|WinRAR]], диск журнала «Игромания» с демоверсиями</td></tr>
</table>` },
    { id: 'web', title: 'Сайты', content: `Internet Explorer открывает десятки сайтов, воссоздающих Сеть конца 1990-х: Интерпедию, поисковики «Яндекс» и «Рамблер», [[geocities|GeoCities]], шлюз [[fidonet|ФидоНета]], библиотеку Мошкова, журнал «Игромания», архив скинов [[winamp|Winamp]], центр [[y2k|проблемы 2000 года]], видеосайт YouVid, фан-клуб [[digicharat|Di Gi Charat]], сайт [[blender|Blender]], сайт Steam и многие другие. Многие из них объединены в [[webring|кольцо ретро-сайтов]].` },
    { id: 'steam', title: 'Игры и Steam', content: `Игры в системе не установлены заранее. Сначала пользователь скачивает клиент Steam с сайта www.steampowered.com в Internet Explorer, затем покупает игры в каталоге, скачивает и устанавливает их. У каждой игры есть страница с описанием и снимками экрана. Исключение — демоверсии с компакт-диска журнала «Игромания» (диск D:), которые устанавливаются с диска.

Среди игр каталога Steam — [[wolf3d|Wolfenstein 3D]], [[diablo|Diablo]] и [[doom|DOOM 98]]. На диске «Игромании» лежат демоверсии [[halflife|Half-Life 98]], квеста [[scumm|LucasQuest 98]] и гонки [[neonracer|Midnight Glide]].` },
    { id: 'clippy', title: 'Скрепыш', content: `На рабочем столе живёт [[clippy|Скрепыш]]. Он комментирует открытые программы и посещённые сайты, отвечает на вопросы, ведёт беседы с выбором реплик, переодевается в наряды с сайта «Скрепыш '98» и, как положено, иногда предлагает помощь в самый неподходящий момент.` }
  ],
  seeAlso: ['windows98', 'bios', 'clippy', 'ie5', 'interpedia', 'samandmax', 'kovcheg', 'steam'],
  references: [
    'Документация проекта Microslop Win 98 Web Clone.',
    'Microslop Win 98 Resource Kit. — Microslop Press, 1998.'
  ],
  links: [['http://www.microslop.com', 'Портал Microslop Win 98'], ['http://www.steampowered.com', 'Steam'], ['http://www.3advanced.com', '3ADVANCED: каталог программ системы']],
  categories: ['Наш проект', 'Операционные системы', 'Win 9x']
}, {
  title: 'The Microslop Win 98 Project',
  hatnote: 'An article from the "Our Project" portal, about the computer and system you are reading Interpedia on.',
  infobox: {
    title: 'Microslop Win 98 Web Clone',
    badgeText: 'Interactive reconstruction',
    fields: [
      { label: 'Type', value: 'operating system reconstruction in the browser' },
      { label: 'Technology', value: 'HTML, CSS, JavaScript without libraries' },
      { label: 'Desktop version', value: 'a standalone Win application' },
      { label: 'Interface languages', value: 'Russian, English' },
      { label: 'Boot', value: '[[bios|Award BIOS]] → startup screen → desktop' },
      { label: 'Browser', value: '[[ie5|Internet Explorer 5.0]] with dozens of sites' },
      { label: 'Games', value: 'bought and downloaded through Steam' },
      { label: 'Assistant', value: '[[clippy|Clippy]]' }
    ]
  },
  lead: `<strong>Microslop Win 98 Web Clone</strong> is an interactive reconstruction of the [[windows98|Microslop Win 98]] operating system that runs right in the browser. It is not a picture or a video: windows drag and minimize, programs open and save files, and at power-on the computer runs a [[bios|BIOS]] check and loads the desktop.

The project recreates not just the system but its era: the accessories, [[ie5|Internet Explorer]] with late-1990s websites, the [[clippy|Clippy]] assistant, the Winamp player and the Steam game store. Interpedia, which you are reading, is one of the sites of this world, and its "Our Project" portal describes the programs on this computer.`,
  sections: [
    { id: 'goals', title: 'Goals', content: `The project aims to capture the feel of a 1998–1999 home computer: the startup sound, the blue BIOS setup screens, the click of the Start button, the wait for a modem connection. Each program is built as a standalone application with its own interface and behavior, and the look follows the Win 98 visual language of gray frames, beveled buttons and pixel icons.` },
    { id: 'structure', title: 'Structure', content: `<ul>
<li><strong>Window manager</strong>: dragging, minimizing, maximizing, a taskbar with window buttons and a clock.</li>
<li><strong>File system</strong>: a virtual C: drive with My Documents, Program Files and system folders; programs save and open files, and the Recycle Bin keeps deleted items.</li>
<li><strong>Two languages</strong>: the interface switches between Russian and English.</li>
<li><strong>Sound</strong>: system sounds and a shared volume mixer for all programs.</li>
<li><strong>Desktop version</strong>: the system can also run as a standalone application without a browser.</li>
</ul>` },
    { id: 'boot', title: 'Boot', content: `At power-on the screen shows [[bios|Award Modular BIOS v4.51PG]]: the memory count, drive detection and the prompt to press Del for setup. In the BIOS you can change settings, set a password or break the boot with a bad setting. Then comes the system splash and the desktop with My Computer, the Recycle Bin and Internet Explorer.` },
    { id: 'apps', title: 'Programs', content: `<table class="interpedia-wikitable">
<tr><th>Group</th><th>Programs</th></tr>
<tr><td>Accessories</td><td>[[notepad|Notepad]], [[wordpad|WordPad]], [[mspaint|Paint]], [[calc|Calculator]], Sound Recorder, image viewer</td></tr>
<tr><td>Games</td><td>[[minesweeper|Minesweeper]], Solitaire and FreeCell, [[pinball|3D Pinball]]</td></tr>
<tr><td>System tools</td><td>Explorer, Find, Task Manager, Registry Editor, Defragmenter, Control Panel, screensavers</td></tr>
<tr><td>Network</td><td>[[ie5|Internet Explorer]], [[netscape|Netscape]], mail, [[icq|ICQ]], [[dialup|Dial-Up Networking]]</td></tr>
<tr><td>Multimedia and graphics</td><td>[[winamp|Winamp]], video player, [[blender|Blender 1.60]], a layered image editor</td></tr>
<tr><td>Other</td><td>[[avp|antivirus]], [[totalcommander|Win Commander]], [[winrar|WinRAR]], the Igromania magazine CD with demos</td></tr>
</table>` },
    { id: 'web', title: 'Websites', content: `Internet Explorer opens dozens of sites recreating the late-1990s Web: Interpedia, the Yandex and Rambler search engines, [[geocities|GeoCities]], a [[fidonet|FidoNet]] gateway, the Moshkov library, Igromania magazine, the [[winamp|Winamp]] skins archive, a [[y2k|Year 2000]] center, the YouVid video site, the [[digicharat|Di Gi Charat]] fan club, the [[blender|Blender]] site, the Steam site and many more. Many of them are joined in a [[webring|retro web ring]].` },
    { id: 'steam', title: 'Games and Steam', content: `No games come preinstalled. The user first downloads the Steam client from www.steampowered.com in Internet Explorer, then buys games in the catalog, downloads and installs them. Every game has a page with a description and screenshots. The exception is the demos on the Igromania magazine CD (drive D:), which install from the disc.

Steam catalog games include [[wolf3d|Wolfenstein 3D]], [[diablo|Diablo]] and [[doom|DOOM 98]]. The Igromania CD carries demos of [[halflife|Half-Life 98]], the adventure [[scumm|LucasQuest 98]] and the racer [[neonracer|Midnight Glide]].` },
    { id: 'clippy', title: 'Clippy', content: `[[clippy|Clippy]] lives on the desktop. He comments on open programs and visited sites, answers questions, holds conversations with reply choices, dresses up in outfits from the Clippy '98 site and, as is only proper, sometimes offers help at the worst possible moment.` }
  ],
  seeAlso: ['windows98', 'bios', 'clippy', 'ie5', 'interpedia', 'samandmax', 'kovcheg', 'steam'],
  references: [
    'Microslop Win 98 Web Clone project documentation.',
    'Microslop Win 98 Resource Kit. Microslop Press, 1998.'
  ],
  links: [['http://www.microslop.com', 'Microslop Win 98 portal'], ['http://www.steampowered.com', 'Steam'], ['http://www.3advanced.com', '3ADVANCED: the system software catalog']],
  categories: ['Our Project', 'Operating Systems', 'Win 9x']
});

window.interpediaReg('scumm', 'project', {
  title: 'LucasQuest 98 и движок SCUMM',
  infobox: {
    title: 'SCUMM',
    badgeText: 'Script Creation Utility for Maniac Mansion',
    fields: [
      { label: 'Авторы движка', value: 'Рон Гилберт, Арик Уилмундер' },
      { label: 'Компания', value: 'Lucasfilm Games (LucasArts)' },
      { label: 'Первая игра', value: 'Maniac Mansion (1987)' },
      { label: 'Музыкальная система', value: 'iMUSE (с 1991 года)' },
      { label: 'Интерфейс', value: 'девять глаголов и инвентарь' },
      { label: 'Наследник', value: 'GrimE ([[grimfandango|Grim Fandango]], 1998)' },
      { label: 'Игра нашего проекта', value: 'LucasQuest 98 Demo (диск «Игромании»)' }
    ]
  },
  lead: `<strong>SCUMM</strong> (<em>Script Creation Utility for Maniac Mansion</em>) — движок и язык сценариев для приключенческих игр, созданный Роном Гилбертом и Ариком Уилмундером в Lucasfilm Games для игры Maniac Mansion (1987). На нём построены классические квесты студии: The Secret of Monkey Island, Day of the Tentacle, Sam & Max Hit the Road и другие.

SCUMM заменил ввод текстовых команд панелью глаголов, на которые достаточно нажать мышью. Эту традицию продолжает <strong>LucasQuest 98</strong> — квест из каталога нашего проекта, в котором пират-программист спасает сервер Win 98.`,
  sections: [
    { id: 'history', title: 'История SCUMM', content: `В середине 1980-х приключенческие игры управлялись текстом: игрок набирал «open door» или «take key», а программа нередко не понимала формулировку. Рон Гилберт, работая над Maniac Mansion, предложил показывать на экране список глаголов и предметов: игрок составляет фразу щелчками мыши — «Используй ключ с дверью». Для удобства разработки вместе с Ариком Уилмундером он создал язык сценариев SCUMM, на котором описываются комнаты, персонажи и головоломки.

Движок пережил полтора десятка игр и постепенно развивался: появились полноцветная графика, голосовое озвучивание и цифровой звук. В 1998 году LucasArts перешла на новый трёхмерный движок GrimE в [[grimfandango|Grim Fandango]].` },
    { id: 'philosophy', title: 'Философия дизайна', content: `Гилберт сформулировал принципы, ставшие визитной карточкой квестов LucasArts: игрок не должен погибать от неосторожного действия и не должен попадать в тупик, из которого нельзя выбраться, не начав игру заново. В отличие от многих квестов Sierra, где героя подстерегали внезапные смерти, игры LucasArts поощряли эксперименты: можно пробовать что угодно и смеяться над ответами.` },
    { id: 'games', title: 'Игры на SCUMM', content: `<table class="interpedia-wikitable">
<tr><th>Игра</th><th>Год</th></tr>
<tr><td>Maniac Mansion</td><td>1987</td></tr>
<tr><td>Zak McKracken and the Alien Mindbenders</td><td>1988</td></tr>
<tr><td>Indiana Jones and the Last Crusade</td><td>1989</td></tr>
<tr><td>Loom</td><td>1990</td></tr>
<tr><td>The Secret of Monkey Island</td><td>1990</td></tr>
<tr><td>Monkey Island 2: LeChuck's Revenge</td><td>1991</td></tr>
<tr><td>Indiana Jones and the Fate of Atlantis</td><td>1992</td></tr>
<tr><td>Day of the Tentacle, Sam & Max Hit the Road</td><td>1993</td></tr>
<tr><td>Full Throttle</td><td>1995</td></tr>
<tr><td>The Dig</td><td>1995</td></tr>
<tr><td>The Curse of Monkey Island</td><td>1997</td></tr>
</table>

В Monkey Island 2 впервые применена система iMUSE Майкла Лэнда и Питера Макконнелла: музыка плавно меняет аранжировку, когда герой переходит из одной комнаты в другую.` },
    { id: 'lucasquest', title: 'LucasQuest 98', content: `<strong>LucasQuest 98</strong> (в игре — «The Curse of Win 98 — A SCUMM Adventure») — небольшой квест, демоверсия которого лежит на компакт-диске журнала «Игромания» (<code>D:\\demo\\questdemo.exe</code>) и ставится с диска. Гайбраш Байтвуд, «могучий пират-программист», оказывается в серверной лаборатории замка Редмонд 1998 года. Ему нужно вернуть сервер Win 98 в Сеть: разбудить уснувшего сисадмина, капитана Боба, трое суток без сна отлаживавшего код на COBOL, починить сгоревший предохранитель в подвале и отобрать загрузочный компакт-диск у кибер-голубя на крыше.

Экран разделён по классическому образцу: сверху — сцена, снизу — строка действия, девять глаголов (Дать, Открыть, Закрыть, Взять, Осмотреть, Говорить, Использовать, Толкнуть, Потянуть) и инвентарь. В игре три локации, головоломки с резиновой курицей, кофе и проводом и диалоги с выбором реплик, в том числе пародия на знаменитые словесные дуэли Monkey Island.` }
  ],
  seeAlso: ['grimfandango', 'win98clone', 'neonracer', 'y2k', 'samandmax'],
  references: [
    'Gilbert R. Why Adventure Games Suck and What We Can Do About It // The Journal of Computer Game Design. — 1989.',
    'LucasArts. The Secret of Monkey Island: руководство. — 1990.',
    'Land M., McConnell P. Патент США 5 315 057 (iMUSE). — 1994.'
  ],
  links: [['http://www.igromania.ru', 'Журнал «Игромания»: LucasQuest 98 Demo на диске']],
  categories: ['Наш проект', 'Приключенческие игры', 'LucasArts']
}, {
  title: 'LucasQuest 98 & SCUMM Engine',
  infobox: {
    title: 'SCUMM',
    badgeText: 'Script Creation Utility for Maniac Mansion',
    fields: [
      { label: 'Engine authors', value: 'Ron Gilbert, Aric Wilmunder' },
      { label: 'Company', value: 'Lucasfilm Games (LucasArts)' },
      { label: 'First game', value: 'Maniac Mansion (1987)' },
      { label: 'Music system', value: 'iMUSE (since 1991)' },
      { label: 'Interface', value: 'nine verbs and an inventory' },
      { label: 'Successor', value: 'GrimE ([[grimfandango|Grim Fandango]], 1998)' },
      { label: 'Our project\'s game', value: 'LucasQuest 98 Demo (Igromania CD)' }
    ]
  },
  lead: `<strong>SCUMM</strong> (<em>Script Creation Utility for Maniac Mansion</em>) is an adventure game engine and scripting language created by Ron Gilbert and Aric Wilmunder at Lucasfilm Games for Maniac Mansion (1987). The studio's classic adventures were built on it: The Secret of Monkey Island, Day of the Tentacle, Sam & Max Hit the Road and others.

SCUMM replaced typed commands with a panel of verbs you simply click. The tradition continues in <strong>LucasQuest 98</strong>, an adventure from our project's catalog in which a pirate programmer saves a Win 98 server.`,
  sections: [
    { id: 'history', title: 'History of SCUMM', content: `In the mid-1980s adventure games were driven by text: the player typed "open door" or "take key", and the program often failed to understand the phrasing. While working on Maniac Mansion, Ron Gilbert proposed showing a list of verbs and objects on screen so the player builds a sentence with mouse clicks: "Use key with door". To make development easier, he and Aric Wilmunder created the SCUMM scripting language for describing rooms, characters and puzzles.

The engine outlived more than a dozen games and kept evolving, gaining full-color graphics, voice acting and digital sound. In 1998 LucasArts moved to the new 3D GrimE engine for [[grimfandango|Grim Fandango]].` },
    { id: 'philosophy', title: 'Design philosophy', content: `Gilbert set out principles that became the hallmark of LucasArts adventures: the player should never die from a careless action and never reach a dead end that can only be escaped by restarting. Unlike many Sierra adventures, where sudden deaths lay in wait, LucasArts games encouraged experiments: you could try anything and laugh at the answers.` },
    { id: 'games', title: 'SCUMM games', content: `<table class="interpedia-wikitable">
<tr><th>Game</th><th>Year</th></tr>
<tr><td>Maniac Mansion</td><td>1987</td></tr>
<tr><td>Zak McKracken and the Alien Mindbenders</td><td>1988</td></tr>
<tr><td>Indiana Jones and the Last Crusade</td><td>1989</td></tr>
<tr><td>Loom</td><td>1990</td></tr>
<tr><td>The Secret of Monkey Island</td><td>1990</td></tr>
<tr><td>Monkey Island 2: LeChuck's Revenge</td><td>1991</td></tr>
<tr><td>Indiana Jones and the Fate of Atlantis</td><td>1992</td></tr>
<tr><td>Day of the Tentacle, Sam & Max Hit the Road</td><td>1993</td></tr>
<tr><td>Full Throttle</td><td>1995</td></tr>
<tr><td>The Dig</td><td>1995</td></tr>
<tr><td>The Curse of Monkey Island</td><td>1997</td></tr>
</table>

Monkey Island 2 was the first to use iMUSE by Michael Land and Peter McConnell: the music smoothly changes its arrangement as the hero moves from room to room.` },
    { id: 'lucasquest', title: 'LucasQuest 98', content: `<strong>LucasQuest 98</strong> (in-game title "The Curse of Win 98 — A SCUMM Adventure") is a small adventure whose demo sits on the Igromania magazine CD (<code>D:\\demo\\questdemo.exe</code>) and installs from the disc. Guybrush Bytepwood, "a mighty pirate-programmer", finds himself in the server lab of Castle Redmond, 1998. He must bring the Win 98 server back online: wake the sleeping sysadmin, Captain Bob, who has been debugging COBOL code for 72 straight hours, fix the blown fuse in the basement and take the boot CD from a cyber-pigeon on the roof.

The screen follows the classic layout: the scene on top, then the sentence line, nine verbs (Give, Open, Close, Pick up, Look at, Talk to, Use, Push, Pull) and the inventory. The game has three locations, puzzles with a rubber chicken, coffee and wire, and dialogues with reply choices, including a parody of Monkey Island's famous insult duels.` }
  ],
  seeAlso: ['grimfandango', 'win98clone', 'neonracer', 'y2k', 'samandmax'],
  references: [
    'Gilbert, R. "Why Adventure Games Suck and What We Can Do About It". The Journal of Computer Game Design, 1989.',
    'LucasArts. The Secret of Monkey Island manual, 1990.',
    'Land, M., McConnell, P. US Patent 5,315,057 (iMUSE), 1994.'
  ],
  links: [['http://www.igromania.ru', 'Igromania magazine: LucasQuest 98 Demo on the CD']],
  categories: ['Our Project', 'Adventure Games', 'LucasArts']
}, ['lucasquest']);

window.interpediaReg('neonracer', 'project', {
  title: 'Midnight Glide (Neon Racer 3D)',
  infobox: {
    title: 'Midnight Glide',
    badgeText: 'A Win 98 racing experience',
    fields: [
      { label: 'Разработчик', value: 'RetroSpeed Studios' },
      { label: 'Жанр', value: 'аркадные ночные гонки' },
      { label: 'Распространение', value: 'Midnight Glide Demo, диск «Игромании»' },
      { label: 'Разрешение', value: '320 × 240' },
      { label: 'Режимы графики', value: '3dfx Glide (сглаживание) и PS1 (дрожание вершин)' },
      { label: 'Машины', value: 'PULSE GT, SPARK RS, VANDAL V8' },
      { label: 'Трассы', value: 'Dockside Afterdark, Neon District, Coastal Express' }
    ]
  },
  lead: `<strong>Midnight Glide</strong> (рабочее название — <em>Neon Racer 3D</em>) — аркадная трёхмерная гонка по ночному городу; в нашей системе она есть в виде демоверсии Midnight Glide Demo на компакт-диске журнала «Игромания». Игрок выбирает одну из трёх машин и проходит ночную серию из трёх заездов против соперников и городского трафика, используя дрифт и закись азота.

Игра нарочно выглядит как аркада конца 1990-х: низкополигональные машины, разрешение 320×240 и выбор между «гладкой» картинкой в духе ускорителей [[voodoo|3dfx]] и «дрожащей» графикой первых игровых приставок. Девиз игры: «Low polygons. Late nights».`,
  sections: [
    { id: 'gameplay', title: 'Игровой процесс', content: `Ночная серия состоит из трёх событий: кольцевых трасс Dockside Afterdark и Neon District и спринта Coastal Express. Все три нужно пройти на одной машине. Соперники управляются компьютером и борются за позиции, а на дорогах встречаются обычные машины и развозные фургоны.

<table class="interpedia-wikitable">
<tr><th>Клавиша</th><th>Действие</th></tr>
<tr><td>↑ / ↓</td><td>газ и тормоз</td></tr>
<tr><td>← / →</td><td>руль</td></tr>
<tr><td>Пробел</td><td>дрифт</td></tr>
<tr><td>Shift</td><td>закись азота (N₂O)</td></tr>
<tr><td>C</td><td>смена камеры</td></tr>
<tr><td>Esc</td><td>пауза</td></tr>
</table>` },
    { id: 'cars', title: 'Машины', content: `<dl>
<dt>PULSE GT</dt><dd>купе с хорошим балансом скорости и управляемости.</dd>
<dt>SPARK RS</dt><dd>манёвренный хэтчбек, прощающий ошибки в поворотах.</dd>
<dt>VANDAL V8</dt><dd>маслкар с высокой максимальной скоростью, требующий аккуратного руления.</dd>
</dl>

Цвет и обвес машины входят в комплектацию и выбираются перед заездом.` },
    { id: 'graphics', title: 'Графика', content: `Midnight Glide рисует трёхмерную сцену из простых многоугольников в низком разрешении и растягивает её на окно. В меню «Вид» можно переключить два режима:

<ul>
<li><strong>3dfx Glide</strong> — билинейная фильтрация текстур, как на [[voodoo|3dfx Voodoo]] и [[voodoo2|Voodoo 2]];</li>
<li><strong>PS1</strong> — без фильтрации и с «дрожанием» вершин, характерным для первых приставок с трёхмерной графикой.</li>
</ul>

Неоновые вывески, мокрый асфальт и огни встречных машин создают атмосферу нелегальных ночных заездов.` },
    { id: 'distribution', title: 'Распространение', content: `В Steam игра не продаётся. Демоверсия Midnight Glide Demo лежит на [[cdrom|компакт-диске]] журнала «Игромания»: установщик <code>D:\\demo\\glidedemo.exe</code> ставит её на диск C: своим мастером установки. Её размер невелик — около 9 МБ.` }
  ],
  seeAlso: ['win98clone', 'scumm', 'voodoo', 'carmageddon'],
  references: [
    'RetroSpeed Studios. Midnight Glide: справка «Управление и об игре».',
    'Журнал «Игромания»: раздел демоверсий на компакт-диске.'
  ],
  links: [['http://www.igromania.ru', 'Журнал «Игромания»: Midnight Glide Demo на диске'], ['http://www.3dfx-zone.com', '3dfx Voodoo Zone']],
  categories: ['Наш проект', 'Гоночные игры', 'Видеоигры']
}, {
  title: 'Midnight Glide (Neon Racer 3D)',
  infobox: {
    title: 'Midnight Glide',
    badgeText: 'A Win 98 racing experience',
    fields: [
      { label: 'Developer', value: 'RetroSpeed Studios' },
      { label: 'Genre', value: 'arcade night racing' },
      { label: 'Distribution', value: 'Midnight Glide Demo, Igromania CD' },
      { label: 'Resolution', value: '320 × 240' },
      { label: 'Render modes', value: '3dfx Glide (filtered) and PS1 (vertex jitter)' },
      { label: 'Cars', value: 'PULSE GT, SPARK RS, VANDAL V8' },
      { label: 'Tracks', value: 'Dockside Afterdark, Neon District, Coastal Express' }
    ]
  },
  lead: `<strong>Midnight Glide</strong> (working title <em>Neon Racer 3D</em>) is an arcade 3D night-city racer; our system has it as the Midnight Glide Demo on the Igromania magazine CD. The player picks one of three cars and runs a night series of three races against rivals and city traffic, using drifts and nitrous oxide.

The game deliberately looks like a late-1990s arcade racer: low-poly cars, 320×240 resolution and a choice between a "smooth" picture in the style of [[voodoo|3dfx]] accelerators and the "wobbly" graphics of the first game consoles. Its motto: "Low polygons. Late nights."`,
  sections: [
    { id: 'gameplay', title: 'Gameplay', content: `The night series has three events: the Dockside Afterdark and Neon District circuits and the Coastal Express sprint. All three must be completed in the same car. Computer rivals fight for position, and the roads carry ordinary cars and delivery vans.

<table class="interpedia-wikitable">
<tr><th>Key</th><th>Action</th></tr>
<tr><td>↑ / ↓</td><td>gas and brake</td></tr>
<tr><td>← / →</td><td>steering</td></tr>
<tr><td>Space</td><td>drift</td></tr>
<tr><td>Shift</td><td>nitrous oxide (N₂O)</td></tr>
<tr><td>C</td><td>change camera</td></tr>
<tr><td>Esc</td><td>pause</td></tr>
</table>` },
    { id: 'cars', title: 'Cars', content: `<dl>
<dt>PULSE GT</dt><dd>a coupe with a good balance of speed and handling.</dd>
<dt>SPARK RS</dt><dd>a nimble hatchback that forgives mistakes in corners.</dd>
<dt>VANDAL V8</dt><dd>a muscle car with a high top speed that needs careful steering.</dd>
</dl>

Paint and body kit come with the car and are chosen before the race.` },
    { id: 'graphics', title: 'Graphics', content: `Midnight Glide draws a 3D scene from simple polygons at low resolution and stretches it to the window. The View menu switches between two modes:

<ul>
<li><strong>3dfx Glide</strong>: bilinear texture filtering, as on the [[voodoo|3dfx Voodoo]] and [[voodoo2|Voodoo 2]];</li>
<li><strong>PS1</strong>: no filtering and the vertex "jitter" typical of the first consoles with 3D graphics.</li>
</ul>

Neon signs, wet asphalt and the lights of oncoming cars set the mood of illegal night racing.` },
    { id: 'distribution', title: 'Distribution', content: `The game is not sold on Steam. The Midnight Glide Demo sits on the Igromania magazine [[cdrom|CD]]: the installer <code>D:\\demo\\glidedemo.exe</code> puts it on drive C: with its own setup wizard. It is small, about 9 MB.` }
  ],
  seeAlso: ['win98clone', 'scumm', 'voodoo', 'carmageddon'],
  references: [
    'RetroSpeed Studios. Midnight Glide: Controls / About help.',
    'Igromania magazine: the demo section of the CD.'
  ],
  links: [['http://www.igromania.ru', 'Igromania magazine: Midnight Glide Demo on the CD'], ['http://www.3dfx-zone.com', '3dfx Voodoo Zone']],
  categories: ['Our Project', 'Racing Games', 'Video Games']
});

window.interpediaReg('blender', 'project', {
  title: 'Blender 1.60 для Win 98',
  infobox: {
    title: 'Blender 1.60',
    badgeText: 'Not a Number (NaN)',
    fields: [
      { label: 'Автор', value: 'Тон Розендал' },
      { label: 'Студия-создатель', value: 'NeoGeo (Нидерланды)' },
      { label: 'Издатель', value: 'Not a Number (NaN), с 1998 года' },
      { label: 'Первый выпуск', value: 'январь 1998 (для SGI IRIX)' },
      { label: 'Платформы', value: 'IRIX, [[linux|Linux]], [[freebsd|FreeBSD]], Win 95/98/NT' },
      { label: 'Размер', value: 'менее 2 МБ' },
      { label: 'Лицензия', value: 'бесплатно; «C-ключ» открывает дополнительные функции' },
      { label: 'Сайт', value: 'www.blender3d.com' }
    ]
  },
  lead: `<strong>Blender</strong> — пакет трёхмерного моделирования, анимации и рендеринга, созданный голландским аниматором Тоном Розендалом в студии NeoGeo и распространяемый компанией Not a Number (NaN). Версия <strong>1.60</strong> для [[windows98|Win 98]] умещается меньше чем в два мегабайта, распространяется бесплатно и позволяет моделировать, анимировать и рендерить сцены на обычном домашнем компьютере.

Blender отличается необычным интерфейсом: окна не перекрывают друг друга, а почти все действия выполняются клавишами — G перемещает объект, R вращает, S масштабирует. В нашей системе сайт www.blender3d.com в Internet Explorer предлагает новую версию Blender 2.04 с игровым движком, а Blender 1.60 лежит там в разделе прошлых выпусков.`,
  sections: [
    { id: 'history', title: 'История', content: `NeoGeo — одна из крупнейших анимационных студий Нидерландов — с середины 1990-х использовала собственную программу трёхмерной графики для заказов на телевидении и в рекламе. Её главный автор Тон Розендал решил выпустить программу для всех. В январе 1998 года Blender вышел бесплатно для рабочих станций SGI, а затем для [[linux|Linux]], [[freebsd|FreeBSD]] и Win.

В июне 1998 года Розендал основал компанию Not a Number (NaN), которая развивает Blender и зарабатывает на поддержке и дополнительных функциях. В 1999 году NaN начала продавать «C-ключ» — лицензионный код, открывающий продвинутые возможности и помогающий финансировать разработку.` },
    { id: 'interface', title: 'Интерфейс', content: `Интерфейс Blender нарисован средствами OpenGL и одинаково выглядит на всех системах. Экран делится на неперекрывающиеся области: трёхмерные окна, панель кнопок, окно файлов. Пользователи, привыкшие к меню Win, поначалу теряются, но опытные моделлеры ценят скорость работы клавишами.

<table class="interpedia-wikitable">
<tr><th>Клавиша</th><th>Действие</th></tr>
<tr><td>Tab</td><td>переключение между режимами объекта и редактирования</td></tr>
<tr><td>G</td><td>перемещение (Grab)</td></tr>
<tr><td>R</td><td>вращение (Rotate)</td></tr>
<tr><td>S</td><td>масштаб (Scale)</td></tr>
<tr><td>E</td><td>выдавливание граней (Extrude)</td></tr>
<tr><td>A</td><td>выделить всё или снять выделение</td></tr>
<tr><td>Пробел</td><td>меню добавления объектов</td></tr>
<tr><td>Цифры дополнительной клавиатуры</td><td>виды спереди, сбоку, сверху и перспектива</td></tr>
</table>` },
    { id: 'features', title: 'Возможности', content: `<ul>
<li>Полигональное моделирование с режимом редактирования вершин, рёбер и граней.</li>
<li>Примитивы: куб, цилиндр, плоскость, сфера, конус и другие.</li>
<li>Числовой ввод положения, вращения и масштаба (LocX, RotZ, ScaleY и т. д.).</li>
<li>Виды «каркас» и «сплошная заливка», ортографическая и перспективная проекция.</li>
<li>Материалы, освещение, анимация по ключевым кадрам и встроенный рендер.</li>
</ul>` },
    { id: 'requirements', title: 'Системные требования (Win 98)', content: `Для работы достаточно процессора [[pentium|Pentium]], 32 МБ памяти и видеокарты с поддержкой OpenGL или программной реализации OpenGL из состава системы. 3D-ускорители вроде [[rivatnt|RIVA TNT]] заметно ускоряют работу в окнах просмотра.` },
    { id: 'community', title: 'Сообщество', content: `Вокруг Blender быстро сложилось международное сообщество: на официальном сайте публикуются галереи работ пользователей, уроки и обсуждения. Многие начинающие художники выбирают Blender, потому что профессиональные пакеты вроде 3D Studio MAX и Softimage стоят тысячи долларов, а Blender бесплатен и помещается на [[floppy144|дискету]].` }
  ],
  seeAlso: ['win98clone', 'photoshop', 'dancingbaby', 'linux'],
  references: [
    'Not a Number. Blender Manual. — 1999.',
    'Not a Number BV: пресс-релиз об основании компании. — 1998.'
  ],
  links: [['http://www.blender3d.com', 'Blender 3D: официальный сайт']],
  categories: ['Наш проект', 'Трёхмерная графика', 'Бесплатные программы']
}, {
  title: 'Blender 1.60 for Win 98',
  infobox: {
    title: 'Blender 1.60',
    badgeText: 'Not a Number (NaN)',
    fields: [
      { label: 'Author', value: 'Ton Roosendaal' },
      { label: 'Originating studio', value: 'NeoGeo (Netherlands)' },
      { label: 'Publisher', value: 'Not a Number (NaN), since 1998' },
      { label: 'First release', value: 'January 1998 (for SGI IRIX)' },
      { label: 'Platforms', value: 'IRIX, [[linux|Linux]], [[freebsd|FreeBSD]], Win 95/98/NT' },
      { label: 'Size', value: 'under 2 MB' },
      { label: 'License', value: 'free; a "C-key" unlocks extra features' },
      { label: 'Website', value: 'www.blender3d.com' }
    ]
  },
  lead: `<strong>Blender</strong> is a 3D modeling, animation and rendering suite created by Dutch animator Ton Roosendaal at the NeoGeo studio and distributed by Not a Number (NaN). Version <strong>1.60</strong> for [[windows98|Win 98]] fits in under two megabytes, is free and lets you model, animate and render scenes on an ordinary home computer.

Blender stands out for its unusual interface: windows never overlap, and almost everything is done from the keyboard, with G to move an object, R to rotate and S to scale. On our system www.blender3d.com in Internet Explorer offers the new Blender 2.04 with its game engine, and Blender 1.60 stays there among the previous releases.`,
  sections: [
    { id: 'history', title: 'History', content: `NeoGeo, one of the largest animation studios in the Netherlands, used its own 3D software for television and advertising work from the mid-1990s. Its main author, Ton Roosendaal, decided to release it to everyone. In January 1998 Blender came out free for SGI workstations, followed by [[linux|Linux]], [[freebsd|FreeBSD]] and Win.

In June 1998 Roosendaal founded Not a Number (NaN) to develop Blender and earn money from support and extra features. In 1999 NaN began selling a "C-key", a license code that unlocks advanced features and helps fund development.` },
    { id: 'interface', title: 'Interface', content: `Blender's interface is drawn with OpenGL and looks the same on every system. The screen is divided into non-overlapping areas: 3D views, a button panel and a file window. Users used to Win menus are lost at first, but experienced modelers value the speed of working by keyboard.

<table class="interpedia-wikitable">
<tr><th>Key</th><th>Action</th></tr>
<tr><td>Tab</td><td>switch between Object and Edit mode</td></tr>
<tr><td>G</td><td>grab (move)</td></tr>
<tr><td>R</td><td>rotate</td></tr>
<tr><td>S</td><td>scale</td></tr>
<tr><td>E</td><td>extrude</td></tr>
<tr><td>A</td><td>select or deselect all</td></tr>
<tr><td>Space</td><td>add-object menu</td></tr>
<tr><td>Numeric keypad</td><td>front, side, top and perspective views</td></tr>
</table>` },
    { id: 'features', title: 'Features', content: `<ul>
<li>Polygon modeling with an Edit mode for vertices, edges and faces.</li>
<li>Primitives: cube, cylinder, plane, sphere, cone and more.</li>
<li>Numeric entry of location, rotation and scale (LocX, RotZ, ScaleY and so on).</li>
<li>Wireframe and solid views, orthographic and perspective projection.</li>
<li>Materials, lighting, keyframe animation and a built-in renderer.</li>
</ul>` },
    { id: 'requirements', title: 'System requirements (Win 98)', content: `A [[pentium|Pentium]] processor, 32 MB of memory and a video card with OpenGL support, or the system's software OpenGL, are enough. 3D accelerators such as the [[rivatnt|RIVA TNT]] noticeably speed up the viewports.` },
    { id: 'community', title: 'Community', content: `An international community quickly formed around Blender: the official site publishes user galleries, tutorials and discussions. Many beginning artists choose Blender because professional packages such as 3D Studio MAX and Softimage cost thousands of dollars, while Blender is free and fits on a [[floppy144|floppy]].` }
  ],
  seeAlso: ['win98clone', 'photoshop', 'dancingbaby', 'linux'],
  references: [
    'Not a Number. Blender Manual, 1999.',
    'Not a Number BV press release on the company\'s founding, 1998.'
  ],
  links: [['http://www.blender3d.com', 'Blender 3D: official site']],
  categories: ['Our Project', '3D Graphics', 'Freeware']
}, ['blender98']);

window.interpediaReg('digicharat', 'project', {
  title: 'Фан-клуб Di Gi Charat (1999)',
  infobox: {
    title: 'Di Gi Charat',
    badgeText: 'Дэдзико, Пучико и Раби',
    fields: [
      { label: 'Создатель персонажей', value: 'Broccoli (Япония)' },
      { label: 'Художник', value: 'Когэ-Донбо' },
      { label: 'Появление', value: '1998, талисман магазинов Gamers' },
      { label: 'Аниме', value: 'короткие серии с ноября 1999, передача «Wonderful» на TBS' },
      { label: 'Студия аниме', value: 'Madhouse' },
      { label: 'Песня', value: '«Party Night»' },
      { label: 'Фан-клуб', value: 'www.digicharat.net' }
    ]
  },
  lead: `<strong>Di Gi Charat</strong> — персонажи японской компании Broccoli: принцесса-кошка Дэдзико с планеты Di Gi Charat, её младшая спутница Пучико и соперница Раби эн Роуз. Созданная как талисман сети магазинов Gamers в токийском районе Акихабара, Дэдзико в ноябре 1999 года стала героиней коротких аниме-серий.

<strong>Фан-клуб Di Gi Charat</strong> — англоязычный любительский сайт www.digicharat.net, оформленный в духе японских фанатских страниц конца 1990-х: новости, описания серий, галерея, музыкальный проигрыватель с песней «Party Night» и гостевая книга.`,
  sections: [
    { id: 'characters', title: 'Персонажи', content: `<dl>
<dt>Дэдзико (Di Gi Charat)</dt><dd>принцесса с планеты Di Gi Charat с зелёными волосами, кошачьими ушками и золотыми колокольчиками, мечтающая стать звездой. Заканчивает фразы на «-нё» и умеет стрелять лучами из глаз — «Me kara beam».</dd>
<dt>Пучико (Petit Charat)</dt><dd>маленькая спутница Дэдзико в тигровой шапочке, говорит мало и заканчивает фразы на «-ню».</dd>
<dt>Раби эн Роуз (Хикару Усада)</dt><dd>девушка в костюме кролика, подрабатывающая в магазине и соперничающая с Дэдзико за славу.</dd>
<dt>Гэма</dt><dd>жёлтое шарообразное существо, слуга Дэдзико, которому вечно достаётся.</dd>
</dl>` },
    { id: 'history', title: 'История', content: `Компания Broccoli придумала Дэдзико в 1998 году как талисман своих магазинов Gamers, торгующих аниме, играми и товарами для фанатов. Художница Когэ-Донбо нарисовала яркую кошачью принцессу, и персонаж быстро стал популярнее, чем ожидали. В ноябре 1999 года начался показ коротких серий в ночной развлекательной передаче «Wonderful» на канале TBS; анимацию делает студия Madhouse. Песня «Party Night» в исполнении актрисы, озвучивающей Дэдзико, вышла отдельным синглом.` },
    { id: 'fanclub', title: 'Фан-клуб', content: `Сайт www.digicharat.net сделан поклонниками для англоязычных зрителей, которым японские страницы недоступны из-за языка и кодировок. Оформление повторяет главную иллюстрацию сериала: мятная клетка на фоне, зелёный цвет волос Дэдзико, золотые колокольчики и тёмно-синее платье. Навигация — четыре пиксельных фигурки героев.

<table class="interpedia-wikitable">
<tr><th>Раздел</th><th>Содержание</th></tr>
<tr><td>Главная</td><td>новости о сериале, магазинах Gamers и музыке, журнал обновлений</td></tr>
<tr><td>Серии</td><td>описания коротких эпизодов</td></tr>
<tr><td>Галерея</td><td>иллюстрации; картинки можно сохранить и открыть в [[mspaint|Paint]]</td></tr>
<tr><td>Музыка</td><td>проигрыватель с песней «Party Night»</td></tr>
<tr><td>О сериале</td><td>сведения о персонажах и создателях</td></tr>
<tr><td>Гостевая книга</td><td>записи посетителей</td></tr>
</table>` },
    { id: 'style', title: 'Стиль японских фанатских сайтов', content: `Японские фанатские страницы конца 1990-х узнаются по пастельным фонам, крошечным пиксельным фигуркам-«пети», звёздочкам из кодировки Shift-JIS, счётчикам посещений и разделам «link» с баннерами друзей. Фан-клуб Di Gi Charat сознательно повторяет этот стиль, отличаясь от западных [[geocities|домашних страниц]] с их мигающими картинками и MIDI-музыкой.` }
  ],
  seeAlso: ['geocities', 'webring', 'win98clone', 'html', 'kovcheg'],
  references: [
    'Broccoli Co. Di Gi Charat: официальные материалы. — 1998–1999.',
    'Программа передач TBS: «Wonderful», ноябрь 1999.'
  ],
  links: [['http://www.digicharat.net', 'Фан-клуб Di Gi Charat']],
  categories: ['Наш проект', 'Аниме', 'Фанатские сайты']
}, {
  title: 'Di Gi Charat Fan Club (1999)',
  infobox: {
    title: 'Di Gi Charat',
    badgeText: 'Dejiko, Puchiko and Rabi',
    fields: [
      { label: 'Character creator', value: 'Broccoli (Japan)' },
      { label: 'Artist', value: 'Koge-Donbo' },
      { label: 'Introduced', value: '1998, mascot of the Gamers stores' },
      { label: 'Anime', value: 'shorts since November 1999 on TBS\'s "Wonderful"' },
      { label: 'Anime studio', value: 'Madhouse' },
      { label: 'Song', value: '"Party Night"' },
      { label: 'Fan club', value: 'www.digicharat.net' }
    ]
  },
  lead: `<strong>Di Gi Charat</strong> are characters from the Japanese company Broccoli: the cat princess Dejiko from the planet Di Gi Charat, her little companion Puchiko and their rival Rabi~en~Rose. Created as the mascot of the Gamers store chain in Tokyo's Akihabara district, Dejiko became the star of anime shorts in November 1999.

The <strong>Di Gi Charat Fan Club</strong> is the English-language fan site www.digicharat.net, styled after late-1990s Japanese fan pages: news, episode guides, a gallery, a music player with the song "Party Night" and a guestbook.`,
  sections: [
    { id: 'characters', title: 'Characters', content: `<dl>
<dt>Dejiko (Di Gi Charat)</dt><dd>a princess from the planet Di Gi Charat with green hair, cat ears and gold bells, who dreams of stardom. She ends her sentences with "-nyo" and can fire beams from her eyes, the "Me kara beam".</dd>
<dt>Puchiko (Petit Charat)</dt><dd>Dejiko's small companion in a tiger hat, who says little and ends her sentences with "-nyu".</dd>
<dt>Rabi~en~Rose (Hikaru Usada)</dt><dd>a girl in a bunny outfit who works part-time at the store and competes with Dejiko for fame.</dd>
<dt>Gema</dt><dd>a yellow ball-shaped creature, Dejiko's servant, who always gets the worst of it.</dd>
</dl>` },
    { id: 'history', title: 'History', content: `Broccoli created Dejiko in 1998 as the mascot of its Gamers stores, which sell anime, games and fan merchandise. Artist Koge-Donbo drew a bright cat princess, and the character quickly became more popular than expected. In November 1999 short episodes began airing on the late-night variety show "Wonderful" on TBS, animated by Madhouse. The song "Party Night", sung by Dejiko's voice actress, was released as a single.` },
    { id: 'fanclub', title: 'The fan club', content: `www.digicharat.net was made by fans for English-speaking viewers who cannot read Japanese pages because of the language and encodings. Its design follows the series' key visual: a mint check background, Dejiko's green hair, gold bells and a navy dress. Navigation uses four pixel figures of the characters.

<table class="interpedia-wikitable">
<tr><th>Section</th><th>Content</th></tr>
<tr><td>Home</td><td>news about the series, Gamers stores and music; update log</td></tr>
<tr><td>Episodes</td><td>descriptions of the short episodes</td></tr>
<tr><td>Gallery</td><td>illustrations; pictures can be saved and opened in [[mspaint|Paint]]</td></tr>
<tr><td>Music</td><td>a player with the song "Party Night"</td></tr>
<tr><td>About</td><td>information on the characters and creators</td></tr>
<tr><td>Guestbook</td><td>visitors' entries</td></tr>
</table>` },
    { id: 'style', title: 'The style of Japanese fan sites', content: `Late-1990s Japanese fan pages are recognizable by pastel backgrounds, tiny pixel "petit" figures, stars from the Shift-JIS character set, hit counters and "link" sections with friends' banners. The Di Gi Charat Fan Club deliberately follows that style, unlike Western [[geocities|home pages]] with their blinking images and MIDI music.` }
  ],
  seeAlso: ['geocities', 'webring', 'win98clone', 'html', 'kovcheg'],
  references: [
    'Broccoli Co. Di Gi Charat official materials, 1998–1999.',
    'TBS program listings: "Wonderful", November 1999.'
  ],
  links: [['http://www.digicharat.net', 'Di Gi Charat Fan Club']],
  categories: ['Our Project', 'Anime', 'Fan Sites']
});

window.interpediaReg('bios', 'project', {
  title: 'Award Modular BIOS v4.51PG',
  infobox: {
    title: 'Award Modular BIOS',
    badgeText: 'CMOS Setup Utility',
    fields: [
      { label: 'Разработчик', value: 'Award Software International' },
      { label: 'Версия', value: '4.51PG' },
      { label: 'Распространение', value: 'материнские платы для Pentium, Pentium II, Pentium III' },
      { label: 'Вход в настройки', value: 'клавиша Del при загрузке' },
      { label: 'Цвета', value: 'синий фон, белые и жёлтые надписи' },
      { label: 'Хранение настроек', value: 'память CMOS с батарейкой' },
      { label: 'Обновление', value: 'перепрошивка флэш-памяти с дискеты' }
    ]
  },
  lead: `<strong>BIOS</strong> (<em>Basic Input/Output System</em>, базовая система ввода-вывода) — программа в микросхеме на материнской плате, которая первой запускается при включении компьютера: проверяет оборудование, находит диски и передаёт управление операционной системе. <strong>Award Modular BIOS v4.51PG</strong> компании Award Software — одна из самых распространённых версий на платах второй половины 1990-х.

Её экран загрузки с логотипом Energy Star и синие меню настройки CMOS Setup Utility знакомы каждому, кто собирал компьютер сам. Именно этот BIOS встречает пользователя при включении нашей системы.`,
  sections: [
    { id: 'post', title: 'Загрузка и самотестирование', content: `После включения BIOS выполняет самотестирование (POST): проверяет процессор, видеокарту, клавиатуру и считает оперативную память. На экране появляются строки:

<pre>Award Modular BIOS v4.51PG, An Energy Star Ally
Copyright (C) 1984-98, Award Software, Inc.

Pentium(R) II Processor at 450MHz
Memory Test :  65536K OK

Award Plug and Play BIOS Extension v1.0A
Detecting IDE Primary Master  ... QUANTUM FIREBALL
Detecting IDE Primary Slave   ... None

Press DEL to enter SETUP</pre>

Затем BIOS выводит таблицу найденных устройств PCI, проверяет данные DMI и ищет загрузочный диск в заданном порядке — например, A:, C:, CD-ROM.` },
    { id: 'setup', title: 'CMOS Setup Utility', content: `Нажатие Del во время загрузки открывает синий экран настроек. Главное меню содержит разделы:

<table class="interpedia-wikitable">
<tr><td>STANDARD CMOS SETUP</td><td>дата, время, жёсткие диски, дисководы</td></tr>
<tr><td>BIOS FEATURES SETUP</td><td>порядок загрузки, защита от вирусов, кэш</td></tr>
<tr><td>CHIPSET FEATURES SETUP</td><td>тайминги памяти и шин</td></tr>
<tr><td>POWER MANAGEMENT SETUP</td><td>энергосбережение</td></tr>
<tr><td>PNP/PCI CONFIGURATION</td><td>распределение прерываний</td></tr>
<tr><td>LOAD BIOS DEFAULTS / LOAD SETUP DEFAULTS</td><td>сброс к безопасным или оптимальным значениям</td></tr>
<tr><td>INTEGRATED PERIPHERALS</td><td>встроенные порты и контроллеры</td></tr>
<tr><td>SUPERVISOR PASSWORD / USER PASSWORD</td><td>пароли</td></tr>
<tr><td>IDE HDD AUTO DETECTION</td><td>автоматическое определение дисков</td></tr>
<tr><td>SAVE &amp; EXIT SETUP / EXIT WITHOUT SAVING</td><td>выход с сохранением или без</td></tr>
</table>

Настройки хранятся в небольшой памяти CMOS, которую питает батарейка на плате. Если батарейка садится, компьютер «забывает» дату и параметры дисков.` },
    { id: 'password', title: 'Пароли и сброс', content: `BIOS позволяет поставить пароль на вход в настройки или на загрузку компьютера. Забытый пароль снимают, сбросив память CMOS перемычкой на плате или вынув батарейку на несколько минут; при этом сбрасываются и все остальные настройки. Неудачные значения таймингов или частот могут привести к тому, что компьютер перестанет загружаться, — тогда тоже помогает сброс.` },
    { id: 'flash', title: 'Обновление и угрозы', content: `Современные BIOS хранятся во флэш-памяти и обновляются программой-прошивальщиком с загрузочной [[floppy144|дискеты]]: так производители плат добавляют поддержку новых процессоров и больших дисков и исправляют ошибки, в том числе связанные с [[y2k|2000 годом]]. Прерванная прошивка делает плату неработоспособной. В апреле 1999 года вирус CIH стирал содержимое флэш-памяти BIOS на некоторых платах, выводя компьютеры из строя (см. [[avp|AVP]]).` },
    { id: 'company', title: 'Award Software', content: `Компания Award Software была основана в 1983 году в Калифорнии и выпускала BIOS для множества производителей материнских плат — Abit, ASUS, Gigabyte и других. Наряду с AMI и Phoenix она входила в тройку главных разработчиков BIOS. В 1998 году Award объединилась с Phoenix Technologies, но марка Award продолжает использоваться.` },
    { id: 'ourbios', title: 'BIOS нашей системы', content: `При включении нашей системы на экране появляется Award Modular BIOS v4.51PG: со звуком подсчёта памяти, определением дисков и приглашением войти в настройки. В CMOS Setup Utility можно изменить параметры, поставить пароль или выбрать неверный порядок загрузки — и увидеть, как компьютер сообщит об ошибке.` }
  ],
  seeAlso: ['win98clone', 'y2k', 'overclocking', 'celeron300a', 'msdos'],
  references: [
    'Abit BH6: руководство пользователя (раздел BIOS Setup). — Abit, 1998.',
    'Гук М. Аппаратные средства IBM PC. Энциклопедия. — СПб.: Питер, 1998.'
  ],
  categories: ['Наш проект', 'Компьютерное железо', 'Системное ПО']
}, {
  title: 'Award Modular BIOS v4.51PG',
  infobox: {
    title: 'Award Modular BIOS',
    badgeText: 'CMOS Setup Utility',
    fields: [
      { label: 'Developer', value: 'Award Software International' },
      { label: 'Version', value: '4.51PG' },
      { label: 'Found on', value: 'motherboards for Pentium, Pentium II, Pentium III' },
      { label: 'Setup key', value: 'Del during boot' },
      { label: 'Colors', value: 'blue background, white and yellow text' },
      { label: 'Settings storage', value: 'battery-backed CMOS memory' },
      { label: 'Updates', value: 'flash reprogramming from a floppy' }
    ]
  },
  lead: `The <strong>BIOS</strong> (<em>Basic Input/Output System</em>) is the program in a motherboard chip that runs first when a computer is switched on: it checks the hardware, finds the disks and hands control to the operating system. <strong>Award Modular BIOS v4.51PG</strong> from Award Software is one of the most common versions on late-1990s boards.

Its boot screen with the Energy Star logo and the blue CMOS Setup Utility menus are familiar to anyone who has built a computer. This is the BIOS that greets the user when our system is switched on.`,
  sections: [
    { id: 'post', title: 'Boot and self-test', content: `After power-on the BIOS runs the power-on self-test (POST): it checks the processor, video card and keyboard and counts the RAM. The screen shows lines like:

<pre>Award Modular BIOS v4.51PG, An Energy Star Ally
Copyright (C) 1984-98, Award Software, Inc.

Pentium(R) II Processor at 450MHz
Memory Test :  65536K OK

Award Plug and Play BIOS Extension v1.0A
Detecting IDE Primary Master  ... QUANTUM FIREBALL
Detecting IDE Primary Slave   ... None

Press DEL to enter SETUP</pre>

The BIOS then lists the PCI devices found, verifies DMI data and looks for a boot disk in the set order, for example A:, C:, CD-ROM.` },
    { id: 'setup', title: 'CMOS Setup Utility', content: `Pressing Del during boot opens the blue setup screen. The main menu has these sections:

<table class="interpedia-wikitable">
<tr><td>STANDARD CMOS SETUP</td><td>date, time, hard disks, floppy drives</td></tr>
<tr><td>BIOS FEATURES SETUP</td><td>boot order, virus warning, cache</td></tr>
<tr><td>CHIPSET FEATURES SETUP</td><td>memory and bus timings</td></tr>
<tr><td>POWER MANAGEMENT SETUP</td><td>power saving</td></tr>
<tr><td>PNP/PCI CONFIGURATION</td><td>interrupt assignment</td></tr>
<tr><td>LOAD BIOS DEFAULTS / LOAD SETUP DEFAULTS</td><td>reset to safe or optimal values</td></tr>
<tr><td>INTEGRATED PERIPHERALS</td><td>onboard ports and controllers</td></tr>
<tr><td>SUPERVISOR PASSWORD / USER PASSWORD</td><td>passwords</td></tr>
<tr><td>IDE HDD AUTO DETECTION</td><td>automatic disk detection</td></tr>
<tr><td>SAVE &amp; EXIT SETUP / EXIT WITHOUT SAVING</td><td>exit with or without saving</td></tr>
</table>

Settings live in a small CMOS memory powered by a battery on the board. When the battery runs down, the computer "forgets" the date and disk parameters.` },
    { id: 'password', title: 'Passwords and reset', content: `The BIOS can set a password for entering setup or for booting the computer. A forgotten password is cleared by resetting the CMOS memory with a jumper on the board or by removing the battery for a few minutes, which also resets every other setting. Bad timing or clock values can stop the computer from booting, and a reset helps then too.` },
    { id: 'flash', title: 'Updates and threats', content: `Modern BIOSes live in flash memory and are updated with a flashing program from a boot [[floppy144|floppy]]: board makers use this to add support for new processors and large disks and to fix bugs, including [[y2k|Year 2000]] issues. An interrupted flash leaves the board dead. In April 1999 the CIH virus erased the BIOS flash memory on some boards, disabling the computers (see [[avp|AVP]]).` },
    { id: 'company', title: 'Award Software', content: `Award Software was founded in California in 1983 and made BIOSes for many motherboard makers, including Abit, ASUS and Gigabyte. Together with AMI and Phoenix it was one of the three main BIOS developers. In 1998 Award merged with Phoenix Technologies, but the Award brand is still in use.` },
    { id: 'ourbios', title: 'Our system\'s BIOS', content: `When our system is switched on, the screen shows Award Modular BIOS v4.51PG, with the ticking memory count, disk detection and the prompt to enter setup. In the CMOS Setup Utility you can change settings, set a password or choose a wrong boot order and see how the computer reports the error.` }
  ],
  seeAlso: ['win98clone', 'y2k', 'overclocking', 'celeron300a', 'msdos'],
  references: [
    'Abit BH6 user manual (BIOS Setup section). Abit, 1998.',
    'Guk, M. Apparatnye sredstva IBM PC. Entsiklopediya. St. Petersburg: Piter, 1998.'
  ],
  categories: ['Our Project', 'Hardware', 'System Software']
}, ['awardbios']);
