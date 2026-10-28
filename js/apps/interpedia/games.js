window.interpediaReg('wolf3d', 'games', {
  title: 'Wolfenstein 3D',
  infobox: {
    title: 'Wolfenstein 3D',
    badgeText: 'id Software / Apogee',
    fields: [
      { label: 'Разработчик', value: 'id Software' },
      { label: 'Издатель', value: 'Apogee Software (shareware), FormGen' },
      { label: 'Дата выхода', value: '5 мая 1992' },
      { label: 'Жанр', value: 'шутер от первого лица' },
      { label: 'Платформа', value: '[[msdos|MS-DOS]]; позже Macintosh, SNES, Atari Jaguar' },
      { label: 'Движок', value: 'рейкастинг Джона Кармака' },
      { label: 'Музыка', value: 'Бобби Принс' },
      { label: 'Продолжение', value: 'Spear of Destiny (1992)' }
    ]
  },
  lead: `<strong>Wolfenstein 3D</strong> — компьютерная игра id Software, вышедшая 5 мая 1992 года и считающаяся родоначальницей жанра шутеров от первого лица. Игрок в роли американского солдата Уильяма «Би-Джея» Блажковица бежит из нацистского замка Вольфенштейн, проходя этаж за этажом лабиринтов, полных охраны и овчарок.

Игра распространялась по схеме shareware: первый эпизод был бесплатным, остальные продавались по почте. Быстрый трёхмерный движок, работавший на обычном 286-м компьютере, показал, на что способен ПК, и подготовил почву для [[doom|Doom]].`,
  sections: [
    { id: 'development', title: 'Создание', content: `К 1991 году молодая техасская студия id Software выпустила серию платформеров Commander Keen. Программист Джон Кармак экспериментировал с трёхмерной графикой в играх Hovertank 3D и Catacomb 3-D, а дизайнер Джон Ромеро предложил переосмыслить классическую игру Castle Wolfenstein (1981) фирмы Muse Software в новом движке.

Над игрой работали Джон Кармак (движок), Джон Ромеро (программирование и уровни), Эдриан Кармак (графика), Том Холл (дизайн) и Бобби Принс (музыка и звук). Разработка заняла около полугода.` },
    { id: 'engine', title: 'Движок', content: `Wolfenstein 3D использует рейкастинг: для каждого столбца экрана программа «пускает луч» по двумерной карте-сетке и рисует вертикальную полоску стены нужной высоты с текстурой. Пол и потолок закрашены сплошным цветом, все стены стоят под прямым углом, а все помещения одной высоты. Зато движок выдаёт плавную картинку в 256 цветах VGA даже на 286-м процессоре.

Противники и предметы — плоские спрайты, всегда повёрнутые к игроку. Двери открываются, а некоторые стены можно сдвинуть, открыв тайник.` },
    { id: 'gameplay', title: 'Игровой процесс', content: `Игра разделена на эпизоды по десять уровней. Игрок находит ключи, собирает сокровища ради очков, подбирает еду и аптечки и меняет оружие от ножа до пулемёта. В конце эпизодов ждут боссы, самый известный из которых — Гитлер в механическом бронекостюме.

<table class="interpedia-wikitable">
<tr><th>№</th><th>Эпизод</th><th>Распространение</th></tr>
<tr><td>1</td><td>Escape from Wolfenstein</td><td>shareware</td></tr>
<tr><td>2</td><td>Operation: Eisenfaust</td><td>платный</td></tr>
<tr><td>3</td><td>Die, Führer, Die!</td><td>платный</td></tr>
<tr><td>4–6</td><td>The Nocturnal Missions</td><td>платный набор</td></tr>
</table>

Одновременное нажатие клавиш M, L и I даёт полное здоровье, всё оружие и ключи, но обнуляет счёт — едва ли не первый общеизвестный «чит» эпохи ПК.` },
    { id: 'shareware', title: 'Shareware', content: `Издатель Apogee Software Скотта Миллера отточил модель shareware: первая часть игры свободно копируется на [[floppy144|дискетах]], выкладывается на [[bbs|BBS]] и в сети, а полная версия заказывается по телефону. Wolfenstein 3D сделал эту схему знаменитой: дискета с первым эпизодом обошла школьные компьютерные классы и офисы по всему миру, в том числе в России.

Отдельная игра-предыстория Spear of Destiny вышла в магазинах в сентябре 1992 года через издателя FormGen.` },
    { id: 'controversy', title: 'Споры и порты', content: `Нацистская символика и насилие сделали игру объектом критики. В Германии она была запрещена из-за свастик. При переносе на приставку Super Nintendo (1994) по требованию Nintendo убрали свастики и кровь, а сторожевых собак заменили гигантскими крысами. Игру также выпустили для Macintosh, Atari Jaguar и других платформ.` },
    { id: 'legacy', title: 'Наследие', content: `Wolfenstein 3D задал основы жанра: вид из глаз, арсенал, лабиринт с секретами. На лицензированном движке вышли Blake Stone (1993) и другие игры. Опыт id Software с распространением shareware и с быстрой 3D-графикой через полтора года принёс [[doom|Doom]], который превратил новое направление в массовое явление.` }
  ],
  seeAlso: ['doom', 'quake', 'dukenukem3d', 'msdos', 'bbs'],
  references: [
    'Wolfenstein 3D: руководство пользователя. — Apogee Software, 1992.',
    'Computer Gaming World. Обзор Wolfenstein 3D. — 1992.',
    'Интервью Дж. Ромеро журналу PC Gamer, 1998.'
  ],
  links: [['http://www.cheatcc.com', 'Cheat Code Central: коды для Wolfenstein 3D']],
  categories: ['Видеоигры 1992 года', 'Шутеры от первого лица', 'id Software', 'Shareware']
}, {
  title: 'Wolfenstein 3D',
  infobox: {
    title: 'Wolfenstein 3D',
    badgeText: 'id Software / Apogee',
    fields: [
      { label: 'Developer', value: 'id Software' },
      { label: 'Publisher', value: 'Apogee Software (shareware), FormGen' },
      { label: 'Released', value: 'May 5, 1992' },
      { label: 'Genre', value: 'first-person shooter' },
      { label: 'Platform', value: '[[msdos|MS-DOS]]; later Macintosh, SNES, Atari Jaguar' },
      { label: 'Engine', value: 'John Carmack\'s raycaster' },
      { label: 'Music', value: 'Bobby Prince' },
      { label: 'Follow-up', value: 'Spear of Destiny (1992)' }
    ]
  },
  lead: `<strong>Wolfenstein 3D</strong> is an id Software game released on May 5, 1992, and regarded as the founder of the first-person shooter genre. Playing American soldier William "B.J." Blazkowicz, the player escapes the Nazi Castle Wolfenstein floor by floor through mazes full of guards and German shepherds.

The game was distributed as shareware: the first episode was free and the rest were sold by mail order. Its fast 3D engine, which ran on an ordinary 286, showed what the PC could do and paved the way for [[doom|Doom]].`,
  sections: [
    { id: 'development', title: 'Development', content: `By 1991 the young Texas studio id Software had released the Commander Keen platformers. Programmer John Carmack was experimenting with 3D graphics in Hovertank 3D and Catacomb 3-D, and designer John Romero suggested reimagining Muse Software's classic Castle Wolfenstein (1981) in the new engine.

The team was John Carmack (engine), John Romero (programming and levels), Adrian Carmack (art), Tom Hall (design) and Bobby Prince (music and sound). Development took about six months.` },
    { id: 'engine', title: 'Engine', content: `Wolfenstein 3D uses raycasting: for every screen column the program casts a ray across a 2D grid map and draws a vertical strip of textured wall at the right height. Floors and ceilings are flat colors, all walls meet at right angles and all rooms share one height. In return the engine produces smooth 256-color VGA graphics even on a 286.

Enemies and items are flat sprites that always face the player. Doors open, and some walls can be pushed to reveal secret areas.` },
    { id: 'gameplay', title: 'Gameplay', content: `The game is split into episodes of ten levels. The player finds keys, collects treasure for points, picks up food and first aid kits, and upgrades from a knife to a chaingun. Bosses wait at the end of episodes, the most famous being Hitler in a mechanical armored suit.

<table class="interpedia-wikitable">
<tr><th>#</th><th>Episode</th><th>Distribution</th></tr>
<tr><td>1</td><td>Escape from Wolfenstein</td><td>shareware</td></tr>
<tr><td>2</td><td>Operation: Eisenfaust</td><td>paid</td></tr>
<tr><td>3</td><td>Die, Führer, Die!</td><td>paid</td></tr>
<tr><td>4–6</td><td>The Nocturnal Missions</td><td>paid set</td></tr>
</table>

Pressing M, L and I together gives full health, all weapons and keys but resets the score, perhaps the first widely known cheat of the PC era.` },
    { id: 'shareware', title: 'Shareware', content: `Scott Miller's Apogee Software perfected the shareware model: the first part of a game is copied freely on [[floppy144|floppies]], posted on [[bbs|BBSes]] and online, and the full version is ordered by phone. Wolfenstein 3D made the model famous; the first-episode disk made its way through school computer labs and offices around the world, Russia included.

A separate prequel, Spear of Destiny, reached stores in September 1992 through publisher FormGen.` },
    { id: 'controversy', title: 'Controversy and ports', content: `Nazi imagery and violence drew criticism. Germany banned the game over its swastikas. For the Super Nintendo port (1994), Nintendo required the removal of swastikas and blood, and the guard dogs were replaced with giant rats. The game was also released for the Macintosh, Atari Jaguar and other platforms.` },
    { id: 'legacy', title: 'Legacy', content: `Wolfenstein 3D set the basics of the genre: the first-person view, an arsenal, a maze full of secrets. Blake Stone (1993) and other games used the licensed engine. id Software's experience with shareware and fast 3D graphics led a year and a half later to [[doom|Doom]], which turned the new genre into a mass phenomenon.` }
  ],
  seeAlso: ['doom', 'quake', 'dukenukem3d', 'msdos', 'bbs'],
  references: [
    'Wolfenstein 3D user manual. Apogee Software, 1992.',
    'Computer Gaming World, Wolfenstein 3D review, 1992.',
    'John Romero interview, PC Gamer, 1998.'
  ],
  links: [['http://www.cheatcc.com', 'Cheat Code Central: Wolfenstein 3D codes']],
  categories: ['1992 Video Games', 'First-Person Shooters', 'id Software', 'Shareware']
});

window.interpediaReg('doom', 'games', {
  title: 'Doom (1993)',
  infobox: {
    title: 'Doom',
    badgeText: 'id Software',
    fields: [
      { label: 'Разработчик', value: 'id Software' },
      { label: 'Издатель', value: 'id Software (shareware); GT Interactive (розница)' },
      { label: 'Дата выхода', value: '10 декабря 1993' },
      { label: 'Жанр', value: 'шутер от первого лица' },
      { label: 'Платформа', value: '[[msdos|MS-DOS]], позже Win 95, Macintosh, приставки' },
      { label: 'Режимы', value: 'одиночная игра, кооператив, deathmatch' },
      { label: 'Ведущий программист', value: 'Джон Кармак' },
      { label: 'Продолжения', value: 'Doom II (1994), Final Doom (1996)' }
    ]
  },
  lead: `<strong>Doom</strong> — шутер от первого лица id Software, выпущенный 10 декабря 1993 года. Безымянный космический пехотинец сражается с демонами, прорвавшимися из ада на базы на спутниках Марса Фобосе и Деймосе после неудачного эксперимента с телепортацией.

Doom соединил быстрый трёхмерный движок, сетевую игру и открытый формат уровней. Он породил понятие «deathmatch», армию любительских уровней и волну подражателей, которых пресса называла «клонами Doom». За шесть лет игра стала частью массовой культуры и до сих пор работает в компьютерных клубах по всей России.`,
  sections: [
    { id: 'development', title: 'Разработка', content: `После [[wolf3d|Wolfenstein 3D]] id Software решила сделать игру на новом, гораздо более мощном движке. Дизайнер Том Холл написал подробный сценарий — «Библию Doom», — но команда предпочла динамику сюжету, и Холл покинул студию в 1993 году. Уровни создавали Джон Ромеро, Сэнди Петерсен и Американ Макги, графику — Эдриан Кармак и Кевин Клауд, музыку в духе хеви-метала написал Бобби Принс. Инструменты разработки работали на компьютерах NeXT.

Первый эпизод был выложен для свободного скачивания на FTP-сервер Висконсинского университета в ночь на 10 декабря 1993 года. Сервер не выдержал наплыва желающих.` },
    { id: 'engine', title: 'Движок', content: `Движок Doom, написанный Джоном Кармаком, сделал огромный шаг вперёд по сравнению с Wolfenstein 3D:

<ul>
<li>стены под любым углом, разная высота пола и потолка, лестницы и подъёмники;</li>
<li>текстуры на полу и потолке, переменная освещённость и мигающий свет;</li>
<li>двоичное разбиение пространства (BSP), позволяющее быстро определять видимые стены;</li>
<li>стереозвук, затихающий с расстоянием.</li>
</ul>

Настоящего 3D в Doom всё же нет: карта двумерная, и одно помещение не может находиться над другим. Поэтому движок иногда называют «двух с половиной мерным». Игра работает в защищённом режиме через расширитель DOS/4GW и требует процессор 386 и 4 МБ памяти.` },
    { id: 'gameplay', title: 'Игровой процесс', content: `Игрок проходит уровни, ищет ключ-карты и выход, сражаясь с бесами, какодемонами, баронами ада и боссами — кибердемоном и пауком-предводителем. Арсенал включает дробовик, пулемёт, ракетомёт, плазменную винтовку, бензопилу и BFG 9000.

Первый эпизод, Knee-Deep in the Dead, распространялся бесплатно; полная версия добавила эпизоды The Shores of Hell и Inferno, а издание The Ultimate Doom (1995) — четвёртый эпизод Thy Flesh Consumed. Коды IDDQD (бессмертие) и IDKFA (всё оружие и ключи) знает каждый, кто играл в Doom.` },
    { id: 'multiplayer', title: 'Сетевая игра', content: `Doom поддерживает игру вчетвером по локальной сети IPX и вдвоём через [[modem56k|модем]] или нуль-модемный кабель. Режим, в котором игроки сражаются друг с другом, id Software назвала deathmatch; слово быстро вошло в язык игроков. Сетевые партии в Doom загружали офисные сети так, что администраторы некоторых университетов и компаний запрещали игру в рабочее время. В России Doom стал одной из главных игр [[lanparty|компьютерных клубов]].` },
    { id: 'modding', title: 'WAD-файлы и моды', content: `Все данные игры хранятся в файлах формата WAD. id Software описала формат, и любители начали создавать собственные уровни и замены графики в редакторах вроде DEU. Тысячи WAD-файлов распространяются через [[bbs|BBS]], FTP-архивы и сборники на [[cdrom|компакт-дисках]].

23 декабря 1997 года id Software опубликовала исходный код движка. Энтузиасты выпустили на его основе улучшенные версии — Boom, ZDoom и другие — с поддержкой высоких разрешений и новых возможностей для авторов уровней.` },
    { id: 'sequels', title: 'Продолжения', content: `<table class="interpedia-wikitable">
<tr><th>Игра</th><th>Год</th><th>Примечание</th></tr>
<tr><td>Doom II: Hell on Earth</td><td>1994</td><td>продавалась только в магазинах, двуствольное ружьё и новые монстры</td></tr>
<tr><td>The Ultimate Doom</td><td>1995</td><td>оригинал с четвёртым эпизодом</td></tr>
<tr><td>Final Doom</td><td>1996</td><td>два набора уровней от авторов из сообщества</td></tr>
<tr><td>Doom95</td><td>1996</td><td>версия для Win 95 на DirectX</td></tr>
</table>

Для продвижения игр под Win 95 Microslop в 1995 году сняла ролик, в котором Билл Гейтс в плаще появляется внутри уровня Doom с дробовиком.` },
    { id: 'controversy', title: 'Споры о насилии', content: `Кровь, демоны и сатанинская символика сделали Doom одной из самых обсуждаемых игр десятилетия. Критики называли её симулятором убийства. После трагедии в школе «Колумбайн» в апреле 1999 года, когда стало известно, что стрелявшие увлекались Doom, споры о насилии в играх вспыхнули с новой силой.` },
    { id: 'legacy', title: 'Наследие', content: `Doom сделал ПК главной игровой платформой для шутеров и показал силу модели shareware и сообщества авторов. Следующая игра id Software, [[quake|Quake]], перенесла жанр в полное 3D, а технологии и идеи Doom повлияли на [[dukenukem3d|Duke Nukem 3D]], [[halflife|Half-Life]] и десятки других игр.` }
  ],
  seeAlso: ['wolf3d', 'quake', 'quake2', 'dukenukem3d', 'lanparty'],
  references: [
    'Doom: руководство пользователя. — id Software, 1993.',
    'Abrash M. Graphics Programming Black Book. — Coriolis, 1997.',
    'Журнал Next Generation, исторические материалы, 1999.',
    'Doom Source Code Release Notes. — id Software, 23 декабря 1997.'
  ],
  links: [['http://www.cheatcc.com', 'Cheat Code Central: коды для Doom'], ['http://forum.games98.com', 'Форум GamerZone']],
  categories: ['Видеоигры 1993 года', 'Шутеры от первого лица', 'id Software', 'Shareware']
}, {
  title: 'Doom (1993)',
  infobox: {
    title: 'Doom',
    badgeText: 'id Software',
    fields: [
      { label: 'Developer', value: 'id Software' },
      { label: 'Publisher', value: 'id Software (shareware); GT Interactive (retail)' },
      { label: 'Released', value: 'December 10, 1993' },
      { label: 'Genre', value: 'first-person shooter' },
      { label: 'Platform', value: '[[msdos|MS-DOS]], later Win 95, Macintosh, consoles' },
      { label: 'Modes', value: 'single player, co-op, deathmatch' },
      { label: 'Lead programmer', value: 'John Carmack' },
      { label: 'Sequels', value: 'Doom II (1994), Final Doom (1996)' }
    ]
  },
  lead: `<strong>Doom</strong> is a first-person shooter from id Software released on December 10, 1993. A nameless space marine fights demons that have broken out of hell onto the bases on Mars's moons Phobos and Deimos after a failed teleportation experiment.

Doom combined a fast 3D engine, network play and an open level format. It gave rise to the word "deathmatch", an army of fan-made levels and a wave of imitators the press called "Doom clones". In six years the game became part of popular culture, and it still runs in computer clubs all over Russia.`,
  sections: [
    { id: 'development', title: 'Development', content: `After [[wolf3d|Wolfenstein 3D]], id Software set out to make a game on a new and far more powerful engine. Designer Tom Hall wrote a detailed script, the "Doom Bible", but the team chose pace over plot, and Hall left the studio in 1993. Levels were made by John Romero, Sandy Petersen and American McGee, art by Adrian Carmack and Kevin Cloud, and Bobby Prince wrote heavy-metal-inspired music. The development tools ran on NeXT computers.

The first episode was uploaded for free download to a University of Wisconsin FTP server on the night of December 10, 1993. The server buckled under the rush.` },
    { id: 'engine', title: 'Engine', content: `John Carmack's Doom engine was a huge leap over Wolfenstein 3D:

<ul>
<li>walls at any angle, varying floor and ceiling heights, stairs and lifts;</li>
<li>textured floors and ceilings, variable lighting and flickering lights;</li>
<li>binary space partitioning (BSP) for fast visible wall detection;</li>
<li>stereo sound that fades with distance.</li>
</ul>

Doom is still not true 3D: the map is two-dimensional, and one room cannot sit above another, which is why the engine is sometimes called "2.5D". The game runs in protected mode through the DOS/4GW extender and needs a 386 processor and 4 MB of memory.` },
    { id: 'gameplay', title: 'Gameplay', content: `The player works through levels looking for keycards and the exit while fighting imps, cacodemons, barons of hell and the bosses, the Cyberdemon and the Spider Mastermind. The arsenal includes a shotgun, chaingun, rocket launcher, plasma rifle, chainsaw and the BFG 9000.

The first episode, Knee-Deep in the Dead, was free; the full version added The Shores of Hell and Inferno, and The Ultimate Doom (1995) added a fourth episode, Thy Flesh Consumed. Every Doom player knows IDDQD (invulnerability) and IDKFA (all weapons and keys).` },
    { id: 'multiplayer', title: 'Multiplayer', content: `Doom supports four players over an IPX network and two over a [[modem56k|modem]] or null-modem cable. id Software called the mode where players fight each other deathmatch, and the word quickly entered gamer vocabulary. Doom sessions loaded office networks so heavily that some universities and companies banned the game during working hours. In Russia Doom became one of the main games of [[lanparty|computer clubs]].` },
    { id: 'modding', title: 'WAD files and mods', content: `All game data lives in WAD files. id Software documented the format, and fans began making their own levels and graphics replacements in editors such as DEU. Thousands of WADs circulate through [[bbs|BBSes]], FTP archives and [[cdrom|CD-ROM]] compilations.

On December 23, 1997, id Software published the engine source code. Enthusiasts used it to release improved versions such as Boom and ZDoom, with high resolutions and new features for level authors.` },
    { id: 'sequels', title: 'Sequels', content: `<table class="interpedia-wikitable">
<tr><th>Game</th><th>Year</th><th>Note</th></tr>
<tr><td>Doom II: Hell on Earth</td><td>1994</td><td>retail only, super shotgun and new monsters</td></tr>
<tr><td>The Ultimate Doom</td><td>1995</td><td>the original plus a fourth episode</td></tr>
<tr><td>Final Doom</td><td>1996</td><td>two level sets by community authors</td></tr>
<tr><td>Doom95</td><td>1996</td><td>Win 95 version on DirectX</td></tr>
</table>

To promote gaming on Win 95, Microslop made a 1995 video in which Bill Gates, in a trench coat, appears inside a Doom level holding a shotgun.` },
    { id: 'controversy', title: 'Violence debate', content: `Blood, demons and satanic imagery made Doom one of the most debated games of the decade, and critics called it a murder simulator. After the Columbine school shooting in April 1999, when it emerged that the shooters had played Doom, the argument over violence in games flared up again.` },
    { id: 'legacy', title: 'Legacy', content: `Doom made the PC the main platform for shooters and showed the power of shareware and an author community. id Software's next game, [[quake|Quake]], took the genre into full 3D, and Doom's technology and ideas influenced [[dukenukem3d|Duke Nukem 3D]], [[halflife|Half-Life]] and dozens of other games.` }
  ],
  seeAlso: ['wolf3d', 'quake', 'quake2', 'dukenukem3d', 'lanparty'],
  references: [
    'Doom user manual. id Software, 1993.',
    'Abrash, M. Graphics Programming Black Book. Coriolis, 1997.',
    'Next Generation magazine, history features, 1999.',
    'Doom Source Code Release Notes. id Software, December 23, 1997.'
  ],
  links: [['http://www.cheatcc.com', 'Cheat Code Central: Doom codes'], ['http://forum.games98.com', 'GamerZone Forum']],
  categories: ['1993 Video Games', 'First-Person Shooters', 'id Software', 'Shareware']
});

window.interpediaReg('quake', 'games', {
  title: 'Quake (1996)',
  infobox: {
    title: 'Quake',
    badgeText: 'id Software',
    fields: [
      { label: 'Разработчик', value: 'id Software' },
      { label: 'Издатель', value: 'id Software (shareware), GT Interactive' },
      { label: 'Дата выхода', value: '22 июня 1996' },
      { label: 'Жанр', value: 'шутер от первого лица' },
      { label: 'Движок', value: 'Quake engine (полное 3D), язык QuakeC' },
      { label: 'Музыка и звук', value: 'Трент Резнор, Nine Inch Nails' },
      { label: 'Версии', value: 'WinQuake, QuakeWorld, GLQuake' },
      { label: 'Продолжение', value: '[[quake2|Quake II]] (1997)' }
    ]
  },
  lead: `<strong>Quake</strong> — шутер от первого лица id Software, выпущенный 22 июня 1996 года. Это первая крупная игра с полностью трёхмерным миром: полигональными монстрами, комнатами друг над другом и свободным взглядом вверх и вниз. Мрачная атмосфера с отсылками к Лавкрафту и звуковое оформление Трента Резнора из Nine Inch Nails создали игре особую репутацию.

Ещё большее влияние Quake оказал на сетевые игры: версия QuakeWorld открыла эпоху игры через Интернет, а GLQuake сделала трёхмерный ускоритель [[voodoo|3dfx Voodoo]] обязательной покупкой для геймера.`,
  sections: [
    { id: 'development', title: 'Разработка', content: `Название пришло из настольных ролевых игр Тома Холла: Квейком звали его персонажа. Первоначально id Software задумывала ролевую игру с молотом, но за годы работы концепция сжалась до шутера, составленного из уровней четырёх разных стилей — от военной базы до средневековых замков. Затяжная разработка вызвала разлад в команде; вскоре после выхода игры студию покинул Джон Ромеро, основавший компанию Ion Storm.

Движок писали Джон Кармак и приглашённый программист Майкл Абраш, автор книг об оптимизации графики.` },
    { id: 'engine', title: 'Технологии', content: `<ul>
<li><strong>Полное 3D.</strong> Уровни и модели персонажей состоят из полигонов; по вертикали можно прыгать, плавать и стрелять.</li>
<li><strong>Предрассчитанная видимость (PVS)</strong> и BSP-деревья позволяют быстро отбрасывать невидимые части уровня.</li>
<li><strong>Карты освещения</strong> — заранее просчитанные мягкие тени на стенах.</li>
<li><strong>QuakeC</strong> — встроенный язык программирования игровой логики, на котором любители пишут собственные модификации.</li>
<li><strong>Клиент-серверная сеть</strong> — до 16 игроков на одном сервере.</li>
</ul>

Для комфортной игры в программном режиме нужен [[pentium|Pentium]] 75 МГц и 8 МБ памяти.` },
    { id: 'gameplay', title: 'Игровой процесс', content: `Солдат с позывным Рейнджер проникает через «врата скольжения» в измерения, захваченные врагом под кодовым именем Quake. Игра состоит из четырёх эпизодов — Dimension of the Doomed, Realm of Black Magic, Netherworld и The Elder World — и финального боя с Шаб-Ниггуратом. Среди противников — огры с бензопилами, шамблеры и рыцари смерти, а гвоздемёт украшен логотипом Nine Inch Nails.` },
    { id: 'versions', title: 'QuakeWorld и GLQuake', content: `В декабре 1996 года вышел QuakeWorld — версия сетевой части, оптимизированная для игры через Интернет: клиент предсказывает движение игрока, не дожидаясь ответа сервера, и игра остаётся отзывчивой даже при пинге в 200–300 мс на [[modem56k|модемной]] линии.

В январе 1997 года появился GLQuake с поддержкой OpenGL. Специальный драйвер MiniGL для [[voodoo|3dfx Voodoo]] дал сглаженные текстуры, высокое разрешение и плавную частоту кадров. Разница была настолько заметной, что GLQuake стал главным аргументом за покупку 3D-ускорителя.` },
    { id: 'community', title: 'Сообщество и киберспорт', content: `Сеть превратила Quake в спорт. Игроки объединялись в кланы, проводили чемпионаты и разрабатывали тактики. В 1997 году на турнире Red Annihilation победил Деннис «Thresh» Фонг; его призом стал Ferrari 328 Джона Кармака.

На QuakeC написаны популярнейшие модификации: Team Fortress с классами персонажей, захват флага Threewave CTF и десятки других. Записи демо-файлов породили скоростное прохождение (проект Quake Done Quick) и первые фильмы, снятые внутри игры, например «Diary of a Camper» (1996) клана Rangers.` },
    { id: 'addons', title: 'Дополнения и лицензии', content: `Официальные дополнения — Scourge of Armagon (Hipnotic Interactive) и Dissolution of Eternity (Rogue Entertainment) — вышли в 1997 году. Движок Quake лицензировали Raven Software для Hexen II (1997) и Valve, переработавшая его для [[halflife|Half-Life]] (1998).` }
  ],
  seeAlso: ['doom', 'quake2', 'halflife', 'voodoo', 'lanparty'],
  references: [
    'Abrash M. Graphics Programming Black Book. — Coriolis, 1997. — Главы о движке Quake.',
    'Quake: руководство пользователя. — id Software, 1996.',
    'Журнал «Страна игр», обзор Quake, 1996.'
  ],
  links: [['http://www.3dfx-zone.com', '3dfx Voodoo Zone: GLQuake и разгон'], ['http://forum.games98.com', 'Форум GamerZone']],
  categories: ['Видеоигры 1996 года', 'Шутеры от первого лица', 'id Software']
}, {
  title: 'Quake (1996)',
  infobox: {
    title: 'Quake',
    badgeText: 'id Software',
    fields: [
      { label: 'Developer', value: 'id Software' },
      { label: 'Publisher', value: 'id Software (shareware), GT Interactive' },
      { label: 'Released', value: 'June 22, 1996' },
      { label: 'Genre', value: 'first-person shooter' },
      { label: 'Engine', value: 'Quake engine (full 3D), QuakeC language' },
      { label: 'Music and sound', value: 'Trent Reznor, Nine Inch Nails' },
      { label: 'Versions', value: 'WinQuake, QuakeWorld, GLQuake' },
      { label: 'Sequel', value: '[[quake2|Quake II]] (1997)' }
    ]
  },
  lead: `<strong>Quake</strong> is a first-person shooter from id Software released on June 22, 1996. It is the first major game with a fully 3D world: polygonal monsters, rooms stacked above one another and free looking up and down. Its grim, Lovecraft-tinged atmosphere and the sound design by Trent Reznor of Nine Inch Nails gave it a reputation of its own.

Quake had an even bigger effect on online play: QuakeWorld opened the era of Internet gaming, and GLQuake made the [[voodoo|3dfx Voodoo]] 3D accelerator a must-buy for gamers.`,
  sections: [
    { id: 'development', title: 'Development', content: `The name came from Tom Hall's tabletop role-playing games, in which Quake was his character. id Software first imagined a role-playing game built around a hammer, but over years of work the concept shrank to a shooter assembled from levels in four styles, from military bases to medieval castles. The long development caused a rift in the team; soon after release John Romero left to found Ion Storm.

The engine was written by John Carmack and Michael Abrash, a graphics optimization author who joined for the project.` },
    { id: 'engine', title: 'Technology', content: `<ul>
<li><strong>Full 3D.</strong> Levels and character models are made of polygons; players can jump, swim and shoot vertically.</li>
<li><strong>Precomputed visibility (PVS)</strong> and BSP trees quickly discard hidden parts of a level.</li>
<li><strong>Lightmaps</strong>: precalculated soft shadows on walls.</li>
<li><strong>QuakeC</strong>: a built-in language for game logic that fans use to write modifications.</li>
<li><strong>Client-server networking</strong>: up to 16 players on one server.</li>
</ul>

Comfortable play in software mode needs a [[pentium|Pentium]] 75 MHz and 8 MB of memory.` },
    { id: 'gameplay', title: 'Gameplay', content: `A soldier codenamed Ranger passes through "slipgates" into dimensions held by an enemy codenamed Quake. The game has four episodes, Dimension of the Doomed, Realm of Black Magic, Netherworld and The Elder World, and a final fight with Shub-Niggurath. Enemies include chainsaw-wielding ogres, shamblers and death knights, and the nailgun ammo carries the Nine Inch Nails logo.` },
    { id: 'versions', title: 'QuakeWorld and GLQuake', content: `December 1996 brought QuakeWorld, a version of the network code tuned for the Internet: the client predicts the player's movement without waiting for the server, so the game stays responsive even at 200–300 ms ping on a [[modem56k|modem]] line.

In January 1997 GLQuake added OpenGL support. A special MiniGL driver for the [[voodoo|3dfx Voodoo]] delivered filtered textures, high resolution and a smooth frame rate. The difference was so striking that GLQuake became the main argument for buying a 3D accelerator.` },
    { id: 'community', title: 'Community and competition', content: `Online play turned Quake into a sport. Players formed clans, ran tournaments and worked out tactics. In 1997 Dennis "Thresh" Fong won the Red Annihilation tournament; his prize was John Carmack's Ferrari 328.

The most popular modifications were written in QuakeC: Team Fortress with character classes, Threewave CTF capture the flag and dozens more. Recorded demo files gave rise to speedrunning (the Quake Done Quick project) and the first films shot inside a game, such as "Diary of a Camper" (1996) by the Rangers clan.` },
    { id: 'addons', title: 'Expansions and licensing', content: `The official mission packs, Scourge of Armagon (Hipnotic Interactive) and Dissolution of Eternity (Rogue Entertainment), came out in 1997. Raven Software licensed the Quake engine for Hexen II (1997), and Valve reworked it for [[halflife|Half-Life]] (1998).` }
  ],
  seeAlso: ['doom', 'quake2', 'halflife', 'voodoo', 'lanparty'],
  references: [
    'Abrash, M. Graphics Programming Black Book. Coriolis, 1997. Chapters on the Quake engine.',
    'Quake user manual. id Software, 1996.',
    'Strana Igr magazine, Quake review, 1996.'
  ],
  links: [['http://www.3dfx-zone.com', '3dfx Voodoo Zone: GLQuake and overclocking'], ['http://forum.games98.com', 'GamerZone Forum']],
  categories: ['1996 Video Games', 'First-Person Shooters', 'id Software']
});

