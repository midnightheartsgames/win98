(function (A) {
  'use strict';
  const Art = A.Art = A.Art || {};
  const L = Art.LIST = {};
  Art.FILES = Art.FILES || {};
  Art.TIMES = { day: 'день', dusk: 'сумерки', night: 'ночь', dawn: 'рассвет' };
  Art.SCENES = ['interior', 'city', 'cave', 'desert', 'temple', 'ship', 'ocean', 'forest', 'jungle'];
  Art.BUST = { w: 280, h: 400, top: 80 };
  Art.SLOT_X = { left: 150, center: 320, right: 490 };
  const BAYER = [0, 8, 2, 10, 12, 4, 14, 6, 3, 11, 1, 9, 15, 7, 13, 5];
  Art.BAYER = BAYER;

  const b = (place, scene, times, colors, what, mood, ref) => ({ place, scene, times, colors, what, mood, ref });
  const c = (title, chapter, what, mood, ref) => ({ title, chapter, what, mood, ref });
  const s = (title, year, what, ref) => ({ title, year, what, ref });
  const EARLY = 'раздел «Early life» статьи Aayla Secura/Legends';

  L.bg = {
    pol_hall: b('Рилот, Лессу, поместье Пола: зал для танцев', 'interior', ['dusk', 'night'], ['#3a2030', '#7a3a3a', '#d8904a'], 'зал, вырезанный в скале, ковры, светильники, низкие ложа для гостей, площадка для танца', 'роскошь и духота', 'Republic 21–22'),
    pol_room: b('Рилот, поместье Пола: комната Эйлы', 'interior', ['dawn', 'night'], ['#2a2030', '#5a3a4a', '#b07a5a'], 'небольшая комната в скале: ложе, сундук, зеркало, кувшин с водой', 'тихо, тесно', 'Republic 22'),
    pol_balcony: b('Рилот, поместье Пола: балкон над обрывом', 'city', ['night'], ['#141020', '#3a2a40', '#a0603a'], 'высокий балкон над ущельем сумеречной полосы, перила, далеко внизу огни города', 'опасная высота', 'Republic 22'),
    pol_gardens: b('Рилот, поместье Пола: Каменные сады', 'cave', ['dusk'], ['#2a2a30', '#5a5040', '#a08a5a'], 'сад из камней и грибов в пещере, тропинки, светящиеся грибы', 'странная красота', 'Republic 21'),
    pol_servants: b('Рилот, поместье Пола: людские', 'interior', ['night'], ['#201a18', '#4a3a2a', '#8a6a4a'], 'кухня и спальни слуг, котлы с рикритовой похлёбкой, узкие проходы', 'шумно, бедно', 'адаптация'),
    lessu_market: b('Рилот, Лессу: нижний рынок', 'cave', ['dusk'], ['#2a1e1a', '#6a4a30', '#c8904a'], 'рынок в огромной пещере, навесы, ящики рилла, ветряки у входа', 'людно, жарко', 'статья Ryloth/Legends'),
    lessu_tunnels: b('Рилот, туннели под рынком', 'cave', ['night'], ['#141018', '#3a2a2a', '#6a4a3a'], 'низкие туннели, взрывные двери, трубы, следы контрабанды', 'тесно, тревожно', 'адаптация'),
    ryll_mine: b('Рилот: «заброшенная» рилловая шахта', 'cave', ['night'], ['#0e0c14', '#2a2238', '#5a4a7a'], 'старая шахта, крепь, паутина и коконы энергетических пауков, свечение рилла', 'страх, темнота', 'Republic 21, статья Glitteryll'),
    kiffex_crash: b('Киффекс: обломки капсулы', 'desert', ['dusk'], ['#2a2a24', '#5a5a40', '#a09a6a'], 'плодородная, но пустынная равнина тюремной планеты, дымящаяся капсула', 'одиночество', 'Republic 32'),
    kiffex_temple: b('Киффекс: храм-тюрьма Каркко', 'temple', ['night'], ['#0e0c10', '#2a1a20', '#6a2a2a'], 'древний храм, запечатанный для всех, кроме джедаев; поле стазиса в центре', 'зов из темноты', 'Republic 32, статья Volfe Karkko'),
    kiffex_post: b('Киффекс: пост стражей Киффу', 'interior', ['night'], ['#141618', '#3a4048', '#7a8a8a'], 'охранный пост тюремной планеты: решётки, пульты, оружейная', 'холодно, казённо', 'Republic 32–33'),
    kiffex_cantina: b('Киффекс: кантина «Чёрная дыра»', 'interior', ['night'], ['#140e14', '#3a2030', '#8a4a3a'], 'грязная кантина заключённых, стойка, дым, маленький слепой повар', 'опасно', 'Republic 34'),
    kiffex_sanctum: b('Киффекс: святилище Каркко', 'temple', ['night'], ['#0a080c', '#2a0e14', '#7a1a1a'], 'внутренний зал храма: трон, где тысячу лет стоял стазис, тени одичавших анзати', 'ужас и власть', 'Republic 35'),
    kiffu_hall: b('Киффу: зал стражей', 'interior', ['day'], ['#2a2a30', '#5a5a6a', '#a0a0b0'], 'строгий зал правительницы Киффу, где Совет передаёт Эйлу Толму', 'суд и облегчение', 'Republic 35'),
    temple_garden: b('Корусант, Храм джедаев, Сад медитаций', 'temple', ['day', 'dusk'], ['#5a7a5a', '#c8b88a', '#7aa0c8'], 'каменный сад под открытым небом Корусанта: фонтан в центре, деревья, дорожки из светлого камня, вдали шпили Храма', 'тихо, светло', 'Heart of Fire (Dark Horse Extra 35–37)'),
    temple_hall: b('Храм: тренировочный зал', 'interior', ['day'], ['#3a3440', '#7a6a6a', '#c8b89a'], 'большой зал, маты, дроиды для спарринга, высокие окна', 'сосредоточенность', 'адаптация'),
    temple_archive: b('Храм: архив в Башне первого знания', 'interior', ['night'], ['#141828', '#2a3a5a', '#6a8ab0'], 'ряды голокронов и голокниг, синий свет, бюсты мастеров', 'тайна', 'Republic 32'),
    temple_council: b('Храм: зал Совета', 'interior', ['day'], ['#2a2a38', '#6a6a8a', '#d8c8a0'], 'круглый зал с двенадцатью креслами, окна на Корусант', 'торжественно', 'эпизод II'),
    temple_cell: b('Храм: келья Эйлы', 'interior', ['night'], ['#1a1820', '#3a3440', '#8a7a6a'], 'скромная келья: ложе, коврик для медитации, полка с кристаллами', 'покой', 'адаптация'),
    temple_pad: b('Храм: посадочная площадка', 'city', ['day', 'dusk'], ['#3a4a6a', '#8aa0c0', '#e0c8a0'], 'площадка у Храма, корабли, поток машин Корусанта', 'отъезд', 'адаптация'),
    intrepid_bridge: b('«Интрепид»: мостик', 'ship', ['night'], ['#0e1018', '#2a3040', '#6a7a9a'], 'мостик корабля, звёзды в окнах, пульты', 'дорога', 'Republic 36, Reversal of Fortune'),
    intrepid_gym: b('«Интрепид»: тренировочный отсек', 'ship', ['night'], ['#141418', '#3a3a44', '#7a7a8a'], 'отсек с матами, где Эйла разбирает память и потом спаррингует с Блаем', 'сосредоточенность', 'Reversal of Fortune'),
    fenn_feast: b('Рилот, дом Ро Фенна: пиршественный зал', 'interior', ['night'], ['#2a1414', '#6a2a1a', '#c8803a'], 'пир клана Фенн, низкие столы, рабы-слуги, светильники', 'тяжёлая роскошь', 'Republic 42'),
    fenn_study: b('Рилот, дом Ро Фенна: кабинет', 'interior', ['night'], ['#1a1414', '#4a2a20', '#8a5a3a'], 'кабинет главы клана, ширма, документы, голопроектор', 'заговор', 'Republic 42'),
    secura_chamber: b('Рилот: покои Ната Секуры', 'interior', ['night'], ['#141420', '#2a3048', '#6a7aa0'], 'детские покои наследника клана, окно на сумерки', 'беда ночью', 'Republic 42'),
    ordmantell_junk: b('Орд-Мантелл: свалка', 'desert', ['day'], ['#3a3a3a', '#7a6a5a', '#c0a080'], 'горы металлолома, остовы кораблей, пыль', 'драка, встреча', 'Republic 43'),
    kintan_wastes: b('Кинтан: Бескрайние пустоши', 'desert', ['day'], ['#3a1a14', '#8a4a2a', '#e0a060'], 'чёрные пески и скалы, жар, далёкая крепость', 'засада', 'Republic 44'),
    kintan_lava: b('Кинтан: река лавы', 'desert', ['dusk'], ['#140808', '#6a1a0a', '#f0702a'], 'широкая река лавы, камни, дым', 'смертельно', 'Republic 44'),
    kintan_fortress: b('Кинтан: крепость Х\'ариса Фенна', 'temple', ['night'], ['#100808', '#3a1a14', '#8a3a2a'], 'крепость над обрывом, темница, пыточная', 'жестокость', 'Republic 44–45'),
    wheel_casino: b('«Колесо»: казино', 'interior', ['night'], ['#140a20', '#4a1a5a', '#d060c0'], 'игорный зал огромной станции, неон, столы, толпа', 'шум и риск', 'Republic 49'),
    wheel_maint: b('«Колесо»: технические уровни', 'ship', ['night'], ['#0e0e14', '#2a2a3a', '#6a6a8a'], 'трубы, решётки, пар, громилы Зенекса', 'погоня', 'Republic 49'),
    wheel_office: b('«Колесо»: кабинет Зенекса', 'interior', ['night'], ['#140a14', '#3a1a2a', '#a04a6a'], 'роскошный кабинет криминального главы', 'опасная сделка', 'Republic 49'),
    kamino_platform: b('Камино: посадочная площадка', 'ocean', ['day'], ['#2a3438', '#6a7a80', '#c8d8d8'], 'площадка над штормовым океаном, дождь, Типока', 'буря', 'Tides of Terror'),
    kamino_lab: b('Камино: лаборатория клонирования', 'interior', ['day'], ['#c8d4d4', '#e8f0f0', '#8aa0a0'], 'белые залы, капсулы с клонами, мягкий свет', 'стерильно', 'Tides of Terror'),
    kamino_ocean: b('Камино: под водой', 'ocean', ['night'], ['#04080e', '#0a2a3a', '#2a6a7a'], 'тёмная вода, тонущий дроид, свет сверху', 'удушье', 'Tides of Terror'),
    hypori_wreck: b('Хайпори: убежище выживших', 'ship', ['night'], ['#100c0c', '#3a2a24', '#8a5a3a'], 'разбитое укрытие, искры, тени дроидов', 'отчаяние', 'Clone Wars (2003) 20–21'),
    devaron_suite: b('Деварон: покои сенатора', 'interior', ['day'], ['#3a1a20', '#8a3a3a', '#e0b080'], 'роскошные покои сенатора Вьен\'сай\'Маллок', 'светская ложь', 'Jedi: Aayla Secura'),
    devaron_hills: b('Деварон: холмы', 'forest', ['dusk'], ['#2a1414', '#7a3a2a', '#b0a050'], 'красные скалы и зелень, тропа к базе налётчиков', 'погоня', 'Jedi: Aayla Secura'),
    devaron_base: b('Деварон: база налётчиков', 'cave', ['night'], ['#100c10', '#3a2a2a', '#7a5a3a'], 'пещерная база с ангаром, обвал', 'ловушка', 'Jedi: Aayla Secura'),
    cavamina_cantina: b('Кавамина-Минор: кантина', 'interior', ['night'], ['#140e10', '#3a2424', '#8a5a3a'], 'кантина на луне, где гибнет конвой Эйлы', 'предательство', 'Deadly Hands of Shon-Ju'),
    shonju_castle: b('Кавамина-Минор: замок Шон-Джу', 'temple', ['day'], ['#2a2a30', '#6a6a6a', '#b0a890'], 'каменный замок, двор, где тренируются ученики', 'чужой дом', 'Deadly Hands of Shon-Ju'),
    duum_hq: b('Кавамина-Минор: штаб Дуума', 'ship', ['night'], ['#140808', '#4a1a10', '#f06a2a'], 'штаб с турбиной и бомбардировщиками, пожар', 'огонь', 'Deadly Hands of Shon-Ju'),
    holstice_hospital: b('Нью-Холстис: госпиталь', 'interior', ['day'], ['#d8dcd8', '#a0b0b0', '#6a7a7a'], 'республиканский госпиталь, койки, раненый Толм', 'тревога', 'Republic 68'),
    cruiser_deck: b('Крейсер 327-го: отсек отделения', 'ship', ['night'], ['#141418', '#3a3a40', '#c8a040'], 'отсек крейсера, жёлтые полосы 327-го, шлемы на полках', 'отдых между боями', 'адаптация'),
    honoghr_forest: b('Хоногр: умирающий лес', 'forest', ['day'], ['#2a2414', '#5a4a1a', '#c8b040'], 'лес, который губит жёлтый токсин, корабль «Гехенна» вдали', 'гибель', 'Republic 68'),
    honoghr_temple: b('Хоногр: ракатанский храм', 'temple', ['night'], ['#0e0e0c', '#2a2a1a', '#6a6a3a'], 'древний храм, хранилище в центре, знаки на двери', 'ловушка', 'Republic 68'),
    honoghr_ship: b('Хоногр: у корабля Воса', 'forest', ['dusk'], ['#1a140e', '#4a3a1a', '#a08a3a'], 'поляна у корабля, мёртвые деревья', 'разрыв', 'Republic 68'),
    anzat_cantina: b('Анзат: кантина «Мэггот»', 'interior', ['night'], ['#120e10', '#3a2a28', '#7a5a4a'], 'кантина, где хук Горт знает, где корабль Булка', 'слежка', 'Republic 72'),
    anzat_dock: b('Анзат: стоянка корабля Булка', 'city', ['night'], ['#0e0c14', '#2a2438', '#6a5a7a'], 'посадочная площадка, корабль Соры Булка', 'тайна', 'Republic 72–73'),
    saleucami_caverns: b('Салеуками: магмовые пещеры', 'cave', ['night'], ['#140808', '#5a1a0a', '#e06a2a'], 'пещеры с магмой, лазерные ворота', 'жар', 'Republic 74–77'),
    saleucami_complex: b('Салеуками: комплекс клонирования моргукаев', 'interior', ['night'], ['#0e0c10', '#3a2020', '#8a3a3a'], 'капсулы с клонами Бока, генераторы щита', 'угроза', 'Republic 74–77'),
    felucia_jungle: b('Фелуция: грибные джунгли', 'jungle', ['day'], ['#1a3a2a', '#4a8a3a', '#e08ab0'], 'огромные грибы, яркие цвета, споры в воздухе, акклеи', 'буйство и опасность', 'Battlefront II'),
    felucia_nigkoe: b('Фелуция: тюрьма Нигко', 'interior', ['day'], ['#1a2420', '#3a5a4a', '#8ab08a'], 'тюрьма Торговой гильдии среди грибов', 'спасение', 'Reversal of Fortune'),
    felucia_kwayteow: b('Фелуция: база Шу Май у Квай-Теоу', 'jungle', ['dusk'], ['#102018', '#3a6a4a', '#d08a4a'], 'база за озером и водопадом', 'пустая база', 'Reversal of Fortune'),
    felucia_camp: b('Фелуция: лагерь Республики', 'jungle', ['night'], ['#0a1410', '#2a4a3a', '#c8a040'], 'палатки, периметр, ручей, светящиеся грибы', 'последний отдых', 'адаптация'),
    felucia_niango: b('Фелуция: станция очистки у Ниянго', 'jungle', ['day'], ['#1a3020', '#5a8a4a', '#f0c070'], 'станция очистки воды среди огромных грибов, небо', 'тишина перед выстрелом', 'Reversal of Fortune, эпизод III'),
    endor_forest: b('Эндор: лес', 'forest', ['day'], ['#14200e', '#3a5a24', '#9ab06a'], 'гигантские деревья, дома эвоков наверху, брошенный пост сепаратистов', 'сказка', 'What Goes Up...'),
    endor_cave: b('Эндор: Пасть Горы', 'cave', ['night'], ['#0a0a08', '#2a2418', '#6a5a3a'], 'пещера у вершины, куча костей у входа', 'чудовище', 'What Goes Up...')
  };

  L.cg = {
    heart_of_fire: c('Сердце огня', 'pro', 'ладони Эйлы протягивают Сиань светящийся камень с Киффу; камень светится изнутри, как уголь; у фонтана Сада медитаций', 'тепло, доверие', 'Heart of Fire (Dark Horse Extra 35–37)'),
    glitteryll: c('Глиттерилл', 'pro', 'стакан с мерцающим напитком у губ оглушённой Эйлы, над ней силуэт Пола', 'потеря', 'Republic 22, статья Glitteryll'),
    your_saber: c('Это твой меч', 'ch1', 'Вос протягивает Эйле её световой меч, она смотрит на него, не узнавая', 'надежда и пустота', 'Republic 22'),
    balcony: c('Балкон', 'ch1', 'толчок Силы сбрасывает Пола и Воса с балкона, Эйла с вытянутой рукой', 'ужас', 'Republic 22'),
    pod: c('Капсула над Киффексом', 'ch1', 'капсула падает к Киффексу, позади взрыв корабля контрабандистов', 'одиночество', 'Republic 32'),
    release: c('Освобождение', 'ch2', 'Эйла касается поля стазиса, Каркко открывает глаза', 'искушение', 'Republic 32'),
    cantina: c('Кантина', 'ch2', 'клинок Эйлы против клинка Воса в дыму кантины «Чёрная дыра»', 'ярость', 'Republic 34'),
    sanctum: c('Святилище', 'ch2', 'Эйла опускает клинок перед Восом, Каркко на троне позади', 'узнавание', 'Republic 35'),
    lightning: c('Молния', 'ch2', 'молния Каркко бьёт Эйлу, Вос бросается вперёд', 'боль', 'Republic 35'),
    kiffu_council: c('Совет на Киффу', 'ch2', 'Мейс Винду, Ади Галлия и Пло Кун перед Эйлой и Толмом, Вос уходит в стороне', 'суд и прощание', 'Republic 35'),
    yoda: c('Йода', 'int', 'Йода и Эйла в саду Храма, он смотрит снизу вверх, она опустила голову', 'утешение', 'раздел Return to Coruscant'),
    blue_blade: c('Синий клинок', 'int', 'Эйла в медитации, над ладонями парят части рукояти и синий кристалл', 'новое начало', 'раздел Equipment'),
    servant: c('Служанка', 'ch3', 'Эйла с подносом в доме Ро Фенна слушает разговор за ширмой (кадр на лице и руках)', 'опасная роль', 'Republic 42'),
    junkyard: c('Свалка', 'ch3', 'Эйла и Вос спиной к спине среди металлолома Орд-Мантелла', 'снова вместе', 'Republic 43'),
    lava: c('Лава', 'ch3', 'Эйла в прыжке над рекой лавы, Бок цепляется за её ноги', 'риск', 'Republic 44'),
    knighting: c('Посвящение', 'ch3', 'Совет посвящает Эйлу в рыцари, Вос рядом', 'гордость', 'Republic 45'),
    arena: c('Арена', 'ch4', 'круг выживших джедаев под прицелом на арене Джеонозиса, канонерки в небе', 'спасение', 'эпизод II'),
    jayzaa: c('Джейзаа', 'ch4', 'Эйла-механик в очках в техническом коридоре «Колеса»', 'игра в роль', 'Republic 49'),
    underwater: c('Под водой', 'ch4', 'Кит Фисто дышит за Эйлу под водой Камино', 'близость', 'Tides of Terror'),
    hypori: c('Хайпори', 'ch4', 'Гривус бросает Эйлу в потолок, внизу павшие джедаи', 'поражение', 'Clone Wars (2003) 20–21'),
    bly: c('Блай', 'ch4', 'коммандер Блай отдаёт честь Эйле в госпитале', 'начало дружбы', 'раздел Clone Wars'),
    vos_holo: c('Голограмма Воса', 'ch5', 'голограмма Воса объявляет, что он ушёл к Конфедерации; Эйла смотрит', 'измена', 'Jedi: Aayla Secura'),
    antenna: c('Антенна', 'ch5', 'клинок Эйлы срезает антенну Аурры Синг', 'покой против ярости', 'Jedi: Aayla Secura'),
    shonju: c('Шон-Джу', 'ch5', 'Шон-Джу спасает раненую Эйлу от Сабата', 'чужое спасение', 'Deadly Hands of Shon-Ju'),
    laugh: c('Смех', 'ch5', 'Шон-Джу держит Эйлу за лекку, она смеётся; огонь вокруг', 'свобода', 'Deadly Hands of Shon-Ju'),
    found: c('Найденное', 'ch5', 'Йода и Эйла в Храме, на её лице покой', 'перелом', 'Deadly Hands of Shon-Ju'),
    bly_shoots: c('Блай стреляет', 'ch6', 'Блай стреляет в Воса, Эйла поднимает клинок, чтобы отбить выстрелы', 'раскол', 'Republic 68'),
    honoghr: c('Хоногр', 'ch6', 'жёлтый токсин стекает по склонам Хоногра, лес умирает', 'гибель мира', 'Republic 68'),
    bok_gate: c('Бок и ворота', 'ch6', 'толчок Эйлы бросает Бока в лазерные ворота', 'конец мести', 'Republic 74–77'),
    hand_dark: c('Рука во тьме', 'ch6', 'в медитации Эйла протягивает руку Восу в темноте', 'спасение', 'Republic 74–77'),
    sparring: c('Спарринг', 'ch7', 'Эйла и Блай в рукопашной на «Интрепиде», оба улыбаются', 'дружба', 'Reversal of Fortune'),
    bravest: c('Храбрейшие', 'ch7', 'Эйла с двумя клинками перед солдатами 501-го у ожившего шагохода', 'уважение', 'Battlefront II'),
    waterfall: c('Водопад', 'ch7', 'джедаи прыгают в реку и летят вниз по водопаду к базе Шу Май', 'азарт', 'Reversal of Fortune'),
    bird: c('Птица', 'ch7', 'Эйла смотрит на фелуцианскую птицу над грибами, за её спиной Блай', 'покой', 'эпизод III'),
    forest_spirit: c('Лесной дух', 'ch7', 'картина эвоков: синий лесной дух убивает Зверя в Пасти Горы', 'память', 'What Goes Up...'),
    end_felucia: c('Фелуция', 'end', 'небо над грибами и улетающая птица; тела не видно', 'тихая утрата', 'эпизод III'),
    end_other: c('Иная память', 'end', 'Эйла уходит в джунгли, Блай с опущенным оружием смотрит ей вслед', 'выбор', 'адаптация'),
    end_dark: c('Тьма Киффекса', 'end', 'Эйла одна в джунглях, клинок погашен, в глазах отсвет', 'холод', 'адаптация'),
    legacy: c('Наследие', 'end', 'люди разных миров, которые помнят Эйлу: эвоки у картины, солдат с дневником, Вос на Киффу', 'память', 'раздел Legacy'),
    bond_vos: c('Связь: Вос', 'bond', 'Вос и Эйла на крыше Храма, он показывает ей звёзды Киффу', 'отцовская близость', 'адаптация'),
    bond_tholme: c('Связь: Толм', 'bond', 'Толм учит Эйлу растворяться в тени', 'доверие', 'адаптация'),
    bond_kit: c('Связь: Кит', 'bond', 'Кит и Эйла у окна Храма, лекку и щупальца почти касаются', 'отпущенная любовь', 'Tides of Terror'),
    bond_bly: c('Связь: Блай', 'bond', 'Блай снимает шлем перед Эйлой у костра', 'доверие', 'адаптация'),
    bond_traa: c('Связь: Т\'ра Саа', 'bond', 'Т\'ра Саа и Эйла медитируют среди корней', 'терпение', 'адаптация'),
    bond_villie: c('Связь: Вилли', 'bond', 'Вилли бросает Эйле фишку на счастье в кабине «Инферно»', 'смех', 'адаптация'),
    bond_secura: c('Связь: клан Секура', 'bond', 'Лон и Нат встречают Эйлу у входа в пещерный город', 'дом', 'адаптация'),
    bond_ekria: c('Связь: Экрия', 'bond', 'Экрия держит Сердце огня, свет камня на её лице', 'передача', 'адаптация')
  };

  L.still = {
    wampa: s('Вампа', '46 ДБЯ', 'двухлетняя Эйла у вырвавшейся вампы зовёт через Силу, подросток-падаван Вос бросается к ней', EARLY),
    tholme_test: s('Испытание', '46 ДБЯ', 'Толм проверяет маленькую Эйлу для Храма, Вос рядом', EARLY),
    temple_years: s('Годы у Толма', '46–38 ДБЯ', 'Эйла-ученица на тренировке у Толма в Храме', EARLY),
    padawan: s('Падаван', 'около 38 ДБЯ', 'Вос берёт десятилетнюю Эйлу в падаваны', EARLY),
    heart13: s('Тринадцать лет', 'около 35 ДБЯ', 'Вос дарит Эйле Сердце огня на тринадцатилетие', EARLY),
    tda: s('Т\'да', '', 'Эйла и Вос хоронят зверька Т\'да на Фелуции', EARLY),
    lodi: s('Тайна лоди', '', 'Эйла и Вос разгадывают тайну лоди на Солибусе IV', EARLY),
    xoman: s('Ксоман III', '', 'Эйла и Вос спасают принцессу от пиратов небесных лодок', EARLY),
    terbeasts: s('Тербисты', '', 'Эйла и Вос против тербистов Огдена-Минор', EARLY),
    stark: s('Война Старка', '44 ДБЯ', 'пустое место: рассказ Воса забыт; потом сюда ложится рассказ ветеранов', 'Republic 36–39'),
    tatooine: s('Татуин', '32 ДБЯ', 'Эйла под прикрытием на Татуине, пока там застрял Квай-Гон', EARLY),
    ryloth_stun: s('Рилот', '31 ДБЯ', 'Асанте Вос стреляет Эйле в спину в рилловой шахте', 'Republic 21, статья Asanté Vos')
  };

  const rgbCache = new Map();
  const rgb = hex => {
    if (Array.isArray(hex)) return hex;
    let v = rgbCache.get(hex);
    if (!v) {
      const n = parseInt(hex.slice(1), 16);
      v = [n >> 16, (n >> 8) & 255, n & 255];
      rgbCache.set(hex, v);
    }
    return v;
  };
  const scale = (col, k) => rgb(col).map(v => Math.max(0, Math.min(255, Math.round(v * k))));
  const blend = (a, b2, f) => rgb(a).map((v, i) => Math.round(v * (1 - f) + rgb(b2)[i] * f));
  Art.rgb = rgb;
  Art.scale = scale;

  Art.Raster = class {
    constructor(w, h) {
      this.w = w;
      this.h = h;
      this.data = new Uint8ClampedArray(w * h * 4);
    }

    set(x, y, col) {
      x |= 0;
      y |= 0;
      if (x < 0 || y < 0 || x >= this.w || y >= this.h) return;
      const c = rgb(col), i = (y * this.w + x) * 4;
      this.data[i] = c[0];
      this.data[i + 1] = c[1];
      this.data[i + 2] = c[2];
      this.data[i + 3] = 255;
    }

    alpha(x, y) {
      if (x < 0 || y < 0 || x >= this.w || y >= this.h) return 0;
      return this.data[(y * this.w + x) * 4 + 3];
    }

    rect(x, y, w, h, col) {
      for (let yy = Math.round(y); yy < Math.round(y + h); yy++) for (let xx = Math.round(x); xx < Math.round(x + w); xx++) this.set(xx, yy, col);
    }

    ellipse(cx, cy, rx, ry, col) {
      for (let y = Math.floor(cy - ry); y <= Math.ceil(cy + ry); y++) {
        const dy = (y + 0.5 - cy) / ry;
        if (Math.abs(dy) > 1) continue;
        const half = rx * Math.sqrt(1 - dy * dy);
        for (let x = Math.round(cx - half); x < Math.round(cx + half); x++) this.set(x, y, col);
      }
    }

    poly(pts, col) {
      const ys = pts.map(p => p[1]);
      for (let y = Math.floor(Math.min(...ys)); y <= Math.ceil(Math.max(...ys)); y++) {
        const xs = [];
        for (let i = 0; i < pts.length; i++) {
          const a = pts[i], b2 = pts[(i + 1) % pts.length];
          const yc = y + 0.5;
          if ((a[1] <= yc && b2[1] > yc) || (b2[1] <= yc && a[1] > yc)) xs.push(a[0] + (yc - a[1]) / (b2[1] - a[1]) * (b2[0] - a[0]));
        }
        xs.sort((p, q) => p - q);
        for (let i = 0; i + 1 < xs.length; i += 2) for (let x = Math.round(xs[i]); x < Math.round(xs[i + 1]); x++) this.set(x, y, col);
      }
    }

    curve(p0, p1, p2, width, col) {
      const n = Math.ceil(Math.hypot(p1[0] - p0[0], p1[1] - p0[1]) + Math.hypot(p2[0] - p1[0], p2[1] - p1[1]));
      for (let i = 0; i <= n; i++) {
        const t = i / n, u = 1 - t;
        const x = u * u * p0[0] + 2 * u * t * p1[0] + t * t * p2[0], y = u * u * p0[1] + 2 * u * t * p1[1] + t * t * p2[1];
        const r = typeof width === 'function' ? width(t) : width / 2;
        this.ellipse(x, y, r, r, col);
      }
    }

    line(x0, y0, x1, y1, col) {
      const n = Math.max(Math.abs(x1 - x0), Math.abs(y1 - y0), 1);
      for (let i = 0; i <= n; i++) this.set(Math.round(x0 + (x1 - x0) * i / n), Math.round(y0 + (y1 - y0) * i / n), col);
    }

    outline(col) {
      const add = [];
      for (let y = 0; y < this.h; y++) for (let x = 0; x < this.w; x++) {
        if (this.alpha(x, y)) continue;
        if (this.alpha(x - 1, y) || this.alpha(x + 1, y) || this.alpha(x, y - 1) || this.alpha(x, y + 1)) add.push([x, y]);
      }
      add.forEach(p => this.set(p[0], p[1], col));
    }

    dither(x, y, w, h, colors) {
      const n = colors.length - 1;
      for (let yy = 0; yy < h; yy++) {
        const v = (yy / h) * n, i = Math.min(n - 1, Math.floor(v)), f = v - i;
        for (let xx = 0; xx < w; xx++) this.set(x + xx, y + yy, f * 16 > BAYER[(yy & 3) * 4 + (xx & 3)] ? colors[i + 1] : colors[i]);
      }
    }

    count() {
      let n = 0;
      for (let i = 3; i < this.data.length; i += 4) if (this.data[i]) n++;
      return n;
    }

    canvas() {
      const c = document.createElement('canvas');
      c.width = this.w;
      c.height = this.h;
      const g = c.getContext('2d');
      const img = g.createImageData(this.w, this.h);
      img.data.set(this.data);
      g.putImageData(img, 0, 0);
      return c;
    }
  };

  const LEKKU_PATHS = {
    still: s => [[29 * s, 115], [31 * s, 165]],
    down: s => [[24 * s, 125], [23 * s, 190]],
    up: s => [[39 * s, 100], [48 * s, 125]],
    tense: s => [[40 * s, 105], [55 * s, 135]],
    twitch: s => [[29 * s, 115], [31 * s, 165]],
    hello: s => (s > 0 ? [[43, 95], [46, 70]] : [[-29, 115], [-31, 165]]),
    bye: s => (s < 0 ? [[-30, 125], [-37, 190]] : [[29, 115], [31, 165]]),
    love: s => [[25 * s, 120], [-15 * s, 160]],
    insult: s => [[35 * s, 85], [50 * s, 75]]
  };

  Art.lekkuPath = (pose, side, frame) => {
    const p = (LEKKU_PATHS[pose] || LEKKU_PATHS.still)(side);
    const wob = pose === 'twitch' && frame ? 2 : 0;
    return [[17 * side, 75], p[0], [p[1][0] + wob * side, p[1][1]]];
  };

  const FEATURES = {
    twilek: { band: true }, kiffar: { dreads: true, mark: true }, human: {}, nautolan: { tentacles: true },
    clone: { clone: true }, devaronian: { horns: true }, neti: { bark: true, tendrils: true, big: true }, anzat: { long: true },
    veknoid: { big: true }, yoda: { ears: true, small: true }, keldor: { mask: true }, tholothian: { tails: true },
    nikto: { ridges: true }, falleen: { topknot: true, scales: true }, kaminoan: { neck: true }, cyborg: { skull: true },
    cerean: { tall: true, beard: true }, palliduvan: { topknot: true, antenna: true }, weequay: { braids: true, wrinkles: true },
    mirialan: { marks: true }, selonian: { fur: true, snout: true }
  };
  Art.FEATURES = FEATURES;

  Art.bustPixels = (who, b, frame) => {
    const c = A.CAST[who], R = new Art.Raster(140, 200), cx = 70;
    if (!c) return R;
    const f = Object.assign({}, FEATURES[c.kind] || {});
    const outfit = c.outfits[b.outfit] || Object.values(c.outfits)[0];
    const skin = c.skin, shadeSkin = scale(skin, 0.8), dark = scale(skin, 0.6), ink = '#1a1018';
    const cloth = outfit.cloth, trim = outfit.trim, hair = c.hair;
    const helmet = c.kind === 'clone' && b.outfit !== 'bare';
    const k = c.child ? 0.82 : 1, hy = c.child ? 100 : f.small ? 104 : f.neck ? 62 : f.tall ? 84 : 90;
    const rx = (f.big ? 27 : c.stout ? 27 : 23) * k, ry = (f.tall ? 38 : f.big ? 31 : 30) * k;
    const lek = (side, col, w) => {
      const p = Art.lekkuPath(b.lekku || 'still', side, frame).map(q => [cx + q[0] * k, q[1] * k + (hy - 90 * k)]);
      R.curve(p[0], p[1], p[2], t => (w / 2) * (1 - t * 0.55), col);
    };
    if (c.lekku && b.lekku !== 'love') lek(1, shadeSkin, 13);
    if (f.tentacles) for (let i = -2; i <= 2; i++) if (i) R.curve([cx + i * 8, hy - 10], [cx + i * 16, hy + 30], [cx + i * 18, hy + 70], t => 4 * (1 - t * 0.5), shadeSkin);
    if (f.dreads && hair) for (let i = -4; i <= 4; i++) R.rect(cx + i * 6 - 2, hy - 32 + Math.abs(i) * 2, 5, 64 - Math.abs(i) * 3, hair);
    const longHair = c.long || f.long;
    if (longHair && hair) R.rect(cx - rx - 2, hy - 20, rx * 2 + 4, 60, hair);
    const sw = c.stout ? 44 : 36, bw = c.stout ? 70 : 60, top = f.neck ? 150 : 134 * (c.child ? 1.08 : 1);
    R.poly([[cx - sw, top], [cx + sw, top], [cx + bw, 200], [cx - bw, 200]], cloth);
    R.rect(cx - sw, top, sw * 2, 4, trim);
    if (c.kind === 'clone') {
      R.rect(cx - sw, top + 10, sw * 2, 6, '#c8c8c0');
      R.rect(cx - sw + 6, top + 18, 10, 30, c.mark || '#e0b020');
    }
    R.rect(cx - 9 * k, hy + ry - 8, 18 * k, f.neck ? top - hy - ry + 10 : 20, skin);
    if (f.neck) R.rect(cx - 9, hy + ry - 8, 18, top - (hy + ry - 8), skin);
    R.ellipse(cx, hy, rx, ry, skin);
    if (f.tall) R.ellipse(cx, hy - 22, rx * 0.9, ry * 0.7, skin);
    if (f.ears) {
      R.poly([[cx - rx + 2, hy - 4], [cx - rx - 22, hy - 14], [cx - rx + 2, hy + 6]], skin);
      R.poly([[cx + rx - 2, hy - 4], [cx + rx + 22, hy - 14], [cx + rx - 2, hy + 6]], skin);
    }
    if (f.bark) for (let i = 0; i < 9; i++) R.line(cx - 18 + i * 4, hy - 24 + (i % 3) * 6, cx - 20 + i * 4, hy + 20, dark);
    if (f.tendrils && hair) for (let i = -3; i <= 3; i++) R.curve([cx + i * 6, hy - ry + 4], [cx + i * 10, hy - ry - 14], [cx + i * 16, hy - ry - 24], 2, hair);
    if (f.horns && !c.female) {
      R.poly([[cx - 14, hy - 24], [cx - 10, hy - 42], [cx - 6, hy - 26]], '#e8dcc0');
      R.poly([[cx + 14, hy - 24], [cx + 10, hy - 42], [cx + 6, hy - 26]], '#e8dcc0');
    }
    if (f.ridges) for (let i = -2; i <= 2; i++) R.poly([[cx + i * 9 - 3, hy - ry + 6], [cx + i * 9, hy - ry - 4], [cx + i * 9 + 3, hy - ry + 6]], dark);
    if (f.tails) {
      R.curve([cx - 14, hy - 20], [cx - 36, hy - 10], [cx - 34, hy + 40], 4, shadeSkin);
      R.curve([cx + 14, hy - 20], [cx + 36, hy - 10], [cx + 34, hy + 40], 4, shadeSkin);
      R.rect(cx - 20, hy - 30, 40, 6, trim);
    }
    if (f.topknot && hair) {
      R.ellipse(cx, hy - ry - 2, 6, 6, hair);
      R.curve([cx, hy - ry - 4], [cx + 18, hy - ry - 10], [cx + 26, hy + 10], 3, hair);
    }
    if (f.antenna) {
      R.line(cx - 8, hy - ry + 6, cx - 20, hy - ry - 22, '#8a8a90');
      R.rect(cx - 22, hy - ry - 25, 4, 4, '#d04030');
    }
    if (f.braids && hair) for (const s of [-1, 1]) R.curve([cx + s * 16, hy - 10], [cx + s * 26, hy + 20], [cx + s * 22, hy + 50], 3, hair);
    if (f.fur) for (let i = 0; i < 30; i++) R.set(cx - 20 + (i * 7) % 40, hy - 20 + ((i * 13) % 40), dark);
    if (f.snout) R.ellipse(cx, hy + 14, 10, 7, shadeSkin);
    if (f.scales) for (let i = 0; i < 14; i++) R.set(cx - 16 + (i * 9) % 32, hy - 18 + ((i * 11) % 34), dark);
    if (f.wrinkles) for (let i = 0; i < 4; i++) R.line(cx - 14, hy - 16 + i * 8, cx + 14, hy - 16 + i * 8, dark);
    if (c.kind === 'human' || c.kind === 'anzat' || c.kind === 'clone' || c.kind === 'cerean') {
      if (hair) R.ellipse(cx, hy - ry + 10, rx + (longHair ? 2 : 1), longHair ? 15 : 14, hair);
    }
    if (f.band) R.rect(cx - rx, hy - 22 * k, rx * 2, 5, trim);
    if (f.dreads && hair) R.ellipse(cx, hy - ry + 8, rx, 12, hair);
    if (c.lekku && b.lekku !== 'love') lek(-1, skin, 13);
    if (c.lekku && b.lekku === 'love') {
      lek(1, shadeSkin, 13);
      lek(-1, skin, 13);
    }
    if (helmet) {
      R.ellipse(cx, hy - 2, rx + 4, ry + 3, '#dcdcd4');
      R.rect(cx - rx - 2, hy + 6, rx * 2 + 4, 20, '#dcdcd4');
      R.rect(cx - 14, hy - 4, 28, 6, '#1a1a1e');
      R.rect(cx - 3, hy - 4, 6, 24, '#1a1a1e');
      R.rect(cx - rx - 2, hy - 18, rx * 2 + 4, 4, c.mark || '#e0b020');
      if (b.outfit === 'phase2') R.rect(cx - rx - 6, hy - 22, rx * 2 + 12, 4, '#9a9a94');
      return R;
    }
    if (f.mask) {
      R.rect(cx - 16, hy + 2, 32, 16, '#3a3a3a');
      R.rect(cx - 20, hy - 12, 40, 9, '#141414');
    }
    if (f.skull) {
      R.ellipse(cx, hy - 2, rx - 4, ry - 6, '#e8e0c8');
      R.rect(cx - 18, hy - 8, 12, 6, c.eyes);
      R.rect(cx + 6, hy - 8, 12, 6, c.eyes);
      return R;
    }
    if (f.mark && c.mark) R.rect(cx - rx + 3, hy + 2, rx * 2 - 6, 3, c.mark);
    if (f.marks) for (const s of [-1, 1]) R.rect(cx + s * 9 - 2, hy + 4, 4, 4, '#2a3a2a');
    if (f.beard) R.poly([[cx - 12, hy + 16], [cx + 12, hy + 16], [cx, hy + 40]], hair || '#d8d8d0');
    if (c.goatee && hair) {
      R.rect(cx - 6, hy + 10, 12, 2, hair);
      R.rect(cx - 3, hy + 17, 6, 5, hair);
    }
    if (c.scars) {
      R.line(cx - 16, hy - 12, cx - 4, hy + 14, dark);
      R.line(cx + 4, hy - 16, cx + 14, hy + 8, dark);
    }
    if (!f.mask) Art.facePixels(R, cx, hy, b.face, c, k);
    if (c.cyber) R.rect(cx + 5, hy - 4, 7, 4, '#c03020');
    return R;
  };

  Art.facePixels = (R, cx, cy, face, c, k) => {
    const ink = '#1a1018', eye = c.eyes || ink, white = '#f0ece0';
    const wide = face === 'surprised' || face === 'afraid';
    const look = face === 'thoughtful' ? 2 : 0;
    const big = c.kind === 'kaminoan' || c.kind === 'veknoid';
    for (const s of [-1, 1]) {
      const ex = cx + s * 9 * k + look;
      if (big) {
        R.ellipse(ex, cy - 2, 5, 6, c.eyes || ink);
        continue;
      }
      R.rect(ex - 3, cy - 4 - (wide ? 1 : 0), 6, wide ? 4 : 3, white);
      R.rect(ex - 1 + look, cy - 4 - (wide ? 1 : 0), 3, wide ? 4 : 3, eye);
      const by = cy - 8;
      if (face === 'angry') R.line(ex - 4, by - 2 * s * -1 - 1, ex + 4, by + 2 * s * -1 - 1, ink);
      else if (face === 'sad' || face === 'afraid') R.line(ex - 4, by + 1 * s, ex + 4, by - 1 * s, ink);
      else if (face === 'resolute') R.line(ex - 4, by, ex + 4, by, ink);
      else R.line(ex - 3, by - 1, ex + 3, by - 1, scale(c.skin, 0.55));
    }
    const my = cy + 13 * k;
    if (face === 'smile' || face === 'shy') { R.line(cx - 5, my, cx - 3, my + 2, ink); R.line(cx - 3, my + 2, cx + 3, my + 2, ink); R.line(cx + 3, my + 2, cx + 5, my, ink); }
    else if (face === 'laugh') { R.rect(cx - 5, my, 10, 2, ink); R.rect(cx - 4, my + 2, 8, 3, '#6a1a2a'); }
    else if (face === 'sad' || face === 'afraid') { R.line(cx - 5, my + 3, cx - 3, my + 1, ink); R.line(cx - 3, my + 1, cx + 3, my + 1, ink); R.line(cx + 3, my + 1, cx + 5, my + 3, ink); }
    else if (face === 'surprised') R.ellipse(cx, my + 2, 3, 3, ink);
    else if (face === 'angry') R.rect(cx - 5, my + 1, 10, 2, ink);
    else R.rect(cx - 4, my + 1, 8, 1, ink);
    if (face === 'shy') { R.rect(cx - 17, cy + 4, 6, 2, '#d06a8a'); R.rect(cx + 11, cy + 4, 6, 2, '#d06a8a'); }
  };

  Art.bgPixels = (id, time) => {
    const info = L.bg[id], R = new Art.Raster(320, 240);
    const k = time === 'dusk' ? 0.75 : time === 'night' ? 0.5 : time === 'dawn' ? 0.85 : 1;
    const cols = (info ? info.colors : ['#222222', '#444444', '#333333']).map(col => scale(col, k));
    R.dither(0, 0, 320, 240, cols);
    const rnd = A.rng([...id].reduce((h, ch) => (h * 31 + ch.charCodeAt(0)) >>> 0, 7));
    const deep = scale(cols[0], 0.6), mid = blend(cols[0], cols[1], 0.5), lit = cols[2];
    const scene = info ? info.scene : 'interior';
    if (scene === 'interior' || scene === 'ship') {
      R.rect(0, 170, 320, 70, deep);
      for (let x = -160; x <= 480; x += 40) R.line(160, 150, x, 240, mid);
      for (let i = 0; i < 4; i++) { const x = 20 + i * 90 + rnd() * 20; R.rect(x, 40, 14, 130, mid); R.rect(x - 3, 36, 20, 6, lit); }
      if (scene === 'ship') { R.rect(100, 50, 120, 60, '#06060c'); for (let i = 0; i < 30; i++) R.set(102 + rnd() * 116, 52 + rnd() * 56, '#e8e8f0'); }
    } else if (scene === 'city') {
      for (let x = 0; x < 320; x += 18) { const h = 40 + rnd() * 110; R.rect(x, 240 - h, 16, h, deep); for (let y = 240 - h + 6; y < 236; y += 8) if (rnd() > 0.5) R.rect(x + 4, y, 3, 3, lit); }
    } else if (scene === 'cave') {
      for (let x = 0; x < 320; x += 8) { R.rect(x, 0, 8, 10 + rnd() * 40, deep); R.rect(x, 200 - rnd() * 30, 8, 60, deep); }
      for (let i = 0; i < 8; i++) R.poly([[30 + i * 38, 0], [44 + i * 38, 0], [37 + i * 38, 30 + rnd() * 40]], mid);
    } else if (scene === 'desert') {
      for (let i = 0; i < 3; i++) for (let x = 0; x < 320; x++) { const y = 150 + i * 30 + Math.sin(x / (30 + i * 12) + i) * 10; R.rect(x, y, 1, 240 - y, i === 2 ? deep : mid); }
    } else if (scene === 'temple') {
      R.rect(0, 190, 320, 50, deep);
      for (let i = 0; i < 6; i++) { R.rect(20 + i * 52, 60, 16, 130, mid); R.rect(16 + i * 52, 54, 24, 8, lit); }
      R.ellipse(160, 120, 40, 50, deep);
    } else if (scene === 'ocean') {
      for (let y = 140; y < 240; y += 6) for (let x = 0; x < 320; x += 12) R.rect(x + ((y / 6) % 2) * 6, y, 8, 2, lit);
      for (let i = 0; i < 80; i++) { const x = rnd() * 320, y = rnd() * 140; R.line(x, y, x - 3, y + 8, mid); }
    } else if (scene === 'forest') {
      for (let i = 0; i < 9; i++) { const x = rnd() * 320, w = 12 + rnd() * 20; R.rect(x, 0, w, 240, deep); }
      R.rect(0, 210, 320, 30, mid);
    } else if (scene === 'jungle') {
      for (let i = 0; i < 7; i++) { const x = 20 + rnd() * 280, h = 60 + rnd() * 100; R.rect(x - 4, 240 - h, 8, h, mid); R.ellipse(x, 240 - h, 22 + rnd() * 20, 10 + rnd() * 6, i % 2 ? lit : '#e08ab0'); }
    }
    return R;
  };

  Art.stillPixels = id => {
    const R = new Art.Raster(320, 240);
    R.dither(0, 0, 320, 240, ['#3a2a1a', '#8a6a42', '#d8bc8a', '#8a6a42']);
    for (let y = 0; y < 240; y++) for (let x = 0; x < 320; x++) {
      const d = Math.hypot((x - 160) / 160, (y - 120) / 120);
      if (d > 0.85 && (d - 0.85) * 64 > BAYER[(y & 3) * 4 + (x & 3)]) R.set(x, y, '#1a120a');
    }
    return R;
  };

  Art.files = kind => Object.keys(Art.FILES).filter(p => p.startsWith(kind + '/'));
  Art.bustFile = (who, outfit, face) => `bust/${who}_${outfit}_${face}.png`;
  Art.lekkuFile = (who, outfit, pose) => `bust/${who}_${outfit}_lekku_${pose}.png`;
  Art.bgFile = (id, time) => `bg/${id}_${time || 'day'}.png`;
  Art.cgFile = id => `cg/${id}.png`;
  Art.stillFile = id => `still/${id}.png`;
  Art.ROOT = 'content/aayla98/';

  const images = new Map(), canvases = new Map();
  Art.image = file => {
    if (!Art.FILES[file] || typeof Image === 'undefined') return null;
    let img = images.get(file);
    if (!img) {
      img = new Image();
      img.src = Art.ROOT + file;
      images.set(file, img);
    }
    return img.complete && img.naturalWidth ? img : null;
  };

  const cached = (key, make) => {
    let c = canvases.get(key);
    if (!c) {
      c = make().canvas();
      canvases.set(key, c);
    }
    return c;
  };
  Art.clearCache = () => canvases.clear();

  Art.drawBust = (g, who, b, dim, t) => {
    const c = A.CAST[who];
    if (!c) return;
    const cx = Art.SLOT_X[b.slot] || 320, x = cx - Art.BUST.w / 2, y = Art.BUST.top;
    if (dim) g.filter = 'brightness(55%)';
    const real = Art.image(Art.bustFile(who, b.outfit, b.face));
    if (real) {
      g.drawImage(real, x, y);
      const lk = c.lekku && Art.image(Art.lekkuFile(who, b.outfit, b.lekku || 'still'));
      if (lk) g.drawImage(lk, x, y);
    } else {
      const frame = b.lekku === 'twitch' ? Math.floor((t || 0) * 12) % 2 : 0;
      const canvas = cached(`bust:${who}:${b.outfit}:${b.face}:${b.lekku}:${frame}`, () => Art.bustPixels(who, b, frame));
      g.imageSmoothingEnabled = false;
      g.drawImage(canvas, x, y - 70, Art.BUST.w, Art.BUST.h);
      Art.bustCaption(g, who, b, cx, dim);
    }
    g.filter = 'none';
  };

  Art.bustCaption = (g, who, b, cx, dim) => {
    const c = A.CAST[who], F = A.Font, outfit = c.outfits[b.outfit] || Object.values(c.outfits)[0];
    const caps = [`${c.name} · ${outfit.name}`, A.FACE_NAMES[b.face] || b.face];
    if (c.lekku) caps.push('лекку: ' + (A.LEKKU[b.lekku] || b.lekku));
    const w = Math.max(...caps.map(s2 => F.measure('text', s2))) + 12, top = 40;
    g.fillStyle = 'rgba(8,6,14,0.7)';
    g.fillRect(Math.round(cx - w / 2), top - 2, w, caps.length * 16 + 4);
    caps.forEach((s2, i) => F.draw(g, 'text', s2, Math.round(cx - F.measure('text', s2) / 2), top + i * 16, dim ? '#b0a8b8' : '#efe4cc'));
  };

  const plate = (g, x, y, text, font, color) => {
    const F = A.Font, w = F.measure(font, text) + 16;
    g.fillStyle = 'rgba(10,8,20,0.78)';
    g.fillRect(x, y, w, 20);
    g.fillStyle = '#6a5a7a';
    g.fillRect(x, y, w, 1);
    g.fillRect(x, y, 1, 20);
    F.draw(g, font, text, x + 8, y + 2, color || '#e8dcc0', '#05030a');
  };

  Art.drawBg = (g, id, time) => {
    const real = Art.image(Art.bgFile(id, time));
    if (real) { g.drawImage(real, 0, 0); return; }
    g.imageSmoothingEnabled = false;
    g.drawImage(cached(`bg:${id}:${time}`, () => Art.bgPixels(id, time)), 0, 0, A.W, A.H);
    const info = L.bg[id];
    plate(g, 8, 8, 'ФОН · ' + (info ? info.place : id) + (time ? ' · ' + (Art.TIMES[time] || time) : ''), 'text');
  };

  Art.drawCg = (g, id) => {
    const real = Art.image(Art.cgFile(id));
    if (real) { g.drawImage(real, 0, 0); return; }
    const info = L.cg[id] || { title: id, what: '', mood: '', chapter: '' }, F = A.Font;
    const bond = info.chapter === 'bond';
    g.imageSmoothingEnabled = false;
    g.drawImage(cached('cgback:' + (bond ? 'bond' : 'story'), () => {
      const R = new Art.Raster(320, 240);
      R.dither(0, 0, 320, 240, bond ? ['#2a2010', '#7a5a2a', '#e0b060', '#2a2010'] : ['#2a1c30', '#5a3a3a', '#b8804a', '#2a1c30']);
      return R;
    }), 0, 0, A.W, A.H);
    g.fillStyle = 'rgba(10,8,20,0.82)';
    g.fillRect(40, 40, 560, 260);
    g.fillStyle = bond ? '#e0b060' : '#b08a5a';
    g.fillRect(40, 40, 560, 2);
    g.fillRect(40, 298, 560, 2);
    g.fillRect(40, 40, 2, 260);
    g.fillRect(598, 40, 2, 260);
    const t = (bond ? 'CG связи · ' : 'CG · ') + info.title;
    F.draw(g, 'bold', t, Math.round(320 - F.measure('bold', t) / 2), 60, '#f4bf6a', '#05030a');
    F.wrap('text', info.what, 500).forEach((l, i) => F.draw(g, 'text', l, 70, 96 + i * 18, '#f4ecd8', '#05030a'));
    if (info.mood) F.draw(g, 'text', 'Настроение: ' + info.mood, 70, 260, '#a0947a', '#05030a');
  };

  Art.drawStill = (g, id) => {
    const real = Art.image(Art.stillFile(id));
    if (real) { g.drawImage(real, 0, 0, A.W, A.H); return; }
    const info = L.still[id] || { title: id, year: '', what: '' }, F = A.Font;
    g.imageSmoothingEnabled = false;
    g.drawImage(cached('still', () => Art.stillPixels(id)), 0, 0, A.W, A.H);
    const t = 'Воспоминание · ' + info.title + (info.year ? ' · ' + info.year : '');
    F.draw(g, 'bold', t, Math.round(320 - F.measure('bold', t) / 2), 120, '#2a1a0a');
    F.wrap('text', info.what, 440).forEach((l, i) => F.draw(g, 'text', l, Math.round(320 - F.measure('text', l) / 2), 150 + i * 18, '#3a2410'));
  };
})(globalThis.Aayla98 = globalThis.Aayla98 || {});
