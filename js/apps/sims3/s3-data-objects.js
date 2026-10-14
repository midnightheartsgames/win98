(function (S) {
  'use strict';
  const O = (name, price, size, func, rooms, o) => Object.assign({ name, price, size, func, rooms, place: 'floor', acts: [], env: 0, col: ['#8a6a4a', '#d8d0c0'] }, o || {});
  const WOOD = ['#8a5a32', '#b88a58', '#5a3a22', '#d8b890', '#3a2418', '#f0e8dc'];
  const FAB = ['#b83a3a', '#3a6ab8', '#4a8a4a', '#d8c8a0', '#6a4a8a', '#e8e0d0', '#3a3a40', '#c87a3a', '#e89ab8', '#2a8a8a'];
  const MET = ['#c8ccd4', '#3a3c44', '#f0f0f0', '#d8b860', '#8a3a3a', '#4a6a9a'];

  const OBJECTS = {
    chair_cheap: O('Стул «Ромашка»', 80, [1, 1], 'seating', ['dining', 'kitchen'], { seat: 2, acts: ['sit'], col: ['#d8c8a0', '#c83a3a'], pal: [WOOD, FAB], desc: 'Лёгкий и дешёвый стул. Сидеть можно, но недолго.' }),
    chair_wood: O('Стул «Кантри»', 220, [1, 1], 'seating', ['dining', 'kitchen'], { seat: 3, env: 1, acts: ['sit'], col: ['#8a5a32', '#b88a58'], pal: [WOOD, WOOD], desc: 'Крепкий деревянный стул в деревенском стиле.' }),
    chair_office: O('Рабочее кресло', 160, [1, 1], 'seating', ['study'], { seat: 3, acts: ['sit'], col: ['#3a3a40', '#6a6a70'], pal: [FAB, MET], desc: 'Кресло на колёсиках для долгих вечеров за компьютером.' }),
    armchair: O('Кресло «Уют»', 260, [1, 1], 'seating', ['living'], { seat: 5, acts: ['sit'], col: ['#6a8a4a', '#5a3a22'], pal: [FAB, WOOD], desc: 'Мягкое кресло для чтения и телевизора.' }),
    armchair_lux: O('Кресло «Честерфилд»', 780, [1, 1], 'seating', ['living', 'study'], { seat: 8, env: 2, acts: ['sit'], col: ['#7a2a22', '#3a2418'], pal: [FAB, WOOD], desc: 'Кожаное кресло с глубокой посадкой. Располагает к неторопливым беседам.' }),
    recliner: O('Кресло-реклайнер «Лежебока»', 560, [1, 1], 'seating', ['living'], { seat: 9, acts: ['sit', 'nap'], col: ['#8a6a4a', '#5a4030'], pal: [FAB, WOOD], desc: 'Откинуть спинку, поднять ноги и забыть обо всём.' }),
    loveseat: O('Диванчик «Двое»', 340, [2, 1], 'seating', ['living'], { seat: 4, acts: ['sit', 'nap'], col: ['#c8a868', '#6a4a2a'], pal: [FAB, WOOD], desc: 'Небольшой диван на двоих.' }),
    sofa_cheap: O('Диван «Эконом»', 420, [3, 1], 'seating', ['living'], { seat: 4, acts: ['sit', 'nap'], col: ['#6a7aa8', '#3a3a44'], pal: [FAB, WOOD], desc: 'Недорогой диван. Пружины чувствуются, но жить можно.' }),
    sofa_mid: O('Диван «Модерн»', 950, [3, 1], 'seating', ['living'], { seat: 6, env: 1, acts: ['sit', 'nap'], col: ['#d8d0c0', '#5a3a22'], pal: [FAB, WOOD], desc: 'Стильный диван с мягкими подушками.' }),
    sofa_lux: O('Диван «Бархат»', 2100, [3, 1], 'seating', ['living'], { seat: 8, env: 3, acts: ['sit', 'nap'], col: ['#6a2a5a', '#d8b860'], pal: [FAB, MET], desc: 'Бархатная обивка и позолоченные ножки. Роскошь в каждой складке.' }),
    bench_park: O('Садовая скамейка', 160, [2, 1], 'seating', ['outdoor'], { seat: 2, acts: ['sit'], col: ['#6a4a2a', '#2a3a2a'], pal: [WOOD, MET], desc: 'Скамейка для сада или парка.' }),

    bed_single: O('Кровать «Студент»', 320, [1, 2], 'beds', ['bedroom', 'kids'], { bed: 4, seat: 3, acts: ['sleep', 'nap', 'relax'], col: ['#8a5a32', '#4a6ab8'], pal: [WOOD, FAB], desc: 'Узкая и жёсткая. Зато недорогая.' }),
    bed_single_mid: O('Кровать «Сказка»', 760, [1, 2], 'beds', ['bedroom', 'kids'], { bed: 6, seat: 4, env: 1, acts: ['sleep', 'nap', 'relax'], col: ['#e8e0d0', '#e89ab8'], pal: [WOOD, FAB], desc: 'Уютная кровать для детской или гостевой.' }),
    bed_double: O('Кровать «Двуспальная»', 480, [2, 2], 'beds', ['bedroom'], { bed: 4, seat: 3, double: true, acts: ['sleep', 'nap', 'relax'], col: ['#8a5a32', '#d8d0c0'], pal: [WOOD, FAB], desc: 'Простая двуспальная кровать.' }),
    bed_double_mid: O('Кровать «Классика»', 1150, [2, 2], 'beds', ['bedroom'], { bed: 6, seat: 5, env: 1, double: true, acts: ['sleep', 'nap', 'relax'], col: ['#5a3a22', '#3a6ab8'], pal: [WOOD, FAB], desc: 'Хороший матрас, крепкий каркас.' }),
    bed_double_lux: O('Кровать «Королевская»', 3000, [2, 2], 'beds', ['bedroom'], { bed: 9, seat: 7, env: 3, double: true, acts: ['sleep', 'nap', 'relax'], col: ['#3a2418', '#b83a3a'], pal: [WOOD, FAB], desc: 'Балдахин, шёлк и сон, как у королей.' }),
    crib: O('Детская кроватка', 320, [1, 1], 'beds', ['kids'], { crib: true, acts: [], col: ['#f0e8dc', '#8ac0e8'], pal: [WOOD, FAB], desc: 'Кроватка для младенцев и малышей.' }),

    counter: O('Кухонная стойка «Пласт»', 110, [1, 1], 'surfaces', ['kitchen'], { surface: 0.9, counter: true, acts: [], col: ['#e8e4dc', '#8a5a32'], pal: [['#e8e4dc', '#c8d8e8', '#e8d8b0', '#b8c8a8'], WOOD], desc: 'Рабочая поверхность для готовки.' }),
    counter_granite: O('Стойка «Гранит»', 340, [1, 1], 'surfaces', ['kitchen'], { surface: 0.9, counter: true, env: 1, acts: [], col: ['#4a4a50', '#5a3a22'], pal: [['#4a4a50', '#8a8078', '#e8e0d8', '#6a3a2a'], WOOD], desc: 'Каменная столешница. На ней приятно резать овощи.' }),
    table_small: O('Стол «Квадрат»', 160, [1, 1], 'surfaces', ['dining', 'kitchen'], { surface: 0.75, table: true, acts: [], col: ['#b88a58', '#8a5a32'], pal: [WOOD, WOOD], desc: 'Маленький обеденный стол на двоих.' }),
    table_dining: O('Стол «Семейный»', 390, [2, 1], 'surfaces', ['dining', 'kitchen'], { surface: 0.75, table: true, acts: [], col: ['#8a5a32', '#5a3a22'], pal: [WOOD, WOOD], desc: 'Обеденный стол для всей семьи.' }),
    table_dining_lux: O('Стол «Дубовый»', 1250, [2, 1], 'surfaces', ['dining'], { surface: 0.75, table: true, env: 2, acts: [], col: ['#5a3a22', '#3a2418'], pal: [WOOD, WOOD], desc: 'Массивный дубовый стол для торжественных ужинов.' }),
    table_coffee: O('Журнальный столик', 150, [2, 1], 'surfaces', ['living'], { surface: 0.4, acts: [], col: ['#b88a58', '#8a5a32'], pal: [WOOD, WOOD], desc: 'Для журналов, пульта и чашки кофе.' }),
    table_end: O('Тумбочка', 90, [1, 1], 'surfaces', ['bedroom', 'living'], { surface: 0.6, acts: [], col: ['#8a5a32', '#d8b890'], pal: [WOOD, WOOD], desc: 'Прикроватная тумбочка. На неё удобно ставить лампу.' }),
    desk: O('Письменный стол', 270, [2, 1], 'surfaces', ['study', 'kids'], { surface: 0.75, desk: true, acts: [], col: ['#b88a58', '#8a5a32'], pal: [WOOD, WOOD], desc: 'Стол для компьютера и домашних заданий.' }),
    desk_lux: O('Стол «Директор»', 920, [2, 1], 'surfaces', ['study'], { surface: 0.75, desk: true, env: 1, acts: [], col: ['#3a2418', '#1c1410'], pal: [WOOD, WOOD], desc: 'Солидный стол для солидных решений.' }),
    dresser: O('Комод', 320, [1, 1], 'misc', ['bedroom'], { surface: 1, acts: ['change_outfit'], col: ['#8a5a32', '#d8b860'], pal: [WOOD, MET], desc: 'Здесь хранится одежда на все случаи жизни.' }),
    bookshelf: O('Книжный шкаф', 360, [1, 1], 'hobbies', ['study', 'living', 'kids'], { acts: ['read_book', 'study_skill'], skill: 'all', col: ['#8a5a32', '#5a3a22'], pal: [WOOD, WOOD], desc: 'Полки с книгами на любой вкус. Можно почитать или изучить навык.' }),
    bookshelf_lux: O('Библиотека «Классик»', 1200, [2, 1], 'hobbies', ['study', 'living'], { env: 2, acts: ['read_book', 'study_skill'], skill: 'all', col: ['#3a2418', '#d8b860'], pal: [WOOD, MET], desc: 'Высокий шкаф красного дерева с коллекционными изданиями.' }),

    fridge: O('Холодильник «Льдинка»', 620, [1, 1], 'appliances', ['kitchen'], { fridge: 1, acts: ['quick_meal', 'cook', 'leftovers', 'snack'], col: ['#f0f0ec', '#c8ccd4'], pal: [['#f0f0ec', '#e8d8b0', '#b8d8c8', '#e8b8b0'], MET], desc: 'Вмещает продукты для завтрака, обеда и ужина.' }),
    fridge_lux: O('Холодильник «Полюс-2000»', 1650, [1, 1], 'appliances', ['kitchen'], { fridge: 2, env: 1, acts: ['quick_meal', 'cook', 'leftovers', 'snack'], col: ['#c8ccd4', '#3a3c44'], pal: [MET, MET], desc: 'Двухдверный гигант. Продукты в нём свежее, а блюда вкуснее.' }),
    stove: O('Плита «Искра»', 420, [1, 1], 'appliances', ['kitchen'], { stove: 1, fire: 1, breaks: 0.015, acts: ['clean_obj', 'repair'], col: ['#f0f0ec', '#3a3a40'], pal: [['#f0f0ec', '#e8d8b0', '#3a3a40'], MET], desc: 'Газовая плита. С низким навыком кулинарии готовьте с огнетушителем наготове.' }),
    stove_lux: O('Плита «Шеф»', 1250, [1, 1], 'appliances', ['kitchen'], { stove: 2, fire: 0.5, breaks: 0.008, env: 1, acts: ['clean_obj', 'repair'], col: ['#c8ccd4', '#1c1c20'], pal: [MET, MET], desc: 'Профессиональная плита. Блюда вкуснее, пожары реже.' }),
    coffee: O('Кофеварка «Эспрессо»', 190, [1, 1], 'appliances', ['kitchen'], { place: 'surface', acts: ['make_coffee'], col: ['#3a3a40', '#c8ccd4'], pal: [MET, MET], desc: 'Чашка эспрессо прогонит сон. Ставится на столешницу.' }),
    dishwasher: O('Посудомоечная машина', 560, [1, 1], 'appliances', ['kitchen'], { surface: 0.9, counter: true, dishwasher: true, breaks: 0.01, acts: ['repair'], col: ['#e8e4dc', '#c8ccd4'], pal: [['#e8e4dc', '#c8d8e8', '#4a4a50'], MET], desc: 'Моет посуду сама. Экономит время и нервы.' }),
    sink_kitchen: O('Кухонная мойка', 300, [1, 1], 'plumbing', ['kitchen'], { surface: 0.9, counter: true, sink: true, acts: ['wash_hands'], col: ['#e8e4dc', '#c8ccd4'], pal: [['#e8e4dc', '#4a4a50', '#e8d8b0'], MET], desc: 'Мойка для посуды, встроенная в стойку.' }),
    trash_indoor: O('Мусорное ведро', 40, [1, 1], 'appliances', ['kitchen'], { trash: 8, acts: ['empty_trash'], col: ['#c8ccd4', '#3a3a40'], pal: [MET, MET], desc: 'Сюда выбрасывают объедки. Не забывайте выносить.' }),
    grill: O('Гриль «Барбекю»', 360, [1, 1], 'appliances', ['outdoor'], { grill: true, fire: 1.2, acts: ['cook_grill', 'clean_obj'], col: ['#2a2a30', '#8a3a2a'], pal: [MET, MET], desc: 'Хот-доги и гамбургеры на свежем воздухе.' }),

    toilet: O('Унитаз «Эконом»', 300, [1, 1], 'plumbing', ['bath'], { toilet: 1, breaks: 0.008, dirt: 1, acts: ['use_toilet', 'clean_obj', 'repair'], col: ['#f0f0ec', '#e0e0dc'], pal: [['#f0f0ec', '#e8d8b0', '#b8d8e8', '#e8c8d0'], MET], desc: 'Делает своё дело. Иногда засоряется.' }),
    toilet_lux: O('Унитаз «Трон»', 1100, [1, 1], 'plumbing', ['bath'], { toilet: 2, breaks: 0.005, dirt: 0.5, env: 1, acts: ['use_toilet', 'clean_obj', 'repair'], col: ['#f8f8f4', '#d8b860'], pal: [['#f8f8f4', '#1c1c20'], MET], desc: 'Позолота и подогрев сиденья. Засоряется очень редко.' }),
    shower: O('Душевая кабина', 650, [1, 1], 'plumbing', ['bath'], { shower: 1, breaks: 0.006, dirt: 1, acts: ['take_shower', 'clean_obj', 'repair'], col: ['#e8eef4', '#c8ccd4'], pal: [['#e8eef4', '#d8e8d0', '#e8d8e8'], MET], desc: 'Быстрый способ снова пахнуть приятно.' }),
    bathtub: O('Ванна «Лагуна»', 1050, [2, 1], 'plumbing', ['bath'], { tub: true, breaks: 0.01, dirt: 1, env: 1, acts: ['take_bath', 'take_shower', 'clean_obj', 'repair'], col: ['#f0f0ec', '#d8b860'], pal: [['#f0f0ec', '#b8d8e8', '#e8d8b0'], MET], desc: 'Ванна с душем. Можно понежиться в пене.' }),
    sink_bath: O('Раковина', 260, [1, 1], 'plumbing', ['bath'], { sink: true, acts: ['wash_hands', 'brush_teeth'], col: ['#f0f0ec', '#c8ccd4'], pal: [['#f0f0ec', '#e8d8b0', '#b8d8e8'], MET], desc: 'Умыться, почистить зубы, посмотреть в зеркало.' }),
    mirror: O('Зеркало', 130, [1, 1], 'decor', ['bath', 'bedroom'], { place: 'wall', acts: ['practice_speech', 'admire'], env: 1, col: ['#c8d8e8', '#b8905a'], pal: [MET, WOOD], desc: 'Перед ним можно репетировать речи и развивать обаяние.' }),

    tv_cheap: O('Телевизор «Горизонт»', 320, [1, 1], 'electronics', ['living', 'bedroom'], { tv: 3, breaks: 0.01, acts: ['watch_tv', 'tv_off', 'repair'], col: ['#6a4a2a', '#2a2a2a'], pal: [WOOD, MET], desc: 'Старенький телевизор на ножках. Показывает семь каналов.' }),
    tv_mid: O('Телевизор «Тринитрон-29»', 1200, [1, 1], 'electronics', ['living'], { tv: 6, breaks: 0.008, env: 1, acts: ['watch_tv', 'tv_off', 'repair'], col: ['#2a2a30', '#4a4a50'], pal: [MET, MET], desc: 'Большой экран и отличный звук.' }),
    tv_lux: O('Кинотеатр «Плазма 2000»', 3600, [2, 1], 'electronics', ['living'], { tv: 9, breaks: 0.005, env: 3, acts: ['watch_tv', 'tv_off', 'repair'], col: ['#1c1c20', '#c8ccd4'], pal: [MET, MET], desc: 'Плоский экран! Настоящее чудо техники нового тысячелетия.' }),
    computer: O('Компьютер «Пентагон-486»', 820, [1, 1], 'electronics', ['study'], { place: 'surface', computer: 1, breaks: 0.015, acts: ['play_games', 'surf_web', 'chat_online', 'write_novel', 'find_job', 'repair'], col: ['#e8e0cc', '#3a3a40'], pal: [MET, MET], desc: 'Игры, чат, текстовый редактор и поиск работы. Ставится на стол.' }),
    computer_lux: O('Компьютер «Мегагерц-1000»', 2200, [1, 1], 'electronics', ['study'], { place: 'surface', computer: 2, breaks: 0.006, acts: ['play_games', 'surf_web', 'chat_online', 'write_novel', 'find_job', 'repair'], col: ['#3a3a44', '#6a8ab8'], pal: [MET, MET], desc: 'Гигагерц почти настоящий. Книги пишутся быстрее, игры веселее.' }),
    stereo: O('Магнитола', 210, [1, 1], 'electronics', ['living', 'bedroom', 'kids'], { stereo: 1, acts: ['listen', 'dance', 'stereo_off'], col: ['#3a3a40', '#c8ccd4'], pal: [MET, MET], desc: 'Кассеты, радио и танцы.' }),
    stereo_lux: O('Музыкальный центр «Хай-Фай»', 920, [1, 1], 'electronics', ['living'], { stereo: 2, env: 1, acts: ['listen', 'dance', 'stereo_off'], col: ['#1c1c20', '#d8b860'], pal: [MET, MET], desc: 'Проигрыватель компакт-дисков и колонки, от которых дрожат стёкла.' }),
    alarm_smoke: O('Пожарная сигнализация', 60, [1, 1], 'electronics', ['kitchen', 'misc'], { place: 'wall', smoke: true, acts: [], col: ['#f0f0ec', '#c83a3a'], pal: [MET, MET], desc: 'Вызывает пожарных, если в комнате начался пожар.' }),
    alarm_burglar: O('Охранная сигнализация', 260, [1, 1], 'electronics', ['misc'], { place: 'wall', burglar: true, acts: [], col: ['#3a3a40', '#3ac83a'], pal: [MET, MET], desc: 'Вызывает полицию, если ночью в дом залезет грабитель.' }),

    lamp_table: O('Настольная лампа', 60, [1, 1], 'lighting', ['bedroom', 'living', 'study'], { place: 'surface', light: 3.5, acts: ['lights'], col: ['#e8d8b0', '#b8905a'], pal: [FAB, MET], desc: 'Уютный свет для чтения.' }),
    lamp_floor: O('Торшер', 140, [1, 1], 'lighting', ['living', 'bedroom'], { light: 4.5, acts: ['lights'], col: ['#f0e8d0', '#3a3a40'], pal: [FAB, MET], desc: 'Высокая лампа для гостиной.' }),
    lamp_ceiling: O('Потолочный светильник', 100, [1, 1], 'lighting', ['misc'], { place: 'ceiling', light: 5, acts: ['lights'], col: ['#f0f0e8', '#c8ccd4'], pal: [FAB, MET], desc: 'Освещает всю комнату. Висит под потолком.' }),
    lamp_wall: O('Настенное бра', 90, [1, 1], 'lighting', ['misc'], { place: 'wall', light: 3.5, acts: ['lights'], col: ['#f0d8a0', '#b8905a'], pal: [FAB, MET], desc: 'Мягкий свет на стене.' }),
    lamp_garden: O('Садовый фонарь', 130, [1, 1], 'lighting', ['outdoor'], { light: 4.5, outdoorLight: true, acts: ['lights'], col: ['#2a2a30', '#f0e0a0'], pal: [MET, FAB], desc: 'Фонарь для дорожки у дома.' }),

    plant_small: O('Фикус', 70, [1, 1], 'decor', ['living', 'misc'], { env: 1, acts: ['view_art'], col: ['#b8583a', '#3a8a3a'], pal: [['#b8583a', '#e8e0d0', '#3a3a40'], ['#3a8a3a', '#6aa84a', '#2a6a4a']], desc: 'Немного зелени в доме.' }),
    plant_big: O('Пальма в кадке', 250, [1, 1], 'decor', ['living', 'misc'], { env: 2, acts: ['view_art'], col: ['#8a5a32', '#3a8a3a'], pal: [WOOD, ['#3a8a3a', '#6aa84a']], desc: 'Большая пальма. Почти как в отпуске.' }),
    flowers: O('Ваза с цветами', 45, [1, 1], 'decor', ['dining', 'living'], { place: 'surface', env: 1, acts: [], col: ['#6a8ab8', '#e84a6a'], pal: [MET, ['#e84a6a', '#e8c832', '#f0f0f0', '#9a4ac8']], desc: 'Свежие цветы на столе.' }),
    painting_cheap: O('Репродукция «Закат»', 150, [1, 1], 'decor', ['misc'], { place: 'wall', env: 1, art: 1, acts: ['view_art'], col: ['#8a5a32', '#e8a048'], pal: [WOOD, FAB], desc: 'Недорогая репродукция в рамке.' }),
    painting_mid: O('Картина «Натюрморт»', 680, [1, 1], 'decor', ['misc'], { place: 'wall', env: 3, art: 2, acts: ['view_art'], col: ['#d8b860', '#6a3a2a'], pal: [MET, FAB], desc: 'Масло, холст, фрукты. Классика жанра.' }),
    painting_lux: O('Полотно «Сансет Вэлли»', 2600, [2, 1], 'decor', ['misc'], { place: 'wall', env: 5, art: 3, acts: ['view_art'], col: ['#d8b860', '#3a6ab8'], pal: [MET, FAB], desc: 'Большой пейзаж местного мастера. Стоит как подержанная машина.' }),
    sculpture: O('Скульптура «Порыв»', 1500, [1, 1], 'decor', ['living', 'outdoor'], { env: 4, art: 3, acts: ['view_art'], col: ['#e8e4dc', '#8a8a90'], pal: [MET, MET], desc: 'Современная скульптура. Никто не знает, что она изображает.' }),
    rug_small: O('Коврик', 120, [2, 1], 'decor', ['misc'], { place: 'rug', env: 1, acts: [], col: ['#b83a3a', '#d8c8a0'], pal: [FAB, FAB], desc: 'Небольшой ковёр для прихожей или спальни.' }),
    rug_big: O('Ковёр «Персидский»', 720, [3, 2], 'decor', ['living'], { place: 'rug', env: 2, acts: [], col: ['#7a2a22', '#d8b860'], pal: [FAB, FAB], desc: 'Узоры ручной работы.' }),
    clock_grand: O('Напольные часы', 900, [1, 1], 'decor', ['living'], { env: 3, acts: ['view_art'], col: ['#5a3a22', '#d8b860'], pal: [WOOD, MET], desc: 'Бьют каждый час. Иногда даже вовремя.' }),
    aquarium: O('Аквариум', 380, [1, 1], 'decor', ['living'], { env: 2, acts: ['watch_fish'], col: ['#3a3a40', '#6ab8e8'], pal: [MET, MET], desc: 'Рыбки успокаивают нервы.' }),
    flamingo: O('Розовый фламинго', 12, [1, 1], 'decor', ['outdoor'], { env: 0, acts: ['view_art'], col: ['#f08ab8', '#2a2a2a'], pal: [FAB, MET], desc: 'Садовое украшение, без которого нет настоящей лужайки.' }),
    bush: O('Декоративный куст', 90, [1, 1], 'decor', ['outdoor'], { env: 1, acts: [], col: ['#3a7a3a', '#2a5a2a'], pal: [['#3a7a3a', '#4a8a4a', '#7a8a3a'], ['#2a5a2a']], desc: 'Аккуратно подстриженный куст.' }),
    flowerbed: O('Клумба', 70, [1, 1], 'decor', ['outdoor'], { env: 1, acts: [], col: ['#e84a6a', '#6a4a2a'], pal: [['#e84a6a', '#e8c832', '#f0f0f0', '#9a4ac8'], WOOD], desc: 'Яркие цветы у крыльца.' }),
    tree_small: O('Деревце', 220, [1, 1], 'decor', ['outdoor'], { env: 1, acts: [], col: ['#5a3a22', '#3a8a3a'], pal: [WOOD, ['#3a8a3a', '#6aa84a', '#c8742a']], desc: 'Молодое дерево. Через пару лет даст тень.' }),

    chess: O('Шахматный стол', 420, [3, 1], 'hobbies', ['study', 'living', 'outdoor'], { acts: ['play_chess', 'practice_chess'], skill: 'logic', col: ['#8a5a32', '#3a2418'], pal: [WOOD, WOOD], desc: 'Стол с двумя табуретами. Развивает логику.' }),
    easel: O('Мольберт', 420, [1, 1], 'hobbies', ['study', 'misc'], { acts: ['paint'], skill: 'painting', col: ['#b88a58', '#f0f0ec'], pal: [WOOD, WOOD], desc: 'Холсты, краски и вдохновение. Готовые картины можно продать.' }),
    guitar: O('Гитара «Струна»', 350, [1, 1], 'hobbies', ['misc'], { acts: ['play_guitar', 'play_tips'], skill: 'guitar', col: ['#c8742a', '#3a2418'], pal: [WOOD, WOOD], desc: 'Акустическая гитара на подставке.' }),
    telescope: O('Телескоп', 680, [1, 1], 'hobbies', ['outdoor', 'study'], { acts: ['stargaze'], skill: 'logic', col: ['#3a3a44', '#c8ccd4'], pal: [MET, MET], desc: 'Звёзды, планеты и логика. Лучше всего работает ночью.' }),
    treadmill: O('Беговая дорожка', 920, [1, 2], 'hobbies', ['misc'], { acts: ['treadmill'], skill: 'athletic', breaks: 0.01, col: ['#3a3a40', '#c8ccd4'], pal: [MET, MET], desc: 'Бег на месте. Атлетика растёт, погода не мешает.' }),
    weights: O('Силовой тренажёр', 640, [1, 2], 'hobbies', ['misc'], { acts: ['lift_weights'], skill: 'athletic', col: ['#c83a2a', '#3a3a40'], pal: [MET, MET], desc: 'Жим лёжа для крепких мышц.' }),
    toybox: O('Ящик с игрушками', 95, [1, 1], 'kids', ['kids'], { acts: ['play_toys'], col: ['#e8c832', '#3a6ab8'], pal: [FAB, FAB], desc: 'Игрушки для малышей и детей.' }),
    swingset: O('Детские качели', 480, [2, 2], 'kids', ['outdoor', 'kids'], { acts: ['swing'], col: ['#c83a3a', '#e8c832'], pal: [MET, MET], desc: 'Качели для детей. И иногда для взрослых.' }),
    teleporter: O('Телепорт', 0, [1, 1], 'misc', ['misc'], { reward: true, acts: ['teleport'], col: ['#c8ccd4', '#6ae8e8'], pal: [MET, MET], desc: 'Награда за счастливую жизнь. Переносит в любое место города.' }),

    mailbox: O('Почтовый ящик', 50, [1, 1], 'misc', ['outdoor'], { lotItem: true, acts: ['pay_bills'], col: ['#3a6ab8', '#f0f0ec'], pal: [MET, MET], desc: 'Сюда приходят счета и письма.' }),
    trash_can: O('Мусорный бак', 50, [1, 1], 'misc', ['outdoor'], { lotItem: true, bin: true, acts: [], col: ['#4a5a4a', '#3a3a40'], pal: [MET, MET], desc: 'Большой бак для мусора. По утрам его опустошает мусоровоз.' }),

    park_grill: O('Уличный гриль', 0, [1, 1], 'appliances', [], { hidden: true, grill: true, fire: 0.6, acts: ['cook_grill'], col: ['#3a3a40', '#6a6a70'] }),
    picnic_table: O('Стол для пикника', 0, [2, 2], 'surfaces', [], { hidden: true, picnic: true, seat: 2, surface: 0.75, table: true, acts: ['sit'], col: ['#8a5a32', '#6a4a2a'] }),
    climber: O('Игровой комплекс', 0, [2, 2], 'kids', [], { hidden: true, acts: ['play_climber'], col: ['#c83a3a', '#3a6ab8'] }),
    fountain: O('Фонтан', 0, [3, 3], 'decor', [], { hidden: true, env: 6, acts: ['view_art', 'wish_coin'], col: ['#c8c4bc', '#6aa8e8'] }),
    statue: O('Памятник основателю', 0, [2, 2], 'decor', [], { hidden: true, env: 5, acts: ['view_art'], col: ['#6a8a7a', '#c8c4bc'] }),
    drink_fountain: O('Питьевой фонтанчик', 0, [1, 1], 'plumbing', [], { hidden: true, acts: ['drink_water'], col: ['#c8ccd4', '#8a8a90'] }),
    lifeguard: O('Вышка спасателя', 0, [2, 2], 'decor', [], { hidden: true, env: 1, acts: [], col: ['#f0f0ec', '#c83a3a'] }),
    tombstone: O('Надгробие', 0, [1, 1], 'misc', [], { hidden: true, grave: true, acts: ['mourn', 'read_epitaph'], col: ['#8a8a90', '#5a5a60'] }),
    mausoleum: O('Склеп', 0, [3, 3], 'misc', [], { hidden: true, env: 0, acts: ['explore_crypt'], col: ['#8a8a90', '#4a4a50'] }),
    lighthouse: O('Маяк', 0, [3, 3], 'decor', [], { hidden: true, env: 4, acts: ['view_art'], col: ['#f0f0ec', '#c83a3a'] }),
    streetlamp: O('Уличный фонарь', 0, [1, 1], 'lighting', [], { hidden: true, light: 6, outdoorLight: true, acts: [], col: ['#2a2a30', '#f0e8c0'] }),
    tree_oak: O('Дуб', 0, [1, 1], 'decor', [], { hidden: true, tree: true, env: 1, acts: [], col: ['#5a3a22', '#3a7a2a'] }),
    tree_pine: O('Ель', 0, [1, 1], 'decor', [], { hidden: true, tree: true, env: 1, acts: [], col: ['#4a3020', '#2a5a32'] }),
    tree_palm: O('Пальма', 0, [1, 1], 'decor', [], { hidden: true, tree: true, env: 1, acts: [], col: ['#8a6a4a', '#4a8a3a'] }),
    tree_maple: O('Клён', 0, [1, 1], 'decor', [], { hidden: true, tree: true, env: 1, acts: [], col: ['#5a3a22', '#c8642a'] }),
    rock: O('Валун', 0, [1, 1], 'decor', [], { hidden: true, acts: [], col: ['#8a8680', '#6a6660'] }),
    hydrant: O('Пожарный гидрант', 0, [1, 1], 'decor', [], { hidden: true, block: true, acts: [], col: ['#c83a2a', '#e8e0d0'] }),
    parked_car: O('Автомобиль', 0, [1, 2], 'decor', [], { hidden: true, acts: [], col: ['#3a6ab8', '#c8ccd4'] }),
    boat: O('Лодка', 0, [1, 2], 'decor', [], { hidden: true, acts: [], col: ['#f0f0ec', '#c83a2a'], water: true }),

    stairs_wood: O('Лестница «Дуб»', 650, [1, 3], 'misc', [], { hidden: true, build: true, stairs: true, acts: [], col: ['#8a5a32', '#5a3a22'], pal: [WOOD, WOOD], desc: 'Прямая деревянная лестница на этаж выше. Внизу и наверху нужен свободный проход.' }),
    stairs_metal: O('Лестница «Лофт»', 900, [1, 3], 'misc', [], { hidden: true, build: true, stairs: true, acts: [], col: ['#c8ccd4', '#3a3a40'], pal: [MET, MET], desc: 'Лёгкая металлическая лестница с открытыми ступенями.' }),
    elevator: O('Лифт «Вертикаль»', 3200, [1, 1], 'misc', [], { hidden: true, build: true, elevator: true, acts: [], col: ['#c8ccd4', '#6a6c74'], pal: [MET, MET], desc: 'Возит симов между этажами. Ставится на нижний этаж, шахта поднимается, пока на этажах выше есть пол у двери.' }),
    pool_ladder: O('Лестница для бассейна', 150, [1, 1], 'misc', [], { hidden: true, build: true, poolEdge: true, acts: [], col: ['#3a6ab8', '#c8ccd4'], pal: [FAB, MET], desc: 'Без неё в бассейн не спуститься и из него не выбраться. Ставится на край бассейна.' }),
    painting_own: O('Своя картина', 0, [1, 1], 'decor', [], { hidden: true, place: 'wall', env: 1, acts: ['view_art'], col: ['#8a5a32', '#d8b860'], pal: [WOOD, MET], desc: 'Картина, написанная своими руками.' }),
    plant_garden: O('Грядка', 0, [1, 1], 'misc', [], { hidden: true, garden: true, acts: ['water_plant', 'weed_plant', 'harvest', 'dispose_plant'], col: ['#6a4a2a', '#3a8a3a'] }),
    collectible: O('Находка', 0, [1, 1], 'misc', [], { hidden: true, block: false, collect: true, acts: ['collect'], col: ['#8a8680', '#d0203a'] }),
    plate: O('Тарелка', 0, [1, 1], 'misc', [], { hidden: true, place: 'surface', food: true, acts: ['eat_plate', 'clean_up'], col: ['#f0f0ec', '#c87a3a'] }),
    platter: O('Блюдо', 0, [1, 1], 'misc', [], { hidden: true, place: 'surface', food: true, acts: ['serve_plate', 'clean_up'], col: ['#f0f0ec', '#c87a3a'] }),
    dirty_plate: O('Грязная тарелка', 0, [1, 1], 'misc', [], { hidden: true, place: 'surface', dirtyDish: true, acts: ['clean_up'], col: ['#e8e0cc', '#8a6a3a'] }),
    puddle: O('Лужа', 0, [1, 1], 'misc', [], { hidden: true, place: 'rug', puddle: true, acts: ['mop'], col: ['#8ab8e8', '#6a98c8'] }),
    trash_pile: O('Мусор', 0, [1, 1], 'misc', [], { hidden: true, place: 'rug', pile: true, acts: ['clean_up'], col: ['#8a7a5a', '#5a4a3a'] }),
    newspaper: O('Газета', 0, [1, 1], 'misc', [], { hidden: true, place: 'rug', paper: true, acts: ['read_paper', 'find_job_paper', 'clean_up'], col: ['#e8e4d8', '#3a3a3a'] }),
    fire: O('Огонь', 0, [1, 1], 'misc', [], { hidden: true, place: 'rug', flame: true, acts: ['extinguish'], col: ['#f0a020', '#c83a1a'] })
  };
  const OBJECT_KEYS = Object.keys(OBJECTS);
  for (const k of OBJECT_KEYS) {
    const o = OBJECTS[k];
    o.key = k;
    if (o.block === undefined) o.block = o.place === 'floor';
  }

  const FUNC_CATS = {
    seating: { name: 'Сиденья', icon: 'b_seat' },
    beds: { name: 'Кровати', icon: 'b_bed' },
    surfaces: { name: 'Поверхности', icon: 'b_table' },
    appliances: { name: 'Бытовая техника', icon: 'b_fridge' },
    plumbing: { name: 'Сантехника', icon: 'b_toilet' },
    electronics: { name: 'Электроника', icon: 'b_tv' },
    lighting: { name: 'Освещение', icon: 'b_lamp' },
    decor: { name: 'Декор', icon: 'b_decor' },
    hobbies: { name: 'Хобби и навыки', icon: 'b_hobby' },
    kids: { name: 'Детское', icon: 'b_kids' },
    misc: { name: 'Разное', icon: 'b_misc' }
  };
  const ROOM_CATS = {
    kitchen: { name: 'Кухня', icon: 'r_kitchen' },
    bath: { name: 'Ванная', icon: 'r_bath' },
    bedroom: { name: 'Спальня', icon: 'r_bedroom' },
    living: { name: 'Гостиная', icon: 'r_living' },
    dining: { name: 'Столовая', icon: 'r_dining' },
    study: { name: 'Кабинет', icon: 'r_study' },
    kids: { name: 'Детская', icon: 'r_kids' },
    outdoor: { name: 'Улица', icon: 'r_outdoor' },
    misc: { name: 'Всё для дома', icon: 'r_misc' }
  };

  const WALLPAPERS = {
    paint_white: { name: 'Краска «Белая»', price: 5, tex: 'wp_paint', c: '#ecE8e0' },
    paint_cream: { name: 'Краска «Сливочная»', price: 5, tex: 'wp_paint', c: '#e8dcb8' },
    paint_blue: { name: 'Краска «Небо»', price: 5, tex: 'wp_paint', c: '#a8c4e0' },
    paint_green: { name: 'Краска «Мята»', price: 5, tex: 'wp_paint', c: '#b8d8b8' },
    paint_pink: { name: 'Краска «Роза»', price: 5, tex: 'wp_paint', c: '#e8c0c8' },
    stripes: { name: 'Обои «Полоска»', price: 12, tex: 'wp_stripes', c: '#e8dcc0', c2: '#c8a878' },
    stripes_blue: { name: 'Обои «Морская полоска»', price: 12, tex: 'wp_stripes', c: '#e0e8f0', c2: '#6a8ab8' },
    floral: { name: 'Обои «Цветочек»', price: 14, tex: 'wp_floral', c: '#f0e8d8', c2: '#c86a7a' },
    damask: { name: 'Обои «Дамаск»', price: 18, tex: 'wp_damask', c: '#6a2a2a', c2: '#8a3a3a' },
    wood_panel: { name: 'Деревянные панели', price: 20, tex: 'wp_wood', c: '#8a5a32', c2: '#6a4222' },
    wainscot: { name: 'Панели с обоями', price: 22, tex: 'wp_wainscot', c: '#d8c8a0', c2: '#8a5a32' },
    tile_bath: { name: 'Кафель «Ванная»', price: 16, tex: 'wp_tile', c: '#e8f0f4', c2: '#b8c8d4' },
    tile_blue: { name: 'Кафель «Лазурь»', price: 16, tex: 'wp_tile', c: '#8ab8d8', c2: '#6a98b8' },
    brick: { name: 'Кирпич', price: 18, tex: 'wp_brick', c: '#a8583a', c2: '#d8c8b0' },
    stone: { name: 'Камень', price: 22, tex: 'wp_stone', c: '#a8a098', c2: '#787068' },
    siding: { name: 'Сайдинг «Белый»', price: 10, tex: 'wp_siding', c: '#f0f0ec', c2: '#c8c8c4' },
    siding_blue: { name: 'Сайдинг «Голубой»', price: 10, tex: 'wp_siding', c: '#a8c0d8', c2: '#8aa0b8' },
    siding_yellow: { name: 'Сайдинг «Жёлтый»', price: 10, tex: 'wp_siding', c: '#e8d8a0', c2: '#c8b880' },
    stucco: { name: 'Штукатурка', price: 8, tex: 'wp_stucco', c: '#e0d4c0', c2: '#c8bca8' },
    gothic: { name: 'Обои «Готика»', price: 20, tex: 'wp_damask', c: '#2a2030', c2: '#4a3a5a' }
  };
  const FLOORS = {
    wood_light: { name: 'Паркет «Светлый»', price: 8, tex: 'fl_wood', c: '#c8a070', c2: '#a8804a' },
    wood_dark: { name: 'Паркет «Орех»', price: 10, tex: 'fl_wood', c: '#7a4a2a', c2: '#5a321a' },
    herring: { name: 'Паркет «Ёлочка»', price: 14, tex: 'fl_herring', c: '#b8885a', c2: '#8a6038' },
    checker: { name: 'Плитка «Шахматы»', price: 10, tex: 'fl_checker', c: '#f0f0ec', c2: '#2a2a30' },
    tile_white: { name: 'Кафель «Белый»', price: 9, tex: 'fl_tile', c: '#e8ecee', c2: '#c8ccd0' },
    tile_terra: { name: 'Плитка «Терракота»', price: 9, tex: 'fl_tile', c: '#c87a4a', c2: '#a85a32' },
    carpet_blue: { name: 'Ковролин «Синий»', price: 7, tex: 'fl_carpet', c: '#4a5a98', c2: '#3a4a88' },
    carpet_beige: { name: 'Ковролин «Бежевый»', price: 7, tex: 'fl_carpet', c: '#d0c0a0', c2: '#c0b090' },
    carpet_red: { name: 'Ковролин «Бордо»', price: 7, tex: 'fl_carpet', c: '#8a2a2a', c2: '#7a2020' },
    carpet_green: { name: 'Ковролин «Лес»', price: 7, tex: 'fl_carpet', c: '#3a6a3a', c2: '#2a5a2a' },
    linoleum: { name: 'Линолеум', price: 5, tex: 'fl_lino', c: '#d8d0b8', c2: '#b8b098' },
    marble: { name: 'Мрамор', price: 22, tex: 'fl_marble', c: '#f0ece8', c2: '#b8b0b0' },
    stone_patio: { name: 'Камень для патио', price: 8, tex: 'fl_stone', c: '#a8a098', c2: '#8a8278' },
    brick_patio: { name: 'Кирпичная дорожка', price: 8, tex: 'fl_brick', c: '#a8583a', c2: '#8a4028' },
    deck: { name: 'Настил', price: 9, tex: 'fl_deck', c: '#a87a4a', c2: '#8a5a32' }
  };
  const DOORS = {
    door_wood: { name: 'Дверь «Простая»', price: 120, style: 'panel', c: '#8a5a32' },
    door_white: { name: 'Дверь «Белая»', price: 150, style: 'panel', c: '#f0f0ec' },
    door_glass: { name: 'Дверь со стеклом', price: 260, style: 'glass', c: '#6a4a2a' },
    door_fancy: { name: 'Парадная дверь', price: 480, style: 'fancy', c: '#5a2a22' },
    arch: { name: 'Арка', price: 80, style: 'arch', c: '#e8e0d0' }
  };
  const WINDOWS = {
    win_simple: { name: 'Окно «Простое»', price: 80, style: 'simple', c: '#f0f0ec' },
    win_cross: { name: 'Окно «Крестовина»', price: 140, style: 'cross', c: '#f0f0ec' },
    win_wood: { name: 'Окно «Деревянное»', price: 160, style: 'cross', c: '#8a5a32' },
    win_tall: { name: 'Окно «Высокое»', price: 240, style: 'tall', c: '#f0f0ec' },
    win_round: { name: 'Окно «Круглое»', price: 200, style: 'round', c: '#e8e0d0' }
  };
  const TERRAIN = {
    grass: { name: 'Трава', price: 0 },
    grass2: { name: 'Густая трава', price: 1 },
    dirt: { name: 'Земля', price: 1 },
    flowers: { name: 'Цветы', price: 3 },
    gravel: { name: 'Гравий', price: 2 },
    sand: { name: 'Песок', price: 2 }
  };
  const BUILD_COSTS = { wall: 14, fence: 10, removeWall: 0, pool: 40, roof: 12 };

  Object.assign(S, { OBJECTS, OBJECT_KEYS, FUNC_CATS, ROOM_CATS, WALLPAPERS, FLOORS, DOORS, WINDOWS, TERRAIN, BUILD_COSTS });
  if (typeof module !== 'undefined' && module.exports) module.exports = S;
})(globalThis.Sims3 = globalThis.Sims3 || {});
