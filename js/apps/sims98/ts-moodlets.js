(function (S) {
  'use strict';
  const MIN = -100, MAX = 200, HAPPY_FACE = 30, SAD_FACE = 0, SUN_FROM = 9 * 60, SUN_TO = 18 * 60;
  const ROOM_WONDER = 12, ROOM_NICE = 7, ROOM_COSY = 3, ROOM_BARE = -2, ROOM_AREA_PER_POINT = 12, WINDOW_CAP = 3;
  const CROWD_PEOPLE = 3, CROWD_AREA = 8, FULL_SLEEP = 95, BROKEN_SLEEP = 80, CHAT_HEARD = 5, NIGHT_SNACK_TO = 5 * 60;
  const MEALS = new Set(['eat_meal', 'eat_leftovers', 'grill_cook', 'fridge_cold']), SORE_BELOW = 4, SORE_CHANCE = 0.25;
  const NEED_UNTIL = {
    hunger: 'пока не поест', bladder: 'пока не сходит в туалет', energy: 'пока не выспится',
    hygiene: 'пока не помоется', social: 'пока не пообщается', fun: 'пока не развлечётся'
  };
  const CURE_VERB = { hunger: 'поесть', bladder: 'сходить в туалет', energy: 'поспать', hygiene: 'помыться', social: 'поболтать', fun: 'развлечься' };
  const MOOD_WORDS = [[140, 'прекрасное'], [50, 'хорошее'], [0, 'ровное'], [-50, 'плохое'], [-Infinity, 'ужасное']];

  const GROUPS = [
    ['needs', 'Потребности и еда', [
      ['hungry', -10, 0, 'eat', 'Живот урчит', 'Пора бы перекусить.', { need: 'hunger', below: 32 }],
      ['veryHungry', -25, 0, 'eat', 'Очень хочется есть', 'Мысли только о еде, а до холодильника пара шагов.', { need: 'hunger', below: 20 }],
      ['starving', -60, 0, 'eat', 'Умирает с голоду', 'Ноги не держат. Поесть нужно прямо сейчас.', { need: 'hunger', below: 10 }],
      ['needToilet', -10, 0, 'toilet', 'Надо бы отойти', 'Туалет зовёт, пока ещё вежливо.', { need: 'bladder', below: 20 }],
      ['urgentToilet', -35, 0, 'toilet', 'Надо срочно', 'Ещё немного, и будет поздно.', { need: 'bladder', below: 5 }],
      ['accident', -20, 360, 'toilet', 'Конфуз', 'До туалета добежать не вышло. Лучше никому не рассказывать.'],
      ['homeMeal', 15, 360, 'cook', 'Домашний обед', 'Горячее, с плиты, своими руками.', { slot: 'meal' }],
      ['grilled', 20, 360, 'cook', 'Мясо с огня', 'Мясо с решётки, с дымком.', { slot: 'meal' }],
      ['coldMeal', 5, 180, 'eat', 'Холодный обед', 'Сытно, хоть и прямо из холодильника.', { slot: 'meal' }],
      ['snack', 5, 120, 'eat', 'Перекус', 'Немного, зато вовремя.', { slot: 'meal' }],
      ['midnightSnack', 10, 180, 'eat', 'Ночной перекус', 'Тихо, темно и бутерброд. Лучшее время суток.', { slot: 'meal' }],
      ['standingMeal', -5, 120, 'eat', 'Обед стоя', 'Все стулья заняты, есть пришлось на ногах.', { slot: 'meal' }],
      ['familyDinner', 10, 240, 'relations', 'Семейный ужин', 'Поели вместе, за одним столом. Бывает не каждый день.'],
      ['heavyStomach', -10, 120, 'eat', 'Тяжесть в животе', 'Последний кусок явно был лишним.', { stage: 13 }],
      ['favoriteFood', 15, 360, 'eat', 'Любимое блюдо', 'Ради этого стоило подождать.', { stage: 21, slot: 'meal' }],
      ['burntFood', -10, 180, 'cook', 'Подгорело', 'Съели то, что удалось спасти со сковородки.', { stage: 13, slot: 'meal' }],
      ['spoiledFood', -20, 240, 'eat', 'Испорченная еда', 'Это стояло в холодильнике слишком долго.', { stage: 13, slot: 'meal' }],
      ['tastyDish', 20, 240, 'cook', 'Вкусно вышло', 'Повар в доме растёт на глазах.', { stage: 10, slot: 'meal' }],
      ['masterDish', 25, 480, 'cook', 'Блюдо мастера', 'Такое не стыдно подать и в бистро.', { stage: 13, slot: 'meal' }],
      ['dessert', 10, 180, 'eat', 'Сладкое', 'Кусок торта исправляет почти всё.', { stage: 13 }],
      ['coffee', 10, 120, 'eat', 'Крепкий кофе', 'Сон отступил. Ненадолго.', { stage: 13 }],
      ['tea', 5, 180, 'eat', 'Чай с вареньем', 'Медленно, горячо, с блюдечка.', { stage: 13 }],
      ['breakfast', 10, 240, 'eat', 'Плотный завтрак', 'С таким завтраком до обеда дотянуть легко.', { stage: 13, slot: 'meal' }],
      ['leftovers', 3, 120, 'eat', 'Вчерашний ужин', 'Разогретое вчерашнее. Почти как свежее.', { stage: 13, slot: 'meal' }],
      ['weirdDish', -5, 180, 'cook', 'Странное блюдо', 'Рецепт явно читали по диагонали.', { stage: 13, slot: 'meal' }],
      ['ownHarvest', 10, 360, 'eat', 'Свой урожай', 'Помидоры с собственной грядки вкуснее магазинных.', { stage: 14 }],
      ['ownFish', 15, 360, 'fish', 'Своя рыба', 'Утром она ещё плавала. Свежее не бывает.', { stage: 14 }],
      ['freshJuice', 5, 180, 'eat', 'Свежий сок', 'Выжат минуту назад.', { stage: 14 }],
      ['diner', 10, 240, 'eat', 'Обед в закусочной', 'Готовил кто-то другой, а вкусно.', { stage: 19, slot: 'meal' }],
      ['bistro', 20, 360, 'eat', 'Ужин в бистро', 'Скатерть, свечи и счёт, на который лучше не смотреть.', { stage: 19, slot: 'meal' }],
      ['takeaway', 5, 180, 'eat', 'Еда навынос', 'Из коробки, зато без посуды.', { stage: 19, slot: 'meal' }],
      ['pizza', 10, 240, 'eat', 'Пицца на дом', 'Звонок, полчаса ожидания, и ужин приехал сам.', { stage: 16, slot: 'meal' }],
      ['guestDinner', 15, 360, 'eat', 'Ужин в гостях', 'Хозяева старались, и это было видно.', { stage: 32, slot: 'meal' }],
      ['barbecue', 15, 360, 'cook', 'Барбекю с друзьями', 'Дым, шум и сосиски на всех.', { stage: 12 }],
      ['emptyFridge', -10, 180, 'eat', 'Пустой холодильник', 'Внутри только лампочка и забытый лимон.', { stage: 16 }],
      ['noMeat', -5, 180, 'eat', 'Без мяса', 'Овощи полезны. Больше про них сказать нечего.', { stage: 21 }],
      ['cravings', -5, 240, 'eat', 'Тянет на солёное', 'Огурцы с вареньем вдруг кажутся хорошей мыслью.', { stage: 17 }],
      ['hungryChild', -15, 0, 'eat', 'Голодный ребёнок', 'Малыш хочет есть, и весь дом это слышит.', { stage: 17, until: 'пока ребёнка не накормят' }],
      ['dirtyToilet', -10, 0, 'toilet', 'Грязный туалет', 'Сюда давно не заглядывала тряпка.', { stage: 16, until: 'пока туалет не вымоют' }],
      ['brokenToilet', -15, 0, 'toilet', 'Сломанный унитаз', 'Вода не уходит. Нужен мастер или свои руки.', { stage: 16, until: 'пока унитаз не починят' }]
    ]],
    ['sleep', 'Сон и чистота', [
      ['sleepy', -10, 0, 'sleep', 'Клонит в сон', 'Глаза закрываются сами.', { need: 'energy', below: 20 }],
      ['tired', -25, 0, 'sleep', 'Усталость', 'Сил осталось на одно дело, и то небольшое.', { need: 'energy', below: 10 }],
      ['noStrength', -50, 0, 'sleep', 'Без сил', 'Ещё чуть-чуть, и сон свалит прямо на пол.', { need: 'energy', below: 4 }],
      ['unfresh', -10, 0, 'wash', 'Не первой свежести', 'Душ бы не помешал.', { need: 'hygiene', below: 35 }],
      ['smelly', -25, 0, 'wash', 'Пахнет', 'Это уже замечают другие.', { need: 'hygiene', below: 15 }],
      ['wellRested', 15, 480, 'sleep', 'Хороший сон', 'Проснуться самому, без будильника. Редкое счастье.', { slot: 'sleep' }],
      ['smallBed', -5, 360, 'sleep', 'Тесная кровать', 'Кровать узкая, а ноги длинные.', { slot: 'sleep' }],
      ['wokenUp', -10, 240, 'sleep', 'Разбудили', 'Сон оборвался на самом интересном месте.', { slot: 'sleep', cure: 'energy' }],
      ['floorNight', -15, 480, 'sleep', 'Ночь на полу', 'Спина это ещё припомнит.', { slot: 'sleep' }],
      ['napped', 5, 180, 'sleep', 'Вздремнуть удалось', 'Полчаса сна, и мир снова терпим.', { slot: 'sleep' }],
      ['softBed', 5, 360, 'sleep', 'Мягкая постель', 'Хорошая кровать стоит своих денег.', { stage: 23, slot: 'sleep' }],
      ['nightmare', -15, 240, 'sleep', 'Кошмар', 'Приснилось такое, что до утра горел свет.', { stage: 10 }],
      ['earlyStart', -10, 240, 'sleep', 'Ранний подъём', 'Будильник прозвенел ещё затемно.', { stage: 15 }],
      ['sleeplessNight', -20, 480, 'sleep', 'Бессонная ночь', 'Ночь прошла на ногах, и это видно.', { stage: 15, slot: 'sleep' }],
      ['freshShower', 10, 240, 'wash', 'После душа', 'Чистота и немного бодрости.', { slot: 'wash' }],
      ['warmBath', 15, 300, 'wash', 'Тёплая ванна', 'Сорок минут тишины и пены.', { slot: 'wash' }],
      ['faceWash', 5, 120, 'wash', 'Умывание', 'Холодная вода, и голова ясная.', { slot: 'wash' }],
      ['sweaty', -10, 180, 'wash', 'Пот градом', 'После тренировки самое время в душ.', { cure: 'hygiene', clear: ['shower_take', 'bath_take'] }],
      ['coldShower', -10, 180, 'wash', 'Ледяной душ', 'Горячая вода кончилась, а мыло ещё в волосах.', { stage: 16, slot: 'wash' }],
      ['muddy', -10, 240, 'wash', 'Земля под ногтями', 'После грядок нужен душ, и не один.', { stage: 14, cure: 'hygiene', clear: ['shower_take', 'bath_take'] }]
    ]],
    ['fun', 'Веселье и общение', [
      ['bored', -10, 0, 'toy', 'Скука', 'Хочется чем-нибудь заняться.', { need: 'fun', below: 25 }],
      ['deadlyBored', -30, 0, 'toy', 'Смертная скука', 'Даже часы тикают медленнее.', { need: 'fun', below: 10 }],
      ['lonely', -10, 0, 'talk', 'Скучно одному', 'Поговорить бы с кем-нибудь.', { need: 'social', below: 20 }],
      ['noOne', -30, 0, 'talk', 'Никого рядом', 'Кажется, весь город забыл, что сим вообще есть.', { need: 'social', below: 5 }],
      ['niceChat', 10, 240, 'talk', 'Приятный разговор', 'Поболтали, и на душе стало легче.'],
      ['goodShow', 10, 180, 'tv', 'Хорошая передача', 'Оторваться было невозможно до самых титров.'],
      ['badShow', -5, 120, 'tv', 'Ерунда по телевизору', 'Сорок каналов, и смотреть нечего.', { stage: 10 }],
      ['greatBook', 10, 240, 'book', 'Интересная книга', 'Хочется скорее узнать, чем всё кончится.'],
      ['gameWin', 10, 180, 'keys', 'Победа в игре', 'Последний уровень наконец пройден.'],
      ['chatOnline', 5, 180, 'keys', 'Переписка в сети', 'В сети всегда кто-то не спит.'],
      ['dancing', 10, 180, 'music', 'Танцы под радио', 'Ноги сами пошли в пляс.'],
      ['inspired', 15, 240, 'paint', 'Вдохновение', 'Кисть сама знает, куда идти.'],
      ['chessGame', 10, 180, 'chess', 'Хорошая партия', 'Сыграть за обе стороны и обеим выиграть.'],
      ['playtime', 10, 120, 'toy', 'Весёлая игра', 'Кубики, машинки и полчаса счастья.'],
      ['favoriteSong', 10, 180, 'music', 'Любимая песня', 'По радио поставили ту самую.', { stage: 21 }],
      ['laughed', 15, 240, 'talk', 'Смешно до слёз', 'Шутка попала точно в цель.', { stage: 10 }],
      ['funnyScene', 5, 120, 'talk', 'Смешной случай', 'Смотреть было неловко, но очень смешно.', { stage: 12 }],
      ['newFriend', 20, 480, 'relations', 'Новый друг', 'Теперь в городе есть с кем поговорить по душам.', { stage: 12 }],
      ['newAcquaintance', 5, 180, 'relations', 'Новое знакомство', 'Имя запомнилось. Кажется.', { stage: 12 }],
      ['gossip', 5, 180, 'talk', 'Свежие сплетни', 'Теперь известно, кто с кем и почему.', { stage: 12 }],
      ['compliment', 10, 240, 'talk', 'Комплимент', 'Приятно, когда замечают.', { stage: 10 }],
      ['gift', 15, 360, 'rewards', 'Подарок', 'Вспомнили и даже завернули в бумагу.', { stage: 23 }],
      ['mocked', -15, 240, 'talk', 'Высмеяли', 'Смеялись все, кроме сима.', { stage: 10 }],
      ['offended', -15, 360, 'talk', 'Обида', 'Такое не забывается до вечера.', { stage: 12 }],
      ['awkward', -10, 240, 'talk', 'Неловко вышло', 'Хочется провалиться сквозь пол.', { stage: 10 }],
      ['quarrel', -20, 480, 'talk', 'Ссора', 'Хлопнули дверью. Оба.', { stage: 12 }],
      ['insulted', -20, 360, 'talk', 'Оскорбили', 'Так с симами не разговаривают.', { stage: 12 }],
      ['ignored', -10, 240, 'talk', 'Не замечают', 'Говорить в пустоту утомительно.', { stage: 12 }],
      ['pranked', -10, 240, 'talk', 'Разыграли', 'Опять подушка с сюрпризом на стуле.', { stage: 12 }],
      ['prankDone', 10, 240, 'talk', 'Удачный розыгрыш', 'Лицо того, кого разыграли, стоило всего.', { stage: 12 }],
      ['tickled', 5, 120, 'toy', 'Щекотка', 'Хохот на весь дом.', { stage: 12 }],
      ['bedtimeStory', 10, 240, 'book', 'Сказка на ночь', 'Про дракона, который боялся темноты.', { stage: 12 }],
      ['goodNews', 10, 240, 'scroll', 'Хорошие вести', 'В почте было письмо, а не счёт.', { stage: 16 }],
      ['missFriend', -5, 0, 'relations', 'Давно не виделись', 'Старый друг не звонит уже неделю.', { stage: 12, until: 'пока не встретятся' }],
      ['greatParty', 30, 480, 'music', 'Отличная вечеринка', 'Гости разошлись под утро, и все довольные.', { stage: 12 }],
      ['dullParty', -10, 240, 'music', 'Скучная вечеринка', 'Гости разошлись к девяти.', { stage: 12 }],
      ['concert', 20, 360, 'music', 'Концерт', 'В ушах ещё звенит, и это прекрасно.', { stage: 19 }],
      ['movie', 15, 300, 'tv', 'Кино', 'Большой экран и попкорн. Сюжет уже не важен.', { stage: 19 }],
      ['theatre', 15, 300, 'book', 'Спектакль', 'Хлопали стоя, хотя половину не поняли.', { stage: 19 }],
      ['match', 10, 300, 'toy', 'Матч на стадионе', 'Свои выиграли, голос сорван.', { stage: 19 }]
    ]],
    ['love', 'Романтика и семья', [
      ['crush', 10, 360, 'heart', 'Симпатия', 'Мысли всё время возвращаются к одному человеку.', { stage: 12 }],
      ['inLove', 25, 0, 'heart', 'Влюблённость', 'Всё вокруг немного лучше, чем на самом деле.', { stage: 12, until: 'пока любовь жива' }],
      ['firstKiss', 30, 720, 'heart', 'Первый поцелуй', 'Этот вечер запомнится надолго.', { stage: 12 }],
      ['kiss', 15, 240, 'heart', 'Поцелуй', 'Коротко, но в самый раз.', { stage: 12 }],
      ['goodDate', 30, 480, 'heart', 'Свидание удалось', 'Договорились встретиться снова.', { stage: 12 }],
      ['badDate', -20, 360, 'heartBroken', 'Свидание не удалось', 'Разговор не клеился с самого начала.', { stage: 12 }],
      ['rejected', -20, 360, 'heartBroken', 'Отказ', 'Спрашивать было неловко. Отвечать, видимо, тоже.', { stage: 12 }],
      ['heartbreak', -50, 1440, 'heartBroken', 'Разбитое сердце', 'Все песни по радио теперь про это.', { stage: 12 }],
      ['jealous', -25, 480, 'heartBroken', 'Ревность', 'Видеть их вместе неприятно.', { stage: 12 }],
      ['longing', -10, 0, 'heart', 'Тоска по любимым', 'Без них дом слишком тихий.', { stage: 12, until: 'пока любимые далеко' }],
      ['engaged', 40, 1440, 'ring', 'Помолвка', 'Кольцо на пальце и куча планов.', { stage: 12 }],
      ['wedding', 50, 2880, 'ring', 'Свадьба', 'Гости, торт, слёзы мамы. Всё как положено.', { stage: 12 }],
      ['honeymoon', 30, 4320, 'heart', 'Медовый месяц', 'Пару дней можно ни о чём не думать.', { stage: 12 }],
      ['divorce', -50, 2880, 'heartBroken', 'Развод', 'Подписи поставлены, вещи поделены.', { stage: 12 }],
      ['breakup', -30, 1440, 'heartBroken', 'Расставание', 'Номер телефона стоит стереть. Потом, не сейчас.', { stage: 12 }],
      ['intimacy', 30, 480, 'heart', 'Близость', 'То, что осталось за кадром, там и останется.', { stage: 12 }],
      ['morningSickness', -10, 0, 'baby', 'Утренняя тошнота', 'Запах кофе вдруг стал невыносим.', { stage: 17, until: 'до второго дня' }],
      ['babyKicks', 15, 0, 'baby', 'Шевелится', 'Кто-то внутри уже машет ногами.', { stage: 17, until: 'до третьего дня' }],
      ['dueSoon', -10, 0, 'baby', 'Скоро роды', 'Сумка в больницу собрана в третий раз.', { stage: 17, until: 'до родов' }],
      ['newSon', 80, 2880, 'baby', 'Родился сын', 'Маленький, громкий и уже всеми любимый.', { stage: 17 }],
      ['newDaughter', 80, 2880, 'baby', 'Родилась дочь', 'Пальчики, носик и крик на весь дом.', { stage: 17 }],
      ['twins', 100, 2880, 'baby', 'Двойня', 'Всего по два, включая бессонные ночи.', { stage: 17 }],
      ['adopted', 60, 2880, 'baby', 'Новый член семьи', 'В доме стало на одну зубную щётку больше.', { stage: 17 }],
      ['babyCrying', -10, 0, 'baby', 'Плачет младенец', 'Плач слышен в каждой комнате.', { stage: 17, until: 'пока малыша не успокоят' }],
      ['proudParent', 20, 1440, 'rewards', 'Гордость за ребёнка', 'Рассказать об этом хочется всем соседям.', { stage: 17 }],
      ['familyFight', -15, 360, 'relations', 'Семейная ссора', 'За ужином было слишком тихо.', { stage: 12 }],
      ['familyHug', 10, 240, 'relations', 'Объятия', 'Обняли просто так, без повода.', { stage: 10 }],
      ['homesick', -10, 0, 'home', 'Тоска по дому', 'На новом месте всё чужое.', { stage: 17, until: 'пока не привыкнется' }],
      ['birthday', 20, 1440, 'rewards', 'День рождения', 'Торт, свечи и ровно на год старше.', { stage: 17 }],
      ['firstWords', 15, 1440, 'baby', 'Первое слово', 'Сказано «дай». Начало положено.', { stage: 17 }]
    ]],
    ['work', 'Работа и школа', [
      ['loveJob', 15, 0, 'job', 'Любимая работа', 'На работу хочется идти. Так бывает.', { stage: 15, until: 'пока работа та же' }],
      ['wrongJob', -15, 0, 'job', 'Не та работа', 'Каждое утро хочется развернуться у двери.', { stage: 15, until: 'пока работа та же' }],
      ['promoted', 40, 1440, 'job', 'Повышение', 'Новая табличка на двери и новая зарплата.', { stage: 15 }],
      ['raise', 20, 720, 'money', 'Прибавка', 'Сумма в конверте приятно удивила.', { stage: 15 }],
      ['fired', -40, 2880, 'job', 'Уволили', 'Коробка с вещами стоит в прихожей.', { stage: 15 }],
      ['demoted', -30, 1440, 'job', 'Понизили', 'Старый стол забрал кто-то другой.', { stage: 15 }],
      ['overworked', -20, 0, 'job', 'Перегрузка', 'Работы больше, чем часов в сутках.', { stage: 15, until: 'пока не станет легче' }],
      ['late', -15, 360, 'job', 'Опоздание', 'Начальник посмотрел на часы, потом на сима.', { stage: 15 }],
      ['goodWorkday', 10, 360, 'job', 'Удачный день', 'Всё получалось с первого раза.', { stage: 10 }],
      ['hardWorkday', -10, 360, 'job', 'Тяжёлый день', 'Принтер зажевал отчёт. Три раза.', { stage: 15 }],
      ['firstDay', 15, 720, 'job', 'Первый рабочий день', 'Новые лица, новые имена и новый кофейный автомат.', { stage: 15 }],
      ['retired', 30, 2880, 'job', 'Пенсия', 'Будильник больше не нужен.', { stage: 17 }],
      ['goodGrades', 20, 1440, 'book', 'Отличные оценки', 'Табель можно показать родителям без страха.', { stage: 15 }],
      ['badGrades', -20, 1440, 'book', 'Плохие оценки', 'Табель лучше спрятать подальше.', { stage: 15 }],
      ['homework', -10, 0, 'book', 'Несделанные уроки', 'Завтра спросят, а тетрадь пустая.', { stage: 15, until: 'пока уроки не сделаны' }],
      ['truant', -10, 360, 'book', 'Прогул', 'Весело, но из школы позвонят домой.', { stage: 15 }],
      ['schoolFriends', 10, 360, 'book', 'Друзья в школе', 'На переменах есть с кем поговорить.', { stage: 15 }],
      ['bullied', -20, 480, 'book', 'Задирают в школе', 'Старшеклассники опять отобрали мяч.', { stage: 15 }]
    ]],
    ['hobby', 'Занятия и спорт', [
      ['workedOut', 10, 240, 'punch', 'После тренировки', 'Мышцы приятно гудят.'],
      ['sore', -10, 360, 'punch', 'Ломит всё тело', 'Тренировка была явно лишней.', { stage: 13 }],
      ['jog', 10, 240, 'walk', 'Пробежка', 'Пара кругов вокруг квартала, и голова свежая.', { stage: 10 }],
      ['swim', 15, 300, 'wash', 'Купание', 'Вода тёплая, и никуда не надо.', { stage: 19 }],
      ['tan', 10, 480, 'sun', 'Загар', 'Кожа пахнет солнцем.', { stage: 19 }],
      ['sunburn', -15, 480, 'sun', 'Солнечный ожог', 'Крем остался дома на полке.', { stage: 19 }],
      ['walk', 10, 240, 'walk', 'Хорошая прогулка', 'Ноги гудят, зато голова отдохнула.', { stage: 10 }],
      ['spa', 30, 720, 'wash', 'День в спа', 'Маски, массаж и тапочки на два размера больше.', { stage: 19 }],
      ['fishing', 10, 240, 'fish', 'Клюёт', 'Поплавок дёрнулся. Главное не спугнуть.', { stage: 14 }],
      ['bigFish', 20, 480, 'fish', 'Большая рыба', 'Её фотография будет висеть над камином.', { stage: 14 }],
      ['gardening', 10, 240, 'tree', 'Возня в саду', 'Земля под руками и тишина вокруг.', { stage: 10 }],
      ['harvest', 15, 360, 'tree', 'Урожай', 'Корзина полная. Хватит и соседям.', { stage: 14 }],
      ['foundIt', 10, 360, 'chance', 'Находка', 'Камень с блёстками. Определённо редкий.', { stage: 10 }],
      ['skillUp', 10, 360, 'skills', 'Новый уровень', 'Получается лучше, чем вчера.', { stage: 13 }],
      ['mastery', 30, 1440, 'skills', 'Мастерство', 'Учиться больше нечему. Можно учить других.', { stage: 13 }],
      ['paintingSold', 20, 720, 'paint', 'Картину купили', 'Кто-то повесит её у себя дома.', { stage: 14 }],
      ['bookDone', 25, 720, 'book', 'Книга дописана', 'Последняя точка поставлена.', { stage: 14 }],
      ['fixedIt', 10, 360, 'skills', 'Починено своими руками', 'Мастера звать не пришлось.', { stage: 10 }]
    ]],
    ['place', 'Окружение', [
      ['cosyRoom', 5, 0, 'home', 'Уютная комната', 'Тут хочется посидеть подольше.', { until: 'пока сим в этой комнате' }],
      ['niceRoom', 10, 0, 'home', 'Красивая комната', 'Видно, что над обстановкой подумали.', { until: 'пока сим в этой комнате' }],
      ['wonderRoom', 20, 0, 'home', 'Чудесная комната', 'Уходить отсюда не хочется.', { until: 'пока сим в этой комнате' }],
      ['bareRoom', -5, 0, 'home', 'Голые стены', 'Пусто и неуютно. Сюда бы картину или лампу.', { until: 'пока сим в этой комнате' }],
      ['dark', -10, 0, 'lamp', 'Темно', 'Света нет, и глазам неуютно.', { until: 'пока здесь темно' }],
      ['crowded', -5, 0, 'relations', 'Тесно', 'Слишком много людей на одну комнату.', { until: 'пока здесь тесно' }],
      ['newHome', 10, 2880, 'home', 'Новоселье', 'Коробки ещё не разобраны, а дом уже свой.'],
      ['sunnyDay', 5, 0, 'sun', 'Солнечный день', 'Лето, тепло и небо без облаков.', { until: 'пока сим на улице днём' }],
      ['dirty', -15, 0, 'dirt', 'Грязно', 'Посуда в раковине копится третий день.', { stage: 16, until: 'пока не уберут' }],
      ['filthy', -30, 0, 'dirt', 'Свинарник', 'Сюда страшно заходить без перчаток.', { stage: 16, until: 'пока не уберут' }],
      ['trashSmell', -10, 0, 'dirt', 'Пахнет мусором', 'Ведро давно просится на улицу.', { stage: 16, until: 'пока мусор не вынесут' }],
      ['view', 10, 240, 'sun', 'Красивый вид', 'Отсюда видно всю гавань.', { stage: 19 }],
      ['seaBreeze', 5, 0, 'wash', 'Морской воздух', 'Пахнет солью и водорослями.', { stage: 19, until: 'пока сим у моря' }],
      ['park', 5, 0, 'tree', 'Зелень вокруг', 'Под деревьями дышится легче.', { stage: 19, until: 'пока сим в парке' }],
      ['cemeteryNight', -10, 0, 'grave', 'Кладбище ночью', 'Каждый шорох кажется шагами.', { stage: 18, until: 'пока сим среди могил' }],
      ['museum', 10, 240, 'paint', 'Искусство вокруг', 'Половина картин непонятна, но смотреть интересно.', { stage: 19 }],
      ['luxury', 15, 0, 'rewards', 'Роскошная обстановка', 'Тут даже стулья дороже машины.', { stage: 23, until: 'пока сим в этой комнате' }],
      ['cheapStuff', -5, 0, 'home', 'Дешёвая мебель', 'Стул скрипит при каждом движении.', { stage: 23, until: 'пока сим в этой комнате' }],
      ['noisy', -10, 0, 'music', 'Шумно', 'За стеной кто-то очень любит барабаны.', { stage: 19, until: 'пока не станет тише' }],
      ['brokenThings', -10, 0, 'skills', 'Всё сломано', 'В этом доме не работает ничего.', { stage: 16, until: 'пока вещи не починят' }],
      ['garden', 10, 0, 'tree', 'Цветущий сад', 'Розы распустились, пчёлы довольны.', { stage: 14, until: 'пока сим в саду' }],
      ['cityLights', 5, 0, 'lamp', 'Огни города', 'Центр ночью совсем другой.', { stage: 19, until: 'пока сим в Центре ночью' }],
      ['strangerHome', -5, 0, 'home', 'Чужой дом', 'Неясно, куда сесть и можно ли.', { stage: 32, until: 'пока сим в гостях' }],
      ['freshPaint', 5, 1440, 'paint', 'Свежий ремонт', 'Пахнет краской, и всё блестит.', { stage: 24 }],
      ['ownCorner', 5, 0, 'home', 'Свой угол', 'Своя комната, и дверь закрывается.', { stage: 23, until: 'пока сим у себя' }],
      ['fireplace', 10, 0, 'fire', 'У камина', 'Трещат поленья, и спешить некуда.', { stage: 23, until: 'пока горит камин' }]
    ]],
    ['traits', 'Характер', [
      ['forgotWhy', -5, 60, 'question', 'Мысль ускользнула', 'Только что было важное дело. Какое, уже не вспомнить.', { stage: 10 }],
      ['artNearby', -5, 0, 'paint', 'Мазня на стене', 'Мольберт в комнате портит весь вид.', { stage: 10, until: 'пока сим в этой комнате' }],
      ['selfTalk', 10, 180, 'talk', 'Беседа с умным человеком', 'Поговорили, и оба остались довольны.', { stage: 10 }],
      ['worried', -10, 600, 'bolt', 'Тревога', 'А вдруг плита осталась включённой?', { stage: 10, cureAd: 'check_stove', clear: ['check_stove'] }],
      ['thrilled', 10, 60, 'sun', 'Восторг', 'Ну надо же, как здорово!', { stage: 10 }],
      ['dreamy', 10, 240, 'heart', 'Мечты о любви', 'Где-то есть тот самый человек.', { stage: 10 }],
      ['brr', -5, 120, 'wash', 'Бр-р, вода', 'Мокро, холодно и страшно. Больше ни за что.', { stage: 10 }],
      ['kidsAround', -5, 0, 'baby', 'Дети рядом', 'Шум, крик и липкие пальцы.', { stage: 10, until: 'пока дети рядом' }],
      ['aloneTime', 5, 0, 'home', 'Тишина и покой', 'Никого вокруг. Наконец-то.', { stage: 10, until: 'пока сим один в комнате' }],
      ['gloom', -5, 0, 'cloud', 'Всё как всегда', 'Хорошего ждать не приходится.', { stage: 10, until: 'пока характер прежний' }],
      ['gloat', 10, 120, 'fire', 'Злорадство', 'У кого-то день не задался. Приятно.', { stage: 10 }],
      ['kindDeed', 10, 240, 'heart', 'Доброе дело', 'Кому-то стало легче, и это главное.', { stage: 10 }],
      ['outsideBad', -10, 0, 'home', 'Неуютно на улице', 'Слишком много неба. Скорее бы домой.', { stage: 10, until: 'пока сим на улице' }],
      ['fumed', -10, 60, 'fire', 'Вспышка гнева', 'Хотелось что-нибудь стукнуть. Почти прошло.', { stage: 10 }],
      ['trophy', 10, 240, 'mask', 'Трофей', 'В кармане чужая безделушка. Приятная тяжесть.', { stage: 10 }],
      ['cried', 5, 180, 'wash', 'Поплакали', 'Слёзы над сериалом, и на душе чище.', { stage: 10 }],
      ['touched', 5, 120, 'heart', 'Растрогали', 'Глядя на чужие слёзы, защипало в глазах.', { stage: 10 }],
      ['flawless', 10, 240, 'rewards', 'Безупречно', 'Сделано так, что придраться не к чему.', { stage: 10 }],
      ['ateMeat', -10, 240, 'eat', 'Мясо в тарелке', 'Это было против всех правил.', { stage: 10 }],
      ['grumbled', 10, 180, 'cloud', 'Отвели душу', 'Поворчали всласть, и полегчало.', { stage: 10 }]
    ]],
    ['wishes', 'Желания', [
      ['wishDone', 10, 240, 'star', 'Исполнилось', 'Задуманное сбылось. Приятно держать слово.', { stage: 11 }],
      ['wishDone2', 20, 360, 'star', 'Всё получается', 'Второе желание подряд, и это не случайность.', { stage: 11 }],
      ['wishDone3', 30, 480, 'star', 'На волне', 'Желания сбываются одно за другим.', { stage: 11 }],
      ['dreamDone', 50, 2880, 'star', 'Мечта сбылась', 'То, к чему шли годами, наконец случилось.', { stage: 12 }]
    ]],
    ['fear', 'Страхи и беды', [
      ['robbed', -30, 1440, 'mask', 'Ограбили', 'Самое ценное вынесли, пока все спали.', { stage: 16 }],
      ['thiefSeen', -15, 360, 'mask', 'Вор в доме', 'Ночью кто-то ходил по гостиной.', { stage: 16 }],
      ['fire', -40, 0, 'fire', 'Пожар!', 'Горит! Тушить или бежать.', { stage: 13, until: 'пока огонь не потушат' }],
      ['burn', -30, 720, 'fire', 'Ожог', 'Плиту стоило выключить раньше.', { stage: 13 }],
      ['shock', -20, 360, 'bolt', 'Ударило током', 'Волосы до сих пор стоят дыбом.', { stage: 14 }],
      ['ghostScare', -25, 360, 'ghost', 'Призрак!', 'По коридору прошло что-то прозрачное.', { stage: 18 }],
      ['mourning', -60, 4320, 'grave', 'Траур', 'Чашка на полке стоит без хозяина.', { stage: 18 }],
      ['grief', -30, 2880, 'grave', 'Тоска по ушедшему', 'Вещи до сих пор лежат на своих местах.', { stage: 18 }],
      ['reaper', -50, 0, 'grave', 'Жнец рядом', 'Кто-то в чёрном стоит у двери.', { stage: 18, until: 'пока Жнец не уйдёт' }],
      ['bills', -15, 0, 'money', 'Неоплаченные счета', 'Конверты копятся у двери.', { stage: 16, until: 'пока счета не оплачены' }],
      ['broke', -20, 0, 'money', 'Денег нет', 'До зарплаты как до Луны.', { stage: 16, until: 'пока в кошельке пусто' }],
      ['repo', -25, 1440, 'money', 'Пришли за мебелью', 'Чужие люди выносили вещи за долги.', { stage: 16 }],
      ['socialWorker', -40, 1440, 'relations', 'Социальный работник', 'Ребёнка увезли. Дом опустел.', { stage: 17 }],
      ['fright', -15, 240, 'ghost', 'Испуг', 'Теперь каждый скрип половицы слышно.', { stage: 10 }],
      ['badOmen', -5, 240, 'chance', 'Плохая примета', 'Чёрный кот перебежал дорогу. Дважды.', { stage: 10 }],
      ['flood', -20, 0, 'wash', 'Потоп', 'Вода из-под раковины добралась до ковра.', { stage: 16, until: 'пока воду не уберут' }],
      ['mosquitoes', -5, 0, 'tree', 'Комары', 'У летнего вечера у воды есть своя цена.', { stage: 19, until: 'пока сим у воды вечером' }],
      ['repairBill', -10, 720, 'money', 'Счёт за ремонт', 'Мастер ушёл, а сумма осталась.', { stage: 16 }]
    ]]
  ];

  S.MOOD_GROUPS = GROUPS.map(([id, name, rows]) => ({ id, name, count: rows.length }));
  S.MOODLETS = {};
  for (const [group, , rows] of GROUPS) {
    for (const [id, value, mins, icon, name, text, extra] of rows) {
      const def = Object.assign({ id, group, value, mins, icon, name, text, stage: 9 }, extra || {});
      if (def.need) {
        def.cure = def.need;
        def.until = NEED_UNTIL[def.need];
      }
      S.MOODLETS[id] = def;
    }
  }
  const NEED_LEVELS = {};
  for (const def of Object.values(S.MOODLETS)) {
    if (def.need) (NEED_LEVELS[def.need] = NEED_LEVELS[def.need] || []).push(def);
  }
  for (const list of Object.values(NEED_LEVELS)) list.sort((a, b) => a.below - b.below);

  const roomInfo = (lot, floor, room) => {
    const house = lot.house, cache = house.moodRooms || (house.moodRooms = new Map()), key = floor * 4096 + room;
    if (cache.has(key)) return cache.get(key);
    const H = S.House, f = house.floors[floor], list = H.rooms(house, floor);
    let env = 0, windows = 0, lamps = 0;
    for (const item of house.items) {
      if (item.floor !== floor || item.seg) continue;
      const object = S.objectOf(item);
      if (object && object.env && H.roomAt(house, floor, item.x, item.z) === room) env += object.env;
    }
    for (const seg of f.walls.values()) {
      if (!seg.cut || !seg.cut.glass) continue;
      const [a, b] = H.sideRooms(house, f, seg);
      if ((a === room && b === 0) || (b === room && a === 0)) windows++;
    }
    for (const lamp of house.lamps) {
      if (lamp.floor === floor && H.roomAt(house, floor, lamp.x, lamp.z) === room) lamps++;
    }
    const area = list[room] ? list[room].area : 0;
    const info = { floor, room, area, env, windows, lamps, score: env + Math.min(windows, WINDOW_CAP) - area / ROOM_AREA_PER_POINT };
    cache.set(key, info);
    return info;
  };

  const roomOf = (world, sim) => {
    const lot = sim.lot;
    if (sim.inside || sim.car || !lot || !lot.house || !lot.house.floors.length || lot.closed) return null;
    if (sim.floor >= lot.house.floors.length) return null;
    const room = S.House.roomAt(lot.house, sim.floor, sim.x - lot.x, sim.z - lot.z);
    return room > 0 ? roomInfo(lot, sim.floor, room) : null;
  };

  const peopleIn = (world, sim, info) => {
    let count = 0;
    for (const other of world.live) {
      if (other.inside || other.car || other.lot !== sim.lot || other.floor !== sim.floor) continue;
      if (S.House.roomAt(sim.lot.house, other.floor, other.x - sim.lot.x, other.z - sim.lot.z) === info.room) count++;
    }
    return count;
  };

  const valueOf = (sim, def) => (S.Traits && sim.traits ? S.Traits.moodValue(sim, def) : def.value);

  const easelIn = (lot, info) => lot.house.items.some(item => item.floor === info.floor && !item.seg && S.KINDS[S.KIND_ID[item.kind]].model === 'easel' && S.House.roomAt(lot.house, info.floor, item.x, item.z) === info.room);

  const roomLevel = score => (score >= ROOM_WONDER ? 'wonderRoom' : score >= ROOM_NICE ? 'niceRoom' : score >= ROOM_COSY ? 'cosyRoom' : score <= ROOM_BARE ? 'bareRoom' : null);

  const heldNow = (world, sim) => {
    const out = [], T = S.Traits, has = id => !!(T && T.has(sim, id));
    for (const list of Object.values(NEED_LEVELS)) {
      const value = sim.needs[list[0].need], hit = list.find(def => value < def.below);
      if (hit) out.push(hit.id);
    }
    const info = roomOf(world, sim), minute = world.clock;
    if (info) {
      const level = roomLevel(info.score + (T ? T.sum(sim, 'room') : 0));
      if (level) out.push(level);
      if (!info.lamps && (S.lampsOn(minute / 60) || !info.windows)) out.push('dark');
      const people = peopleIn(world, sim, info);
      if (people >= CROWD_PEOPLE && people * CROWD_AREA > info.area) out.push('crowded');
      if (has('loner') && people <= 1) out.push('aloneTime');
      if (has('artHater') && easelIn(sim.lot, info)) out.push('artNearby');
    } else if (!sim.inside && !sim.car) {
      if (has('agoraphobic')) out.push('outsideBad');
      else if (minute >= SUN_FROM && minute < SUN_TO) out.push('sunnyDay');
      if (has('coward') && T.nightNow(world)) out.push('dark');
    }
    if (has('loser')) out.push('gloom');
    if (has('dislikesChildren') && world.family.some(o => o !== sim && S.AGE_RANK[o.age] <= S.AGE_RANK.child && T.sameRoom(o, sim))) out.push('kidsAround');
    if (S.Social && world.rels) out.push(...S.Social.heldMoods(world, sim));
    if (S.Food) out.push(...S.Food.heldMoods(world, sim));
    if (S.Garden) out.push(...S.Garden.heldMoods(world, sim));
    if (S.Jobs) out.push(...S.Jobs.heldMoods(world, sim));
    if (S.Upkeep) out.push(...S.Upkeep.heldMoods(world, sim));
    if (S.Services) out.push(...S.Services.heldMoods(world, sim));
    return T && sim.traits ? out.filter(id => !T.ignores(sim, id)) : out;
  };

  const eatingSeated = other => {
    const act = other.act;
    if (!act || !act.ad || act.phase !== 'run' || act.stood) return false;
    const step = S.ADS[act.ad].steps[act.step];
    return !!step && step.seat === 'chair' && other.state === 'sit';
  };

  const adFitsObject = (ad, model) => ad.obj === model || (ad.objs && ad.objs.includes(model));

  const timeText = left => {
    const total = Math.max(1, Math.ceil(left)), days = Math.floor(total / 1440), hours = Math.floor((total % 1440) / 60), mins = total % 60;
    if (days) return days + ' дн. ' + hours + ' ч';
    if (hours) return hours + ' ч' + (mins ? ' ' + mins + ' мин' : '');
    return mins + ' мин';
  };

  S.Moods = {
    MIN, MAX, ROOM_WONDER, ROOM_NICE, ROOM_COSY, ROOM_BARE, CURE_VERB,

    add(sim, id, mins, world) {
      if (S.Traits && sim.traits) id = S.Traits.swap(sim, id);
      const def = S.MOODLETS[id];
      if (!def || !sim.moods || !def.mins) return;
      if (S.Traits && sim.traits && S.Traits.ignores(sim, id)) return;
      const life = (mins || def.mins) * (S.Traits && sim.traits ? S.Traits.moodLife(sim, def) : 1);
      if (def.slot) sim.moods = sim.moods.filter(([other]) => other === id || S.MOODLETS[other].slot !== def.slot);
      const have = sim.moods.find(entry => entry[0] === id);
      if (have) have[1] = Math.max(have[1], life);
      else sim.moods.push([id, life]);
      if (S.Wishes) S.Wishes.onMood(sim, id);
      if (world && S.Traits) S.Traits.onMood(world, sim, id);
    },

    remove(sim, id) {
      if (sim.moods) sim.moods = sim.moods.filter(entry => entry[0] !== id);
    },

    has(sim, id) {
      return !!(sim.moods && sim.moods.some(entry => entry[0] === id)) || !!(sim.held && sim.held.includes(id));
    },

    list(sim) {
      if (!sim.moods) return [];
      const out = (sim.held || []).map(id => ({ id, def: S.MOODLETS[id], left: null }));
      for (const [id, left] of sim.moods) out.push({ id, def: S.MOODLETS[id], left });
      return out.sort((a, b) => Math.abs(valueOf(sim, b.def)) - Math.abs(valueOf(sim, a.def)) || (a.id < b.id ? -1 : 1));
    },

    mood(sim) {
      if (!sim.moods) return 0;
      let sum = 0;
      for (const id of sim.held || []) sum += valueOf(sim, S.MOODLETS[id]);
      for (const [id] of sim.moods) sum += valueOf(sim, S.MOODLETS[id]);
      return S.clamp(sum, MIN, MAX);
    },

    word(mood) {
      return MOOD_WORDS.find(([from]) => mood >= from)[1];
    },

    faceOf(mood) {
      return mood >= HAPPY_FACE ? 1 : mood < SAD_FACE ? -1 : 0;
    },

    timeText,
    valueOf,
    roomOf,
    roomInfo,
    roomLevel,

    step(world, sim, dt) {
      if (!sim.needs) return;
      if (sim.moods.length) {
        for (const entry of sim.moods) entry[1] -= dt;
        if (sim.moods.some(entry => entry[1] <= 0)) sim.moods = sim.moods.filter(entry => entry[1] > 0);
      }
      sim.held = heldNow(world, sim);
      if (S.Wishes && dt > 0) S.Wishes.held(sim, sim.held);
      sim.face = S.Moods.faceOf(S.Moods.mood(sim));
    },

    actDone(world, sim, act) {
      if (act.go && S.Wishes) S.Wishes.actDone(world, sim, act);
      if (S.Upkeep) S.Upkeep.actDone(world, sim, act);
      const hire = act.go && act.job ? S.Jobs.def({ id: act.job }) : null;
      if (hire && sim.inside && hire.lot === sim.inside.id) S.Jobs.join(world, sim, act.job);
      if (act.go && act.deliver && sim.inside && S.Opps) S.Opps.deliver(world, sim, act.deliver);
      if (act.go && sim.inside && sim.inside.kind === 'shop') {
        if (act.sell) S.Econ.sellAll(world, sim);
        if (act.buy) S.Econ.buySeeds(world, sim, act.buy);
      }
      if (!act.ad || !sim.moods) return;
      const ad = S.ADS[act.ad], partner = act.with !== undefined ? world.sims[act.with] : null;
      if (partner && ad.person) S.Social.lineDone(world, sim, partner, act);
      if (ad.phone) S.Social.phoneDone(world, sim, act);
      if (ad.cook) S.Food.cooked(world, sim, act);
      if (act.ad === 'chess_play') S.Skills.chessGame(world, sim);
      if (ad.book) S.Skills.bookDone(world, sim, act.ad);
      if (act.ad === 'guitar_song' || act.ad === 'guitar_tips') S.Art.guitarDone(world, sim, act);
      if (act.ad === 'pocket_thing' && sim.bag) S.Econ.give(world, sim, S.Econ.item('oddity', 'trinket', { v: S.Econ.ODDITIES.trinket[1], at: world.day * 1440 + world.clock }));
      if (act.food && act.food.produce) S.Garden.eaten(world, sim, act);
      if ((act.ad === 'punchbag_hit' || act.ad === 'tv_workout') && S.Skills.level(sim, 'athletic') < SORE_BELOW && S.roll(world.rng) < SORE_CHANCE) S.Moods.add(sim, 'sore', 0, world);
      if (act.kind) S.Moods.add(sim, 'kindDeed', 0, world);
      S.Traits.actDone(world, sim, act, partner);
      if (S.Wishes) S.Wishes.actDone(world, sim, act);
      for (const def of Object.values(S.MOODLETS)) {
        if (def.clear && def.clear.includes(act.ad)) S.Moods.remove(sim, def.id);
      }
      if (act.ad === 'bed_sleep') {
        if (sim.needs.energy < FULL_SLEEP) return;
        const item = act.item >= 0 ? world.lots[act.lot].house.items[act.item] : null, model = item ? S.KINDS[S.KIND_ID[item.kind]].model : null;
        S.Moods.add(sim, model === 'small_bed' && sim.age === 'adult' ? 'smallBed' : 'wellRested', 0, world);
        return;
      }
      if (act.ad === 'fridge_snack' && world.clock < NIGHT_SNACK_TO) {
        S.Moods.add(sim, 'midnightSnack', 0, world);
        return;
      }
      if (MEALS.has(act.ad)) {
        if (act.food) S.Food.eaten(world, sim, act);
        if (act.stood) {
          S.Moods.add(sim, 'standingMeal', 0, world);
          return;
        }
        if (world.family.some(other => other !== sim && eatingSeated(other))) S.Moods.add(sim, 'familyDinner', 0, world);
      }
      if (ad.mood && !act.failed) S.Moods.add(sim, ad.mood, 0, world);
      if (act.ad === 'punchbag_hit' || act.ad === 'exercise' || act.ad === 'tv_workout') S.Moods.add(sim, 'sweaty', 0, world);
      if (act.go && act.mood) S.Moods.add(sim, act.mood, 0, world);
    },

    actDropped(world, sim, act) {
      if (!act || !sim.moods) return;
      if (act.ad === 'bed_sleep' && act.phase === 'run' && sim.needs.energy < BROKEN_SLEEP) S.Moods.add(sim, 'wokenUp', 0, world);
      if (act.listen && act.ad === 'sim_chat' && act.mins - act.left >= CHAT_HEARD) S.Moods.add(sim, 'niceChat', 0, world);
    },

    listened(world, sim, act) {
      if (act.ad === 'sim_chat' && act.mins - act.left >= CHAT_HEARD) S.Moods.add(sim, 'niceChat', 0, world);
    },

    curable: def => !!(def && (def.cure || def.cureAd) && def.value <= 0),

    cure(world, sim, id) {
      const def = S.MOODLETS[id];
      if (!S.Moods.curable(def) || !sim.needs) return false;
      if (def.cure) return S.Acts.forNeed(world, sim, def.cure);
      const ad = S.ADS[def.cureAd], item = sim.home.house.items.find(i => S.objectOf(i) && adFitsObject(ad, S.KINDS[S.KIND_ID[i.kind]].model));
      return !!item && S.Acts.add(world, sim, S.Acts.adAct(def.cureAd, sim.home, item));
    },

    pack(sim) {
      return sim.moods ? sim.moods.map(([id, left]) => [id, left]) : null;
    },

    unpack(list) {
      if (list === null) return null;
      if (!Array.isArray(list)) throw new Error('повреждены мудлеты жителя');
      for (const entry of list) {
        if (!Array.isArray(entry) || !S.MOODLETS[entry[0]] || !Number.isFinite(entry[1])) throw new Error('неизвестный мудлет в файле: ' + (Array.isArray(entry) ? entry[0] : entry));
      }
      return list.map(([id, left]) => [id, left]);
    }
  };
})(globalThis.Sims98 = globalThis.Sims98 || {});
