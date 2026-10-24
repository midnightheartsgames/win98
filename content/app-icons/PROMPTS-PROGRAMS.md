# Иконки программ и системы: промпты

Тот же процесс, что для игр (`content/app-icons/PROMPTS.md`), но для обычных программ Win 98, служебных утилит, значков Панели управления, папок, дисков и типов файлов. Готовые файлы складываются в `content/app-icons/programs/`.

## Что заменяем, а что нет

Иконки лежат в `js/icons.js`. Из всех значков системы нормальным остался только `blender204`. Остальные, в том числе попиксельные «системные» (Мой компьютер, Блокнот, Paint, Корзина и другие), тоже переделываем: они не вяжутся с уже заменёнными значками, поэтому прежнее решение «их не трогаем» отменено. Для них добавлены промпты в разделах 6–8 ниже, а `file-txt`, `file-exe` и `file-actor` в разделе 5. Папка `folder` уже сгенерирована и подключена.

Не переделываем только мелкие служебные знаки интерфейса (кнопки панелей инструментов `tb-`, `tb16-`, `pt-`, `ie-`, `oe-`, кнопки заголовка окна `cap-`, «открытки» `gif-`, стрелка ярлыка `shortcut-overlay`, значки реестра `reg-sz` и `reg-bin`, значки почты `mail-` и `oe-`): они показываются на 12–20 px и должны остаться пиксельными. Игра `fallout` тоже остаётся.

Остаётся сделать 73 значка в восьми группах:

1. Программы из каталога 3ADVANCED (1).
2. Остальные программы и демо с диска Игромании (3).
3. Служебные утилиты и системные окна (2).
4. Папки (4, сама `folder` уже готова).
5. Типы файлов (19).
6. Оболочка и диски (9).
7. Стандартные программы (18).
8. Меню «Пуск», окна сообщений и справка (17).

`drive-d` отдельно не рисуем: в конце `js/icons.js` он равен `drive-cd` (диск D: это CD-ROM журнала), а `drive-a` равен `drive-floppy`. Игры из Steam здесь не повторяются: они в `PROMPTS.md`.

## Как делать

1. Открой чат с генерацией картинок. Вставь общий стиль, а сразу за ним промпт значка целиком, включая строку `Program:`. Скриншоты для программ не нужны, образ описан в промпте. Исключения: у Steam, Clippy и digicharat можно приложить окно программы из проекта.
2. Сгенерируй 3–4 варианта и выбери тот, что читается лучше всего. Проверь, как он выглядит в 32 × 32 и в 16 × 16.
3. Сохрани как `content/app-icons/programs/<ключ>.png`, 512 × 512, фон `#FF00FF`.
4. Запусти `python tools/app-icon-pix.py --dir programs <ключ>`. Скрипт вырезает фон `#FF00FF`, сжимает файл до 128 × 128 (около 4 КБ вместо 1,2 МБ) и вписывает значок 64 × 64 в `js/icons.js` вместо старого рисунка с тем же ключом. Новый ключ добавь флагом `--add-missing`. Повторный запуск безопасен.
5. Малая версия 16 × 16 не нужна: везде используется одна картинка.

Ключ равен значению `icon` из каталога.

## Общий стиль (вставлять в начало каждого промпта)