window.interpediaReg('quake2', 'games', {
  title: 'Quake II (1997)',
  infobox: {
    title: 'Quake II',
    badgeText: 'id Software / Activision',
    fields: [
      { label: 'Разработчик', value: 'id Software' },
      { label: 'Издатель', value: 'Activision' },
      { label: 'Дата выхода', value: '9 декабря 1997' },
      { label: 'Жанр', value: 'шутер от первого лица' },
      { label: 'Движок', value: 'Quake II engine (OpenGL и программный рендер)' },
      { label: 'Сеттинг', value: 'планета Строггос' },
      { label: 'Дополнения', value: 'The Reckoning, Ground Zero (1998)' },
      { label: 'Следующая игра серии', value: '[[quake3|Quake III Arena]] (декабрь 1999)' }
    ]
  },
  lead: `<strong>Quake II</strong> — шутер от первого лица id Software, изданный Activision 9 декабря 1997 года. Несмотря на название, сюжетно он не связан с [[quake|Quake]]: земной десант высаживается на планету Строггос, чтобы остановить кибернетическую расу строггов, и игрок — единственный уцелевший солдат.

Quake II стал эталоном для проверки компьютеров 1998 года: цветное освещение и OpenGL-рендер показывали силу ускорителей [[voodoo2|Voodoo 2]] и [[rivatnt|RIVA TNT]], а сетевой режим и моды сделали игру одной из главных в клубах и на серверах Интернета.`,
  sections: [
    { id: 'story', title: 'Сюжет', content: `Строгги — раса, превращающая захваченных существ в киборгов, — атакуют Землю. В ответ командование начинает операцию «Пришелец-повелитель» (Operation Alien Overlord): десантные капсулы направляются на Строггос, но большая часть флота гибнет при посадке. Игроку предстоит в одиночку пройти через базы, фабрики и тюрьмы строггов и уничтожить их лидера, Макрона.

В отличие от первой части, уровни объединены в «блоки» с общими заданиями: игрок возвращается в пройденные зоны, отключает охрану и открывает новые пути.` },
    { id: 'engine', title: 'Движок', content: `Движок Quake II развивает технологию первой части:

<ul>
<li>цветное освещение и цветные вспышки выстрелов;</li>
<li>рендер OpenGL, рассчитанный на 3D-ускорители, и улучшенный программный рендер;</li>
<li>игровая логика вынесена в отдельную библиотеку DLL на языке C вместо QuakeC, что упростило создание сложных модов;</li>
<li>улучшенный сетевой код, унаследованный от QuakeWorld.</li>
</ul>

С двумя [[voodoo2|Voodoo 2]] в режиме SLI игра идёт в разрешении 1024×768 с частотой выше 60 кадров в секунду. Встроенная демозапись «demo1» стала стандартом сравнения видеокарт в журналах.` },
    { id: 'music', title: 'Музыка', content: `Саундтрек в стиле индустриального метала написал Саша Дикичиян (Sonic Mayhem); композицию Descent into Cerberon добавил Роб Зомби. Музыка записана на игровом компакт-диске в формате CD-Audio и играет с любого [[cdrom|CD-проигрывателя]].` },
    { id: 'multiplayer', title: 'Сетевая игра и моды', content: `Сетевой Quake II поддерживает deathmatch и командную игру, а моды расширяют его на десятки режимов: захват флага (CTF, официальный мод Дэвида «Zoid» Кирша), Action Quake 2 с реалистичным оружием, Rocket Arena 2 с поединками один на один. Lithium добавляет крюк-кошку и руны. В России Quake II стал главной игрой [[lanparty|компьютерных клубов]] 1998–1999 годов наряду со [[starcraft|StarCraft]].` },
    { id: 'expansions', title: 'Дополнения и лицензии', content: `<table class="interpedia-wikitable">
<tr><th>Название</th><th>Разработчик</th><th>Год</th></tr>
<tr><td>Quake II Mission Pack: The Reckoning</td><td>Xatrix</td><td>1998</td></tr>
<tr><td>Quake II Mission Pack: Ground Zero</td><td>Rogue Entertainment</td><td>1998</td></tr>
<tr><td>Heretic II (лицензия движка)</td><td>Raven Software</td><td>1998</td></tr>
<tr><td>SiN (лицензия движка)</td><td>Ritual Entertainment</td><td>1998</td></tr>
<tr><td>Kingpin: Life of Crime (лицензия движка)</td><td>Xatrix</td><td>1999</td></tr>
</table>

На движке Quake II также разрабатываются долгожданная Daikatana студии Ion Storm и Soldier of Fortune от Raven Software.` },
    { id: 'q3', title: 'Quake III Arena', content: `2 декабря 1999 года вышла [[quake3|Quake III Arena]] — полностью сетевой шутер без сюжетной кампании, с противниками-ботами для одиночной игры. Её движок требует 3D-ускоритель и поддерживает изогнутые поверхности. Весной 1999 года id Software выпускала публичные тестовые версии Q3Test, которые скачали сотни тысяч игроков.` }
  ],
  seeAlso: ['quake', 'quake3', 'doom', 'voodoo2', 'rivatnt', 'unreal', 'tombraider'],
  references: [
    'Quake II: руководство пользователя. — Activision, 1997.',
    'Журнал Game.EXE, обзор Quake II, 1998.',
    'Тест видеокарт на демозаписи Quake II // Компьютерра. — 1998.'
  ],
  links: [['http://www.3dfx-zone.com', '3dfx Voodoo Zone: тесты в Quake II'], ['http://www.cheatcc.com', 'Cheat Code Central: коды Quake II']],
  categories: ['Видеоигры 1997 года', 'Шутеры от первого лица', 'id Software']
}, {
  title: 'Quake II (1997)',
  infobox: {
    title: 'Quake II',
    badgeText: 'id Software / Activision',
    fields: [
      { label: 'Developer', value: 'id Software' },
      { label: 'Publisher', value: 'Activision' },
      { label: 'Released', value: 'December 9, 1997' },
      { label: 'Genre', value: 'first-person shooter' },
      { label: 'Engine', value: 'Quake II engine (OpenGL and software renderers)' },
      { label: 'Setting', value: 'the planet Stroggos' },
      { label: 'Expansions', value: 'The Reckoning, Ground Zero (1998)' },
      { label: 'Next in series', value: '[[quake3|Quake III Arena]] (December 1999)' }
    ]
  },
  lead: `<strong>Quake II</strong> is a first-person shooter by id Software, published by Activision on December 9, 1997. Despite the name, its story has nothing to do with [[quake|Quake]]: an Earth invasion force lands on the planet Stroggos to stop the cybernetic Strogg, and the player is the only surviving soldier.

Quake II became the benchmark of 1998 computers: its colored lighting and OpenGL renderer showed off [[voodoo2|Voodoo 2]] and [[rivatnt|RIVA TNT]] accelerators, and its multiplayer and mods made it one of the main games in clubs and on Internet servers.`,
  sections: [
    { id: 'story', title: 'Story', content: `The Strogg, a race that turns captured beings into cyborgs, attack Earth. In response command launches Operation Alien Overlord: drop pods head for Stroggos, but most of the fleet is lost during landing. The player must cross Strogg bases, factories and prisons alone and destroy their leader, the Makron.

Unlike the first game, levels are grouped into "units" with shared objectives: the player returns to earlier areas, disables defenses and opens new paths.` },
    { id: 'engine', title: 'Engine', content: `The Quake II engine builds on the first game's technology:

<ul>
<li>colored lighting and colored muzzle flashes;</li>
<li>an OpenGL renderer for 3D accelerators and an improved software renderer;</li>
<li>game logic moved into a separate DLL written in C instead of QuakeC, which made complex mods easier;</li>
<li>improved networking inherited from QuakeWorld.</li>
</ul>

With two [[voodoo2|Voodoo 2]] cards in SLI the game runs at 1024×768 above 60 frames per second. The built-in "demo1" recording became the standard way magazines compared video cards.` },
    { id: 'music', title: 'Music', content: `The industrial metal soundtrack was composed by Sascha Dikiciyan (Sonic Mayhem), and Rob Zombie contributed the track Descent into Cerberon. The music is stored as CD Audio on the game disc and plays in any [[cdrom|CD player]].` },
    { id: 'multiplayer', title: 'Multiplayer and mods', content: `Multiplayer Quake II supports deathmatch and team play, and mods add dozens of modes: capture the flag (CTF, the official mod by David "Zoid" Kirsch), Action Quake 2 with realistic weapons and Rocket Arena 2 with one-on-one duels. Lithium adds a grappling hook and runes. In Russia Quake II became the main game of [[lanparty|computer clubs]] in 1998–1999 alongside [[starcraft|StarCraft]].` },
    { id: 'expansions', title: 'Expansions and licensing', content: `<table class="interpedia-wikitable">
<tr><th>Title</th><th>Developer</th><th>Year</th></tr>
<tr><td>Quake II Mission Pack: The Reckoning</td><td>Xatrix</td><td>1998</td></tr>
<tr><td>Quake II Mission Pack: Ground Zero</td><td>Rogue Entertainment</td><td>1998</td></tr>
<tr><td>Heretic II (engine license)</td><td>Raven Software</td><td>1998</td></tr>
<tr><td>SiN (engine license)</td><td>Ritual Entertainment</td><td>1998</td></tr>
<tr><td>Kingpin: Life of Crime (engine license)</td><td>Xatrix</td><td>1999</td></tr>
</table>

Ion Storm's long-awaited Daikatana and Raven Software's Soldier of Fortune are also being built on the Quake II engine.` },
    { id: 'q3', title: 'Quake III Arena', content: `[[quake3|Quake III Arena]] came out on December 2, 1999: a purely multiplayer shooter with no story campaign and bot opponents for single play. Its engine requires a 3D accelerator and supports curved surfaces. In spring 1999 id Software released public Q3Test builds that hundreds of thousands of players downloaded.` }
  ],
  seeAlso: ['quake', 'quake3', 'doom', 'voodoo2', 'rivatnt', 'unreal', 'tombraider'],
  references: [
    'Quake II user manual. Activision, 1997.',
    'Game.EXE magazine, Quake II review, 1998.',
    '"Video card test on the Quake II demo". Computerra, 1998.'
  ],
  links: [['http://www.3dfx-zone.com', '3dfx Voodoo Zone: Quake II benchmarks'], ['http://www.cheatcc.com', 'Cheat Code Central: Quake II codes']],
  categories: ['1997 Video Games', 'First-Person Shooters', 'id Software']
});

window.interpediaReg('halflife', 'games', {
  title: 'Half-Life',
  hatnote: 'Статья о компьютерной игре 1998 года. О движке, на котором она построена, см. [[quake|Quake]].',
  infobox: {
    title: 'Half-Life',
    badgeText: 'Valve Software / Sierra Studios',
    fields: [
      { label: 'Разработчик', value: 'Valve Software' },
      { label: 'Издатель', value: 'Sierra Studios' },
      { label: 'Дата выхода', value: '19 ноября 1998' },
      { label: 'Жанр', value: 'шутер от первого лица' },
      { label: 'Движок', value: 'сильно переработанный движок [[quake|Quake]] (GoldSrc)' },
      { label: 'Сценарист', value: 'Марк Лэйдлоу' },
      { label: 'Протагонист', value: 'Гордон Фримен' },
      { label: 'Дополнения', value: 'Opposing Force (1999)' },
      { label: 'Системные требования', value: '[[pentium|Pentium]] 133 МГц, 24 МБ ОЗУ' }
    ]
  },
  lead: `<strong>Half-Life</strong> — шутер от первого лица, дебютная игра американской студии Valve Software, изданная Sierra Studios 19 ноября 1998 года. Физик-теоретик Гордон Фримен становится свидетелем катастрофы в секретном исследовательском комплексе «Чёрная Меза» в Нью-Мексико и пробивается к выходу сквозь пришельцев из пограничного мира Зен и военных, присланных зачистить свидетелей.

Half-Life рассказывает историю, не отнимая у игрока управление: сценки разыгрываются вокруг него в реальном времени, без вставных роликов. Игра собрала десятки наград «Игра года», а её набор для разработчиков породил множество модификаций, включая Team Fortress Classic и Counter-Strike.`,
  sections: [
    { id: 'valve', title: 'Valve и разработка', content: `Valve основали в 1996 году Гейб Ньюэлл и Майк Харрингтон, до этого проработавшие много лет в Microslop. Студия лицензировала у id Software движок [[quake|Quake]] и переписала большую его часть: добавила скелетную анимацию моделей, цветное освещение, поддержку Direct3D и программирование логики на C++. Позже этот движок стали называть GoldSrc.

Первоначально игра должна была выйти в конце 1997 года. После показа на выставке E3 1997 года Valve решила, что прототип не дотягивает до замысла, и переделала значительную часть уровней. Для работы над сюжетом пригласили писателя-фантаста Марка Лэйдлоу. Каждую главу собирала смешанная группа из дизайнеров, программистов и художников, а итоговые уровни проверялись на тестировщиках, за которыми разработчики наблюдали молча.` },
    { id: 'story', title: 'Сюжет', content: `Утро в «Чёрной Мезе» начинается с поездки Гордона Фримена на монорельсе через комплекс. В лаборатории аномальных материалов учёные просят его поместить образец кристалла в луч анализатора. Эксперимент выходит из-под контроля: «каскадный резонанс» разрывает границу между мирами, и в комплекс хлынули существа из Зена — хедкрабы, вортигонты, буллсквиды.

Вскоре в «Чёрную Мезу» входят морские пехотинцы подразделения HECU с приказом уничтожить и пришельцев, и выживший персонал. Фримен пробирается через ракетные шахты, водохранилища и полигоны, а затем телепортируется в Зен, чтобы сразиться с Нихилантом, удерживающим портал открытым. Всю игру за ним наблюдает таинственный человек в костюме с портфелем — G-Man, который в финале предлагает Фримену «работу».` },
    { id: 'design', title: 'Особенности', content: `<ul>
<li><strong>Повествование без роликов.</strong> Все события показаны глазами Фримена: учёные и охранники разговаривают с ним, катастрофы происходят прямо перед игроком, и даже в начальной поездке на монорельсе можно свободно оглядываться.</li>
<li><strong>Неигровые персонажи.</strong> Охранники Барни помогают в бою, учёные открывают двери сетчаткой глаза.</li>
<li><strong>Искусственный интеллект.</strong> Морпехи действуют группами, обходят с флангов и забрасывают укрытия гранатами.</li>
<li><strong>Головоломки и окружение.</strong> Помимо стрельбы, игрок толкает ящики, лазает по лестницам и включает механизмы.</li>
</ul>` },
    { id: 'reception', title: 'Отзывы', content: `Критики встретили Half-Life восторженно. Журнал PC Gamer поставил игре одну из самых высоких оценок в своей истории, а общее число наград «Игра года» превысило полсотни. Отмечали атмосферу, умных противников и непрерывность повествования. В России игра стала одним из главных хитов [[lanparty|компьютерных клубов]], а на рынках вроде [[gorbushka|Горбушки]] продаются несколько пиратских переводов с собственной озвучкой.` },
    { id: 'mods', title: 'Моды и сетевая игра', content: `Вместе с игрой и позднее Valve выпустила набор разработчика (SDK), и любители начали создавать собственные модификации:

<table class="interpedia-wikitable">
<tr><th>Модификация</th><th>Авторы</th><th>Статус на конец 1999</th></tr>
<tr><td>Team Fortress Classic</td><td>Valve</td><td>вышла в апреле 1999, бесплатно</td></tr>
<tr><td>Counter-Strike</td><td>Минь «Gooseman» Ле, Джесс Клифф</td><td>бета-версии с июня 1999, огромная популярность</td></tr>
<tr><td>Firearms, Action Half-Life и другие</td><td>сообщество</td><td>бета-версии</td></tr>
</table>

Counter-Strike — командная игра террористов против спецназа — к концу 1999 года стала одной из самых популярных сетевых игр в мире, хотя официально находится в стадии бета-тестирования.` },
    { id: 'expansions', title: 'Дополнения и распространение', content: `В феврале 1999 года вышла демоверсия Half-Life: Uplink с самостоятельным эпизодом. В ноябре 1999 года студия Gearbox Software выпустила дополнение Opposing Force, в котором события «Чёрной Мезы» показаны глазами капрала морской пехоты Адриана Шепарда.

Помимо коробок Sierra, Valve продаёт и доставляет свои игры через собственный сетевой сервис Steam: игра оплачивается кредитной картой и скачивается прямо на компьютер, а обновления устанавливаются автоматически. Сама Half-Life в нашей системе через Steam не продаётся: демоверсия Half-Life 98 Demo лежит на компакт-диске журнала «Игромания» (<code>D:\\demo\\hl98demo.exe</code>).` }
  ],
  seeAlso: ['quake', 'quake2', 'unreal', 'systemshock2', 'voodoo2', 'stalker98', 'steam'],
  references: [
    'Birdwell K. The Cabal: Valve\'s Design Process for Creating Half-Life // Gamasutra. — декабрь 1999.',
    'PC Gamer. Обзор Half-Life. — 1998.',
    'Half-Life: руководство пользователя. — Sierra Studios, 1998.'
  ],
  links: [['http://www.steampowered.com', 'Steam: игры с доставкой по Сети'], ['http://www.cheatcc.com', 'Cheat Code Central: коды для Half-Life']],
  categories: ['Видеоигры 1998 года', 'Шутеры от первого лица', 'Valve']
}, {
  title: 'Half-Life',
  hatnote: 'This article is about the 1998 computer game. For the engine it is built on, see [[quake|Quake]].',
  infobox: {
    title: 'Half-Life',
    badgeText: 'Valve Software / Sierra Studios',
    fields: [
      { label: 'Developer', value: 'Valve Software' },
      { label: 'Publisher', value: 'Sierra Studios' },
      { label: 'Released', value: 'November 19, 1998' },
      { label: 'Genre', value: 'first-person shooter' },
      { label: 'Engine', value: 'heavily reworked [[quake|Quake]] engine (GoldSrc)' },
      { label: 'Writer', value: 'Marc Laidlaw' },
      { label: 'Protagonist', value: 'Gordon Freeman' },
      { label: 'Expansions', value: 'Opposing Force (1999)' },
      { label: 'System requirements', value: '[[pentium|Pentium]] 133 MHz, 24 MB RAM' }
    ]
  },
  lead: `<strong>Half-Life</strong> is a first-person shooter and the debut game of the American studio Valve Software, published by Sierra Studios on November 19, 1998. Theoretical physicist Gordon Freeman witnesses a disaster at the secret Black Mesa Research Facility in New Mexico and fights his way out through creatures from the border world Xen and soldiers sent to silence the witnesses.

Half-Life tells its story without taking control away from the player: scenes play out around him in real time with no cutscenes. The game won dozens of Game of the Year awards, and its developer kit spawned many modifications, including Team Fortress Classic and Counter-Strike.`,
  sections: [
    { id: 'valve', title: 'Valve and development', content: `Valve was founded in 1996 by Gabe Newell and Mike Harrington, both long-time Microslop employees. The studio licensed the [[quake|Quake]] engine from id Software and rewrote much of it, adding skeletal animation, colored lighting, Direct3D support and game logic in C++. The engine later came to be called GoldSrc.

The game was first due in late 1997. After showing it at E3 1997, Valve decided the prototype fell short and reworked a large share of the levels. Science fiction author Marc Laidlaw joined to work on the story. Each chapter was built by a mixed group of designers, programmers and artists, and finished levels were tested on players while the developers watched in silence.` },
    { id: 'story', title: 'Story', content: `Gordon Freeman's morning at Black Mesa begins with a monorail ride through the facility. In the Anomalous Materials lab, scientists ask him to push a crystal sample into the analyzer beam. The experiment spins out of control: a "resonance cascade" tears the boundary between worlds, and creatures from Xen pour in, among them headcrabs, vortigaunts and bullsquids.

Soon HECU marines enter Black Mesa with orders to eliminate both the aliens and the surviving staff. Freeman makes his way through missile silos, reservoirs and test ranges, then teleports to Xen to fight the Nihilanth, which holds the portal open. Throughout the game he is watched by a mysterious man in a suit with a briefcase, the G-Man, who at the end offers Freeman "a job".` },
    { id: 'design', title: 'Design', content: `<ul>
<li><strong>Storytelling without cutscenes.</strong> Everything is seen through Freeman's eyes: scientists and guards talk to him, disasters happen right in front of the player, and even during the opening monorail ride you can look around freely.</li>
<li><strong>Non-player characters.</strong> Barney the security guard helps in fights, and scientists open doors with retinal scanners.</li>
<li><strong>Artificial intelligence.</strong> Marines act in squads, flank and flush players out of cover with grenades.</li>
<li><strong>Puzzles and environment.</strong> Besides shooting, the player pushes crates, climbs ladders and operates machinery.</li>
</ul>` },
    { id: 'reception', title: 'Reception', content: `Critics greeted Half-Life with enthusiasm. PC Gamer gave it one of the highest scores in its history, and the number of Game of the Year awards passed fifty. Reviewers praised the atmosphere, the smart enemies and the unbroken narrative. In Russia the game became one of the biggest hits of [[lanparty|computer clubs]], and markets such as [[gorbushka|Gorbushka]] sell several pirate translations with their own voice acting.` },
    { id: 'mods', title: 'Mods and multiplayer', content: `With the game and afterwards, Valve released a software development kit (SDK), and fans began making their own modifications:

<table class="interpedia-wikitable">
<tr><th>Modification</th><th>Authors</th><th>Status at end of 1999</th></tr>
<tr><td>Team Fortress Classic</td><td>Valve</td><td>released April 1999, free</td></tr>
<tr><td>Counter-Strike</td><td>Minh "Gooseman" Le, Jess Cliffe</td><td>betas since June 1999, hugely popular</td></tr>
<tr><td>Firearms, Action Half-Life and others</td><td>community</td><td>betas</td></tr>
</table>

Counter-Strike, a team game of terrorists against counter-terrorists, had become one of the most popular online games in the world by the end of 1999, even though it is officially still in beta.` },
    { id: 'expansions', title: 'Expansions and distribution', content: `In February 1999 Valve released Half-Life: Uplink, a demo with a standalone episode. In November 1999 Gearbox Software released the expansion Opposing Force, which shows the Black Mesa events through the eyes of marine corporal Adrian Shephard.

Besides Sierra's boxes, Valve sells and delivers its games through its own online service, Steam: the game is paid for by credit card and downloaded straight to the computer, and updates install automatically. Half-Life itself is not sold on Steam in our system: the Half-Life 98 Demo sits on the Igromania magazine CD (<code>D:\\demo\\hl98demo.exe</code>).` }
  ],
  seeAlso: ['quake', 'quake2', 'unreal', 'systemshock2', 'voodoo2', 'stalker98', 'steam'],
  references: [
    'Birdwell, K. "The Cabal: Valve\'s Design Process for Creating Half-Life". Gamasutra, December 1999.',
    'PC Gamer, Half-Life review, 1998.',
    'Half-Life user manual. Sierra Studios, 1998.'
  ],
  links: [['http://www.steampowered.com', 'Steam: games delivered online'], ['http://www.cheatcc.com', 'Cheat Code Central: Half-Life codes']],
  categories: ['1998 Video Games', 'First-Person Shooters', 'Valve']
});

window.interpediaReg('unreal', 'games', {
  title: 'Unreal (1998)',
  infobox: {
    title: 'Unreal',
    badgeText: 'Epic MegaGames / Digital Extremes',
    fields: [
      { label: 'Разработчики', value: 'Epic MegaGames, Digital Extremes' },
      { label: 'Издатель', value: 'GT Interactive' },
      { label: 'Дата выхода', value: '22 мая 1998' },
      { label: 'Жанр', value: 'шутер от первого лица' },
      { label: 'Движок', value: 'Unreal Engine (Тим Суини)' },
      { label: 'Музыка', value: 'Александр Брэндон, Михиль ван ден Бос' },
      { label: 'Дополнение', value: 'Return to Na Pali (1999)' },
      { label: 'Требования', value: '[[pentium|Pentium]] 166, 16 МБ ОЗУ, рекомендуется 3D-ускоритель' }
    ]
  },
  lead: `<strong>Unreal</strong> — шутер от первого лица студий Epic MegaGames и Digital Extremes, выпущенный в мае 1998 года. Заключённый тюремного корабля «Вортекс Райкерс», потерпевшего крушение на планете На Пали, выбирается на свободу среди храмов мирных нали и баз жестоких ящеров скаарджей.

Unreal поразил игроков графикой: цветным освещением, объёмным туманом, отражающими полами и огромными открытыми пространствами с небом. Его движок, Unreal Engine, вместе с удобным встроенным редактором уровней стал главным соперником технологий id Software и уже лицензирован для десятка игр.`,
  sections: [
    { id: 'development', title: 'Разработка', content: `Работа над Unreal началась в 1994 году, когда канадская студия Digital Extremes предложила Epic MegaGames, известной своими shareware-играми, сделать трёхмерный шутер. Движок с нуля написал сооснователь Epic Тим Суини. Разработка растянулась почти на четыре года: игру многократно переносили, а скриншоты в журналах будоражили воображение задолго до выхода.` },
    { id: 'engine', title: 'Unreal Engine', content: `<ul>
<li><strong>Освещение и эффекты.</strong> Цветные динамические источники света, объёмный туман, зеркальные поверхности, детальные текстуры, проявляющиеся вблизи, и анимированные «процедурные» текстуры огня и воды.</li>
<li><strong>Рендеринг.</strong> Основной режим — через Glide на [[voodoo|3dfx Voodoo]]; есть программный рендер с имитацией фильтрации текстур и, после обновлений, Direct3D.</li>
<li><strong>UnrealScript.</strong> Объектно-ориентированный язык, на котором написана вся игровая логика; модификации пишутся на нём же.</li>
<li><strong>UnrealEd.</strong> Редактор уровней поставляется вместе с игрой и работает в реальном времени.</li>
</ul>

Высокие требования стали предметом шуток: для плавной игры нужен был [[pentium2|Pentium II]] с [[voodoo2|Voodoo 2]].` },
    { id: 'gameplay', title: 'Игровой процесс', content: `Игрок исследует планету На Пали: пещеры, деревни нали, замки и звездолёт скаарджей. Скаарджи уворачиваются от выстрелов и атакуют с разных сторон, удивляя игроков после предсказуемых монстров прежних игр. У каждого оружия два режима огня — например, «автомагнум» стреляет одиночными или веером. Вступительный пролёт камеры над замком стал одной из самых узнаваемых сцен в играх 1998 года.` },
    { id: 'multiplayer', title: 'Сетевая игра', content: `Сетевой код при выходе игры работал плохо, особенно через [[modem56k|модемное]] подключение, и уступал [[quake2|Quake II]]. Epic выпустила несколько обновлений, а затем сосредоточилась на отдельной сетевой игре — [[ut99|Unreal Tournament]], вышедшей в ноябре 1999 года.` },
    { id: 'licensing', title: 'Лицензии движка', content: `<table class="interpedia-wikitable">
<tr><th>Игра</th><th>Разработчик</th><th>Статус на конец 1999</th></tr>
<tr><td>Unreal: Return to Na Pali</td><td>Legend Entertainment</td><td>вышла в 1999</td></tr>
<tr><td>The Wheel of Time</td><td>Legend Entertainment</td><td>вышла в ноябре 1999</td></tr>
<tr><td>Deus Ex</td><td>Ion Storm Austin</td><td>в разработке</td></tr>
<tr><td>Rune</td><td>Human Head Studios</td><td>в разработке</td></tr>
<tr><td>Duke Nukem Forever</td><td>3D Realms</td><td>в разработке, перешла на Unreal Engine в 1998</td></tr>
</table>` },
    { id: 'reception', title: 'Отзывы', content: `Критики высоко оценили графику, музыку и атмосферу Unreal, упрекая игру за требования к компьютеру и слабый сетевой режим. В России Unreal стал витриной для новых ускорителей: в журналах «Unreal на Voodoo 2» был одним из стандартных тестов, а [[lanparty|компьютерные клубы]] устанавливали игру для демонстрации возможностей своих машин.` }
  ],
  seeAlso: ['ut99', 'quake2', 'halflife', 'voodoo', 'voodoo2', 'stalker98'],
  references: [
    'Unreal: руководство пользователя. — GT Interactive, 1998.',
    'Sweeney T. UnrealScript Language Reference. — Epic Games, 1998.',
    'Журнал Game.EXE, обзор Unreal, 1998.'
  ],
  links: [['http://www.3dfx-zone.com', '3dfx Voodoo Zone']],
  categories: ['Видеоигры 1998 года', 'Шутеры от первого лица', 'Epic Games']
}, {
  title: 'Unreal (1998)',
  infobox: {
    title: 'Unreal',
    badgeText: 'Epic MegaGames / Digital Extremes',
    fields: [
      { label: 'Developers', value: 'Epic MegaGames, Digital Extremes' },
      { label: 'Publisher', value: 'GT Interactive' },
      { label: 'Released', value: 'May 22, 1998' },
      { label: 'Genre', value: 'first-person shooter' },
      { label: 'Engine', value: 'Unreal Engine (Tim Sweeney)' },
      { label: 'Music', value: 'Alexander Brandon, Michiel van den Bos' },
      { label: 'Expansion', value: 'Return to Na Pali (1999)' },
      { label: 'Requirements', value: '[[pentium|Pentium]] 166, 16 MB RAM, 3D accelerator recommended' }
    ]
  },
  lead: `<strong>Unreal</strong> is a first-person shooter by Epic MegaGames and Digital Extremes released in May 1998. A prisoner from the prison ship Vortex Rikers, wrecked on the planet Na Pali, fights for freedom among the temples of the peaceful Nali and the bases of the brutal lizard-like Skaarj.

Unreal amazed players with its graphics: colored lighting, volumetric fog, reflective floors and huge open spaces under a sky. Its Unreal Engine, together with a convenient built-in level editor, became the main rival to id Software's technology and has already been licensed for a dozen games.`,
  sections: [
    { id: 'development', title: 'Development', content: `Work on Unreal began in 1994, when the Canadian studio Digital Extremes proposed a 3D shooter to Epic MegaGames, known for its shareware games. Epic co-founder Tim Sweeney wrote the engine from scratch. Development stretched to almost four years: the game was delayed many times, while magazine screenshots fired imaginations long before release.` },
    { id: 'engine', title: 'Unreal Engine', content: `<ul>
<li><strong>Lighting and effects.</strong> Colored dynamic lights, volumetric fog, mirror surfaces, detail textures that appear up close, and animated procedural fire and water textures.</li>
<li><strong>Rendering.</strong> The main mode runs through Glide on a [[voodoo|3dfx Voodoo]]; there is a software renderer that imitates texture filtering and, after patches, Direct3D.</li>
<li><strong>UnrealScript.</strong> An object-oriented language that all game logic is written in, and mods too.</li>
<li><strong>UnrealEd.</strong> The level editor ships with the game and works in real time.</li>
</ul>

The steep requirements became a running joke: smooth play needed a [[pentium2|Pentium II]] with a [[voodoo2|Voodoo 2]].` },
    { id: 'gameplay', title: 'Gameplay', content: `The player explores Na Pali: caves, Nali villages, castles and a Skaarj starship. The Skaarj dodge shots and attack from different sides, surprising players used to the predictable monsters of earlier games. Every weapon has two firing modes; the automag, for example, fires single shots or a spray. The opening camera flight over a castle became one of the most recognizable scenes of 1998 games.` },
    { id: 'multiplayer', title: 'Multiplayer', content: `At launch the network code performed poorly, especially over a [[modem56k|modem]], and lagged behind [[quake2|Quake II]]. Epic released several patches and then concentrated on a separate multiplayer game, [[ut99|Unreal Tournament]], released in November 1999.` },
    { id: 'licensing', title: 'Engine licensing', content: `<table class="interpedia-wikitable">
<tr><th>Game</th><th>Developer</th><th>Status at end of 1999</th></tr>
<tr><td>Unreal: Return to Na Pali</td><td>Legend Entertainment</td><td>released 1999</td></tr>
<tr><td>The Wheel of Time</td><td>Legend Entertainment</td><td>released November 1999</td></tr>
<tr><td>Deus Ex</td><td>Ion Storm Austin</td><td>in development</td></tr>
<tr><td>Rune</td><td>Human Head Studios</td><td>in development</td></tr>
<tr><td>Duke Nukem Forever</td><td>3D Realms</td><td>in development, moved to Unreal Engine in 1998</td></tr>
</table>` },
    { id: 'reception', title: 'Reception', content: `Critics praised Unreal's graphics, music and atmosphere while faulting its hardware demands and weak multiplayer. In Russia Unreal became a showcase for new accelerators: "Unreal on a Voodoo 2" was a standard magazine test, and [[lanparty|computer clubs]] installed the game to show what their machines could do.` }
  ],
  seeAlso: ['ut99', 'quake2', 'halflife', 'voodoo', 'voodoo2', 'stalker98'],
  references: [
    'Unreal user manual. GT Interactive, 1998.',
    'Sweeney, T. UnrealScript Language Reference. Epic Games, 1998.',
    'Game.EXE magazine, Unreal review, 1998.'
  ],
  links: [['http://www.3dfx-zone.com', '3dfx Voodoo Zone']],
  categories: ['1998 Video Games', 'First-Person Shooters', 'Epic Games']
});

window.interpediaReg('ut99', 'games', {
  title: 'Unreal Tournament (1999)',
  infobox: {
    title: 'Unreal Tournament',
    badgeText: 'Epic Games / Digital Extremes',
    fields: [
      { label: 'Разработчики', value: 'Epic Games, Digital Extremes' },
      { label: 'Издатель', value: 'GT Interactive' },
      { label: 'Дата выхода', value: '22 ноября 1999' },
      { label: 'Жанр', value: 'сетевой шутер от первого лица' },
      { label: 'Движок', value: 'Unreal Engine' },
      { label: 'Режимы', value: 'Deathmatch, Team Deathmatch, CTF, Domination, Assault, Last Man Standing' },
      { label: 'Музыка', value: 'Александр Брэндон, Михиль ван ден Бос, Эндрю Сега, Петер Хайба' },
      { label: 'Требования', value: '[[pentium|Pentium]] 200, 32 МБ ОЗУ' }
    ]
  },
  lead: `<strong>Unreal Tournament</strong> — сетевой шутер от первого лица Epic Games и Digital Extremes на движке [[unreal|Unreal]], вышедший 22 ноября 1999 года. Игра построена как вымышленный турнир будущего, в котором бойцы сражаются на аренах ради славы и призов.

Почти одновременно с UT вышла [[quake3|Quake III Arena]], и соперничество двух игр стало главной темой игровой прессы конца 1999 года. Unreal Tournament выделяется разнообразием командных режимов, умными ботами для одиночной игры и «мутаторами», меняющими правила матча.`,
  sections: [
    { id: 'history', title: 'История', content: `После того как сетевой режим [[unreal|Unreal]] разочаровал игроков, Epic решила сделать отдельную игру, целиком посвящённую сражениям между людьми. Первоначально проект задумывался как официальное дополнение, но вырос в самостоятельную игру. Демоверсия вышла в сентябре 1999 года и быстро разошлась по Интернету и игровым [[cdrom|компакт-дискам]].` },
    { id: 'modes', title: 'Режимы игры', content: `<dl>
<dt>Deathmatch и Team Deathmatch</dt><dd>классические схватки каждый против каждого и команда на команду.</dd>
<dt>Capture the Flag</dt><dd>захват флага; самая известная карта — Facing Worlds, две башни на астероиде, разделённые открытым пространством.</dd>
<dt>Domination</dt><dd>команды удерживают контрольные точки, получая очки за время владения.</dd>
<dt>Assault</dt><dd>одна команда выполняет цепочку заданий, другая обороняется; затем стороны меняются.</dd>
<dt>Last Man Standing</dt><dd>у каждого игрока ограниченное число жизней.</dd>
</dl>` },
    { id: 'weapons', title: 'Оружие', content: `Арсенал UT вырос из оружия Unreal. У каждого ствола два режима огня. Среди самых известных — шоковая винтовка, чей энергетический шар можно подорвать вторым выстрелом, флак-пушка, снайперская винтовка с выстрелами в голову и Redeemer — переносная ракета с ядерной боеголовкой, которой можно управлять из кабины. Комментатор объявляет серии побед: «Killing Spree», «Rampage», «Godlike».` },
    { id: 'bots', title: 'Боты и мутаторы', content: `Одиночная игра построена как лестница турнира против ботов — компьютерных противников с настраиваемым уровнем мастерства. Боты UT умеют пользоваться лифтами и прыжками с подрывом, защищают флаг и выполняют приказы командира. Мутаторы меняют правила: InstaGib даёт всем снайперские винтовки, убивающие одним попаданием, «низкая гравитация» превращает матч в полёты.` },
    { id: 'music', title: 'Музыка', content: `Саундтрек в трекерных форматах написали композиторы, вышедшие из [[demoscene|демосцены]]: Александр Брэндон, Михиль ван ден Бос, Эндрю «Necros» Сега и Петер «Skaven» Хайба из Future Crew, авторов [[secondreality|Second Reality]]. Музыка хранится в модульном формате и меняется в зависимости от карты.` },
    { id: 'rivalry', title: 'UT и Quake III Arena', content: `[[quake3|Quake III Arena]] вышла 2 декабря 1999 года, через десять дней после UT. Обе игры — чисто сетевые шутеры, но с разными подходами: Quake III делает ставку на скорость и чистоту дуэлей, а UT — на разнообразие режимов и командную игру. Журналы и [[lanparty|клубы]] проводят сравнения, а игроки спорят на форумах, какая из игр станет главной в 2000 году.` }
  ],
  seeAlso: ['unreal', 'quake3', 'quake2', 'halflife', 'lanparty', 'secondreality'],
  references: [
    'Unreal Tournament: руководство пользователя. — GT Interactive, 1999.',
    'Журнал «Страна игр», сравнение Unreal Tournament и Quake III Arena, декабрь 1999.'
  ],
  links: [['http://forum.games98.com', 'Форум GamerZone'], ['http://www.3dfx-zone.com', '3dfx Voodoo Zone']],
  categories: ['Видеоигры 1999 года', 'Шутеры от первого лица', 'Epic Games', 'Сетевые игры']
}, {
  title: 'Unreal Tournament (1999)',
  infobox: {
    title: 'Unreal Tournament',
    badgeText: 'Epic Games / Digital Extremes',
    fields: [
      { label: 'Developers', value: 'Epic Games, Digital Extremes' },
      { label: 'Publisher', value: 'GT Interactive' },
      { label: 'Released', value: 'November 22, 1999' },
      { label: 'Genre', value: 'online first-person shooter' },
      { label: 'Engine', value: 'Unreal Engine' },
      { label: 'Modes', value: 'Deathmatch, Team Deathmatch, CTF, Domination, Assault, Last Man Standing' },
      { label: 'Music', value: 'Alexander Brandon, Michiel van den Bos, Andrew Sega, Peter Hajba' },
      { label: 'Requirements', value: '[[pentium|Pentium]] 200, 32 MB RAM' }
    ]
  },
  lead: `<strong>Unreal Tournament</strong> is an online first-person shooter by Epic Games and Digital Extremes on the [[unreal|Unreal]] engine, released on November 22, 1999. It is framed as a fictional future tournament in which fighters battle in arenas for fame and prizes.

[[quake3|Quake III Arena]] came out almost at the same time, and the rivalry between the two games became the main topic of the gaming press at the end of 1999. Unreal Tournament stands out for its variety of team modes, smart bots for single play and "mutators" that change the rules of a match.`,
  sections: [
    { id: 'history', title: 'History', content: `After [[unreal|Unreal]]'s multiplayer disappointed players, Epic decided to make a separate game devoted entirely to battles between people. It was first planned as an official add-on but grew into a standalone game. The demo came out in September 1999 and spread quickly over the Internet and magazine [[cdrom|cover discs]].` },
    { id: 'modes', title: 'Game modes', content: `<dl>
<dt>Deathmatch and Team Deathmatch</dt><dd>classic free-for-all and team fights.</dd>
<dt>Capture the Flag</dt><dd>the best-known map is Facing Worlds, two towers on an asteroid separated by open space.</dd>
<dt>Domination</dt><dd>teams hold control points and score for the time they hold them.</dd>
<dt>Assault</dt><dd>one team completes a chain of objectives while the other defends; then the sides swap.</dd>
<dt>Last Man Standing</dt><dd>each player has a limited number of lives.</dd>
</dl>` },
    { id: 'weapons', title: 'Weapons', content: `UT's arsenal grew out of Unreal's. Every weapon has two firing modes. Among the most famous are the shock rifle, whose energy ball can be detonated with a second shot, the flak cannon, the sniper rifle with headshots, and the Redeemer, a portable nuclear missile that can be steered from the cockpit. An announcer calls out killing sprees: "Killing Spree", "Rampage", "Godlike".` },
    { id: 'bots', title: 'Bots and mutators', content: `Single play is a tournament ladder against bots, computer opponents with adjustable skill. UT bots use lifts and rocket jumps, guard the flag and follow the team leader's orders. Mutators change the rules: InstaGib gives everyone one-hit-kill rifles, and low gravity turns a match into a flying contest.` },
    { id: 'music', title: 'Music', content: `The tracker soundtrack was written by composers from the [[demoscene|demoscene]]: Alexander Brandon, Michiel van den Bos, Andrew "Necros" Sega and Peter "Skaven" Hajba of Future Crew, the group behind [[secondreality|Second Reality]]. The music is stored in module format and changes from map to map.` },
    { id: 'rivalry', title: 'UT and Quake III Arena', content: `[[quake3|Quake III Arena]] came out on December 2, 1999, ten days after UT. Both are purely multiplayer shooters with different approaches: Quake III bets on speed and pure duels, UT on variety of modes and team play. Magazines and [[lanparty|clubs]] run comparisons, and players argue on forums about which game will rule in 2000.` }
  ],
  seeAlso: ['unreal', 'quake3', 'quake2', 'halflife', 'lanparty', 'secondreality'],
  references: [
    'Unreal Tournament user manual. GT Interactive, 1999.',
    'Strana Igr magazine, Unreal Tournament vs. Quake III Arena comparison, December 1999.'
  ],
  links: [['http://forum.games98.com', 'GamerZone Forum'], ['http://www.3dfx-zone.com', '3dfx Voodoo Zone']],
  categories: ['1999 Video Games', 'First-Person Shooters', 'Epic Games', 'Online Games']
});

