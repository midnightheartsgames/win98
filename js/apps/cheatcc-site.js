(() => {
  const HOST = 'http://www.cheatcc.com';
  const FIRST_VISITOR = 731402;

  const gif = (name, scale = 1) => (window.webGif ? window.webGif(name, scale) : '');
  const esc = (s) => String(s == null ? '' : s)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
  const href = (path = '') => HOST + path;
  const link = (path, label, cls = '') => `<a${cls ? ` class="${cls}"` : ''} data-url="${href(path)}">${label}</a>`;
  const key = (k) => `<kbd class="ccc-key">${k}</kbd>`;
  const plain = (html) => String(html).replace(/<[^>]+>/g, '').replace(/&laquo;|&raquo;/g, '"').replace(/&nbsp;/g, ' ').replace(/&amp;/g, '&');

  const ASCII = [
    String.raw`  ______ _                 _      _____          _         _____            _             _ `,
    String.raw` / _____) |               | |    / _____)       | |       / _____)         | |           | |`,
    String.raw`| /     | |__  _____ _____| |_  | /      ___  __| |_____ | /      _____ ___| |_  ____ _____| |`,
    String.raw`| |     |  _ \| ___ (____ |  _) | |     / _ \/ _  | ___ || |     (____ /___)  _)/ ___)____ | |`,
    String.raw`| \_____| | | | ____/ ___ | |__ | \____| |_| (_| | ____|| \_____/ ___|___ | |__| |   / ___ | |`,
    String.raw` \______)_| |_|_____|_____|\___) \______)___/ \____|_____) \______)_____(___/ \___)_|   \_____|_|`
  ].join('\n');

  const KINDS = {
    codes: { badge: 'КОДЫ', title: 'Коды: набрать во время игры', icon: 'bolt' },
    console: { badge: 'КОНСОЛЬ', title: 'Консоль и чат', icon: 'pc' },
    menu: { badge: 'МЕНЮ', title: 'Отладочные меню разработчиков', icon: 'tools' },
    secrets: { badge: 'СЕКРЕТЫ', title: 'Секреты без кодов', icon: 'lock' }
  };
  const KIND_ORDER = ['codes', 'console', 'menu', 'secrets'];

  const QUAKE_BOTS = 'sarge, ranger, phobos, doom, mynx, orbb, hunter, grunt, bitterman, hossman, daemia, klesk, anarki, xaero, uriel, slash, visor, razor, keel, lucy, stripe, major, tankjr, bones, sorlag, crash';

  const GAMES = [
    {
      id: 'doom',
      title: 'DOOM 98',
      aliases: ['doom', 'дум', 'iddqd', 'idkfa'],
      tested: ['Krot', '28.11.98'],
      blocks: [{
        kind: 'codes',
        how: `Наберите код во время игры, не открывая меню. Раскладка английская, ${key('Enter')} нажимать не надо. Если код принят, вверху экрана появится строчка.`,
        rows: [
          ['IDDQD', 'Режим бога: урон не проходит, здоровье поднимается до 100%. Второй ввод выключает.'],
          ['IDKFA', 'Всё оружие, полный боезапас, рюкзак, броня 200% и все три ключа.'],
          ['IDFA', 'То же, что IDKFA, только без ключей.'],
          ['IDCLIP', 'Проход сквозь стены. Второй ввод выключает.'],
          ['IDSPISPOPD', 'Старое название IDCLIP, работает так же.'],
          ['IDCHOPPERS', 'Бензопила в руки.'],
          ['IDBEHOLDV', 'Неуязвимость на 30 секунд.'],
          ['IDBEHOLDS', 'Берсерк: кулак бьёт в десять раз сильнее, здоровье до 100%.'],
          ['IDBEHOLDI', 'Частичная невидимость на минуту.'],
          ['IDBEHOLDR', 'Защитный костюм на минуту, зелёная жижа не жжёт.'],
          ['IDBEHOLDA', 'Карта уровня целиком.'],
          ['IDBEHOLDL', 'Прибор ночного видения на две минуты.'],
          ['IDDT', `Работает на карте (${key('Tab')}). Первый ввод открывает всю карту, второй показывает монстров и предметы, третий возвращает обычную карту.`],
          ['IDCLEV11', 'Переход на E1M1: Ангар. IDCLEV12–IDCLEV15 ведут на E1M2–E1M5.'],
          ['IDCLEV19', 'Переход на секретный уровень E1M9: Секретная база.'],
          ['IDMYPOS', 'Координаты морпеха и угол, куда он смотрит.']
        ]
      }],
      notes: [
        'В DOOM 98 только первый эпизод, поэтому IDCLEV с другими цифрами молчит.',
        'Если набрать IDBEHOLD и остановиться, игра напомнит буквы: V, S, I, R, A, L.',
        'Коды совпадают с файлом doom2_cheats.zip, который лежит в «Моих документах».'
      ]
    },
    {
      id: 'serioussam',
      title: 'Serious Sam 98',
      aliases: ['serious sam', 'сэм', 'сем', 'please god'],
      tested: ['Krot', '28.11.98'],
      blocks: [{
        kind: 'codes',
        how: 'Наберите фразу во время игры в английской раскладке. Пробел можно не нажимать, игра читает только буквы. Когда код сработал, по экрану проходит жёлтая надпись.',
        rows: [
          ['please god', 'Бессмертие. В левом верхнем углу загорается GOD. Второй ввод выключает.'],
          ['please giveall', 'Все десять стволов, полный боезапас, второй револьвер, здоровье и броня до 200.'],
          ['please killall', 'Убивает всех врагов на уровне. Уг-Зан III остаётся, его придётся добивать самому.']
        ]
      }],
      notes: ['Тестер полчаса набирал «зщдщ» вместо please, пока не переключил раскладку. Учитесь на его ошибках.']
    },
    {
      id: 'quake3',
      title: 'Quake III Arena',
      aliases: ['quake', 'квейк', 'q3', 'console'],
      tested: ['Mike T.', '30.11.98'],
      blocks: [{
        kind: 'console',
        how: `Консоль открывается клавишей ${key('~')} (на русской клавиатуре это ${key('Ё')}). Команды пишутся латиницей и подтверждаются ${key('Enter')}. Слеш в начале можно ставить, можно не ставить. Читы работают только во время матча.`,
        rows: [
          ['god', 'Бессмертие. Второй ввод выключает.'],
          ['noclip', 'Полёт сквозь стены и пол.'],
          ['give all', 'Все девять видов оружия, полный боезапас, 200 здоровья и 200 брони.'],
          ['kill', 'Самоубийство. Минус фраг, зато быстро.'],
          ['map q3dm6', 'Новый матч на арене до 20 фрагов с её ботами. Арены: q3dm1–q3dm6, q3tourney1, q3tourney2. Команда devmap делает то же.'],
          ['addbot xaero 5', 'Добавить бота. Число в конце задаёт уровень от 1 до 5.'],
          ['fraglimit 30', 'Новый лимит фрагов для текущего матча. timelimit 10 ставит лимит в минутах.'],
          ['cg_fov 110', 'Угол обзора от 60 до 130.'],
          ['cg_drawfps 1', 'Счётчик кадров в углу экрана.'],
          ['sensitivity 8', 'Чувствительность мыши от 1 до 30.'],
          ['name Kolya', 'Сменить ник.'],
          ['disconnect', 'Выйти из матча в меню. quit закрывает игру.'],
          ['help', 'Список всех команд.']
        ],
        extra: {
          head: 'Арены для команды map',
          rows: [
            ['q3dm1', 'Arena Gate'], ['q3dm2', 'House of Pain'], ['q3dm3', 'Arena of Death'], ['q3tourney1', 'Power Station 0218'],
            ['q3dm4', 'The Place of Many Deaths'], ['q3dm5', 'The Forgotten Place'], ['q3dm6', 'The Camping Grounds'], ['q3tourney2', 'The Proving Grounds']
          ]
        }
      }],
      notes: [`Имена ботов для addbot: ${QUAKE_BOTS}.`]
    },
    {
      id: 'gta90',
      title: "GTA: Екатеринбург '90",
      aliases: ['gta', 'гта', 'екатеринбург', 'свердловск', 'tank'],
      tested: ['Krot', '01.12.98'],
      blocks: [{
        kind: 'codes',
        how: 'Набирайте слово во время игры, без пауз, в английской раскладке. Игра отвечает «Чит-код принят» и звуком подбора.',
        rows: [
          ['NOCOPS', 'Снимает розыск.'],
          ['ARSENAL', 'ПМ, обрез, АКМ, РПГ-7 и коктейли Молотова с тройным запасом, бронежилет.'],
          ['VOLGA', 'Перед вами встаёт чёрная «Волга» ГАЗ-3102.'],
          ['TANK', 'Перед вами встаёт танк Т-34-85. Пушка стреляет по Ctrl.'],
          ['BESSMERTIE', 'Бессмертие. Второй ввод выключает.'],
          ['DENGI', '+10 000 рублей на счёт.']
        ]
      }],
      notes: ['Машина появляется в нескольких метрах перед вами. Если стоите носом в стену, отойдите, иначе «Волга» окажется внутри дома.']
    },
    {
      id: 'gtann',
      title: 'GTA: Нижний Сити',
      aliases: ['gta', 'гта', 'нижний', 'нижний новгород', 'vice city', 'babki'],
      tested: ['Krot', '02.12.98'],
      blocks: [
        {
          kind: 'codes',
          how: 'Набирайте слово во время игры. Раскладка не важна: игра смотрит на клавиши, а не на буквы.',
          rows: [
            ['ZDOROVIE', 'Полное здоровье.'],
            ['BRONYA', 'Полная броня.'],
            ['STVOLY', 'Кастет, ПМ, дробовик, АК-74 и СВД по 200 патронов, 10 гранат Ф-1.'],
            ['BABKI', '+250 000 рублей.'],
            ['MENTY', 'Снимает розыск.'],
            ['POGODA', 'Следующая погода по кругу: ясно, пасмурно, дождь, туман.']
          ]
        },
        {
          kind: 'menu',
          how: `${key('F7')} во время игры открывает панель слева, город за ней продолжает жить. В катсценах, магазинах и главном меню панель не открывается. Стрелки и ${key('Enter')} нажимают кнопки, ${key('F7')} или ${key('Esc')} закрывают.`,
          sections: [
            ['Задания', 'Запуск любого из десяти заданий, прыжок на контрольную точку, «Пройти», «Провалить», кому отдать тетрадь: Лёве или Кеше.'],
            ['Оружие', 'Семнадцать стволов по одному или «Всё сразу»: от кастета и ПМ до ПКМ, РПГ-7 и ИЖ-38.'],
            ['Деньги', '+1 000, +10 000, +100 000 или «Обнулить».'],
            ['Телепорт', 'Карта района (щелчок переносит, колесо приближает), 29 мест от гостиницы до станций метро и кнопка «К цели задания».'],
            ['Погода', 'Ясно, пасмурно, дождь, туман, «Само» и «Молния».'],
            ['Время', '06:00, 12:00, 18:30, 21:30, 00:00 и «Часы», которые останавливают время.'],
            ['Игрок', 'Бессмертие, «Вылечить», «Починить машину».'],
            ['Способности', 'Супербег, суперпрыжок и полёт сквозь стены. В полёте Пробел поднимает, Alt опускает, Shift ускоряет.'],
            ['Розыск', '−1, +1, «Снять розыск», «Все шесть». По звёздам можно щёлкать.'],
            ['Улица и прохожие', '«Восстановить сломанное» чинит лавки и фонари, «Заполнить улицу» зовёт прохожих.'],
            ['Транспорт', 'Любая машина, грузовик, мотоцикл или армейская техника с окраской: ППС, ДПС, ГАИ, ОМОН, такси, скорая и другие. «Поставить рядом», «Сесть за руль», «Убрать поставленные».']
          ]
        }
      ],
      notes: ['Коды из «Екатеринбурга \'90» здесь не работают. Бессмертие в Нижнем Сити включается только в меню F7.']
    },
    {
      id: 'dota',
      title: 'Dota 98',
      aliases: ['dota', 'дота', '-gold', '-wtf'],
      tested: ['Den', '29.11.98'],
      blocks: [
        {
          kind: 'console',
          how: `Читы разрешает галочка «Читы» в лобби, она включена с завода. В матче нажмите ${key('Enter')}, наберите команду с минусом впереди и снова ${key('Enter')}. Раскладка английская.`,
          rows: [
            ['-gold 5000', 'Золото вашему герою. Число можно любое, без числа дают 5000.'],
            ['-lvlup 5', 'Плюс уровни. Без числа даёт один.'],
            ['-refresh', 'Сбрасывает перезарядку способностей и предметов, восполняет здоровье и ману.'],
            ['-wtf', 'Способности без маны и без перезарядки для всех героев.'],
            ['-unwtf', 'Выключает -wtf.'],
            ['-respawn', 'Мгновенно воскрешает вашего героя.'],
            ['-startgame', 'Пропускает отсчёт перед первой волной крипов.'],
            ['-kill', 'Ваш герой погибает.'],
            ['-win', 'Мгновенная победа вашей стороны.']
          ]
        },
        {
          kind: 'menu',
          how: `${key('F7')} на любом экране выдаёт сундук: в матче для текущего героя, в «Коллекции» для выбранного, в остальных местах для героя из лобби.`,
          sections: [['Сундук', 'Внутри всегда предмет, которого у вас ещё нет. Когда собраны все 90, сундуки больше не выдаются.']]
        }
      ],
      notes: ['Если в лобби галочку сняли, игра ответит «Читы выключены в настройках лобби».']
    },
    {
      id: 'lol',
      title: 'League of Legends 98',
      aliases: ['league', 'lol', 'лол', 'лига легенд', 'сундук'],
      tested: ['Den', '29.11.98'],
      blocks: [{
        kind: 'menu',
        how: `${key('F7')} в любой момент выдаёт хекстековый сундук. В клиенте сразу открывается окно сундука, в матче приходит только сообщение.`,
        sections: [['Сундук', 'Открывает образ, которого у вас ещё нет. Всего образов 30. Когда собраны все, сундук не тратится.']]
      }],
      notes: []
    },
    {
      id: 'ow98',
      title: 'Overwatch 98',
      aliases: ['overwatch', 'овервотч', 'контейнер'],
      tested: ['Mike T.', '30.11.98'],
      blocks: [{
        kind: 'menu',
        how: `${key('F7')} добавляет пять контейнеров. Работает в меню и прямо в матче.`,
        sections: [['Контейнеры', 'В каждом четыре предмета: облики, эмоции, позы победы, реплики, граффити, вступления лучших моментов и иконки игрока. Повтор превращается в кредиты, на кредиты предметы покупают в галерее героев.']]
      }],
      notes: []
    },
    {
      id: 'hsr98',
      title: 'Honkai: Star Rail 98',
      aliases: ['honkai', 'star rail', 'хонкай', 'нефрит', 'jade'],
      tested: ['Den', '01.12.98'],
      blocks: [{
        kind: 'menu',
        how: `${key('F7')} добавляет 1600 звёздного нефрита. Работает везде после титульного экрана, даже в бою и в открытом меню.`,
        sections: [['Нефрит', 'Один прыжок стоит 160 нефрита, так что одно нажатие F7 даёт десять прыжков.']]
      }],
      notes: []
    },
    {
      id: 'legion',
      title: 'Legion Arena',
      aliases: ['legion', 'легион', 'рим'],
      tested: ['Krot', '30.11.98'],
      blocks: [{
        kind: 'menu',
        how: `${key('F7')} в любом месте игры добавляет 500 славы и 500 динариев. Кампания должна быть начата, иначе деньги класть некуда.`,
        sections: [['Слава и динарии', 'Славой нанимают и пополняют отряды, на динарии покупают снаряжение.']]
      }],
      notes: []
    },
    {
      id: 'sims3',
      title: 'The Sims 3',
      aliases: ['sims', 'симс', 'симы', 'деньги'],
      tested: ['Den', '02.12.98'],
      blocks: [{
        kind: 'menu',
        how: `${key('F7')} в режиме жизни открывает окно «Отладка».`,
        sections: [
          ['Деньги', 'Семье: +§ 1 000, +§ 10 000, +§ 50 000, +§ 100 000.'],
          ['Очки счастья', 'Выбранному симу или всей семье: +1 000, +10 000, +50 000.'],
          ['Погода', 'Ясно, пасмурно, дождь или гроза на ближайшие четыре часа.'],
          ['Время суток', 'Утро 7:00, полдень, вечер 18:00, ночь 22:00 или +1 час.']
        ]
      }],
      notes: ['Время перематывается честно: пока игра на паузе, симы проживают эти часы сами, едят, спят и ходят на работу.']
    },
    {
      id: 'forza',
      title: 'Forza Horizon: Рига',
      aliases: ['forza', 'форза', 'рига', 'horizon'],
      tested: ['Mike T.', '02.12.98'],
      blocks: [{
        kind: 'menu',
        how: `${key('F7')} открывает панель «Отладка». ${key('Enter')} выбирает, ${key('Q')} и ${key('E')} листают разделы телепорта, ${key('Esc')} или ${key('F7')} закрывают.`,
        sections: [
          ['Кредиты', '+10 000, +100 000 или +1 000 000 CR.'],
          ['Опыт', '+1 000 XP, +10 000 XP или сразу +1 уровень.'],
          ['Погода', 'Ясно, пасмурно, ливень, гроза, туман. Кнопка «Молния рядом» бьёт молнией поблизости.'],
          ['Повреждения', 'Удар спереди, сзади, слева, справа, мотор 25%, прокол, поджечь и «Ремонт».'],
          ['Время суток', 'Рассвет, утро, полдень, закат, ночь.'],
          ['Телепорт', 'Аванпосты, места, события, сараи и метка на карте (её ставят на карте M).']
        ]
      }],
      notes: ['Во время гонки погода, время и телепорт недоступны. Повреждения работают, только если они включены в настройках.']
    },
    {
      id: 'falloutzp',
      title: 'Fallout: Запорожье',
      aliases: ['fallout', 'фоллаут', 'запорожье', 'талоны'],
      tested: ['Krot', '03.12.98'],
      blocks: [{
        kind: 'menu',
        how: `${key('F7')} открывает «F7 · ОТЛАДКА». Стрелки вверх и вниз выбирают, ${key('Enter')} выполняет, влево и вправо листают вкладки, ${key('Esc')} закрывает.`,
        sections: [
          ['Игрок', 'Талоны: +100, +1 000, +10 000, «Обнулить» или своя сумма. Опыт: +100, +1 000, +1 уровень, +5 уровней. «Вылечить всё» лечит здоровье, конечности и радиацию. Бессмертие. «Выдать набор»: АКМ, ТТ «Фирма», шашка, гранаты и бронежилет с патронами.'],
          ['Карта', 'Щелчок по карте или по названию места переносит туда. Колесо меняет масштаб, перетаскивание двигает карту.'],
          ['Время', 'Ползунок часов, рассвет, утро, полдень, закат, сумерки, полночь, +1 час, +6 часов, следующий день. Погода от ясной до пыльной бури с ЗАлКа.'],
          ['Сюжет', '«Открыть все места» на карте, мгновенный «Адресат», начало «Битвы за мост» по маршруту Комендатуры.']
        ]
      }],
      notes: ['Сюжетные кнопки пропускают части истории. Сохранитесь перед тем, как их нажимать.']
    },
    {
      id: 'cop98',
      title: 'S.T.A.L.K.E.R.: Зов Припяти 98',
      aliases: ['stalker', 'сталкер', 'зов припяти', 'затон', 'спавнер'],
      tested: ['Krot', '03.12.98'],
      blocks: [{
        kind: 'menu',
        how: `${key('F7')} во время игры или кнопка «Спавнер (F7)» в меню паузы. Панель встаёт справа, игра на это время замирает. Двойной щелчок по плитке создаёт выбранное.`,
        sections: [
          ['Предметы', 'Оружие, патроны, броня, детекторы, артефакты, медицина и еда, трофеи, сюжетные. Количество ×1, ×3, ×10, ×30, положить в рюкзак или на землю. У оружия есть кнопка «+3 коробки» патронов.'],
          ['Люди', 'Новичок, сталкер, ветеран, бандит, наёмник, зомбированный. Поведение: как обычно, враждебно, дружелюбно или спутник. Людям можно выдать любое оружие.'],
          ['Мутанты', 'Слепой пёс, плоть, кабан, кровосос, химера.'],
          ['Аномалии', 'Жарка, Электра, Воронка, Трамплин, Карусель, Кисель, Жгучий пух.'],
          ['Погода', 'Ясно, пасмурно, дождь, туман. Смена плавно или сразу, погоду можно «держать».'],
          ['Убрать созданное', 'Одной кнопкой убирает всё, что вы наспавнили.']
        ]
      }],
      notes: ['Сюжетные предметы могут сбить ход заданий, игра предупреждает об этом на карточке предмета.', 'Аномалии не встают вплотную к стенам. Отойдите на открытое место.']
    },
    {
      id: 'mc98',
      title: 'Minecraft 98',
      aliases: ['minecraft', 'майнкрафт', 'f3', 'seed', 'зерно'],
      tested: ['Den', '27.11.98'],
      blocks: [{
        kind: 'menu',
        how: `${key('F3')} включает и выключает экран отладки поверх игры.`,
        sections: [
          ['Строка 1', 'Кадры в секунду, сколько чанков и вершин рисуется.'],
          ['Строка 2', 'Координаты x, y, z.'],
          ['Строка 3', 'Номер чанка и сколько чанков загружено.'],
          ['Строка 4', 'Биом и освещение в точке, где вы стоите.'],
          ['Строка 5', 'Время суток, номер дня и число существ.'],
          ['Строка 6', 'Зерно мира, режим и сложность.'],
          ['Строка 7', 'Блок под прицелом и его координаты.']
        ]
      }],
      notes: ['Зерно мира с F3 можно вписать в поле «Зерно» при создании нового мира и получить ту же карту.', 'В режиме «Творчество» двойное нажатие Пробела включает полёт. Это не чит, а режим игры, но нас про него спрашивают каждый день.']
    },
    {
      id: 'tekken3',
      title: 'Tekken 3 98',
      aliases: ['tekken', 'теккен', 'колосс'],
      tested: ['Mike T.', '27.11.98'],
      blocks: [{
        kind: 'secrets',
        how: 'Кодов в игре нет. Скрытые бойцы открываются прохождением аркады, по одному за каждое прохождение.',
        rows: [
          ['Потапыч', 'Первое прохождение аркады. Цирковой медведь.'],
          ['Лю Шэн', 'Второе прохождение аркады или пройденный «Штурм „Курогане“».'],
          ['Страж-7', 'Третье прохождение. Советский робот-охранник.'],
          ['Чурбан', 'Четвёртое прохождение. Деревянный манекен, в каждом раунде копирует чужой стиль.'],
          ['Гэндзо Курогане', 'Пятое прохождение.'],
          ['Колосс', 'Шестое прохождение.'],
          ['Пылающий Колосс', 'Седьмое: пройдите аркаду за Колосса или наберите девять прохождений.']
        ]
      }],
      notes: ['Первое прохождение аркады открывает и режим «Штурм „Курогане“». Боец, с которым вы прошли аркаду, получает все четыре костюма.']
    }
  ];

  const MYTHS = [
    {
      game: 'Half-Life 98',
      claim: 'Запустить с ключом -console, ввести sv_cheats 1 и impulse 101.',
      heard: 'журналы и форумы',
      verdict: 'no',
      truth: 'Это рецепт для американской коробки Half-Life. В Half-Life 98 из Steam консоли нет совсем, ни по тильде, ни по Ё.'
    },
    {
      game: 'Сапёр',
      claim: 'Набрать xyzzy, нажать Shift+Enter, и пиксель в углу экрана подскажет мину.',
      heard: 'школьный двор',
      verdict: 'no',
      truth: 'Проверили на трёх машинах с Win 98. Пиксель не загорается. Мины ищите честно.'
    },
    {
      game: '3D Pinball',
      claim: 'Набрать hidden test, и шарик можно таскать мышкой.',
      heard: 'письмо читателя',
      verdict: 'no',
      truth: 'Шарик мышку не слушается. Набирали и в начале игры, и во время.'
    },
    {
      game: 'Косынка',
      claim: 'Alt+Shift+2 запускает победный салют из карт.',
      heard: 'чат «Кроватка»',
      verdict: 'no',
      truth: 'Ничего не происходит. Салют бывает только после честной победы.'
    },
    {
      game: 'Wolfenstein 3D',
      claim: 'Зажать M+L+I: здоровье, патроны и пулемёт.',
      heard: 'старая книжка с кодами для DOS',
      verdict: 'warn',
      truth: 'Работает и в издании из Steam: 100% здоровья, 99 патронов, оба ключа и всё оружие. Но счёт обнуляется, и в таблицу рекордов после этого не попасть.'
    },
    {
      game: 'Аватар: Тихий цикл',
      claim: 'F9 открывает меню разработчиков с телепортом и боями.',
      heard: 'GamerZone',
      verdict: 'no',
      truth: 'Меню было в отладочных сборках, перед выпуском его вырезали. В версии из Steam F9 ничего не делает.'
    },
    {
      game: 'S.T.A.L.K.E.R. 98',
      claim: 'F7 открывает спавнер, как в «Зове Припяти».',
      heard: 'GamerZone',
      verdict: 'warn',
      truth: 'В «Тени Чернобыля 98» F7 загружает быстрое сохранение, как и F9. Если не сохранялись (F5 или F6), откатитесь неизвестно куда.'
    },
    {
      game: 'GTA: Нижний Сити',
      claim: 'Коды из «Екатеринбурга \'90» подходят: BESSMERTIE, TANK.',
      heard: 'GamerZone',
      verdict: 'no',
      truth: 'У Нижнего Сити свои коды: ZDOROVIE, BRONYA, STVOLY, BABKI, MENTY, POGODA. Бессмертие и танк есть только в меню F7.'
    },
    {
      game: 'Fallout 2 Demo',
      claim: 'Бесконечный багажник у машины Хайвеймен.',
      heard: 'письмо читателя',
      verdict: 'no',
      truth: 'В демоверсии нет машины. Там только Храм Испытаний, муравьи, скорпионы, ловушки и поединок с Камероном.'
    }
  ];

  const NEWS = [
    ['03.12.98', 'Добавлены F7-меню «Зова Припяти 98» и «Fallout: Запорожье».'],
    ['02.12.98', 'Коды и меню отладки GTA: Нижний Сити. The Sims 3: окно «Отладка».'],
    ['01.12.98', 'GTA: Екатеринбург \'90: шесть кодов, включая TANK.'],
    ['30.11.98', 'Консоль Quake III Arena: все команды и имена ботов.'],
    ['28.11.98', 'Открыт раздел «Мифы»: коды, которые не работают.']
  ];

  const PROMO = ['WIN98SE', 'CYBER1998'];

  const gameById = (id) => GAMES.find(g => g.id === id) || null;
  const kindsOf = (g) => [...new Set(g.blocks.map(b => b.kind))];
  const gameText = (g) => [g.title, ...g.aliases, ...g.blocks.flatMap(b => [b.how, ...(b.rows || []).flat(), ...(b.sections || []).flat()]), ...g.notes].map(plain).join(' ').toLowerCase();

  const parseUrl = (url) => {
    const raw = String(url || '');
    const bare = raw.split('#')[0];
    const parts = bare.match(/^(?:[a-z]+:\/\/)?([^/?]*)([^?]*)(?:\?(.*))?$/i) || [];
    const path = (parts[2] || '').toLowerCase().replace(/\/+$/, '');
    const query = {};
    (parts[3] || '').split('&').forEach(pair => {
      const [k, v = ''] = pair.split('=');
      if (!k) return;
      try { query[k.toLowerCase()] = decodeURIComponent(v.replace(/\+/g, ' ')); } catch (e) { query[k.toLowerCase()] = v; }
    });
    const gameMatch = path.match(/^\/pc\/([a-z0-9-]+)(?:\.html?)?$/);
    if (gameMatch) return { view: 'game', id: gameMatch[1] };
    if (path === '/myths' || path === '/myths.html') return { view: 'myths' };
    if (path === '/search' || query.q !== undefined) return { view: 'search', q: (query.q || '').trim() };
    if (path === '' || path === '/index.html' || path === '/pc' || path === '/pc/index.html') return { view: 'home' };
    return { view: 'missing' };
  };

  const search = (q) => {
    const words = String(q || '').toLowerCase().split(/\s+/).filter(Boolean);
    if (!words.length) return [];
    return GAMES.filter(g => {
      const text = gameText(g);
      return words.every(w => text.includes(w));
    });
  };

  const site = {
    host: HOST,
    games: GAMES,
    myths: MYTHS,
    kinds: KINDS,
    visitor: FIRST_VISITOR,
    parseUrl,
    search,

    renderSite(url) {
      const route = parseUrl(url);
      this.visitor += 1;
      return `
        <div class="ccc-page">
          <div class="ccc-wrap">
            <pre class="ccc-ascii">${ASCII}</pre>
            <div class="ccc-sub"><b>Cheat Code Central</b> &middot; The #1 Video Game Cheats and Codes Site on the Net! &middot; русский раздел</div>
            ${this.renderNav(route)}
            <table class="ccc-cols" cellspacing="0" cellpadding="0">
              <tr>
                <td class="ccc-main" valign="top">${this.renderView(route)}</td>
                <td class="ccc-side" valign="top">${this.renderSide()}</td>
              </tr>
            </table>
            ${this.renderFooter()}
          </div>
        </div>
      `;
    },

    renderView(route) {
      if (route.view === 'game') return this.renderGame(route.id);
      if (route.view === 'myths') return this.renderMyths();
      if (route.view === 'search') return this.renderSearch(route.q);
      if (route.view === 'missing') return this.renderMissing();
      return this.renderHome();
    },

    renderNav(route) {
      const items = [['home', '', 'Все игры'], ['myths', '/myths.html', 'Мифы и фейки']];
      const nav = items.map(([view, path, label]) => (route.view === view ? `<b>${label}</b>` : link(path, label))).join(' | ');
      return `
        <table class="ccc-bar" cellspacing="0" cellpadding="0">
          <tr>
            <td class="ccc-bar-nav">[ ${nav} | <a href="mailto:cheats@cheatcc.com">Прислать код</a> ]</td>
            <td class="ccc-bar-find" align="right">
              <input type="text" id="ccc-q" size="22" maxlength="40" value="${esc(route.q || '')}" placeholder="DOOM, GTA, F7...">
              <button type="button" class="win-btn" id="ccc-go">Найти</button>
            </td>
          </tr>
        </table>
      `;
    },

    renderBadges(g) {
      return kindsOf(g).map(k => `<span class="ccc-badge ccc-badge-${k}">${KINDS[k].badge}</span>`).join(' ');
    },

    renderHome() {
      const groups = KIND_ORDER.map(kind => {
        const list = GAMES.filter(g => g.blocks[0].kind === kind);
        if (!list.length) return '';
        return `
          <tr><th colspan="3" class="ccc-group">${gif(KINDS[kind].icon)} ${KINDS[kind].title}</th></tr>
          ${list.map(g => `
            <tr>
              <td class="ccc-idx-title">${gif('joy')} ${link(`/pc/${g.id}.html`, esc(g.title))}</td>
              <td class="ccc-idx-kind">${this.renderBadges(g)}</td>
              <td class="ccc-idx-test">${esc(g.tested[1])}</td>
            </tr>
          `).join('')}
        `;
      }).join('');
      return `
        <h1 class="ccc-h1">Коды к играм для PC</h1>
        <p class="ccc-lead">Здесь только то, что работает. Каждый код наш тестер набрал руками на Win 98 с игрой из Steam, прежде чем код попал на страницу. Что не сработало, лежит в разделе ${link('/myths.html', 'Мифы и фейки')}.</p>
        <table class="ccc-index" cellspacing="0" cellpadding="0">
          <tr><th>Игра</th><th>Что есть</th><th>Проверено</th></tr>
          ${groups}
        </table>
        <h2 class="ccc-h2">${gif('question')} Как вводить</h2>
        <table class="ccc-how" cellspacing="0" cellpadding="0">
          <tr><td class="ccc-how-k"><span class="ccc-badge ccc-badge-codes">КОДЫ</span></td><td>Набираются прямо во время игры, без меню и без ${key('Enter')}. Почти везде нужна английская раскладка: переключите её до того, как начнёте.</td></tr>
          <tr><td class="ccc-how-k"><span class="ccc-badge ccc-badge-console">КОНСОЛЬ</span></td><td>Сначала откройте консоль или чат (в Quake III это ${key('~')}, в Dota 98 ${key('Enter')}), потом пишите команду.</td></tr>
          <tr><td class="ccc-how-k"><span class="ccc-badge ccc-badge-menu">МЕНЮ</span></td><td>Отладочные меню, которые разработчики оставили в продажной версии. Чаще всего это ${key('F7')}, в Minecraft 98 ${key('F3')}.</td></tr>
          <tr><td class="ccc-how-k"><span class="ccc-badge ccc-badge-secrets">СЕКРЕТЫ</span></td><td>Кодов нет, но есть то, что открывается за прохождение.</td></tr>
        </table>
        <p class="ccc-warn">${gif('warn')} Сохраняйтесь перед вводом кодов. Сюжетные кнопки в меню отладки могут пропустить задание навсегда.</p>
      `;
    },

    renderBlock(game, block, bi) {
      const kind = KINDS[block.kind];
      const head = `<h2 class="ccc-h2">${gif(kind.icon)} ${kind.title}</h2><div class="ccc-how-box">${block.how}</div>`;
      if (block.sections) {
        return `${head}
          <table class="ccc-table" cellspacing="0" cellpadding="0">
            <tr><th class="ccc-col-code">Раздел</th><th>Что внутри</th></tr>
            ${block.sections.map(([name, text]) => `<tr><td class="ccc-col-code"><b>${esc(name)}</b></td><td>${text}</td></tr>`).join('')}
          </table>`;
      }
      const copyable = block.kind !== 'secrets';
      const extra = block.extra ? `
          <table class="ccc-table ccc-table-mini" cellspacing="0" cellpadding="0">
            <tr><th colspan="2">${esc(block.extra.head)}</th></tr>
            ${block.extra.rows.map(([code, name]) => `<tr><td class="ccc-col-code"><span class="ccc-code">${esc(code)}</span></td><td>${esc(name)}</td></tr>`).join('')}
          </table>` : '';
      return `${head}
          <table class="ccc-table" cellspacing="0" cellpadding="0">
            <tr><th class="ccc-col-code">${block.kind === 'secrets' ? 'Что открыть' : 'Код'}</th><th>${block.kind === 'secrets' ? 'Как' : 'Что делает'}</th>${copyable ? '<th class="ccc-col-copy">Буфер</th>' : ''}</tr>
            ${block.rows.map(([code, text], ri) => `
              <tr>
                <td class="ccc-col-code">${block.kind === 'secrets' ? `<b>${esc(code)}</b>` : `<span class="ccc-code">${esc(code)}</span>`}</td>
                <td>${text}</td>
                ${copyable ? `<td class="ccc-col-copy"><button type="button" class="win-btn ccc-copy" data-code="${esc(code)}" data-row="${bi}-${ri}">Копировать</button></td>` : ''}
              </tr>
            `).join('')}
          </table>${extra}`;
    },

    renderPlayButton(game) {
      const gm = window.gameManager;
      if (!gm || !gm.catalog || !gm.catalog[game.id]) return '';
      const installed = gm.isInstalled(game.id);
      return `<button type="button" class="win-btn ccc-play" data-game="${game.id}">${installed ? 'Запустить игру' : 'Купить в Steam'}</button>`;
    },

    renderGame(id) {
      const game = gameById(id);
      if (!game) return this.renderMissing();
      const [tester, date] = game.tested;
      return `
        <div class="ccc-crumbs">${link('', 'CheatCC')} &gt; PC &gt; ${esc(game.title)}</div>
        <table class="ccc-gamehead" cellspacing="0" cellpadding="0">
          <tr>
            <td>
              <h1 class="ccc-h1">${esc(game.title)}</h1>
              <div class="ccc-meta">PC &middot; Win 98 &middot; продаётся в Steam &middot; ${this.renderBadges(game)}</div>
            </td>
            <td align="right" valign="top"><span class="ccc-stamp ccc-stamp-ok">ПРОВЕРЕНО<br><small>${esc(date)} &middot; ${esc(tester)}</small></span></td>
          </tr>
        </table>
        ${game.blocks.map((b, i) => this.renderBlock(game, b, i)).join('')}
        ${game.notes.length ? `<h2 class="ccc-h2">${gif('pencil')} Заметки тестера</h2><ul class="ccc-notes">${game.notes.map(n => `<li>${esc(n)}</li>`).join('')}</ul>` : ''}
        <p class="ccc-actions">
          ${this.renderPlayButton(game)}
          <button type="button" class="win-btn ccc-notepad" data-game="${game.id}">Открыть коды в Блокноте</button>
          &nbsp; ${link('', '&lt;&lt; Все игры')}
        </p>
      `;
    },

    renderMyths() {
      return `
        <div class="ccc-crumbs">${link('', 'CheatCC')} &gt; Мифы и фейки</div>
        <h1 class="ccc-h1">Мифы и фейки</h1>
        <p class="ccc-lead">Эти коды нам присылают чаще всего. Мы набрали каждый и записали, что вышло.</p>
        <table class="ccc-myths" cellspacing="0" cellpadding="0">
          <tr><th>Игра</th><th>Что говорят</th><th>Вердикт</th></tr>
          ${MYTHS.map(m => `
            <tr>
              <td class="ccc-myth-game"><b>${esc(m.game)}</b><br><small>слышали: ${esc(m.heard)}</small></td>
              <td>${esc(m.claim)}<div class="ccc-myth-truth">${esc(m.truth)}</div></td>
              <td class="ccc-myth-v"><span class="ccc-stamp ${m.verdict === 'no' ? 'ccc-stamp-no' : 'ccc-stamp-warn'}">${m.verdict === 'no' ? 'НЕ<br>РАБОТАЕТ' : 'ОСТО-<br>РОЖНО'}</span></td>
            </tr>
          `).join('')}
        </table>
        <p class="ccc-small">Нашли код, которого нет на сайте? Пришлите его на <a href="mailto:cheats@cheatcc.com">cheats@cheatcc.com</a>. Мы проверим и напишем, кто прислал.</p>
      `;
    },

    renderSearch(q) {
      const found = search(q);
      return `
        <div class="ccc-crumbs">${link('', 'CheatCC')} &gt; Поиск</div>
        <h1 class="ccc-h1">Поиск: &laquo;${esc(q)}&raquo;</h1>
        ${found.length ? `
          <ol class="ccc-results">
            ${found.map(g => `<li>${link(`/pc/${g.id}.html`, esc(g.title))} ${this.renderBadges(g)}</li>`).join('')}
          </ol>
        ` : `<p>Ничего не нашлось. Попробуйте название игры по-английски или клавишу, например F7. Если код из школы, загляните в ${link('/myths.html', 'Мифы и фейки')}.</p>`}
        <p class="ccc-small">${link('', '&lt;&lt; Все игры')}</p>
      `;
    },

    renderMissing() {
      return `
        <h1 class="ccc-h1">404: страница не найдена</h1>
        <p>Такой страницы на сервере нет. Может, её ещё проверяют.</p>
        <p>${link('', 'На главную &gt;&gt;')}</p>
      `;
    },

    renderSide() {
      const top = ['gta90', 'doom', 'gtann', 'cop98', 'dota'].map(gameById).filter(Boolean);
      return `
        <div class="ccc-box">
          <div class="ccc-box-h">${gif('star')} Код недели</div>
          <div class="ccc-box-b"><span class="ccc-code">TANK</span><br>GTA: Екатеринбург '90. <span class="ccc-nobr">Т-34-85</span> посреди проспекта Ленина. ${link('/pc/gta90.html', 'Подробнее')}</div>
        </div>
        <div class="ccc-box">
          <div class="ccc-box-h">${gif('news')} Обновления</div>
          <div class="ccc-box-b">${NEWS.map(([d, t]) => `<div class="ccc-upd"><b>${d}</b> ${esc(t)}</div>`).join('')}</div>
        </div>
        <div class="ccc-box">
          <div class="ccc-box-h">${gif('cup')} Чаще всего ищут</div>
          <div class="ccc-box-b"><ol class="ccc-top">${top.map(g => `<li>${link(`/pc/${g.id}.html`, esc(g.title))}</li>`).join('')}</ol></div>
        </div>
        <div class="ccc-box">
          <div class="ccc-box-h">${gif('money')} Не чит, но полезно</div>
          <div class="ccc-box-b">Промокоды Steam на скидку 20%: ${PROMO.map(c => `<span class="ccc-code">${c}</span>`).join(' и ')}. Вводятся в окне покупки, вместе не складываются.</div>
        </div>
      `;
    },

    renderFooter() {
      const digits = String(this.visitor).padStart(7, '0').split('').map(d => `<span>${d}</span>`).join('');
      const ring = window.retroSites && window.retroSites.renderWebRing ? window.retroSites.renderWebRing(HOST) : '';
      return `
        <div class="ccc-foot">
          <div class="ccc-counter">Посетителей с 1996 года: <span class="web-counter">${digits}</span></div>
          <p>Русский раздел ведут читатели-добровольцы. Тестеры: Krot (Новосибирск), Den (Москва), Mike T. (Чикаго, основная команда CheatCC).</p>
          <p class="retro-mail-contact">Прислать код или ошибку: <a class="web-mail-link" href="mailto:cheats@cheatcc.com">${gif('mail')}cheats@cheatcc.com</a></p>
          <p class="ccc-small">Коды вы вводите на свой страх и риск. CheatCC не отвечает за потерянные сохранения и сломанные клавиши F7.</p>
          ${ring}
        </div>
      `;
    },

    gameTextFile(game) {
      const lines = [`${game.title} - коды и секреты`, 'Cheat Code Central, www.cheatcc.com', ''];
      game.blocks.forEach(b => {
        lines.push(KINDS[b.kind].title.toUpperCase(), plain(b.how), '');
        (b.rows || []).forEach(([code, text]) => lines.push(`${code.padEnd(16)} ${plain(text)}`));
        (b.sections || []).forEach(([name, text]) => lines.push(`${name}: ${plain(text)}`));
        lines.push('');
      });
      game.notes.forEach(n => lines.push(`* ${n}`));
      return lines.join('\r\n');
    },

    attachEvents(win, container, url) {
      const ie = window.appIE;
      const route = parseUrl(url);
      const ding = () => { if (window.soundSys) window.soundSys.playDing(); };

      const input = container.querySelector('#ccc-q');
      const go = () => {
        const q = input ? input.value.trim() : '';
        if (ie) ie.navigate(win, q ? href(`/search?q=${encodeURIComponent(q)}`) : href(''));
      };
      if (input) input.addEventListener('keydown', e => { if (e.key === 'Enter') go(); });
      const goBtn = container.querySelector('#ccc-go');
      if (goBtn) goBtn.addEventListener('click', go);

      container.querySelectorAll('.ccc-copy').forEach(btn => btn.addEventListener('click', () => {
        if (ie && typeof ie.copyToClipboard === 'function') ie.copyToClipboard(btn.dataset.code);
        ding();
        btn.textContent = 'Скопировано!';
        setTimeout(() => { btn.textContent = 'Копировать'; }, 1500);
      }));

      container.querySelectorAll('.ccc-play').forEach(btn => btn.addEventListener('click', () => {
        const gm = window.gameManager;
        const id = btn.dataset.game;
        if (!gm || !gm.catalog[id]) return;
        if (gm.isInstalled(id)) gm.catalog[id].launch();
        else gm.showInSteam(id);
      }));

      container.querySelectorAll('.ccc-notepad').forEach(btn => btn.addEventListener('click', () => {
        const game = gameById(btn.dataset.game);
        if (!game || !window.appNotepad) return;
        window.appNotepad.open(`${game.title.replace(/[\\/:*?"<>|]/g, '')} - коды.txt`, this.gameTextFile(game));
        ding();
      }));

      if (route.view === 'search' && input) input.focus({ preventScroll: true });
    }
  };

  window.cheatccSite = site;
})();