> Authentic classic Win 98 desktop icon, pixel art, as a 1998 icon artist would draw it for the system shell and the standard tools. Square 1:1 canvas of 512 × 512 pixels built on a strict 32 × 32 logical pixel grid: every logical pixel is one flat solid block of exactly 16 × 16 real pixels, perfectly aligned to the grid, no half pixels. Use the classic Win 98 system palette: black, white, silver #C0C0C0, light grey #DFDFDF, grey #808080, dark grey #404040, navy #000080, blue #0000FF, teal #008080, cyan #00FFFF, maroon #800000, red #FF0000, green #008000, lime #00FF00, olive #808000, yellow #FFFF00, purple #800080, magenta-pink; third-party programs may add at most 6 extra colours when the prompt asks. A continuous 1-pixel near-black outline around the object, light from the top-left: white highlight pixels on the upper-left edges and grey or dark-grey shade on the lower-right edges, like a small bevelled 3D object. One tidy object (two at most) seen from a slight front-top angle, calm and clear, no characters unless the prompt asks. Only sparse checkerboard dithering for soft shading on silver surfaces. Strictly no anti-aliasing, no gradients, no blur, no glow, no soft shadows, no smooth vector lines, no 3D render, no photo look, no modern flat design, no rounded app plate. Background: one flat solid pure magenta #FF00FF everywhere outside the icon, no ground shadow, no frame, no border. Do not use magenta inside the icon. No text, no letters, no numbers, no logo, no watermark, unless the prompt says otherwise. The prompt below names the exact program and what it does. Draw only that metaphor: never substitute another program's icon, and evoke the real software without copying any official logo.

Если модель не слушается:

- Плашка с закруглёнными углами или современный плоский стиль: добавь «No app plate, no flat design: it must look like a 1998 bevelled desktop icon.»
- Слишком мелко: добавь «Fewer details, bigger shapes, at most 3 main shapes.»
- Появился текст: добавь «Remove all text and letters.»
- Нарисовала логотип другой программы: добавь «This is NOT <название>. Draw only what the Icon line describes.»
- Фон не пурпурный: добавь «The background must be exactly #FF00FF, flat, with no shadow under the object.»

## 1. Программы из каталога 3ADVANCED

### `blender`: Blender 1.60
Основа: 3D-пакет Blender 1.60 (1998–1999, Not a Number).
> Program: Blender 1.60, the compact 3D modelling package by Not a Number. Icon: a round orange sphere with three white arms spread above it like a flower and a blue lens in the centre. It should look like a sibling of the existing Blender 2.04 icon. Palette: orange, white, blue, grey, black.

## 2. Остальные программы и демо с диска

### `burnout`: Burnout: Championship Drag Racing (демо с диска)
Основа: демо Burnout: Championship Drag Racing (Bethesda, 1998). Не современный Burnout.
> Program: the demo of Burnout: Championship Drag Racing (Bethesda Softworks, 1998), a quarter-mile drag racing simulator with burnout tyre smoke. Icon: a red dragster with a huge rear slick tyre rising on its back wheels, white tyre smoke curling behind it, a small yellow-red-green starting light stack beside it. Palette: red, black, white, yellow, green, grey.

### `hockey`: NHL 98 (демо)
Основа: хоккейный симулятор NHL 98 (EA Sports). Без логотипа лиги.
> Program: NHL 98 (EA Sports), the ice hockey simulator. Icon: a brown hockey stick with a black blade lying across a black puck on a white ice patch with a thin red line. No league logo, no letters. Palette: ice white, light blue, brown, black, red.

### `worldcup98`: World Cup 98 (демо)
Основа: футбольный симулятор World Cup 98 (EA Sports). Без логотипа ФИФА.
> Program: World Cup 98 (EA Sports), the football simulator. Icon: a classic black and white football on a green striped pitch patch, a small gold trophy cup standing behind it. No federation logo, no letters. Palette: white, black, green, gold, a bit of red.

## 3. Служебные утилиты и системные окна

### `welcome`: Добро пожаловать в Win 98
> Program: the Welcome to Win 98 screen shown on first start. Icon: a blue window with a silver title bar, in it the four-colour Win flag (red, green, blue, yellow squares) and a small gold star burst at the upper right. Palette: blue, silver, red, green, yellow, white.

### `setup-installer`: Установщик (Setup.exe)
> Program: the installer of a program, with the standard setup wizard. Icon: a cardboard software box in beige and blue, a silver CD sliding into its top, a small gold star sparkle at the upper right. Palette: beige, blue, silver, gold, black.

## 4. Папки

