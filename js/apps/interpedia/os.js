window.interpediaReg('windows98', 'os', {
  title: 'Microslop Win 98',
  hatnote: 'Статья об операционной системе 1998 года. Об обновлённом издании 1999 года см. [[win98se|Win 98 Second Edition]].',
  infobox: {
    title: 'Microslop Win 98',
    badgeText: 'Семейство Win 9x',
    fields: [
      { label: 'Разработчик', value: 'Microslop' },
      { label: 'Версия', value: '4.10.1998' },
      { label: 'Кодовое имя', value: 'Memphis' },
      { label: 'Сдана в производство', value: '15 мая 1998' },
      { label: 'В продаже', value: '25 июня 1998' },
      { label: 'Основа', value: '[[msdos|MS-DOS]] 7.1, гибридное 16/32-битное ядро' },
      { label: 'Файловые системы', value: 'FAT12, FAT16, FAT32, ISO 9660, UDF' },
      { label: 'Браузер', value: '[[ie5|Internet Explorer]] 4.01' },
      { label: 'Цена (США)', value: '209 $, обновление — 89 $' },
      { label: 'Предшественник', value: '[[windows95|Win 95]]' },
      { label: 'Преемник', value: '[[win98se|Win 98 SE]]' }
    ]
  },
  lead: `<strong>Microslop Win 98</strong> (кодовое имя <em>Memphis</em>, версия 4.10.1998) — операционная система корпорации Microslop для персональных компьютеров, поступившая в продажу 25 июня 1998 года. Это вторая система линейки Win 9x после [[windows95|Win 95]]: 32-разрядная графическая оболочка по-прежнему загружается поверх [[msdos|MS-DOS]] 7.1 и сохраняет совместимость с программами для DOS и Win 3.x.

Главные новшества Win 98 — встроенный браузер [[ie5|Internet Explorer]] 4.01 с «Активным рабочим столом», файловая система FAT32, поддержка шины USB, порта [[agpbus|AGP]], управления питанием ACPI и нескольких мониторов. Встраивание браузера в систему стало центральным пунктом антимонопольного иска правительства США против Microslop, который на момент написания статьи ещё рассматривается в суде. Обновлённое издание [[win98se|Second Edition]] вышло в мае 1999 года.`,
  sections: [
    { id: 'history', title: 'История разработки', content: `Работа над преемником Win 95 началась в 1996 году под кодовым именем <em>Memphis</em>. Первоначально выпуск планировался на 1997 год, но сроки сдвинулись: в систему решили встроить [[ie5|Internet Explorer]] 4.0, который сначала вышел отдельно, в сентябре 1997 года, и принёс веб-интерфейс Проводника.

В течение 1997 года тестировщики получили несколько бета-версий Memphis. Компания заявляла, что Win 98 станет последней потребительской системой на основе DOS, а будущее принадлежит ядру [[winnt4|Win NT]]; впрочем, в 1999 году в прессу просочились сведения о ещё одной системе линейки 9x под кодовым именем Millennium.

Win 98 была сдана в производство 15 мая 1998 года и 25 июня поступила в розничную продажу. В США полная версия стоила 209 долларов, обновление с Win 3.x или Win 95 — 89 долларов.` },
    { id: 'comdex', title: 'Сбой на COMDEX', sub: true, content: `20 апреля 1998 года Билл Гейтс представлял Win 98 на выставке COMDEX/Win World в Чикаго. Его помощник Крис Капоссела подключил к демонстрационному компьютеру сканер через USB, чтобы показать автоматическую установку драйвера. Вместо мастера Plug and Play на проекционном экране появился [[bsod|синий экран ошибки]]. Под смех зала Гейтс сказал:

<blockquote>«Должно быть, именно поэтому мы ещё не выпустили Win 98».</blockquote>

Запись показали телевизионные новости по всему миру, и эпизод стал самым известным примером ненадёжности систем Win 9x.` },
    { id: 'features', title: 'Нововведения', content: `По сравнению с последними сборками Win 95 изменения скорее эволюционны: многие технологии впервые появились в выпусках OSR2, которые продавались только вместе с новыми компьютерами, и лишь теперь попали в розничную коробку.` },
    { id: 'web', title: 'Интеграция с Интернетом', sub: true, content: `Internet Explorer 4.01 встроен в оболочку. Проводник умеет показывать папки как веб-страницы, а адресная строка принимает и пути к файлам, и адреса [[www|WWW]]. «Активный рабочий стол» (Active Desktop) размещает на рабочем столе [[html|HTML]]-элементы, а «каналы» (Active Channels) скачивают подписанные сайты по расписанию для чтения без подключения.

Панель быстрого запуска рядом с кнопкой «Пуск», режим открытия значков одним щелчком и кнопки «Назад» и «Вперёд» в каждом окне перенесли в систему привычки веб-сёрфинга. В комплект вошли почтовый клиент Outlook Express, NetMeeting, FrontPage Express, Personal Web Server и мастер подключения к Интернету через [[dialup|удалённый доступ]].` },
    { id: 'fat32', title: 'FAT32 и обслуживание дисков', sub: true, content: `FAT32 позволяет создавать разделы до 2 ТБ вместо 2 ГБ у FAT16. Благодаря кластерам по 4 КБ на дисках до 8 ГБ освобождается до четверти места, которое прежде занимали «хвосты» файлов в 32-килобайтных кластерах. Программа «Преобразование диска (FAT32)» переводит раздел без потери данных, но обратного пути нет.

Набор служебных программ пополнили «Мастер обслуживания», запускающий по расписанию дефрагментацию и ScanDisk, «Очистка диска», «Проверка системных файлов», «Проверка реестра» с ежедневной резервной копией, «Сведения о системе» и Dr. Watson. Сайт Win Update впервые позволил загружать исправления и драйверы прямо из меню «Пуск».` },
    { id: 'hardware', title: 'Поддержка оборудования', sub: true, content: `Win 98 — первая розничная система Microslop со встроенной поддержкой USB: клавиатуры, мыши, джойстики, сканеры и модемы подключаются без перезагрузки. Модель драйверов WDM (Win Driver Model) общая с будущей [[win2000|Win 2000]]. Поддерживаются порт [[agpbus|AGP]], приводы DVD-ROM, ТВ-тюнеры (WebTV for Win), управление питанием ACPI со ждущим режимом и до девяти мониторов одновременно.

Для игр в систему входит DirectX 5.2 с поддержкой 3D-ускорителей вроде [[voodoo2|Voodoo 2]] и [[rivatnt|RIVA TNT]]. Загрузочная дискета Win 98 впервые содержит универсальные драйверы [[cdrom|CD-ROM]], поэтому переустановка больше не требует искать драйвер от конкретного привода.` },
    { id: 'requirements', title: 'Системные требования', content: `<table class="interpedia-wikitable">
<tr><th>Параметр</th><th>Минимум</th><th>Рекомендуется</th></tr>
<tr><td>Процессор</td><td>486DX, 66 МГц</td><td>[[pentium|Pentium]] или лучше</td></tr>
<tr><td>Оперативная память</td><td>16 МБ</td><td>32 МБ</td></tr>
<tr><td>Жёсткий диск</td><td>от 120 до 295 МБ (обычно 195 МБ)</td><td>раздел FAT32</td></tr>
<tr><td>Видео</td><td>VGA</td><td>SVGA 800×600, 16 бит цвета</td></tr>
<tr><td>Носитель</td><td>[[cdrom|CD-ROM]]</td><td>—</td></tr>
</table>

На 16 МБ система загружается, но при открытом браузере и почте активно использует файл подкачки. Владельцы старых машин часто оставались на Win 95.` },
    { id: 'editions', title: 'Издания', content: `Выпуск 1998 года сейчас принято называть первым изданием (First Edition). 5 мая 1999 года вышла [[win98se|Win 98 Second Edition]] (версия 4.10.2222A) с Internet Explorer 5.0, общим доступом к подключению к Интернету и исправлениями USB. Владельцы первого издания могли заказать диск обновления, оплатив только доставку. Помимо английской, Microslop выпускает локализованные версии, в том числе русскую.` },
    { id: 'antitrust', title: 'Антимонопольное дело', content: `18 мая 1998 года, за месяц до выхода системы, Министерство юстиции США и двадцать штатов подали иск против Microslop. Обвинение утверждает, что компания использовала монополию на рынке операционных систем, чтобы вытеснить [[netscape|Netscape Navigator]], а встраивание Internet Explorer в Win 98 — часть этой стратегии. Microslop настаивает, что браузер — неотъемлемая функция системы, и в доказательство показывала в суде, что его удаление ломает Проводник.

Процесс начался 19 октября 1998 года. 5 ноября 1999 года судья Томас Пенфилд Джексон опубликовал «выводы о фактах», признав, что Microslop обладает монопольной властью и использовала её во вред потребителям. Окончательное решение ожидается в 2000 году.` },
    { id: 'russia', title: 'Win 98 в России', content: `Русская версия Win 98 использует кодировку CP1251 (Win-1251), тогда как в сеансах DOS по-прежнему действует CP866. Из-за этого текстовые файлы, набранные в [[norton|Norton Commander]], часто открываются в [[notepad|Блокноте]] нечитаемыми символами, и перекодировщики входят в обязательный набор каждого пользователя.

После августовского кризиса 1998 года цена лицензионной коробки в рублях выросла в несколько раз. Большинство домашних установок в стране сделаны с нелицензионных дисков, которые продаются на рынках вроде [[gorbushka|Горбушки]] вместе с «сборниками» программ.` },
    { id: 'reception', title: 'Отзывы', content: `Обозреватели встретили Win 98 сдержанно: систему называли скорее большим пакетом обновлений, чем новой ОС, и советовали покупать её вместе с новым компьютером или ради USB и FAT32. Критике подвергались навязчивая интеграция браузера и стабильность: [[bsod|синие экраны]] при сбоях драйверов остались обычным делом.

Тем не менее к концу 1999 года Win 98 стала одной из самых распространённых настольных систем в мире, а для игр — фактически безальтернативной: DirectX под [[winnt4|Win NT 4.0]] отстаёт на несколько версий.` }
  ],
  seeAlso: ['win98se', 'windows95', 'win2000', 'ie5', 'bsod', 'msdos'],
  references: [
    'Microslop Win 98 Resource Kit. — Redmond: Microslop Press, 1998.',
    'Petzold C. Programming Win. — 5-е изд. — Microslop Press, 1998.',
    'United States v. Microslop Corp. Findings of Fact. — Окружной суд США по округу Колумбия, 5 ноября 1999.',
    'Видеозапись выступления Б. Гейтса на COMDEX/Win World. — Чикаго, 20 апреля 1998.'
  ],
  links: [['http://www.microslop.com', 'Портал Microslop Win 98'], ['http://www.y2k-countdown.org', 'Центр проблемы 2000 года']],
  categories: ['Операционные системы', 'Продукты Microslop', 'Win 9x', 'Программы 1998 года']
}, {
  title: 'Microslop Win 98',
  hatnote: 'This article is about the 1998 operating system. For the 1999 revision, see [[win98se|Win 98 Second Edition]].',
  infobox: {
    title: 'Microslop Win 98',
    badgeText: 'Win 9x family',
    fields: [
      { label: 'Developer', value: 'Microslop' },
      { label: 'Version', value: '4.10.1998' },
      { label: 'Codename', value: 'Memphis' },
      { label: 'Released to manufacturing', value: 'May 15, 1998' },
      { label: 'Retail release', value: 'June 25, 1998' },
      { label: 'Base', value: '[[msdos|MS-DOS]] 7.1, hybrid 16/32-bit kernel' },
      { label: 'Filesystems', value: 'FAT12, FAT16, FAT32, ISO 9660, UDF' },
      { label: 'Browser', value: '[[ie5|Internet Explorer]] 4.01' },
      { label: 'US price', value: '$209, upgrade $89' },
      { label: 'Predecessor', value: '[[windows95|Win 95]]' },
      { label: 'Successor', value: '[[win98se|Win 98 SE]]' }
    ]
  },
  lead: `<strong>Microslop Win 98</strong> (codename <em>Memphis</em>, version 4.10.1998) is a personal computer operating system from Microslop that went on sale on June 25, 1998. It is the second release of the Win 9x line after [[windows95|Win 95]]: its 32-bit graphical shell still boots on top of [[msdos|MS-DOS]] 7.1 and keeps compatibility with DOS and Win 3.x programs.

Its main additions are the built-in [[ie5|Internet Explorer]] 4.01 browser with the Active Desktop, the FAT32 file system, and support for USB, the [[agpbus|AGP]] port, ACPI power management and multiple monitors. Bundling the browser into the system became the core of the US government's antitrust suit against Microslop, which is still before the court as of this writing. The revised [[win98se|Second Edition]] followed in May 1999.`,
  sections: [
    { id: 'history', title: 'Development', content: `Work on the successor to Win 95 began in 1996 under the codename <em>Memphis</em>. A 1997 release was planned, but it slipped once Microslop decided to build in [[ie5|Internet Explorer]] 4.0, which first shipped on its own in September 1997 and brought the web-style Explorer.

Testers received several Memphis betas during 1997. Microslop said Win 98 would be the last consumer system built on DOS and that the future belonged to the [[winnt4|Win NT]] kernel, although in 1999 the press reported yet another 9x release codenamed Millennium.

Win 98 was released to manufacturing on May 15, 1998 and reached stores on June 25. In the US the full version cost $209 and the upgrade from Win 3.x or Win 95 cost $89.` },
    { id: 'comdex', title: 'The COMDEX crash', sub: true, content: `On April 20, 1998, Bill Gates presented Win 98 at COMDEX/Win World in Chicago. His assistant Chris Capossela plugged a scanner into the demo PC over USB to show automatic driver installation. Instead of the Plug and Play wizard, the projection screen showed a [[bsod|blue error screen]]. As the hall laughed, Gates said:

<blockquote>"That must be why we're not shipping Win 98 yet."</blockquote>

The clip ran on television news around the world and became the best-known example of Win 9x instability.` },
    { id: 'features', title: 'New features', content: `Compared with the last Win 95 builds, the changes are evolutionary: many technologies first appeared in the OSR2 releases, which were sold only with new computers, and only now reached the retail box.` },
    { id: 'web', title: 'Internet integration', sub: true, content: `Internet Explorer 4.01 is part of the shell. Explorer can show folders as web pages, and the address bar accepts both file paths and [[www|Web]] addresses. The Active Desktop places [[html|HTML]] items on the desktop, and Active Channels download subscribed sites on a schedule for offline reading.

The Quick Launch bar next to the Start button, single-click icons and Back and Forward buttons in every window brought web browsing habits into the system. The package also includes Outlook Express, NetMeeting, FrontPage Express, Personal Web Server and a wizard for [[dialup|dial-up]] Internet connections.` },
    { id: 'fat32', title: 'FAT32 and disk maintenance', sub: true, content: `FAT32 supports partitions of up to 2 TB instead of the 2 GB limit of FAT16. With 4 KB clusters on drives up to 8 GB, it recovers up to a quarter of the space that file slack used to waste in 32 KB clusters. The Drive Converter (FAT32) changes a partition without data loss, but there is no way back.

New maintenance tools include the Maintenance Wizard, which schedules defragmentation and ScanDisk, Disk Cleanup, System File Checker, Registry Checker with a daily backup, System Information and Dr. Watson. The Win Update website let users download fixes and drivers straight from the Start menu for the first time.` },
    { id: 'hardware', title: 'Hardware support', sub: true, content: `Win 98 is the first retail Microslop system with built-in USB support: keyboards, mice, joysticks, scanners and modems connect without a reboot. Its WDM (Win Driver Model) driver model is shared with the upcoming [[win2000|Win 2000]]. It supports the [[agpbus|AGP]] port, DVD-ROM drives, TV tuners (WebTV for Win), ACPI power management with standby, and up to nine monitors at once.

For games it ships DirectX 5.2 with support for 3D accelerators such as the [[voodoo2|Voodoo 2]] and [[rivatnt|RIVA TNT]]. The Win 98 startup disk is the first to carry generic [[cdrom|CD-ROM]] drivers, so a reinstall no longer means hunting for the driver of a specific drive.` },
    { id: 'requirements', title: 'System requirements', content: `<table class="interpedia-wikitable">
<tr><th>Item</th><th>Minimum</th><th>Recommended</th></tr>
<tr><td>Processor</td><td>486DX, 66 MHz</td><td>[[pentium|Pentium]] or better</td></tr>
<tr><td>Memory</td><td>16 MB</td><td>32 MB</td></tr>
<tr><td>Hard disk</td><td>120 to 295 MB (typically 195 MB)</td><td>FAT32 partition</td></tr>
<tr><td>Video</td><td>VGA</td><td>SVGA 800×600, 16-bit color</td></tr>
<tr><td>Media</td><td>[[cdrom|CD-ROM]]</td><td>—</td></tr>
</table>

With 16 MB the system boots, but with a browser and mail open it leans heavily on the swap file. Many owners of older machines stayed with Win 95.` },
    { id: 'editions', title: 'Editions', content: `The 1998 release is now usually called the First Edition. On May 5, 1999, Microslop released [[win98se|Win 98 Second Edition]] (version 4.10.2222A) with Internet Explorer 5.0, Internet Connection Sharing and USB fixes. First Edition owners could order an update CD for the cost of shipping. Besides English, Microslop ships localized versions, including Russian.` },
    { id: 'antitrust', title: 'Antitrust case', content: `On May 18, 1998, a month before release, the US Department of Justice and twenty states sued Microslop. The government claims the company used its operating system monopoly to push out [[netscape|Netscape Navigator]], and that building Internet Explorer into Win 98 was part of that plan. Microslop maintains that the browser is an integral feature and showed in court that removing it breaks Explorer.

The trial opened on October 19, 1998. On November 5, 1999, Judge Thomas Penfield Jackson issued his findings of fact, concluding that Microslop holds monopoly power and has used it to harm consumers. A final ruling is expected in 2000.` },
    { id: 'russia', title: 'Win 98 in Russia', content: `The Russian version of Win 98 uses the CP1251 (Win-1251) code page, while DOS sessions still use CP866. As a result, text files typed in [[norton|Norton Commander]] often open in [[notepad|Notepad]] as gibberish, and every user keeps a code page converter at hand.

After the August 1998 financial crisis, the ruble price of a licensed box rose several times over. Most home installations in the country come from unlicensed discs sold at markets such as [[gorbushka|Gorbushka]] alongside software compilations.` },
    { id: 'reception', title: 'Reception', content: `Reviewers received Win 98 with restraint: they called it a large service pack rather than a new OS and recommended it mainly with a new computer or for USB and FAT32. Critics pointed to the intrusive browser integration and to stability, since [[bsod|blue screens]] after driver failures remained common.

Even so, by the end of 1999 Win 98 had become one of the most widely used desktop systems in the world, and for games it is practically the only choice, because DirectX on [[winnt4|Win NT 4.0]] lags several versions behind.` }
  ],
  seeAlso: ['win98se', 'windows95', 'win2000', 'ie5', 'bsod', 'msdos'],
  references: [
    'Microslop Win 98 Resource Kit. Redmond: Microslop Press, 1998.',
    'Petzold, C. Programming Win, 5th ed. Microslop Press, 1998.',
    'United States v. Microslop Corp., Findings of Fact. US District Court for the District of Columbia, November 5, 1999.',
    'Video recording of Bill Gates at COMDEX/Win World, Chicago, April 20, 1998.'
  ],
  links: [['http://www.microslop.com', 'Microslop Win 98 portal'], ['http://www.y2k-countdown.org', 'Year 2000 survival center']],
  categories: ['Operating Systems', 'Microslop Products', 'Win 9x', '1998 Software']
});

