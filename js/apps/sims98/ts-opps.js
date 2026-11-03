(function (S) {
  'use strict';
  const DAY = 1440, CALL_GAP = [1, 3], CALL_FROM = 600, CALL_TO = 1200, WORK_OFFER = 0.15, COOL_DAYS = 5, NEWS_KEEP = 60, FAIL_PERF = 10, FAIL_REL = 5, OFFER_LIFE = 120;
  const PAY = { fish: 10, produce: 10, painting: 4, butterfly: 4, bug: 4, gem: 1.5, metal: 1.5, space: 1.5, oddity: 2, manuscript: 1 };
  const STUDY = 1.25, LUCK = 0.08, LUCK_ANY = 0.01, LUCK_SUM = [5, 40], CATCHER_GAP = [1, 2], CATCHER_PAY = 1.25;

  const C = (id, key, level, title, text, goal, reward, days) => [id, 'career', key, level, title, text, goal, reward, days];
  const K = (id, key, level, title, text, goal, reward, days) => [id, 'skill', key, level, title, text, goal, reward, days];
  const X = (id, key, level, title, text, goal, reward, days, stage) => [id, 'special', key, level, title, text, goal, reward, days, stage];
  const ROWS = [
    C('biz_report', 'business', 1, 'Срочный отчёт', 'Начальству к концу недели нужен отчёт. Поднимите производительность до 80.', ['perf', 80], { money: 200, perf: 10 }, 4),
    C('biz_lunch', 'business', 2, 'Обед с клиентом', 'Клиент ждёт в бистро. Проведите там пару часов и не говорите о погоде.', ['visit', 'bistro', 2], { money: 300, perf: 10 }, 3),
    C('biz_cards', 'business', 3, 'Визитки', 'Раздайте визитки: познакомьтесь с тремя горожанами.', ['meet', 3], { perf: 15, skill: ['charisma', 60] }, 4),
    C('biz_course', 'business', 4, 'Курсы переговоров', 'Фирма оплатит курсы, если обаяние дойдёт до 5.', ['skill', 'charisma', 5], { money: 500, perf: 10 }, 7),
    C('biz_boss', 'business', 5, 'Дружба с начальством', 'Говорят, повышения раздают друзьям. Подружитесь с начальником.', ['friend', 'boss'], { perf: 25 }, 7),
    C('biz_hall', 'business', 6, 'Договор с городом', 'Ратуша готова подписать договор. Нужно провести там три часа.', ['visit', 'cityhall', 3], { money: 800, perf: 15 }, 3),
    C('crime_pockets', 'crime', 2, 'Лёгкие деньги', 'Две чужие сумки до конца недели. Только без шума.', ['soc', 'pickpocket', 2], { money: 150, perf: 10 }, 5),
    C('crime_stash', 'crime', 1, 'Тайник', 'Принесите на склад две находки с улицы. Вопросов никто не задаст.', ['deliver', 'oddity', 2, 'plant'], { money: 150, items: 2, perf: 10 }, 5),
    C('crime_scout', 'crime', 3, 'Разведка', 'Посидите в участке пару часов и послушайте, о чём там говорят.', ['visit', 'police', 2], { perf: 20 }, 3),
    C('crime_fit', 'crime', 4, 'Форма для дела', 'Чтобы уходить от погони, нужен спорт 6.', ['skill', 'athletic', 6], { money: 400, perf: 15 }, 7),
    C('crime_gem', 'crime', 5, 'Камень для босса', 'Боссу нужен красивый камень. Найдите и принесите на склад.', ['deliver', 'gem', 1, 'plant'], { money: 400, items: 2, perf: 15 }, 6),
    C('crime_crypt', 'crime', 7, 'Встреча у склепа', 'Встреча в склепе, два часа ожидания. Опоздаете, ищите другую работу.', ['visit', 'crypt', 2], { money: 900, perf: 20 }, 3),
    C('cook_fish', 'culinary', 1, 'Рыба для кухни', 'Повар просит три свежие рыбы к ужину.', ['deliver', 'fish', 3, 'bistro'], { money: 100, items: 1, perf: 10 }, 6),
    C('cook_veg', 'culinary', 2, 'Свои овощи', 'Бистро хочет готовить из местного урожая. Нужны четыре плода с грядки.', ['deliver', 'produce', 4, 'bistro'], { money: 100, items: 1, perf: 10 }, 6),
    C('cook_exam', 'culinary', 3, 'Экзамен на разряд', 'Комиссия ждёт готовку 5. Время есть, но немного.', ['skill', 'cooking', 5], { money: 300, perf: 15 }, 7),
    C('cook_diner', 'culinary', 4, 'Подмена в закусочной', 'Повар закусочной заболел. Отстойте за него три часа.', ['visit', 'diner', 3], { money: 450, perf: 10 }, 2),
    C('cook_menu', 'culinary', 5, 'Новое меню', 'Отработайте новое меню дома: три обеда.', ['act', 'cook_meal', 3], { perf: 15, skill: ['cooking', 120] }, 4),
    C('cook_critic', 'culinary', 7, 'Критик в городе', 'В городе ресторанный критик. Найдите его и поговорите дважды.', ['talk', 'stranger', 2], { money: 700, perf: 20 }, 4),
    C('news_park', 'journalism', 1, 'Заметка о парке', 'Проведите в парке два часа и запишите всё, что видите.', ['place', 'park', 2], { money: 150, perf: 10 }, 3),
    C('news_interview', 'journalism', 2, 'Интервью', 'Возьмите интервью: три разговора с одним горожанином.', ['talk', 'stranger', 3], { perf: 15, skill: ['writing', 60] }, 4),
    C('news_column', 'journalism', 3, 'Своя колонка', 'Колонку дадут, когда письмо дойдёт до 5.', ['skill', 'writing', 5], { money: 350, perf: 10 }, 7),
    C('news_hospital', 'journalism', 4, 'Репортаж из больницы', 'Редакция ждёт репортаж из больницы. Нужно провести там два часа.', ['visit', 'hospital', 2], { money: 400, perf: 15 }, 3),
    C('news_serial', 'journalism', 5, 'Роман с продолжением', 'Газета печатает главы. Посидите над рукописью два вечера.', ['act', 'write_novel', 2], { money: 500, perf: 15 }, 6),
    C('news_mayor', 'journalism', 7, 'Интервью с властью', 'Поговорите дважды с кем-нибудь из ратуши.', ['talk', 'politics', 2], { money: 900, perf: 20 }, 4),
    C('police_patrol', 'police', 1, 'Патруль в парке', 'Три часа в парке, и чтобы всё было спокойно.', ['place', 'park', 3], { perf: 15 }, 3),
    C('police_run', 'police', 2, 'Норматив по бегу', 'Сдайте норматив: спорт 3.', ['skill', 'athletic', 3], { money: 200, perf: 10 }, 6),
    C('police_witness', 'police', 3, 'Свидетель', 'Найдите свидетеля и расспросите его дважды.', ['talk', 'stranger', 2], { perf: 15 }, 4),
    C('police_course', 'police', 4, 'Курс следователя', 'Следователю нужна логика 5.', ['skill', 'logic', 5], { money: 400, perf: 10 }, 7),
    C('police_evidence', 'police', 5, 'Улика', 'На улицах полно мелочей. Принесите в участок любую находку.', ['deliver', 'oddity', 1, 'police'], { money: 300, perf: 15 }, 5),
    C('police_crypt', 'police', 7, 'Ночная проверка', 'Говорят, в склепе кто-то бывает по ночам. Проведите там два часа.', ['visit', 'crypt', 2], { money: 700, perf: 20 }, 3),
    C('med_shift', 'medical', 1, 'Лишнее дежурство', 'В больнице не хватает рук. Нужны два часа сверх смены.', ['visit', 'hospital', 2], { money: 200, perf: 10 }, 3),
    C('med_anatomy', 'medical', 2, 'Анатомия по ночам', 'К аттестации нужна логика 4.', ['skill', 'logic', 4], { perf: 15 }, 7),
    C('med_fruit', 'medical', 3, 'Витамины для палаты', 'Больнице нужны свежие плоды. Принесите три.', ['deliver', 'produce', 3, 'hospital'], { money: 100, items: 1, perf: 10 }, 6),
    C('med_house', 'medical', 4, 'Осмотры на дому', 'Осмотрите двоих: дома или прямо на улице.', ['soc', 'heal', 2], { money: 300, perf: 15 }, 5),
    C('med_lab', 'medical', 5, 'Анализы', 'Отвезите анализы в лабораторию и дождитесь ответа: два часа.', ['visit', 'lab', 2], { money: 450, perf: 15 }, 3),
    C('med_council', 'medical', 8, 'Консилиум', 'Соберите коллег: три разговора с одним из них.', ['talk', 'coworker', 3], { money: 800, perf: 20 }, 4),
    C('mil_run', 'military', 1, 'Утренний кросс', 'Три пробежки до конца недели.', ['act', 'jog', 3], { perf: 10, skill: ['athletic', 60] }, 5),
    C('mil_tech', 'military', 2, 'Ремонт техники', 'Технику чинят сами: нужен ремонт 3.', ['skill', 'handiness', 3], { money: 250, perf: 10 }, 7),
    C('mil_show', 'military', 3, 'Показательные выступления', 'Покажите строевую на стадионе: два часа.', ['visit', 'stadium', 2], { money: 300, perf: 15 }, 3),
    C('mil_hands', 'military', 4, 'Руки помнят', 'Почините две сломанные вещи.', ['act', 'repair', 2], { perf: 15 }, 6),
    C('mil_salute', 'military', 5, 'Честь мундира', 'Отдайте честь трём горожанам.', ['soc', 'salute', 3], { perf: 15 }, 4),
    C('mil_hall', 'military', 7, 'Совещание в ратуше', 'Генералы и мэр ждут доклада: два часа в ратуше.', ['visit', 'cityhall', 2], { money: 800, perf: 20 }, 3),
    C('music_street', 'music', 1, 'Улица как сцена', 'Сыграйте на улице за чаевые два раза.', ['act', 'guitar_tips', 2], { money: 150, perf: 10 }, 5),
    C('music_scales', 'music', 2, 'Гаммы', 'Дирижёр ждёт гитару 4.', ['skill', 'guitar', 4], { perf: 15 }, 7),
    C('music_home', 'music', 3, 'Домашний концерт', 'Сыграйте песню для семьи дважды.', ['act', 'guitar_song', 2], { perf: 10, mood: 'goodNews' }, 4),
    C('music_spa', 'music', 4, 'Музыка в спа', 'Спа просит живую музыку на два часа.', ['visit', 'spa', 2], { money: 400, perf: 10 }, 3),
    C('music_anthem', 'music', 6, 'Гимн перед матчем', 'Стадион ждёт гимн: два часа с распевкой.', ['visit', 'stadium', 2], { money: 700, perf: 15 }, 3),
    C('music_fan', 'music', 8, 'Поклонник', 'Поклонник пишет письма. Найдите и поговорите с ним дважды.', ['talk', 'stranger', 2], { money: 500, perf: 20 }, 4),
    C('pol_leaflets', 'politics', 1, 'Листовки', 'Раздайте листовки: познакомьтесь с тремя горожанами.', ['meet', 3], { perf: 10 }, 4),
    C('pol_mirror', 'politics', 2, 'Речь у зеркала', 'Отрепетируйте речь: обаяние 4.', ['skill', 'charisma', 4], { money: 250, perf: 10 }, 7),
    C('pol_park', 'politics', 3, 'Встреча с избирателями', 'Два часа в парке, улыбка и рукопожатия.', ['place', 'park', 2], { perf: 15 }, 3),
    C('pol_friends', 'politics', 4, 'Поддержка друзей', 'Кандидату нужны четыре друга.', ['friends', 4], { money: 400, perf: 15 }, 7),
    C('pol_campaign', 'politics', 5, 'Агитация', 'Агитируйте за программу: три разговора.', ['soc', 'campaign', 3], { perf: 15 }, 4),
    C('pol_debate', 'politics', 7, 'Дебаты в театре', 'Дебаты в театре: два часа на сцене.', ['visit', 'theatre', 2], { money: 900, perf: 20 }, 3),
    C('sport_bag', 'sports', 1, 'Сила удара', 'Три тренировки на груше.', ['act', 'punchbag_hit', 3], { perf: 10 }, 4),
    C('sport_cross', 'sports', 2, 'Кросс по городу', 'Три пробежки по городу.', ['act', 'jog', 3], { perf: 10, skill: ['athletic', 60] }, 5),
    C('sport_med', 'sports', 3, 'Медкомиссия', 'Медкомиссия ждёт спорт 5.', ['skill', 'athletic', 5], { money: 300, perf: 10 }, 7),
    C('sport_school', 'sports', 4, 'Урок физкультуры', 'Проведите урок в школе: два часа.', ['visit', 'school', 2], { money: 350, perf: 15 }, 3),
    C('sport_fans', 'sports', 5, 'Автографы', 'Распишитесь трём болельщикам.', ['soc', 'autograph', 3], { perf: 15 }, 4),
    C('sport_spa', 'sports', 7, 'Восстановление', 'Тренер велит отдохнуть в спа два часа.', ['visit', 'spa', 2], { perf: 20, mood: 'goodNews' }, 3),
    C('sci_rocks', 'science', 1, 'Образцы камней', 'Лаборатории нужны два камня.', ['deliver', 'gem', 2, 'lab'], { money: 100, items: 1, perf: 10 }, 6),
    C('sci_bugs', 'science', 2, 'Жуки для коллекции', 'Принесите в лабораторию двух жуков.', ['deliver', 'bug', 2, 'lab'], { money: 100, items: 1, perf: 10 }, 6),
    C('sci_thesis', 'science', 3, 'Диссертация', 'Диссертацию примут при логике 5.', ['skill', 'logic', 5], { money: 350, perf: 10 }, 7),
    C('sci_fish', 'science', 4, 'Рыба для опытов', 'Нужны две рыбы для опытов.', ['deliver', 'fish', 2, 'lab'], { money: 100, items: 1, perf: 10 }, 6),
    C('sci_home', 'science', 5, 'Опыты на дому', 'Проведите два опыта дома.', ['act', 'sci_experiment', 2], { perf: 15, skill: ['logic', 60] }, 5),
    C('sci_meteor', 'science', 6, 'Небесный камень', 'Найдите космический камень и принесите в лабораторию.', ['deliver', 'space', 1, 'lab'], { money: 300, items: 1, perf: 15 }, 8),
    K('sk_cook_lunch', 'cooking', 2, 'Обед для соседей', 'Соседи устали от бутербродов. Приготовьте два обеда.', ['act', 'cook_meal', 2], { money: 150 }, 4),
    K('sk_cook_diner', 'cooking', 4, 'Повар на подмену', 'Закусочной нужен повар на два часа.', ['visit', 'diner', 2], { money: 300 }, 3),
    K('sk_cook_master', 'cooking', 5, 'Мастер-класс', 'Мастер-класс дадут при готовке 7.', ['skill', 'cooking', 7], { money: 400 }, 8),
    K('sk_cook_fruit', 'cooking', 7, 'Плоды для шефа', 'Шеф бистро ищет три плода получше.', ['deliver', 'produce', 3, 'bistro', 2], { items: 1 }, 6),
    K('sk_ath_run', 'athletic', 1, 'Бег по утрам', 'Две пробежки, и сосед проспорит пари.', ['act', 'jog', 2], { money: 100 }, 4),
    K('sk_ath_stadium', 'athletic', 3, 'Помощь на стадионе', 'Стадиону нужны крепкие руки на два часа.', ['visit', 'stadium', 2], { money: 250 }, 3),
    K('sk_ath_bag', 'athletic', 5, 'Спарринг', 'Четыре тренировки на груше.', ['act', 'punchbag_hit', 4], { money: 300 }, 4),
    K('sk_ath_marathon', 'athletic', 7, 'Марафон', 'На марафон берут со спортом 9.', ['skill', 'athletic', 9], { money: 600 }, 10),
    K('sk_logic_club', 'logic', 2, 'Шахматный клуб', 'Сыграйте три партии.', ['act', 'chess_play', 3], { money: 150 }, 4),
    K('sk_logic_mail', 'logic', 4, 'Задачи по почте', 'Решите три задачи за деньги.', ['act', 'solve_problems', 3], { money: 250 }, 5),
    K('sk_logic_lab', 'logic', 6, 'Консультация', 'Лаборатория просит помочь с расчётами: два часа.', ['visit', 'lab', 2], { money: 400 }, 3),
    K('sk_logic_prize', 'logic', 8, 'Задача века', 'Премию дадут за логику 10.', ['skill', 'logic', 10], { money: 1000 }, 12),
    K('sk_charm_faces', 'charisma', 1, 'Новые лица', 'Познакомьтесь с двумя горожанами.', ['meet', 2], { money: 100 }, 3),
    K('sk_charm_toast', 'charisma', 3, 'Тост на свадьбе', 'Отрепетируйте тост у зеркала три раза.', ['act', 'mirror_speech', 3], { money: 200 }, 4),
    K('sk_charm_hall', 'charisma', 5, 'Голос ратуши', 'Ратуше нужен ведущий на два часа.', ['visit', 'cityhall', 2], { money: 400 }, 3),
    K('sk_charm_soul', 'charisma', 7, 'Душа компании', 'Заведите шестерых друзей.', ['friends', 6], { money: 600 }, 10),
    K('sk_fish_bistro', 'fishing', 1, 'Улов для бистро', 'Бистро возьмёт две рыбы.', ['deliver', 'fish', 2, 'bistro'], { items: 1 }, 5),
    K('sk_fish_diner', 'fishing', 3, 'Улов для закусочной', 'Закусочной нужны три рыбы.', ['deliver', 'fish', 3, 'diner'], { items: 1 }, 6),
    K('sk_fish_pond', 'fishing', 5, 'Рыбный день', 'Поймайте пять рыб.', ['bump', 'fishCaught', 5], { money: 300 }, 4),
    K('sk_fish_rare', 'fishing', 7, 'Редкий экземпляр', 'Лаборатории нужна рыба отличного качества.', ['deliver', 'fish', 1, 'lab', 3], { items: 1 }, 7),
    K('sk_garden_shop', 'gardening', 1, 'Урожай для магазина', 'Магазин возьмёт три плода.', ['deliver', 'produce', 3, 'shop'], { items: 1 }, 6),
    K('sk_garden_hospital', 'gardening', 3, 'Плоды для больницы', 'Больнице нужны три плода.', ['deliver', 'produce', 3, 'hospital'], { items: 1 }, 6),
    K('sk_garden_harvest', 'gardening', 5, 'Большой урожай', 'Соберите урожай три раза.', ['act', 'garden_harvest', 3], { money: 300 }, 7),
    K('sk_garden_best', 'gardening', 7, 'Лучшее с грядки', 'Бистро ищет два плода отличного качества.', ['deliver', 'produce', 2, 'bistro', 3], { items: 1 }, 7),
    K('sk_guitar_lesson', 'guitar', 1, 'Урок для соседки', 'Порепетируйте два раза, чтобы было что показать.', ['act', 'guitar_play', 2], { money: 100 }, 4),
    K('sk_guitar_tips', 'guitar', 3, 'Чаевые', 'Сыграйте за чаевые дважды.', ['act', 'guitar_tips', 2], { money: 250 }, 5),
    K('sk_guitar_theatre', 'guitar', 5, 'Подмена в оркестре', 'Театру нужен гитарист на два часа.', ['visit', 'theatre', 2], { money: 400 }, 3),
    K('sk_guitar_songs', 'guitar', 7, 'Три песни', 'Сыграйте три песни для семьи.', ['act', 'guitar_song', 3], { money: 600 }, 5),
    K('sk_hand_fix', 'handiness', 1, 'Почините что-нибудь', 'Соседка спрашивает, умеете ли вы чинить. Почините любую вещь.', ['act', 'repair', 1], { money: 100 }, 5),
    K('sk_hand_upgrade', 'handiness', 3, 'Улучшение', 'Улучшите любую вещь.', ['act', 'upgrade', 1], { money: 250 }, 5),
    K('sk_hand_base', 'handiness', 5, 'Ремонт на базе', 'База просит помочь с техникой: два часа.', ['visit', 'base', 2], { money: 400 }, 3),
    K('sk_hand_three', 'handiness', 7, 'Мастер на все руки', 'Почините три вещи.', ['act', 'repair', 3], { money: 600 }, 7),
    K('sk_paint_two', 'painting', 1, 'Этюды', 'Напишите два этюда.', ['act', 'easel_paint', 2], { money: 100 }, 4),
    K('sk_paint_stage', 'painting', 3, 'Декорация', 'Театру нужна картина для сцены.', ['deliver', 'painting', 1, 'theatre'], { items: 1 }, 7),
    K('sk_paint_hall', 'painting', 5, 'Картина для ратуши', 'Ратуша купит картину для холла.', ['deliver', 'painting', 1, 'cityhall'], { items: 1 }, 7),
    K('sk_paint_ward', 'painting', 7, 'Картина для палаты', 'Больница просит картину для детской палаты.', ['deliver', 'painting', 1, 'hospital'], { items: 1, mood: 'goodNews' }, 7),
    K('sk_write_start', 'writing', 1, 'Первая глава', 'Посидите над рукописью.', ['act', 'write_novel', 1], { money: 100 }, 4),
    K('sk_write_office', 'writing', 3, 'Рукопись в редакцию', 'Редакция примет рукопись.', ['deliver', 'manuscript', 1, 'office'], { money: 400 }, 10),
    K('sk_write_three', 'writing', 5, 'Три вечера за столом', 'Три вечера над рукописью.', ['act', 'write_novel', 3], { money: 400 }, 7),
    K('sk_write_books', 'writing', 7, 'Книга для лавки', 'Книжная лавка ждёт рукопись.', ['deliver', 'manuscript', 1, 'books'], { money: 800 }, 12),
    X('sp_club', 'school', 0, 'Школьный кружок', 'Кружок рисования ждёт после уроков: два часа в школе.', ['visit', 'school', 2], { mood: 'goodNews', skill: ['painting', 60] }, 3),
    X('sp_homework', 'school', 0, 'Уроки на отлично', 'Учитель обещает похвалу за трое сделанных уроков.', ['act', 'homework', 3], { grade: 10, mood: 'goodNews' }, 5),
    X('sp_cat', 'child', 0, 'Пропал кот', 'Соседи потеряли кота. Поищите в парке хотя бы час.', ['place', 'park', 1], { money: 100, mood: 'goodNews' }, 3),
    X('sp_beach', 'child', 0, 'Чистый пляж', 'Город просит помочь с уборкой пляжа: два часа.', ['place', 'beach', 2], { money: 150 }, 4),
    X('sp_neighbor', 'teen', 0, 'Сосед просит помочь', 'У соседа сломалась вещь. Покажите, что умеете: почините что-нибудь.', ['act', 'repair', 1], { money: 120 }, 5),
    X('sp_committee', 'adult', 0, 'Комитет-2000', 'Городской комитет готовит праздник к 2000 году. Нужны два часа в ратуше.', ['visit', 'cityhall', 2], { money: 300, mood: 'goodNews' }, 4),
    X('sp_reading', 'teen', 0, 'Вечер в книжной', 'Книжная лавка зовёт на чтения: час внутри.', ['visit', 'books', 1], { skill: ['writing', 60] }, 3),
    X('sp_donor', 'adult', 0, 'Донор', 'Больница просит сдать кровь. Это быстро.', ['visit', 'hospital', 1], { money: 100, mood: 'goodNews' }, 4),
    X('sp_project', 'school', 0, 'Проект по рисованию', 'Учитель ждёт картину для школьной выставки. Принесите её в школу.', ['deliver', 'painting', 1, 'school'], { grade: 10, mood: 'goodNews' }, 7),
    X('sp_butterflies', 'child', 0, 'Бабочки для музея', 'Лаборатория собирает бабочек. Принесите двух.', ['deliver', 'butterfly', 2, 'lab'], { items: 1 }, 7),
    X('sp_meteor', 'teen', 0, 'Падающая звезда', 'Ночью упала звезда. Найдите космический камень и принесите в лабораторию.', ['deliver', 'space', 1, 'lab'], { money: 200, items: 1 }, 7),
    X('sp_party', 'adult', 0, 'Праздник на всю улицу', 'Соседи ждут вечеринку. Устройте её.', ['bump', 'parties', 1], { money: 200, mood: 'goodNews' }, 5),
    X('sp_ghost', 'adult', 0, 'Вернуть к жизни', 'Учёные лаборатории ищут способ вернуть призрака. Нужна помощь.', ['visit', 'lab', 3], { money: 1000 }, 7, 18),
    X('sp_toddler', 'adult', 0, 'Первые слова', 'Соседский малыш учится говорить. Помогите.', ['act', 'toybox_play', 3], { mood: 'goodNews' }, 5, 17)
  ];

  S.OPPS = {};
  for (const [id, kind, key, level, title, text, goal, reward, days, stage] of ROWS) S.OPPS[id] = { id, kind, key, level, title, text, goal, reward, days, stage: stage || 16 };
  const NOW = 16;

  S.ADS.biz_calls = { id: 'biz_calls', name: 'Обзвонить клиентов', icon: 'phone', age: 'adult', player: true, job: ['business', 6], steps: [{ here: true, clip: 'phone', mins: 30, gain: { social: 10 }, career: 6 }] };
  S.ADS.mil_drill = { id: 'mil_drill', name: 'Строевая подготовка', icon: 'punch', age: 'adult', player: true, job: ['military', 2], steps: [{ here: true, clip: 'exercise', mins: 30, gain: { fun: 4 }, career: 4 }] };
  S.ADS.music_concert = { id: 'music_concert', name: 'Дать концерт', icon: 'guitar', age: 'adult', player: true, job: ['music', 5], steps: [{ here: true, clip: 'guitar', mins: 60, loop: 'music', gain: { fun: 20 }, career: 6, earn: [20, 15, 'guitar'] }] };
  S.ADS.pol_fund = { id: 'pol_fund', name: 'Собрать пожертвования', icon: 'phone', age: 'adult', player: true, job: ['politics', 6], steps: [{ here: true, clip: 'phone', mins: 30, career: 5, earn: [50, 30, 'charisma'] }] };
  S.ADS.sport_train = { id: 'sport_train', name: 'Провести тренировку', icon: 'punch', age: 'adult', player: true, job: ['sports', 2], steps: [{ here: true, clip: 'exercise', mins: 40, gain: { fun: 6 }, career: 4 }] };
  S.ADS.sci_experiment = { id: 'sci_experiment', obj: 'computer', name: 'Провести опыт', icon: 'question', age: 'adult', player: true, job: ['science', 3], steps: [{ pose: 'sit', clip: 'type', mins: 45, loop: 'keys', career: 5 }] };
  S.ADS.news_report = { id: 'news_report', obj: 'computer', name: 'Написать репортаж', icon: 'scroll', age: 'adult', player: true, job: ['journalism', 5], steps: [{ pose: 'sit', clip: 'type', mins: 60, loop: 'keys', career: 6, earn: [0, 40, 'job'] }] };
  S.ADS.solve_problems = { id: 'solve_problems', obj: 'computer', name: 'Решить задачу за деньги', icon: 'question', age: 'teen', player: true, steps: [{ pose: 'sit', clip: 'type', mins: 30, loop: 'keys', earn: [10, 8, 'logic'], problem: true }] };
  S.ADS.sci_study = { id: 'sci_study', name: 'Изучить находку', icon: 'gem', age: 'adult', player: true, job: ['science', 6], steps: [{ here: true, clip: 'read', standClip: 'readStand', mins: 20, study: true }] };
  S.OBJECTS.computer.ads.push('sci_experiment', 'news_report', 'solve_problems');
  Object.assign(S.Skills.SOURCES, { mil_drill: ['athletic', 1.2, 0], sport_train: ['athletic', 1.5, 0], sci_experiment: ['logic', 1, 0], news_report: ['writing', 0.8, 0], solve_problems: ['logic', 0.8, 0], biz_calls: ['charisma', 0.8, 0], pol_fund: ['charisma', 0.8, 0], music_concert: ['guitar', 1, 0] });
  const SELF = ['biz_calls', 'mil_drill', 'music_concert', 'pol_fund', 'sport_train'];
  const STUDIED = new Set(['gem', 'metal', 'space']);

  const JOKES = [
    'Горожанин три часа искал очки, пока не заглянул в зеркало.', 'В Лайм-Харборе нашли лайм, который не кислый. Учёные в растерянности.',
    'Почтальон просит не держать злых собак. И добрых тоже, они лижут конверты.', 'Опрос: девять из десяти жителей уверены, что десятый не отвечал.',
    'Склад сообщает: пропажа ящика с замками. Замки тоже пропали.', 'Мэр обещал асфальт к 2000 году. Уточнил, что про 2000 год он не шутил.',
    'Повар бистро признался: секретный ингредиент называется «соль».', 'На стадионе болельщик кричал так громко, что выиграла соседняя команда.',
    'Лаборатория открыла новый элемент. Пока он прячется под диваном.', 'Театр ставит пьесу без слов. Суфлёр получил отпуск.',
    'Житель Модемной Террасы купил компьютер мощнее соседского. Сосед купил два.', 'Рыбак поймал рыбу размером с весло. Весло так и не нашлось.',
    'Школьники выиграли спор у учителя: ноль на ноль делить нельзя, даже очень хочется.', 'Горничная навела такой порядок, что хозяин не нашёл свой дом.',
    'Вор ушёл без добычи: все вещи оказались привинчены к полу.', 'Гадалка из Тихих Рядов предсказала дождь. Потом вспомнила про зонт.'
  ];

  const now = world => world.day * DAY + world.clock;
  const rngOf = world => {
    const o = S.Opps.of(world);
    return o.rng;
  };
  const span = (rng, [a, b]) => a + Math.floor(S.roll(rng) * (b - a + 1));
  const lotById = (world, id) => world.lots.find(l => l.id === id) || null;
  const memoOf = sim => (sim.wish ? sim.wish.memo : null);
  const memoAct = (sim, key) => {
    const m = memoOf(sim);
    if (!m) return 0;
    if (key === 'jog') return m.go.jog || 0;
    return m.acts[key] || 0;
  };
  const memoSoc = (sim, key) => {
    const m = memoOf(sim);
    return m && m.soc ? m.soc[key] || 0 : 0;
  };
  const ageOk = (sim, key) => (key === 'school' ? !!sim.school : key === 'child' ? S.AGE_RANK[sim.age] >= S.AGE_RANK.child : key === 'teen' ? S.AGE_RANK[sim.age] >= S.AGE_RANK.teen : S.AGE_RANK[sim.age] >= S.AGE_RANK.adult);
  const fresh = seed => ({ rng: { rs: (seed * 40503 + 211) >>> 0 }, next: DAY + CALL_FROM + 120, offer: null, active: [], cool: {} });

  S.News = {
    KEEP: NEWS_KEEP, JOKES,

    list: world => world.news || (world.news = []),

    add(world, text) {
      const list = S.News.list(world);
      if (list.some(n => n.text === text && n.day === world.day)) return false;
      list.push({ day: world.day, text });
      if (list.length > NEWS_KEEP) list.splice(0, list.length - NEWS_KEEP);
      return true;
    },

    paper(world, day) {
      const d = day || world.day, rng = { rs: (d * 2654435761 + (world.seed || 1) * 97) >>> 0 }, list = S.News.list(world).filter(n => n.day >= d - 3 && n.day <= d).slice(-5).reverse();
      const jobs = Object.values(S.CAREERS).concat(Object.values(S.PART_TIME)), vacancies = [];
      while (vacancies.length < 3) {
        const def = jobs.splice(Math.floor(S.roll(rng) * jobs.length), 1)[0];
        const lot = lotById(world, def.lot);
        vacancies.push({ job: def.id, title: S.Jobs.titleAt(def, 1, null, 0), name: def.name, pay: S.Jobs.payAt(def, 1), place: lot ? lot.name : '', hours: S.Jobs.hoursText(def) });
      }
      const ids = Object.keys(S.Econ.COUPONS), coupons = [];
      while (coupons.length < 2) coupons.push(ids.splice(Math.floor(S.roll(rng) * ids.length), 1)[0]);
      const book = (world.books || []).slice(-1)[0], review = book && book.title ? S.News.review(book) : null;
      return { day: d, news: list, vacancies, coupons, joke: JOKES[(d + (world.seed || 1)) % JOKES.length], review };
    },

    review(book) {
      const r = book.r || 0, words = r >= 400 ? 'Лучшее, что выходило в городе за год. Рецензент читал до утра.' : r >= 150 ? 'Крепкая книга. Пара глав затянута, но финал того стоит.' : 'Первая книга, и это видно. Но автор явно знает, куда идёт.';
      return { title: book.title, text: words };
    }
  };

  S.Opps = {
    NOW, ROWS, SELF, PAY, OFFER_LIFE, COOL_DAYS,

    of: world => world.opps || (world.opps = fresh(world.seed || 1)),

    def: id => S.OPPS[id],

    eligible(world, sim, row) {
      if (row.stage > NOW || !sim.needs) return false;
      if (row.kind === 'career' && !(sim.job && sim.job.id === row.key && sim.job.level >= row.level)) return false;
      if (row.kind === 'skill' && !(S.Skills.can(sim, row.key) && S.Skills.level(sim, row.key) >= row.level && S.AGE_RANK[sim.age] >= S.AGE_RANK.teen)) return false;
      if (row.kind === 'special' && !ageOk(sim, row.key)) return false;
      const g = row.goal;
      if ((g[0] === 'visit' || g[0] === 'place') && !lotById(world, g[1])) return false;
      if (g[0] === 'deliver' && !lotById(world, g[3])) return false;
      if (g[0] === 'skill' && S.Skills.level(sim, g[1]) >= g[2]) return false;
      if (g[0] === 'perf' && sim.job && sim.job.perf >= g[1]) return false;
      if (g[0] === 'friends' && S.Rel.friends(world, sim) >= g[1]) return false;
      if ((g[0] === 'talk' || g[0] === 'friend') && !S.Opps.targetFor(world, sim, g[1])) return false;
      if (g[0] === 'act' && S.ADS[g[1]] && !S.adAllowed(S.ADS[g[1]], sim.age, sim) && g[1] !== 'repair') return false;
      if (g[0] === 'act' && (g[1] === 'guitar_tips' || g[1] === 'guitar_song' || g[1] === 'guitar_play') && !(sim.bag && sim.bag.some(it => it.k === 'guitar'))) return false;
      return true;
    },

    targetFor(world, sim, role) {
      if (role === 'boss') return sim.job ? S.Jobs.boss(world, sim, sim.job) : null;
      const pool = world.sims.filter(o => o.free && !o.duty && !world.family.includes(o) && S.AGE_RANK[o.age] >= S.AGE_RANK.teen);
      const list = role === 'coworker' ? (sim.job ? S.Jobs.coworkers(world, sim, sim.job).filter(o => o.free) : []) : role === 'politics' ? pool.filter(o => o.work && o.work.id === 'politics') : pool;
      if (!list.length) return null;
      return list[(world.day * 31 + world.sims.indexOf(sim)) % list.length];
    },

    kindOf: row => row.kind,

    pick(world, sim, kinds) {
      const o = S.Opps.of(world), t = now(world), mine = o.active.filter(a => a.sim === world.sims.indexOf(sim)).map(a => S.OPPS[a.id].kind);
      const rows = Object.values(S.OPPS).filter(r => (!kinds || kinds.includes(r.kind)) && !mine.includes(r.kind) && !(o.cool[r.id] > t) && S.Opps.eligible(world, sim, r));
      if (!rows.length) return null;
      const career = rows.filter(r => r.kind === 'career');
      const list = career.length && S.roll(o.rng) < 0.6 ? career : rows;
      return list[Math.floor(S.roll(o.rng) * list.length)];
    },

    offer(world, sim, row, at) {
      const o = S.Opps.of(world);
      o.offer = { id: row.id, sim: world.sims.indexOf(sim), at: now(world), work: at ? 1 : 0 };
      world.events.push({ type: 'opp', sim: sim.id, offer: row.id, text: (at ? 'На работе предлагают: ' : 'Звонок: ') + row.title + ' (' + sim.name + ')' });
      return o.offer;
    },

    workOffer(world, sim) {
      const o = S.Opps.of(world);
      if (o.offer || S.roll(o.rng) >= WORK_OFFER) return null;
      const row = S.Opps.pick(world, sim, ['career']);
      return row ? S.Opps.offer(world, sim, row, true) : null;
    },

    accept(world) {
      const o = S.Opps.of(world), offer = o.offer;
      if (!offer) return null;
      o.offer = null;
      const sim = world.sims[offer.sim], row = S.OPPS[offer.id];
      if (!sim || !world.family.includes(sim) || !S.Opps.eligible(world, sim, row)) return null;
      const g = row.goal, target = g[0] === 'talk' || g[0] === 'friend' ? S.Opps.targetFor(world, sim, g[1]) : null;
      const a = { id: row.id, sim: offer.sim, at: now(world), until: now(world) + row.days * DAY, target: target ? world.sims.indexOf(target) : -1, base: 0, have: 0 };
      if (g[0] === 'meet') a.base = memoSoc(sim, '#met');
      if (g[0] === 'act') a.base = memoAct(sim, g[1]);
      if (g[0] === 'soc') a.base = memoSoc(sim, g[1]);
      if (g[0] === 'bump') a.base = memoSoc(sim, '#' + g[1]);
      o.active.push(a);
      world.events.push({ type: 'opp', sim: sim.id, accepted: true, text: 'Взято задание: «' + row.title + '», срок ' + row.days + ' дн. (' + sim.name + ')' });
      return a;
    },

    decline(world) {
      const o = S.Opps.of(world);
      if (!o.offer) return false;
      o.cool[o.offer.id] = now(world) + COOL_DAYS * DAY;
      o.offer = null;
      return true;
    },

    drop(world, a) {
      const o = S.Opps.of(world);
      o.active = o.active.filter(x => x !== a);
      o.cool[a.id] = now(world) + COOL_DAYS * DAY;
      const sim = world.sims[a.sim];
      world.events.push({ type: 'opp', sim: sim ? sim.id : '', text: 'Задание отменено: «' + S.OPPS[a.id].title + '»' });
    },

    activeOf(world, sim) {
      const i = world.sims.indexOf(sim);
      return S.Opps.of(world).active.filter(a => a.sim === i);
    },

    progress(world, a) {
      const sim = world.sims[a.sim], row = S.OPPS[a.id], g = row.goal, target = a.target >= 0 ? world.sims[a.target] : null;
      switch (g[0]) {
        case 'perf': return [sim.job && sim.job.id === row.key ? Math.floor(sim.job.perf) : 0, g[1]];
        case 'visit': case 'place': return [Math.floor(a.have), g[2] * 60];
        case 'skill': return [S.Skills.level(sim, g[1]), g[2]];
        case 'meet': return [memoSoc(sim, '#met') - a.base, g[1]];
        case 'talk': return [a.have, g[2]];
        case 'friend': return [target && S.Rel.value(world, sim, target) >= S.Rel.FRIEND ? 1 : 0, 1];
        case 'friends': return [S.Rel.friends(world, sim), g[1]];
        case 'act': return [memoAct(sim, g[1]) - a.base, g[2]];
        case 'soc': return [memoSoc(sim, g[1]) - a.base, g[2]];
        case 'bump': return [memoSoc(sim, '#' + g[1]) - a.base, g[2]];
        case 'deliver': return [a.have, g[2]];
        default: return [0, 1];
      }
    },

    progressText(world, a) {
      const [have, need] = S.Opps.progress(world, a), g = S.OPPS[a.id].goal;
      if (g[0] === 'visit' || g[0] === 'place') return S.Moods.timeText(Math.min(have, need)) + ' из ' + S.Moods.timeText(need);
      if (g[0] === 'perf' || g[0] === 'skill') return 'сейчас ' + have + ', нужно ' + need;
      if (g[0] === 'friend') return have ? 'дружба есть' : 'пока не друзья';
      return Math.min(have, need) + ' из ' + need;
    },

    rewardText(row) {
      const r = row.reward, parts = [];
      if (r.money) parts.push('§' + r.money);
      if (r.items) parts.push('оплата за вещи');
      if (r.perf) parts.push('+' + r.perf + ' к работе');
      if (r.skill) parts.push(S.SKILLS[r.skill[0]].name.toLowerCase());
      if (r.grade) parts.push('+' + r.grade + ' к оценке');
      if (r.mood && !parts.length) parts.push('хорошее настроение');
      return parts.join(', ');
    },

    lotOf(world, a) {
      const g = S.OPPS[a.id].goal;
      if (g[0] === 'visit' || g[0] === 'place') return lotById(world, g[1]);
      if (g[0] === 'deliver') return lotById(world, g[3]);
      return null;
    },

    busyInside(world, sim) {
      if (!sim.inside) return false;
      return S.Opps.activeOf(world, sim).some(a => {
        const g = S.OPPS[a.id].goal;
        return g[0] === 'visit' && g[1] === sim.inside.id && a.have < g[2] * 60;
      });
    },

    status(world, sim) {
      if (!sim.inside) return null;
      const a = S.Opps.activeOf(world, sim).find(x => {
        const g = S.OPPS[x.id].goal;
        return g[0] === 'visit' && g[1] === sim.inside.id && x.have < g[2] * 60;
      });
      if (!a) return null;
      const g = S.OPPS[a.id].goal, left = Math.max(0, g[2] * 60 - a.have);
      return { opp: a, school: false, place: sim.inside, left, tone: null, tones: null, inside: world.sims.filter(o => o !== sim && o.inside === sim.inside && S.Rel.get(world, sim, o) && (S.Rel.get(world, sim, o).f & S.Rel.F.met)), text: sim.name + ': «' + S.OPPS[a.id].title + '», ещё ' + S.Moods.timeText(Math.ceil(left)) };
    },

    lotMenu(world, sim, goal) {
      const out = [];
      for (const a of S.Opps.activeOf(world, sim)) {
        const row = S.OPPS[a.id], g = row.goal;
        if (g[0] === 'visit' && g[1] === goal.enter.id) out.push({ label: 'Задание: ' + row.title, go: goal });
        if (g[0] === 'deliver' && g[3] === goal.enter.id) {
          const n = S.Opps.deliverable(sim, a).length;
          out.push({ label: 'Сдать: ' + row.title + ' (' + Math.min(n, g[2] - a.have) + ' из ' + (g[2] - a.have) + ')', go: goal, deliver: a.id, closed: n ? null : 'Нужных вещей в инвентаре нет' });
        }
      }
      return out;
    },

    deliverable(sim, a) {
      const g = S.OPPS[a.id].goal, minQ = g[4] || 0;
      return (sim.bag || []).map((it, i) => [it, i]).filter(([it]) => it.k === g[1] && (it.q || 0) >= minQ);
    },

    deliver(world, sim, id) {
      const a = S.Opps.activeOf(world, sim).find(x => x.id === id);
      if (!a) return 0;
      const row = S.OPPS[id], g = row.goal, need = g[2] - a.have, list = S.Opps.deliverable(sim, a).slice(0, need);
      let value = 0;
      for (const [it] of list.slice().reverse()) {
        value += S.Econ.value(world, sim, it);
        sim.bag.splice(sim.bag.indexOf(it), 1);
      }
      a.have += list.length;
      a.paid = (a.paid || 0) + Math.round(value * (PAY[g[1]] || 1));
      world.events.push({ type: 'opp', sim: sim.id, text: 'Сдано для «' + row.title + '»: ' + list.length + ' из ' + need });
      return list.length;
    },

    lineDone(world, a, b, row, win) {
      for (const x of S.Opps.activeOf(world, a)) if (S.OPPS[x.id].goal[0] === 'talk' && x.target === world.sims.indexOf(b) && win) x.have++;
      if (!win) return;
      if (row.job && a.job && a.job.id === row.job) a.job.perf = Math.min(100, a.job.perf + (row.perf || 3));
      if (row.id === 'borrow') S.Econ.earn(world, 50 + Math.floor(S.roll(rngOf(world)) * 101), a.name + ' занимает у ' + b.name, a);
      if (row.id === 'pickpocket') S.Econ.earn(world, 10 + Math.floor(S.roll(rngOf(world)) * 51), a.name + ': карманы ' + b.name + ' стали легче', a);
      if (row.id === 'arrest' && b.duty && b.duty.kind === 'burglar') {
        S.Services.arrest(world, a, b);
        if (a.wish) S.Wishes.bump(a, 'catchThief');
      }
      if (row.id === 'heal' && b.needs) b.needs.energy = Math.min(100, b.needs.energy + 15);
      if (row.id === 'teach_guitar' && b.skill) S.Skills.practice(world, b, 'guitar', 1, 30);
      if (row.id === 'cooking_tip' && b.skill) S.Skills.practice(world, b, 'cooking', 1, 20);
    },

    careerDone(world, sim, act, step) {
      if (step.career && sim.job) sim.job.perf = Math.min(100, sim.job.perf + step.career);
      if (step.earn) {
        const [base, per, from] = step.earn, level = from === 'job' ? (sim.job ? sim.job.level : 0) : S.Skills.level(sim, from);
        S.Econ.earn(world, base + per * level, sim.name + ': ' + S.ADS[act.ad].name.toLowerCase() + ', +§' + (base + per * level), sim);
      }
      if (step.problem && sim.skill) S.Skills.stat(world, sim, 'problems', 1);
      if (step.study && act.bagIndex >= 0 && sim.bag[act.bagIndex] && STUDIED.has(sim.bag[act.bagIndex].k)) {
        const it = sim.bag[act.bagIndex];
        if (!(it.x && it.x.studied)) {
          it.v = Math.round(it.v * STUDY);
          it.x = Object.assign({}, it.x || {}, { studied: 1 });
          world.events.push({ type: 'money', amount: 0, sim: sim.id, text: sim.name + ': находка изучена, теперь стоит §' + it.v });
        }
      }
    },

    selfMenu(world, sim) {
      const out = [];
      for (const id of SELF) {
        const ad = S.ADS[id];
        if (!S.adAllowed(ad, sim.age, sim)) continue;
        out.push({ label: ad.name, ad: id, closed: id === 'music_concert' && !(sim.bag && sim.bag.some(it => it.k === 'guitar')) ? 'Нужна гитара в инвентаре' : null });
      }
      return out;
    },

    itemMenu(world, sim, it, index) {
      if (!STUDIED.has(it.k) || !S.adAllowed(S.ADS.sci_study, sim.age, sim)) return [];
      return [{ label: 'Изучить находку', ad: 'sci_study', bagIndex: index, closed: it.x && it.x.studied ? 'Уже изучено' : null }];
    },

    finish(world, a) {
      const sim = world.sims[a.sim], row = S.OPPS[a.id], r = row.reward, o = S.Opps.of(world);
      o.active = o.active.filter(x => x !== a);
      o.cool[a.id] = now(world) + COOL_DAYS * DAY;
      const money = Math.round(((r.money || 0) + (r.items ? a.paid || 0 : 0)) * (sim.rewards && sim.rewards.includes('chanceCatcher') ? CATCHER_PAY : 1));
      if (money) S.Econ.earn(world, money, sim.name + ': награда за «' + row.title + '» +§' + money, sim);
      if (r.perf && sim.job && (row.kind !== 'career' || sim.job.id === row.key)) sim.job.perf = Math.min(100, sim.job.perf + r.perf);
      if (r.skill) S.Skills.practice(world, sim, r.skill[0], 1, r.skill[1]);
      if (r.grade && sim.school) sim.school.grade = Math.min(100, sim.school.grade + r.grade);
      S.Moods.add(sim, r.mood || 'goodNews', 0, world);
      if (sim.wish) {
        S.Wishes.bump(sim, 'opportunity');
        S.Wishes.bump(sim, 'opp_' + row.id);
      }
      if (sim.skill) S.Skills.stat(world, sim, 'opportunities', 1);
      world.events.push({ type: 'opp', sim: sim.id, done: true, text: 'Задание выполнено: «' + row.title + '» (' + sim.name + ')' + (money ? ', +§' + money : '') });
      S.News.add(world, sim.name + (sim.surname ? ' ' + sim.surname : '') + ' справляется с заданием «' + row.title + '».');
    },

    fail(world, a) {
      const sim = world.sims[a.sim], row = S.OPPS[a.id], o = S.Opps.of(world);
      o.active = o.active.filter(x => x !== a);
      o.cool[a.id] = now(world) + COOL_DAYS * DAY;
      if (row.kind === 'career' && sim.job && sim.job.id === row.key) sim.job.perf = Math.max(0, sim.job.perf - FAIL_PERF);
      const target = a.target >= 0 ? world.sims[a.target] : null;
      if (target && S.Rel.get(world, sim, target)) S.Rel.get(world, sim, target).v -= FAIL_REL;
      world.events.push({ type: 'opp', sim: sim.id, failed: true, text: 'Срок вышел: «' + row.title + '» (' + sim.name + ')' + (row.kind === 'career' ? ', производительность −' + FAIL_PERF : '') });
    },

    luck(world) {
      const o = S.Opps.of(world);
      for (const sim of world.family) {
        if (!sim.needs || sim.inside || sim.car || sim.lot === sim.home || S.roll(o.rng) >= (S.Traits.has(sim, 'lucky') ? LUCK : LUCK_ANY)) continue;
        const sum = span(o.rng, LUCK_SUM);
        S.Econ.earn(world, sum, sim.name + ': на дороге нашлись деньги, +§' + sum, sim);
        S.Moods.add(sim, 'foundIt', 0, world);
        if (sim.wish) S.Wishes.bump(sim, 'wallet');
      }
    },

    step(world, dt) {
      const o = S.Opps.of(world), t = now(world);
      if (Math.floor(world.clock / 60) !== Math.floor((world.clock - dt + DAY) % DAY / 60)) S.Opps.luck(world);
      if (o.offer && t > o.offer.at + OFFER_LIFE) o.offer = null;
      if (t >= o.next) {
        const catcher = world.family.some(s => s.rewards && s.rewards.includes('chanceCatcher'));
        o.next = (world.day + span(o.rng, catcher ? CATCHER_GAP : CALL_GAP)) * DAY + CALL_FROM + Math.floor(S.roll(o.rng) * (CALL_TO - CALL_FROM));
        if (!o.offer) {
          const people = world.family.filter(s => s.needs && S.AGE_RANK[s.age] >= S.AGE_RANK.child);
          for (let i = 0; i < people.length; i++) {
            const sim = people[(i + Math.floor(S.roll(o.rng) * people.length)) % people.length], row = S.Opps.pick(world, sim);
            if (row) {
              S.Opps.offer(world, sim, row, false);
              break;
            }
          }
        }
      }
      for (const a of o.active.slice()) {
        const sim = world.sims[a.sim], row = S.OPPS[a.id], g = row.goal;
        if (!sim || !world.family.includes(sim)) {
          o.active = o.active.filter(x => x !== a);
          continue;
        }
        if (g[0] === 'visit' && sim.inside && sim.inside.id === g[1]) a.have += dt;
        if (g[0] === 'place' && ((sim.lot && sim.lot.id === g[1]) || (sim.inside && sim.inside.id === g[1]))) a.have += dt;
        const [have, need] = S.Opps.progress(world, a);
        if (have >= need) S.Opps.finish(world, a);
        else if (t > a.until) S.Opps.fail(world, a);
      }
    },

    pack(world) {
      const o = S.Opps.of(world);
      return [o.rng.rs, o.next, o.offer && [o.offer.id, o.offer.sim, o.offer.at, o.offer.work], o.active.map(a => [a.id, a.sim, a.at, a.until, a.target, a.base, a.have, a.paid || 0]), Object.entries(o.cool), (world.news || []).map(n => [n.day, n.text])];
    },

    unpack(world, r) {
      if (r === null || r === undefined) return null;
      if (!Array.isArray(r) || r.length !== 6 || !Number.isFinite(r[0]) || !Array.isArray(r[3])) throw new Error('повреждены возможности');
      for (const a of r[3]) if (!Array.isArray(a) || !S.OPPS[a[0]] || !world.sims[a[1]]) throw new Error('неизвестная возможность в файле');
      if (r[2] && !S.OPPS[r[2][0]]) throw new Error('неизвестная возможность в файле');
      return r;
    },

    apply(world, r) {
      world.opps = fresh(world.seed || 1);
      world.news = [];
      if (!r) return;
      const o = world.opps;
      o.rng.rs = r[0];
      o.next = r[1];
      o.offer = r[2] ? { id: r[2][0], sim: r[2][1], at: r[2][2], work: r[2][3] } : null;
      o.active = r[3].map(([id, sim, at, until, target, base, have, paid]) => ({ id, sim, at, until, target, base, have, paid }));
      o.cool = Object.fromEntries(r[4]);
      world.news = r[5].map(([day, text]) => ({ day, text }));
    }
  };
})(globalThis.Sims98 = globalThis.Sims98 || {});