Сама папка `folder` уже сделана (`programs/folder.png`, вписана в `js/icons.js`). Приложи её как дополнительный референс к каждому промпту ниже, чтобы все папки были одинаковыми: жёлтая папка с чёрным контуром в три четверти, эмблема лежит на передней стенке. Вставляй после общего стиля этот блок, потом промпт:

> Folder family layout: the same yellow manila folder with a black outline, in a three-quarter view, with the emblem sitting on its front face, large and simple.

### `folder-pictures`: Мои рисунки
> Icon: the folder with a small framed landscape picture (blue sky, green hill) on its front face.

### `folder-music`: Моя музыка
> Icon: the folder with two blue musical notes joined by a beam on its front face.

### `folder-videos`: Мои видео
> Icon: the folder with a short black film strip with white perforations across its front face.

### `folder-downloads`: Downloads
> Icon: the folder with a thick green downward arrow on its front face.

## 5. Типы файлов

Общий макет: белый лист с загнутым правым верхним углом, чёрный контур, серая тень справа и снизу. На листе знак формата. Сначала сгенерируй `file-txt` и приложи его как дополнительный референс к остальным типам файлов, чтобы все листы были одинаковыми. Вставляй после общего стиля этот блок, потом промпт:

> Document family layout: a white sheet of paper in a three-quarter front view, the upper right corner folded over, a near-black outline and grey shade on the right and bottom edges. The emblem of the file type sits large in the middle of the sheet. No text on the sheet unless the prompt says so.

### `file-txt`: Текстовый файл TXT, INI, BAT
> Icon: the sheet with six short horizontal navy-blue text lines on it, the last line shorter.

### `file-exe`: Программа EXE, COM
> Icon: not a sheet: a small silver program window with a navy title bar, three tiny title buttons, a white client area and a small grey gear in the middle. Use the window shape, not the document layout.

### `file-actor`: Актёр помощника ACS, ACT
> Icon: the sheet with a small silver paper clip with two tiny white eyes in the middle.

### `file-xls`: Таблица XLS
> Icon: the sheet with a green grid of cells and a small three-bar chart on it.

### `file-bmp`: Картинка BMP
> Icon: the sheet with a tiny painting: blue sky, a yellow sun, a green hill.

### `file-psd`: Файл PSD
> Icon: the sheet with a blue-grey eye in the middle and two stacked thin layer strips under it.

### `file-video`: Видео AVI
> Icon: the sheet with a black film strip across its middle and a white play triangle on it.

### `file-music`: Музыка MP3, WAV, MID
> Icon: the sheet with a big blue musical note.

### `file-rar`: Архив RAR
> Icon: the sheet with a tiny stack of three books (blue, green, purple) tied with a brown belt.

### `file-rtf`: Документ RTF, DOC
> Icon: the sheet with bold black text lines and a blue pen crossing in the lower right.

### `file-bas`: Программа BAS
> Icon: the sheet with a small navy-blue editor screen with white code lines.

### `file-ht`: Сеанс HyperTerminal
> Icon: the sheet with a small black phone handset and a green screen line.

### `file-clp`: Страница буфера CLP
> Icon: the sheet with a small brown clipboard with a silver clip.

### `file-xm`: Трекерная музыка XM
> Icon: the sheet with four short columns of coloured note dashes and a small piano key strip.

### `file-pdf`: Документ PDF
> Icon: the sheet in red with a white looping ribbon curve in the middle.

### `file-rom`: Образ картриджа ROM
> Icon: the sheet with a small grey game cartridge with a red stripe.

### `file-ttf`: Шрифт TrueType
> Icon: the sheet with a large black capital A and a small red T. The letters A and T are allowed here.

### `file-fon`: Растровый шрифт FON
> Icon: the sheet with a large pixelated black capital A built from square blocks. The letter A is allowed here.