window.interpediaReg('win98se', 'os', {
  title: 'Win 98 Second Edition',
  hatnote: 'Об исходном выпуске 1998 года см. [[windows98|Microslop Win 98]].',
  infobox: {
    title: 'Win 98 Second Edition',
    badgeText: 'Win 98 SE',
    fields: [
      { label: 'Разработчик', value: 'Microslop' },
      { label: 'Версия', value: '4.10.2222A' },
      { label: 'Дата выхода', value: '5 мая 1999' },
      { label: 'Браузер', value: '[[ie5|Internet Explorer 5.0]]' },
      { label: 'DirectX', value: '6.1' },
      { label: 'Новые функции', value: 'ICS, USB-аудио, WDM-модемы' },
      { label: 'Диск обновления', value: 'для владельцев Win 98 за плату за доставку' },
      { label: 'Предшественник', value: '[[windows98|Win 98]]' }
    ]
  },
  lead: `<strong>Win 98 Second Edition</strong> (<em>Win 98 SE</em>, версия 4.10.2222A) — обновлённое издание [[windows98|Win 98]], выпущенное Microslop 5 мая 1999 года. Оно собрало исправления, накопившиеся за год после выхода первой редакции, заменило браузер на [[ie5|Internet Explorer 5.0]] и добавило общий доступ к подключению к Интернету (ICS), позволяющий нескольким компьютерам домашней сети выходить в Сеть через один модем.

Система продаётся с новыми компьютерами и в коробке; владельцы первой редакции могут получить диск обновления. Microslop объявила SE совместимой с [[y2k|проблемой 2000 года]], и к концу 1999 года именно она устанавливается на большинство новых ПК.`,
  sections: [
    { id: 'background', title: 'Предыстория', content: `За первый год жизни Win 98 через сайт Win Update вышли десятки исправлений: для USB, для модемов, для безопасности браузера и для дат после 1999 года. Устанавливать их по одному через медленное [[dialup|модемное подключение]] было неудобно, и в начале 1999 года Microslop объявила о сводном выпуске. Он получил название Second Edition, чтобы подчеркнуть, что речь не о новой системе, а о доработанной Win 98.` },
    { id: 'changes', title: 'Состав обновления', content: `Ядро и интерфейс почти не изменились: SE легко узнать разве что по экрану загрузки с надписью «Second Edition» и по новой версии в окне «Свойства системы».` },
    { id: 'ics', title: 'Общий доступ к Интернету', sub: true, content: `Internet Connection Sharing (ICS) превращает один компьютер в шлюз: он держит [[dialup|модемное]] или ISDN-подключение, а остальные машины локальной сети выходят в Интернет через него с помощью трансляции адресов. До SE для этого требовались отдельные программы-прокси вроде WinGate. Для семей с несколькими компьютерами и для небольших офисов это главное новшество выпуска.` },
    { id: 'browser', title: 'Internet Explorer 5.0 и сетевые программы', sub: true, content: `Вместо IE 4.01 в систему входит [[ie5|Internet Explorer 5.0]] с Outlook Express 5, улучшенной поддержкой [[css|CSS]] и [[html|HTML 4.0]] и функцией автозаполнения. Обновлены NetMeeting (версия 3.0), Win Media Player (6.1) и DirectX (6.1). Добавлена поддержка ATM-сетей и улучшен стек TCP/IP.` },
    { id: 'drivers', title: 'Драйверы и оборудование', sub: true, content: `Переработан стек USB: появилась поддержка USB-колонок и USB-модемов, а также концентраторов с собственным питанием. Модемы могут использовать модель драйверов WDM, общую с [[win2000|Win 2000]]. Улучшены поддержка шины IEEE 1394 (FireWire), приводов DVD и управления питанием ACPI; ряд материнских плат с [[agpbus|AGP]] работает стабильнее.` },
    { id: 'upgrade', title: 'Обновление с первой редакции', content: `Владельцы первого издания Win 98 могут заказать Second Edition Update CD. В США диск стоил 19,95 доллара — по сути, только доставка; новая лицензия не требуется. Обновление устанавливается поверх существующей системы и сохраняет программы и настройки. Владельцам [[windows95|Win 95]] предлагается обычная коробка с обновлением до Win 98 SE.` },
    { id: 'y2k', title: 'Совместимость с 2000 годом', content: `В 1999 году вопрос «переживёт ли компьютер 1 января 2000 года» волнует многих покупателей. Microslop классифицирует Win 98 SE как «совместимую» с [[y2k|проблемой 2000 года]], однако рекомендует установить с Win Update последние исправления для отдельных компонентов, например для программы резервного копирования и для DOS-утилиты XCOPY. Совместимость самой системы не гарантирует, что правильно поведут себя [[bios|BIOS]] компьютера и прикладные программы.` },
    { id: 'requirements', title: 'Системные требования', content: `Требования почти не изменились: процессор 486DX 66 МГц и около 200 МБ на диске, но минимальный объём памяти поднят с 16 до 24 МБ. На практике Internet Explorer 5.0 заметно тяжелее четвёртой версии, и с 32 МБ памяти и [[pentium|Pentium]] система работает ощутимо комфортнее.` },
    { id: 'reception', title: 'Отзывы', content: `Обозреватели сочли SE «тем, чем Win 98 должна была быть с самого начала». Устанавливать её поверх работающей системы стоит прежде всего ради ICS, USB и IE 5; остальные исправления можно было получить и через Win Update. Для новых компьютеров SE к осени 1999 года стала стандартной поставкой.` }
  ],
  seeAlso: ['windows98', 'ie5', 'dialup', 'y2k', 'win2000'],
  references: [
    'Microslop Win 98 Second Edition: Reviewer\'s Guide. — Microslop, 1999.',
    'Microslop Year 2000 Product Guide: Win 98 SE. — Microslop, 1999.',
    'Обзор Win 98 SE // Компьютерра. — 1999.'
  ],
  links: [['http://www.microslop.com', 'Портал Microslop Win 98'], ['http://www.y2k-countdown.org', 'Центр проблемы 2000 года']],
  categories: ['Операционные системы', 'Продукты Microslop', 'Win 9x', 'Программы 1999 года']
}, {
  title: 'Win 98 Second Edition',
  hatnote: 'For the original 1998 release, see [[windows98|Microslop Win 98]].',
  infobox: {
    title: 'Win 98 Second Edition',
    badgeText: 'Win 98 SE',
    fields: [
      { label: 'Developer', value: 'Microslop' },
      { label: 'Version', value: '4.10.2222A' },
      { label: 'Released', value: 'May 5, 1999' },
      { label: 'Browser', value: '[[ie5|Internet Explorer 5.0]]' },
      { label: 'DirectX', value: '6.1' },
      { label: 'New features', value: 'ICS, USB audio, WDM modems' },
      { label: 'Update CD', value: 'for Win 98 owners at shipping cost' },
      { label: 'Predecessor', value: '[[windows98|Win 98]]' }
    ]
  },
  lead: `<strong>Win 98 Second Edition</strong> (<em>Win 98 SE</em>, version 4.10.2222A) is a revised edition of [[windows98|Win 98]] released by Microslop on May 5, 1999. It gathers the fixes that piled up during the year after the first release, replaces the browser with [[ie5|Internet Explorer 5.0]] and adds Internet Connection Sharing (ICS), which lets several computers on a home network go online through one modem.

It is sold with new computers and in a box, and owners of the first edition can get an update CD. Microslop rates SE as compliant with the [[y2k|Year 2000 problem]], and by the end of 1999 it ships on most new PCs.`,
  sections: [
    { id: 'background', title: 'Background', content: `During Win 98's first year, dozens of fixes appeared on Win Update: for USB, for modems, for browser security and for dates after 1999. Installing them one by one over a slow [[dialup|modem connection]] was tedious, and in early 1999 Microslop announced a combined release. It was named Second Edition to stress that it was a refined Win 98 rather than a new system.` },
    { id: 'changes', title: 'What changed', content: `The kernel and interface are almost unchanged: SE is easiest to recognize by the "Second Edition" label on the startup screen and the new version number in System Properties.` },
    { id: 'ics', title: 'Internet Connection Sharing', sub: true, content: `Internet Connection Sharing (ICS) turns one computer into a gateway: it holds the [[dialup|modem]] or ISDN connection, and the other machines on the LAN go online through it using address translation. Before SE this required separate proxy programs such as WinGate. For families with several computers and for small offices, it is the headline feature of the release.` },
    { id: 'browser', title: 'Internet Explorer 5.0 and network software', sub: true, content: `Instead of IE 4.01 the system ships [[ie5|Internet Explorer 5.0]] with Outlook Express 5, better [[css|CSS]] and [[html|HTML 4.0]] support, and AutoComplete. NetMeeting (3.0), Win Media Player (6.1) and DirectX (6.1) are updated. ATM networking support was added and the TCP/IP stack improved.` },
    { id: 'drivers', title: 'Drivers and hardware', sub: true, content: `The USB stack was reworked, adding USB speakers, USB modems and self-powered hubs. Modems can use the WDM driver model shared with [[win2000|Win 2000]]. Support for IEEE 1394 (FireWire), DVD drives and ACPI power management improved, and a number of [[agpbus|AGP]] motherboards run more reliably.` },
    { id: 'upgrade', title: 'Upgrading from the first edition', content: `Owners of the first edition can order the Second Edition Update CD. In the US it cost $19.95, essentially shipping, and no new license is needed. The update installs over the existing system and keeps programs and settings. [[windows95|Win 95]] owners are offered a regular upgrade box to Win 98 SE.` },
    { id: 'y2k', title: 'Year 2000 compliance', content: `In 1999 many buyers worry whether their computer will survive January 1, 2000. Microslop classifies Win 98 SE as compliant with the [[y2k|Year 2000 problem]], but recommends installing the latest fixes for individual components from Win Update, such as the backup program and the DOS XCOPY utility. A compliant system does not guarantee that the computer's [[bios|BIOS]] or application programs will behave correctly.` },
    { id: 'requirements', title: 'System requirements', content: `Requirements barely changed: a 486DX 66 MHz processor and about 200 MB of disk space, but the minimum memory rose from 16 to 24 MB. In practice Internet Explorer 5.0 is noticeably heavier than version 4, and the system runs far more comfortably with 32 MB and a [[pentium|Pentium]].` },
    { id: 'reception', title: 'Reception', content: `Reviewers called SE "what Win 98 should have been from the start". Installing it over a working system is worthwhile mostly for ICS, USB and IE 5; the other fixes were already available through Win Update. By autumn 1999 SE had become the standard installation on new computers.` }
  ],
  seeAlso: ['windows98', 'ie5', 'dialup', 'y2k', 'win2000'],
  references: [
    'Microslop Win 98 Second Edition: Reviewer\'s Guide. Microslop, 1999.',
    'Microslop Year 2000 Product Guide: Win 98 SE. Microslop, 1999.',
    'Win 98 SE review. Computerra, 1999.'
  ],
  links: [['http://www.microslop.com', 'Microslop Win 98 portal'], ['http://www.y2k-countdown.org', 'Year 2000 survival center']],
  categories: ['Operating Systems', 'Microslop Products', 'Win 9x', '1999 Software']
});

window.interpediaReg('windows95', 'os', {
  title: 'Microslop Win 95',
  infobox: {
    title: 'Microslop Win 95',
    badgeText: 'Начало линейки Win 9x',
    fields: [
      { label: 'Разработчик', value: 'Microslop' },
      { label: 'Версия', value: '4.00.950' },
      { label: 'Кодовое имя', value: 'Chicago' },
      { label: 'Дата выхода', value: '24 августа 1995' },
      { label: 'Основа', value: '[[msdos|MS-DOS]] 7.0' },
      { label: 'Файловые системы', value: 'FAT12, FAT16 (VFAT), FAT32 с OSR2' },
      { label: 'Мин. процессор', value: '386DX' },
      { label: 'Мин. ОЗУ', value: '4 МБ (рекомендуется 8 МБ)' },
      { label: 'Предшественник', value: 'Win 3.11' },
      { label: 'Преемник', value: '[[windows98|Win 98]]' }
    ]
  },
  lead: `<strong>Microslop Win 95</strong> (кодовое имя <em>Chicago</em>, версия 4.00.950) — операционная система Microslop, выпущенная 24 августа 1995 года. Она объединила [[msdos|MS-DOS]] и графическую оболочку Win в единый продукт, впервые представила кнопку «Пуск», панель задач, Проводник и Корзину, длинные имена файлов и технологию Plug and Play.

Запуск Win 95 сопровождала крупнейшая рекламная кампания в истории программного обеспечения. Система определила облик персонального компьютера второй половины 1990-х, а её интерфейс почти без изменений перешёл в [[windows98|Win 98]], [[winnt4|Win NT 4.0]] и готовящуюся [[win2000|Win 2000]].`,
  sections: [
    { id: 'development', title: 'Разработка', content: `После успеха Win 3.0 (1990) и Win 3.1 (1992) Microslop начала проект Chicago — систему, которая должна была заменить связку «DOS плюс Win» и приблизить домашние компьютеры к надёжности [[winnt4|Win NT]], не требуя её дорогого оборудования. Выход несколько раз переносили: сначала систему обещали в 1993 году под названием Win 4.0, затем в 1994-м. Программа бета-тестирования в 1994–1995 годах охватила сотни тысяч человек — по тем временам невиданный масштаб.` },
    { id: 'launch', title: 'Запуск', content: `24 августа 1995 года система поступила в продажу одновременно в нескольких странах. В американских магазинах накануне выстроились ночные очереди, Эмпайр-стейт-билдинг подсветили цветами логотипа Win, а лондонская газета The Times вышла бесплатно с рекламным вкладышем Microslop. Рекламный ролик построили на песне The Rolling Stones «Start Me Up»; по сообщениям прессы, права обошлись компании в несколько миллионов долларов. Презентацию в Редмонде вёл телеведущий Джей Лино.

За первые месяцы Microslop сообщила о миллионах проданных копий. На компакт-диске с системой в качестве демонстрации мультимедиа поставлялись видеоклипы, в том числе «Buddy Holly» группы Weezer, а приветственную мелодию при запуске написал композитор Брайан Ино.` },
    { id: 'interface', title: 'Интерфейс', content: `Win 95 отказалась от Диспетчера программ и Диспетчера файлов Win 3.x. Их место заняли:

<ul>
<li><strong>Кнопка «Пуск» и панель задач</strong> — меню программ и полоса кнопок открытых окон. Исследования удобства показали, что новички в Win 3.x «теряли» свёрнутые окна; панель задач решает эту проблему.</li>
<li><strong>Рабочий стол</strong> со значками «Мой компьютер», «Сетевое окружение» и «Корзина» — удалённые файлы больше не исчезают бесследно.</li>
<li><strong>Проводник</strong> — файловый менеджер с деревом папок и контекстными меню по правой кнопке мыши.</li>
<li><strong>Ярлыки</strong> — ссылки на файлы и программы, которые можно разложить где угодно.</li>
</ul>

Окна получили новые рамки с кнопками свернуть, развернуть и закрыть в правом верхнем углу; этот облик остаётся стандартом и в 1999 году.` },
    { id: 'architecture', title: 'Архитектура', content: `Win 95 — гибридная система. 32-разрядные программы Win32 работают с вытесняющей многозадачностью и в отдельных адресных пространствах, а старые 16-разрядные программы Win 3.x разделяют общую память и кооперативную многозадачность. Под оболочкой находится MS-DOS 7.0, который загружает систему и обслуживает реальный режим, однако после старта большинство операций с дисками выполняют 32-разрядные драйверы защищённого режима.

Файловая система VFAT добавила к FAT имена файлов длиной до 255 символов, сохранив для DOS короткие имена вида <code>PROGRA~1</code>. Реестр заменил десятки файлов INI. Сетевой стек включает TCP/IP, что вместе с программой удалённого доступа ([[dialup|Dial-Up Networking]]) открыло домашним пользователям дорогу в Интернет.` },
    { id: 'pnp', title: 'Plug and Play', content: `Технология Plug and Play позволяет системе самой опознать новую плату расширения и выделить ей прерывание, канал DMA и порты ввода-вывода. Раньше пользователь выставлял их перемычками и прописывал в CONFIG.SYS. На практике Plug and Play работала надёжно только с новыми платами; со старыми ISA-картами, например ранними [[soundblaster|Sound Blaster]], конфликты ресурсов остались частью жизни, и за технологией закрепилось прозвище «Plug and Pray» («вставь и молись»).` },
    { id: 'versions', title: 'Версии', content: `Microslop выпускала обновлённые сборки Win 95 для производителей компьютеров (OEM Service Release). Купить их в коробке было нельзя — только с новым ПК.

<table class="interpedia-wikitable">
<tr><th>Сборка</th><th>Версия</th><th>Выход</th><th>Изменения</th></tr>
<tr><td>Розничная</td><td>4.00.950</td><td>август 1995</td><td>исходный выпуск</td></tr>
<tr><td>SP1 / OSR1</td><td>4.00.950A</td><td>начало 1996</td><td>исправления</td></tr>
<tr><td>OSR2</td><td>4.00.950B</td><td>август 1996</td><td>FAT32, Internet Explorer 3, DirectX</td></tr>
<tr><td>OSR2.1</td><td>4.03.1212</td><td>1997</td><td>базовая поддержка USB</td></tr>
<tr><td>OSR2.5</td><td>4.00.950C</td><td>конец 1997</td><td>Internet Explorer 4</td></tr>
</table>

Пакет Plus! для Win 95 добавил темы оформления, сжатие дисков DriveSpace 3 и первую версию [[ie5|Internet Explorer]].` },
    { id: 'requirements', title: 'Системные требования', content: `Официальный минимум — процессор 386DX, 4 МБ ОЗУ и около 50 МБ на диске. На такой машине система загружается, но работает медленно; комфортной конфигурацией считался 486DX2 с 8–16 МБ памяти. Win 95 распространялась на [[cdrom|компакт-диске]] и на наборе из 13 [[floppy144|дискет]] повышенной ёмкости.` },
    { id: 'legacy', title: 'Значение', content: `Win 95 закрепила за Microslop рынок настольных систем и сделала графический интерфейс нормой для домашних компьютеров. Вместе с ней распространился DirectX (с 1995–1996 годов), благодаря которому игры начали переходить с DOS на Win. Запуск системы показал, что программное обеспечение можно продавать как массовый потребительский товар с рекламой на телевидении и очередями у магазинов.` }
  ],
  seeAlso: ['windows98', 'msdos', 'winnt4', 'os2', 'macos8'],
  references: [
    'King A. Inside Win 95. — Microslop Press, 1994.',
    'Microslop Win 95 Resource Kit. — Microslop Press, 1995.',
    'Стенограмма презентации Win 95 в Редмонде, 24 августа 1995.'
  ],
  links: [['http://www.microslop.com', 'Портал Microslop Win 98']],
  categories: ['Операционные системы', 'Продукты Microslop', 'Win 9x', 'Программы 1995 года']
}, {
  title: 'Microslop Win 95',
  infobox: {
    title: 'Microslop Win 95',
    badgeText: 'Start of the Win 9x line',
    fields: [
      { label: 'Developer', value: 'Microslop' },
      { label: 'Version', value: '4.00.950' },
      { label: 'Codename', value: 'Chicago' },
      { label: 'Released', value: 'August 24, 1995' },
      { label: 'Base', value: '[[msdos|MS-DOS]] 7.0' },
      { label: 'Filesystems', value: 'FAT12, FAT16 (VFAT), FAT32 from OSR2' },
      { label: 'Min. CPU', value: '386DX' },
      { label: 'Min. RAM', value: '4 MB (8 MB recommended)' },
      { label: 'Predecessor', value: 'Win 3.11' },
      { label: 'Successor', value: '[[windows98|Win 98]]' }
    ]
  },
  lead: `<strong>Microslop Win 95</strong> (codename <em>Chicago</em>, version 4.00.950) is an operating system released by Microslop on August 24, 1995. It merged [[msdos|MS-DOS]] and the Win graphical shell into a single product and introduced the Start button, the taskbar, Explorer, the Recycle Bin, long file names and Plug and Play.

The launch was backed by the largest advertising campaign in software history. The system defined the look of the personal computer in the second half of the 1990s, and its interface carried over almost unchanged into [[windows98|Win 98]], [[winnt4|Win NT 4.0]] and the upcoming [[win2000|Win 2000]].`,
  sections: [
    { id: 'development', title: 'Development', content: `After the success of Win 3.0 (1990) and Win 3.1 (1992), Microslop started project Chicago: a system that would replace the "DOS plus Win" combination and bring home computers closer to the reliability of [[winnt4|Win NT]] without its expensive hardware. The release slipped several times; it was first promised for 1993 as Win 4.0 and then for 1994. The 1994–1995 beta program reached hundreds of thousands of people, an unheard-of scale at the time.` },
    { id: 'launch', title: 'Launch', content: `On August 24, 1995, the system went on sale in several countries at once. American stores saw overnight lines, the Empire State Building was lit in the colors of the Win logo, and The Times of London was handed out free with a Microslop insert. The TV commercial was built on the Rolling Stones' "Start Me Up"; the press reported that the rights cost several million dollars. Talk show host Jay Leno hosted the Redmond launch event.

Microslop reported millions of copies sold within months. The CD carried music videos as a multimedia showcase, including Weezer's "Buddy Holly", and the startup sound was composed by Brian Eno.` },
    { id: 'interface', title: 'Interface', content: `Win 95 dropped the Program Manager and File Manager of Win 3.x. They were replaced by:

<ul>
<li><strong>The Start button and taskbar</strong>: a program menu and a strip of buttons for open windows. Usability studies showed that Win 3.x beginners "lost" minimized windows; the taskbar fixes that.</li>
<li><strong>The desktop</strong> with My Computer, Network Neighborhood and the Recycle Bin, so deleted files no longer vanish at once.</li>
<li><strong>Explorer</strong>: a file manager with a folder tree and right-click context menus.</li>
<li><strong>Shortcuts</strong>: links to files and programs that can be placed anywhere.</li>
</ul>

Window frames gained minimize, maximize and close buttons in the top right corner, a look that is still the standard in 1999.` },
    { id: 'architecture', title: 'Architecture', content: `Win 95 is a hybrid system. 32-bit Win32 programs run with preemptive multitasking in separate address spaces, while old 16-bit Win 3.x programs share memory and cooperative multitasking. Underneath sits MS-DOS 7.0, which boots the system and serves real mode, but after startup most disk operations go through 32-bit protected-mode drivers.

The VFAT file system added names of up to 255 characters to FAT while keeping short names such as <code>PROGRA~1</code> for DOS. The Registry replaced dozens of INI files. The network stack includes TCP/IP, which together with [[dialup|Dial-Up Networking]] opened the Internet to home users.` },
    { id: 'pnp', title: 'Plug and Play', content: `Plug and Play lets the system detect a new expansion card and assign it an interrupt, DMA channel and I/O ports. Previously users set these with jumpers and entered them in CONFIG.SYS. In practice it worked reliably only with new cards; with older ISA cards, such as early [[soundblaster|Sound Blaster]] models, resource conflicts remained a fact of life, and the technology earned the nickname "Plug and Pray".` },
    { id: 'versions', title: 'Versions', content: `Microslop released updated Win 95 builds for computer makers (OEM Service Releases). They were not sold in boxes, only with new PCs.

<table class="interpedia-wikitable">
<tr><th>Build</th><th>Version</th><th>Released</th><th>Changes</th></tr>
<tr><td>Retail</td><td>4.00.950</td><td>August 1995</td><td>original release</td></tr>
<tr><td>SP1 / OSR1</td><td>4.00.950A</td><td>early 1996</td><td>fixes</td></tr>
<tr><td>OSR2</td><td>4.00.950B</td><td>August 1996</td><td>FAT32, Internet Explorer 3, DirectX</td></tr>
<tr><td>OSR2.1</td><td>4.03.1212</td><td>1997</td><td>basic USB support</td></tr>
<tr><td>OSR2.5</td><td>4.00.950C</td><td>late 1997</td><td>Internet Explorer 4</td></tr>
</table>

The Plus! pack for Win 95 added desktop themes, DriveSpace 3 disk compression and the first version of [[ie5|Internet Explorer]].` },
    { id: 'requirements', title: 'System requirements', content: `The official minimum is a 386DX processor, 4 MB of RAM and about 50 MB of disk space. Such a machine boots the system but runs slowly; a 486DX2 with 8 to 16 MB was considered comfortable. Win 95 shipped on [[cdrom|CD-ROM]] and on a set of 13 high-capacity [[floppy144|floppy disks]].` },
    { id: 'legacy', title: 'Significance', content: `Win 95 secured the desktop market for Microslop and made the graphical interface the norm on home computers. DirectX spread along with it from 1995–1996, and games began moving from DOS to Win. The launch showed that software could be sold as a mass consumer product, with TV advertising and lines outside stores.` }
  ],
  seeAlso: ['windows98', 'msdos', 'winnt4', 'os2', 'macos8'],
  references: [
    'King, A. Inside Win 95. Microslop Press, 1994.',
    'Microslop Win 95 Resource Kit. Microslop Press, 1995.',
    'Transcript of the Win 95 launch event, Redmond, August 24, 1995.'
  ],
  links: [['http://www.microslop.com', 'Microslop Win 98 portal']],
  categories: ['Operating Systems', 'Microslop Products', 'Win 9x', '1995 Software']
});