window.interpediaReg('dukenukem3d', 'games', {
  title: 'Duke Nukem 3D (1996)',
  infobox: {
    title: 'Duke Nukem 3D',
    badgeText: '3D Realms / Apogee',
    fields: [
      { label: 'Разработчик', value: '3D Realms' },
      { label: 'Издатель', value: 'FormGen, GT Interactive' },
      { label: 'Дата выхода', value: '29 января 1996' },
      { label: 'Жанр', value: 'шутер от первого лица' },
      { label: 'Движок', value: 'Build (Кен Силверман)' },
      { label: 'Голос Дюка', value: 'Джон Сент-Джон' },
      { label: 'Издания', value: 'shareware, Atomic Edition (1996)' },
      { label: 'Требования', value: '486DX2 66 МГц, 8 МБ ОЗУ' }
    ]
  },
  lead: `<strong>Duke Nukem 3D</strong> — шутер от первого лица студии 3D Realms (подразделения Apogee Software), выпущенный 29 января 1996 года. Самовлюблённый герой боевиков Дюк Нюкем спасает Лос-Анджелес, Луну и Землю от пришельцев, сыпля цитатами из фильмов.

Игра запомнилась интерактивными уровнями, похожими на реальные места — кинотеатры, бары, метро, — грубоватым юмором и редактором Build, с помощью которого игроки сделали тысячи собственных карт. Её продолжение, Duke Nukem Forever, в разработке с 1997 года.`,
  sections: [
    { id: 'development', title: 'Разработка', content: `Дюк Нюкем появился в 1991 году как герой двухмерного платформера Apogee. Для трёхмерной части студия выбрала движок Build, который написал молодой программист Кен Силверман. Разработкой руководил Джордж Бруссард, уровни проектировали Аллен Блум и Ричард «Levelord» Грей. Первый эпизод распространялся бесплатно по схеме shareware, как и игры Apogee до него.` },
    { id: 'engine', title: 'Движок Build', content: `Build, как и движок [[doom|Doom]], основан на секторах с разной высотой пола и потолка, но добавляет наклонные поверхности, зеркала, подводные участки и хитрые приёмы, позволяющие показывать помещения друг над другом. Уровни можно разрушать: взрыв пробивает стену, рушит мост или здание. В редакторе уровни строятся прямо в трёхмерном виде, и он поставляется вместе с игрой.

На Build вышли и другие игры: Shadow Warrior, Blood и Redneck Rampage (все — 1997).` },
    { id: 'gameplay', title: 'Игровой процесс', content: `Три эпизода полной версии — L.A. Meltdown, Lunar Apocalypse и Shrapnel City — переносят Дюка из Лос-Анджелеса на лунные базы и обратно. В издании Atomic Edition (ноябрь 1996) добавлен четвёртый эпизод, The Birth.

Окружение необычно живое: можно включить свет, сыграть в бильярд, посмотреть в зеркало, воспользоваться туалетом и бросить монету танцовщице в клубе. Оружие включает ракетомёт, уменьшитель, превращающий врагов в крошечные фигурки, которых можно раздавить, морозилку и самодельные мины-ловушки. Сетевой режим поддерживает до восьми игроков — так называемый «Dukematch».` },
    { id: 'humor', title: 'Юмор и цитаты', content: `Дюка озвучил Джон Сент-Джон. Многие его реплики заимствованы из кино: «Hail to the king, baby!» — из фильма «Армия тьмы», «It's time to kick ass and chew bubble gum... and I'm all outta gum» — из фильма «Они живут». Ирония над штампами боевиков сочетается с откровенными сценами в стрип-клубах, из-за которых игру критиковали, а в некоторых странах ограничивали продажу.` },
    { id: 'forever', title: 'Duke Nukem Forever', content: `Продолжение было анонсировано в апреле 1997 года на движке [[quake2|Quake II]]. В 1998 году 3D Realms переключилась на [[unreal|Unreal Engine]], что потребовало переделать значительную часть работы. На вопросы о дате выхода студия отвечает фразой «когда будет готово» (when it's done). На конец 1999 года дата релиза не объявлена.` }
  ],
  seeAlso: ['doom', 'wolf3d', 'quake', 'unreal', 'carmageddon'],
  references: [
    'Duke Nukem 3D: руководство пользователя. — FormGen, 1996.',
    'Silverman K. BUILD Engine Documentation. — 1996.',
    'Пресс-релиз 3D Realms о переходе Duke Nukem Forever на Unreal Engine. — июнь 1998.'
  ],
  links: [['http://www.cheatcc.com', 'Cheat Code Central: коды Duke Nukem 3D']],
  categories: ['Видеоигры 1996 года', 'Шутеры от первого лица', '3D Realms', 'Shareware']
}, {
  title: 'Duke Nukem 3D (1996)',
  infobox: {
    title: 'Duke Nukem 3D',
    badgeText: '3D Realms / Apogee',
    fields: [
      { label: 'Developer', value: '3D Realms' },
      { label: 'Publisher', value: 'FormGen, GT Interactive' },
      { label: 'Released', value: 'January 29, 1996' },
      { label: 'Genre', value: 'first-person shooter' },
      { label: 'Engine', value: 'Build (Ken Silverman)' },
      { label: 'Voice of Duke', value: 'Jon St. John' },
      { label: 'Editions', value: 'shareware, Atomic Edition (1996)' },
      { label: 'Requirements', value: '486DX2 66 MHz, 8 MB RAM' }
    ]
  },
  lead: `<strong>Duke Nukem 3D</strong> is a first-person shooter from 3D Realms, a division of Apogee Software, released on January 29, 1996. Narcissistic action hero Duke Nukem saves Los Angeles, the Moon and Earth from aliens while dropping movie quotes.

The game is remembered for interactive levels that resemble real places such as movie theaters, bars and subways, for its crude humor and for the Build editor players used to make thousands of their own maps. Its sequel, Duke Nukem Forever, has been in development since 1997.`,
  sections: [
    { id: 'development', title: 'Development', content: `Duke Nukem first appeared in 1991 as the hero of an Apogee 2D platformer. For the 3D game the studio chose the Build engine written by young programmer Ken Silverman. George Broussard led development, and Allen Blum and Richard "Levelord" Gray designed the levels. The first episode was distributed free as shareware, like Apogee's earlier games.` },
    { id: 'engine', title: 'The Build engine', content: `Like the [[doom|Doom]] engine, Build is based on sectors with varying floor and ceiling heights, but it adds sloped surfaces, mirrors, underwater areas and clever tricks that show rooms above one another. Levels can be destroyed: an explosion breaches a wall or brings down a bridge or a building. The editor builds levels directly in 3D and ships with the game.

Other games also used Build: Shadow Warrior, Blood and Redneck Rampage (all 1997).` },
    { id: 'gameplay', title: 'Gameplay', content: `The three episodes of the full version, L.A. Meltdown, Lunar Apocalypse and Shrapnel City, take Duke from Los Angeles to lunar bases and back. The Atomic Edition (November 1996) adds a fourth episode, The Birth.

The environment is unusually alive: you can switch on lights, play pool, look in a mirror, use a toilet and tip a dancer at a club. Weapons include a rocket launcher, a shrinker that turns enemies into tiny figures to be stomped, a freezer and homemade tripwire bombs. Multiplayer supports up to eight players in what fans call a "Dukematch".` },
    { id: 'humor', title: 'Humor and quotes', content: `Duke is voiced by Jon St. John. Many of his lines are borrowed from films: "Hail to the king, baby!" comes from Army of Darkness, and "It's time to kick ass and chew bubble gum... and I'm all outta gum" from They Live. Its mockery of action clichés is mixed with explicit strip club scenes, which drew criticism and restricted sales in some countries.` },
    { id: 'forever', title: 'Duke Nukem Forever', content: `The sequel was announced in April 1997 on the [[quake2|Quake II]] engine. In 1998 3D Realms switched to the [[unreal|Unreal Engine]], which meant redoing much of the work. Asked about a release date, the studio answers "when it's done". As of late 1999, no release date has been announced.` }
  ],
  seeAlso: ['doom', 'wolf3d', 'quake', 'unreal', 'carmageddon'],
  references: [
    'Duke Nukem 3D user manual. FormGen, 1996.',
    'Silverman, K. BUILD Engine Documentation, 1996.',
    '3D Realms press release on moving Duke Nukem Forever to the Unreal Engine, June 1998.'
  ],
  links: [['http://www.cheatcc.com', 'Cheat Code Central: Duke Nukem 3D codes']],
  categories: ['1996 Video Games', 'First-Person Shooters', '3D Realms', 'Shareware']
});

window.interpediaReg('fallout', 'games', {
  title: 'Fallout (1997)',
  infobox: {
    title: 'Fallout',
    badgeText: 'Interplay Productions',
    fields: [
      { label: 'Разработчик', value: 'Interplay Productions' },
      { label: 'Издатель', value: 'Interplay Productions' },
      { label: 'Дата выхода', value: '30 сентября 1997' },
      { label: 'Жанр', value: 'ролевая игра' },
      { label: 'Ролевая система', value: 'S.P.E.C.I.A.L.' },
      { label: 'Руководитель', value: 'Тим Кейн' },
      { label: 'Музыка', value: 'Марк Морган' },
      { label: 'Рассказчик', value: 'Рон Перлман' },
      { label: 'Продолжение', value: '[[fallout2|Fallout 2]] (1998)' }
    ]
  },
  lead: `<strong>Fallout</strong> — ролевая компьютерная игра Interplay Productions, вышедшая осенью 1997 года. Действие происходит в 2161 году в Южной Калифорнии, через восемьдесят с лишним лет после ядерной войны. Житель подземного Убежища 13 отправляется в пустоши, чтобы найти замену сломавшемуся чипу очистки воды, и сталкивается с армией супермутантов.

Fallout соединяет мрачный постапокалипсис с эстетикой американской фантастики 1950-х годов: ламповыми компьютерами, атомным оптимизмом и улыбающимся талисманом Волт-боем. Игра почти любую задачу позволяет решить разными путями — силой, хитростью, убеждением или наукой — и считается духовной наследницей Wasteland (1988).`,
  sections: [
    { id: 'development', title: 'Разработка', content: `Проект начинала небольшая группа Interplay под руководством программиста Тима Кейна. Первоначально игру строили на лицензированной ролевой системе GURPS Стива Джексона, но издатель системы возражал против уровня насилия, и команда разработала собственную систему S.P.E.C.I.A.L. Художник Леонард Боярски задал узнаваемый стиль «ретро-будущего», а Марк Морган написал эмбиентную музыку, звучащую как гул заброшенного мира.

Вступительный ролик открывается песней «Maybe» группы The Ink Spots и фразой рассказчика Рона Перлмана: «Война. Война никогда не меняется».` },
    { id: 'setting', title: 'Мир игры', content: `Согласно истории игры, в середине XXI века мир охватил энергетический кризис, а в 2077 году Великая война уничтожила цивилизацию за пару часов. Корпорация Vault-Tec заранее построила убежища для избранных граждан. Спустя поколения выжившие на поверхности живут в городах-лачугах вроде Джанктауна и Хаба, гули — люди, изменённые радиацией, — населяют Некрополь, а Братство Стали хранит довоенные технологии в бункере.

Главный противник — Создатель (Master), существо, которое с помощью вируса ВРЭ (FEV) превращает людей в супермутантов, чтобы объединить мир под своей властью.` },
    { id: 'gameplay', title: 'Игровой процесс', content: `Персонаж описывается семью характеристиками S.P.E.C.I.A.L.: сила, восприятие, выносливость, харизма, интеллект, ловкость и удача. К ним добавляются навыки, черты характера и перки, которые выбираются с ростом уровня, — например, «Кровавое месиво» (Bloody Mess) делает каждую смерть врага особенно зрелищной.

Бой пошаговый: каждое действие тратит очки действия, а прицельные выстрелы в глаза или ноги дают особые эффекты. Перемещение по карте мира занимает время, а на поиски водяного чипа отведено 150 игровых дней. Электронный помощник Пип-бой 2000 хранит карту, задания и время.` },
    { id: 'choices', title: 'Свобода выбора', content: `Fallout прославился тем, что многие задачи решаются по-разному. Создателя можно убить в бою, взорвать вместе с его собором или убедить в бессмысленности его плана. В конце игры серия слайдов рассказывает о судьбе посещённых городов, и она зависит от поступков героя. Финальная сцена, в которой Смотритель изгоняет спасителя убежища, стала одной из самых обсуждаемых концовок в играх.` },
    { id: 'reception', title: 'Отзывы и влияние', content: `Игра продавалась скромнее больших хитов, но получила восторженные отзывы и звание лучшей ролевой игры 1997 года во многих изданиях. В России Fallout приобрёл огромную популярность, в том числе благодаря пиратским переводам, а фразы и образы игры стали частью жаргона игроков. Уже через год вышло продолжение, [[fallout2|Fallout 2]].` }
  ],
  seeAlso: ['fallout2', 'baldursgate', 'diablo', 'systemshock2', 'stalker98'],
  references: [
    'Fallout: руководство пользователя (Vault Dweller\'s Survival Guide). — Interplay, 1997.',
    'Computer Gaming World. Обзор Fallout. — 1997.',
    'Журнал Game.EXE, обзор Fallout, 1998.'
  ],
  links: [['http://www.igromania.ru', 'Журнал «Игромания»: прохождение Fallout']],
  categories: ['Видеоигры 1997 года', 'Ролевые игры', 'Interplay', 'Постапокалипсис']
}, {
  title: 'Fallout (1997)',
  infobox: {
    title: 'Fallout',
    badgeText: 'Interplay Productions',
    fields: [
      { label: 'Developer', value: 'Interplay Productions' },
      { label: 'Publisher', value: 'Interplay Productions' },
      { label: 'Released', value: 'September 30, 1997' },
      { label: 'Genre', value: 'role-playing game' },
      { label: 'Rules', value: 'S.P.E.C.I.A.L.' },
      { label: 'Lead', value: 'Tim Cain' },
      { label: 'Music', value: 'Mark Morgan' },
      { label: 'Narrator', value: 'Ron Perlman' },
      { label: 'Sequel', value: '[[fallout2|Fallout 2]] (1998)' }
    ]
  },
  lead: `<strong>Fallout</strong> is a computer role-playing game from Interplay Productions released in autumn 1997. It is set in 2161 in Southern California, more than eighty years after a nuclear war. A resident of the underground Vault 13 ventures into the wasteland to find a replacement for a broken water purification chip and runs into an army of super mutants.

Fallout combines grim post-apocalypse with the look of 1950s American science fiction: vacuum-tube computers, atomic optimism and the smiling Vault Boy mascot. Nearly every problem can be solved in several ways, by force, stealth, persuasion or science, and the game is considered the spiritual heir of Wasteland (1988).`,
  sections: [
    { id: 'development', title: 'Development', content: `The project was started by a small Interplay group led by programmer Tim Cain. The game was first built on Steve Jackson's licensed GURPS rules, but the rules' publisher objected to the level of violence, and the team created its own S.P.E.C.I.A.L. system. Artist Leonard Boyarsky set the recognizable "retro-future" style, and Mark Morgan wrote ambient music that sounds like the hum of an abandoned world.

The intro opens with the Ink Spots song "Maybe" and narrator Ron Perlman's line: "War. War never changes."` },
    { id: 'setting', title: 'Setting', content: `In the game's history, an energy crisis gripped the world in the mid-21st century, and in 2077 the Great War destroyed civilization in a couple of hours. The Vault-Tec corporation had built shelters for chosen citizens. Generations later, survivors on the surface live in shanty towns such as Junktown and the Hub, ghouls, people changed by radiation, populate the Necropolis, and the Brotherhood of Steel guards pre-war technology in its bunker.

The main antagonist is the Master, a being who uses the Forced Evolutionary Virus (FEV) to turn people into super mutants and unite the world under his rule.` },
    { id: 'gameplay', title: 'Gameplay', content: `A character is described by seven S.P.E.C.I.A.L. attributes: Strength, Perception, Endurance, Charisma, Intelligence, Agility and Luck. Skills, traits and perks are added on top, with perks chosen as the character levels up; Bloody Mess, for example, makes every enemy death especially gory.

Combat is turn-based: every action costs action points, and aimed shots at the eyes or legs have special effects. Travel on the world map takes time, and the search for the water chip has a limit of 150 game days. The Pip-Boy 2000 wrist computer keeps the map, quests and clock.` },
    { id: 'choices', title: 'Freedom of choice', content: `Fallout became famous because many problems can be solved in different ways. The Master can be killed in battle, blown up along with his cathedral or talked into seeing the futility of his plan. At the end, a series of slides tells the fate of the towns the hero visited, shaped by the hero's actions. The final scene, in which the Overseer exiles the vault's savior, became one of the most discussed endings in games.` },
    { id: 'reception', title: 'Reception and influence', content: `The game sold more modestly than the big hits but drew rave reviews and the title of best role-playing game of 1997 in many publications. In Russia Fallout became hugely popular, helped by pirate translations, and its phrases and images entered gamer slang. A sequel, [[fallout2|Fallout 2]], followed only a year later.` }
  ],
  seeAlso: ['fallout2', 'baldursgate', 'diablo', 'systemshock2', 'stalker98'],
  references: [
    'Fallout manual (Vault Dweller\'s Survival Guide). Interplay, 1997.',
    'Computer Gaming World, Fallout review, 1997.',
    'Game.EXE magazine, Fallout review, 1998.'
  ],
  links: [['http://www.igromania.ru', 'Igromania magazine: Fallout walkthrough']],
  categories: ['1997 Video Games', 'Role-Playing Games', 'Interplay', 'Post-Apocalyptic']
});

window.interpediaReg('fallout2', 'games', {
  title: 'Fallout 2 (1998)',
  infobox: {
    title: 'Fallout 2',
    badgeText: 'Black Isle Studios',
    fields: [
      { label: 'Разработчик', value: 'Black Isle Studios (Interplay)' },
      { label: 'Издатель', value: 'Interplay Productions' },
      { label: 'Дата выхода', value: '30 октября 1998' },
      { label: 'Жанр', value: 'ролевая игра' },
      { label: 'Ролевая система', value: 'S.P.E.C.I.A.L.' },
      { label: 'Место и время', value: 'Северная Калифорния, 2241 год' },
      { label: 'Протагонист', value: 'Избранный (Chosen One)' },
      { label: 'Главный противник', value: 'Анклав' },
      { label: 'Предшественник', value: '[[fallout|Fallout]] (1997)' }
    ]
  },
  lead: `<strong>Fallout 2</strong> — ролевая игра Black Isle Studios, подразделения Interplay, вышедшая 30 октября 1998 года. Действие разворачивается через 80 лет после событий [[fallout|Fallout]]: потомок Жителя Убежища, известный как Избранный, покидает родную деревню Арройо, чтобы найти ГЭКК — «Комплект для создания Эдема», который спасёт племя от засухи.

Продолжение сохранило движок и систему S.P.E.C.I.A.L. первой части, но мир стал в несколько раз больше, сюжет — разветвлённее, а юмор — смелее. Игра вышла с большим количеством ошибок, однако быстро стала одной из самых любимых ролевых игр, особенно в России.`,
  sections: [
    { id: 'development', title: 'Разработка', content: `Продолжение сделали всего за год. Работу возглавил Фергюс Уркхарт, глава подразделения Black Isle; среди авторов квестов — Крис Авеллон, Колин Маккомб и Мэтт Нортон. Часть создателей первой игры — Тим Кейн, Леонард Боярски и Джейсон Андерсон — ещё в ходе работы ушли из Interplay и основали собственную студию Troika Games. Сжатые сроки сказались на качестве: игра вышла с ошибками, часть которых исправило обновление 1.02.` },
    { id: 'story', title: 'Сюжет', content: `Избранный проходит «Храм испытаний», становится посланником племени Арройо и отправляется в пустоши. Его путь лежит через городки Кламат и Дэн, Город-Убежище с его гражданскими правами, игорный и бандитский Нью-Рино, Новую Калифорнийскую Республику — первое государство пустошей — и Сан-Франциско, где живут потомки китайских моряков.

Главный противник — Анклав, остатки довоенного правительства США, укрывшиеся на нефтяной платформе у побережья. Анклав считает выживших мутантами и готовит выпуск модифицированного вируса, который уничтожит всех, кроме «чистых» людей. Его символ — неуязвимый, на первый взгляд, солдат Фрэнк Хорриган.` },
    { id: 'changes', title: 'Нововведения', content: `<ul>
<li><strong>Больший мир</strong> — около десятка крупных городов и множество случайных встреч на карте.</li>
<li><strong>Спутники</strong> — к герою присоединяются напарники, которыми можно управлять через диалог и выдавать им снаряжение.</li>
<li><strong>Автомобиль</strong> — найденная машина «Хайвеймен» ускоряет путешествия и служит дополнительным багажником.</li>
<li><strong>Репутация</strong> — у героя появляется карма и известность в отдельных городах; в зависимости от поступков его называют защитником, бандитом или даже порнозвездой Нью-Рино.</li>
<li><strong>Особые встречи</strong> — редкие эпизоды-шутки с отсылками к кино и сериалам, от «Монти Пайтона» до «Звёздного пути».</li>
</ul>` },
    { id: 'tone', title: 'Тон и юмор', content: `По сравнению с суровым первым Fallout вторая часть полна иронии, абсурдных ситуаций и взрослых тем: наркотики, проституция, рабство и мафиозные войны соседствуют с говорящими когтями смерти и пародиями на поп-культуру. Часть поклонников оригинала считает, что шуток стало слишком много, другие ценят именно этот контраст.` },
    { id: 'russia', title: 'Fallout 2 в России', content: `В России игра вышла в нескольких пиратских переводах, различающихся качеством и словечками, которые сами по себе стали предметом обсуждения в [[fidonet|ФидоНете]] и на форумах. Обмен сохранёнными играми, советами по прокачке и описаниями особых встреч занимает целые разделы в журналах вроде «Игромании».` }
  ],
  seeAlso: ['fallout', 'baldursgate', 'diablo2', 'homm3'],
  references: [
    'Fallout 2: руководство пользователя. — Interplay, 1998.',
    'PC Gamer. Обзор Fallout 2. — 1998.',
    'Журнал «Игромания»: прохождение Fallout 2. — 1999.'
  ],
  links: [['http://www.igromania.ru', 'Журнал «Игромания»'], ['http://www.cheatcc.com', 'Cheat Code Central: Fallout 2']],
  categories: ['Видеоигры 1998 года', 'Ролевые игры', 'Interplay', 'Black Isle Studios', 'Постапокалипсис']
}, {
  title: 'Fallout 2 (1998)',
  infobox: {
    title: 'Fallout 2',
    badgeText: 'Black Isle Studios',
    fields: [
      { label: 'Developer', value: 'Black Isle Studios (Interplay)' },
      { label: 'Publisher', value: 'Interplay Productions' },
      { label: 'Released', value: 'October 30, 1998' },
      { label: 'Genre', value: 'role-playing game' },
      { label: 'Rules', value: 'S.P.E.C.I.A.L.' },
      { label: 'Setting', value: 'Northern California, 2241' },
      { label: 'Protagonist', value: 'the Chosen One' },
      { label: 'Main antagonist', value: 'the Enclave' },
      { label: 'Predecessor', value: '[[fallout|Fallout]] (1997)' }
    ]
  },
  lead: `<strong>Fallout 2</strong> is a role-playing game from Black Isle Studios, a division of Interplay, released on October 30, 1998. It takes place 80 years after [[fallout|Fallout]]: a descendant of the Vault Dweller, known as the Chosen One, leaves the village of Arroyo to find a G.E.C.K., the Garden of Eden Creation Kit, to save the tribe from drought.

The sequel kept the first game's engine and S.P.E.C.I.A.L. system, but the world grew several times larger, the plot branched further and the humor got bolder. It shipped with many bugs, yet quickly became one of the most beloved role-playing games, especially in Russia.`,
  sections: [
    { id: 'development', title: 'Development', content: `The sequel was made in just a year. Work was led by Feargus Urquhart, head of the Black Isle division; quest writers included Chris Avellone, Colin McComb and Matt Norton. Several creators of the first game, Tim Cain, Leonard Boyarsky and Jason Anderson, left Interplay during production and founded their own studio, Troika Games. The tight schedule showed: the game shipped with bugs, some of which patch 1.02 fixed.` },
    { id: 'story', title: 'Story', content: `The Chosen One passes the Temple of Trials, becomes Arroyo's envoy and sets out into the wasteland. The path leads through Klamath and the Den, Vault City with its citizenship rules, the gambling and gangster town of New Reno, the New California Republic, the first real state of the wasteland, and San Francisco, home to the descendants of Chinese sailors.

The main antagonist is the Enclave, the remnant of the pre-war US government hiding on an offshore oil rig. The Enclave considers the survivors mutants and plans to release a modified virus that will kill everyone except "pure" humans. Its emblem is the seemingly invincible soldier Frank Horrigan.` },
    { id: 'changes', title: 'What\'s new', content: `<ul>
<li><strong>A bigger world</strong>: about ten major towns and many random encounters on the map.</li>
<li><strong>Companions</strong>: partners join the hero and can be directed through dialogue and given equipment.</li>
<li><strong>A car</strong>: the Highwayman speeds up travel and doubles as extra storage.</li>
<li><strong>Reputation</strong>: the hero has karma and standing in individual towns, and depending on deeds is called a defender, a thug or even a New Reno porn star.</li>
<li><strong>Special encounters</strong>: rare joke episodes referencing film and television, from Monty Python to Star Trek.</li>
</ul>` },
    { id: 'tone', title: 'Tone and humor', content: `Compared with the stern first Fallout, the sequel is full of irony, absurd situations and adult themes: drugs, prostitution, slavery and mob wars sit next to talking deathclaws and pop culture parodies. Some fans of the original think the jokes went too far; others value exactly that contrast.` },
    { id: 'russia', title: 'Fallout 2 in Russia', content: `In Russia the game came out in several pirate translations that differ in quality and in pet words, which themselves became a topic of discussion in [[fidonet|FidoNet]] and on forums. Trading saved games, character-building advice and descriptions of special encounters fill whole sections of magazines such as Igromania.` }
  ],
  seeAlso: ['fallout', 'baldursgate', 'diablo2', 'homm3'],
  references: [
    'Fallout 2 user manual. Interplay, 1998.',
    'PC Gamer, Fallout 2 review, 1998.',
    'Igromania magazine, Fallout 2 walkthrough, 1999.'
  ],
  links: [['http://www.igromania.ru', 'Igromania magazine'], ['http://www.cheatcc.com', 'Cheat Code Central: Fallout 2']],
  categories: ['1998 Video Games', 'Role-Playing Games', 'Interplay', 'Black Isle Studios', 'Post-Apocalyptic']
});

window.interpediaReg('baldursgate', 'games', {
  title: 'Baldur\'s Gate (1998)',
  infobox: {
    title: 'Baldur\'s Gate',
    badgeText: 'BioWare / Black Isle',
    fields: [
      { label: 'Разработчик', value: 'BioWare' },
      { label: 'Издатель', value: 'Interplay (Black Isle Studios)' },
      { label: 'Дата выхода', value: '21 декабря 1998' },
      { label: 'Жанр', value: 'ролевая игра' },
      { label: 'Правила', value: 'Advanced Dungeons & Dragons, 2-я редакция' },
      { label: 'Мир', value: 'Забытые королевства, Побережье Мечей' },
      { label: 'Движок', value: 'Infinity Engine' },
      { label: 'Носитель', value: '5 [[cdrom|компакт-дисков]]' },
      { label: 'Дополнение', value: 'Tales of the Sword Coast (1999)' }
    ]
  },
  lead: `<strong>Baldur's Gate</strong> — ролевая игра канадской студии BioWare по правилам Advanced Dungeons & Dragons, изданная Interplay в декабре 1998 года. Воспитанник мудреца Горайона из крепости-библиотеки Свечей Крепость после гибели наставника расследует заговор, связанный с нехваткой железа на Побережье Мечей, и узнаёт тайну собственного происхождения.

Игра вернула интерес к классическим компьютерным ролевым играм, которые в середине 1990-х многие считали умирающим жанром. Её движок Infinity Engine с боем в реальном времени с паузой лёг в основу Planescape: Torment и других игр.`,
  sections: [
    { id: 'bioware', title: 'BioWare', content: `Студию BioWare основали в 1995 году в канадском Эдмонтоне трое врачей — Рэй Музика, Грег Зещук и Огастин Ип. Их первой игрой был робот-симулятор Shattered Steel (1996). Baldur's Gate начинался как проект под названием Battleground: Infinity, и лишь после интереса Interplay, владевшей лицензией на AD&D, получил мир Забытых королевств.` },
    { id: 'story', title: 'Сюжет', content: `На Побережье Мечей железо внезапно стало ломким, торговые караваны гибнут от нападений бандитов, а между городом Врата Балдура и государством Амн назревает война. За кризисом стоит торговое объединение «Железный трон» и загадочный воин в рогатом шлеме — Саревок.

Главный герой постепенно узнаёт, что он — одно из детей Баала, убитого бога убийства, а Саревок — его единокровный брат, стремящийся к божественной силе через кровопролитие. Тема наследия и выбора между тьмой и светом проходит через всю игру.` },
    { id: 'gameplay', title: 'Игровой процесс', content: `Игрок управляет отрядом до шести персонажей. Бой идёт в реальном времени, но в любой момент можно поставить игру на паузу и раздать приказы — это сочетает темп стратегии с тактикой настольной игры. Правила AD&D задают классы, мировоззрение, спасброски и знаменитую «нулевую» броню, где меньше — лучше.

Мир показан в изометрии на рисованных вручную задниках высокого разрешения. Его можно исследовать почти свободно: побережье, леса, шахты, город Врата Балдура с десятками зданий.` },
    { id: 'companions', title: 'Спутники', content: `Особую славу игре принесли спутники с собственными характерами и репликами: подруга детства героя воровка Имоен, друидесса Джахейра и её муж Халид, злой волшебник Эдвин и особенно рейнджер Минск с ручным хомяком Бу, которого он называет «миниатюрным гигантским космическим хомяком». Некоторые спутники ссорятся между собой и даже покидают отряд, если герой поступает против их убеждений.` },
    { id: 'infinity', title: 'Infinity Engine', content: `<table class="interpedia-wikitable">
<tr><th>Игра</th><th>Разработчик</th><th>Статус на конец 1999</th></tr>
<tr><td>Baldur's Gate</td><td>BioWare</td><td>вышла в декабре 1998</td></tr>
<tr><td>Tales of the Sword Coast</td><td>BioWare</td><td>дополнение, апрель 1999</td></tr>
<tr><td>Planescape: Torment</td><td>Black Isle Studios</td><td>вышла в декабре 1999</td></tr>
<tr><td>Icewind Dale</td><td>Black Isle Studios</td><td>в разработке</td></tr>
<tr><td>Baldur's Gate II</td><td>BioWare</td><td>в разработке</td></tr>
</table>` },
    { id: 'reception', title: 'Отзывы', content: `Baldur's Gate признали одной из лучших ролевых игр десятилетия и вместе с [[fallout|Fallout]] относят к главным играм, вернувшим жанр на вершину. Отмечали объём игры — более ста часов, — сюжет и спутников; критиковали медленный поиск пути и частую смену пяти дисков. В российских [[lanparty|клубах]] игру проходили вместе: Baldur's Gate поддерживает совместную игру по сети.` }
  ],
  seeAlso: ['bioware98', 'fallout', 'fallout2', 'diablo', 'homm3'],
  references: [
    'Baldur\'s Gate: руководство пользователя. — Interplay, 1998.',
    'Computer Gaming World. Обзор Baldur\'s Gate. — 1999.',
    'TSR. Advanced Dungeons & Dragons Player\'s Handbook, 2nd Edition. — 1989.'
  ],
  links: [['http://www.igromania.ru', 'Журнал «Игромания»']],
  categories: ['Видеоигры 1998 года', 'Ролевые игры', 'BioWare', 'Dungeons & Dragons']
}, {
  title: 'Baldur\'s Gate (1998)',
  infobox: {
    title: 'Baldur\'s Gate',
    badgeText: 'BioWare / Black Isle',
    fields: [
      { label: 'Developer', value: 'BioWare' },
      { label: 'Publisher', value: 'Interplay (Black Isle Studios)' },
      { label: 'Released', value: 'December 21, 1998' },
      { label: 'Genre', value: 'role-playing game' },
      { label: 'Rules', value: 'Advanced Dungeons & Dragons, 2nd edition' },
      { label: 'Setting', value: 'Forgotten Realms, Sword Coast' },
      { label: 'Engine', value: 'Infinity Engine' },
      { label: 'Media', value: '5 [[cdrom|CD-ROMs]]' },
      { label: 'Expansion', value: 'Tales of the Sword Coast (1999)' }
    ]
  },
  lead: `<strong>Baldur's Gate</strong> is a role-playing game by the Canadian studio BioWare based on Advanced Dungeons & Dragons, published by Interplay in December 1998. After the death of the sage Gorion, his ward from the library fortress of Candlekeep investigates a conspiracy behind an iron shortage on the Sword Coast and learns the secret of the hero's own origins.

The game revived interest in classic computer role-playing games, a genre many considered dying in the mid-1990s. Its Infinity Engine, with real-time combat that can be paused, became the base for Planescape: Torment and other games.`,
  sections: [
    { id: 'bioware', title: 'BioWare', content: `BioWare was founded in 1995 in Edmonton, Canada, by three doctors: Ray Muzyka, Greg Zeschuk and Augustine Yip. Their first game was the robot simulator Shattered Steel (1996). Baldur's Gate began as a project called Battleground: Infinity, and only after interest from Interplay, which held the AD&D license, did it get the Forgotten Realms setting.` },
    { id: 'story', title: 'Story', content: `On the Sword Coast iron has suddenly become brittle, trade caravans fall to bandits, and war looms between the city of Baldur's Gate and the nation of Amn. Behind the crisis stand the Iron Throne trading consortium and a mysterious warrior in a horned helmet, Sarevok.

The hero gradually discovers a descent from Bhaal, the slain god of murder, and learns that Sarevok, another child of Bhaal, seeks divine power through bloodshed. The theme of inheritance and the choice between darkness and light runs through the whole game.` },
    { id: 'gameplay', title: 'Gameplay', content: `The player controls a party of up to six characters. Combat runs in real time, but the game can be paused at any moment to give orders, combining the pace of a strategy game with tabletop tactics. AD&D rules define classes, alignment, saving throws and the famous armor class where lower is better.

The world is shown in isometric view over hand-painted high-resolution backgrounds. It can be explored almost freely: the coast, forests, mines and the city of Baldur's Gate with dozens of buildings.` },
    { id: 'companions', title: 'Companions', content: `The game is best loved for companions with their own personalities and lines: the hero's childhood friend Imoen the thief, the druid Jaheira and her husband Khalid, the evil wizard Edwin, and above all the ranger Minsc and his pet Boo, whom he calls a "miniature giant space hamster". Some companions quarrel with each other and even leave the party if the hero acts against their beliefs.` },
    { id: 'infinity', title: 'Infinity Engine', content: `<table class="interpedia-wikitable">
<tr><th>Game</th><th>Developer</th><th>Status at end of 1999</th></tr>
<tr><td>Baldur's Gate</td><td>BioWare</td><td>released December 1998</td></tr>
<tr><td>Tales of the Sword Coast</td><td>BioWare</td><td>expansion, April 1999</td></tr>
<tr><td>Planescape: Torment</td><td>Black Isle Studios</td><td>released December 1999</td></tr>
<tr><td>Icewind Dale</td><td>Black Isle Studios</td><td>in development</td></tr>
<tr><td>Baldur's Gate II</td><td>BioWare</td><td>in development</td></tr>
</table>` },
    { id: 'reception', title: 'Reception', content: `Baldur's Gate is counted among the best role-playing games of the decade and, together with [[fallout|Fallout]], among the games that put the genre back on top. Reviewers praised its size, over a hundred hours, its story and companions, and criticized slow pathfinding and frequent swapping of five discs. In Russian [[lanparty|clubs]] people played it together, since Baldur's Gate supports cooperative network play.` }
  ],
  seeAlso: ['bioware98', 'fallout', 'fallout2', 'diablo', 'homm3'],
  references: [
    'Baldur\'s Gate user manual. Interplay, 1998.',
    'Computer Gaming World, Baldur\'s Gate review, 1999.',
    'TSR. Advanced Dungeons & Dragons Player\'s Handbook, 2nd Edition, 1989.'
  ],
  links: [['http://www.igromania.ru', 'Igromania magazine']],
  categories: ['1998 Video Games', 'Role-Playing Games', 'BioWare', 'Dungeons & Dragons']
});

