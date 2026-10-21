(function () {
    'use strict';

    var ORIGINS = {
        dragoon: {
            id: 'dragoon',
            name: 'Отставной драгун',
            subtitle: 'Гарнизонная выучка и строевой клинок',
            desc: 'Служил на южных редутах до Пепельного мора. Держит дыхание в долгой сече и умеет вкладывать вес тела в быстрый выпад.',
            stats: { vigor: 12, grit: 14, focus: 10 },
            maxHp: 115,
            maxStam: 110,
            passiveName: 'Строевой шаг',
            passiveDesc: 'Выпад стоит на 3 Дыхания меньше. Выпад в прикрытую зону проходит на 48% урона вместо 35%.',
            starterItems: ['rusty_sabre', 'garrison_cap', 'quilted_jack', 'marching_boots', 'rye_rusk', 'ash_salve']
        },
        miner: {
            id: 'miner',
            name: 'Штольневый проходчик',
            subtitle: 'Тяжёлое кайло и работа в тесноте',
            desc: 'Пробивал рудные жилы под Каменным Крестом. Привык к удушью, обвалам и сокрушительным ударам с плеча.',
            stats: { vigor: 15, grit: 11, focus: 10 },
            maxHp: 125,
            maxStam: 100,
            passiveName: 'Рудничный замах',
            passiveDesc: 'Размах наносит +4 урона и не дорожает в узких штреках.',
            starterItems: ['miner_pick', 'leather_hood', 'quilted_jack', 'marching_boots', 'pitch_torch', 'rye_rusk']
        },
        scribe: {
            id: 'scribe',
            name: 'Колокольный переписчик',
            subtitle: 'Острый глаз и расчёт чужого замаха',
            desc: 'Вёл приходские книги у Старой Колокольни. Замечает малейшее движение локтя противника прежде, чем сталь выйдет из ножен.',
            stats: { vigor: 10, grit: 11, focus: 15 },
            maxHp: 105,
            maxStam: 115,
            passiveName: 'Чтение замаха',
            passiveDesc: '+15% к шансу точно прочесть замах врага. Удачный Финт крадёт 12 Дыхания вместо 8.',
            starterItems: ['ash_rapier', 'leather_hood', 'scribe_coat', 'marching_boots', 'ash_salve', 'bell_tincture']
        }
    };

    var ORDERS = {
        guard: {
            id: 'guard',
            name: 'Стража Старого Брода',
            shortName: 'Стража Брода',
            color: '#ffcc00',
            commander: 'Сотник Дорофей',
            motto: 'Держать гать, беречь огонь, не пускать пепел за частокол.',
            bonusDesc: '+15% грошей за победы на тракте и починка у Громова на 15% дешевле.',
            baseInfluence: 340
        },
        guild: {
            id: 'guild',
            name: 'Артель Рудокопов',
            shortName: 'Артель Руды',
            color: '#cc9966',
            commander: 'Горный мастер Фома',
            motto: 'Железо под ногами крепче княжеских грамот.',
            bonusDesc: '+1 клеймёное железо при переплавке и +5 к запасу Дыхания.',
            baseInfluence: 315
        },
        bell: {
            id: 'bell',
            name: 'Братство Звонарей',
            shortName: 'Звонари',
            color: '#00cc00',
            commander: 'Уставщик Игнатий',
            motto: 'Пока гудит медь на ярусе, тракт помнит дорогу домой.',
            bonusDesc: '+2 к запасу Факела и лишний Жетон за победу в Круге над равным или сильным.',
            baseInfluence: 325
        }
    };

    var ZONES = [
        {
            id: 'head',
            name: 'Голова',
            shortName: 'Голова',
            woundName: 'Оглушение',
            woundDesc: 'Цель бьёт на 20% слабее в следующем раунде. Оглушённого врага вы читаете без ошибок, а оглушённый вы сами врага не прочтёте.'
        },
        {
            id: 'torso',
            name: 'Корпус',
            shortName: 'Корпус',
            woundName: 'Сбитое дыхание',
            woundDesc: 'Цель теряет 12 Дыхания.'
        },
        {
            id: 'legs',
            name: 'Ноги',
            shortName: 'Ноги',
            woundName: 'Подсечка',
            woundDesc: 'Следующий Размах цели стоит на 10 Дыхания больше.'
        }
    ];

    var STANCES = [
        {
            id: 'thrust',
            name: 'Выпад',
            stamCost: 10,
            dmgMult: 1.0,
            rule: 'Быстрый удар. Сбивает вражеский Размах: +30% урона, а его удар слабее. Вязнет в Передышке.'
        },
        {
            id: 'cleave',
            name: 'Размах',
            stamCost: 25,
            dmgMult: 1.45,
            rule: 'Тяжёлый удар. Проходит сквозь Прикрытие на 75% урона. Медленный: его сбивает Выпад.'
        },
        {
            id: 'feint',
            name: 'Финт',
            stamCost: 15,
            dmgMult: 0.9,
            rule: 'Ложный удар. В прикрытую зону обходит защиту и крадёт 8 Дыхания. В открытую зону бьёт слабо.'
        },
        {
            id: 'breather',
            name: 'Передышка',
            stamCost: -30,
            dmgMult: 0.4,
            rule: '+30 Дыхания. Прикрывает выбранную зону и корпус, гасит Выпад в прикрытое место. Бьёт слабо.'
        }
    ];

    var SHORTCUTS = {
        ferry_plank: {
            id: 'ferry_plank',
            name: 'Гатевой настил через старицу',
            from: 'ford_gate',
            to: 'stone_cross',
            unlockNode: 'sunken_ferry',
            desc: 'Цепь старого парома натянута: теперь от Заставы можно выйти прямо к Каменному Кресту за 1 шаг вместо 3.'
        },
        mine_cage: {
            id: 'mine_cage',
            name: 'Рудничная клеть под колокольней',
            from: 'stone_cross',
            to: 'ringer_hut',
            unlockNode: 'collapsed_drift',
            desc: 'Противовес клети расколот и пущен в ход: подъём от Каменного Креста к Сторожке Звонаря открыт напрямую.'
        }
    };

    var NODES = [
        {
            id: 'ford_gate',
            num: 1,
            name: 'Застава «Старый Брод»',
            type: 'hub',
            tier: 0,
            x: 65,
            y: 125,
            sightline: 'Двор с укрытиями',
            sightlineRule: 'Безопасный рубеж за бревенчатым частоколом.',
            torchCost: 0,
            staminaStep: 0,
            landmark: 'Сигнальная жаровня над воротами видна со всей низины.',
            desc: 'Сырой двор у бревенчатых ворот. Пахнет дёгтем, печным дымом и мокрой овчиной. Здесь пополняют смоляные факелы перед выходом в пепельную хмарь.',
            breadcrumb: 'Дозорный на вышке указывает багром на восток: за Камышовой Гатью виднеется крыша старой паромной будки.',
            connections: ['reed_causeway'],
            enemyPool: [],
            groshiYield: [0, 0],
            ironYield: 0
        },
        {
            id: 'reed_causeway',
            num: 2,
            name: 'Камышовая Гать',
            type: 'encounter',
            tier: 1,
            x: 155,
            y: 125,
            sightline: 'Открытая гать',
            sightlineRule: 'Выпад наносит +10% урона.',
            torchCost: 1,
            staminaStep: 5,
            landmark: 'На горизонте сквозь бурый туман проступает зубчатый силуэт Старой Колокольни.',
            desc: 'Узкий настил из почерневших сосновых плах поверх ржавой воды. В камышах шуршат одичавшие гончие, брошенные обозами.',
            breadcrumb: 'На мокрых досках свежие следы подкованных сапог ведут к развилке у торфяника.',
            connections: ['ford_gate', 'peat_fork'],
            enemyPool: ['bog_hound'],
            groshiYield: [12, 20],
            ironYield: 0
        },
        {
            id: 'peat_fork',
            num: 3,
            name: 'Торфяная Развилка',
            type: 'encounter',
            tier: 1,
            x: 245,
            y: 125,
            sightline: 'Открытая гать',
            sightlineRule: 'Выпад наносит +10% урона.',
            torchCost: 1,
            staminaStep: 6,
            landmark: 'Покосившийся верстовой столб с тремя железными табличками.',
            desc: 'Дорога расходится: прямо сквозь ивняк к Каменному Кресту, а влево по гнилым мосткам к затопленной паромной переправе.',
            breadcrumb: 'В грязи у левого поворота блестит звено натяжной паромной цепи: там явно есть обходной механизм.',
            connections: ['reed_causeway', 'sunken_ferry', 'willow_backwater', 'stone_cross'],
            enemyPool: ['flail_looter', 'bog_hound'],
            groshiYield: [18, 28],
            ironYield: 1
        },
        {
            id: 'sunken_ferry',
            num: 4,
            name: 'Покинутый Паром',
            type: 'secret',
            tier: 2,
            x: 225,
            y: 45,
            sightline: 'Двор с укрытиями',
            sightlineRule: 'Борта баркаса: Прикрытие пропускает 25% урона вместо 35%, Передышка даёт ещё +8 Дыхания.',
            torchCost: 1,
            staminaStep: 8,
            landmark: 'Чугунный ворот с заржавевшим храповиком на берегу старицы.',
            desc: 'Наполовину затопленный плоскодонный паром. Если провернуть ворот и закрепить цепь, откроется прямой сухой настил от самой Заставы до Каменного Креста.',
            breadcrumb: 'На корме лежит кованый сундук паромщика и рычаг натяжной цепи.',
            connections: ['peat_fork', 'stone_cross'],
            shortcutUnlock: 'ferry_plank',
            enemyPool: ['drowned_ferryman'],
            groshiYield: [30, 45],
            ironYield: 2
        },
        {
            id: 'willow_backwater',
            num: 5,
            name: 'Ивовый Затон',
            type: 'encounter',
            tier: 1,
            x: 265,
            y: 205,
            sightline: 'Двор с укрытиями',
            sightlineRule: 'Коряги и корни: Прикрытие пропускает 25% урона вместо 35%, Передышка даёт ещё +8 Дыхания.',
            torchCost: 1,
            staminaStep: 6,
            landmark: 'Разбитая телега интендантского обоза под плакучими ивами.',
            desc: 'Тихая заводь в стороне от большой гати. В брошенных ящиках попадаются целебная зольная мазь и смоляные факелы.',
            breadcrumb: 'За телегой протоптана сухая тропа прямо к костру у Каменного Креста.',
            connections: ['peat_fork', 'stone_cross'],
            enemyPool: ['flail_looter'],
            groshiYield: [22, 34],
            ironYield: 1
        },
        {
            id: 'stone_cross',
            num: 6,
            name: 'Костёр у Каменного Креста',
            type: 'breather',
            tier: 2,
            x: 365,
            y: 125,
            sightline: 'Двор с укрытиями',
            sightlineRule: 'Привал у огня: безопасный сектор для перевязки и отправки добычи.',
            torchCost: 1,
            staminaStep: 4,
            landmark: 'Каменный поклонный крест, сложенный из серых плит на сухом холме.',
            desc: 'Половина пути позади. В каменной нише горит неугасимая жировая лампа. Здесь можно перевести дух, зажечь новый факел и отправить мешок с добычей гонцом на Заставу.',
            breadcrumb: 'Впереди зияет чёрный вход в Железную Выработку, а справа видна шахта подъёмной клети.',
            connections: ['peat_fork', 'sunken_ferry', 'willow_backwater', 'quarry_approach'],
            enemyPool: [],
            groshiYield: [0, 0],
            ironYield: 0
        },
        {
            id: 'quarry_approach',
            num: 7,
            name: 'Железная Выработка',
            type: 'encounter',
            tier: 2,
            x: 465,
            y: 125,
            sightline: 'Узкий проход',
            sightlineRule: 'Теснина: Размах дороже на 4 Дыхания, Финт +10% урона, удар по Ногам +20% урона.',
            torchCost: 2,
            staminaStep: 8,
            landmark: 'Опрокинутые вагонетки на ржавых рельсах перед устьем штольни.',
            desc: 'Глубокий разрез в рыжей скале. Одичавшие рудокопы бьют кирками низко по ногам, пользуясь теснотой меж каменных осыпей.',
            breadcrumb: 'По рельсам можно уйти вглубь Штольни Номер Три или свернуть в Обвальный Штрек за клетью.',
            connections: ['stone_cross', 'shaft_three', 'collapsed_drift'],
            enemyPool: ['runaway_miner'],
            groshiYield: [28, 42],
            ironYield: 2
        },
        {
            id: 'shaft_three',
            num: 8,
            name: 'Штольня Номер Три',
            type: 'encounter',
            tier: 3,
            x: 545,
            y: 195,
            sightline: 'Узкий проход',
            sightlineRule: 'Теснина: Размах дороже на 4 Дыхания, Финт +10% урона, удар по Ногам +20% урона.',
            torchCost: 2,
            staminaStep: 9,
            landmark: 'Крепёжные брёвна, оплетённые серой пепельной паутиной.',
            desc: 'Сырой подземный коридор. Здесь охотятся штольневые прядильщики, которые обманывают ложным выпадом и жалят в незащищённую зону.',
            breadcrumb: 'В конце галереи виднеется каменная лестница наверх, к Сторожке Звонаря.',
            connections: ['quarry_approach', 'ringer_hut'],
            enemyPool: ['shaft_spinner', 'runaway_miner'],
            groshiYield: [36, 54],
            ironYield: 2
        },
        {
            id: 'collapsed_drift',
            num: 9,
            name: 'Обвальный Штрек',
            type: 'secret',
            tier: 3,
            x: 525,
            y: 45,
            sightline: 'Узкий проход',
            sightlineRule: 'Теснина: Размах дороже на 4 Дыхания, Финт +10% урона, удар по Ногам +20% урона.',
            torchCost: 2,
            staminaStep: 10,
            landmark: 'Шахтный барабан с натяжным тросом подъёмной клети.',
            desc: 'Опасный боковой карман выработки, богатый клеймёным железом. У механизма клети дежурит закованный в латы десятник.',
            breadcrumb: 'Освободите стопор барабана, чтобы пустить клеть между Каменным Крестом и Сторожкой Звонаря.',
            connections: ['quarry_approach', 'ringer_hut'],
            shortcutUnlock: 'mine_cage',
            enemyPool: ['iron_foreman'],
            groshiYield: [45, 65],
            ironYield: 3
        },
        {
            id: 'ringer_hut',
            num: 10,
            name: 'Сторожка Звонаря',
            type: 'breather',
            tier: 3,
            x: 620,
            y: 125,
            sightline: 'Двор с укрытиями',
            sightlineRule: 'Тихая келья перед штурмом паперти.',
            torchCost: 1,
            staminaStep: 4,
            landmark: 'Малый сигнальный колокол под каменным сводом сторожки.',
            desc: 'Последнее укрытие у подножия Старой Колокольни. На верстаке лежат клещи для быстрой правки зазубрин, а в печурке тлеют угли.',
            breadcrumb: 'За дубовой дверью начинается Затопленный Двор, а над ним гудит Ярус Колоколов.',
            connections: ['shaft_three', 'collapsed_drift', 'bell_courtyard'],
            enemyPool: [],
            groshiYield: [0, 0],
            ironYield: 0
        },
        {
            id: 'bell_courtyard',
            num: 11,
            name: 'Затопленный Двор',
            type: 'encounter',
            tier: 3,
            x: 685,
            y: 195,
            sightline: 'Двор с укрытиями',
            sightlineRule: 'Колонны паперти: Прикрытие пропускает 25% урона вместо 35%, Передышка даёт ещё +8 Дыхания.',
            torchCost: 1,
            staminaStep: 8,
            landmark: 'Расколотый бронзовый благовест посреди каменных плит.',
            desc: 'Преддверие главной башни. Стражи паперти сочетают подсечки по ногам с тяжёлыми ударами секирой сверху.',
            breadcrumb: 'Винтовая лестница ведёт прямо под купол, на Ярус Колоколов.',
            connections: ['ringer_hut', 'belfry_crown'],
            enemyPool: ['parish_warden'],
            groshiYield: [48, 70],
            ironYield: 2
        },
        {
            id: 'belfry_crown',
            num: 12,
            name: 'Ярус Колоколов',
            type: 'boss',
            tier: 4,
            x: 725,
            y: 65,
            sightline: 'Ярус колоколов',
            sightlineRule: 'Гул меди: каждый третий раунд колокол бьёт по голове, если её не прикрыть или не взять Передышку.',
            torchCost: 2,
            staminaStep: 10,
            landmark: 'Главный Набатный Колокол над всей Пепельной долиной.',
            desc: 'Вершина Старой Колокольни, открытая всем ветрам. Здесь несёт бессменную вахту Старый Звонарь - комендант пепельного рубежа.',
            breadcrumb: 'Победа над Старым Звонарём приносит печать Коменданта, клеймёную сталь и почёт всех трёх Приказов.',
            connections: ['bell_courtyard'],
            enemyPool: ['old_bellringer'],
            groshiYield: [95, 130],
            ironYield: 4
        }
    ];

    var ENEMIES = {
        bog_hound: {
            id: 'bog_hound',
            name: 'Болотный гончий',
            title: 'Одичавший пёс с камышовой гати',
            level: 1,
            hp: 110,
            maxStam: 70,
            atk: 24,
            armor: { head: 1, torso: 2, legs: 1 },
            groshi: 16,
            xp: 25,
            ironDrop: 0,
            restTell: 'Гончий шатается и хрипит: на прыжок сил уже нет.',
            moves: [
                { stance: 'thrust', strike: 'torso', guard: 'head', w: 3, tell: 'Гончий прижимает уши и пружинит на задних лапах для броска.' },
                { stance: 'thrust', strike: 'legs', guard: 'torso', w: 2, tell: 'Пёс стелется по мокрым доскам и скалится снизу.' },
                { stance: 'breather', strike: 'legs', guard: 'torso', w: 1, tell: 'Гончий пятится, вывалив язык, и кружит на месте.' }
            ]
        },
        flail_looter: {
            id: 'flail_looter',
            name: 'Мародёр с кистенём',
            title: 'Беглый обозник с торфяника',
            level: 2,
            hp: 150,
            maxStam: 85,
            atk: 29,
            armor: { head: 3, torso: 4, legs: 2 },
            groshi: 24,
            xp: 38,
            ironDrop: 1,
            restTell: 'Мародёр опускает кистень и жадно глотает воздух.',
            moves: [
                { stance: 'cleave', strike: 'head', guard: 'torso', w: 3, tell: 'Мародёр раскручивает гирю кистеня над плечом.' },
                { stance: 'breather', strike: 'torso', guard: 'head', w: 1, tell: 'Мародёр уходит за обитый железом щит и переводит дух.' },
                { stance: 'thrust', strike: 'torso', guard: 'head', w: 2, tell: 'Мародёр коротко шагает вперёд, кистень на короткой цепи.' }
            ]
        },
        drowned_ferryman: {
            id: 'drowned_ferryman',
            name: 'Утоплый паромщик',
            title: 'Хранитель цепного ворота',
            level: 3,
            hp: 180,
            maxStam: 95,
            atk: 34,
            armor: { head: 4, torso: 5, legs: 3 },
            groshi: 40,
            xp: 55,
            ironDrop: 2,
            restTell: 'Паромщик виснет на багре, с него ручьём течёт вода.',
            moves: [
                { stance: 'cleave', strike: 'torso', guard: 'head', w: 3, tell: 'Паромщик заносит железный багор с двух рук.' },
                { stance: 'thrust', strike: 'legs', guard: 'torso', w: 2, tell: 'Паромщик хлещет мокрой цепью по настилу.' },
                { stance: 'breather', strike: 'head', guard: 'torso', w: 1, tell: 'Паромщик упирается древком багра в днище баркаса.' }
            ]
        },
        runaway_miner: {
            id: 'runaway_miner',
            name: 'Беглый рудокоп',
            title: 'Кирочник из Железной Выработки',
            level: 3,
            hp: 175,
            maxStam: 95,
            atk: 32,
            armor: { head: 5, torso: 4, legs: 3 },
            groshi: 32,
            xp: 48,
            ironDrop: 1,
            restTell: 'Рудокоп кашляет пеплом, опершись на кайло.',
            moves: [
                { stance: 'thrust', strike: 'legs', guard: 'head', w: 2, tell: 'Рудокоп приседает в тесноте, кайло у самых досок.' },
                { stance: 'cleave', strike: 'torso', guard: 'legs', w: 2, tell: 'Рудокоп с выдохом заносит кайло из-за спины.' },
                { stance: 'feint', strike: 'head', guard: 'torso', w: 2, fakeAs: 'cleave', tell: 'Рудокоп заносит кайло из-за спины.' }
            ]
        },
        shaft_spinner: {
            id: 'shaft_spinner',
            name: 'Штольневый прядильщик',
            title: 'Слепой ловчий третьего горизонта',
            level: 4,
            hp: 195,
            maxStam: 105,
            atk: 37,
            armor: { head: 4, torso: 5, legs: 4 },
            groshi: 44,
            xp: 64,
            ironDrop: 2,
            restTell: 'Прядильщик замирает в паутине, только пальцы подрагивают.',
            moves: [
                { stance: 'feint', strike: 'head', guard: 'legs', w: 3, fakeAs: 'thrust', tell: 'Прядильщик выбрасывает клинок вперёд от самого пола.' },
                { stance: 'thrust', strike: 'legs', guard: 'head', w: 2, tell: 'Прядильщик выбрасывает крюк вперёд от самого пола.' },
                { stance: 'breather', strike: 'torso', guard: 'torso', w: 1, tell: 'Прядильщик отступает в тень крепей.' }
            ]
        },
        iron_foreman: {
            id: 'iron_foreman',
            name: 'Десятник Штрека',
            title: 'Страж подъёмной клети',
            level: 4,
            hp: 225,
            maxStam: 105,
            atk: 38,
            armor: { head: 6, torso: 7, legs: 5 },
            groshi: 58,
            xp: 80,
            ironDrop: 3,
            restTell: 'Десятник ставит молот на рельс и вытирает лоб.',
            moves: [
                { stance: 'cleave', strike: 'head', guard: 'torso', w: 3, tell: 'Десятник поднимает кузнечный молот двумя руками.' },
                { stance: 'feint', strike: 'torso', guard: 'head', w: 2, fakeAs: 'cleave', tell: 'Десятник поднимает молот двумя руками, стукнув обухом о рельс.' },
                { stance: 'breather', strike: 'legs', guard: 'torso', w: 1, tell: 'Десятник становится в распор между крепями.' },
                { stance: 'thrust', strike: 'legs', guard: 'head', w: 1, tell: 'Десятник тычет рукоятью молота понизу.' }
            ]
        },
        parish_warden: {
            id: 'parish_warden',
            name: 'Страж паперти',
            title: 'Латник Затопленного Двора',
            level: 5,
            hp: 245,
            maxStam: 115,
            atk: 42,
            armor: { head: 6, torso: 7, legs: 6 },
            groshi: 62,
            xp: 90,
            ironDrop: 2,
            restTell: 'Страж прислоняется к колонне, латы ходят ходуном.',
            moves: [
                { stance: 'thrust', strike: 'legs', guard: 'torso', w: 2, tell: 'Страж ведёт древко алебарды низко над водой.' },
                { stance: 'cleave', strike: 'head', guard: 'legs', w: 2, tell: 'Страж перехватывает алебарду высоко над шлемом.' },
                { stance: 'feint', strike: 'torso', guard: 'head', w: 2, fakeAs: 'thrust', tell: 'Страж ведёт крюк алебарды низко над водой.' },
                { stance: 'breather', strike: 'torso', guard: 'head', w: 1, tell: 'Страж опирается на алебарду у колонны.' }
            ]
        },
        old_bellringer: {
            id: 'old_bellringer',
            name: 'Старый Звонарь',
            title: 'Комендант Пепла, хозяин Набатного Яруса',
            level: 6,
            hp: 315,
            maxStam: 130,
            atk: 46,
            armor: { head: 7, torso: 8, legs: 6 },
            groshi: 115,
            xp: 150,
            ironDrop: 4,
            isBoss: true,
            restTell: 'Звонарь повисает на канате, и колокол над ним глухо стонет.',
            moves: [
                { stance: 'cleave', strike: 'head', guard: 'torso', w: 3, tell: 'Звонарь раскачивает бронзовый язык колокола.' },
                { stance: 'feint', strike: 'legs', guard: 'head', w: 2, fakeAs: 'cleave', tell: 'Звонарь раскачивает язык колокола на канате, намотанном на локоть.' },
                { stance: 'breather', strike: 'torso', guard: 'torso', w: 1, tell: 'Звонарь упирается плечом в балку колокола.' },
                { stance: 'thrust', strike: 'torso', guard: 'legs', w: 2, tell: 'Звонарь резко шагает с паперти, выставив кованый шест.' }
            ]
        }
    };

    var ITEMS = {
        rusty_sabre: {
            id: 'rusty_sabre',
            name: 'Походный тесак',
            slot: 'weapon',
            tier: 1,
            costGroshi: 35,
            costIron: 0,
            costTokens: 0,
            atk: 6,
            crit: 5,
            maxDurability: 30,
            desc: 'Уставной клинок с потёртой латунной дужкой. Надёжен в быстром выпаде.'
        },
        miner_pick: {
            id: 'miner_pick',
            name: 'Окованное кайло',
            slot: 'weapon',
            tier: 1,
            costGroshi: 35,
            costIron: 0,
            costTokens: 0,
            atk: 7,
            crit: 3,
            maxDurability: 32,
            desc: 'Гранёный стальной клюв на ясеневом топорище. Хорошо мнёт железные накладки.'
        },
        ash_rapier: {
            id: 'ash_rapier',
            name: 'Приходская шпага',
            slot: 'weapon',
            tier: 1,
            costGroshi: 35,
            costIron: 0,
            costTokens: 0,
            atk: 5,
            crit: 9,
            maxDurability: 28,
            desc: 'Узкий трёхгранный клинок для обманных финтов и уколов поверх щита.'
        },
        broad_saber: {
            id: 'broad_saber',
            name: 'Драгунская палаш-сабля',
            slot: 'weapon',
            tier: 2,
            costGroshi: 85,
            costIron: 2,
            costTokens: 0,
            atk: 11,
            crit: 7,
            maxDurability: 40,
            desc: 'Тяжёлый клинок кавалерийской ковки. Держит заточку даже после ударов о камень.'
        },
        shaft_cleaver: {
            id: 'shaft_cleaver',
            name: 'Рудничный секач',
            slot: 'weapon',
            tier: 2,
            costGroshi: 95,
            costIron: 3,
            costTokens: 0,
            atk: 13,
            crit: 5,
            maxDurability: 45,
            desc: 'Широкое лезвие из клеймёного железа. Разрубает щиты и крепёжные балки.'
        },
        bell_halberd: {
            id: 'bell_halberd',
            name: 'Секира Набатного Яруса',
            slot: 'weapon',
            tier: 3,
            costGroshi: 175,
            costIron: 6,
            costTokens: 2,
            atk: 18,
            crit: 11,
            maxDurability: 55,
            desc: 'Воронёная сталь с бронзовым обухом. Оружие старших дозорных Колокольни.'
        },
        garrison_cap: {
            id: 'garrison_cap',
            name: 'Суконный кивер с налобником',
            slot: 'helmet',
            tier: 1,
            costGroshi: 25,
            costIron: 0,
            costTokens: 0,
            armor: { head: 3, torso: 0, legs: 0 },
            maxHp: 5,
            maxDurability: 28,
            desc: 'Плотный кивер с медной бляхой, гасящий скользящие удары по голове.'
        },
        leather_hood: {
            id: 'leather_hood',
            name: 'Просмолённый шлем-капюшон',
            slot: 'helmet',
            tier: 1,
            costGroshi: 25,
            costIron: 0,
            costTokens: 0,
            armor: { head: 2, torso: 1, legs: 0 },
            maxStam: 5,
            maxDurability: 28,
            desc: 'Толстая воловья кожа, пропитанная воском от пепельной сырости.'
        },
        riveted_casque: {
            id: 'riveted_casque',
            name: 'Клёпаный шишак с нащёчниками',
            slot: 'helmet',
            tier: 2,
            costGroshi: 75,
            costIron: 2,
            costTokens: 0,
            armor: { head: 6, torso: 1, legs: 0 },
            maxHp: 12,
            maxDurability: 42,
            desc: 'Стальной купол работы кузнеца Громова. Надёжно бережёт от оглушения.'
        },
        belfry_visored: {
            id: 'belfry_visored',
            name: 'Личина Звонарного Дозора',
            slot: 'helmet',
            tier: 3,
            costGroshi: 140,
            costIron: 4,
            costTokens: 1,
            armor: { head: 9, torso: 2, legs: 0 },
            maxHp: 20,
            maxStam: 8,
            maxDurability: 52,
            desc: 'Шлем с узкими смотровыми щелями и медным гребнем, гасящим колокольный гул.'
        },
        quilted_jack: {
            id: 'quilted_jack',
            name: 'Стёганый поддоспешник',
            slot: 'cuirass',
            tier: 1,
            costGroshi: 35,
            costIron: 0,
            costTokens: 0,
            armor: { head: 0, torso: 4, legs: 1 },
            maxHp: 10,
            maxDurability: 32,
            desc: 'Многослойная льняная куртка, простёганная конским волосом.'
        },
        scribe_coat: {
            id: 'scribe_coat',
            name: 'Дорожный кафтан с бляхами',
            slot: 'cuirass',
            tier: 1,
            costGroshi: 35,
            costIron: 0,
            costTokens: 0,
            armor: { head: 0, torso: 3, legs: 1 },
            maxHp: 6,
            maxStam: 10,
            maxDurability: 30,
            desc: 'Лёгкий кафтан со скрытыми железными пластинами на груди. Не стесняет дыхания.'
        },
        brigandine_vest: {
            id: 'brigandine_vest',
            name: 'Кольчужная куяка Брода',
            slot: 'cuirass',
            tier: 2,
            costGroshi: 95,
            costIron: 3,
            costTokens: 0,
            armor: { head: 0, torso: 8, legs: 2 },
            maxHp: 22,
            maxDurability: 45,
            desc: 'Стальные пластины, наклёпанные изнутри на толстое сукно.'
        },
        warden_plate: {
            id: 'warden_plate',
            name: 'Кираса Комендантской Сотни',
            slot: 'cuirass',
            tier: 3,
            costGroshi: 185,
            costIron: 6,
            costTokens: 2,
            armor: { head: 1, torso: 12, legs: 3 },
            maxHp: 35,
            maxDurability: 60,
            desc: 'Выгнутый нагрудник из клеймёного железа с рёбрами жёсткости.'
        },
        marching_boots: {
            id: 'marching_boots',
            name: 'Подкованные ботфорты',
            slot: 'boots',
            tier: 1,
            costGroshi: 25,
            costIron: 0,
            costTokens: 0,
            armor: { head: 0, torso: 0, legs: 3 },
            maxStam: 5,
            maxDurability: 28,
            desc: 'Высокие сапоги с железными подковками для ходьбы по скользкой гати.'
        },
        splint_greaves: {
            id: 'splint_greaves',
            name: 'Шинные поножи рудокопа',
            slot: 'boots',
            tier: 2,
            costGroshi: 68,
            costIron: 2,
            costTokens: 0,
            armor: { head: 0, torso: 0, legs: 6 },
            maxHp: 8,
            maxStam: 10,
            maxDurability: 40,
            desc: 'Стальные полосы вдоль голени защищают от низких ударов кайлом и подсечек.'
        },
        duelist_charm: {
            id: 'duelist_charm',
            name: 'Медный жетон Старого Круга',
            slot: 'amulet',
            tier: 2,
            costGroshi: 60,
            costIron: 1,
            costTokens: 2,
            atk: 3,
            crit: 6,
            maxStam: 12,
            maxDurability: 50,
            desc: 'Памятный знак поединщика Заставы. Помогает держать ровный темп в бою.'
        },
        bell_tongue_relic: {
            id: 'bell_tongue_relic',
            name: 'Осколок Набатной Меди',
            slot: 'amulet',
            tier: 3,
            costGroshi: 120,
            costIron: 3,
            costTokens: 3,
            atk: 5,
            armor: { head: 2, torso: 2, legs: 2 },
            maxHp: 18,
            maxStam: 15,
            maxDurability: 60,
            desc: 'Тёплый сплав колокольной бронзы. Отводит контузию и прибавляет твёрдости руке.'
        },
        pitch_torch: {
            id: 'pitch_torch',
            name: 'Смоляной факел',
            slot: 'consumable',
            tier: 1,
            costGroshi: 12,
            costIron: 0,
            costTokens: 0,
            effect: 'torch',
            power: 6,
            desc: 'Пропитанное сосновой смолой древко. Прибавляет +6 к запасу Факела на тракте.'
        },
        rye_rusk: {
            id: 'rye_rusk',
            name: 'Пайковый ржаной сухарь с солью',
            slot: 'consumable',
            tier: 1,
            costGroshi: 10,
            costIron: 0,
            costTokens: 0,
            effect: 'stamina',
            power: 45,
            desc: 'Дорожный припас. Мгновенно возвращает +45 ед. Дыхания в бою или в походе.'
        },
        ash_salve: {
            id: 'ash_salve',
            name: 'Зольная перевязочная мазь',
            slot: 'consumable',
            tier: 1,
            costGroshi: 16,
            costIron: 0,
            costTokens: 0,
            effect: 'heal',
            power: 45,
            desc: 'Сбор из болотного сабельника и чистой золы. Восстанавливает +45 ед. Здоровья и снимает ранения.'
        },
        bell_tincture: {
            id: 'bell_tincture',
            name: 'Настойка Звонарного Корня',
            slot: 'consumable',
            tier: 2,
            costGroshi: 28,
            costIron: 0,
            costTokens: 0,
            effect: 'both',
            power: 55,
            desc: 'Крепкий травный бальзам: возвращает +55 Здоровья и +55 Дыхания.'
        }
    };

    var CONTRACTS = [
        {
            id: 'c_clear_causeway',
            title: 'Очистить Камышовую Гать',
            patron: 'Сотник Дорофей (Стража Брода)',
            orderId: 'guard',
            targetType: 'enemy',
            targetId: 'bog_hound',
            required: 2,
            rewardGroshi: 45,
            rewardIron: 1,
            rewardTokens: 1,
            rewardXp: 40,
            desc: 'Одичавшие гончие рвут постромки у водовозов на Камышовой Гати. Одолейте двух тварей.'
        },
        {
            id: 'c_unlock_ferry',
            title: 'Натянуть цепь Покинутого Парома',
            patron: 'Сотник Дорофей (Стража Брода)',
            orderId: 'guard',
            targetType: 'shortcut',
            targetId: 'ferry_plank',
            required: 1,
            rewardGroshi: 70,
            rewardIron: 2,
            rewardTokens: 1,
            rewardXp: 65,
            desc: 'Сверните с Торфяной Развилки к Парому, победите Утоплого паромщика и откройте короткий настил.'
        },
        {
            id: 'c_quarry_iron',
            title: 'Доставка клеймёного железа из Выработки',
            patron: 'Горный мастер Фома (Артель Руды)',
            orderId: 'guild',
            targetType: 'node_clear',
            targetId: 'quarry_approach',
            required: 2,
            rewardGroshi: 65,
            rewardIron: 3,
            rewardTokens: 1,
            rewardXp: 60,
            desc: 'Пробейтесь в Железную Выработку за Каменным Крестом и дважды зачистите подходы к рельсам.'
        },
        {
            id: 'c_arena_trial',
            title: 'Испытание Старого Круга',
            patron: 'Судья ристалища Еремей',
            orderId: 'bell',
            targetType: 'arena_win',
            targetId: 'any',
            required: 2,
            rewardGroshi: 60,
            rewardIron: 1,
            rewardTokens: 3,
            rewardXp: 55,
            desc: 'Одержите две победы над соперниками в Круге Поединков на Заставе.'
        },
        {
            id: 'c_belfry_watch',
            title: 'Укротить Набатный Ярус',
            patron: 'Уставщик Игнатий (Братство Звонарей)',
            orderId: 'bell',
            targetType: 'enemy',
            targetId: 'old_bellringer',
            required: 1,
            rewardGroshi: 160,
            rewardIron: 5,
            rewardTokens: 4,
            rewardXp: 150,
            desc: 'Поднимитесь на вершину Старой Колокольни (сектор 12) и выдержите бой со Старым Звонарём.'
        },
        {
            id: 'c_long_haul',
            title: 'Обоз из-под Колокольни',
            patron: 'Горный мастер Фома (Артель Руды)',
            orderId: 'guild',
            targetType: 'bank_haul',
            targetId: 'any',
            required: 150,
            rewardGroshi: 90,
            rewardIron: 4,
            rewardTokens: 1,
            rewardXp: 80,
            desc: 'Сдайте в казну за один раз мешок не меньше чем на 150 грошей. Чем дольше несёте, тем жарче тракт.'
        },
        {
            id: 'c_upset',
            title: 'Выше головы',
            patron: 'Судья ристалища Еремей',
            orderId: 'guard',
            targetType: 'arena_upset',
            targetId: 'any',
            required: 1,
            rewardGroshi: 50,
            rewardIron: 1,
            rewardTokens: 2,
            rewardXp: 60,
            desc: 'Победите в Круге соперника, у которого рейтинг выше вашего.'
        }
    ];

    var RIVALS = [
        {
            id: 'r_vovan',
            handle: 'Вован_33600',
            realCity: 'Тула (модем 33.6k)',
            orderId: 'guard',
            originId: 'dragoon',
            level: 1,
            rating: 1020,
            wins: 4,
            losses: 3,
            hp: 180,
            maxStam: 95,
            atk: 26,
            armor: { head: 3, torso: 4, legs: 2 },
            wager: 20,
            reads: 0,
            weaponName: 'Походный тесак +1',
            quote: 'Главное, чтобы мамка трубку на кухне не сняла посреди раунда!',
            style: 'Бьёт как придётся и ничего не замечает.',
            moves: [
                { stance: 'thrust', strike: 'torso', guard: 'head', w: 3, tell: 'Вован_33600 берёт разбег, тесак вперёд.' },
                { stance: 'cleave', strike: 'head', guard: 'torso', w: 2, tell: 'Вован_33600 замахивается тесаком от плеча.' },
                { stance: 'breather', strike: 'legs', guard: 'torso', w: 1, tell: 'Вован_33600 отходит к краю Круга и поправляет перевязь.' }
            ]
        },
        {
            id: 'r_alisa',
            handle: 'Алиса_СПб',
            realCity: 'Санкт-Петербург (модем 28.8k)',
            orderId: 'bell',
            originId: 'scribe',
            level: 2,
            rating: 1085,
            wins: 9,
            losses: 4,
            hp: 195,
            maxStam: 110,
            atk: 29,
            armor: { head: 4, torso: 5, legs: 3 },
            wager: 32,
            reads: 2,
            weaponName: 'Приходская шпага +2',
            quote: 'Считаю ваше Дыхание по протоколу боя. На Размах лучше не надейтесь.',
            style: 'Замечает и повторы зон, и привычные приёмы.',
            moves: [
                { stance: 'feint', strike: 'head', guard: 'torso', w: 3, fakeAs: 'thrust', tell: 'Алиса_СПб выводит шпагу вперёд коротким уколом.' },
                { stance: 'thrust', strike: 'legs', guard: 'head', w: 2, tell: 'Алиса_СПб колет шпагой вперёд, низко.' },
                { stance: 'breather', strike: 'legs', guard: 'head', w: 1, tell: 'Алиса_СПб делает быстрый шаг назад.' }
            ]
        },
        {
            id: 'r_kpbic',
            handle: 'KPBIC_98',
            realCity: 'Екатеринбург (модем 14.4k)',
            orderId: 'guild',
            originId: 'miner',
            level: 3,
            rating: 1140,
            wins: 14,
            losses: 6,
            hp: 260,
            maxStam: 105,
            atk: 40,
            armor: { head: 5, torso: 7, legs: 5 },
            wager: 45,
            reads: 1,
            weaponName: 'Рудничный секач +2',
            quote: 'В третьей штольне темно, зато железа полный мешок. Выходи, проверим кирасу!',
            style: 'Закрывает зону, в которую вы бьёте дважды подряд.',
            moves: [
                { stance: 'cleave', strike: 'torso', guard: 'head', w: 3, tell: 'KPBIC_98 рубит секачом сверху с коротким рыком.' },
                { stance: 'thrust', strike: 'legs', guard: 'torso', w: 2, tell: 'KPBIC_98 бьёт древком под колено.' },
                { stance: 'breather', strike: 'torso', guard: 'torso', w: 1, tell: 'KPBIC_98 опускает секач и отдувается.' }
            ]
        },
        {
            id: 'r_tolya',
            handle: 'Звонарь_Толя',
            realCity: 'Новосибирск (ночной тариф)',
            orderId: 'bell',
            originId: 'scribe',
            level: 4,
            rating: 1195,
            wins: 19,
            losses: 8,
            hp: 290,
            maxStam: 120,
            atk: 44,
            armor: { head: 6, torso: 7, legs: 5 },
            wager: 55,
            reads: 1,
            weaponName: 'Драгунская палаш-сабля +2',
            quote: 'У нас в Сибири уже два часа ночи, повремёнка капает, так что бью без разговоров.',
            style: 'Закрывает зону, в которую вы бьёте дважды подряд.',
            moves: [
                { stance: 'thrust', strike: 'head', guard: 'legs', w: 2, tell: 'Звонарь_Толя делает стремительный выпад палашом.' },
                { stance: 'feint', strike: 'legs', guard: 'head', w: 2, fakeAs: 'thrust', tell: 'Звонарь_Толя делает стремительный выпад, крутя кистью.' },
                { stance: 'cleave', strike: 'torso', guard: 'head', w: 1, tell: 'Звонарь_Толя заносит палаш над головой.' }
            ]
        },
        {
            id: 'r_sedoy',
            handle: 'Седой_Сотник',
            realCity: 'Москва (выделенная линия)',
            orderId: 'guard',
            originId: 'dragoon',
            level: 5,
            rating: 1260,
            wins: 27,
            losses: 5,
            hp: 340,
            maxStam: 125,
            atk: 49,
            armor: { head: 7, torso: 9, legs: 6 },
            wager: 70,
            reads: 2,
            weaponName: 'Секира Набатного Яруса +3',
            quote: 'Четвёртый час держим гать со Стражей Брода. Кто без факела в штольни сунется, пеняйте на себя.',
            style: 'Замечает и повторы зон, и привычные приёмы.',
            moves: [
                { stance: 'feint', strike: 'head', guard: 'torso', w: 2, fakeAs: 'cleave', tell: 'Седой_Сотник вкладывает вес в замах секиры.' },
                { stance: 'cleave', strike: 'torso', guard: 'legs', w: 2, tell: 'Седой_Сотник вкладывает весь вес в замах секиры.' },
                { stance: 'breather', strike: 'legs', guard: 'head', w: 1, tell: 'Седой_Сотник становится в строевую защиту.' },
                { stance: 'thrust', strike: 'head', guard: 'legs', w: 1, tell: 'Седой_Сотник колет навершием секиры.' }
            ]
        }
    ];

    var LADDER_EXTRA = [
        { handle: 'Gromov_Кузнец', city: 'Нижний Новгород', orderId: 'guild', level: 5, rating: 1230, wins: 24, losses: 7 },
        { handle: 'Stalker_MUD', city: 'Самара', orderId: 'bell', level: 4, rating: 1170, wins: 16, losses: 7 },
        { handle: 'Князь_Тишины', city: 'Казань', orderId: 'guard', level: 4, rating: 1155, wins: 15, losses: 8 },
        { handle: 'Дима_Коom', city: 'Воронеж', orderId: 'guild', level: 3, rating: 1110, wins: 12, losses: 6 },
        { handle: 'Пепельный_Лис', city: 'Пермь', orderId: 'bell', level: 3, rating: 1095, wins: 11, losses: 7 },
        { handle: 'Корнет_Оболенский', city: 'Ярославль', orderId: 'guard', level: 2, rating: 1060, wins: 8, losses: 5 },
        { handle: 'Рудокоп_Илья', city: 'Кемерово', orderId: 'guild', level: 2, rating: 1045, wins: 7, losses: 5 },
        { handle: 'Тень_Колокольни', city: 'Тверь', orderId: 'bell', level: 2, rating: 1030, wins: 6, losses: 5 }
    ];

    var COMMISSION_INITIAL = [
        {
            lotId: 'lot_101',
            itemId: 'broad_saber',
            temper: 1,
            durability: 38,
            maxDurability: 40,
            seller: 'Седой_Сотник',
            priceGroshi: 72,
            note: 'Отличная сабля с проковкой +1, взял себе секиру, отдаю дешевле лавки.'
        },
        {
            lotId: 'lot_102',
            itemId: 'riveted_casque',
            temper: 1,
            durability: 40,
            maxDurability: 42,
            seller: 'Gromov_Кузнец',
            priceGroshi: 64,
            note: 'Клёпаный шишак +1 прямо с наковальни, без единой вмятины.'
        },
        {
            lotId: 'lot_103',
            itemId: 'splint_greaves',
            temper: 0,
            durability: 35,
            maxDurability: 40,
            seller: 'KPBIC_98',
            priceGroshi: 52,
            note: 'Поножи для Железной Выработки, спасают ноги от кирки.'
        },
        {
            lotId: 'lot_104',
            itemId: 'bell_tincture',
            temper: 0,
            durability: 1,
            maxDurability: 1,
            seller: 'Алиса_СПб',
            priceGroshi: 22,
            note: 'Свежая настойка перед походом на Старого Звонаря.'
        }
    ];

    var CHAT_CHANNELS = {
        square: {
            id: 'square',
            name: 'Площадь Заставы',
            roster: ['Седой_Сотник', 'Вован_33600', 'Алиса_СПб', 'KPBIC_98', 'Звонарь_Толя', 'Сотник_Дорофей'],
            initial: [
                { time: '21:12', author: 'Сотник_Дорофей', text: 'Дозорным внимание: на Камышовой Гати снова видели стаю гончих. Без смоляного факела за ворота не выходить.' },
                { time: '21:14', author: 'Вован_33600', text: 'Всем привет! Кто подскажет, как сбивать тяжёлый Размах у мародёра с кистенём?' },
                { time: '21:15', author: 'Алиса_СПб', text: 'Вован_33600: читай строку наблюдения над врагом. Когда он заносит кистень для Размаха - бей быстрым Выпадом на опережение.' },
                { time: '21:17', author: 'KPBIC_98', text: 'Парни, мы с Артелью открыли цепь на Покинутом Пароме! Теперь до Каменного Креста один шаг.' }
            ],
            replies: [
                { author: 'Седой_Сотник', text: 'Доброе слово! В бою главное - следить за Дыханием и вовремя брать Передышку.' },
                { author: 'Алиса_СПб', text: 'Если пойдёте в Штольню Номер Три, берегитесь прядильщиков: они часто бьют Финтом в обход щита.' },
                { author: 'Вован_33600', text: 'О, живой человек в чате! Пошли в Круг Поединков на 20 грошей разомнёмся?' },
                { author: 'Звонарь_Толя', text: 'Проверяйте износ клинка у Громова в кузнице, а то на Старом Звонаре оружие в самый неподходящий миг затупится.' }
            ]
        },
        tavern: {
            id: 'tavern',
            name: 'Таверна «У Брода»',
            roster: ['Трактирщик_Савелий', 'Stalker_MUD', 'Князь_Тишины', 'Звонарь_Толя'],
            initial: [
                { time: '21:08', author: 'Трактирщик_Савелий', text: 'Горячий сбитень и ржаные сухари в дорогу! Кто с ночной смены на модеме - садитесь ближе к печке.' },
                { time: '21:11', author: 'Stalker_MUD', text: 'Эх, хорошо тут. Страница грузится за секунду даже на 14400 бод, чисто таблицами без лишней мишуры.' },
                { time: '21:16', author: 'Князь_Тишины', text: 'Говорят, если открыть и паромный настил, и рудничную клеть, до самой Колокольни можно дойти почти со свежим факелом.' }
            ],
            replies: [
                { author: 'Трактирщик_Савелий', text: 'На дорожку всегда бери зольную мазь: она не только здоровье правит, но и оглушение с подсечкой снимает.' },
                { author: 'Stalker_MUD', text: 'Кстати, в Палате Героя можно выгрузить личное дело в текстовый файл прямо в Блокнот на память!' },
                { author: 'Князь_Тишины', text: 'За Братство Звонарей! Сегодня мы обязательно выйдем на первое место в Летописи.' }
            ]
        },
        trade: {
            id: 'trade',
            name: 'Торговый ряд',
            roster: ['Gromov_Кузнец', 'KPBIC_98', 'Алиса_СПб', 'Рудокоп_Илья'],
            initial: [
                { time: '21:05', author: 'Gromov_Кузнец', text: 'Выставил в Комиссионном ряду клёпаный шишак с проковкой +1. Также принимаю клеймёное железо на перековку.' },
                { time: '21:13', author: 'KPBIC_98', text: 'Продам шинные поножи рудокопа, недорого! Смотрите вкладку Кузница и Торг.' },
                { time: '21:18', author: 'Рудокоп_Илья', text: 'Куплю клеймёное железо или обменяю на смоляные факелы у Каменного Креста.' }
            ],
            replies: [
                { author: 'Gromov_Кузнец', text: 'Напоминаю: каждая следующая проковка вещи повышает урон или броню, но требует всё больше грошей и железа.' },
                { author: 'KPBIC_98', text: 'Если в рюкзаке лишний трофей - выставляй его в Комиссионный ряд, наши сразу заберут!' },
                { author: 'Рудокоп_Илья', text: 'В Обвальном Штреке (сектор 9) больше всего клеймёного железа, если одолеть Десятника.' }
            ]
        }
    };

    var CHRONICLE_LORE = [
        {
            date: '14 октября 1998 г.',
            title: 'Открытие телеграфного узла на Заставе «Старый Брод»',
            body: 'По распоряжению комендатуры открыт круглосуточный доступ к походным ведомостям через браузер Microslop Internet Explorer. Всем вольным путникам надлежит получить железный пропуск у Ворот.'
        },
        {
            date: '17 октября 1998 г.',
            title: 'Сводка с Торфяной Развилки и Железной Выработки',
            body: 'Стража Брода удерживает Камышовую Гать, однако в Штольне Номер Три замечены слепые прядильщики. Артель Рудокопов обещает щедрую плату за расчистку рельсового пути и запуск подъёмной клети.'
        },
        {
            date: '19 октября 1998 г.',
            title: 'Набат на Старой Колокольне',
            body: 'Каждую полночь с двенадцатого сектора доносится гул большого благовеста. Старый Звонарь не пускает никого на ярус без боя, проверяя выучку в трёх зонах защиты.'
        }
    ];

    var COMMISSION_POOL = [
        { itemId: 'brigandine_vest', temper: 0, wear: 6, seller: 'Князь_Тишины', priceGroshi: 82, note: 'Куяка после Затопленного Двора, пара вмятин, держит.' },
        { itemId: 'ash_salve', temper: 0, wear: 0, seller: 'Трактирщик_Савелий', priceGroshi: 14, note: 'Мазь свежая, вчера варили.' },
        { itemId: 'shaft_cleaver', temper: 1, wear: 8, seller: 'Рудокоп_Илья', priceGroshi: 96, note: 'Секач +1, перехожу на палаш.' },
        { itemId: 'pitch_torch', temper: 0, wear: 0, seller: 'Пепельный_Лис', priceGroshi: 9, note: 'Смоляной факел, отдаю дешевле лавки.' },
        { itemId: 'duelist_charm', temper: 0, wear: 4, seller: 'Тень_Колокольни', priceGroshi: 70, note: 'Жетон Круга, без него в рейтинг не пускают (шутка).' },
        { itemId: 'riveted_casque', temper: 0, wear: 10, seller: 'Корнет_Оболенский', priceGroshi: 48, note: 'Шишак с вмятиной на макушке, но гул держит.' }
    ];

    var AMBIENT_CHAT = [
        { room: 'square', author: 'Сотник_Дорофей', text: 'Сменился дозор на вышке. Кто вернулся с тракта, отметьтесь у ворот.' },
        { room: 'square', author: 'Вован_33600', text: 'Кто-нибудь видел, куда делся Десятник? Третий раз иду, а клеть всё не пущена.' },
        { room: 'tavern', author: 'Трактирщик_Савелий', text: 'Сбитень остыл, ставлю новый. Модемщики, не занимайте лавку у печки до утра.' },
        { room: 'square', author: 'Алиса_СПб', text: 'Совет новичкам: в темноте замаха не видно, так что не жадничайте и держите корпус.' },
        { room: 'trade', author: 'Gromov_Кузнец', text: 'Железо в цене. Кто несёт из Обвального Штрека, заходите, перекуём.' },
        { room: 'tavern', author: 'Stalker_MUD', text: 'Опять повремёнка кончилась на самом интересном месте. Мешок донёс, а до Звонаря не успел.' },
        { room: 'square', author: 'KPBIC_98', text: 'Кто читает протокол боя, тот и побеждает. Финт в открытую зону бьёт как веником.' },
        { room: 'trade', author: 'Рудокоп_Илья', text: 'Меняю смоляные факелы на сухари, тракт сегодня тёмный.' }
    ];

    window.ashroadData = {
        ORIGINS: ORIGINS,
        ORDERS: ORDERS,
        ZONES: ZONES,
        STANCES: STANCES,
        SHORTCUTS: SHORTCUTS,
        NODES: NODES,
        ENEMIES: ENEMIES,
        ITEMS: ITEMS,
        CONTRACTS: CONTRACTS,
        RIVALS: RIVALS,
        LADDER_EXTRA: LADDER_EXTRA,
        COMMISSION_INITIAL: COMMISSION_INITIAL,
        CHAT_CHANNELS: CHAT_CHANNELS,
        CHRONICLE_LORE: CHRONICLE_LORE,
        COMMISSION_POOL: COMMISSION_POOL,
        AMBIENT_CHAT: AMBIENT_CHAT
    };
})();