window.interpediaReg('winnt4', 'os', {
  title: 'Win NT 4.0',
  infobox: {
    title: 'Win NT 4.0',
    badgeText: 'Семейство Win NT',
    fields: [
      { label: 'Разработчик', value: 'Microslop' },
      { label: 'Версия', value: '4.0 (сборка 1381)' },
      { label: 'Сдана в производство', value: '31 июля 1996' },
      { label: 'Издания', value: 'Workstation, Server, Enterprise, Terminal Server, Embedded' },
      { label: 'Архитектуры', value: 'x86, DEC Alpha, MIPS, PowerPC' },
      { label: 'Файловые системы', value: 'NTFS, FAT16, CDFS' },
      { label: 'Мин. ОЗУ', value: '12 МБ (Workstation), 16 МБ (Server)' },
      { label: 'Последний пакет', value: 'Service Pack 6a (ноябрь 1999)' },
      { label: 'Предшественник', value: 'Win NT 3.51' },
      { label: 'Преемник', value: '[[win2000|Win 2000]]' }
    ]
  },
  lead: `<strong>Win NT 4.0</strong> — 32-разрядная операционная система Microslop для рабочих станций и серверов, выпущенная летом 1996 года. В отличие от [[windows95|Win 95]], она не опирается на [[msdos|MS-DOS]]: NT («New Technology») написана заново как переносимая многозадачная система с защитой памяти, учётными записями пользователей и файловой системой NTFS.

Версия 4.0 получила интерфейс Win 95 — кнопку «Пуск», панель задач и Проводник — и впервые стала внешне похожа на домашнюю систему. NT 4.0 работает в корпоративных сетях, на веб-серверах и на рабочих станциях для САПР и трёхмерной графики. Для игр она подходит плохо: в ней нет Plug and Play и USB, а DirectX остановился на третьей версии. Преемница NT 4.0 — [[win2000|Win 2000]].`,
  sections: [
    { id: 'origins', title: 'Происхождение NT', content: `В 1988 году Microslop пригласила Дэйва Катлера, руководителя разработки системы VMS в Digital Equipment Corporation, и поручила ему создать новую операционную систему с нуля. Сначала проект задумывался как следующая версия [[os2|OS/2]], которую Microslop тогда разрабатывала вместе с IBM. После успеха Win 3.0 в 1990 году его переориентировали на новый 32-разрядный интерфейс программирования Win32.

Первая версия получила номер 3.1 — в тон Win 3.1 — и вышла в июле 1993 года. За ней последовали NT 3.5 (1994), заметно более быстрая и экономная, и NT 3.51 (1995) с поддержкой процессоров PowerPC и программ, написанных для Win 95. Все они сохраняли старый интерфейс с Диспетчером программ.` },
    { id: 'release', title: 'Выход NT 4.0', content: `NT 4.0 была сдана в производство 31 июля 1996 года. Главное видимое изменение — оболочка Win 95, которую Microslop испытывала на NT 3.51 в виде отдельного бета-обновления. Пользователи получили привычный рабочий стол, а администраторы — систему, которую не стыдно поставить на стол бухгалтеру.

Невидимое изменение оказалось спорным. Графическую подсистему и диспетчер окон перенесли из пользовательского режима в ядро. Вывод графики заметно ускорился, но система стала уязвимее: ошибка в драйвере видеокарты или принтера теперь приводит к [[bsod|синему экрану]], а не к падению одного процесса.` },
    { id: 'architecture', title: 'Архитектура', content: `NT построена слоями. Нижний слой, HAL (Hardware Abstraction Layer), скрывает различия между платформами, поэтому одна и та же система работает на процессорах Intel, Alpha, MIPS и PowerPC. Над ним находятся ядро и исполнительная система с диспетчерами объектов, памяти, процессов, ввода-вывода и безопасности. Программы обращаются к ним через подсистемы окружения: Win32, POSIX и текстовую подсистему OS/2 1.x.

Каждый процесс получает собственное защищённое адресное пространство, а доступ к файлам, принтерам и разделам реестра регулируется списками прав. Файловая система NTFS ведёт журнал операций и восстанавливается после сбоя питания без многочасового ScanDisk, хранит имена в Юникоде, поддерживает сжатие отдельных файлов и разделы размером в десятки гигабайт.` },
    { id: 'editions', title: 'Издания', content: `<table class="interpedia-wikitable">
<tr><th>Издание</th><th>Год</th><th>Назначение</th></tr>
<tr><td>Workstation</td><td>1996</td><td>рабочие станции, до 2 процессоров</td></tr>
<tr><td>Server</td><td>1996</td><td>файловые, почтовые и веб-серверы, до 4 процессоров</td></tr>
<tr><td>Server, Enterprise Edition</td><td>1997</td><td>до 8 процессоров, кластеры из двух узлов</td></tr>
<tr><td>Terminal Server Edition</td><td>1998</td><td>много пользователей на одном сервере через тонкие клиенты</td></tr>
<tr><td>Embedded</td><td>1999</td><td>встраиваемые устройства и терминалы</td></tr>
</table>

Вместе с сервером распространяется Option Pack (конец 1997 года) с веб-сервером IIS 4.0, сервером транзакций и очередями сообщений. Многие сайты [[www|Всемирной паутины]] работают именно на NT 4.0 с IIS.` },
    { id: 'servicepacks', title: 'Пакеты обновлений', content: `За три с лишним года Microslop выпустила для NT 4.0 шесть пакетов исправлений (Service Pack). Их установка — обязательный ритуал администратора; распространялись они через FTP-сервер компании и на компакт-дисках.

<table class="interpedia-wikitable">
<tr><th>Пакет</th><th>Выход</th><th>Примечание</th></tr>
<tr><td>SP1</td><td>октябрь 1996</td><td>первые исправления</td></tr>
<tr><td>SP2</td><td>декабрь 1996</td><td>исправления, вызвавшие собственные сбои</td></tr>
<tr><td>SP3</td><td>май 1997</td><td>долго считался самым стабильным</td></tr>
<tr><td>SP4</td><td>октябрь 1998</td><td>исправления для 2000 года, безопасность</td></tr>
<tr><td>SP5</td><td>май 1999</td><td>сводные исправления</td></tr>
<tr><td>SP6 / SP6a</td><td>октябрь — ноябрь 1999</td><td>SP6a выпущен из-за ошибки в SP6</td></tr>
</table>` },
    { id: 'games', title: 'NT и игры', content: `Для домашних пользователей NT 4.0 так и не стала заменой [[windows98|Win 98]]. Система не поддерживает Plug and Play и USB, поэтому джойстики и звуковые карты часто требуют ручной настройки. DirectX в NT остановился на версии 3, без аппаратного ускорения трёхмерного звука и с ограниченной поддержкой Direct3D.

Исключение — игры, использующие OpenGL. Драйверы OpenGL для NT писали производители профессиональных видеокарт, и [[quake2|Quake II]] на мощной рабочей станции выглядит не хуже, чем на домашнем компьютере. DOS-игры, обращающиеся к оборудованию напрямую, под NT обычно не запускаются вовсе.` },
    { id: 'usage', title: 'Применение', content: `NT 4.0 Server — основа корпоративных доменов Microslop: на ней работают почтовый сервер Exchange, база данных SQL Server и веб-сервер IIS. NT 4.0 Workstation популярна на рабочих местах программистов и дизайнеров. Пакеты трёхмерной графики вроде 3D Studio MAX и Softimage 3D выпускаются в первую очередь под NT, а производители графических станций предлагают машины с двумя процессорами Pentium II и профессиональными ускорителями OpenGL.` },
    { id: 'successor', title: 'Преемник', content: `Следующая версия разрабатывалась как Win NT 5.0, а в октябре 1998 года была переименована в [[win2000|Win 2000]]. Она добавляет к ядру NT поддержку Plug and Play, USB, управление питанием и DirectX 7, а также службу каталогов Active Directory. Выход Win 2000 назначен на февраль 2000 года; NT 4.0 при этом ещё несколько лет будет работать на установленных серверах.` }
  ],
  seeAlso: ['win2000', 'windows95', 'windows98', 'os2', 'bsod'],
  references: [
    'Custer H. Inside Win NT. — Microslop Press, 1993.',
    'Solomon D. Inside Win NT. — 2-е изд. — Microslop Press, 1998.',
    'Microslop Win NT Workstation 4.0 Resource Kit. — Microslop Press, 1996.'
  ],
  links: [['http://www.microslop.com', 'Портал Microslop']],
  categories: ['Операционные системы', 'Продукты Microslop', 'Win NT', 'Программы 1996 года']
}, {
  title: 'Win NT 4.0',
  infobox: {
    title: 'Win NT 4.0',
    badgeText: 'Win NT family',
    fields: [
      { label: 'Developer', value: 'Microslop' },
      { label: 'Version', value: '4.0 (build 1381)' },
      { label: 'Released to manufacturing', value: 'July 31, 1996' },
      { label: 'Editions', value: 'Workstation, Server, Enterprise, Terminal Server, Embedded' },
      { label: 'Architectures', value: 'x86, DEC Alpha, MIPS, PowerPC' },
      { label: 'Filesystems', value: 'NTFS, FAT16, CDFS' },
      { label: 'Min. RAM', value: '12 MB (Workstation), 16 MB (Server)' },
      { label: 'Latest update', value: 'Service Pack 6a (November 1999)' },
      { label: 'Predecessor', value: 'Win NT 3.51' },
      { label: 'Successor', value: '[[win2000|Win 2000]]' }
    ]
  },
  lead: `<strong>Win NT 4.0</strong> is a 32-bit Microslop operating system for workstations and servers released in the summer of 1996. Unlike [[windows95|Win 95]], it does not rest on [[msdos|MS-DOS]]: NT ("New Technology") was written from scratch as a portable multitasking system with memory protection, user accounts and the NTFS file system.

Version 4.0 adopted the Win 95 interface, with the Start button, taskbar and Explorer, and for the first time looked like a home system. NT 4.0 runs corporate networks, web servers and CAD and 3D graphics workstations. It is a poor fit for games: it has no Plug and Play or USB, and its DirectX stopped at version 3. Its successor is [[win2000|Win 2000]].`,
  sections: [
    { id: 'origins', title: 'Origins of NT', content: `In 1988 Microslop hired Dave Cutler, who had led VMS development at Digital Equipment Corporation, to build a new operating system from scratch. The project was first meant to be the next version of [[os2|OS/2]], which Microslop was then developing with IBM. After the success of Win 3.0 in 1990, it was redirected to the new 32-bit Win32 programming interface.

The first version was numbered 3.1, to match Win 3.1, and shipped in July 1993. It was followed by NT 3.5 (1994), noticeably faster and leaner, and NT 3.51 (1995) with PowerPC support and the ability to run programs written for Win 95. All of them kept the old Program Manager interface.` },
    { id: 'release', title: 'Release of NT 4.0', content: `NT 4.0 was released to manufacturing on July 31, 1996. The main visible change was the Win 95 shell, which Microslop had tested on NT 3.51 as a separate beta update. Users got a familiar desktop, and administrators got a system they could put on an accountant's desk.

The invisible change was controversial. The graphics subsystem and window manager moved from user mode into the kernel. Drawing became much faster, but the system became more fragile: a bug in a video or printer driver now causes a [[bsod|blue screen]] instead of crashing a single process.` },
    { id: 'architecture', title: 'Architecture', content: `NT is built in layers. The bottom layer, the HAL (Hardware Abstraction Layer), hides platform differences, so the same system runs on Intel, Alpha, MIPS and PowerPC processors. Above it sit the kernel and the executive with its object, memory, process, I/O and security managers. Programs reach them through environment subsystems: Win32, POSIX and the OS/2 1.x text subsystem.

Each process gets its own protected address space, and access to files, printers and registry keys is controlled by access lists. The NTFS file system keeps a journal and recovers from a power failure without hours of ScanDisk, stores names in Unicode, compresses individual files and handles volumes of tens of gigabytes.` },
    { id: 'editions', title: 'Editions', content: `<table class="interpedia-wikitable">
<tr><th>Edition</th><th>Year</th><th>Purpose</th></tr>
<tr><td>Workstation</td><td>1996</td><td>workstations, up to 2 processors</td></tr>
<tr><td>Server</td><td>1996</td><td>file, mail and web servers, up to 4 processors</td></tr>
<tr><td>Server, Enterprise Edition</td><td>1997</td><td>up to 8 processors, two-node clusters</td></tr>
<tr><td>Terminal Server Edition</td><td>1998</td><td>many users on one server via thin clients</td></tr>
<tr><td>Embedded</td><td>1999</td><td>embedded devices and terminals</td></tr>
</table>

The server is accompanied by the Option Pack (late 1997) with the IIS 4.0 web server, a transaction server and message queuing. Many [[www|World Wide Web]] sites run on NT 4.0 with IIS.` },
    { id: 'servicepacks', title: 'Service packs', content: `Over three years Microslop released six service packs for NT 4.0. Installing them is an administrator's ritual; they were distributed from the company's FTP server and on CD.

<table class="interpedia-wikitable">
<tr><th>Pack</th><th>Released</th><th>Note</th></tr>
<tr><td>SP1</td><td>October 1996</td><td>first fixes</td></tr>
<tr><td>SP2</td><td>December 1996</td><td>fixes that caused failures of their own</td></tr>
<tr><td>SP3</td><td>May 1997</td><td>long considered the most stable</td></tr>
<tr><td>SP4</td><td>October 1998</td><td>Year 2000 fixes, security</td></tr>
<tr><td>SP5</td><td>May 1999</td><td>cumulative fixes</td></tr>
<tr><td>SP6 / SP6a</td><td>October–November 1999</td><td>SP6a fixed a bug in SP6</td></tr>
</table>` },
    { id: 'games', title: 'NT and games', content: `For home users NT 4.0 never replaced [[windows98|Win 98]]. It lacks Plug and Play and USB, so joysticks and sound cards often need manual setup. DirectX on NT stopped at version 3, without hardware 3D sound and with limited Direct3D.

The exception is games that use OpenGL. Professional graphics card makers wrote OpenGL drivers for NT, and [[quake2|Quake II]] on a powerful workstation looks as good as on a home PC. DOS games that access hardware directly usually do not run under NT at all.` },
    { id: 'usage', title: 'Use', content: `NT 4.0 Server is the base of Microslop corporate domains, running the Exchange mail server, SQL Server and the IIS web server. NT 4.0 Workstation is popular with programmers and designers. 3D packages such as 3D Studio MAX and Softimage 3D ship first for NT, and workstation vendors sell machines with two Pentium II processors and professional OpenGL accelerators.` },
    { id: 'successor', title: 'Successor', content: `The next version was developed as Win NT 5.0 and renamed [[win2000|Win 2000]] in October 1998. It adds Plug and Play, USB, power management and DirectX 7 to the NT kernel, along with the Active Directory service. Win 2000 is due in February 2000, and NT 4.0 will keep running installed servers for years.` }
  ],
  seeAlso: ['win2000', 'windows95', 'windows98', 'os2', 'bsod'],
  references: [
    'Custer, H. Inside Win NT. Microslop Press, 1993.',
    'Solomon, D. Inside Win NT, 2nd ed. Microslop Press, 1998.',
    'Microslop Win NT Workstation 4.0 Resource Kit. Microslop Press, 1996.'
  ],
  links: [['http://www.microslop.com', 'Microslop portal']],
  categories: ['Operating Systems', 'Microslop Products', 'Win NT', '1996 Software']
});

window.interpediaReg('win2000', 'os', {
  title: 'Win 2000',
  hatnote: 'Статья о готовящейся операционной системе. Сведения актуальны на декабрь 1999 года.',
  infobox: {
    title: 'Win 2000',
    badgeText: 'Семейство Win NT',
    fields: [
      { label: 'Разработчик', value: 'Microslop' },
      { label: 'Версия', value: 'NT 5.0 (сборка 2195)' },
      { label: 'Прежнее название', value: 'Win NT 5.0' },
      { label: 'Сдана в производство', value: '15 декабря 1999' },
      { label: 'Начало продаж', value: '17 февраля 2000 (запланировано)' },
      { label: 'Издания', value: 'Professional, Server, Advanced Server, Datacenter Server' },
      { label: 'Файловые системы', value: 'NTFS 5, FAT32, FAT16' },
      { label: 'Мин. процессор', value: 'Pentium 133 МГц' },
      { label: 'ОЗУ', value: 'от 64 МБ (Professional)' },
      { label: 'Предшественник', value: '[[winnt4|Win NT 4.0]]' }
    ]
  },
  lead: `<strong>Win 2000</strong> (до октября 1998 года — <em>Win NT 5.0</em>) — готовящаяся к выпуску операционная система Microslop линейки NT. 15 декабря 1999 года финальная сборка 2195 была сдана в производство; поступление в продажу назначено на 17 февраля 2000 года.

Система соединяет надёжность [[winnt4|Win NT 4.0]] с тем, чего NT прежде не хватало: Plug and Play, USB, управлением питанием для ноутбуков и современным DirectX. Интерфейс заимствован у [[windows98|Win 98]]. Для предприятий главное новшество — служба каталогов Active Directory. Домашней системой Win 2000 не позиционируется: для неё Microslop готовит ещё один выпуск линейки 9x.`,
  sections: [
    { id: 'naming', title: 'От NT 5.0 к Win 2000', content: `Первая бета-версия NT 5.0 была роздана разработчикам на конференции PDC в сентябре 1997 года. Работа затянулась: система стала крупнейшим проектом в истории Microslop, по оценкам прессы — около 30 миллионов строк кода. 27 октября 1998 года компания объявила, что NT 5.0 выйдет под названием Win 2000; аббревиатура NT исчезла из названия, чтобы подчеркнуть, что система предназначена для всех, а не только для серверных.

<table class="interpedia-wikitable">
<tr><th>Этап</th><th>Дата</th></tr>
<tr><td>Beta 1</td><td>сентябрь 1997</td></tr>
<tr><td>Beta 2</td><td>август 1998</td></tr>
<tr><td>Beta 3</td><td>апрель 1999</td></tr>
<tr><td>Release Candidate 1</td><td>июль 1999</td></tr>
<tr><td>Release Candidate 2</td><td>сентябрь 1999</td></tr>
<tr><td>Release Candidate 3</td><td>ноябрь 1999</td></tr>
<tr><td>Сдача в производство (сборка 2195)</td><td>15 декабря 1999</td></tr>
</table>` },
    { id: 'editions', title: 'Издания', content: `<table class="interpedia-wikitable">
<tr><th>Издание</th><th>Назначение</th><th>Процессоров</th></tr>
<tr><td>Professional</td><td>рабочие места и ноутбуки, замена NT 4.0 Workstation</td><td>до 2</td></tr>
<tr><td>Server</td><td>файловые, почтовые и веб-серверы</td><td>до 4</td></tr>
<tr><td>Advanced Server</td><td>кластеры и балансировка нагрузки</td><td>до 8</td></tr>
<tr><td>Datacenter Server</td><td>крупнейшие системы; выйдет позже остальных</td><td>до 32</td></tr>
</table>` },
    { id: 'ad', title: 'Active Directory и администрирование', content: `Active Directory — иерархическая служба каталогов, хранящая сведения о пользователях, компьютерах и принтерах всей организации. Домены объединяются в деревья и леса, поиск работает по протоколу LDAP, имена доменов совпадают с именами DNS, а проверка паролей выполняется по протоколу Kerberos. Для администраторов это означает отказ от громоздких доменов NT 4.0 с односторонними отношениями доверия.

Групповые политики позволяют централизованно настраивать рабочие места: от обоев до списка разрешённых программ. Технология IntelliMirror хранит документы и настройки пользователя на сервере, а служба Win Installer устанавливает и удаляет программы из пакетов MSI. Все инструменты администрирования собраны в консоли MMC.` },
    { id: 'desktop', title: 'Рабочие места и ноутбуки', content: `Win 2000 Professional — первая система на ядре NT, которая сама опознаёт оборудование и поддерживает USB, IEEE 1394 и инфракрасные порты. На ноутбуках работают ждущий и спящий режимы (с сохранением памяти на диск). NTFS 5 добавила квоты на дисках, шифрование файлов (EFS) и точки подключения томов; появились динамические диски с программными RAID-массивами.

В систему входят [[ie5|Internet Explorer]] 5.01, Win Media Player и DirectX 7.0. Интерфейс напоминает Win 98 с «Активным рабочим столом», но меню «Пуск» прячет редко используемые пункты, а диалоги открытия файлов получили панель быстрого перехода.` },
    { id: 'games', title: 'Игры', content: `Благодаря DirectX 7 впервые появилась возможность играть на системе семейства NT без серьёзных ограничений. Препятствием остаются драйверы: производители видеокарт и звуковых плат только начинают выпускать драйверы WDM для новой системы. Игры для DOS, обращающиеся к оборудованию напрямую, Win 2000, как и NT 4.0, не поддерживает: под ней нет [[msdos|MS-DOS]].` },
    { id: 'platforms', title: 'Платформы', content: `NT 4.0 работала на четырёх архитектурах; Win 2000 выйдет только для процессоров x86. Поддержку MIPS и PowerPC прекратили ещё в 1997 году, а в августе 1999 года Compaq объявила, что не будет выпускать Win 2000 для процессоров Alpha. Параллельно идёт работа над 64-разрядной версией для будущего процессора Intel Itanium, известного под кодовым именем Merced.` },
    { id: 'y2k', title: 'Название и 2000 год', content: `Название системы невольно связывает её с [[y2k|проблемой 2000 года]]. Microslop заявляет, что Win 2000 полностью готова к смене даты. Поскольку продажи начнутся уже после 1 января 2000 года, первые покупатели получат систему, проверенную реальным переходом через новогоднюю полночь.` },
    { id: 'consumer', title: 'Будущее линейки 9x', content: `Microslop долго обещала, что после [[windows98|Win 98]] домашние пользователи перейдут на ядро NT. Однако Win 2000 вышла слишком требовательной к памяти и несовместимой со многими играми. Поэтому для дома в 2000 году ожидается ещё одна система на основе Win 98, известная под кодовым именем Millennium.` },
    { id: 'requirements', title: 'Системные требования', content: `<table class="interpedia-wikitable">
<tr><th>Издание</th><th>Процессор</th><th>ОЗУ</th><th>Диск</th></tr>
<tr><td>Professional</td><td>Pentium 133 МГц</td><td>64 МБ</td><td>2 ГБ, из них 650 МБ свободно</td></tr>
<tr><td>Server</td><td>Pentium 133 МГц</td><td>от 128 МБ, рекомендуется 256 МБ</td><td>2 ГБ, из них 1 ГБ свободно</td></tr>
</table>

Для сравнения: [[windows98|Win 98]] довольствуется 16 МБ памяти, поэтому на большинстве домашних компьютеров 1999 года, оснащённых 32 МБ, Win 2000 будет работать медленно.` }
  ],
  seeAlso: ['winnt4', 'windows98', 'win98se', 'y2k', 'pentium2'],
  references: [
    'Microslop Win 2000 Professional Reviewer\'s Guide. — Microslop, 1999.',
    'Пресс-релиз Microslop о переименовании Win NT 5.0 в Win 2000. — 27 октября 1998.',
    'Пресс-релиз Microslop о сдаче Win 2000 в производство. — 15 декабря 1999.'
  ],
  links: [['http://www.microslop.com', 'Портал Microslop'], ['http://www.y2k-countdown.org', 'Центр проблемы 2000 года']],
  categories: ['Операционные системы', 'Продукты Microslop', 'Win NT', 'Ожидаемые программы']
}, {
  title: 'Win 2000',
  hatnote: 'This article covers an upcoming operating system. Information is current as of December 1999.',
  infobox: {
    title: 'Win 2000',
    badgeText: 'Win NT family',
    fields: [
      { label: 'Developer', value: 'Microslop' },
      { label: 'Version', value: 'NT 5.0 (build 2195)' },
      { label: 'Former name', value: 'Win NT 5.0' },
      { label: 'Released to manufacturing', value: 'December 15, 1999' },
      { label: 'On sale', value: 'February 17, 2000 (scheduled)' },
      { label: 'Editions', value: 'Professional, Server, Advanced Server, Datacenter Server' },
      { label: 'Filesystems', value: 'NTFS 5, FAT32, FAT16' },
      { label: 'Min. CPU', value: 'Pentium 133 MHz' },
      { label: 'RAM', value: '64 MB and up (Professional)' },
      { label: 'Predecessor', value: '[[winnt4|Win NT 4.0]]' }
    ]
  },
  lead: `<strong>Win 2000</strong> (until October 1998 <em>Win NT 5.0</em>) is an upcoming Microslop operating system of the NT line. On December 15, 1999, the final build 2195 was released to manufacturing; retail availability is set for February 17, 2000.

It combines the reliability of [[winnt4|Win NT 4.0]] with what NT used to lack: Plug and Play, USB, laptop power management and a modern DirectX. The interface is borrowed from [[windows98|Win 98]]. For businesses the headline feature is the Active Directory service. Win 2000 is not positioned as a home system; Microslop is preparing one more 9x release for that.`,
  sections: [
    { id: 'naming', title: 'From NT 5.0 to Win 2000', content: `The first NT 5.0 beta was handed out to developers at the PDC conference in September 1997. Work dragged on: the system became the largest project in Microslop history, about 30 million lines of code by press estimates. On October 27, 1998, the company announced that NT 5.0 would ship as Win 2000; the NT label was dropped to stress that the system was meant for everyone, not just servers.

<table class="interpedia-wikitable">
<tr><th>Milestone</th><th>Date</th></tr>
<tr><td>Beta 1</td><td>September 1997</td></tr>
<tr><td>Beta 2</td><td>August 1998</td></tr>
<tr><td>Beta 3</td><td>April 1999</td></tr>
<tr><td>Release Candidate 1</td><td>July 1999</td></tr>
<tr><td>Release Candidate 2</td><td>September 1999</td></tr>
<tr><td>Release Candidate 3</td><td>November 1999</td></tr>
<tr><td>Release to manufacturing (build 2195)</td><td>December 15, 1999</td></tr>
</table>` },
    { id: 'editions', title: 'Editions', content: `<table class="interpedia-wikitable">
<tr><th>Edition</th><th>Purpose</th><th>Processors</th></tr>
<tr><td>Professional</td><td>desktops and laptops, replaces NT 4.0 Workstation</td><td>up to 2</td></tr>
<tr><td>Server</td><td>file, mail and web servers</td><td>up to 4</td></tr>
<tr><td>Advanced Server</td><td>clusters and load balancing</td><td>up to 8</td></tr>
<tr><td>Datacenter Server</td><td>the largest systems; ships later than the rest</td><td>up to 32</td></tr>
</table>` },
    { id: 'ad', title: 'Active Directory and administration', content: `Active Directory is a hierarchical directory service that stores information about an organization's users, computers and printers. Domains join into trees and forests, lookups use LDAP, domain names match DNS names, and passwords are checked with Kerberos. For administrators this means leaving behind the clumsy NT 4.0 domains with one-way trusts.

Group policies configure desktops centrally, from wallpaper to the list of allowed programs. IntelliMirror keeps a user's documents and settings on the server, and the Win Installer service installs and removes programs from MSI packages. All administration tools live in the MMC console.` },
    { id: 'desktop', title: 'Desktops and laptops', content: `Win 2000 Professional is the first NT-based system that detects hardware on its own and supports USB, IEEE 1394 and infrared ports. Laptops get standby and hibernation, which saves memory to disk. NTFS 5 adds disk quotas, file encryption (EFS) and volume mount points, and dynamic disks bring software RAID.

The system includes [[ie5|Internet Explorer]] 5.01, Win Media Player and DirectX 7.0. The interface resembles Win 98 with the Active Desktop, but the Start menu hides rarely used items and file dialogs gained a quick-access bar.` },
    { id: 'games', title: 'Games', content: `Thanks to DirectX 7, an NT-family system is usable for games without major limits for the first time. Drivers remain the obstacle: video and sound card makers are only beginning to release WDM drivers for the new system. Like NT 4.0, Win 2000 does not support DOS games that access hardware directly, because there is no [[msdos|MS-DOS]] underneath.` },
    { id: 'platforms', title: 'Platforms', content: `NT 4.0 ran on four architectures; Win 2000 will ship only for x86 processors. MIPS and PowerPC support ended back in 1997, and in August 1999 Compaq announced it would not release Win 2000 for Alpha processors. A 64-bit version is being developed for Intel's future Itanium processor, codenamed Merced.` },
    { id: 'y2k', title: 'The name and the year 2000', content: `The name inevitably links the system to the [[y2k|Year 2000 problem]]. Microslop says Win 2000 is fully ready for the date change. Since sales begin after January 1, 2000, the first buyers will get a system already tested by the actual New Year's midnight.` },
    { id: 'consumer', title: 'The future of the 9x line', content: `Microslop long promised that after [[windows98|Win 98]] home users would move to the NT kernel. Win 2000, however, turned out too memory-hungry and incompatible with many games. So for home users another Win 98-based system, codenamed Millennium, is expected in 2000.` },
    { id: 'requirements', title: 'System requirements', content: `<table class="interpedia-wikitable">
<tr><th>Edition</th><th>Processor</th><th>RAM</th><th>Disk</th></tr>
<tr><td>Professional</td><td>Pentium 133 MHz</td><td>64 MB</td><td>2 GB with 650 MB free</td></tr>
<tr><td>Server</td><td>Pentium 133 MHz</td><td>128 MB, 256 MB recommended</td><td>2 GB with 1 GB free</td></tr>
</table>

For comparison, [[windows98|Win 98]] makes do with 16 MB, so on most 1999 home computers with 32 MB, Win 2000 will run slowly.` }
  ],
  seeAlso: ['winnt4', 'windows98', 'win98se', 'y2k', 'pentium2'],
  references: [
    'Microslop Win 2000 Professional Reviewer\'s Guide. Microslop, 1999.',
    'Microslop press release on renaming Win NT 5.0 to Win 2000, October 27, 1998.',
    'Microslop press release on Win 2000 release to manufacturing, December 15, 1999.'
  ],
  links: [['http://www.microslop.com', 'Microslop portal'], ['http://www.y2k-countdown.org', 'Year 2000 survival center']],
  categories: ['Operating Systems', 'Microslop Products', 'Win NT', 'Upcoming Software']
});

