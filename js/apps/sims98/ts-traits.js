(function (S) {
  'use strict';
  const COUNTS = { toddler: 2, child: 3, teen: 4, adult: 5 };
  const NIGHT_FROM = 22 * 60, NIGHT_TO = 6 * 60, WORRY_FROM = 21 * 60;
  const GREET_REACH = 3, GREET_EVERY = 120, WAKE_REACH = 4, ROOM_REACH = 6;

  const GROUPS = [
    ['mind', 'Ум', [
      ['absentMinded', ['Рассеянный', 'Рассеянная'], 'toddler', [], 'question', 'Начатое дело может просто вылететь из головы.', { reactions: ['forget'], pastimes: ['daydream'], link: 'forgotWhy', wishes: ['calm'] }],
      ['artistic', ['Творец', 'Творец'], 'toddler', ['artHater'], 'paint', 'Рисует охотнее всех, и картины выходят лучше.', { likes: { easel_paint: 3 }, pastimes: ['easel_paint'], longer: ['inspired'], link: 'inspired', wishes: ['art'] }],
      ['bookworm', ['Книжник', 'Книжница'], 'child', [], 'book', 'Книга интереснее телевизора. Читает долго и с удовольствием.', { likes: { book_read: 3, tv_watch: 0.6 }, pastimes: ['book_read'], longer: ['greatBook'], link: 'greatBook', wishes: ['books'] }],
      ['artHater', ['Не терпит искусства', 'Не терпит искусства'], 'child', ['artistic', 'easilyImpressed'], 'paint', 'Мольберт раздражает, картины кажутся мазнёй.', { likes: { easel_paint: 0, mock_art: 3 }, pastimes: ['mock_art'], link: 'artNearby', wishes: ['calm'] }],
      ['computerWhiz', ['Компьютерщик', 'Компьютерщица'], 'child', ['technophobe'], 'keys', 'Может сидеть за компьютером часами и чинит его сам.', { likes: { computer_play: 3, computer_chat: 2, tinker: 1.5 }, pastimes: ['computer_play', 'tinker'], longer: ['gameWin'], link: 'gameWin', wishes: ['tech'] }],
      ['excitable', ['Восторженный', 'Восторженная'], 'toddler', ['grumpy'], 'sun', 'Радуется дольше, огорчается короче и ахает от мелочей.', { good: 1.5, bad: 0.67, needs: { fun: 0.85 }, reactions: ['cheer'], link: 'thrilled', wishes: ['fun'] }],
      ['genius', ['Гений', 'Гений'], 'toddler', [], 'chess', 'Шахматы и задачи даются легко и приносят радость.', { likes: { chess_play: 3, computer_play: 1.5, book_read: 1.5 }, pastimes: ['chess_play'], longer: ['chessGame'], link: 'chessGame', wishes: ['logic'] }],
      ['greenThumb', ['Садовод', 'Садовод'], 'teen', [], 'tree', 'Ухаживает за кустами и разговаривает с растениями.', { likes: { water_bush: 3, garden_water: 3, garden_weed: 2, garden_harvest: 2 }, pastimes: ['water_bush'], link: 'gardening', wishes: ['garden'] }],
      ['handy', ['Рукастый', 'Рукастая'], 'teen', [], 'skills', 'Подкручивает технику сам, мастер не нужен.', { likes: { tinker: 3, repair: 3 }, pastimes: ['tinker'], link: 'fixedIt', wishes: ['fix'] }],
      ['eccentric', ['Чудак', 'Чудачка'], 'toddler', [], 'question', 'Ведёт долгие беседы без собеседника, и никого это уже не удивляет.', { likes: { talk_self: 3 }, pastimes: ['talk_self'], link: 'selfTalk', wishes: ['odd'] }],
      ['naturalCook', ['Прирождённый повар', 'Прирождённый повар'], 'teen', [], 'cook', 'Готовит часто и вкусно, холодное из холодильника не любит.', { likes: { cook_meal: 3, grill_cook: 2, fridge_cold: 0.3, fridge_snack: 0.6 }, swap: { homeMeal: 'tastyDish', grilled: 'tastyDish' }, link: 'tastyDish', wishes: ['cooking'] }],
      ['neurotic', ['Невротик', 'Невротик'], 'toddler', [], 'bolt', 'Вечером тревожится о плите и ходит её проверять.', { likes: { check_stove: 3 }, reactions: ['worry'], link: 'worried', wishes: ['calm'] }],
      ['virtuoso', ['Виртуоз', 'Виртуоз'], 'toddler', [], 'music', 'Всё время что-то напевает и любит музыку громче других.', { likes: { stereo_listen: 2.5, hum_tune: 3 }, pastimes: ['hum_tune', 'stereo_listen'], longer: ['dancing'], link: 'dancing', wishes: ['music'] }]
    ]],
    ['body', 'Тело', [
      ['athletic', ['Спортивный', 'Спортивная'], 'toddler', ['couchPotato'], 'punch', 'Груша, разминка и пробежка вокруг квартала. Устаёт меньше других.', { likes: { punchbag_hit: 3, exercise: 3, jog: 3, tv_watch: 0.6 }, pastimes: ['exercise', 'jog', 'punchbag_hit'], needs: { energy: 0.9 }, longer: ['workedOut'], link: 'jog', wishes: ['fitness'] }],
      ['brave', ['Храбрый', 'Храбрая'], 'toddler', ['coward', 'loser'], 'fire', 'Темноты и ночных улиц не боится. Пожара и вора тоже не испугается.', { ignore: ['dark', 'fright', 'cemeteryNight'], likes: { jog: 2 }, pastimes: ['jog'], nightOut: true, link: 'dark', wishes: ['adventure'] }],
      ['clumsy', ['Неуклюжий', 'Неуклюжая'], 'toddler', [], 'exclaim', 'Спотыкается на ровном месте и роняет всё, что держит.', { reactions: ['stumble'], link: 'awkward', wishes: ['fitness'] }],
      ['couchPotato', ['Лежебока', 'Лежебока'], 'toddler', ['athletic', 'technophobe'], 'tv', 'Лучшее место в доме: диван перед телевизором.', { likes: { tv_watch: 3, sofa_nap: 2.5, sofa_sit: 2, punchbag_hit: 0.15, exercise: 0, jog: 0 }, pastimes: ['tv_watch', 'sofa_nap'], needs: { energy: 1.1 }, longer: ['goodShow'], link: 'goodShow', wishes: ['tv'] }],
      ['coward', ['Трус', 'Трусиха'], 'child', ['brave', 'daredevil'], 'ghost', 'Боится темноты и ночных улиц, от призраков убегает.', { double: ['dark'], darkOutside: true, likes: { jog: 0.5 }, reactions: ['spook'], link: 'fright', wishes: ['calm'], later: 18 }],
      ['heavySleeper', ['Крепкий сон', 'Крепкий сон'], 'toddler', ['lightSleeper'], 'sleep', 'Спит крепко, разбудить почти невозможно.', { ignore: ['wokenUp'], sleep: 1.2, link: 'wellRested', wishes: ['calm'] }],
      ['hydrophobic', ['Водобоязнь', 'Водобоязнь'], 'child', [], 'wash', 'Ванна пугает, душ ещё терпим, проще просто умыться.', { likes: { bath_take: 0.1, shower_take: 0.5, sink_wash: 2 }, after: { shower_take: 'brr', bath_take: 'brr' }, link: 'brr', wishes: ['calm'], later: 19 }],
      ['lightSleeper', ['Чуткий сон', 'Чуткий сон'], 'toddler', ['heavySleeper'], 'sleep', 'Просыпается от любого шага рядом.', { reactions: ['wake'], sleep: 0.9, link: 'wokenUp', wishes: ['calm'] }],
      ['lucky', ['Счастливчик', 'Счастливица'], 'child', ['unlucky'], 'money', 'То мелочь на дороге найдёт, то просто повезёт.', { reactions: ['luck'], link: 'foundIt', wishes: ['money'] }],
      ['neat', ['Чистюля', 'Чистюля'], 'child', ['slob'], 'wash', 'Моется чаще других и наводит блеск без просьб.', { likes: { shower_take: 1.6, sink_wash: 2, kitchen_wash: 2, polish: 3, wash_dishes: 3, trash_out: 2, scrub_toilet: 2 }, needs: { hygiene: 1.3 }, double: ['unfresh', 'smelly', 'dirty', 'filthy', 'trashSmell', 'dirtyToilet'], pastimes: ['polish'], link: 'unfresh', wishes: ['home'] }],
      ['shy', ['Стыдливый', 'Стыдливая'], 'child', [], 'mask', 'Мыться при ком-то стыдно, даже если это свои.', { likes: { shower_take: 0.3, bath_take: 3 }, reactions: ['blush'], link: 'awkward', later: 19, wishes: ['calm'] }],
      ['slob', ['Неряха', 'Неряха'], 'toddler', ['neat'], 'dirt', 'Грязь не замечает, мыться не спешит.', { needs: { hygiene: 0.7 }, ignore: ['unfresh', 'smelly', 'dirty', 'filthy', 'trashSmell', 'dirtyToilet'], likes: { shower_take: 0.6, sink_wash: 0.4, kitchen_wash: 0.3, sneak_snack: 2, wash_dishes: 0.2, trash_out: 0.2, scrub_toilet: 0.2 }, pastimes: ['sneak_snack'], link: 'smelly', wishes: ['fun'] }],
      ['unlucky', ['Неудачник с рождения', 'Неудачница с рождения'], 'child', ['lucky'], 'cloud', 'Если что-то может пойти не так, оно пойдёт.', { reactions: ['badLuck'], link: 'badOmen', later: 18, wishes: ['calm'] }]
    ]],
    ['social', 'Общение', [
      ['charismatic', ['Обаятельный', 'Обаятельная'], 'teen', ['loser'], 'talk', 'Разговор с таким человеком всегда в радость.', { likes: { sim_chat: 2, compliment: 3 }, social: 1.3, link: 'niceChat', wishes: ['friends'] }],
      ['commitmentIssues', ['Боится обязательств', 'Боится обязательств'], 'teen', ['hopelessRomantic'], 'ring', 'Долго дома не усидеть, всё время тянет уйти.', { likes: { walk: 2.5 }, pastimes: ['walk'], double: ['crowded'], link: 'crowded', wishes: ['freedom'] }],
      ['dislikesChildren', ['Не любит детей', 'Не любит детей'], 'teen', ['familyOriented', 'childish'], 'baby', 'Морщится, когда рядом шумят дети.', { kids: 0.2, link: 'kidsAround', wishes: ['calm'] }],
      ['easilyImpressed', ['Легко впечатлить', 'Легко впечатлить'], 'toddler', ['artHater', 'snob'], 'sun', 'Радуется любой мелочи, и хорошее настроение держится дольше.', { plus: 5, reactions: ['cheer'], link: 'thrilled', wishes: ['fun'] }],
      ['flirty', ['Кокетливый', 'Кокетливая'], 'adult', ['unflirty'], 'heart', 'Флиртует так же легко, как здоровается.', { likes: { sim_chat: 1.4, daydream: 1.5 }, pastimes: ['daydream'], link: 'dreamy', wishes: ['romance'] }],
      ['friendly', ['Дружелюбный', 'Дружелюбная'], 'toddler', ['meanSpirited'], 'relations', 'Здоровается первым и легко заводит друзей.', { likes: { sim_chat: 2, compliment: 2 }, reactions: ['greet'], link: 'niceChat', wishes: ['friends'] }],
      ['goodHumor', ['С юмором', 'С юмором'], 'child', ['noHumor'], 'toy', 'Шутит к месту и смеётся над комедиями громче всех.', { likes: { tell_joke: 3, tv_watch: 1.3 }, reactions: ['laugh'], link: 'laughed', wishes: ['fun'] }],
      ['greatKisser', ['Мастер поцелуев', 'Мастер поцелуев'], 'adult', [], 'heart', 'Поцелуй такого человека запоминается надолго.', { likes: { daydream: 1.5 }, pastimes: ['daydream'], link: 'kiss', wishes: ['romance'] }],
      ['grumpy', ['Ворчун', 'Ворчунья'], 'toddler', ['excitable', 'hotHeaded'], 'cloud', 'Ворчит на всё подряд, плохое помнит дольше хорошего.', { good: 0.67, bad: 1.5, likes: { grumble: 3, complain: 2 }, pastimes: ['grumble'], reactions: ['grouse'], link: 'grumbled', wishes: ['calm'] }],
      ['hopelessRomantic', ['Романтик', 'Романтик'], 'teen', ['commitmentIssues'], 'heart', 'Мечтает о любви и обожает закаты.', { likes: { daydream: 3 }, pastimes: ['daydream'], link: 'dreamy', wishes: ['romance'] }],
      ['inappropriate', ['Бестактный', 'Бестактная'], 'child', [], 'exclaim', 'Говорит то, о чём другие молчат, и не всегда вовремя.', { likes: { tease: 1.5 }, reactions: ['blurt'], link: 'awkward', wishes: ['odd'] }],
      ['loner', ['Одиночка', 'Одиночка'], 'toddler', ['partyAnimal'], 'home', 'Одному спокойнее, толпа утомляет.', { needs: { social: 0.5 }, ignore: ['lonely', 'noOne'], likes: { sim_chat: 0.3, compliment: 0.3, tell_joke: 0.3, heart_talk: 0.3 }, double: ['crowded'], link: 'aloneTime', wishes: ['calm'] }],
      ['loser', ['Лузер', 'Лузер'], 'child', ['brave', 'charismatic'], 'cloud', 'Неудачи не удивляют, а успех радует вдвое.', { goodValue: 2, likes: { complain: 1.5, grumble: 1.2 }, link: 'gloom', wishes: ['calm'] }],
      ['meanSpirited', ['Вредный', 'Вредная'], 'child', ['friendly'], 'fire', 'Любит подколоть и пнуть что-нибудь по пути.', { likes: { tease: 3, kick_trash: 2 }, pastimes: ['kick_trash'], link: 'mocked', wishes: ['mischief'] }],
      ['mooch', ['Халявщик', 'Халявщица'], 'child', [], 'eat', 'Таскает еду из холодильника и не стесняется просить.', { likes: { sneak_snack: 3, fridge_snack: 1.5, cook_meal: 0.6 }, pastimes: ['sneak_snack'], link: 'snack', wishes: ['money'] }],
      ['noHumor', ['Без юмора', 'Без юмора'], 'child', ['goodHumor'], 'tv', 'Шуток не понимает, комедии смотрит с каменным лицом.', { likes: { tv_watch: 0.6, tell_joke: 0, crossword: 3 }, pastimes: ['crossword'], noJokes: true, link: 'awkward', wishes: ['calm'] }],
      ['partyAnimal', ['Тусовщик', 'Тусовщица'], 'child', ['loner'], 'music', 'Музыку громче, людей больше. Без компании скучно.', { needs: { social: 1.4 }, likes: { sim_chat: 2, stereo_listen: 2, walk: 1.5 }, pastimes: ['stereo_listen', 'walk'], link: 'dancing', wishes: ['friends'] }],
      ['schmoozer', ['Подхалим', 'Подхалим'], 'teen', [], 'job', 'Знает, кому и что приятно услышать.', { likes: { compliment: 3 }, link: 'compliment', wishes: ['career'] }],
      ['snob', ['Сноб', 'Сноб'], 'child', ['easilyImpressed'], 'rewards', 'Простая еда и простая обстановка не по вкусу.', { likes: { fridge_cold: 0.4, fridge_snack: 0.5, eat_leftovers: 0.5, cook_meal: 1.5 }, room: -3, link: 'cheapStuff', wishes: ['luxury'], later: 23 }],
      ['unflirty', ['Недотрога', 'Недотрога'], 'teen', ['flirty'], 'heartBroken', 'Романтику держит на расстоянии вытянутой руки.', { likes: { daydream: 0, sim_chat: 0.5, book_read: 2 }, pastimes: ['book_read'], link: 'rejected', wishes: ['calm'] }]
    ]],
    ['life', 'Образ жизни', [
      ['ambitious', ['Честолюбивый', 'Честолюбивая'], 'child', [], 'job', 'Хочет большего и тратит время с пользой.', { likes: { chess_play: 1.5, book_read: 1.5, computer_play: 1.2, work_home: 2, tv_watch: 0.6 }, pastimes: ['work_home'], link: 'goodWorkday', wishes: ['career'] }],
      ['angler', ['Рыбак', 'Рыбачка'], 'child', [], 'fish', 'Тянет к воде, на прогулке ищет, где бы закинуть удочку.', { likes: { walk: 2, fish_pond: 3 }, pastimes: ['walk', 'fish_pond'], bubble: 'fish', link: 'fishing', wishes: ['fishing'] }],
      ['childish', ['Вечный ребёнок', 'Вечный ребёнок'], 'teen', ['dislikesChildren'], 'toy', 'Играет с игрушками в любом возрасте и смешит детей.', { likes: { toybox_play: 3 }, toys: true, pastimes: ['toybox_play'], link: 'playtime', wishes: ['fun'] }],
      ['daredevil', ['Сорвиголова', 'Сорвиголова'], 'child', ['coward'], 'bolt', 'Всюду бегом, разминка вместо отдыха.', { runs: true, likes: { exercise: 2, punchbag_hit: 1.5, jog: 2 }, pastimes: ['jog', 'exercise'], nightOut: true, link: 'workedOut', wishes: ['adventure'] }],
      ['evil', ['Злой', 'Злая'], 'toddler', ['goodTrait'], 'fire', 'Радуется чужим неудачам и не упустит случая напакостить.', { likes: { tease: 3, kick_trash: 3 }, pastimes: ['kick_trash'], reactions: ['gloat'], link: 'gloat', wishes: ['mischief'] }],
      ['familyOriented', ['Семьянин', 'Семьянинка'], 'child', ['dislikesChildren'], 'home', 'Дом и семья прежде всего. Ужин всей семьёй как праздник.', { likes: { heart_talk: 3, sim_chat: 1.3 }, double: ['familyDinner'], link: 'familyDinner', wishes: ['family'] }],
      ['frugal', ['Бережливый', 'Бережливая'], 'child', [], 'money', 'Считает каждую монету и любит простую еду.', { likes: { fridge_cold: 1.5, grill_cook: 0.5, count_money: 3 }, pastimes: ['count_money'], link: 'coldMeal', wishes: ['money'] }],
      ['goodTrait', ['Добрый', 'Добрая'], 'toddler', ['evil'], 'heart', 'Подбодрит того, кому плохо, и скажет доброе слово.', { likes: { compliment: 3, heart_talk: 2 }, reactions: ['comfort'], link: 'kindDeed', wishes: ['friends'] }],
      ['agoraphobic', ['Не выносит улицу', 'Не выносит улицу'], 'toddler', ['natureLover'], 'home', 'На улице неуютно, дома лучше.', { likes: { grill_cook: 0.2, mailbox_check: 0.4, walk: 0, jog: 0, water_bush: 0.2, book_read: 1.5, tv_watch: 1.5 }, pastimes: ['book_read', 'tv_watch'], outside: 'outsideBad', link: 'outsideBad', wishes: ['calm'] }],
      ['hotHeaded', ['Вспыльчивый', 'Вспыльчивая'], 'child', ['grumpy'], 'fire', 'Вспыхивает от любой неудачи, но быстро отходит.', { likes: { kick_trash: 1.5, punchbag_hit: 1.5 }, pastimes: ['kick_trash', 'punchbag_hit'], reactions: ['rage'], link: 'fumed', wishes: ['calm'] }],
      ['kleptomaniac', ['Клептоман', 'Клептоманка'], 'child', [], 'mask', 'Безделушки сами прыгают в карман.', { likes: { pocket_thing: 3, sneak_snack: 1.5 }, pastimes: ['pocket_thing'], link: 'trophy', wishes: ['mischief'] }],
      ['natureLover', ['Любит природу', 'Любит природу'], 'toddler', ['agoraphobic'], 'tree', 'На улице оживает, в четырёх стенах скучает.', { double: ['sunnyDay'], likes: { walk: 3, grill_cook: 1.5, water_bush: 2 }, pastimes: ['walk', 'water_bush'], link: 'sunnyDay', wishes: ['nature'] }],
      ['tearful', ['Слезливый', 'Слезливая'], 'child', [], 'wash', 'Плачет над сериалами, и слёзы трогают всех вокруг.', { likes: { tv_watch: 2 }, reactions: ['cry'], link: 'cried', wishes: ['family'] }],
      ['perfectionist', ['Перфекционист', 'Перфекционистка'], 'child', [], 'rewards', 'Делает дольше, зато без единого изъяна.', { slow: 1.3, reactions: ['perfect'], link: 'flawless', wishes: ['skills'] }],
      ['technophobe', ['Технофоб', 'Технофоб'], 'child', ['computerWhiz', 'couchPotato'], 'bolt', 'Техника пугает. Книга и прогулка надёжнее.', { likes: { computer_play: 0.05, computer_chat: 0.05, tv_watch: 0.4, stereo_listen: 0.6, book_read: 1.5, walk: 1.5, tinker: 0, repair: 0.3 }, link: 'shock', wishes: ['calm'] }],
      ['vegetarian', ['Вегетарианец', 'Вегетарианка'], 'child', [], 'eat', 'Мяса не ест и жарить его не станет.', { likes: { grill_cook: 0, cook_meal: 1.5, fridge_cold: 1.3, veggie_snack: 3 }, pastimes: ['veggie_snack'], after: { grill_cook: 'ateMeat' }, link: 'ateMeat', wishes: ['cooking'] }],
      ['workaholic', ['Трудоголик', 'Трудоголик'], 'child', [], 'job', 'Работает даже дома и не знает, чем занять выходной.', { likes: { work_home: 3, tv_watch: 0.7 }, pastimes: ['work_home'], link: 'goodWorkday', wishes: ['career'] }]
    ]]
  ];

  const HIDDEN = [
    ['catchesThieves', ['Ловит воров', 'Ловит воров'], 'Знает, как задержать вора и не пострадать.', 16],
    ['salutes', ['Отдаёт честь', 'Отдаёт честь'], 'Приветствует строго по уставу.', 15],
    ['firefighter', ['Укротитель огня', 'Укротительница огня'], 'Тушит огонь быстро и без паники.', 16],
    ['chefSecrets', ['Секреты шефа', 'Секреты шефа'], 'Знает блюда, которых нет ни в одной книге.', 15],
    ['bedsideManner', ['Врачебный такт', 'Врачебный такт'], 'Успокаивает одним разговором.', 15],
    ['newsNose', ['Нюх на новости', 'Нюх на новости'], 'Первым узнаёт, что случилось в городе.', 15]
  ];

  const PASTIME_GO = {
    walk: { name: 'Прогулка', range: [12, 20], run: false, mood: 'walk', bubble: 'tree' },
    jog: { name: 'Пробежка', range: [14, 22], run: true, mood: 'jog', bubble: 'walk' }
  };

  const REACTION_CHANCE = {
    forget: 0.08, stumble: 0.035, cheer: 0.5, laugh: 0.5, cry: 0.5, gloat: 0.6, grouse: 0.5, rage: 1, luck: 0.06, badLuck: 0.05,
    wake: 0.3, perfect: 0.3, blurt: 0.35, blush: 0.25, comfort: 0.5, spook: 0.25
  };
  const COOLDOWN = { greet: GREET_EVERY, gloat: 60, grouse: 45, blush: 60, cheer: 30, comfort: 120, luck: 60, badLuck: 240, stumble: 20, wake: 60, spook: 120 };

  S.TRAIT_GROUPS = GROUPS.map(([id, name, rows]) => ({ id, name, count: rows.length }));
  S.TRAITS = {};
  GROUPS.forEach(([group, , rows]) => {
    for (const [id, names, age, conflicts, icon, text, fx] of rows) S.TRAITS[id] = Object.assign({ id, group, names, age, conflicts, icon, text, likes: {} }, fx);
  });
  S.HIDDEN_TRAITS = {};
  for (const [id, names, text, stage] of HIDDEN) S.HIDDEN_TRAITS[id] = { id, names, text, stage, hidden: true };

  const rank = age => S.AGE_RANK[age];

  const nightNow = world => world.clock >= NIGHT_FROM || world.clock < NIGHT_TO;

  const sameRoom = (a, b) => {
    if (a.inside || b.inside || a.car || b.car || a.lot !== b.lot || a.floor !== b.floor || !a.lot) return false;
    if (Math.hypot(a.x - b.x, a.z - b.z) > ROOM_REACH * 3) return false;
    const lot = a.lot, h = lot.house;
    if (!h || !h.floors.length || lot.closed || a.floor >= h.floors.length) return Math.hypot(a.x - b.x, a.z - b.z) < ROOM_REACH;
    const ra = S.House.roomAt(h, a.floor, a.x - lot.x, a.z - lot.z), rb = S.House.roomAt(h, b.floor, b.x - lot.x, b.z - lot.z);
    return ra > 0 ? ra === rb : rb === 0 && Math.hypot(a.x - b.x, a.z - b.z) < ROOM_REACH;
  };

  const state = sim => sim.traitState || (sim.traitState = {});

  const ready = (world, sim, key) => {
    const at = state(sim)[key];
    return at === undefined || world.day * 1440 + world.clock >= at;
  };

  const rest = (world, sim, key, mins) => {
    state(sim)[key] = world.day * 1440 + world.clock + mins;
  };

  const roll = (world, key) => S.roll(world.rng) < REACTION_CHANCE[key];

  const bubble = (sim, icon) => {
    sim.bubble = icon;
    sim.bubbleLeft = 3;
  };

  S.Traits = {
    COUNTS, PASTIME_GO, REACTION_CHANCE, COOLDOWN,

    of: sim => sim.traits || [],

    has: (sim, id) => !!(sim && sim.traits && sim.traits.includes(id)),

    name(id, sex) {
      const def = S.TRAITS[id] || S.HIDDEN_TRAITS[id];
      return def ? def.names[sex === 'f' ? 1 : 0] : id;
    },

    fits(list, id, age) {
      const def = S.TRAITS[id];
      if (!def || list.includes(id) || rank(age) < rank(def.age)) return false;
      return list.every(other => !def.conflicts.includes(other) && !S.TRAITS[other].conflicts.includes(id));
    },

    random(rng, age, count, start) {
      const out = (start || []).slice(), ids = Object.keys(S.TRAITS), want = count === undefined ? COUNTS[age] : count;
      for (let tries = 0; out.length < want && tries < 400; tries++) {
        const id = ids[Math.floor(S.roll(rng) * ids.length)];
        if (S.Traits.fits(out, id, age)) out.push(id);
      }
      return out;
    },

    adFactor(sim, adId) {
      let k = 1;
      for (const id of S.Traits.of(sim)) {
        const like = S.TRAITS[id].likes[adId];
        if (like !== undefined) k *= like;
      }
      return k;
    },

    needRate(sim, need) {
      let k = 1;
      for (const id of S.Traits.of(sim)) {
        const needs = S.TRAITS[id].needs;
        if (needs && needs[need]) k *= needs[need];
      }
      return k;
    },

    any(sim, key) {
      return S.Traits.of(sim).some(id => S.TRAITS[id][key]);
    },

    product(sim, key) {
      let k = 1;
      for (const id of S.Traits.of(sim)) {
        const v = S.TRAITS[id][key];
        if (typeof v === 'number') k *= v;
      }
      return k;
    },

    sum(sim, key) {
      let k = 0;
      for (const id of S.Traits.of(sim)) {
        const v = S.TRAITS[id][key];
        if (typeof v === 'number') k += v;
      }
      return k;
    },

    listed(sim, key, value) {
      return S.Traits.of(sim).some(id => (S.TRAITS[id][key] || []).includes(value));
    },

    ignores: (sim, moodId) => S.Traits.listed(sim, 'ignore', moodId),

    moodLife(sim, def) {
      let k = def.value > 0 ? S.Traits.product(sim, 'good') : S.Traits.product(sim, 'bad');
      if (S.Traits.listed(sim, 'longer', def.id)) k *= 1.5;
      return k;
    },

    moodValue(sim, def) {
      let v = def.value;
      if (S.Traits.listed(sim, 'double', def.id)) v *= 2;
      if (v > 0) v = v * S.Traits.product(sim, 'goodValue') + S.Traits.sum(sim, 'plus');
      return Math.round(v);
    },

    swap(sim, moodId) {
      for (const id of S.Traits.of(sim)) {
        const swap = S.TRAITS[id].swap;
        if (swap && swap[moodId]) return swap[moodId];
      }
      return moodId;
    },

    after(sim, adId) {
      const out = [];
      for (const id of S.Traits.of(sim)) {
        const after = S.TRAITS[id].after;
        if (after && after[adId]) out.push(after[adId]);
      }
      return out;
    },

    pastimes(sim) {
      const out = new Map();
      for (const id of S.Traits.of(sim)) {
        for (const p of S.TRAITS[id].pastimes || []) out.set(p, (out.get(p) || 0) + 1);
      }
      return [...out.entries()];
    },

    known(viewer, other) {
      const all = S.Traits.of(other);
      if (viewer === other || (viewer.home && viewer.home === other.home && !viewer.free && !other.free)) return all.slice();
      const knows = viewer.knows && viewer.knows[other.id];
      return all.map(id => (knows && knows.includes(id) ? id : null));
    },

    learn(world, viewer, other) {
      if (!viewer.knows || viewer === other || other.free === false && viewer.home === other.home) return null;
      const known = viewer.knows[other.id] || [], fresh = S.Traits.of(other).filter(id => !known.includes(id));
      if (!fresh.length) return null;
      const id = fresh[Math.floor(S.roll(world.rng) * fresh.length)];
      viewer.knows[other.id] = known.concat([id]);
      if (S.Wishes) S.Wishes.learned(viewer);
      world.events.push({ type: 'learn', sim: viewer.id, name: viewer.name, other: other.name, trait: S.Traits.name(id, other.sex) });
      return id;
    },

    hold(sim, mins, clip, icon) {
      if (sim.hold > 0 || sim.inside || sim.car) return false;
      sim.hold = mins;
      sim.holdClip = clip;
      if (icon) bubble(sim, icon);
      return true;
    },

    bubble,
    ready,
    rest,

    react(world, sim, key, other) {
      if (!sim.traits) return false;
      if (REACTION_CHANCE[key] !== undefined && !roll(world, key)) return false;
      if (COOLDOWN[key] && !ready(world, sim, key)) return false;
      if (COOLDOWN[key]) rest(world, sim, key, COOLDOWN[key]);
      const add = id => S.Moods.add(sim, id, 0, world);
      if (S.Wishes && (key === 'stumble' || key === 'badLuck')) S.Wishes.mark(sim, key);
      if (key === 'forget') {
        S.Acts.dropCurrent(world, sim);
        S.Traits.hold(sim, 1, 'think', 'question');
        add('forgotWhy');
      } else if (key === 'stumble') {
        S.Traits.hold(sim, 1.2, 'stumble', 'exclaim');
        add('awkward');
      } else if (key === 'greet') {
        S.Traits.hold(sim, 0.7, 'wave', 'talk');
      } else if (key === 'cheer') {
        bubble(sim, 'sun');
        add('thrilled');
      } else if (key === 'laugh') {
        S.Traits.hold(sim, 1, 'laugh', 'toy');
        add('laughed');
      } else if (key === 'cry') {
        S.Traits.hold(sim, 3, 'cry', 'wash');
        add('cried');
        for (const o of world.family) if (o !== sim && sameRoom(o, sim)) S.Moods.add(o, 'touched', 0, world);
      } else if (key === 'gloat') {
        S.Traits.hold(sim, 1, 'laugh', 'fire');
        add('gloat');
      } else if (key === 'grouse') {
        bubble(sim, 'cloud');
        if (S.roll(world.rng) < 0.4) S.Traits.hold(sim, 1, 'grumble');
      } else if (key === 'rage') {
        S.Traits.hold(sim, 1, 'punch', 'fire');
        add('fumed');
      } else if (key === 'luck') {
        bubble(sim, 'money');
        add('foundIt');
      } else if (key === 'badLuck') {
        bubble(sim, 'cloud');
        add('badOmen');
      } else if (key === 'wake') {
        S.Acts.dropCurrent(world, sim);
        bubble(sim, 'exclaim');
      } else if (key === 'perfect') {
        bubble(sim, 'rewards');
        add('flawless');
      } else if (key === 'blurt') {
        bubble(sim, 'exclaim');
        if (other && other.moods) S.Moods.add(other, 'awkward', 0, world);
      } else if (key === 'blush') {
        bubble(sim, 'mask');
        add('awkward');
      } else if (key === 'spook') {
        S.Traits.hold(sim, 1, 'cry', 'ghost');
        add('fright');
      } else if (key === 'worry') {
        bubble(sim, 'bolt');
        add('worried');
      }
      world.events.push({ type: 'react', sim: sim.id, key });
      return true;
    },

    onMood(world, sim, id) {
      const def = S.MOODLETS[id];
      if (!def || !def.mins) return;
      if (def.value > 0 && (S.Traits.has(sim, 'excitable') || S.Traits.has(sim, 'easilyImpressed')) && id !== 'thrilled') S.Traits.react(world, sim, 'cheer');
      for (const other of world.family) {
        if (other === sim || !other.traits || !sameRoom(other, sim)) continue;
        if (def.value < 0 && S.Traits.has(other, 'evil') && id !== 'gloat') S.Traits.react(world, other, 'gloat');
        if (def.value > 0 && S.Traits.has(other, 'grumpy') && id !== 'thrilled') S.Traits.react(world, other, 'grouse');
      }
    },

    actDone(world, sim, act, partner) {
      if (!act.ad) return;
      if (act.ad === 'tv_watch') {
        if (S.Traits.has(sim, 'goodHumor')) S.Traits.react(world, sim, 'laugh');
        if (S.Traits.has(sim, 'tearful')) S.Traits.react(world, sim, 'cry');
      }
      if (S.Traits.has(sim, 'perfectionist') && S.ADS[act.ad].steps.some(step => step.gain || step.fill)) S.Traits.react(world, sim, 'perfect');
      if (partner && S.ADS[act.ad].person && S.Traits.has(sim, 'inappropriate')) S.Traits.react(world, sim, 'blurt', partner);
      for (const id of S.Traits.after(sim, act.ad)) S.Moods.add(sim, id, 0, world);
    },

    onFail(world, sim) {
      if (S.Traits.has(sim, 'hotHeaded')) S.Traits.react(world, sim, 'rage');
    },

    onStart(world, sim, act) {
      if (act.auto && act.ad && S.Traits.has(sim, 'absentMinded') && act.ad !== 'floor_sleep') S.Traits.react(world, sim, 'forget');
    },

    urge(world, sim) {
      if (S.Moods.has(sim, 'worried') && S.Traits.has(sim, 'neurotic')) {
        const stove = sim.home.house.items.find(item => S.objectOf(item) && S.KINDS[S.KIND_ID[item.kind]].model === 'stove');
        if (stove) return S.Acts.adAct('check_stove', sim.home, stove);
      }
      if (S.Traits.has(sim, 'goodTrait') && ready(world, sim, 'comfort')) {
        const sad = world.family.find(o => o !== sim && o.moods && o.lot === sim.lot && !o.inside && S.Moods.mood(o) < -20 && !S.Acts.isAsleep(o));
        if (sad && roll(world, 'comfort')) {
          rest(world, sim, 'comfort', COOLDOWN.comfort);
          const act = S.Acts.adAct('comfort', sim.home, null);
          act.with = world.sims.indexOf(sad);
          act.auto = true;
          act.kind = true;
          return act;
        }
      }
      return null;
    },

    step(world, sim, dt) {
      if (!sim.traits || !sim.needs) return;
      if (sim.bubbleLeft > 0) {
        sim.bubbleLeft -= dt;
        if (sim.bubbleLeft <= 0) sim.bubble = null;
      }
      const st = state(sim), minute = Math.floor(world.day * 1440 + world.clock);
      if (st.minute === minute) return;
      st.minute = minute;
      const moving = sim.state === 'move' && !sim.slopeFrom && !(sim.path && sim.path[sim.wp] && sim.path[sim.wp].slope);
      if (moving && S.Traits.has(sim, 'clumsy')) S.Traits.react(world, sim, 'stumble');
      if ((moving || sim.state === 'idle') && S.Traits.has(sim, 'friendly') && ready(world, sim, 'greet')) {
        const near = world.live.find(o => o !== sim && !o.inside && !o.car && o.floor === sim.floor && Math.hypot(o.x - sim.x, o.z - sim.z) < GREET_REACH);
        if (near) S.Traits.react(world, sim, 'greet');
      }
      if (world.clock % 60 < 1) {
        if (S.Traits.has(sim, 'lucky')) S.Traits.react(world, sim, 'luck');
        if (S.Traits.has(sim, 'unlucky')) S.Traits.react(world, sim, 'badLuck');
        if (S.Traits.has(sim, 'coward') && nightNow(world) && !S.Acts.isAsleep(sim)) S.Traits.react(world, sim, 'spook');
        if (S.Traits.has(sim, 'neurotic') && world.clock >= WORRY_FROM && !S.Moods.has(sim, 'worried') && st.worryDay !== world.day) {
          st.worryDay = world.day;
          S.Traits.react(world, sim, 'worry');
        }
      }
      if (S.Traits.has(sim, 'lightSleeper') && S.Acts.isAsleep(sim) && nightNow(world)) {
        const near = world.live.some(o => o !== sim && !o.inside && o.floor === sim.floor && o.state === 'move' && Math.hypot(o.x - sim.x, o.z - sim.z) < WAKE_REACH);
        if (near) S.Traits.react(world, sim, 'wake');
      }
      if (S.Traits.has(sim, 'shy') && sim.act && (sim.act.ad === 'shower_take' || sim.act.ad === 'bath_take') && sim.act.phase === 'run') {
        if (world.live.some(o => o !== sim && sameRoom(o, sim))) S.Traits.react(world, sim, 'blush');
      }
    },

    sameRoom,
    nightNow,

    pack(sim) {
      return sim.traits ? [sim.traits.slice(), sim.knows ? JSON.parse(JSON.stringify(sim.knows)) : null, sim.traitState ? Object.assign({}, sim.traitState) : {}] : null;
    },

    unpack(r) {
      if (r === null) return { traits: null, knows: null, traitState: {} };
      if (!Array.isArray(r) || r.length !== 3 || !Array.isArray(r[0])) throw new Error('повреждены черты жителя');
      for (const id of r[0]) if (!S.TRAITS[id] && !S.HIDDEN_TRAITS[id]) throw new Error('неизвестная черта в файле: ' + id);
      return { traits: r[0].slice(), knows: r[1], traitState: r[2] || {} };
    }
  };
})(globalThis.Sims98 = globalThis.Sims98 || {});