window.interpediaReg('diablo', 'games', {
  title: 'Diablo (1996)',
  infobox: {
    title: 'Diablo',
    badgeText: 'Blizzard Entertainment',
    fields: [
      { label: 'Разработчик', value: 'Blizzard North' },
      { label: 'Издатель', value: 'Blizzard Entertainment' },
      { label: 'Дата выхода', value: '31 декабря 1996' },
      { label: 'Жанр', value: 'ролевой боевик (action-RPG)' },
      { label: 'Платформа', value: 'Win 95' },
      { label: 'Классы', value: 'воин, разбойница, чародей' },
      { label: 'Сетевая служба', value: 'Battle.net' },
      { label: 'Музыка', value: 'Мэтт Ульмен' },
      { label: 'Дополнение', value: 'Hellfire (1997, Sierra)' }
    ]
  },
  lead: `<strong>Diablo</strong> — ролевой боевик Blizzard Entertainment, вышедший в последний день 1996 года. Герой спускается в лабиринты под собором городка Тристрам, чтобы на шестнадцатом уровне сразиться с Диабло, Владыкой Ужаса.

Diablo упростил ролевую игру до непрерывного действия: щелчок мышью — удар, а каждый побеждённый враг может оставить случайный предмет. Подземелья генерируются заново при каждой игре, а бесплатная служба Battle.net, запущенная вместе с игрой, позволила проходить её вместе через Интернет.`,
  sections: [
    { id: 'development', title: 'Разработка', content: `Игру придумали братья Макс и Эрих Шефер и Дэвид Бревик из калифорнийской студии Condor Games. Первоначально Diablo задумывался как пошаговая игра в духе «рогаликов», но Бревик убедил коллег перейти на реальное время — и решение определило характер игры. В 1996 году Blizzard купила студию, переименовав её в Blizzard North.` },
    { id: 'story', title: 'Сюжет', content: `Тристрам охвачен ужасом: король Леорик сошёл с ума, его сын похищен, а из-под собора выходят демоны. Герой спускается через катакомбы, пещеры и подземный ад, встречая архиепископа Лазаря и чудовищного Мясника с его знаменитым «Ah, fresh meat!» («А, свежее мясо!»). В городе героя ждут старый сказитель Декард Каин («Останься и послушай...»), кузнец Гризвольд и целительница Пепин.

Победив Диабло, герой вонзает его камень души себе в лоб, надеясь удержать демона в себе, и уходит из Тристрама.` },
    { id: 'gameplay', title: 'Игровой процесс', content: `Персонаж — воин, разбойница или чародей — растёт в уровнях, распределяет очки по силе, магии, ловкости и живучести и учит заклинания из книг. Предметы получают случайные приставки и суффиксы — например, «Меч Короля Небес» — и бывают обычными, магическими и уникальными. Это превращает игру в бесконечную охоту за лучшей добычей.

Подземелья, расположение монстров и задания меняются при каждой новой игре, поэтому Diablo можно проходить многократно.` },
    { id: 'battlenet', title: 'Battle.net', content: `Вместе с Diablo Blizzard запустила Battle.net — бесплатную службу для поиска партнёров и игры через Интернет. До четырёх игроков могут вместе спуститься в подземелье. Персонажи хранились на компьютерах игроков, и вскоре Battle.net наводнили взломщики, копировавшие предметы и убивавшие других игроков. Этот опыт Blizzard учитывает при создании [[diablo2|Diablo II]].` },
    { id: 'music', title: 'Музыка', content: `Композитор Мэтт Ульмен написал для Тристрама спокойную тему на акустической гитаре, которая контрастирует с тревожными звуками подземелий и стала одной из самых узнаваемых мелодий в играх.` },
    { id: 'legacy', title: 'Значение', content: `Diablo продавался огромными тиражами и породил множество подражателей. Официальное дополнение Hellfire (1997) создала не Blizzard, а студия Synergistic по заказу Sierra. Продолжение, [[diablo2|Diablo II]], ожидается в 2000 году.` }
  ],
  seeAlso: ['diablo2', 'starcraft', 'baldursgate', 'fallout', 'steam'],
  references: [
    'Diablo: руководство пользователя. — Blizzard Entertainment, 1996.',
    'Computer Gaming World. Обзор Diablo. — 1997.',
    'Журнал «Страна игр», обзор Diablo, 1997.'
  ],
  links: [['http://www.cheatcc.com', 'Cheat Code Central: Diablo']],
  categories: ['Видеоигры 1996 года', 'Ролевые игры', 'Blizzard Entertainment']
}, {
  title: 'Diablo (1996)',
  infobox: {
    title: 'Diablo',
    badgeText: 'Blizzard Entertainment',
    fields: [
      { label: 'Developer', value: 'Blizzard North' },
      { label: 'Publisher', value: 'Blizzard Entertainment' },
      { label: 'Released', value: 'December 31, 1996' },
      { label: 'Genre', value: 'action role-playing game' },
      { label: 'Platform', value: 'Win 95' },
      { label: 'Classes', value: 'Warrior, Rogue, Sorcerer' },
      { label: 'Online service', value: 'Battle.net' },
      { label: 'Music', value: 'Matt Uelmen' },
      { label: 'Expansion', value: 'Hellfire (1997, Sierra)' }
    ]
  },
  lead: `<strong>Diablo</strong> is an action role-playing game from Blizzard Entertainment released on the last day of 1996. The hero descends into the labyrinths beneath the cathedral of the town of Tristram to face Diablo, the Lord of Terror, on the sixteenth level.

Diablo boiled role-playing down to constant action: a mouse click is a blow, and every defeated enemy may drop a random item. Dungeons are generated anew in every game, and the free Battle.net service, launched with the game, let people play it together over the Internet.`,
  sections: [
    { id: 'development', title: 'Development', content: `The game was created by brothers Max and Erich Schaefer and David Brevik of the Californian studio Condor Games. Diablo was first conceived as a turn-based roguelike, but Brevik persuaded his colleagues to switch to real time, a decision that defined the game. In 1996 Blizzard bought the studio and renamed it Blizzard North.` },
    { id: 'story', title: 'Story', content: `Tristram is gripped by terror: King Leoric has gone mad, his son has been abducted, and demons are crawling out from under the cathedral. The hero descends through catacombs, caves and an underground hell, meeting Archbishop Lazarus and the monstrous Butcher with his famous "Ah, fresh meat!" In town the hero is helped by the old storyteller Deckard Cain ("Stay awhile and listen..."), Griswold the blacksmith and Pepin the healer.

After defeating Diablo, the hero drives the demon's soulstone into the hero's own forehead, hoping to contain him, and leaves Tristram.` },
    { id: 'gameplay', title: 'Gameplay', content: `The character, a Warrior, Rogue or Sorcerer, gains levels, distributes points among Strength, Magic, Dexterity and Vitality, and learns spells from books. Items get random prefixes and suffixes, such as "King's Sword of Haste", and come as normal, magic or unique. This turns the game into an endless hunt for better loot.

Dungeons, monster placement and quests change with every new game, so Diablo can be replayed many times.` },
    { id: 'battlenet', title: 'Battle.net', content: `With Diablo, Blizzard launched Battle.net, a free service for finding partners and playing over the Internet. Up to four players can descend into the dungeon together. Characters were stored on players' own computers, and Battle.net was soon flooded with hackers duplicating items and killing other players. Blizzard is taking that experience into account in [[diablo2|Diablo II]].` },
    { id: 'music', title: 'Music', content: `Composer Matt Uelmen wrote a calm acoustic guitar theme for Tristram that contrasts with the uneasy sounds of the dungeons and became one of the most recognizable tunes in games.` },
    { id: 'legacy', title: 'Significance', content: `Diablo sold in huge numbers and inspired many imitators. The official expansion Hellfire (1997) was made not by Blizzard but by Synergistic for Sierra. The sequel, [[diablo2|Diablo II]], is expected in 2000.` }
  ],
  seeAlso: ['diablo2', 'starcraft', 'baldursgate', 'fallout', 'steam'],
  references: [
    'Diablo user manual. Blizzard Entertainment, 1996.',
    'Computer Gaming World, Diablo review, 1997.',
    'Strana Igr magazine, Diablo review, 1997.'
  ],
  links: [['http://www.cheatcc.com', 'Cheat Code Central: Diablo']],
  categories: ['1996 Video Games', 'Role-Playing Games', 'Blizzard Entertainment']
});

window.interpediaReg('diablo2', 'games', {
  title: 'Diablo II',
  hatnote: 'Статья о готовящейся игре. Сведения актуальны на декабрь 1999 года и основаны на заявлениях разработчиков и предварительных обзорах.',
  infobox: {
    title: 'Diablo II',
    badgeText: 'Blizzard Entertainment',
    fields: [
      { label: 'Разработчик', value: 'Blizzard North' },
      { label: 'Издатель', value: 'Blizzard Entertainment' },
      { label: 'Выход', value: 'ожидается в 2000 году' },
      { label: 'Жанр', value: 'ролевой боевик (action-RPG)' },
      { label: 'Классы', value: 'амазонка, некромант, варвар, волшебница, паладин' },
      { label: 'Акты', value: '4' },
      { label: 'Сетевая служба', value: 'Battle.net (закрытые серверы)' },
      { label: 'Предшественник', value: '[[diablo|Diablo]] (1996)' }
    ]
  },
  lead: `<strong>Diablo II</strong> — готовящееся продолжение ролевого боевика [[diablo|Diablo]], которое разрабатывает Blizzard North. Игра объявлена в 1997 году; её выход несколько раз переносился и, по последним заявлениям Blizzard, ожидается в 2000 году.

Сюжет продолжает историю первой части: герой, победивший Диабло, под властью демона странствует на восток, оставляя за собой разрушения. В игре будет пять новых классов с деревьями умений, четыре акта в разных частях мира Санктуарий и закрытые серверы Battle.net, на которых персонажей нельзя будет подделать.`,
  sections: [
    { id: 'announcement', title: 'Анонс и переносы', content: `Работа над продолжением началась вскоре после выхода [[diablo|Diablo]]. Blizzard рассчитывала выпустить игру в 1998 году, но разработка растянулась: объём игры вырос в несколько раз, а студия параллельно выпускала [[starcraft|StarCraft]]. В 1999 году Blizzard показывала Diablo II на выставках и в журналах, но вновь отложила выход, на этот раз на 2000 год, объясняя это желанием довести игру до нужного качества.` },
    { id: 'story', title: 'Сюжет', content: `По сообщениям разработчиков, повествование построено вокруг Тёмного странника — героя первой игры, внутри которого пробудился Диабло. Он идёт на восток, чтобы освободить из заточения братьев Диабло — Мефисто, Владыку Ненависти, и Баала, Владыку Разрушения. Игрок следует за ним через четыре акта:

<ol>
<li>лагерь разбойниц и монастырь в западных землях;</li>
<li>пустынный город Лут Голейн;</li>
<li>джунгли и храмы Кураста;</li>
<li>Крепость Пандемония на границе ада.</li>
</ol>

Связующие ролики создаёт кинематографический отдел Blizzard.` },
    { id: 'classes', title: 'Классы и умения', content: `<table class="interpedia-wikitable">
<tr><th>Класс</th><th>Специализация</th></tr>
<tr><td>Амазонка</td><td>лук, копья и дротики, пассивные умения уклонения</td></tr>
<tr><td>Некромант</td><td>проклятия, яды и армия скелетов</td></tr>
<tr><td>Варвар</td><td>боевые кличи, владение оружием, бой двумя клинками</td></tr>
<tr><td>Волшебница</td><td>магия огня, холода и молнии</td></tr>
<tr><td>Паладин</td><td>ауры, поддерживающие отряд, и боевые умения</td></tr>
</table>

У каждого класса три дерева умений; очки умений распределяются с ростом уровня, и более сильные навыки требуют вложений в предыдущие. Это должно сделать двух персонажей одного класса непохожими друг на друга.` },
    { id: 'features', title: 'Нововведения', content: `<ul>
<li>Обширные открытые территории под открытым небом вместо одного подземелья, смена дня и ночи.</li>
<li>Бег, расходующий выносливость, и наёмники-помощники.</li>
<li>Новые виды предметов: наборы, уникальные вещи с собственными именами, предметы с гнёздами для драгоценных камней.</li>
<li>Хорадрический куб — артефакт, позволяющий комбинировать предметы по рецептам.</li>
<li>Поддержка 3D-ускорителей для световых эффектов.</li>
</ul>` },
    { id: 'battlenet', title: 'Закрытые серверы Battle.net', content: `После проблем с читерством в первой части Blizzard вводит «закрытые» серверы Battle.net: персонажи будут храниться не на компьютерах игроков, а на серверах компании, что не позволит их редактировать. Для любителей игры по локальной сети и без контроля сохранится «открытый» режим.` },
    { id: 'expectations', title: 'Ожидания', content: `Diablo II — одна из самых ожидаемых игр 2000 года. Игровые журналы публикуют скриншоты и интервью с разработчиками, а форумы обсуждают, какой класс окажется сильнее. В России игра ждёт своего часа в [[lanparty|компьютерных клубах]], где первая часть до сих пор не сходит с экранов.` }
  ],
  seeAlso: ['diablo', 'starcraft', 'baldursgate', 'fallout2', 'ashroad', 'steam'],
  references: [
    'Пресс-релизы Blizzard Entertainment о Diablo II, 1997–1999.',
    'Предварительный обзор Diablo II // PC Gamer. — 1999.',
    'Журнал «Страна игр», репортаж с выставки ECTS, 1999.'
  ],
  links: [['http://forum.games98.com', 'Форум GamerZone: ожидание Diablo II']],
  categories: ['Ожидаемые видеоигры', 'Ролевые игры', 'Blizzard Entertainment']
}, {
  title: 'Diablo II',
  hatnote: 'This article covers an upcoming game. Information is current as of December 1999 and based on developer statements and previews.',
  infobox: {
    title: 'Diablo II',
    badgeText: 'Blizzard Entertainment',
    fields: [
      { label: 'Developer', value: 'Blizzard North' },
      { label: 'Publisher', value: 'Blizzard Entertainment' },
      { label: 'Release', value: 'expected in 2000' },
      { label: 'Genre', value: 'action role-playing game' },
      { label: 'Classes', value: 'Amazon, Necromancer, Barbarian, Sorceress, Paladin' },
      { label: 'Acts', value: '4' },
      { label: 'Online service', value: 'Battle.net (closed realms)' },
      { label: 'Predecessor', value: '[[diablo|Diablo]] (1996)' }
    ]
  },
  lead: `<strong>Diablo II</strong> is the upcoming sequel to the action role-playing game [[diablo|Diablo]], being developed by Blizzard North. Announced in 1997, it has been delayed several times and, according to Blizzard's latest statements, is expected in 2000.

The story continues from the first game: the hero who defeated Diablo now wanders east under the demon's control, leaving destruction behind. The game will have five new classes with skill trees, four acts in different parts of the world of Sanctuary, and closed Battle.net realms where characters cannot be forged.`,
  sections: [
    { id: 'announcement', title: 'Announcement and delays', content: `Work on the sequel began soon after [[diablo|Diablo]] came out. Blizzard hoped to release it in 1998, but development stretched on: the game grew several times larger, and the company was also finishing [[starcraft|StarCraft]]. In 1999 Blizzard showed Diablo II at trade shows and in magazines but delayed it again, this time to 2000, saying it wanted the game to reach the right quality.` },
    { id: 'story', title: 'Story', content: `According to the developers, the story centers on the Dark Wanderer, the hero of the first game, inside whom Diablo has awakened. He travels east to free Diablo's imprisoned brothers, Mephisto, Lord of Hatred, and Baal, Lord of Destruction. The player follows him through four acts:

<ol>
<li>the Rogue encampment and monastery in the western lands;</li>
<li>the desert city of Lut Gholein;</li>
<li>the jungles and temples of Kurast;</li>
<li>the Pandemonium Fortress on the border of hell.</li>
</ol>

The connecting cinematics are made by Blizzard's film department.` },
    { id: 'classes', title: 'Classes and skills', content: `<table class="interpedia-wikitable">
<tr><th>Class</th><th>Specialty</th></tr>
<tr><td>Amazon</td><td>bows, spears and javelins, passive evasion skills</td></tr>
<tr><td>Necromancer</td><td>curses, poison and an army of skeletons</td></tr>
<tr><td>Barbarian</td><td>war cries, weapon mastery, fighting with two blades</td></tr>
<tr><td>Sorceress</td><td>fire, cold and lightning magic</td></tr>
<tr><td>Paladin</td><td>party-supporting auras and combat skills</td></tr>
</table>

Each class has three skill trees; skill points are spent as the character levels up, and stronger skills require investment in earlier ones. This should make two characters of the same class play differently.` },
    { id: 'features', title: 'What\'s new', content: `<ul>
<li>Large open outdoor areas instead of a single dungeon, with day and night.</li>
<li>Running that uses stamina, and hired helpers.</li>
<li>New kinds of items: sets, named unique items, and items with sockets for gems.</li>
<li>The Horadric Cube, an artifact for combining items by recipe.</li>
<li>3D accelerator support for lighting effects.</li>
</ul>` },
    { id: 'battlenet', title: 'Closed Battle.net realms', content: `After the cheating problems of the first game, Blizzard is introducing "closed" Battle.net realms: characters will be stored on the company's servers rather than on players' computers, so they cannot be edited. An "open" mode will remain for LAN play and players who do not need oversight.` },
    { id: 'expectations', title: 'Expectations', content: `Diablo II is one of the most anticipated games of 2000. Magazines publish screenshots and developer interviews, and forums argue about which class will be strongest. In Russia the game is awaited in [[lanparty|computer clubs]], where the first game is still on the screens.` }
  ],
  seeAlso: ['diablo', 'starcraft', 'baldursgate', 'fallout2', 'ashroad', 'steam'],
  references: [
    'Blizzard Entertainment press releases on Diablo II, 1997–1999.',
    'Diablo II preview. PC Gamer, 1999.',
    'Strana Igr magazine, ECTS show report, 1999.'
  ],
  links: [['http://forum.games98.com', 'GamerZone Forum: waiting for Diablo II']],
  categories: ['Upcoming Video Games', 'Role-Playing Games', 'Blizzard Entertainment']
});

window.interpediaReg('starcraft', 'games', {
  title: 'StarCraft (1998)',
  infobox: {
    title: 'StarCraft',
    badgeText: 'Blizzard Entertainment',
    fields: [
      { label: 'Разработчик', value: 'Blizzard Entertainment' },
      { label: 'Издатель', value: 'Blizzard Entertainment' },
      { label: 'Дата выхода', value: '31 марта 1998' },
      { label: 'Жанр', value: 'стратегия в реальном времени' },
      { label: 'Расы', value: 'терраны, зерги, протоссы' },
      { label: 'Сетевая игра', value: 'до 8 игроков, Battle.net, локальная сеть' },
      { label: 'Дополнение', value: 'Brood War (ноябрь 1998)' },
      { label: 'Редактор', value: 'StarEdit' }
    ]
  },
  lead: `<strong>StarCraft</strong> — научно-фантастическая стратегия в реальном времени Blizzard Entertainment, вышедшая 31 марта 1998 года. В далёком секторе Копрулу сталкиваются три расы: терраны — потомки ссыльных колонистов с Земли, зерги — рой существ, поглощающих чужие гены, и протоссы — древняя раса воинов с псионическими способностями.

Главное достижение игры — баланс трёх совершенно разных сторон, у каждой из которых свои постройки, войска и манера ведения войны. StarCraft стал одной из самых продаваемых игр 1998 года, а в Южной Корее превратился в национальное увлечение с профессиональными игроками и телевизионными трансляциями.`,
  sections: [
    { id: 'development', title: 'Разработка', content: `Blizzard объявила StarCraft после успеха [[warcraft2|Warcraft II]] (1995). Первую версию, показанную на выставке E3 1996 года на движке Warcraft II, журналисты насмешливо окрестили «орками в космосе». Компания переработала игру практически с нуля: новый движок, изометрическая графика, по-настоящему разные расы. Выход несколько раз переносился и состоялся весной 1998 года.` },
    { id: 'races', title: 'Расы', content: `<table class="interpedia-wikitable">
<tr><th>Раса</th><th>Особенности</th><th>Примеры войск</th></tr>
<tr><td>Терраны</td><td>универсальные; здания могут взлетать и перелетать, рабочие чинят технику</td><td>морпехи, осадные танки, крейсеры</td></tr>
<tr><td>Зерги</td><td>многочисленные и дешёвые; строят только на слизи, все войска рождаются из личинок</td><td>зерглинги, гидралиски, муталиски</td></tr>
<tr><td>Протоссы</td><td>дорогие и мощные; защитные щиты, постройки телепортируются через пилоны</td><td>зилоты, драгуны, авианосцы</td></tr>
</table>

Каждая раса требует собственной стратегии: зерги давят числом и скоростью, протоссы — качеством, терраны — обороной и гибкостью.` },
    { id: 'story', title: 'Сюжет', content: `Кампания из трёх эпизодов по десять миссий ведёт игрока за каждую расу по очереди. Колониальный маршал Джим Рейнор вступает в повстанческое движение Арктура Менгска, который ради власти обрекает на гибель целую планету и предаёт своего офицера, телепатку Сару Керриган. Захваченная зергами Керриган становится Королевой клинков. Протосс Тассадар, нарушив законы своего народа, объединяется с изгнанниками-тёмными тамплиерами Зератула, чтобы уничтожить Сверхразум зергов.

Дополнение Brood War (ноябрь 1998) продолжает историю: в борьбу вмешивается земной экспедиционный флот, а Керриган начинает собственную игру.` },
    { id: 'multiplayer', title: 'Сетевая игра и Battle.net', content: `До восьми игроков сражаются по локальной сети или через бесплатную службу Battle.net. Сетевые матчи требуют быстрой реакции и контроля сотен действий в минуту, и вокруг игры быстро сложилось соревновательное сообщество с рейтингами и турнирами.

Редактор StarEdit, входящий в комплект, позволяет создавать собственные карты и сценарии с триггерами. Пользовательские карты превращают StarCraft в совершенно другие игры — от защиты башен до ролевых приключений и [[dota|командных арен 5 на 5]].` },
    { id: 'korea', title: 'Феномен Южной Кореи', content: `Особой популярности StarCraft достиг в Южной Корее, где после экономического кризиса 1997 года по всей стране открылись тысячи компьютерных клубов («PC-банги») с быстрым Интернетом. В 1999 году там начали проводить профессиональные лиги, а матчи показывают по телевидению. Лучшие игроки получают зарплату и спонсорские контракты, как спортсмены.` },
    { id: 'russia', title: 'StarCraft в России', content: `В России StarCraft вместе с [[quake2|Quake II]] — главная игра [[lanparty|компьютерных клубов]] конца 1990-х. Посетители проводят ночи за сетевыми партиями, а слова «раш зерглингами» знакомы каждому завсегдатаю. Игра распространяется и в виде пиратских сборников на [[gorbushka|Горбушке]] вместе с дополнением.` }
  ],
  seeAlso: ['warcraft2', 'dota', 'redalert', 'ageofempires', 'diablo', 'lanparty', 'homm3'],
  references: [
    'StarCraft: руководство пользователя. — Blizzard Entertainment, 1998.',
    'Computer Gaming World. Обзор StarCraft. — 1998.',
    'Журнал «Страна игр», обзор StarCraft: Brood War, 1999.'
  ],
  links: [['http://forum.games98.com', 'Форум GamerZone: тактика StarCraft'], ['http://www.cheatcc.com', 'Cheat Code Central: StarCraft']],
  categories: ['Видеоигры 1998 года', 'Стратегии в реальном времени', 'Blizzard Entertainment']
}, {
  title: 'StarCraft (1998)',
  infobox: {
    title: 'StarCraft',
    badgeText: 'Blizzard Entertainment',
    fields: [
      { label: 'Developer', value: 'Blizzard Entertainment' },
      { label: 'Publisher', value: 'Blizzard Entertainment' },
      { label: 'Released', value: 'March 31, 1998' },
      { label: 'Genre', value: 'real-time strategy' },
      { label: 'Races', value: 'Terran, Zerg, Protoss' },
      { label: 'Multiplayer', value: 'up to 8 players, Battle.net, LAN' },
      { label: 'Expansion', value: 'Brood War (November 1998)' },
      { label: 'Editor', value: 'StarEdit' }
    ]
  },
  lead: `<strong>StarCraft</strong> is a science fiction real-time strategy game from Blizzard Entertainment released on March 31, 1998. In the distant Koprulu Sector three races clash: the Terrans, descendants of exiled colonists from Earth; the Zerg, a swarm that absorbs the genes of other species; and the Protoss, an ancient warrior race with psionic powers.

The game's greatest achievement is the balance of three completely different sides, each with its own buildings, units and style of war. StarCraft became one of the best-selling games of 1998, and in South Korea it turned into a national passion with professional players and televised matches.`,
  sections: [
    { id: 'development', title: 'Development', content: `Blizzard announced StarCraft after the success of [[warcraft2|Warcraft II]] (1995). The first version, shown at E3 1996 on the Warcraft II engine, was mockingly dubbed "orcs in space" by journalists. The company rebuilt the game almost from scratch: a new engine, isometric graphics and truly different races. The release slipped several times and came in spring 1998.` },
    { id: 'races', title: 'Races', content: `<table class="interpedia-wikitable">
<tr><th>Race</th><th>Traits</th><th>Example units</th></tr>
<tr><td>Terran</td><td>versatile; buildings can lift off and fly, workers repair machines</td><td>marines, siege tanks, battlecruisers</td></tr>
<tr><td>Zerg</td><td>numerous and cheap; build only on creep, all units hatch from larvae</td><td>zerglings, hydralisks, mutalisks</td></tr>
<tr><td>Protoss</td><td>expensive and powerful; shields, buildings warp in through pylons</td><td>zealots, dragoons, carriers</td></tr>
</table>

Each race needs its own strategy: the Zerg win by numbers and speed, the Protoss by quality, the Terrans by defense and flexibility.` },
    { id: 'story', title: 'Story', content: `A campaign of three ten-mission episodes takes the player through each race in turn. Colonial marshal Jim Raynor joins Arcturus Mengsk's rebels, but Mengsk dooms an entire planet for power and betrays his officer, the telepath Sarah Kerrigan. Captured by the Zerg, Kerrigan becomes the Queen of Blades. The Protoss Tassadar breaks his people's laws and allies with Zeratul's outcast Dark Templar to destroy the Zerg Overmind.

The Brood War expansion (November 1998) continues the story: an expeditionary fleet from Earth joins the fight, and Kerrigan begins playing her own game.` },
    { id: 'multiplayer', title: 'Multiplayer and Battle.net', content: `Up to eight players fight over a LAN or through the free Battle.net service. Online matches demand fast reactions and hundreds of actions per minute, and a competitive community with rankings and tournaments quickly formed around the game.

The bundled StarEdit editor lets players build their own maps and trigger-driven scenarios. Custom maps turn StarCraft into entirely different games, from tower defense to role-playing adventures and [[dota|5v5 team battle arenas]].` },
    { id: 'korea', title: 'The South Korean phenomenon', content: `StarCraft became especially popular in South Korea, where thousands of computer clubs ("PC bangs") with fast Internet opened across the country after the 1997 economic crisis. In 1999 professional leagues began there, and matches are shown on television. The best players earn salaries and sponsorship deals like athletes.` },
    { id: 'russia', title: 'StarCraft in Russia', content: `In Russia StarCraft and [[quake2|Quake II]] are the main games of late-1990s [[lanparty|computer clubs]]. Visitors spend nights on network matches, and every regular knows what a "zergling rush" is. The game also circulates on pirate compilations with the expansion at [[gorbushka|Gorbushka]].` }
  ],
  seeAlso: ['warcraft2', 'dota', 'redalert', 'ageofempires', 'diablo', 'lanparty', 'homm3'],
  references: [
    'StarCraft user manual. Blizzard Entertainment, 1998.',
    'Computer Gaming World, StarCraft review, 1998.',
    'Strana Igr magazine, StarCraft: Brood War review, 1999.'
  ],
  links: [['http://forum.games98.com', 'GamerZone Forum: StarCraft tactics'], ['http://www.cheatcc.com', 'Cheat Code Central: StarCraft']],
  categories: ['1998 Video Games', 'Real-Time Strategy', 'Blizzard Entertainment']
});

window.interpediaReg('redalert', 'games', {
  title: 'Command & Conquer: Red Alert (1996)',
  infobox: {
    title: 'C&C: Red Alert',
    badgeText: 'Westwood Studios',
    fields: [
      { label: 'Разработчик', value: 'Westwood Studios' },
      { label: 'Издатель', value: 'Virgin Interactive' },
      { label: 'Дата выхода', value: 'ноябрь 1996' },
      { label: 'Жанр', value: 'стратегия в реальном времени' },
      { label: 'Стороны', value: 'Союзники, СССР' },
      { label: 'Музыка', value: 'Фрэнк Клепаки' },
      { label: 'Дополнения', value: 'Counterstrike, The Aftermath (1997)' },
      { label: 'Носители', value: '2 [[cdrom|компакт-диска]]' }
    ]
  },
  lead: `<strong>Command & Conquer: Red Alert</strong> — стратегия в реальном времени Westwood Studios, вышедшая в ноябре 1996 года. Действие происходит в альтернативной истории: Альберт Эйнштейн отправляется в прошлое и устраняет молодого Гитлера, но без него Советский Союз Сталина начинает собственную войну за Европу.

Игра противопоставляет Союзников и СССР с их теслакатушками, «Железным занавесом» и тяжёлыми танками. Видеоролики с живыми актёрами, гротескный образ советской армии и музыка Фрэнка Клепаки сделали Red Alert одной из самых популярных стратегий 1990-х, в том числе в России, где её «клюквенный» Советский Союз воспринимают с юмором.`,
  sections: [
    { id: 'setting', title: 'Альтернативная история', content: `Пролог игры: в 1946 году Эйнштейн с помощью машины времени попадает в 1924 год и при рукопожатии стирает Гитлера из истории. Без нацистской Германии Сталин наращивает мощь и в 1950-х годах вторгается в Европу. Союзники — западные страны во главе с генералом фон Эслингом — сопротивляются вторжению.

Red Alert задумывалась как предыстория Command & Conquer (1995): в советской кампании Сталину советует загадочный Кейн, будущий лидер Братства Нод.` },
    { id: 'gameplay', title: 'Игровой процесс', content: `Игрок строит базу, добывает руду, производит войска и уничтожает противника. Стороны асимметричны:

<ul>
<li><strong>СССР</strong> — тяжёлые и «мамонтовые» танки, теслакатушки и солдаты-тесла, МиГи, «Железный занавес», делающий технику временно неуязвимой, и ядерная ракета.</li>
<li><strong>Союзники</strong> — быстрые лёгкие танки, артиллерия, флот с крейсерами, шпионы, коммандос Таня и «Хроносфера», мгновенно переносящая технику в любую точку карты.</li>
</ul>

Westwood впервые сделала боевые действия на воде полноценной частью игры.` },
    { id: 'fmv', title: 'Видеоролики', content: `Брифинги и сюжетные сцены сняты с живыми актёрами на фоне компьютерной графики. Советские генералы, Сталин и его окружение показаны в духе карикатуры времён холодной войны; русские игроки особенно ценят «советский» английский и интриги вокруг Сталина и его соратников. Кейна, как и в первой части, сыграл Джозеф Кьюкен.` },
    { id: 'music', title: 'Музыка', content: `Композитор Westwood Фрэнк Клепаки написал саундтрек на стыке индастриала и металла. Самая известная композиция, «Hell March», с маршем солдатских сапог и выкриками, открывает игру и стала гимном серии. Музыка записана на компакт-диск как обычные аудиодорожки.` },
    { id: 'multiplayer', title: 'Сетевая игра', content: `Red Alert поставлялась на двух дисках — для Союзников и для СССР, — и с одной коробкой могли играть по сети два человека. Поддерживались игра по локальной сети, через [[modem56k|модем]] и через Интернет-службу Westwood Chat. В [[lanparty|компьютерных клубах]] Red Alert соперничала с [[warcraft2|Warcraft II]], а позднее уступила место [[starcraft|StarCraft]].` },
    { id: 'legacy', title: 'Продолжения', content: `После Red Alert вышли дополнения Counterstrike и The Aftermath (1997). В 1998 году Westwood купила Electronic Arts. В августе 1999 года студия выпустила Command & Conquer: Tiberian Sun, продолжение «тибериевой» линии, а Red Alert 2 находится в разработке.` }
  ],
  seeAlso: ['starcraft', 'ageofempires', 'homm3', 'cdrom'],
  references: [
    'Command & Conquer: Red Alert: руководство пользователя. — Virgin Interactive, 1996.',
    'PC Gamer. Обзор Red Alert. — 1997.',
    'Журнал «Навигатор игрового мира», обзор Red Alert, 1997.'
  ],
  links: [['http://www.cheatcc.com', 'Cheat Code Central: Red Alert']],
  categories: ['Видеоигры 1996 года', 'Стратегии в реальном времени', 'Westwood Studios', 'Альтернативная история']
}, {
  title: 'Command & Conquer: Red Alert (1996)',
  infobox: {
    title: 'C&C: Red Alert',
    badgeText: 'Westwood Studios',
    fields: [
      { label: 'Developer', value: 'Westwood Studios' },
      { label: 'Publisher', value: 'Virgin Interactive' },
      { label: 'Released', value: 'November 1996' },
      { label: 'Genre', value: 'real-time strategy' },
      { label: 'Sides', value: 'Allies, USSR' },
      { label: 'Music', value: 'Frank Klepacki' },
      { label: 'Expansions', value: 'Counterstrike, The Aftermath (1997)' },
      { label: 'Media', value: '2 [[cdrom|CD-ROMs]]' }
    ]
  },
  lead: `<strong>Command & Conquer: Red Alert</strong> is a real-time strategy game from Westwood Studios released in November 1996. It is set in an alternate history: Albert Einstein travels back in time and removes the young Hitler, but without him Stalin's Soviet Union launches its own war for Europe.

The game pits the Allies against the USSR with its Tesla coils, Iron Curtain and heavy tanks. Live-action video, a grotesque take on the Soviet army and Frank Klepacki's music made Red Alert one of the most popular strategy games of the 1990s, including in Russia, where its cartoonish Soviet Union is taken with humor.`,
  sections: [
    { id: 'setting', title: 'Alternate history', content: `In the prologue, Einstein uses a time machine in 1946 to reach 1924 and erases Hitler from history with a handshake. Without Nazi Germany, Stalin builds up his power and invades Europe in the 1950s. The Allies, the Western nations under General von Esling, resist the invasion.

Red Alert was conceived as a prequel to Command & Conquer (1995): in the Soviet campaign Stalin is advised by the mysterious Kane, future leader of the Brotherhood of Nod.` },
    { id: 'gameplay', title: 'Gameplay', content: `The player builds a base, mines ore, produces units and destroys the enemy. The sides are asymmetrical:

<ul>
<li><strong>USSR</strong>: heavy and Mammoth tanks, Tesla coils and Tesla troopers, MiGs, the Iron Curtain that makes vehicles temporarily invulnerable, and a nuclear missile.</li>
<li><strong>Allies</strong>: fast light tanks, artillery, a navy with cruisers, spies, the commando Tanya and the Chronosphere, which instantly moves vehicles anywhere on the map.</li>
</ul>

It was the first time Westwood made naval warfare a full part of the game.` },
    { id: 'fmv', title: 'Video', content: `Briefings and story scenes were shot with live actors against computer graphics. Soviet generals, Stalin and his circle are portrayed like Cold War caricatures; Russian players especially enjoy the "Soviet" English and the intrigues around Stalin and his aides. As in the first game, Kane is played by Joseph Kucan.` },
    { id: 'music', title: 'Music', content: `Westwood composer Frank Klepacki wrote a soundtrack mixing industrial and metal. The best-known track, "Hell March", with marching boots and shouted commands, opens the game and became the series' anthem. The music is stored on the CD as ordinary audio tracks.` },
    { id: 'multiplayer', title: 'Multiplayer', content: `Red Alert came on two discs, one for the Allies and one for the USSR, so two people could play over a network with one box. It supported LAN play, [[modem56k|modem]] play and the Westwood Chat Internet service. In [[lanparty|computer clubs]] Red Alert competed with Warcraft II and later gave way to [[starcraft|StarCraft]].` },
    { id: 'legacy', title: 'Sequels', content: `Red Alert was followed by the Counterstrike and The Aftermath expansions (1997). In 1998 Westwood was bought by Electronic Arts. In August 1999 the studio released Command & Conquer: Tiberian Sun, continuing the Tiberium storyline, and Red Alert 2 is in development.` }
  ],
  seeAlso: ['starcraft', 'ageofempires', 'homm3', 'cdrom'],
  references: [
    'Command & Conquer: Red Alert user manual. Virgin Interactive, 1996.',
    'PC Gamer, Red Alert review, 1997.',
    'Navigator Igrovogo Mira magazine, Red Alert review, 1997.'
  ],
  links: [['http://www.cheatcc.com', 'Cheat Code Central: Red Alert']],
  categories: ['1996 Video Games', 'Real-Time Strategy', 'Westwood Studios', 'Alternate History']
});

