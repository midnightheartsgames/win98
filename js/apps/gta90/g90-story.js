(function (G) {
  'use strict';

  const CHAPTERS = [
    {
      id: 'center', num: 1, title: 'Плотинка', date: 'Свердловск, 3 сентября 1990 года', target: 60000, safe: 'safe1',
      hostile: ['uralmash'], exportModels: ['gaz24', 'vaz2106', 'moskvich2141', 'uaz469', 'vaz2108', 'zaz968'],
      intro: 'Свердловск. Закрытый город: иностранцев сюда не пускают, зато свои пускаются во все тяжкие. Ты сходишь с тагильской электрички с пустыми карманами и номером таксофона на Плотинке. Говорят, в центре без слова Князя даже трамваи не ходят.\n\nЦентровые держат Плотинку, рынок и таксистов у ЦУМа. Уралмашевские в спортивных костюмах хотят всё это себе. Заработай {60 000} рублей — и Князь познакомит тебя с людьми посерьёзнее.',
      outro: 'Валера Плотинка пересчитывает выручку и впервые улыбается:\n\n«Центр наш. Уралмашевские теперь объезжают рынок стороной. А тобой, {парень|подруга}, интересуется Гоша Цирк. Он платит больше. Говорят, у него «Волги» собирают быстрее, чем на ГАЗе».',
      phones: { ph_plotinka: 'Валера Плотинка', ph_market: 'Тётя Зина с рынка', ph_circus: 'Гоша Цирк' },
      finalePhone: 'ph_plotinka'
    },
    {
      id: 'circus', num: 2, title: 'Цирк', date: 'Свердловск, 15 апреля 1991 года', target: 120000, safe: 'safe2',
      hostile: ['sinie'], exportModels: ['gaz3102', 'vaz2109', 'mercedes', 'gaz53', 'raf', 'taxi'],
      intro: 'Весна девяносто первого. На «Волгу» очередь — восемь лет. У Гоши Цирка — восемь дней. Автосервис за цирком, гаражи на Мельковке, и полгорода ездит на запчастях, которые никогда официально не покидали проходную.\n\nГоша воюет с Синими — старыми ворами, которые держат юг центра от телебашни до Ткачей. Заработай {120 000} рублей, чтобы дойти до Деда Сивого.',
      outro: 'Гоша Цирк вытирает руки промасленной тряпкой:\n\n«Юг теперь тоже наш. Слышь, тебя хочет видеть большой человек. Директор. Совместное предприятие «Урал-Интер», офис у самого Дома Советов. Он говорит, скоро город будет другим. И называться будет по-другому».',
      phones: { ph_circus: 'Гоша Цирк', ph_dynamo: 'Механик Михалыч', ph_oborony: 'Шура-Гонщица' },
      finalePhone: 'ph_circus'
    },
    {
      id: 'whitehouse', num: 3, title: 'Дом Советов', date: 'Свердловск, 19 августа 1991 года', target: 200000, safe: 'safe3',
      hostile: [], exportModels: ['gaz3102', 'kgb', 'mercedes', 'liaz', 'kamaz', 'java'],
      intro: 'Август девяносто первого. По телевизору «Лебединое озеро», на площади 1905 года — митинг. Дом Советов над прудом, Октябрьская площадь и чёрные «Волги» без номеров.\n\nГорсовет спорит, вернуть ли городу имя Екатеринбург. А Директор «Урал-Интер» решает, кому этот город будет принадлежать при любом имени. Работай на Директора, но смотри в оба. Заработай {200 000} рублей — и узнаешь, чего стоит его слово.',
      outro: '',
      phones: { ph_white: 'Директор', ph_post: 'Секретарша Лариса', ph_voznes: 'Валера Плотинка' },
      finalePhone: 'ph_voznes'
    }
  ];

  const ENDING = 'Екатеринбург, 23 сентября 1991 года.\n\nВерховный Совет утвердил решение горсовета: городу вернули старое имя, и утром «Вечерний Свердловск» выйдет уже «Вечерним Екатеринбургом». Горящая «Волга» Директора так и не доехала до Сибирского тракта, а чемодан валюты сгорел вместе с ней.\n\nКнязь держит Плотинку, Гоша — цирк и юг, а Дом Советов пока ничей. На Пушкина в рок-клубе играют до утра, над цирком торчит недостроенная телебашня, а впереди — девяностые.\n\nТЫ ПРОШЁЛ{|А} ИГРУ.';

  const M = [];
  const def = (m) => { M.push(m); return m; };

  def({
    id: 'c_taxi', chapter: 0, phone: 'ph_plotinka', title: 'Первая ходка', reward: 3000,
    brief: 'Ты, что ли, новенький? Проверим. У ЦУМа стоит жёлтая «Волга» с шашечками — таксист греется в пирожковой. Пригони её ко мне в гараж за Вайнера. И не поцарапай.',
    steps: [
      { do: 'spawnCar', ref: 'taxi', model: 'taxi', at: 'taxi_stand', parked: true },
      { do: 'enter', ref: 'taxi', text: 'Сядь в такси у ЦУМа.' },
      { do: 'deliver', ref: 'taxi', at: 'g_center', minHp: 0.4, text: 'Отгони такси в гараж Центровых за улицей Вайнера.' }
    ]
  });
  def({
    id: 'c_jeans', chapter: 0, phone: 'ph_market', title: 'Варёнки', reward: 4000,
    brief: 'Сынок, выручай. У «Пассажа» фарцовщик Гоша держит сумку варёнок. Забери и привези мне на Центральный рынок. Покупатель ждёт четыре минуты, потом уходит к конкурентам.',
    steps: [
      { do: 'spawnPed', ref: 'gosha', type: 'fartsa', at: 'passage', state: 'idle', off: [1, 0] },
      { do: 'pickup', ref: 'bag', kind: 'bag', at: 'passage', text: 'Забери сумку у фарцовщика возле «Пассажа».' },
      { do: 'goto', at: 'market', r: 44, time: 240, text: 'Отвези джинсы тёте Зине на Центральный рынок.' },
      { do: 'say', text: 'Джинсы ушли за час. Уралмашевские видели тебя на рынке — теперь они знают тебя в лицо.' }
    ]
  });
  def({
    id: 'c_rat', chapter: 0, phone: 'ph_circus', title: 'Крыса', reward: 5000,
    brief: 'Это Гоша. Помоги Центровым — потом сочтёмся. Их кассир Толик-Счетовод сбежал с общаком на оранжевом «Москвиче». Гонит по Ленина от Плотинки. Останови его — деньги должны вернуться в гараж.',
    steps: [
      { do: 'spawnCar', ref: 'rat', model: 'moskvich412', at: 'rat_start', road: true, driver: 'courier', mode: 'flee', color: '#d06a20' },
      { do: 'wreck', refs: ['rat'], time: 300, text: 'Разбей оранжевый «Москвич» Счетовода.' },
      { do: 'pickup', ref: 'cash', kind: 'bag', at: 'ref:rat', text: 'Подбери сумку с деньгами у обломков.' },
      { do: 'goto', at: 'g_center', r: 50, text: 'Отвези общак в гараж Центровых.' }
    ]
  });
  def({
    id: 'c_train', chapter: 0, phone: 'ph_plotinka', title: 'Московский поезд', reward: 6000, after: ['c_taxi'],
    brief: 'С московского поезда сходит наш человек, Лёва Бухгалтер. Уралмашевские тоже знают про поезд. Встреть Лёву у вокзала на Челюскинцев и довези до гостиницы «Исеть» на Ленина. Живым, {понял|поняла}?',
    steps: [
      { do: 'spawnPed', ref: 'lev', type: 'courier', at: 'vokzal', state: 'idle', hp: 120 },
      { do: 'board', ref: 'lev', text: 'Подъезжай к вокзалу — Лёва сядет в машину.' },
      { do: 'spawnCar', ref: 'h1', model: 'vaz2108', at: 'vokzal_road', road: true, far: 14, driver: 'uralmash', mode: 'hunt', pass: ['uralmash'], speed: 300 },
      { do: 'spawnCar', ref: 'h2', model: 'vaz2108', at: 'vokzal_road', road: true, far: 10, driver: 'uralmash', mode: 'hunt', pass: ['uralmash'], speed: 290 },
      { do: 'drop', ref: 'lev', at: 'hotel_iset', time: 420, text: 'Вези Лёву в гостиницу «Исеть» на проспекте Ленина. За вами уралмашевские!' }
    ]
  });
  def({
    id: 'c_strelka', chapter: 0, phone: 'ph_market', title: 'Стрелка у «Динамо»', reward: 6000, after: ['c_jeans'],
    brief: 'Уралмашевские забили стрелку у стадиона «Динамо». Три их «восьмёрки» стоят на стоянке. Разнеси их, пока не разъехались. У стадиона для тебя оставили ящик с «коктейлями».',
    steps: [
      { do: 'pickup', ref: 'mol', kind: 'w_molotov', at: 'dynamo', text: 'Забери ящик с коктейлями Молотова у стадиона «Динамо».' },
      { do: 'spawnCar', ref: 'c1', model: 'vaz2108', at: 'dynamo_lot', off: [-2, 0], parked: true, a: 1.57, color: '#1f3fa6' },
      { do: 'spawnCar', ref: 'c2', model: 'vaz2108', at: 'dynamo_lot', off: [1, 0], parked: true, a: 1.57, color: '#1f3fa6' },
      { do: 'spawnCar', ref: 'c3', model: 'vaz2108', at: 'dynamo_lot', off: [4, 0], parked: true, a: 1.57, color: '#1f3fa6' },
      { do: 'spawnPed', ref: 'g1', type: 'uralmash', at: 'dynamo_lot', off: [-1, 2], state: 'guard' },
      { do: 'spawnPed', ref: 'g2', type: 'uralmash', at: 'dynamo_lot', off: [3, 2], state: 'guard' },
      { do: 'spawnPed', ref: 'g3', type: 'uralmash', at: 'dynamo_lot', off: [1, -2], state: 'guard' },
      { do: 'wreck', refs: ['c1', 'c2', 'c3'], time: 240, text: 'Уничтожь три машины уралмашевских у «Динамо».' }
    ]
  });
  def({
    id: 'c_vodka', chapter: 0, phone: 'ph_circus', title: 'Водка по талонам', reward: 6000, after: ['c_rat'],
    brief: 'Водку дают по талонам, а у Князя свадьба у племянника. Со склада на Мельковской выезжает ГАЗ-53, везёт ящики на рынок. Угони его и пригони в гараж Центровых. Бутылки не бей — Князь считает каждую.',
    steps: [
      { do: 'spawnCar', ref: 'truck', model: 'gaz53', at: 'warehouse', road: true, driver: 'worker', mode: 'route', dest: 'market', speed: 90, careful: true, color: '#2a4a8c' },
      { do: 'enter', ref: 'truck', text: 'Угони синий ГАЗ-53 с водкой — он едет со склада на Мельковской.' },
      { do: 'wanted', level: 1 },
      { do: 'deliver', ref: 'truck', at: 'g_center', minHp: 0.55, time: 450, text: 'Пригони грузовик в гараж Центровых. Не разбей бутылки!' }
    ]
  });
  def({
    id: 'c_bombila', chapter: 0, phone: 'ph_plotinka', title: 'Бомбила', reward: 4000, after: ['c_train'],
    brief: 'Таксисты у ЦУМа платят мне за место. А ты будешь бомбить сам. Садись в любую машину, жми T — и собирай пассажиров. Отвези троих за шесть минут.',
    steps: [
      { do: 'fares', n: 3, time: 360, text: 'Бомби: отвези трёх пассажиров. В машине нажми T.' }
    ]
  });
  def({
    id: 'c_final', chapter: 0, phone: 'ph_plotinka', title: 'Разборка на рынке', reward: 12000, finale: true,
    brief: 'Уралмашевские приехали на Центральный рынок делить нашу территорию. Их бригадир Бугор стоит с охраной у ворот рынка. Разберись с ним. Потом уходи от милиции — Князь отмажет, только если ты не попадёшься.',
    steps: [
      { do: 'spawnPed', ref: 'bugor', type: 'bugor', at: 'market', state: 'guard', off: [0, -1] },
      { do: 'spawnPed', ref: 'l1', type: 'uralmash', at: 'market', state: 'guard', off: [-2, 0], weapon: 'akm' },
      { do: 'spawnPed', ref: 'l2', type: 'uralmash', at: 'market', state: 'guard', off: [2, 0] },
      { do: 'spawnPed', ref: 'l3', type: 'uralmash', at: 'market', state: 'guard', off: [-3, -2], weapon: 'obrez' },
      { do: 'spawnPed', ref: 'l4', type: 'uralmash', at: 'market', state: 'guard', off: [3, -2] },
      { do: 'spawnCar', ref: 'lc', model: 'mercedes', at: 'market_gate', off: [3, 0], parked: true, color: '#1f3fa6' },
      { do: 'kill', refs: ['bugor'], time: 360, text: 'Убери Бугра — бригадира уралмашевских на Центральном рынке.' },
      { do: 'wanted', level: 2 },
      { do: 'lose', text: 'Уходи от милиции.' }
    ]
  });

  def({
    id: 'a_carbs', chapter: 1, phone: 'ph_circus', title: 'Запчасти', reward: 5000,
    brief: 'На автобазе на Мельковке в боксе лежит ящик карбюраторов «Озон». Забери и привези ко мне в автосервис за цирком. Сторож позвонит в милицию, так что сначала оторвись.',
    steps: [
      { do: 'pickup', ref: 'box', kind: 'package', at: 'atp', text: 'Забери ящик карбюраторов на автобазе на Мельковке.' },
      { do: 'wanted', level: 2 },
      { do: 'lose', text: 'Оторвись от милиции.' },
      { do: 'goto', at: 'g_circus', r: 44, text: 'Отвези ящик в автосервис Гоши за цирком.' }
    ]
  });
  def({
    id: 'a_volga', chapter: 1, phone: 'ph_circus', title: 'Новая «Волга»', reward: 8000, after: ['a_carbs'],
    brief: 'У Дворца спорта стоит новая «Волга» ГАЗ-3102 — для спорткомитета. Покупатель уже есть. Пригони её в автосервис. Побьёшь больше чем на треть — не возьмут.',
    steps: [
      { do: 'spawnCar', ref: 'volga', model: 'gaz3102', at: 'dvorets', parked: true, a: 0 },
      { do: 'enter', ref: 'volga', text: 'Сядь в новую «Волгу» у Дворца спорта.' },
      { do: 'wanted', level: 1 },
      { do: 'deliver', ref: 'volga', at: 'g_circus', minHp: 0.66, text: 'Пригони «Волгу» в автосервис Гоши без серьёзных повреждений.' }
    ]
  });
  def({
    id: 'a_gai', chapter: 1, phone: 'ph_dynamo', title: 'Капитан Мохов', reward: 7000,
    brief: 'Капитан ГАИ Мохов собирает с наших по полтиннику с машины. Сегодня он повезёт выручку к себе домой, в частный сектор на Ткачей. Проследи за его «шестёркой» — только не спугни. Потом забери конверт.',
    steps: [
      { do: 'spawnCar', ref: 'gai', model: 'gai', at: 'gai_post', road: true, driver: 'cop', mode: 'route', dest: 'dacha', speed: 120, careful: true },
      { do: 'follow', ref: 'gai', min: 55, max: 480, text: 'Следуй за «шестёркой» ГАИ. Не отставай и не подъезжай вплотную.' },
      { do: 'pickup', ref: 'env', kind: 'package', at: 'dacha', off: [1, 1], text: 'Забери конверт у дома Мохова.' },
      { do: 'goto', at: 'ph_dynamo', r: 40, text: 'Отвези конверт Михалычу к стадиону «Динамо».' }
    ]
  });
  def({
    id: 'a_crush', chapter: 1, phone: 'ph_dynamo', title: 'Утилизация', reward: 6000, after: ['a_gai'],
    brief: 'Синие катаются по центру на краденых машинах. Сдай три любые тачки под пресс в «Утильсырьё» на Мельковке за семь минут — пусть знают, где кончается их улица.',
    steps: [
      { do: 'crush', n: 3, time: 420, text: 'Сдай три машины под пресс в «Утильсырьё».' }
    ]
  });
  def({
    id: 'a_race', chapter: 1, phone: 'ph_oborony', title: 'Ночная гонка', reward: 8000,
    brief: 'Уралмашевские гоняют по ночному центру на спор: от набережной через Челюскинцев, Ленина и Куйбышева. Приезжай к старту на чём-нибудь быстром. Четыре контрольные точки. Придёшь {первым|первой} — уважение будет твоим.',
    steps: [
      { do: 'goto', at: 'race_start', r: 60, need: 'car', text: 'Подъезжай к старту на набережной Рабочей Молодёжи.' },
      { do: 'spawnCar', ref: 'r1', model: 'vaz2109', at: 'race_start', road: true, near: 3, driver: 'racer', mode: 'wait', color: '#1f3fa6' },
      { do: 'spawnCar', ref: 'r2', model: 'vaz2108', at: 'race_start', road: true, near: 5, driver: 'racer', mode: 'wait', color: '#e6e2d6' },
      { do: 'countdown', secs: 3 },
      { do: 'race', cps: ['race1', 'race2', 'race3', 'race4'], rivals: ['r1', 'r2'], text: 'Гонка! Проезжай контрольные точки первым.' }
    ]
  });
  def({
    id: 'a_cash', chapter: 1, phone: 'ph_circus', title: 'Инкассация', reward: 10000, after: ['a_volga'],
    brief: 'Инкассаторский «УАЗ» забрал выручку в Госбанке на Малышева и едет на Главпочтамт. Бронированный, но не железный. Тарань его — лучше грузовиком, — пока охрана не бросит машину. Забирай мешок — и на дно.',
    steps: [
      { do: 'spawnCar', ref: 'cash', model: 'cash', at: 'bank', road: true, driver: 'worker', mode: 'route', dest: 'post', speed: 125, careful: true, hp: 150 },
      { do: 'damage', ref: 'cash', below: 0.45, failArrive: true, text: 'Тарань инкассаторский «УАЗ», пока он не доехал до Главпочтамта.' },
      { do: 'pickup', ref: 'bag', kind: 'bag', at: 'ref:cash', text: 'Забери мешок с выручкой.' },
      { do: 'wanted', level: 3 },
      { do: 'lose', text: 'Уходи от милиции.' }
    ]
  });
  def({
    id: 'a_bomb', chapter: 1, phone: 'ph_oborony', title: 'Привет Деду', reward: 9000, after: ['a_race'],
    brief: 'Дед Сивый, главный у Синих, ужинает в ресторане при «Космосе». Его «Мерседес» стоит у входа. Поставь бомбу в любую машину в мастерской, подгони её к «Мерседесу», нажми огонь — и беги.',
    steps: [
      { do: 'spawnCar', ref: 'merc', model: 'mercedes', at: 'kosmos', road: true, parked: true, color: '#18181a', hp: 260 },
      { do: 'spawnPed', ref: 'mg1', type: 'sinie', at: 'kosmos', off: [1, 1], state: 'guard' },
      { do: 'spawnPed', ref: 'mg2', type: 'sinie', at: 'kosmos', off: [-1, 1], state: 'guard' },
      { do: 'bombfit', text: 'Заедь в мастерскую — поставят бомбу за 3000 рублей.' },
      { do: 'wreck', refs: ['merc'], time: 540, text: 'Подгони заминированную машину к «Мерседесу» Деда у «Космоса» и взорви.' },
      { do: 'say', text: 'Деда в машине не было. Зато теперь он очень зол.' }
    ]
  });
  def({
    id: 'a_final', chapter: 1, phone: 'ph_circus', title: 'Телебашня', reward: 16000, finale: true,
    brief: 'Дед Сивый собрал своих на стройке телебашни у цирка. Двести метров бетона, и ни одного милиционера вокруг. Приедешь туда — не выйдешь. Если только не уйдёшь быстро. Дед должен остаться под этой башней.',
    steps: [
      { do: 'spawnPed', ref: 'ded', type: 'ded', at: 'tvtower', state: 'guard', off: [0, -1] },
      { do: 'spawnPed', ref: 's1', type: 'sinie', at: 'tvtower', state: 'guard', off: [-3, 0], weapon: 'akm' },
      { do: 'spawnPed', ref: 's2', type: 'sinie', at: 'tvtower', state: 'guard', off: [3, 0], weapon: 'akm' },
      { do: 'spawnPed', ref: 's3', type: 'sinie', at: 'tvtower', state: 'guard', off: [-5, -2], weapon: 'obrez' },
      { do: 'spawnPed', ref: 's4', type: 'sinie', at: 'tvtower', state: 'guard', off: [5, -2] },
      { do: 'spawnPed', ref: 's5', type: 'sinie', at: 'tvtower', state: 'guard', off: [0, 2] },
      { do: 'kill', refs: ['ded'], time: 360, text: 'Убери Деда Сивого на стройке телебашни.' },
      { do: 'wanted', level: 3 },
      { do: 'lose', text: 'Уходи от милиции, пока не перекрыли центр.' }
    ]
  });

  def({
    id: 'n_black', chapter: 2, phone: 'ph_white', title: 'Обкомовская «Волга»', reward: 8000,
    brief: '{Молодой человек|Девушка}, мне нужна машина с правильными номерами. У Дома Советов стоит чёрная «Волга» второго секретаря. Пригоните её в гараж «Урал-Интер» на набережной.',
    steps: [
      { do: 'spawnCar', ref: 'ob', model: 'gaz3102', at: 'whitehouse', parked: true, a: 0 },
      { do: 'enter', ref: 'ob', text: 'Сядь в чёрную «Волгу» у Дома Советов.' },
      { do: 'wanted', level: 2 },
      { do: 'deliver', ref: 'ob', at: 'g_inter', minHp: 0.5, text: 'Пригони «Волгу» в гараж «Урал-Интер».' }
    ]
  });
  def({
    id: 'n_dollars', chapter: 2, phone: 'ph_post', title: 'Валюта', reward: 10000,
    brief: 'Виктор Палыч просил передать: у гостиницы «Исеть» вас ждёт фарцовщик с пакетом долларов. КГБ его уже пасёт. Заберите пакет и отвезите в гараж «Урал-Интер». Быстро.',
    steps: [
      { do: 'spawnPed', ref: 'f', type: 'fartsa', at: 'hotel_iset', state: 'idle', off: [1, 0] },
      { do: 'pickup', ref: 'pkt', kind: 'package', at: 'hotel_iset', text: 'Забери пакет у фарцовщика возле гостиницы «Исеть».' },
      { do: 'wanted', level: 3 },
      { do: 'goto', at: 'g_inter', r: 50, time: 240, text: 'Отвези валюту в гараж «Урал-Интер». КГБ на хвосте!' }
    ]
  });
  def({
    id: 'n_boat', chapter: 2, phone: 'ph_white', title: 'Прогулка по пруду', reward: 9000, after: ['n_black'],
    brief: 'Навигация на пруду закрывается, а мне нужен прогулочный катер — для гостей из Москвы. Он стоит у лодочной станции на набережной. Уведите его к «Динамо». На воде вас никто не остановит.',
    steps: [
      { do: 'spawnCar', ref: 'boat', model: 'progulka', at: 'boat_start', persist: true },
      { do: 'enter', ref: 'boat', text: 'Спустись к лодочной станции и заведи катер.' },
      { do: 'goto', at: 'pond_pier', r: 90, need: 'ref:boat', text: 'Веди катер по Городскому пруду к стадиону «Динамо».' }
    ]
  });
  def({
    id: 'n_film', chapter: 2, phone: 'ph_post', title: 'Плёнка', reward: 9000, after: ['n_dollars'],
    brief: 'Журналист «Вечернего Свердловска» сфотографировал Виктора Палыча с людьми Деда. Он уезжает от университета на «Яве». Плёнка должна исчезнуть.',
    steps: [
      { do: 'spawnCar', ref: 'bike', model: 'java', at: 'univ', road: true, driver: 'journalist', mode: 'flee' },
      { do: 'unseat', ref: 'bike', text: 'Сбей журналиста с мотоцикла «Ява».' },
      { do: 'pickup', ref: 'film', kind: 'package', at: 'ref:bike', text: 'Подбери фотоплёнку.' },
      { do: 'goto', at: 'ph_post', r: 44, text: 'Отнеси плёнку Ларисе к Главпочтамту.' }
    ]
  });
  def({
    id: 'n_stairs', chapter: 2, phone: 'ph_voznes', title: 'Вознесенская горка', reward: 9000,
    brief: 'Слышь, это Валера с Плотинки. Директору не верь. Мой человек в его охране спрятал папку в Харитоновском саду. Забери и поднимись пешком на горку, к пустырю, где стоял Ипатьевский дом. Люди Директора уже там.',
    steps: [
      { do: 'pickup', ref: 'folder', kind: 'package', at: 'kharitonov', text: 'Забери папку в Харитоновском саду.' },
      { do: 'spawnPed', ref: 'q1', type: 'director', at: 'voznes', off: [-2, 1], state: 'guard', hostileAlways: true },
      { do: 'spawnPed', ref: 'q2', type: 'director', at: 'voznes', off: [2, 1], state: 'guard', hostileAlways: true },
      { do: 'spawnPed', ref: 'q3', type: 'guard', at: 'voznes', off: [0, 3], state: 'guard', hostileAlways: true },
      { do: 'goto', at: 'voznes', r: 36, need: 'foot', time: 150, text: 'Поднимись пешком на Вознесенскую горку. Наверху — люди Директора.' },
      { do: 'say', text: 'В папке — список для КГБ. Директор сдаёт всех: Князя, Гошу. И тебя.' }
    ]
  });
  def({
    id: 'n_stadium', chapter: 2, phone: 'ph_white', title: 'Матч на «Динамо»', reward: 9000, after: ['n_boat'],
    brief: 'На стадион «Динамо» мои должники приехали смотреть футбол на пяти машинах. Машины мне не нужны. Совсем.',
    steps: [
      { do: 'spawnCar', ref: 'd1', model: 'vaz2109', at: 'dynamo_lot', off: [-4, 1], parked: true, a: 0 },
      { do: 'spawnCar', ref: 'd2', model: 'moskvich2141', at: 'dynamo_lot', off: [-2, 1], parked: true, a: 0 },
      { do: 'spawnCar', ref: 'd3', model: 'gaz24', at: 'dynamo_lot', off: [2, 1], parked: true, a: 0 },
      { do: 'spawnCar', ref: 'd4', model: 'vaz2106', at: 'dynamo_lot', off: [4, 1], parked: true, a: 0 },
      { do: 'spawnCar', ref: 'd5', model: 'vaz2108', at: 'dynamo_lot', off: [0, 1], parked: true, a: 0 },
      { do: 'wreck', refs: ['d1', 'd2', 'd3', 'd4', 'd5'], time: 360, text: 'Уничтожь пять машин должников у стадиона «Динамо».' }
    ]
  });
  def({
    id: 'n_metro', chapter: 2, phone: 'ph_post', title: 'Посылка в метро', reward: 9000, after: ['n_film'],
    brief: 'Отвезите посылку на стройку метро «Динамо». Пять минут — бригада уходит со смены. Не открывайте.',
    steps: [
      { do: 'pickup', ref: 'box', kind: 'package', at: 'post', text: 'Забери посылку у Главпочтамта.' },
      { do: 'wanted', level: 2 },
      { do: 'goto', at: 'metro_dynamo', r: 44, time: 300, text: 'Отвези посылку на стройку станции метро «Динамо».' },
      { do: 'say', text: 'Бригадир взял посылку и прошептал: «Директор просил передать: вы слишком много знаете»...' }
    ]
  });
  def({
    id: 'n_trap', chapter: 2, phone: 'ph_white', title: 'Предательство', reward: 13000, after: ['n_stadium', 'n_stairs'],
    brief: 'Последнее поручение. На складе на Мельковской вас ждёт расчёт. Приезжайте {один|одна}.',
    steps: [
      { do: 'goto', at: 'warehouse', r: 50, text: 'Приезжай на склад на Мельковской за расчётом.' },
      { do: 'hostile', gang: 'director', on: true },
      { do: 'spawnPed', ref: 't1', type: 'guard', at: 'warehouse', off: [-4, -3], state: 'attack' },
      { do: 'spawnPed', ref: 't2', type: 'guard', at: 'warehouse', off: [4, -3], state: 'attack' },
      { do: 'spawnPed', ref: 't3', type: 'director', at: 'warehouse', off: [-5, 3], state: 'attack' },
      { do: 'spawnPed', ref: 't4', type: 'director', at: 'warehouse', off: [5, 3], state: 'attack' },
      { do: 'spawnPed', ref: 't5', type: 'kgb', at: 'warehouse', off: [0, -5], state: 'attack', hostileAlways: true },
      { do: 'spawnPed', ref: 't6', type: 'kgb', at: 'warehouse', off: [0, 5], state: 'attack', hostileAlways: true },
      { do: 'say', text: 'Засада! Директор решил от тебя избавиться!' },
      { do: 'kill', refs: ['t1', 't2', 't3', 't4', 't5', 't6'], text: 'Отбейся от людей Директора и КГБ.' },
      { do: 'wanted', level: 3 },
      { do: 'lose', text: 'Уходи от милиции и затаись.' }
    ]
  });
  def({
    id: 'n_final', chapter: 2, phone: 'ph_voznes', title: '23 сентября', reward: 25000, finale: true,
    brief: 'Сегодня Москва утвердила: Свердловска больше нет, мы в Екатеринбурге. А Директор с чемоданом валюты едет от Дома Советов на восток, к Сибирскому тракту — и дальше, в Кольцово. Князь ждёт его на трассе, но надеяться я буду на тебя.',
    steps: [
      { do: 'hostile', gang: 'director', on: true },
      { do: 'setDate', text: 'Екатеринбург' },
      { do: 'pickup', ref: 'rpg', kind: 'w_rpg', at: 'ph_voznes', off: [1, 1], text: 'Забери РПГ, который Валера оставил у таксофона.' },
      { do: 'wait', secs: 20, at: 'whitehouse', label: 'Директор выезжает через', text: 'Директор выходит из Дома Советов через 20 секунд. Езжай на Октябрьскую площадь!' },
      { do: 'spawnCar', ref: 'dir', model: 'gaz3102', at: 'whitehouse', road: true, far: 3, driver: 'director_boss', mode: 'route', dest: 'exit_east', speed: 175, careful: true, hp: 380, persist: true, pass: ['guard'] },
      { do: 'spawnCar', ref: 'e1', model: 'gaz3102', at: 'whitehouse', road: true, far: 6, driver: 'guard', mode: 'hunt', speed: 300, pass: ['guard'] },
      { do: 'spawnCar', ref: 'e2', model: 'gaz3102', at: 'whitehouse', road: true, far: 9, driver: 'guard', mode: 'hunt', speed: 290, pass: ['guard'] },
      { do: 'wreck', refs: ['dir'], failArrive: true, text: 'Взорви бронированную «Волгу» Директора, пока он не выехал на Сибирский тракт!' }
    ]
  });

  const MISSIONS = {};
  for (const m of M) MISSIONS[m.id] = m;

  const FRENZIES = {
    f1: { text: 'БЕСПРЕДЕЛ! Уложи 12 уралмашевских за 2 минуты!', weapon: 'akm', target: 'gang:uralmash', n: 12, time: 120, bonus: 8000 },
    f2: { text: 'БЕСПРЕДЕЛ! Разнеси 10 машин за 2 минуты!', weapon: 'rpg', target: 'cars', n: 10, time: 120, bonus: 8000 },
    f3: { text: 'БЕСПРЕДЕЛ! Сожги 8 машин за 100 секунд!', weapon: 'molotov', target: 'cars', n: 8, time: 100, bonus: 7000 },
    f4: { text: 'БЕСПРЕДЕЛ! Разнеси 10 машин за 2 минуты!', weapon: 'akm', target: 'cars', n: 10, time: 120, bonus: 8000 },
    f5: { text: 'БЕСПРЕДЕЛ! Уложи 15 бандитов любых банд за 2 минуты!', weapon: 'obrez', target: 'gang', n: 15, time: 120, bonus: 9000 },
    f6: { text: 'БЕСПРЕДЕЛ! Разнеси 8 машин за 90 секунд!', weapon: 'rpg', target: 'cars', n: 8, time: 90, bonus: 7000 }
  };

  Object.assign(G, { CHAPTERS, MISSIONS, MISSION_LIST: M, FRENZIES, ENDING });
  if (typeof module !== 'undefined' && module.exports) module.exports = G;
})(globalThis.Gta90 = globalThis.Gta90 || {});
