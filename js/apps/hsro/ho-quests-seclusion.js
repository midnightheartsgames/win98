(function (HO) {
  'use strict';
  const Q = o => Object.assign({ req: [], reward: {}, give: [] }, o);

  Object.assign(HO.QUESTS, {
    i_letter: Q({
      zone: 'seclusion', lvl: 8, giver: 'herta_puppet', turnIn: 'herta_puppet2', title: 'Письмо Герты', req: ['u_door'], take: ['letter'],
      offer: 'Кукла протягивает руку. «Письмо у тебя. Дверь на втором этаже Зоны хранения его узнает. За ней Изолированная зона, там тебя встретит другая я. Не перепутай».',
      wait: '«Дверь на западе балкона. Иди уже».',
      done: '«Дошёл. Письмо давай сюда, это мой почерк, а не твой. Здесь работают опыты Жуань Мэй. Часть из них работает лучше, чем хотелось бы».',
      goals: [{ k: 'travel', zone: 'seclusion', text: 'Войти в Изолированную зону' }],
      reward: { credits: 60 }
    }),
    i_center: Q({
      zone: 'seclusion', lvl: 8, giver: 'herta_puppet2', turnIn: 'herta_puppet2', title: 'Распределительный центр', req: ['i_letter'],
      offer: '«Рой снова завёлся. Незрелые жаложуки в Распределительном центре. Быстрые, глупые, их много. Десяти хватит, чтобы проход стал проходом».',
      wait: '«Распределительный центр за постом. Жужжит, не промахнёшься».',
      done: '«Тише стало. Я засекла время, ты не самый медленный. Возьми что-нибудь из лабораторного, им всё равно никто не пользуется».',
      goals: [{ k: 'kill', foe: 'juvsting', n: 10, text: 'Победить Незрелых жаложуков' }],
      reward: { credits: 60, choice: ['hands3s', 'feet3s'] }
    }),
    i_creatures: Q({
      zone: 'seclusion', lvl: 8, giver: 'beanpaste', turnIn: 'beanpaste', title: 'Создания Жуань Мэй', req: ['i_letter'],
      offer: 'Создание тихо урчит и смотрит на теплицы. Там, среди грядок, жмутся ещё трое таких же. Им страшно от жужжания Роя. Подойти к ним надо спокойно, без боя.',
      wait: 'Создание урчит. Трое в теплицах всё ещё прячутся.',
      done: 'Создание довольно перекатывается. Пахнет жареными бобами сильнее. Кажется, это благодарность.',
      goals: [{ k: 'use', obj: 'creature_a', n: 1, text: 'Успокоить создание у входа в теплицы' }, { k: 'use', obj: 'creature_b', n: 1, text: 'Успокоить создание у южной стены' }, { k: 'use', obj: 'creature_c', n: 1, text: 'Успокоить создание у западных грядок' }],
      reward: { credits: 80, items: [['rice', 3]] }
    }),
    i_records: Q({
      zone: 'seclusion', lvl: 9, giver: 'herta_puppet2', turnIn: 'herta_puppet2', title: 'Записи Жуань Мэй', req: ['i_center'],
      offer: '«Три терминала с её записями: в Распределительном центре, в Питательной среде и в теплицах. Скачай. Я бы сама, но у куклы короткие руки».',
      wait: '«Три терминала. Не два. Три».',
      done: '«Аккуратные записи. Даже слишком. Ладно, это уже моё дело».',
      goals: [{ k: 'use', obj: 'rec_center', n: 1, text: 'Терминал в Распределительном центре' }, { k: 'use', obj: 'rec_nutrient', n: 1, text: 'Терминал в Питательной среде' }, { k: 'use', obj: 'rec_green', n: 1, text: 'Терминал в теплицах' }],
      reward: { credits: 90 }
    }),
    i_pharma: Q({
      zone: 'seclusion', lvl: 9, giver: 'herta_puppet2', turnIn: 'herta_puppet2', title: 'Фармацевтический кабинет', req: ['i_center'],
      offer: '«В Фармацевтическом кабинете сыворотки. Четыре ампулы, из разных шкафов. Жаложуки их любят, так что будь вежлив, но быстр».',
      wait: '«Четыре ампулы. Шкафы у стен кабинета».',
      done: '«Целые. Джоанна будет рада, она в этом разбирается лучше меня. Не говори ей, что я так сказала».',
      goals: [{ k: 'collect', item: 'serum', n: 4, text: 'Взять сыворотки из шкафов' }],
      reward: { credits: 90, choice: ['head3s', 'body3s'] }
    }),
    i_nutrient: Q({
      zone: 'seclusion', lvl: 9, giver: 'herta_puppet2', turnIn: 'herta_puppet2', title: 'Питательная среда', req: ['i_center'],
      offer: '«Коррозийные жаложуки в Питательной среде носят на себе её образцы. Пять. Их укус ядовит, так что держи аптечку под рукой. Или целителя».',
      wait: '«Пять образцов с Коррозийных жаложуков. Питательная среда к северу от центра».',
      done: '«Образцы целые, ты тоже. Хороший день».',
      goals: [{ k: 'collect', item: 'sample', n: 5, text: 'Собрать образцы питательной среды' }],
      reward: { credits: 90, items: [['medkit', 3]] }
    }),
    i_nests: Q({
      zone: 'seclusion', lvl: 9, giver: 'beanpaste', turnIn: 'beanpaste', title: 'Гнёзда в теплицах', req: ['i_creatures'],
      offer: 'Создание катится к грядкам и останавливается у края. Там гнёзда Роя. Если их разорить, оттуда вылетят жаложуки. Четыре гнезда, и теплицы снова станут тихими.',
      wait: 'Создание ждёт у грядок. Гнёзда ещё жужжат.',
      done: 'Создание прыгает на месте. Листик на макушке трясётся. Тихо.',
      goals: [{ k: 'use', obj: 'nest', n: 4, text: 'Разорить гнёзда Роя' }],
      reward: { credits: 100 }
    }),
    i_swarm: Q({
      zone: 'seclusion', lvl: 9, giver: 'herta_puppet2', turnIn: 'herta_puppet2', title: 'Нашествие', req: ['i_nutrient'], group: 3,
      offer: '«В Питательной среде вырос жаложук побольше. Он зовёт Рой и плюётся кислотой по всем рядом. Одному туда не надо. Маяк у входа позовёт Арлана, Джоанну или мою куклу, кого не хватает».',
      wait: '«Большой жаложук в Питательной среде. Группа: 3. Маяк у входа в зал».',
      done: '«Рой без него разбежался по углам. Возьми, это из запасов охраны, им всё равно не по размеру».',
      goals: [{ k: 'kill', foe: 'gnawsting_e', n: 1, text: 'Победить элитного Коррозийного жаложука (группа: 3)' }],
      reward: { credits: 30, choice: ['rel3_head', 'rel3_body'] }
    }),
    i_incubator: Q({
      zone: 'seclusion', lvl: 9, giver: 'herta_puppet2', turnIn: 'herta_puppet2', title: 'Инкубатор', req: ['i_center'], group: 3,
      offer: '«Под Распределительным центром Инкубатор. Там растёт второй синтетический Скаракабаз, и растёт быстро. Лифт открою. Внизу маяк, бери группу. Клон нестабилен: через четыре минуты боя рассыплется сам, но тогда добыча будет хуже».',
      wait: '«Лифт в Распределительном центре. Скаракабаз в самом конце Инкубатора».',
      done: '«Одним клоном меньше. Пока. Инкубатор будет пересобираться, спускайтесь, когда захотите. Сундук в конце щедрее раз в день, не спрашивай почему, это не я придумала».',
      goals: [{ k: 'kill', foe: 'skaracabaz', n: 1, text: 'Победить Скаракабаза в Инкубаторе (группа: 3)' }],
      reward: { credits: 40 }
    }),
    k_echo: Q({
      zone: 'control', lvl: 10, giver: 'herta_puppet', turnIn: 'herta_puppet', title: 'Эхо войны', req: ['i_incubator'], group: 3, class: true,
      offer: 'Кукла Герты кивает на машину в углу. «Виртуальная вселенная. Я записала ночь нападения: перрон, Зверь Судного дня, всё как было. Хочу запись, где его побеждают добровольцы. Втроём. Маяк внутри».',
      wait: '«Машина в углу офиса. Зверь в записи злится так же, как в жизни. Даже сильнее, когда просыпается».',
      done: '«Запись есть. Хорошая. Я её пересмотрю, когда буду в плохом настроении. Ты теперь Свидетель Пробуждения, так и запишу. Машину не выключаю, приходи ещё».',
      goals: [{ k: 'kill', foe: 'doomsday', n: 1, text: 'Победить Зверя Судного дня в Эхе войны (группа: 3)' }],
      reward: { title: 'Свидетель Пробуждения' }
    }),
    k_destruction: Q({
      zone: 'control', lvl: 10, path: 'destruction', giver: 'arlan', turnIn: 'arlan', title: 'Испытание Арлана', class: true,
      offer: 'Арлан проверяет перчатки. «Учебный проектор на посту. Три Захватчика, три исследователя идут к выходу. Минута. Ни один Захватчик не должен до них дотронуться. Справишься, покажу Сокрушение».',
      wait: '«Проектор у стены поста. Нажмёшь, когда будешь готов».',
      done: 'Арлан кивает. «Стоял. Это главное. Сокрушение бьёт сильно и стоит тебе крови. Путь Разрушения платит собой. А дальше выбирай, каким ты станешь».',
      goals: [{ k: 'trial', trial: 't_arlan', text: 'Удержать Захватчиков, пока исследователи уходят' }],
      reward: { credits: 150, ult: true, trace: true }
    }),
    k_abundance: Q({
      zone: 'base', lvl: 10, path: 'abundance', giver: 'joanna', turnIn: 'joanna', title: 'Ночная смена', class: true,
      offer: 'Джоанна не поднимает глаз от планшета. «Ночная смена. Трое раненых на койках, к отсеку идут Барионы. Две минуты, пока не придёт охрана. Все трое должны дожить. Ты тоже».',
      wait: '«Кнопка тревоги у двери. Нажмёшь, и смена начнётся».',
      done: 'Джоанна наконец смотрит на тебя. «Все живы. Милость Яоши твоя. Она для тех минут, когда лечить по одному уже поздно».',
      goals: [{ k: 'trial', trial: 't_joanna', text: 'Две минуты держать раненых живыми' }],
      reward: { credits: 150, ult: true, trace: true }
    }),
    k_erudition: Q({
      zone: 'control', lvl: 10, path: 'erudition', giver: 'herta_puppet', turnIn: 'herta_puppet', title: 'Экзамен Герты', class: true,
      offer: '«Экзамен. Пять голограмм, у каждой своя слабость. Девяносто секунд, пробить всех пятерых. Огонь или лёд, думай сам. Я засекаю».',
      wait: '«Пульт экзамена в моём офисе. Время пойдёт, как нажмёшь».',
      done: '«Сдал. Полный расчёт твой. Это когда думать уже некогда, а надо, чтобы всё горело и мёрзло сразу».',
      goals: [{ k: 'trial', trial: 't_herta', text: 'Пробить пять голограмм за 90 с' }],
      reward: { credits: 150, ult: true, trace: true }
    })
  });
  HO.QUEST_IDS = Object.keys(HO.QUESTS);
  HO.CLASS_QUEST = { destruction: 'k_destruction', abundance: 'k_abundance', erudition: 'k_erudition' };

  HO.TRIALS = {
    t_arlan: {
      zone: 'control', name: 'Испытание Арлана', dur: 60, center: { x: -43, z: 0 }, radius: 28, atk: 0.5,
      start: 'Проектор гудит. Исследователи идут к выходу. Захватчики появятся у западной стены.',
      wardName: 'Исследователь', wardLook: { type: 'person', coat: '#e8ecf4', hair: '#2a2026', skin: '#f0d6c0', race: 'human' }, wardHp: 120, wardSpeed: 0.45,
      wards: [{ x: -51, z: -5, to: { x: -24, z: -1 } }, { x: -52, z: 0, to: { x: -24, z: 0 } }, { x: -51, z: 5, to: { x: -24, z: 1 } }],
      waves: [{ at: 2, foes: [['reaver', 9, -53, -10]] }, { at: 12, foes: [['reaver', 9, -53, 10]] }, { at: 22, foes: [['reaver', 9, -53, 0]] }],
      raid: true
    },
    t_joanna: {
      zone: 'base', name: 'Ночная смена', dur: 120, center: { x: -32, z: 22 }, radius: 26, atk: 0.7,
      start: 'Тревога. Раненые на койках, Барионы идут к Медицинскому отсеку с двух сторон.',
      wardName: 'Раненый сотрудник', wardLook: { type: 'person', coat: '#c8d8e8', hair: '#5c3a46', skin: '#e2bc9c', race: 'human' }, wardHp: 150, wardStart: 0.6,
      wards: [{ x: -39.5, z: 17 }, { x: -39.5, z: 23 }, { x: -39.5, z: 29 }],
      bleed: { every: 6, v: 0.15 },
      waves: [{ at: 3, foes: [['baryon', 9, -17, 22]] }, { at: 30, foes: [['baryon', 9, -35, 8]] }, { at: 60, foes: [['baryon', 9, -17, 22]] }, { at: 90, foes: [['baryon', 9, -35, 8]] }],
      raid: true
    },
    t_herta: {
      zone: 'control', name: 'Экзамен Герты', dur: 90, center: { x: 0, z: -35 }, radius: 24, atk: 0.4, need: 5,
      start: 'Пять голограмм загораются по краям офиса. Пробитая голограмма гаснет. Время пошло.',
      waves: [{ at: 0, foes: [['baryon', 9, -8, -30], ['reaver', 9, 0, -29], ['flamespawn', 9, 8, -30], ['juvsting', 9, -2, -42], ['gnawsting', 9, 7, -41]] }],
      passive: true
    }
  };
  HO.TRIAL_IDS = Object.keys(HO.TRIALS);

  HO.ZONES.control.objects.push(
    { id: 'trial_arlan', name: 'Учебный проектор', look: 'panel', x: -54.4, z: -9, act: 'trial', trial: 't_arlan' },
    { id: 'trial_herta', name: 'Пульт экзамена', look: 'panel', x: 11.4, z: -34, act: 'trial', trial: 't_herta' }
  );
  HO.ZONES.base.objects.push({ id: 'trial_joanna', name: 'Кнопка тревоги медотсека', look: 'panel', x: -20.4, z: 18, act: 'trial', trial: 't_joanna' });

  if (typeof module !== 'undefined') module.exports = HO;
})(globalThis.HO = globalThis.HO || {});