### `file-virus`: Вирус (totally_not_a_virus.exe)
Основа: подозрительный файл-шутка, который выглядит невинно.
> Icon: a small innocent-looking silver program window with a blue title bar, a tiny green skull grin hiding behind its corner and a small red warning dot at the top. Not a full document sheet: use the program window shape, not the document family layout. Palette: silver, blue, green, red, black.

## 6. Оболочка и диски

### `my-computer`: Мой компьютер
> Program: My Computer, the desktop icon that opens the drives and the Control Panel. Icon: a beige CRT monitor with a blue-teal screen, a beige desktop case lying under it and a small keyboard in front, the classic home PC trio seen at a slight angle. Palette: beige, silver, grey, teal, black, a bit of green.

### `my-documents`: Мои документы
> Program: My Documents, the folder for the user's files. Icon: a yellow manila folder, open, with a few white sheets of paper sticking out of it and a small blue pen lying on the front. Palette: yellow, white, grey, blue, black.

### `network`: Сетевое окружение
> Program: Network Neighbourhood, the list of computers in the local network. Icon: two beige computers (monitor and case) side by side joined by a short blue cable, and a small blue globe behind them. Palette: beige, silver, blue, green, black.

### `recycle-bin`: Корзина (с мусором)
> Program: the Recycle Bin that holds deleted files. Icon: a grey wire-mesh waste bin with a lid ring, a green three-arrow recycling triangle on its front, and a few crumpled white papers sticking out of the top. Palette: grey, silver, green, white, black.

### `recycle-bin-empty`: Корзина (пустая)
> Program: the empty Recycle Bin. Icon: the same grey wire-mesh bin with a green three-arrow recycling triangle on its front, empty inside and clean, no papers. It must be recognisably the same bin as the full one. Palette: grey, silver, green, black.

### `control-panel`: Панель управления
> Program: Control Panel, the system settings folder. Icon: a silver window with a navy title bar, its white body holding a small beige monitor, a grey speaker and a grey wrench arranged together. Palette: silver, navy, beige, grey, white, black.

### `drive-c`: Диск C:
> Program: drive C:, the hard disk. Icon: a silver hard disk drive box in a front-top view with a grey slot and a small green LED, a thin dark-grey bevel. Palette: silver, grey, dark grey, green, black.

### `drive-cd`: CD-ROM привод (диск D:)
> Program: drive D:, the CD-ROM drive with the magazine disc inside. Icon: a beige CD-ROM drive front with a tray half open and a silver disc lying on the tray, a small green LED. Palette: beige, silver, grey, green, black.

### `drive-cd-empty`: CD-ROM привод без диска
> Program: the CD-ROM drive with no disc. Icon: the same beige CD-ROM drive front with the tray open and empty. It must be recognisably the same drive as the one with a disc. Palette: beige, silver, grey, green, black.

## 7. Стандартные программы

### `internet-explorer`: Internet Explorer
> Program: Internet Explorer 5, the Win 98 web browser. Icon: a bright blue lowercase letter e in front of a small blue-and-green globe, a thin yellow orbit ring crossing around it. The single letter e is allowed here. Do not copy the official logo. Palette: blue, light blue, green, yellow, white, black.

### `notepad`: Блокнот
> Program: Notepad, the plain text editor. Icon: a blue spiral-bound notepad with white lined paper, a few short grey text lines and a yellow pencil resting across it. Palette: blue, white, grey, yellow, black.

### `paint`: Paint
> Program: Paint, the drawing program. Icon: a beige artist palette with blobs of red, blue, yellow and green paint and a thumb hole, a brush with a red tip lying across it. Palette: beige, red, blue, yellow, green, brown, black.

### `calculator`: Калькулятор
> Program: Calculator. Icon: a light grey desk calculator with a pale green LCD strip showing a few black digits and a grid of grey keys with one red key. Digits on the LCD are allowed. Palette: light grey, grey, pale green, black, red.

