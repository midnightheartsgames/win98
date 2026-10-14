(function (S) {
  'use strict';
  const WD = [1, 1, 1, 1, 1, 0, 0];
  const L = (t, pay, start, hours, req) => ({ t, pay, start, hours, req: req || {} });

  const CAREERS = {
    business: {
      name: 'Бизнес', icon: 'c_business', place: 'business', days: WD, skills: ['charisma', 'logic'],
      tone: { name: 'Изучать рынок', skill: 'logic' }, outfit: { top: 'jacket', c: '#4a4e5a', bottom: 'pants', b: '#34363e' },
      desc: 'Путь от почтового отдела до кресла председателя совета директоров. Нужны обаяние и логика.',
      levels: [L('Почтовый служащий', 16, 9, 6), L('Секретарь', 20, 9, 6), L('Офис-менеджер', 26, 9, 6, { charisma: 2 }), L('Помощник руководителя', 35, 9, 7, { charisma: 3 }), L('Менеджер среднего звена', 48, 9, 7, { charisma: 4, logic: 2 }),
        L('Региональный менеджер', 65, 9, 7, { charisma: 5, logic: 3 }), L('Вице-президент', 90, 9, 8, { charisma: 6, logic: 4 }), L('Президент компании', 125, 9, 8, { charisma: 7, logic: 5 }), L('Генеральный директор', 170, 10, 7, { charisma: 8, logic: 6 }), L('Председатель совета директоров', 230, 10, 6, { charisma: 9, logic: 7 })]
    },
    criminal: {
      name: 'Криминал', icon: 'c_criminal', place: 'warehouse', days: [0, 1, 1, 1, 1, 1, 0], skills: ['athletic', 'charisma'],
      tone: { name: 'Тренировать ловкость', skill: 'athletic' }, outfit: { top: 'tshirt', c: '#1c1c20', bottom: 'jeans', b: '#26262c' },
      desc: 'Тёмные делишки по вечерам. На шестом уровне нужно выбрать: путь зла или путь вора.',
      levels: [L('Стоящий на шухере', 14, 18, 6), L('Подручный', 18, 18, 6), L('Водитель для побегов', 23, 18, 6, { athletic: 2 }), L('Посыльный', 30, 18, 6, { athletic: 3 }), L('Медвежатник', 40, 19, 6, { athletic: 4, charisma: 2 })],
      branchAt: 6,
      branches: {
        evil: { name: 'Путь зла', levels: [L('Злодей-стажёр', 55, 19, 6, { charisma: 3 }), L('Злобный гений', 75, 19, 6, { charisma: 4, logic: 3 }), L('Главарь банды', 100, 20, 6, { charisma: 5, logic: 5 }), L('Серый кардинал', 140, 20, 5, { charisma: 7, logic: 6 }), L('Властелин преступного мира', 200, 21, 5, { charisma: 8, logic: 8 })] },
        thief: { name: 'Путь вора', levels: [L('Карманник-виртуоз', 52, 19, 6, { athletic: 5 }), L('Взломщик', 72, 19, 6, { athletic: 6 }), L('Похититель драгоценностей', 98, 20, 6, { athletic: 7, handiness: 3 }), L('Неуловимый вор', 135, 20, 5, { athletic: 8, handiness: 5 }), L('Король воров', 190, 21, 5, { athletic: 9, handiness: 6 })] }
      }
    },
    culinary: {
      name: 'Кулинария', icon: 'c_culinary', place: 'bistro', days: [0, 0, 1, 1, 1, 1, 1], skills: ['cooking'],
      tone: { name: 'Учиться у шефа', skill: 'cooking' }, outfit: { top: 'shirt', c: '#f4f4f0', bottom: 'pants', b: '#2a2a30' },
      desc: 'Кухня бистро «Корсика». Вечерние смены и много кулинарии.',
      levels: [L('Посудомойщик', 13, 15, 6), L('Помощник повара', 17, 15, 6, { cooking: 1 }), L('Официант', 22, 15, 6, { cooking: 2 }), L('Повар', 29, 15, 6, { cooking: 3 }), L('Метрдотель', 38, 15, 6, { cooking: 4 }),
        L('Су-шеф', 50, 15, 7, { cooking: 5 }), L('Шеф-повар', 68, 15, 7, { cooking: 6 }), L('Шеф ресторана', 92, 15, 7, { cooking: 7, charisma: 2 }), L('Звёздный шеф', 125, 16, 6, { cooking: 8, charisma: 3 }), L('Легенда кулинарии', 170, 16, 6, { cooking: 10, charisma: 4 })]
    },
    journalism: {
      name: 'Журналистика', icon: 'c_journalism', place: 'newspaper', days: WD, skills: ['writing', 'charisma'],
      tone: { name: 'Писать статьи', skill: 'writing' }, outfit: { top: 'shirt', c: '#d8e0ec', bottom: 'pants', b: '#3a4050' },
      desc: 'Газета «Вестник Сансет Вэлли». Пишите, общайтесь, берите интервью.',
      levels: [L('Разносчик газет', 13, 9, 6), L('Составитель объявлений', 17, 9, 6, { writing: 1 }), L('Автор некрологов', 22, 9, 6, { writing: 2 }), L('Младший репортёр', 29, 9, 6, { writing: 3 }), L('Штатный корреспондент', 38, 9, 7, { writing: 4, charisma: 2 }),
        L('Колумнист', 50, 9, 7, { writing: 5, charisma: 3 }), L('Обозреватель', 66, 9, 7, { writing: 6, charisma: 4 }), L('Главный редактор', 88, 9, 7, { writing: 7, charisma: 5 }), L('Ведущий новостей', 118, 10, 6, { writing: 8, charisma: 6 }), L('Звезда телеэфира', 160, 10, 6, { writing: 9, charisma: 8 })]
    },
    law: {
      name: 'Полиция', icon: 'c_law', place: 'police', days: WD, skills: ['athletic', 'logic'],
      tone: { name: 'Разбирать дела', skill: 'logic' }, outfit: { top: 'shirt', c: '#2a3c7a', bottom: 'pants', b: '#1c2448' },
      desc: 'Охрана порядка в Сансет Вэлли. На шестом уровне: спецагент или криминалист.',
      levels: [L('Регулировщик', 14, 8, 6), L('Охранник', 18, 8, 6, { athletic: 1 }), L('Курсант', 24, 8, 7, { athletic: 2 }), L('Патрульный', 31, 8, 7, { athletic: 3, logic: 1 }), L('Детектив', 41, 8, 7, { athletic: 4, logic: 2 })],
      branchAt: 6,
      branches: {
        agent: { name: 'Спецагент', levels: [L('Агент под прикрытием', 56, 8, 7, { athletic: 5, logic: 3 }), L('Спецагент', 76, 8, 7, { athletic: 6, logic: 4 }), L('Старший агент', 102, 9, 7, { athletic: 7, logic: 5 }), L('Директор бюро', 138, 9, 6, { athletic: 8, logic: 6 }), L('Международный супершпион', 185, 9, 6, { athletic: 9, logic: 7 })] },
        forensic: { name: 'Криминалистика', levels: [L('Лаборант-криминалист', 54, 9, 7, { logic: 4 }), L('Эксперт-криминалист', 73, 9, 7, { logic: 5 }), L('Судмедэксперт', 98, 9, 7, { logic: 6, athletic: 3 }), L('Начальник лаборатории', 132, 9, 6, { logic: 8, athletic: 4 }), L('Главный криминалист', 178, 9, 6, { logic: 9, athletic: 5 })] }
      }
    },
    medical: {
      name: 'Медицина', icon: 'c_medical', place: 'hospital', days: WD, skills: ['logic'],
      tone: { name: 'Читать медицинские журналы', skill: 'logic' }, outfit: { top: 'shirt', c: '#8ac8b0', bottom: 'pants', b: '#8ac8b0' },
      desc: 'Больница Сансет Вэлли. Долгий путь от санитара до главврача.',
      levels: [L('Санитар', 15, 8, 6), L('Медбрат', 19, 8, 7), L('Интерн', 25, 8, 7, { logic: 2 }), L('Ординатор', 33, 8, 8, { logic: 3 }), L('Врач общей практики', 45, 8, 8, { logic: 4 }),
        L('Хирург-стажёр', 60, 8, 8, { logic: 5 }), L('Хирург', 82, 8, 8, { logic: 6, handiness: 2 }), L('Заведующий отделением', 110, 9, 8, { logic: 7, handiness: 3, charisma: 2 }), L('Главный хирург', 150, 9, 7, { logic: 8, handiness: 4, charisma: 3 }), L('Главврач', 210, 9, 7, { logic: 10, handiness: 5, charisma: 4 })]
    },
    military: {
      name: 'Армия', icon: 'c_military', place: 'military', days: WD, skills: ['athletic', 'handiness'],
      tone: { name: 'Строевая подготовка', skill: 'athletic' }, outfit: { top: 'shirt', c: '#4a5a34', bottom: 'pants', b: '#3a4628' },
      desc: 'База «Форт Старч». На шестом уровне: командование или полёты в космос.',
      levels: [L('Новобранец', 15, 7, 7), L('Рядовой', 19, 7, 7, { athletic: 1 }), L('Капрал', 25, 7, 7, { athletic: 2, handiness: 1 }), L('Сержант', 32, 7, 7, { athletic: 3, handiness: 2 }), L('Лейтенант', 42, 7, 7, { athletic: 4, handiness: 3 })],
      branchAt: 6,
      branches: {
        officer: { name: 'Офицер', levels: [L('Капитан', 58, 7, 7, { athletic: 5, charisma: 2 }), L('Майор', 78, 7, 7, { athletic: 6, charisma: 3 }), L('Полковник', 104, 8, 7, { athletic: 7, charisma: 4 }), L('Генерал', 140, 8, 6, { athletic: 8, charisma: 6 }), L('Генерал армии', 190, 8, 6, { athletic: 9, charisma: 7 })] },
        astro: { name: 'Космонавт', levels: [L('Лётчик-испытатель', 60, 7, 7, { logic: 3, athletic: 5 }), L('Кандидат в космонавты', 82, 7, 7, { logic: 4, athletic: 6 }), L('Космонавт-исследователь', 108, 8, 7, { logic: 6, athletic: 7 }), L('Командир экипажа', 145, 8, 6, { logic: 7, athletic: 8 }), L('Космонавт', 200, 8, 6, { logic: 9, athletic: 9 })] }
      }
    },
    music: {
      name: 'Музыка', icon: 'c_music', place: 'theater', days: [0, 1, 1, 1, 1, 1, 0], skills: ['guitar'],
      tone: { name: 'Репетировать', skill: 'guitar' }, outfit: { top: 'tshirt', c: '#2a2a2a', bottom: 'jeans', b: '#2c3a5a' },
      desc: 'Театр Сансет Вэлли. На шестом уровне: рок-сцена или симфонический оркестр.',
      levels: [L('Рабочий сцены', 12, 13, 6), L('Билетёр', 16, 13, 6, { guitar: 1 }), L('Аккомпаниатор', 21, 13, 6, { guitar: 2 }), L('Студийный музыкант', 28, 14, 6, { guitar: 3 }), L('Сессионный гитарист', 37, 14, 6, { guitar: 4, charisma: 1 })],
      branchAt: 6,
      branches: {
        rock: { name: 'Рок-звезда', levels: [L('Гитарист в группе', 52, 16, 6, { guitar: 5, charisma: 2 }), L('Лидер группы', 72, 16, 6, { guitar: 6, charisma: 3 }), L('Рок-звезда', 98, 17, 6, { guitar: 7, charisma: 4 }), L('Рок-идол', 135, 17, 5, { guitar: 8, charisma: 5 }), L('Легенда рока', 185, 18, 5, { guitar: 10, charisma: 6 })] },
        symph: { name: 'Симфоническая музыка', levels: [L('Оркестрант', 50, 14, 6, { guitar: 5, logic: 2 }), L('Концертмейстер', 70, 14, 6, { guitar: 6, logic: 3 }), L('Дирижёр', 96, 15, 6, { guitar: 7, logic: 4 }), L('Композитор', 132, 15, 5, { guitar: 8, logic: 5 }), L('Маэстро', 180, 15, 5, { guitar: 10, logic: 6 })] }
      }
    },
    political: {
      name: 'Политика', icon: 'c_political', place: 'cityhall', days: WD, skills: ['charisma', 'logic'],
      tone: { name: 'Готовить речи', skill: 'charisma' }, outfit: { top: 'jacket', c: '#26324a', bottom: 'pants', b: '#1c2436' },
      desc: 'Ратуша Сансет Вэлли. Здесь решают судьбу города, а может, и мира.',
      levels: [L('Волонтёр предвыборного штаба', 14, 9, 6), L('Стажёр в ратуше', 18, 9, 6, { charisma: 1 }), L('Помощник депутата', 24, 9, 7, { charisma: 2 }), L('Спичрайтер', 31, 9, 7, { charisma: 3, logic: 1 }), L('Член горсовета', 41, 9, 7, { charisma: 4, logic: 2 }),
        L('Заместитель мэра', 55, 9, 7, { charisma: 5, logic: 3 }), L('Мэр', 74, 9, 7, { charisma: 6, logic: 4 }), L('Губернатор', 100, 10, 7, { charisma: 7, logic: 5 }), L('Вице-президент', 136, 10, 6, { charisma: 8, logic: 6 }), L('Лидер свободного мира', 190, 10, 6, { charisma: 10, logic: 7 })]
    },
    science: {
      name: 'Наука', icon: 'c_science', place: 'science', days: WD, skills: ['logic', 'gardening'],
      tone: { name: 'Ставить опыты', skill: 'logic' }, outfit: { top: 'shirt', c: '#f0f0f0', bottom: 'pants', b: '#50566a' },
      desc: 'Научный центр Ландграаба. Логика, опыты и немного садоводства.',
      levels: [L('Мойщик пробирок', 13, 9, 6), L('Лаборант', 17, 9, 6, { logic: 1 }), L('Младший научный сотрудник', 23, 9, 7, { logic: 2, gardening: 1 }), L('Научный сотрудник', 30, 9, 7, { logic: 3, gardening: 2 }), L('Старший научный сотрудник', 40, 9, 7, { logic: 4, gardening: 3 }),
        L('Ведущий исследователь', 54, 9, 7, { logic: 5, gardening: 4 }), L('Руководитель проекта', 72, 9, 7, { logic: 6, gardening: 5 }), L('Профессор', 96, 10, 7, { logic: 7, gardening: 6 }), L('Академик', 130, 10, 6, { logic: 8, gardening: 7 }), L('Гениальный учёный', 180, 10, 6, { logic: 10, gardening: 8 })]
    },
    sports: {
      name: 'Спорт', icon: 'c_sports', place: 'stadium', days: [1, 1, 1, 1, 1, 0, 0], skills: ['athletic'],
      tone: { name: 'Тренироваться', skill: 'athletic' }, outfit: { top: 'tshirt', c: '#c83a2a', bottom: 'shorts', b: '#f0f0f0' },
      desc: 'Команда «Ламы» на городском стадионе. Всё решает атлетика.',
      levels: [L('Водонос', 12, 8, 6), L('Талисман команды', 16, 8, 6, { athletic: 1 }), L('Запасной игрок', 22, 8, 6, { athletic: 2 }), L('Игрок молодёжки', 29, 8, 6, { athletic: 3 }), L('Игрок основы', 39, 8, 6, { athletic: 4 }),
        L('Звезда команды', 53, 8, 6, { athletic: 5 }), L('Капитан команды', 72, 8, 6, { athletic: 6, charisma: 2 }), L('Лучший игрок лиги', 98, 9, 6, { athletic: 7, charisma: 3 }), L('Чемпион', 132, 9, 5, { athletic: 8, charisma: 4 }), L('Суперзвезда спорта', 185, 9, 5, { athletic: 10, charisma: 5 })]
    }
  };
  const CAREER_KEYS = Object.keys(CAREERS);

  const PART_TIME = {
    pt_book: { name: 'Книжный магазин', icon: 'c_book', place: 'bookstore', days: WD, levels: [L('Продавец-консультант', 10, 16, 4), L('Старший продавец', 13, 16, 4), L('Администратор зала', 17, 16, 4)] },
    pt_grocery: { name: 'Супермаркет', icon: 'c_grocery', place: 'grocery', days: WD, levels: [L('Упаковщик', 9, 16, 4), L('Кассир', 12, 16, 4), L('Старший кассир', 16, 16, 4)] },
    pt_spa: { name: 'Спа-салон', icon: 'c_spa', place: 'spa', days: [0, 0, 1, 1, 1, 1, 1], levels: [L('Администратор', 10, 15, 4), L('Помощник массажиста', 13, 15, 4), L('Косметолог', 17, 15, 4)] }
  };

  const SCHOOL = {
    place: 'school', days: WD,
    child: { start: 8, hours: 6 },
    teen: { start: 8, hours: 7 },
    grades: ['F', 'D', 'C', 'B', 'A', 'A+']
  };

  const WORK_TONES = {
    normal: { name: 'Работать как обычно', perf: 1, fun: 1, energy: 1 },
    hard: { name: 'Работать усердно', perf: 1.6, fun: 1.6, energy: 1.5 },
    easy: { name: 'Халтурить', perf: 0.25, fun: 0.5, energy: 0.6 },
    coworkers: { name: 'Общаться с коллегами', perf: 0.7, fun: 0.8, energy: 1, social: true },
    boss: { name: 'Подлизываться к начальнику', perf: 0.9, fun: 1.1, energy: 1, boss: true },
    skill: { name: 'Повышать навык', perf: 0.6, fun: 1, energy: 1.1, skill: true }
  };

  const O = (name, desc, src, goal, reward, hours) => ({ name, desc, src, goal, reward, hours });
  const OPPORTUNITIES = {
    culinary_dish: O('Особый заказ', 'Шеф ждёт блюдо отличного качества. Приготовьте его дома в течение двух дней.', { career: 'culinary' }, { k: 'cook', q: 4 }, { perf: 30, money: 150 }, 48),
    science_sample: O('Образцы для лаборатории', 'Лаборатории нужен свежий улов. Поймайте любую рыбу.', { career: 'science' }, { k: 'fish' }, { perf: 30, money: 180 }, 48),
    science_garden: O('Опытная грядка', 'Соберите урожай для исследований.', { career: 'science', level: 3 }, { k: 'harvest' }, { perf: 35, money: 220 }, 96),
    journal_interview: O('Интервью с жителем', 'Познакомьтесь и поговорите с тремя новыми людьми.', { career: 'journalism' }, { k: 'meet', n: 3 }, { perf: 30, money: 160 }, 48),
    journal_book: O('Рецензия', 'Прочитайте книгу и напишите о ней.', { career: 'journalism', level: 3 }, { k: 'act', a: 'read', n: 1 }, { perf: 25, money: 140 }, 48),
    political_campaign: O('Сбор голосов', 'Проведите дружеские беседы с пятью разными жителями.', { career: 'political' }, { k: 'social', cat: 'friendly', n: 5 }, { perf: 30, money: 250 }, 48),
    political_speech: O('Речь перед избирателями', 'Отрепетируйте речь перед зеркалом.', { career: 'political', level: 2 }, { k: 'act', a: 'practice_speech', n: 1 }, { perf: 25, money: 120 }, 24),
    medical_checkup: O('Врачебный осмотр', 'Поговорите о здоровье с тремя жителями.', { career: 'medical' }, { k: 'social', cat: 'friendly', n: 3 }, { perf: 30, money: 200 }, 48),
    music_gig: O('Уличный концерт', 'Сыграйте на гитаре в общественном месте.', { career: 'music' }, { k: 'guitar_public', n: 1 }, { perf: 35, money: 180 }, 48),
    business_dinner: O('Деловая встреча', 'Подружитесь с коллегой или начальником.', { career: 'business' }, { k: 'social', cat: 'friendly', n: 4 }, { perf: 30, money: 300 }, 48),
    law_patrol: O('Патрулирование', 'Посетите центральный парк и пляж.', { career: 'law' }, { k: 'visit_set', lots: ['park', 'beach'] }, { perf: 30, money: 200 }, 48),
    military_run: O('Марш-бросок', 'Пробегите трусцой два часа.', { career: 'military' }, { k: 'jog_min', n: 120 }, { perf: 35, money: 180 }, 48),
    sports_training: O('Дополнительная тренировка', 'Потренируйтесь три часа.', { career: 'sports' }, { k: 'workout_min', n: 180 }, { perf: 35, money: 160 }, 48),
    criminal_swipe: O('Тёмное дельце', 'Стащите что-нибудь у соседей.', { career: 'criminal' }, { k: 'act', a: 'swipe', n: 1 }, { perf: 35, money: 250 }, 48),
    cooking_contest: O('Кулинарный конкурс', 'Бистро ищет таланты. Приготовьте великолепное блюдо.', { skill: 'cooking', level: 4 }, { k: 'cook', q: 5 }, { money: 500 }, 72),
    painting_order: O('Картина для ратуши', 'Мэрия заказала картину хорошего качества.', { skill: 'painting', level: 3 }, { k: 'paint', q: 3 }, { money: 450 }, 72),
    writing_story: O('Рассказ для газеты', 'Газете нужна новая книга. Напишите любую.', { skill: 'writing', level: 2 }, { k: 'write' }, { money: 400 }, 96),
    guitar_party: O('Музыка для праздника', 'Сыграйте на гитаре два часа.', { skill: 'guitar', level: 3 }, { k: 'guitar_min', n: 120 }, { money: 350 }, 48),
    logic_tournament: O('Шахматный турнир', 'Выиграйте три партии в шахматы.', { skill: 'logic', level: 3 }, { k: 'chess', n: 3 }, { money: 400 }, 72),
    fishing_order: O('Заказ из бистро', 'Бистро нужен свежий лосось.', { skill: 'fishing', level: 6 }, { k: 'fish', f: 'salmon' }, { money: 600 }, 72),
    gardening_order: O('Урожай для рынка', 'Соберите три урожая.', { skill: 'gardening', level: 2 }, { k: 'harvest', n: 3 }, { money: 350 }, 96),
    athletic_race: O('Благотворительный забег', 'Пробегите трусцой три часа.', { skill: 'athletic', level: 3 }, { k: 'jog_min', n: 180 }, { money: 300 }, 72),
    charisma_opening: O('Открытие библиотеки', 'Познакомьтесь с четырьмя жителями.', { skill: 'charisma', level: 3 }, { k: 'meet', n: 4 }, { money: 300 }, 72),
    handiness_neighbor: O('Соседу нужна помощь', 'Почините два сломанных предмета.', { skill: 'handiness', level: 2 }, { k: 'repair', n: 2 }, { money: 350 }, 96)
  };

  Object.assign(S, { CAREERS, CAREER_KEYS, PART_TIME, SCHOOL, WORK_TONES, OPPORTUNITIES });
  if (typeof module !== 'undefined' && module.exports) module.exports = S;
})(globalThis.Sims3 = globalThis.Sims3 || {});