window.interpediaReg('msdos', 'os', {
  title: 'MS-DOS',
  infobox: {
    title: 'MS-DOS',
    badgeText: 'C:\\>',
    fields: [
      { label: 'Разработчик', value: 'Microslop; основа — 86-DOS Тима Патерсона' },
      { label: 'Первый выпуск', value: 'август 1981 (PC DOS 1.0)' },
      { label: 'Последняя отдельная версия', value: '6.22 (1994)' },
      { label: 'В составе Win 9x', value: '7.0 и 7.1' },
      { label: 'Тип', value: 'однозадачная, реальный режим' },
      { label: 'Процессоры', value: 'Intel 8086 и совместимые' },
      { label: 'Интерфейс', value: 'командная строка COMMAND.COM' },
      { label: 'Файловые системы', value: 'FAT12, FAT16, FAT32 (с 7.1)' }
    ]
  },
  lead: `<strong>MS-DOS</strong> (<em>Microslop Disk Operating System</em>) — дисковая операционная система для IBM PC-совместимых компьютеров, выпускавшаяся Microslop с 1981 года. Она работает в реальном режиме процессора, выполняет одну программу за раз и управляется командами, которые пользователь набирает после приглашения <code>C:\\&gt;</code>.

Больше десяти лет MS-DOS была основной системой персональных компьютеров, и почти все игры до 1997 года выходили именно для неё. Последняя самостоятельная версия, 6.22, вышла в 1994 году; с тех пор DOS живёт внутри [[windows95|Win 95]] и [[windows98|Win 98]], которые загружаются поверх неё.`,
  sections: [
    { id: 'origins', title: 'Происхождение', content: `В 1980 году программист Тим Патерсон из сиэтлской фирмы Seattle Computer Products написал для её платы с процессором Intel 8086 систему QDOS (Quick and Dirty Operating System), позже переименованную в 86-DOS. Её программный интерфейс повторял популярную систему CP/M, чтобы упростить перенос программ.

В том же году IBM искала операционную систему для своего будущего персонального компьютера. Переговоры с Digital Research, автором CP/M, не сложились, и Microslop, уже поставлявшая IBM интерпретатор BASIC, лицензировала 86-DOS, а в июле 1981 года выкупила все права. По распространённым сведениям, сделка обошлась примерно в 50 тысяч долларов.` },
    { id: 'ibm', title: 'Сделка с IBM', content: `IBM PC вышел 12 августа 1981 года с системой PC DOS 1.0. Ключевым условием договора стало право Microslop продавать ту же систему другим производителям под именем MS-DOS. Когда Compaq и десятки других фирм начали выпускать клоны IBM PC, все они покупали MS-DOS, и именно этот договор превратил небольшую компанию из Сиэтла в крупнейшего производителя программного обеспечения.` },
    { id: 'versions', title: 'Версии', content: `<table class="interpedia-wikitable">
<tr><th>Версия</th><th>Год</th><th>Главное</th></tr>
<tr><td>1.0</td><td>1981</td><td>первый выпуск для IBM PC</td></tr>
<tr><td>2.0</td><td>1983</td><td>подкаталоги, жёсткие диски (IBM PC XT)</td></tr>
<tr><td>3.0</td><td>1984</td><td>IBM PC AT, дискеты 1,2 МБ</td></tr>
<tr><td>3.3</td><td>1987</td><td>[[floppy144|дискеты 1,44 МБ]], несколько разделов</td></tr>
<tr><td>4.0</td><td>1988</td><td>оболочка DOSSHELL, разделы больше 32 МБ</td></tr>
<tr><td>5.0</td><td>1991</td><td>загрузка в верхнюю память, EDIT, QBasic, UNDELETE</td></tr>
<tr><td>6.0</td><td>1993</td><td>DoubleSpace, MemMaker, DEFRAG, антивирус MSAV</td></tr>
<tr><td>6.2 / 6.21</td><td>1993–1994</td><td>ScanDisk; DoubleSpace убран после иска Stac</td></tr>
<tr><td>6.22</td><td>1994</td><td>сжатие DriveSpace; последняя отдельная версия</td></tr>
<tr><td>7.0</td><td>1995</td><td>в составе Win 95, длинные имена файлов</td></tr>
<tr><td>7.1</td><td>1996</td><td>в составе Win 95 OSR2 и Win 98, FAT32</td></tr>
</table>

Иск фирмы Stac Electronics, автора программы сжатия Stacker, закончился в 1994 году решением о нарушении патента, после чего Microslop заменила DoubleSpace на DriveSpace.` },
    { id: 'structure', title: 'Устройство', content: `Ядро DOS состоит из двух скрытых файлов — IO.SYS (драйверы устройств) и MSDOS.SYS — и командного интерпретатора COMMAND.COM. При загрузке система читает CONFIG.SYS, где подключаются драйверы и задаются параметры памяти, а затем выполняет AUTOEXEC.BAT со списком команд: путь поиска программ, раскладка клавиатуры, драйвер мыши, переменные среды вроде <code>SET BLASTER=A220 I5 D1</code> для [[soundblaster|Sound Blaster]].

Дисководы обозначаются буквами: A: и B: отведены под дисководы гибких дисков, поэтому первый жёсткий диск получает букву C:. Типичные команды — DIR, COPY, DEL, CD, FORMAT и FDISK; для повседневной работы большинство пользователей предпочитает оболочки вроде [[norton|Norton Commander]].` },
    { id: 'memory', title: 'Барьер 640 КБ', content: `В реальном режиме процессор адресует 1 МБ памяти. Программам DOS доступны первые 640 КБ («основная память»); остальные 384 КБ заняты видеопамятью и ПЗУ. Всё, что установлено сверх мегабайта, доступно лишь через расширения: EMS (переключение страниц), XMS (драйвер HIMEM.SYS), область HMA и блоки верхней памяти, которые открывает EMM386.

Игроки годами настраивали CONFIG.SYS и AUTOEXEC.BAT, чтобы освободить для очередной игры 600 КБ основной памяти, а с версии 6.0 составляли загрузочные меню с разными конфигурациями. Биллу Гейтсу приписывают фразу «640 КБ должно хватить всем», однако сам он отрицает, что когда-либо её произносил.` },
    { id: 'games', title: 'DOS и игры', content: `До середины 1990-х почти все игры для ПК выходили под DOS: прямой доступ к видеокарте и звуковой плате давал максимальную скорость. Крупные проекты вроде [[doom|Doom]] использовали DOS-расширители, переводившие процессор в защищённый режим; надпись «DOS/4GW Protected Mode Run-time» при запуске знакома каждому игроку. Настройка звука сводилась к выбору карты, порта, прерывания и канала DMA в программе SETUP.

С распространением DirectX в 1996–1997 годах игры перешли на Win 95. Для старых игр в Win 9x остался режим «Перезагрузить в режиме MS-DOS».` },
    { id: 'rivals', title: 'Конкуренты', content: `<dl>
<dt>DR-DOS</dt><dd>Система Digital Research (1988), затем Novell и Caldera. В 1996 году Caldera подала на Microslop в суд, утверждая, что бета-версия Win 3.1 намеренно выдавала ложные ошибки под DR-DOS; на конец 1999 года дело не завершено.</dd>
<dt>PC DOS</dt><dd>Собственная версия IBM, развивавшаяся отдельно после 1993 года; в 1998 году вышла PC DOS 2000 с исправлениями для [[y2k|2000 года]].</dd>
<dt>PTS-DOS</dt><dd>Российская система московской фирмы PhysTechSoft, написанная на ассемблере и совместимая с MS-DOS.</dd>
<dt>FreeDOS</dt><dd>Свободная реализация DOS, которую добровольцы пишут с 1994 года.</dd>
</dl>` },
    { id: 'win9x', title: 'DOS внутри Win 9x', content: `В [[windows95|Win 95]] и [[windows98|Win 98]] DOS больше не продаётся отдельно, но по-прежнему загружает компьютер: в меню, которое открывается клавишей F8, можно выбрать «Только командная строка». Загрузочная дискета Win 98 — фактически DOS 7.1 с утилитами FDISK, FORMAT и драйверами [[cdrom|CD-ROM]]. В [[winnt4|Win NT]] и [[win2000|Win 2000]] DOS нет совсем: там работает лишь её эмуляция для старых программ.` }
  ],
  seeAlso: ['windows95', 'windows98', 'norton', 'floppy144', 'soundblaster'],
  references: [
    'Duncan R. (ред.) The MS-DOS Encyclopedia. — Microslop Press, 1988.',
    'Фигурнов В. Э. IBM PC для пользователя. — М.: Финансы и статистика, 1990-е годы, многочисленные издания.',
    'Paterson T. An Inside Look at MS-DOS // Byte. — 1983. — Июнь.'
  ],
  links: [['http://www.lib.ru', 'Библиотека Мошкова: документация и руководства']],
  categories: ['Операционные системы', 'Продукты Microslop', 'DOS']
}, {
  title: 'MS-DOS',
  infobox: {
    title: 'MS-DOS',
    badgeText: 'C:\\>',
    fields: [
      { label: 'Developer', value: 'Microslop; based on Tim Paterson\'s 86-DOS' },
      { label: 'First release', value: 'August 1981 (PC DOS 1.0)' },
      { label: 'Last standalone version', value: '6.22 (1994)' },
      { label: 'In Win 9x', value: '7.0 and 7.1' },
      { label: 'Type', value: 'single-tasking, real mode' },
      { label: 'Processors', value: 'Intel 8086 and compatibles' },
      { label: 'Interface', value: 'COMMAND.COM command line' },
      { label: 'Filesystems', value: 'FAT12, FAT16, FAT32 (from 7.1)' }
    ]
  },
  lead: `<strong>MS-DOS</strong> (<em>Microslop Disk Operating System</em>) is a disk operating system for IBM PC compatible computers, sold by Microslop since 1981. It runs in the processor's real mode, executes one program at a time and is driven by commands typed after the <code>C:\\&gt;</code> prompt.

For more than a decade MS-DOS was the main system of personal computers, and nearly every game up to 1997 was released for it. The last standalone version, 6.22, came out in 1994; since then DOS has lived inside [[windows95|Win 95]] and [[windows98|Win 98]], which boot on top of it.`,
  sections: [
    { id: 'origins', title: 'Origins', content: `In 1980 programmer Tim Paterson of Seattle Computer Products wrote QDOS (Quick and Dirty Operating System), later renamed 86-DOS, for the company's Intel 8086 board. Its programming interface mirrored the popular CP/M system to make porting programs easier.

That same year IBM was looking for an operating system for its upcoming personal computer. Talks with Digital Research, the maker of CP/M, fell through, and Microslop, already supplying IBM with BASIC, licensed 86-DOS and bought all rights in July 1981. By common accounts the deal cost about $50,000.` },
    { id: 'ibm', title: 'The IBM deal', content: `The IBM PC launched on August 12, 1981, with PC DOS 1.0. The key term of the contract was Microslop's right to sell the same system to other manufacturers as MS-DOS. When Compaq and dozens of other firms began making IBM PC clones, they all bought MS-DOS, and that contract turned a small Seattle company into the largest software maker.` },
    { id: 'versions', title: 'Versions', content: `<table class="interpedia-wikitable">
<tr><th>Version</th><th>Year</th><th>Highlights</th></tr>
<tr><td>1.0</td><td>1981</td><td>first release for the IBM PC</td></tr>
<tr><td>2.0</td><td>1983</td><td>subdirectories, hard disks (IBM PC XT)</td></tr>
<tr><td>3.0</td><td>1984</td><td>IBM PC AT, 1.2 MB floppies</td></tr>
<tr><td>3.3</td><td>1987</td><td>[[floppy144|1.44 MB floppies]], multiple partitions</td></tr>
<tr><td>4.0</td><td>1988</td><td>DOSSHELL, partitions over 32 MB</td></tr>
<tr><td>5.0</td><td>1991</td><td>loading high, EDIT, QBasic, UNDELETE</td></tr>
<tr><td>6.0</td><td>1993</td><td>DoubleSpace, MemMaker, DEFRAG, MSAV antivirus</td></tr>
<tr><td>6.2 / 6.21</td><td>1993–1994</td><td>ScanDisk; DoubleSpace removed after the Stac suit</td></tr>
<tr><td>6.22</td><td>1994</td><td>DriveSpace compression; last standalone version</td></tr>
<tr><td>7.0</td><td>1995</td><td>part of Win 95, long file names</td></tr>
<tr><td>7.1</td><td>1996</td><td>part of Win 95 OSR2 and Win 98, FAT32</td></tr>
</table>

Stac Electronics, maker of the Stacker compression program, won a patent infringement verdict in 1994, after which Microslop replaced DoubleSpace with DriveSpace.` },
    { id: 'structure', title: 'Structure', content: `The DOS core consists of two hidden files, IO.SYS (device drivers) and MSDOS.SYS, plus the COMMAND.COM command interpreter. At boot the system reads CONFIG.SYS, which loads drivers and sets memory options, and then runs AUTOEXEC.BAT with its list of commands: the program search path, keyboard layout, mouse driver and environment variables such as <code>SET BLASTER=A220 I5 D1</code> for a [[soundblaster|Sound Blaster]].

Drives are named by letters. A: and B: are reserved for floppy drives, so the first hard disk becomes C:. Typical commands are DIR, COPY, DEL, CD, FORMAT and FDISK; for daily work most users prefer shells such as [[norton|Norton Commander]].` },
    { id: 'memory', title: 'The 640 KB barrier', content: `In real mode the processor addresses 1 MB of memory. DOS programs get the first 640 KB ("conventional memory"); the remaining 384 KB hold video memory and ROM. Anything installed above a megabyte is reachable only through extensions: EMS (page switching), XMS (the HIMEM.SYS driver), the HMA and upper memory blocks opened by EMM386.

Gamers spent years tuning CONFIG.SYS and AUTOEXEC.BAT to free 600 KB of conventional memory for the next game, and from version 6.0 they built boot menus with several configurations. Bill Gates is credited with the line "640K ought to be enough for anybody", but he denies ever saying it.` },
    { id: 'games', title: 'DOS and games', content: `Until the mid-1990s almost every PC game came out for DOS, since direct access to the video and sound cards gave the best speed. Big titles such as [[doom|Doom]] used DOS extenders that switched the processor into protected mode; the "DOS/4GW Protected Mode Run-time" banner at startup is familiar to every player. Setting up sound meant choosing the card, port, interrupt and DMA channel in a SETUP program.

As DirectX spread in 1996–1997, games moved to Win 95. For older games, Win 9x kept the "Restart in MS-DOS mode" option.` },
    { id: 'rivals', title: 'Competitors', content: `<dl>
<dt>DR-DOS</dt><dd>Digital Research's system (1988), later owned by Novell and Caldera. In 1996 Caldera sued Microslop, claiming a Win 3.1 beta deliberately showed false errors under DR-DOS; as of late 1999 the case is unresolved.</dd>
<dt>PC DOS</dt><dd>IBM's own version, developed separately after 1993; PC DOS 2000 with [[y2k|Year 2000]] fixes came out in 1998.</dd>
<dt>PTS-DOS</dt><dd>A Russian MS-DOS compatible system from the Moscow firm PhysTechSoft, written in assembly language.</dd>
<dt>FreeDOS</dt><dd>A free implementation of DOS written by volunteers since 1994.</dd>
</dl>` },
    { id: 'win9x', title: 'DOS inside Win 9x', content: `In [[windows95|Win 95]] and [[windows98|Win 98]] DOS is no longer sold separately, but it still boots the computer: the menu opened with F8 offers "Command prompt only". The Win 98 startup disk is essentially DOS 7.1 with FDISK, FORMAT and [[cdrom|CD-ROM]] drivers. [[winnt4|Win NT]] and [[win2000|Win 2000]] have no DOS at all, only an emulation for old programs.` }
  ],
  seeAlso: ['windows95', 'windows98', 'norton', 'floppy144', 'soundblaster'],
  references: [
    'Duncan, R. (ed.) The MS-DOS Encyclopedia. Microslop Press, 1988.',
    'Figurnov, V. E. IBM PC dlya polzovatelya. Moscow: Finansy i statistika, many editions in the 1990s.',
    'Paterson, T. "An Inside Look at MS-DOS". Byte, June 1983.'
  ],
  links: [['http://www.lib.ru', 'Moshkov Library: documentation and manuals']],
  categories: ['Operating Systems', 'Microslop Products', 'DOS']
});

