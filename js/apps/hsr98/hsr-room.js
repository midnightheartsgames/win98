(function (H) {
  'use strict';

  function initRoomMapDecor() {
    const m = H.MAPS && H.MAPS.express_room;
    if (!m || m.roomDecorBuilt) return;
    m.roomDecorBuilt = true;
    const d = m.decor;
    d.push(
      ['rm_clutter', 4, 5, 'tall', '!%rm_built_bed_1'],
      ['rm_clutter', 14, 4, null, '!%rm_built_bath_1'],
      ['rm_clutter', 15, 11, null, '!%rm_built_hall_1'],
      ['rm_clutter', 25, 6, 'tall', '!%rm_built_liv_1'],
      ['rm_clutter', 33, 6, null, '!%rm_built_game_1'],
      ['rm_clutter', 29, 12, 'tall', '!%rm_built_gal_1'],
      ['rm_bed', 3, 3, null, '%rm_built_bed_1'],
      ['rm_shower', 18, 3, null, '%rm_built_bath_3'],
      ['flamp', 17, 10, null, '%rm_built_hall_1'],
      ['flamp', 20, 10, null, '%rm_built_hall_1'],
      ['rm_candy', 27, 3, null, '%rm_built_liv_3'],
      ['rm_stand', 25, 12, null, '%rm_built_gal_1'],
      ['rm_stand', 29, 12, null, '%rm_built_gal_2'],
      ['rm_stand', 33, 12, null, '%rm_built_gal_3'],
      ['spot', 26, 11, null, '%rm_built_gal_5'],
      ['spot', 30, 11, null, '%rm_built_gal_5'],
      ['spot', 34, 11, null, '%rm_built_gal_5']
    );
    const POS = {
      pillow: ['rm_pillow', 3, 3],
      nstand: ['rm_nstand', 7, 3],
      desk: ['rm_desk', 8, 3],
      bsofa: ['rm_bsofa', 4, 8],
      bench: ['rm_bench', 4, 6],
      wallart: ['rm_wallart', 8, 2],
      sill: ['rm_sill', 2, 2],
      tub: ['rm_tub', 12, 3],
      vanity: ['rm_vanity', 15, 3],
      towel: ['rm_towel', 18, 4],
      bathmat: ['rm_bathmat', 15, 5],
      mat: ['rm_mat', 18, 12],
      coat: ['rm_coat', 14, 11],
      screen: ['rm_screen', 21, 10],
      hplant: ['rm_hplant', 23, 11],
      fridge: ['rm_fridge', 22, 3],
      minibar: ['rm_minibar', 24, 3],
      buffet: ['rm_buffet', 28, 3],
      island: ['rm_island', 24, 6],
      pcdesk: ['rm_pcdesk', 31, 3],
      arcade: ['rm_arcade', 33, 3],
      bgshelf: ['rm_bgshelf', 35, 3],
      beans: ['rm_beans', 33, 6],
      neon: ['rm_neon', 32, 2],
      vitrines: ['rm_vitrines', 29, 10]
    };
    for (const slot of H.ROOM_SLOTS || []) {
      const p = POS[slot.id];
      if (!p) continue;
      for (const it of slot.items) d.push([p[0], p[1], p[2], it.id, '%rm_slot_' + slot.id + '_' + it.id]);
    }
    const standX = [25, 29, 33];
    for (let i = 0; i < 3; i++) {
      for (const t of H.ROOM_TROPHIES || []) d.push(['rm_trophy', standX[i], 12, t.id, '%rm_stand_' + (i + 1) + '_' + t.id]);
    }
  }
  initRoomMapDecor();

  const THREADS = [
    {
      id: 'room_invite', who: 'pompom', need: 'ending|room_open', alone: true,
      steps: [
        'pompom|Внимание всем пассажирам! На общем собрании решено выделить {name} личную комнату на втором этаже над Вагоном для вечеринок, пом!',
        'march|Ура!! Наконец-то {name} перестанет засыпать на диване в Общем вагоне!',
        'danheng|Там же бывший склад запчастей. Придётся разобрать немало коробок.',
        { pick: [
          ['У меня будет собственная комната?!', 'pompom|Да, пом! С панорамным окном, ванной и гостиной!'],
          ['Готовьте коробки, я иду с битой!', 'pompom|Никаких бит на складе проводника, пом! Разбирать будем аккуратно!']
        ] },
        'himeko|Мы с Вельтом выделили средства из Фонда Экспресса на первый этап ремонта.',
        'pompom|{name}, поднимайся по винтовой лестнице в Вагоне для вечеринок! Проводник ждёт тебя наверху с планом обустройства, пом!',
        { quest: 'room_home' }
      ]
    }
  ];

  const QUESTS = {
    room_home: {
      name: 'Идеи декора для космического дома', giver: 'Пом-Пом', type: 'adv', ch: 'adv_express', face: 'pompom', area: 'express_room',
      desc: 'Экипаж Звёздного экспресса решил обустроить для Первопроходца собственную комнату на втором этаже Вагона для вечеринок.',
      reward: { jade: 100, credits: 30000, items: { exp2: 4 }, pom: 'chef' },
      steps: {
        talk: { text: 'Подняться по винтовой лестнице в Вагоне для вечеринок', at: 'express_party:e', desc: 'Пом-Пом ждёт у винтовой лестницы в Вагоне для вечеринок, чтобы показать будущее помещение комнаты Первопроходца.' },
        clean: { text: 'Поговорить с Пом-Пом в новой комнате на втором этаже', at: 'express_room:z', desc: 'Осмотрите складское помещение на втором этаже и составьте с Пом-Пом план обустройства.' },
        build: { text: 'Построить первый предмет мебели через План обустройства', at: 'express_room:q', desc: 'Используйте стартовый взнос Фонда Экспресса на доске «План обустройства», чтобы поставить кровать Первопроходца.' },
        duty: { text: 'Провести первое дежурство на Экспрессе через План обустройства', at: 'express_room:q', desc: 'Проведите одну смену дежурства с товарищем по экипажу, чтобы пополнить Фонд Экспресса.' },
        renovate: { text: 'Достичь прогресса обустройства 15/30★', at: 'express_room:q', desc: 'Продолжайте дежурства и обустраивайте зоны комнаты до отметки 15 звёзд.' },
        inspect: { text: 'Встретить Химеко и Вельта в комнате Первопроходца', at: 'express_room:z', desc: 'Половина комнаты готова! Пом-Пом, Химеко и Вельт пришли оценить ремонт.' },
        finish: { text: 'Завершить обустройство всех зон комнаты (30/30★)', at: 'express_room:q', desc: 'Доведите прогресс обустройства всех шести зон комнаты до 30 из 30 звёзд.' },
        party: { text: 'Устроить новоселье с экипажем в комнате Первопроходца', at: 'express_room:z', desc: 'Комната полностью обустроена! Поговорите с Пом-Пом, чтобы собрать весь экипаж на праздничное новоселье.' }
      }
    }
  };

  const SCRIPTS = {
    exp_staircase: [
      { if: 'room_open', jump: 'up' },
      { if: '?room_home=talk', jump: 'start' },
      '|Винтовая лестница ведёт на второй этаж, в маленькую кладовку. На перилах табличка Пом-Пом: «Склад. Посторонним вход воспрещён».',
      '|Может, исследуем комнаты наверху позже?',
      { end: true },
      '#start',
      { recap: 'Второй этаж Экспресса', text: 'У винтовой лестницы в Вагоне для вечеринок Пом-Пом снимает табличку «Посторонним вход воспрещён» и ведёт {name} на второй этаж, где из старого склада решено сделать личную комнату Первопроходца.' },
      'pompom|О, {name}, ты уже здесь! Сейчас Пом-Пом снимет табличку с перил, пом!',
      'march|Мы с Дань Хэном уже перенесли самые тяжёлые ящики в грузовой отсек. Ну, то есть Дань Хэн перенёс, а я руководила!',
      'danheng|Там всё ещё полно коробок, но места хватит на целую квартиру.',
      'pompom|Поднимайся смелее, пом! Сейчас проводник покажет тебе твои будущие апартаменты!',
      { flag: 'room_open' },
      { quest: 'room_home', step: 'clean' },
      { goto: ['express_room', 'd'] },
      { end: true },
      '#up',
      { goto: ['express_room', 'd'] }
    ],

    rm_pom_talk: [
      { if: '?room_home=clean', jump: 'clean' },
      { if: '?room_home=inspect', jump: 'inspect' },
      { if: '?room_home=party', jump: 'party' },
      'pompom|Не забывай проверять доску «План обустройства», пом! Дежурства по вагонам приносят средства в Фонд Экспресса!',
      { ui: 'roomevent' },
      { end: true },
      '#clean',
      { recap: 'План обустройства комнаты', text: 'На втором этаже Пом-Пом вручает {name} чек-лист обустройства из шести зон и выделяет первые 20 000 единиц Фонда Экспресса на покупку кровати и мебели для спальни.' },
      'pompom|Вот мы и наверху, пом! Раньше здесь хранились запасные рельсовые стабилизаторы, старые абажуры и три ящика пуговиц.',
      'march|Смотри, какое огромное окно! Сюда поместится и спальня, и ванная, и гостиная, и даже игровой уголок!',
      { choice: [['«Спасибо вам всем! Здесь невероятно просторно!»', 'c1'], ['«А где мы поставим почётный Мусорный Бак?»', 'c2']] },
      '#c1',
      'pompom|Хе-хе, Безымянный должен отдыхать с комфортом между мирами, пом!',
      { jump: 'c3' },
      '#c2',
      'march|Я так и знала! Вон там в углу будет Галерея редкостей, ставь туда хоть три бака, лишь бы чистых!',
      '#c3',
      'pompom|Пом-Пом составил подробный «План обустройства»! В комнате шесть зон: Спальня, Ванная, Прихожая, Гостиная, Игровая и Галерея редкостей.',
      'pompom|Чтобы заказывать мебель, нужны средства из Фонда Экспресса. Вот тебе стартовый взнос от Химеко на первую покупку, пом!',
      { flag: 'room_grant_1' },
      { quest: 'room_home', step: 'build' },
      { tut: 'Идеи декора для космического дома. На доске «План обустройства» или через вкладку «События» в телефоне можно строить мебель в шести зонах комнаты, выбирать расцветку и сувениры в режиме «Заказать декор», а также выходить на дежурства с экипажем для пополнения Фонда Экспресса.' },
      { ui: 'roomevent' },
      { end: true },
      '#inspect',
      { recap: 'Инспекция Химеко и Вельта', text: 'Когда половина комнаты обустроена, Химеко и Вельт поднимаются на второй этаж, хвалят новую обстановку и выделяют ещё 30 000 единиц Фонда Экспресса на завершение ремонта.' },
      'himeko|Какая перемена! Ещё недавно здесь лежали пыльные контейнеры, а теперь настоящий домашний уют.',
      'welt|Отличная планировка, {name}. Свет из панорамных окон падает прямо на жилую зону.',
      'pompom|Проводник лично проверял каждый шуруп по чек-листу, пом! Половина плана уже выполнена!',
      'himeko|Раз дело спорится так быстро, мы с Вельтом перевели в Фонд Экспресса дополнительную премию на оставшиеся зоны.',
      { flag: 'room_grant_2' },
      { quest: 'room_home', step: 'finish' },
      '|Фонд Экспресса пополнен на 30 000! Продолжайте обустройство комнаты до 30★.',
      { ui: 'roomevent' },
      { end: true },
      '#party',
      { recap: 'Новоселье на втором этаже', text: 'Все шесть зон комнаты Первопроходца полностью обустроены! Экипаж собирается на новоселье, дарит Пом-Пом поварской наряд «Прожарка от проводника!», а Март 7 делает памятный снимок для фотостены.' },
      'pompom|Тридцать звёзд из тридцати, пом! Все шесть зон сияют чистотой и уютом!',
      'march|Гостиная готова, торт на столе, лимонад охлаждён! Объявляю торжественное новоселье {name} открытым!',
      'danheng|Поздравляю с собственным углом, {name}. Теперь у тебя есть где хранить все трофеи из наших экспедиций.',
      'himeko|И у нас есть подарок не только для хозяина комнаты, но и для главного прораба ремонта.',
      'welt|Пом-Пом трудился над сметами и ужинами для бригады не меньше нашего.',
      'pompom|П-подарок для Пом-Пом?! Белоснежный поварской китель и высокий колпак шеф-повара?!',
      { choice: [['«Тебе очень идёт, шеф Пом-Пом!»', 'p1'], ['«Теперь ждём фирменный пирог каждые выходные!»', 'p2']] },
      '#p1',
      'pompom|Хе-хе! В этом колпаке кулинарный авторитет проводника вырос до небес, пом!',
      { jump: 'p3' },
      '#p2',
      'pompom|Только если пассажиры не будут опаздывать к столу и крошить на новый паркет, пом!',
      '#p3',
      'march|А ну-ка все к столу! Сейчас сделаю лучший кадр для моей фотостены! Раз, два... Улыбочку!',
      { flag: 'room_done' },
      { give: { jade: 100, credits: 30000, items: { exp2: 4 }, pom: 'chef' } },
      { quest: 'room_home', step: 'done' },
      '|На фотостену Март 7 добавлен новый памятный снимок, а в гардеробную Пом-Пом добавлен Поварской наряд «Прожарка от проводника!».'
    ],

    rm_board_prop: [
      { if: '?room_home=clean|?room_home=inspect|?room_home=party', jump: 'pom' },
      { ui: 'roomevent' },
      { end: true },
      '#pom',
      { script: 'rm_pom_talk' }
    ],

    rm_bed_prop: [
      { if: '!%rm_built_bed_1', jump: 'unbuilt' },
      { heal: true },
      '|Мягкая кровать Первопроходца у широкого окна. Отряд полностью восстановил силы.',
      { choice: [['Немного полежать и посмотреть на звёзды', 'rest'], ['Забраться под одеяло и уснуть всерьёз', 'sleep'], ['Отойти', 'leave']] },
      '#rest',
      '|За толстым стеклом бесшумно проплывают созвездия. Мерный гул двигателей Звёздного экспресса убаюкивает лучше любой колыбельной.',
      { end: true },
      '#sleep',
      { recap: 'Сон до конца Вселенной', text: '{name} решает лечь спать на новой кровати так крепко, что пропускает все остановки Звёздного экспресса вплоть до финальных титров, после чего вскакивает от будильника Пом-Пом.' },
      '|Вы натягиваете одеяло до самого носа. Подушка оказывается настолько удобной, что веки смыкаются сами собой.',
      'march|Эй, {name}, вставай! Мы прибыли на следующую остановку!',
      { choice: [['«Ещё пять минуточек...»', 's2'], ['«Ещё одну Янтарную эру...»', 's2']] },
      '#s2',
      '|Проходят дни, месяцы и целые Янтарные эры. Звёздный экспресс завершает свой великий путь через все галактики, пока вы продолжаете мирно сопеть в подушку.',
      { credits: true },
      'pompom|ПОДЪЁМ, ПОМ!! Ты что, собираешься проспать до самого конца Вселенной?!',
      '|Вы вздрагиваете и открываете глаза. За окном всё тот же второй этаж, а на тумбочке надрывается будильник.',
      { flag: 'room_slept_credits' },
      { end: true },
      '#unbuilt',
      '|Здесь пока свалены картонные коробки со склада. Постройте «Кровать Первопроходца» на доске обустройства!',
      '#leave'
    ],

    rm_desk_prop: [
      { if: '!%rm_built_bed_3', jump: 'unbuilt' },
      { if: '%rm_slot_desk_globe', jump: 'globe' },
      { if: '%rm_slot_desk_camera', jump: 'cam' },
      '|Письменный стол из тёплого ореха. На столешнице аккуратно разложены вещи Первопроходца.',
      '|В открытом Дневнике Освоения записаны маршруты от станции «Герта» и заснеженного Белобога до звёздных гаваней Лофу Сяньчжоу.',
      { end: true },
      '#globe',
      '|Письменный стол из тёплого ореха. На столешнице возвышается латунная армиллярная сфера, показывающая положение Звёздного экспресса на рельсах Акивили.',
      { end: true },
      '#cam',
      '|Письменный стол из тёплого ореха. Запасной фотоаппарат Март 7 всегда заряжен, а рядом лежат весёлые снимки друзей.',
      { end: true },
      '#unbuilt',
      '|Место для будущего письменного стола в спальне. Загляните в План обустройства!'
    ],

    rm_bath_prop: [
      { if: '!%rm_built_bath_1', jump: 'unbuilt' },
      { heal: true },
      '|Горячая фарфоровая купель наполнена душистой пеной и тёплым паром.',
      { choice: [['Принять горячую ванну (+бодрость отряда)', 'soak'], ['Отойти', 'leave']] },
      '#soak',
      { flag: 'room_bath_buff' },
      '|Тёплая вода снимает всю усталость после долгих переходов, а резиновая уточка отважно покачивается на пенных волнах. Здоровье отряда полностью восстановлено!',
      { end: true },
      '#unbuilt',
      '|Трубы уже подведены, но купель ещё не установлена. Откройте План обустройства!',
      '#leave'
    ],

    rm_fridge_prop: [
      { if: '!%rm_built_liv_1', jump: 'unbuilt' },
      '|Двухкамерный холодильник тихо гудит. Внутри стройными рядами стоят напитки, фрукты и контейнеры с обедами от Пом-Пом.',
      { choice: [['Взять прохладный напиток', 'drink'], ['Закрыть дверцу', 'leave']] },
      '#drink',
      { heal: true },
      '|Глоток ледяного ягодного лимонада мгновенно освежает голову! Рядом в морозилке лежит стратегический запас клубничного мороженого Март 7.',
      { end: true },
      '#unbuilt',
      '|В этом углу гостиной отлично встанет большой холодильник. Загляните в План обустройства!',
      '#leave'
    ],

    rm_bar_prop: [
      { if: '!%rm_built_liv_2', jump: 'unbuilt' },
      '|Домашний мини-бар с полированной стойкой и сифонной кофеваркой.',
      { choice: [['Сварить бодрящий кофе по рецепту Химеко', 'coffee'], ['Отойти', 'leave']] },
      '#coffee',
      { heal: true },
      '|Насыщенный аромат свежемолотых зёрен наполняет всю гостиную. На этот раз вкус получился мягким и сбалансированным!',
      { end: true },
      '#unbuilt',
      '|Место для будущей барной стойки в гостиной.',
      '#leave'
    ],

    rm_pc_prop: [
      { if: '!%rm_built_game_1', jump: 'unbuilt' },
      '|Игровой уголок Первопроходца. На столе светится пузатый монитор под управлением системы Microslop Win 98.',
      { one: ['|На первом месте в таблице рекордов аркадного автомата красуется подпись «SW_WOLF: 999999», а прямо под ней ваша строчка и результат Март 7.', '|Вы запускаете любимую стратегию на Microslop Win 98. Клавиатура приятно щёлкает в тишине второго этажа.'] },
      { end: true },
      '#unbuilt',
      '|В этом отсеке можно оборудовать настоящую игровую комнату с компьютером и аркадами!'
    ],

    rm_vitrine_prop: [
      { if: '!%rm_built_gal_4', jump: 'unbuilt' },
      '|Центральная застеклённая витрина Галереи редкостей. Под мягким светом софитов здесь хранятся памятные реликвии Безымянных.',
      { end: true },
      '#unbuilt',
      '|Место для центральной витрины в Галерее редкостей.'
    ],

    rm_stand_1: [
      { if: '!%rm_built_gal_1', jump: 'unbuilt' },
      { ui: 'roomstand', stand: 0 },
      { end: true },
      '#unbuilt',
      '|Постройте «Выставочный стенд I» в Плане обустройства, чтобы выставлять здесь свои трофеи!'
    ],
    rm_stand_2: [
      { if: '!%rm_built_gal_2', jump: 'unbuilt' },
      { ui: 'roomstand', stand: 1 },
      { end: true },
      '#unbuilt',
      '|Постройте «Выставочный стенд II» в Плане обустройства, чтобы выставлять здесь свои трофеи!'
    ],
    rm_stand_3: [
      { if: '!%rm_built_gal_3', jump: 'unbuilt' },
      { ui: 'roomstand', stand: 2 },
      { end: true },
      '#unbuilt',
      '|Постройте «Выставочный стенд III» в Плане обустройства, чтобы выставлять здесь свои трофеи!'
    ]
  };

  const G0 = H.Game.prototype;
  const base = {
    cond: G0.cond,
    missionTick: G0.missionTick,
    claimEvent: G0.claimEvent,
    eventReady: G0.eventReady,
    alerts: G0.alerts
  };

  Object.assign(H.Game.prototype, {
    room() {
      const s = this.state;
      if (!s.room || typeof s.room !== 'object') {
        s.room = {
          fund: 0,
          built: [],
          slots: {},
          stands: ['trash_king', 'express_model', 'trotter_gold'],
          logs: 0,
          starGot: [],
          logGot: [],
          charGot: null,
          shifts: 0,
          shift: null
        };
      }
      const r = s.room;
      if (!Array.isArray(r.built)) r.built = [];
      if (!r.slots || typeof r.slots !== 'object') r.slots = {};
      if (!Array.isArray(r.stands) || r.stands.length < 3) r.stands = ['trash_king', 'express_model', 'trotter_gold'];
      if (!Array.isArray(r.starGot)) r.starGot = [];
      if (!Array.isArray(r.logGot)) r.logGot = [];
      if (typeof r.fund !== 'number') r.fund = 0;
      if (typeof r.logs !== 'number') r.logs = 0;
      if (typeof r.shifts !== 'number') r.shifts = 0;
      return r;
    },

    roomOpen() {
      return !!(this.state.flags.ending || this.state.flags.room_early || this.state.flags.room_open);
    },

    roomEarlyReady() {
      return this.eventsOpen() && !this.roomOpen();
    },

    roomStartEarly() {
      if (!this.roomEarlyReady()) return false;
      this.state.flags.room_early = true;
      this.state.flags.room_open = true;
      if (!this.state.quests.room_home) this.setQuest('room_home', 'clean');
      if (this.chatSync) this.chatSync();
      return true;
    },

    roomSyncGrants() {
      const r = this.room(), f = this.state.flags;
      if (f.room_grant_1 && !f.room_grant_1_paid) {
        f.room_grant_1_paid = true;
        r.fund += 20000;
      }
      if (f.room_grant_2 && !f.room_grant_2_paid) {
        f.room_grant_2_paid = true;
        r.fund += 30000;
      }
    },

    roomStars() {
      return this.room().built.length;
    },

    roomZoneBuilds(zoneId) {
      return H.ROOM_BUILDS.filter(b => b.zone === zoneId);
    },

    roomZoneStars(zoneId) {
      const built = this.room().built;
      return this.roomZoneBuilds(zoneId).filter(b => built.includes(b.id)).length;
    },

    roomZonePct(zoneId) {
      return this.roomZoneStars(zoneId) * 20;
    },

    roomNextBuild(zoneId) {
      const built = this.room().built;
      return this.roomZoneBuilds(zoneId).find(b => !built.includes(b.id)) || null;
    },

    roomCanBuild(id) {
      const b = H.ROOM_BUILDS.find(x => x.id === id);
      if (!b) return false;
      const r = this.room();
      if (r.built.includes(id) || r.fund < b.cost) return false;
      const next = this.roomNextBuild(b.zone);
      return !!next && next.id === id;
    },

    buildRoomItem(id) {
      if (this.guest) return false;
      this.roomSyncGrants();
      const b = H.ROOM_BUILDS.find(x => x.id === id);
      if (!b || !this.roomCanBuild(id)) return false;
      const r = this.room();
      r.fund -= b.cost;
      r.built.push(id);
      if (b.slot && !r.slots[b.slot]) r.slots[b.slot] = b.defItem;
      if (b.extraSlot && !r.slots[b.extraSlot]) r.slots[b.extraSlot] = b.extraDef;
      this.roomQuestSync();
      return true;
    },

    roomSlotUnlocked(slotId) {
      const sl = H.ROOM_SLOTS.find(s => s.id === slotId);
      return !!sl && this.room().built.includes(sl.build);
    },

    roomSlotItem(slotId) {
      const sl = H.ROOM_SLOTS.find(s => s.id === slotId);
      if (!sl || !this.room().built.includes(sl.build)) return null;
      const cur = this.room().slots[slotId];
      return sl.items.some(it => it.id === cur) ? cur : sl.items[0].id;
    },

    setRoomDecor(slotId, itemId) {
      if (this.guest) return false;
      const sl = H.ROOM_SLOTS.find(s => s.id === slotId);
      if (!sl || !this.room().built.includes(sl.build)) return false;
      if (!sl.items.some(it => it.id === itemId)) return false;
      this.room().slots[slotId] = itemId;
      return true;
    },

    roomTrophyOk(trophyId) {
      const t = H.ROOM_TROPHIES.find(x => x.id === trophyId);
      return !!t && (!t.need || this.cond(t.need));
    },

    setRoomStand(standIdx, trophyId) {
      if (this.guest || standIdx < 0 || standIdx > 2) return false;
      if (!this.room().built.includes('gal_' + (standIdx + 1))) return false;
      if (!this.roomTrophyOk(trophyId)) return false;
      const stands = this.room().stands;
      const other = stands.indexOf(trophyId);
      if (other >= 0 && other !== standIdx) stands[other] = stands[standIdx];
      stands[standIdx] = trophyId;
      return true;
    },

    drawRoomCards() {
      const pool = H.ROOM_CARDS.slice(), out = [];
      while (out.length < 3 && pool.length) {
        const idx = Math.floor(this.rng() * pool.length);
        out.push(pool.splice(idx, 1)[0]);
      }
      return out;
    },

    startRoomDuty(partnerId) {
      if (this.guest) return null;
      const crew = H.ROOM_CREW.find(c => c.id === partnerId) || H.ROOM_CREW[0];
      const sh = {
        partner: crew.id,
        turn: 1,
        maxTurns: 4,
        earned: 0,
        combo: 0,
        lastTag: null,
        history: [],
        hand: this.drawRoomCards(),
        logUnlocked: null,
        done: false
      };
      this.room().shift = sh;
      return sh;
    },

    playRoomDutyCard(cardIdx) {
      if (this.guest) return null;
      const r = this.room(), sh = r.shift;
      if (!sh || sh.done) return null;
      const card = sh.hand[cardIdx] || sh.hand[0];
      if (!card) return null;
      const crew = H.ROOM_CREW.find(c => c.id === sh.partner) || H.ROOM_CREW[0];
      const mult = crew.tag === 'all' ? 1.2 : crew.tag === card.tag ? 1.3 : 1;
      sh.combo = sh.lastTag === card.tag ? sh.combo + 1 : 0;
      sh.lastTag = card.tag;
      const gain = Math.round(card.fund * mult) + sh.combo * 1500;
      sh.earned += gain;
      sh.history.push({ id: card.id, name: card.name, gain });
      if (sh.turn >= sh.maxTurns) {
        const evalBonus = 12000;
        sh.evalBonus = evalBonus;
        sh.earned += evalBonus;
        sh.rank = sh.earned >= 52000 ? 'SS' : sh.earned >= 48000 ? 'S' : 'A';
        sh.done = true;
        r.fund += sh.earned;
        r.shifts++;
        if (r.logs < H.ROOM_LOGS.length) {
          r.logs++;
          sh.logUnlocked = H.ROOM_LOGS[r.logs - 1].id;
        } else {
          sh.logUnlocked = H.ROOM_LOGS[(r.shifts - 1) % H.ROOM_LOGS.length].id;
        }
        this.roomQuestSync();
      } else {
        sh.turn++;
        sh.hand = this.drawRoomCards();
      }
      return sh;
    },

    roomQuestSync() {
      this.roomSyncGrants();
      if (!this.guest && !this.state.quests.room_home && this.state.flags.ending) {
        this.setQuest('room_home', 'talk');
      }
      const q = this.state.quests.room_home, r = this.room(), stars = r.built.length;
      if (!q || q === 'done') return;
      if (q === 'build' && stars >= 1) {
        this.setQuest('room_home', r.shifts >= 1 ? (stars >= 15 ? 'inspect' : 'renovate') : 'duty');
      } else if (q === 'duty' && r.shifts >= 1) {
        this.setQuest('room_home', stars >= 15 ? 'inspect' : 'renovate');
      } else if (q === 'renovate' && stars >= 15) {
        this.setQuest('room_home', 'inspect');
      } else if (q === 'finish' && stars >= 30) {
        this.setQuest('room_home', 'party');
      }
    },

    roomStarReady(stars) {
      const m = H.ROOM_REWARDS.stars.find(x => x.stars === stars);
      return !!m && this.roomStars() >= stars && !this.room().starGot.includes(stars);
    },

    claimRoomStar(stars) {
      if (this.guest || !this.roomStarReady(stars)) return null;
      const m = H.ROOM_REWARDS.stars.find(x => x.stars === stars);
      this.room().starGot.push(stars);
      const spec = { jade: m.jade, credits: m.credits, items: {} };
      if (m.aether) spec.items.aether2 = m.aether;
      if (m.log) spec.items.exp2 = m.log;
      if (m.pom) spec.pom = m.pom;
      return this.give(spec);
    },

    roomLogReady(count) {
      const m = H.ROOM_REWARDS.logs.find(x => x.count === count);
      return !!m && this.room().logs >= count && !this.room().logGot.includes(count);
    },

    claimRoomLog(count) {
      if (this.guest || !this.roomLogReady(count)) return null;
      const m = H.ROOM_REWARDS.logs.find(x => x.count === count);
      this.room().logGot.push(count);
      return this.give({ jade: m.jade, credits: m.credits });
    },

    roomCharReady() {
      return this.roomStars() >= 10 && !this.room().charGot;
    },

    claimRoomChar(charId) {
      if (this.guest || !this.roomCharReady()) return null;
      if (!H.ROOM_REWARDS.chars.includes(charId) || !H.CHARS[charId]) return null;
      this.room().charGot = charId;
      const res = this.addChar(charId, this.avgLevel());
      const out = [res === 'new' ? H.CHARS[charId].name : res === 'eid' ? 'Эйдолон: ' + H.CHARS[charId].name : 'звёздный свет +' + H.charGlow(res, H.CHARS[charId].rarity)];
      return out;
    },

    netRoom() {
      const r = this.room();
      if (!r.built.length && !Object.keys(r.slots).length) return null;
      return { b: r.built.slice(), s: Object.assign({}, r.slots), t: r.stands.slice(0, 3) };
    },

    applyNetRoom(nr) {
      const r = this.room();
      if (!nr || typeof nr !== 'object') {
        if (this.state.flags.room_done) r.built = H.ROOM_BUILDS.map(b => b.id);
        return;
      }
      const validBuilds = new Set(H.ROOM_BUILDS.map(b => b.id));
      r.built = Array.isArray(nr.b) ? nr.b.filter(id => validBuilds.has(id)).slice(0, 30) : [];
      r.slots = {};
      if (nr.s && typeof nr.s === 'object') {
        for (const sl of H.ROOM_SLOTS) {
          const v = nr.s[sl.id];
          if (sl.items.some(it => it.id === v)) r.slots[sl.id] = v;
        }
      }
      const validTrophies = new Set(H.ROOM_TROPHIES.map(t => t.id));
      if (Array.isArray(nr.t)) {
        r.stands = [0, 1, 2].map(i => (validTrophies.has(nr.t[i]) ? nr.t[i] : r.stands[i]));
      }
    },

    cond(expr) {
      if (!this.guest && !this.state.quests.room_home && this.state.flags.ending && typeof expr === 'string' && expr.includes('room_home')) {
        this.roomQuestSync();
      }
      if (typeof expr === 'string' && expr.includes('%rm_')) {
        const evalToken = tok => {
          if (tok.startsWith('%rm_built_')) return this.room().built.includes(tok.slice(10));
          if (tok.startsWith('%rm_slot_')) {
            const rest = tok.slice(9), u = rest.lastIndexOf('_');
            if (u <= 0) return false;
            return this.roomSlotItem(rest.slice(0, u)) === rest.slice(u + 1);
          }
          if (tok.startsWith('%rm_stand_')) {
            const idx = Number(tok[10]) - 1, id = tok.slice(12);
            return this.room().built.includes('gal_' + (idx + 1)) && this.room().stands[idx] === id;
          }
          return base.cond.call(this, tok);
        };
        if (expr.startsWith('!%rm_')) return !evalToken(expr.slice(1));
        if (expr.startsWith('%rm_')) return evalToken(expr);
      }
      return base.cond.call(this, expr);
    },

    missionTick() {
      const r = base.missionTick ? base.missionTick.call(this) : undefined;
      this.roomSyncGrants();
      this.roomQuestSync();
      return r;
    },

    eventReady(id) {
      if (id === 'cosmic_home') {
        return H.ROOM_REWARDS.stars.some(m => this.roomStarReady(m.stars)) ||
          H.ROOM_REWARDS.logs.some(m => this.roomLogReady(m.count)) ||
          this.roomCharReady();
      }
      return base.eventReady.call(this, id);
    },

    claimEvent(id) {
      if (id !== 'cosmic_home') return base.claimEvent.call(this, id);
      const out = [];
      for (const m of H.ROOM_REWARDS.stars) {
        const got = this.claimRoomStar(m.stars);
        if (got) out.push(...got);
      }
      for (const m of H.ROOM_REWARDS.logs) {
        const got = this.claimRoomLog(m.count);
        if (got) out.push(...got);
      }
      return out;
    },

    alerts() {
      const a = base.alerts.call(this);
      if (this.eventsOpen() && this.eventReady('cosmic_home')) a.events = true;
      return a;
    }
  });

  Object.assign(H.QUESTS, QUESTS);
  Object.assign(H.SCRIPTS, SCRIPTS);
  if (H.CHAT && H.CHAT.THREADS) {
    H.CHAT.THREADS.push(...THREADS.filter(t => !H.CHAT.THREADS.some(x => x.id === t.id)));
  }
  if (typeof module !== 'undefined') module.exports = H;
})(globalThis.Hsr98 = globalThis.Hsr98 || {});
