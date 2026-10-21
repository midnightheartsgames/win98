window.themeworldData = {
  site: {
    host: 'www.themeworld98.com',
    day: '22.11.1999',
    since: '14.06.1998',
    webmaster: 'Admin_Dima',
    city: 'Санкт-Петербург',
    mail: 'admin@themeworld98.com',
    received: 1214,
    tagline: 'Обои, заставки и темы для Win 98. Каждый файл проверен на вирусы и на нашем рабочем столе.'
  },

  categories: [
    { id: 'all', name: 'Все' },
    { id: 'win98', name: 'Из Win 98' },
    { id: 'kino', name: 'Кино' },
    { id: 'games', name: 'Игры' },
    { id: 'art', name: 'Графика' },
    { id: 'anime', name: 'Аниме' }
  ],

  resolutions: [
    { id: '640', w: 640, h: 480 },
    { id: '800', w: 800, h: 600 },
    { id: '1024', w: 1024, h: 768 }
  ],

  modems: [
    { id: '288', name: '28.8K', bytesPerSec: 2880 },
    { id: '336', name: '33.6K', bytesPerSec: 3360 },
    { id: '56k', name: '56K (V.90)', bytesPerSec: 4800 },
    { id: 'isdn', name: 'ISDN 64K', bytesPerSec: 8000 }
  ],

  wallpapers: [
    {
      id: 'matrix', file: 'MATRIX.BMP', title: 'Матричный код', listName: 'The Matrix Code (Матрица)',
      cat: 'kino', author: 'Admin_Dima', added: '08.11.1999', downloads: 48211,
      desc: 'Зелёный дождь из полуширинной катаканы, цифр и латинских букв на чёрном фоне. Знаки по 16 точек, столбцы разной длины.'
    },
    {
      id: 'cyberpunk', file: 'NEON98.BMP', title: 'Неоновый закат', listName: 'Cyberpunk Neon 1998',
      cat: 'art', author: 'Lena_K (Москва)', added: '27.10.1999', downloads: 21377,
      desc: 'Сетка до горизонта, пурпурное солнце в полосах и ночной город. Нарисовано в Photoshop 5 за три вечера.'
    },
    {
      id: 'redalert', file: 'REDALERT.BMP', title: 'Тактический радар', listName: 'Red Alert (Радар)',
      cat: 'games', author: 'Sergey_3D (Минск)', added: '19.10.1999', downloads: 15860,
      desc: 'Координатная сетка штаба, красная развёртка радара и отметки целей. Для тех, кто и на работе командует.'
    },
    {
      id: 'dejiko', file: 'DEJIKO.BMP', title: 'Деджико и Пучико', listName: 'DiGi Charat Akiba',
      cat: 'anime', author: 'Pixel_Boy (Казань)', added: '02.11.1999', downloads: 12904,
      desc: 'Деджико и Пучико, талисманы магазина Gamers из Акихабары. Картинки взяты с фан-клуба www.digicharat.net с разрешения.'
    },
    {
      id: 'spacecadet', file: 'SPCADET.BMP', title: 'Space Cadet', listName: 'Space Cadet (Космос)',
      cat: 'games', author: 'из Win 98', added: '14.06.1998', downloads: 11045, builtin: true,
      desc: 'Туманность и звёздные скопления в духе 3D Pinball Space Cadet. Входит в Win 98, здесь для тех, кто её удалил.'
    },
    {
      id: 'gold', file: 'GOLD.BMP', title: 'Золотой век', listName: 'Millennium Gold',
      cat: 'art', author: 'Admin_Dima', added: '12.10.1999', downloads: 9418,
      desc: 'Янтарный шёлк с мягкими складками. Подходит к теме «Золотой век» и к любой серой рамке окна.'
    },
    {
      id: 'pipes', file: 'PIPES3D.BMP', title: 'Трубы 3D', listName: '3D Pipes OpenGL',
      cat: 'win98', author: 'из Win 98', added: '14.06.1998', downloads: 8590, builtin: true,
      desc: 'Кадр из заставки «Трубы 3D»: цветные трубы с шарнирами на чёрном фоне. Входит в Win 98.'
    },
    {
      id: 'clouds', file: 'CLOUDS98.BMP', title: 'Облака', listName: 'Clouds 98 (Облака)',
      cat: 'win98', author: 'из Win 98', added: '14.06.1998', downloads: 7702, builtin: true,
      desc: 'Голубое небо и кучевые облака из комплекта Win 98. Самые спокойные обои в архиве.'
    },
    {
      id: 'setup', file: 'SETUP98.BMP', title: 'Установка Win 98', listName: 'Win 98 Setup',
      cat: 'win98', author: 'из Win 98', added: '14.06.1998', downloads: 5213, builtin: true,
      desc: 'Картинка с экрана установки Win 98: флаг над синим небом. Напоминает, сколько дискет было в 95-м.'
    }
  ],

  screensavers: [
    {
      id: 'matrix', file: 'MATRIX.SCR', title: 'The Matrix Code', listName: 'The Matrix Code (Матрица 1999)',
      kb: 142, author: 'Студия «Навуходоносор» (Самара)', added: '08.11.1999', downloads: 39702,
      engine: 'Win32 GDI',
      desc: 'Столбцы знаков падают сверху вниз. У каждого столбца своя скорость и свой хвост от 12 до 31 знака, голова светится белым.',
      tip: 'Если заставка тормозит, поставьте разрешение 640x480.'
    },
    {
      id: 'flying_win', file: 'FLYWIN.SCR', title: '3D Flying Win', listName: '3D Flying Win (Летающие окна)',
      kb: 115, author: 'Sergey_3D (Минск)', added: '21.09.1999', downloads: 17330,
      engine: 'Win32 GDI',
      desc: '28 четырёхцветных флажков Win летят из глубины экрана на вас и медленно вращаются. Как в Win 3.1, только быстрее.',
      tip: 'Работает даже на S3 Trio без 3D-ускорителя.'
    },
    {
      id: 'pipes', file: 'SSPIPES.SCR', title: 'Трубы 3D', listName: '3D Pipes (Трубопровод)',
      kb: 210, author: 'из Win 98', added: '14.06.1998', downloads: 6120, builtin: true,
      engine: 'OpenGL 1.1',
      desc: 'Трубы растут по сетке и поворачивают под прямым углом, на стыках шарниры. Входит в Win 98.',
      tip: 'Без ускорителя OpenGL идёт медленно, это нормально.'
    },
    {
      id: 'starfield', file: 'SSSTARS.SCR', title: 'Звёздное поле', listName: 'Starfield (Звёздное поле)',
      kb: 64, author: 'из Win 98', added: '14.06.1998', downloads: 4877, builtin: true,
      engine: 'Win32 GDI',
      desc: 'Полёт сквозь 400 звёзд: ближние растут и уходят за край экрана. Входит в Win 98.',
      tip: 'Самая лёгкая заставка в архиве, идёт на любом 486.'
    },
    {
      id: 'mystify', file: 'SSMYST.SCR', title: 'Мистика', listName: 'Mystify Your Mind (Мистика)',
      kb: 82, author: 'из Win 98', added: '14.06.1998', downloads: 4302, builtin: true,
      engine: 'Win32 GDI',
      desc: 'Два четырёхугольника отскакивают от краёв экрана и оставляют за собой цветной след. Входит в Win 98.',
      tip: 'Красивее всего на чёрном мониторе в тёмной комнате.'
    },
    {
      id: 'flowerbox', file: 'SSFLWBOX.SCR', title: 'Цветной куб', listName: '3D FlowerBox (Цветной куб)',
      kb: 130, author: 'из Win 98', added: '14.06.1998', downloads: 3954, builtin: true,
      engine: 'OpenGL 1.1',
      desc: 'Каркасный куб вращается сразу по трём осям, грани выгибаются внутрь и обратно. Входит в Win 98.',
      tip: 'Если куб дёргается, закройте лишние окна.'
    }
  ],

  themes: [
    {
      id: 'matrix', file: 'MATRIX.THEME', title: 'Матрица', listName: 'Матрица (The Matrix 1999)',
      author: 'Admin_Dima', added: '08.11.1999', downloads: 26118, res: '1024',
      sounds: 'писк модема и цифровой перебор',
      desc: 'Зелёные заголовки окон, чёрный рабочий стол с матричным кодом и курсор-прицел. Заставка в тему не входит, качайте её отдельно или сборником.'
    },
    {
      id: 'cyberpunk', file: 'NEON98.THEME', title: 'Неоновый киберпанк', listName: 'Неоновый Киберпанк 1998',
      author: 'Lena_K (Москва)', added: '27.10.1999', downloads: 13490, res: '800',
      sounds: 'аналоговый синтезатор',
      desc: 'Пурпурно-розовые заголовки, ночное небо и курсор-рука. Звук запуска сыгран на синтезаторе, а не на модеме.'
    },
    {
      id: 'redalert', file: 'REDALERT.THEME', title: 'Красная тревога', listName: 'Красная тревога (Red Alert)',
      author: 'Sergey_3D (Минск)', added: '19.10.1999', downloads: 10285, res: '800',
      sounds: 'сирена тревоги',
      desc: 'Рубиновые заголовки, тактический радар на фоне и курсор-прицел. Ошибка звучит сиреной, начальник оценит.'
    },
    {
      id: 'gold', file: 'GOLD.THEME', title: 'Золотой век', listName: 'Золотой век (Millennium Gold)',
      author: 'Admin_Dima', added: '12.10.1999', downloads: 6731, res: '1024',
      sounds: 'обычные звуки Win 98',
      desc: 'Латунные заголовки окон и золотой шёлк. Звуки оставлены стандартные, чтобы не мешать работе.'
    },
    {
      id: 'space', file: 'SPACE.THEME', title: 'Космос', listName: 'Космос (Space)', official: true,
      author: 'Microslop Plus! 98', added: '14.06.1998', downloads: 3110, res: '800',
      sounds: 'сонар и лазеры',
      desc: 'Официальная тема Plus! 98. Уже есть во вкладке «Темы», скачивать не нужно.'
    },
    {
      id: 'underwater', file: 'UNDERWTR.THEME', title: 'Подводный мир', listName: 'Подводный мир (Underwater)', official: true,
      author: 'Microslop Plus! 98', added: '14.06.1998', downloads: 2604, res: '800',
      sounds: 'пузыри и сонар',
      desc: 'Официальная тема Plus! 98. Уже есть во вкладке «Темы», скачивать не нужно.'
    },
    {
      id: 'mystery', file: 'MYSTERY.THEME', title: 'Тайна', listName: 'Тайна (Mystery)', official: true,
      author: 'Microslop Plus! 98', added: '14.06.1998', downloads: 2280, res: '800',
      sounds: 'аккорд органа',
      desc: 'Официальная тема Plus! 98. Уже есть во вкладке «Темы», скачивать не нужно.'
    },
    {
      id: 'creatures', file: 'CREATURE.THEME', title: 'Опасные твари', listName: 'Опасные твари (Dangerous Creatures)', official: true,
      author: 'Microslop Plus! 98', added: '14.06.1998', downloads: 1975, res: '800',
      sounds: 'рычание',
      desc: 'Официальная тема Plus! 98. Уже есть во вкладке «Темы», скачивать не нужно.'
    },
    {
      id: 'jungle', file: 'JUNGLE.THEME', title: 'Джунгли', listName: 'Джунгли (Jungle)', official: true,
      author: 'Microslop Plus! 98', added: '14.06.1998', downloads: 1822, res: '800',
      sounds: 'барабаны',
      desc: 'Официальная тема Plus! 98. Уже есть во вкладке «Темы», скачивать не нужно.'
    }
  ],

  cursorNames: {
    crosshair: 'прицел',
    pointer: 'рука',
    default: 'стрелка',
    cell: 'крест',
    help: 'стрелка с вопросом'
  },

  packs: [
    {
      id: 'pack_matrix', file: 'MATRIX.ZIP', title: 'Матрица целиком', added: '10.11.1999', downloads: 8840,
      desc: 'Всё про Матрицу одним архивом: обои 1024x768, заставка и тема. Распакуйте в любую папку, файлы появятся в «Свойствах экрана».',
      wallpapers: ['matrix'], screensavers: ['matrix'], themes: ['matrix']
    },
    {
      id: 'pack_century', file: 'CENTURY.ZIP', title: 'Конец века', added: '01.11.1999', downloads: 5126,
      desc: 'Три темы осени 1999 года вместе с обоями и заставка «3D Flying Win». Встречайте 2000 год красиво.',
      wallpapers: ['cyberpunk', 'redalert', 'gold'], screensavers: ['flying_win'], themes: ['cyberpunk', 'redalert', 'gold']
    }
  ],

  zipRatio: {
    BMP: { matrix: 88, cyberpunk: 63, redalert: 74, gold: 41, dejiko: 69, spacecadet: 58, pipes: 72, clouds: 47, setup: 52 },
    SCR: 52,
    WAV: 18,
    CUR: 79,
    THEME: 58
  },

  sounds: {
    up: 61740,
    dng: 11052,
    err: 22094
  },

  cursorBytes: 326,

  updates: [
    { date: '22.11.1999', fresh: true, text: 'Вебмастер теперь отвечает прямо в гостевой книге.', link: '/guestbook' },
    { date: '10.11.1999', fresh: true, text: 'Сборник «Матрица целиком»: обои, заставка и тема одним ZIP.', link: '/packs' },
    { date: '08.11.1999', fresh: true, text: 'Заставка MATRIX.SCR, обои и тема «Матрица». Самый частый запрос этой осени.', link: '/screensavers?id=matrix' },
    { date: '02.11.1999', text: 'Обои «Деджико и Пучико» от Pixel_Boy из Казани.', link: '/wallpaper?id=dejiko' },
    { date: '01.11.1999', text: 'Сборник «Конец века»: три темы и заставка с летающими флажками.', link: '/packs' },
    { date: '27.10.1999', text: 'Тема и обои «Неоновый киберпанк» от Lena_K.', link: '/theme?id=cyberpunk' },
    { date: '19.10.1999', text: 'Тема «Красная тревога» и обои с радаром.', link: '/theme?id=redalert' },
    { date: '12.10.1999', text: 'Тема «Золотой век». Звуки оставили стандартные, по просьбам офисных читателей.', link: '/theme?id=gold' },
    { date: '21.09.1999', text: 'Заставка «3D Flying Win». Идёт без 3D-ускорителя.', link: '/screensavers?id=flying_win' },
    { date: '14.06.1998', text: 'ThemeWorld открыт. Первые файлы: обои и заставки из комплекта Win 98.' }
  ],

  steps: {
    wallpaper: [
      'Скачайте обои в нужном разрешении. Файл ляжет в папку «Мои документы\\Мои рисунки».',
      'Щёлкните правой кнопкой по рабочему столу и выберите «Свойства».',
      'На вкладке «Фон» выберите обои в списке и способ: по центру, рядом или растянуть.',
      'Нажмите OK.'
    ],
    screensaver: [
      'Скачайте файл .SCR.',
      'Откройте «Свойства экрана» и вкладку «Заставка».',
      'Выберите заставку в списке, задайте интервал и нажмите «Просмотр».',
      'Нажмите OK. Заставка включится, когда компьютер простоит указанное время.'
    ],
    theme: [
      'Скачайте файл .THEME. Обои темы скачаются вместе с ним.',
      'Откройте «Свойства экрана» и вкладку «Темы».',
      'Выберите тему: сменятся обои, цвет заголовков окон, курсор и звуки.',
      'Нажмите OK.'
    ]
  },

  faq: [
    {
      id: 'size', q: 'Почему обои 1024x768 весят больше двух мегабайт?',
      a: 'BMP хранит каждую точку тремя байтами без сжатия: 1024 x 768 x 3 = 2 359 296 байт. Если модем медленный, берите 640x480: это 900 КБ. Таблица времени загрузки есть на странице каждой картинки.'
    },
    {
      id: 'slow', q: 'Заставка «Матрица» тормозит. Что делать?',
      a: 'Уменьшите разрешение экрана до 640x480. Глаза скажут спасибо, видеокарта тоже.'
    },
    {
      id: 'where', q: 'Скачал, а где файл?',
      a: 'Обои лежат в «Мои документы\\Мои рисунки», их можно открыть в Paint. Заставки, темы и сборники лежат в «Мои документы\\Downloads». В «Свойствах экрана» скачанное появляется само.'
    },
    {
      id: 'official', q: 'Почему темы Plus! 98 нельзя скачать?',
      a: 'Они уже есть во вкладке «Темы» у каждого, кто поставил Plus! 98. Мы показываем их только для сравнения.'
    },
    {
      id: 'send', q: 'Как прислать свою работу?',
      a: 'Пришлите архив ZIP до 1 МБ на admin@themeworld98.com. Напишите своё имя или ник и город. Каждую работу мы ставим на свой рабочий стол и проверяем антивирусом AVP. Сейчас в очереди 1 214 писем, так что ждите ответа неделю-две.'
    },
    {
      id: 'dima', q: 'Вы тот Дима, у которого танцующий ребёнок на GeoCities?',
      a: 'Нет. Тот Дима с ребёнком, я с обоями. Нас путают раз в неделю, мы пересылаем друг другу чужие письма.'
    }
  ],

  guestbook: [
    {
      name: 'Neo_99', from: 'Москва', date: '18.11.1999',
      text: 'Заставка с Матрицей на моём ViewSonic 17" просто как в кино! Обои 1024x768 качал восемь минут на 56K, мама ругалась, что телефон занят.',
      reply: 'Мама права, качай 640x480. Разница на 15" почти не видна.'
    },
    {
      name: 'Офисный_Планктон', from: 'Санкт-Петербург', date: '09.11.1999',
      text: 'Поставил «Неоновый киберпанк» на работе в НИИ. Начальник сначала ругался на розовые окна, а через неделю попросил такую же.',
      reply: ''
    },
    {
      name: 'Voodoo_Gamer', from: 'Новосибирск', date: '24.10.1999',
      text: 'Трубы 3D на Voodoo 2 летают! А на работе на S3 Trio ползут. Сделайте трубы без OpenGL, пожалуйста.',
      reply: 'Трубы без OpenGL не бывают. Возьмите «3D Flying Win», она идёт на чём угодно.'
    },
    {
      name: 'CyberGirl98', from: 'Минск', date: '15.10.1999',
      text: 'Спасибо за «Золотой век»! Хорошо, что звуки оставили обычные, на работе сирена из «Красной тревоги» всех пугала.',
      reply: ''
    },
    {
      name: 'Крот', from: 'Екатеринбург', date: '30.09.1999',
      text: 'Где обои по Half-Life? Уже год жду.',
      reply: 'Пришлите сами, ZIP до 1 МБ. Пока никто не прислал.'
    },
    {
      name: 'Танюша', from: 'Киев', date: '06.09.1999',
      text: 'Помогите! Поставила тему, а курсор стал прицелом. Как вернуть стрелку?',
      reply: 'Откройте «Свойства экрана», вкладку «Темы» и выберите «Win 98 (Классическая)».'
    }
  ]
};