### `minesweeper`: Сапёр
> Program: Minesweeper. Icon: a black spiked mine ball on a raised grey bevelled tile, a tiny red flag on a thin pole beside it. Palette: grey, silver, black, red, white.

### `solitaire`: Косынка
> Program: Solitaire (Klondike). Icon: a fan of three playing cards: a white ace of spades card with a big black spade, a red heart card behind it and a card back with a blue pattern. Palette: white, black, red, blue, silver.

### `freecell`: FreeCell
> Program: FreeCell, the card game with four free cells. Icon: a white playing card with a red king on the left and a row of four empty bevelled grey slots at the top behind it. It must differ from the Solitaire icon: slots and a king, not a fan of cards. Palette: white, red, gold, grey, black.

### `wordpad`: WordPad
> Program: WordPad, the document editor with fonts and formatting. Icon: a white page with a navy title strip, bold black text lines, a big black letter A in the top left and a blue fountain pen lying across it. The letter A is allowed. Palette: white, navy, black, blue, silver.

### `outlook`: Outlook Express
> Program: Outlook Express, the e-mail client. Icon: a white envelope with a blue flap and a thin red edge, a thick blue arrow circling around it, a small blue globe at the lower right. Palette: white, blue, red, silver, black.

### `regedit`: Редактор реестра
> Program: Registry Editor, the tree of system settings. Icon: a small silver window whose body shows a blue cube at the top connected by thin lines to three smaller cyan cubes below it, a tiny yellow key at the lower right. Palette: silver, blue, cyan, yellow, black, white.

### `sound-recorder`: Звукозапись
> Program: Sound Recorder, which records and plays WAV files. Icon: a silver desk microphone on a short black stand, in front of a tiny black screen with a green wavy line. Palette: silver, grey, black, green, white.

### `neko`: Neko
> Program: Neko, the little cat that runs after the mouse cursor across the desktop. Icon: a small white cat with black ears and tail sitting and looking up, big round eyes, a tiny pink nose, pixel-art cute. Palette: white, black, grey, pink, light blue.

### `esheep`: eSheep 98
> Program: eSheep, the tiny sheep that walks around the desktop. Icon: a fluffy white round sheep with a small black face, black legs and two small ears, standing happily. Palette: white, light grey, black, pink.

### `clawd`: Clawd
> Program: Clawd, the little orange mascot of Claude. Icon: a chunky blocky orange creature shaped like a wide rounded rectangle with two small square black eyes, two short arm stubs and four stubby legs, simple and friendly. Palette: terracotta orange, darker orange, black, a bit of white.

### `powercfg`: Электропитание
> Program: Power Management properties. Icon: a black power plug with two silver prongs and a coiled cord, a yellow lightning bolt beside it and a small green battery. Palette: black, silver, yellow, green, grey.

### `hardware`: Установка оборудования
> Program: Add New Hardware wizard. Icon: a green computer expansion card (circuit board) with a gold edge connector and a few black chips, a yellow star burst at the upper right meaning new. Palette: green, gold, black, silver, yellow.

### `taskbar-props`: Панель задач и меню «Пуск»
> Program: Taskbar and Start Menu properties. Icon: a silver horizontal taskbar strip with a green Start button on the left and three small grey task buttons, a small grey gear below it on the right. Palette: silver, green, grey, white, black.

### `favorites`: Избранное
> Program: Favorites in the browser. Icon: a yellow manila folder with a big gold five-pointed star on its front face. Palette: yellow, gold, orange, black.

## 8. Меню «Пуск», окна сообщений и справка

### `help`: Справка
> Program: Help, the Win 98 help system. Icon: a navy-blue closed book with a gold spine and a big white question mark on its cover. The question mark is allowed. Palette: navy, blue, gold, white, black.

### `programs`: Программы (меню «Пуск»)
> Program: the Programs item of the Start menu. Icon: a yellow manila folder with a small silver program window with a navy title bar and tiny coloured icons standing on top of it. Palette: yellow, silver, navy, white, black.

