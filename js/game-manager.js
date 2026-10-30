class GameManager {
  constructor() {
    this.storageKey = 'win98_game_state';
    this.catalog = {
      wolf3d: {
        id: 'wolf3d',
        steam: true,
        title: 'Wolfenstein 3D',
        subtitle: 'Легендарный 3D-шутер от id Software',
        developer: 'id Software (1992)',
        price: 14.99,
        priceDisplay: '$14.99',
        icon: 'wolf3d',
        setupExe: 'Setup_Wolf3D.exe',
        targetExe: 'WOLF3D.EXE',
        folder: 'Wolf3D',
        fileSize: '4.3 MB',
        desc: 'Родоначальник 3D-шутеров целиком: шесть эпизодов по десять этажей, тайные стены, золотые и серебряные ключи, овчарки, мутанты и боссы от Ганса Гросса до генерала Фетгезихта. Нож, пистолет, автомат и пулемёт, четыре уровня сложности, сохранения и таблица рекордов.',
        genre: 'Шутер от первого лица',
        tags: ['Классика', 'Лабиринты', 'Тайники', 'Боссы', 'Вторая мировая'],
        shots: ['Тюремный блок замка', 'Ганс Гросс у выхода'],
        launch: () => window.appWolf3D && window.appWolf3D.open()
      },
      quest_demo: {
        id: 'quest_demo',
        cdDemo: true,
        title: 'LucasQuest 98 Demo',
        subtitle: 'Пиратский квест в стиле LucasArts SCUMM',
        developer: 'Retro Quest Games (1998)',
        price: 0,
        priceDisplay: 'DEMO',
        icon: 'lucas-quest',
        setupExe: 'questdemo.exe',
        targetExe: 'QUEST.EXE',
        folder: 'LucasQuest',
        fileSize: '3.8 MB (Igromania CD Edition)',
        desc: 'Увлекательный графический квест золотой эпохи приключений! Гайбраш Байтвуд отправляется исследовать замок Редмонд и разгадать загадки пиратов.',
        genre: 'Квест',
        tags: ['Point-and-click', 'Юмор', 'Головоломки', 'Пиксельная графика'],
        shots: ['Лаборатория мейнфрейма, 1998 год', 'Спутниковая станция на крыше'],
        launch: () => window.appScummQuest && window.appScummQuest.open()
      },
      stalker: {
        id: 'stalker',
        steam: true,
        title: 'S.T.A.L.K.E.R.',
        subtitle: 'Тень Чернобыля (1998 Alpha Edition)',
        developer: 'GSC Game World (1998 Preview)',
        price: 29.99,
        priceDisplay: '$29.99',
        icon: 'stalker',
        setupExe: 'Setup_Stalker.exe',
        targetExe: 'STALKER.EXE',
        folder: 'Stalker',
        fileSize: '14.2 MB (Full Release)',
        desc: 'Текстовый квест о Зоне отчуждения ЧАЭС. Вы очнулись без памяти, и в КПК одна запись: «Убить Стрелка». Пройдите от Кордона до Саркофага и найдите все семь концовок.',
        genre: 'Текстовый квест',
        tags: ['Зона отчуждения', 'Выбор решений', 'Несколько концовок', 'Атмосфера'],
        shots: ['Титульный экран', 'Деревня новичков: выбор действия'],
        launch: () => window.appStalker && window.appStalker.open()
      },
      fallout98_demo: {
        id: 'fallout98_demo',
        cdDemo: true,
        title: 'Fallout 98 Demo',
        subtitle: 'Храм Испытаний (Temple of Trials)',
        developer: 'Black Isle Studios / Interplay (1998)',
        price: 0,
        priceDisplay: 'DEMO',
        icon: 'fallout2',
        setupExe: 'fallout98demo.exe',
        targetExe: 'FALLOUT2.EXE',
        folder: 'Fallout2',
        fileSize: '8.4 MB (Igromania CD Edition)',
        desc: 'Культовая постапокалиптическая изометрическая RPG! Пройдите Храм Испытаний в роли Избранного, сразитесь с муравьями и скорпионами, разминируйте ловушки и сойдитесь в поединке с Камероном.',
        genre: 'Ролевая игра',
        tags: ['Постапокалипсис', 'Пошаговый бой', 'Изометрия', 'Демоверсия'],
        shots: ['Первый зал Храма Испытаний', 'Лист персонажа S.P.E.C.I.A.L.'],
        launch: () => window.appFallout2 && window.appFallout2.open()
      },
      burnout: {
        id: 'burnout',
        cdDemo: true,
        title: 'Burnout: Championship Drag Racing Demo',
        subtitle: 'Легендарный симулятор дрэг-рейсинга от Bethesda Softworks',
        developer: 'Bethesda Softworks / MediaTech West (1998)',
        price: 0,
        priceDisplay: 'DEMO',
        icon: 'burnout',
        setupExe: 'burndemo.exe',
        targetExe: 'BURNDEMO.EXE',
        folder: 'BurnoutDemo',
        fileSize: '12.4 MB (Igromania CD Edition)',
        desc: 'Официальная демо-версия реалистичного симулятора дрэг-рейсинга на 1/4 мили! Прогрев резины в Water Box, светофор Christmas Tree, настройка КПП и наддува в гараже, закись азота и бешеная скорость.',
        launch: () => window.appBurnout && window.appBurnout.open()
      },
      videoplayer: {
        id: 'videoplayer',
        isApp: true,
        title: 'ActiveMovie Video Player 98',
        subtitle: 'Проигрыватель видео и мультимедиа',
        developer: 'Microslop Multimedia Systems (1998)',
        price: 19.99,
        priceDisplay: '$19.99',
        icon: 'video-player',
        setupExe: 'Setup_MediaPlayer.exe',
        targetExe: 'MPLAYER.EXE',
        folder: 'MediaPlayer',
        fileSize: '4.2 MB (CD-ROM)',
        desc: 'Полнофункциональный мультимедийный проигрыватель для Win 98. Поддержка видеороликов AVI, MPEG, кинематографического воспроизведения и открытия файлов.',
        launch: () => window.appVideoPlayer && window.appVideoPlayer.open()
      },
      photoshop: {
        id: 'photoshop',
        isApp: true,
        title: 'RetroShop 98 (Photo Editor Pro)',
        subtitle: 'Профессиональный графический редактор со слоями',
        developer: 'Adobe Systems Inc. (1998)',
        price: 39.99,
        priceDisplay: '$39.99',
        icon: 'photoshop',
        setupExe: 'Setup_RetroShop.exe',
        targetExe: 'PHOTOSHOP.EXE',
        folder: 'RetroShop',
        fileSize: '18.5 MB (Full Suite)',
        desc: 'Мощный растровый графический редактор. Поддержка слоев с прозрачностью, фильтры размытия, пикселизации и тиснения, регулировка яркости/контраста и богатый набор кистей.',
        launch: () => window.appPhotoshop && window.appPhotoshop.open()
      },
      wincommander: {
        id: 'wincommander',
        isApp: true,
        title: 'WinCommander 98',
        subtitle: 'Двухпанельный файловый менеджер',
        developer: 'C. Ghisler & Co. (1998)',
        price: 24.99,
        priceDisplay: '$24.99',
        icon: 'wincommander',
        setupExe: 'Setup_WinCommander.exe',
        targetExe: 'WINCMD.EXE',
        folder: 'WinCommander',
        fileSize: '2.1 MB (Floppy Edition)',
        desc: 'Легендарный инструмент для работы с файлами. Две независимые панели, быстрый просмотр F3, редактирование F4, копирование F5, перенос F6, создание папок F7 и удаление F8.',
        launch: () => window.appWinCommander && window.appWinCommander.open()
      },
      winamp: {
        id: 'winamp',
        isApp: true,
        title: 'WinAmp 98 Pro',
        subtitle: 'Аудиопроигрыватель MP3, WAV и MIDI',
        developer: 'Nullsoft, Inc. (1998)',
        price: 14.99,
        priceDisplay: '$14.99',
        icon: 'winamp',
        setupExe: 'Setup_Winamp.exe',
        targetExe: 'WINAMP.EXE',
        folder: 'Winamp',
        fileSize: '2.8 MB (Floppy Edition)',
        desc: 'It really whips the llama\'s ass! Культовый плеер для воспроизведения музыки MP3, WAV и MIDI. Оснащен 10-полосным эквалайзером, анализатором спектра, редактором плейлистов и ретро-скином 1998 года.',
        launch: () => window.appWinamp && window.appWinamp.open()
      },
      blender: {
        id: 'blender',
        isApp: true,
        title: 'Blender 1.60',
        subtitle: 'Компактный 3D-редактор и анимационный пакет',
        developer: 'Not a Number (NaN) / NeoGeo (1998-1999)',
        price: 0,
        priceDisplay: 'FREEWARE',
        icon: 'blender',
        setupExe: 'Setup_Blender160.exe',
        targetExe: 'BLENDER.EXE',
        folder: 'Blender',
        fileSize: '1.8 MB (Freeware)',
        downloadUrl: 'http://www.blender3d.com',
        desc: 'Революционный компактный пакет 3D-моделирования и рендеринга. Быстрый полигональный моделер с выдавливанием (Extrude), ортографический и перспективный вьюпорты, трассировка лучей и легкий вес (менее 2 МБ).',
        launch: () => window.appBlender && window.appBlender.open()
      },
      blender204: {
        id: 'blender204',
        isApp: true,
        title: 'Blender 2.04',
        subtitle: '3D-моделирование, рендер, анимация и игровой движок',
        developer: 'Not a Number (NaN), 2000',
        price: 0,
        priceDisplay: 'FREEWARE',
        icon: 'blender204',
        setupExe: 'blender2.04-windows.exe',
        targetExe: 'Blender.exe',
        folder: 'Blender 2.04',
        fileSize: '2.9 MB (Freeware)',
        downloadUrl: 'http://www.blender3d.com',
        desc: 'Бесплатный пакет трёхмерной графики от Not a Number: полигональное моделирование, кривые и NURBS-поверхности, метаболы, 3D-текст, материалы и процедурные текстуры, scanline-рендер с тенями, IPO-анимация, редактор последовательностей и встроенный игровой движок.',
        launch: () => window.appBlender204 && window.appBlender204.open()
      },
      'half-life_demo': {
        id: 'half-life_demo',
        cdDemo: true,
        title: 'Half-Life 98 Demo',
        subtitle: 'Культовый научно-фантастический 3D-шутер от Valve',
        developer: 'Valve Software / Sierra On-Line (1998)',
        price: 0,
        priceDisplay: 'DEMO',
        icon: 'half-life',
        setupExe: 'hl98demo.exe',
        targetExe: 'HL.EXE',
        folder: 'HalfLife',
        fileSize: '24.5 MB (Igromania CD Edition)',
        desc: 'Легендарный 3D-шутер! Доктор Гордон Фримен оказывается в эпицентре каскадного резонанса в исследовательском центре Чёрная Меза. Сразитесь с пришельцами из мира Зен и спецназом HECU.',
        genre: 'Шутер от первого лица',
        tags: ['Научная фантастика', 'Пришельцы', 'Чёрная Меза', 'Классика'],
        shots: ['Сектор аномальных материалов', 'Вортигонт в секторе C'],
        launch: () => window.appHalfLife && window.appHalfLife.open()
      },
      'neon-racer_demo': {
        id: 'neon-racer_demo',
        cdDemo: true,
        title: 'Midnight Glide Demo',
        subtitle: 'Аркадные ночные гонки по неоновому мегаполису',
        developer: 'RetroSpeed Studios (1998)',
        price: 0,
        priceDisplay: 'DEMO',
        icon: 'burnout',
        setupExe: 'glidedemo.exe',
        targetExe: 'GLIDE.EXE',
        folder: 'MidnightGlide',
        fileSize: '8.7 MB (Igromania CD Edition)',
        desc: 'Захватывающие ночные гонки на выживание! Дрифт на крутых поворотах, закись азота, динамичный трафик и адреналиновый дух нелегальных уличных заездов конца 90-х.',
        genre: 'Аркадные гонки',
        tags: ['Ночной город', 'Нитро', 'Дрифт', 'Трафик'],
        shots: ['Гонка Dockside Afterdark', 'Ночная трасса: трафик и нитро'],
        launch: () => window.appNeonRacer && window.appNeonRacer.open()
      },
      hockey: {
        id: 'hockey',
        cdDemo: true,
        title: 'NHL 98',
        subtitle: 'Официальный хоккейный симулятор от EA Sports',
        developer: 'EA Sports (1998)',
        price: 0,
        priceDisplay: 'DEMO',
        icon: 'hockey',
        setupExe: 'nhl98demo.exe',
        targetExe: 'NHL98.EXE',
        folder: 'NHL98',
        fileSize: '15.1 MB (Igromania CD Edition)',
        desc: 'Культовый хоккейный симулятор от EA Sports! Реалистичная физика шайбы, динамичные матчи, силовые приемы у бортов, броски в девятку и атмосфера настоящей ледовой арены.',
        launch: () => window.appHockey && window.appHockey.open()
      },
      worldcup98: {
        id: 'worldcup98',
        cdDemo: true,
        title: 'World Cup 98',
        subtitle: 'Официальный симулятор Чемпионата мира по футболу France 98',
        developer: 'EA Sports (1998)',
        price: 0,
        priceDisplay: 'DEMO',
        icon: 'worldcup98',
        setupExe: 'worldcup98.exe',
        targetExe: 'WORLDCUP98.EXE',
        folder: 'WorldCup98',
        fileSize: '16.8 MB (Igromania CD Edition)',
        desc: 'Официальный футбольный симулятор Чемпионата мира 1998 года во Франции от EA Sports! 16 сборных, тактические схемы (4-4-2, 4-3-3, 3-5-2, 5-3-2), удары с лёта и подкрутка мяча, правило «Золотого гола», исторические сценарии World Cup Classics и серии пенальти.',
        launch: () => window.appWorldCup98 && window.appWorldCup98.open()
      },
      diablo: {
        id: 'diablo',
        steam: true,
        title: 'Diablo',
        subtitle: 'Легендарная Action-RPG от Blizzard North',
        developer: 'Blizzard North / Blizzard Entertainment (1996)',
        price: 39.99,
        priceDisplay: '$39.99',
        icon: 'diablo',
        setupExe: 'Setup_Diablo.exe',
        targetExe: 'DIABLO.EXE',
        folder: 'Diablo',
        fileSize: '32.0 MB (CD-ROM Edition)',
        desc: 'Спуститесь под собор Тристрама и пройдите 16 уровней подземелий: собор, катакомбы, пещеры и сам Ад. Три класса героев, сотни магических предметов, заклинания, задания и финальная битва с Повелителем Ужаса.',
        genre: 'Ролевой экшен',
        tags: ['Тёмное фэнтези', 'Подземелья', 'Три класса', 'Добыча'],
        shots: ['Тристрам: площадь у колодца', 'Бой на втором уровне собора'],
        launch: () => window.appDiablo && window.appDiablo.open()
      },
      doom: {
        id: 'doom',
        steam: true,
        title: 'DOOM 98',
        subtitle: 'Легендарный шутер от id Software',
        developer: 'id Software (1993) / Win 98 Edition',
        price: 9.99,
        priceDisplay: '$9.99',
        icon: 'doom',
        setupExe: 'Setup_Doom.exe',
        targetExe: 'DOOM.EXE',
        folder: 'Doom',
        fileSize: '2.4 MB (Shareware Episode)',
        desc: 'Морпех против легионов ада на лунной базе UAC. Шесть уровней эпизода «По колено в Win 98» с секретным уровнем, девять видов оружия от кулака до BFG9000, девять видов монстров и Кибердемон в финале.',
        genre: 'Шутер от первого лица',
        tags: ['Демоны', 'Классика', 'Секреты', 'Быстрый темп'],
        shots: ['E1M1: Ангар', 'E1M3: Очистной завод'],
        launch: () => window.appDoom && window.appDoom.open()
      },
      serioussam: {
        id: 'serioussam',
        steam: true,
        title: 'Serious Sam 98',
        subtitle: 'Первая встреча — безумный 3D-шутер в Древнем Египте',
        developer: 'Croteam (2001) / Win 98 Edition',
        price: 17.99,
        priceDisplay: '$17.99',
        icon: 'serioussam',
        setupExe: 'Setup_SeriousSam.exe',
        targetExe: 'SAM.EXE',
        folder: 'SeriousSam',
        fileSize: '14.8 MB (3D Accelerated Edition)',
        desc: 'Серьёзный Сэм против орд Ментала в Египте: пять уровней от храма Хатшепсут до Великой пирамиды, десять видов оружия от ножа до пушки, безголовые камикадзе, быки, клиры, биомеханоиды и финальная битва с Уг-Заном III.',
        genre: 'Шутер от первого лица',
        tags: ['Орды врагов', 'Древний Египет', 'Юмор', 'Большие арены'],
        shots: ['Песчаный каньон: взрыв камикадзе', 'Карнак: клиры, гнаар и гарпии'],
        launch: () => window.appSeriousSam && window.appSeriousSam.open()
      },
      stalker98_demo: {
        id: 'stalker98_demo',
        cdDemo: true,
        title: 'S.T.A.L.K.E.R. 98: Тень Чернобыля Demo',
        subtitle: '3D-шутер с элементами RPG в Зоне отчуждения',
        developer: 'GSC Game World (2000) / Win 98 Edition',
        price: 0,
        priceDisplay: 'DEMO',
        icon: 'stalker98',
        setupExe: 'stalker98demo.exe',
        targetExe: 'XR98.EXE',
        folder: 'Stalker98',
        fileSize: '22.6 MB (Igromania CD Edition)',
        desc: 'Меченый просыпается в бункере Сидоровича с единственной записью в КПК: «Убить Стрелка». Кордон и Свалка: аномалии и артефакты, радиация, голод и кровотечение, мутанты, бандиты и военные, торговля, тайники, смена дня и ночи и сюжет до дороги на Агропром.',
        genre: 'Шутер с элементами RPG',
        tags: ['Зона отчуждения', 'Выживание', 'Аномалии', 'Артефакты'],
        shots: ['Костёр в деревне новичков', 'Свалка: автобус и депо'],
        launch: () => window.appStalker98 && window.appStalker98.open()
      },
      lol: {
        id: 'lol',
        steam: true,
        title: 'League of Legends 98',
        subtitle: 'Сражения 5 на 5 на Ущелье призывателей',
        developer: 'Riot Games (1999) / Win 98 Edition',
        price: 12.99,
        priceDisplay: '$12.99',
        icon: 'lol',
        setupExe: 'Setup_LoL.exe',
        targetExe: 'LOL.EXE',
        folder: 'LoL',
        fileSize: '9.8 MB (PVP.net 98 Client)',
        desc: 'Командная стратегия в реальном времени: пять чемпионов против пяти на трёх линиях Ущелья призывателей. Десять героев (Лулу, Джинкс, Гарен, Энни, Эш, Мастер Йи, Мальфит, Тимо, Райз, Алистар), боты трёх уровней сложности, лес, драконы, Барон и полсотни предметов.',
        genre: 'Командная стратегия',
        tags: ['5 на 5', 'Боты', 'Чемпионы', 'Облики'],
        shots: ['Чемпионы на линии', 'Бой чемпионов у реки'],
        launch: () => window.appLoL && window.appLoL.open()
      },
      avatar98: {
        id: 'avatar98',
        steam: true,
        title: 'Аватар: Тихий цикл',
        subtitle: 'JRPG-демо — Аватар, рождённый в Народе Огня',
        developer: 'Студия «Кузница» (1999) / Win 98 Edition',
        price: 7.99,
        priceDisplay: '$7.99',
        icon: 'avatar98',
        setupExe: 'Setup_Avatar98.exe',
        targetExe: 'SILENT.EXE',
        folder: 'Avatar98',
        fileSize: '0.9 MB (Demo, Chapter 1)',
        desc: 'Пошаговая JRPG с активной шкалой времени в духе 1999 года во вселенной «Аватара». Через 174 года после Корры новый Аватар рождается в Народе Огня. Три стойки магии огня, маг металла и блокировщица ци, Состояние Аватара, Пай Шо, радиочастоты и тайна «тишины цикла». Около двух часов прохождения.',
        genre: 'JRPG',
        tags: ['Пошаговые бои', 'Магия стихий', 'Пиксельная графика', 'Демоверсия'],
        shots: ['Рынок Шинрю', 'Бой с головорезами в доках'],
        launch: () => window.appAvatar98 && window.appAvatar98.open()
      },
      moh98_demo: {
        id: 'moh98_demo',
        cdDemo: true,
        title: 'Medal of Honor 98 Demo',
        subtitle: 'Шутер от первого лица — операции УСС, 1944–1945',
        developer: 'DreamWorks Interactive (1999) / Win 98 Edition',
        price: 0,
        priceDisplay: 'DEMO',
        icon: 'moh98',
        setupExe: 'moh98demo.exe',
        targetExe: 'MOH.EXE',
        folder: 'MOH98',
        fileSize: '18.4 MB (Igromania CD Edition)',
        desc: 'Лейтенант Джимми Паттерсон из УСС в тылу врага: шесть миссий от нормандской деревни и базы подлодок Лорьяна до норвежского завода тяжёлой воды, Зигфридова леса, замка Кольдиц и подземных цехов Фау-2. Работа под прикрытием с документами, взрывчатка, базука против «Тигра», сбиваемые каски, солдаты, которые сдаются и возвращают гранаты, тревога с подкреплением, медали по итогам заданий и пароли.',
        genre: 'Шутер от первого лица',
        tags: ['Вторая мировая', 'Диверсии', 'Под прикрытием', 'Сюжетные миссии'],
        shots: ['Сен-Мартен, Нормандия', 'Нордхаузен на закате'],
        launch: () => window.appMoh98 && window.appMoh98.open()
      },
      cop98: {
        id: 'cop98',
        steam: true,
        title: 'S.T.A.L.K.E.R.: Зов Припяти 98',
        subtitle: 'Шутер/RPG в открытом мире — Затон',
        developer: 'GSC Game World (1999) / Win 98 Edition',
        price: 36.99,
        priceDisplay: '$36.99',
        icon: 'cop98',
        setupExe: 'Setup_CoP98.exe',
        targetExe: 'ZATON.EXE',
        folder: 'CoP98',
        fileSize: '9.8 MB (Software Renderer Edition)',
        desc: 'Майор СБУ Дегтярёв под видом сталкера ищет причины гибели вертолётов операции «Фарватер». Открытый Затон по карте оригинала: сухогруз «Скадовск», «Шевченко», Лесопилка, ВНЗ «Круг», Изумрудное, Портовые краны, Лесничество, мост Преображенского, Станция переработки, Цеха подстанции, Железный лес, Земснаряд и Южное плато, куда ведёт только телепорт. Аномалии, артефакты и детекторы, выбросы и укрытия, радиация и голод, торговля, апгрейды у техника, тайники, сталкеры и мутанты со своей жизнью. Четыре способа добыть самописец и эпилог по вашим решениям.',
        genre: 'Шутер с элементами RPG',
        tags: ['Открытый мир', 'Зона отчуждения', 'Мутанты', 'Аномалии'],
        shots: ['Электра в Железном лесу, Затон', 'Земснаряд в сумерках'],
        launch: () => window.appCop98 && window.appCop98.open()
      },
      mc98_demo: {
        id: 'mc98_demo',
        cdDemo: true,
        title: 'Minecraft 98 Demo',
        subtitle: 'Песочница выживания в мире из блоков',
        developer: 'Mojang Specifications (1999) / Win 98 Edition',
        price: 0,
        priceDisplay: 'DEMO',
        icon: 'mc98',
        setupExe: 'mc98demo.exe',
        targetExe: 'MINECRAFT.EXE',
        folder: 'MC98',
        fileSize: '2.1 MB (Igromania CD Edition)',
        desc: 'Бесконечный мир из кубов: копайте, стройте, выживайте. Биомы, пещеры и руды, крафт на верстаке, печь, сундуки, факелы и освещение по блокам, вода и лава, смена дня и ночи. Днём свиньи, коровы, овцы и куры, ночью зомби, скелеты, пауки и криперы. Режимы выживания и творчества, кровать, лук, динамит, достижения и автосохранение миров.',
        genre: 'Песочница',
        tags: ['Выживание', 'Строительство', 'Крафт', 'Творческий режим'],
        shots: ['Холмы, деревья и животные', 'Вечер: зомби и крипер'],
        launch: () => window.appMc98 && window.appMc98.open()
      },
      hsr98: {
        id: 'hsr98',
        steam: true,
        title: 'Honkai: Star Rail 98',
        subtitle: 'Пошаговая JRPG — издание «Ярило-VI»',
        developer: 'miHoYo Shanghai (1999) / Win 98 Edition',
        price: 0,
        priceDisplay: 'FREE',
        icon: 'hsr98',
        setupExe: 'Setup_StarRail98.exe',
        targetExe: 'STARRAIL.EXE',
        folder: 'StarRail98',
        fileSize: '3.3 MB (полная версия 1.7, установка 4,1 МБ)',
        desc: 'Бесплатная игра, её можно загрузить и с официального сайта hsr.hoyoverse.com. Первопроходец просыпается на станции «Герта» со Стеллароном в груди и отправляется на Звёздном экспрессе на ледяную Ярило-VI. Пошаговые бои по шкале хода, общие очки навыка, абсолютные техники вне очереди, пробитие уязвимостей стихий. Контакт с врагами, совместные Слияния и Слухи, которые становятся правдой. Звёздный прыжок, световые конусы, реликвии, Симулятор и Эхо войны. Белобог, Подземье, Большая шахта, Заклёпкоград и финальная битва с Коколией.',
        genre: 'JRPG',
        tags: ['Пошаговые бои', 'Космос', 'Отряд героев', 'Сюжет'],
        shots: ['Бой на станции «Герта»', 'Административный район Белобога'],
        launch: () => window.appHsr98 && window.appHsr98.open()
      },
      dao98_demo: {
        id: 'dao98_demo',
        cdDemo: true,
        title: 'Dragon Age: Origins 98 Demo',
        subtitle: 'Ролевая игра BioWare — глава «Мор»',
        developer: 'BioWare (2000) / Win 98 Edition',
        price: 0,
        priceDisplay: 'DEMO',
        icon: 'dao98',
        setupExe: 'dao98demo.exe',
        targetExe: 'DAORIGINS.EXE',
        folder: 'DAO98',
        fileSize: '48.2 MB (Igromania CD Edition)',
        desc: 'Мор возвращается в Ферелден. Выберите одну из шести предысторий: человек-дворянин из Хайевера, маг Круга на Истязании, городской эльф в день свадьбы, долийский охотник у древнего зеркала, гном-аристократ из дома Эдукан или безкастовый из Пыльного города. Бои в реальном времени с паузой, тактика спутников, магия и таланты, травмы, одобрение Алистера и Морриган. Остагар, дебри Коркари, Посвящение, башня Ишала и хижина Флемет — до Лотеринга, где к отряду присоединяются Лелиана и Стэн.',
        genre: 'Ролевая игра',
        tags: ['Тёмное фэнтези', 'Тактическая пауза', 'Шесть предысторий', 'Спутники'],
        shots: ['Хижина Флемет в дебрях Коркари', 'Бой с генлоками у башни Ишала'],
        launch: () => window.appDao98 && window.appDao98.open()
      },
      dmc98_demo: {
        id: 'dmc98_demo',
        cdDemo: true,
        title: 'Devil May Cry 98 Demo',
        subtitle: 'Стильный слэшер — Неро против демонов Фортуны',
        developer: 'Capcom (2000) / Win 98 Edition',
        price: 0,
        priceDisplay: 'DEMO',
        icon: 'dmc98',
        setupExe: 'dmc98demo.exe',
        targetExe: 'DMC4.EXE',
        folder: 'DMC98',
        fileSize: '41.7 MB (Igromania CD Edition)',
        desc: 'Остров Фортуна, Орден Меча и таинственный убийца в красном плаще. Неро с мечом «Красная королева», револьвером «Синяя роза» и демонической рукой Devil Bringer. Комбо, Exceed, Buster и Snatch, оценка стиля от Deadly до Smokin\' Sick Style, красные сферы и гордые души у Статуи божества. Пять миссий из оригинала: дуэль с Данте в Опере, Бериал в огненной шахте, ледяной Баэль, лаборатория Агнуса и пробуждение Devil Trigger, битва с Кредо на мосту. Катсцены на движке игры.',
        genre: 'Слэшер',
        tags: ['Комбо', 'Боссы', 'Демоны', 'Оценка стиля'],
        shots: ['Опера: Неро против Данте', 'Библиотека замка: Фросты'],
        launch: () => window.appDmc98 && window.appDmc98.open()
      },
      tekken98_demo: {
        id: 'tekken98_demo',
        cdDemo: true,
        title: 'Tekken 98 Demo',
        subtitle: 'Трёхмерный файтинг — турнир концерна «Курогане»',
        developer: 'Namco (1998) / Win 98 Edition',
        price: 0,
        priceDisplay: 'DEMO',
        icon: 'tekken3',
        setupExe: 'tekken98demo.exe',
        targetExe: 'TEKKEN3.EXE',
        folder: 'Tekken3',
        fileSize: '36.3 MB (Igromania CD Edition)',
        desc: 'Трёхмерный файтинг на четыре кнопки: левая и правая рука, левая и правая нога. Шестнадцать бойцов со своими стилями — кёкусин-карате, капоэйра, самбо, тхэквондо, муай-тай, вин-чун, ниндзя с мечом, пьяный кулак, цирковой медведь, советский робот и деревянный манекен, который копирует чужие стили. Уходы в сторону, подбросы и джагглы, броски и цепные захваты, контрудары, подъёмы с пола и десятиударные связки. Аркада с главой турнира и древним Колоссом, бой вдвоём, командный бой, выживание, игра на время, тренировка с разучиванием приёмов, штурм небоскрёба «Курогане» и пляжный мяч. Скрытые бойцы, концовки в кинозале и рекорды.',
        genre: 'Файтинг',
        tags: ['3D', '16 бойцов', 'Аркада', 'Бой вдвоём'],
        shots: ['Кэнта против Ирины, Сеул', 'Рэй против Волкова, храм'],
        launch: () => window.appTekken3 && window.appTekken3.open()
      },
      ow98: {
        id: 'ow98',
        steam: true,
        title: 'Overwatch 98',
        subtitle: 'Командный шутер про героев — 6 на 6',
        developer: 'Blizzard Entertainment (2000) / Win 98 Edition',
        price: 38.99,
        priceDisplay: '$38.99',
        icon: 'ow98',
        setupExe: 'Setup_Overwatch98.exe',
        targetExe: 'OVERWATCH.EXE',
        folder: 'Overwatch',
        fileSize: '1.1 GB (2 CD-ROM, 3D Accelerated)',
        desc: 'Мир снова нуждается в героях. Командный шутер 6 на 6 с двенадцатью героями: МакКри, Солдат-76 и Трейсер в атаке; Крысавчик, Торбьорн и Роковая вдова в защите; танки Райнхардт, Турбосвин и Уинстон; поддержка Лусио, Ангел и Дзенъятта. Восемь карт и четыре режима: захват точек на Ханамуре и в «Волской Индастриз», сопровождение груза в Дорадо и на Гибралтаре, гибрид в Голливуде и на Кингс Роу, контроль в Илиосе и Лицзянской башне. Боты трёх уровней, быстрая и рейтинговая игра, свои матчи, тренировочный полигон и обучение. Лучший момент матча, медали, уровни, лутбоксы с обликами, эмоциями, граффити и репликами.',
        genre: 'Командный шутер',
        tags: ['6 на 6', 'Герои', 'Боты', 'Облики'],
        shots: ['Бой у ворот Ханамуры', 'Галерея героев: облики Трейсер'],
        launch: () => window.appOw98 && window.appOw98.open()
      },
      sammax: {
        id: 'sammax',
        steam: true,
        title: 'Sam & Max: Culture Shock',
        subtitle: 'Квест про Вольную полицию — эпизод 101',
        developer: 'LucasArts (2000) / Win 98 Edition',
        price: 21.99,
        priceDisplay: '$21.99',
        icon: 'sammax',
        setupExe: 'Setup_SamMax.exe',
        targetExe: 'SAMMAX.EXE',
        folder: 'SamMax',
        fileSize: '38 MB (1 CD-ROM, 256 цветов)',
        desc: 'Сэм, собака в костюме, и Макс, гиперактивный кролик-нечто, снова на службе Вольной полиции. Бывшие звёзды детского шоу «Сода-Попперы» разрисовывают стены, воруют сыр и захватывают кабинет психотерапевта, а за всем этим стоят гипнотические кассеты «Ай-Бо» Брэди Калчера — ребёнка-звезды, который так и не стал звездой. Классический квест в духе Sam & Max Hit the Road: рисованные вручную экраны 320×200, курсор-действие, коробка инвентаря и диалоги иконками. Крыса Джимми Два Зуба и телефон в заложниках, лавка неудобств Боско с Антивор-О-Матом, три теста доктора Сибил, погоня за фургоном на Де Сото, сон Сэма с четырьмя Брэди и антигипнотический шлем из дуршлага.',
        genre: 'Квест',
        tags: ['Point-and-click', 'Юмор', 'Детектив', 'Пиксельная графика'],
        shots: ['Офис Вольной полиции', 'Приют Брэди Калчера'],
        launch: () => window.appSamMax && window.appSamMax.open()
      },
      sammax102: {
        id: 'sammax102',
        steam: true,
        title: 'Sam & Max: Situation: Comedy',
        subtitle: 'Квест про Вольную полицию — эпизод 102',
        developer: 'LucasArts (2000) / Win 98 Edition',
        price: 23.99,
        priceDisplay: '$23.99',
        icon: 'sammax102',
        setupExe: 'Setup_SamMax102.exe',
        targetExe: 'SAMMAX2.EXE',
        folder: 'SamMax102',
        fileSize: '41 MB (1 CD-ROM, 256 цветов)',
        desc: 'Телеведущая Майра Стамп третьи сутки держит в студии своих зрителей и раздаёт им тостеры. На её диван пускают только звёзд, а у Сэма и Макса до вечера нет ни роли, ни песни, ни скандала. Классический квест в духе Sam & Max Hit the Road: рисованные экраны 320×200, курсор-действие, коробка инвентаря и диалоги иконками. Лорд Рамплботтом с накладными усами и модулятором голоса, погоня за бритыми крысами на Де Сото, пробы на роль бешеного пса, съёмки ситкома «Ковбои из центра» с коровой в абажуре, «Готовим не глядя», «Позорный идол» с кислотой и акулами под сценой, викторина Хью Блисса, где никто не выигрывает, жёлтая газета Сибил и прямой эфир «Майры!» с очень подозрительным плюшевым мишкой.',
        genre: 'Квест',
        tags: ['Point-and-click', 'Юмор', 'Телешоу', 'Пиксельная графика'],
        shots: ['Викторина на миллион', 'Съёмки ситкома'],
        launch: () => window.appSamMax102 && window.appSamMax102.open()
      },
      sammax103: {
        id: 'sammax103',
        steam: true,
        title: 'Sam & Max: The Mole, the Mob and the Meatball',
        subtitle: 'Квест про Вольную полицию, эпизод 103',
        developer: 'LucasArts (2000) / Win 98 Edition',
        price: 25.49,
        priceDisplay: '$25.49',
        icon: 'sammax103',
        setupExe: 'Setup_SamMax103.exe',
        targetExe: 'SAMMAX3.EXE',
        folder: 'SamMax103',
        fileSize: '44 MB (1 CD-ROM, 256 цветов)',
        desc: 'Комиссар отправил в Игрушечную мафию своего крота, и крот замолчал. Сэм и Макс едут в Игровой рай и казино Теда И. Бэра, где мафии, судя по вывеске, нет. Классический квест в духе Sam & Max Hit the Road: рисованные экраны 320×200, курсор-действие, коробка инвентаря и диалоги иконками. Индейский покер с шулером Леонардом, поющие крысы в автомате, жучок-ветеран из лавки анархиста Жан-Франсуа и три поручения мафии: кружка кетчупа для свидетельницы Сибил, мишка в лавке с антидоставочной системой и украденный сэндвич с фрикадельками. Погоня за розовым лимузином, фабрика гипнотических мишек и Дон, который когда-то служил в полиции.',
        genre: 'Квест',
        tags: ['Point-and-click', 'Юмор', 'Мафия', 'Пиксельная графика'],
        shots: ['Казино Теда И. Бэра', 'Игровой рай'],
        launch: () => window.appSamMax103 && window.appSamMax103.open()
      },
      sammax104: {
        id: 'sammax104',
        steam: true,
        title: 'Sam & Max: Abe Lincoln Must Die!',
        subtitle: 'Квест про Вольную полицию, эпизод 104',
        developer: 'LucasArts (2000) / Win 98 Edition',
        price: 26.49,
        priceDisplay: '$26.49',
        icon: 'sammax104',
        setupExe: 'Setup_SamMax104.exe',
        targetExe: 'SAMMAX4.EXE',
        folder: 'SamMax104',
        fileSize: '46 MB (1 CD-ROM, 256 цветов)',
        desc: 'Президент Соединённых Штатов запретил пудинг, обязал страну обниматься по четвергам и велел переписать все пистолеты. Сэм и Макс едут в Вашингтон. Классический квест в духе Sam & Max Hit the Road: рисованные экраны 320×200, курсор-действие, коробка инвентаря и диалоги иконками. Агент Суперболл на служебной линии, перевод с языка губернатора Уиззера, предвыборные дебаты с мемориалом Линкольна и его карточками, свидание для Сибил, президентский фонд на сто миллионов, сыворотка правды от товарища Босковорского, военная песня Секретной службы, прицельный компьютер и погоня за шестиметровой статуей на Де Сото. В шкафу офиса лежат улики прошлых дел: парик Брэди, Мистер Мишка и шулер Леонард.',
        genre: 'Квест',
        tags: ['Point-and-click', 'Юмор', 'Политика', 'Пиксельная графика'],
        shots: ['Дебаты у Белого дома', 'Овальный кабинет'],
        launch: () => window.appSamMax104 && window.appSamMax104.open()
      },
      sammax105: {
        id: 'sammax105',
        steam: true,
        title: 'Sam & Max: Reality 2.0',
        subtitle: 'Квест про Вольную полицию, эпизод 105',
        developer: 'LucasArts (2000) / Win 98 Edition',
        price: 28.49,
        priceDisplay: '$28.49',
        icon: 'sammax105',
        setupExe: 'Setup_SamMax105.exe',
        targetExe: 'SAMMAX5.EXE',
        folder: 'SamMax105',
        fileSize: '48 MB (1 CD-ROM, 256 цветов)',
        desc: 'Компьютеры по всей стране сошли с ума: банкоматы выдают нарисованное золото, тостеры требуют пароль, а соседи сидят в очках и не хотят их снимать. Сэм и Макс надевают очки сами. Классический квест в духе Sam & Max Hit the Road: рисованные экраны 320×200, курсор-действие, коробка инвентаря и диалоги иконками. Улица существует в двух версиях, и значок очков в углу экрана переносит Сэма из одной в другую на то же самое место. Клуб Охраны Пожилых Систем в прокате Лефти, зал управления, где жучок ломает глубину, рост и силу тяжести, пошаговый бой с грозной синей слизью и тётушкой Биотик, файрвол, который сверяет окраску машины с номером, банк с поворотными стрелками, простуда Боско за один миллиард долларов и текстовая Реальность 1.5 без единой картинки. В шкафу офиса лежат улики прошлых дел: парик Брэди, Мистер Мишка, шулер Леонард и голова президента.',
        genre: 'Квест',
        tags: ['Point-and-click', 'Юмор', 'Виртуальная реальность', 'Пиксельная графика'],
        shots: ['Улица в Реальности 2.0', 'Зал управления'],
        launch: () => window.appSamMax105 && window.appSamMax105.open()
      },
      sammax106: {
        id: 'sammax106',
        steam: true,
        title: 'Sam & Max: Bright Side of the Moon',
        subtitle: 'Квест про Вольную полицию, эпизод 106',
        developer: 'LucasArts (2000) / Win 98 Edition',
        price: 29.49,
        priceDisplay: '$29.49',
        icon: 'sammax106',
        setupExe: 'Setup_SamMax106.exe',
        targetExe: 'SAMMAX6.EXE',
        folder: 'SamMax106',
        fileSize: '50 MB (1 CD-ROM, 256 цветов)',
        desc: 'Над городом вторые сутки стоит ночная радуга, и идёт она с Луны. Сэм и Макс садятся в Де Сото и летят в Море Спокойствия, где Хью Блисс построил «Пузырь Покоя». Классический квест в духе Sam & Max Hit the Road: рисованные экраны 320×200, курсор-действие, коробка инвентаря и диалоги иконками. Плюшевый единорог вместо пропуска, талисманы гастрокинеза, свинцового зрения и гнутия ложек, лунный модуль с настоящим ключом зажигания, звонок головы Линкольна королеве Канады, «Крестики-нолики Судного дня», в которые надо проиграть, и Макс, разобранный на красную злость, зелёный голод и синюю лень. Четыре фокуса Хью Блисса в финале закрывают сезон. В шкафу офиса лежат улики прошлых дел: парик Брэди, Мистер Мишка, шулер Леонард, голова президента и очки Реальности 2.0.',
        genre: 'Квест',
        tags: ['Point-and-click', 'Юмор', 'Космос', 'Пиксельная графика'],
        shots: ['Лунный модуль и лавка сувениров', 'Фокусы Хью Блисса'],
        launch: () => window.appSamMax106 && window.appSamMax106.open()
      },
      sammax201: {
        id: 'sammax201',
        steam: true,
        title: 'Sam & Max: Ice Station Santa',
        subtitle: 'Квест про Вольную полицию, эпизод 201',
        developer: 'LucasArts (2000) / Win 98 Edition',
        price: 30.49,
        priceDisplay: '$30.49',
        icon: 'sammax201',
        setupExe: 'Setup_SamMax201.exe',
        targetExe: 'SAMMAX21.EXE',
        folder: 'SamMax201',
        fileSize: '52 MB (1 CD-ROM, 256 цветов)',
        desc: 'За неделю до Рождества на улицу приходит подарок: гигантский робот Маймтрон 9000, которому велено снести офис Сэма и Макса. На бирке у него на ноге написано «Мастерская Санты». Классический квест в духе Sam & Max Hit the Road: рисованные экраны 320×200, курсор-действие, коробка инвентаря и диалоги иконками. Ключ завода через окно офиса, Северный полюс с Сантой, который стреляет сквозь дверь, эльф-практикант, который не умеет плакать, раздатчик подарков со списком желаний, подстроенная викторина у Стинки, ринг в груди поверженного робота, гонка в дополненной реальности у К.О.П.С., песенка про доброго демона и три Рождества за тремя порталами: прошлое, настоящее и будущее. Финальный бой ведётся игрушками. В шкафу офиса лежат улики всех дел прошлого сезона, от парика Брэди до банки с Хью Блиссом.',
        genre: 'Квест',
        tags: ['Point-and-click', 'Юмор', 'Рождество', 'Пиксельная графика'],
        shots: ['Робот у нашего офиса', 'Мастерская Санты'],
        launch: () => window.appSamMax201 && window.appSamMax201.open()
      },
      sammax202_demo: {
        id: 'sammax202_demo',
        cdDemo: true,
        title: 'Sam & Max: Moai Better Blues Demo',
        subtitle: 'Квест про Вольную полицию, эпизод 202',
        developer: 'LucasArts (2000) / Win 98 Edition',
        price: 0,
        priceDisplay: 'DEMO',
        icon: 'sammax202',
        setupExe: 'sammax202demo.exe',
        targetExe: 'SAMMAX22.EXE',
        folder: 'SamMax202',
        fileSize: '31.0 MB (Igromania CD Edition)',
        desc: 'Прямо у входа в офис Вольной полиции открывается светящийся Бермудский треугольник, ведущий на остров Пасхи. Гигантские каменные головы предсказывают скорое пробуждение вулкана Беллависта, а на вершине кальдеры восседает верховный жрец: выживший карась Мистер Лопатка. Рисованные экраны 320x200, курсор-действие, коробка инвентаря и диалоги иконками. Плачущий Берни, хохочущий Билли, пророчества Мортимера, грот молодости с карапузом Джимми Двузубиком, свидание Сибил и Линкольна на пляже, защитные бункеры Боско, закусочная Вонючки, оркестр мариачи в пространственном разломе и перенаправление лавовых рек через порталы. В шкафу офиса бережно собраны вещдоки всех прошлых расследований.',
        genre: 'Квест',
        tags: ['Point-and-click', 'Юмор', 'Остров Пасхи', 'Пиксельная графика'],
        shots: ['Истуканы острова Пасхи', 'Жерло вулкана Беллависта'],
        launch: () => window.appSamMax202 && window.appSamMax202.open()
      },
      bttf: {
        id: 'bttf',
        steam: true,
        title: 'Back to the Future: The Game',
        subtitle: 'Эпизод 1. Самое время',
        developer: 'Telltale Games (2000) / Win 98 Edition',
        price: 24.79,
        priceDisplay: '$24.79',
        icon: 'bttf',
        setupExe: 'Setup_BTTF.exe',
        targetExe: 'BTTF.EXE',
        folder: 'BTTF',
        fileSize: '64 MB (1 CD-ROM, 256 цветов)',
        desc: 'Док Браун пропал полгода назад, банк распродаёт его гараж, а вечером во двор сам собой возвращается ДеЛориан: в инее, с Эйнштейном за рулём и кассетой «МАРТИ!!!». Из газет старой Эдны Стрикленд Марти узнаёт, что в 1931 году Дока держат в тюрьме под именем Карл Саган и этой ночью его убьют. Классический квест в рисованной графике 640×480: курсор-действие, карманы с вещами, разговоры с выбором реплик. Семнадцатилетний Эмметт Браун, который строит ракетный бур втайне от отца-судьи, гангстер Кид Таннен, столовая, где суп возят бочками, дед Марти в укрытии, общество трезвости, мини-игра «Топливо» под крики судьи и погоня за тюремным фургоном на ракетном велосипеде.',
        genre: 'Квест',
        tags: ['Point-and-click', 'Путешествия во времени', 'Комедия', 'Пиксельная графика'],
        shots: ['Лаборатория Дока, 1986', 'Площадь суда, 1931'],
        launch: () => window.appBTTF && window.appBTTF.open()
      },
      diablo2: {
        id: 'diablo2',
        steam: true,
        title: 'Diablo II',
        subtitle: 'Ролевой экшен Blizzard North — Акт I',
        developer: 'Blizzard North (2000) / Win 98 Edition',
        price: 47.99,
        priceDisplay: '$47.99',
        icon: 'diablo2',
        setupExe: 'Setup_Diablo2.exe',
        targetExe: 'DIABLO2.EXE',
        folder: 'Diablo2',
        fileSize: '980 MB (3 CD-ROM, 800x600, 256 цветов)',
        desc: 'Тёмный странник идёт на восток, а за ним по земле Святилища расползается зло. Семь героев на выбор — амазонка, ассасин, некромант, варвар, паладин, волшебница и друид, у каждого три ветви навыков. Лагерь разбойниц, Кровавая пустошь, Логово зла, Холодные равнины, Каменистое поле с Камнями Каирна, Тёмный лес, руины Тристрама, Забытая башня с Графиней, монастырские Казармы, Тюрьма, Собор и Катакомбы с Андариэль. Каждая игра — новые карты. Магические, редкие, комплектные и уникальные предметы, гнёзда, самоцветы, руны и рунные слова, сундук, пояс с зельями, наёмницы Кашьи, путевые точки, порталы и три уровня сложности: Норма, Кошмар и Ад. Режим «Хардкор» для самых смелых.',
        genre: 'Ролевой экшен',
        tags: ['Тёмное фэнтези', 'Семь классов', 'Добыча', 'Случайные карты'],
        shots: ['Лагерь разбойниц', 'Падшие на Кровавой пустоши'],
        launch: () => window.appDiablo2 && window.appDiablo2.open()
      },
      forza: {
        id: 'forza',
        steam: true,
        title: 'Forza Horizon: Рига',
        subtitle: 'Гоночный фестиваль в открытом мире — Рига 2000',
        developer: 'Playground Games (2000) / Win 98 Edition',
        price: 46.99,
        priceDisplay: '$46.99',
        icon: 'forza',
        setupExe: 'Setup_ForzaHorizon.exe',
        targetExe: 'FORZA.EXE',
        folder: 'ForzaHorizon',
        fileSize: '1.3 GB (3 CD-ROM, 3D Accelerated)',
        desc: 'Фестиваль Horizon приезжает в Ригу 2000 года. Открытый город без загрузок с настоящими улицами: брусчатка Старой Риги с Домом Черноголовых, Домским собором и шпилем Святого Петра, югендстиль Центра, памятник Свободы, Вантовый и Каменный мосты, телебашня и здание Латвийского телевидения на Закюсале, парк отдыха, памятник защитникам острова и садовые участки на Луцавсале, трамвайная улица до конечной в Бишумуйже, усадьба с липовой аллеей и молочный комбинат с полосатой трубой, Кипсала, порт и Саркандаугава, сосны Межапаркса, трасса Бикерниеки, заброшенный аэродром Спилве, аэропорт «Рига», шоссе А10 и Юрмала с деревянными виллами, концертным залом Дзинтари и бронзовой черепахой на пляже. На старте — Lada 2105, а в гараже со временем соберутся 33 машины: «Запорожец», «Нива», УАЗ и «Волга», Golf GTI, Audi quattro, BMW M3, Skyline GT-R, Supra, Impreza 22B, Ferrari F355, Diablo SV и McLaren F1. Шоссейные, уличные, грунтовые и кросс-кантри гонки, витрины против электрички ER2 и кукурузника Ан-2, шесть браслетов фестиваля и финал с Вилксом. Цепочки навыков, скоростные ловушки и зоны дрифта, прыжки с трамплинов, повреждения кузова и мотора: вмятины, отлетающие бамперы и капот, треснувшее лобовое стекло, разбитые фары, дым и пожар под капотом, фонари, скамейки и заборы, которые разлетаются от удара, щиты опыта и быстрого перемещения, находки в сараях, аукцион слухов, тюнинг, покраска, свой водитель за рулём — внешность, причёска и пропуск участника, бутик Horizon с одеждой, кепками, шлемами и очками, награды за браслеты и находки, перемотка времени, смена дня и ночи, погода от ясного неба до ливня, грозы с молниями и утреннего тумана, рекламные щиты и растяжки спонсоров по всему городу, киоски, рынки, парковки и дворы спальных районов, аэропорт с авиалайнерами на перроне, фестивальная площадка со сценой, шоу-румом и фейерверками и три радиостанции. Вид из кабины, с капота и от третьего лица.',
        genre: 'Гонки',
        tags: ['Открытый мир', 'Фестиваль', 'Тюнинг', 'Повреждения', 'Фоторежим'],
        shots: ['Старт гонки в Старой Риге', 'Фестиваль Horizon ночью'],
        launch: () => window.appForza && window.appForza.open()
      },
      xiii_demo: {
        id: 'xiii_demo',
        cdDemo: true,
        title: 'XIII Demo',
        subtitle: 'Шутер-комикс по мотивам графического романа',
        developer: 'Ubisoft Paris (2000) / Win 98 Edition',
        price: 0,
        priceDisplay: 'DEMO',
        icon: 'xiii',
        setupExe: 'xiiidemo.exe',
        targetExe: 'XIII.EXE',
        folder: 'XIII',
        fileSize: '45.1 MB (Igromania CD Edition)',
        desc: 'Амнезия, татуировка XIII на ключице и труп президента Шеридана в заголовках газет. Шутер-комикс: чернильные контуры, панели-врезки с крупным планом при каждом попадании в голову, звукоподражания и комиксные сцены между главами. Десять глав: пляж Брайтон-Бич, банк Уинслоу, штаб-квартира ФБР, майор Джонс, база «Эмеральд», камера генерала Кэррингтона, канатная дорога над ущельем, озеро и охотничий дом Келлоуни и тюрьма Плейн-Рок. Скрытность и тревоги, заложники, отмычки и кошка, метательные ножи, арбалет, гарпун под водой, снайперская винтовка и базука. Воспоминания открывают навыки: шестое чувство, меткость, бесшумный шаг и второе дыхание. Боссы — Ирландец и Мангуст. Найдите все документы, чтобы собрать досье на Двадцатку.',
        genre: 'Шутер от первого лица',
        tags: ['Комикс', 'Заговор', 'Стелс', 'Сюжет'],
        shots: ['Банк Уинслоу, Манхэттен', 'Озеро Келлоуни на закате'],
        launch: () => window.appXiii && window.appXiii.open()
      },
      maxpayne_demo: {
        id: 'maxpayne_demo',
        cdDemo: true,
        title: 'Max Payne Demo',
        subtitle: 'Нуарный экшен от третьего лица с замедлением времени',
        developer: 'Remedy Entertainment (2001) / Win 98 Edition',
        price: 0,
        priceDisplay: 'DEMO',
        icon: 'maxpayne',
        setupExe: 'maxpaynedemo.exe',
        targetExe: 'MAXPAYNE.EXE',
        folder: 'MaxPayne',
        fileSize: '43.8 MB (Igromania CD Edition)',
        desc: 'Нью-Йорк, самая сильная метель в истории города. Три года назад наркоманы под «Валькирией» убили семью полицейского Макса Пейна. Теперь Макс работает под прикрытием в семье Пунчинелло, и его напарника Алекса убивают у него на глазах. Экшен от третьего лица: замедление времени, прыжки с двойными «Береттами», «Ингрэмы», дробовики, коктейли Молотова и гранаты. Обучение в академии УБН, пролог и девять глав первой части: станция метро Роско-стрит, отель Лупино и его подвалы, доходный дом, квартал, где прячется Винни Гоньитти, надземка, клуб «Рагна Рок» в старой церкви и подземелье под ним. Сюжет рассказан страницами графического романа, телевизор в каждом углу знает больше, чем полиция. Четыре уровня сложности, включая «Мёртвого по прибытии» и «Нью-йоркскую минуту».',
        genre: 'Экшен от третьего лица',
        tags: ['Нуар', 'Замедление времени', 'Графический роман', 'Сюжет'],
        shots: ['Страница графического романа', 'Отель Лупино, снежная ночь'],
        launch: () => window.appMaxPayne && window.appMaxPayne.open()
      },
      gtann: {
        id: 'gtann',
        steam: true,
        title: 'Grand Theft Auto: Нижний Сити',
        subtitle: 'Криминальная экшен-игра в открытом 3D-городе — Нижний Новгород, 2000',
        developer: 'Rockstar North (2002) / Win 98 Edition',
        price: 41.99,
        priceDisplay: '$41.99',
        icon: 'gtann',
        setupExe: 'Setup_GTANN.exe',
        targetExe: 'GTANN.EXE',
        folder: 'GTANN',
        fileSize: '1.1 GB (2 CD-ROM, 3D Accelerated)',
        desc: 'Нижний Новгород, лето 2000 года. Тимофей «Тёма» Верещагин восемь лет отсидел за чужую вину и приехал с московскими деньгами купить сорок «Волг» мимо кассы. Сделка на причале у Оки обернулась засадой: деньги пропали, а Москва ждёт. Открытый трёхмерный город без загрузок: Ленинский и Автозаводский районы, проспект Ленина, Заречный бульвар, Соцгород и ДК ГАЗ, проходная и цеха Горьковского автозавода, речной порт, стадион «Торпедо», Автозаводский парк с колесом обозрения, частный сектор Молитовки и набережная Оки с видом на кремль. Десять сюжетных заданий с озвученными сценками у адвоката Кеши, полковника Корчагина и хозяина клуба «Мираж» Лёвы, контрольные точки и выбор, который изменит финал главы. 29 машин, каждая по своему прототипу, с салоном и приборами: «Копейка», «Шестёрка», «Семёрка», «Девятка», «Десятка», «Нива», «Ока», «Запорожец», «Москвичи», три «Волги», УАЗы, ГАЗель, ГАЗ-53, «воронок» ГАЗ-3307, ПАЗ, «бумер», «кабан», Audi 80, Land Cruiser, мотоциклы ИЖ и «Урал» с коляской, армейский «Урал», БТР-80 и танк Т-72Б, который можно угнать через люк. Кастет, нож, ПМ, дробовик, АК-74, СВД и гранаты Ф-1. Шесть мигалок розыска — от ППС и ДПС до ОМОНа с вертолётным десантом и армии с бронетехникой и Ми-24, перекраска, взятки, подработка в такси и милиции, заначки, уникальные трюки, четыре радиостанции, смена дня и ночи, дождь и пейджер. А ещё фотоаппарат: время замирает, камера облетает Тёму, объективы от 18 до 200 мм, плёнки «Kodak», «Свема» и видеокамера, дата на снимке, а виды района покупает газета «Автозаводец».',
        genre: 'Экшен в открытом мире',
        tags: ['Криминал', 'Угон машин', 'Миссии', 'Нижний Новгород'],
        shots: ['За рулём «Волги»', 'Колесо обозрения в парке'],
        launch: () => window.appGtaNN && window.appGtaNN.open()
      },
      legion: {
        id: 'legion',
        steam: true,
        title: 'Legion Arena',
        subtitle: 'Легионы Рима: тактическая стратегия',
        developer: 'Slitherine Software (2005) / Win 98 Edition',
        price: 18.99,
        priceDisplay: '$18.99',
        icon: 'legion',
        setupExe: 'Setup_LegionArena.exe',
        targetExe: 'ARENA.EXE',
        folder: 'LegionArena',
        fileSize: '690 MB (1 CD-ROM, 3D Accelerated)',
        desc: 'Рим еще не велик, а вы, вождь покоренного латинского племени, ведете свое войско на службе Республики. Здесь все решает план: расставьте отряды, выберите каждому строй и приказ и смотрите, как сотни воинов исполняют ваш замысел. Очков приказов в бою мало, поэтому каждое вмешательство на счету. Полная римская кампания оригинала: 68 битв в 14 эпохах, от распрей в Лации, Кориолана и черной стражи латинов через Самнитские войны, Пирра и его слонов, Канны и Заму, Македонию, кимвров и Спартака до Алезии, Фарсала и Филипп. 25 видов войск от крестьян и велитов до гастатов, триариев, преторианцев, вспомогательной конницы и боевых слонов, а против них галльские фанатики, ветераны и знать. Отряды набираются опыта, учат навыки, получают оружие, броню и знамена и носят ваши цвета. Медали, милость богов, энциклопедия и быстрые битвы на Арене.',
        genre: 'Тактическая стратегия',
        tags: ['Древний Рим', 'Кампания', 'Реальное время', 'Развитие армии'],
        shots: ['Легионеры в ближнем бою', 'Карта кампании'],
        launch: () => window.appLegion && window.appLegion.open()
      },
      homm1_demo: {
        id: 'homm1_demo',
        cdDemo: true,
        title: 'Heroes of Might and Magic 98 Demo',
        subtitle: 'Стратегический поход за корону Энрота',
        developer: 'New World Computing (1995) / Win 98 Edition',
        price: 0,
        priceDisplay: 'DEMO',
        icon: 'homm1',
        setupExe: 'homm98demo.exe',
        targetExe: 'HEROES.EXE',
        folder: 'HoMM1',
        fileSize: '28.4 MB (Igromania CD Edition)',
        desc: 'Лорд Морглин Айронфист бежал через портал в неизведанные земли Энрота, где за верховный трон спорят четыре правителя: рыцарь Айронфист, варвар Слэйер, волшебница Ламанда и чернокнижник Аламар. Полная кампания из восьми сценариев от Ворот Зари и Архипелага Древних до захвата Драконьего Острова и финального штурма крепости соперников, плюс шесть отдельных карт для свободной игры. Четыре класса замков и двадцать восемь видов существ от крестьян, кентавров и эльфов до грифонов, гидр, паладинов, циклопов, фениксов и чёрных драконов. Семь видов ресурсов, шахты, лесопилки и алхимические лаборатории, четыре этажа Магической гильдии с тридцатью тремя боевыми и походными заклинаниями, сорок артефактов, обелиски с картой клада и раскопки Истинного Артефакта, постройка кораблей на верфи, тактические битвы на поле 7 на 5 клеток и осады замков с катапультой.',
        genre: 'Пошаговая стратегия',
        tags: ['Фэнтези', 'Герои и магия', 'Замки', 'Тактический бой'],
        shots: ['Поход по долине Когтя', 'Осада замка и тактический бой'],
        launch: () => window.appHomm1 && window.appHomm1.open()
      },
      anotherwar: {
        id: 'anotherwar',
        steam: true,
        title: 'Another War',
        subtitle: 'Другая война: ролевая игра о Второй мировой',
        developer: 'Mirage Interactive (2002) / Win 98 Edition',
        price: 20.99,
        priceDisplay: '$20.99',
        icon: 'anotherwar',
        setupExe: 'Setup_AnotherWar.exe',
        targetExe: 'AW.EXE',
        folder: 'AnotherWar',
        fileSize: '600 MB (2 CD-ROM)',
        desc: 'Оккупированная Франция. Наемник приезжает в городок Аннет по просьбе старого друга Пьера Доля. Тот оценивал для немецкого генерала награбленные древности, расшифровал какую-то карту и забрал ее себе. Один разговор в кафе, удар по голове, и вот вы уже в подвалах замка, а за соседней дверью пьяный немец Иоганн, ваш будущий напарник и летописец. Три героя, Силач, Вор и Интеллектуал, по-разному открывают одни и те же двери: кулаком, отмычкой или языком. Весь первый акт: рыночная площадь, кафе Рене, лавка букиниста, кладбище и церковь с тайным ходом, катакомбы и лес, где маневрируют немецкие патрули. Бой в реальном времени по правилам с кубиками, пауза в любой момент, особые навыки, уровни, торговля, дневник Иоганна и оригинальная озвучка.',
        genre: 'Ролевая игра',
        tags: ['Вторая мировая', 'Изометрия', 'Юмор', 'Диалоги'],
        shots: ['Площадь Аннета ночью', 'Разговор с хозяином кафе'],
        launch: () => window.appAnotherWar && window.appAnotherWar.open()
      },
      fallout: {
        id: 'fallout',
        steam: true,
        title: 'Fallout',
        subtitle: 'Постъядерная ролевая игра',
        developer: 'Interplay Productions (1997)',
        price: 19.99,
        priceDisplay: '$19.99',
        icon: 'fallout',
        setupExe: 'Setup_Fallout.exe',
        targetExe: 'FALLOUTW.EXE',
        folder: 'Fallout',
        fileSize: '590 MB (1 CD-ROM)',
        desc: '2161 год. Восемьдесят четыре года назад мир сгорел в ядерной войне, а Убежище 13 с тех пор ни разу не открывало дверь. Теперь сломался водяной чип: без него очистители остановятся через 150 дней. Смотритель выбирает вас и отправляет в пустоши Южной Калифорнии искать замену. Шейди-Сэндс, Джанктаун, Хаб, Некрополь, Братство Стали, Собор Детей и база мутантов на Марипозе: у каждого места свои беды, и почти любую можно решить оружием, словом, кражей или наукой. Пошаговый бой с очками действия и прицельными выстрелами, система S.P.E.C.I.A.L., навыки, перки, карма и репутация, говорящие головы и концовка, которая подводит итог всем вашим поступкам. Версия 1.2 с роликами и музыкой: тексты, интерфейс и справка на русском или английском по языку системы, озвучка оригинальная английская; разрешение 640x480 или 800x600.',
        genre: 'Ролевая игра',
        tags: ['Постапокалипсис', 'Пошаговый бой', 'Изометрия', 'Выбор и последствия'],
        shots: ['Караваны у ворот Хаба', 'Разговор с Арадешем'],
        launch: () => window.appFallout && window.appFallout.open()
      },
      falloutzp_demo: {
        id: 'falloutzp_demo',
        cdDemo: true,
        title: 'Fallout: Запорожье Demo',
        subtitle: 'Ролевая игра в открытом мире: СССР через двести лет после войны',
        developer: 'Obsidian Entertainment (2001) / Win 98 Edition',
        price: 0,
        priceDisplay: 'DEMO',
        icon: 'falloutzp',
        setupExe: 'falloutzpdemo.exe',
        targetExe: 'FALLOUTZP.EXE',
        folder: 'FalloutZP',
        fileSize: '52.6 MB (Igromania CD Edition)',
        desc: 'Двести лет после Великой войны 23 октября 2077 года Советский Союз так и не распался: он просто сгорел вместе с ламповыми ЭВМ и атомными «Волгами». Запорожье, Вознесеновский район и остров Хортица. Фельдъегеря Главпочтамта подстрелили на мосту Преображенского, отобрали перфокарту особой важности и сбросили в Днепр. Ремонтный робот Тимофей выловил тело под Тарасовой грушей. Медкомиссия вместо создания персонажа: нормы ГТО, анкета, профориентация. Открытый мир по реальной карте района: проспект Ленина, площадь Маяковского и «Интурист», Вознесенский рынок, ЗАлК и шламохранилище, двухъярусный арочный мост, Запорожская Сечь за частоколом, музей казачества, Змиева пещера, колхоз «Заветы Ильича», пионерлагерь «Чайка», Скифский стан и плавни. Колорады, медведки, мартыны, сомы и Царь-сом, бройлеры, подсолнухи-турели, хоботы в вросших противогазах, ударники на «Стахановите» и дружинники АСУ «Плановик-77». Стрельба от первого и третьего лица и С.Т.Р.Е.Л.А. с прицеливанием по частям тела, тринадцать навыков, перки, карма, репутация у восьми фракций, талоны вместо денег, взлом замков и ЭВМ, ремесло у верстака и костра, «Очко» в «Интуристе», спутники Ярина и Тимофей, радио «Маяк-Запорожье» и режим «Выживание». Четыре пути к финалу на мосту: Комендатура, Сечь, Плановик или своя голова.',
        genre: 'Ролевая игра',
        tags: ['Постапокалипсис', 'Открытый мир', 'Выбор и последствия', 'СССР', 'Сюжет'],
        shots: ['Тарасова груша, Вознесенка', 'Мост Преображенского на закате'],
        launch: () => window.appFalloutZP && window.appFalloutZP.open()
      },
      korovany_demo: {
        id: 'korovany_demo',
        cdDemo: true,
        title: 'Корованы Demo',
        subtitle: '3Д-экшон: лесные эльфы, охрана дворца и Злой',
        developer: 'Джва Года Софт (2000) / Win 98 Edition',
        price: 0,
        priceDisplay: 'DEMO',
        icon: 'korovany',
        setupExe: 'korovanydemo.exe',
        targetExe: 'KOROVANY.EXE',
        folder: 'Korovany',
        fileSize: '39.5 MB (Igromania CD Edition)',
        desc: 'Игра по письму Кирилла, который джва года хотел такую игру. Три стороны делят одну долину: лесные эльфы в густом западном лесу, охрана дворца на северном холме и Злой в старом форте в горах. Посередине Развилки, откуда во все стороны ходят корованы, запряжённые коровами. Их можно грабить. Играйте эльфом: отбивайте набеги солдат дворца и войска Злого, жгите их припасы. Играйте стражником: стойте на посту, ловите шпионов, ходите в набеги и слушайтесь воеводу, иначе выговор. Играйте Злым: вербуйте войско, отдавайте приказы и сами ведите армию на дворец. Удар попадает туда, куда вы смотрите: можно отрубить руку, ногу или голову, выколоть глаз. Без перевязки культя истекает кровью, без глаза не видно половины экрана, без ноги придётся ползти, пересесть в коляску или поставить протез. Вдали деревья нарисованы картинкой и становятся трёхмерными, когда подходишь. Трупы остаются лежать. Лавки, торг, дом в Развилках, навыки, переходы по карте. Сохраняться можно.',
        genre: 'Экшен',
        tags: ['Корованы', 'Открытый мир', 'Три стороны', 'Отрубание конечностей', 'Протезы'],
        shots: ['Листва в густом лесу', 'Грабёж корована на тракте'],
        launch: () => window.appKorovany && window.appKorovany.open()
      },
      catniss: {
        id: 'catniss',
        steam: true,
        title: 'Catniss',
        subtitle: 'Платформер про рыжую кошку и девять жизней',
        developer: 'Kotelok Games (2000) / Win 98 Edition',
        price: 7.99,
        priceDisplay: '$7.99',
        icon: 'catniss',
        setupExe: 'Setup_Catniss.exe',
        targetExe: 'CATNISS.EXE',
        folder: 'Catniss',
        fileSize: '18 MB (1 CD-ROM)',
        desc: 'Белый фургон «ОТЛОВ» увёз котят со двора, и на первом же ухабе трое из них выпрыгнули кто где. Рыжая кошка Catniss отправляется следом: через луговой двор с курами и овцами, сиреневые горы с волками, стройку с лентами транспортёров и паром котельной, к неоновому городу, где фургон прячет последнюю клетку. Бег, прыжок, наскок и кошачьи когти на стенах. Двенадцать уровней в четырёх мирах, погоня волков, лифты и вентиляторы на крышах, бой с фургоном. Девять жизней и миски молока, монеты и двенадцать золотых рыбок в пакетах, спрятанных за треснувшими стенами. Спасённые котята становятся играбельными, а полный аквариум открывает бонусный уровень. Поддерживается геймпад.',
        genre: 'Платформер',
        tags: ['Кошки', 'Пиксельная графика', 'Секреты', 'Бой с боссом', 'Геймпад'],
        shots: ['Утро во дворе', 'Фургон «ОТЛОВ» в неоновом городе'],
        launch: () => window.appCatniss && window.appCatniss.open()
      },
      kirill98: {
        id: 'kirill98',
        steam: true,
        title: 'Kirill The Game',
        subtitle: '3Д-экшон по письму Кирилла',
        developer: 'Четыре Зоны Софт (2000) / Win 98 Edition',
        price: 24,
        priceDisplay: '$24.00',
        icon: 'kirill98',
        setupExe: 'Setup_KirillTheGame.exe',
        targetExe: 'KIRILL98.EXE',
        folder: 'KirillTheGame',
        fileSize: '420 MB (1 CD-ROM, 3D Accelerated)',
        desc: '«Здраствуйте. Я, Кирилл». Игра по письму Кирилла, который джва года хотел такую игру. Долину Студёной делят четыре зоны: в густом лесу живут эльфы, на Белом холме стоит дворец императора, в горах старый форт Злого, а у моста торгует Мостовица, которая ни за кого не воюет. По дорогам ходят корованы с бубенцами. Эльф устраивает засады, собирает травы и тушит горящие срубы. Стражник стоит на посту, ловит шпионов по поддельным печатям и ходит в набеги строем. Злой сам рассылает отряды, делит добычу и ведёт войско на штурм дворца. Каждый удар куда-то попадает: в руку, в ногу, в глаз. С потерями играют дальше: на костыле, в коляске, на протезе. Упавшего выносят свои, если они у него есть. Погода, ночь с луной, волки у дороги, трава и цветы до горизонта. Сохраняться можно.',
        genre: '3Д-экшон',
        tags: ['Три стороны', 'Корованы', 'Густой лес', 'Протезы', 'Открытый мир'],
        shots: ['Засада на корован в лесу', 'Штурм дворца войском Злого'],
        launch: () => window.appKirill98 && window.appKirill98.open()
      },
      plov: {
        id: 'plov',
        steam: true,
        title: 'Хаято, Где плов?',
        subtitle: 'Весёлый симулятор чайханы: плов, чай и самса',
        developer: 'Kishlak Soft (2000) / Win 98 Edition',
        price: 16.99,
        priceDisplay: '$16.99',
        icon: 'plov',
        setupExe: 'Setup_HayatoPlov.exe',
        targetExe: 'PLOV.EXE',
        folder: 'HayatoPlov',
        fileSize: '36 MB (1 CD-ROM)',
        desc: 'Бахтиёр-ака сорок лет варил плов в своём дворе, а теперь отдаёт казан Хаято. Рассаживайте гостей на топчаны и за столы, принимайте заказы и держите казан в работе: мясо, морковь с луком, рис, томление, и вот уже можно накладывать ляганы. Чай из самовара, компот, ачичук, самса и лепёшки из тандыра. Соседи, аксакалы, студенты, строители, семьи с детьми, туристы, бизнесмены с мобильниками, кулинарный критик и тойчи за свадебным пловом. Десять дней от открытия до трёх свадеб в махалле, чаевые, серии, звёзды мастера и базар с улучшениями: ичиги, пчак, большой казан, саксауловые дрова и вывеска с лампочками.',
        genre: 'Симулятор',
        tags: ['Тайм-менеджмент', 'Кулинария', 'Юмор', 'Улучшения'],
        shots: ['День 3: плов и чай', 'День 8: деловые люди'],
        launch: () => window.appPlov && window.appPlov.open()
      },
      sims3_demo: {
        id: 'sims3_demo',
        cdDemo: true,
        title: 'The Sims 3 Demo',
        subtitle: 'Симулятор жизни в открытом городе, издание 2000 года',
        developer: 'Maxis (2000) / Win 98 Edition',
        price: 0,
        priceDisplay: 'DEMO',
        icon: 'sims3',
        setupExe: 'sims3demo.exe',
        targetExe: 'SIMS3.EXE',
        folder: 'Sims3',
        fileSize: '612 MB (Igromania CD Edition)',
        desc: 'Сансет Вэлли живёт без загрузочных экранов: соседи ходят на работу, влюбляются, стареют и заводят детей, пока ваша семья строит свою жизнь. Создайте симов в редакторе: внешность, одежда на пять случаев, пять черт характера из пятидесяти шести и мечта всей жизни. Желания и обещания, настроение из мудлетов, очки счастья и награды за них. Десять навыков, одиннадцать карьер с развилками, подработки, школа и домашние задания. Режимы покупки и строительства: стены, комнаты, двери, окна, обои, полы и восемьдесят три предмета с выбором цвета. Кулинария, рыбалка, огород, картины и романы, свадьбы и дети, пожары, грабители, призраки и Мрачный Жнец. Десять семей города, от богачей Ландграабов до загадочных Готов. Графика в духе The Sims 1: изометрия, четыре поворота камеры и стены в разрезе.',
        genre: 'Симулятор жизни',
        tags: ['Открытый город', 'Строительство', 'Редактор симов', 'Карьера'],
        shots: ['Дом семьи Гот', 'Создание семьи'],
        launch: () => window.appSims3 && window.appSims3.open()
      },
      kotor98_demo: {
        id: 'kotor98_demo',
        cdDemo: true,
        title: 'Star Wars: Knights of the Old Republic 98 Demo',
        subtitle: 'Ролевая игра BioWare — глава «Тарис»',
        developer: 'BioWare / LucasArts (1999) / Win 98 Edition',
        price: 0,
        priceDisplay: 'DEMO',
        icon: 'kotor98',
        setupExe: 'kotor98demo.exe',
        targetExe: 'KOTOR.EXE',
        folder: 'KOTOR98',
        fileSize: '47.3 MB (Igromania CD Edition)',
        desc: 'За 4000 лет до Империи флот ситхов сбивает «Шпиль Эндара» над городом-планетой Тарис. Создайте Солдата, Разведчика или Негодяя и найдите джедая Бастилу Шан. Бои в реальном времени с паузой по правилам d20: раунды, броски атаки, боевые умения, гранаты и Сила. Карт, Миссия, Заалбар, Бастила, Т3-М4 и Кандерус. Верхний и Нижний город, Подгород, канализация с ранкором, базы вулкаров и ситхов, гонки на свупах, пазаак, дуэльный ринг, выбор Светлой и Тёмной стороны — до побега на «Эбеновом ястребе».',
        genre: 'Ролевая игра',
        tags: ['Звёздные войны', 'Тактическая пауза', 'Правила d20', 'Спутники'],
        shots: ['Кантина Верхнего города', 'Бой на базе «Чёрных вулкаров»'],
        launch: () => window.appKotor98 && window.appKotor98.open()
      },
      hl2_demo: {
        id: 'hl2_demo',
        cdDemo: true,
        title: 'Half-Life 2 Demo',
        subtitle: 'Шутер от первого лица — издание 2000 года',
        developer: 'Valve Software (2000) / Win 98 Edition',
        price: 0,
        priceDisplay: 'DEMO',
        icon: 'hl2',
        setupExe: 'hl2demo.exe',
        targetExe: 'HL2.EXE',
        folder: 'HL2',
        fileSize: '49.0 MB (Igromania CD Edition)',
        desc: 'Доктор Гордон Фримен просыпается в оккупированном Сити 17. Четырнадцать глав одним непрерывным путём: вокзал и облава, лаборатория Кляйнера, каналы, аэролодка против вертолёта-охотника, Восточная Чёрная Меза, ночной Рейвенхолм с отцом Григорием, багги на Шоссе 17, песчаные ловушки и феропод, Нова Проспект, восстание, страйдеры и Цитадель. Гравипушка, физика предметов, отряд повстанцев, Аликс, Барни и Пёс. Программный и OpenGL-рендер, 16-битный цвет, тайники повстанцев.',
        genre: 'Шутер от первого лица',
        tags: ['Научная фантастика', 'Физика', 'Транспорт', 'Сюжет'],
        shots: ['Шоссе 17: багги на побережье', 'Сити 17: отряд повстанцев'],
        launch: () => window.appHl2 && window.appHl2.open()
      },
      quake3: {
        id: 'quake3',
        steam: true,
        title: 'Quake III Arena',
        subtitle: 'Арена Вечности — дезматч от id Software',
        developer: 'id Software (1999) / Win 98 Edition',
        price: 44.99,
        priceDisplay: '$44.99',
        icon: 'quake3',
        setupExe: 'Setup_Quake3.exe',
        targetExe: 'QUAKE3.EXE',
        folder: 'Quake3',
        fileSize: '480 MB (1 CD-ROM, OpenGL, 3D Accelerated)',
        desc: 'Вадригары собрали лучших бойцов всех времён на Арене Вечности. Одиночная кампания по тирам: Tier 1 «Trainee» — Arena Gate, House of Pain, Arena of Death и дуэль с Сарджем на Power Station 0218; Tier 2 «Skilled» — The Place of Many Deaths, The Forgotten Place, The Camping Grounds и дуэль с Хантер на The Proving Grounds. Все девять стволов: перчатка, пулемёт, дробовик, гранатомёт, ракетница, молниемёт, рельса, плазмаган и BFG10K. Quad Damage, Regeneration, Haste, мегаздоровье, броня, прыжковые площадки, телепорты, распрыжка и рокет-джампы. Боты с характером на пяти уровнях сложности от «I Can Win» до «Nightmare!», FFA, турнир и командный дезматч, моды InstaGib и Rocket Arena, демо-записи, ролики и консоль.',
        genre: 'Шутер от первого лица',
        tags: ['Арена', 'Дезматч', 'Боты', 'Быстрый темп'],
        shots: ['Дуэль на ракетницах', 'Ракетный залп на арене'],
        launch: () => window.appQuake3 && window.appQuake3.open()
      },
      gta90: {
        id: 'gta90',
        steam: true,
        title: "Grand Theft Auto: Екатеринбург '90",
        subtitle: 'Криминальная экшен-игра — Свердловск, 1990',
        developer: 'DMA Design (1997) / Win 98 Edition',
        price: 22.99,
        priceDisplay: '$22.99',
        icon: 'gta90',
        setupExe: 'Setup_GTA90.exe',
        targetExe: 'GTA90.EXE',
        folder: 'GTA90',
        fileSize: '48 MB (1 CD-ROM)',
        desc: 'Свердловск, осень 1990 года: закрытый город, талоны, кооперативы и чёрные «Волги». Центр города в натуральную величину по планам тех лет: Плотинка и Городской пруд, проспект Ленина с трамваями, Дом Советов, Оперный театр, цирк, недостроенная телебашня, Центральный рынок и дворы с хоккейными коробками. Угоняйте «Жигули», «Москвичи» и «Волги», отвечайте на звонки таксофонов и выполняйте заказы Валеры Плотинки, Гоши Цирка и Директора. Милиция, ГАИ, ОМОН и КГБ, покраска, мастерская бомб, утильсырьё и контейнеры на экспорт. Три главы — до 23 сентября 1991 года, когда городу вернут имя Екатеринбург.',
        genre: 'Экшен с видом сверху',
        tags: ['Открытый город', 'Реальный город', 'Угон машин', 'Криминал', 'Миссии'],
        shots: ['На «Волге» по проспекту Ленина', 'Погоня на улице Малышева'],
        launch: () => window.appGta90 && window.appGta90.open()
      },
      dota: {
        id: 'dota',
        steam: true,
        title: 'Dota 98',
        subtitle: 'Defense of the Ancients — Силы Света против Сил Тьмы',
        developer: 'Valve & IceFrog (1999) / Win 98 Edition',
        price: 11.99,
        priceDisplay: '$11.99',
        icon: 'dota',
        setupExe: 'Setup_Dota.exe',
        targetExe: 'DOTA.EXE',
        folder: 'Dota',
        fileSize: '11.4 MB (Pre-rendered Edition)',
        desc: 'Изометрическая стратегия 5 на 5: три линии, лес с нейтралами, Рошан и Аегис, руны, курьеры и тайная лавка. Десять героев — Течис (обновление «The Techies Update»), Энигма, Свен, Кристал Мейден, Снайпер, Акс, Лина, Джаггернаут, Пудж и Лион, — таланты, почти сотня предметов и боты четырёх уровней сложности.',
        genre: 'Командная стратегия',
        tags: ['5 на 5', 'Боты', 'Герои', 'Изометрия'],
        shots: ['Стычка на линии у реки', 'Бой под вражеской башней'],
        launch: () => window.appDota && window.appDota.open()
      },
      steam: {
        id: 'steam',
        isApp: true,
        title: 'Steam',
        subtitle: 'Клиент цифровой доставки игр от Valve',
        developer: 'Valve Software (2000)',
        price: 0,
        priceDisplay: 'FREEWARE',
        icon: 'steam',
        setupExe: 'SteamInstall.exe',
        targetExe: 'STEAM.EXE',
        folder: 'Steam',
        fileSize: '1.3 MB (SteamInstall)',
        downloadUrl: 'http://www.steampowered.com',
        desc: 'Покупайте, загружайте и запускайте игры прямо из одного окна. Автоматические обновления, друзья, серверы и монитор сети.',
        launch: () => window.appSteam && window.appSteam.open()
      },
      avp: {
        id: 'avp',
        isApp: true,
        title: 'Антивирус Касперского AVP',
        subtitle: 'Комплексная антивирусная защита для Win 98',
        developer: 'Лаборатория Касперского (1998)',
        price: 24.99,
        priceDisplay: '$24.99',
        icon: 'avp',
        setupExe: 'Setup_AVP.exe',
        targetExe: 'AVP.EXE',
        folder: 'AVP',
        fileSize: '6.2 MB (Full Security Suite)',
        downloadUrl: 'http://www.avp.ru',
        desc: 'Профессиональный антивирусный комплекс Касперского (AntiViral Toolkit Pro)! Сканирование оперативной памяти, загрузочных секторов, дисков C: и D:, эвристический анализ и фирменный визг при обнаружении вирусов.',
        launch: () => window.appAVP && window.appAVP.open()
      },
      esheep: {
        id: 'esheep',
        isApp: true,
        title: 'eSheep 98 (Sheep.exe)',
        subtitle: 'Экранный питомец овечка По (Stray Sheep)',
        developer: 'Fuji Television / Tatsutoshi Nomura (1995)',
        price: 0,
        priceDisplay: 'FREEWARE',
        icon: 'esheep',
        setupExe: 'Setup_eSheep.exe',
        targetExe: 'SHEEP.EXE',
        folder: 'eSheep',
        fileSize: '340 KB (Freeware)',
        downloadUrl: 'http://www.softstore98.com',
        desc: 'Знаменитая настольная овечка По (Stray Sheep / Sheep.exe)! Падает с неба на панель задач и заголовки открытых окон, гуляет, прыгает, спит в четырёх позах, щиплет ромашки, чихает, карабкается по краям экрана, встречает чёрную овечку, падает горящим метеором в ванну и похищается летающей тарелкой НЛО.',
        launch: () => window.appESheep && window.appESheep.open()
      }
    };

    this.demoRenames = {
      homm1: 'homm1_demo', sammax202: 'sammax202_demo', 'neon-racer': 'neon-racer_demo', 'half-life': 'half-life_demo',
      hl2: 'hl2_demo', kotor98: 'kotor98_demo', maxpayne: 'maxpayne_demo', xiii: 'xiii_demo', falloutzp: 'falloutzp_demo',
      fallout2: 'fallout98_demo', tekken3: 'tekken98_demo', dmc98: 'dmc98_demo', dao98: 'dao98_demo', mc98: 'mc98_demo',
      stalker98: 'stalker98_demo', korovany: 'korovany_demo', quest: 'quest_demo', moh98: 'moh98_demo', sims3: 'sims3_demo'
    };

    this.state = this.loadState();
    this.listeners = [];
    this.renameDemoAppsInVfs();
    if (window.vfs && window.vfs.ensureIntegrity) {
      window.vfs.ensureIntegrity();
    }
    this.removeSteamInstallersFromDownloads();
  }

  loadState() {
    try {
      const raw = localStorage.getItem(this.storageKey);
      const parsed = raw ? JSON.parse(raw) : null;
      if (parsed && Array.isArray(parsed.installed)) {
        for (const key of ['purchased', 'downloaded']) {
          if (!Array.isArray(parsed[key])) parsed[key] = [];
        }
        for (const id of ['minesweeper', 'winamp']) {
          if (!parsed.installed.includes(id)) parsed.installed.push(id);
        }
        if (!parsed.steamMigrated) this.moveGamesToSteam(parsed);
        this.renameDemoIds(parsed);
        return parsed;
      }
    } catch (e) {
      console.warn('Failed to load game state', e);
    }
    return {
      purchased: ['winamp'],
      downloaded: ['winamp'],
      installed: ['minesweeper', 'winamp'],
      steamMigrated: true
    };
  }

  moveGamesToSteam(state) {
    const steamIds = this.getSteamGameIds();
    const preGrantedLicenses = ['fallout2', 'diablo', 'doom', 'serioussam', 'stalker98', 'lol', 'dota', 'avatar98', 'moh98', 'cop98', 'mc98', 'hsr98', 'kotor98', 'dao98', 'gta90'];
    state.installed = state.installed.filter(id => !steamIds.includes(id));
    state.downloaded = state.downloaded.filter(id => !steamIds.includes(id));
    state.purchased = state.purchased.filter(id => !steamIds.includes(id) || !preGrantedLicenses.includes(id));
    Object.keys(state).filter(key => key.endsWith('Granted')).forEach(key => delete state[key]);
    state.steamMigrated = true;
  }

  renameDemoIds(state) {
    for (const key of ['purchased', 'downloaded', 'installed']) {
      const ids = state[key].map(id => this.demoRenames[id] || id);
      state[key] = ids.filter((id, i) => ids.indexOf(id) === i);
    }
  }

  renameDemoAppsInVfs() {
    if (!window.vfs || !window.vfs.resolvePath) return;
    const games = window.vfs.resolvePath(['My Computer', 'C:', 'Games']);
    if (!games) return;
    let changed = false;
    const walk = node => {
      if (node.app && this.demoRenames[node.app]) {
        node.app = this.demoRenames[node.app];
        changed = true;
      }
      Object.values(node.children || {}).forEach(walk);
    };
    walk(games);
    if (changed) window.vfs.saveToStorage();
  }

  isCdDemo(id) {
    return !!(this.catalog[id] && this.catalog[id].cdDemo);
  }

  getCdDemoIds() {
    return Object.keys(this.catalog).filter(id => this.catalog[id].cdDemo);
  }

  showOnCd(id) {
    const game = this.catalog[id];
    if (!game) return false;
    const isRu = !window.i18n || window.i18n.getLanguage() !== 'en';
    const cd = window.vfs && window.vfs.cdRomState;
    const igromaniaInserted = !!(cd && cd.inserted && cd.discId === 'igromania_09_1998');
    const path = `D:\\demo\\${game.setupExe}`;
    const message = isRu
      ? `Игра ${game.title} не установлена.<br>Демоверсия есть на компакт-диске журнала «Игромания» (${path}).${igromaniaInserted ? '' : '<br>Вставьте диск в привод D:.'}`
      : `${game.title} is not installed.<br>The demo is on the Igromania magazine CD (${path}).${igromaniaInserted ? '' : '<br>Insert the disc into drive D:.'}`;
    const buttons = igromaniaInserted && window.appIgroman
      ? [{ text: isRu ? 'Открыть диск' : 'Open disc', isDefault: true, action: () => window.appIgroman.openGame(id) }, { text: 'Cancel' }]
      : [{ text: 'OK', isDefault: true }];
    window.winManager.openDialog({ title: game.title, icon: 'info', message, buttons });
    return false;
  }

  getSteamGameIds() {
    return Object.keys(this.catalog).filter(id => this.catalog[id].steam);
  }

  isSteamGame(id) {
    return !!(this.catalog[id] && this.catalog[id].steam);
  }

  ownsOnSteam(id) {
    return this.isSteamGame(id) && this.state.purchased.includes(id);
  }

  removeSteamInstallersFromDownloads() {
    if (!window.vfs || !window.vfs.resolvePath) return;
    const dlFolder = window.vfs.resolvePath(['My Computer', 'C:', 'My Documents', 'Downloads']);
    if (!dlFolder || !dlFolder.children) return;
    let changed = false;
    for (const id of this.getSteamGameIds()) {
      const exe = this.catalog[id].setupExe;
      if (dlFolder.children[exe]) {
        delete dlFolder.children[exe];
        changed = true;
      }
    }
    if (changed) window.vfs.saveToStorage();
  }

  showInSteam(id) {
    if (this.isInstalled('steam') && window.appSteam) {
      window.appSteam.open();
      if (id && this.isSteamGame(id)) window.appSteam.openGames(id);
    } else if (window.appIE) {
      window.appIE.open('http://www.steampowered.com');
    }
    return false;
  }

  uninstallGame(id) {
    const game = this.catalog[id];
    if (!game || !this.state.installed.includes(id)) return;
    if (id === 'esheep' && window.appESheep) {
      window.appESheep.stop();
    }
    this.state.installed = this.state.installed.filter(x => x !== id);
    if (window.vfs && window.vfs.resolvePath) {
      const base = game.isApp ? ['My Computer', 'C:', 'Program Files'] : ['My Computer', 'C:', 'Games'];
      const folder = window.vfs.resolvePath(base);
      if (folder && folder.children) {
        delete folder.children[game.folder || game.targetExe];
        window.vfs.saveToStorage();
      }
    }
    this.saveState();
    if (window.desktop) window.desktop.renderIcons();
    if (window.taskbar) window.taskbar.renderStartMenuContent();
  }

  saveState() {
    try {
      localStorage.setItem(this.storageKey, JSON.stringify(this.state));
    } catch (e) {
      console.warn('Failed to save game state', e);
    }
    this.notifyListeners();
  }

  addListener(fn) {
    this.listeners.push(fn);
  }

  notifyListeners() {
    this.listeners.forEach(fn => {
      try { fn(this.state); } catch (e) { console.error(e); }
    });
  }

  isPurchased(id) {
    if (this.catalog[id] && (this.catalog[id].price === 0 || this.catalog[id].priceDisplay === 'FREEWARE')) {
      return true;
    }
    return this.state.purchased.includes(id);
  }

  isDownloaded(id) {
    return this.state.downloaded.includes(id);
  }

  isInstalled(id) {
    return this.state.installed.includes(id);
  }

  purchaseGame(id, cardDetails) {
    if (!this.state.purchased.includes(id)) {
      this.state.purchased.push(id);
      this.saveState();
    }
    return true;
  }

  startDownload(id) {
    const game = this.catalog[id];
    if (!game) return;

    const fromUrl = game.downloadUrl || 'http://www.softstore98.com';
    const winId = `download_${id}_${Date.now()}`;
    const win = window.winManager.createWindow({
      id: winId,
      title: `Saving: ${game.setupExe}`,
      icon: 'internet-explorer',
      width: 420,
      height: 250,
      resizable: false,
      content: `
        <div style="padding:14px; font-family:var(--win-font); display:flex; flex-direction:column; gap:10px; height:100%; box-sizing:border-box; justify-content:space-between;">
          <div style="display:flex; gap:12px; align-items:center;">
            <div style="font-size:32px;">&#128190;</div>
            <div style="flex:1; font-size:12px; line-height:1.4;">
              <div><strong>Downloading:</strong> ${game.setupExe}</div>
              <div style="color:#555;">From: ${fromUrl}</div>
              <div style="color:#555;">Save to: C:\\My Documents\\Downloads (${game.fileSize})</div>
            </div>
          </div>

          <div>
            <div style="display:flex; justify-content:space-between; font-size:11px; margin-bottom:4px;">
              <span id="${winId}_status">Connecting via 56K modem...</span>
              <span id="${winId}_percent">0%</span>
            </div>
            <div style="height:18px; border:2px inset #808080; background:#fff; position:relative; overflow:hidden;">
              <div id="${winId}_bar" style="height:100%; width:0%; background:#000080; transition:width 0.2s linear;"></div>
            </div>
            <div id="${winId}_speed" style="font-size:11px; color:#555; margin-top:4px;">Estimated time left: 3 sec (5.4 KB/sec)</div>
          </div>

          <div style="display:flex; justify-content:flex-end; gap:8px; border-top:1px solid #c0c0c0; padding-top:8px;">
            <button class="win-btn" id="${winId}_btn_run" disabled style="min-width:110px; font-weight:bold;">Run Installer</button>
            <button class="win-btn" id="${winId}_btn_cancel" style="min-width:80px;">Cancel</button>
          </div>
        </div>
      `
    });

    const el = win.element;
    const bar = el.querySelector(`#${winId}_bar`);
    const status = el.querySelector(`#${winId}_status`);
    const percent = el.querySelector(`#${winId}_percent`);
    const speed = el.querySelector(`#${winId}_speed`);
    const btnRun = el.querySelector(`#${winId}_btn_run`);
    const btnCancel = el.querySelector(`#${winId}_btn_cancel`);

    let progress = 0;
    let isCancelled = false;

    btnCancel.addEventListener('click', () => {
      isCancelled = true;
      window.winManager.closeWindow(winId);
    });

    btnRun.addEventListener('click', () => {
      window.winManager.closeWindow(winId);
      this.openSetupWizard(id);
    });

    const interval = setInterval(() => {
      if (isCancelled) {
        clearInterval(interval);
        return;
      }

      progress += Math.floor(Math.random() * 14) + 10;
      if (progress > 100) progress = 100;

      bar.style.width = `${progress}%`;
      percent.textContent = `${progress}%`;

      if (progress < 40) {
        status.textContent = `Receiving packets from server...`;
        speed.textContent = `Estimated time left: 2 sec (5.6 KB/sec)`;
      } else if (progress < 90) {
        status.textContent = `Writing ${game.setupExe} to Downloads...`;
        speed.textContent = `Estimated time left: 1 sec (6.1 KB/sec)`;
      } else if (progress >= 100) {
        clearInterval(interval);
        status.textContent = `Download complete! Saved to C:\\My Documents\\Downloads.`;
        speed.textContent = `Transfer rate: 5.8 KB/sec (100% finished)`;
        btnRun.disabled = false;
        btnCancel.textContent = 'Close';

        if (!this.state.downloaded.includes(id)) {
          this.state.downloaded.push(id);
          this.saveState();
        }

        if (window.vfs) {
          let dlFolder = window.vfs.resolvePath(['My Computer', 'C:', 'My Documents', 'Downloads']);
          if (!dlFolder) {
            const docFolder = window.vfs.resolvePath(['My Computer', 'C:', 'My Documents']);
            if (docFolder && docFolder.children) {
              docFolder.children['Downloads'] = {
                type: 'folder',
                name: 'Downloads',
                icon: 'folder-downloads',
                children: {}
              };
              dlFolder = docFolder.children['Downloads'];
            }
          }
          if (dlFolder && dlFolder.children) {
            dlFolder.children[game.setupExe] = {
              type: 'executable',
              name: game.setupExe,
              icon: 'setup-installer',
              app: 'setup',
              gameId: id
            };
            window.vfs.saveToStorage();
          }

          const expWin = window.winManager && window.winManager.windows && window.winManager.windows.get('explorer');
          if (expWin && window.appExplorer) {
            window.appExplorer.renderFolder(expWin);
          }
        }

        if (window.desktop) {
          window.desktop.renderIcons();
        }

        if (window.soundSys) {
          window.soundSys.playDing();
        }
      }
    }, 250);
  }

  openSetupWizard(id) {
    const game = this.catalog[id];
    if (!game) return;
    if (game.steam) {
      this.showInSteam(id);
      return;
    }

    const winId = `wizard_${id}`;
    let currentStep = 1;

    const win = window.winManager.createWindow({
      id: winId,
      title: `${game.title} Setup`,
      icon: 'setup-installer',
      width: 490,
      height: 360,
      resizable: false,
      content: `<div id="${winId}_body" style="height:100%;"></div>`
    });

    const el = win.element;
    const body = el.querySelector(`#${winId}_body`);

    const renderStep = (step) => {
      currentStep = step;
      if (step === 1) {
        body.innerHTML = `
          <div style="display:flex; height:100%; flex-direction:column; justify-content:space-between; font-family:var(--win-font);">
            <div style="display:flex; flex:1; background:#fff;">
              <div style="width:130px; background:linear-gradient(180deg, #000080 0%, #1084d0 100%); color:#fff; padding:16px 10px; display:flex; flex-direction:column; justify-content:space-between;">
                <div>
                  <div style="font-size:16px; font-weight:bold; margin-bottom:8px;">${game.title}</div>
                  <div style="font-size:10px; opacity:0.8;">Setup Wizard</div>
                </div>
                <div style="font-size:32px; text-align:center;">&#128187;</div>
                <div style="font-size:9px; opacity:0.7;">Microslop Win 98 Compatibility</div>
              </div>

              <div style="flex:1; padding:20px 16px; font-size:12px; line-height:1.5;">
                <h3 style="margin-top:0; color:#000080; font-size:14px;">Вас приветствует мастер установки ${game.title}!</h3>
                <p>Мастер выполнит установку <strong>${game.title}</strong> на ваш персональный компьютер под управлением Win 98.</p>
                <p style="color:#555; font-size:11px;">Разработчик: ${game.developer}<br>Требуемое место на диске: 18.5 МБ</p>
                <p>Перед началом установки рекомендуется закрыть все активные приложения.</p>
                <p>Нажмите <strong>«Далее &gt;»</strong>, чтобы продолжить установку программы.</p>
              </div>
            </div>

            <div style="background:var(--win-bg); border-top:1px solid #c0c0c0; padding:8px 12px; display:flex; justify-content:flex-end; gap:8px;">
              <button class="win-btn" disabled style="min-width:75px;">&lt; Назад</button>
              <button class="win-btn btn-next" style="min-width:75px; font-weight:bold;">Далее &gt;</button>
              <button class="win-btn btn-cancel" style="min-width:75px;">Отмена</button>
            </div>
          </div>
        `;

        body.querySelector('.btn-next').addEventListener('click', () => renderStep(2));
        body.querySelector('.btn-cancel').addEventListener('click', () => window.winManager.closeWindow(winId));
      } else if (step === 2) {
        const installDir = game.isApp ? `C:\\Program Files\\${game.folder}` : `C:\\Games\\${game.folder}`;
        const startMenuSub = game.isApp ? `«Программы»` : `«Программы» -&gt; «Игры»`;
        body.innerHTML = `
          <div style="display:flex; height:100%; flex-direction:column; justify-content:space-between; font-family:var(--win-font);">
            <div style="flex:1; background:#fff; padding:18px 20px; font-size:12px; line-height:1.5;">
              <h3 style="margin-top:0; color:#000080; font-size:14px;">Выбор папки установки</h3>
              <p>Программа установит <strong>${game.title}</strong> в следующую системную папку:</p>

              <div style="border:2px inset #808080; padding:6px 10px; background:#f0f0f0; font-family:monospace; margin:10px 0; font-size:12px; display:flex; align-items:center; gap:8px;">
                <span>&#128193;</span>
                <span>${installDir}</span>
              </div>

              <div style="margin-top:16px;">
                <p style="font-weight:bold; margin-bottom:6px;">Дополнительные параметры:</p>
                <label style="display:flex; align-items:center; gap:6px; margin-bottom:6px; cursor:pointer;">
                  <input type="checkbox" id="chk_desktop" checked>
                  <span>Создать ярлык на Рабочем столе</span>
                </label>
                <label style="display:flex; align-items:center; gap:6px; cursor:pointer;">
                  <input type="checkbox" id="chk_start" checked>
                  <span>Добавить в меню «Пуск» -&gt; ${startMenuSub}</span>
                </label>
              </div>
            </div>

            <div style="background:var(--win-bg); border-top:1px solid #c0c0c0; padding:8px 12px; display:flex; justify-content:flex-end; gap:8px;">
              <button class="win-btn btn-back" style="min-width:75px;">&lt; Назад</button>
              <button class="win-btn btn-install" style="min-width:85px; font-weight:bold;">Установить</button>
              <button class="win-btn btn-cancel" style="min-width:75px;">Отмена</button>
            </div>
          </div>
        `;

        body.querySelector('.btn-back').addEventListener('click', () => renderStep(1));
        body.querySelector('.btn-cancel').addEventListener('click', () => window.winManager.closeWindow(winId));
        body.querySelector('.btn-install').addEventListener('click', () => renderStep(3));
      } else if (step === 3) {
        const installDir = game.isApp ? `C:\\Program Files\\${game.folder}` : `C:\\Games\\${game.folder}`;
        body.innerHTML = `
          <div style="display:flex; height:100%; flex-direction:column; justify-content:space-between; font-family:var(--win-font);">
            <div style="flex:1; background:#fff; padding:20px; font-size:12px;">
              <h3 style="margin-top:0; color:#000080; font-size:14px;">Копирование файлов...</h3>
              <p>Пожалуйста, подождите, пока мастер завершит установку ${game.title} на ваш компьютер.</p>

              <div style="margin-top:24px;">
                <div id="inst_status" style="font-size:11px; margin-bottom:6px; color:#333;">Распаковка архива data1.cab...</div>
                <div style="height:20px; border:2px inset #808080; background:#fff; position:relative; overflow:hidden;">
                  <div id="inst_bar" style="height:100%; width:0%; background:#000080; transition:width 0.15s linear;"></div>
                </div>
                <div id="inst_file" style="font-size:10px; color:#666; margin-top:6px; font-family:monospace;">${installDir}\\${game.targetExe}</div>
              </div>
            </div>

            <div style="background:var(--win-bg); border-top:1px solid #c0c0c0; padding:8px 12px; display:flex; justify-content:flex-end; gap:8px;">
              <button class="win-btn" disabled style="min-width:75px;">&lt; Назад</button>
              <button class="win-btn" disabled style="min-width:75px; font-weight:bold;">Далее &gt;</button>
              <button class="win-btn btn-cancel" disabled style="min-width:75px;">Отмена</button>
            </div>
          </div>
        `;

        const bar = body.querySelector('#inst_bar');
        const status = body.querySelector('#inst_status');
        const file = body.querySelector('#inst_file');

        const filesToCopy = (id === 'blender204') ? [
          'Распаковка blender2.04-windows.exe...',
          `Копирование ${game.targetExe}...`,
          'Копирование Python15.dll...',
          'Копирование Readme.txt и Copyright.txt...',
          'Регистрация типа файлов .blend...',
          'Завершение установки Blender 2.04...'
        ] : (id === 'blender') ? [
          'Распаковка пакета ресурсов blender.dat...',
          `Копирование исполняемого файла ${game.targetExe}...`,
          'Инициализация OpenGL 3D интерфейса...',
          'Регистрация ассоциации файлов .blend...',
          'Создание системных ярлыков на Рабочем столе...',
          'Завершение конфигурации Blender 1.60...'
        ] : (game.isApp ? [
          'Распаковка системных файлов data1.cab...',
          `Копирование исполняемого файла ${game.targetExe}...`,
          'Регистрация системных библиотек DLL...',
          'Создание ярлыков в меню «Пуск»...',
          'Завершение настройки программы...'
        ] : [
          'Распаковка игровых ресурсов data1.cab...',
          `Копирование исполняемого файла ${game.targetExe}...`,
          'Распаковка звуковых дорожек SoundBlaster 16...',
          'Регистрация библиотеки DirectX 6.0 DLL...',
          'Создание системных ярлыков и записей реестра...',
          'Завершение конфигурации игры...'
        ]);

        let p = 0;
        let fileIdx = 0;
        const copyInterval = setInterval(() => {
          p += 16;
          if (p > 100) p = 100;
          bar.style.width = `${p}%`;

          if (fileIdx < filesToCopy.length) {
            status.textContent = filesToCopy[fileIdx];
            file.textContent = id === 'blender204' ? `${installDir}\\${['Blender.exe', 'Python15.dll', 'Readme.txt', 'Copyright.txt'][Math.min(3, fileIdx - 1)]}` : `${installDir}\\${id === 'blender' ? 'blender' : 'file'}_${p}.dat`;
            fileIdx++;
          }

          if (p >= 100) {
            clearInterval(copyInterval);
            this.finishInstallation(id);
            renderStep(4);
          }
        }, 300);
      } else if (step === 4) {
        const appTypeWord = game.isApp ? 'Программа' : 'Игра';
        const startMenuSub = game.isApp ? '«Программы»' : '«Программы» -&gt; «Игры»';
        body.innerHTML = `
          <div style="display:flex; height:100%; flex-direction:column; justify-content:space-between; font-family:var(--win-font);">
            <div style="display:flex; flex:1; background:#fff;">
              <div style="width:130px; background:linear-gradient(180deg, #008000 0%, #1084d0 100%); color:#fff; padding:16px 10px; display:flex; flex-direction:column; justify-content:space-between;">
                <div>
                  <div style="font-size:16px; font-weight:bold; margin-bottom:8px;">Готово!</div>
                  <div style="font-size:10px; opacity:0.8;">Установка завершена</div>
                </div>
                <div style="font-size:36px; text-align:center;">&#10004;</div>
                <div style="font-size:9px; opacity:0.7;">Microslop Win 98</div>
              </div>

              <div style="flex:1; padding:20px 16px; font-size:12px; line-height:1.5;">
                <h3 style="margin-top:0; color:#000080; font-size:14px;">Установка успешно завершена!</h3>
                <p>${appTypeWord} <strong>${game.title}</strong> была успешно установлена на ваш компьютер под управлением Win 98.</p>
                <p>Ярлык для быстрого запуска добавлен на Рабочий стол и в меню «Пуск» -&gt; ${startMenuSub}.</p>

                <div style="margin-top:20px; padding:10px; background:#f4f8ff; border:1px solid #b0c4de;">
                  <label style="display:flex; align-items:center; gap:8px; cursor:pointer; font-weight:bold;">
                    <input type="checkbox" id="chk_launch_now" checked>
                    <span>Запустить ${game.title} сейчас</span>
                  </label>
                </div>
              </div>
            </div>

            <div style="background:var(--win-bg); border-top:1px solid #c0c0c0; padding:8px 12px; display:flex; justify-content:flex-end; gap:8px;">
              <button class="win-btn btn-finish" style="min-width:85px; font-weight:bold;">Готово</button>
            </div>
          </div>
        `;

        body.querySelector('.btn-finish').addEventListener('click', () => {
          const launchNow = body.querySelector('#chk_launch_now').checked;
          window.winManager.closeWindow(winId);

          if (window.soundSys) {
            window.soundSys.playDing();
          }

          if (launchNow) {
            setTimeout(() => {
              game.launch();
            }, 300);
          }
        });
      }
    };

    renderStep(1);
  }

  finishInstallation(id) {
    const game = this.catalog[id];
    if (!game) return;

    if (!this.state.installed.includes(id)) {
      this.state.installed.push(id);
      this.saveState();
    }

    if (window.vfs) {
      if (game.isApp) {
        const progFolder = window.vfs.resolvePath(['My Computer', 'C:', 'Program Files']);
        if (progFolder && progFolder.children) {
          if (!progFolder.children[game.folder]) {
            progFolder.children[game.folder] = {
              type: 'folder',
              name: game.folder,
              icon: 'folder',
              children: {}
            };
          }
          progFolder.children[game.folder].children[game.targetExe] = {
            type: 'executable',
            name: game.targetExe,
            icon: game.icon,
            app: id
          };
          if (id === 'blender204') {
            const dir = progFolder.children[game.folder].children;
            dir['Python15.dll'] = { type: 'file', name: 'Python15.dll', icon: 'settings' };
            dir['Readme.txt'] = { type: 'file', name: 'Readme.txt', icon: 'notepad', app: 'notepad', content: '                       Blender V2.0\r\n						\r\n                Not a Number, the Netherlands\r\n\r\n--------------------- GENERAL INFORMATION----------------------------------\r\n\r\nBlender is a free and fully functional 3D modeling/rendering/animation \r\nand game creation package for Unix, Win and BeOS systems. \r\nBlender is distributed without sources, it is exclusively developed and\r\nmaintained by the Dutch company NaN.\r\n\r\nThis software is free to be applied for any purpose, excluding commercial\r\ndistribution. For more about this, read the copyright notice included \r\nin the download file.\r\n\r\nMore information about Blender:\r\n\r\n- The website\r\n\r\n    http://www.blender.nl\r\n\r\n- The beginners page\r\n\r\n    http://www.blender.nl/help/beginners.php\r\n\r\n- The frequently asked questions\r\n\r\n    http://www.blender.nl/help/faq/index.php\r\n\r\n- Tutorials\r\n\r\n  Good tutorials to start with are \'User Interface\' and\r\n  \'Navigating in 3D Space\' and \'The Blender Windows\'\r\n\r\n    http://www.blender.nl/search_item.php?part=tutorial\r\n\r\n- The Blender news-server: to post questions and contact other users\r\n\r\n    http://www.blender.nl/discussion/index.php\r\n\r\nThe best resource is of course the printed Blender manual.\r\nThis wonderfully designed 340 pages book contains tutorials, examples \r\nand a complete description of every aspect of the interface. \r\nYou can visit the shop page of the Blender site for more about this.\r\n\r\nThank you for getting Blender, I hope you will enjoy using it.\r\n\r\nTon Roosendaal\r\nNot a Number\r\nblender@blender.nl\r\n' };
            dir['Copyright.txt'] = { type: 'file', name: 'Copyright.txt', icon: 'notepad', app: 'notepad', content: '\r\n\r\n\r\n  Permission to copy and distribute this software and its\r\n  documentation without written agreement is hereby granted only for non-\r\n  commercial purposes. Distributing Blender \'bundled\' in with ANY product\r\n  is considered to be a `commercial purpose\'. This entire copyright notice \r\n  must appear in all copies of this software.\r\n\r\n  IN NO EVENT SHALL Not a Number BE LIABLE TO ANY PARTY FOR DIRECT, INDIRECT,\r\n  SPECIAL, INCIDENTAL, OR CONSEQUENTIAL DAMAGES ARISING OUT OF THE USE OF\r\n  THIS SOFTWARE AND ITS DOCUMENTATION, EVEN IF THE AUTHOR HAS BEEN ADVISED\r\n  OF THE POSSIBILITY OF SUCH DAMAGE.\r\n\r\n  THE AUTHOR SPECIFICALLY DISCLAIMS ANY WARRANTIES, INCLUDING, BUT NOT LIMITED\r\n  TO, THE IMPLIED WARRANTIES OF MERCHANTABILITY, FITNESS FOR A PARTICULAR\r\n  PURPOSE AND NONINFRINGEMENT OF THIRD PARTY RIGHTS.  THE SOFTWARE PROVIDED \r\n  HEREUNDER IS ON AN "AS IS" BASIS, AND Not a Number HAS NO OBLIGATION TO \r\n  PROVIDE MAINTENANCE, SUPPORT, UPDATES, ENHANCEMENTS, OR MODIFICATIONS.\r\n\r\n  If you would like to do something with this software that this copyright\r\n  prohibits (such as distributing blender commercially), please contact \r\n  NaN.\r\n\r\n  ton@blender.nl\r\n  \r\n  http://www.blender.nl\r\n  \r\n  Not a Number\r\n  the Netherlands\r\n \r\n  Fax: (31) 40 247 5707\r\n' };
          } else if (id === 'blender') {
            progFolder.children[game.folder].children['README.TXT'] = {
              type: 'file',
              name: 'README.TXT',
              icon: 'notepad',
              app: 'notepad',
              content: 'Blender 1.60 (1998-1999)\r\nNot a Number (NaN) / NeoGeo Amsterdam\r\n\r\nhttp://www.blender3d.com\r\nhttp://www.blender.nl\r\n\r\nHotkeys:\r\n[RMB] - Select Object / Vertex\r\n[G] - Grab / Move\r\n[R] - Rotate\r\n[S] - Scale\r\n[Tab] - Edit / Object Mode\r\n[E] - Extrude Face / Vertex\r\n[Space] - Add Primitive\r\n[F12] - Render Scene\r\n'
            };
          } else if (id === 'avp') {
            progFolder.children[game.folder].children['README.TXT'] = {
              type: 'file',
              name: 'README.TXT',
              icon: 'notepad',
              app: 'notepad',
              content: 'Антивирус Касперского AVP 3.0\r\n==================================\r\nЛаборатория Касперского (1998)\r\nAntiViral Toolkit Pro\r\n\r\nБазы сигнатур вирусов: 18.09.1998\r\nПоддержка проверки дисков C:, D: и оперативной памяти.'
            };
          } else if (id === 'esheep') {
            progFolder.children[game.folder].children['README.TXT'] = {
              type: 'file',
              name: 'README.TXT',
              icon: 'notepad',
              app: 'notepad',
              content: 'eSheep 98 (Sheep.exe / Stray Sheep Poe)\r\n==================================\r\nFuji Television / Tatsutoshi Nomura (1995) - Microslop Win 98 Edition\r\n\r\nУправление:\r\n[Левая кнопка + перетаскивание] - схватить овечку По за загривок и перенести\r\n[Двойной щелчок по овечке] - пощекотать / подбросить овечку\r\n[Правая кнопка по овечке или значку в трее] - меню управления овечкой и стадом\r\n[Запуск SHEEP.EXE повторно] - добавить ещё одну овечку с неба\r\n\r\nОвечка По ходит по панели задач и заголовкам открытых окон,\r\nспит, щиплет ромашки, чихает, карабкается по краям экрана,\r\nвстречает чёрную овечку, падает метеором в ванну и похищается НЛО.'
            };
          }
          window.vfs.saveToStorage();
        }
      } else {
        const gamesFolder = window.vfs.resolvePath(['My Computer', 'C:', 'Games']);
        if (gamesFolder && gamesFolder.children) {
          if (game.folder) {
            if (!gamesFolder.children[game.folder]) {
              gamesFolder.children[game.folder] = {
                type: 'folder',
                name: game.folder,
                icon: 'folder',
                children: {}
              };
            }
            gamesFolder.children[game.folder].children[game.targetExe] = {
              type: 'executable',
              name: game.targetExe,
              icon: game.icon,
              app: id
            };
            let readmeContent = `${game.title}\r\n==================================\r\n${game.developer}\r\n${game.subtitle || ''}`;
            if (id === 'burnout') {
              readmeContent = `Burnout: Championship Drag Racing Demo\r\n==================================\r\nBethesda Softworks / MediaTech West (1998)\r\nLicensed by Hot Rod Magazine.\r\n\r\nControls:\r\n[Space] / [W] - Throttle\r\n[S] - Brakes\r\n[Shift] / [Z] - Shift Up\r\n[Ctrl] / [X] - Shift Down\r\n[B] - Line-Lock (Burnout Brake)\r\n[N] - Nitrous Oxide\r\n[P] - Parachute\r\n[C] - Toggle Camera View`;
            } else if (id === 'half-life_demo') {
              readmeContent = `Half-Life 98 Demo\r\n==================================\r\nValve Software / Sierra On-Line (1998)\r\n\r\nControls:\r\n[WASD] - Movement\r\n[Mouse] - Look and Aim\r\n[LMB] - Fire Weapon\r\n[RMB] - Secondary Attack\r\n[R] - Reload\r\n[Space] - Jump\r\n[Ctrl] - Crouch\r\n[1-5] - Select Weapon Category`;
            } else if (id === 'neon-racer_demo') {
              readmeContent = `Midnight Glide Demo\r\n==================================\r\nRetroSpeed Studios (1998)\r\n\r\nControls:\r\n[Arrow Keys] - Steer, Accelerate, Brake\r\n[Space] - Handbrake / Drift\r\n[Shift] - Nitro Boost\r\n[C] - Change Camera View`;
            } else if (id === 'diablo') {
              readmeContent = `Diablo\r\n==================================\r\nBlizzard North (1996)\r\n\r\nControls:\r\n[Left Click] - Move / Attack / Talk / Pick up\r\n[Shift + Click] - Attack in place\r\n[Right Click] - Cast current spell\r\n[I] Inventory  [C] Character  [B] Spellbook  [Q] Quests\r\n[S] Spell select, [F5-F8] Spell hotkeys\r\n[1-8] Belt  [Tab] Automap  [Alt] Item labels  [Esc] Menu`;
            } else if (id === 'doom') {
              readmeContent = `DOOM 98\r\n==================================\r\nid Software (1993) - fan clone for Win 98\r\n\r\nControls:\r\n[W/S] or [Up/Down] - Move   [A/D] - Strafe   [Left/Right] or Mouse - Turn\r\n[Ctrl] / [Left Click] - Fire   [E] / [Space] / [Right Click] - Use / Open\r\n[Shift] - Run   [1-7] / Mouse wheel - Weapons   [Tab] - Automap\r\n[Esc] - Menu   [F2]/[F3] - Save/Load   [F6]/[F9] - Quicksave/Quickload\r\n\r\nClick the game view to capture the mouse.\r\nCheat codes from doom2_cheats.zip work here too.`;
            } else if (id === 'lol') {
              readmeContent = `League of Legends 98\r\n==================================\r\nRiot Games (1999) - fan edition for Win 98\r\n\r\nControls:\r\n[Right Click] - Move / Attack   [A + Left Click] - Attack-move   [S] - Stop\r\n[Q/W/E/R] - Abilities   [Ctrl+Q/W/E/R] - Learn ability   [D/F] - Summoner spells\r\n[1-6] - Items   [B] - Recall   [P] - Shop   [Tab] - Scoreboard\r\n[Y] - Lock camera   [Space] - Center camera   [Enter] - Chat   [Esc] - Menu\r\n\r\n10 champions: Lulu, Jinx, Garen, Annie, Ashe, Master Yi,\r\nMalphite, Teemo, Ryze, Alistar. 5v5 vs bots on the Rift.\r\nChat cheats: /gold 1000, /level, /win`;
            } else if (id === 'dota') {
              readmeContent = `Dota 98\r\n==================================\r\nValve & IceFrog (1999) - fan edition for Win 98\r\n\r\nControls:\r\n[Right Click] - Move / Attack / Deny / Pick up   [A + Left Click] - Attack-move   [S] - Stop   [H] - Hold\r\n[Q/W/E/R/D] - Abilities   [Ctrl+Q/W/E/R] - Learn   [U] - Talents   [Z X C V B N] - Items   [T] - Town Portal\r\n[F3] - Courier   [F4] - Shop   [Tab] - Scoreboard   [Space] - Center camera   [Enter] - Chat   [Esc] - Menu\r\n\r\n10 heroes: Techies, Enigma, Sven, Crystal Maiden, Sniper,\r\nAxe, Lina, Juggernaut, Pudge, Lion. 5v5 vs bots.\r\nLobby cheats: -gold 5000, -lvlup 5, -refresh, -wtf`;
            } else if (id === 'avatar98') {
              readmeContent = `Аватар: Тихий цикл (демо)
==================================
Студия «Кузница» (1999)

Управление:
[Стрелки/WASD] - ходьба   [Shift] - бег   [Z/Enter] - действие   [X/Esc] - отмена
[C] - меню   [V] - радио   [F9] - меню отладки (debug-сборка)
Геймпад: A - действие, B - отмена, Y/Start - меню, X - бег.

Сохранение - только у святилищ. Файлы .SAV можно экспортировать
в «Мои документы» и загрузить обратно из меню «Загрузить».`;
            } else if (id === 'serioussam') {
              readmeContent = `Serious Sam 98: The First Encounter\r\n==================================\r\nCroteam (2001) - fan remake for Win 98\r\n\r\nControls:\r\n[W/A/S/D] - Move   [Mouse] - Look   [Left Click] / [Ctrl] - Fire\r\n[Space] - Jump   [Shift] - Walk   [1-9, 0] / Mouse wheel - Weapons   [Q] - Previous weapon\r\n[Tab] - NETRICSA   [Esc] - Menu\r\n\r\nLevels: Hatshepsut, Sand Canyon, Valley of the Kings,\r\nAlley of Sphinxes, The Great Pyramid.\r\nConsole: please god / please giveall / please killall`;
            } else if (id === 'moh98_demo') {
              readmeContent = `Medal of Honor 98 Demo

==================================

DreamWorks Interactive (1999) - fan remake for Win 98



Controls:

[W/A/S/D] - Move   [Mouse] - Look   [Left Click] - Fire   [Right Click] - Aim / scope

[Shift] - Walk quietly   [Ctrl]/[C] - Crouch   [Space] - Jump   [Q]/[E] - Lean

[R] - Reload   [F] - Use (doors, explosives, prisoners, papers)   [G] - Grenade

[1-7] / Mouse wheel - Weapons (7 - papers)   [Tab] - Objectives   [Esc] - Menu



Missions: Operation Retriever, U-4902, Heavy Water,

Siegfried Forest, Colditz Castle, Nordhausen.

Passwords are entered in the main menu.`;
            } else if (id === 'cop98') {
              readmeContent = `S.T.A.L.K.E.R.: Call of Pripyat 98 - Zaton\r\n==================================\r\nGSC Game World (1999) - Win 98 Edition, software renderer\r\n\r\nControls:\r\n[W/A/S/D] - Move   [Mouse]/[Arrows] - Look   [Left Click]/[Enter] - Fire   [Right Click] - Aim\r\n[Shift] - Sprint   [Ctrl]/[C] - Crouch   [Space] - Jump   [R] - Reload / clear jam\r\n[1-4] - Knife, pistol, rifle, grenades   [G] - Throw grenade   [B] - Throw bolt\r\n[O] - Artifact detector   [L] - Flashlight   [V] - Fire mode   [Y] - Ammo type\r\n[F] - Talk / Search / Pick up   [I]/[Tab] - Inventory   [P]/[M] - PDA\r\n[F1-F4] - Quick slots   [F5]/[F9] - Quick save/load   [Esc] - Menu\r\n\r\nMajor Degtyarev investigates the loss of the Skat helicopters.\r\nHide from emissions indoors. Throw bolts before you step.\r\nThe text quest STALKER.EXE and XR98.EXE are different games.`;
            } else if (id === 'dao98_demo') {
              readmeContent = `Dragon Age: Origins 98 Demo\r\n==================================\r\nBioWare (2000) - Win 98 Edition, 3D accelerated\r\n\r\nControls:\r\n[Left Click] - Move / Attack / Talk / Use   [W/A/S/D] - Move   [Q/E], [Right Drag] - Camera   [Wheel] - Zoom to tactical view\r\n[Space] - Pause   [F1-F4] - Select party member   [1-0] - Quickbar   [Tab] - Highlight   [H] - Hold position\r\n[C] Character  [K] Abilities  [I] Inventory  [J] Journal  [M] Map  [T] Tactics  [N] Crafting  [P] Party\r\n[F5]/[F9] - Quick save/load   [Esc] - Menu   Dialog: [1-9]\r\n\r\nSix origins, Ostagar, the Korcari Wilds, the Tower of Ishal and Lothering.`;
            } else if (id === 'dmc98_demo') {
              readmeContent = `Devil May Cry 98 Demo\r\n==================================\r\nCapcom (2000) - Win 98 Edition, 3D accelerated\r\n\r\nControls:\r\n[W/A/S/D] - Move   [J] / [Left Click] - Red Queen   [K] / [Right Click] - Blue Rose (hold to charge)\r\n[L] / [Middle Click] - Devil Bringer: Buster, Snatch, Hell Bound   [Space] - Jump / Enemy Step\r\n[Shift] - Lock-on: toward + J = Streak, away + J = High Roller, side + Space = Roll\r\n[I] - Exceed (press on hit for EX-Act)   [O] - Devil Trigger   [U] - Taunt\r\n[Q]/[E] - Camera   [C] - Camera behind   [1-4] - Items   [Tab] - Objective   [Esc] - Pause\r\n\r\nMissions: Birds of Feathers, La Porte De L'Enfer, Cold Blooded,\r\nResurrection, Profession of Faith.\r\nSpend Red Orbs and Proud Souls at the Divinity Statue.`;
            } else if (id === 'tekken98_demo') {
              readmeContent = `Tekken 98 Demo\r\n==================================\r\nNamco (1998) - Win 98 Edition, 3D accelerated\r\n\r\nPlayer 1: [W/A/S/D] - Move   [U] Left punch (1)   [I] Right punch (2)   [J] Left kick (3)   [K] Right kick (4)\r\nPlayer 2: [Arrows] - Move   [Num 4] (1)   [Num 5] (2)   [Num 1] (3)   [Num 2] (4)\r\n[Enter] - Start / Pause   [Esc] - Pause menu, move list   Gamepads are supported.\r\n\r\nTap up or down to sidestep. Hold back to block high and mid, hold down-back to block low.\r\n1+3 and 2+4 are throws: break them with 1 or 2. Press a button as you land to tech roll.\r\nClear the Arcade mode to unlock hidden fighters, endings and new modes.`;
            } else if (id === 'ow98') {
              readmeContent = `Overwatch 98\r\n==================================\r\nBlizzard Entertainment (2000) - Win 98 Edition, 3D accelerated\r\n\r\nSystem requirements: Pentium II 350 MHz, 64 MB RAM, 3D accelerator with 16 MB (TNT2 / Voodoo3 / Rage 128), DirectX 7.\r\n\r\nControls:\r\n[W/A/S/D] - Move   [Mouse] - Look   [Left Click] - Primary fire   [Right Click] - Secondary fire\r\n[Space] - Jump   [Ctrl] - Crouch   [Shift] / [E] - Abilities   [Q] - Ultimate   [R] - Reload   [V] - Melee\r\n[H] - Change hero in spawn   [Tab] - Scoreboard   [T] - Spray   [B] - Emote   [X] - Need healing   [Z] - Group up\r\n[Esc] - Menu\r\n\r\nModes: Assault (Hanamura, Volskaya Industries), Escort (Dorado, Watchpoint: Gibraltar),\r\nHybrid (Hollywood, King's Row), Control (Ilios, Lijiang Tower).\r\nNew to the game? Open TRAINING and play the tutorial with Soldier: 76.\r\n\r\nThe world could always use more heroes.`;
            } else if (id === 'sammax') {
              readmeContent = `Sam & Max: Culture Shock\r\n==================================\r\nLucasArts (2000) - Win 98 Edition, 320x200, 256 colors\r\n\r\nControls:\r\n[Left Click] - Walk / do the current action   [Right Click] / [Wheel] - Next cursor: Walk, Look, Use, Talk\r\n[1-4] - Choose the cursor   [I]/[Tab] - Sam's box (inventory)   [Right Click] with an item - Put it back\r\n[.] - Skip a line   [Esc] - Skip a cutscene / Menu   [F5] - Save, load, settings   [Space] - Pause\r\nConversations: click an icon, hover it to read the line, or press [1-9].\r\nIn the DeSoto: [Arrows] - Change lanes, tools on the right.\r\n\r\nTalk to Max when you are stuck. He always has an idea. Usually a violent one.`;
            } else if (id === 'sammax102') {
              readmeContent = `Sam & Max: Situation: Comedy\r\n==================================\r\nLucasArts (2000) - Win 98 Edition, 320x200, 256 colors\r\n\r\nControls:\r\n[Left Click] - Walk / do the current action   [Right Click] / [Wheel] - Next cursor: Walk, Look, Use, Talk\r\n[1-4] - Choose the cursor   [I]/[Tab] - Sam's box (inventory)   [Right Click] with an item - Put it back\r\n[.] - Skip a line   [Esc] - Skip a cutscene / Menu   [F5] - Save, load, settings   [Space] - Pause\r\nConversations: click an icon, hover it to read the line, or press [1-9].\r\nIn the DeSoto: [Arrows] - Change lanes, tools on the right.\r\n\r\nMyra Stump only lets stars on her couch. Get a TV role, a record deal and a scandal.\r\nTalk to Max when you are stuck. He knows show business. Mostly from the other side of the screen.`;
            } else if (id === 'sammax103') {
              readmeContent = `Sam & Max: The Mole, the Mob and the Meatball\r\n==================================\r\nLucasArts (2000) - Win 98 Edition, 320x200, 256 colors\r\n\r\nControls:\r\n[Left Click] - Walk / do the current action   [Right Click] / [Wheel] - Next cursor: Walk, Look, Use, Talk\r\n[1-4] - Choose the cursor   [I]/[Tab] - Sam's box (inventory)   [Right Click] with an item - Put it back\r\n[.] - Skip a line   [Esc] - Skip a cutscene / Menu   [F5] - Save, load, settings   [Space] - Pause\r\nConversations: click an icon, hover it to read the line, or press [1-9].\r\nIn the DeSoto: [Arrows] - Change lanes, tools on the right. Watch the rear-view mirror.\r\n\r\nThe Commissioner's mole went quiet inside the Toy Mafia. Code phrase: "Does the carpet match the drapes?"\r\nTalk to Max when you are stuck. He has never been in the mafia, but he has seen the movies.`;
            } else if (id === 'sammax105') {
              readmeContent = `Sam & Max: Reality 2.0\r\n==================================\r\nLucasArts (2000) - Win 98 Edition, 320x200, 256 colors\r\n\r\nControls:\r\n[Left Click] - Walk / do the current action   [Right Click] / [Wheel] - Next cursor: Walk, Look, Use, Talk\r\n[1-4] - Choose the cursor   [I]/[Tab] - Sam's box (inventory)   [Right Click] with an item - Put it back\r\n[.] - Skip a line   [Esc] - Skip a cutscene / Back / Menu   [F5] - Save, load, settings   [Space] - Pause\r\nConversations and battles: click an icon, hover it to read the line, or press [1-9].\r\nGoggles button in the lower right corner: put the goggles on or take them off. You stay on the same spot in the other world.\r\nBank and Reality 1.5: click an account or a line of text. [1-9] pick a line of text.\r\n\r\nComputers all over the country went crazy and the neighbours will not take their goggles off.\r\nTalk to Max when you are stuck. He is the President now. It has not made him wiser.`;
            } else if (id === 'sammax104') {
              readmeContent = `Sam & Max: Abe Lincoln Must Die!\r\n==================================\r\nLucasArts (2000) - Win 98 Edition, 320x200, 256 colors\r\n\r\nControls:\r\n[Left Click] - Walk / do the current action   [Right Click] / [Wheel] - Next cursor: Walk, Look, Use, Talk\r\n[1-4] - Choose the cursor   [I]/[Tab] - Sam's box (inventory)   [Right Click] with an item - Put it back\r\n[.] - Skip a line   [Esc] - Skip a cutscene / Close a panel / Menu   [F5] - Save, load, settings   [Space] - Pause\r\nConversations: click an icon, hover it to read the line, or press [1-9].\r\nCalendar, budget book and targeting computer: click a day, a line or a target. [Arrows] pick a target.\r\nIn the DeSoto: [Arrows] - Change lanes, tools on the right, [6] - the beacon.\r\n\r\nThe President banned pudding and wants every gun on a list. The Commissioner sends you to Washington.\r\nTalk to Max when you are stuck. He has a plan for the country. Do not ask what it is.`;
            } else if (id === 'sammax106') {
              readmeContent = `Sam & Max: Bright Side of the Moon\r\n==================================\r\nLucasArts (2000) - Win 98 Edition, 320x200, 256 colors\r\n\r\nControls:\r\n[Left Click] - Walk / do the current action   [Right Click] / [Wheel] - Next cursor: Walk, Look, Use, Talk\r\n[1-4] - Choose the cursor   [I]/[Tab] - Sam's box (inventory)   [Right Click] with an item - Put it back\r\n[.] - Skip a line   [Esc] - Skip a cutscene / Leave the arcade game / Menu   [F5] - Save, load, settings   [Space] - Pause\r\nConversations: click an icon, hover it to read the line, or press [1-9].\r\nThe DeSoto flies between the street and the Moon: use the car and pick a destination.\r\nTic Tac Doom: click a cell to place a cross. The talisman goes to the one who loses.\r\n\r\nA rainbow hangs over the city at night and it comes from the Moon. Hugh Bliss is waiting in the Blister of Tranquility.\r\nTalk to Max when you are stuck. Even in three pieces he still has an idea.`;
            } else if (id === 'sammax201') {
              readmeContent = `Sam & Max: Ice Station Santa\r\n==================================\r\nLucasArts (2000) - Win 98 Edition, 320x200, 256 colors\r\n\r\nControls:\r\n[Left Click] - Walk / do the current action   [Right Click] / [Wheel] - Next cursor: Walk, Look, Use, Talk\r\n[1-4] - Choose the cursor   [I]/[Tab] - Sam's box (inventory)   [Right Click] with an item - Put it back\r\n[.] - Skip a line   [Esc] - Skip a cutscene / Leave a board / Menu   [F5] - Save, load, settings   [Space] - Pause\r\nConversations: click an icon, hover it to read the line, or press [1-9].\r\nThe DeSoto flies between the street and the North Pole: use the car and pick a destination.\r\nQuiz board: whisper a letter to Lincoln, pick your own letter, press the answer button.\r\nRing: [Up]/[Z] - Punch, [Down]/[X] - Block. Race: the car follows the mouse pointer, [Left]/[Right] steer.\r\n\r\nA giant robot arrived a week before Christmas. The label on its foot says it came from Santa's workshop.\r\nTalk to Max when you are stuck. He has been on the naughty list for years and knows his way around.`;
            } else if (id === 'sammax202_demo') {
              readmeContent = `Sam & Max: Moai Better Blues Demo\r\n==================================\r\nLucasArts (2000) - Win 98 Edition, 320x200, 256 colors\r\n\r\nControls:\r\n[Left Click] - Walk / do the current action   [Right Click] / [Wheel] - Next cursor: Walk, Look, Use, Talk\r\n[1-4] - Choose the cursor   [I]/[Tab] - Sam's box (inventory)   [Right Click] with an item - Put it back\r\n[.] - Skip a line   [Esc] - Skip a cutscene / Menu   [F5] - Save, load, settings   [Space] - Pause\r\nConversations: click an icon, hover it to read the line, or press [1-9].\r\nStep through the Bermuda Triangle portal to travel between New York, Easter Island, and the dimensional rift.\r\n\r\nA dimensional triangle appeared outside the office, leading to Easter Island and an impending volcanic eruption.\r\nTalk to Max when you are stuck. He has a unique perspective on geology and ancient prophecies.`;
            } else if (id === 'bttf') {
              readmeContent = `Back to the Future: The Game - Episode 1: It's About Time\r\n==================================\r\nTelltale Games (2000) - Win 98 Edition, 640x480, 256 colors\r\n\r\nControls:\r\n[Left Click] - Walk / Use / Talk   [Right Click] - Look   [Wheel] / bar at the bottom - Pockets\r\n[Click an item] then [Click a target] - Use an item   [1-6] - Pick a line in a conversation\r\n[Space] / [Click] - Skip a line   [Esc] - Skip a cutscene / Menu   [F5] - Save and load\r\nStuck? Open the menu and press THINK, McFLY: up to four hints for every goal.\r\n\r\nDoc vanished six months ago. Tonight the DeLorean came back on its own.\r\nGreat Scott!`;
            } else if (id === 'diablo2') {
              readmeContent = `Diablo II - Act I\r\n==================================\r\nBlizzard North (2000) - Win 98 Edition, 800x600\r\n\r\nControls:\r\n[Left Click] - Walk / Attack / Talk / Pick up   [Shift + Left Click] - Attack in place\r\n[Right Click] - Use the right skill   [S] - Choose the right skill   [F1-F8] - Skill hotkeys\r\n[C] Character  [I] Inventory  [T] Skill tree  [Q] Quests  [Tab] Automap  [Alt] Show items\r\n[1-4] - Belt potions   [W] - Swap weapons   [R] - Run / walk   [Space] - Close panels\r\n[H] - Help   [Esc] - Save and exit\r\n\r\nSeven heroes, six quests, Normal, Nightmare and Hell.\r\nStay a while and listen.`;
            } else if (id === 'forza') {
              readmeContent = `Forza Horizon: Riga\r\n==================================\r\nPlayground Games (2000) - Win 98 Edition, 3D accelerated\r\n\r\nSystem requirements: Pentium II 400 MHz, 64 MB RAM, 3D accelerator with 16 MB (TNT2 / Voodoo3 / Rage 128), DirectX 7.\r\n\r\nControls:\r\n[W]/[Up] - Throttle   [S]/[Down] - Brake / Reverse   [A/D]/[Left/Right] - Steer\r\n[Space]/[Shift] - Handbrake   [Q]/[E] - Gear down / up (manual)   [R] - Rewind   [B] - Look back\r\n[C] - Camera: chase, far, hood, cockpit   [L] - Headlights   [H] - Horn   [Tab] - Radio\r\n[V] - Photo mode: free camera, lenses, film looks; photos go to My Pictures\\Forza Horizon\r\n[Enter] - Start the event you are standing at   [M] - Map, waypoints and fast travel\r\n[Backspace] - Reset the car to the road   [Esc]/[P] - Horizon menu   Gamepads are supported.\r\n\r\nWin events to earn wristbands. Smash XP boards, find barn finds,\r\nbeat speed traps and drift zones. The festival starts in Mezaparks.

Street map of Riga based on OpenStreetMap data, (c) OpenStreetMap contributors, ODbL.`;
            } else if (id === 'xiii_demo') {
              readmeContent = `XIII Demo\r\n==================================\r\nUbisoft Paris (2000) - Win 98 Edition, 3D accelerated\r\n\r\nSystem requirements: Pentium II 350 MHz, 64 MB RAM, 3D accelerator with 16 MB (TNT2 / Voodoo3 / Rage 128), DirectX 7.\r\n\r\nControls:\r\n[W/A/S/D] - Move   [Mouse] - Look   [Left Click] - Fire   [Right Click] - Zoom\r\n[Space] - Jump   [C]/[Ctrl] - Crouch   [Shift] - Walk quietly   [E]/[F] - Use, pick locks, take a hostage\r\n[R] - Reload   [1-9] - Weapons   [Q] - Last weapon   [G] - Grenade   [H] - Medkit\r\n[Tab] - Objectives   [F5] - Quick save   [F9] - Quick load   [Esc] - Pause menu\r\n\r\nTen chapters from Brighton Beach to Plain Rock Penitentiary.\r\nEvery document you find is a piece of your past. Collect them all for the XX dossier.`;
            } else if (id === 'maxpayne_demo') {
              readmeContent = `Max Payne Demo\r\n==================================\r\nRemedy Entertainment (2001) - Win 98 Edition, 3D accelerated\r\n\r\nSystem requirements: Pentium II 450 MHz, 96 MB RAM, 3D accelerator with 16 MB (TNT2 / Voodoo3 / Rage 128), DirectX 7.\r\n\r\nControls:\r\n[W/A/S/D] - Move   [Mouse] - Aim   [Left Click] - Fire   [Right Click] - Bullet time / Shootdodge\r\n[Shift] - Bullet time   [Q] - Shootdodge   [Space] - Jump   [C]/[Ctrl] - Crouch   [Alt] - Walk\r\n[E]/[F] - Use   [R] - Reload   [H]/[Backspace] - Painkillers   [G] - Throw grenade or Molotov\r\n[1-5], [Wheel] - Weapons   [Tab] - Max's thoughts   [Enter] - Skip a line   [F5] - Quick save   [F9] - Quick load   [Esc] - Menu\r\n\r\nPart I: The American Dream. A tutorial, a prologue and nine chapters, from Roscoe Street Station to Aesir Plaza.\r\nKills refill the hourglass. Painkillers heal over time. Harder modes open after Part I.`;
            } else if (id === 'legion') {
              readmeContent = `Legion Arena
==================================
Slitherine Software (2005) - Win 98 Edition, 3D accelerated

System requirements: Pentium III 700 MHz, 128 MB RAM, 3D accelerator with 32 MB (GeForce2 / Radeon), DirectX 8.

Deployment:
[Left drag] - Move a squad inside the deployment zone   [Right drag] - Turn it   [1/2/3] - Formation   [Enter] - Start the battle

Battle:
[Left Click] / [Drag a box] - Select squads   [Right Click] - Move / Attack   [Space] - Pause   [+]/[-] - Speed
[G] - Signal   [R] - Rally   [H] - Halt   [C] - Charge   [X] - Pull cavalry out   [T] - Show terrain
[W/A/S/D]/[Arrows] - Camera   [Q]/[E] - Turn   [Wheel] - Zoom   [Tab] - Next squad   [Home] - General   [Esc] - Menu

The full Roman campaign: 68 battles in 14 eras, from the wars in Latium to Philippi, the Arena and the encyclopedia.
Command points are scarce. Plan well, then let your men fight.`;
            } else if (id === 'homm1_demo') {
              readmeContent = `Heroes of Might and Magic 98 Demo\r\n==================================\r\nNew World Computing (1995) - 640x480, 256 colors\r\n\r\nAdventure Map Controls:\r\n[Left Click on tile] - Plan A* path; click same tile again or press [M] to march\r\n[Right Click on tile] - Inspect terrain, town, mine or monster stack\r\n[Arrow Keys] - Scroll Adventure Map camera\r\n[T] / [Double Click Town] - Open Town Screen\r\n[H] - Hero Sheet & Artifacts   [C] - Cast Adventure Spell   [D] - Dig for Ultimate Artifact\r\n[E] - End Day (7 days per week, weekly creature growth on Day 1)\r\n[F5] - Save Game   [F9] - Load Game\r\n\r\nTown Screen:\r\nClick Castle to build (1 structure per day), Tavern to hire heroes, Mage Guild to study spells,\r\nor creature dwellings to recruit troops. Shift-click army slots to split stacks.\r\n\r\nTactical Combat (7x5 grid):\r\n[Left Click] - Move or Attack   [C] - Cast Spell   [Space]/[D] - Defend   [A] - Auto-Combat   [R] - Retreat`;
            } else if (id === 'fallout') {
              readmeContent = 'Fallout: A Post-Nuclear Role-Playing Game\r\n==================================\r\nInterplay Productions (1997) - Win 98 Edition, version 1.2, 640x480, 256 colors\r\n\r\nSystem requirements: Pentium 90 MHz, 16 MB RAM, SVGA video card (640x480, 256 colors), DirectX 3.0a, 2x CD-ROM, mouse.\r\n\r\nControls:\r\n[Left Click] - Walk or act with the current cursor   [Right Click] - Switch the walk and action cursors\r\n[Hold Left Button] on an object - Action menu: look, talk, use, skill, rotate\r\n[A] - Attack   [Space] - End turn   [Enter] - End combat   [N] - Weapon mode   [B] - Swap hands   [M] - Cursor mode\r\n[I] - Inventory   [C] - Character   [P] - Pip-Boy   [Z] - Pip-Boy clock   [S] - Skilldex   [Tab] - Automap   [O]/[Esc] - Options\r\n[1-8] - Sneak, Lockpick, Steal, Traps, First Aid, Doctor, Science, Repair\r\n[Home] - Center on you   [,]/[.] - Turn   [/] - Time   [+]/[-] - Brightness   [F1] - Help\r\n[F4]/[Ctrl+S] - Save   [F5]/[Ctrl+L] - Load   [F6] - Quick save   [F7] - Quick load   [F10]/[Ctrl+Q] - Quit\r\n\r\nVault 13, 5 December 2161. The water chip has failed and the vault has water for 150 days.\r\nThe Overseer has chosen you to find a new one.';
            } else if (id === 'falloutzp_demo') {
              readmeContent = `Fallout: Запорожье Demo\r\n==================================\r\nObsidian Entertainment (2001) - Win 98 Edition, 3D accelerated\r\n\r\nSystem requirements: Pentium III 600 MHz, 128 MB RAM, 3D accelerator with 32 MB (GeForce2 / Radeon), DirectX 8.\r\n\r\nControls:\r\n[W/A/S/D] - Move   [Mouse] - Look   [Left Click] - Fire / Swing   [Right Click] - Aim   [Shift] - Walk   [Space] - Jump\r\n[Ctrl] - Sneak   [E] - Use, talk, open   [R] - Reload   [F] - First / third person   [H] - Holster   [G] - Throw grenade\r\n[V] - S.T.R.E.L.A. targeting   [Tab] - Pioneer-77   [T] - Wait   [L] - Pioneer light   [1-8] - Hotkeys   [Wheel] - Next weapon\r\n[F5] - Quick save   [F9] - Quick load   [Esc] - Menu\r\n\r\nZaporozhye, 1 September 2280. The courier of the Main Post Office was shot on the bridge and thrown into the Dnieper.\r\nVoznesenovsky district and the island of Khortytsia are open from the start. Danger grows with distance from Voznesenka.\r\n\r\nMap of Zaporozhye based on OpenStreetMap data, (c) OpenStreetMap contributors, ODbL. Heights: SRTM, NASA.`;
            } else if (id === 'anotherwar') {
              readmeContent = 'Другая война (Another War)\r\n==================================\r\nMirage Interactive (2002) - Win 98 Edition, 800x600\r\n\r\nСистемные требования: Pentium II 433 МГц, 128 MB RAM, видеокарта с 8 MB памяти, DirectX 8.1.\r\n\r\nУправление:\r\n[Левая кнопка] - идти, осмотреть, подобрать   [Правая кнопка] - говорить, использовать, открыть\r\n[D] - достать или спрятать оружие   [Ctrl]+[Левая кнопка] - прицельный выстрел   [Enter] - атаковать ближайшего врага\r\n[R] - перезарядить   [E] - починить оружие   [1-7] - предметы на поясе   [W] - шаг или бег\r\n[F1-F8] - выбрать особый навык   [Пробел] - применить навык   [Backspace] - отменить выбор\r\n[I] - снаряжение   [S] - параметры   [N] - дневник   [M] - карта   [O] - настройки   [H]/[F10] - помощь\r\n[Ctrl+S] - сохранить   [Ctrl+L] - загрузить   [F11] - быстрое сохранение   [F12] - быстрая загрузка\r\n[P] - пауза   [Пробел]/[Enter] - пропустить реплику в сценке   [Esc] - меню\r\n\r\nАкт I. Аннет, оккупированная Франция. Выберите героя: Силач, Вор или Интеллектуал.\r\nВыберитесь из подвалов вместе с Иоганном и найдите способ уехать из города.\r\nПродолжение следует: впереди Югославия.';
            } else if (id === 'korovany_demo') {
              readmeContent = 'Корованы Demo\r\n==================================\r\nДжва Года Софт (2000) - Win 98 Edition, 3D accelerated\r\n\r\nСистемные требования: Pentium II 300 МГц, 64 MB RAM, 3D-ускоритель с 8 MB памяти, DirectX 6.\r\n\r\nУправление:\r\n[W/A/S/D] - идти   [Shift] - бежать   [Пробел] - прыжок   [C] - пригнуться\r\n[Мышь] - смотреть   [Левая кнопка] - удар, выстрел   [Правая кнопка] - блок\r\nКуда смотрите, туда и бьёте: вверх - голова, прямо - корпус, вниз - ноги.\r\n[1/2/3] - оружие / лук / факел   [R] - убрать оружие   [E] - говорить, обыскать, поджечь\r\n[B] - перевязать рану   [H] - зелье   [V] - от первого лица\r\n[I] - инвентарь и протезы   [M] - карта   [J] - журнал   [T] - ждать   [Q] - приказы войску\r\n[F5/F9] - быстрое сохранение / загрузка   [Esc] - меню\r\n\r\nОтрубленная рука или нога кровоточит. Перевяжите её (B) или идите к знахарке, иначе умрёте.\r\nПротезы ставит мастер Деревяшкин в Развилках.\r\n\r\nПо письму Кирилла.';
            } else if (id === 'kirill98') {
              readmeContent = window.Kirill98 && window.Kirill98.Screens && window.Kirill98.Screens.readme ? window.Kirill98.Screens.readme() : 'Kirill The Game\r\n3Д-экшон по письму Кирилла\r\n';
            } else if (id === 'catniss') {
              readmeContent = 'Catniss\r\n==================================\r\nKotelok Games (2000) - Win 98 Edition, 320x240, 256 colors\r\n\r\nControls:\r\n[Left]/[Right], [A]/[D] - Run   [Z]/[Space] - Jump (hold to jump higher)   [X]/[Shift] - Pounce\r\nAgainst a wall in the air: hold toward the wall to cling, then [Z] to kick off\r\n[Down]+[Z] - Drop through a plank   [Esc]/[P] - Pause   [M] - Music on/off\r\nMap: [Enter] - Play   [C] - Choose a cat   [Q] - Aquarium   Gamepad supported.\r\n\r\nNine lives at most. Every 50 coins and every bowl of milk give one more.\r\nThe van OTLOV took the kittens. Bring all four home.\r\nTwelve goldfish in bags are hidden behind cracked walls and in other odd places.';
            } else if (id === 'plov') {
              readmeContent = 'Хаято, Где плов?\r\n==================================\r\nKishlak Soft (2000) - Win 98 Edition, 800x600, 16-bit color\r\n\r\nControls:\r\n[Left Click] - Walk and act, clicks queue up to five jobs   [Right Click]/[Q] - Cancel the jobs\r\n[Drag] - Drag guests from the gate to a table   [Tab] - Pick guests in the line   [1-6] - Seat them at table N\r\n[W/A/S/D]/[Arrows] - Walk   [Space]/[E] - Use what is next to you   [Esc]/[P] - Pause\r\n\r\nKeep the kazan busy: meat, carrots with onion, rice, then steam.\r\nGroups of three and four sit only on the topchans. Tea brews two pots at a time.\r\nA quarter of every day goes to the savings box. Spend it at the bazaar.';
            } else if (id === 'gtann') {
              readmeContent = `Grand Theft Auto: Nizhny City\r\n==================================\r\nRockstar North (2002) - Win 98 Edition, 3D accelerated\r\n\r\nSystem requirements: Pentium III 600 MHz, 128 MB RAM, 3D accelerator with 32 MB (GeForce2 / Radeon), DirectX 8.\r\n\r\nControls:\r\n[W/A/S/D] - Walk / Drive   [Mouse] - Look   [Left Click]/[Ctrl] - Attack, fire   [Right Click] - Aim, sniper scope\r\n[Shift] - Sprint   [Space] - Jump / Handbrake   [F]/[Enter] - Get in / out of a car   [Q]/[E], [1-7] - Weapons (in a car: look sideways, drive-by)\r\n[G] - Grenade   [R] - Reload / Next radio station   [H] - Horn, siren   [T] - Taxi or militia job   [C] - Camera   [M]/[Tab] - Map   [Esc] - Pause\r\n\r\nSave the game at the hotel «Zarechnaya». Lose the militia out of sight, at a respray shop or with a bribe.\r\nCheats: ZDOROVIE, BRONYA, STVOLY, BABKI, MENTY, POGODA.`;
            } else if (id === 'sims3_demo') {
              readmeContent = `The Sims 3 Demo - 2000 Edition\r\n==================================\r\nMaxis (2000) - Win 98 Edition, 3D accelerated\r\n\r\nSystem requirements: Pentium II 300 MHz, 64 MB RAM, 3D accelerator with 16 MB (TNT2 / Voodoo3 / Rage 128), DirectX 7.\r\n\r\nControls:\r\n[Left Click] - Interact with an object, a Sim or the ground   [Right Click] - Cancel the current action\r\n[Drag], [Arrows]/[W/A/S/D] - Scroll   [Q]/[E] - Rotate   [Wheel], [Z]/[X] - Zoom\r\n[Space]/[0] - Pause   [1] [2] [3] - Game speed   [Tab] - Next Sim   [Home] - Center on Sim\r\n[F1] - Live mode   [F2] - Buy mode   [F3] - Build mode   [M] - Map view\r\n[Page Up]/[Page Down] - Walls   [R] - Rotate an object   [Del] - Sell   [F5] - Save   [Esc] - Menu\r\n\r\nPromise wishes to earn Lifetime Happiness. Spend it on rewards.\r\nWelcome to Sunset Valley.`;
            } else if (id === 'quake3') {
              readmeContent = `Quake III Arena
==================================
id Software (1999) - Win 98 Edition, OpenGL

System requirements: Pentium II 233 MHz, 64 MB RAM, OpenGL 3D accelerator with 8 MB
(Voodoo2 / TNT / G400), DirectX 6.

Controls:
[W/A/S/D] - Move   [Mouse] - Look   [Left Click] - Attack   [Right Click]/[E] - Zoom
[Space] - Jump   [C]/[Ctrl] - Crouch   [Shift] - Walk   [1-9] / Mouse wheel - Weapons   [Q] - Last weapon
[Enter]/[F] - Use item   [G] - Gesture   [Tab] - Scores   [~] - Console   [F12] - Screenshot   [Esc] - Menu

Single Player: Tier 1 (Trainee) and Tier 2 (Skilled).
Win the three arenas of a tier to face its Arena Lord in a tournament.
Console: map q3dm6, god, noclip, give all, addbot klesk 4.`;
            } else if (id === 'hl2_demo') {
              readmeContent = `Half-Life 2 Demo\r\n==================================\r\nValve Software (2000) - Win 98 Edition\r\n\r\nSystem requirements: Pentium II 300 MHz, 64 MB RAM, 3D accelerator with 16 MB\r\n(TNT2 / Voodoo3 / Rage 128) or software renderer, DirectX 7, 24 MB free disk space.\r\n\r\nControls:\r\n[W/A/S/D] - Move   [Mouse] - Look   [Left Click] - Fire   [Right Click] - Alt fire\r\n[Space] - Jump   [C]/[Ctrl] - Crouch   [Shift] - Sprint   [Z]/[Alt] - Walk\r\n[E] - Use / pick up   [R] - Reload   [F] - Flashlight   [Q] - Last weapon\r\n[1-6] / Mouse wheel - Weapons   [G] - Squad command   [F6]/[F9] - Quick save/load   [Esc] - Menu\r\n\r\nGravity gun: right click pulls and holds objects, left click punts and throws.\r\nFind all rebel lambda caches. Wake up, Mr. Freeman.`;
            } else if (id === 'gta90') {
              readmeContent = `Grand Theft Auto: Yekaterinburg '90\r\n==================================\r\nDMA Design (1997) - Win 98 Edition, Sverdlovsk 1990\r\n\r\nControls:\r\n[Arrows]/[W/A/S/D] - Drive / Walk   [Space] - Handbrake (car) / Fire (on foot)   [Ctrl] - Fire\r\n[Enter]/[F] - Get in / out of a car   [Q]/[E]/[Tab], [1-6] - Weapons   [H] - Horn   [R] - Radio\r\n[T] - Taxi job   [M] - City map   [-]/[=] - Camera zoom   [Esc] - Pause, save, settings\r\n\r\nAnswer ringing payphones on foot to get jobs.\r\nReach the chapter target in roubles to unlock the boss mission.\r\nLose the police out of sight, at a respray shop or with a bribe.`;
            } else if (id === 'kotor98_demo') {
              readmeContent = `Star Wars: Knights of the Old Republic 98 Demo\r\n==================================\r\nBioWare / LucasArts (1999) - Win 98 Edition, 3D accelerated\r\n\r\nControls:\r\n[Left Click] - Move / Attack / Talk / Use   [W/A/S/D] - Move   [Q/E], [Right Drag] - Camera   [Wheel] - Zoom\r\n[Space] - Pause (queue orders)   [Tab]/[1-3] - Switch leader   [F] - Use nearest   [H] - Medpac   [G] - Grenade\r\n[R] - Rest   [U] Equipment  [I] Inventory  [C] Character  [K] Abilities  [J] Journal  [M] Map  [P] Party  [L] Log\r\n[F5]/[F9] - Quick save/load   [Esc] - Menu   Dialog: [1-9]\r\n\r\nFind Bastila Shan and escape Taris aboard the Ebon Hawk.\r\nSwoop racing, pazaak and the Upper City dueling ring are waiting.`;
            } else if (id === 'hsr98') {
              readmeContent = `Honkai: Star Rail 98 - Jarilo-VI Edition\r\n==================================\r\nmiHoYo (1999) - Win 98 Edition\r\n\r\nControls:\r\n[W/A/S/D]/[Arrows] - Move   [Shift] - Walk   [Space]/[Enter] - Talk / Use\r\n[F] - Attack on the map (first strike)   [E] - Technique   [1-4] - Leader   [M] - Map   [Esc] - Menu\r\nBattle: [Q] Basic ATK   [E] Skill   [1-4] Ultimate   [T] Contact   [R] Fusion   [V] Auto\r\n\r\nHerta Space Station, the Astral Express and Jarilo-VI up to Cocolia.\r\nSave and teleport at Space Anchors. Spread rumors to make them true.`;
            } else if (id === 'mc98_demo') {
              readmeContent = `Minecraft 98 Demo\r\n==================================\r\nMojang Specifications (1999) - Win 98 Edition\r\n\r\nControls:\r\n[W/A/S/D] - Move   [Mouse]/[Arrows] - Look   [Left Click] - Dig   [Right Click] - Place / Use\r\n[Space] - Jump / Swim   [Shift] - Sneak   [Ctrl] - Sprint   [E] - Inventory   [Q] - Drop\r\n[1-9] / Mouse wheel - Hotbar   [Middle Click] - Pick block   [F3] - Debug   [Esc] - Pause\r\nCreative: double-tap Space to fly.\r\n\r\nPunch trees. Craft a workbench. Build a shelter before night.\r\nWorlds are saved automatically every minute and on exit.`;
            } else if (id === 'stalker98_demo') {
              readmeContent = `S.T.A.L.K.E.R. 98: Тень Чернобыля Demo\r\n==================================\r\nGSC Game World (2000) - fan remake for Win 98\r\n\r\nControls:\r\n[W/A/S/D] - Move   [Mouse] - Look   [Left Click] - Fire   [Right Click] - Aim\r\n[Shift] - Sprint   [Ctrl]/[C] - Crouch   [Space] - Jump   [Q]/[E] - Lean\r\n[R] - Reload   [B] - Fire mode   [1-6] - Knife, pistol, rifle, grenade, binoculars, bolt\r\n[F] - Talk / Search / Pick up   [I] - Inventory   [P]/[Tab] - PDA   [M] - Map   [L] - Flashlight\r\n[F1-F4] - Medkit, bandage, anti-rad, food   [F6]/[F7] - Quick save/load   [Esc] - Menu\r\n\r\nLevels: Cordon, Garbage. Find Strelok.\r\nThe text quest STALKER.EXE is a different game.`;
            } else if (id === 'worldcup98') {
              readmeContent = `EA Sports World Cup 98 Demo (France 98)\r\n==================================\r\nEA Sports (1998) - Igromania CD Edition for Win 98\r\n\r\nControls:\r\n[WASD] / [Arrows] - Movement & Shot Aim\r\n[Shift] - Sprint\r\n[X] / [J] - Ground Pass / Switch Player\r\n[C] / [K] - Lob Pass & Wing Cross / Sliding Tackle\r\n[Space] / [Z] - Hold to Charge Shot (Volley in air) / Standing Tackle\r\n[E] / [V] - Skill Feint\r\n[1] / [2] / [3] - Live Tactical Mentality (Counter / Balanced / Pressing)`;
            } else if (id === 'hockey') {
              readmeContent = `NHL 98 Demo\r\n==================================\r\nEA Sports (1998)\r\n\r\nControls:\r\n[WASD] / [Arrows] - Movement\r\n[Space] - Shoot Puck / Body Check\r\n[X] / [Tab] - Pass Puck / Switch Player\r\n[Shift] - Speed Burst`;
            }
            gamesFolder.children[game.folder].children['README.TXT'] = {
              type: 'file',
              name: 'README.TXT',
              icon: 'notepad',
              app: 'notepad',
              content: readmeContent
            };
          } else {
            gamesFolder.children[game.targetExe] = {
              type: 'executable',
              name: game.targetExe,
              icon: game.icon,
              app: id
            };
          }
          window.vfs.saveToStorage();
        }
      }
    }

    if (window.desktop) {
      window.desktop.renderIcons();
    }

    if (window.taskbar) {
      window.taskbar.renderStartMenuContent();
    }
  }
}

window.gameManager = new GameManager();
if (window.vfs && window.vfs.ensureIntegrity) window.vfs.ensureIntegrity();
