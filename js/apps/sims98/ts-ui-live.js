(function (S) {
  'use strict';
  const Kit = S.Kit, Font = S.Font, Icons = S.Icons;
  const PANEL_H = 116, TAB_H = 24, TAB_W = 37, DIAL_R = 31, SMALL = 22, FACE_W = 40, FACE_H = 46, BIG_FACE = 72, DOUBLE_CLICK = 400, TIP_DELAY = 250;
  const INK = '#102a66', LIGHT = '#f0f6ff', LIGHT_SOFT = '#cfdcf4', MOOD = '#3fbf3f', NEED = '#5fb85a', NEED_LOW = '#d8b83a', NEED_BAD = '#d8483a';
  const AGE_NAMES = { adult: 'Взрослый', teen: 'Подросток', child: 'Ребёнок', toddler: 'Малыш' };
  const MODES = [
    { id: 'live', icon: 'live', title: 'Жизнь', text: 'Симы живут, вы подсказываете.', keys: '' },
    { id: 'buy', icon: 'buy', title: 'Покупка', text: 'Мебель и вещи для дома.', later: 'Откроется на этапе 23.' },
    { id: 'build', icon: 'build', title: 'Строительство', text: 'Стены, полы, крыши и участок.', later: 'Откроется на этапе 24.' }
  ];
  const TABS = [
    { id: 'simology', icon: 'simology', title: 'Симология', text: 'Кто этот сим: возраст, черты, любимое, мечта.' },
    { id: 'skills', icon: 'skills', title: 'Навыки', text: 'Что сим уже умеет и что учит. Подробности в журнале.', keys: 'Журнал: J' },
    { id: 'job', icon: 'job', title: 'Работа', text: 'Должность, часы, производительность, что нужно для повышения, начальник и коллеги. У школьника оценки и уроки.' },
    { id: 'relations', icon: 'relations', title: 'Отношения', text: 'С кем сим знаком и как к нему относятся. Звонок и место на карте прямо из строки.' },
    { id: 'chance', icon: 'chance', title: 'Возможности', text: 'Задания от города со сроком и наградой. Приходят звонком раз в несколько дней, иногда прямо на работе.' },
    { id: 'inventory', icon: 'inventory', title: 'Инвентарь', text: 'Что сим носит с собой: улов, урожай, находки, картины, рукописи. Щелчок по вещи: что с ней сделать.' },
    { id: 'rewards', icon: 'rewards', title: 'Награды', text: 'На что потратить счастье всей жизни. Щелчок по награде: купить.' },
    { id: 'needs', icon: 'needs', title: 'Потребности', text: 'Голод, сон, чистота и остальное. Щелчок по шкале: сим займётся этим.' }
  ];
  const SPEEDS = [
    { icon: 'pause', title: 'Пауза', keys: 'Пробел или P' },
    { icon: 'play', title: 'Обычная скорость', keys: 'Клавиша 1' },
    { icon: 'fast', title: 'Быстрая скорость', keys: 'Клавиша 2' },
    { icon: 'faster', title: 'Очень быстрая скорость', keys: 'Клавиша 3' },
    { icon: 'skip', title: 'До конца действия', text: 'Время летит, пока сим занят, потом скорость возвращается.', keys: 'Клавиша 4' }
  ];
  const DIAL_PARTS = {
    home: { icon: 'home', title: 'К симу', text: 'Камера идёт за выбранным симом.', keys: 'Home' },
    up: { icon: 'plus', title: 'Приблизить', keys: 'Z или колесо' },
    down: { icon: 'minus', title: 'Отдалить', keys: 'X или колесо' },
    left: { icon: 'rotL', title: 'Повернуть влево', keys: '<' },
    right: { icon: 'rotR', title: 'Повернуть вправо', keys: '>' }
  };
  const WALL_ICONS = { up: 'wallUp', cut: 'wallCut', down: 'wallDown' };
  const MENU = [
    { id: 'save', name: 'Сохранить' },
    { id: 'load', name: 'Загрузить' },
    { id: 'town', name: 'Правка города', later: 'этап 28' },
    { id: 'options', name: 'Настройки', later: 'этап 44' },
    { id: 'exit', name: 'Выйти' }
  ];
  const MENU_W = 170, MENU_ROW = 24;
  const MOOD_X = 336, MOOD_W = 16, MOOD_H = 104, MOOD_INNER = 98, MOOD_TICKS = [0, 50, 140];
  const WELL_X = 355, WELL_W = 78, WELL_H = 100, TILE = 22, TILE_STEP_X = 25, TILE_STEP_Y = 32, TILE_COLS = 3, TILE_ROWS = 3;
  const GOOD_LINE = '#1f6a1f', BAD_LINE = '#9a2018';
  const SIMOLOGY = {
    tree: { title: 'Родовое дерево', text: 'Родители, дети, супруги и все, кто был до них.', later: 'Заработает на этапе 17.' },
    age: { title: 'Возраст', text: 'Сколько осталось до следующего дня рождения.', later: 'Дни рождения появятся на этапе 17.' },
    favorite: { title: 'Любимое', text: 'Любимая еда, музыка и цвет. Выбираются при создании сима.', later: 'Заработает на этапе 21.' },
    journal: { title: 'Журнал', text: 'Навыки, рекорды, прочитанные книги и пойманная рыба.', later: 'Заработает на этапе 13.' }
  };
  const TRAIT_ROWS = 5, TRAIT_ROW_H = 18;
  const OFFER_X = 140, OFFER_STEP = 34, OFFER_SIZE = 30, WELL = 45, REWARD_COLS = 8, REWARD_W = 38, REWARD_H = 20, REWARD_STEP_Y = 21, CONFIRM_MS = 4000;
  const DREAM_W = 460, DREAM_ROW = 46;
  const RH_X = 150, RH_W = 286, RH_BODY = 52, RH_ROW = 26, RH_GAP = 2, RH_ABOVE = 76, TONE_W = 28, TONE_STEP = 30, EXIT_W = 62, RH_TEXT = 224;
  const JOB_BAR_X = 120, JOB_BAR_W = 150, GRADE_BAR_W = 100, CHIP_W = 52, JOB_BUTTONS = [['ask', 14, 110], ['quit', 128, 88], ['branch', 220, 110]], JOB_VIEWS = ['Работа', 'Вторая', 'Школа'];
  const REQ_OK = '#8fe08a', REQ_MISS = '#ffb39a';
  const OPP_ROWS = 3, OPP_ROW_H = 30, OPP_TOP = 22, CARD_W = 440, CARD_H = 290, BAG_VIEWS = ['Сим', 'Семья'];
  const OPP_ICONS = { career: 'job', skill: 'skills', special: 'chance' };
  const SKILL_CELLS = 6, BAG_ROW = 8, BAG_CELLS = 16, BAG_STEP = 39;
  const REL_ROWS = 3, REL_ROW_H = 28, REL_TOP = 26, REL_FILTERS = [
    { id: 'all', name: 'Все', text: 'Все, с кем сим знаком, и вся семья.' },
    { id: 'family', name: 'Семья', text: 'Родные и супруги.' },
    { id: 'friends', name: 'Друзья', text: 'Друзья, хорошие, лучшие и старые, кроме родни.' },
    { id: 'love', name: 'Любовь', text: 'Романтика, пары, помолвки, браки.' },
    { id: 'foes', name: 'Враги', text: 'Неприязнь и враги.' }
  ];
  const FRIEND_STATUS = new Set(['friend', 'goodFriend', 'best', 'oldFriend']), LOVE_STATUS = new Set(['romance', 'couple', 'engaged', 'spouse']), FOE_STATUS = new Set(['dislike', 'enemy', 'oldEnemy']);
  const REL_GOOD = '#5fc85a', REL_BAD = '#d8483a';
  const WISH_TIPS = {
    act: key => (S.ADS[key].person ? 'Щелчок по человеку: «' + S.ADS[key].name + '».' : 'Щелчок по предмету: «' + S.ADS[key].name + '».'),
    go: key => (key === 'jog' ? 'Сим побежит сам, если черта зовёт, или щелчок по земле подальше: «Бежать сюда».' : 'Сим выйдет сам или щелчок по земле подальше от дома.'),
    mood: key => 'Нужен мудлет «' + S.MOODLETS[key].name + '».',
    place: key => 'Карта (M): найдите это место и щёлкните туда.',
    placesDistinct: () => 'Карта (M): парк, пляж, магазин, школа.',
    stranger: () => 'Щёлкните по горожанину на улице и поболтайте.',
    learn: () => '«Поболтать» и «Спросить о характере» открывают черты собеседника.',
    soc: key => 'Щелчок по человеку: «' + S.Social.SOCIALS[key].name + '».',
    skill: key => SKILL_TIPS[key] || 'Занимайтесь, и уровень придёт.',
    stat: key => STAT_TIPS[key] || 'Журнал (J) покажет, сколько уже сделано.',
    count: key => COUNT_TIPS[key] || jobTip(key) || 'Общайтесь с людьми.',
    career: () => 'Полная шкала производительности и нужные навыки дают повышение, всё видно во вкладке «Работа».',
    grade: () => 'Уроки каждый день и хорошее настроение в школе.',
    friends: () => 'Дружба растёт от приятных разговоров, вкладка «Отношения» покажет друзей.',
    walked: () => 'Засчитывается каждый шаг пешком, особенно по городу.',
    drove: () => 'Щелчок по дальнему месту, затем «Ехать сюда».',
    moodAt: () => 'Хорошие мудлеты поднимают настроение.',
    reward: () => 'Вкладка «Награды» на панели.'
  };

  const SKILL_TIPS = {
    cooking: 'Плита: «Приготовить…» или книга «Кухня без страха» на полке.',
    athletic: 'Груша, зарядка под телевизор, пробежка или книга «Утренняя зарядка».',
    logic: 'Шахматы или книга «Задачи для ума».',
    charisma: 'Разговоры, звонки, репетиция у зеркала в ванной или книга «Искусство беседы».'
  };
  const STAT_TIPS = {
    jogTiles: 'Пробежка: щелчок по земле подальше, «Бежать сюда», или сим побежит сам.',
    recipesKnown: 'Новые рецепты открываются с уровнем готовки.',
    books: 'Книжная полка: книги по каждому навыку.'
  };
  const COUNT_TIPS = {
    friend: 'Болтайте с одним человеком, пока отношения не дойдут до дружбы.',
    best: 'Хорошему другу предложите лучшую дружбу (раздел «Дружеское»).',
    reconcile: 'Тому, с кем поссорились: «Помириться».',
    peace: 'Врагу: «Помириться». Шанс невелик, пробуйте снова.',
    invites: 'Телефон (щелчок по своему симу) или «Позвать к себе в гости».',
    parties: 'Щелчок по своему симу: «Устроить вечеринку».',
    greatParty: 'Вечеринка с музыкой, едой и разговорами получает высокую оценку.',
    calls: 'Щелчок по своему симу: «Позвонить…».',
    dates: 'Тому, кто нравится: «Пригласить на свидание».',
    spouse: 'Сначала помолвка, потом «Пожениться сразу» или «Назначить свадьбу».',
    met: 'Щёлкните по незнакомцу: «Представиться».',
    rebuff: 'Когда кто-то флиртует без взаимности, это засчитается.',
    fineDish: 'Чем выше готовка, тем лучше блюдо.',
    newDish: 'Плита: «Приготовить…», выберите блюдо, которого ещё не готовили.',
    weirdDish: 'Неопытный повар легко сделает странное блюдо.',
    vegRecipe: 'Овощные рецепты открываются с уровнем готовки.',
    chessWins: 'Шахматы: чем выше логика, тем чаще победа.',
    book_athletic: 'Книжная полка: «Утренняя зарядка».',
    book_charisma: 'Книжная полка: «Искусство беседы».',
    book_cooking: 'Книжная полка: «Кухня без страха».',
    book_logic: 'Книжная полка: «Задачи для ума».'
  };

  const JOB_TIPS = [
    ['job_', 'Компьютер дома: «Найти работу…», или щелчок по зданию в городе: «Устроиться…».'],
    ['pay_', 'Зарплата приходит в конце смены.'],
    ['up_', 'Полная шкала производительности и нужные навыки, вкладка «Работа».'],
    ['promotion', 'Полная шкала производительности и нужные навыки, вкладка «Работа».'],
    ['homework', 'Стол: «Сделать уроки». Вдвоём быстрее.'],
    ['onTime', 'Школьный автобус приходит сам, поездку лучше не отменять.'],
    ['jobChange', 'Новая работа: компьютер дома или двери здания в городе.'],
    ['bossLiked', 'На работе тон «Говорить с начальником» или «Подлизываться к начальству».'],
    ['weekendWork', 'В выходной: компьютер, «Поработать на дом».'],
    ['partJob', 'Компьютер дома или двери книжной лавки, магазина, спа или склепа.']
  ];
  const jobTip = key => (JOB_TIPS.find(([prefix]) => key.startsWith(prefix)) || [null, ''])[1];

  const signed = n => (n > 0 ? '+' : n < 0 ? '−' : '') + Math.abs(Math.round(n));

  const groups = n => String(n).replace(/\B(?=(\d{3})+(?!\d))/g, ' ');
  const moneyText = n => '§' + groups(n);

  class LiveView {
    constructor(ui, canvas) {
      this.ui = ui;
      this.layer = new Kit.Layer(canvas);
      this.tab = 0;
      this.relFilter = 'all';
      this.relSort = 'status';
      this.relScroll = 0;
      this.open = true;
      this.menu = false;
      this.lastFace = null;
      this.lastFaceAt = 0;
      this.bagPage = 0;
      this.jobView = 0;
      this.leaving = 0;
      this.quitting = 0;
      this.dropping = null;
      this.cardOpen = false;
      this.bagView = 0;
    }

    get sim() {
      return this.ui.selected;
    }

    family() {
      return this.ui.scene.sims.filter(s => !s.free);
    }

    button(x, y, w, h, o) {
      const item = Object.assign({ x, y, w, h }, o);
      if (!item.draw) {
        item.draw = (g, state) => {
          const look = Kit.stateName(state, item.on && item.on(), item.enabled ? item.enabled() : true), name = item.iconOf ? item.iconOf() : item.icon;
          if (item.round) Kit.bubble(g, x + w / 2, y + h / 2, w, look);
          else Kit.plate(g, x, y, w, h, look, item.radius);
          const shift = look === 'down' ? 1 : 0;
          if (name) Icons.centered(g, name, x + w / 2 + shift, y + h / 2 + shift, look === 'off' ? 'gray' : item.tone || 'white');
        };
      }
      return item;
    }

    layout(v) {
      const Y = v.sh - PANEL_H, items = [], ui = this.ui, push = item => items.push(item);
      this.top = Y;
      const solid = (x, y, w, h) => push({ x, y, w, h });
      solid(2, Y, 454, PANEL_H);
      push({ x: 456, y: Y - TAB_H, w: 340, h: TAB_H, when: () => this.open });
      solid(240, Y - 34, 96, 34);
      const dialX = 61, dialY = Y + 44;
      push({
        x: dialX - DIAL_R, y: dialY - DIAL_R, w: DIAL_R * 2, h: DIAL_R * 2, round: true,
        parts: (px, py) => {
          const dx = px - dialX, dy = py - dialY;
          if (Math.hypot(dx, dy) < 10) return 'home';
          if (Math.abs(dx) > Math.abs(dy)) return dx > 0 ? 'right' : 'left';
          return dy > 0 ? 'down' : 'up';
        },
        click: (button, part) => {
          if (button !== 0) return;
          if (part === 'home') ui.goHome();
          else if (part === 'up') ui.zoomStep(-1);
          else if (part === 'down') ui.zoomStep(1);
          else if (part === 'left') ui.turn(-1);
          else if (part === 'right') ui.turn(1);
        },
        tip: part => DIAL_PARTS[part],
        draw: (g, state) => {
          Kit.bubble(g, dialX, dialY, DIAL_R * 2, 'normal');
          Kit.bubble(g, dialX, dialY, 38, 'down');
          for (const [part, dx, dy] of [['up', 0, -22], ['down', 0, 22], ['left', -22, 0], ['right', 22, 0]]) {
            Icons.centered(g, DIAL_PARTS[part].icon, dialX + dx, dialY + dy, state.part === part ? 'gold' : 'white');
          }
          Kit.bubble(g, dialX, dialY, 20, state.part === 'home' ? 'hover' : 'normal');
          Icons.centered(g, 'home', dialX, dialY, 'white');
        }
      });
      push(this.button(5, Y + 5, SMALL, SMALL, {
        round: true, icon: 'map', tip: () => ({ title: 'Карта города', text: 'Найти место или человека и пойти туда.', keys: 'M' }),
        click: b => b === 0 && ui.map.toggle()
      }));
      push(this.button(5, Y + 33, SMALL, SMALL, {
        round: true, icon: 'photo', tip: () => ({ title: 'Снимок', text: 'Кадр мира для семейного альбома.', later: 'Заработает на этапе 44.' })
      }));
      push(this.button(5, Y + 90, SMALL, SMALL, {
        round: true, icon: 'dots', on: () => this.menu, tip: () => ({ title: 'Меню', text: 'Сохранить, загрузить, выйти.', keys: 'Esc' }),
        click: b => b === 0 && this.toggleMenu()
      }));
      const hasHouse = () => !!ui.viewState;
      push(this.button(94, Y + 5, SMALL, SMALL, {
        round: true, icon: 'floorUp', enabled: hasHouse, key: hasHouse, tip: () => ({ title: 'Этаж выше', keys: 'PgUp' }),
        click: b => b === 0 && hasHouse() && ui.setFloor(Math.min(ui.floor + 1, S.METRICS.floors - 1))
      }));
      push(this.button(94, Y + 33, SMALL, SMALL, {
        round: true, iconOf: () => WALL_ICONS[ui.wallMode], enabled: hasHouse, key: () => ui.wallMode + hasHouse(), tip: () => ({ title: 'Стены: ' + S.WALL_NAMES[ui.wallMode], text: 'Щелчок меняет вид стен.', keys: 'Q' }),
        click: b => b === 0 && hasHouse() && ui.setWallMode(S.WALL_MODES[(S.WALL_MODES.indexOf(ui.wallMode) + 1) % S.WALL_MODES.length])
      }));
      push(this.button(94, Y + 61, SMALL, SMALL, {
        round: true, icon: 'floorDown', enabled: hasHouse, key: hasHouse, tip: () => ({ title: 'Этаж ниже', keys: 'PgDn' }),
        click: b => b === 0 && hasHouse() && ui.setFloor(Math.max(ui.floor - 1, 0))
      }));
      push({
        x: 30, y: Y + 92, w: 86, h: 19, key: () => this.funds() + ':' + this.dueKey(),
        tip: () => ({ title: 'Деньги семьи', text: 'Симолеоны на счету семьи. Приходят с зарплатой, пенсией, от картин, улова, урожая, находок, книг и чаевых. Уходят на счета, продукты и службы.', line: this.ui.game && S.Services.due(this.ui.game.world) ? 'Счета к оплате: §' + groups(S.Services.due(this.ui.game.world)) : '', lineColor: BAD_LINE, keys: 'Щелчок: карточка дома' }),
        click: b => { if (b === 0) this.openCard(); },
        draw: g => {
          const due = this.ui.game ? S.Services.due(this.ui.game.world) : 0;
          Kit.glass(g, 30, Y + 92, 86, 19, due ? 'pale' : 'white', 9);
          const text = moneyText(this.funds());
          Font.draw(g, 'bold', text, 73 - Font.measure('bold', text) / 2, Y + 94, due ? BAD_LINE : INK);
        }
      });
      MODES.forEach((mode, i) => {
        push(this.button(123, Y + 6 + i * 35, 34, 33, {
          icon: mode.icon, radius: 7, on: () => mode.id === 'live',
          tip: () => mode
        }));
      });
      const hopes = [[167, 10], [214, 10], [167, 58], [214, 58]];
      hopes.forEach(([dx, dy], i) => push({
        x: dx, y: Y + dy, w: WELL, h: WELL, key: () => this.promisedKey(i),
        tip: () => this.promisedTip(i),
        click: b => this.promisedClick(i, b),
        draw: (g, state) => this.drawPromised(g, dx, Y + dy, i, state.hover)
      }));
      for (let i = 0; i < S.Wishes.OFFER_SLOTS; i++) {
        const ox = OFFER_X + i * OFFER_STEP, oy = Y - OFFER_SIZE - 10;
        push({
          x: ox, y: oy, w: OFFER_SIZE, h: OFFER_SIZE, round: true, when: () => !!this.offered(i), key: () => this.offeredKey(i),
          tip: () => this.offeredTip(i),
          click: b => this.offeredClick(i, b),
          draw: (g, state) => this.drawOffered(g, ox, oy, i, state)
        });
      }
      push({
        x: 262, y: Y - 28, w: BIG_FACE, h: BIG_FACE - 2, key: () => this.sim.id + !!ui.render + ':' + (this.sim.face || 0),
        tip: () => ({ title: this.sim.name, text: AGE_NAMES[this.sim.age], keys: 'Щелчок: Симология' }),
        click: b => { if (b === 0) this.openTab(0); },
        draw: g => this.drawFace(g, this.sim, 262, Y - 28, BIG_FACE, BIG_FACE - 2)
      });
      push({
        x: 266, y: Y + 42, w: 60, h: 28, key: () => (this.sim.dream ? this.sim.dream.id : '-') + this.sim.id,
        tip: () => this.dreamTip(),
        click: b => { if (b === 0) this.openDream(); },
        draw: (g, state) => {
          Kit.glass(g, 266, Y + 42, 60, 28, 'well', 5);
          Icons.centered(g, 'star', 296, Y + 56, this.sim.dream ? 'gold' : state.hover ? 'white' : 'gray');
        }
      });
      push({
        x: 262, y: Y + 71, w: 68, h: 18, key: () => S.dateText(ui.game.world.day, ui.game.world.clock),
        tip: () => ({ title: S.dayName(ui.game.world.day) + ', ' + S.timeText(ui.game.world.clock), text: 'Неделя ' + S.weekOf(ui.game.world.day) + ', день ' + ui.game.world.day + ' от начала города.' }),
        draw: g => {
          const w = ui.game.world, text = S.DAY_SHORT[(w.day - 1) % 7] + ' ' + S.timeText(w.clock);
          Kit.glass(g, 262, Y + 71, 68, 18, 'white', 8);
          Font.draw(g, 'smallb', text, 296 - Font.measure('smallb', text) / 2, Y + 73, INK);
        }
      });
      SPEEDS.forEach((speed, i) => {
        const x = 262 + i * 14;
        push(this.button(x, Y + 91, 14, 17, {
          key: () => ui.game.speed, radius: 3, icon: speed.icon,
          draw: (g, state) => {
            const on = ui.game.speed === i, look = on ? (i === 0 ? 'red' : 'on') : state.down ? 'down' : state.hover ? 'hover' : 'normal';
            Kit.plate(g, x, Y + 91, 14, 17, look, 3);
            Icons.centered(g, speed.icon, x + 7, Y + 99.5, 'white');
          },
          tip: () => speed,
          click: b => {
            if (b !== 0) return;
            if (i === 0) ui.game.togglePause();
            else ui.game.setSpeed(i);
          }
        }));
      });
      push({
        x: MOOD_X, y: Y + 6, w: MOOD_W, h: MOOD_H, key: () => this.sim.id + ':' + Math.round(S.Moods.mood(this.sim)),
        tip: () => this.moodTip(),
        draw: g => this.drawMood(g, MOOD_X, Y + 6)
      });
      push({
        x: WELL_X, y: Y + 8, w: WELL_W, h: WELL_H, key: () => this.moodletsKey(),
        parts: (px, py) => this.tileAt(px, py, Y + 8),
        tip: part => this.moodletTip(part),
        click: (b, part) => { if (b === 0) this.cureMoodlet(part); },
        draw: (g, state) => this.drawMoodlets(g, WELL_X, Y + 8, state.part)
      });
      const ry = Y - RH_ABOVE - RH_ROW - RH_GAP - RH_BODY;
      push({
        x: RH_X, y: ry, w: RH_W, h: RH_BODY, when: () => !!this.rabbit(), key: () => this.rabbitKey(),
        tip: () => this.rabbitTip(),
        draw: g => this.drawRabbit(g, RH_X, ry)
      });
      push({
        x: RH_X, y: ry + RH_BODY + RH_GAP, w: RH_W, h: RH_ROW, when: () => !!this.rabbit(), key: () => this.rabbitRowKey(),
        parts: px => this.rabbitPart(px),
        tip: part => this.rabbitPartTip(part),
        click: (b, part, px, py, now) => { if (b === 0) this.rabbitClick(part, now); },
        draw: (g, state) => this.drawRabbitRow(g, RH_X, ry + RH_BODY + RH_GAP, state.part)
      });
      push(this.button(438, Y + 46, 18, 18, {
        round: true, key: () => this.open, iconOf: () => (this.open ? 'left' : 'right'), tip: () => ({ title: this.open ? 'Свернуть панель' : 'Открыть панель' }),
        click: b => { if (b === 0) this.setOpen(!this.open); }
      }));
      TABS.forEach((tab, i) => {
        const x = 459 + i * TAB_W, y = Y - TAB_H;
        push({
          x, y, w: TAB_W - 1, h: TAB_H, when: () => this.open, key: () => this.open + ':' + this.tab,
          tip: () => tab,
          click: b => { if (b === 0) this.openTab(i); },
          draw: (g, state) => {
            if (!this.open) return;
            const on = this.tab === i, look = on ? 'on' : state.down ? 'down' : state.hover ? 'hover' : 'normal';
            Kit.plate(g, x, y, TAB_W - 1, TAB_H, look, 5);
            Icons.centered(g, tab.icon, x + (TAB_W - 1) / 2, y + TAB_H / 2, 'white');
          }
        });
      });
      push({
        x: 456, y: Y, w: 340, h: PANEL_H, when: () => this.open,
        key: () => this.open + ':' + this.tab + ':' + this.sim.id + ':' + (this.tab === 0 ? this.doing() : TABS[this.tab].id === 'needs' ? this.needsKey() : TABS[this.tab].id === 'rewards' ? Math.floor((this.sim.happy || 0) / 10) + (this.sim.rewards || []).join() : TABS[this.tab].id === 'relations' ? this.relationsKey() : TABS[this.tab].id === 'inventory' ? this.bagKey() : TABS[this.tab].id === 'skills' ? this.skillCells().map(id => id + S.Skills.level(this.sim, id) + ':' + Math.floor(this.sim.skill.xp[id] / 10)).join() : TABS[this.tab].id === 'job' ? this.jobKey() : TABS[this.tab].id === 'chance' ? this.oppKey() : ''),
        draw: g => {
          if (this.open) this.drawTab(g, 456, Y);
        }
      });
      S.NEED_ORDER.forEach((need, i) => {
        const nx = 456 + 14 + (i % 2) * 160, ny = Y + 10 + Math.floor(i / 2) * 33;
        push({
          x: nx, y: ny, w: 148, h: 28, when: () => this.open && TABS[this.tab].id === 'needs',
          tip: () => ({ title: S.NEED_NAMES[need] + ': ' + Math.round(this.sim.needs ? this.sim.needs[need] : 0) + ' из 100', keys: 'Щелчок: заняться этим' }),
          click: b => {
            if (b === 0 && this.sim.needs && !S.Acts.forNeed(ui.game.world, this.sim, need)) ui.toast(this.sim.name + ': негде или очередь полна', true);
          }
        });
      });
      const family = this.family();
      family.forEach((sim, i) => {
        const x = 6, y = Y - 8 - (family.length - i) * (FACE_H + 3);
        push({
          x, y, w: FACE_W, h: FACE_H, key: () => (sim === this.sim) + ':' + !!ui.render + ':' + (sim.face || 0) + ':' + Math.round(S.Moods.mood(sim) / 10),
          tip: () => ({ title: sim.name, text: sim.act ? S.Acts.label(sim.act, sim, ui.game.world) : S.Sim.STATE_NAMES[sim.state], keys: 'Щелчок: выбрать, два раза: камера к симу' }),
          click: (b, part, px, py, now) => {
            if (b !== 0) return;
            const twice = this.lastFace === sim && now - this.lastFaceAt < DOUBLE_CLICK;
            this.lastFace = sim;
            this.lastFaceAt = now;
            ui.selectSim(sim);
            if (twice) ui.goHome();
          },
          draw: (g, state) => {
            const chosen = sim === this.sim;
            Kit.glass(g, x, y, FACE_W, FACE_H, chosen ? 'pale' : state.hover ? 'slate' : 'deep', 5);
            g.fillStyle = chosen ? '#7fce6f' : '#5e9e62';
            g.fillRect(x + 3, y + 3, FACE_W - 6, FACE_H - 6);
            this.drawFace(g, sim, x + 3, y + 3, FACE_W - 6, FACE_H - 6);
            if (sim.moods) {
              const mood = S.Moods.mood(sim);
              Kit.bar(g, x + 3, y + FACE_H - 8, FACE_W - 6, 5, (mood - S.Moods.MIN) / (S.Moods.MAX - S.Moods.MIN), this.moodColor(mood));
            }
          }
        });
      });
      for (let i = 0; i < S.Acts.QUEUE_LIMIT; i++) {
        const x = 6 + i * 44;
        push({
          x, y: 6, w: 40, h: 40, when: () => !!S.Acts.list(this.sim)[i],
          key: () => {
            const act = S.Acts.list(this.sim)[i];
            return act ? S.Acts.label(act, this.sim, ui.game.world) + S.Acts.icon(act, this.sim) + (i === 0 ? ':' + this.progress(act) : '') : '';
          },
          tip: () => {
            const act = S.Acts.list(this.sim)[i];
            return act ? { title: S.Acts.label(act, this.sim, ui.game.world), text: act.auto ? 'Сим решил сам.' : i === 0 ? 'Сим делает это сейчас.' : 'Ждёт своей очереди.', keys: 'Щелчок: отменить' } : null;
          },
          click: b => { if (b === 0) S.Acts.cancel(ui.game.world, this.sim, i); },
          draw: (g, state) => {
            const act = S.Acts.list(this.sim)[i];
            if (!act) return;
            Kit.glass(g, x, 6, 40, 40, act.auto ? 'slate' : i === 0 ? 'white' : 'pale', 6);
            Icons.centered(g, S.Acts.icon(act, this.sim), x + 20, 26, act.auto ? 'white' : 'blue');
            Icons.centered(g, 'close', x + 32, 14, state.hover ? 'red' : 'gray');
            if (i === 0) Kit.bar(g, x + 4, 38, 32, 4, this.progress(act) / 8, MOOD);
          }
        });
      }
      const simology = () => this.open && TABS[this.tab].id === 'simology';
      for (const [part, sx, sy, sw, sh] of [['tree', 600, Y + 5, 22, 22], ['age', 470, Y + 40, 120, 9], ['favorite', 470, Y + 82, 86, 26], ['journal', 600, Y + 86, 22, 22]]) {
        push({ x: sx, y: sy, w: sw, h: sh, when: simology, tip: () => SIMOLOGY[part] });
      }
      for (let i = 0; i < TRAIT_ROWS; i++) {
        push({ x: 638, y: Y + 24 + i * TRAIT_ROW_H, w: 152, h: TRAIT_ROW_H, when: simology, tip: () => this.traitTip(i) });
      }
      const bagOpen = () => this.open && TABS[this.tab].id === 'inventory';
      push({ x: 456 + 336 - 2 * (CHIP_W + 2) - 50, y: Y + 4, w: 2 * (CHIP_W + 2), h: 15, when: () => bagOpen() && !!this.sim.bag, parts: px => { const i = Math.floor((px - (456 + 336 - 2 * (CHIP_W + 2) - 50)) / (CHIP_W + 2)); return i >= 0 && i < 2 ? i : null; }, tip: part => (part === null ? null : { title: BAG_VIEWS[part], text: part ? 'Общий запас семьи, до ' + S.Econ.FAMILY_BAG + ' вещей. Щелчок по вещи: взять себе.' : 'Вещи, которые сим носит с собой.' }), click: (b, part) => { if (b === 0 && part !== null) { this.bagView = part; this.bagPage = 0; } } });
      const oppsOpen = () => this.open && TABS[this.tab].id === 'chance';
      for (let i = 0; i < OPP_ROWS; i++) {
        const ry = Y + OPP_TOP + i * OPP_ROW_H, row = () => this.oppRows()[i];
        push({ x: 466, y: ry, w: 252, h: OPP_ROW_H - 2, when: () => oppsOpen() && !!row(), tip: () => this.oppTip(row()) });
        push({ x: 724, y: ry + 4, w: 20, h: 20, when: () => oppsOpen() && !!row(), tip: () => ({ icon: 'pin', title: 'Где это', text: 'Камера и метка на карте.' }), click: b => { if (b === 0) this.oppWhere(row()); } });
        push({ x: 748, y: ry + 4, w: 20, h: 20, when: () => oppsOpen() && !!row(), tip: () => ({ icon: 'close', title: 'Отказаться', keys: this.dropping === row() ? 'Щелчок ещё раз: отказаться' : 'Щелчок, потом ещё один для подтверждения' }), click: (b, part, px, py, now) => { if (b === 0) this.oppDrop(row(), now); } });
      }
      for (let i = 0; i < BAG_CELLS; i++) {
        push({ x: 470 + (i % BAG_ROW) * BAG_STEP, y: Y + 28 + Math.floor(i / BAG_ROW) * 38, w: 34, h: 34, when: () => bagOpen() && !!this.bagStack(i), tip: () => this.bagTip(i), click: b => { if (b === 0) this.bagClick(i, Y); } });
      }
      push({ x: 742, y: Y + 6, w: 18, h: 18, when: () => bagOpen() && this.bagPages() > 1, tip: () => ({ title: 'Назад', text: 'Предыдущая страница инвентаря.' }), click: b => { if (b === 0) this.bagPage = Math.max(0, this.bagPage - 1); } });
      push({ x: 764, y: Y + 6, w: 18, h: 18, when: () => bagOpen() && this.bagPages() > 1, tip: () => ({ title: 'Дальше', text: 'Следующая страница инвентаря.' }), click: b => { if (b === 0) this.bagPage = Math.min(this.bagPages() - 1, this.bagPage + 1); } });
      const skillsOpen = () => this.open && TABS[this.tab].id === 'skills';
      push({ x: 692, y: Y + 5, w: 90, h: 18, when: skillsOpen, tip: () => ({ icon: 'book', title: 'Журнал', text: 'Статистика навыков, вызовы и что откроется дальше.', keys: 'J' }), click: b => { if (b === 0) ui.journal.toggle(); } });
      for (let i = 0; i < SKILL_CELLS; i++) {
        push({ x: 470 + (i % 2) * 160, y: Y + 28 + Math.floor(i / 2) * 27, w: 150, h: 25, when: () => skillsOpen() && !!this.skillCells()[i], tip: () => this.skillTip(i), click: b => { if (b === 0) { ui.journal.toggle(); ui.journal.skill = this.skillCells()[i] || ui.journal.skill; } } });
      }
      const jobOpen = () => this.open && TABS[this.tab].id === 'job' && !!this.jobState();
      push({ x: 456 + 336 - 3 * (CHIP_W + 2), y: Y + 4, w: 3 * (CHIP_W + 2), h: 15, when: () => jobOpen() && this.jobStates().length > 1, parts: px => this.chipAt(px), tip: part => this.chipTip(part), click: (b, part) => { if (b === 0 && part !== null) this.jobView = part; } });
      push({ x: 456 + JOB_BAR_X - 106, y: Y + 48, w: JOB_BAR_W + 140, h: 14, when: jobOpen, tip: () => this.barTip() });
      push({ x: 470, y: Y + 64, w: 316, h: 14, when: jobOpen, parts: px => this.reqAt(px), tip: part => this.reqTip(part), click: (b, part) => { if (b === 0) this.reqClick(part); } });
      push({ x: 470, y: Y + 80, w: 316, h: 14, when: jobOpen, parts: px => this.peopleAt(px), tip: part => this.peopleTip(part), click: (b, part) => { if (b === 0 && part === 'mates') this.openTab(TABS.findIndex(tab => tab.id === 'relations')); } });
      push({ x: 456, y: Y + 96, w: 340, h: 18, when: jobOpen, parts: px => this.buttonAt(px), tip: part => this.buttonTip(part), click: (b, part, px, py, now) => { if (b === 0) this.buttonClick(part, now); } });
      const relations = () => this.open && TABS[this.tab].id === 'relations';
      REL_FILTERS.forEach((f, i) => {
        push({
          x: 466 + i * 46, y: Y + 5, w: 44, h: 17, when: relations, tip: () => ({ title: f.name, text: f.text }),
          click: b => {
            if (b !== 0) return;
            this.relFilter = f.id;
            this.relScroll = 0;
          }
        });
      });
      push({
        x: 702, y: Y + 5, w: 76, h: 17, when: relations, tip: () => ({ title: 'Порядок', text: this.relSort === 'status' ? 'Сейчас по статусу: семья, любовь, друзья.' : 'Сейчас по имени.', keys: 'Щелчок: сменить' }),
        click: b => { if (b === 0) this.relSort = this.relSort === 'status' ? 'name' : 'status'; }
      });
      for (const [dir, ay] of [[-1, Y + REL_TOP], [1, Y + REL_TOP + REL_ROWS * REL_ROW_H - 16]]) {
        push({
          x: 776, y: ay, w: 16, h: 16, when: relations, tip: () => ({ title: dir < 0 ? 'Выше' : 'Ниже', keys: 'Колесо мыши тоже листает' }),
          click: b => { if (b === 0) this.scrollRelations(dir); }
        });
      }
      for (let i = 0; i < REL_ROWS; i++) {
        const ry = Y + REL_TOP + i * REL_ROW_H, row = () => this.relRows()[this.relScroll + i];
        push({ x: 466, y: ry, w: 260, h: REL_ROW_H - 2, when: () => relations() && !!row(), tip: () => this.relTip(row()), click: b => { if (b === 0 && row() && ui.game.world.family.includes(row().other)) ui.selectSim(row().other); } });
        push({ x: 728, y: ry + 3, w: 20, h: 20, when: () => relations() && !!row(), tip: () => this.callTip(row()), click: b => { if (b === 0) this.callRow(row()); } });
        push({ x: 752, y: ry + 3, w: 20, h: 20, when: () => relations() && !!row(), tip: () => ({ icon: 'pin', title: 'Показать на карте', text: row() ? row().other.name : '' }), click: b => { if (b === 0) this.markRow(row()); } });
      }
      push({
        x: 470, y: Y + 4, w: REWARD_COLS * REWARD_W, h: 110, when: () => this.open && TABS[this.tab].id === 'rewards',
        parts: (px, py) => this.rewardAt(px, py), tip: part => this.rewardTip(part),
        click: (b, part, px, py, now) => { if (b === 0) this.rewardClick(part, now); }
      });
      push({
        x: v.sw - 56, y: 12, w: 44, h: 44, when: () => !ui.game.speed,
        tip: () => ({ title: 'Пауза', text: 'Щелчок или пробел: время пойдёт дальше.' }),
        click: b => { if (b === 0) ui.game.togglePause(); }
      });
      this.layer.set(items, g => this.paintBase(g, Y));
    }

    paintBase(g, Y) {
      Kit.glass(g, 2, Y + 2, 454, PANEL_H - 4, 'deep', 12);
      Kit.glass(g, 2, Y, 118, PANEL_H - 2, 'pale', 16);
      Kit.glass(g, 162, Y + 3, 172, PANEL_H - 7, 'pale', 10);
      Kit.glass(g, 334, Y + 3, 102, PANEL_H - 7, 'pale', 10);
      Kit.glass(g, 456, Y, 340, PANEL_H - 2, 'slate', 10);
    }

    setOpen(open) {
      this.open = open;
      this.layer.full = true;
      this.layer.seen.clear();
      const g = this.layer.base.getContext('2d');
      g.clearRect(0, 0, this.layer.base.width, this.layer.base.height);
      this.paintBase(g, this.top);
      if (!open) g.clearRect(456, this.top - TAB_H, 340, PANEL_H + TAB_H);
    }

    openTab(i) {
      this.tab = i;
      if (!this.open) this.setOpen(true);
    }

    moodColor(mood) {
      return mood >= 0 ? MOOD : mood >= -50 ? NEED_LOW : NEED_BAD;
    }

    drawMood(g, x, y) {
      Kit.glass(g, x, y, MOOD_W, MOOD_H, 'wellDark', 7);
      const sim = this.sim, bottom = y + 3 + MOOD_INNER, span = S.Moods.MAX - S.Moods.MIN, at = v => bottom - Math.round((v - S.Moods.MIN) / span * MOOD_INNER);
      if (sim.moods) {
        const mood = S.Moods.mood(sim), top = at(mood);
        g.fillStyle = this.moodColor(mood);
        g.fillRect(x + 3, top, MOOD_W - 6, bottom - top);
        g.fillStyle = 'rgba(255, 255, 255, 0.4)';
        g.fillRect(x + 4, top, 2, bottom - top);
      }
      g.fillStyle = INK;
      for (const v of MOOD_TICKS) g.fillRect(x + 3, at(v), MOOD_W - 6, 1);
    }

    moodTip() {
      const sim = this.sim;
      if (!sim.moods) return { title: 'Настроение', text: 'Настроение видно только у своей семьи.' };
      const mood = S.Moods.mood(sim), list = S.Moods.list(sim), best = list.find(e => e.def.value > 0), worst = list.find(e => e.def.value < 0), parts = [];
      if (best) parts.push('Больше всего радует: ' + best.def.name + '.');
      if (worst) parts.push('Больше всего огорчает: ' + worst.def.name + '.');
      if (!parts.length) parts.push('Ничего особенного не происходит.');
      const rate = Math.round(S.Wishes.happyRate(mood));
      return {
        title: 'Настроение ' + S.Moods.word(mood) + ', ' + (signed(mood) || '0'), text: parts.join(' '),
        line: rate ? 'Счастье всей жизни: +' + rate + ' в час' : 'Счастье всей жизни копится от +50',
        later: 'Накоплено: ' + groups(Math.floor(sim.happy || 0)) + '.'
      };
    }

    offered(i) {
      return this.sim.wish ? this.sim.wish.offered[i] : null;
    }

    offeredKey(i) {
      const entry = this.offered(i);
      return entry ? this.sim.id + entry.id + Math.ceil(entry.left / 30) : '';
    }

    wishTip(entry, promised) {
      const sim = this.sim, wish = S.WISHES[entry.id], dream = S.Wishes.forDream(sim, wish), points = S.Wishes.pointsOf(sim, wish), goal = wish.goal;
      const done = promised ? S.Wishes.progress(sim, entry) : 0, need = S.Wishes.target(goal);
      return {
        icon: wish.icon, iconTone: dream ? 'gold' : 'blue', title: wish.name,
        text: wish.why + (dream ? ' Связано с мечтой всей жизни.' : ''),
        line: '+' + groups(points) + ' счастья' + (promised && need > 1 ? ', сделано ' + done + ' из ' + need : ''),
        keys: promised ? 'Правая кнопка: снять обещание.' : 'Левая кнопка: обещать. Правая: отказаться.',
        later: (WISH_TIPS[goal.kind] ? 'Совет: ' + WISH_TIPS[goal.kind](goal.key) : '') + (promised ? '' : ' Исчезнет через ' + S.Moods.timeText(entry.left) + '.')
      };
    }

    offeredTip(i) {
      const entry = this.offered(i);
      return entry ? this.wishTip(entry, false) : null;
    }

    offeredClick(i, b) {
      const sim = this.sim, world = this.ui.game.world;
      if (!this.offered(i)) return;
      if (b === 2) S.Wishes.dismiss(world, sim, i, false);
      else if (b === 0 && !S.Wishes.promise(world, sim, i)) this.ui.toast(sim.name + ': все четыре места для обещаний заняты', true);
    }

    drawOffered(g, x, y, i, state) {
      const entry = this.offered(i);
      if (!entry) return;
      const wish = S.WISHES[entry.id], dream = S.Wishes.forDream(this.sim, wish);
      Kit.bubble(g, x + OFFER_SIZE / 2, y + OFFER_SIZE / 2, OFFER_SIZE, state.down ? 'down' : state.hover ? 'hover' : 'on');
      Icons.centered(g, wish.icon, x + OFFER_SIZE / 2, y + OFFER_SIZE / 2, dream ? 'gold' : 'white');
      Kit.bar(g, x + 3, y + OFFER_SIZE + 1, OFFER_SIZE - 6, 4, entry.left / S.Wishes.OFFER_LIFE, MOOD);
    }

    promised(i) {
      return this.sim.wish ? this.sim.wish.promised[i] : null;
    }

    promisedKey(i) {
      const entry = this.promised(i);
      return entry ? this.sim.id + entry.id + S.Wishes.progress(this.sim, entry) : this.sim.id;
    }

    promisedTip(i) {
      const entry = this.promised(i);
      if (entry) return this.wishTip(entry, true);
      return { title: 'Место для обещания', text: this.sim.wish ? 'Щелчок по одному из желаний над панелью ставит его сюда. Исполненное обещание даёт счастье и хороший мудлет.' : 'Желания бывают только у своей семьи.' };
    }

    promisedClick(i, b) {
      if (b === 2 && this.promised(i)) S.Wishes.dismiss(this.ui.game.world, this.sim, i, true);
    }

    drawPromised(g, x, y, i, hover) {
      Kit.glass(g, x, y, WELL, WELL, 'well', 5);
      const entry = this.promised(i);
      if (!entry) return;
      const sim = this.sim, wish = S.WISHES[entry.id], dream = S.Wishes.forDream(sim, wish), need = S.Wishes.target(wish.goal);
      if (dream) {
        g.fillStyle = '#ffd84a';
        for (const [dx, dy, w, h] of [[20, 3, 5, 3], [20, 39, 5, 3], [3, 20, 3, 5], [39, 20, 3, 5]]) g.fillRect(x + dx, y + dy, w, h);
      }
      Icons.scaled(g, wish.icon, x + WELL / 2, y + WELL / 2 - 2, hover ? 'gold' : 'blue', 2);
      if (need > 1) Kit.bar(g, x + 5, y + WELL - 8, WELL - 10, 5, S.Wishes.progress(sim, entry) / need, MOOD);
    }

    dreamTip() {
      const sim = this.sim, dream = sim.dream && S.DREAMS[sim.dream.id];
      if (dream) return { icon: 'star', iconTone: 'gold', title: S.Wishes.dreamName(dream.id, sim.sex), text: 'Цель: ' + dream.goal + '. Желания, связанные с мечтой, приносят в полтора раза больше счастья.', line: '+' + groups(dream.points) + ' счастья', later: this.dreamLater(sim, dream) };
      if (!sim.wish) return { title: 'Мечта всей жизни', text: 'Мечты бывают только у своей семьи.' };
      if (S.AGE_RANK[sim.age] < S.AGE_RANK.adult) return { title: 'Мечта всей жизни', text: 'Мечту выбирают взрослые. Дети и подростки дорастут до неё.' };
      return { title: 'Мечта всей жизни', text: 'Большая цель на годы вперёд. Мечта подбирается по чертам.', keys: 'Щелчок: выбрать мечту' };
    }

    dreamLater(sim, dream) {
      if (sim.dream.done) return 'Мечта сбылась.';
      if (dream.stage > S.Wishes.NOW) return 'Продвигаться начнёт на этапе ' + dream.stage + '.';
      const progress = S.Wishes.dreamProgress(this.ui.game.world, sim, dream);
      return progress ? 'Ход: ' + progress[0] + ' из ' + progress[1] + '.' : '';
    }

    openDream() {
      const sim = this.sim;
      if (!sim.wish || sim.dream) return;
      if (S.AGE_RANK[sim.age] < S.AGE_RANK.adult) {
        this.ui.toast(sim.name + ': мечту выбирают взрослые', true);
        return;
      }
      this.dreamList = S.Wishes.dreamChoices(sim);
      this.dreamOpen = true;
      this.ui.stamp = '';
    }

    dreamBox() {
      const v = this.ui.screen, h = this.dreamList.length * DREAM_ROW + 44;
      return { x: Math.round((v.sw - DREAM_W) / 2), y: Math.round((v.sh - h) / 2) - 40, w: DREAM_W, h };
    }

    dreamRow(x, y) {
      const b = this.dreamBox(), i = Math.floor((y - b.y - 34) / DREAM_ROW);
      return x >= b.x && x < b.x + b.w && y >= b.y + 34 && i >= 0 && i < this.dreamList.length ? i : -1;
    }

    dreamClick(x, y) {
      const i = this.dreamRow(x, y);
      this.dreamOpen = false;
      this.ui.stamp = '';
      if (i >= 0) {
        S.Wishes.chooseDream(this.ui.game.world, this.sim, this.dreamList[i]);
        this.ui.toast(this.sim.name + ': мечта всей жизни «' + S.Wishes.dreamName(this.dreamList[i], this.sim.sex) + '»');
      }
    }

    drawDream(g) {
      const b = this.dreamBox(), pointer = this.ui.pointer, hover = pointer ? this.dreamRow(pointer.x, pointer.y) : -1, mine = new Set(S.Traits.of(this.sim));
      Kit.glass(g, b.x, b.y, b.w, b.h, 'pale', 9);
      Font.draw(g, 'title', 'Мечта всей жизни: ' + this.sim.name, b.x + 14, b.y + 8, INK);
      this.dreamList.forEach((id, i) => {
        const dream = S.DREAMS[id], y = b.y + 34 + i * DREAM_ROW, near = dream.traits.filter(t => mine.has(t)).map(t => S.Traits.name(t, this.sim.sex));
        Kit.plate(g, b.x + 8, y, b.w - 16, DREAM_ROW - 4, hover === i ? 'hover' : 'normal', 7);
        Icons.centered(g, 'star', b.x + 28, y + 20, 'gold');
        Font.shadowed(g, 'bold', S.Wishes.dreamName(id, this.sim.sex), b.x + 46, y + 4, '#fff', '#12306e');
        Font.draw(g, 'small', dream.goal + (near.length ? '. Близко: ' + near.join(', ') : ''), b.x + 46, y + 22, LIGHT);
        const points = '+' + groups(dream.points);
        Font.shadowed(g, 'smallb', points, b.x + b.w - 20 - Font.measure('smallb', points), y + 6, '#ffd84a', '#12306e');
      });
    }

    rewardAt(px, py) {
      const col = Math.floor((px - 470) / REWARD_W), row = Math.floor((py - this.top - 28) / REWARD_STEP_Y), i = row * REWARD_COLS + col, list = Object.keys(S.REWARDS);
      if (col < 0 || col >= REWARD_COLS || row < 0 || i >= list.length || (px - 470) % REWARD_W >= REWARD_W - 2) return null;
      return list[i];
    }

    rewardTip(id) {
      const sim = this.sim;
      if (!id) return { title: 'Награды', text: 'Счастье всей жизни копится от хорошего настроения и исполненных желаний.', line: 'Накоплено: ' + groups(Math.floor(sim.happy || 0)) };
      const r = S.REWARDS[id], owned = (sim.rewards || []).includes(id), short = r.price - Math.floor(sim.happy || 0);
      return {
        icon: r.icon, iconTone: owned ? 'green' : 'blue', title: r.name, text: r.text,
        line: groups(r.price) + ' счастья' + (owned ? ', уже есть' : ''),
        keys: owned ? (id === 'moodRemover' || id === 'mealCopier' ? 'Щелчок: включить' : '') : short > 0 ? 'Не хватает ' + groups(short) + ' счастья.' : this.confirm && this.confirm.id === id ? 'Щелчок ещё раз: купить' : 'Щелчок: купить',
        later: r.stage > S.Wishes.NOW ? 'Действовать начнёт на этапе ' + r.stage + '.' : ''
      };
    }

    rewardClick(id, now) {
      const sim = this.sim, world = this.ui.game.world;
      if (!id || !sim.rewards) return;
      if (sim.rewards.includes(id)) {
        if (id === 'moodRemover') S.Wishes.useMoodRemover(world, sim);
        if (id === 'mealCopier' && !S.Food.copy(world, sim)) this.ui.toast('Копировать пока нечего: сначала приготовьте блюдо', true);
        return;
      }
      if ((sim.happy || 0) < S.REWARDS[id].price) return;
      if (this.confirm && this.confirm.id === id && now - this.confirm.at < CONFIRM_MS) {
        this.confirm = null;
        if (S.Wishes.buy(world, sim, id) && id === 'changeDream') this.openDream();
        return;
      }
      this.confirm = { id, at: now };
      this.ui.toast('Щелчок ещё раз: купить «' + S.REWARDS[id].name + '» за ' + S.REWARDS[id].price, false);
    }

    drawRewards(g, x0, Y) {
      const sim = this.sim, x = x0 + 14;
      Font.draw(g, 'bold', 'Счастье всей жизни: ' + groups(Math.floor(sim.happy || 0)), x, Y + 8, LIGHT);
      Object.keys(S.REWARDS).forEach((id, i) => {
        const r = S.REWARDS[id], cx = x + (i % REWARD_COLS) * REWARD_W, cy = Y + 28 + Math.floor(i / REWARD_COLS) * REWARD_STEP_Y, owned = (sim.rewards || []).includes(id);
        Kit.plate(g, cx, cy, REWARD_W - 2, REWARD_H, owned ? 'good' : (sim.happy || 0) >= r.price ? 'normal' : 'off', 5);
        Icons.centered(g, r.icon, cx + REWARD_W / 2 - 1, cy + REWARD_H / 2, owned ? 'white' : (sim.happy || 0) >= r.price ? 'white' : 'gray');
      });
    }

    shownMoodlets() {
      const list = S.Moods.list(this.sim), room = TILE_COLS * TILE_ROWS;
      return list.length > room ? { tiles: list.slice(0, room - 1), rest: list.slice(room - 1) } : { tiles: list, rest: [] };
    }

    moodletsKey() {
      const { tiles, rest } = this.shownMoodlets();
      return this.sim.id + ':' + tiles.map(e => e.id + (e.left === null ? '' : Math.ceil(e.left / e.def.mins * 10))).join() + ':' + rest.length;
    }

    tileAt(px, py, top) {
      const col = Math.floor((px - WELL_X - 2) / TILE_STEP_X), row = Math.floor((py - top - 2) / TILE_STEP_Y);
      if (col < 0 || col >= TILE_COLS || row < 0 || row >= TILE_ROWS) return null;
      const lx = px - WELL_X - 2 - col * TILE_STEP_X, ly = py - top - 2 - row * TILE_STEP_Y;
      if (lx >= TILE || ly >= TILE + 6) return null;
      const i = row * TILE_COLS + col, { tiles, rest } = this.shownMoodlets();
      if (i < tiles.length) return i;
      return i === tiles.length && rest.length ? 'more' : null;
    }

    moodletTip(part) {
      const { tiles, rest } = this.shownMoodlets();
      if (part === 'more') return { title: 'Ещё ' + rest.length, text: rest.map(e => e.def.name + ' ' + signed(e.def.value)).join(', ') + '.' };
      const entry = tiles[part];
      if (!entry) return { title: 'Мудлеты', text: tiles.length ? 'Наведите на значок, чтобы узнать, что случилось.' : 'Что радует или огорчает сима прямо сейчас. Пока ничего особенного.' };
      const def = entry.def, cure = def.cure && def.value <= 0;
      return {
        icon: def.icon, iconTone: def.value > 0 ? 'green' : def.value < 0 ? 'red' : 'blue',
        title: def.name, text: def.text,
        line: signed(def.value) + ' к настроению, ' + (entry.left === null ? def.until : 'ещё ' + S.Moods.timeText(entry.left)),
        lineColor: def.value >= 0 ? GOOD_LINE : BAD_LINE,
        keys: cure ? 'Щелчок: ' + S.Moods.CURE_VERB[def.cure] : ''
      };
    }

    cureMoodlet(part) {
      const entry = this.shownMoodlets().tiles[part];
      if (!entry) return;
      const def = entry.def, sim = this.sim;
      if (!def.cure || def.value > 0) return;
      if (!S.Moods.cure(this.ui.game.world, sim, entry.id)) this.ui.toast(sim.name + ': негде или очередь полна', true);
    }

    drawMoodlets(g, x, y, hover) {
      Kit.glass(g, x, y, WELL_W, WELL_H, 'well', 7);
      const { tiles, rest } = this.shownMoodlets();
      tiles.forEach((entry, i) => {
        const tx = x + 2 + (i % TILE_COLS) * TILE_STEP_X, ty = y + 2 + Math.floor(i / TILE_COLS) * TILE_STEP_Y, def = entry.def;
        Kit.plate(g, tx, ty, TILE, TILE, def.value > 0 ? 'good' : def.value < 0 ? 'bad' : 'normal', 5);
        Icons.centered(g, def.icon, tx + TILE / 2, ty + TILE / 2, hover === i ? 'gold' : 'white');
        g.fillStyle = '#ffffff';
        g.fillRect(tx + TILE - 7, ty + 3, 4, 1);
        if (def.value > 0) g.fillRect(tx + TILE - 6, ty + 2, 2, 3);
        if (entry.left !== null) Kit.bar(g, tx, ty + TILE + 2, TILE, 4, entry.left / def.mins, def.value >= 0 ? MOOD : NEED_BAD);
      });
      if (rest.length) {
        const i = tiles.length, tx = x + 2 + (i % TILE_COLS) * TILE_STEP_X, ty = y + 2 + Math.floor(i / TILE_COLS) * TILE_STEP_Y, text = '+' + rest.length;
        Kit.plate(g, tx, ty, TILE, TILE, hover === 'more' ? 'hover' : 'normal', 5);
        Font.draw(g, 'smallb', text, tx + TILE / 2 - Font.measure('smallb', text) / 2, ty + 4, LIGHT);
      }
    }

    traitTip(i) {
      const sim = this.sim, id = S.Traits.of(sim)[i];
      if (!id) {
        const want = S.Traits.COUNTS[sim.age];
        return { title: 'Черта ' + (i + 1), text: i < want ? 'Черта ещё не выбрана.' : 'Новые черты появляются с возрастом: по одной в каждый день рождения.', later: i < want ? '' : 'Дни рождения появятся на этапе 17.' };
      }
      const def = S.TRAITS[id], against = def.conflicts.map(other => S.Traits.name(other, sim.sex));
      return {
        icon: def.icon, iconTone: 'blue', title: S.Traits.name(id, sim.sex), text: def.text,
        line: against.length ? 'Не уживается с чертами: ' + against.join(', ') + '.' : '',
        later: def.later ? 'В полную силу черта войдёт на этапе ' + def.later + '.' : ''
      };
    }

    doing() {
      const sim = this.sim;
      if (sim.inside) return 'внутри: ' + (sim.inside.name || 'жилой дом');
      return sim.act ? S.Acts.label(sim.act, sim, this.ui.game.world) : S.Sim.STATE_NAMES[sim.state];
    }

    progress(act) {
      if (act.go || act.phase !== 'run') return 0;
      const step = S.ADS[act.ad].steps[act.step];
      return Math.round(8 * S.clamp(1 - act.left / step.mins, 0, 1));
    }

    needsKey() {
      const needs = this.sim.needs;
      return needs ? S.NEED_ORDER.map(need => Math.round(needs[need] / 2)).join() : '';
    }

    drawFace(g, sim, x, y, w, h) {
      const face = this.ui.faceOf(sim, w, h);
      if (face) g.drawImage(face, x, y);
    }

    drawTab(g, x0, Y) {
      const x = x0 + 14, y = Y + 10, tab = TABS[this.tab], sim = this.sim;
      if (tab.id === 'simology') {
        Font.draw(g, 'bold', sim.name, x, y, LIGHT);
        Kit.plate(g, x0 + 144, Y + 5, 22, 22, 'normal', 5);
        Icons.centered(g, 'relations', x0 + 155, Y + 16, 'white');
        Font.draw(g, 'small', AGE_NAMES[sim.age], x, y + 15, LIGHT_SOFT);
        Kit.bar(g, x, Y + 40, 120, 9, 0, MOOD);
        Font.draw(g, 'small', 'Сейчас: ' + this.doing(), x, y + 42, LIGHT_SOFT);
        Font.draw(g, 'smallb', 'Любимое', x, y + 58, LIGHT);
        for (let i = 0; i < 3; i++) Kit.glass(g, x + i * 30, Y + 82, 26, 26, 'wellDark', 4);
        Kit.plate(g, x0 + 144, Y + 86, 22, 22, 'normal', 5);
        Icons.centered(g, 'book', x0 + 155, Y + 97, 'white');
        g.fillStyle = '#5a78b8';
        g.fillRect(x0 + 172, y, 1, 92);
        Font.draw(g, 'smallb', 'Черты', x0 + 182, y, LIGHT);
        const traits = S.Traits.of(sim);
        for (let i = 0; i < TRAIT_ROWS; i++) {
          const ty = Y + 24 + i * TRAIT_ROW_H, id = traits[i];
          if (id) {
            Icons.draw(g, S.TRAITS[id].icon, x0 + 180, ty - 1, 'white');
            Font.draw(g, 'small', S.Traits.name(id, sim.sex), x0 + 203, ty + 2, LIGHT);
          } else {
            Kit.glass(g, x0 + 182, ty + 1, 16, 16, 'wellDark', 3);
            Font.draw(g, 'small', i < S.Traits.COUNTS[sim.age] ? 'не выбрана' : 'с возрастом', x0 + 203, ty + 2, LIGHT_SOFT);
          }
        }
        return;
      }
      if (tab.id === 'needs') {
        S.NEED_ORDER.forEach((need, i) => {
          const cx = x + (i % 2) * 160, cy = y + Math.floor(i / 2) * 33, value = sim.needs ? sim.needs[need] : 0;
          Font.draw(g, 'smallb', S.NEED_NAMES[need], cx, cy, LIGHT);
          Kit.bar(g, cx, cy + 15, 148, 11, value / 100, value >= 50 ? NEED : value >= 25 ? NEED_LOW : NEED_BAD);
        });
        return;
      }
      if (tab.id === 'rewards') {
        this.drawRewards(g, x0, Y);
        return;
      }
      if (tab.id === 'relations') {
        this.drawRelations(g, x0, Y);
        return;
      }
      if (tab.id === 'skills') {
        this.drawSkills(g, x0, Y);
        return;
      }
      if (tab.id === 'inventory') {
        this.drawBag(g, x0, Y);
        return;
      }
      if (tab.id === 'job') {
        this.drawJob(g, x0, Y);
        return;
      }
      if (tab.id === 'chance') {
        this.drawOpps(g, x0, Y);
        return;
      }
      Font.draw(g, 'bold', tab.title, x, y, LIGHT);
      Font.wrap('small', tab.text, 300).forEach((line, i) => Font.draw(g, 'small', line, x, y + 20 + i * 14, LIGHT_SOFT));
      Font.draw(g, 'small', tab.later || '', x, y + 54, LIGHT_SOFT);
    }

    funds() {
      return this.ui.scene && this.ui.scene.world ? this.ui.scene.world.funds : S.Sample.MONEY;
    }

    bagStacks() {
      if (this.bagView && this.ui.game) return S.Econ.familyStacks(this.ui.game.world);
      return this.sim && this.sim.bag ? S.Econ.stacks(this.sim) : [];
    }

    bagPages() {
      return Math.max(1, Math.ceil(this.bagStacks().length / BAG_CELLS));
    }

    bagStack(i) {
      const page = Math.min(this.bagPage, this.bagPages() - 1);
      return this.bagStacks()[page * BAG_CELLS + i] || null;
    }

    bagTip(i) {
      const stack = this.bagStack(i);
      if (!stack) return null;
      const world = this.ui.scene.world, it = stack.item;
      return { icon: S.Econ.KINDS[it.k].icon, title: S.Econ.name(it) + (stack.indexes.length > 1 ? ' × ' + stack.indexes.length : ''), text: S.Econ.line(world, this.sim, it) || S.Econ.KINDS[it.k].name, keys: 'Щелчок: что сделать' };
    }

    bagClick(i, Y) {
      const stack = this.bagStack(i);
      if (!stack) return;
      if (this.bagView) {
        const world = this.ui.game.world;
        if (!this.sim.bag || !S.Econ.fetch(world, this.sim, stack.indexes[0])) this.ui.toast(this.sim.bag ? this.sim.name + ': инвентарь полон' : 'Брать вещи может только семья', true);
        else this.ui.toast(this.sim.name + ' берёт: «' + S.Econ.name(stack.item) + '»');
        return;
      }
      const ui = this.ui, cx = 470 + (i % BAG_ROW) * BAG_STEP + 17, cy = Y + 28 + Math.floor(i / BAG_ROW) * 38 + 17;
      ui.pie.show(cx, cy - 120, { type: 'bag', index: stack.indexes[0], title: S.Econ.name(stack.item) });
    }

    bagKey() {
      const sim = this.sim, fam = this.ui.game ? S.Econ.familyBag(this.ui.game.world) : [];
      return this.bagView + ':' + fam.length + ':' + (sim && sim.bag ? sim.bag.length + ':' + this.bagPage + ':' + sim.bag.map(it => it.k[0] + it.id.length + it.q).join('') : '-');
    }

    drawBag(g, x0, Y) {
      const sim = this.sim, stacks = this.bagStacks(), pages = this.bagPages(), page = Math.min(this.bagPage, pages - 1);
      Font.draw(g, 'bold', 'Инвентарь', x0 + 14, Y + 8, LIGHT);
      if (sim && sim.bag) {
        const cx0 = x0 + 336 - 2 * (CHIP_W + 2) - 50;
        BAG_VIEWS.forEach((name, i) => {
          const cx = cx0 + i * (CHIP_W + 2), on = this.bagView === i;
          Kit.plate(g, cx, Y + 4, CHIP_W, 15, on ? 'on' : 'normal', 5);
          Font.draw(g, 'small', name, cx + (CHIP_W - Font.measure('small', name)) / 2, Y + 5, on ? INK : LIGHT);
        });
      }
      const count = this.bagView && this.ui.game ? S.Econ.familyBag(this.ui.game.world).length + ' из ' + S.Econ.FAMILY_BAG : sim && sim.bag ? sim.bag.length + ' из ' + S.Econ.BAG_SIZE : '';
      Font.draw(g, 'small', count, x0 + 110, Y + 10, LIGHT_SOFT);
      if (pages > 1) {
        Kit.plate(g, x0 + 286, Y + 6, 18, 18, page > 0 ? 'normal' : 'off', 5);
        Icons.centered(g, 'left', x0 + 295, Y + 15, 'white');
        Kit.plate(g, x0 + 308, Y + 6, 18, 18, page < pages - 1 ? 'normal' : 'off', 5);
        Icons.centered(g, 'right', x0 + 317, Y + 15, 'white');
      }
      if (!sim || !sim.bag) {
        Font.draw(g, 'small', 'Инвентарь бывает только у своей семьи.', x0 + 14, Y + 32, LIGHT_SOFT);
        return;
      }
      for (let i = 0; i < BAG_CELLS; i++) {
        const cx = x0 + 14 + (i % BAG_ROW) * BAG_STEP, cy = Y + 28 + Math.floor(i / BAG_ROW) * 38, stack = stacks[page * BAG_CELLS + i];
        Kit.glass(g, cx, cy, 34, 34, 'wellDark', 4);
        if (!stack) continue;
        const it = stack.item, best = it.q >= S.Econ.PERFECT;
        Icons.centered(g, S.Econ.KINDS[it.k].icon, cx + 17, cy + 16, best ? 'gold' : 'white');
        if (stack.indexes.length > 1) {
          const n = String(stack.indexes.length);
          Font.draw(g, 'small', n, cx + 31 - Font.measure('small', n), cy + 20, LIGHT);
        }
      }
      if (!stacks.length) Font.draw(g, 'small', 'Пусто. Улов, урожай, находки и картины попадают сюда.', x0 + 14, Y + 106, LIGHT_SOFT);
    }

    skillCells() {
      return S.Skills.list(this.sim).slice(0, SKILL_CELLS);
    }

    skillTip(i) {
      const id = this.skillCells()[i];
      if (!id) return null;
      const sim = this.sim, def = S.SKILLS[id], level = S.Skills.level(sim, id), xp = sim.skill.xp[id];
      return {
        icon: def.icon, title: def.name + ', уровень ' + level, text: def.text,
        line: level < S.Skills.TOP ? 'До ' + (level + 1) + ' уровня: ' + Math.ceil(S.Skills.LEVEL_XP[level + 1] - xp) + ' мин практики' : 'Навык освоен',
        keys: 'Щелчок: журнал (J)'
      };
    }

    drawSkills(g, x0, Y) {
      const cells = this.skillCells(), sim = this.sim;
      Font.draw(g, 'bold', 'Навыки', x0 + 14, Y + 8, LIGHT);
      Kit.plate(g, x0 + 236, Y + 5, 90, 18, 'normal', 6);
      Font.draw(g, 'small', 'Журнал (J)', x0 + 236 + (90 - Font.measure('small', 'Журнал (J)')) / 2, Y + 8, LIGHT);
      if (!cells.length) {
        Font.wrap('small', sim.skill ? 'Пока ничего не начато. Плита, груша, шахматы, разговоры и книги на полке учат навыкам.' : 'Навыки бывают только у своей семьи.', 300).forEach((line, i) => Font.draw(g, 'small', line, x0 + 14, Y + 32 + i * 14, LIGHT_SOFT));
        return;
      }
      cells.forEach((id, i) => {
        const x = x0 + 14 + (i % 2) * 160, y = Y + 30 + Math.floor(i / 2) * 27, level = S.Skills.level(sim, id), def = S.SKILLS[id];
        Icons.draw(g, def.icon, x, y, 'white');
        Font.draw(g, 'smallb', def.name, x + 22, y, LIGHT);
        Font.draw(g, 'smallb', String(level), x + 136 - Font.measure('smallb', String(level)), y, LIGHT);
        for (let k = 0; k < S.Skills.TOP; k++) {
          g.fillStyle = k < level ? '#5fd05a' : '#203a70';
          g.fillRect(x + 22 + k * 11, y + 14, 9, 5);
        }
      });
    }

    relRows() {
      const world = this.ui.game.world, sim = this.sim, f = this.relFilter, order = S.Rel.STATUS_ORDER;
      const rows = S.Rel.rows(world, sim).filter(r => f === 'all' || (f === 'family' && (r.kin || r.status === 'spouse')) || (f === 'friends' && FRIEND_STATUS.has(r.status) && !r.kin) || (f === 'love' && LOVE_STATUS.has(r.status)) || (f === 'foes' && FOE_STATUS.has(r.status)));
      if (this.relSort === 'name') rows.sort((a, b) => (a.other.name < b.other.name ? -1 : a.other.name > b.other.name ? 1 : 0));
      else rows.sort((a, b) => (b.kin || b.status === 'spouse' ? 1 : 0) - (a.kin || a.status === 'spouse' ? 1 : 0) || order.indexOf(a.status) - order.indexOf(b.status) || b.v - a.v);
      return rows;
    }

    relationsKey() {
      const rows = this.relRows();
      this.relScroll = Math.max(0, Math.min(this.relScroll, rows.length - REL_ROWS));
      return this.relFilter + this.relSort + this.relScroll + ':' + rows.length + ':' + rows.slice(this.relScroll, this.relScroll + REL_ROWS).map(r => r.other.id + r.status + Math.round(r.v)).join();
    }

    scrollRelations(dir) {
      const n = this.relRows().length;
      this.relScroll = Math.max(0, Math.min(this.relScroll + dir, n - REL_ROWS));
    }

    wheel(px, py, dy) {
      if (!this.open || TABS[this.tab].id !== 'relations' || px < 456 || px >= 796 || py < this.top || py >= this.top + PANEL_H) return false;
      this.scrollRelations(dy > 0 ? 1 : -1);
      return true;
    }

    relTip(r) {
      if (!r) return null;
      const world = this.ui.game.world, other = r.other, known = other.free ? (this.sim.knows && this.sim.knows[other.id]) || [] : S.Traits.of(other);
      const traits = known.map(id => S.Traits.name(id, other.sex)).join(', '), days = r.last >= 0 ? Math.floor((S.Social.now(world) - r.last) / 1440) : -1;
      const work = S.Jobs.describe(world, other);
      return {
        title: other.name + (other.surname ? ' ' + other.surname : ''),
        text: [r.word, r.kinWord].filter(Boolean).join(', ') + '. ' + (traits ? 'Черты: ' + traits + '.' : 'Черты пока неизвестны.'),
        line: 'Отношения: ' + signed(r.v), lineColor: r.v >= 0 ? GOOD_LINE : BAD_LINE,
        later: (work ? work + '. ' : '') + (days < 0 ? '' : days === 0 ? 'Виделись сегодня.' : days === 1 ? 'Виделись вчера.' : 'Не виделись ' + days + ' дн.')
      };
    }

    callTip(r) {
      if (!r) return null;
      if (!r.other.free) return { icon: 'phone', title: 'Позвонить', text: 'Живёт с вами, звонить незачем.' };
      return { icon: 'phone', title: 'Позвонить', text: r.other.name, keys: 'Щелчок: поболтать по телефону' };
    }

    callRow(r) {
      if (!r) return;
      const ui = this.ui, world = ui.game.world, sim = this.sim;
      if (!r.other.free || !sim.needs || S.AGE_RANK[sim.age] < S.AGE_RANK.child) {
        ui.toast(r.other.free ? sim.name + ': звонить ещё рано' : r.other.name + ' живёт с вами', true);
        return;
      }
      const act = { ad: 'phone_call', lot: sim.home.index, item: -1, step: 0, phase: 'start', left: 0, phone: 'chat', with: world.sims.indexOf(r.other) };
      if (!S.Acts.add(world, sim, act)) ui.toast(sim.name + ': очередь полна', true);
      else ui.sound.play('tick');
    }

    markRow(r) {
      if (!r) return;
      const ui = this.ui;
      ui.map.mark = { sim: r.other, until: ui.time + 30 };
      if (!ui.map.open) ui.map.toggle();
    }

    drawRelations(g, x0, Y) {
      REL_FILTERS.forEach((f, i) => {
        const x = x0 + 10 + i * 46, on = this.relFilter === f.id;
        Kit.plate(g, x, Y + 5, 44, 17, on ? 'on' : 'normal', 6);
        Font.draw(g, 'small', f.name, x + (44 - Font.measure('small', f.name)) / 2, Y + 7, on ? INK : LIGHT);
      });
      const sortName = this.relSort === 'status' ? 'по статусу' : 'по имени';
      Kit.plate(g, x0 + 246, Y + 5, 76, 17, 'normal', 6);
      Font.draw(g, 'small', sortName, x0 + 246 + (76 - Font.measure('small', sortName)) / 2, Y + 7, LIGHT);
      const rows = this.relRows();
      if (!rows.length) {
        Font.draw(g, 'small', this.relFilter === 'all' ? 'Пока ни с кем не знакомы.' : 'Здесь пока никого.', x0 + 14, Y + REL_TOP + 8, LIGHT_SOFT);
        return;
      }
      rows.slice(this.relScroll, this.relScroll + REL_ROWS).forEach((r, i) => {
        const ry = Y + REL_TOP + i * REL_ROW_H, other = r.other;
        Kit.glass(g, x0 + 8, ry, 312, REL_ROW_H - 2, 'wellDark', 5);
        g.fillStyle = '#5e9e62';
        g.fillRect(x0 + 11, ry + 2, 20, 22);
        this.drawFace(g, other, x0 + 11, ry + 2, 20, 22);
        Font.draw(g, 'smallb', other.name, x0 + 36, ry + 2, LIGHT);
        Font.draw(g, 'small', [r.word, r.kinWord].filter(Boolean).join(' · '), x0 + 36, ry + 14, LIGHT_SOFT);
        const bx = x0 + 186, bw = 76, mid = bx + bw / 2, fill = Math.round(Math.abs(r.v) / 100 * bw / 2);
        g.fillStyle = '#0c1c40';
        g.fillRect(bx, ry + 10, bw, 7);
        g.fillStyle = r.v >= 0 ? REL_GOOD : REL_BAD;
        if (r.v >= 0) g.fillRect(mid, ry + 11, fill, 5);
        else g.fillRect(mid - fill, ry + 11, fill, 5);
        g.fillStyle = '#f0f6ff';
        g.fillRect(mid, ry + 9, 1, 9);
        Kit.plate(g, x0 + 272, ry + 3, 20, 20, other.free ? 'normal' : 'off', 5);
        Icons.centered(g, 'phone', x0 + 282, ry + 13, other.free ? 'white' : 'gray');
        Kit.plate(g, x0 + 296, ry + 3, 20, 20, 'normal', 5);
        Icons.centered(g, 'pin', x0 + 306, ry + 13, 'white');
      });
      for (const [dir, ay] of [[-1, Y + REL_TOP], [1, Y + REL_TOP + REL_ROWS * REL_ROW_H - 16]]) {
        const can = dir < 0 ? this.relScroll > 0 : this.relScroll + REL_ROWS < rows.length;
        Kit.plate(g, x0 + 320, ay, 16, 16, can ? 'normal' : 'off', 4);
        Icons.centered(g, dir < 0 ? 'floorUp' : 'floorDown', x0 + 328, ay + 8, can ? 'white' : 'gray');
      }
    }

    rabbit() {
      const sim = this.sim, game = this.ui.game;
      return sim && sim.needs && game ? S.Jobs.status(game.world, sim) || S.Opps.status(game.world, sim) : null;
    }

    rabbitKey() {
      const r = this.rabbit();
      return r ? this.sim.id + r.place.id + Math.ceil(r.left / 10) + ':' + r.inside.map(o => o.id).join() : '-';
    }

    rabbitTip() {
      const r = this.rabbit();
      if (!r) return null;
      return {
        icon: r.school ? 'book' : 'job', title: r.place.name,
        text: r.school ? 'Идут уроки. Тон учёбы меняет оценку, силы и веселье.' : 'Смена идёт внутри здания. Тон работы меняет производительность, отношения и настроение.',
        line: r.inside.length ? 'Внутри знакомые: ' + r.inside.map(o => o.name).join(', ') : 'Знакомых внутри нет'
      };
    }

    fitNames(list, width) {
      let text = '';
      for (let i = 0; i < list.length; i++) {
        const next = (text ? text + ', ' : 'Внутри: ') + list[i].name, more = list.length - i - 1;
        if (Font.measure('small', next + (more ? ' и ещё ' + more : '')) > width) return text + ' и ещё ' + (list.length - i);
        text = next;
      }
      return text || 'Знакомых внутри нет';
    }

    drawRabbit(g, x, y) {
      const r = this.rabbit();
      if (!r) return;
      Kit.glass(g, x, y, RH_W, RH_BODY, 'pale', 10);
      Kit.glass(g, x + 6, y + 6, 40, 40, 'wellDark', 6);
      Icons.scaled(g, r.school ? 'book' : 'job', x + 26, y + 26, 'white', 2);
      Font.draw(g, 'bold', r.place.name, x + 54, y + 5, INK);
      Font.draw(g, 'small', r.text, x + 54, y + 22, INK);
      Font.draw(g, 'small', this.fitNames(r.inside, RH_TEXT), x + 54, y + 35, '#3c4c78');
    }

    tonesOf(r) {
      return r.tones ? Object.values(r.tones).sort((a, b) => a.order - b.order) : [];
    }

    rabbitPart(px) {
      if (px >= RH_X + RH_W - EXIT_W - 6) return 'exit';
      if (!this.rabbit() || !this.rabbit().tones) return null;
      const dx = px - RH_X - 6, i = Math.floor(dx / TONE_STEP);
      return dx >= 0 && i < 7 && dx % TONE_STEP < TONE_W ? i : null;
    }

    armed(at) {
      return !!at && performance.now() - at < CONFIRM_MS;
    }

    rabbitRowKey() {
      const r = this.rabbit();
      return r ? r.tone + (this.armed(this.leaving) ? 'x' : '') : '-';
    }

    rabbitPartTip(part) {
      const r = this.rabbit();
      if (!r || part === null) return null;
      if (part === 'exit' && r.opp) return { icon: 'close', title: 'Выйти', text: 'Задание засчитает только проведённое внутри время.', keys: 'Щелчок: выйти' };
      if (part === 'exit') {
        return {
          icon: 'close', title: r.school ? 'Уйти с уроков' : 'Уйти с работы раньше',
          text: r.school ? 'Оценка снизится, уроки за день засчитаются не полностью.' : 'Производительность −10, оплата только за отработанные часы.',
          keys: this.armed(this.leaving) ? 'Щелчок ещё раз: уйти' : 'Щелчок, потом ещё один для подтверждения'
        };
      }
      const tone = this.tonesOf(r)[part];
      return { icon: tone.icon, title: tone.name, text: tone.text, keys: r.tone === tone.id ? 'Выбрано' : 'Щелчок: выбрать' };
    }

    rabbitClick(part, now) {
      const r = this.rabbit(), world = this.ui.game.world;
      if (!r || part === null) return;
      if (part === 'exit') {
        if (r.opp) {
          S.Acts.add(world, this.sim, S.Acts.goAct({ x: this.sim.home.doorOut[0], z: this.sim.home.doorOut[1], floor: 0, lot: this.sim.home }, true), true);
          return;
        }
        if (this.armed(this.leaving)) {
          this.leaving = 0;
          S.Jobs.leaveEarly(world, this.sim);
          return;
        }
        this.leaving = now;
        this.ui.toast(r.school ? 'Щелчок ещё раз: уйти с уроков, оценка снизится' : 'Щелчок ещё раз: уйти с работы, производительность снизится', true);
        return;
      }
      S.Jobs.setTone(world, this.sim, this.tonesOf(r)[part].id);
      this.ui.sound.play('tick');
    }

    drawRabbitRow(g, x, y, hover) {
      const r = this.rabbit();
      if (!r) return;
      Kit.glass(g, x, y, RH_W, RH_ROW, 'deep', 8);
      this.tonesOf(r).forEach((tone, i) => {
        const bx = x + 6 + i * TONE_STEP;
        Kit.plate(g, bx, y + 2, TONE_W, RH_ROW - 4, r.tone === tone.id ? 'on' : hover === i ? 'hover' : 'normal', 5);
        Icons.centered(g, tone.icon, bx + TONE_W / 2, y + RH_ROW / 2, 'white');
      });
      const ex = x + RH_W - EXIT_W - 6, armed = this.armed(this.leaving), label = armed ? 'Точно?' : 'Выйти';
      Kit.plate(g, ex, y + 2, EXIT_W, RH_ROW - 4, armed ? 'red' : hover === 'exit' ? 'hover' : 'normal', 5);
      Font.draw(g, 'smallb', label, ex + (EXIT_W - Font.measure('smallb', label)) / 2, y + 7, LIGHT);
    }

    jobStates() {
      const sim = this.sim;
      return [sim.job, sim.side, sim.school].filter(Boolean);
    }

    jobState() {
      const list = this.jobStates();
      return list.length ? list[Math.min(this.jobView, list.length - 1)] : null;
    }

    isSchool(state) {
      return !!state && state === this.sim.school;
    }

    jobKey() {
      const sim = this.sim, state = this.jobState(), world = this.ui.game.world;
      if (!state) return sim.id + ':none:' + (sim.lastJob || '') + ':' + (sim.pension || 0) + sim.age;
      if (this.isSchool(state)) return [sim.id, this.jobStates().length, this.jobView, 'school', Math.floor(state.grade), state.homework, state.homeworkDue, this.classFriends()].join('|');
      const boss = S.Jobs.boss(world, sim, state);
      return [sim.id, this.jobStates().length, this.jobView, state.id, state.level, Math.floor(state.perf), state.branch, state.asked === world.day, boss ? boss.id + ':' + Math.round(S.Rel.value(world, sim, boss)) : '', S.Jobs.coworkers(world, sim, state).length, this.reqRows(state).map(r => r.key + r.need + r.ok).join(), this.armed(this.quitting)].join('|');
    }

    classFriends() {
      const world = this.ui.game.world, sim = this.sim;
      return world.sims.filter(o => o !== sim && o.age === sim.age && !world.family.includes(o) && S.Rel.value(world, sim, o) >= S.Rel.FRIEND).length;
    }

    reqRows(state) {
      const sim = this.sim, world = this.ui.game.world, def = S.Jobs.def(state);
      if (state.level >= S.Jobs.top(state)) return [];
      const branch = state.branch || (def.branchAt === state.level + 1 ? S.Jobs.pickBranch(world, sim, def) : null), seen = new Set(), out = [];
      for (const [key, need] of S.Jobs.reqsFor(def, state.level + 1, branch)) {
        if (seen.has(key)) continue;
        seen.add(key);
        out.push({ key, need, ok: S.Jobs.has(world, sim, key, need) });
      }
      return out;
    }

    reqLabel(r) {
      if (r.key === 'friends') return 'друзей ' + r.need;
      return r.key.split('|').map(id => S.SKILLS[id].name.toLowerCase()).join('/') + ' ' + r.need;
    }

    reqSlots(state) {
      const head = 'Ступень ' + (state.level + 1) + ':';
      let x = 470 + Font.measure('small', head) + 8;
      return this.reqRows(state).map(r => {
        const text = this.reqLabel(r), w = Font.measure('small', text);
        const slot = Object.assign({ x, w, text }, r);
        x += w + 12;
        return slot;
      });
    }

    reqAt(px) {
      const state = this.jobState();
      if (!state || this.isSchool(state)) return null;
      const i = this.reqSlots(state).findIndex(s => px >= s.x - 4 && px < s.x + s.w + 4);
      return i >= 0 ? i : null;
    }

    reqTip(part) {
      const state = this.jobState();
      if (!state || this.isSchool(state)) return null;
      if (part === null) {
        const top = state.level >= S.Jobs.top(state);
        return { icon: 'job', title: top ? 'Вершина карьеры' : 'Что нужно для повышения', text: top ? 'Выше ступеней нет. Полная шкала производительности приносит надбавку.' : 'Полная шкала производительности и эти навыки. Щелчок по навыку покажет вещь дома, которая ему учит.' };
      }
      const r = this.reqSlots(state)[part];
      if (!r) return null;
      if (r.key === 'friends') return { icon: 'relations', title: 'Друзья: ' + r.need, text: 'Сейчас друзей: ' + S.Rel.friends(this.ui.game.world, this.sim) + '. Дружба растёт от разговоров и от тона «Дружить с коллегами».', keys: 'Щелчок: вкладка «Отношения»' };
      const skill = r.key.split('|').map(id => S.SKILLS[id].name).join(' или ');
      return { icon: S.SKILLS[r.key.split('|')[0]].icon, title: skill + ': ' + r.need, text: r.ok ? 'Уже хватает.' : 'Сейчас ' + Math.max(...r.key.split('|').map(id => S.Skills.level(this.sim, id))) + '.', keys: 'Щелчок: показать, чем учиться' };
    }

    reqClick(part) {
      const state = this.jobState(), ui = this.ui, world = ui.game.world;
      if (part === null || !state || this.isSchool(state)) return;
      const r = this.reqSlots(state)[part];
      if (!r) return;
      if (r.key === 'friends') {
        this.relFilter = 'friends';
        this.openTab(TABS.findIndex(tab => tab.id === 'relations'));
        return;
      }
      const found = S.Jobs.trainerFor(world, this.sim, r.key);
      if (!found) {
        ui.toast(r.key.split('|').includes('fishing') ? 'Рыбалка: щелчок по воде у моря, реки или пруда' : 'Дома нет вещи для этого навыка', true);
        return;
      }
      ui.pointAt(found.lot, found.item);
      ui.toast('Здесь растёт ' + S.SKILLS[found.skill].name.toLowerCase() + ': ' + S.ADS[found.ad].name);
    }

    peopleParts(state) {
      const world = this.ui.game.world, sim = this.sim, boss = S.Jobs.boss(world, sim, state);
      const head = boss ? 'Начальник: ' + boss.name + ', ' + signed(S.Rel.value(world, sim, boss)) : 'Начальника выше нет';
      const mates = S.Jobs.coworkers(world, sim, state), known = mates.filter(o => { const rel = S.Rel.get(world, sim, o); return !!rel && !!(rel.f & S.Rel.F.met); }).length;
      return { boss, head, mates, known, tail: 'Коллег: ' + mates.length + ', знакомы ' + known, split: 470 + Font.measure('small', head) + 10 };
    }

    peopleAt(px) {
      const state = this.jobState();
      if (!state || this.isSchool(state)) return null;
      return px < this.peopleParts(state).split ? 'boss' : 'mates';
    }

    peopleTip(part) {
      const state = this.jobState();
      if (!state || this.isSchool(state) || part === null) return null;
      const p = this.peopleParts(state), sex = p.boss && p.boss.sex === 'f' ? 1 : 0;
      if (part === 'boss') {
        if (!p.boss) return { icon: 'job', title: 'Начальник', text: 'Выше по службе в городе никого нет.' };
        return { icon: 'job', title: p.boss.name, text: S.Jobs.titleAt(S.Jobs.def(state), p.boss.work ? p.boss.work.level : p.boss.job.level, p.boss.work ? p.boss.work.branch : p.boss.job.branch, sex) + '. Тон «Говорить с начальником» и «Подлизываться к начальству» улучшают отношения, а от них зависит просьба о повышении.', line: 'Отношения: ' + signed(S.Rel.value(this.ui.game.world, this.sim, p.boss)) };
      }
      return { icon: 'relations', title: 'Коллеги', text: p.mates.length ? p.mates.slice(0, 8).map(o => o.name).join(', ') + (p.mates.length > 8 ? ' и ещё ' + (p.mates.length - 8) : '') + '.' : 'Коллег пока нет.', keys: 'Щелчок: вкладка «Отношения»' };
    }

    barTip() {
      const state = this.jobState();
      if (!state) return null;
      if (this.isSchool(state)) return { icon: 'book', title: 'Оценка: ' + S.Jobs.gradeName(state.grade), text: 'Растёт от уроков, хорошего настроения и тона «Стараться». Падает от прогулов и несделанных уроков.', line: Math.round(state.grade) + ' из 100' };
      return { icon: 'job', title: 'Производительность', text: 'Полная шкала: повышение и премия в ' + S.Jobs.BONUS_HOURS + ' ставок, если хватает навыков. Растёт от хорошего настроения и тона работы.', line: Math.round(state.perf) + ' из 100' };
    }

    buttonParts(state) {
      const def = S.Jobs.def(state), out = [];
      if (state.level < S.Jobs.top(state)) out.push('ask');
      out.push('quit');
      if (def.branchAt && state.level < def.branchAt) out.push('branch');
      return out;
    }

    buttonAt(px) {
      const state = this.jobState();
      if (!state || this.isSchool(state)) return null;
      const parts = this.buttonParts(state);
      for (const [id, dx, w] of JOB_BUTTONS) if (parts.includes(id) && px >= 456 + dx && px < 456 + dx + w) return id;
      return null;
    }

    branchName(state) {
      const world = this.ui.game.world, def = S.Jobs.def(state), id = state.branch || S.Jobs.pickBranch(world, this.sim, def);
      return def.branches[id].name;
    }

    buttonLabel(id, state) {
      if (id === 'ask') return 'Просить повышения';
      if (id === 'quit') return this.armed(this.quitting) ? 'Точно?' : this.sim.age === 'elder' && state === this.sim.job ? 'На пенсию' : 'Уйти с работы';
      return 'Ветвь: ' + this.branchName(state);
    }

    buttonTip(part) {
      const state = this.jobState(), world = this.ui.game.world;
      if (!state || part === null) return null;
      if (part === 'ask') return { icon: 'job', title: 'Попросить повышения', text: 'Раз в день. Шанс выше при производительности от 70 и хороших отношениях с начальником. Отказ отнимает 10 производительности.', keys: state.asked === world.day ? 'Сегодня уже просили' : 'Щелчок: попросить' };
      if (part === 'quit') return { icon: 'close', title: this.sim.age === 'elder' && state === this.sim.job ? 'Уйти на пенсию' : 'Уйти с работы', text: this.sim.age === 'elder' && state === this.sim.job ? 'Пенсия около ' + Math.round(S.Jobs.PENSION * 1000) / 10 + '% дневного заработка, каждый день в полночь.' : 'Ступень и производительность пропадут.', keys: this.armed(this.quitting) ? 'Щелчок ещё раз: уйти' : 'Щелчок, потом ещё один для подтверждения' };
      const def = S.Jobs.def(state);
      return { icon: 'job', title: 'Ветвь карьеры', text: 'С ' + def.branchAt + ' ступени путь разделится: ' + Object.values(def.branches).map(b => b.name + (b.reqs.length ? ' (' + b.reqs.map(([key]) => key.split('|').map(id => S.SKILLS[id].name.toLowerCase()).join(' или ')).join(', ') + ')' : '')).join(' или ') + '.', keys: 'Щелчок: сменить выбор' };
    }

    buttonClick(part, now) {
      const state = this.jobState(), ui = this.ui, world = ui.game.world, sim = this.sim;
      if (!state || this.isSchool(state) || part === null) return;
      if (part === 'ask') {
        if (state.asked === world.day) {
          ui.toast('Сегодня уже просили', true);
          return;
        }
        if (!S.Jobs.askRaise(world, sim, state)) ui.sound.play('tick');
        return;
      }
      if (part === 'branch') {
        const ids = Object.keys(S.Jobs.def(state).branches), current = state.branch || S.Jobs.pickBranch(world, sim, S.Jobs.def(state));
        S.Jobs.setBranch(sim, ids[(ids.indexOf(current) + 1) % ids.length], state);
        ui.sound.play('tick');
        return;
      }
      if (!this.armed(this.quitting)) {
        this.quitting = now;
        ui.toast('Щелчок ещё раз: ' + (sim.age === 'elder' && state === sim.job ? 'уйти на пенсию' : 'уйти с работы'), true);
        return;
      }
      this.quitting = 0;
      this.jobView = 0;
      if (sim.age === 'elder' && state === sim.job) S.Jobs.retire(world, sim);
      else S.Jobs.quit(world, sim, state);
    }

    chipAt(px) {
      const n = this.jobStates().length, x0 = 456 + 336 - n * (CHIP_W + 2), i = Math.floor((px - x0) / (CHIP_W + 2));
      return i >= 0 && i < n ? i : null;
    }

    chipName(i) {
      const state = this.jobStates()[i];
      return this.isSchool(state) ? JOB_VIEWS[2] : state === this.sim.side ? JOB_VIEWS[1] : JOB_VIEWS[0];
    }

    chipTip(part) {
      if (part === null) return null;
      const state = this.jobStates()[part];
      return { title: this.chipName(part), text: this.isSchool(state) ? 'Оценки и уроки.' : S.Jobs.def(state).name + ', ' + S.Jobs.title(this.sim, state).toLowerCase() + '.' };
    }

    drawJob(g, x0, Y) {
      const sim = this.sim, world = this.ui.game.world, x = x0 + 14, states = this.jobStates(), state = this.jobState();
      if (!state) {
        Font.draw(g, 'bold', sim.age === 'toddler' ? 'Малыш' : 'Работы нет', x, Y + 8, LIGHT);
        const text = sim.age === 'toddler' ? 'Малыши не работают и не учатся.' : (sim.pension ? 'Пенсия §' + sim.pension + ' в день. ' : '') + 'Работу дают компьютер дома (пять мест в день) и двери зданий в городе: щелчок по зданию, «Устроиться…».' + (sim.lastJob ? ' Последняя работа: ' + S.Jobs.def({ id: sim.lastJob }).name + '.' : '');
        Font.wrap('small', text, 310).forEach((line, i) => Font.draw(g, 'small', line, x, Y + 30 + i * 14, LIGHT_SOFT));
        return;
      }
      if (states.length > 1) {
        const cx0 = x0 + 336 - states.length * (CHIP_W + 2);
        states.forEach((s, i) => {
          const on = s === state, name = this.chipName(i), cx = cx0 + i * (CHIP_W + 2);
          Kit.plate(g, cx, Y + 4, CHIP_W, 15, on ? 'on' : 'normal', 5);
          Font.draw(g, 'small', name, cx + (CHIP_W - Font.measure('small', name)) / 2, Y + 5, on ? INK : LIGHT);
        });
      }
      if (this.isSchool(state)) {
        const [, end] = S.Jobs.shiftOf(sim, state), friends = this.classFriends();
        Font.draw(g, 'bold', 'Школа', x, Y + 6, LIGHT);
        Font.draw(g, 'small', (sim.age === 'child' ? 'Младшие классы' : 'Старшие классы') + ', с 9:00 до ' + S.timeText(end) + ', по будням', x, Y + 22, LIGHT_SOFT);
        Font.draw(g, 'smallb', 'Оценка', x, Y + 48, LIGHT);
        Kit.bar(g, x0 + JOB_BAR_X, Y + 50, GRADE_BAR_W, 9, state.grade / 100, state.grade >= 60 ? NEED : state.grade >= 40 ? NEED_LOW : NEED_BAD);
        Font.draw(g, 'small', S.Jobs.gradeName(state.grade), x0 + JOB_BAR_X + GRADE_BAR_W + 6, Y + 48, LIGHT_SOFT);
        const hw = !state.homeworkDue ? 'Уроков пока не задали.' : state.homework ? 'Уроки на завтра сделаны.' : 'Уроки не сделаны: стол, «Сделать уроки».';
        Font.draw(g, 'small', hw, x, Y + 64, state.homeworkDue && !state.homework ? REQ_MISS : REQ_OK);
        Font.draw(g, 'small', 'Друзей среди ровесников: ' + friends + '. Табель по пятницам.', x, Y + 80, LIGHT_SOFT);
        return;
      }
      const def = S.Jobs.def(state), top = S.Jobs.top(state), lot = S.Jobs.lot(world, state), branch = S.Jobs.branchOf(state);
      Font.draw(g, 'bold', S.Jobs.title(sim, state), x, Y + 6, LIGHT);
      Font.draw(g, 'small', def.name + (branch ? ', ' + branch.name : '') + ', ступень ' + state.level + ' из ' + top + ', §' + S.Jobs.pay(state) + '/ч', x, Y + 21, LIGHT_SOFT);
      Font.draw(g, 'small', lot.name + ', ' + S.Jobs.hoursText(def) + ', по будням', x, Y + 34, LIGHT_SOFT);
      Font.draw(g, 'smallb', 'Работа', x, Y + 48, LIGHT);
      Kit.bar(g, x0 + JOB_BAR_X, Y + 50, JOB_BAR_W, 9, state.perf / 100, state.perf >= 50 ? NEED : state.perf >= 20 ? NEED_LOW : NEED_BAD);
      Font.draw(g, 'small', Math.round(state.perf) + ' из 100', x0 + JOB_BAR_X + JOB_BAR_W + 6, Y + 48, LIGHT_SOFT);
      if (state.level >= top) Font.draw(g, 'small', 'Вершина карьеры. Полная шкала даёт надбавку.', x, Y + 64, REQ_OK);
      else {
        Font.draw(g, 'small', 'Ступень ' + (state.level + 1) + ':', x, Y + 64, LIGHT);
        const slots = this.reqSlots(state);
        if (!slots.length) Font.draw(g, 'small', 'нужна только полная шкала', x + Font.measure('small', 'Ступень ' + (state.level + 1) + ':') + 8, Y + 64, REQ_OK);
        for (const s of slots) Font.draw(g, 'small', s.text, s.x - 456 + x0, Y + 64, s.ok ? REQ_OK : REQ_MISS);
      }
      const people = this.peopleParts(state);
      Font.draw(g, 'small', people.head, x, Y + 80, LIGHT_SOFT);
      Font.draw(g, 'small', people.tail, people.split - 456 + x0, Y + 80, LIGHT_SOFT);
      const parts = this.buttonParts(state);
      for (const [id, dx, w] of JOB_BUTTONS) {
        if (!parts.includes(id)) continue;
        const off = id === 'ask' && state.asked === world.day, label = this.buttonLabel(id, state);
        Kit.plate(g, x0 + dx, Y + 96, w, 18, id === 'quit' && this.armed(this.quitting) ? 'red' : off ? 'off' : 'normal', 6);
        Font.draw(g, 'small', label, x0 + dx + (w - Font.measure('small', label)) / 2, Y + 98, off ? LIGHT_SOFT : LIGHT);
      }
    }

    dueKey() {
      return this.ui.game && this.ui.game.world.service ? S.Services.due(this.ui.game.world) : 0;
    }

    oppRows() {
      const game = this.ui.game;
      return game && this.sim.needs ? S.Opps.activeOf(game.world, this.sim) : [];
    }

    oppKey() {
      const world = this.ui.game.world;
      return this.sim.id + ':' + this.oppRows().map(a => a.id + S.Opps.progressText(world, a) + Math.ceil((a.until - world.day * 1440 - world.clock) / 1440)).join() + (this.dropping ? 'd' : '');
    }

    oppLeft(a) {
      const world = this.ui.game.world, left = a.until - world.day * 1440 - world.clock;
      return left >= 1440 ? 'ещё ' + Math.ceil(left / 1440) + ' дн.' : 'ещё ' + S.Moods.timeText(Math.max(1, left));
    }

    oppTip(a) {
      if (!a) return null;
      const world = this.ui.game.world, row = S.OPPS[a.id], target = a.target >= 0 ? world.sims[a.target] : null, lot = S.Opps.lotOf(world, a);
      return { icon: OPP_ICONS[row.kind], title: row.title, text: row.text + (target ? ' Кто: ' + target.name + '.' : '') + (lot ? ' Где: ' + lot.name + '.' : ''), line: 'Награда: ' + S.Opps.rewardText(row), later: (S.Opps.progressText(world, a) + ', ' + this.oppLeft(a)).replace(/\.?$/, '.') };
    }

    oppWhere(a) {
      if (!a) return;
      const world = this.ui.game.world, lot = S.Opps.lotOf(world, a), target = a.target >= 0 ? world.sims[a.target] : null, ui = this.ui;
      if (target) {
        ui.map.mark = { sim: target, until: ui.time + 30 };
        if (!ui.map.open) ui.map.toggle();
        return;
      }
      if (lot) {
        ui.watch = null;
        ui.follow = false;
        ui.camera.setView({ x: lot.x + lot.w / 2, z: lot.z + lot.d / 2 });
        ui.toast(S.OPPS[a.id].title + ': ' + lot.name);
        return;
      }
      ui.toast('Задание можно сделать где угодно');
    }

    oppDrop(a, now) {
      if (!a) return;
      if (this.dropping === a && this.armed(this.dropAt)) {
        this.dropping = null;
        S.Opps.drop(this.ui.game.world, a);
        return;
      }
      this.dropping = a;
      this.dropAt = now;
      this.ui.toast('Щелчок ещё раз: отказаться от «' + S.OPPS[a.id].title + '»', true);
    }

    drawOpps(g, x0, Y) {
      const rows = this.oppRows();
      Font.draw(g, 'bold', 'Возможности', x0 + 14, Y + 6, LIGHT);
      if (!rows.length) {
        Font.wrap('small', this.sim.needs ? 'Заданий нет. Предложения приходят звонком раз в несколько дней, иногда прямо на работе. От звонка можно отказаться без последствий.' : 'Задания бывают только у своей семьи.', 310).forEach((line, i) => Font.draw(g, 'small', line, x0 + 14, Y + 30 + i * 14, LIGHT_SOFT));
        return;
      }
      const world = this.ui.game.world;
      rows.slice(0, OPP_ROWS).forEach((a, i) => {
        const ry = Y + OPP_TOP + i * OPP_ROW_H, row = S.OPPS[a.id];
        Kit.glass(g, x0 + 8, ry, 312, OPP_ROW_H - 2, 'wellDark', 5);
        Icons.draw(g, OPP_ICONS[row.kind], x0 + 12, ry + 6, 'white');
        Font.draw(g, 'smallb', row.title, x0 + 34, ry + 2, LIGHT);
        Font.draw(g, 'small', S.Opps.progressText(world, a) + ', ' + this.oppLeft(a), x0 + 34, ry + 15, LIGHT_SOFT);
        Kit.plate(g, x0 + 268, ry + 4, 20, 20, 'normal', 5);
        Icons.centered(g, 'pin', x0 + 278, ry + 14, 'white');
        Kit.plate(g, x0 + 292, ry + 4, 20, 20, this.dropping === a && this.armed(this.dropAt) ? 'red' : 'normal', 5);
        Icons.centered(g, 'close', x0 + 302, ry + 14, 'white');
      });
    }

    openCard() {
      if (!this.ui.game) return;
      this.cardOpen = true;
      this.ui.stamp = '';
    }

    closeCard() {
      this.cardOpen = false;
      this.ui.stamp = '';
    }

    cardBox() {
      const v = this.ui.screen;
      return { x: Math.round((v.sw - CARD_W) / 2), y: Math.max(8, Math.round((v.sh - CARD_H) / 2) - 60), w: CARD_W, h: CARD_H };
    }

    cardPay() {
      const b = this.cardBox();
      return { x: b.x + b.w - 130, y: b.y + 128, w: 112, h: 22 };
    }

    cardKey() {
      const world = this.ui.game.world, p = this.ui.pointer, pay = this.cardPay();
      return [world.funds, S.Services.due(world), S.Upkeep.score(world.family[0].home), S.Upkeep.brokenItems(world.family[0].home).length, (world.coupons || []).length, world.service.maid, world.service.nanny, p ? (p.x >= pay.x && p.x < pay.x + pay.w && p.y >= pay.y && p.y < pay.y + pay.h) : false].join('|');
    }

    cardClick(px, py, button) {
      const b = this.cardBox(), pay = this.cardPay();
      if (button !== 0 || px < b.x || px >= b.x + b.w || py < b.y || py >= b.y + b.h || (px >= b.x + b.w - 30 && py < b.y + 30)) {
        this.closeCard();
        return;
      }
      if (px >= pay.x && px < pay.x + pay.w && py >= pay.y && py < pay.y + pay.h && S.Services.due(this.ui.game.world)) {
        S.Services.payBills(this.ui.game.world, this.sim.needs ? this.sim : null);
        this.ui.sound.play('tick');
        this.ui.stamp = '';
      }
    }

    drawCard(g) {
      const b = this.cardBox(), world = this.ui.game.world, lot = world.family[0].home, parts = S.Econ.houseParts(world, lot), value = parts.land + parts.structure + parts.objects;
      const due = S.Services.due(world), svc = world.service, score = S.Upkeep.score(lot), broken = S.Upkeep.brokenItems(lot).length, pay = this.cardPay(), p = this.ui.pointer;
      const surname = world.family[0].surname || '';
      Kit.glass(g, b.x, b.y, b.w, b.h, 'pale', 12);
      Font.draw(g, 'title', 'Дом' + (surname ? ' семьи ' + surname : ''), b.x + 16, b.y + 12, INK);
      Kit.plate(g, b.x + b.w - 30, b.y + 8, 22, 22, 'normal', 6);
      Icons.centered(g, 'close', b.x + b.w - 19, b.y + 19, 'white');
      const line = (y, label, value, color) => {
        Font.draw(g, 'text', label, b.x + 18, y, INK);
        Font.draw(g, 'bold', value, b.x + b.w - 18 - Font.measure('bold', value), y, color || INK);
      };
      line(b.y + 44, 'Стоимость дома', moneyText(value));
      Font.draw(g, 'small', 'участок ' + moneyText(parts.land) + ', стены и полы ' + moneyText(parts.structure) + ', вещи ' + moneyText(parts.objects), b.x + 18, b.y + 60, '#3c4c78');
      line(b.y + 78, 'Деньги семьи', moneyText(world.funds));
      line(b.y + 96, 'Состояние', moneyText(value + world.funds));
      g.fillStyle = '#7f95c4';
      g.fillRect(b.x + 16, b.y + 118, b.w - 32, 1);
      Font.draw(g, 'text', 'Счета к оплате', b.x + 18, b.y + 130, INK);
      Font.draw(g, 'bold', due ? moneyText(due) : 'нет', b.x + 150, b.y + 130, due ? BAD_LINE : GOOD_LINE);
      if (due) {
        const on = p && p.x >= pay.x && p.x < pay.x + pay.w && p.y >= pay.y && p.y < pay.y + pay.h;
        Kit.plate(g, pay.x, pay.y, pay.w, pay.h, world.funds < due ? 'off' : on ? 'hover' : 'normal', 8);
        Font.draw(g, 'smallb', 'Оплатить', pay.x + (pay.w - Font.measure('smallb', 'Оплатить')) / 2, pay.y + 4, LIGHT);
      }
      Font.wrap('small', 'Счета приходят по понедельникам и четвергам, следующий около ' + moneyText(S.Econ.billAmount(world)) + '. Через 3 дня письмо краснеет, ещё через день приходит коллектор.', b.w - 36).slice(0, 2).forEach((text, i) => Font.draw(g, 'small', text, b.x + 18, b.y + 156 + i * 13, '#3c4c78'));
      const facts = [
        ['Сигнализация', lot.house.alarm ? 'есть' : 'нет'], ['Датчик дыма', lot.house.detector ? 'есть' : 'нет'],
        ['Чистота', score >= S.Upkeep.FILTHY_AT ? 'свинарник' : score >= S.Upkeep.DIRTY_AT ? 'грязно' : 'чисто'], ['Сломано', broken ? broken + ' ' + S.Econ.things(broken) : 'ничего'],
        ['Горничная', svc.maid ? 'нанята' : 'нет'], ['Няня', svc.nanny ? 'приходит' : 'нет'],
        ['Купоны', (world.coupons || []).filter(c => c.until > world.day * 1440 + world.clock).map(c => S.Econ.COUPONS[c.id][0].toLowerCase()).join('; ') || 'нет']
      ];
      facts.forEach(([k, v], i) => {
        const col = i < 6 ? i % 2 : 0, row = i < 6 ? Math.floor(i / 2) : 3, x = b.x + 18 + col * 210, y = b.y + 188 + row * 20;
        Font.draw(g, 'smallb', k + ':', x, y, INK);
        Font.draw(g, 'small', v, x + Font.measure('smallb', k + ':') + 6, y, '#3c4c78');
      });
    }

    toggleMenu() {
      this.menu = !this.menu;
      this.ui.stamp = '';
    }

    menuBox() {
      const h = MENU.length * MENU_ROW + 8;
      return { x: 6, y: this.top + 86 - h, w: MENU_W, h };
    }

    menuRow(x, y) {
      const b = this.menuBox(), i = Math.floor((y - b.y - 4) / MENU_ROW);
      return x >= b.x && x < b.x + b.w && i >= 0 && i < MENU.length ? i : -1;
    }

    menuUsable(i) {
      return !MENU[i].later && (MENU[i].id !== 'exit' || !!this.ui.opts.exit);
    }

    menuClick(x, y) {
      const i = this.menuRow(x, y);
      this.menu = false;
      this.ui.stamp = '';
      if (i < 0 || !this.menuUsable(i)) return;
      const id = MENU[i].id;
      if (id === 'save' || id === 'load') this.ui.saves.show(id);
      else if (id === 'exit') this.ui.opts.exit();
    }

    drawMenu(g) {
      const b = this.menuBox(), pointer = this.ui.pointer, hover = pointer ? this.menuRow(pointer.x, pointer.y) : -1;
      Kit.glass(g, b.x, b.y, b.w, b.h, 'night', 5);
      MENU.forEach((row, i) => {
        const y = b.y + 4 + i * MENU_ROW, on = this.menuUsable(i);
        if (hover === i && on) {
          g.fillStyle = '#3e5a96';
          g.fillRect(b.x + 3, y, b.w - 6, MENU_ROW - 1);
        }
        Font.draw(g, 'bold', row.name, b.x + 12, y + 5, on ? LIGHT : '#7c88a8');
        if (row.later) Font.draw(g, 'small', row.later, b.x + b.w - 8 - Font.measure('small', row.later), y + 5, '#7c88a8');
      });
    }

    update(now) {
      this.layer.update();
      return this.layer.tip(now, TIP_DELAY);
    }
  }

  LiveView.PANEL_H = PANEL_H;
  LiveView.MODES = MODES;
  LiveView.TABS = TABS;
  LiveView.SPEEDS = SPEEDS;
  LiveView.DIAL_PARTS = DIAL_PARTS;
  LiveView.MENU = MENU;
  LiveView.moneyText = moneyText;
  LiveView.groups = groups;
  S.LiveView = LiveView;
})(globalThis.Sims98 = globalThis.Sims98 || {});