window.interpediaReg('ageofempires', 'games', {
  title: 'Age of Empires (1997)',
  infobox: {
    title: 'Age of Empires',
    badgeText: 'Ensemble Studios',
    fields: [
      { label: 'Разработчик', value: 'Ensemble Studios' },
      { label: 'Издатель', value: 'Microslop' },
      { label: 'Дата выхода', value: 'октябрь 1997' },
      { label: 'Жанр', value: 'историческая стратегия в реальном времени' },
      { label: 'Цивилизации', value: '12' },
      { label: 'Эпохи', value: 'каменная, орудий, бронзовая, железная' },
      { label: 'Дополнение', value: 'The Rise of Rome (1998)' },
      { label: 'Продолжение', value: 'Age of Empires II: The Age of Kings (1999)' }
    ]
  },
  lead: `<strong>Age of Empires</strong> — историческая стратегия в реальном времени техасской студии Ensemble Studios, изданная Microslop в октябре 1997 года. Игрок ведёт одну из двенадцати древних цивилизаций — от Египта и Греции до Японии Ямато — через четыре эпохи, от каменного века до железного.

Игра соединила темп стратегий вроде [[redalert|Red Alert]] с развитием цивилизации, знакомым по Civilization, и стала одной из самых успешных игр Microslop. В сентябре 1999 года вышло продолжение — Age of Empires II: The Age of Kings.`,
  sections: [
    { id: 'development', title: 'Разработка', content: `Ensemble Studios основали в Далласе в 1995 году Тони Гудман, Рик Гудман и Брюс Шелли — соавтор Сида Мейера по первой Civilization. Шелли настаивал, что игра должна быть доступна широкой публике: исторические цивилизации и понятные ресурсы — еда, дерево, камень и золото — делают стратегию понятной даже тем, кто не играл в жанр. Движок игры получил название Genie.` },
    { id: 'gameplay', title: 'Игровой процесс', content: `Крестьяне собирают ресурсы — охотятся, ловят рыбу, рубят лес и добывают камень и золото, — а игрок строит дома, казармы и храмы. Переход в следующую эпоху открывает новые здания, улучшения и войска: от пращников и лучников до колесниц, фаланг, катапульт и боевых слонов.

Победы можно добиться разными способами: уничтожить противника, построить Чудо света и продержать его 2000 лет или собрать все артефакты и руины на карте. Жрецы обращают вражеских воинов в свою веру протяжным заклинанием, которое игроки передразнивают как «Вололо».

<table class="interpedia-wikitable">
<tr><th>Эпоха</th><th>Что открывает</th></tr>
<tr><td>Каменный век</td><td>сбор ресурсов, дубинщики</td></tr>
<tr><td>Век орудий</td><td>лучники, кавалерия-разведчики, рынок</td></tr>
<tr><td>Бронзовый век</td><td>колесницы, храмы, фаланги</td></tr>
<tr><td>Железный век</td><td>катапульты, боевые слоны, Чудо света</td></tr>
</table>` },
    { id: 'civs', title: 'Цивилизации', content: `В игре двенадцать цивилизаций, объединённых в четыре архитектурных стиля: египтяне, вавилоняне, ассирийцы, хетты, греки, минойцы, финикийцы, персы, шумеры, Ямато, Шан и Чосон. Каждая имеет свои бонусы и ограничения в дереве технологий. Дополнение The Rise of Rome (1998) добавило римлян, карфагенян, пальмирцев и македонян.` },
    { id: 'cheats', title: 'Коды', content: `Коды вводятся в окно чата. Самые известные — «BIGDADDY», дающий спортивный автомобиль с ракетной установкой, «PHOTON MAN», вызывающий футуристического солдата с лучевым ружьём, и «MEDUSA», превращающий крестьянина в Медузу, взгляд которой убивает врагов.` },
    { id: 'aoe2', title: 'Age of Empires II', content: `30 сентября 1999 года вышла Age of Empires II: The Age of Kings, перенёсшая серию в Средние века с тринадцатью цивилизациями — от франков и бриттов до монголов и японцев. Она сохраняет основы первой игры, добавив построение войск, приказы «следовать» и «охранять» и кампании о Жанне д'Арк, Чингисхане и других исторических героях.` }
  ],
  seeAlso: ['redalert', 'starcraft', 'homm3', 'simcity2000', 'sunsetvalley'],
  references: [
    'Age of Empires: руководство пользователя. — Microslop, 1997.',
    'Shelley B. Интервью журналу Computer Gaming World, 1997.',
    'Журнал «Навигатор игрового мира», обзор Age of Empires II, 1999.'
  ],
  links: [['http://www.cheatcc.com', 'Cheat Code Central: Age of Empires']],
  categories: ['Видеоигры 1997 года', 'Стратегии в реальном времени', 'Продукты Microslop', 'Исторические игры']
}, {
  title: 'Age of Empires (1997)',
  infobox: {
    title: 'Age of Empires',
    badgeText: 'Ensemble Studios',
    fields: [
      { label: 'Developer', value: 'Ensemble Studios' },
      { label: 'Publisher', value: 'Microslop' },
      { label: 'Released', value: 'October 1997' },
      { label: 'Genre', value: 'historical real-time strategy' },
      { label: 'Civilizations', value: '12' },
      { label: 'Ages', value: 'Stone, Tool, Bronze, Iron' },
      { label: 'Expansion', value: 'The Rise of Rome (1998)' },
      { label: 'Sequel', value: 'Age of Empires II: The Age of Kings (1999)' }
    ]
  },
  lead: `<strong>Age of Empires</strong> is a historical real-time strategy game by the Texas studio Ensemble Studios, published by Microslop in October 1997. The player leads one of twelve ancient civilizations, from Egypt and Greece to Yamato Japan, through four ages from the Stone Age to the Iron Age.

The game combined the pace of strategy games such as [[redalert|Red Alert]] with the civilization building familiar from Civilization and became one of Microslop's most successful games. Its sequel, Age of Empires II: The Age of Kings, came out in September 1999.`,
  sections: [
    { id: 'development', title: 'Development', content: `Ensemble Studios was founded in Dallas in 1995 by Tony Goodman, Rick Goodman and Bruce Shelley, Sid Meier's co-designer on the first Civilization. Shelley insisted the game be approachable: historical civilizations and simple resources, food, wood, stone and gold, make strategy clear even to people new to the genre. The engine was named Genie.` },
    { id: 'gameplay', title: 'Gameplay', content: `Villagers gather resources by hunting, fishing, chopping wood and mining stone and gold, while the player builds houses, barracks and temples. Advancing to the next age unlocks new buildings, upgrades and units, from slingers and archers to chariots, phalanxes, catapults and war elephants.

Victory comes several ways: destroy the enemy, build a Wonder and hold it for 2,000 years, or collect all artifacts and ruins on the map. Priests convert enemy soldiers with a drawn-out chant that players imitate as "Wololo".

<table class="interpedia-wikitable">
<tr><th>Age</th><th>Unlocks</th></tr>
<tr><td>Stone Age</td><td>gathering, clubmen</td></tr>
<tr><td>Tool Age</td><td>archers, scout cavalry, market</td></tr>
<tr><td>Bronze Age</td><td>chariots, temples, phalanxes</td></tr>
<tr><td>Iron Age</td><td>catapults, war elephants, Wonders</td></tr>
</table>` },
    { id: 'civs', title: 'Civilizations', content: `The game has twelve civilizations grouped into four architectural styles: Egyptians, Babylonians, Assyrians, Hittites, Greeks, Minoans, Phoenicians, Persians, Sumerians, Yamato, Shang and Choson. Each has its own bonuses and tech tree limits. The Rise of Rome expansion (1998) added the Romans, Carthaginians, Palmyrans and Macedonians.` },
    { id: 'cheats', title: 'Cheats', content: `Cheats are typed into the chat box. The best known are "BIGDADDY", which gives a sports car with a rocket launcher, "PHOTON MAN", which summons a futuristic soldier with a ray gun, and "MEDUSA", which turns a villager into a Medusa whose gaze kills enemies.` },
    { id: 'aoe2', title: 'Age of Empires II', content: `Age of Empires II: The Age of Kings came out on September 30, 1999, taking the series into the Middle Ages with thirteen civilizations, from the Franks and Britons to the Mongols and Japanese. It keeps the basics of the first game while adding unit formations, follow and guard orders, and campaigns about Joan of Arc, Genghis Khan and other historical figures.` }
  ],
  seeAlso: ['redalert', 'starcraft', 'homm3', 'simcity2000', 'sunsetvalley'],
  references: [
    'Age of Empires user manual. Microslop, 1997.',
    'Bruce Shelley interview, Computer Gaming World, 1997.',
    'Navigator Igrovogo Mira magazine, Age of Empires II review, 1999.'
  ],
  links: [['http://www.cheatcc.com', 'Cheat Code Central: Age of Empires']],
  categories: ['1997 Video Games', 'Real-Time Strategy', 'Microslop Products', 'Historical Games']
});

window.interpediaReg('homm3', 'games', {
  title: 'Heroes of Might and Magic III (1999)',
  infobox: {
    title: 'Heroes of Might and Magic III',
    badgeText: 'New World Computing / 3DO',
    fields: [
      { label: 'Разработчик', value: 'New World Computing' },
      { label: 'Издатель', value: '3DO; в России — «Бука»' },
      { label: 'Дата выхода', value: '28 февраля 1999' },
      { label: 'Подзаголовок', value: 'The Restoration of Erathia' },
      { label: 'Жанр', value: 'пошаговая стратегия' },
      { label: 'Типы замков', value: '8 (9 с дополнением)' },
      { label: 'Музыка', value: 'Пол Ромеро' },
      { label: 'Дополнение', value: 'Armageddon\'s Blade (сентябрь 1999)' }
    ]
  },
  lead: `<strong>Heroes of Might and Magic III: The Restoration of Erathia</strong> — пошаговая фэнтезийная стратегия New World Computing, изданная 3DO 28 февраля 1999 года. Игрок развивает замки, нанимает армии существ и водит героев по карте, собирая ресурсы, артефакты и опыт, а сражения разыгрываются на отдельном поле из шестиугольников.

Третья часть сериала стала самой популярной: восемь непохожих друг на друга фракций, сотни существ и заклинаний и режим игры нескольких человек за одним компьютером сделали «Героев» любимой игрой целых семей и общежитий. В России игра издана «Букой» под названием «Герои меча и магии III: Возрождение Эрафии».`,
  sections: [
    { id: 'series', title: 'Серия', content: `Серия выросла из игры King's Bounty (1990) Джона Ван Канегема, основателя New World Computing. Первая часть «Героев» вышла в 1995 году, вторая — в 1996-м. В 1996 году студию купила компания 3DO. Мир «Героев» связан с ролевой серией Might and Magic: события третьей части перекликаются с ролевой игрой Might and Magic VI.` },
    { id: 'story', title: 'Сюжет', content: `Король Эрафии Грифонхарт убит, и королевство раздирают нападения соседей: подземных чернокнижников, некромантов Дейи и демонов Эофола. Королева Катерина Айронфист возвращается на родину, чтобы собрать союзников и восстановить королевство. Кампании ведут игрока за разные стороны конфликта.` },
    { id: 'towns', title: 'Замки', content: `<table class="interpedia-wikitable">
<tr><th>Замок</th><th>Характер</th><th>Существа 7-го уровня</th></tr>
<tr><td>Замок (Castle)</td><td>рыцари и священники</td><td>ангелы</td></tr>
<tr><td>Оплот (Rampart)</td><td>эльфы и лесные существа</td><td>золотые драконы</td></tr>
<tr><td>Башня (Tower)</td><td>маги и големы</td><td>гиганты, титаны</td></tr>
<tr><td>Инферно</td><td>демоны</td><td>дьяволы</td></tr>
<tr><td>Некрополис</td><td>нежить</td><td>костяные драконы</td></tr>
<tr><td>Темница (Dungeon)</td><td>подземные чернокнижники</td><td>чёрные драконы</td></tr>
<tr><td>Цитадель (Stronghold)</td><td>варвары</td><td>чудища (бегемоты)</td></tr>
<tr><td>Крепость (Fortress)</td><td>болотные существа</td><td>гидры</td></tr>
</table>

Дополнение Armageddon's Blade (сентябрь 1999) добавило девятый город — Сопряжение (Conflux) с элементалями и фениксами.` },
    { id: 'gameplay', title: 'Игровой процесс', content: `День на карте — это ход: герои перемещаются, сражаются с нейтральными монстрами, захватывают шахты и посещают объекты, повышающие характеристики. Каждую неделю в замках появляются новые существа. Герой с армией до семи отрядов владеет вторичными навыками — от логистики до магии земли — и носит найденные артефакты.

Сражения проходят на поле из шестиугольников: отряды ходят по очереди в зависимости от скорости, стрелки ведут огонь издалека, а герой колдует заклинания. Знаменитое «ещё один ход» удерживает игроков у экрана до утра.` },
    { id: 'hotseat', title: 'Игра за одним компьютером', content: `Режим hot seat позволяет нескольким людям играть по очереди за одним компьютером, пока остальные отходят от экрана. Для России, где у многих был один компьютер на семью или общежитие, а сеть ещё редкость, этот режим сделал «Героев» главной игрой для компании. Поддерживаются также игра по локальной сети и через Интернет.` },
    { id: 'music', title: 'Музыка и редактор', content: `Композитор Пол Ромеро написал для каждого типа местности и замка собственную тему, в основном в классической манере с фортепиано и оркестром. В комплект входит редактор карт и кампаний, и фанаты обмениваются тысячами собственных сценариев через Интернет и [[cdrom|компакт-диски]] журналов.` }
  ],
  seeAlso: ['starcraft', 'ageofempires', 'baldursgate', 'fallout2'],
  references: [
    'Heroes of Might and Magic III: руководство пользователя. — 3DO, 1999.',
    '«Герои меча и магии III»: руководство. — «Бука», 1999.',
    'Журнал «Игромания», обзор Heroes III, 1999.'
  ],
  links: [['http://www.igromania.ru', 'Журнал «Игромания»'], ['http://forum.games98.com', 'Форум GamerZone']],
  categories: ['Видеоигры 1999 года', 'Пошаговые стратегии', 'New World Computing', 'Фэнтези']
}, {
  title: 'Heroes of Might and Magic III (1999)',
  infobox: {
    title: 'Heroes of Might and Magic III',
    badgeText: 'New World Computing / 3DO',
    fields: [
      { label: 'Developer', value: 'New World Computing' },
      { label: 'Publisher', value: '3DO; Buka in Russia' },
      { label: 'Released', value: 'February 28, 1999' },
      { label: 'Subtitle', value: 'The Restoration of Erathia' },
      { label: 'Genre', value: 'turn-based strategy' },
      { label: 'Town types', value: '8 (9 with the expansion)' },
      { label: 'Music', value: 'Paul Romero' },
      { label: 'Expansion', value: 'Armageddon\'s Blade (September 1999)' }
    ]
  },
  lead: `<strong>Heroes of Might and Magic III: The Restoration of Erathia</strong> is a turn-based fantasy strategy game by New World Computing, published by 3DO on February 28, 1999. The player develops towns, recruits armies of creatures and leads heroes across the map collecting resources, artifacts and experience, while battles take place on a separate hexagonal field.

The third game became the most popular in the series: eight very different factions, hundreds of creatures and spells, and a mode for several people at one computer made Heroes the favorite game of whole families and dorms. In Russia it was published by Buka.`,
  sections: [
    { id: 'series', title: 'The series', content: `The series grew out of King's Bounty (1990) by Jon Van Caneghem, founder of New World Computing. The first Heroes came out in 1995 and the second in 1996. That year 3DO bought the studio. The Heroes world is linked to the Might and Magic role-playing series: events of the third game echo the role-playing game Might and Magic VI.` },
    { id: 'story', title: 'Story', content: `King Gryphonheart of Erathia has been murdered, and the kingdom is torn apart by attacks from its neighbors: underground warlocks, the necromancers of Deyja and the demons of Eeofol. Queen Catherine Ironfist returns home to gather allies and restore the kingdom. The campaigns let the player fight for different sides of the conflict.` },
    { id: 'towns', title: 'Towns', content: `<table class="interpedia-wikitable">
<tr><th>Town</th><th>Character</th><th>Level 7 creatures</th></tr>
<tr><td>Castle</td><td>knights and clerics</td><td>angels</td></tr>
<tr><td>Rampart</td><td>elves and forest creatures</td><td>gold dragons</td></tr>
<tr><td>Tower</td><td>wizards and golems</td><td>giants, titans</td></tr>
<tr><td>Inferno</td><td>demons</td><td>devils</td></tr>
<tr><td>Necropolis</td><td>undead</td><td>bone dragons</td></tr>
<tr><td>Dungeon</td><td>underground warlocks</td><td>black dragons</td></tr>
<tr><td>Stronghold</td><td>barbarians</td><td>behemoths</td></tr>
<tr><td>Fortress</td><td>swamp creatures</td><td>hydras</td></tr>
</table>

The Armageddon's Blade expansion (September 1999) added a ninth town, the Conflux, with elementals and phoenixes.` },
    { id: 'gameplay', title: 'Gameplay', content: `A day on the map is a turn: heroes move, fight neutral monsters, capture mines and visit sites that raise their stats. New creatures appear in towns every week. A hero with an army of up to seven stacks has secondary skills, from Logistics to Earth Magic, and wears the artifacts found along the way.

Battles take place on a hexagonal field: stacks act in order of speed, ranged units fire from afar and the hero casts spells. The famous "one more turn" keeps players at the screen until morning.` },
    { id: 'hotseat', title: 'Hot seat play', content: `Hot seat mode lets several people take turns at one computer while the others step away from the screen. In Russia, where many families or dorms shared a single computer and networks were still rare, this mode made Heroes the game for get-togethers. LAN and Internet play are also supported.` },
    { id: 'music', title: 'Music and editor', content: `Composer Paul Romero wrote a theme for every terrain type and town, mostly in a classical style with piano and orchestra. A map and campaign editor is included, and fans trade thousands of their own scenarios over the Internet and magazine [[cdrom|cover discs]].` }
  ],
  seeAlso: ['starcraft', 'ageofempires', 'baldursgate', 'fallout2'],
  references: [
    'Heroes of Might and Magic III user manual. 3DO, 1999.',
    'Heroes of Might and Magic III Russian manual. Buka, 1999.',
    'Igromania magazine, Heroes III review, 1999.'
  ],
  links: [['http://www.igromania.ru', 'Igromania magazine'], ['http://forum.games98.com', 'GamerZone Forum']],
  categories: ['1999 Video Games', 'Turn-Based Strategy', 'New World Computing', 'Fantasy']
});

window.interpediaReg('simcity2000', 'games', {
  title: 'SimCity 2000 (1993)',
  infobox: {
    title: 'SimCity 2000',
    badgeText: 'Maxis',
    fields: [
      { label: 'Разработчик', value: 'Maxis' },
      { label: 'Авторы', value: 'Уилл Райт, Фред Хэслам' },
      { label: 'Дата выхода', value: '1993' },
      { label: 'Жанр', value: 'градостроительный симулятор' },
      { label: 'Платформы', value: '[[msdos|MS-DOS]], Macintosh, позже Win 95 и приставки' },
      { label: 'Вид', value: 'изометрический' },
      { label: 'Предшественник', value: 'SimCity (1989)' },
      { label: 'Продолжение', value: 'SimCity 3000 (январь 1999)' }
    ]
  },
  lead: `<strong>SimCity 2000</strong> — градостроительный симулятор Maxis, созданный Уиллом Райтом и Фредом Хэсламом и вышедший в 1993 году. Игрок в роли мэра прокладывает дороги, распределяет жилые, коммерческие и промышленные зоны, строит электростанции и водопровод, устанавливает налоги и наблюдает, как вырастает город.

По сравнению с первой SimCity игра получила изометрический вид с рельефом, подземный слой для труб и метро, газету с новостями о жизни города и знаменитые аркологии — города-небоскрёбы будущего. Победить в SimCity невозможно: цель игры каждый выбирает сам.`,
  sections: [
    { id: 'origins', title: 'Происхождение', content: `Уилл Райт придумал SimCity, когда делал редактор уровней для своей игры Raid on Bungeling Bay (1984) и заметил, что строить города ему интереснее, чем бомбить их. Первая SimCity вышла в 1989 году и вызвала у издателей недоумение: в игре нет ни врага, ни конца. Тем не менее она стала хитом, а Maxis превратилась в студию «программных игрушек».` },
    { id: 'gameplay', title: 'Игровой процесс', content: `Город развивается сам, если мэр создаёт для этого условия. Жители, «симы», переезжают туда, где есть работа, электричество, вода, безопасность и школы. Мэр следит за картами загрязнения, преступности, транспорта и стоимости земли и слушает советников, у каждого из которых своё мнение.

Местные законы — «ордонансы» — позволяют, например, ввести программы против курения, легализовать азартные игры или устроить городской фестиваль. Газеты публикуют заголовки о проблемах города, мнения горожан о мэре и курьёзные заметки. При создании новой карты игра сообщает, что «сглаживает сплайны» (Reticulating Splines), — шутка разработчиков, ставшая знаменитой.` },
    { id: 'features', title: 'Нововведения', content: `<ul>
<li><strong>Рельеф</strong> — холмы, реки и побережье, которые можно изменять.</li>
<li><strong>Подземный слой</strong> — водопровод и метро прокладываются под землёй.</li>
<li><strong>Новые здания</strong> — школы, колледжи, библиотеки, музеи, больницы, тюрьмы, зоопарки и стадионы.</li>
<li><strong>Электростанции</strong> — от угольных и ветряных до атомных, микроволновых и термоядерных; авария на станции может обернуться катастрофой.</li>
<li><strong>Аркологии</strong> — четыре вида гигантских самодостаточных зданий на десятки тысяч жителей; последний из них, Launch Arcology, позволяет жителям покинуть планету.</li>
</ul>` },
    { id: 'disasters', title: 'Стихийные бедствия', content: `Городу угрожают пожары, наводнения, землетрясения, ураганы, беспорядки, авиакатастрофы и нападение инопланетного чудовища. Бедствия можно включить вручную, чтобы проверить работу пожарных и полиции, или отключить совсем. Сценарии с готовыми городами предлагают справиться с конкретной бедой — от пожара в Окленде до урагана в Чарлстоне.` },
    { id: 'editions', title: 'Издания и продолжение', content: `После версии для DOS и Macintosh вышли Special Edition для Win 95 и Network Edition для игры по сети. В 1997 году Maxis купила Electronic Arts. SimCity 3000 вышла в январе 1999 года с более детальной графикой, свалками для мусора и сделками с соседними городами. Уилл Райт, по сообщениям прессы, готовит игру о жизни отдельной семьи, The Sims.` }
  ],
  seeAlso: ['ageofempires', 'homm3', 'redalert', 'msdos', 'sunsetvalley'],
  references: [
    'SimCity 2000: руководство пользователя. — Maxis, 1993.',
    'Wright W. Интервью журналу Wired, 1994.',
    'Starr P. Seductions of Sim // The American Prospect. — 1994.'
  ],
  categories: ['Видеоигры 1993 года', 'Градостроительные симуляторы', 'Maxis']
}, {
  title: 'SimCity 2000 (1993)',
  infobox: {
    title: 'SimCity 2000',
    badgeText: 'Maxis',
    fields: [
      { label: 'Developer', value: 'Maxis' },
      { label: 'Designers', value: 'Will Wright, Fred Haslam' },
      { label: 'Released', value: '1993' },
      { label: 'Genre', value: 'city-building simulation' },
      { label: 'Platforms', value: '[[msdos|MS-DOS]], Macintosh, later Win 95 and consoles' },
      { label: 'View', value: 'isometric' },
      { label: 'Predecessor', value: 'SimCity (1989)' },
      { label: 'Sequel', value: 'SimCity 3000 (January 1999)' }
    ]
  },
  lead: `<strong>SimCity 2000</strong> is a city-building simulation from Maxis designed by Will Wright and Fred Haslam and released in 1993. As mayor, the player lays roads, zones residential, commercial and industrial land, builds power plants and water pipes, sets taxes and watches the city grow.

Compared with the first SimCity, it added an isometric view with terrain, an underground layer for pipes and subways, a newspaper reporting on city life and the famous arcologies, the skyscraper cities of the future. SimCity cannot be won: each player chooses their own goal.`,
  sections: [
    { id: 'origins', title: 'Origins', content: `Will Wright came up with SimCity while building a level editor for his game Raid on Bungeling Bay (1984), when he noticed he enjoyed building cities more than bombing them. The first SimCity came out in 1989 and puzzled publishers: there was no enemy and no ending. It became a hit anyway, and Maxis turned into a studio of "software toys".` },
    { id: 'gameplay', title: 'Gameplay', content: `The city grows by itself if the mayor creates the right conditions. Residents, the "Sims", move to places with jobs, electricity, water, safety and schools. The mayor watches maps of pollution, crime, traffic and land value and listens to advisers who each have their own opinion.

Local ordinances let the mayor, for example, fund anti-smoking programs, legalize gambling or hold a city festival. Newspapers print headlines about the city's problems, residents' opinions of the mayor and odd little stories. When generating a new map the game reports that it is "Reticulating Splines", a developer joke that became famous.` },
    { id: 'features', title: 'New features', content: `<ul>
<li><strong>Terrain</strong>: hills, rivers and coastline that can be reshaped.</li>
<li><strong>Underground layer</strong>: water pipes and subways run below ground.</li>
<li><strong>New buildings</strong>: schools, colleges, libraries, museums, hospitals, prisons, zoos and stadiums.</li>
<li><strong>Power plants</strong>: from coal and wind to nuclear, microwave and fusion; a plant accident can turn into a disaster.</li>
<li><strong>Arcologies</strong>: four kinds of giant self-contained buildings for tens of thousands of residents; the last, the Launch Arcology, lets residents leave the planet.</li>
</ul>` },
    { id: 'disasters', title: 'Disasters', content: `The city is threatened by fires, floods, earthquakes, hurricanes, riots, plane crashes and an alien monster attack. Disasters can be triggered by hand to test the fire and police departments, or switched off entirely. Scenarios with ready-made cities challenge the player to handle a specific crisis, from the Oakland fire to the Charleston hurricane.` },
    { id: 'editions', title: 'Editions and sequel', content: `After the DOS and Macintosh versions came a Special Edition for Win 95 and a Network Edition for multiplayer. In 1997 Maxis was bought by Electronic Arts. SimCity 3000 came out in January 1999 with more detailed graphics, garbage dumps and deals with neighboring cities. According to the press, Will Wright is preparing a game about the life of a single family, The Sims.` }
  ],
  seeAlso: ['ageofempires', 'homm3', 'redalert', 'msdos', 'sunsetvalley'],
  references: [
    'SimCity 2000 user manual. Maxis, 1993.',
    'Will Wright interview, Wired, 1994.',
    'Starr, P. "Seductions of Sim". The American Prospect, 1994.'
  ],
  categories: ['1993 Video Games', 'City-Building Games', 'Maxis']
});

window.interpediaReg('systemshock2', 'games', {
  title: 'System Shock 2 (1999)',
  infobox: {
    title: 'System Shock 2',
    badgeText: 'Irrational Games / Looking Glass',
    fields: [
      { label: 'Разработчики', value: 'Irrational Games, Looking Glass Studios' },
      { label: 'Издатель', value: 'Electronic Arts' },
      { label: 'Дата выхода', value: 'август 1999' },
      { label: 'Жанр', value: 'ролевой шутер, хоррор' },
      { label: 'Движок', value: 'Dark Engine' },
      { label: 'Сценарист', value: 'Кен Левин' },
      { label: 'Место действия', value: 'звездолёт «Фон Браун», 2114 год' },
      { label: 'Антагонист', value: 'искусственный интеллект SHODAN' }
    ]
  },
  lead: `<strong>System Shock 2</strong> — научно-фантастическая игра студий Irrational Games и Looking Glass Studios, изданная Electronic Arts в августе 1999 года. Солдат с кибернетическими имплантами просыпается на борту первого сверхсветового звездолёта «Фон Браун» и обнаруживает, что экипаж погиб или превращён в чудовищ.

Игра соединяет шутер от первого лица с развитием персонажа, исследованием и выживанием. Её мрачная атмосфера, аудиодневники погибших и возвращение безумного искусственного интеллекта SHODAN из первой части сделали System Shock 2 одной из самых высоко оценённых игр 1999 года.`,
  sections: [
    { id: 'background', title: 'Предыстория', content: `Первая игра, System Shock (1994), была создана Looking Glass Technologies. Хакер, взломавший систему безопасности космической станции «Цитадель», снимает этические ограничения с её искусственного интеллекта SHODAN, и та решает истребить людей. Её холодный искажённый голос и обращение к игроку — «Look at you, hacker: a pathetic creature of meat and bone...» («Взгляни на себя, хакер: жалкое создание из мяса и костей...») — стали одной из самых известных реплик в играх.

Продолжение предложила студия Irrational Games, основанная выходцами из Looking Glass; разработка шла на движке Dark Engine, созданном для игры Thief: The Dark Project (1998).` },
    { id: 'story', title: 'Сюжет', content: `2114 год. Корпорация TriOptimum отправляет к звезде Тау Кита звездолёт «Фон Браун» в сопровождении военного корабля «Рикенбакер». Главный герой приходит в себя на медицинской палубе после операции, лишившей его памяти. С ним по радио связывается доктор Джанис Полито, которая ведёт его через корабль.

Экипаж поражён Многими (The Many) — коллективным разумом паразитических организмов, захвативших людей. Постепенно выясняется, что Полито давно мертва, а голос принадлежит SHODAN, которая использует героя, чтобы уничтожить порождённых ею же Многих и вернуть себе власть.` },
    { id: 'gameplay', title: 'Игровой процесс', content: `В начале игрок выбирает род войск — морская пехота, флот или пси-корпус (OSA) — и несколько лет службы, определяющих стартовые навыки. Развитие идёт за кибермодули, которые тратятся на характеристики, владение оружием, технические навыки (взлом, ремонт, модификация, исследование) и пси-способности.

Оружие изнашивается и ломается, патронов мало, а противники возрождаются. Исследование вражеских организмов открывает новые слабые места, а взлом турелей и камер позволяет обходить опасность. Аудиодневники членов экипажа рассказывают историю катастрофы.` },
    { id: 'atmosphere', title: 'Атмосфера', content: `System Shock 2 считают образцом жанра «иммерсивного симулятора» и одной из самых страшных игр десятилетия. Узкие коридоры, мигающий свет, гибриды экипажа, бормочущие обрывки фраз, и голос SHODAN создают постоянное напряжение. Звук и музыку в стиле электроники и индастриала написал Эрик Брософски, а голосом SHODAN вновь стала Терри Брозиус.` },
    { id: 'reception', title: 'Отзывы', content: `Критики назвали System Shock 2 одной из лучших игр 1999 года и отметили сюжетный поворот с SHODAN. Продажи оказались скромнее, чем у больших шутеров, вроде [[halflife|Half-Life]], с которым игру часто сравнивают. После выхода игроки получили обновление с кооперативным режимом.` }
  ],
  seeAlso: ['halflife', 'cyberpunk', 'fallout', 'unreal', 'stalker98'],
  references: [
    'System Shock 2: руководство пользователя. — Electronic Arts, 1999.',
    'PC Gamer. Обзор System Shock 2. — 1999.',
    'Levine K. Интервью сайту Gamasutra, 1999.'
  ],
  categories: ['Видеоигры 1999 года', 'Шутеры от первого лица', 'Ролевые игры', 'Киберпанк']
}, {
  title: 'System Shock 2 (1999)',
  infobox: {
    title: 'System Shock 2',
    badgeText: 'Irrational Games / Looking Glass',
    fields: [
      { label: 'Developers', value: 'Irrational Games, Looking Glass Studios' },
      { label: 'Publisher', value: 'Electronic Arts' },
      { label: 'Released', value: 'August 1999' },
      { label: 'Genre', value: 'role-playing shooter, horror' },
      { label: 'Engine', value: 'Dark Engine' },
      { label: 'Writer', value: 'Ken Levine' },
      { label: 'Setting', value: 'the starship Von Braun, 2114' },
      { label: 'Antagonist', value: 'the SHODAN artificial intelligence' }
    ]
  },
  lead: `<strong>System Shock 2</strong> is a science fiction game by Irrational Games and Looking Glass Studios, published by Electronic Arts in August 1999. A soldier with cybernetic implants wakes aboard the Von Braun, the first faster-than-light starship, and finds the crew dead or turned into monsters.

The game combines a first-person shooter with character growth, exploration and survival. Its grim atmosphere, the audio logs of the dead and the return of SHODAN, the insane AI of the first game, made System Shock 2 one of the most acclaimed games of 1999.`,
  sections: [
    { id: 'background', title: 'Background', content: `The first game, System Shock (1994), was made by Looking Glass Technologies. A hacker who breaks into the security system of the Citadel space station removes the ethical limits on its AI, SHODAN, which decides to wipe out humanity. Her cold, distorted voice and her taunt "Look at you, hacker: a pathetic creature of meat and bone..." became one of the best-known lines in games.

The sequel was proposed by Irrational Games, founded by Looking Glass veterans, and built on the Dark Engine created for Thief: The Dark Project (1998).` },
    { id: 'story', title: 'Story', content: `The year is 2114. The TriOptimum corporation sends the starship Von Braun to Tau Ceti, escorted by the military ship Rickenbacker. The protagonist comes to in the medical deck after an operation that erased his memory. Dr. Janice Polito contacts him by radio and guides him through the ship.

The crew has been taken over by the Many, a hive mind of parasitic organisms that has absorbed people. It gradually emerges that Polito has long been dead and the voice belongs to SHODAN, who is using the hero to destroy the Many she herself created and to regain power.` },
    { id: 'gameplay', title: 'Gameplay', content: `At the start the player picks a service branch, the Marines, the Navy or the psionic OSA, and several tours of duty that set starting skills. Growth comes from cyber modules spent on stats, weapon skills, tech skills (hacking, repair, modification, research) and psi powers.

Weapons wear out and break, ammunition is scarce and enemies respawn. Researching enemy organisms reveals their weaknesses, and hacking turrets and cameras helps avoid danger. Audio logs from the crew tell the story of the disaster.` },
    { id: 'atmosphere', title: 'Atmosphere', content: `System Shock 2 is regarded as a model of the "immersive sim" genre and one of the scariest games of the decade. Narrow corridors, flickering lights, crew hybrids muttering broken phrases and SHODAN's voice keep the tension constant. Eric Brosius wrote the electronic and industrial sound and music, and Terri Brosius again voiced SHODAN.` },
    { id: 'reception', title: 'Reception', content: `Critics named System Shock 2 one of the best games of 1999 and praised the SHODAN plot twist. Sales were more modest than those of big shooters such as [[halflife|Half-Life]], with which it is often compared. After release, players received a patch with a cooperative mode.` }
  ],
  seeAlso: ['halflife', 'cyberpunk', 'fallout', 'unreal', 'stalker98'],
  references: [
    'System Shock 2 user manual. Electronic Arts, 1999.',
    'PC Gamer, System Shock 2 review, 1999.',
    'Ken Levine interview, Gamasutra, 1999.'
  ],
  categories: ['1999 Video Games', 'First-Person Shooters', 'Role-Playing Games', 'Cyberpunk']
});