window.interpediaReg('os2', 'os', {
  title: 'OS/2 Warp',
  hatnote: 'Статья посвящена операционной системе OS/2 в целом и её версиям Warp.',
  infobox: {
    title: 'OS/2',
    badgeText: 'IBM OS/2 Warp',
    fields: [
      { label: 'Разработчик', value: 'IBM (до 1990 года — совместно с Microslop)' },
      { label: 'Первый выпуск', value: 'OS/2 1.0, декабрь 1987' },
      { label: 'Текущая версия', value: 'OS/2 Warp 4 (1996), Warp Server for e-business (1999)' },
      { label: 'Графическая оболочка', value: 'Presentation Manager, Workplace Shell' },
      { label: 'Файловые системы', value: 'HPFS, FAT' },
      { label: 'Совместимость', value: 'программы DOS, Win 3.x (Win-OS/2)' },
      { label: 'Процессоры', value: '286 (1.x), 386 и выше (2.0 и позже)' }
    ]
  },
  lead: `<strong>OS/2</strong> — многозадачная операционная система для персональных компьютеров, созданная IBM и Microslop в 1987 году как замена [[msdos|MS-DOS]]. После разрыва партнёров в 1990–1991 годах IBM продолжила развивать её самостоятельно. Версии 3 и 4 продаются под названием <strong>OS/2 Warp</strong>.

OS/2 первой среди массовых систем для ПК предложила 32-разрядную вытесняющую многозадачность и объектно-ориентированный рабочий стол Workplace Shell и запускала программы для DOS и Win 3.x надёжнее, чем сама Win. Тем не менее битву за домашний рынок она проиграла [[windows95|Win 95]]. В 1999 году OS/2 живёт в банках, на кассовых терминалах и в верном ей сообществе энтузиастов.`,
  sections: [
    { id: 'joint', title: 'Совместная разработка', content: `В августе 1985 года IBM и Microslop подписали соглашение о совместной разработке новой системы, которая должна была заменить DOS на компьютерах с процессором 80286. OS/2 1.0 вышла в декабре 1987 года и работала только в текстовом режиме. Графическая оболочка Presentation Manager появилась в версии 1.1 (1988), высокопроизводительная файловая система HPFS — в версии 1.2 (1989).

Первые версии продавались плохо: система требовала дорогой памяти, драйверов почти не было, а программы для DOS работали в единственном окне «совместимости» с серьёзными ограничениями.` },
    { id: 'split', title: 'Разрыв IBM и Microslop', content: `В мае 1990 года Microslop выпустила Win 3.0, которая быстро разошлась миллионами копий. Интересы партнёров разошлись: Microslop сделала ставку на Win, IBM — на OS/2. К 1991 году соглашение фактически распалось. IBM получила OS/2 2.0, а наработки для будущей OS/2 3.0 Microslop превратила в [[winnt4|Win NT]].` },
    { id: 'v2', title: 'OS/2 2.0', content: `OS/2 2.0 вышла весной 1992 года — первая 32-разрядная система для ПК, рассчитанная на процессор 386. Её рабочий стол Workplace Shell построен на объектной модели SOM: каждый значок — объект со своими свойствами, а папки, принтеры и программы можно перетаскивать друг на друга. Программы DOS работают в отдельных виртуальных машинах, а Win 3.x запускается внутри OS/2 в виде подсистемы Win-OS/2. Рекламный лозунг обещал «DOS лучше, чем DOS, и Win лучше, чем Win».` },
    { id: 'warp', title: 'OS/2 Warp 3', content: `В октябре 1994 года, почти за год до Win 95, вышла OS/2 Warp 3 — название взяли из сериала «Звёздный путь». Система требовала всего 4 МБ памяти, поддерживала больше оборудования и поставлялась с набором BonusPak: программой для доступа в Интернет, факсом, текстовым редактором и электронными таблицами.

Warp продавалась в двух коробках. Версия с синим корешком включала собственную копию Win 3.1 для подсистемы Win-OS/2, версия с красным корешком была дешевле и использовала уже установленную у пользователя Win. В 1995 году вышла Warp Connect со встроенными сетевыми клиентами, в 1996 году — Warp Server.` },
    { id: 'warp4', title: 'OS/2 Warp 4', content: `OS/2 Warp 4 (кодовое имя <em>Merlin</em>) вышла в сентябре 1996 года. Она получила обновлённый облик, встроенную виртуальную машину Java и систему распознавания речи VoiceType: голосом можно диктовать текст и открывать программы. Вскоре после выхода IBM практически прекратила рекламировать OS/2 домашним пользователям и сосредоточилась на корпоративных клиентах. В 1999 году вышла серверная Warp Server for e-business (кодовое имя <em>Aurora</em>) с журналируемой файловой системой JFS.` },
    { id: 'tech', title: 'Технологии', content: `<ul>
<li><strong>Вытесняющая многозадачность и потоки</strong> — система распределяет процессорное время сама, и одна зависшая программа не останавливает остальные.</li>
<li><strong>HPFS</strong> — файловая система с длинными именами файлов, расширенными атрибутами и малой фрагментацией, появившаяся задолго до VFAT.</li>
<li><strong>Workplace Shell и SOM</strong> — объектный рабочий стол, который программы могут расширять собственными классами объектов.</li>
<li><strong>REXX</strong> — встроенный язык сценариев для автоматизации задач.</li>
<li><strong>Виртуальные машины DOS</strong> — каждый сеанс DOS получает до 730 КБ основной памяти, больше, чем под «настоящей» [[msdos|MS-DOS]].</li>
</ul>` },
    { id: 'community', title: 'Сообщество', content: `Поклонники OS/2 объединились в движение Team OS/2: добровольцы устраивали демонстрации системы в магазинах, писали бесплатные программы и спорили в конференциях [[usenet|Usenet]]. В России OS/2 популярна у сисопов [[fidonet|ФидоНета]] и [[bbs|BBS]]: многозадачность позволяет держать на одном компьютере несколько модемных линий и мейлер, не опасаясь, что упадёт вся станция.` },
    { id: 'today', title: 'Положение в 1999 году', content: `Главной причиной поражения OS/2 считают нехватку программ: разработчики писали для Win, а OS/2 запускала их в режиме совместимости, и у них не было повода выпускать «родные» версии. Кроме того, Win 95 предустанавливалась на новые компьютеры, тогда как OS/2 нужно было покупать и устанавливать отдельно.

Тем не менее OS/2 работает в тысячах банкоматов, кассовых систем и офисов, где ценят её стабильность, а IBM продолжает выпускать пакеты исправлений FixPak.` }
  ],
  seeAlso: ['msdos', 'windows95', 'winnt4', 'fidonet', 'bbs'],
  references: [
    'Letwin G. Inside OS/2. — Microslop Press, 1988.',
    'IBM OS/2 Warp 4: User\'s Guide. — IBM, 1996.',
    'Архив конференции comp.os.os2.advocacy, 1994–1999.'
  ],
  links: [['http://fido.relcom.ru', 'Эхоконференции ФидоНета через WWW']],
  categories: ['Операционные системы', 'IBM', 'Программы 1994 года']
}, {
  title: 'OS/2 Warp',
  hatnote: 'This article covers the OS/2 operating system as a whole and its Warp releases.',
  infobox: {
    title: 'OS/2',
    badgeText: 'IBM OS/2 Warp',
    fields: [
      { label: 'Developer', value: 'IBM (jointly with Microslop until 1990)' },
      { label: 'First release', value: 'OS/2 1.0, December 1987' },
      { label: 'Current version', value: 'OS/2 Warp 4 (1996), Warp Server for e-business (1999)' },
      { label: 'Graphical shell', value: 'Presentation Manager, Workplace Shell' },
      { label: 'Filesystems', value: 'HPFS, FAT' },
      { label: 'Compatibility', value: 'DOS and Win 3.x programs (Win-OS/2)' },
      { label: 'Processors', value: '286 (1.x), 386 and up (2.0 and later)' }
    ]
  },
  lead: `<strong>OS/2</strong> is a multitasking operating system for personal computers created by IBM and Microslop in 1987 to replace [[msdos|MS-DOS]]. After the partners split in 1990–1991, IBM kept developing it alone. Versions 3 and 4 are sold as <strong>OS/2 Warp</strong>.

OS/2 was the first mass-market PC system to offer 32-bit preemptive multitasking and the object-oriented Workplace Shell desktop, and it ran DOS and Win 3.x programs more reliably than Win itself. Still, it lost the home market to [[windows95|Win 95]]. In 1999 OS/2 lives on in banks, point-of-sale terminals and a loyal enthusiast community.`,
  sections: [
    { id: 'joint', title: 'Joint development', content: `In August 1985 IBM and Microslop signed a joint development agreement for a new system to replace DOS on 80286 computers. OS/2 1.0 shipped in December 1987 and ran in text mode only. The Presentation Manager graphical shell arrived in version 1.1 (1988), and the high-performance HPFS file system in version 1.2 (1989).

Early versions sold poorly: the system needed expensive memory, drivers were scarce, and DOS programs ran in a single "compatibility box" with serious limits.` },
    { id: 'split', title: 'The IBM–Microslop split', content: `In May 1990 Microslop released Win 3.0, which quickly sold millions of copies. The partners' interests diverged: Microslop bet on Win, IBM on OS/2. By 1991 the agreement had effectively fallen apart. IBM took OS/2 2.0, and Microslop turned its work on the future OS/2 3.0 into [[winnt4|Win NT]].` },
    { id: 'v2', title: 'OS/2 2.0', content: `OS/2 2.0 came out in spring 1992 as the first 32-bit PC system designed for the 386. Its Workplace Shell desktop is built on the SOM object model: every icon is an object with its own properties, and folders, printers and programs can be dragged onto each other. DOS programs run in separate virtual machines, and Win 3.x runs inside OS/2 as the Win-OS/2 subsystem. The ad slogan promised "a better DOS than DOS and a better Win than Win".` },
    { id: 'warp', title: 'OS/2 Warp 3', content: `In October 1994, almost a year before Win 95, IBM released OS/2 Warp 3, named after Star Trek. It needed only 4 MB of memory, supported more hardware and came with the BonusPak: an Internet access kit, fax software, a word processor and a spreadsheet.

Warp was sold in two boxes. The blue-spine version included its own copy of Win 3.1 for Win-OS/2, while the cheaper red-spine version used the Win already installed on the user's machine. Warp Connect with built-in network clients followed in 1995, and Warp Server in 1996.` },
    { id: 'warp4', title: 'OS/2 Warp 4', content: `OS/2 Warp 4 (codename <em>Merlin</em>) came out in September 1996. It got a refreshed look, a built-in Java virtual machine and VoiceType speech recognition for dictating text and launching programs by voice. Soon afterwards IBM all but stopped marketing OS/2 to home users and focused on corporate customers. In 1999 it released Warp Server for e-business (codename <em>Aurora</em>) with the JFS journaling file system.` },
    { id: 'tech', title: 'Technology', content: `<ul>
<li><strong>Preemptive multitasking and threads</strong>: the system schedules processor time itself, and one hung program does not stop the rest.</li>
<li><strong>HPFS</strong>: a file system with long names, extended attributes and low fragmentation, available long before VFAT.</li>
<li><strong>Workplace Shell and SOM</strong>: an object desktop that programs can extend with their own object classes.</li>
<li><strong>REXX</strong>: a built-in scripting language for automating tasks.</li>
<li><strong>DOS virtual machines</strong>: each DOS session gets up to 730 KB of conventional memory, more than under "real" [[msdos|MS-DOS]].</li>
</ul>` },
    { id: 'community', title: 'Community', content: `OS/2 fans organized as Team OS/2: volunteers ran in-store demonstrations, wrote free software and argued in [[usenet|Usenet]] groups. In Russia OS/2 is popular with [[fidonet|FidoNet]] and [[bbs|BBS]] sysops, because multitasking lets one computer handle several modem lines and a mailer without the whole station going down.` },
    { id: 'today', title: 'Status in 1999', content: `The main reason for OS/2's defeat is usually said to be the lack of software: developers wrote for Win, OS/2 ran those programs in compatibility mode, and there was no reason to make native versions. Win 95 also came preinstalled on new computers, while OS/2 had to be bought and installed separately.

Even so, OS/2 runs thousands of ATMs, cash register systems and offices that value its stability, and IBM keeps releasing FixPak updates.` }
  ],
  seeAlso: ['msdos', 'windows95', 'winnt4', 'fidonet', 'bbs'],
  references: [
    'Letwin, G. Inside OS/2. Microslop Press, 1988.',
    'IBM OS/2 Warp 4: User\'s Guide. IBM, 1996.',
    'Archive of comp.os.os2.advocacy, 1994–1999.'
  ],
  links: [['http://fido.relcom.ru', 'FidoNet echomail on the Web']],
  categories: ['Operating Systems', 'IBM', '1994 Software']
});

window.interpediaReg('macos8', 'os', {
  title: 'Mac OS 8',
  infobox: {
    title: 'Mac OS 8',
    badgeText: 'Apple Computer',
    fields: [
      { label: 'Разработчик', value: 'Apple Computer' },
      { label: 'Дата выхода', value: '26 июля 1997' },
      { label: 'Версии', value: '8.0, 8.1, 8.5, 8.6' },
      { label: 'Процессоры', value: 'Motorola 68040, PowerPC' },
      { label: 'Файловые системы', value: 'HFS, HFS+ (с 8.1)' },
      { label: 'Оформление', value: 'Platinum' },
      { label: 'Предшественник', value: 'System 7.6' },
      { label: 'Преемник', value: 'Mac OS 9 (октябрь 1999)' }
    ]
  },
  lead: `<strong>Mac OS 8</strong> — операционная система для компьютеров Apple Macintosh, выпущенная 26 июля 1997 года. Она появилась в самый тяжёлый момент истории Apple, после отмены проекта Copland и возвращения в компанию Стива Джобса, и стала самым быстро продаваемым программным продуктом Apple: по данным компании, за две недели было продано больше миллиона копий.

Mac OS 8 принесла новое оформление Platinum, многопоточный Finder, контекстные меню и «пружинящие» папки. Обновления 8.1, 8.5 и 8.6 добавили файловую систему HFS+, поисковик Sherlock и улучшенную поддержку PowerPC, а в октябре 1999 года линейку продолжила Mac OS 9.`,
  sections: [
    { id: 'copland', title: 'Copland и кризис Apple', content: `В середине 1990-х Apple теряла долю рынка, а её система System 7 устарела: в ней не было ни защиты памяти, ни вытесняющей многозадачности. Проект новой системы Copland, объявленный в 1994 году, разросся и в августе 1996 года был отменён. Не имея своей замены, Apple искала систему на стороне: велись переговоры с Be Inc., создателем [[beos|BeOS]], но в декабре 1996 года Apple купила компанию NeXT Стива Джобса вместе с её системой NeXTSTEP. Джобс вернулся в Apple и вскоре возглавил её.

Часть разработок Copland — новый облик интерфейса и многопоточный Finder — решили выпустить в виде обновления привычной системы. Им и стала Mac OS 8.` },
    { id: 'clones', title: 'Конец клонов', content: `С 1995 года Apple лицензировала систему другим производителям — Power Computing, Umax, Motorola, — и те выпускали более дешёвые совместимые компьютеры. Лицензии распространялись на System 7. Выпустив обновление под номером 8, а не 7.7, Apple вывела его из-под действия договоров. В сентябре 1997 года Apple выкупила у Power Computing лицензию и часть бизнеса, и рынок клонов Macintosh фактически закрылся.` },
    { id: 'features', title: 'Нововведения', content: `<ul>
<li><strong>Оформление Platinum</strong> — объёмные серые окна и кнопки, единый облик элементов управления через Appearance Manager.</li>
<li><strong>Многопоточный Finder</strong> — копирование файлов больше не блокирует работу с рабочим столом.</li>
<li><strong>Контекстные меню</strong> — по щелчку с нажатой клавишей Control.</li>
<li><strong>Пружинящие папки</strong> — при перетаскивании файла папки раскрываются сами.</li>
<li><strong>Всплывающие окна</strong> — папку можно опустить к нижнему краю экрана в виде вкладки.</li>
<li><strong>Интернет</strong> — в комплект вошли браузеры [[netscape|Netscape Navigator]] и [[ie5|Internet Explorer]], а также Mac OS Runtime for Java.</li>
</ul>

Mac OS 8 требует процессор 68040 или PowerPC; владельцы более старых машин остались на System 7.` },
    { id: 'versions', title: 'Обновления', content: `<table class="interpedia-wikitable">
<tr><th>Версия</th><th>Выход</th><th>Главное</th></tr>
<tr><td>8.0</td><td>июль 1997</td><td>Platinum, многопоточный Finder</td></tr>
<tr><td>8.1</td><td>январь 1998</td><td>файловая система HFS+ (Mac OS Extended)</td></tr>
<tr><td>8.5</td><td>октябрь 1998</td><td>поиск Sherlock, сглаживание шрифтов, только PowerPC</td></tr>
<tr><td>8.6</td><td>май 1999</td><td>новое наноядро с поддержкой многопроцессорности</td></tr>
</table>

HFS+ хранит файлы в блоках меньшего размера и экономит место на больших дисках так же, как FAT32 в [[windows98|Win 98]]. Sherlock ищет и по файлам на диске, и в Интернете через модули для поисковых систем вроде [[altavista|AltaVista]].` },
    { id: 'imac', title: 'iMac', content: `15 августа 1998 года Apple выпустила iMac — моноблок в полупрозрачном корпусе цвета «бонди-блю» с Mac OS 8.1. В нём не было дисковода для [[floppy144|дискет]] и старых портов: только USB, модем и сеть. Решение вызвало споры, но iMac стал самым продаваемым компьютером Apple за много лет и подтолкнул производителей к выпуску USB-устройств, которыми смогли пользоваться и владельцы [[windows98|Win 98]].` },
    { id: 'macos9', title: 'Mac OS 9', content: `23 октября 1999 года вышла Mac OS 9, которую Apple рекламирует как «лучшую систему для Интернета». Она добавила несколько учётных записей пользователей на одном компьютере, связку ключей для хранения паролей, вход по голосовому паролю, автоматическое обновление программ и Sherlock 2 с поиском по интернет-магазинам. Архитектура системы осталась прежней: защиты памяти и вытесняющей многозадачности по-прежнему нет.` },
    { id: 'future', title: 'Будущее: Mac OS X', content: `Систему нового поколения Apple строит на основе NeXTSTEP. В марте 1999 года вышла Mac OS X Server 1.0, а версия для обычных пользователей обещана на 2000 год. Старые программы будут работать в ней через программный интерфейс Carbon, переходный между классической Mac OS и новой системой.` },
    { id: 'russia', title: 'Macintosh в России', content: `В России Macintosh распространён прежде всего в издательствах, рекламных агентствах и полиграфии, где стандартом стали QuarkXPress и [[photoshop|Photoshop]]. Русские тексты на Mac используют собственную кодировку MacCyrillic, отличную и от CP1251 в Win, и от KOI8-R в Интернете, поэтому обмен файлами между платформами нередко требует перекодировки.` }
  ],
  seeAlso: ['beos', 'windows98', 'photoshop', 'linux', 'netscape'],
  references: [
    'Pogue D. Macs for Dummies. — IDG Books, 1997–1998.',
    'Apple Computer. Mac OS 8.5 Technical Note. — 1998.',
    'Пресс-релиз Apple о продажах Mac OS 8. — август 1997.'
  ],
  categories: ['Операционные системы', 'Apple', 'Программы 1997 года']
}, {
  title: 'Mac OS 8',
  infobox: {
    title: 'Mac OS 8',
    badgeText: 'Apple Computer',
    fields: [
      { label: 'Developer', value: 'Apple Computer' },
      { label: 'Released', value: 'July 26, 1997' },
      { label: 'Versions', value: '8.0, 8.1, 8.5, 8.6' },
      { label: 'Processors', value: 'Motorola 68040, PowerPC' },
      { label: 'Filesystems', value: 'HFS, HFS+ (from 8.1)' },
      { label: 'Appearance', value: 'Platinum' },
      { label: 'Predecessor', value: 'System 7.6' },
      { label: 'Successor', value: 'Mac OS 9 (October 1999)' }
    ]
  },
  lead: `<strong>Mac OS 8</strong> is an operating system for Apple Macintosh computers released on July 26, 1997. It arrived at the lowest point in Apple's history, after the Copland project was cancelled and Steve Jobs returned to the company, and it became Apple's fastest-selling software product: according to the company, more than a million copies sold in two weeks.

Mac OS 8 brought the Platinum appearance, a multithreaded Finder, contextual menus and spring-loaded folders. Updates 8.1, 8.5 and 8.6 added the HFS+ file system, the Sherlock search tool and better PowerPC support, and in October 1999 the line continued with Mac OS 9.`,
  sections: [
    { id: 'copland', title: 'Copland and Apple\'s crisis', content: `In the mid-1990s Apple was losing market share, and System 7 was dated: it had neither memory protection nor preemptive multitasking. The new Copland system, announced in 1994, grew out of control and was cancelled in August 1996. Without a replacement of its own, Apple looked outside: it negotiated with Be Inc., maker of [[beos|BeOS]], but in December 1996 it bought Steve Jobs's NeXT along with its NeXTSTEP system. Jobs returned to Apple and soon took charge.

Some of the Copland work, the new look and the multithreaded Finder, was released as an update to the familiar system. That update became Mac OS 8.` },
    { id: 'clones', title: 'The end of the clones', content: `From 1995 Apple licensed its system to other makers such as Power Computing, Umax and Motorola, who built cheaper compatible computers. The licenses covered System 7. By numbering the update 8 rather than 7.7, Apple put it outside those contracts. In September 1997 Apple bought Power Computing's license and part of its business, and the Macintosh clone market effectively closed.` },
    { id: 'features', title: 'New features', content: `<ul>
<li><strong>Platinum appearance</strong>: beveled gray windows and buttons, with a consistent look for controls through the Appearance Manager.</li>
<li><strong>Multithreaded Finder</strong>: copying files no longer blocks the desktop.</li>
<li><strong>Contextual menus</strong>: Control-click on an item.</li>
<li><strong>Spring-loaded folders</strong>: folders open by themselves while a file is dragged over them.</li>
<li><strong>Pop-up windows</strong>: a folder can be docked as a tab at the bottom of the screen.</li>
<li><strong>Internet</strong>: the package includes [[netscape|Netscape Navigator]] and [[ie5|Internet Explorer]] plus Mac OS Runtime for Java.</li>
</ul>

Mac OS 8 needs a 68040 or PowerPC processor; owners of older machines stayed with System 7.` },
    { id: 'versions', title: 'Updates', content: `<table class="interpedia-wikitable">
<tr><th>Version</th><th>Released</th><th>Highlights</th></tr>
<tr><td>8.0</td><td>July 1997</td><td>Platinum, multithreaded Finder</td></tr>
<tr><td>8.1</td><td>January 1998</td><td>HFS+ file system (Mac OS Extended)</td></tr>
<tr><td>8.5</td><td>October 1998</td><td>Sherlock search, font smoothing, PowerPC only</td></tr>
<tr><td>8.6</td><td>May 1999</td><td>new nanokernel with multiprocessing support</td></tr>
</table>

HFS+ stores files in smaller blocks and saves space on large disks much as FAT32 does in [[windows98|Win 98]]. Sherlock searches both local files and the Internet through plug-ins for engines such as [[altavista|AltaVista]].` },
    { id: 'imac', title: 'iMac', content: `On August 15, 1998, Apple released the iMac, an all-in-one computer in a translucent "Bondi blue" case running Mac OS 8.1. It had no [[floppy144|floppy]] drive and no legacy ports, only USB, a modem and Ethernet. The choice was controversial, but the iMac became Apple's best-selling computer in years and pushed manufacturers to make USB devices that [[windows98|Win 98]] owners could use too.` },
    { id: 'macos9', title: 'Mac OS 9', content: `Mac OS 9 came out on October 23, 1999, advertised by Apple as "the best Internet operating system ever". It added multiple user accounts on one computer, a Keychain for passwords, voiceprint login, automatic software updates and Sherlock 2 with online shopping search. The architecture stayed the same: there is still no memory protection or preemptive multitasking.` },
    { id: 'future', title: 'The future: Mac OS X', content: `Apple is building its next-generation system on NeXTSTEP. Mac OS X Server 1.0 shipped in March 1999, and a consumer version is promised for 2000. Old programs will run on it through Carbon, a programming interface that bridges classic Mac OS and the new system.` },
    { id: 'russia', title: 'The Macintosh in Russia', content: `In Russia the Macintosh is found mostly in publishing houses, advertising agencies and print shops, where QuarkXPress and [[photoshop|Photoshop]] are the standard. Russian text on the Mac uses its own MacCyrillic encoding, different from both CP1251 on Win and KOI8-R on the Internet, so moving files between platforms often requires conversion.` }
  ],
  seeAlso: ['beos', 'windows98', 'photoshop', 'linux', 'netscape'],
  references: [
    'Pogue, D. Macs for Dummies. IDG Books, 1997–1998.',
    'Apple Computer. Mac OS 8.5 Technical Note, 1998.',
    'Apple press release on Mac OS 8 sales, August 1997.'
  ],
  categories: ['Operating Systems', 'Apple', '1997 Software']
});