### `settings`: Настройка (меню «Пуск»)
> Program: the Settings item of the Start menu (Control Panel, Printers, Taskbar). Icon: a silver control panel board with two vertical sliders with knobs and a large dark-grey gear in front of it. Palette: silver, grey, dark grey, blue, black.

### `find`: Найти
> Program: Find, which searches files and folders. Icon: a yellow manila folder with a big silver magnifying glass in front of its lower right. Palette: yellow, silver, grey, light blue, black.

### `run`: Выполнить
> Program: Run, which launches a program by name. Icon: a small silver window with a navy title bar, a white command line box in its body and a thick green arrow pointing right. Palette: silver, navy, white, green, black.

### `shut-down`: Завершение работы
> Program: Shut Down. Icon: a beige CRT monitor with a dark screen and a red round power symbol (a circle with a vertical line) on it. Palette: beige, dark grey, red, black.

### `start-logo`: Кнопка «Пуск»
> Program: the Start button logo of the Win 98 shell. Icon: a waving four-colour flag of four tilted panes (red top left, green top right, blue bottom left, yellow bottom right) on a thin black flagpole stub; the project's own flag shape, not a copy of any company logo. Palette: red, green, blue, yellow, black.

### `speaker`: Громкость (трей)
> Program: the volume icon in the tray. Icon: a grey speaker cone with two curved blue sound waves in front of it, simple and bold for 16 px. Palette: grey, silver, blue, black.

### `speaker-muted`: Громкость выключена (трей)
> Program: the muted volume icon in the tray. Icon: the same grey speaker cone with a bold red circle with a diagonal slash over it, no sound waves. It must be recognisably the same speaker as the normal icon. Palette: grey, silver, red, black.

### `monitor`: Эффект ЭЛТ-монитора (трей)
> Program: the tray switch that turns the CRT screen effect on and off. Icon: a beige CRT monitor with a green-teal screen showing thin horizontal scan lines and a soft white glare in the corner. Palette: beige, teal, green, white, black.

### `warning`: Предупреждение
> Program: the warning icon of message boxes. Icon: a yellow triangle with a thick black outline and a bold black exclamation mark in the middle. The exclamation mark is allowed. Palette: yellow, black, white.

### `info`: Сообщение
> Program: the information icon of message boxes. Icon: a white speech bubble with a black outline holding a big blue circle with a bold white lowercase letter i. The letter i is allowed. Palette: white, blue, light blue, black.

### `question`: Вопрос
> Program: the question icon of message boxes. Icon: a white speech bubble with a black outline holding a big blue circle with a bold white question mark. The question mark is allowed. Palette: white, blue, light blue, black.

### `error`: Ошибка
> Program: the error icon of message boxes. Icon: a red circle with a thick black outline and a bold white X in the middle, with a light highlight on the upper left. The X is allowed. Palette: red, dark red, white, black.

### `help-book`: Раздел справки (закрыт)
> Program: a closed book in the help contents tree. Icon: a small closed navy-blue book with a gold spine and a gold question mark on its cover. Palette: navy, blue, gold, black.

### `help-book-open`: Раздел справки (открыт)
> Program: an open book in the help contents tree. Icon: the same navy-blue book, open, with two white pages with grey text lines and a navy cover below them. It must be recognisably the same book as the closed one. Palette: navy, blue, white, gold, black.

### `help-page`: Страница справки
> Program: a help topic page. Icon: a white sheet with a folded corner and a big blue question mark in the middle. Palette: white, blue, grey, black.

## Журнал

Осталось всё, что описано в разделах 1–8. Когда значок готов и подключён, удаляй его промпт из этого файла.

Особенность замены попиксельных значков: у них была отдельная версия 16 × 16, у новых её нет. Одна картинка 64 × 64 показывается и на 16, и на 32, и на 48 px, на мелких размерах детали сливаются. Поэтому в промптах разделов 6–8 образ упрощён.