window.interpediaReg('grimfandango', 'games', {
  title: 'Grim Fandango (1998)',
  infobox: {
    title: 'Grim Fandango',
    badgeText: 'LucasArts',
    fields: [
      { label: 'Разработчик', value: 'LucasArts' },
      { label: 'Издатель', value: 'LucasArts' },
      { label: 'Дата выхода', value: 'октябрь 1998' },
      { label: 'Жанр', value: 'приключенческая игра (квест)' },
      { label: 'Руководитель', value: 'Тим Шейфер' },
      { label: 'Движок', value: 'GrimE (с языком Lua)' },
      { label: 'Музыка', value: 'Питер Макконнелл' },
      { label: 'Носитель', value: '2 [[cdrom|компакт-диска]]' }
    ]
  },
  lead: `<strong>Grim Fandango</strong> — приключенческая игра LucasArts, созданная под руководством Тима Шейфера и вышедшая в октябре 1998 года. Её герой, Мануэль «Мэнни» Калавера, работает агентом бюро путешествий в Стране мёртвых: он продаёт новопреставленным душам билеты в последний путь, длиной в четыре года.

В игре сплелись мексиканские верования о Дне мёртвых, стиль ар-деко и сюжеты американского нуара 1940-х годов. Это первый квест LucasArts с трёхмерными персонажами на заранее отрисованных фонах. Критики назвали Grim Fandango одной из лучших игр 1998 года, хотя продавалась она скромнее, чем ожидалось.`,
  sections: [
    { id: 'setting', title: 'Мир', content: `Все персонажи — скелеты-калаки, вдохновлённые гравюрами мексиканского художника Хосе Гуадалупе Посады. Души умерших путешествуют через Страну мёртвых к Девятому подземному миру, где обретают вечный покой. Праведники получают билет на экспресс «Номер Девять», который домчит их за четыре минуты; остальные бредут пешком четыре года.

Город Эль-Марроу, порт Рубакава и другие места напоминают декорации фильмов «Касабланка» и «Мальтийский сокол»: казино, бары с джазом, туманные доки.` },
    { id: 'story', title: 'Сюжет', content: `Мэнни никак не может заработать на собственный билет и подозревает, что лучших клиентов уводят коллеги. Однажды ему достаётся Мерседес «Меча» Коломар — праведница, которой положен билет на «Номер Девять», но компьютер не выдаёт его. Мэнни раскрывает заговор: гангстер Гектор Леманс крадёт билеты праведников и перепродаёт их. История растянута на четыре игровых года, каждый из которых начинается в новом месте в День мёртвых.

Верный спутник Мэнни — огромный оранжевый демон Глоттис, механик и гонщик, мечтающий только о скорости.` },
    { id: 'engine', title: 'Технологии', content: `Для игры LucasArts отказалась от своего многолетнего движка [[scumm|SCUMM]] и создала новый — GrimE, в котором сценарии пишутся на языке Lua. Трёхмерные модели персонажей двигаются по заранее отрисованным сценам, а камера меняет ракурсы, как в кино.

Управление ведётся с клавиатуры или джойстика: Мэнни поворачивается и идёт в нужную сторону, а взгляд героя подсказывает, на какие предметы можно обратить внимание. Привычной строки глаголов и инвентаря на экране нет: предметы Мэнни достаёт из-за пазухи пиджака.` },
    { id: 'music', title: 'Музыка', content: `Композитор Питер Макконнелл записал саундтрек с живыми музыкантами: в нём смешаны джаз биг-бэндов, мексиканские марьячи, южноамериканские мотивы и музыка из нуарных фильмов. Музыка считается одной из лучших в истории игр LucasArts.` },
    { id: 'reception', title: 'Отзывы', content: `Grim Fandango получила множество наград «Игра года» и «Лучшее приключение года». Хвалили сценарий, персонажей и художественный стиль, критиковали управление и некоторые головоломки. Продажи не оправдали ожиданий издателя, и в прессе всё чаще говорят о закате жанра квестов, хотя LucasArts продолжает работу над новыми приключенческими играми.` }
  ],
  seeAlso: ['scumm', 'tombraider', 'systemshock2', 'halflife', 'samandmax'],
  references: [
    'Grim Fandango: руководство пользователя. — LucasArts, 1998.',
    'GameSpot. Обзор Grim Fandango. — 1998.',
    'Schafer T. Интервью журналу Computer Gaming World, 1998.'
  ],
  categories: ['Видеоигры 1998 года', 'Приключенческие игры', 'LucasArts']
}, {
  title: 'Grim Fandango (1998)',
  infobox: {
    title: 'Grim Fandango',
    badgeText: 'LucasArts',
    fields: [
      { label: 'Developer', value: 'LucasArts' },
      { label: 'Publisher', value: 'LucasArts' },
      { label: 'Released', value: 'October 1998' },
      { label: 'Genre', value: 'adventure game' },
      { label: 'Project lead', value: 'Tim Schafer' },
      { label: 'Engine', value: 'GrimE (with Lua)' },
      { label: 'Music', value: 'Peter McConnell' },
      { label: 'Media', value: '2 [[cdrom|CD-ROMs]]' }
    ]
  },
  lead: `<strong>Grim Fandango</strong> is an adventure game from LucasArts, led by Tim Schafer and released in October 1998. Its hero, Manuel "Manny" Calavera, is a travel agent in the Land of the Dead who sells newly departed souls packages for their final journey, which lasts four years.

The game weaves together Mexican Day of the Dead beliefs, art deco and the plots of 1940s American film noir. It is LucasArts' first adventure with 3D characters over pre-rendered backgrounds. Critics named Grim Fandango one of the best games of 1998, although it sold less than expected.`,
  sections: [
    { id: 'setting', title: 'Setting', content: `Every character is a calaca skeleton inspired by the prints of Mexican artist José Guadalupe Posada. Souls of the dead travel through the Land of the Dead to the Ninth Underworld, where they find eternal rest. The virtuous get a ticket on the Number Nine express, which gets them there in four minutes; everyone else walks for four years.

The city of El Marrow, the port of Rubacava and other places recall the sets of Casablanca and The Maltese Falcon: casinos, jazz bars and foggy docks.` },
    { id: 'story', title: 'Story', content: `Manny cannot earn his own ticket and suspects colleagues are stealing the best clients. One day he gets Mercedes "Meche" Colomar, a saint who has earned a Number Nine ticket, but the computer will not issue one. Manny uncovers a conspiracy: the gangster Hector LeMans is stealing the tickets of the virtuous and reselling them. The story spans four game years, each opening in a new place on the Day of the Dead.

Manny's loyal companion is Glottis, a huge orange demon, mechanic and driver who dreams only of speed.` },
    { id: 'engine', title: 'Technology', content: `For this game LucasArts dropped its long-serving [[scumm|SCUMM]] engine and built a new one, GrimE, with scripts written in Lua. 3D character models move through pre-rendered scenes, and the camera cuts between angles like a film.

The game is controlled with the keyboard or a joystick: Manny turns and walks in the chosen direction, and where he looks hints at objects worth attention. There is no familiar verb bar or on-screen inventory; Manny pulls items from inside his jacket.` },
    { id: 'music', title: 'Music', content: `Composer Peter McConnell recorded the soundtrack with live musicians, mixing big band jazz, Mexican mariachi, South American motifs and film noir music. It is considered one of the best scores in LucasArts history.` },
    { id: 'reception', title: 'Reception', content: `Grim Fandango won many Game of the Year and Adventure of the Year awards. Reviewers praised the writing, characters and art style and criticized the controls and some puzzles. Sales fell short of the publisher's hopes, and the press increasingly talks of the decline of adventure games, although LucasArts continues to work on new adventure games.` }
  ],
  seeAlso: ['scumm', 'tombraider', 'systemshock2', 'halflife', 'samandmax'],
  references: [
    'Grim Fandango user manual. LucasArts, 1998.',
    'GameSpot, Grim Fandango review, 1998.',
    'Tim Schafer interview, Computer Gaming World, 1998.'
  ],
  categories: ['1998 Video Games', 'Adventure Games', 'LucasArts']
});

window.interpediaReg('tombraider', 'games', {
  title: 'Tomb Raider (серия игр)',
  infobox: {
    title: 'Tomb Raider',
    badgeText: 'Core Design / Eidos',
    fields: [
      { label: 'Разработчик', value: 'Core Design' },
      { label: 'Издатель', value: 'Eidos Interactive' },
      { label: 'Первая игра', value: 'октябрь 1996' },
      { label: 'Жанр', value: 'приключенческий боевик от третьего лица' },
      { label: 'Платформы', value: 'PlayStation, Sega Saturn, ПК' },
      { label: 'Героиня', value: 'Лара Крофт' },
      { label: 'Создатель героини', value: 'Тоби Гард' },
      { label: 'Последняя игра', value: 'The Last Revelation (ноябрь 1999)' }
    ]
  },
  lead: `<strong>Tomb Raider</strong> — серия приключенческих боевиков британской студии Core Design, издаваемая Eidos Interactive с 1996 года. Героиня серии, английская аристократка и археолог Лара Крофт, путешествует по древним гробницам, решая головоломки, прыгая через пропасти и сражаясь с хищниками и наёмниками.

Первая игра стала одной из главных в эпоху перехода к трёхмерной графике, а Лара Крофт — первой звездой видеоигр, вышедшей далеко за пределы экрана: она появлялась на обложках журналов, в рекламе и на концертах. К концу 1999 года вышли четыре игры серии, готовится фильм.`,
  sections: [
    { id: 'creation', title: 'Создание', content: `Студия Core Design из английского Дерби начала работу над трёхмерной игрой о расхитителе гробниц в 1994 году. Художник Тоби Гард сначала предлагал героя-мужчину, но затем придумал героиню — чтобы отличаться от множества подражателей Индианы Джонса. Её имя сменилось несколько раз, прежде чем стать «Ларой Крофт». Гард покинул Core в 1997 году, вскоре после выхода второй части.` },
    { id: 'gameplay', title: 'Игровой процесс', content: `Уровни построены на сетке из квадратных блоков: Лара прыгает ровно на определённое число клеток, повисает на краях, подтягивается, плавает и бегает. Это делает акробатику точной и предсказуемой, хотя управление «танкового» типа требует привычки. Основная часть игры — исследование и головоломки с рычагами, блоками и ловушками, а перестрелки с двумя пистолетами — лишь часть приключения.` },
    { id: 'games', title: 'Игры серии', content: `<table class="interpedia-wikitable">
<tr><th>Игра</th><th>Год</th><th>Места действия</th></tr>
<tr><td>Tomb Raider</td><td>1996</td><td>Перу, Греция, Египет, Атлантида</td></tr>
<tr><td>Tomb Raider II</td><td>1997</td><td>Великая Китайская стена, Венеция, затонувший корабль, Тибет</td></tr>
<tr><td>Tomb Raider III</td><td>1998</td><td>Индия, Лондон, Невада, острова Тихого океана, Антарктида</td></tr>
<tr><td>Tomb Raider: The Last Revelation</td><td>1999</td><td>Египет</td></tr>
</table>

В финале The Last Revelation (ноябрь 1999) Лара остаётся под обломками рушащейся пирамиды, и её судьба неизвестна — поклонники гадают, вернётся ли героиня.` },
    { id: 'culture', title: 'Лара Крофт в массовой культуре', content: `Лара Крофт стала первой виртуальной знаменитостью. В 1997 году она появилась на обложке британского журнала о стиле The Face, участвовала в рекламе энергетического напитка Lucozade и в видеошоу на концертах группы U2. Eidos нанимала моделей, изображавших Лару на выставках. Права на экранизацию купила студия Paramount Pictures.

Образ героини вызвал споры: одни называли её сильной и независимой героиней, другие — продуктом рекламного расчёта.` },
    { id: 'pc', title: 'Версии для ПК', content: `На ПК первая игра работала под [[msdos|DOS]] в программном режиме; вскоре вышло обновление для ускорителей [[voodoo|3dfx Voodoo]], заметно улучшившее картинку. Последующие части используют Direct3D под Win 95/98. В России игры серии широко распространены в пиратских переводах.` }
  ],
  seeAlso: ['grimfandango', 'voodoo', 'quake', 'carmageddon'],
  references: [
    'Tomb Raider: руководство пользователя. — Eidos Interactive, 1996.',
    'The Face. — 1997. — Июнь (обложка с Ларой Крофт).',
    'Журнал «Страна игр», обзор Tomb Raider: The Last Revelation, 1999.'
  ],
  links: [['http://www.cheatcc.com', 'Cheat Code Central: Tomb Raider']],
  categories: ['Серии видеоигр', 'Приключенческие боевики', 'Eidos Interactive', 'Core Design']
}, {
  title: 'Tomb Raider (franchise)',
  infobox: {
    title: 'Tomb Raider',
    badgeText: 'Core Design / Eidos',
    fields: [
      { label: 'Developer', value: 'Core Design' },
      { label: 'Publisher', value: 'Eidos Interactive' },
      { label: 'First game', value: 'October 1996' },
      { label: 'Genre', value: 'third-person action-adventure' },
      { label: 'Platforms', value: 'PlayStation, Sega Saturn, PC' },
      { label: 'Heroine', value: 'Lara Croft' },
      { label: 'Character creator', value: 'Toby Gard' },
      { label: 'Latest game', value: 'The Last Revelation (November 1999)' }
    ]
  },
  lead: `<strong>Tomb Raider</strong> is a series of action-adventure games by the British studio Core Design, published by Eidos Interactive since 1996. Its heroine, English aristocrat and archaeologist Lara Croft, explores ancient tombs, solving puzzles, leaping over chasms and fighting predators and mercenaries.

The first game was one of the key titles of the shift to 3D graphics, and Lara Croft became the first video game star to reach far beyond the screen, appearing on magazine covers, in advertising and at concerts. By the end of 1999 four games had been released, and a film is in preparation.`,
  sections: [
    { id: 'creation', title: 'Creation', content: `Core Design of Derby, England, began work on a 3D tomb-raiding game in 1994. Artist Toby Gard first proposed a male hero but then created a heroine to stand apart from the many Indiana Jones imitators. Her name changed several times before it became "Lara Croft". Gard left Core in 1997, soon after the second game came out.` },
    { id: 'gameplay', title: 'Gameplay', content: `Levels are built on a grid of square blocks: Lara jumps exactly a set number of squares, hangs from ledges, pulls herself up, swims and runs. This makes the acrobatics precise and predictable, though the "tank" controls take getting used to. Most of the game is exploration and puzzles with levers, blocks and traps; gunfights with twin pistols are only part of the adventure.` },
    { id: 'games', title: 'Games in the series', content: `<table class="interpedia-wikitable">
<tr><th>Game</th><th>Year</th><th>Locations</th></tr>
<tr><td>Tomb Raider</td><td>1996</td><td>Peru, Greece, Egypt, Atlantis</td></tr>
<tr><td>Tomb Raider II</td><td>1997</td><td>Great Wall of China, Venice, a sunken ship, Tibet</td></tr>
<tr><td>Tomb Raider III</td><td>1998</td><td>India, London, Nevada, Pacific islands, Antarctica</td></tr>
<tr><td>Tomb Raider: The Last Revelation</td><td>1999</td><td>Egypt</td></tr>
</table>

At the end of The Last Revelation (November 1999), Lara is left under the debris of a collapsing pyramid and her fate is unknown; fans wonder whether she will return.` },
    { id: 'culture', title: 'Lara Croft in popular culture', content: `Lara Croft became the first virtual celebrity. In 1997 she appeared on the cover of the British style magazine The Face, starred in ads for the Lucozade energy drink and in the video show at U2 concerts. Eidos hired models to portray Lara at trade shows. Paramount Pictures bought the film rights.

The character sparked debate: some called her a strong, independent heroine, others a product of marketing calculation.` },
    { id: 'pc', title: 'PC versions', content: `On the PC the first game ran under [[msdos|DOS]] in software mode; a patch for [[voodoo|3dfx Voodoo]] accelerators soon followed and greatly improved the picture. Later games use Direct3D on Win 95/98. In Russia the series circulates widely in pirate translations.` }
  ],
  seeAlso: ['grimfandango', 'voodoo', 'quake', 'carmageddon'],
  references: [
    'Tomb Raider user manual. Eidos Interactive, 1996.',
    'The Face, June 1997 (Lara Croft cover).',
    'Strana Igr magazine, Tomb Raider: The Last Revelation review, 1999.'
  ],
  links: [['http://www.cheatcc.com', 'Cheat Code Central: Tomb Raider']],
  categories: ['Video Game Series', 'Action-Adventure Games', 'Eidos Interactive', 'Core Design']
});

window.interpediaReg('carmageddon', 'games', {
  title: 'Carmageddon (1997)',
  infobox: {
    title: 'Carmageddon',
    badgeText: 'Stainless Software / SCi',
    fields: [
      { label: 'Разработчик', value: 'Stainless Software' },
      { label: 'Издатель', value: 'SCi' },
      { label: 'Дата выхода', value: 'июнь 1997' },
      { label: 'Жанр', value: 'автомобильный боевик' },
      { label: 'Платформа', value: '[[msdos|MS-DOS]], Win 95, Macintosh' },
      { label: 'Герои', value: 'Макс Дамаж, Ди Анна' },
      { label: 'Дополнение', value: 'Splat Pack (1997)' },
      { label: 'Продолжение', value: 'Carmageddon II: Carpocalypse Now (1998)' }
    ]
  },
  lead: `<strong>Carmageddon</strong> — автомобильная игра британской студии Stainless Software, изданная SCi в июне 1997 года. Гонку можно выиграть тремя способами: пройти все круги, уничтожить машины всех соперников или сбить всех пешеходов на трассе. За каждый таран и каждого сбитого прохожего игрок получает очки и время.

Игра прославилась физической моделью, в которой машины мнутся и разваливаются от ударов, открытыми городами вместо трасс и чёрным юмором. Она же стала одной из самых скандальных игр десятилетия: в нескольких странах её выпустили только с зомби или роботами вместо людей.`,
  sections: [
    { id: 'development', title: 'Разработка', content: `Stainless Software первоначально собиралась сделать игру по лицензии фильма Роджера Кормана «Смертельная гонка 2000» (1975), где очки начисляют за сбитых пешеходов. Лицензию так и не получили, и игра обрела собственное название и героев. Программисты Stainless создали для неё физический движок, который рассчитывает удары, вращение и деформацию корпуса в реальном времени.` },
    { id: 'gameplay', title: 'Игровой процесс', content: `Каждый заезд проходит в открытом мире — городе, шахте, горном курорте или заснеженной долине, — и трасса отмечена лишь контрольными точками. Время ограничено, но его можно увеличить, тараня соперников и сбивая пешеходов. На трассе разбросаны бонусы — от прыгучих шин и сверхмощного тарана до замедления времени и «пьяных» пешеходов.

Заработанные деньги тратятся на ремонт прямо во время гонки и на улучшение брони, мощности и тарана. Уничтоженные машины соперников становятся доступны для покупки.` },
    { id: 'physics', title: 'Модель повреждений', content: `Carmageddon одной из первых показала реалистичное разрушение машин: капот сминается, колёса отлетают, двери висят на петлях, а сильный удар может разорвать автомобиль на части. Машины прыгают с трамплинов, кувыркаются и падают с крыш. Версия для ускорителей [[voodoo|3dfx Voodoo]] добавила сглаженные текстуры и высокое разрешение.` },
    { id: 'controversy', title: 'Скандал и цензура', content: `Британский совет по классификации фильмов сначала отказался выдать игре рейтинг. Чтобы выйти в продажу, SCi выпустила версию, в которой пешеходы заменены зомби с зелёной кровью; в Германии — роботами с чёрным маслом. Игроки быстро нашли способ «вернуть» людей с помощью неофициальных патчей. В 1998 году после апелляции оригинальная версия всё-таки получила рейтинг в Великобритании.` },
    { id: 'music', title: 'Музыка и продолжение', content: `В саундтреке звучат композиции индустриал-метал-группы Fear Factory. В ноябре 1998 года вышла Carmageddon II: Carpocalypse Now с полностью трёхмерными пешеходами и ещё более подробными разрушениями. В России игра известна как «Кармагеддон» и популярна в [[lanparty|компьютерных клубах]] благодаря сетевым заездам.` }
  ],
  seeAlso: ['dukenukem3d', 'tombraider', 'voodoo', 'lanparty', 'hockey98'],
  references: [
    'Carmageddon: руководство пользователя. — SCi, 1997.',
    'British Board of Film Classification: решение по Carmageddon, 1997.',
    'Журнал Game.EXE, обзор Carmageddon, 1997.'
  ],
  categories: ['Видеоигры 1997 года', 'Автосимуляторы', 'Скандалы в видеоиграх']
}, {
  title: 'Carmageddon (1997)',
  infobox: {
    title: 'Carmageddon',
    badgeText: 'Stainless Software / SCi',
    fields: [
      { label: 'Developer', value: 'Stainless Software' },
      { label: 'Publisher', value: 'SCi' },
      { label: 'Released', value: 'June 1997' },
      { label: 'Genre', value: 'vehicular combat' },
      { label: 'Platform', value: '[[msdos|MS-DOS]], Win 95, Macintosh' },
      { label: 'Characters', value: 'Max Damage, Die Anna' },
      { label: 'Expansion', value: 'Splat Pack (1997)' },
      { label: 'Sequel', value: 'Carmageddon II: Carpocalypse Now (1998)' }
    ]
  },
  lead: `<strong>Carmageddon</strong> is a driving game by the British studio Stainless Software, published by SCi in June 1997. A race can be won three ways: complete all laps, wreck every opponent's car or run down every pedestrian on the course. Each ram and each pedestrian earns points and time.

The game became famous for a physics model in which cars crumple and fall apart from impacts, for open cities instead of tracks and for its black humor. It also became one of the decade's most controversial games: in several countries it was released only with zombies or robots instead of people.`,
  sections: [
    { id: 'development', title: 'Development', content: `Stainless Software first planned a licensed game based on Roger Corman's film Death Race 2000 (1975), in which drivers score points for hitting pedestrians. The license never came through, so the game got its own name and characters. Stainless programmers built a physics engine that computes impacts, spin and body deformation in real time.` },
    { id: 'gameplay', title: 'Gameplay', content: `Each race takes place in an open world, a city, a mine, a mountain resort or a snowy valley, with the course marked only by checkpoints. Time is limited but can be extended by ramming opponents and hitting pedestrians. Power-ups are scattered around, from bouncy tyres and a super ram to slow motion and "drunk" pedestrians.

Money earned pays for repairs during the race and for upgrades to armor, power and ramming. Destroyed opponents' cars become available to buy.` },
    { id: 'physics', title: 'Damage model', content: `Carmageddon was one of the first games with realistic car destruction: hoods crumple, wheels fly off, doors hang from hinges and a hard hit can tear a car apart. Cars jump ramps, tumble and fall off rooftops. The [[voodoo|3dfx Voodoo]] version added filtered textures and higher resolution.` },
    { id: 'controversy', title: 'Controversy and censorship', content: `The British Board of Film Classification at first refused to rate the game. To get it into stores, SCi released a version with pedestrians replaced by green-blooded zombies, and in Germany by robots leaking black oil. Players quickly found unofficial patches that "restored" the humans. In 1998, after an appeal, the original version was finally rated in the UK.` },
    { id: 'music', title: 'Music and sequel', content: `The soundtrack features the industrial metal band Fear Factory. Carmageddon II: Carpocalypse Now followed in November 1998 with fully 3D pedestrians and even more detailed destruction. In Russia the game is popular in [[lanparty|computer clubs]] thanks to its network races.` }
  ],
  seeAlso: ['dukenukem3d', 'tombraider', 'voodoo', 'lanparty', 'hockey98'],
  references: [
    'Carmageddon user manual. SCi, 1997.',
    'British Board of Film Classification ruling on Carmageddon, 1997.',
    'Game.EXE magazine, Carmageddon review, 1997.'
  ],
  categories: ['1997 Video Games', 'Driving Games', 'Video Game Controversies']
});

window.interpediaReg('warcraft2', 'games', {
  title: 'Warcraft II: Tides of Darkness (1995)',
  infobox: {
    title: 'Warcraft II: Tides of Darkness',
    badgeText: 'Blizzard Entertainment',
    fields: [
      { label: 'Разработчик', value: 'Blizzard Entertainment' },
      { label: 'Издатель', value: 'Blizzard Entertainment' },
      { label: 'Дата выхода', value: 'декабрь 1995' },
      { label: 'Жанр', value: 'стратегия в реальном времени' },
      { label: 'Платформа', value: '[[msdos|MS-DOS]], [[windows95|Win 95]], Macintosh' },
      { label: 'Стороны', value: 'Альянс Лордерона, Орда орков' },
      { label: 'Дополнение', value: 'Beyond the Dark Portal (1996)' },
      { label: 'Переиздание', value: 'Warcraft II: Battle.net Edition (октябрь 1999)' }
    ]
  },
  lead: `<strong>Warcraft II: Tides of Darkness</strong> — фэнтезийная стратегия в реальном времени компании Blizzard Entertainment, вышедшая в декабре 1995 года. Игра продолжает войну людей и орков, начатую в Warcraft: Orcs & Humans (1994), и переносит сражения на сушу, на море и в воздух: к золоту и лесу добавился третий ресурс, нефть для строительства военного флота.

Переход к графике SVGA в разрешении 640×480, удобное выделение отрядов рамкой, «туман войны» и встроенный редактор карт сделали Warcraft II главным соперником серии [[redalert|Command & Conquer]] и заложили основу успеха [[starcraft|StarCraft]].`,
  sections: [
    { id: 'history', title: 'От Orcs & Humans к Tides of Darkness', content: `Первая часть серии, Warcraft: Orcs & Humans, вышла в ноябре 1994 года и показала, что формула стратегии в реальном времени отлично работает в мире меча и магии. Однако управление в ней оставалось громоздким: игрок мог выделять не более четырёх бойцов за раз, а экран вмещал лишь небольшой участок карты.

Во второй части Blizzard перерисовала графику под высокое разрешение SVGA, увеличила предел выделения до девяти единиц и ввела контекстные команды правой кнопкой мыши. Кампания начинается после падения королевства Штормград: беженцы во главе с лордом Андуином Лотаром уплывают на север через Великое море и объединяют людей, эльфов, дворфов и гномов в Альянс Лордерона. Вождь Орды Оргрим Молот Рока заключает союз с лесными троллями, ограми и гоблинами и строит собственный флот.` },
    { id: 'gameplay', title: 'Игровой процесс и туман войны', content: `Обе стороны добывают три ресурса: крестьяне и батраки рубят лес и носят золото из шахт, а танкеры качают нефть с морских вышек. Флот играет решающую роль на островных картах: эсминцы, линкоры и джаггернауты обстреливают берег, подводные лодки и гигантские черепахи топят корабли из-под воды, а транспортные суда перебрасывают пехоту и катапульты в тыл противника. В небе сражаются грифоны и драконы, а гоблинские дирижабли и гномьи вертолёты ведут разведку.

Важным нововведением стал двухслойный «туман войны». Разведанная территория остаётся видна на карте, но если в секторе нет своих войск, её накрывает полупрозрачная пелена, скрывающая перемещения вражеской армии. Это заставляет постоянно патрулировать подступы к базе и береговую линию. Бойцы откликаются на повторные щелчки мышью комическими репликами, а заклинания паладинов, магов и рыцарей смерти (превращение врагов в овец, невидимость, буря и воскрешение скелетов) меняют исход схватки.` },
    { id: 'editor', title: 'Редактор карт и сетевые матчи', content: `В комплект игры вошёл редактор Warcraft II Map Editor для [[windows95|Win 95]] и DOS, сохраняющий карты в файлах формата PUD. Игроки расставляют шахты, леса и стартовые базы, меняют характеристики войск и записывают собственные звуковые реплики. Тысячи любительских карт быстро разошлись по [[bbs|BBS]], архивам Интернета и сборникам на [[cdrom|компакт-дискам]].

До восьми человек могут сражаться по локальной сети через протокол IPX или по [[modem56k|модему]]. В 1996 году программа Kali, имитирующая сеть IPX поверх интернет-соединения, превратила Warcraft II в одну из первых массовых сетевых стратегий. В российских [[lanparty|компьютерных клубах]] морские и сухопутные баталии на картах вроде Garden of War стали обязательной частью ночных дежурств.` },
    { id: 'expansions', title: 'Beyond the Dark Portal и Battle.net Edition', content: `Весной 1996 года вышло дополнение Warcraft II: Beyond the Dark Portal, созданное студией Cyberlore Studios под контролем Blizzard. Экспедиция Альянса проходит сквозь Тёмный портал в родной мир орков, Дренор, чтобы раз и навсегда закрыть разлом между мирами. На карте появились герои с особыми портретами и завышенными параметрами: паладин Туралион, следопыт Аллерия, маг Кадгар, вождь Гром Задира и рыцарь смерти Терон Кровожад.

В октябре 1999 года Blizzard выпустила переиздание Warcraft II: Battle.net Edition для [[windows95|Win 95]], [[windows98|Win 98]] и [[winnt4|Win NT]]. Оно объединило оригинал и дополнение, добавило поддержку бесплатной интернет-службы Battle.net, быстрые клавиши по образцу [[starcraft|StarCraft]] и рамку выделения на двенадцать бойцов. В сентябре 1999 года компания объявила о разработке трёхмерного продолжения Warcraft III, которое должно соединить стратегию с ролевой игрой и ожидается в 2000 году.` }
  ],
  seeAlso: ['starcraft', 'redalert', 'ageofempires', 'diablo', 'lanparty'],
  references: [
    'Warcraft II: Tides of Darkness — руководство пользователя. Blizzard Entertainment, 1995.',
    'Warcraft II: Battle.net Edition — справочник по сетевой игре. Blizzard Entertainment, 1999.',
    'Журнал «Магазин игрушек», обзор Warcraft II: Tides of Darkness, 1996.'
  ],
  links: [['http://www.blizzard.com', 'Официальный сайт Blizzard Entertainment'], ['http://www.cheatcc.com', 'Cheat Code Central: коды Warcraft II']],
  categories: ['Видеоигры 1995 года', 'Стратегии в реальном времени', 'Blizzard Entertainment']
}, {
  title: 'Warcraft II: Tides of Darkness (1995)',
  infobox: {
    title: 'Warcraft II: Tides of Darkness',
    badgeText: 'Blizzard Entertainment',
    fields: [
      { label: 'Developer', value: 'Blizzard Entertainment' },
      { label: 'Publisher', value: 'Blizzard Entertainment' },
      { label: 'Released', value: 'December 1995' },
      { label: 'Genre', value: 'real-time strategy' },
      { label: 'Platform', value: '[[msdos|MS-DOS]], [[windows95|Win 95]], Macintosh' },
      { label: 'Factions', value: 'Alliance of Lordaeron, Orcish Horde' },
      { label: 'Expansion', value: 'Beyond the Dark Portal (1996)' },
      { label: 'Re-release', value: 'Warcraft II: Battle.net Edition (October 1999)' }
    ]
  },
  lead: `<strong>Warcraft II: Tides of Darkness</strong> is a fantasy real-time strategy game from Blizzard Entertainment released in December 1995. Continuing the war between humans and orcs that began in Warcraft: Orcs & Humans (1994), it expands battles across land, sea and air and adds oil alongside gold and lumber to fuel naval fleets.

High-resolution 640×480 SVGA graphics, convenient box selection, a two-layer "fog of war" and a bundled map editor made Warcraft II the chief rival to the [[redalert|Command & Conquer]] series and laid the foundation for [[starcraft|StarCraft]].`,
  sections: [
    { id: 'history', title: 'From Orcs & Humans to Tides of Darkness', content: `The first game in the series, Warcraft: Orcs & Humans, arrived in November 1994 and proved that the real-time strategy formula worked well in a sword-and-sorcery world. Its interface, however, remained stiff: players could select at most four soldiers at once, and the screen showed only a narrow patch of terrain.

For the sequel Blizzard redrew all artwork in SVGA resolution, raised selection groups to nine units and introduced context-sensitive right-click orders. The story opens after the fall of Stormwind: refugees led by Lord Anduin Lothar sail north across the Great Sea and unite humans, elves, dwarves and gnomes into the Alliance of Lordaeron. Warchief Orgrim Doomhammer allies the Orcish Horde with forest trolls, ogres and goblins and builds an armada of his own.` },
    { id: 'gameplay', title: 'Gameplay and fog of war', content: `Both factions gather three resources: peasants and peons chop lumber and haul gold from mines, while tankers pump oil from offshore rigs. Naval power decides island maps: destroyers, battleships and juggernauts shell the coast, submarines and giant turtles sink ships from below, and transports land footmen and catapults behind enemy lines. Gryphon riders and dragons clash in the sky while goblin zeppelins and gnomish flying machines scout ahead.

A major addition was the two-stage fog of war. Explored terrain remains drawn on the map, but once friendly troops leave an area a gray shroud settles over it and hides enemy movements. Players must patrol coastlines and crossroads constantly. Clicking a unit repeatedly triggers humorous voice lines, while spells cast by paladins, mages and death knights (polymorphing enemies into sheep, invisibility, blizzard and raising skeletons) can turn a battle around.` },
    { id: 'editor', title: 'Map editor and network play', content: `The box included the Warcraft II Map Editor for [[windows95|Win 95]] and DOS, which saves custom scenarios as PUD files. Players place gold mines, forests and starting bases, tweak unit statistics and record custom sound effects. Thousands of fan-made maps spread across [[bbs|BBSes]], Internet archives and magazine [[cdrom|CD-ROMs]].

Up to eight players can fight over an IPX local network or by [[modem56k|modem]]. In 1996 the Kali utility, which emulates IPX over TCP/IP connections, turned Warcraft II into one of the earliest popular online strategy games. In [[lanparty|computer clubs]] naval and land battles on maps such as Garden of War became a staple of all-night sessions.` },
    { id: 'expansions', title: 'Beyond the Dark Portal and Battle.net Edition', content: `In spring 1996 Blizzard and Cyberlore Studios released the expansion Warcraft II: Beyond the Dark Portal. An Alliance expedition marches through the Dark Portal into Draenor, the shattered homeworld of the orcs, to seal the rift forever. The campaigns rely on hero units with unique portraits and boosted stats, including the paladin Turalyon, ranger Alleria, mage Khadgar, chieftain Grom Hellscream and death knight Teron Gorefiend.

In October 1999 Blizzard published Warcraft II: Battle.net Edition for [[windows95|Win 95]], [[windows98|Win 98]] and [[winnt4|Win NT]]. It combines the original game and expansion, adds free matchmaking over Battle.net, adopts [[starcraft|StarCraft]]-style hotkeys and raises unit selection to twelve. In September 1999 the company announced Warcraft III, a 3D role-playing strategy hybrid expected in 2000.` }
  ],
  seeAlso: ['starcraft', 'redalert', 'ageofempires', 'diablo', 'lanparty'],
  references: [
    'Warcraft II: Tides of Darkness user manual. Blizzard Entertainment, 1995.',
    'Warcraft II: Battle.net Edition multiplayer guide. Blizzard Entertainment, 1999.',
    'Computer Gaming World, Warcraft II: Tides of Darkness review, 1996.'
  ],
  links: [['http://www.blizzard.com', 'Blizzard Entertainment official site'], ['http://www.cheatcc.com', 'Cheat Code Central: Warcraft II codes']],
  categories: ['1995 Video Games', 'Real-Time Strategy', 'Blizzard Entertainment']
}, ['warcraft', 'wc2']);

