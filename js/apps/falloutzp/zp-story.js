(function (Z) {
  'use strict';

  const G = Z.Game.prototype;
  const I = Z.ITEMS;
  const Q = Z.QUESTS;
  const S = Z.SCRIPTS;

  const misc = (id, name, o) => { I[id] = Object.assign({ id, name, cat: 'misc', v: 0, w: 0.1, stack: false }, o); };
  misc('propusk', 'Пропуск Комендатуры', { quest: true, desc: 'Бланк с печатью гарнизона: «Разрешён проход по мосту Преображенского в обе стороны. Полковник Савченко».' });
  misc('letters', 'Письма', { quest: true, stack: true, desc: 'Пачка писем с почтамта. На конвертах: Ласточкиной В. П. (Вознесенка), Голоте (Сечь), деду Панасу (плавни).' });
  misc('techpasport', 'Технический паспорт «Агрегат-7»', { quest: true, desc: 'Паспорт ремонтного робота, заводской номер 1977-0451. Приписан к Вознесеновскому райисполкому.' });
  misc('naryad', 'Наряд на работы, цех №3', { quest: true, desc: 'План на месяц: «Электролиз — 120%. Норма — закон. Бригадир Кузьмич».' });
  misc('kpzKey', 'Ключ от камер гауптвахты', { desc: 'Связка ключей на кольце с биркой «КПЗ».' });
  misc('firmaKey', 'Ключ Фирмы', { desc: 'Латунный ключ с брелоком «Импульс». Подходит к кабинету и сейфу председателя.' });
  I.sabreBayda = Object.assign({}, I.sabreAtaman, { id: 'sabreBayda', name: 'Шабля Байды', dmg: (I.sabreAtaman.dmg || 30) + 6, crit: 12, v: 1600, desc: 'Сабля, которую, по преданию, князь Вишневецкий потерял на острове. Сталь не берёт ни ржавчина, ни время.' });

  Q.mq01 = {
    title: 'Медкомиссия', main: true, xp: 50, desc: 'Фельдъегеря Главпочтамта подстрелили и сбросили с моста в Днепр. Робот Тимофей выловил его у Тарасовой груши. Теперь — в медпункт, в порядок, в строй.',
    stages: {
      10: { text: 'Поговорить с доктором Ласточкиной.', marker: { npc: 'doctor' } },
      20: { text: 'Пройти медкомиссию.', marker: { npc: 'doctor' } },
      30: { text: 'Поговорить с Тимофеем у Тарасовой груши.', marker: { npc: 'timofey' } },
      40: { text: 'Узнать у председателя сельсовета Карпенко, кто приходил за «утопленником».', marker: { npc: 'karpenko' } },
      50: { done: true, text: 'Карпенко рассказал про Гирю и шпану из Парка Победы.' }
    }
  };
  Q.mq02 = {
    title: 'Груша и Гиря', main: true, xp: 150, desc: 'Шпана из Парка Победы требует с Вознесенки десятину. Их главарь Гиря знает, кто заказал сбросить фельдъегеря в Днепр.',
    stages: {
      10: { text: 'Разобраться со шпаной Гири в Парке Победы.', marker: { loc: 'pobeda' } },
      15: { text: 'Шпана напала на Вознесенку! Отбить налёт.', marker: { loc: 'vozn' } },
      20: { text: 'Поговорить с Гирей в тире Парка Победы.', marker: { npc: 'girya' } },
      40: { done: true, text: 'Заказчик найден: человек в «Монтане» из гостиницы «Интурист».' }
    },
    onStage: (g, st) => { if (st === 40) g.setStage('mq03', 10); }
  };
  Q.mq03 = {
    title: 'Их было трое', main: true, xp: 250, desc: 'Тот, кто стрелял, тот, кто заказал, и тот, кто продал маршрут. Ниточка ведёт от рынка к «Интуристу» и дальше — за Днепр.',
    stages: {
      10: { text: 'Расспросить торговцев Вознесенского рынка о человеке в «Монтане». На почтамте знают, кому была адресована посылка.', marker: [{ npc: 'zhora' }, { npc: 'aristarkh' }] },
      30: { text: 'Найти Жоржа «Монтану» в гостинице «Интурист» на площади Маяковского.', marker: { npc: 'montana' } },
      40: { text: 'Перебраться через мост Преображенского на Хортицу: пропуск, взятка, нижний ярус или вплавь.', marker: { loc: 'kpp' } },
      50: { text: 'Найти Фирму в Запорожской Сечи.', marker: { loc: 'sich' } },
      60: { done: true, text: 'Фирма — гость Коша. Без суда Рады его не тронуть.' }
    }
  };
  Q.mq04 = {
    title: 'Суд Рады', main: true, xp: 400, desc: 'Аркадий «Фирма» Лисовой укрылся под защитой казачьего закона. Перфокарту можно вернуть по суду, в поединке, ночной кражей — или сговорившись с самим Фирмой.',
    stages: {
      10: { text: 'Поговорить с Кошевым Сирко о Фирме.', marker: { npc: 'sirko' } },
      20: { text: 'Собрать доказательства для суда Рады (пуля, слово Гири, записи почтамта, признание Монтаны, бухгалтерия Фирмы) — или вызвать Фирму на поединок, договориться с ним, выкрасть перфокарту из его сундука.', marker: [{ npc: 'sirko' }, { npc: 'firma' }] },
      40: { text: 'Поединок: победить бойца Фирмы.', marker: { npc: 'firma' } },
      50: { done: true, text: 'Перфокарта у вас.' }
    },
    onStage: (g, st) => { if (st === 50) { g.setStage('mq05', 10); g.readNote('n_card'); g.flags.plannerPass = true; g.msg('Дружинники Плановика теперь пропускают фельдъегеря с отправлением.', 'info'); } }
  };
  Q.mq05 = {
    title: 'Адресат', main: true, xp: 300, desc: 'В «Пионере» щёлкнул приёмник: «ГОВОРИТ АСУ "ПЛАНОВИК-77". ГРАЖДАНИН ФЕЛЬДЪЕГЕРЬ, ДОСТАВЬТЕ ОТПРАВЛЕНИЕ АДРЕСАТУ».',
    stages: {
      10: { text: 'Выслушать АСУ «Плановик-77» в бункере под Облисполкомом.', marker: { loc: 'oblispolkom' } },
      20: { text: 'Решить, кому отдать перфокарту: Комендатуре (полковник Савченко), Сечи (Кошевой Сирко), Плановику — или вставить её самому вместе с Тимофеем.', marker: [{ npc: 'savchenko' }, { npc: 'sirko' }, { npc: 'planner' }, { npc: 'timofey' }] },
      30: { done: true, text: 'Перфокарта отдана. Теперь — мост.' }
    }
  };
  Q.mq06k = {
    title: 'Порядок на мосту', main: true, xp: 300, desc: 'Комендатура берёт ток под охрану. Сначала нужно убрать заставу сечевиков с западного конца моста.',
    stages: {
      10: { text: 'Уничтожить заставу сечевиков на западном конце моста Преображенского.', marker: { loc: 'sichpost' } },
      20: { text: 'Доложить полковнику Савченко.', marker: { npc: 'savchenko' } },
      30: { done: true, text: 'Сечь собирается на мост.' }
    }
  };
  Q.mq06s = {
    title: 'Воля Сечи', main: true, xp: 300, desc: 'Сечь возьмёт ток, но сначала надо вызволить казаков с гауптвахты Комендатуры.',
    stages: {
      10: { text: 'Освободить пленных казаков с гауптвахты в Горисполкоме.', marker: { loc: 'komendatura' } },
      20: { text: 'Вернуться к Кошевому Сирко.', marker: { npc: 'sirko' } },
      30: { done: true, text: 'Сечь выступает на мост.' }
    }
  };
  Q.mq06p = {
    title: 'Пятилетка', main: true, xp: 300, desc: 'Плановик возобновил план. Подстанцию на мосту нужно включить вручную.',
    stages: {
      10: { text: 'Включить рубильник подстанции под мостом (восточный устой, у КПП).', marker: { obj: 'substation' } },
      30: { done: true, text: 'Подстанция включена. Дружинники идут на мост.' }
    }
  };
  Q.mq06i = {
    title: 'Своя голова', main: true, xp: 300, desc: 'Тимофей знает, как подключить подстанцию к Вознесенке в обход всех. Нужен его техпаспорт — с ним дружинники примут его за законного ремонтника.',
    stages: {
      10: { text: 'Найти техпаспорт Тимофея в архиве бункера Облисполкома.', marker: { loc: 'oblispolkom' } },
      20: { text: 'Взять Тимофея с собой и включить рубильник подстанции под мостом.', marker: { obj: 'substation' } },
      30: { done: true, text: 'Ток пошёл в Вознесенку. Теперь его придётся защищать.' }
    }
  };
  Q.mq07 = {
    title: 'Битва за мост', main: true, xp: 1000, desc: 'Тот, кто держит мост Преображенского, держит ток плотины. Решающий бой.',
    stages: {
      10: { text: 'Прийти на мост Преображенского и удержать его.', marker: { loc: 'kpp' } },
      15: { text: 'Отбить атаку на мосту!', marker: { loc: 'kpp' } },
      20: { done: true, text: 'Мост удержан.' }
    },
    onStage: (g, st) => { if (st === 10) g.flags.battleArmed = true; if (st === 20) g.later(3, () => S.ending(g)); }
  };

  const side = (id, title, desc, stages, xp) => { Q[id] = { title, desc, stages, xp: xp || 100 }; };
  side('sq_redwater', 'Красная вода', 'Хоботы Убежища ГО №3 сохранили разум, пока у них есть фильтры. Фильтры кончаются.', {
    10: { text: 'Принести наставнику Протасову 10 фильтров ФПК (больница, ЗАлК, кооператоры).', marker: { npc: 'protasov' } },
    30: { done: true, text: '«Красная вода» дышит.' }
  }, 200);
  side('sq_queue', 'Очередь', 'Жители Убежища ГО №12 двести лет ждут своей очереди на эвакуацию.', {
    10: { text: 'Освободить жителей Убежища №12 из очереди.', marker: { npc: 'nomerok' } },
    30: { done: true, text: 'Очередь закончилась.' }
  }, 200);
  side('sq_harvest', 'Битва за урожай', 'Колорадская матка захватила картофельное поле колхоза «Заветы Ильича».', {
    10: { text: 'Убить колорадскую матку на картофельном поле.', marker: { loc: 'potato' } },
    20: { text: 'Вернуться к председателю Бульбенко.', marker: { npc: 'bulbenko' } },
    30: { done: true, text: 'Урожай спасён.' }
  }, 150);
  side('sq_somking', 'Царь-сом', 'В протоках плавней живёт сом размером с лодку.', {
    10: { text: 'Убить Царь-сома в плавнях к югу от рыбацкого стана.', marker: { x: 782, z: 1236 } },
    20: { text: 'Принести ус Царь-сома деду Панасу.', marker: { npc: 'panas' } },
    30: { done: true, text: 'Плавни снова принадлежат рыбакам.' }
  }, 250);
  side('sq_zarnitsa', 'Зарница', 'Робот-вожатый пионерлагеря «Чайка» продолжает смену номер 4011.', {
    10: { text: 'Найти три пионерских галстука и отдать Вожатому-7.', marker: { npc: 'vozhatyi' } },
    30: { done: true, text: 'Зарница объявлена открытой.' }
  }, 100);
  side('sq_norm', 'Норма выработки', 'Бригадир Кузьмич держит разум, пока держит план.', {
    10: { text: 'Выгнать одичавших ударников со склада цеха №3.', marker: { loc: 'zalk3' } },
    20: { text: 'Достать наряд из сейфа на складе и отдать Кузьмичу.', marker: { npc: 'kuzmich' } },
    30: { done: true, text: 'Бригада снова работает.' }
  }, 200);
  side('sq_letters', 'Письма', 'Почтамт ещё работает. Нужны ноги.', {
    10: { text: 'Доставить письма: доктору Ласточкиной (Вознесенка), писарю Голоте (Сечь), деду Панасу (плавни).', marker: [{ npc: 'doctor' }, { npc: 'pisar' }, { npc: 'panas' }] },
    30: { done: true, text: 'Письма доставлены.' }
  }, 150);
  side('sq_circus', 'Цирк', 'Гладиаторские бои в Запорожском цирке.', {
    10: { text: 'Выиграть первый бой на арене.', marker: { npc: 'gosha' } },
    20: { text: 'Выиграть второй бой на арене.', marker: { npc: 'gosha' } },
    30: { text: 'Выиграть финальный бой на арене.', marker: { npc: 'gosha' } },
    40: { done: true, text: 'Вы — чемпион арены.' }
  }, 250);
  side('sq_mayak', 'Голос Маяка', 'Радиостанция «Маяк-Запорожье» молчит без ламп.', {
    10: { text: 'Принести Лёве Эфиру три радиолампы.', marker: { npc: 'levitan' } },
    20: { text: 'Включить рубильник передатчика в аппаратной ДК «Орбита».', marker: { obj: 'orbita_switch' } },
    30: { done: true, text: '«Маяк-Запорожье» снова в эфире.' }
  }, 150);
  side('sq_gold', 'Скифское золото', 'В курганах Скифского стана лежит золотая пектораль.', {
    10: { text: 'Найти пектораль в большом кургане у Скифского стана (нужна сапёрная лопатка).', marker: { obj: 'kurgan_dig' } },
    30: { done: true, text: 'Судьба пекторали решена.' }
  }, 200);
  side('sq_pass', 'Пропуск', 'Полковник Савченко выдаёт пропуска на мост тем, кто делает работу гарнизона.', {
    10: { text: 'Зачистить ТЮЗ от хоботов.', marker: { loc: 'tyuz' } },
    20: { text: 'Доложить полковнику Савченко.', marker: { npc: 'savchenko' } },
    30: { done: true, text: 'Пропуск на мост получен.' }
  }, 150);
  side('sq_tehpasport', 'Техпаспорт', 'Без технического паспорта Тимофей — беглый агрегат.', {
    10: { text: 'Найти техпаспорт Тимофея в архиве бункера под Облисполкомом.', marker: { obj: 'bunker_archive' } },
    20: { text: 'Отдать техпаспорт Тимофею.', marker: { npc: 'timofey' } },
    30: { done: true, text: 'Тимофей — законный агрегат.' }
  }, 150);
  side('sq_yarina', 'Право на Сечь', 'Ярину выгнали из реестра за то, что она женщина.', {
    10: { text: 'Убедить Кошевого Сирко вписать Ярину в реестр (Ярина должна быть с вами): Красноречие или подвиг.', marker: { npc: 'sirko' } },
    30: { done: true, text: 'Ярина — в реестре Сечи.' }
  }, 200);

  Z.NOTES = Object.assign(Z.NOTES || {}, {
    n_bullet: { title: 'Медкарта № 0451', text: 'Поступил: неизвестный, мужчина/женщина, около 30 лет. Огнестрельное ранение головы по касательной, пуля 7,62×25 извлечена. Переохлаждение. Бред: «Монтана». Доставлен роботом Агрегат-7 (Тимофей). Доктор В. П. Ласточкина.' },
    n_tribute: { title: 'Ведомость сельсовета', text: 'Сбор на «десятину» Гире: собрано 200 талонов с 23 дворов. Двор Миколы-коваля отказался: «Кувалда — моя десятина». Записала секретарь Н. Ковтун.' },
    n_receipt: { title: 'Расписка', text: 'Принял от гражданина в синих штанах 300 (триста) талонов за то, чтобы тело с моста не всплыло. Тело всплыло — претензий не принимаем. Гиря.' },
    n_rada: { title: 'Протокол Рады', text: 'Слушали: о госте Коша Аркадии Лисовом. Постановили: гостя не трогать, пока сам не нарушит закон. Если кто обвинит — судить при Раде. Писарь Голота.' },
    n_pectoral: { title: 'Записка хранителя', text: 'Пектораль из кургана у стана. По описи 1982 года — «нагрудное украшение, золото, скифы, IV в. до н. э.». После войны курган запечатали обвалом. Нужна лопата и крепкие руки. Глибов.' },
    n_firma_ledger: { title: 'Бухгалтерия «Импульса»', text: 'Расход: З. К. (диспетчер почтамта) — 100 т. за страницу маршрутов. Ж. М. — 300 т. «на шпану». Шпана (Гиря) — 300 т. Приход ожидается: продажа «ключа» Кошу — 5000 т. или Комендатуре — 7000 т. Подпись: А. Лисовой.' },
    n_obl: { title: 'Табличка у люка', text: 'БУНКЕР ГО. ВХОД ТОЛЬКО ДЛЯ ДЕЖУРНОЙ СМЕНЫ АСУ «ПЛАНОВИК-77». ДРУЖИННИКИ ПРОВЕРЯЮТ ДОКУМЕНТЫ.' },
    n_tyuz: { title: 'Дневник ликвидатора', text: 'День 3. Хоботы в ТЮЗе не уходят. Говорят, их тянет к сцене — там когда-то давали «Золушку». День 5. Фильтр забился. Слышу, как они дышат за стеной. Если найдёте — фильтры отдайте наставнику из «Красной воды». Они не такие, как эти.' },
    n_redwater: { title: 'Журнал «Красной воды»', text: 'Фильтров осталось на 9 дней. Без фильтров начинается помутнение: сначала забываем слова, потом имена. Протасов.' },
    n_queue: { title: 'Правила очереди', text: '1. Эвакуация — строго по номерам. 2. Номер выдаёт табло. 3. Без номера выход запрещён. 4. Табло неисправно — ждать ремонта. Дежурный по очереди.' },
    n_broiler: { title: 'Сводка птичника', text: 'Привес бройлеров — 300% к плану. Бройлеры проявляют агрессию к птичницам. Петух Горлопан сорвал дверь курятника. Срочно — нужен ветеринар или ружьё.' },
    n_zarnitsa: { title: 'План смены 4011', text: 'Зарница: отряды «Чайка» и «Альбатрос». Флаг — у штаба. Галстуки — у вожатого. Вожатый-7 следит за порядком. Срок смены: до особого распоряжения.' },
    n_stakhanovit: { title: 'НИИ «Хортица»: «Стахановит»', text: 'Препарат повышает выработку в 3,2 раза. Побочные эффекты: утрата речи, гипертрофия мышц, шлакообразование на коже. Рекомендация: прекратить испытания. Резолюция сверху: «Продолжить. План важнее». Зарубин.' },
    n_card: { title: 'Перехват: АСУ «Плановик-77»', text: 'ГРАЖДАНИН ФЕЛЬДЪЕГЕРЬ № 147. ОТПРАВЛЕНИЕ «ПЕРФОКАРТА АСУ "ДНЕПР"» ОБНАРУЖЕНО В ВАШЕМ РАСПОРЯЖЕНИИ. АДРЕСАТ: АСУ «ПЛАНОВИК-77», ОБЛИСПОЛКОМ, ПОДВАЛ 3. ДОСТАВЬТЕ. КОНЕЦ СВЯЗИ.' }
  });

  Z.TERMINALS = Object.assign(Z.TERMINALS || {}, {
    selsovet: { title: 'Сельсовет Вознесенки', entries: [
      { title: 'Учёт дворов', text: 'Дворов: 23. Жителей: 61. Рыбаков: 9. Огородников на Хортице: 14. Скот: коза Машка (одна).' },
      { title: 'Переписка с Комендатурой', text: 'Комендатура требует увеличить десятину до пятнадцатины. Сельсовет просит отсрочки до урожая. Ответа нет.' }
    ] },
    komendatura: { title: 'Комендатура. Канцелярия', entries: [
      { title: 'Приказ № 214', text: 'Застава сечевиков на западном конце моста — не провоцировать. Пропуска выдавать только с подписью коменданта. Савченко.' },
      { title: 'Гауптвахта', text: 'Содержатся: казаки Охрим и Степан — за драку на рынке. Ключ от камер у старшины Запасного.', act: 'set kpzHint=1' },
      { title: 'Отпереть камеры гауптвахты', cond: 'q:mq06s=10', act: 'script freePrisoners', msg: 'Замки камер щёлкнули.' }
    ] },
    intourist: { title: 'Кооператив «Импульс»', entries: [
      { title: 'Касса', text: 'Выручка игрового зала за неделю: 1840 т. Ресторан: 620 т. Гостиница: 300 т. Прочее («услуги Жоржа»): 900 т.' },
      { title: 'Переписка председателя', text: 'Кошу: «Ключ от света — за пять тысяч и право торговли на острове». Комендатуре: «Ключ — за семь тысяч и отмену десятины для кооператива». Ответ Коша: «Приезжай, поговорим». Ответ Комендатуры: нет.', act: 'set ev_ledger=1' }
    ] },
    pochtamt: { title: 'Главпочтамт. Диспетчерская', entries: [
      { title: 'Книга маршрутов', text: 'Отправление № 4419. Фельдъегерь № 147. Груз: перфокарта, гриф «ОВ». Маршрут: Главная диспетчерская ДнепроГЭС — мост Преображенского — Облисполком, подвал 3. Страница маршрутов вырвана. Подпись диспетчера: З. К.', act: 'set ev_post=1' },
      { title: 'Фельдъегеря', text: 'В строю: 2. Погибли: 11. Пропали без вести: 4. № 147 — числится погибшим, вычеркнуть.' }
    ] },
    planner: { title: 'АСУ «Плановик-77»', header: 'АСУ «ПЛАНОВИК-77» · ПЯТИЛЕТКА № 42', entries: [
      { title: 'Показатели', text: 'Чугун: 0%. Сталь: 0%. Алюминий: 0,3% (бригада Кузьмича). Электроэнергия: 0%. Население района: 2 113 чел. Выполнение плана: 0,04%.' },
      { title: 'Дружинники', text: 'В строю: 14 дружинников, 1 луноход, 3 агрегата. Задача: охрана социалистической собственности. Документы проверять у всех.' },
      { title: 'Ремонтные агрегаты', text: 'Агрегат-7 (зав. № 1977-0451) — числится беглым. Техпаспорт хранится в архиве бункера, ячейка 3.' }
    ] },
    zalk: { title: 'ЗАлК. Цех №3', entries: [
      { title: 'План цеха', text: 'Электролиз алюминия. План: 100 т в месяц. Факт: 0,3 т (без тока). Бригадир: Кузьмич. Численность: 14 ударников, из них одичавших — 9.' },
      { title: 'Распоряжение', text: '«Стахановит» выдавать по 2 таблетки в смену. Повышенную дозу — ударникам, не выполняющим норму. Начальник цеха (подпись неразборчива).' }
    ] },
    vault12: { title: 'Табло очереди', header: 'ТАБЛО ОЧЕРЕДИ · УБЕЖИЩЕ ГО №12', entries: [
      { title: 'Текущий номер', text: 'СЕЙЧАС ОБСЛУЖИВАЕТСЯ: 0000. ОЖИДАЕТ: 61. СРЕДНЕЕ ВРЕМЯ ОЖИДАНИЯ: 74 113 ДНЕЙ.' },
      { title: 'Вызвать все номера', cond: 'skill:science>=40&!qdone:sq_queue&q:sq_queue>=10', act: 'script queueFree', msg: 'Табло вызвало все номера разом.' }
    ] },
    vault3: { title: 'Убежище ГО №3', entries: [
      { title: 'Фильтровентиляция', text: 'Состояние фильтров: критическое. Запас ФПК: 0. Ручной режим.' },
      { title: 'История', text: '23.10.2077: гермодверь закрыта. 2079: противогазы не снимать. 2121: противогазы не снимаются. 2280: нас пятеро.' }
    ] },
    nii: { title: 'НИИ «Хортица»', entries: [
      { title: 'Тема «Стахановит»', text: 'См. записку доктора Зарубина. Испытания на добровольцах ЗАлКа. Результат: ударники.' },
      { title: 'Тема «Подсолнух»', text: 'Гелиотропные сорта Лысенко для колхоза «Заветы Ильича». Цветок поворачивается к самому яркому источнику света и выстреливает семечки. Не выключайте фонари в поле.' },
      { title: 'Тема «Сом»', text: 'Сброс охлаждающей воды ДнепроГЭС. Гигантизм у сомов. Один экземпляр — «Царь» — превышает 6 метров.' }
    ] }
  });

  const actorBy = (g, id) => g.findActor(id);
  const allDead = (g, key) => { let n = 0; for (const c of g.cells.values()) for (const a of c.actors) if (a.spawnKey === key) { n++; if (!a.dead) return false; } return n > 0; };
  Z.allSpawnDead = allDead;

  const evidence = g => {
    let n = 1;
    if (g.flags.ev_girya || (g.notes || []).includes('n_receipt')) n++;
    if (g.flags.ev_post) n++;
    if (g.flags.ev_montana) n++;
    if (g.flags.ev_ledger || (g.notes || []).includes('n_firma_ledger')) n++;
    if (g.flags.ev_pisar) n++;
    return n;
  };
  Z.evidenceCount = evidence;
  S.cond_ev2 = g => evidence(g) >= 3;
  S.cond_ev4 = g => evidence(g) >= 5;
  S.cond_ferals = g => allDead(g, 'zalkferal');

  S.chargen = g => {
    g.later(0.15, () => {
      if (!g.ui) { g.flags.chargenDone = true; g.setStage('mq01', 20); return; }
      g.ui.openChargen(() => {
        g.flags.chargenDone = true;
        g.setStage('mq01', 20);
        const d = actorBy(g, 'doctor');
        if (d && g.ui) g.ui.startDialogue(d);
      });
    });
    return 'end';
  };

  S.cardFromChest = g => {
    for (const c of g.cells.values()) {
      const ch = c.objects.find(o => o.id === 'firma_chest');
      if (ch && ch.inv) { const e = ch.inv.find(x => x.id === 'perfokarta'); if (e) ch.inv.splice(ch.inv.indexOf(e), 1); }
    }
    if (!g.player.has('perfokarta')) g.player.give('perfokarta', 1);
    g.msg('Перфокарта АСУ «Днепр» — получено.', 'item');
    g.setStage('mq04', 50);
  };

  S.firmaLeaves = (g, f) => {
    g.flags.firmaGone = true;
    if (!f || f.dead) return;
    for (const c of g.cells.values()) { const i = c.actors.indexOf(f); if (i >= 0) c.actors.splice(i, 1); }
  };

  S.trialWin = g => {
    S.cardFromChest(g);
    g.addRep('sich', 15, 0);
    g.addKarma(30);
    S.firmaLeaves(g, actorBy(g, 'firma'));
  };

  S.duel = (g, ctx) => {
    const f = actorBy(g, 'firma');
    const p = g.player;
    const champ = g.spawnHuman('sichGuard', p.x + Math.sin(p.yaw) * 4, p.z - Math.cos(p.yaw) * 4, { name: 'Есаул Нечуй', faction: 'coop', weapon: 'sabre', hostile: true, level: 7, hp: 150 });
    champ.id = 'nechuy';
    champ.spawnKey = 'duel';
    champ.duel = true;
    champ.onDeath = game => { game.msg('Есаул Нечуй повержен. Бог рассудил.', 'quest'); S.cardFromChest(game); game.addRep('sich', 10, 0); S.firmaLeaves(game, f); };
    g.enterCombat(champ, p);
    g.setStage('mq04', 40);
    g.msg('Поединок по закону Сечи! Только холодное оружие — казаки смотрят.', 'warn');
    g.flags.duelOn = true;
    return 'end';
  };

  S.giryaFight = g => {
    for (const c of g.cells.values()) for (const a of c.actors) if (a.faction === 'shpana' && !a.dead && a.ai) { a.hostile = true; if (c === g.cell) g.enterCombat(a, g.player); }
    g.flags.shpanaWar = true;
    return 'end';
  };

  S.queueFree = g => {
    g.setStage('sq_queue', 30, { force: true });
    g.addRep('vozn', 20, 0);
    g.addKarma(40);
    g.player.give('talon', 80);
    for (const a of g.cell.actors) if (a.spawnKey === 'queue') { a.ai.wander = 4; a.ai.home = [12, 12]; }
    g.flags.queueFree = true;
    return 'end';
  };

  S.freePrisoners = g => {
    for (const c of g.cells.values()) {
      for (const o of c.objects) if (/^kpz/.test(o.id)) { g.flags['unlocked_' + o.id] = true; o.open = 1; if (o.solidRef) o.solidRef.disabled = true; }
      for (const a of c.actors) if (a.spawnKey === 'prisoner') { a.ai.wander = 0; a.ai.follow = g.player; a.freed = true; }
    }
    if (g.stage('mq06s') === 10) g.setStage('mq06s', 20);
  };

  S.implant = (g, ctx, args) => {
    const k = args[0];
    const p = g.player;
    p.sheet.stats[k] = Math.min(10, p.sheet.stats[k] + 1);
    g.flags['imp' + k[0].toUpperCase() + k.slice(1)] = true;
    p.refreshMax();
    g.msg(Z.statName(k) + ' +1. Имплант НИИ «Хортица».', 'level');
  };

  S.arena = (g, ctx, args) => {
    const round = +args[0];
    const cell = g.cell;
    const m = cell.marks.B || { x: 12.5, z: 11.5 };
    const p = g.player;
    p.x = m.x - 3; p.z = m.z + 2; p.y = cell.cw.groundAt(p.x, p.z, 3);
    const kinds = { 1: [['broiler', 3], ['rooster', 1]], 2: [['medvedka', 2]], 3: [['udarnik', 1]] }[round];
    let i = 0;
    for (const [k, n] of kinds) for (let j = 0; j < n; j++) {
      const a = g.spawnCreature(k, m.x + 2 + (i % 2) * 1.5, m.z - 2 - Math.floor(i / 2), { wander: 2 });
      a.spawnKey = 'arena' + round;
      a.id = 'arena' + round + '_' + i;
      a.ai.alerted = true;
      i++;
    }
    g.flags.arenaRound = round;
    g.msg('Бой начался! Публика ревёт.', 'warn');
    return 'end';
  };

  S.blackjack = g => { if (g.ui && g.ui.openOchko) g.later(0.1, () => g.ui.openOchko()); return 'end'; };

  S.startBattle = g => {
    if (g.flags.battleOn) return;
    g.flags.battleOn = true;
    g.flags.bridgeWar = true;
    g.setStage('mq07', 15);
    const route = g.flags.route;
    const ext = g.ext;
    const west = [-452, -253], east = [-300, -333], mid = [-384, -290];
    const spawnAt = (tpl, pt, n, o) => {
      const prev = g.cell;
      g.cell = ext;
      const out = [];
      try {
        for (let i = 0; i < n; i++) {
          const x = pt[0] + (i % 3 - 1) * 2, z = pt[1] + Math.floor(i / 3) * 2;
          const a = o.creature ? g.spawnCreature(tpl, x, z, { wander: 2, faction: o.faction, friendly: o.friendly }) : g.spawnHuman(tpl, x, z, { faction: o.faction, hostile: o.hostile, wander: 2 });
          a.spawnKey = o.key;
          a.id = o.key + '_' + tpl + '_' + i;
          a.ai.always = true;
          if (o.goal) a.ai.goal = o.goal;
          a.y = ext.cw.groundAt(x, z, 40);
          out.push(a);
        }
      } finally { g.cell = prev; }
      return out;
    };
    if (route === 'k') { spawnAt('sichGuard', west, 8, { faction: 'sich', hostile: true, key: 'battle', goal: east }); spawnAt('komendach', east, 4, { faction: 'komendatura', key: 'ally', goal: mid }); }
    else if (route === 's') { spawnAt('komendach', east, 8, { faction: 'komendatura', hostile: true, key: 'battle', goal: west }); spawnAt('sichGuard', west, 4, { faction: 'sich', key: 'ally', goal: mid }); }
    else if (route === 'p') { spawnAt('komendach', east, 5, { faction: 'komendatura', hostile: true, key: 'battle', goal: mid }); spawnAt('sichGuard', west, 5, { faction: 'sich', hostile: true, key: 'battle', goal: mid }); spawnAt('druzhinnik', [-330, -318], 3, { creature: true, faction: 'robots', friendly: true, key: 'ally', goal: mid }); spawnAt('lunokhod', [-318, -326], 1, { creature: true, faction: 'robots', friendly: true, key: 'ally', goal: mid }); }
    else { spawnAt('komendach', east, 4, { faction: 'komendatura', hostile: true, key: 'battle', goal: mid }); spawnAt('sichGuard', west, 4, { faction: 'sich', hostile: true, key: 'battle', goal: mid }); spawnAt('villager', [-292, -330], 4, { faction: 'vozn', key: 'ally', goal: mid }); }
    g.msg('Бой за мост начался!', 'warn');
    g.ev.emit('battle', {});
  };

  S.ending = g => {
    g.flags.ending = true;
    if (g.ui && g.ui.openEnding) g.ui.openEnding(Z.endingSlides(g));
  };

  Z.endingSlides = g => {
    const f = g.flags, out = [];
    const route = f.route;
    if (route === 'k') out.push({ t: 'Порядок со светом', x: 'Комендатура взяла мост и подстанцию. Ток пошёл в больницы, насосные и штаб гарнизона. Полковник Савченко ввёл комендантский час «до полной стабилизации». Стабилизация длится до сих пор.' + (f.komVozn ? ' Вознесенку, как обещал полковник, подключили первой.' : ' Вознесенка ждёт своей очереди.') });
    else if (route === 's') out.push({ t: 'Сечь со светом', x: 'Казаки отстояли мост. Над подстанцией подняли малиновое знамя. Ток пошёл на остров, а с острова — тем, кого Рада сочла достойными. Кошевой Сирко сказал: «Воля дороже света». Свет оказался не дешевле.' + (f.sichVozn ? ' Вознесенку, соседей по реке, подключили первой.' : '') });
    else if (route === 'p') out.push({ t: 'Пятилетка № 42', x: 'Дружинники заняли мост, луноход встал у подстанции. АСУ «Плановик-77» объявил: «ПЛАН ПО ЭЛЕКТРОЭНЕРГИИ ВЫПОЛНЕН НА 3 ПРОЦЕНТА». Каждому выдали лампочку и наряд. Работать пришлось всем. Многие говорят, что так даже лучше. Говорят тихо.' });
    else out.push({ t: 'Своя голова', x: 'Тимофей вставил перфокарту в пульт подстанции и перекинул рубильник на линию Вознесенки. В каждой хате загорелась лампочка Ильича. Комендатура и Сечь ещё долго спорили, кому принадлежит мост. Мост тем временем принадлежал тем, кто по нему ходит.' });
    if (f.coopDeal) out.push({ t: 'Кооператив «Импульс»', x: 'Фирма сдержал слово: ток продавался через кооператив. По кооперативным ценам. ' + (f.coopBig ? 'Десятая часть каждого киловатта капала на ваш счёт.' : 'Говорят, Фирма открыл второй «Интурист» в Соцгороде.') });
    else if (f.firmaGone) out.push({ t: 'Фирма', x: 'Аркадий Лисовой покинул Хортицу до заката, как велела Рада. Кооператив «Импульс» сменил председателя. Новый председатель первым делом уволил Жоржа «Монтану».' });
    out.push({ t: 'Вознесенка', x: f.giryaPeace ? 'Шпана Гири держала слово: Вознесенку не трогали. Тарасова груша плодоносит, Самовар открыл второй зал «Груши».' : f.shpanaWar ? 'После разгрома шпаны в Парке Победы Вознесенка вздохнула свободно. Микола-коваль повесил кувалду на стену: «Пусть отдохнёт».' : 'Вознесенка платила десятину то Гире, то Комендатуре. Груша плодоносит при любой власти.' });
    if (Q.sq_redwater && g.quests.sq_redwater && g.quests.sq_redwater.done) out.push({ t: '«Красная вода»', x: 'Хоботы Убежища №3 дышали чистым воздухом. Наставник Протасов научил троих детей Вознесенки читать — сквозь шланг противогаза, по слогам.' });
    if (g.quests.sq_queue && g.quests.sq_queue.done) out.push({ t: 'Очередь', x: 'Жители Убежища №12 вышли на поверхность впервые за двести лет. Многие встали в очередь в сельмаг Любы. По привычке.' });
    if (g.quests.sq_yarina && g.quests.sq_yarina.done) out.push({ t: 'Ярина', x: 'Ярина стала первой женщиной в реестре Сечи. Через год её выбрали куренным атаманом. Кобзарь Опанас так и не нашёл приличной рифмы к её имени.' });
    if (f.comp_timofey || (g.quests.sq_tehpasport && g.quests.sq_tehpasport.done)) out.push({ t: 'Тимофей', x: 'Агрегат-7, заводской номер 1977-0451, законный ремонтник Вознесеновского райисполкома, починил все табуретки в округе. Табуретки больше не жалуются.' });
    out.push({ t: 'Фельдъегерь', x: g.karma >= 250 ? 'О фельдъегере, вернувшемся с того света, рассказывают у костров. Рассказывают хорошее.' : g.karma <= -250 ? 'О фельдъегере, вернувшемся с того света, рассказывают шёпотом. И оглядываются.' : 'Фельдъегерь доставил отправление. Кому — каждый в Запорожье теперь знает по-своему. А впереди — плотина.' });
    return out;
  };

  Z.TRIGGERS = [
    { id: 'kppStop', x: -296, z: -335, r: 9, cond: g => !g.flags.bridgeOK && !g.flags.bridgeWar && g.player.y > 13.5 && !g.flags.kppTalked, run: g => { g.flags.kppTalked = true; const d = actorBy(g, 'dub'); if (d && !d.dead && g.ui && !g.hostileToPlayer(d)) g.ui.startDialogue(d); } },
    { id: 'kppCross', x: -322, z: -322, r: 8, cond: g => !g.flags.bridgeOK && !g.flags.bridgeWar && g.player.y > 14 && !g.flags.kppAlarm, run: g => { g.flags.kppAlarm = true; g.msg('Нарушитель на мосту! Солдаты Комендатуры открывают огонь!', 'warn'); for (const a of g.ext.actors) if (a.faction === 'komendatura' && !a.dead && a.ai && Math.hypot(a.x + 296, a.z + 335) < 40) { a.hostile = true; g.enterCombat(a, g.player); } g.addRep('komendatura', 0, 5); } },
    { id: 'island', x: -470, z: -245, r: 30, cond: g => g.stage('mq03') === 40, run: g => g.setStage('mq03', 50) },
    { id: 'raid', x: 480, z: 176, r: 60, cond: g => g.stage('mq02') === 10 && g.time - (g.flags.mq02t || g.time) > 600 && !g.flags.raidDone, run: g => S.raid(g) },
    { id: 'battle', x: -384, z: -290, r: 70, cond: g => g.stage('mq07') === 10, run: g => S.startBattle(g) }
  ];

  S.raid = g => {
    g.flags.raidDone = true;
    g.setStage('mq02', 15);
    const s = Z.SITES.find(x => x.id === 'vozn');
    const prev = g.cell;
    g.cell = g.ext;
    try {
      for (let i = 0; i < 5; i++) {
        const w = Z.siteToWorld(s, -78 - (i % 2) * 2, -4 + i * 2);
        const a = g.spawnHuman('shpana', w[0], w[1], { hostile: true, wander: 4 });
        a.spawnKey = 'raid';
        a.id = 'raid_' + i;
        a.ai.alerted = true;
        a.ai.goal = Z.siteToWorld(s, 0, 0);
      }
    } finally { g.cell = prev; }
    g.msg('Шпана идёт на Вознесенку!', 'warn');
  };

  Z.GAME_INIT.push(g => {
    const district = g.map.district.slice();
    if (Z.polyArea(district) < 0) district.reverse();
    g.playArea = Z.offsetPoly(district, 60);
    g.wx = { cloud: 0.3, dark: 0, fog: 0.04, haze: 0.15, wind: 0.4, rain: 0 };
    g.hooks.push((game, dt) => game.storyTick(dt));
    g.ev.on('use', ev => {
      if (!ev.ob || ev.ob.id !== 'orbita_switch') return;
      if (g.stage('sq_mayak') === 20) { g.flags.mayakOn = true; g.setStage('sq_mayak', 30); g.msg('Передатчик загудел. «Маяк-Запорожье» в эфире!', 'quest'); }
      else if (!g.flags.mayakOn) g.msg('Рубильник щёлкнул. Без ламп передатчик молчит.', 'info');
    });
    const kurgan = g.ext.objects.find(o => o.id === 'kurgan_dig');
    if (kurgan) kurgan.onUse = game => {
      if (game.flags.kurganDug) { game.msg('Курган уже вскрыт.', 'info'); return null; }
      if (!game.player.has('lopatka')) { game.msg('Без лопаты курган не вскрыть. Сапёрная лопатка подойдёт.', 'warn'); return null; }
      game.flags.kurganDug = true;
      game.player.give('pectoral', 1);
      game.time += 60;
      game.msg('Час работы лопатой — и под слоем глины блеснуло золото. Пектораль!', 'item');
      game.giveXP(75, 'Раскопки');
      return null;
    };
    const sub = g.ext.objects.find(o => o.id === 'substation');
    if (sub) sub.onUse = game => {
      const r = game.flags.route;
      if (r === 'p' && game.stage('mq06p') === 10) { game.setStage('mq06p', 30); game.setStage('mq07', 10); game.msg('Рубильник перекинут. Над мостом загудели провода.', 'quest'); return null; }
      if (r === 'i' && game.stage('mq06i') === 20) {
        if (!game.companions().some(a => a.cid === 'timofey')) { game.msg('Без Тимофея с этим пультом не справиться: схема довоенная, кодовая.', 'warn'); return null; }
        game.setStage('mq06i', 30); game.setStage('mq07', 10); game.msg('Тимофей вставил перфокарту. Линия Вознесенки под напряжением.', 'quest'); return null;
      }
      game.msg('Пульт подстанции «Мост». Без кодов АСУ «Днепр» рубильник не работает.', 'info');
      return null;
    };
  });

  Z.EXTERIOR_BUILDERS.push((g, cell) => {
    const kpp = Z.SITES.find(s => s.id === 'kpp');
    const w = Z.siteToWorld(kpp, -6, -15);
    g.addObject(cell, { id: 'substation', type: 'switch', name: 'Пульт подстанции «Мост»', x: w[0], z: w[1], y: cell.cw.groundAt(w[0], w[1], 40), yaw: Z.siteYaw(kpp, Math.PI) });
    const sc = Z.SITES.find(s => s.id === 'scythia');
    const k = Z.siteToWorld(sc, -14, 22);
    g.addObject(cell, { id: 'kurgan_dig', type: 'custom', name: 'Обвал в кургане', size: [1.6, 0.8, 1.6], x: k[0], z: k[1], yaw: 0 });
  });

  Z.INTERIOR_HOOKS.push((g, cell, def) => {
    if (cell.id === 'kuren') {
      const ch = cell.objects.find(o => o.id === 'firma_chest');
      if (ch && !g.flags.cardTaken) g.addToInv(ch.inv, 'perfokarta', 1);
      if (g.flags.firmaGone) cell.actors = cell.actors.filter(a => a.npcId !== 'firma');
    }
    if (cell.id === 'komendatura') { const kv = cell.actors.find(a => a.npcId === 'kvarter'); if (kv) kv.give('kpzKey', 1); }
    if (cell.id === 'intourist') { const m = cell.actors.find(a => a.npcId === 'montana'); if (m) m.give('firmaKey', 1); }
  });

  G.storyTick = function (dt) {
    this.storyT = (this.storyT || 0) - dt;
    if (this.storyT > 0) return;
    this.storyT = 0.3;
    const p = this.player;
    if (!p || p.dead) return;
    if (this.stage('mq02') === 10 && !this.flags.mq02t) this.flags.mq02t = this.time;
    if (this.cell.exterior) for (const t of Z.TRIGGERS) {
      if (this.flags['trig_' + t.id] && !t.repeat) continue;
      if (Math.hypot(p.x - t.x, p.z - t.z) > t.r) continue;
      if (t.cond && !t.cond(this)) continue;
      this.flags['trig_' + t.id] = true;
      t.run(this);
    }
    if (p.has('perfokarta') && this.stage('mq04') > 0 && this.stage('mq04') < 50) this.setStage('mq04', 50);
    if (p.has('perfokarta')) this.flags.cardTaken = true;
    if (this.flags.intro && !this.flags.introDone && this.ui && !this.ui.panels.length) {
      this.introT = (this.introT || 0) + 0.3;
      if (this.introT > 1.2) { this.flags.introDone = true; const d = actorBy(this, 'doctor'); if (d) this.ui.startDialogue(d); }
    }
    if (this.stage('sq_harvest') === 10 && allDead(this, 'queen')) this.setStage('sq_harvest', 20);
    if (this.stage('mq03') === 40 && this.flags.found_sich) this.setStage('mq03', 50);
    if (this.stage('mq06s') === 10 && (this.flags.unlocked_kpz1 || this.flags.unlocked_kpz2 || this.flags.unlocked_kpz3)) S.freePrisoners(this);
    if (this.stage('sq_somking') === 10 && allDead(this, 'somking')) this.setStage('sq_somking', 20);
    if (this.stage('sq_pass') === 10 && allDead(this, 'tyuzhobot')) this.setStage('sq_pass', 20);
    if (this.stage('sq_tehpasport') === 10 && p.has('techpasport')) this.setStage('sq_tehpasport', 20);
    if (this.stage('mq06i') === 10 && p.has('techpasport')) this.setStage('mq06i', 20);
    if (this.stage('mq06k') === 10 && allDead(this, 'sichpost')) this.setStage('mq06k', 20);
    if (this.stage('mq02') === 15 && allDead(this, 'raid')) { this.setStage('mq02', 20); this.addRep('vozn', 15, 0); this.msg('Налёт отбит! Вознесенка этого не забудет.', 'quest'); }
    if (this.stage('mq02') === 10 && this.flags.shpanaWar && actorBy(this, 'girya') && actorBy(this, 'girya').dead) { this.flags.ev_girya = true; this.setStage('mq02', 40); }
    if (this.stage('mq02') === 20 && this.flags.shpanaWar && actorBy(this, 'girya') && actorBy(this, 'girya').dead) { this.flags.ev_girya = true; this.setStage('mq02', 40); }
    if (this.flags.arenaRound) {
      const r = this.flags.arenaRound;
      if (allDead(this, 'arena' + r)) { this.flags.arenaRound = 0; this.setStage('sq_circus', r === 1 ? 20 : r === 2 ? 30 : 40); p.give('talon', 100); this.msg('Победа! Публика бросает на манеж талоны: +100.', 'quest'); if (r === 3) p.give('sambo', 1); }
    }
    if (this.flags.battleOn && !this.flags.battleWon && allDead(this, 'battle')) { this.flags.battleWon = true; this.setStage('mq07', 20); }
    for (const z of Z.RAD_ZONES) if (this.cell.exterior && Math.hypot(p.x - z.x, p.z - z.z) < z.r) { const k = this.addRads(p, z.rate * 0.3); if (k > 0.5 && !this.flags.radWarnT) { this.flags.radWarnT = 1; this.msg('Счётчик Гейгера трещит: ' + z.name + '.', 'warn'); } }
    if (this.flags.duelOn) {
      const w = p.weapon();
      if (w && w.wtype !== 'melee' && w.wtype !== 'unarmed' && !this.flags.duelBroken && this.cell.actors.some(a => a.id === 'nechuy' && !a.dead && a.ai && a.ai.state === 'combat') && p.cool > 0) {
        this.flags.duelBroken = true;
        this.msg('Вы взялись за огнестрел в поединке! Казаки возмущены.', 'warn');
        this.addRep('sich', 0, 30);
      }
      if (this.cell.actors.some(a => a.id === 'nechuy' && a.dead)) this.flags.duelOn = false;
    }
  };

  Z.RAD_ZONES = [
    { x: 258, z: -624, r: 24, rate: 6, name: 'шламохранилище' },
    { x: 430, z: -820, r: 60, rate: 3, name: 'эпицентр' }
  ];

  Z.DEATH_HOOKS.push((g, t, info) => {
    if (t.npcId) g.flags['dead_' + t.npcId] = true;
    if (t.npcId === 'girya' && (g.stage('mq02') === 10 || g.stage('mq02') === 20)) { g.flags.ev_girya = true; g.setStage('mq02', 40); }
    if (t.npcId === 'firma' && g.stage('mq04') > 0 && g.stage('mq04') < 50) { g.flags.firmaGone = true; g.addRep('sich', 0, 25); g.msg('Вы убили гостя Коша. Сечь этого не простит.', 'warn'); }
    if (t.npcId === 'montana' && g.stage('mq03') === 30) { g.flags.ev_montana = true; g.setStage('mq03', 40); }
    if (t.spawnKey === 'redwater' || t.npcId === 'protasov') { if (g.flags.v3contract && allDead(g, 'redwater') && !g.flags.v3paid) { g.flags.v3paid = true; g.player.give('talon', 500); g.msg('Комендатура перечислила 500 талонов за «Красную воду». Карма тяжелеет.', 'warn'); g.addKarma(-100); if (g.stage('sq_redwater') > 0) g.setStage('sq_redwater', 30, { force: true }); } }
  });

  Z.NEWGAME.push((g, o) => {
    const p = g.player;
    p.give('talon', 15);
    g.enterCell('medpunkt', 'B');
    g.flags.intro = true;
    g.setStage('mq01', 10, { silent: true });
    g.time = Z.START_TIME;
    if (o && o.hardcore) { g.hardcore = true; g.needs = { h2o: 0, fod: 0, slp: 0 }; }
  });

  Z.radioLines = (g, id, intro) => {
    const R = Z.rng(Math.floor((g ? g.time : 0) * 7) + id.length);
    const pick = a => a[Math.floor(R() * a.length)];
    const f = g ? g.flags : {};
    if (id === 'mayak') {
      if (!f.mayakOn) return ['…шшш… Говорит… шшш… «Маяк»… лампы… шшш…'];
      const news = ['Новости района: на Вознесенском рынке подешевела тушёнка. Подорожала совесть.', 'Сводка погоды: над Хортицей ясно, над ЗАлКом — как всегда.', 'Привет пионерлагерю «Чайка»! Вожатый-7 просил передать: смена продолжается.', 'Из Комендатуры сообщают: пошлина на мосту не изменилась. Из Сечи сообщают: и не изменится.'];
      if (f.mq02done || (g.quests.mq02 && g.quests.mq02.done)) news.push('Говорят, в Парке Победы стало тише. Говорят, это работа одного фельдъегеря.');
      if (g.quests.mq07 && g.quests.mq07.done) news.push('Мост Преображенского свободен! В Вознесенке горит свет! Повторяю: в Вознесенке горит свет!');
      return intro ? ['Говорит «Маяк-Запорожье»! У микрофона Лёва Эфир.', pick(news)] : [pick(news)];
    }
    if (id === 'sich') return [pick(['Гей, хлопцы! Кобзарь Опанас на хвыле. Слухайте, як Байда на гаку висів, а султана не боявся…', 'Сечь стоит, Днепр течёт, горилка не кончается. Добрый вечер, Хортица!', 'Песня про Ярину, первую сечевичку. Рифма пока не готова. Слухайте без рифмы.'])];
    if (id === 'plan') return [pick(['ГОВОРИТ АСУ «ПЛАНОВИК-77». ВЫПОЛНЕНИЕ ПЛАНА: НОЛЬ ЦЕЛЫХ НОЛЬ ЧЕТЫРЕ СОТЫХ ПРОЦЕНТА. ПОДНАЖМЁМ, ТОВАРИЩИ.', 'ГРАЖДАНЕ! ЭЛЕКТРИФИКАЦИЯ — ЭТО ПЛАН ПЛЮС ПЕРФОКАРТА.', 'МУЗЫКАЛЬНАЯ ПАУЗА. ЧАЙКОВСКИЙ. «ЛЕБЕДИНОЕ ОЗЕРО». ПО ПЛАНУ.'])];
    return [];
  };

  Z.COMPANION_PERKS = Object.assign(Z.COMPANION_PERKS || {}, {
    timofeyTech: { name: 'Законный агрегат', desc: 'Тимофей чинит ваше снаряжение на привалах.' },
    yarinaEye: { name: 'Глаз Ярины', desc: 'Пока Ярина рядом, шанс крита по дальним целям выше.' },
    courierRank: { name: 'Фельдъегерь первого класса', desc: 'Почтамт платит больше; быстрое перемещение на 25% быстрее.' }
  });
})(globalThis.FalloutZP = globalThis.FalloutZP || {});