window.interpediaReg('linux', 'os', {
  title: 'Linux (ядро и ОС)',
  infobox: {
    title: 'Linux',
    badgeText: 'Талисман — пингвин Tux',
    fields: [
      { label: 'Автор', value: 'Линус Торвальдс' },
      { label: 'Первая версия', value: '0.01, сентябрь 1991' },
      { label: 'Стабильная версия', value: '2.2 (январь 1999)' },
      { label: 'Лицензия', value: 'GNU GPL' },
      { label: 'Тип ядра', value: 'монолитное с загружаемыми модулями' },
      { label: 'Платформы', value: 'x86, Alpha, SPARC, PowerPC, m68k, MIPS, ARM' },
      { label: 'Дистрибутивы', value: 'Slackware, Debian, Red Hat, SuSE, Mandrake' },
      { label: 'Графические среды', value: 'X Window System, KDE, GNOME' }
    ]
  },
  lead: `<strong>Linux</strong> — свободное ядро операционной системы, созданное финским студентом Линусом Торвальдсом в 1991 году, а также системы на его основе, которые включают программы проекта GNU и другие свободные компоненты. Исходный код ядра распространяется по лицензии GNU GPL: его может изучать, изменять и распространять любой.

За восемь лет Linux вырос из студенческого хобби в систему, на которой работают тысячи серверов [[www|Всемирной паутины]]. В 1999 году о нём пишут деловые газеты: акции Red Hat и VA Linux стали самыми громкими размещениями года, а производители баз данных и компьютеров объявляют о поддержке Linux.`,
  sections: [
    { id: 'origins', title: 'Происхождение', content: `В 1991 году Линус Торвальдс, студент Хельсинкского университета, купил компьютер с процессором 386 и начал писать для него эмулятор терминала, который постепенно превратился в ядро операционной системы. 25 августа 1991 года он написал в конференцию [[usenet|Usenet]] comp.os.minix:

<blockquote>«Я делаю (свободную) операционную систему (это просто хобби, она не будет большой и профессиональной, как GNU) для клонов 386(486) AT».</blockquote>

Версия 0.01 появилась на FTP-сервере университета в сентябре 1991 года. Сам Торвальдс хотел назвать систему Freax, но администратор сервера Ари Лемке назвал каталог «linux», и имя прижилось.` },
    { id: 'gnu', title: 'GNU и лицензия GPL', content: `Ядро само по себе ещё не система: нужны компилятор, командная оболочка, библиотеки и утилиты. Их Linux получил от проекта GNU, который Ричард Столлман начал в 1983 году, чтобы создать полностью свободную Unix-совместимую систему. К 1991 году у GNU были компилятор GCC, редактор Emacs и оболочка bash, но не было готового ядра.

В начале 1992 года Торвальдс перевёл ядро на лицензию GNU GPL. Она разрешает свободно копировать и изменять программу при условии, что изменённые версии распространяются на тех же условиях и с исходным кодом. Столлман и Фонд свободного ПО настаивают на названии «GNU/Linux», подчёркивая вклад проекта GNU.` },
    { id: 'debate', title: 'Спор с Таненбаумом', content: `В январе 1992 года профессор Эндрю Таненбаум, автор учебной системы Minix, опубликовал в comp.os.minix сообщение «LINUX устарел». Он доказывал, что монолитное ядро — шаг назад по сравнению с микроядрами, а привязка к процессору 386 обрекает систему на быструю смерть. Торвальдс ответил резко, и дискуссия, к которой присоединились десятки участников, стала одной из самых известных в истории Usenet.` },
    { id: 'versions', title: 'Версии ядра', content: `Чётные номера второй цифры обозначают стабильные ветви, нечётные — экспериментальные.

<table class="interpedia-wikitable">
<tr><th>Версия</th><th>Выход</th><th>Главное</th></tr>
<tr><td>0.01</td><td>сентябрь 1991</td><td>первый выпуск</td></tr>
<tr><td>0.12</td><td>январь 1992</td><td>переход на GPL</td></tr>
<tr><td>1.0</td><td>март 1994</td><td>первая стабильная версия, сеть TCP/IP</td></tr>
<tr><td>1.2</td><td>март 1995</td><td>поддержка Alpha, SPARC, MIPS</td></tr>
<tr><td>2.0</td><td>июнь 1996</td><td>многопроцессорность, загружаемые модули</td></tr>
<tr><td>2.2</td><td>январь 1999</td><td>улучшенная многопроцессорность, новые драйверы</td></tr>
<tr><td>2.3</td><td>с мая 1999</td><td>разработка будущей версии 2.4</td></tr>
</table>` },
    { id: 'distros', title: 'Дистрибутивы', content: `Собрать систему из исходников сложно, поэтому пользователи устанавливают дистрибутивы — готовые наборы ядра, программ и программы установки, обычно на [[cdrom|компакт-диске]].

<dl>
<dt>Slackware</dt><dd>один из старейших дистрибутивов (1993), консервативный и близкий к классическому Unix.</dd>
<dt>Debian</dt><dd>некоммерческий проект добровольцев (1993) со строгими правилами свободы программ.</dd>
<dt>Red Hat</dt><dd>коммерческий дистрибутив с системой пакетов RPM, популярный на серверах.</dd>
<dt>SuSE</dt><dd>немецкий дистрибутив с программой настройки YaST.</dd>
<dt>Linux Mandrake</dt><dd>основан на Red Hat (1998), с рабочим столом KDE и упором на новичков.</dd>
</dl>

В России и на Украине популярны локализованные сборки, например Black Cat Linux, а русские тексты в Linux традиционно хранятся в кодировке KOI8-R.` },
    { id: 'desktop', title: 'Рабочий стол', content: `Графика в Linux строится на X Window System (реализация XFree86) и оконных менеджерах вроде fvwm, Window Maker и Enlightenment. В июле 1998 года вышла среда KDE 1.0 с единообразным набором программ, а в марте 1999 года — конкурирующая среда GNOME 1.0, созданная из-за споров о лицензии библиотеки Qt, на которой построена KDE.

Игры для Linux пока редкость. id Software выпускает версии своих шутеров, включая [[quake|Quake]], а фирма Loki Software с 1998 года переносит на Linux коммерческие игры.` },
    { id: 'business', title: 'Linux в 1999 году', content: `В 1998 году Netscape открыла исходный код своего браузера, а Oracle, Informix и IBM объявили о версиях своих программ для Linux. В октябре того же года утекли внутренние меморандумы Microslop, прозванные «Хэллоуинскими документами»: в них свободное ПО названо серьёзной угрозой для компании.

11 августа 1999 года на биржу вышла Red Hat, и её акции за первый день подорожали более чем втрое. 9 декабря 1999 года акции VA Linux выросли за день почти на 700 процентов — рекорд в истории американских размещений. Значительная часть веб-серверов Интернета работает на Linux с сервером Apache.` },
    { id: 'tux', title: 'Талисман', content: `Талисман Linux — пингвин Tux, нарисованный в 1996 году Ларри Юингом в свободном графическом редакторе GIMP. Торвальдс объяснил выбор тем, что однажды в зоопарке его укусил пингвин.` }
  ],
  seeAlso: ['freebsd', 'usenet', 'www', 'beos', 'msdos'],
  references: [
    'Raymond E. S. The Cathedral and the Bazaar. — O\'Reilly, 1999.',
    'DiBona C., Ockman S., Stone M. (ред.) Open Sources: Voices from the Open Source Revolution. — O\'Reilly, 1999.',
    'Архив дискуссии «LINUX is obsolete», comp.os.minix, январь 1992.',
    'Welsh M., Kaufman L. Running Linux. — O\'Reilly, 1995.'
  ],
  links: [['http://www.lib.ru', 'Библиотека Мошкова: раздел о Unix и Linux']],
  categories: ['Операционные системы', 'Свободное программное обеспечение', 'Unix-подобные системы']
}, {
  title: 'Linux Kernel & OS',
  infobox: {
    title: 'Linux',
    badgeText: 'Mascot: Tux the penguin',
    fields: [
      { label: 'Author', value: 'Linus Torvalds' },
      { label: 'First version', value: '0.01, September 1991' },
      { label: 'Stable version', value: '2.2 (January 1999)' },
      { label: 'License', value: 'GNU GPL' },
      { label: 'Kernel type', value: 'monolithic with loadable modules' },
      { label: 'Platforms', value: 'x86, Alpha, SPARC, PowerPC, m68k, MIPS, ARM' },
      { label: 'Distributions', value: 'Slackware, Debian, Red Hat, SuSE, Mandrake' },
      { label: 'Desktops', value: 'X Window System, KDE, GNOME' }
    ]
  },
  lead: `<strong>Linux</strong> is a free operating system kernel created by Finnish student Linus Torvalds in 1991, and also the systems built on it that include GNU project software and other free components. The kernel source is released under the GNU GPL, so anyone can study, change and redistribute it.

In eight years Linux grew from a student hobby into a system that runs thousands of [[www|World Wide Web]] servers. In 1999 the business press covers it: the Red Hat and VA Linux stock offerings were the loudest of the year, and database and hardware companies are announcing Linux support.`,
  sections: [
    { id: 'origins', title: 'Origins', content: `In 1991 Linus Torvalds, a student at the University of Helsinki, bought a 386 computer and began writing a terminal emulator for it that gradually turned into an operating system kernel. On August 25, 1991, he posted to the [[usenet|Usenet]] group comp.os.minix:

<blockquote>"I'm doing a (free) operating system (just a hobby, won't be big and professional like gnu) for 386(486) AT clones."</blockquote>

Version 0.01 appeared on the university FTP server in September 1991. Torvalds wanted to call it Freax, but server administrator Ari Lemmke named the directory "linux", and the name stuck.` },
    { id: 'gnu', title: 'GNU and the GPL', content: `A kernel alone is not a system: it needs a compiler, a shell, libraries and utilities. Linux got them from the GNU project, which Richard Stallman started in 1983 to build a completely free Unix-compatible system. By 1991 GNU had the GCC compiler, the Emacs editor and the bash shell, but no finished kernel.

In early 1992 Torvalds moved the kernel to the GNU GPL. It allows free copying and modification on the condition that changed versions are distributed under the same terms with source code. Stallman and the Free Software Foundation insist on the name "GNU/Linux" to credit the GNU project.` },
    { id: 'debate', title: 'The Tanenbaum debate', content: `In January 1992 Professor Andrew Tanenbaum, author of the teaching system Minix, posted "LINUX is obsolete" to comp.os.minix. He argued that a monolithic kernel was a step back from microkernels and that tying the system to the 386 doomed it to an early death. Torvalds answered sharply, and the debate, joined by dozens of people, became one of the most famous in Usenet history.` },
    { id: 'versions', title: 'Kernel versions', content: `An even second digit marks a stable series and an odd one an experimental series.

<table class="interpedia-wikitable">
<tr><th>Version</th><th>Released</th><th>Highlights</th></tr>
<tr><td>0.01</td><td>September 1991</td><td>first release</td></tr>
<tr><td>0.12</td><td>January 1992</td><td>move to the GPL</td></tr>
<tr><td>1.0</td><td>March 1994</td><td>first stable version, TCP/IP networking</td></tr>
<tr><td>1.2</td><td>March 1995</td><td>Alpha, SPARC and MIPS support</td></tr>
<tr><td>2.0</td><td>June 1996</td><td>multiprocessing, loadable modules</td></tr>
<tr><td>2.2</td><td>January 1999</td><td>better multiprocessing, new drivers</td></tr>
<tr><td>2.3</td><td>since May 1999</td><td>development toward version 2.4</td></tr>
</table>` },
    { id: 'distros', title: 'Distributions', content: `Building a system from source is hard, so users install distributions: ready sets of the kernel, programs and an installer, usually on [[cdrom|CD-ROM]].

<dl>
<dt>Slackware</dt><dd>one of the oldest distributions (1993), conservative and close to classic Unix.</dd>
<dt>Debian</dt><dd>a non-commercial volunteer project (1993) with strict software freedom rules.</dd>
<dt>Red Hat</dt><dd>a commercial distribution with the RPM package system, popular on servers.</dd>
<dt>SuSE</dt><dd>a German distribution with the YaST setup tool.</dd>
<dt>Linux Mandrake</dt><dd>based on Red Hat (1998), with the KDE desktop and a focus on newcomers.</dd>
</dl>

Localized builds such as Black Cat Linux are popular in Russia and Ukraine, and Russian text on Linux is traditionally stored in the KOI8-R encoding.` },
    { id: 'desktop', title: 'Desktop', content: `Graphics on Linux are built on the X Window System (the XFree86 implementation) and window managers such as fvwm, Window Maker and Enlightenment. KDE 1.0, with a consistent set of applications, came out in July 1998, and the rival GNOME 1.0 followed in March 1999, started because of disputes over the license of the Qt library that KDE uses.

Games for Linux are still rare. id Software releases versions of its shooters, including [[quake|Quake]], and since 1998 Loki Software has been porting commercial games to Linux.` },
    { id: 'business', title: 'Linux in 1999', content: `In 1998 Netscape opened the source code of its browser, and Oracle, Informix and IBM announced Linux versions of their software. In October of that year internal Microslop memos leaked, nicknamed the "Halloween Documents", which called free software a serious threat to the company.

On August 11, 1999, Red Hat went public, and its shares more than tripled on the first day. On December 9, 1999, VA Linux shares rose almost 700 percent in a day, a record for American stock offerings. A large share of Internet web servers run Linux with the Apache server.` },
    { id: 'tux', title: 'Mascot', content: `The Linux mascot is Tux the penguin, drawn in 1996 by Larry Ewing in the free GIMP image editor. Torvalds explained the choice by saying a penguin once bit him at a zoo.` }
  ],
  seeAlso: ['freebsd', 'usenet', 'www', 'beos', 'msdos'],
  references: [
    'Raymond, E. S. The Cathedral and the Bazaar. O\'Reilly, 1999.',
    'DiBona, C., Ockman, S., Stone, M. (eds.) Open Sources: Voices from the Open Source Revolution. O\'Reilly, 1999.',
    '"LINUX is obsolete" thread archive, comp.os.minix, January 1992.',
    'Welsh, M., Kaufman, L. Running Linux. O\'Reilly, 1995.'
  ],
  links: [['http://www.lib.ru', 'Moshkov Library: Unix and Linux section']],
  categories: ['Operating Systems', 'Free Software', 'Unix-like Systems']
});