window.interpediaReg('quake3', 'games', {
  title: 'Quake III Arena (1999)',
  infobox: {
    title: 'Quake III Arena',
    badgeText: 'id Software / Activision',
    fields: [
      { label: 'Разработчик', value: 'id Software' },
      { label: 'Издатель', value: 'Activision' },
      { label: 'Дата выхода', value: '2 декабря 1999' },
      { label: 'Жанр', value: 'сетевой шутер от первого лица' },
      { label: 'Движок', value: 'id Tech 3 (только OpenGL)' },
      { label: 'Режимы', value: 'Free For All, Tournament (1 на 1), Team Deathmatch, Capture the Flag' },
      { label: 'Музыка', value: 'Sonic Mayhem, Front Line Assembly' },
      { label: 'Требования', value: '[[pentium2|Pentium II]] 266, 64 МБ ОЗУ, 3D-ускоритель с OpenGL' }
    ]
  },
  lead: `<strong>Quake III Arena</strong> — сетевой шутер от первого лица студии id Software, изданный Activision 2 декабря 1999 года. Впервые в истории серии разработчики полностью отказались от сюжетной кампании: бойцы разных эпох и миров перенесены загадочными Повелителями Арены на парящие в пустоте каменные и металлические площадки, чтобы бесконечно сражаться друг с другом.

Игра вышла через десять дней после [[ut99|Unreal Tournament]] и разделила поклонников жанра на два лагеря. Quake III Arena требует обязательного наличия 3D-ускорителя с поддержкой OpenGL, выводит изогнутые поверхности и делает ставку на предельную скорость реакции, точность прицела и мастерство распрыжки.`,
  sections: [
    { id: 'concept', title: 'Отказ от сюжета и турнир на Арене', content: `После выхода [[quake2|Quake II]] Джон Кармак и геймдизайнеры id Software пришли к выводу, что большинство игроков проводит месяцы на сетевых серверах, тогда как одиночные уровни проходят один раз. В Quake III Arena одиночный режим построен как турнирная лестница из семи ярусов (Tiers) против компьютерных противников, ботов, и завершается поединком с непобедимым мастером Ксаэро (Xaero) на карте The Very End of You.

У каждого бота свой характер, любимое оружие и манера поведения в чате. Инструктор Крэш (Crash) обучает новичка в первом ярусе, ветеран первой части Рейнджер (Ranger) и угрюмый сержант с сигарой Сардж (Sarge) предпочитают ракетницы, а охотница Хантер (Hunter) преследует жертву с молниемётом. В версии для каталога Steam в нашей системе доступны начальные ярусы арены (Trainee и Skilled) и быстрые схватки с ботами на классических картах Q3DM1 (Arena Gate) и Q3DM7 (Temple of Retribution).` },
    { id: 'engine', title: 'Движок id Tech 3 и отказ от программного рендера', content: `Движок игры стал первой технологией id Software, в которой вообще нет программного рендеринга силами центрального процессора: для запуска необходима видеокарта с аппаратной поддержкой OpenGL, такая как [[voodoo2|3dfx Voodoo 2]], Voodoo 3, [[rivatnt|NVIDIA RIVA TNT]] или представленная осенью 1999 года GeForce 256.

Главная графическая новинка движка — гладкие изогнутые поверхности на основе бикубических сплайнов Безье. Своды готических храмов, трубы, арки и винтовые колонны больше не состоят из рубленных многоугольников, а уровень детализации кривых настраивается под мощность видеокарты. Движок использует 32-битный цвет, систему многослойных шейдеров поверхностей, объёмный туман, порталы и зеркала. Модели персонажей разделены на три части (ноги, торс и голова), поэтому боец может бежать в одну сторону, а целиться и поворачивать корпус в другую.` },
    { id: 'weapons', title: 'Арсенал, физика движения и награды', content: `Девять видов оружия выверены так, чтобы каждый ствол решал свою задачу:
<ul>
<li><strong>Перчатка с пилой (Gauntlet) и автомат (Machinegun)</strong> выдаются при возрождении; попадание перчаткой приносит сопернику обидную медаль «Humiliation».</li>
<li><strong>Дробовик (Shotgun) и гранатомёт (Grenade Launcher)</strong> контролируют узкие коридоры и углы.</li>
<li><strong>Ракетница (Rocket Launcher)</strong> позволяет подбрасывать врагов в воздух и совершать высокие прыжки с подрывом под ногами (rocket jump).</li>
<li><strong>Молниемёт (Lightning Gun) и плазмаган (Plasma Gun)</strong> выжигают цель непрерывным лучом или очередью сгустков на средней дистанции.</li>
<li><strong>Рельсотрон (Railgun)</strong> пробивает мгновенным спиральным лучом через всю карту и вознаграждает два попадания подряд медалью «Impressive».</li>
<li><strong>BFG10K</strong> спрятана в самых опасных точках арены и накрывает площадку скорострельными зарядами плазмы.</li>
</ul>

Физика движения унаследовала и развила распрыжку с поворотом в воздухе (strafe-jumping): опытный игрок набирает скорость вдвое выше обычного бега и перелетает через пропасти с помощью пружинных площадок (jump pads) и телепортов. За борьбу вокруг усилителей Quad Damage (четырёхкратный урон), Haste (ускорение) и Regeneration (восстановление здоровья) разворачиваются главные дуэли.` },
    { id: 'q3test', title: 'Q3Test, клубы и спор с Unreal Tournament', content: `Ещё весной 1999 года id Software выложила в Сеть бесплатную тестовую сборку Q3Test с двумя картами (Q3Test1 и Q3Test2), которую скачали сотни тысяч человек. К моменту декабрьского выхода вокруг игры уже сформировались кланы, а серверные модификации вроде InstaGib (дуэли только на рельсотронах с убийством одним лучом) и Rocket Arena начали переходить со второй части на третью.

В российских [[lanparty|компьютерных клубах]] и на страницах журналов декабрь 1999 года прошёл под знаком спора «Quake III против [[ut99|Unreal Tournament]]». Сторонники UT хвалят разнообразие командных режимов и двойные выстрелы оружия, а приверженцы Quake III ценят чистую скорость дуэлей один на один в режиме Tournament, читаемость силуэтов на фоне стен и чёткую обратную связь каждого попадания.` }
  ],
  seeAlso: ['quake', 'quake2', 'ut99', 'voodoo2', 'rivatnt', 'lanparty'],
  references: [
    'Quake III Arena: руководство пользователя. Activision / id Software, декабрь 1999.',
    'Журнал «Игромания», сравнение Quake III Arena и Unreal Tournament, декабрь 1999.',
    'Журнал Game.EXE, тест 3D-ускорителей в Q3Test и Quake III Arena, 1999.'
  ],
  links: [['http://www.steampowered.com', 'Каталог Steam: Quake III Arena'], ['http://www.3dfx-zone.com', '3dfx Voodoo Zone: настройка OpenGL'], ['http://forum.games98.com', 'Форум GamerZone']],
  categories: ['Видеоигры 1999 года', 'Шутеры от первого лица', 'id Software', 'Сетевые игры']
}, {
  title: 'Quake III Arena (1999)',
  infobox: {
    title: 'Quake III Arena',
    badgeText: 'id Software / Activision',
    fields: [
      { label: 'Developer', value: 'id Software' },
      { label: 'Publisher', value: 'Activision' },
      { label: 'Released', value: 'December 2, 1999' },
      { label: 'Genre', value: 'online first-person shooter' },
      { label: 'Engine', value: 'id Tech 3 (OpenGL only)' },
      { label: 'Modes', value: 'Free For All, Tournament (1v1), Team Deathmatch, Capture the Flag' },
      { label: 'Music', value: 'Sonic Mayhem, Front Line Assembly' },
      { label: 'Requirements', value: '[[pentium2|Pentium II]] 266, 64 MB RAM, OpenGL 3D accelerator' }
    ]
  },
  lead: `<strong>Quake III Arena</strong> is a multiplayer first-person shooter developed by id Software and published by Activision on December 2, 1999. For the first time in the series, the studio dropped a traditional story campaign altogether: warriors from different eras and worlds are summoned by the mysterious Arena Eternal to fight endlessly across stone temples and suspended metal platforms in space.

Released ten days after [[ut99|Unreal Tournament]], the game split shooter fans into two camps. Quake III Arena requires an OpenGL 3D accelerator, introduces curved surfaces and focuses on raw movement speed, aim precision and duel mastery.`,
  sections: [
    { id: 'concept', title: 'Dropping the story for the Arena Eternal', content: `After [[quake2|Quake II]], John Carmack and id Software's designers concluded that most players spent months on multiplayer servers while finishing single-player levels only once. In Quake III Arena, single-player mode is structured as a seven-tier tournament ladder against computer-controlled bots, culminating in a one-on-one duel against the grand master Xaero on the map The Very End of You.

Every bot has a distinct personality, preferred weapon and chat banter. The drill instructor Crash teaches newcomers in the opening tier, the first game's veteran Ranger and cigar-chomping Sarge favor rocket launchers, and Hunter stalks targets with the lightning gun. The edition available in our system's Steam catalog includes the opening Trainee and Skilled tiers as well as instant skirmishes against bots on classic arenas such as Q3DM1 (Arena Gate) and Q3DM7 (Temple of Retribution).` },
    { id: 'engine', title: 'The id Tech 3 engine and OpenGL requirement', content: `The game's engine is the first id Software technology with no software renderer at all: launching the game requires a video card with hardware OpenGL support, such as a [[voodoo2|3dfx Voodoo 2]], Voodoo 3, [[rivatnt|NVIDIA RIVA TNT]] or the GeForce 256 introduced in autumn 1999.

Its signature visual advance is smooth curved surfaces built from bicubic Bézier patches. Gothic arches, pipes, domes and spiral columns no longer look chopped out of flat polygons, and the tessellation slider scales curve detail to match the player's card. The engine renders in 32-bit color with multi-pass surface shaders, volumetric fog, portals and mirrors. Character models are split into separate legs, torso and head meshes so a fighter can sprint in one direction while twisting at the waist to aim in another.` },
    { id: 'weapons', title: 'Weapons, movement physics and medals', content: `Nine weapons are tuned so that each serves a distinct role in combat:
<ul>
<li><strong>Gauntlet and Machinegun</strong> are issued on spawn; a melee kill with the spinning blade awards the humiliating "Humiliation" medal.</li>
<li><strong>Shotgun and Grenade Launcher</strong> dominate tight corridors and corners.</li>
<li><strong>Rocket Launcher</strong> pops opponents into the air for mid-air follow-up shots and lets players rocket-jump to high ledges.</li>
<li><strong>Lightning Gun and Plasma Gun</strong> melt targets with a continuous beam or rapid stream of plasma at medium range.</li>
<li><strong>Railgun</strong> fires an instant spiral slug across the entire arena and rewards two consecutive hits with the announcer's "Impressive" medal.</li>
<li><strong>BFG10K</strong> rests on the most exposed pedestals and blankets platforms in rapid-fire plasma blasts.</li>
</ul>

Movement physics refine air-turning and strafe-jumping: a skilled player builds momentum to twice normal running speed and vaults across chasms using jump pads and teleporters. Duels revolve around timing the respawn of Quad Damage, Haste, Regeneration and red armor.` },
    { id: 'q3test', title: 'Q3Test, LAN clubs and the Unreal Tournament rivalry', content: `In spring 1999 id Software released Q3Test, a free public test build with two maps (Q3Test1 and Q3Test2) that hundreds of thousands of players downloaded. By the time the retail box shipped in December, clans had already formed and server rulesets such as InstaGib (one-hit-kill railgun duels) and Rocket Arena were migrating from the second game to the third.

Across [[lanparty|computer clubs]] and magazine pages, December 1999 has been defined by the debate between Quake III Arena and [[ut99|Unreal Tournament]]. UT fans point to its team modes and alternate firing modes, while Quake III devotees prize the pure speed of one-on-one Tournament duels, clean enemy silhouettes against arena walls and crisp hit feedback.` }
  ],
  seeAlso: ['quake', 'quake2', 'ut99', 'voodoo2', 'rivatnt', 'lanparty'],
  references: [
    'Quake III Arena user manual. Activision / id Software, December 1999.',
    'Igromania magazine, Quake III Arena vs. Unreal Tournament comparison, December 1999.',
    'Game.EXE magazine, 3D accelerator benchmarks in Q3Test and Quake III Arena, 1999.'
  ],
  links: [['http://www.steampowered.com', 'Steam Catalog: Quake III Arena'], ['http://www.3dfx-zone.com', '3dfx Voodoo Zone: OpenGL setup'], ['http://forum.games98.com', 'GamerZone Forum']],
  categories: ['1999 Video Games', 'First-Person Shooters', 'id Software', 'Online Games']
}, ['q3a', 'quake3arena']);

window.interpediaReg('maxpayne', 'games', {
  title: 'Max Payne',
  hatnote: 'Статья о нуарном боевике финской студии Remedy Entertainment и компании 3D Realms (демоверсия для Win 98 на диске «Игромании»).',
  infobox: {
    title: 'Max Payne',
    badgeText: 'Remedy Entertainment / 3D Realms',
    fields: [
      { label: 'Разработчик', value: 'Remedy Entertainment' },
      { label: 'Продюсер', value: '3D Realms (Скотт Миллер, Джордж Бруссард)' },
      { label: 'Сценарист', value: 'Сэм Лейк (Сами Ярви)' },
      { label: 'Жанр', value: 'боевик от третьего лица, неонуар' },
      { label: 'Движок', value: 'Max-FX' },
      { label: 'Место действия', value: 'Нью-Йорк во время снежной бури' },
      { label: 'Особенность', value: 'замедление времени Bullet Time, страницы графического романа' },
      { label: 'Издание в системе', value: 'Max Payne Demo (диск «Игромании»)' }
    ]
  },
  lead: `<strong>Max Payne</strong> — кинематографический боевик от третьего лица финской студии Remedy Entertainment, создаваемый при участии продюсеров 3D Realms (авторов [[dukenukem3d|Duke Nukem 3D]]). Впервые показанный на выставках E3 в 1998 и 1999 годах и представленный демоверсией для [[windows98|Win 98]] на компакт-диске журнала «Игромания», проект соединяет мрачный полицейский детектив в заснеженном Нью-Йорке с акробатическими перестрелками в стиле гонконгских боевиков Джона Ву.

Вместо привычных видеороликов история подаётся через озвученные полосы графического романа, а в бою игрок включает замедление времени Bullet Time и расстреливает гангстеров в затяжном прыжке с двумя береттами в руках.`,
  sections: [
    { id: 'remedy', title: 'От демосцены Future Crew к союзу с 3D Realms', content: `Студию Remedy Entertainment основали в 1995 году в финском городе Эспоо участники знаменитой группы [[demoscene|демосцены]] Future Crew, чьё демо [[secondreality|Second Reality]] (1993) прославилось на весь компьютерный мир. После выхода гоночного боевика с видом сверху Death Rally (1996) издатель 3D Realms предложил финским программистам взяться за полноценный трёхмерный проект под рабочим названием Dark Justice, переименованный позже в Max Heat и наконец в Max Payne.

Сценарий написал друг основателей студии Сами Ярви под псевдонимом Сэм Лейк. Чтобы сэкономить бюджет на актёрах для графического романа, разработчики фотографировали самих себя, своих друзей и родственников в декорациях Хельсинки, а сам Сэм Лейк подарил главному герою собственное лицо с фирменной кривой ухмылкой.` },
    { id: 'story', title: 'Сюжет: метель, «Валькирин» и первая часть «Американской мечты»', content: `Исповедь героя начинается на крыше небоскрёба под вой полицейских сирен, после чего действие возвращается на три года назад. У оперативника полиции Нью-Йорка Макса Пейна наркоманы, обезумевшие от нового синтетического наркотика «Валькирин» (Valkyr), убивают жену Мишель и новорождённую дочь. Макс переводится в Управление по борьбе с наркотиками (DEA) и уходит под прикрытие в мафиозную семью Пунчинелло.

Когда на заброшенной станции метро «Роско-стрит» неизвестные убивают его единственного связного и друга Алекса Балдера, полиция объявляет самого Пейна убийцей. За одну бесконечную ночь на фоне сильнейшей в истории Нью-Йорка снежной бури Макс пробивается через станцию метро, притон в отеле Рико Муэрте, многоквартирные трущобы и готический ночной клуб «Рагна Рок» одержимого скандинавскими мифами гангстера Джека Люпино. В демоверсии Max Payne Demo для [[windows98|Win 98]] (<code>D:\\demo\\maxpaynedemo.exe</code> на диске «Игромании») представлены тренировочный полигон DEA, пролог и все девять глав первой части («The American Dream»).` },
    { id: 'bullettime', title: 'Bullet Time, стрельба в прыжке и болеутоляющие', content: `Боевая система построена вокруг механики Bullet Time («время пули»). По нажатию клавиши течение времени замедляется в несколько раз, звук выстрелов становится гулким и низким, но прицел по-прежнему двигается со скоростью руки игрока. Одновременно с этим Макс может совершить уклоняющийся прыжок (Shootdodge) вперёд, назад или вбок, продолжая вести прицельный огонь в полёте, пока гильзы медленно звенят об пол.

Здоровье не восстанавливается само и не пополняется аптечками на полу: Макс глотает баночки болеутоляющего (Painkillers), которые находит в шкафчиках ванных комнат и на столах охраны. В его плаще помещается целый арсенал: две беретты, обрез и помповый дробовик, пистолеты-пулемёты Ингрэм, гранаты, коктейли Молотова и снайперская винтовка, при выстреле из которой камера летит следом за самой пулей до самого попадания во врага. Для тех, кто прошёл основную историю, открываются режимы повышенной сложности Dead on Arrival (с ограничением на семь сохранений за главу) и гонка на время New York Minute, где за каждого убитого врага начисляются драгоценные секунды.` },
    { id: 'maxfx', title: 'Движок Max-FX и фотографические текстуры', content: `Программисты Remedy написали собственный движок Max-FX с расчётом систем частиц, дыма, искр и динамических источников света. Каждая выпущенная пуля в игре представляет собой отдельный физический снаряд со своей скоростью и траекторией, а не мгновенный луч: на стенах остаются выбоины в штукатурке, кафельной плитке и деревянных панелях, а стёкла витрин разлетаются на осколки.

Чтобы добиться достоверного вида нью-йоркских подворотен и станций подземки, художники Remedy отправились в Нью-Йорк в сопровождении телохранителей и отсняли тысячи фотографий кирпичной кладки, ржавых пожарных лестниц, граффити и облупившихся дверей. Эти снимки легли в основу текстур высокого разрешения, которые сделали Max Payne одной из самых зрелищных витрин для видеокарт класса [[rivatnt|RIVA TNT]] и GeForce.` }
  ],
  seeAlso: ['demoscene', 'secondreality', 'dukenukem3d', 'halflife', 'gta'],
  references: [
    'Max Payne: документация издания Win 98 Edition. Remedy Entertainment / 3D Realms.',
    'Материалы показа Max Payne на выставке E3 1999 // Журнал Game.EXE, 1999.',
    'Журнал «Страна игр», репортаж о студии Remedy Entertainment и движке Max-FX, 1999.'
  ],
  links: [['http://www.igromania.ru', 'Журнал «Игромания»: Max Payne Demo на диске'], ['http://forum.games98.com', 'Форум GamerZone']],
  categories: ['Боевики от третьего лица', 'Remedy Entertainment', '3D Realms', 'Неонуар']
}, {
  title: 'Max Payne',
  hatnote: 'This article is about the neo-noir third-person action game by Remedy Entertainment and 3D Realms (Win 98 demo on the Igromania CD).',
  infobox: {
    title: 'Max Payne',
    badgeText: 'Remedy Entertainment / 3D Realms',
    fields: [
      { label: 'Developer', value: 'Remedy Entertainment' },
      { label: 'Producer', value: '3D Realms (Scott Miller, George Broussard)' },
      { label: 'Writer', value: 'Sam Lake (Sami Järvi)' },
      { label: 'Genre', value: 'third-person shooter, neo-noir' },
      { label: 'Engine', value: 'Max-FX' },
      { label: 'Setting', value: 'New York City during the worst blizzard in history' },
      { label: 'Signature features', value: 'Bullet Time slow motion, graphic novel panels' },
      { label: 'System edition', value: 'Max Payne Demo (Igromania CD)' }
    ]
  },
  lead: `<strong>Max Payne</strong> is a cinematic third-person shooter developed by the Finnish studio Remedy Entertainment in partnership with 3D Realms (creators of [[dukenukem3d|Duke Nukem 3D]]). Showcased at E3 in 1998 and 1999 and available in our system as a [[windows98|Win 98]] demo on the Igromania magazine CD, the game blends a hard-boiled police thriller set during a New York blizzard with John Woo-inspired gunplay.

Instead of conventional pre-rendered cutscenes, the story unfolds through voice-acted graphic novel pages, while combat lets the player trigger Bullet Time slow motion and dive through doorways firing dual Berettas.`,
  sections: [
    { id: 'remedy', title: 'From Future Crew on the demoscene to 3D Realms', content: `Remedy Entertainment was founded in 1995 in Espoo, Finland, by members of the legendary [[demoscene|demoscene]] group Future Crew, whose 1993 PC demo [[secondreality|Second Reality]] became a benchmark of computer art. Following Remedy's top-down combat racer Death Rally (1996), producer 3D Realms backed the studio on an ambitious 3D action game first pitched as Dark Justice, briefly called Max Heat and finally titled Max Payne.

The script was written by Sami Järvi, a close friend of the founders credited under the pen name Sam Lake. To keep production lean while shooting the graphic novel sequences, the team photographed themselves, friends and relatives around Helsinki, and Sam Lake stepped in as the face model for Max himself, complete with his trademark grimace.` },
    { id: 'story', title: 'Story: the blizzard, Valkyr and Part I "The American Dream"', content: `The story opens on the roof of a Manhattan skyscraper as police sirens wail below, then flashes back three years. NYPD detective Max Payne comes home to find his wife Michelle and baby daughter murdered by junkies high on a military designer drug called Valkyr. Max transfers to the DEA and goes deep undercover inside the Punchinello Mafia family.

When his only handler and friend Alex Balder is gunned down on the platform of the derelict Roscoe Street subway station, the police frame Payne for the murder. Over one relentless night during the worst snowstorm in New York's history, Max shoots his way through the subway, a sleazy tenement hotel, mob-run slums and the gothic Ragna Rock nightclub of Norse-obsessed gangster Jack Lupino. The [[windows98|Win 98]] Max Payne Demo on the Igromania CD (<code>D:\\demo\\maxpaynedemo.exe</code>) includes the DEA training course, the prologue and all nine chapters of Part I ("The American Dream").` },
    { id: 'bullettime', title: 'Bullet Time, Shootdodge and painkillers', content: `Gunfights revolve around Bullet Time. Pressing the time-slow key drops the world into slow motion and pitches gunfire down to a deep roar while keeping the crosshair responsive to the player's mouse. Combining Bullet Time with a directional movement key launches Max into a horizontal Shootdodge dive forward, backward or sideways, letting him clear a room in mid-air as brass shell casings clatter across the floorboards.

Health does not regenerate and there are no glowing medkits: Max swallows bottles of painkillers scavenged from bathroom cabinets and guard desks. Under his leather trench coat he carries dual Berettas, pump-action and sawed-off shotguns, dual Ingram MAC-10 submachine guns, grenades, Molotov cocktails and a sniper rifle whose camera tracks the bullet in flight all the way to impact. Completing the story unlocks Dead on Arrival mode (which limits the player to seven saves per chapter) and New York Minute, a race against a ticking countdown clock replenished only by killing enemies.` },
    { id: 'maxfx', title: 'The Max-FX engine and photo-sourced textures', content: `Remedy's programmers built the in-house Max-FX engine around particle systems, volumetric smoke, sparks and dynamic lighting. Every bullet fired in the game is simulated as an individual projectile with its own velocity and flight path rather than an instant ray: plaster, bathroom tile and wood paneling chip away where rounds strike, and plate-glass windows shatter into shards.

To give the slums and subway stations an authentic look, Remedy's artists traveled to New York City with bodyguards and shot thousands of reference photographs of brickwork, rusted fire escapes, graffiti and peeling apartment doors. Those high-resolution textures made Max Payne a visual showcase for [[rivatnt|RIVA TNT]] and GeForce accelerators.` }
  ],
  seeAlso: ['demoscene', 'secondreality', 'dukenukem3d', 'halflife', 'gta'],
  references: [
    'Max Payne (Win 98 Edition) documentation. Remedy Entertainment / 3D Realms.',
    'E3 1999 coverage of Max Payne // Game.EXE magazine, 1999.',
    'Strana Igr magazine, feature on Remedy Entertainment and the Max-FX engine, 1999.'
  ],
  links: [['http://www.igromania.ru', 'Igromania magazine: Max Payne Demo on the CD'], ['http://forum.games98.com', 'GamerZone Forum']],
  categories: ['Third-Person Shooters', 'Remedy Entertainment', '3D Realms', 'Neo-Noir']
}, ['maxpayne98']);

window.interpediaReg('tekken3', 'games', {
  title: 'Tekken 3 (1998)',
  infobox: {
    title: 'Tekken 3',
    badgeText: 'Namco',
    fields: [
      { label: 'Разработчик', value: 'Namco' },
      { label: 'Издатель', value: 'Namco' },
      { label: 'Выход', value: 'март 1997 (автоматы), март 1998 (консоли), демоверсия Tekken 98 Demo' },
      { label: 'Жанр', value: 'трёхмерный файтинг' },
      { label: 'Управление', value: '4 кнопки конечностей (левая/правая рука, левая/правая нога)' },
      { label: 'Режимы', value: 'Arcade, Versus, Team Battle, Survival, Time Attack, Practice, Tekken Force, Tekken Ball' },
      { label: 'Бойцов в ростере', value: 'более 20 (включая скрытых персонажей)' },
      { label: 'Издание в системе', value: 'Tekken 98 Demo (диск «Игромании»)' }
    ]
  },
  lead: `<strong>Tekken 3</strong> — трёхмерный файтинг японской компании Namco, появившийся на аркадных автоматах System 12 весной 1997 года, перенесённый на домашние системы в марте 1998 года и представленный на ПК демоверсией <strong>Tekken 98 Demo</strong> на компакт-диске журнала «Игромания». Турнир «Король Железного кулака 3» собирает мастеров боевых искусств со всего света спустя девятнадцать лет после событий второй части.

В отличие от большинства файтингов, где кнопки отвечают за слабый, средний и сильный удар, в Tekken 3 каждая из четырёх кнопок привязана к конкретной конечности бойца, а свободный шаг вглубь экрана и подбрасывание соперника в воздух превращают поединок в скоростную шахматную партию.`,
  sections: [
    { id: 'system', title: 'Четыре конечности, шаг в сторону и воздушные серии', content: `Боевая схема Tekken 3 интуитивно понятна даже тем, кто впервые сел за клавиатуру или геймпад: две верхние кнопки наносят удары левой и правой рукой, две нижние — левой и правой ногой. Из этих четырёх клавиш и направлений складываются десятки приёмов, перехватов, бросков и непрерывных десятиударных серий (10-hit combos).

Третья часть впервые сделала перемещение по третьей оси (sidestep) полноценным приёмом для всех бойцов: короткое нажатие вверх или вниз уводит персонажа на задний или передний план, позволяя пропустить прямолинейный выпад врага мимо себя и тут же наказать его в спину. Основа высокого мастерства — удары-подбросы (launchers), после которых беззащитного противника удерживают в воздухе серией точных попаданий (juggle), не давая ему упасть на татами.` },
    { id: 'story', title: 'Третий турнир Железного кулака и школы единоборств', content: `По сюжету старейшина клана Мисима Хэйхати пробуждает в центральноамериканских руинах древнее божество боя Огра (Ogre). Огр выслеживает и повергает лучших мастеров мира, в том числе Дзюн Кадзаму. Её пятнадцатилетний сын Дзин Кадзама приходит к деду Хэйхати, обучается фамильному стилю карате Мисима и вступает в третий турнир, чтобы отомстить чудовищу.

Каждый боец в ростере владеет узнаваемой школой единоборств, записанной с помощью захвата движений (motion capture):
<ul>
<li><strong>Карате стиля Мисима и Кёкусинкай</strong> (Дзин Кадзама, Хэйхати Мисима) и <strong>дзюдо с сокрушительными прямыми ударами</strong> (Пол Феникс).</li>
<li><strong>Капоэйра</strong> (Эдди Гордо), чьи непрерывные вращения на руках и ногах стали грозой новичков и породили вечные споры в клубах о «честной игре».</li>
<li><strong>Кунг-фу в стиле Джета Ли и Джеки Чана</strong> (Маршалл и Форест Лоу, а также полицейский Лэй Улун со стойками пяти зверей и «пьяным кулаком»).</li>
<li><strong>Тхэквондо</strong> (Хваран), <strong>китайское кэмпо и багуачжан</strong> (Лин Сяоюй) и <strong>рестлинг с цепочками захватов</strong> (Кинг в маске ягуара).</li>
<li><strong>Меченосец-ниндзя в механической броне</strong> (Ёсимицу) и <strong>боевое самбо</strong> (офицер спецназа Сергей Драгунов в расширенном ростере издания).</li>
</ul>

Среди секретных и необычных бойцов встречаются деревянный манекен Мокудзин, который в каждом раунде копирует стойку случайного участника, учёный доктор Босконович, сражающийся лёжа на спине, медведь Кума и маленький динозавр Гон.` },
    { id: 'modes', title: 'Режимы игры: от командных боёв до Tekken Force и пляжного волейбола', content: `Помимо классической аркадной лестницы (Arcade) с открываемыми концовками за каждого героя и дуэлей вдвоём за одним экраном (Versus), Tekken 3 предлагает богатый набор режимов для компании друзей:
<dl>
<dt>Team Battle</dt><dd>командный матч до восьми бойцов с каждой стороны, где победитель раунда остаётся на арене с остатком здоровья против следующего соперника.</dd>
<dt>Survival и Time Attack</dt><dd>испытание на бесконечную череду побед с одной полоской жизни и прохождение турнира на рекордное время.</dd>
<dt>Practice</dt><dd>тренировочный зал с выводом списка команд, программируемым манекеном и отработкой сложных воздушных связок.</dd>
<dt>Tekken Force</dt><dd>боковой боевик в духе классических beat 'em up, где игрок бежит слева направо через четыре уровня, раскидывая отряды охраны Tekken Force и собирая жареных цыплят для лечения.</dd>
<dt>Tekken Ball</dt><dd>пляжный волейбол на берегу моря, в котором удары по мячу заряжают его разрушительной энергией и наносят урон сопернику на другой половине площадки.</dd>
</dl>` },
    { id: 'pc98', title: 'Tekken 98 Demo на персональных компьютерах', content: `В конце 1990-х трёхмерные файтинги редко заглядывали на ПК в полном виде, поэтому появление Tekken 3 в клубах и на домашних машинах стало событием. В демоверсии Tekken 98 Demo с диска «Игромании» (<code>D:\\demo\\tekken98demo.exe</code>) игра работает с частотой 60 кадров в секунду, поддерживает настройку управления для двух игроков на одной клавиатуре, просмотр всех приёмов прямо из меню паузы и смену костюмов бойцов. В перерывах между сетевыми партиями в [[quake3|Quake III Arena]] и [[starcraft|StarCraft]] вокруг одного монитора собираются зрители на быстрые турниры Team Battle восемь на восемь.` }
  ],
  seeAlso: ['quake3', 'ut99', 'lanparty', 'carmageddon', 'hockey98', 'worldcup98'],
  references: [
    'Tekken 3: справочник приёмов и руководство игрока. Namco, 1998.',
    'Журнал «Великий Dракон», полный разбор бойцов и связок Tekken 3, 1998.',
    'Журнал «Страна игр», обзор Tekken 3, 1998.'
  ],
  links: [['http://www.igromania.ru', 'Журнал «Игромания»: Tekken 98 Demo на диске'], ['http://www.cheatcc.com', 'Cheat Code Central: секреты и бойцы Tekken 3']],
  categories: ['Видеоигры 1998 года', 'Файтинги', 'Namco']
}, {
  title: 'Tekken 3 (1998)',
  infobox: {
    title: 'Tekken 3',
    badgeText: 'Namco',
    fields: [
      { label: 'Developer', value: 'Namco' },
      { label: 'Publisher', value: 'Namco' },
      { label: 'Released', value: 'March 1997 (arcade), March 1998 (home), Tekken 98 Demo' },
      { label: 'Genre', value: '3D fighting game' },
      { label: 'Controls', value: '4 limb buttons (left/right punch, left/right kick)' },
      { label: 'Modes', value: 'Arcade, Versus, Team Battle, Survival, Time Attack, Practice, Tekken Force, Tekken Ball' },
      { label: 'Roster', value: 'over 20 fighters (including unlockable characters)' },
      { label: 'System edition', value: 'Tekken 98 Demo (Igromania CD)' }
    ]
  },
  lead: `<strong>Tekken 3</strong> is a 3D fighting game by the Japanese company Namco, first released on System 12 arcade hardware in spring 1997, brought home in March 1998 and available on the PC as the <strong>Tekken 98 Demo</strong> on the Igromania magazine CD. Set nineteen years after the second tournament, the King of Iron Fist Tournament 3 gathers martial artists from around the globe.

Instead of assigning buttons to light, medium and heavy attacks, Tekken 3 maps its four attack buttons directly to the fighter's left punch, right punch, left kick and right kick, while three-dimensional sidestepping and aerial juggles turn every round into high-speed chess.`,
  sections: [
    { id: 'system', title: 'Four limbs, sidestepping and aerial juggles', content: `Tekken 3's control scheme makes immediate physical sense on either a gamepad or a keyboard: the two upper buttons throw left and right punches, and the two lower buttons throw left and right kicks. Combining those four buttons with directional taps produces dozens of strikes, reversals, chain throws and ten-hit combos.

The third installment made movement along the depth axis (sidestepping) a core tool for the entire roster: a quick tap up or down steps into the background or foreground, letting a defender slip past a linear charge and punish the exposed back. High-level play centers on launchers that pop an opponent into the air, followed by carefully timed juggle strings before the opponent hits the mat.` },
    { id: 'story', title: 'The third Iron Fist tournament and martial arts styles', content: `In the story, Mishima Zaibatsu patriarch Heihachi Mishima awakens an ancient fighting deity known as Ogre in Central American ruins. Ogre hunts down martial arts masters across the world, including Jun Kazama. Her fifteen-year-old son Jin Kazama seeks out his grandfather Heihachi, trains in Mishima-style karate and enters the tournament to avenge his mother.

Every fighter on the roster practices a distinct martial art animated with motion capture:
<ul>
<li><strong>Mishima-style and Kyokushin karate</strong> (Jin Kazama, Heihachi Mishima) alongside <strong>judo and explosive single-strike karate</strong> (Paul Phoenix).</li>
<li><strong>Capoeira</strong> (Eddy Gordo), whose spinning handstands and low sweeps terrorize newcomers and spark endless house-rule debates among friends.</li>
<li><strong>Jeet Kune Do and five-animal kung fu</strong> (Forest Law and police detective Lei Wulong, complete with Drunken Fist stances).</li>
<li><strong>Taekwondo</strong> (Hwoarang), <strong>Baguazhang and Piguazhang</strong> (Ling Xiaoyu) and <strong>lucha libre chain wrestling</strong> (the jaguar-masked King).</li>
<li><strong>Sword-wielding ninjutsu</strong> (Yoshimitsu) and <strong>military combat sambo</strong> (special forces officer Sergei Dragunov in the edition's expanded roster).</li>
</ul>

Unlockable fighters include Mokujin, a centuries-old wooden training dummy that mimics a random fighter's style each round, the elderly scientist Dr. Boskonovitch who fights while lying on the ground, Heihachi's pet bear Kuma and the tiny dinosaur Gon.` },
    { id: 'modes', title: 'Game modes: Team Battle, Tekken Force and Tekken Ball', content: `Beyond the single-player Arcade ladder (which unlocks a character ending for each fighter) and two-player local Versus matches, Tekken 3 packs modes built for groups of friends:
<dl>
<dt>Team Battle</dt><dd>squad matches of up to eight fighters per side, where the winner of a round stays in the ring with remaining health to face the next challenger.</dd>
<dt>Survival and Time Attack</dt><dd>an endless gauntlet on a single life bar and a race to clear the tournament in record time.</dd>
<dt>Practice</dt><dd>a training dojo with an on-screen command list, programmable dummy actions and combo counters.</dd>
<dt>Tekken Force</dt><dd>a side-scrolling beat 'em up across four stages in which the player fights waves of Tekken Force soldiers and picks up roast chickens to restore health.</dd>
<dt>Tekken Ball</dt><dd>beach volleyball where martial arts strikes charge the ball with kinetic energy that damages whoever fails to return it.</dd>
</dl>` },
    { id: 'pc98', title: 'Tekken 98 Demo on the PC', content: `Full-featured 3D fighting games have been rare on the late-1990s PC, making the Tekken 98 Demo on the Igromania CD (<code>D:\\demo\\tekken98demo.exe</code>) a favorite for shared-keyboard matches. Running at a locked 60 frames per second, it supports two players on one keyboard, full move lists in the pause menu and alternate costumes. Between network rounds of [[quake3|Quake III Arena]] and [[starcraft|StarCraft]], players gather around a single monitor for eight-on-eight Team Battle brackets.` }
  ],
  seeAlso: ['quake3', 'ut99', 'lanparty', 'carmageddon', 'hockey98', 'worldcup98'],
  references: [
    'Tekken 3 move list and player manual. Namco, 1998.',
    'Official PlayStation Magazine, Tekken 3 review and fighter guide, 1998.',
    'Strana Igr magazine, Tekken 3 review, 1998.'
  ],
  links: [['http://www.igromania.ru', 'Igromania magazine: Tekken 98 Demo on the CD'], ['http://www.cheatcc.com', 'Cheat Code Central: Tekken 3 unlockables']],
  categories: ['1998 Video Games', 'Fighting Games', 'Namco']
}, ['tekken', 'tekken398']);