window.interpediaReg('beos', 'os', {
  title: 'BeOS',
  infobox: {
    title: 'BeOS',
    badgeText: 'Be Incorporated',
    fields: [
      { label: 'Разработчик', value: 'Be Inc. (основатель — Жан-Луи Гассе)' },
      { label: 'Первый выпуск', value: '1995, вместе с компьютером BeBox' },
      { label: 'Текущая версия', value: 'R4.5 «Genki» (июнь 1999)' },
      { label: 'Платформы', value: 'BeBox, Power Macintosh, x86 (с R3)' },
      { label: 'Файловая система', value: 'BFS (64-битная, журналируемая)' },
      { label: 'Ядро', value: 'микроядро с вытесняющей многозадачностью' },
      { label: 'Совместимость', value: 'POSIX, командная оболочка bash' }
    ]
  },
  lead: `<strong>BeOS</strong> — операционная система компании Be Inc., написанная с нуля в 1990-х годах для мультимедиа и многопроцессорных компьютеров. Её отличают сквозная многопоточность, мгновенная реакция интерфейса, загрузка за несколько секунд и база данных, встроенная прямо в файловую систему.

BeOS начиналась как система для собственного компьютера BeBox, затем работала на Power Macintosh, а с 1998 года доступна и для обычных ПК. В 1996 году Apple рассматривала её как основу своей будущей системы, но выбрала NeXTSTEP. На конец 1999 года BeOS остаётся системой для энтузиастов и звукорежиссёров, которые ценят её низкие задержки при работе со звуком и видео.`,
  sections: [
    { id: 'company', title: 'Be Inc. и Жан-Луи Гассе', content: `Компанию Be основал в 1990 году Жан-Луи Гассе, прежде руководивший разработкой продуктов в Apple. Он считал, что системы Macintosh и Win обросли многолетним грузом совместимости, и хотел начать с чистого листа: без поддержки старых программ, но с архитектурой, рассчитанной на несколько процессоров и потоковое мультимедиа.` },
    { id: 'bebox', title: 'BeBox', content: `Первым продуктом Be стал компьютер BeBox, представленный в октябре 1995 года. Он имел два процессора PowerPC 603, а на передней панели — две вертикальные полоски светодиодов («блинкенлайты»), показывавшие загрузку каждого процессора. Разъём GeekPort позволял подключать к компьютеру самодельную электронику.

BeBox продавался в основном разработчикам; выпуск прекратили в начале 1997 года, выпустив, по оценкам, около двух тысяч машин. Be сосредоточилась на программной части и перенесла систему сначала на Power Macintosh, а затем на ПК.` },
    { id: 'design', title: 'Архитектура', content: `<ul>
<li><strong>Сквозная многопоточность.</strong> Каждое окно работает в собственном потоке, поэтому интерфейс не «замерзает», пока программа занята вычислениями. Система равномерно распределяет потоки между процессорами.</li>
<li><strong>BFS.</strong> 64-разрядная журналируемая файловая система хранит у файлов произвольные атрибуты — например, автора письма или исполнителя песни — и выполняет по ним запросы. Почтовая программа BeOS хранит письма как обычные файлы с атрибутами, а «живые» запросы обновляются сами.</li>
<li><strong>Медиа.</strong> Система рассчитана на одновременное воспроизведение нескольких видеопотоков и обработку звука с малыми задержками. На демонстрациях BeOS проигрывает несколько видеороликов сразу, пока в соседнем окне вращается трёхмерный чайник.</li>
<li><strong>POSIX.</strong> Под графическим интерфейсом есть командная оболочка bash и стандартные утилиты Unix, что облегчает перенос программ.</li>
</ul>` },
    { id: 'apple', title: 'Несостоявшаяся сделка с Apple', content: `В 1996 году, после отмены проекта Copland, Apple искала готовую современную систему. BeOS считалась главным кандидатом: она уже работала на Power Macintosh, а Гассе был выходцем из Apple. По сообщениям прессы, стороны не сошлись в цене, и в декабре 1996 года Apple купила NeXT Стива Джобса. Подробнее см. [[macos8|Mac OS 8]].` },
    { id: 'releases', title: 'Переход на ПК', content: `После того как Apple перестала раскрывать сторонним разработчикам спецификации новых моделей Macintosh, Be сделала ставку на компьютеры с процессорами Intel.

<table class="interpedia-wikitable">
<tr><th>Выпуск</th><th>Дата</th><th>Главное</th></tr>
<tr><td>Developer Release</td><td>1996–1997</td><td>для BeBox и Power Macintosh</td></tr>
<tr><td>R3</td><td>март 1998</td><td>первая версия для x86</td></tr>
<tr><td>R4</td><td>ноябрь 1998</td><td>ускорение, драйверы, поддержка большего числа видеокарт</td></tr>
<tr><td>R4.5 «Genki»</td><td>июнь 1999</td><td>OpenGL, улучшенный браузер NetPositive</td></tr>
</table>

BeOS может стоять на одном диске с [[windows98|Win 98]] и выбирается при загрузке. В июле 1999 года Be Inc. разместила акции на бирже.` },
    { id: 'software', title: 'Программы и сообщество', content: `Программ для BeOS немного: браузер NetPositive, офисный пакет Gobe Productive, звуковые редакторы и множество небольших утилит, которые распространяются через сайт BeWare. Сообщество разработчиков общается в рассылке BeDevTalk. Отсутствие привычных офисных программ и игр остаётся главным препятствием для массового распространения.

Be утверждает, что условия лицензий Microslop затрудняют производителям компьютеров предустановку BeOS рядом с Win, и в 1999 году предлагает её производителям для установки на новые машины.` }
  ],
  seeAlso: ['macos8', 'linux', 'amigaos', 'windows98'],
  references: [
    'Be Inc. The Be Book: BeOS API Reference. — O\'Reilly, 1997.',
    'Giampaolo D. Practical File System Design with the Be File System. — Morgan Kaufmann, 1999.',
    'Интервью Ж.-Л. Гассе журналу Byte, 1996.'
  ],
  categories: ['Операционные системы', 'Мультимедиа', 'Программы 1995 года']
}, {
  title: 'BeOS',
  infobox: {
    title: 'BeOS',
    badgeText: 'Be Incorporated',
    fields: [
      { label: 'Developer', value: 'Be Inc. (founder Jean-Louis Gassée)' },
      { label: 'First release', value: '1995, with the BeBox computer' },
      { label: 'Current version', value: 'R4.5 "Genki" (June 1999)' },
      { label: 'Platforms', value: 'BeBox, Power Macintosh, x86 (since R3)' },
      { label: 'Filesystem', value: 'BFS (64-bit, journaled)' },
      { label: 'Kernel', value: 'microkernel with preemptive multitasking' },
      { label: 'Compatibility', value: 'POSIX, bash shell' }
    ]
  },
  lead: `<strong>BeOS</strong> is an operating system from Be Inc., written from scratch in the 1990s for multimedia and multiprocessor computers. It stands out for pervasive multithreading, an instantly responsive interface, booting in a few seconds and a database built right into the file system.

BeOS began as the system for Be's own BeBox computer, then ran on the Power Macintosh, and since 1998 it has been available for ordinary PCs. In 1996 Apple considered it as the base of its future system but chose NeXTSTEP. As of late 1999 BeOS remains a system for enthusiasts and audio engineers who value its low latency with sound and video.`,
  sections: [
    { id: 'company', title: 'Be Inc. and Jean-Louis Gassée', content: `Be was founded in 1990 by Jean-Louis Gassée, who had previously led product development at Apple. He believed the Macintosh and Win systems carried years of compatibility baggage and wanted a clean start: no support for old programs, but an architecture built for multiple processors and streaming media.` },
    { id: 'bebox', title: 'BeBox', content: `Be's first product was the BeBox computer, unveiled in October 1995. It had two PowerPC 603 processors and, on the front panel, two vertical LED strips ("blinkenlights") showing the load on each processor. The GeekPort connector let owners attach homemade electronics.

The BeBox was sold mostly to developers; production ended in early 1997 after an estimated two thousand machines. Be focused on software and moved the system first to the Power Macintosh and then to the PC.` },
    { id: 'design', title: 'Architecture', content: `<ul>
<li><strong>Pervasive multithreading.</strong> Every window runs in its own thread, so the interface never freezes while a program computes. The system spreads threads evenly across processors.</li>
<li><strong>BFS.</strong> The 64-bit journaled file system stores arbitrary attributes on files, such as a message sender or a song's artist, and runs queries on them. BeOS mail stores messages as ordinary files with attributes, and live queries update themselves.</li>
<li><strong>Media.</strong> The system is designed to play several video streams at once and process sound with low latency. In demos BeOS plays several clips simultaneously while a 3D teapot spins in another window.</li>
<li><strong>POSIX.</strong> Under the graphical interface sit the bash shell and standard Unix utilities, which makes porting programs easier.</li>
</ul>` },
    { id: 'apple', title: 'The deal with Apple that never happened', content: `In 1996, after cancelling Copland, Apple was looking for a ready modern system. BeOS was the main candidate: it already ran on the Power Macintosh, and Gassée was an Apple veteran. According to press reports the sides could not agree on a price, and in December 1996 Apple bought Steve Jobs's NeXT instead. See [[macos8|Mac OS 8]] for more.` },
    { id: 'releases', title: 'Moving to the PC', content: `After Apple stopped sharing specifications of new Macintosh models with outside developers, Be bet on Intel computers.

<table class="interpedia-wikitable">
<tr><th>Release</th><th>Date</th><th>Highlights</th></tr>
<tr><td>Developer Release</td><td>1996–1997</td><td>for BeBox and Power Macintosh</td></tr>
<tr><td>R3</td><td>March 1998</td><td>first x86 version</td></tr>
<tr><td>R4</td><td>November 1998</td><td>speedups, drivers, more video cards</td></tr>
<tr><td>R4.5 "Genki"</td><td>June 1999</td><td>OpenGL, improved NetPositive browser</td></tr>
</table>

BeOS can share a disk with [[windows98|Win 98]] and be chosen at boot. In July 1999 Be Inc. went public.` },
    { id: 'software', title: 'Software and community', content: `BeOS has few programs: the NetPositive browser, the Gobe Productive office suite, audio editors and many small utilities distributed through the BeWare site. Developers talk on the BeDevTalk mailing list. The lack of familiar office software and games remains the main obstacle to wider adoption.

Be says Microslop's license terms make it hard for PC makers to preinstall BeOS alongside Win, and in 1999 it offers the system to manufacturers for new machines.` }
  ],
  seeAlso: ['macos8', 'linux', 'amigaos', 'windows98'],
  references: [
    'Be Inc. The Be Book: BeOS API Reference. O\'Reilly, 1997.',
    'Giampaolo, D. Practical File System Design with the Be File System. Morgan Kaufmann, 1999.',
    'Interview with J.-L. Gassée, Byte, 1996.'
  ],
  categories: ['Operating Systems', 'Multimedia', '1995 Software']
});

window.interpediaReg('amigaos', 'os', {
  title: 'AmigaOS',
  infobox: {
    title: 'AmigaOS',
    badgeText: 'Commodore Amiga',
    fields: [
      { label: 'Разработчик', value: 'Commodore-Amiga; с 1999 — Haage & Partner для Amiga Inc.' },
      { label: 'Первый выпуск', value: '1985 (вместе с Amiga 1000)' },
      { label: 'Текущая версия', value: '3.5 (октябрь 1999)' },
      { label: 'Процессоры', value: 'Motorola 68000 — 68060' },
      { label: 'Компоненты', value: 'Exec, AmigaDOS, Intuition, Workbench' },
      { label: 'Многозадачность', value: 'вытесняющая, с 1985 года' },
      { label: 'Язык сценариев', value: 'ARexx (с 2.0)' }
    ]
  },
  lead: `<strong>AmigaOS</strong> — операционная система персональных компьютеров Amiga, выпускавшихся фирмой Commodore с 1985 по 1994 год. Уже в 1985 году она предлагала вытесняющую многозадачность и цветной графический интерфейс Workbench — возможности, к которым домашние ПК пришли лишь десятилетие спустя.

Благодаря специализированным графическим и звуковым микросхемам Amiga стала любимым компьютером художников, музыкантов и [[demoscene|демосцены]] и одной из самых популярных игровых платформ Европы. После банкротства Commodore в 1994 году система несколько раз меняла владельцев; в октябре 1999 года вышло первое за пять лет обновление — AmigaOS 3.5.`,
  sections: [
    { id: 'birth', title: 'Рождение Amiga', content: `Компьютер разрабатывала небольшая калифорнийская фирма Amiga Corporation под руководством инженера Джея Майнера, создателя графических микросхем для игровой приставки Atari. В 1984 году её купила Commodore. Amiga 1000 была представлена 23 июля 1985 года в нью-йоркском Линкольн-центре: на сцене художник Энди Уорхол нарисовал на ней портрет певицы Дебби Харри.

Самой массовой моделью стала недорогая Amiga 500 (1987), особенно популярная в Великобритании и Германии.` },
    { id: 'architecture', title: 'Архитектура', content: `Секрет Amiga — набор специализированных микросхем, которые разгружают центральный процессор Motorola 68000:

<dl>
<dt>Agnus</dt><dd>управляет доступом к памяти, содержит блиттер для быстрого копирования графики и сопроцессор Copper, меняющий параметры экрана на лету.</dd>
<dt>Denise</dt><dd>выводит изображение, спрайты и режим HAM, показывающий 4096 цветов одновременно.</dd>
<dt>Paula</dt><dd>четыре канала 8-битного цифрового звука, контроллер дисковода и последовательный порт.</dd>
</dl>

Ядро Exec, написанное Карлом Сассенратом, с первого дня поддерживает вытесняющую многозадачность и обмен сообщениями между задачами. Файловую часть, AmigaDOS, построили на основе системы TRIPOS. Графический интерфейс Intuition и рабочий стол Workbench позволяют держать открытыми несколько «экранов» с разным разрешением и перетаскивать их мышью вниз, открывая лежащие под ними.` },
    { id: 'versions', title: 'Версии', content: `<table class="interpedia-wikitable">
<tr><th>Версия</th><th>Год</th><th>Главное</th></tr>
<tr><td>1.0 — 1.3</td><td>1985–1988</td><td>исходная система, автозагрузка с жёсткого диска в 1.3</td></tr>
<tr><td>2.0</td><td>1990</td><td>новый облик, язык ARexx, шрифты с масштабированием (Amiga 3000)</td></tr>
<tr><td>3.0</td><td>1992</td><td>поддержка набора AGA (256 цветов) для Amiga 1200 и 4000</td></tr>
<tr><td>3.1</td><td>1994</td><td>последняя версия эпохи Commodore</td></tr>
<tr><td>3.5</td><td>1999</td><td>Интернет-стек, поддержка больших жёстких дисков, распространяется на [[cdrom|CD-ROM]]</td></tr>
</table>` },
    { id: 'fall', title: 'Падение Commodore', content: `В начале 1990-х Commodore отставала от ПК с VGA и 3D-играми, а неудачные модели и плохой маркетинг подорвали её финансы. 29 апреля 1994 года компания объявила о банкротстве. Права на Amiga в 1995 году купила немецкая сеть Escom, но и она разорилась в 1996 году. В 1997 году Amiga приобрёл американский производитель ПК Gateway 2000, объявивший о планах нового поколения компьютеров. Пока что владельцы продолжают пользоваться старыми машинами, ускоряя их платами с процессорами 68060 и PowerPC.` },
    { id: 'culture', title: 'Культурное значение', content: `Amiga оставила заметный след в цифровой культуре:

<ul>
<li>В 1987 году на ней появилась программа Ultimate Soundtracker, положившая начало музыкальному формату MOD и трекерам, на которых до сих пор пишет музыку [[demoscene|демосцена]].</li>
<li>Графический редактор Deluxe Paint стал стандартом для художников пиксельной графики в игровой индустрии.</li>
<li>Видеосистема Video Toaster фирмы NewTek превратила Amiga в недорогую монтажную студию; на ней создавались спецэффекты для телевидения, в том числе ранних сезонов сериала «Вавилон-5».</li>
<li>На Amiga родились игры Lemmings, Worms и Sensible Soccer.</li>
</ul>` },
    { id: 'ussr', title: 'Amiga на постсоветском пространстве', content: `В СССР и России Amiga оставалась редкостью: компьютеры стоили дорого, а рынок домашних машин занимали клоны ZX Spectrum и, позднее, IBM PC. Немногие владельцы Amiga, как правило, были связаны с демосценой или видеомонтажом. Тем не менее трекерная музыка и форматы MOD пришли в Россию вместе с [[demoscene|демосценой]] на ПК.` }
  ],
  seeAlso: ['demoscene', 'beos', 'secondreality', 'macos8'],
  references: [
    'Amiga ROM Kernel Reference Manual. — 3-е изд. — Addison-Wesley, 1991.',
    'Haage & Partner. AmigaOS 3.5: User Manual. — 1999.',
    'Журнал Amiga Format (Великобритания), подшивка 1988–1999.'
  ],
  categories: ['Операционные системы', 'Commodore', 'Домашние компьютеры']
}, {
  title: 'AmigaOS',
  infobox: {
    title: 'AmigaOS',
    badgeText: 'Commodore Amiga',
    fields: [
      { label: 'Developer', value: 'Commodore-Amiga; since 1999 Haage & Partner for Amiga Inc.' },
      { label: 'First release', value: '1985 (with the Amiga 1000)' },
      { label: 'Current version', value: '3.5 (October 1999)' },
      { label: 'Processors', value: 'Motorola 68000 to 68060' },
      { label: 'Components', value: 'Exec, AmigaDOS, Intuition, Workbench' },
      { label: 'Multitasking', value: 'preemptive, since 1985' },
      { label: 'Scripting', value: 'ARexx (from 2.0)' }
    ]
  },
  lead: `<strong>AmigaOS</strong> is the operating system of the Amiga personal computers that Commodore made from 1985 to 1994. As early as 1985 it offered preemptive multitasking and the color Workbench interface, features home PCs reached only a decade later.

Thanks to custom graphics and sound chips, the Amiga became the favorite machine of artists, musicians and the [[demoscene|demoscene]], and one of Europe's most popular game platforms. After Commodore went bankrupt in 1994, the system changed owners several times; in October 1999 the first update in five years, AmigaOS 3.5, was released.`,
  sections: [
    { id: 'birth', title: 'Birth of the Amiga', content: `The computer was designed by a small Californian firm, Amiga Corporation, led by engineer Jay Miner, who had created the graphics chips for the Atari game console. Commodore bought it in 1984. The Amiga 1000 was unveiled on July 23, 1985, at New York's Lincoln Center, where artist Andy Warhol painted a portrait of singer Debbie Harry on it live.

The best-selling model was the inexpensive Amiga 500 (1987), especially popular in Britain and Germany.` },
    { id: 'architecture', title: 'Architecture', content: `The Amiga's secret is a set of custom chips that take load off the Motorola 68000 processor:

<dl>
<dt>Agnus</dt><dd>controls memory access and contains the blitter for fast graphics copying and the Copper coprocessor, which changes display settings on the fly.</dd>
<dt>Denise</dt><dd>generates the picture, sprites and the HAM mode that shows 4,096 colors at once.</dd>
<dt>Paula</dt><dd>four channels of 8-bit digital sound, the floppy controller and the serial port.</dd>
</dl>

The Exec kernel, written by Carl Sassenrath, supported preemptive multitasking and message passing between tasks from day one. The file layer, AmigaDOS, was based on the TRIPOS system. The Intuition interface and the Workbench desktop let users keep several "screens" with different resolutions open and drag them down with the mouse to reveal the ones beneath.` },
    { id: 'versions', title: 'Versions', content: `<table class="interpedia-wikitable">
<tr><th>Version</th><th>Year</th><th>Highlights</th></tr>
<tr><td>1.0 – 1.3</td><td>1985–1988</td><td>original system; hard disk autoboot in 1.3</td></tr>
<tr><td>2.0</td><td>1990</td><td>new look, ARexx, scalable fonts (Amiga 3000)</td></tr>
<tr><td>3.0</td><td>1992</td><td>AGA chipset support (256 colors) for the Amiga 1200 and 4000</td></tr>
<tr><td>3.1</td><td>1994</td><td>last version of the Commodore era</td></tr>
<tr><td>3.5</td><td>1999</td><td>Internet stack, large hard disk support, ships on [[cdrom|CD-ROM]]</td></tr>
</table>` },
    { id: 'fall', title: 'The fall of Commodore', content: `By the early 1990s Commodore was falling behind PCs with VGA and 3D games, and failed models and poor marketing drained its finances. On April 29, 1994, the company declared bankruptcy. The German retailer Escom bought the Amiga rights in 1995 but went under itself in 1996. In 1997 the American PC maker Gateway 2000 acquired Amiga and announced plans for a new generation of computers. For now owners keep using their old machines, speeding them up with 68060 and PowerPC accelerator boards.` },
    { id: 'culture', title: 'Cultural impact', content: `The Amiga left a clear mark on digital culture:

<ul>
<li>In 1987 Ultimate Soundtracker appeared on it, starting the MOD music format and the trackers the [[demoscene|demoscene]] still composes with.</li>
<li>The Deluxe Paint editor became the standard tool of pixel artists in the game industry.</li>
<li>NewTek's Video Toaster turned the Amiga into an affordable editing studio used for television effects, including the early seasons of Babylon 5.</li>
<li>Lemmings, Worms and Sensible Soccer were born on the Amiga.</li>
</ul>` },
    { id: 'ussr', title: 'The Amiga in the former USSR', content: `In the USSR and Russia the Amiga stayed rare: the machines were expensive, and the home market belonged to ZX Spectrum clones and later the IBM PC. The few Amiga owners were usually tied to the demoscene or video editing. Even so, tracker music and MOD files reached Russia along with the PC [[demoscene|demoscene]].` }
  ],
  seeAlso: ['demoscene', 'beos', 'secondreality', 'macos8'],
  references: [
    'Amiga ROM Kernel Reference Manual, 3rd ed. Addison-Wesley, 1991.',
    'Haage & Partner. AmigaOS 3.5 User Manual, 1999.',
    'Amiga Format (UK) magazine, issues 1988–1999.'
  ],
  categories: ['Operating Systems', 'Commodore', 'Home Computers']
});

window.interpediaReg('freebsd', 'os', {
  title: 'FreeBSD',
  infobox: {
    title: 'FreeBSD',
    badgeText: 'Талисман — демон BSD',
    fields: [
      { label: 'Разработчик', value: 'Проект FreeBSD (добровольцы)' },
      { label: 'Первый выпуск', value: '1.0, ноябрь 1993' },
      { label: 'Текущая версия', value: '3.3 (сентябрь 1999)' },
      { label: 'Основа', value: '4.4BSD-Lite (Беркли)' },
      { label: 'Лицензия', value: 'BSD' },
      { label: 'Платформы', value: 'x86, Alpha' },
      { label: 'Установка программ', value: 'коллекция портов, пакеты' }
    ]
  },
  lead: `<strong>FreeBSD</strong> — свободная Unix-подобная операционная система, наследница BSD, версии Unix, созданной в Калифорнийском университете в Беркли. Проект существует с 1993 года и развивается добровольцами во главе с выборной группой ведущих разработчиков (core team).

FreeBSD славится стабильностью и производительностью сетевого стека. На ней работают одни из самых нагруженных серверов Интернета, в том числе каталог [[yahoo|Yahoo!]] и крупнейший FTP-архив ftp.cdrom.com. В отличие от [[linux|Linux]], FreeBSD развивается как цельная система — ядро и базовые утилиты из одного дерева исходников — и распространяется по более свободной лицензии BSD.`,
  sections: [
    { id: 'bsd', title: 'Корни BSD', content: `В 1970-х годах Калифорнийский университет в Беркли получил исходные тексты Unix от AT&T и начал выпускать собственные дополнения — Berkeley Software Distribution (BSD). Именно в BSD появились стек TCP/IP, на котором вырос Интернет, редактор vi и командная оболочка csh. Группа CSRG в Беркли выпускала версии вплоть до 4.4BSD (1993–1995), постепенно заменив почти весь код AT&T собственным.` },
    { id: 'birth', title: '386BSD и рождение FreeBSD', content: `В 1992 году Билл и Линн Джолитц выпустили 386BSD — перенос BSD на обычные ПК с процессором 386. Автор быстро потерял интерес к поддержке системы, и пользователи собирали неофициальные исправления. В 1993 году Джордан Хаббард, Нейт Уильямс и Род Граймс решили выпустить собственную сборку; название FreeBSD предложил Дэвид Гринмен. Версия 1.0 вышла в ноябре 1993 года на [[cdrom|компакт-диске]] фирмы Walnut Creek CDROM, которая с тех пор поддерживает проект.` },
    { id: 'lawsuit', title: 'Судебный процесс', content: `В 1992 году компания Unix System Laboratories, принадлежавшая AT&T, подала в суд на BSDi и университет, утверждая, что в BSD остался код AT&T. Пока шёл процесс, будущее BSD было неясным, и многие разработчики ушли к Linux. По мировому соглашению 1994 года несколько файлов удалили, а остальной код признали свободным. FreeBSD пришлось переписать систему на основе очищенного выпуска 4.4BSD-Lite; результатом стала версия 2.0 (ноябрь 1994).` },
    { id: 'versions', title: 'Версии', content: `<table class="interpedia-wikitable">
<tr><th>Версия</th><th>Выход</th><th>Главное</th></tr>
<tr><td>1.0</td><td>ноябрь 1993</td><td>первый выпуск на основе 386BSD</td></tr>
<tr><td>2.0</td><td>ноябрь 1994</td><td>переход на 4.4BSD-Lite после процесса</td></tr>
<tr><td>2.2</td><td>1997</td><td>долгоживущая стабильная ветвь (до 2.2.8, 1998)</td></tr>
<tr><td>3.0</td><td>октябрь 1998</td><td>формат ELF, многопроцессорность, новая подсистема SCSI</td></tr>
<tr><td>3.3</td><td>сентябрь 1999</td><td>текущая стабильная версия</td></tr>
<tr><td>4.0</td><td>в разработке</td><td>ожидается в 2000 году</td></tr>
</table>` },
    { id: 'ports', title: 'Коллекция портов', content: `Сторонние программы устанавливаются через коллекцию портов, появившуюся в 1994 году. Порт — это небольшой каталог с правилами сборки: команда <code>make install</code> сама скачивает исходный текст программы, накладывает исправления для FreeBSD, компилирует и устанавливает её. К концу 1999 года в коллекции несколько тысяч программ. FreeBSD также умеет запускать готовые программы для Linux через слой совместимости.` },
    { id: 'internet', title: 'FreeBSD в Интернете', content: `Сервер ftp.cdrom.com фирмы Walnut Creek, работающий на FreeBSD, считается одним из самых загруженных FTP-серверов мира: с него скачивают свободные программы, игры и патчи. На FreeBSD работает каталог [[yahoo|Yahoo!]]. Почтовая служба Hotmail, купленная Microslop в конце 1997 года, по сообщениям прессы, до сих пор в значительной мере обслуживается серверами FreeBSD.` },
    { id: 'russia', title: 'Русский след', content: `Один из ведущих разработчиков FreeBSD — москвич Андрей Чернов. Он автор RFC 1489 (1993), закрепившего кодировку KOI8-R как стандарт для русских текстов в Интернете, и поддержки русской локализации во FreeBSD. Благодаря этому система с самого начала хорошо работает с кириллицей, и многие российские провайдеры и узлы сети Релком выбрали именно её.` },
    { id: 'license', title: 'Лицензия BSD', content: `Лицензия BSD разрешает использовать код в любых программах, в том числе закрытых коммерческих, при условии сохранения уведомления об авторских правах. Сторонники считают её свободнее GPL, противники — что она позволяет компаниям брать код, ничего не возвращая. Код BSD, например стек TCP/IP, используется во многих коммерческих системах.

Талисман BSD — мультяшный демон с трезубцем, которого пользователи прозвали Beastie.` }
  ],
  seeAlso: ['linux', 'yahoo', 'www', 'usenet'],
  references: [
    'McKusick M. K., Bostic K., Karels M. J., Quarterman J. S. The Design and Implementation of the 4.4BSD Operating System. — Addison-Wesley, 1996.',
    'Chernov A. RFC 1489: Registration of a Cyrillic Character Set. — 1993.',
    'Lehey G. The Complete FreeBSD. — Walnut Creek CDROM, 1999.'
  ],
  categories: ['Операционные системы', 'Свободное программное обеспечение', 'Unix-подобные системы']
}, {
  title: 'FreeBSD',
  infobox: {
    title: 'FreeBSD',
    badgeText: 'Mascot: the BSD daemon',
    fields: [
      { label: 'Developer', value: 'The FreeBSD Project (volunteers)' },
      { label: 'First release', value: '1.0, November 1993' },
      { label: 'Current version', value: '3.3 (September 1999)' },
      { label: 'Base', value: '4.4BSD-Lite (Berkeley)' },
      { label: 'License', value: 'BSD' },
      { label: 'Platforms', value: 'x86, Alpha' },
      { label: 'Software installation', value: 'Ports Collection, packages' }
    ]
  },
  lead: `<strong>FreeBSD</strong> is a free Unix-like operating system descended from BSD, the version of Unix created at the University of California, Berkeley. The project has existed since 1993 and is developed by volunteers led by an elected core team.

FreeBSD is known for stability and a fast network stack. It runs some of the busiest servers on the Internet, including the [[yahoo|Yahoo!]] directory and the giant ftp.cdrom.com archive. Unlike [[linux|Linux]], FreeBSD is developed as a whole system, kernel and base utilities from one source tree, and is distributed under the more permissive BSD license.`,
  sections: [
    { id: 'bsd', title: 'BSD roots', content: `In the 1970s the University of California, Berkeley, received Unix source code from AT&T and began releasing its own additions, the Berkeley Software Distribution (BSD). BSD gave the world the TCP/IP stack the Internet grew on, the vi editor and the csh shell. Berkeley's CSRG group released versions up to 4.4BSD (1993–1995), gradually replacing nearly all AT&T code with its own.` },
    { id: 'birth', title: '386BSD and the birth of FreeBSD', content: `In 1992 Bill and Lynne Jolitz released 386BSD, a port of BSD to ordinary 386 PCs. The author soon lost interest in maintaining it, and users collected unofficial patches. In 1993 Jordan Hubbard, Nate Williams and Rod Grimes decided to release their own build; David Greenman suggested the name FreeBSD. Version 1.0 came out in November 1993 on a [[cdrom|CD-ROM]] from Walnut Creek CDROM, which has supported the project ever since.` },
    { id: 'lawsuit', title: 'The lawsuit', content: `In 1992 Unix System Laboratories, owned by AT&T, sued BSDi and the university, claiming BSD still contained AT&T code. While the case went on, BSD's future was unclear, and many developers left for Linux. The 1994 settlement removed a few files and declared the rest of the code free. FreeBSD had to rebuild the system on the cleaned 4.4BSD-Lite release, which became version 2.0 (November 1994).` },
    { id: 'versions', title: 'Versions', content: `<table class="interpedia-wikitable">
<tr><th>Version</th><th>Released</th><th>Highlights</th></tr>
<tr><td>1.0</td><td>November 1993</td><td>first release, based on 386BSD</td></tr>
<tr><td>2.0</td><td>November 1994</td><td>rebuilt on 4.4BSD-Lite after the lawsuit</td></tr>
<tr><td>2.2</td><td>1997</td><td>long-lived stable branch (up to 2.2.8, 1998)</td></tr>
<tr><td>3.0</td><td>October 1998</td><td>ELF format, multiprocessing, new SCSI subsystem</td></tr>
<tr><td>3.3</td><td>September 1999</td><td>current stable version</td></tr>
<tr><td>4.0</td><td>in development</td><td>expected in 2000</td></tr>
</table>` },
    { id: 'ports', title: 'The Ports Collection', content: `Third-party software is installed through the Ports Collection, started in 1994. A port is a small directory of build rules: <code>make install</code> downloads the program's source, applies FreeBSD patches, compiles and installs it. By late 1999 the collection holds several thousand programs. FreeBSD can also run ready-made Linux programs through a compatibility layer.` },
    { id: 'internet', title: 'FreeBSD on the Internet', content: `Walnut Creek's ftp.cdrom.com server, running FreeBSD, is considered one of the busiest FTP servers in the world, serving free software, games and patches. The [[yahoo|Yahoo!]] directory runs on FreeBSD. According to press reports, the Hotmail service, bought by Microslop in late 1997, still runs largely on FreeBSD servers.` },
    { id: 'russia', title: 'The Russian connection', content: `One of FreeBSD's leading developers is Andrey Chernov of Moscow. He wrote RFC 1489 (1993), which established KOI8-R as the standard for Russian text on the Internet, and the Russian locale support in FreeBSD. As a result the system has handled Cyrillic well from the start, and many Russian Internet providers and Relcom network nodes chose it.` },
    { id: 'license', title: 'The BSD license', content: `The BSD license allows the code to be used in any program, including closed commercial ones, as long as the copyright notice is kept. Supporters call it freer than the GPL; critics say it lets companies take code without giving anything back. BSD code, such as the TCP/IP stack, is used in many commercial systems.

The BSD mascot is a cartoon daemon with a pitchfork, nicknamed Beastie by users.` }
  ],
  seeAlso: ['linux', 'yahoo', 'www', 'usenet'],
  references: [
    'McKusick, M. K., Bostic, K., Karels, M. J., Quarterman, J. S. The Design and Implementation of the 4.4BSD Operating System. Addison-Wesley, 1996.',
    'Chernov, A. RFC 1489: Registration of a Cyrillic Character Set, 1993.',
    'Lehey, G. The Complete FreeBSD. Walnut Creek CDROM, 1999.'
  ],
  categories: ['Operating Systems', 'Free Software', 'Unix-like Systems']
});

window.interpediaReg('active_desktop', 'os', {
  title: 'Active Desktop и пакет Microslop Plus! 98',
  infobox: {
    title: 'Active Desktop / Plus! 98',
    badgeText: 'Оболочка Win 98',
    fields: [
      { label: 'Разработчик', value: 'Microslop Corporation' },
      { label: 'Появление', value: 'осень 1997 (IE 4.0); июнь 1998 ([[windows98|Win 98]] и Plus! 98)' },
      { label: 'Основа оболочки', value: 'SHDOCVW.DLL, HTML 4.0, CDF, шаблоны Folder.htt' },
      { label: 'Файлы тем', value: '.theme, .ani (курсоры), LOGO.SYS (заставка запуска)' },
      { label: 'Дополнения Plus! 98', value: 'Темы рабочего стола, Сжатые папки (.ZIP), 3D-заставки' },
      { label: 'Экранные заставки', value: '3D Maze, 3D Pipes, 3D Text, 3D FlowerBox' }
    ]
  },
  lead: `<b>Active Desktop</b> («Активный рабочий стол») и пакет расширения <b>Microslop Plus! 98</b> — технологии оформления и индивидуализации пользовательской среды в [[windows98|Microslop Win 98]]. Представленный вместе с браузером Internet Explorer 4.0 осенью 1997 года и встроенный в ядро оболочки Win 98, режим Active Desktop превратил рабочий стол в живую веб-страницу, способную отображать анимацию GIF, бегущие строки новостей, часы на [[javascript|JavaScript]] и панели информационных каналов. В свою очередь, продаваемый на отдельном компакт-диске пакет <b>Microslop Plus! 98</b> добавил в систему программу смены тем оформления (<i>Desktop Themes</i>), прозрачную работу с архивами <code>.ZIP</code> в Проводнике, трёхмерные экранные заставки на базе [[directx|OpenGL]] и настольные игры.`,
  sections: [
    { id: 'web_shell', title: 'Рабочий стол как веб-страница и шаблоны Folder.htt', content: `В середине 1990-х годов в индустрии вошла в моду концепция «проталкивания информации» (<i>Push technology</i>), популяризированная программой PointCast Network: компьютер в фоновом режиме скачивал новости, котировки акций и прогноз погоды и показывал их вместо обоев или хранителя экрана. Стремясь потеснить [[netscape|Netscape Communicator]] и его компонент Netcaster, корпорация Microslop объединила оболочку Проводника (<code>EXPLORER.EXE</code>) с движком браузера (<code>SHDOCVW.DLL</code>).

При включении флажка <i>«Отображать рабочий стол как страницу Web»</i> (<i>View as Web Page</i>) поверх обычного фона накладывается прозрачный HTML-слой. Пользователь может:
<ul>
<li>ставить на рабочий стол картинки форматов <b>JPEG</b>, <b>GIF</b> (включая анимированные) и целые файлы <code>.HTM</code> без предварительного перевода в несжатый формат <code>.BMP</code>;</li>
<li>размещать на экране плавающие интерактивные врезки (информеры погоды, курс рубля, календарь, строку поиска или мини-плеер);</li>
<li>подписываться на веб-каналы в формате <b>CDF</b> (<i>Channel Definition Format</i>) через вертикальную «Панель каналов» (<i>Channel Bar</i>).</li>
</ul>

Тот же механизм работает внутри любой папки Проводника: в режиме «Как веб-страница» внешний вид папки задаётся скрытым шаблоном <code>Folder.htt</code> и файлом <code>desktop.ini</code>. При выделении файла в левой колонке окна сразу показываются его размер, дата изменения, уменьшенный эскиз изображения или первые строки документа.` },
    { id: 'recovery', title: 'Расход памяти и белый экран восстановления', content: `Несмотря на эффектную демонстрацию, в повседневной работе на компьютерах 1998–1999 годов с 16 или 32 МБ оперативной памяти Active Desktop быстро заслужил противоречивую репутацию. Отрисовка HTML-фона и панели каналов замедляет открытие окон и отнимает драгоценные системные ресурсы GDI/USER.

Особенно известным среди пользователей стал <b>белый экран «Восстановление рабочего стола Active Desktop»</b> (<i>Active Desktop Recovery</i>). Если оболочка <code>EXPLORER.EXE</code> зависала или компьютер выключали кнопкой питания без завершения работы, при следующей загрузке вместо привычных обоев появлялся ослепительно-белый HTML-лист с предупреждением о сбое и кнопкой <i>«Восстановить рабочий стол Active Desktop»</i> (причём иногда нажатие этой кнопки само вызывало ошибку сценария Internet Explorer). По этой причине в компьютерных журналах и на сайте <code>www.ferrum98.ru</code> отключение Active Desktop неизменно возглавляет список советов по ускорению системы.` },
    { id: 'plus98', title: 'Пакет расширения Microslop Plus! 98', content: `Продолжая традицию пакета <i>Microslop Plus! for Win 95</i> (1995), в июне 1998 года компания выпустила коммерческое дополнение <b>Microslop Plus! 98</b> на компакт-диске стоимостью около 40 долларов:

<table class="interpedia-wikitable">
<tr><th>Компонент</th><th>Назначение в системе</th></tr>
<tr><td><b>Темы рабочего стола (Desktop Themes)</b></td><td>18 новых звуковых и графических тем оформления (<i>Science Fiction</i>, <i>More Win</i>, <i>Underwater</i>, <i>Jungle</i>, комиксы <i>Garfield</i> и фотографии <i>PhotoDisc</i>) в дополнение к базовым темам Win 98</td></tr>
<tr><td><b>Сжатые папки (Compressed Folders)</b></td><td>Встроенная поддержка архивов <code>.ZIP</code> прямо в Проводнике: архив открывается как обычная папка с иконкой застёжки-молнии без запуска [[winrar|WinZip или WinRAR]]</td></tr>
<tr><td><b>Очистка меню «Пуск» и диска</b></td><td>Автоматическое удаление нерабочих ярлыков и расширение штатной утилиты «Очистка диска» (<i>Disk Cleanup</i>)</td></tr>
<tr><td><b>Проигрыватель Deluxe CD Player</b></td><td>Обновлённый плеер компакт-дисков с загрузкой названий песен и альбомов через Интернет</td></tr>
<tr><td><b>Игры</b></td><td>Пасьянс «Паук» (<i>Spider Solitaire</i>), головоломка <i>Lose Your Marbles</i> и симулятор гольфа <i>Microslop Golf 1998 Lite</i></td></tr>
</table>` },
    { id: 'screensavers_themes', title: 'Трёхмерные заставки OpenGL и культура тем оформления', content: `Визитной карточкой пакетов Plus! и стандартной поставки Win 98 стали экранные заставки (файлы <code>.SCR</code> в системной папке <code>SYSTEM</code>), использующие библиотеку [[directx|OpenGL]]:
<ul>
<li><b>«Трёхмерный лабиринт» (3D Maze)</b> — бесконечное блуждание от первого лица по кирпичному лабиринтy с деревянным полом, парящими многогранниками, крысами и переворачивающимся экраном при наезде на препятствие;</li>
<li><b>«Трёхмерный трубопровод» (3D Pipes)</b> — завораживающее переплетение разноцветных металлических труб на чёрном фоне (если в настройках выбрать текстуру и смешанный тип соединений, раз в несколько минут вместо обычного шарового стыка на трубе появляется классический компьютерный <b>чайник из Юты</b> — <i>Utah Teapot</i>);</li>
<li><b>«Трёхмерный текст» (3D Text)</b> и <b>«Объёмные фигуры» (3D FlowerBox)</b> — вращающиеся в пространстве надписи и геометрические тела, на которых удобно проверять скорость процессора и видеокарты.</li>
</ul>

К концу 1999 года обмен любительскими темами оформления (<code>.theme</code>) вырос в целое интернет-движение. Полная тема меняет сразу всё: обои, цветовую схему заголовков окон, шрифты, значки «Моего компьютера» и «Корзины» (от полной до пустой), анимированные курсоры мыши <code>.ani</code>, звуки запуска и ошибок (<code>.WAV</code>) и даже загрузочную картинку <code>C:\\LOGO.SYS</code> (разрешением <code>320×400</code> точек, 256 цветов с бегущей внизу полоской палитры). На специализированных сайтах вроде <code>www.themeworld98.com</code> тысячи пользователей скачивают темы по мотивам фильмов «Матрица» и «Звёздные войны», игр [[starcraft|StarCraft]], [[halflife|Half-Life]] и [[quake3|Quake III]], а также [[anime90s|японских аниме-сериалов]].` }
  ],
  seeAlso: ['windows98', 'ie5', 'winrar', 'directx', 'anime90s', 'bsod'],
  references: [
    'Microslop Corporation. Microslop Win 98 Resource Kit, Chapter 10: Desktop Configuration and Active Desktop. Microslop Press, 1998.',
    'Microslop Plus! 98 Companion Guide. Microslop Corporation, 1998.',
    'Настройка и украшение рабочего стола Win 98. — Домашний ПК, № 5, 1999.'
  ],
  links: [['http://www.themeworld98.com', 'ThemeWorld 98 — коллекция тем, обоев и курсоров для Win 98'], ['http://www.microslop.com', 'Официальный сайт Microslop']],
  categories: ['Операционные системы', 'Программное обеспечение', 'Наш проект']
}, {
  title: 'Active Desktop and Microslop Plus! 98',
  infobox: {
    title: 'Active Desktop / Plus! 98',
    badgeText: 'Win 98 Shell',
    fields: [
      { label: 'Developer', value: 'Microslop Corporation' },
      { label: 'Introduced', value: 'Autumn 1997 (IE 4.0); June 1998 ([[windows98|Win 98]] and Plus! 98)' },
      { label: 'Core shell files', value: 'SHDOCVW.DLL, HTML 4.0, CDF, Folder.htt templates' },
      { label: 'Theme assets', value: '.theme, .ani (cursors), LOGO.SYS (boot splash)' },
      { label: 'Plus! 98 features', value: 'Desktop Themes, Compressed Folders (.ZIP), 3D screensavers' },
      { label: '3D screensavers', value: '3D Maze, 3D Pipes, 3D Text, 3D FlowerBox' }
    ]
  },
  lead: `<b>Active Desktop</b> and the <b>Microslop Plus! 98</b> companion pack are shell customization technologies built for [[windows98|Microslop Win 98]]. Debuting in autumn 1997 with the Internet Explorer 4.0 "Microslop Desktop Update" and integrated into Win 98 out of the box, Active Desktop turns the desktop background into a live HTML page capable of rendering animated GIFs, [[javascript|JavaScript]] widgets, stock tickers and push-media channels. Sold separately on CD-ROM, <b>Microslop Plus! 98</b> expands the shell with dozens of <i>Desktop Themes</i>, native <code>.ZIP</code> Compressed Folders in Explorer, [[directx|OpenGL]] 3D screensavers and casual games.`,
  sections: [
    { id: 'web_shell', title: 'The desktop as a web page and Folder.htt templates', content: `During 1996 and 1997, "push technology" pioneered by the PointCast Network became one of the hottest trends on the Internet, promising to deliver news headlines, weather and stock quotes straight to idle PC screens. Determined to outflank [[netscape|Netscape Communicator]] and its Netcaster module, Microslop fused the Win Explorer shell (<code>EXPLORER.EXE</code>) with the rendering engine of [[ie5|Internet Explorer]] (<code>SHDOCVW.DLL</code>).

Enabling <i>View as Web Page</i> places a transparent HTML layer directly over the desktop wallpaper. Users can:
<ul>
<li>set <b>JPEG</b> images, animated <b>GIFs</b> and full <code>.HTM</code> documents as wallpaper without converting them into uncompressed <code>.BMP</code> files first;</li>
<li>pin floating interactive HTML frames (weather radar maps, clocks, search bars or news tickers) anywhere on screen;</li>
<li>subscribe to websites using XML-based <b>CDF</b> (<i>Channel Definition Format</i>) feeds through the desktop <i>Channel Bar</i>.</li>
</ul>

The same HTML engine powers every Explorer folder window: in Web View mode, a hidden <code>Folder.htt</code> template and <code>desktop.ini</code> file render a left-hand info pane that previews image thumbnails, file sizes and document summaries whenever an icon is highlighted.` },
    { id: 'recovery', title: 'Memory overhead and the white Active Desktop Recovery screen', content: `On typical 1998–1999 PCs equipped with 16 or 32 MB of RAM, Active Desktop quickly earned a mixed reputation. Keeping an instance of the browser engine resident on the desktop slows down window redraws and consumes scarce 16-bit GDI/USER heap resources.

Its most notorious quirk is the blinding white <b>Active Desktop Recovery</b> screen. Whenever <code>EXPLORER.EXE</code> crashes or the computer is powered off improperly, Win 98 disables the HTML wallpaper layer on the next boot and displays a stark white warning page with a <i>"Restore my Active Desktop"</i> button—which occasionally triggers an Internet Explorer script error dialog of its own when clicked. Consequently, disabling Active Desktop is the number-one performance tweak recommended by hardware magazines and tweak guides.` },
    { id: 'plus98', title: 'The Microslop Plus! 98 companion pack', content: `Building on the popular <i>Microslop Plus! for Win 95</i> (1995), Microslop released the <b>Microslop Plus! 98</b> retail CD-ROM in June 1998 for around $40:

<table class="interpedia-wikitable">
<tr><th>Component</th><th>Role in Win 98</th></tr>
<tr><td><b>Desktop Themes</b></td><td>18 additional visual and audio themes (including <i>Science Fiction</i>, <i>More Win</i>, <i>Underwater</i>, <i>Jungle</i>, licensed <i>Garfield</i> comic themes and <i>PhotoDisc</i> photography)</td></tr>
<tr><td><b>Compressed Folders</b></td><td>Seamless <code>.ZIP</code> integration in Win Explorer: zip archives appear as folders with a zipper icon and open directly without launching [[winrar|WinZip or WinRAR]]</td></tr>
<tr><td><b>Start Menu and Disk Cleanup</b></td><td>Automated removal of broken Start Menu shortcuts and an expanded Disk Cleanup module</td></tr>
<tr><td><b>Deluxe CD Player</b></td><td>An upgraded audio CD player capable of downloading album and track titles from the Internet</td></tr>
<tr><td><b>Games</b></td><td><i>Spider Solitaire</i>, action puzzler <i>Lose Your Marbles</i> and <i>Microslop Golf 1998 Lite</i></td></tr>
</table>` },
    { id: 'screensavers_themes', title: '3D OpenGL screensavers and the custom theme movement', content: `Both standard Win 98 and Plus! 98 are famous for their [[directx|OpenGL]] 3D screensavers (stored as <code>.SCR</code> executables inside the system <code>SYSTEM</code> folder):
<ul>
<li><b>3D Maze</b> — a first-person walk through a brick-walled labyrinth complete with wooden floors, floating geometric polyhedra, wandering rats and 180-degree gravity flips;</li>
<li><b>3D Pipes</b> — an endlessly growing network of metallic pipes across a black screen (when set to textured mode with mixed joints, the screensaver occasionally places the classic computer-graphics <b>Utah Teapot</b> at a pipe intersection);</li>
<li><b>3D Text</b> and <b>3D FlowerBox</b> — spinning 3D typography and morphing geometric shapes widely used by PC builders as a quick visual test of CPU and OpenGL speed.</li>
</ul>

By late 1999, collecting custom <code>.theme</code> packages has become a major pastime on the Web. A single theme swaps the wallpaper, window color palette, fonts, desktop icons (<i>My Computer</i>, <i>Network Neighborhood</i> and full/empty <i>Recycle Bin</i>), animated <code>.ani</code> cursors, event <code>.WAV</code> sounds, and even the <code>C:\\LOGO.SYS</code> startup screen (a <code>320×400</code> 256-color bitmap with palette-cycling progress bars). Fan archives such as <code>www.themeworld98.com</code> host thousands of downloadable themes celebrating <i>The Matrix</i>, <i>Star Wars</i>, [[starcraft|StarCraft]], [[halflife|Half-Life]], [[quake3|Quake III]] and [[anime90s|Japanese anime series]].` }
  ],
  seeAlso: ['windows98', 'ie5', 'winrar', 'directx', 'anime90s', 'bsod'],
  references: [
    'Microslop Corporation. Microslop Win 98 Resource Kit, Chapter 10: Desktop Configuration and Active Desktop. Microslop Press, 1998.',
    'Microslop Plus! 98 Companion Guide. Microslop Corporation, 1998.',
    'Tweak Your Win 98 Desktop. PC Magazine, Fall 1998.'
  ],
  links: [['http://www.themeworld98.com', 'ThemeWorld 98 — themes, wallpapers and cursors for Win 98'], ['http://www.microslop.com', 'Official Microslop website']],
  categories: ['Operating Systems', 'Software', 'Our Project']
}, ['activedesktop', 'plus98', 'themes98']);