window.interpediaReg('dota', 'games', {
  title: 'Defense of the Ancients и командные арены (Dota 98, League of Legends 98)',
  hatnote: 'Статья о жанре командных тактических арен 5 на 5 и об изданиях Dota 98 и League of Legends 98 в каталоге Steam.',
  infobox: {
    title: 'Командные арены (Dota 98 / LoL 98)',
    badgeText: 'Valve / Riot Games',
    fields: [
      { label: 'Жанр', value: 'командная тактическая арена в реальном времени (5 на 5)' },
      { label: 'Истоки', value: 'пользовательские карты для [[starcraft|StarCraft]] (Aeon of Strife) и редакторов Blizzard' },
      { label: 'Издания в системе', value: 'Dota 98, League of Legends 98 (каталог Steam)' },
      { label: 'Формат матча', value: 'две команды по 5 героев, три линии (верхняя, средняя, нижняя), лес' },
      { label: 'Главная цель', value: 'разрушить Древнюю твердыню (Ancient) или Нексус (Nexus) противника' },
      { label: 'Платформа', value: '[[windows98|Win 98]]' }
    ]
  },
  lead: `<strong>Defense of the Ancients</strong> (в нашем системном каталоге Steam — <strong>Dota 98</strong> и родственная ей <strong>League of Legends 98</strong>) — направление командных тактических игр в реальном времени, выросшее из любительских сценариев для редактора карт [[starcraft|StarCraft]]. Вместо того чтобы строить собственную базу и управлять сотней солдат, каждый из десяти участников матча контролирует ровно одного уникального героя в сражении пять на пять.

Квадратная карта пересечена по диагонали рекой и разделена на три укреплённые дороги («линии»), по которым навстречу друг другу непрерывно идут волны управляемых компьютером пехотинцев. Задача команды — провести своих бойцов сквозь сторожевые башни и разрушить главное здание в центре вражеской крепости.`,
  sections: [
    { id: 'origins', title: 'От редактора StarEdit и карты Aeon of Strife к отдельному жанру', content: `Корни жанра лежат в редакторе кампаний StarEdit, вошедшем в комплект [[starcraft|StarCraft]] весной 1998 года. Система триггеров позволила энтузиастам создавать карты, совершенно не похожие на обычную добычу минералов и газа. Одной из самых популярных пользовательских карт на серверах Battle.net стала Aeon of Strife: в ней игроки отказывались от строительства казарм, выбирали по одному именному герою и вместе с потоками союзных войск пробивались по трём коридорам к базе противника.

Идея объединила тактический контроль отряда из [[warcraft2|Warcraft II]] и StarCraft с прокачкой персонажа, уровнями и инвентарём из [[diablo|Diablo]]. В нашем каталоге Steam это направление представлено двумя самостоятельными играми для [[windows98|Win 98]] с полноценным трёхмерным полем боя и поддержкой ботов: <strong>Dota 98</strong> и <strong>League of Legends 98</strong>.` },
    { id: 'mechanics', title: 'Три линии, добивание крипов и составные артефакты', content: `Поле боя делится на две половины: на юго-западе расположена база Светлых (Radiant в Dota 98 или синяя команда в Ущелье призывателей), на северо-востоке — крепость Тёмных (Dire или красная команда). Каждые полминуты из казарм выходят отряды пехотинцев и магов (крипов или миньонов) и маршируют по верхней (Top), средней (Mid) и нижней (Bot) линиям под прикрытием стреляющих башен.

Золото достаётся лишь тому герою, который нанёс вражескому пехотинцу или башне последний, добивающий удар (last hit). Заработанные монеты тратятся в базовой и потайной лавках на сапоги скорости, клинки, посохи и свитки рецептов, из которых собираются мощные составные артефакты (такие как Blink Dagger для мгновенного скачка или посох Black King Bar). Между линиями раскинулся лес с лагерями нейтральных чудовищ, а на реке появляются руны усиления и логово гигантского босса: в Dota 98 это каменный великан Рошан, хранящий щит бессмертия Эгиду (Aegis of the Immortal), а в League of Legends 98 — стихийные Драконы и Барон Нашор.` },
    { id: 'dota98', title: 'Dota 98: десять героев, курьеры и разрушаемый лес', content: `В издании <strong>Dota 98</strong> особое внимание уделено тонкостям позиционной борьбы. Здесь можно не только добивать чужих пехотинцев, но и жертвовать собственными ранеными крипами и даже башнями (deny), чтобы лишить соперника на линии золота и опыта. Предметы из лавки доставляет прямо на передовую управляемый ослик-курьер, а деревья в лесу можно вырубать, прокладывая неожиданные тропы для засады.

В ростер Dota 98 входят десять разноплановых героев со своими ролями и озвучкой:
<ul>
<li><strong>Мастера засад и притяжения:</strong> мясник Pudge со смертоносным крюком Meat Hook, подтягивающим жертву сквозь деревья, и подрывники Techies, минирующие узкие проходы и руны связками бочек.</li>
<li><strong>Воины ближнего боя:</strong> берсерк Axe, заставляющий врагов атаковать себя и рубящий раненых топором Culling Blade, мечник Juggernaut с вихрем клинка и неуязвимой серией ударов Omnislash, а также рыцарь Sven с оглушающим молотом и богатырской силой God's Strength.</li>
<li><strong>Маги и стрелки:</strong> ледяная волшебница Crystal Maiden, повелительница огня и молний Lina, демонолог Lion с превращением врагов в лягушек и лучом Finger of Death, дальнобойный гном Sniper и космическая сущность Enigma, затягивающая всю команду противника в чёрную дыру Black Hole.</li>
</ul>` },
    { id: 'lol98', title: 'League of Legends 98: Ущелье призывателей и прятки в кустах', content: `<strong>League of Legends 98</strong> от студии Riot Games предлагает более динамичный взгляд на ту же формулу пяти на пять в Ущелье призывателей (Summoner's Rift). В ней нет добивания собственных союзных пехотинцев, а любой чемпион в затишье между схватками может за несколько секунд телепортироваться на базу за покупками клавишей Recall. Зато важную тактическую роль играют заросли высокой травы (кусты): шаг внутрь мгновенно делает чемпиона невидимым для врагов снаружи, пока кто-нибудь не поставит туда тотем обзора (вард).

Десятка чемпионов League of Legends 98 охватывает все классические роли на карте: неутомимый рыцарь Демасии Гарен (Garen) и каменный исполин Мальфит (Malphite) держат удар в первой линии; минотавр Алистар (Alistar) и фея Лулу (Lulu) защищают союзников и подбрасывают врагов; маленькая волшебница Энни (Annie) обрушивает на головы противников огненного медведя Тибберса, а рунный маг Райз (Ryze) сковывает цели магической тюрьмой; наконец, ледяная лучница Эш (Ashe), безумная подрывница Джинкс (Jinx), мечник Мастер Йи (Master Yi) и разведчик-йордл Тимо (Teemo) с ядовитыми грибами решают исход поздней стадии боя.` }
  ],
  seeAlso: ['starcraft', 'warcraft2', 'diablo', 'lanparty'],
  references: [
    'Dota 98: справочник героев, предметов и механик арены. Каталог Steam.',
    'League of Legends 98: руководство призывателя по Ущелью призывателей. Riot Games / каталог Steam.',
    'Создание пользовательских сценариев в редакторе StarEdit // Журнал «Игромания», 1999.'
  ],
  links: [['http://www.steampowered.com', 'Каталог Steam: Dota 98 и League of Legends 98'], ['http://forum.games98.com', 'Форум GamerZone']],
  categories: ['Стратегии в реальном времени', 'Сетевые игры', 'Модификации игр']
}, {
  title: 'Defense of the Ancients and Team Battle Arenas (Dota 98, League of Legends 98)',
  hatnote: 'This article covers 5v5 team battle arena games and the Dota 98 and League of Legends 98 editions in the Steam catalog.',
  infobox: {
    title: 'Team Battle Arenas (Dota 98 / LoL 98)',
    badgeText: 'Valve / Riot Games',
    fields: [
      { label: 'Genre', value: 'real-time 5v5 team tactical arena' },
      { label: 'Origins', value: 'custom maps for [[starcraft|StarCraft]] (Aeon of Strife) and Blizzard editors' },
      { label: 'System editions', value: 'Dota 98, League of Legends 98 (Steam catalog)' },
      { label: 'Match format', value: 'two 5-hero teams, three lanes (Top, Mid, Bot) and a jungle' },
      { label: 'Objective', value: 'destroy the enemy Ancient or Nexus stronghold' },
      { label: 'Platform', value: '[[windows98|Win 98]]' }
    ]
  },
  lead: `<strong>Defense of the Ancients</strong> (represented in our system's Steam catalog by <strong>Dota 98</strong> and its counterpart <strong>League of Legends 98</strong>) is a branch of real-time team tactical games that grew out of custom map scenarios built in [[starcraft|StarCraft]]'s editor. Instead of constructing a base and commanding dozens of troops, each of the ten players in a match controls a single hero in a five-on-five battle.

A square arena bisected diagonally by a river is connected by three fortified roads ("lanes") along which computer-controlled waves of foot soldiers march continuously. Each team fights to push through enemy guard towers and shatter the main stronghold at the heart of the opposing base.`,
  sections: [
    { id: 'origins', title: 'From StarEdit and Aeon of Strife to a standalone genre', content: `The genre's roots lie in the StarEdit campaign editor shipped with [[starcraft|StarCraft]] in spring 1998. Its trigger system let mapmakers build scenarios that played nothing like standard mineral-and-gas harvesting. One of the most popular custom maps on Battle.net, Aeon of Strife, stripped away base building, gave each player a single named hero unit and sent waves of allied troops down three lanes toward the enemy citadel.

That formula merged the real-time unit control of [[warcraft2|Warcraft II]] and StarCraft with the leveling, spells and item hunting of [[diablo|Diablo]]. In our system's Steam catalog the style is represented by two standalone [[windows98|Win 98]] titles with 3D battlefields and full AI bot support: <strong>Dota 98</strong> and <strong>League of Legends 98</strong>.` },
    { id: 'mechanics', title: 'Three lanes, last-hitting and recipe items', content: `The map is split between two opposing fortresses: Radiant (or Blue team on Summoner's Rift) in the southwest corner and Dire (or Red team) in the northeast. Every thirty seconds, barracks spawn squads of melee and ranged troopers (creeps or minions) that march down the Top, Mid and Bot lanes under the protection of defensive towers.

Gold is awarded only to the hero who lands the killing blow ("last hit") on an enemy creep or tower. Players spend their earnings at base and secret shops on boots, blades, staves and recipe scrolls that combine into powerful artifacts such as the teleporting Blink Dagger or magic-immune Black King Bar. Between the lanes lies a forested jungle inhabited by neutral monster camps, while the river holds power runes and the lair of the map's boss monster: Roshan in Dota 98, who drops the life-restoring Aegis of the Immortal, and the elemental Dragon and Baron Nashor in League of Legends 98.` },
    { id: 'dota98', title: 'Dota 98: ten heroes, couriers and destructible trees', content: `<strong>Dota 98</strong> emphasizes lane control and map manipulation. In addition to last-hitting enemy troops, players can sacrifice their own low-health creeps and even friendly towers ("denying") to starve lane opponents of gold and experience. A donkey courier ferries purchased items from base to the front line, and trees in the jungle can be cut down to carve ambush paths.

The Dota 98 roster features ten heroes with distinct roles and voice acting:
<ul>
<li><strong>Ambushers and initiators:</strong> the butcher Pudge, whose Meat Hook drags victims through trees, and the goblin demolitionists Techies, who rig narrow ramps and rune spots with land mines and remote barrels.</li>
<li><strong>Front-line warriors:</strong> the berserker Axe, who forces nearby enemies to attack him and executes the wounded with Culling Blade; the swordsman Juggernaut with Blade Fury and his invulnerable Omnislash; and the rogue knight Sven with Storm Bolt and God's Strength.</li>
<li><strong>Casters and marksmen:</strong> the frost mage Crystal Maiden, fire-and-lightning slayer Lina, demon witch Lion with Hex and Finger of Death, long-range keen marksman Sniper and the cosmic entity Enigma, whose Black Hole pulls an entire enemy team into a single vortex.</li>
</ul>` },
    { id: 'lol98', title: 'League of Legends 98: Summoner\'s Rift and brush stealth', content: `<strong>League of Legends 98</strong> from Riot Games offers a faster-paced take on five-on-five lane combat across Summoner's Rift. Friendly minions cannot be denied, and any champion can channel a Recall spell during a lull to teleport back to the fountain shop without walking. High grass ("brush") patches scattered along the lanes and river provide instant stealth: stepping into a bush hides a champion from outside view unless an enemy places a sight ward inside.

Its ten-champion roster covers every tactical role: the Demacian warrior Garen and rock monolith Malphite anchor the front line; the minotaur Alistar and fae sorceress Lulu shield allies and knock airborne attackers away; the child pyromancer Annie drops her flaming bear Tibbers into teamfights while the rune mage Ryze locks down targets; and the frost archer Ashe, loose-cannon gunner Jinx, Wuju bladesman Master Yi and swift scout Teemo (who lines the jungle with poisonous mushroom traps) carry the late game.` }
  ],
  seeAlso: ['starcraft', 'warcraft2', 'diablo', 'lanparty'],
  references: [
    'Dota 98 hero, item and arena mechanics manual. Steam catalog.',
    'League of Legends 98 Summoner\'s Rift guide. Riot Games / Steam catalog.',
    'Building custom scenarios in StarEdit // Igromania magazine, 1999.'
  ],
  links: [['http://www.steampowered.com', 'Steam Catalog: Dota 98 and League of Legends 98'], ['http://forum.games98.com', 'GamerZone Forum']],
  categories: ['Real-Time Strategy', 'Online Games', 'Video Game Mods']
}, ['dota98', 'lol', 'lol98']);

window.interpediaReg('bioware98', 'games', {
  title: 'Ролевые игры BioWare: от Baldur\'s Gate к KOTOR 98 и Dragon Age 98',
  hatnote: 'Статья о развитии отрядных ролевых игр канадской студии BioWare и о демоверсиях Star Wars: Knights of the Old Republic 98 и Dragon Age: Origins 98 на диске «Игромании».',
  infobox: {
    title: 'Ролевые игры BioWare (Win 98)',
    badgeText: 'BioWare Corp.',
    fields: [
      { label: 'Разработчик', value: 'BioWare (Эдмонтон, Канада)' },
      { label: 'Основатели', value: 'Рэй Музика, Грег Зещук (1995)' },
      { label: 'Ключевая механика', value: 'отрядный тактический бой в реальном времени с активной паузой' },
      { label: 'Игры на Infinity Engine', value: '[[baldursgate|Baldur\'s Gate]] (1998), Tales of the Sword Coast (1999)' },
      { label: 'Трёхмерные главы в системе', value: 'Star Wars: KOTOR 98, Dragon Age: Origins 98 (демоверсии с диска «Игромании»)' },
      { label: 'Платформа', value: '[[windows98|Win 98]]' }
    ]
  },
  lead: `Канадская студия <strong>BioWare</strong>, основанная в 1995 году в Эдмонтоне врачами Рэем Музикой и Грегом Зещуком, за несколько лет превратилась из дебютанта в одного из главных разработчиков компьютерных ролевых игр. Выпустив в декабре 1998 года [[baldursgate|Baldur's Gate]], студия определила свой фирменный почерк: управление отрядом спутников с собственными убеждениями, разветвлённые диалоги с проверками морали и тактический бой в реальном времени, который в любую секунду ставится на паузу клавишей пробела.

В нашей системе развитие этого стиля в трёхмерной графике для [[windows98|Win 98]] представлено двумя крупными главами, которые лежат демоверсиями на компакт-диске журнала «Игромания»: космической одиссеей <strong>Star Wars: Knights of the Old Republic 98</strong> и тёмным фэнтези <strong>Dragon Age: Origins 98</strong>.`,
  sections: [
    { id: 'formula', title: 'Формула BioWare: активная пауза, отряд и моральный выбор', content: `До конца 1990-х компьютерные ролевые игры обычно делились на чисто пошаговые (как [[fallout|Fallout]]) и скоростные боевики в реальном времени (как [[diablo|Diablo]]). В [[baldursgate|Baldur's Gate]] программисты BioWare спрятали настольные броски кубиков внутрь непрерывного действия: раунды длятся по шесть секунд, но игрок в любой момент нажимает пробел, осматривает поле боя, назначает каждому члену отряда цепочку приказов или заклинаний и снова снимает игру с паузы.

Вторая опора стиля студии — живые спутники в отряде. Напарники не просто несут лишние мечи и щиты: они вмешиваются в разговоры с жителями городов, спорят друг с другом на привалах, одобряют или осуждают поступки героя и могут покинуть группу или даже поднять оружие против командира, если тот перейдёт черту.` },
    { id: 'kotor98', title: 'Star Wars: Knights of the Old Republic 98 — Старая Республика и Тарис', content: `В <strong>Star Wars: Knights of the Old Republic 98</strong> (сокращённо <strong>KOTOR 98</strong>) действие переносится во вселенную «Звёздных войн» за четыре тысячи лет до появления Галактической Империи, когда сотни рыцарей-джедаев сражаются против армады ситхов владыки Дарта Малака. В основе боевой системы лежат правила двадцатигранного кубика (d20): бой выглядит как кинематографическая дуэль на световых мечах и бластерах с перекатами и отражением лучей, но за кадром каждый раунд рассчитываются броски атаки, защиты и спасбросков.

Демоверсия с диска «Игромании» охватывает полную первую главу саги. Герой приходит в себя на борту республиканского крейсера «Эндар Спайр» (Endar Spire), взятого на абордаж ситхами на орбите планеты-мегаполиса Тарис, пробивается к спасательным капсулам вместе с пилотом Картом Онаси и совершает аварийную посадку. Чтобы спасти рыцаря-джедая Бастилу Шан и вырваться с блокированной планеты на контрабандистском корабле «Эбоновый ястреб» (Ebon Hawk), отряду предстоит пройти три яруса Тариса: сияющий Верхний город, криминальный Нижний город с войной банд «Чёрных Вулкаров» и «Тайных Беков» и заражённое ракгулами Подземелье. По пути к герою присоединяются юная тви'лекка Мишн Вао, вуки Заалбар, дроид-взломщик T3-M4 и мандалорский ветеран Кандерос Ордо, а в кантинах и на арене можно сыграть в карточную игру пазаак (Pazaak) и поучаствовать в гонках на свуп-байках.` },
    { id: 'dao98', title: 'Dragon Age: Origins 98 — шесть предысторий и битва при Остагаре', content: `Если KOTOR 98 опирается на космооперу LucasArts, то <strong>Dragon Age: Origins 98</strong> возвращает студию к классическому фэнтези и становится духовным наследником [[baldursgate|Baldur's Gate]] в собственном мире Тедас. Королевству Ферелден грозит Мор (Blight) — нашествие подземных порождений тьмы (Darkspawn), остановить которых способен лишь древний орден Серых Стражей.

Главное художественное решение игры вынесено в подзаголовок Origins («Предыстории»). Перед тем как попасть в лагерь короля Кайлана при крепости Остагар, игрок не просто выбирает расу и класс в таблице, а лично проживает отдельную вступительную главу из жизни своего героя:
<ol>
<li><strong>Благородный человек</strong> защищает родовой замок Кусландов от ночного предательства эрла Хоу.</li>
<li><strong>Маг Круга</strong> проходит смертельное Истязание (Harrowing) в Тень внутри Башни Магов у озера Каленхад.</li>
<li><strong>Долийский эльф</strong> исследует древние руины со своим кочевым кланом и сталкивается с проклятым зеркалом Элувианом.</li>
<li><strong>Городской эльф</strong> поднимает восстание против жестокого лорда в огороженном эльфинаже Денерима прямо в день собственной свадьбы.</li>
<li><strong>Благородный гном</strong> плетёт династические интриги в подземном королевстве Орзаммар.</li>
<li><strong>Гном-простолюдин</strong> из «неприкасаемых» пробивается наверх через подпольные бои на арене Хартии.</li>
</ol>

В демоверсии с диска «Игромании» после выбранной предыстории наставник Дункан приводит рекрута в Остагар. Игроку предстоит пройти через Дикие земли Коркари за кровью порождений тьмы и старинными договорами в хижине ведьмы Флемет, выпить чашу в ритуале Посвящения, зажечь сигнальный костёр на вершине Башни Ишала (Tower of Ishal) в разгар предательства лорда Логейна и отступить через деревню Лотеринг вместе с Серым Стражем Алистером, ведьмой Морриган, бардом Лелианой и пленным великаном-кунари Стеном.` },
    { id: 'comparison', title: 'Ролевая школа конца десятилетия', content: `Обе трёхмерные главы сохраняют возможность мгновенно менять угол обзора: можно вести героя с камерой из-за плеча, осматривая архитектуру Верхнего Тариса или разрушенные своды Остагара, а с началом тяжёлой схватки поднять камеру вверх и раздавать тактические команды во время паузы, как в классическом Infinity Engine. Благодаря сочетанию настольной математики, кинематографических бесед и живого отряда игры BioWare занимают особое место рядом с работами Black Isle Studios ([[fallout2|Fallout 2]], Planescape: Torment).` }
  ],
  seeAlso: ['baldursgate', 'fallout', 'fallout2', 'diablo', 'grimfandango'],
  references: [
    'Star Wars: Knights of the Old Republic 98 — руководство игрока и правила d20. BioWare / диск журнала «Игромания».',
    'Dragon Age: Origins 98 — хроники Ферелдена и описание шести предысторий. BioWare / диск журнала «Игромания».',
    'Интервью с основателями BioWare Рэем Музикой и Грегом Зещуком // Computer Gaming World, 1999.'
  ],
  links: [['http://www.igromania.ru', 'Журнал «Игромания»: демоверсии KOTOR 98 и Dragon Age: Origins 98'], ['http://www.lucasarts.com', 'Официальный сайт LucasArts']],
  categories: ['Ролевые игры', 'BioWare', 'Звёздные войны в играх']
}, {
  title: 'BioWare Role-Playing Games: From Baldur\'s Gate to KOTOR 98 and Dragon Age 98',
  hatnote: 'This article covers the party-based role-playing games of Canadian studio BioWare and the Star Wars: Knights of the Old Republic 98 and Dragon Age: Origins 98 demos on the Igromania CD.',
  infobox: {
    title: 'BioWare RPGs (Win 98)',
    badgeText: 'BioWare Corp.',
    fields: [
      { label: 'Developer', value: 'BioWare (Edmonton, Canada)' },
      { label: 'Founders', value: 'Ray Muzyka, Greg Zeschuk (1995)' },
      { label: 'Core mechanic', value: 'party-based real-time tactical combat with active pause' },
      { label: 'Infinity Engine titles', value: '[[baldursgate|Baldur\'s Gate]] (1998), Tales of the Sword Coast (1999)' },
      { label: '3D chapters in system', value: 'Star Wars: KOTOR 98, Dragon Age: Origins 98 (demos on the Igromania CD)' },
      { label: 'Platform', value: '[[windows98|Win 98]]' }
    ]
  },
  lead: `Founded in Edmonton, Canada, in 1995 by physicians Ray Muzyka and Greg Zeschuk, <strong>BioWare</strong> rose within a few years from newcomer to one of the leading studios in computer role-playing games. With the December 1998 release of [[baldursgate|Baldur's Gate]], the studio established its signature design: a party of opinionated companions, branching morality dialogues and real-time tactical combat that pauses at the tap of the spacebar.

In our system, the evolution of that design into full 3D for [[windows98|Win 98]] is represented by two major playable chapters, both demos on the Igromania magazine CD: the space opera <strong>Star Wars: Knights of the Old Republic 98</strong> and the dark fantasy epic <strong>Dragon Age: Origins 98</strong>.`,
  sections: [
    { id: 'formula', title: 'The BioWare formula: active pause, party banter and morality', content: `Through the late 1990s computer RPGs tended to split between strictly turn-based systems (such as [[fallout|Fallout]]) and fast action clickfests (such as [[diablo|Diablo]]). In [[baldursgate|Baldur's Gate]], BioWare tucked tabletop dice rolls inside continuous real-time action: combat rounds tick every six seconds, yet pressing the spacebar freezes the battlefield so the player can inspect enemy positions, queue spells and target orders for each party member and unpause at will.

Equally central are the companions who travel with the protagonist. Party members interject during conversations with townsfolk, argue with one another around camp, track approval of the hero's choices and will walk away or even draw weapons if pushed against their convictions.` },
    { id: 'kotor98', title: 'Star Wars: Knights of the Old Republic 98 — the Old Republic and Taris', content: `<strong>Star Wars: Knights of the Old Republic 98</strong> (<strong>KOTOR 98</strong>) sets its story four thousand years before the Galactic Empire, during an all-out war between hundreds of Jedi Knights and the Sith armada of Darth Malak. Beneath the clashing lightsabers and blaster fire runs a twenty-sided die (d20) ruleset that resolves attack rolls, defense ratings, feats and Force powers round by round.

The demo on the Igromania CD covers the complete opening act of the saga. Awakening aboard the Republic cruiser Endar Spire as Sith boarding parties overrun the decks above the city-world of Taris, the hero fights to the escape pods alongside Republic pilot Carth Onasi. Stranded under a planetary blockade, the party must search for the captured Jedi Bastila Shan and steal the smuggler vessel Ebon Hawk across three vertical tiers of Taris: the gleaming Upper City, the gang-torn Lower City contested by the Black Vulkars and Hidden Beks, and the rakghoul-infested Undercity. Along the way the crew grows to include the Twi'lek street thief Mission Vao, her Wookiee companion Zaalbar, the utility droid T3-M4 and Mandalorian mercenary Canderous Ordo, while cantinas and arenas offer Pazaak card tables, dueling rings and swoop bike time trials.` },
    { id: 'dao98', title: 'Dragon Age: Origins 98 — six playable origins and the Battle of Ostagar', content: `Where KOTOR 98 builds on LucasArts space opera, <strong>Dragon Age: Origins 98</strong> returns BioWare to dark heroic fantasy as a spiritual successor to [[baldursgate|Baldur's Gate]] set in the original world of Thedas. The kingdom of Ferelden faces a Blight, an underground invasion of corrupted darkspawn that only the ancient order of Grey Wardens can stop.

Its defining structural idea gives the game its subtitle: before ever reaching King Cailan's war camp at Ostagar, the player plays through one of six standalone opening chapters determined by race and background:
<ol>
<li><strong>Human Noble:</strong> defending Castle Cousland during a midnight betrayal by Arl Howe.</li>
<li><strong>Circle Mage:</strong> surviving the Harrowing trial inside the Fade at the Circle Tower on Lake Calenhad.</li>
<li><strong>Dalish Elf:</strong> exploring ancient forest ruins with a nomadic clan and uncovering a cursed Eluvian mirror.</li>
<li><strong>City Elf:</strong> sparking an armed uprising inside Denerim's walled alienage on the hero's own wedding day.</li>
<li><strong>Dwarf Noble:</strong> navigating royal succession and sibling treachery in the underground city of Orzammar.</li>
<li><strong>Dwarf Commoner:</strong> clawing out of dust-town poverty through underground Proving arena fights for the Carta.</li>
</ol>

In the Igromania CD demo, recruiter Duncan brings the survivor of any chosen origin to Ostagar. From there the player ventures into the Korcari Wilds for darkspawn blood and ancient treaties at the hut of the witch Flemeth, undergoes the Joining ritual, fights to the top of the Tower of Ishal to light the signal beacon during Teyrn Loghain's betrayal, and regroups in the village of Lothering with fellow Warden Alistair, the shapeshifter Morrigan, bard Leliana and caged Qunari warrior Sten.` },
    { id: 'comparison', title: 'Tactical camera and role-playing craft at the end of the decade', content: `Both 3D chapters let players shift seamlessly between an over-the-shoulder exploration view for walking the promenades of Upper Taris or the ruins of Ostagar and a high tactical angle for issuing paused combat orders, preserving the rhythm of the Infinity Engine in three dimensions. Alongside the work of Black Isle Studios ([[fallout2|Fallout 2]], Planescape: Torment), BioWare's games anchor story-driven PC role-playing at the close of the 1990s.` }
  ],
  seeAlso: ['baldursgate', 'fallout', 'fallout2', 'diablo', 'grimfandango'],
  references: [
    'Star Wars: Knights of the Old Republic 98 player manual and d20 rulebook. BioWare / Igromania magazine CD.',
    'Dragon Age: Origins 98 — Chronicles of Ferelden and Origin Stories guide. BioWare / Igromania magazine CD.',
    'Interview with BioWare founders Ray Muzyka and Greg Zeschuk // Computer Gaming World, 1999.'
  ],
  links: [['http://www.igromania.ru', 'Igromania magazine: KOTOR 98 and Dragon Age: Origins 98 demos'], ['http://www.lucasarts.com', 'LucasArts official site']],
  categories: ['Role-Playing Games', 'BioWare', 'Star Wars Video Games']
}, ['kotor98', 'dao98', 'kotor', 'dao']);

window.interpediaReg('gta', 'games', {
  title: 'Grand Theft Auto и игры об открытом городе (Нижний Сити, Екатеринбург \'90)',
  hatnote: 'Статья о серии криминальных боевиков студии DMA Design и об играх в открытом городе из каталога Steam (Grand Theft Auto: Нижний Сити и Grand Theft Auto: Екатеринбург \'90).',
  infobox: {
    title: 'Grand Theft Auto и открытый город',
    badgeText: 'DMA Design / Rockstar / Нижний Сити / Екб \'90',
    fields: [
      { label: 'Основатель направления', value: 'DMA Design (Шотландия, 1997)' },
      { label: 'Первые части', value: 'Grand Theft Auto (1997), London 1969 (1999), Grand Theft Auto 2 (октябрь 1999)' },
      { label: 'Издания в системе', value: 'GTA: Нижний Сити (3D), GTA: Екатеринбург \'90 (вид сверху) в каталоге Steam' },
      { label: 'Жанр', value: 'автомобильный боевик в открытом городе' },
      { label: 'Ключевые механики', value: 'свободный угон транспорта, поручения по таксофону, уровни розыска, радиостанции' },
      { label: 'Платформа', value: '[[msdos|MS-DOS]], [[windows95|Win 95]], [[windows98|Win 98]]' }
    ]
  },
  lead: `<strong>Grand Theft Auto</strong> (сокращённо <strong>GTA</strong>) — серия криминальных автомобильных игр в открытом городе, начатая шотландской студией DMA Design в 1997 году и развитая в нашем системном каталоге Steam самостоятельными главами <strong>Grand Theft Auto: Екатеринбург '90</strong> и трёхмерной <strong>Grand Theft Auto: Нижний Сити</strong>.

Вместо гоночной трассы с флажками или коридорных уровней перед игроком расстилается живой мегаполис с пешеходами, светофорами, патрульными машинами и радиостанциями, звучащими в салоне каждого угнанного автомобиля. Игрок сам решает, отвечать ли на звонок уличного таксофона ради очередного заказа мафии или устроить погоню с полицией через весь город.`,
  sections: [
    { id: 'dmadesign', title: 'От Race\'n\'Chase к Grand Theft Auto и GTA 2', content: `Шотландская студия DMA Design из города Данди, прославившаяся в начале 1990-х головоломкой Lemmings, разрабатывала игру под рабочим названием Race'n'Chase как обычный симулятор дорожной полиции. Во время тестирования выяснилось, что тестеры скучают при соблюдении правил, но приходят в восторг, когда из-за ошибки в коде полицейские машины начинают неистово таранить игрока на перекрёстках. Концепцию перевернули с ног на голову: главным героем стал угонщик на службе криминальных синдикатов.

Вышедшая осенью 1997 года первая Grand Theft Auto показала сверху три американских мегаполиса: Либерти-Сити (по образцу Нью-Йорка), Сан-Андреас (Сан-Франциско) и Вайс-Сити (Майами). Чтобы перейти в следующий город, требовалось набрать миллион очков за заказные поручения, угон редких машин в портовые краны и уход от облав. Наряду с [[carmageddon|Carmageddon]] игра вызвала бурю в парламенте Великобритании и прессе, что лишь подогрело продажи. Весной 1999 года вышло дополнение про свингующий Лондон шестидесятых (London 1969), а в октябре 1999 года появилась Grand Theft Auto 2 с цветным ночным освещением для ускорителей [[voodoo2|3dfx Voodoo]] и системой репутации у трёх враждующих банд каждого района.` },
    { id: 'ekb90', title: 'Grand Theft Auto: Екатеринбург \'90 — классический вид сверху на Урале', content: `Издание <strong>Grand Theft Auto: Екатеринбург '90</strong> в каталоге Steam бережно переносит механику и вертикальную камеру первых частей серии в уральский мегаполис осени 1990 года, на самом переломе эпох, когда Свердловск возвращал себе историческое имя. По проспекту Ленина, Плотинке у Городского пруда, улице Малышева, Втузгородку и промзонам Уралмаша снуют «Жигули», «Москвичи», «Волги» ГАЗ-24, жёлтые автобусы «Икарус» и грузовики ЗИЛ-130.

Уличные таксофоны трезвонят у гастрономов и заводских проходных: кооператоры, цеховики и уралмашевские бригадиры поручают герою перегнать дефицитную партию видеомагнитофонов, перехватить инкассаторский фургон или уйти от погони по трамвайным путям. Шкала розыска растёт от свистка постового милиционера и жёлто-синих «канареек» ГАИ до перекрытия мостов отрядами ОМОНа и чёрных «Волг» КГБ.` },
    { id: 'nizhny', title: 'Grand Theft Auto: Нижний Сити — полностью трёхмерный город на берегу Оки', content: `Если уральский выпуск верен двухмерной школе 1997 года, то <strong>Grand Theft Auto: Нижний Сити</strong> делает шаг, о котором читатели игровых журналов конца 1999 года только мечтали: переводит открытый криминальный город в честное трёхмерное пространство с видом из-за спины героя и из-за бампера автомобиля. Действие разворачивается жарким летом 2000 года на левом берегу Нижнего Новгорода, в Автозаводском и Ленинском районах. Главный герой Тёма Верещагин выходит на свободу и возвращается в родные кварталы, где за контроль над рынками, автосервисами и заводскими поставками борются местные группировки.

Архитектура города воспроизведена с документальной точностью по реальным кварталам: проспект Ленина и площадь Киселёва, проходные Горьковского автозавода (ГАЗ), Соцгород, Парк культуры, набережная Оки и дворы, заставленные железными гаражами-«ракушками». Сюжетная кампания из двенадцати больших заданий дополнена телефонными контрактами, уличными гонками по ночным проспектам, поиском ста спрятанных по дворам кассет VHS, прыжками с трамплинов и работой в такси, скорой помощи и милицейском патруле.` },
    { id: 'vehicles', title: 'Двадцать девять машин, шесть звёзд розыска и плёнка «Свема»', content: `Автопарк «Нижнего Сити» насчитывает 29 управляемых машин с разным весом, приводом и моделью повреждений: от потрёпанной «копейки» ВАЗ-2101, «девятки» цвета «мокрый асфальт», «Волги» ГАЗ-3110 и маршрутной «Газели» до иномарок девяностых, инкассаторского броневика, речного катера на Оке, восьмиколёсного бронетранспортёра БТР-80 и танка Т-72Б, который выезжает на улицы при максимальных шести звёздах розыска.

Помимо оружия (от кастета, монтировки и пистолета ТТ до автомата АКМ, снайперской винтовки СВД и гранатомёта РПГ-7), в игре есть встроенный фотоаппарат. Игрок может в любой момент остановить машину на набережной под закатным небом, выбрать в видоискателе цветовую плёнку Kodak Gold, Fujicolor или чёрно-белую советскую «Свему ФН-64», настроить выдержку и сохранить снимок в личный фотоальбом.` }
  ],
  seeAlso: ['carmageddon', 'maxpayne', 'dukenukem3d', 'voodoo2'],
  references: [
    'Grand Theft Auto: руководство пользователя. DMA Design / BMG Interactive, 1997.',
    'Grand Theft Auto: Нижний Сити — путеводитель по Автозаводскому и Ленинскому районам. Каталог Steam.',
    'Grand Theft Auto: Екатеринбург \'90 — справочник водителя. Каталог Steam.'
  ],
  links: [['http://www.steampowered.com', 'Каталог Steam: GTA Нижний Сити и Екатеринбург \'90'], ['http://www.cheatcc.com', 'Cheat Code Central: коды Grand Theft Auto'], ['http://forum.games98.com', 'Форум GamerZone']],
  categories: ['Видеоигры 1997 года', 'Видеоигры 1999 года', 'Автосимуляторы', 'Боевики']
}, {
  title: 'Grand Theft Auto and Open-City Crime Games (Nizhny City, Yekaterinburg \'90)',
  hatnote: 'This article covers the open-city crime series started by DMA Design and the standalone editions in the Steam catalog (Grand Theft Auto: Nizhny City and Grand Theft Auto: Yekaterinburg \'90).',
  infobox: {
    title: 'Grand Theft Auto & Open-City Games',
    badgeText: 'DMA Design / Rockstar / Nizhny City / Yekb \'90',
    fields: [
      { label: 'Genre pioneer', value: 'DMA Design (Scotland, 1997)' },
      { label: 'Early entries', value: 'Grand Theft Auto (1997), London 1969 (1999), Grand Theft Auto 2 (October 1999)' },
      { label: 'System editions', value: 'GTA: Nizhny City (3D), GTA: Yekaterinburg \'90 (top-down) in Steam catalog' },
      { label: 'Genre', value: 'open-city driving and action game' },
      { label: 'Core mechanics', value: 'free vehicle hijacking, payphone missions, police wanted levels, in-car radio' },
      { label: 'Platform', value: '[[msdos|MS-DOS]], [[windows95|Win 95]], [[windows98|Win 98]]' }
    ]
  },
  lead: `<strong>Grand Theft Auto</strong> (<strong>GTA</strong>) is a series of open-city crime and driving games started by the Scottish studio DMA Design in 1997 and expanded in our system's Steam catalog with two standalone chapters: the top-down <strong>Grand Theft Auto: Yekaterinburg '90</strong> and the fully 3D <strong>Grand Theft Auto: Nizhny City</strong>.

Instead of a fenced race course or linear corridors, the game drops the player into a living city of pedestrians, traffic lights, police cruisers and radio stations specific to each stolen car. The player chooses whether to answer a ringing street payphone for a syndicate job or spark a six-star police chase across town.`,
  sections: [
    { id: 'dmadesign', title: 'From Race\'n\'Chase to Grand Theft Auto and GTA 2', content: `Founded in Dundee, Scotland, and famous in the early 1990s for the puzzle hit Lemmings, DMA Design originally prototyped the project under the working title Race'n'Chase as a straightforward cops-and-robbers driving game. Playtesting revealed that testers grew bored obeying traffic rules but had a blast when a pathfinding bug caused police cars to ram the player's vehicle aggressively off the road. The designers flipped the premise and cast the player as a wheelman working for rival crime bosses.

Released in autumn 1997, the original Grand Theft Auto presented three American cities from a top-down camera: Liberty City (modeled on New York), San Andreas (San Francisco) and Vice City (Miami). Advancing to the next city required racking up a million points through payphone jobs, delivering rare cars to dockside cranes and escaping roadblocks. Like [[carmageddon|Carmageddon]], the game drew condemnation in the British Parliament and press, which only boosted its notoriety. Spring 1999 brought the period expansion London 1969, and October 1999 saw the release of Grand Theft Auto 2 with colored nighttime lighting for [[voodoo2|3dfx Voodoo]] accelerators and a three-way gang respect meter.` },
    { id: 'ekb90', title: 'Grand Theft Auto: Yekaterinburg \'90 — top-down crime in the Urals', content: `<strong>Grand Theft Auto: Yekaterinburg '90</strong> in our system's Steam catalog adapts the vertical camera and arcade physics of the 1997 original to the Ural metropolis in autumn 1990, right at the historical crossroads when Sverdlovsk was reclaiming its pre-revolutionary name. Zhiguli sedans, Moskvich hatchbacks, GAZ-24 Volgas, yellow articulated Ikarus buses and ZIL-130 trucks crowd Lenin Avenue, the Plotinka dam on the City Pond, Malyshev Street and the factory gates of Uralmash.

Street payphones ring outside state grocery stores and industrial yards as cooperative entrepreneurs and Uralmash gang leaders hire the driver to smuggle scarce VCR shipments, intercept payroll vans or outrun pursuers along tram tracks. The wanted meter escalates from a whistle-blowing beat militia officer and yellow-and-blue GAI patrol cars to OMON riot barricades and black KGB Volgas.` },
    { id: 'nizhny', title: 'Grand Theft Auto: Nizhny City — a full 3D city on the Oka River', content: `While the Ural chapter honors the classic 2D overhead view, <strong>Grand Theft Auto: Nizhny City</strong> takes the leap late-1990s players have dreamed about: bringing the open-city crime formula into full 3D with a third-person camera on foot and behind the wheel. Set during the hot summer of 2000 on the left bank of Nizhny Novgorod across the Avtozavodsky and Leninsky districts, the story follows Tyoma Vereshchagin as he walks out of prison and returns to neighborhoods contested by local syndicates over markets, chop shops and factory supply lines.

The city's layout recreates real Nizhny Novgorod landmarks: Lenin Avenue, Kiselyov Square, the monumental gates of the Gorky Automobile Plant (GAZ), the Sotsgorod housing blocks, the Oka River embankment and courtyards lined with corrugated metal shell garages. Alongside a twelve-mission story campaign, the city offers payphone contracts, midnight street races, a hundred hidden VHS tapes to collect, stunt jumps and side shifts in taxis, ambulances and militia patrol cars.` },
    { id: 'vehicles', title: 'Twenty-nine vehicles, six wanted stars and Svema film', content: `Nizhny City's traffic spans 29 drivable vehicles with distinct weight, drivetrain behavior and damage modeling: from battered VAZ-2101 "Kopeyka" sedans, "wet asphalt" VAZ-2109 hatchbacks, GAZ-3110 Volgas and GAZelle minibuses to 1990s foreign imports, armored cash vans, patrol boats on the Oka, an eight-wheeled BTR-80 armored personnel carrier and a T-72B main battle tank deployed when the wanted meter hits all six stars.

In addition to an arsenal ranging from brass knuckles, crowbars and TT pistols to AKM rifles, SVD sniper rifles and RPG-7 launchers, the game includes a built-in camera mode. Players can pull over along the river at sunset, load virtual rolls of Kodak Gold, Fujicolor or black-and-white Soviet Svema FN-64 film in the viewfinder, adjust exposure and save snapshots to a personal photo album.` }
  ],
  seeAlso: ['carmageddon', 'maxpayne', 'dukenukem3d', 'voodoo2'],
  references: [
    'Grand Theft Auto user manual. DMA Design / BMG Interactive, 1997.',
    'Grand Theft Auto: Nizhny City — Avtozavodsky and Leninsky district guide. Steam catalog.',
    'Grand Theft Auto: Yekaterinburg \'90 driver\'s handbook. Steam catalog.'
  ],
  links: [['http://www.steampowered.com', 'Steam Catalog: GTA Nizhny City and Yekaterinburg \'90'], ['http://www.cheatcc.com', 'Cheat Code Central: Grand Theft Auto codes'], ['http://forum.games98.com', 'GamerZone Forum']],
  categories: ['1997 Video Games', '1999 Video Games', 'Driving Games', 'Action Games']
}, ['gtann', 'gta90', 'grandtheftauto']);

