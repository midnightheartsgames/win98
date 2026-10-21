(function (globalScope) {
    const PITCH_WIDTH = 840;
    const PITCH_HEIGHT = 520;
    const PITCH_HALF_W = PITCH_WIDTH / 2;
    const PITCH_HALF_H = PITCH_HEIGHT / 2;
    const GOAL_WIDTH = 124;
    const GOAL_HALF_W = GOAL_WIDTH / 2;
    const GOAL_DEPTH = 28;
    const CROSSBAR_HEIGHT = 38;
    const PENALTY_BOX_W = 136;
    const PENALTY_BOX_H = 264;
    const SIX_YARD_W = 48;
    const SIX_YARD_H = 148;
    const PENALTY_SPOT_OFFSET = 96;
    const GRAVITY = 210;

    const STADIUMS = {
        stade_de_france: {
            id: 'stade_de_france',
            name: 'Стад де Франс (Сен-Дени)',
            city: 'Сен-Дени',
            capacity: '80 000',
            grassLight: '#2c8a3e',
            grassDark: '#237432',
            trackColor: '#3d5166',
            crowdPrimary: '#1d4ed8',
            crowdSecondary: '#ef4444'
        },
        parc_des_princes: {
            id: 'parc_des_princes',
            name: 'Парк де Пренс (Париж)',
            city: 'Париж',
            capacity: '48 500',
            grassLight: '#2f9142',
            grassDark: '#267a36',
            trackColor: '#2d3a4b',
            crowdPrimary: '#1e3a8a',
            crowdSecondary: '#dc2626'
        },
        velodrome: {
            id: 'velodrome',
            name: 'Стад Велодром (Марсель)',
            city: 'Марсель',
            capacity: '60 000',
            grassLight: '#359644',
            grassDark: '#2b7d38',
            trackColor: '#4b5563',
            crowdPrimary: '#0284c7',
            crowdSecondary: '#f8fafc'
        },
        gerland: {
            id: 'gerland',
            name: 'Стад де Жерлан (Лион)',
            city: 'Лион',
            capacity: '44 000',
            grassLight: '#28843b',
            grassDark: '#1f6d2f',
            trackColor: '#5c4033',
            crowdPrimary: '#b91c1c',
            crowdSecondary: '#1d4ed8'
        }
    };

    const WEATHER_TYPES = {
        sunny: {
            id: 'sunny',
            name: 'Солнечно (День)',
            ballFriction: 2.15,
            ballBounce: 0.62,
            slideMultiplier: 1.0,
            staminaDrainMultiplier: 1.0,
            passErrorBonus: 0
        },
        night: {
            id: 'night',
            name: 'Прожекторы (Вечер)',
            ballFriction: 1.95,
            ballBounce: 0.65,
            slideMultiplier: 1.05,
            staminaDrainMultiplier: 0.92,
            passErrorBonus: 0
        },
        rain: {
            id: 'rain',
            name: 'Ливень (Мокрый газон)',
            ballFriction: 1.38,
            ballBounce: 0.46,
            slideMultiplier: 1.32,
            staminaDrainMultiplier: 1.15,
            passErrorBonus: 0.06
        }
    };

    const FORMATIONS = {
        '4-4-2': {
            id: '4-4-2',
            name: '4-4-2 Классика',
            shortDesc: 'Сбалансированный контроль линий и быстрый переход из обороны в атаку',
            counters: '4-3-3',
            weakTo: '3-5-2',
            slots: [
                { role: 'GK', x: -0.92, y: 0 },
                { role: 'DF', x: -0.62, y: -0.44 },
                { role: 'DF', x: -0.62, y: 0.44 },
                { role: 'MF', x: -0.22, y: -0.52 },
                { role: 'MF', x: -0.22, y: 0.52 },
                { role: 'FW', x: 0.24, y: -0.26 },
                { role: 'FW', x: 0.24, y: 0.26 }
            ]
        },
        '4-3-3': {
            id: '4-3-3',
            name: '4-3-3 Атака флангами',
            shortDesc: 'Тройка форвардов давит на края обороны и открывается под навесы',
            counters: '5-3-2',
            weakTo: '4-4-2',
            slots: [
                { role: 'GK', x: -0.92, y: 0 },
                { role: 'DF', x: -0.60, y: -0.42 },
                { role: 'DF', x: -0.60, y: 0.42 },
                { role: 'MF', x: -0.18, y: 0 },
                { role: 'FW', x: 0.22, y: -0.62 },
                { role: 'FW', x: 0.30, y: 0 },
                { role: 'FW', x: 0.22, y: 0.62 }
            ]
        },
        '3-5-2': {
            id: '3-5-2',
            name: '3-5-2 Контроль центра',
            shortDesc: 'Насыщенный кулак в центре поля перехватывает инициативу и строит комбинации',
            counters: '4-4-2',
            weakTo: '5-3-2',
            slots: [
                { role: 'GK', x: -0.92, y: 0 },
                { role: 'DF', x: -0.66, y: 0 },
                { role: 'MF', x: -0.32, y: -0.54 },
                { role: 'MF', x: -0.15, y: 0 },
                { role: 'MF', x: -0.32, y: 0.54 },
                { role: 'FW', x: 0.24, y: -0.28 },
                { role: 'FW', x: 0.24, y: 0.28 }
            ]
        },
        '5-3-2': {
            id: '5-3-2',
            name: '5-3-2 Катеначчо',
            shortDesc: 'Плотный оборонительный редут у своей штрафной и кинжальные прорывы',
            counters: '3-5-2',
            weakTo: '4-3-3',
            slots: [
                { role: 'GK', x: -0.92, y: 0 },
                { role: 'DF', x: -0.68, y: -0.50 },
                { role: 'DF', x: -0.72, y: 0 },
                { role: 'DF', x: -0.68, y: 0.50 },
                { role: 'MF', x: -0.26, y: -0.32 },
                { role: 'MF', x: -0.26, y: 0.32 },
                { role: 'FW', x: 0.26, y: 0 }
            ]
        }
    };

    const MENTALITIES = {
        defensive: {
            id: 'defensive',
            name: 'Контратака',
            shiftX: -0.10,
            pressRadius: 115,
            speedBonus: 0.98,
            tackleBonus: 1.12,
            shotBonus: 0.96
        },
        balanced: {
            id: 'balanced',
            name: 'Баланс',
            shiftX: 0.0,
            pressRadius: 150,
            speedBonus: 1.0,
            tackleBonus: 1.0,
            shotBonus: 1.0
        },
        attacking: {
            id: 'attacking',
            name: 'Прессинг',
            shiftX: 0.12,
            pressRadius: 195,
            speedBonus: 1.05,
            tackleBonus: 0.94,
            shotBonus: 1.08
        }
    };

    const TEAMS = {
        FRA: {
            id: 'FRA',
            code: 'FRA',
            name: 'Франция',
            group: 'A',
            primary: '#1d4ed8',
            secondary: '#ef4444',
            shorts: '#ffffff',
            socks: '#dc2626',
            gkColor: '#eab308',
            formation: '4-3-3',
            ratings: { att: 89, mid: 94, def: 95, spd: 90, gk: 92 },
            roster: [
                { number: 16, name: 'Бартез', role: 'GK', spd: 82, sho: 50, pas: 78, def: 93 },
                { number: 15, name: 'Тюрам', role: 'DF', spd: 89, sho: 72, pas: 82, def: 95 },
                { number: 8, name: 'Десайи', role: 'DF', spd: 85, sho: 66, pas: 79, def: 96 },
                { number: 17, name: 'Пети', role: 'MF', spd: 84, sho: 83, pas: 88, def: 89 },
                { number: 10, name: 'Зидан', role: 'FW', spd: 87, sho: 92, pas: 97, def: 74 },
                { number: 12, name: 'Анри', role: 'FW', spd: 96, sho: 90, pas: 84, def: 62 },
                { number: 6, name: 'Джоркаефф', role: 'FW', spd: 88, sho: 89, pas: 88, def: 65 }
            ]
        },
        BRA: {
            id: 'BRA',
            code: 'BRA',
            name: 'Бразилия',
            group: 'A',
            primary: '#facc15',
            secondary: '#15803d',
            shorts: '#1d4ed8',
            socks: '#ffffff',
            gkColor: '#0ea5e9',
            formation: '4-4-2',
            ratings: { att: 97, mid: 92, def: 88, spd: 96, gk: 89 },
            roster: [
                { number: 1, name: 'Таффарел', role: 'GK', spd: 80, sho: 48, pas: 76, def: 90 },
                { number: 2, name: 'Кафу', role: 'DF', spd: 94, sho: 75, pas: 86, def: 88 },
                { number: 6, name: 'Роберто Карлос', role: 'DF', spd: 97, sho: 95, pas: 85, def: 86 },
                { number: 8, name: 'Дунга', role: 'MF', spd: 81, sho: 82, pas: 90, def: 90 },
                { number: 10, name: 'Ривалдо', role: 'MF', spd: 90, sho: 94, pas: 92, def: 68 },
                { number: 20, name: 'Бебето', role: 'FW', spd: 89, sho: 91, pas: 86, def: 58 },
                { number: 9, name: 'Роналдо', role: 'FW', spd: 98, sho: 98, pas: 88, def: 60 }
            ]
        },
        RUS: {
            id: 'RUS',
            code: 'RUS',
            name: 'Россия',
            group: 'A',
            primary: '#dc2626',
            secondary: '#ffffff',
            shorts: '#ffffff',
            socks: '#dc2626',
            gkColor: '#16a34a',
            formation: '3-5-2',
            ratings: { att: 85, mid: 88, def: 84, spd: 86, gk: 86 },
            roster: [
                { number: 1, name: 'Овчинников', role: 'GK', spd: 79, sho: 45, pas: 74, def: 87 },
                { number: 7, name: 'Онопко', role: 'DF', spd: 80, sho: 70, pas: 80, def: 89 },
                { number: 8, name: 'Карпин', role: 'MF', spd: 87, sho: 85, pas: 88, def: 78 },
                { number: 10, name: 'Мостовой', role: 'MF', spd: 85, sho: 88, pas: 93, def: 72 },
                { number: 15, name: 'Аленичев', role: 'MF', spd: 86, sho: 84, pas: 89, def: 74 },
                { number: 9, name: 'Титов', role: 'FW', spd: 85, sho: 86, pas: 90, def: 70 },
                { number: 11, name: 'Бесчастных', role: 'FW', spd: 88, sho: 89, pas: 80, def: 62 }
            ]
        },
        MEX: {
            id: 'MEX',
            code: 'MEX',
            name: 'Мексика',
            group: 'A',
            primary: '#15803d',
            secondary: '#ffffff',
            shorts: '#ffffff',
            socks: '#dc2626',
            gkColor: '#ec4899',
            formation: '4-3-3',
            ratings: { att: 84, mid: 82, def: 79, spd: 88, gk: 85 },
            roster: [
                { number: 1, name: 'Кампос', role: 'GK', spd: 90, sho: 74, pas: 80, def: 85 },
                { number: 2, name: 'Суарес', role: 'DF', spd: 81, sho: 64, pas: 78, def: 84 },
                { number: 5, name: 'Давино', role: 'DF', spd: 82, sho: 62, pas: 76, def: 81 },
                { number: 6, name: 'Берналь', role: 'MF', spd: 83, sho: 76, pas: 82, def: 82 },
                { number: 11, name: 'Бланко', role: 'FW', spd: 88, sho: 87, pas: 86, def: 64 },
                { number: 15, name: 'Эрнандес', role: 'FW', spd: 91, sho: 88, pas: 80, def: 60 },
                { number: 17, name: 'Паленсия', role: 'FW', spd: 87, sho: 83, pas: 79, def: 61 }
            ]
        },
        ITA: {
            id: 'ITA',
            code: 'ITA',
            name: 'Италия',
            group: 'B',
            primary: '#2563eb',
            secondary: '#ffffff',
            shorts: '#ffffff',
            socks: '#2563eb',
            gkColor: '#71717a',
            formation: '5-3-2',
            ratings: { att: 92, mid: 89, def: 96, spd: 87, gk: 93 },
            roster: [
                { number: 12, name: 'Пальюка', role: 'GK', spd: 81, sho: 48, pas: 78, def: 93 },
                { number: 3, name: 'Мальдини', role: 'DF', spd: 89, sho: 72, pas: 86, def: 98 },
                { number: 5, name: 'Каннаваро', role: 'DF', spd: 88, sho: 65, pas: 80, def: 95 },
                { number: 4, name: 'Неста', role: 'DF', spd: 87, sho: 64, pas: 82, def: 95 },
                { number: 11, name: 'Дино Баджо', role: 'MF', spd: 84, sho: 85, pas: 86, def: 86 },
                { number: 18, name: 'Роберто Баджо', role: 'MF', spd: 86, sho: 93, pas: 95, def: 64 },
                { number: 21, name: 'Вьери', role: 'FW', spd: 88, sho: 95, pas: 80, def: 68 }
            ]
        },
        ENG: {
            id: 'ENG',
            code: 'ENG',
            name: 'Англия',
            group: 'B',
            primary: '#f8fafc',
            secondary: '#dc2626',
            shorts: '#1e293b',
            socks: '#f8fafc',
            gkColor: '#dc2626',
            formation: '4-4-2',
            ratings: { att: 91, mid: 90, def: 89, spd: 91, gk: 88 },
            roster: [
                { number: 1, name: 'Симен', role: 'GK', spd: 78, sho: 48, pas: 76, def: 89 },
                { number: 2, name: 'Кэмпбелл', role: 'DF', spd: 86, sho: 64, pas: 75, def: 92 },
                { number: 6, name: 'Адамс', role: 'DF', spd: 79, sho: 68, pas: 76, def: 91 },
                { number: 7, name: 'Бекхэм', role: 'MF', spd: 86, sho: 92, pas: 97, def: 78 },
                { number: 16, name: 'Скоулз', role: 'MF', spd: 85, sho: 91, pas: 92, def: 79 },
                { number: 20, name: 'Оуэн', role: 'FW', spd: 97, sho: 91, pas: 82, def: 58 },
                { number: 9, name: 'Ширер', role: 'FW', spd: 86, sho: 95, pas: 81, def: 68 }
            ]
        },
        ESP: {
            id: 'ESP',
            code: 'ESP',
            name: 'Испания',
            group: 'B',
            primary: '#dc2626',
            secondary: '#facc15',
            shorts: '#1e3a8a',
            socks: '#1e3a8a',
            gkColor: '#22c55e',
            formation: '4-4-2',
            ratings: { att: 89, mid: 90, def: 87, spd: 88, gk: 89 },
            roster: [
                { number: 1, name: 'Субисаррета', role: 'GK', spd: 77, sho: 45, pas: 76, def: 88 },
                { number: 6, name: 'Йерро', role: 'DF', spd: 82, sho: 88, pas: 86, def: 92 },
                { number: 12, name: 'Серхи', role: 'DF', spd: 89, sho: 70, pas: 82, def: 85 },
                { number: 21, name: 'Луис Энрике', role: 'MF', spd: 89, sho: 87, pas: 88, def: 82 },
                { number: 8, name: 'Герреро', role: 'MF', spd: 84, sho: 86, pas: 89, def: 75 },
                { number: 10, name: 'Рауль', role: 'FW', spd: 90, sho: 93, pas: 88, def: 64 },
                { number: 19, name: 'Кико', role: 'FW', spd: 85, sho: 88, pas: 84, def: 62 }
            ]
        },
        NGA: {
            id: 'NGA',
            code: 'NGA',
            name: 'Нигерия',
            group: 'B',
            primary: '#16a34a',
            secondary: '#ffffff',
            shorts: '#ffffff',
            socks: '#16a34a',
            gkColor: '#f59e0b',
            formation: '4-3-3',
            ratings: { att: 87, mid: 86, def: 80, spd: 94, gk: 79 },
            roster: [
                { number: 1, name: 'Руфаи', role: 'GK', spd: 80, sho: 45, pas: 70, def: 80 },
                { number: 3, name: 'Бабаяро', role: 'DF', spd: 91, sho: 70, pas: 78, def: 82 },
                { number: 5, name: 'Уче', role: 'DF', spd: 84, sho: 64, pas: 75, def: 83 },
                { number: 10, name: 'Окоча', role: 'MF', spd: 93, sho: 89, pas: 92, def: 68 },
                { number: 7, name: 'Финиди', role: 'FW', spd: 92, sho: 84, pas: 85, def: 64 },
                { number: 4, name: 'Кану', role: 'FW', spd: 86, sho: 88, pas: 89, def: 60 },
                { number: 11, name: 'Бабангида', role: 'FW', spd: 97, sho: 83, pas: 80, def: 58 }
            ]
        },
        NED: {
            id: 'NED',
            code: 'NED',
            name: 'Нидерланды',
            group: 'C',
            primary: '#f97316',
            secondary: '#111827',
            shorts: '#ffffff',
            socks: '#f97316',
            gkColor: '#16a34a',
            formation: '4-3-3',
            ratings: { att: 94, mid: 93, def: 90, spd: 92, gk: 91 },
            roster: [
                { number: 1, name: 'ван дер Сар', role: 'GK', spd: 82, sho: 50, pas: 84, def: 92 },
                { number: 3, name: 'Стам', role: 'DF', spd: 85, sho: 68, pas: 78, def: 95 },
                { number: 4, name: 'Ф. де Бур', role: 'DF', spd: 84, sho: 84, pas: 91, def: 91 },
                { number: 8, name: 'Давидс', role: 'MF', spd: 92, sho: 85, pas: 88, def: 92 },
                { number: 14, name: 'Овермарс', role: 'FW', spd: 97, sho: 86, pas: 87, def: 62 },
                { number: 10, name: 'Бергкамп', role: 'FW', spd: 88, sho: 95, pas: 95, def: 64 },
                { number: 9, name: 'Клюйверт', role: 'FW', spd: 90, sho: 92, pas: 84, def: 65 }
            ]
        },
        ARG: {
            id: 'ARG',
            code: 'ARG',
            name: 'Аргентина',
            group: 'C',
            primary: '#38bdf8',
            secondary: '#ffffff',
            shorts: '#111827',
            socks: '#ffffff',
            gkColor: '#15803d',
            formation: '3-5-2',
            ratings: { att: 95, mid: 91, def: 88, spd: 91, gk: 87 },
            roster: [
                { number: 1, name: 'Роа', role: 'GK', spd: 81, sho: 46, pas: 76, def: 88 },
                { number: 2, name: 'Айяла', role: 'DF', spd: 87, sho: 66, pas: 80, def: 92 },
                { number: 8, name: 'Симеоне', role: 'MF', spd: 86, sho: 82, pas: 86, def: 91 },
                { number: 11, name: 'Верон', role: 'MF', spd: 85, sho: 90, pas: 95, def: 79 },
                { number: 22, name: 'Дзанетти', role: 'MF', spd: 91, sho: 82, pas: 87, def: 90 },
                { number: 10, name: 'Ортега', role: 'FW', spd: 93, sho: 88, pas: 91, def: 62 },
                { number: 9, name: 'Батистута', role: 'FW', spd: 90, sho: 98, pas: 82, def: 64 }
            ]
        },
        CRO: {
            id: 'CRO',
            code: 'CRO',
            name: 'Хорватия',
            group: 'C',
            primary: '#ef4444',
            secondary: '#ffffff',
            shorts: '#ffffff',
            socks: '#2563eb',
            gkColor: '#1d4ed8',
            formation: '3-5-2',
            ratings: { att: 91, mid: 91, def: 87, spd: 86, gk: 87 },
            roster: [
                { number: 1, name: 'Ладич', role: 'GK', spd: 80, sho: 45, pas: 75, def: 88 },
                { number: 6, name: 'Билич', role: 'DF', spd: 82, sho: 68, pas: 80, def: 90 },
                { number: 17, name: 'Ярни', role: 'MF', spd: 91, sho: 84, pas: 86, def: 84 },
                { number: 10, name: 'Бобан', role: 'MF', spd: 85, sho: 88, pas: 93, def: 78 },
                { number: 8, name: 'Просинечки', role: 'MF', spd: 83, sho: 89, pas: 94, def: 72 },
                { number: 19, name: 'Влаович', role: 'FW', spd: 87, sho: 86, pas: 81, def: 62 },
                { number: 9, name: 'Шукер', role: 'FW', spd: 88, sho: 96, pas: 86, def: 62 }
            ]
        },
        JPN: {
            id: 'JPN',
            code: 'JPN',
            name: 'Япония',
            group: 'C',
            primary: '#1d4ed8',
            secondary: '#ffffff',
            shorts: '#ffffff',
            socks: '#1d4ed8',
            gkColor: '#f97316',
            formation: '4-4-2',
            ratings: { att: 78, mid: 83, def: 79, spd: 89, gk: 81 },
            roster: [
                { number: 20, name: 'Кавагути', role: 'GK', spd: 84, sho: 44, pas: 74, def: 83 },
                { number: 4, name: 'Ихара', role: 'DF', spd: 82, sho: 60, pas: 76, def: 83 },
                { number: 3, name: 'Сома', role: 'DF', spd: 88, sho: 68, pas: 80, def: 80 },
                { number: 8, name: 'Наката', role: 'MF', spd: 89, sho: 86, pas: 91, def: 76 },
                { number: 10, name: 'Нанами', role: 'MF', spd: 86, sho: 82, pas: 87, def: 74 },
                { number: 9, name: 'Накаяма', role: 'FW', spd: 86, sho: 82, pas: 76, def: 60 },
                { number: 11, name: 'Оно', role: 'FW', spd: 87, sho: 81, pas: 86, def: 60 }
            ]
        },
        GER: {
            id: 'GER',
            code: 'GER',
            name: 'Германия',
            group: 'D',
            primary: '#ffffff',
            secondary: '#111827',
            shorts: '#111827',
            socks: '#ffffff',
            gkColor: '#2563eb',
            formation: '5-3-2',
            ratings: { att: 92, mid: 90, def: 92, spd: 86, gk: 91 },
            roster: [
                { number: 1, name: 'Кёпке', role: 'GK', spd: 80, sho: 46, pas: 78, def: 91 },
                { number: 4, name: 'Колер', role: 'DF', spd: 81, sho: 62, pas: 76, def: 93 },
                { number: 8, name: 'Маттеус', role: 'DF', spd: 83, sho: 88, pas: 91, def: 92 },
                { number: 2, name: 'Вёрнс', role: 'DF', spd: 82, sho: 64, pas: 78, def: 89 },
                { number: 7, name: 'Мёллер', role: 'MF', spd: 87, sho: 88, pas: 90, def: 74 },
                { number: 10, name: 'Хесслер', role: 'MF', spd: 86, sho: 87, pas: 91, def: 74 },
                { number: 18, name: 'Клинсманн', role: 'FW', spd: 89, sho: 94, pas: 83, def: 66 }
            ]
        },
        DEN: {
            id: 'DEN',
            code: 'DEN',
            name: 'Дания',
            group: 'D',
            primary: '#dc2626',
            secondary: '#ffffff',
            shorts: '#ffffff',
            socks: '#dc2626',
            gkColor: '#eab308',
            formation: '4-4-2',
            ratings: { att: 88, mid: 89, def: 86, spd: 87, gk: 95 },
            roster: [
                { number: 1, name: 'Шмейхель', role: 'GK', spd: 84, sho: 60, pas: 84, def: 96 },
                { number: 3, name: 'Рипер', role: 'DF', spd: 79, sho: 68, pas: 76, def: 88 },
                { number: 6, name: 'Хельвег', role: 'DF', spd: 86, sho: 72, pas: 80, def: 86 },
                { number: 7, name: 'Нильсен', role: 'MF', spd: 84, sho: 82, pas: 85, def: 82 },
                { number: 10, name: 'М. Лаудруп', role: 'MF', spd: 86, sho: 88, pas: 96, def: 70 },
                { number: 11, name: 'Б. Лаудруп', role: 'FW', spd: 92, sho: 90, pas: 90, def: 64 },
                { number: 19, name: 'Санд', role: 'FW', spd: 88, sho: 87, pas: 79, def: 60 }
            ]
        },
        YUG: {
            id: 'YUG',
            code: 'YUG',
            name: 'Югославия',
            group: 'D',
            primary: '#1e40af',
            secondary: '#ffffff',
            shorts: '#ffffff',
            socks: '#dc2626',
            gkColor: '#16a34a',
            formation: '3-5-2',
            ratings: { att: 90, mid: 91, def: 86, spd: 86, gk: 85 },
            roster: [
                { number: 1, name: 'Краль', role: 'GK', spd: 79, sho: 45, pas: 74, def: 85 },
                { number: 11, name: 'Михайлович', role: 'DF', spd: 82, sho: 95, pas: 90, def: 87 },
                { number: 3, name: 'Джорович', role: 'DF', spd: 82, sho: 64, pas: 76, def: 86 },
                { number: 10, name: 'Стойкович', role: 'MF', spd: 86, sho: 89, pas: 94, def: 72 },
                { number: 7, name: 'Югович', role: 'MF', spd: 86, sho: 85, pas: 88, def: 84 },
                { number: 8, name: 'Савичевич', role: 'FW', spd: 88, sho: 91, pas: 91, def: 62 },
                { number: 9, name: 'Миятович', role: 'FW', spd: 91, sho: 93, pas: 87, def: 63 }
            ]
        },
        COL: {
            id: 'COL',
            code: 'COL',
            name: 'Колумбия',
            group: 'D',
            primary: '#facc15',
            secondary: '#1d4ed8',
            shorts: '#1d4ed8',
            socks: '#dc2626',
            gkColor: '#a855f7',
            formation: '4-4-2',
            ratings: { att: 85, mid: 88, def: 82, spd: 88, gk: 84 },
            roster: [
                { number: 22, name: 'Мондрагон', role: 'GK', spd: 82, sho: 46, pas: 76, def: 86 },
                { number: 3, name: 'Паласиос', role: 'DF', spd: 85, sho: 62, pas: 76, def: 84 },
                { number: 5, name: 'Бермудес', role: 'DF', spd: 81, sho: 65, pas: 78, def: 85 },
                { number: 19, name: 'ринкон', role: 'MF', spd: 87, sho: 85, pas: 86, def: 78 },
                { number: 10, name: 'Вальдеррама', role: 'MF', spd: 79, sho: 84, pas: 96, def: 68 },
                { number: 11, name: 'Асприлья', role: 'FW', spd: 93, sho: 89, pas: 82, def: 60 },
                { number: 9, name: 'Валенсия', role: 'FW', spd: 88, sho: 86, pas: 80, def: 60 }
            ]
        }
    };

    const CLASSIC_SCENARIOS = [
        {
            id: 'final_98_brazil_comeback',
            title: 'Сен-Дени 1998: Реванш Роналдо',
            year: '12 июля 1998',
            subtitle: 'Финал ЧМ-98 • Франция 2 : 0 Бразилия (65-я минута)',
            description: 'Дубль Зидана после угловых поверг Селесао в шок. Возьмите управление сборной Бразилии на 65-й минуте финала на «Стад де Франс» и сотворите чудо против стальной обороны хозяев!',
            playerTeam: 'BRA',
            aiTeam: 'FRA',
            homeTeam: 'BRA',
            awayTeam: 'FRA',
            initialHomeScore: 0,
            initialAwayScore: 2,
            startMinute: 65,
            stadium: 'stade_de_france',
            weather: 'night',
            goldenGoal: true
        },
        {
            id: 'paris_98_russia_france',
            title: 'Битва в Париже: Россия против Чемпионов',
            year: '1998 / 1999',
            subtitle: 'Стад де Франс • Франция 2 : 2 Россия (72-я минута)',
            description: 'Напряжённая рубка на «Стад де Франс»! Счёт 2:2 во втором тайме — выведите сборную России вперёд комбинацией Карпина, Мостового и Бесчастных!',
            playerTeam: 'RUS',
            aiTeam: 'FRA',
            homeTeam: 'RUS',
            awayTeam: 'FRA',
            initialHomeScore: 2,
            initialAwayScore: 2,
            startMinute: 72,
            stadium: 'stade_de_france',
            weather: 'night',
            goldenGoal: true
        },
        {
            id: 'marseille_98_ned_arg',
            title: 'Марсель 1998: Шедевр Бергкампа',
            year: '4 июля 1998',
            subtitle: '1/4 финала ЧМ-98 • Нидерланды 1 : 1 Аргентина (80-я минута)',
            description: 'Жаркий четвертьфинал на «Велодроме». Клюйверт и Клаудио Лопес обменялись голами. До конца основного времени 10 минут — отдайте длинную передачу на Денниса Бергкампа и решите исход битвы!',
            playerTeam: 'NED',
            aiTeam: 'ARG',
            homeTeam: 'NED',
            awayTeam: 'ARG',
            initialHomeScore: 1,
            initialAwayScore: 1,
            startMinute: 80,
            stadium: 'velodrome',
            weather: 'sunny',
            goldenGoal: true
        },
        {
            id: 'saint_etienne_98_eng_arg',
            title: 'Сент-Этьен 1998: Британский характер',
            year: '30 июня 1998',
            subtitle: '1/8 финала ЧМ-98 • Англия 2 : 2 Аргентина (75-я минута)',
            description: 'После сольного прохода Майкла Оуэна счёт равный 2:2, а дождь заливает газон. Выдержите штурм Батистуты и вырвите путёвку в четвертьфинал для сборной Англии!',
            playerTeam: 'ENG',
            aiTeam: 'ARG',
            homeTeam: 'ENG',
            awayTeam: 'ARG',
            initialHomeScore: 2,
            initialAwayScore: 2,
            startMinute: 75,
            stadium: 'gerland',
            weather: 'rain',
            goldenGoal: true
        },
        {
            id: 'pasadena_94_ita_bra',
            title: 'Золотая классика: Италия — Бразилия',
            year: 'Классика ЧМ',
            subtitle: 'Дополнительное время • Италия 0 : 0 Бразилия (91-я минута, Золотой гол)',
            description: 'Нулевая ничья между Скуадрой Адзуррой и тетракампеонами. Начинается дополнительное время по правилу «Золотого гола» — один точный удар Роберто Баджо или Вьери принесёт Кубок мира!',
            playerTeam: 'ITA',
            aiTeam: 'BRA',
            homeTeam: 'ITA',
            awayTeam: 'BRA',
            initialHomeScore: 0,
            initialAwayScore: 0,
            startMinute: 90,
            startHalf: 3,
            stadium: 'parc_des_princes',
            weather: 'sunny',
            goldenGoal: true
        }
    ];

    function clamp(val, min, max) {
        return Math.max(min, Math.min(max, val));
    }

    function hypot2(dx, dy) {
        return Math.hypot(dx, dy);
    }

    function getTacticalBonus(ownFormation, oppFormation, mentalityId) {
        const form = FORMATIONS[ownFormation] || FORMATIONS['4-4-2'];
        const ment = MENTALITIES[mentalityId] || MENTALITIES.balanced;
        let formEdge = 1.0;
        if (form.counters === oppFormation) {
            formEdge = 1.09;
        } else if (form.weakTo === oppFormation) {
            formEdge = 0.93;
        }
        return {
            formationEdge: formEdge,
            speedMult: ment.speedBonus * (formEdge > 1 ? 1.03 : 1.0),
            tackleMult: ment.tackleBonus * formEdge,
            shotMult: ment.shotBonus * formEdge,
            shiftX: ment.shiftX,
            pressRadius: ment.pressRadius
        };
    }

    class PenaltyShootout {
        constructor(options = {}) {
            this.homeTeamId = options.homeTeam || 'FRA';
            this.awayTeamId = options.awayTeam || 'BRA';
            this.homeTeam = TEAMS[this.homeTeamId] || TEAMS.FRA;
            this.awayTeam = TEAMS[this.awayTeamId] || TEAMS.BRA;
            this.rng = options.rng || Math.random;
            this.round = 1;
            this.turn = 'home';
            this.homeScore = 0;
            this.awayScore = 0;
            this.homeHistory = [];
            this.awayHistory = [];
            this.finished = false;
            this.winner = null;
            this.lastResult = null;
        }

        takeKick(kickSpec = {}, keeperSpec = null) {
            if (this.finished) return this.lastResult;
            const zoneX = clamp(Number(kickSpec.zoneX ?? 0), -1, 1);
            const zoneY = clamp(Number(kickSpec.zoneY ?? 0), 0, 1);
            const power = clamp(Number(kickSpec.power ?? 0.75), 0.1, 1.3);

            const diveX = keeperSpec && typeof keeperSpec.diveX === 'number'
                ? clamp(keeperSpec.diveX, -1, 1)
                : Math.round((this.rng() * 2) - 1);
            const diveY = keeperSpec && typeof keeperSpec.diveY === 'number'
                ? clamp(keeperSpec.diveY, 0, 1)
                : (this.rng() > 0.5 ? 1 : 0);

            const kickingTeam = this.turn === 'home' ? this.homeTeam : this.awayTeam;
            const keepingTeam = this.turn === 'home' ? this.awayTeam : this.homeTeam;
            const kickerIndex = ((this.turn === 'home' ? this.homeHistory.length : this.awayHistory.length) % 6) + 1;
            const kicker = kickingTeam.roster[kickerIndex] || kickingTeam.roster[kickingTeam.roster.length - 1];

            let outcome = 'goal';
            let description = `${kicker.name} точно бьёт в угол! ГОЛ!`;

            if (power > 1.06 || (power > 0.96 && zoneY > 0.8 && this.rng() < 0.65)) {
                outcome = 'miss';
                description = `${kicker.name} посылает мяч выше перекладины! Промах!`;
            } else if (Math.abs(zoneX) > 0.92 && power > 0.92 && this.rng() < 0.35) {
                outcome = 'post';
                description = `ШТАНГА! ${kicker.name} сотрясает каркас ворот!`;
            } else {
                const sameSide = diveX === Math.sign(zoneX);
                const sameHeight = Math.abs(diveY - Math.round(zoneY)) === 0;
                const gkFactor = (keepingTeam.ratings.gk || 88) / 100;
                if (sameSide && sameHeight) {
                    const cornerDifficulty = Math.abs(zoneX) > 0.6 && power >= 0.68 && power <= 0.92 ? 0.28 : 0.78;
                    if (this.rng() < cornerDifficulty * gkFactor) {
                        outcome = 'save';
                        description = `СЕЙВ! ${keepingTeam.roster[0].name} в прыжке вытаскивает удар ${kicker.name}!`;
                    }
                } else if (sameSide && Math.abs(zoneX) < 0.45 && this.rng() < 0.48 * gkFactor) {
                    outcome = 'save';
                    description = `${keepingTeam.roster[0].name} отражает мяч ногами!`;
                }
            }

            if (this.turn === 'home') {
                this.homeHistory.push(outcome);
                if (outcome === 'goal') this.homeScore++;
                this.turn = 'away';
            } else {
                this.awayHistory.push(outcome);
                if (outcome === 'goal') this.awayScore++;
                this.turn = 'home';
                this.round++;
            }

            this.evaluateWinner();

            this.lastResult = {
                outcome,
                description,
                kicker: kicker.name,
                keeper: keepingTeam.roster[0].name,
                zoneX,
                zoneY,
                power,
                diveX,
                diveY,
                homeScore: this.homeScore,
                awayScore: this.awayScore,
                finished: this.finished,
                winner: this.winner
            };
            return this.lastResult;
        }

        evaluateWinner() {
            const hTaken = this.homeHistory.length;
            const aTaken = this.awayHistory.length;

            if (hTaken <= 5 && aTaken <= 5) {
                const hRem = 5 - hTaken;
                const aRem = 5 - aTaken;
                if (this.homeScore > this.awayScore + aRem) {
                    this.finished = true;
                    this.winner = 'home';
                    return;
                }
                if (this.awayScore > this.homeScore + hRem) {
                    this.finished = true;
                    this.winner = 'away';
                    return;
                }
                if (hTaken === 5 && aTaken === 5 && this.homeScore !== this.awayScore) {
                    this.finished = true;
                    this.winner = this.homeScore > this.awayScore ? 'home' : 'away';
                }
            } else if (hTaken === aTaken && this.homeScore !== this.awayScore) {
                this.finished = true;
                this.winner = this.homeScore > this.awayScore ? 'home' : 'away';
            }
        }
    }

    class Match {
        constructor(options = {}) {
            this.homeTeamId = options.homeTeam || 'FRA';
            this.awayTeamId = options.awayTeam || 'BRA';
            this.homeTeam = TEAMS[this.homeTeamId] || TEAMS.FRA;
            this.awayTeam = TEAMS[this.awayTeamId] || TEAMS.BRA;

            this.homeFormation = options.homeFormation || this.homeTeam.formation || '4-4-2';
            this.awayFormation = options.awayFormation || this.awayTeam.formation || '4-4-2';
            this.homeMentality = options.homeMentality || 'balanced';
            this.awayMentality = options.awayMentality || 'balanced';

            this.stadiumId = options.stadium || 'stade_de_france';
            this.stadium = STADIUMS[this.stadiumId] || STADIUMS.stade_de_france;
            this.weatherId = options.weather || 'sunny';
            this.weather = WEATHER_TYPES[this.weatherId] || WEATHER_TYPES.sunny;

            this.halfDuration = options.halfDuration || 90;
            this.extraHalfDuration = options.extraHalfDuration || 30;
            this.goldenGoal = options.goldenGoal !== undefined ? Boolean(options.goldenGoal) : true;
            this.allowExtraTime = options.allowExtraTime !== undefined ? Boolean(options.allowExtraTime) : true;
            this.rng = options.rng || Math.random;

            this.score = {
                home: Number(options.initialHomeScore || 0),
                away: Number(options.initialAwayScore || 0)
            };

            this.half = Number(options.startHalf || 1);
            this.clock = 0;
            if (options.startMinute) {
                const min = Number(options.startMinute);
                if (min >= 90) {
                    this.half = 3;
                    this.clock = ((min - 90) / 15) * this.extraHalfDuration;
                } else if (min >= 45) {
                    this.half = 2;
                    this.clock = ((min - 45) / 45) * this.halfDuration;
                } else {
                    this.half = 1;
                    this.clock = (min / 45) * this.halfDuration;
                }
            }

            this.state = 'kickoff';
            this.stateTimer = 0.8;
            this.kickoffTeam = options.kickoffTeam || 'home';
            this.lastTouchTeam = 'home';
            this.lastTouchPlayer = null;
            this.winner = null;

            this.momentum = { home: 0, away: 0 };
            this.stats = {
                home: { shots: 0, onTarget: 0, passes: 0, tackles: 0, fouls: 0, yellowCards: 0, redCards: 0, corners: 0, possessionTime: 0 },
                away: { shots: 0, onTarget: 0, passes: 0, tackles: 0, fouls: 0, yellowCards: 0, redCards: 0, corners: 0, possessionTime: 0 }
            };

            this.events = [];
            this.commentary = `${this.homeTeam.name} — ${this.awayTeam.name}: добро пожаловать на «${this.stadium.name}»!`;
            this.commentaryTimer = 4.0;

            this.shotCharge = {
                active: false,
                power: 0,
                player: null
            };

            this.setPiece = null;
            this.shootout = null;

            this.ball = {
                x: 0,
                y: 0,
                z: 0,
                vx: 0,
                vy: 0,
                vz: 0,
                spinX: 0,
                spinY: 0,
                owner: null,
                trail: []
            };

            this.players = [];
            this.initPlayers();
            this.controlledPlayer = this.players.find(p => p.team === 'home' && p.role === 'FW') || this.players[1];
            this.setupKickoff(this.kickoffTeam);
        }

        initPlayers() {
            this.players = [];
            const createSide = (teamKey, teamObj, formationId) => {
                const form = FORMATIONS[formationId] || FORMATIONS['4-4-2'];
                const sign = teamKey === 'home' ? 1 : -1;
                form.slots.forEach((slot, idx) => {
                    const meta = teamObj.roster[idx] || teamObj.roster[teamObj.roster.length - 1];
                    const homeX = slot.x * PITCH_HALF_W * sign;
                    const homeY = slot.y * PITCH_HALF_H * sign;
                    this.players.push({
                        id: `${teamKey}_${idx}`,
                        index: idx,
                        team: teamKey,
                        teamCode: teamObj.code,
                        name: meta.name,
                        number: meta.number,
                        role: slot.role,
                        baseX: slot.x,
                        baseY: slot.y,
                        homeX,
                        homeY,
                        x: homeX,
                        y: homeY,
                        vx: 0,
                        vy: 0,
                        dirX: sign,
                        dirY: 0,
                        spd: meta.spd,
                        sho: meta.sho,
                        pas: meta.pas,
                        def: meta.def,
                        stamina: 100,
                        yellowCards: 0,
                        sentOff: false,
                        stunTimer: 0,
                        slideTimer: 0,
                        evadeTimer: 0,
                        diveTimer: 0,
                        diveVy: 0,
                        animPhase: idx * 0.9
                    });
                });
            };

            createSide('home', this.homeTeam, this.homeFormation);
            createSide('away', this.awayTeam, this.awayFormation);
        }

        setFormation(teamKey, formationId) {
            if (!FORMATIONS[formationId]) return;
            if (teamKey === 'home') {
                this.homeFormation = formationId;
            } else {
                this.awayFormation = formationId;
            }
            const form = FORMATIONS[formationId];
            const sign = teamKey === 'home' ? 1 : -1;
            const sidePlayers = this.players.filter(p => p.team === teamKey);
            sidePlayers.forEach((p, idx) => {
                const slot = form.slots[idx] || form.slots[form.slots.length - 1];
                p.role = slot.role;
                p.baseX = slot.x;
                p.baseY = slot.y;
                p.homeX = slot.x * PITCH_HALF_W * sign;
                p.homeY = slot.y * PITCH_HALF_H * sign;
            });
        }

        setMentality(teamKey, mentalityId) {
            if (!MENTALITIES[mentalityId]) return;
            if (teamKey === 'home') {
                this.homeMentality = mentalityId;
            } else {
                this.awayMentality = mentalityId;
            }
            this.pushEvent('tactics', {
                team: teamKey,
                mentality: mentalityId,
                text: `${teamKey === 'home' ? this.homeTeam.name : this.awayTeam.name}: тактика «${MENTALITIES[mentalityId].name}»`
            });
        }

        pushEvent(type, payload = {}) {
            const evt = { type, time: this.getDisplayMinute(), ...payload };
            this.events.push(evt);
            if (this.events.length > 40) {
                this.events.shift();
            }
            if (payload.text) {
                this.commentary = payload.text;
                this.commentaryTimer = 3.5;
            }
            return evt;
        }

        getDisplayMinute() {
            if (this.half === 1) {
                return Math.min(45, Math.floor((this.clock / this.halfDuration) * 45) + 1);
            }
            if (this.half === 2) {
                return Math.min(90, 45 + Math.floor((this.clock / this.halfDuration) * 45) + 1);
            }
            if (this.half === 3) {
                return Math.min(105, 90 + Math.floor((this.clock / this.extraHalfDuration) * 15) + 1);
            }
            return Math.min(120, 105 + Math.floor((this.clock / this.extraHalfDuration) * 15) + 1);
        }

        setupKickoff(teamKey = 'home') {
            this.kickoffTeam = teamKey;
            this.state = 'kickoff';
            this.stateTimer = 0.65;
            this.shotCharge.active = false;
            this.shotCharge.power = 0;
            this.setPiece = null;

            this.ball.x = 0;
            this.ball.y = 0;
            this.ball.z = 0;
            this.ball.vx = 0;
            this.ball.vy = 0;
            this.ball.vz = 0;
            this.ball.spinX = 0;
            this.ball.spinY = 0;
            this.ball.owner = null;

            this.players.forEach(p => {
                if (p.sentOff) {
                    p.x = 0;
                    p.y = -PITCH_HALF_H - 60;
                    return;
                }
                const sign = p.team === 'home' ? 1 : -1;
                p.homeX = p.baseX * PITCH_HALF_W * sign;
                p.homeY = p.baseY * PITCH_HALF_H * sign;
                p.x = p.homeX;
                p.y = p.homeY;
                if (p.role === 'FW') {
                    p.x = -Math.abs(p.homeX) * 0.35 * sign;
                }
                p.vx = 0;
                p.vy = 0;
                p.dirX = sign;
                p.dirY = 0;
                p.slideTimer = 0;
                p.stunTimer = 0;
            });

            const centerFw = this.players.find(p => p.team === teamKey && !p.sentOff && p.role === 'FW')
                || this.players.find(p => p.team === teamKey && !p.sentOff && p.role !== 'GK');
            if (centerFw) {
                centerFw.x = teamKey === 'home' ? -6 : 6;
                centerFw.y = 0;
                this.givePossession(centerFw);
            }
        }

        givePossession(player) {
            if (!player || player.sentOff) return;
            this.ball.owner = player;
            this.ball.z = 0;
            this.ball.vx = player.vx;
            this.ball.vy = player.vy;
            this.ball.vz = 0;
            this.ball.spinX = 0;
            this.ball.spinY = 0;
            this.lastTouchTeam = player.team;
            this.lastTouchPlayer = player;
            if (player.team === 'home') {
                this.controlledPlayer = player;
            }
        }

        pass(dirX, dirY) {
            const owner = this.ball.owner;
            if (!owner || owner.team !== 'home') {
                return this.switchPlayer();
            }

            if (this.state === 'kickoff' || this.state === 'throw_in' || this.state === 'corner' || this.state === 'goal_kick' || this.state === 'free_kick') {
                this.state = 'playing';
                this.setPiece = null;
            }

            const aimX = (dirX !== 0 || dirY !== 0) ? dirX : owner.dirX;
            const aimY = (dirX !== 0 || dirY !== 0) ? dirY : owner.dirY;
            const aimLen = hypot2(aimX, aimY) || 1;
            const nx = aimX / aimLen;
            const ny = aimY / aimLen;

            let bestMate = null;
            let bestScore = -Infinity;
            const mates = this.players.filter(p => p.team === owner.team && p !== owner && !p.sentOff);
            for (const m of mates) {
                const dx = m.x - owner.x;
                const dy = m.y - owner.y;
                const dist = hypot2(dx, dy);
                if (dist < 18 || dist > 480) continue;
                const dot = (dx * nx + dy * ny) / dist;
                if (dot < 0.15) continue;
                const score = dot * 220 - dist * 0.32 + (owner.team === 'home' ? m.x * 0.08 : -m.x * 0.08);
                if (score > bestScore) {
                    bestScore = score;
                    bestMate = m;
                }
            }

            let targetX = owner.x + nx * 210;
            let targetY = owner.y + ny * 210;
            if (bestMate) {
                targetX = bestMate.x + bestMate.vx * 0.24;
                targetY = bestMate.y + bestMate.vy * 0.24;
            }

            const dx = targetX - owner.x;
            const dy = targetY - owner.y;
            const dist = hypot2(dx, dy) || 1;
            const passSpeed = clamp(275 + dist * 0.42 + (owner.pas - 80) * 1.6, 260, 470);

            this.ball.owner = null;
            this.ball.x = owner.x + (dx / dist) * 12;
            this.ball.y = owner.y + (dy / dist) * 12;
            this.ball.z = 2;
            this.ball.vx = (dx / dist) * passSpeed;
            this.ball.vy = (dy / dist) * passSpeed;
            this.ball.vz = 18;
            this.ball.spinX = 0;
            this.ball.spinY = 0;

            this.stats[owner.team].passes++;
            this.momentum[owner.team] = Math.min(5, this.momentum[owner.team] + 1);
            this.momentum[owner.team === 'home' ? 'away' : 'home'] = 0;

            if (bestMate && owner.team === 'home') {
                this.controlledPlayer = bestMate;
            }

            this.pushEvent('pass', {
                team: owner.team,
                from: owner.name,
                to: bestMate ? bestMate.name : null,
                text: bestMate
                    ? `${owner.name} играет в пас на ${bestMate.name}`
                    : `${owner.name} делает передачу вперёд`
            });
            return true;
        }

        lobPass(dirX, dirY) {
            const owner = this.ball.owner;
            if (!owner) return false;

            if (this.state === 'kickoff' || this.state === 'throw_in' || this.state === 'corner' || this.state === 'goal_kick' || this.state === 'free_kick') {
                this.state = 'playing';
                this.setPiece = null;
            }

            const sign = owner.team === 'home' ? 1 : -1;
            const isWingCross = owner.x * sign > 60 && Math.abs(owner.y) > 110;
            let targetX;
            let targetY;

            if (isWingCross) {
                targetX = sign * (PITCH_HALF_W - 92);
                targetY = clamp(-owner.y * 0.25, -75, 75);
            } else {
                const aimX = (dirX !== 0 || dirY !== 0) ? dirX : sign;
                const aimY = (dirX !== 0 || dirY !== 0) ? dirY : 0;
                const len = hypot2(aimX, aimY) || 1;
                targetX = clamp(owner.x + (aimX / len) * 250, -PITCH_HALF_W + 25, PITCH_HALF_W - 25);
                targetY = clamp(owner.y + (aimY / len) * 190, -PITCH_HALF_H + 25, PITCH_HALF_H - 25);
            }

            const dx = targetX - owner.x;
            const dy = targetY - owner.y;
            const dist = hypot2(dx, dy) || 1;
            const flightSpeed = clamp(240 + dist * 0.45, 240, 410);

            this.ball.owner = null;
            this.ball.x = owner.x + (dx / dist) * 13;
            this.ball.y = owner.y + (dy / dist) * 13;
            this.ball.z = 8;
            this.ball.vx = (dx / dist) * flightSpeed;
            this.ball.vy = (dy / dist) * flightSpeed;
            this.ball.vz = isWingCross ? 138 : 112;
            this.ball.spinY = isWingCross ? -Math.sign(owner.y) * 28 : 0;

            this.stats[owner.team].passes++;
            const receiver = this.findNearestTeammateToPoint(owner.team, targetX, targetY, owner);
            if (receiver && owner.team === 'home') {
                this.controlledPlayer = receiver;
            }

            this.pushEvent(isWingCross ? 'cross' : 'lob', {
                team: owner.team,
                from: owner.name,
                text: isWingCross
                    ? `${owner.name} подаёт верхом во вратарскую под удар с лёта!`
                    : `${owner.name} забрасывает мяч на ход за спины защитникам!`
            });
            return true;
        }

        startChargeShot() {
            const p = this.ball.owner || this.controlledPlayer;
            if (!p || p.team !== 'home') return false;
            this.shotCharge.active = true;
            this.shotCharge.power = 0.15;
            this.shotCharge.player = p;
            return true;
        }

        releaseShot(dirX = 1, dirY = 0, curveInput = 0, explicitPower = null) {
            const shooter = this.ball.owner || this.controlledPlayer;
            const rawPower = explicitPower !== null ? explicitPower : (this.shotCharge.active ? this.shotCharge.power : 0.72);
            this.shotCharge.active = false;
            this.shotCharge.power = 0;

            if (!shooter) return false;
            const sign = shooter.team === 'home' ? 1 : -1;

            const isAirVolley = !this.ball.owner && this.ball.z > 10 && hypot2(this.ball.x - shooter.x, this.ball.y - shooter.y) < 42;
            if (this.ball.owner !== shooter && !isAirVolley) {
                return false;
            }

            if (this.state === 'free_kick' || this.state === 'penalty_kick' || this.state === 'kickoff') {
                this.state = 'playing';
                this.setPiece = null;
            }

            const goalX = sign * PITCH_HALF_W;
            const aimYOffset = clamp(dirY * 52, -GOAL_HALF_W + 6, GOAL_HALF_W - 6);
            const targetY = aimYOffset;
            const dx = goalX - shooter.x;
            const dy = targetY - shooter.y;
            const dist = hypot2(dx, dy) || 1;

            const power = clamp(rawPower, 0.2, 1.25);
            const sweetSpot = power >= 0.62 && power <= 0.88;
            const overcharged = power > 1.02;

            const tactical = getTacticalBonus(
                shooter.team === 'home' ? this.homeFormation : this.awayFormation,
                shooter.team === 'home' ? this.awayFormation : this.homeFormation,
                shooter.team === 'home' ? this.homeMentality : this.awayMentality
            );
            const momentumBonus = 1 + this.momentum[shooter.team] * 0.025;
            const shotSpeed = (390 + power * 185 + (shooter.sho - 80) * 2.2) * tactical.shotMult * momentumBonus * (isAirVolley ? 1.12 : 1.0);

            this.ball.owner = null;
            this.ball.x = shooter.x + (dx / dist) * 14;
            this.ball.y = shooter.y + (dy / dist) * 14;
            if (!isAirVolley) {
                this.ball.z = 4;
            }
            this.ball.vx = (dx / dist) * shotSpeed;
            this.ball.vy = (dy / dist) * shotSpeed;

            if (overcharged) {
                this.ball.vz = 185 + (power - 1.0) * 180;
            } else if (isAirVolley) {
                this.ball.vz = 42;
            } else if (sweetSpot) {
                this.ball.vz = 82;
            } else {
                this.ball.vz = 58 * power;
            }

            this.ball.spinY = clamp(curveInput || dirY * 0.65, -1, 1) * 58;
            this.lastTouchTeam = shooter.team;
            this.lastTouchPlayer = shooter;

            this.stats[shooter.team].shots++;
            if (!overcharged) {
                this.stats[shooter.team].onTarget++;
            }

            this.pushEvent(isAirVolley ? 'volley' : 'shot', {
                team: shooter.team,
                player: shooter.name,
                power,
                sweetSpot,
                overcharged,
                text: isAirVolley
                    ? `${shooter.name} пробивает в падении с лёта!`
                    : (overcharged
                        ? `${shooter.name} вкладывает слишком много силы — мяч взмывает над трибунами!`
                        : `${shooter.name} наносит мощный удар по воротам!`)
            });
            return true;
        }

        skillMove(dirX, dirY) {
            const owner = this.ball.owner;
            if (!owner || owner.evadeTimer > 0) return false;
            owner.evadeTimer = 0.55;
            const perpX = -owner.dirY || (owner.team === 'home' ? 1 : -1);
            const perpY = owner.dirX || (dirY !== 0 ? dirY : 1);
            const len = hypot2(perpX, perpY) || 1;
            owner.vx += (perpX / len) * 95;
            owner.vy += (perpY / len) * 95;
            owner.stamina = Math.max(5, owner.stamina - 4);
            this.pushEvent('skill', {
                team: owner.team,
                player: owner.name,
                text: `${owner.name} уходит от защитника техничным финтом!`
            });
            return true;
        }

        switchPlayer() {
            const activeHome = this.players.filter(p => p.team === 'home' && !p.sentOff && p.role !== 'GK');
            if (!activeHome.length) return false;
            activeHome.sort((a, b) => {
                const da = hypot2(a.x - this.ball.x, a.y - this.ball.y);
                const db = hypot2(b.x - this.ball.x, b.y - this.ball.y);
                return da - db;
            });
            if (this.controlledPlayer === activeHome[0] && activeHome.length > 1) {
                this.controlledPlayer = activeHome[1];
            } else {
                this.controlledPlayer = activeHome[0];
            }
            return true;
        }

        standingTackle(actor = null) {
            const tackler = actor || this.controlledPlayer;
            if (!tackler || tackler.stunTimer > 0 || tackler.slideTimer > 0) return false;
            const owner = this.ball.owner;
            if (!owner || owner.team === tackler.team) return false;

            const dist = hypot2(owner.x - tackler.x, owner.y - tackler.y);
            if (dist > 34) return false;
            if (owner.evadeTimer > 0) {
                tackler.stunTimer = 0.35;
                return false;
            }

            const tactical = getTacticalBonus(
                tackler.team === 'home' ? this.homeFormation : this.awayFormation,
                tackler.team === 'home' ? this.awayFormation : this.homeFormation,
                tackler.team === 'home' ? this.homeMentality : this.awayMentality
            );
            const successChance = clamp(0.68 * tactical.tackleMult + (tackler.def - owner.spd) * 0.008, 0.35, 0.92);
            if (this.rng() <= successChance) {
                owner.stunTimer = 0.45;
                this.givePossession(tackler);
                this.stats[tackler.team].tackles++;
                this.pushEvent('tackle', {
                    team: tackler.team,
                    player: tackler.name,
                    text: `${tackler.name} чисто отбирает мяч у ${owner.name}!`
                });
                return true;
            }
            tackler.stunTimer = 0.3;
            return false;
        }

        slideTackle(dirX = 0, dirY = 0, actor = null) {
            const tackler = actor || this.controlledPlayer;
            if (!tackler || tackler.slideTimer > 0 || tackler.stunTimer > 0) return false;

            const tx = (dirX !== 0 || dirY !== 0) ? dirX : (this.ball.x - tackler.x);
            const ty = (dirX !== 0 || dirY !== 0) ? dirY : (this.ball.y - tackler.y);
            const len = hypot2(tx, ty) || 1;
            const slideSpeed = 295 * this.weather.slideMultiplier;

            tackler.slideTimer = 0.42;
            tackler.dirX = tx / len;
            tackler.dirY = ty / len;
            tackler.vx = tackler.dirX * slideSpeed;
            tackler.vy = tackler.dirY * slideSpeed;
            tackler.stamina = Math.max(5, tackler.stamina - 6);

            const owner = this.ball.owner;
            if (!owner || owner.team === tackler.team) {
                const ballDist = hypot2(this.ball.x - tackler.x, this.ball.y - tackler.y);
                if (ballDist < 42 && this.ball.z < 18) {
                    this.givePossession(tackler);
                    this.stats[tackler.team].tackles++;
                    return true;
                }
                return false;
            }

            const distToOwner = hypot2(owner.x - tackler.x, owner.y - tackler.y);
            if (distToOwner > 48) return false;
            if (owner.evadeTimer > 0) {
                return false;
            }

            const approachDot = (tackler.dirX * owner.dirX) + (tackler.dirY * owner.dirY);
            const fromBehind = approachDot > 0.35;
            const foulProb = fromBehind ? 0.62 : 0.22;

            if (this.rng() < foulProb) {
                this.commitFoul(tackler, owner, fromBehind);
                return false;
            }

            owner.stunTimer = 0.65;
            this.givePossession(tackler);
            this.stats[tackler.team].tackles++;
            this.pushEvent('slide_tackle', {
                team: tackler.team,
                player: tackler.name,
                text: `Блестящий подкат в исполнении ${tackler.name}!`
            });
            return true;
        }

        commitFoul(fouler, victim, reckless = false) {
            this.stats[fouler.team].fouls++;
            victim.stunTimer = 0.5;
            this.ball.owner = null;
            this.ball.vx = 0;
            this.ball.vy = 0;
            this.ball.vz = 0;

            let card = null;
            if (reckless || this.rng() < 0.38) {
                fouler.yellowCards++;
                this.stats[fouler.team].yellowCards++;
                card = 'yellow';
                if (fouler.yellowCards >= 2 || (reckless && this.rng() < 0.22)) {
                    fouler.sentOff = true;
                    this.stats[fouler.team].redCards++;
                    card = 'red';
                }
            }

            const attackingSign = victim.team === 'home' ? 1 : -1;
            const inPenaltyBox = (victim.x * attackingSign > PITCH_HALF_W - PENALTY_BOX_W)
                && (Math.abs(victim.y) < PENALTY_BOX_H / 2);

            if (inPenaltyBox) {
                this.state = 'penalty_kick';
                this.stateTimer = 1.1;
                const spotX = attackingSign * (PITCH_HALF_W - PENALTY_SPOT_OFFSET);
                this.ball.x = spotX;
                this.ball.y = 0;
                this.ball.z = 0;
                victim.x = spotX - attackingSign * 14;
                victim.y = 0;
                this.givePossession(victim);
                this.setPiece = { type: 'penalty_kick', team: victim.team, x: spotX, y: 0 };
                this.pushEvent('penalty_awarded', {
                    team: victim.team,
                    fouler: fouler.name,
                    victim: victim.name,
                    card,
                    text: `ПЕНАЛЬТИ! ${fouler.name} сбивает ${victim.name} в штрафной площади!`
                });
            } else {
                this.state = 'free_kick';
                this.stateTimer = 0.9;
                this.ball.x = clamp(victim.x, -PITCH_HALF_W + 30, PITCH_HALF_W - 30);
                this.ball.y = clamp(victim.y, -PITCH_HALF_H + 30, PITCH_HALF_H - 30);
                this.ball.z = 0;
                victim.x = this.ball.x;
                victim.y = this.ball.y;
                this.givePossession(victim);
                this.setPiece = { type: 'free_kick', team: victim.team, x: this.ball.x, y: this.ball.y };
                this.pushEvent('foul', {
                    team: victim.team,
                    fouler: fouler.name,
                    victim: victim.name,
                    card,
                    text: card === 'red'
                        ? `КРАСНАЯ КАРТОЧКА! ${fouler.name} удалён с поля за грубый фол против ${victim.name}!`
                        : (card === 'yellow'
                            ? `Жёлтая карточка ${fouler.name}! Штрафной удар пробьёт ${victim.name}.`
                            : `Свисток арбитра! Фол со стороны ${fouler.name} — назначен штрафной удар.`)
                });
            }
        }

        findNearestTeammateToPoint(teamKey, x, y, exclude = null) {
            let best = null;
            let bestDist = Infinity;
            for (const p of this.players) {
                if (p.team !== teamKey || p === exclude || p.sentOff || p.role === 'GK') continue;
                const d = hypot2(p.x - x, p.y - y);
                if (d < bestDist) {
                    bestDist = d;
                    best = p;
                }
            }
            return best;
        }

        update(dt, input = {}) {
            if (this.state === 'finished' || this.state === 'shootout' || this.state === 'halftime') {
                return;
            }

            if (this.commentaryTimer > 0) {
                this.commentaryTimer = Math.max(0, this.commentaryTimer - dt);
            }

            if (this.state === 'goal') {
                this.stateTimer -= dt;
                if (this.stateTimer <= 0) {
                    if (this.half >= 3 && this.goldenGoal) {
                        this.finishMatch();
                        return;
                    }
                    this.setupKickoff(this.kickoffTeam);
                }
                return;
            }

            if (this.stateTimer > 0) {
                this.stateTimer = Math.max(0, this.stateTimer - dt);
            }

            if (this.state === 'kickoff' && this.stateTimer <= 0 && this.kickoffTeam === 'away') {
                this.pass(-1, 0.2);
                this.state = 'playing';
            }

            if ((this.state === 'throw_in' || this.state === 'corner' || this.state === 'goal_kick' || this.state === 'free_kick' || this.state === 'penalty_kick') && this.stateTimer <= 0) {
                if (this.ball.owner && this.ball.owner.team === 'away') {
                    if (this.state === 'penalty_kick' || (this.state === 'free_kick' && this.ball.owner.x < -120)) {
                        this.releaseShot(-1, (this.rng() - 0.5) * 0.8, 0, 0.76);
                    } else if (this.state === 'corner') {
                        this.lobPass(-1, 0);
                    } else {
                        this.pass(-1, 0);
                    }
                }
            }

            if (this.shotCharge.active) {
                this.shotCharge.power = Math.min(1.25, this.shotCharge.power + dt * 1.15);
            }

            if (this.state === 'playing') {
                this.clock += dt;
                if (this.ball.owner) {
                    this.stats[this.ball.owner.team].possessionTime += dt;
                }
                const targetLimit = this.half <= 2 ? this.halfDuration : this.extraHalfDuration;
                if (this.clock >= targetLimit) {
                    this.advancePeriod();
                    return;
                }
            }

            this.updatePlayers(dt, input);
            this.updateBall(dt);
        }

        advancePeriod() {
            this.clock = 0;
            if (this.half === 1) {
                this.half = 2;
                this.state = 'halftime';
                this.pushEvent('halftime', {
                    text: `Перерыв! Счёт после первого тайма ${this.homeTeam.name} ${this.score.home} : ${this.score.away} ${this.awayTeam.name}.`
                });
            } else if (this.half === 2) {
                if (this.score.home !== this.score.away || !this.allowExtraTime) {
                    this.finishMatch();
                } else {
                    this.half = 3;
                    this.setupKickoff('home');
                    this.pushEvent('extra_time', {
                        text: `Основное время завершилось вничью! Начинается овертайм до «Золотого гола»!`
                    });
                }
            } else if (this.half === 3) {
                this.half = 4;
                this.setupKickoff('away');
                this.pushEvent('extra_time_second', {
                    text: `Второй дополнительный тайм! Любой забитый мяч станет «Золотым голом»!`
                });
            } else {
                if (this.score.home === this.score.away) {
                    this.startPenaltyShootout();
                } else {
                    this.finishMatch();
                }
            }
        }

        resumeFromHalftime() {
            if (this.state !== 'halftime') return;
            this.setupKickoff('away');
            this.state = 'playing';
        }

        startPenaltyShootout() {
            this.state = 'shootout';
            this.shootout = new PenaltyShootout({
                homeTeam: this.homeTeamId,
                awayTeam: this.awayTeamId,
                rng: this.rng
            });
            this.pushEvent('shootout_start', {
                text: `120 минут позади! Судьбу матча решит послематчевая серия пенальти!`
            });
        }

        finishMatch() {
            this.state = 'finished';
            if (this.score.home > this.score.away) {
                this.winner = 'home';
            } else if (this.score.away > this.score.home) {
                this.winner = 'away';
            } else if (this.shootout && this.shootout.winner) {
                this.winner = this.shootout.winner;
            } else {
                this.winner = 'draw';
            }
            this.pushEvent('fulltime', {
                winner: this.winner,
                text: `Финальный свисток! ${this.homeTeam.name} ${this.score.home} : ${this.score.away} ${this.awayTeam.name}!`
            });
        }

        updatePlayers(dt, input = {}) {
            if (!this.controlledPlayer || this.controlledPlayer.sentOff) {
                this.switchPlayer();
            }

            for (const p of this.players) {
                if (p.sentOff) continue;

                if (p.stunTimer > 0) p.stunTimer = Math.max(0, p.stunTimer - dt);
                if (p.slideTimer > 0) p.slideTimer = Math.max(0, p.slideTimer - dt);
                if (p.evadeTimer > 0) p.evadeTimer = Math.max(0, p.evadeTimer - dt);
                if (p.diveTimer > 0) p.diveTimer = Math.max(0, p.diveTimer - dt);

                if (p.slideTimer > 0) {
                    p.x = clamp(p.x + p.vx * dt, -PITCH_HALF_W + 10, PITCH_HALF_W - 10);
                    p.y = clamp(p.y + p.vy * dt, -PITCH_HALF_H + 10, PITCH_HALF_H - 10);
                    p.vx *= 0.92;
                    p.vy *= 0.92;
                    continue;
                }

                if (p.stunTimer > 0) {
                    p.vx = 0;
                    p.vy = 0;
                    continue;
                }

                const tactical = getTacticalBonus(
                    p.team === 'home' ? this.homeFormation : this.awayFormation,
                    p.team === 'home' ? this.awayFormation : this.homeFormation,
                    p.team === 'home' ? this.homeMentality : this.awayMentality
                );
                const staminaFactor = 0.72 + 0.28 * (p.stamina / 100);
                const baseSpeed = (118 + (p.spd - 75) * 1.45) * tactical.speedMult * staminaFactor;

                if (p === this.controlledPlayer && p.team === 'home') {
                    const mx = Number(input.moveX || 0);
                    const my = Number(input.moveY || 0);
                    const sprinting = Boolean(input.sprint) && p.stamina > 8;
                    const speed = baseSpeed * (sprinting ? 1.26 : 1.0) * (this.ball.owner === p ? 0.95 : 1.0);

                    if (mx !== 0 || my !== 0) {
                        const len = hypot2(mx, my) || 1;
                        p.dirX = mx / len;
                        p.dirY = my / len;
                        p.vx = p.dirX * speed;
                        p.vy = p.dirY * speed;
                        p.animPhase += dt * (sprinting ? 12 : 8.5);
                        if (sprinting) {
                            p.stamina = Math.max(0, p.stamina - dt * 11.5 * this.weather.staminaDrainMultiplier);
                        } else {
                            p.stamina = Math.min(100, p.stamina + dt * 2.5);
                        }
                    } else {
                        p.vx = 0;
                        p.vy = 0;
                        p.stamina = Math.min(100, p.stamina + dt * 6.5);
                    }
                } else if (p.role === 'GK') {
                    this.updateGoalkeeper(p, dt);
                } else {
                    this.updateOutfieldAi(p, dt, baseSpeed, tactical);
                }

                p.x = clamp(p.x + p.vx * dt, -PITCH_HALF_W + 12, PITCH_HALF_W - 12);
                p.y = clamp(p.y + p.vy * dt, -PITCH_HALF_H + 12, PITCH_HALF_H - 12);

                if (!this.ball.owner && this.ball.z < 20) {
                    const d = hypot2(this.ball.x - p.x, this.ball.y - p.y);
                    if (d < 16) {
                        this.givePossession(p);
                    }
                }
            }

            if (this.ball.owner) {
                const owner = this.ball.owner;
                this.ball.x = owner.x + owner.dirX * 11;
                this.ball.y = owner.y + owner.dirY * 11;
                this.ball.z = 0;
                this.ball.vx = owner.vx;
                this.ball.vy = owner.vy;
            }
        }

        updateGoalkeeper(gk, dt) {
            const sign = gk.team === 'home' ? 1 : -1;
            const goalLineX = -sign * (PITCH_HALF_W - 18);
            const targetY = clamp(this.ball.y * 0.42, -GOAL_HALF_W + 10, GOAL_HALF_W - 10);
            const targetX = goalLineX + sign * (Math.abs(this.ball.x - goalLineX) < 180 ? 12 : 4);

            const dx = targetX - gk.x;
            const dy = targetY - gk.y;
            const dist = hypot2(dx, dy);
            if (dist > 3) {
                const gkSpd = 128 + (gk.def - 80) * 1.4;
                gk.vx = (dx / dist) * Math.min(gkSpd, dist * 7);
                gk.vy = (dy / dist) * Math.min(gkSpd, dist * 7);
                gk.dirX = sign;
                gk.dirY = 0;
            } else {
                gk.vx = 0;
                gk.vy = 0;
            }

            if (!this.ball.owner && hypot2(this.ball.x - gk.x, this.ball.y - gk.y) < 24 && this.ball.z < CROSSBAR_HEIGHT - 2) {
                const ballSpeed = hypot2(this.ball.vx, this.ball.vy);
                const saveSkill = (gk.def || 88) / 100;
                if (ballSpeed < 440 || this.rng() < saveSkill * 0.78) {
                    this.givePossession(gk);
                    this.pushEvent('save', {
                        team: gk.team,
                        player: gk.name,
                        text: `Вратарь ${gk.name} намертво забирает мяч!`
                    });
                    if (gk.team === 'away') {
                        this.pass(-1, (this.rng() - 0.5) * 0.5);
                    }
                }
            }
        }

        updateOutfieldAi(p, dt, baseSpeed, tactical) {
            const sign = p.team === 'home' ? 1 : -1;
            const owner = this.ball.owner;

            if (owner === p && p.team === 'away') {
                const goalX = -PITCH_HALF_W;
                const distToGoal = hypot2(goalX - p.x, -p.y);
                if (distToGoal < 215 && Math.abs(p.y) < 135) {
                    this.releaseShot(-1, clamp(-p.y / 140, -0.7, 0.7), 0, 0.76);
                    return;
                }

                const nearDef = this.players.find(opp => opp.team === 'home' && !opp.sentOff && hypot2(opp.x - p.x, opp.y - p.y) < 38);
                if (nearDef && this.rng() < 0.45) {
                    this.pass(-1, (this.rng() - 0.5) * 0.8);
                    return;
                }

                const tx = goalX + 40;
                const ty = p.y * 0.65;
                const dx = tx - p.x;
                const dy = ty - p.y;
                const len = hypot2(dx, dy) || 1;
                p.dirX = dx / len;
                p.dirY = dy / len;
                p.vx = p.dirX * baseSpeed * 0.94;
                p.vy = p.dirY * baseSpeed * 0.94;
                p.animPhase += dt * 8.5;
                return;
            }

            const ballShiftX = (this.ball.x / PITCH_HALF_W) * 105;
            let targetX = p.homeX + ballShiftX + sign * tactical.shiftX * PITCH_HALF_W;
            let targetY = p.homeY + (this.ball.y - p.homeY) * 0.25;

            const distToBall = hypot2(this.ball.x - p.x, this.ball.y - p.y);
            const isClosestChaser = this.isClosestOutfielderToBall(p);

            if ((!owner || owner.team !== p.team) && (isClosestChaser || distToBall < tactical.pressRadius)) {
                targetX = this.ball.x;
                targetY = this.ball.y;

                if (p.team === 'away' && owner && owner.team === 'home' && distToBall < 28) {
                    if (this.rng() < 0.08) {
                        this.standingTackle(p);
                    }
                }
            } else if (owner && owner.team === p.team && p.role === 'FW') {
                targetX = clamp(owner.x + sign * 145, -PITCH_HALF_W + 45, PITCH_HALF_W - 45);
            }

            const dx = targetX - p.x;
            const dy = targetY - p.y;
            const dist = hypot2(dx, dy);
            if (dist > 6) {
                p.dirX = dx / dist;
                p.dirY = dy / dist;
                p.vx = p.dirX * Math.min(baseSpeed, dist * 5);
                p.vy = p.dirY * Math.min(baseSpeed, dist * 5);
                p.animPhase += dt * 7.5;
            } else {
                p.vx = 0;
                p.vy = 0;
                p.stamina = Math.min(100, p.stamina + dt * 4);
            }
        }

        isClosestOutfielderToBall(candidate) {
            let best = null;
            let bestDist = Infinity;
            for (const p of this.players) {
                if (p.team !== candidate.team || p.sentOff || p.role === 'GK') continue;
                const d = hypot2(p.x - this.ball.x, p.y - this.ball.y);
                if (d < bestDist) {
                    bestDist = d;
                    best = p;
                }
            }
            return best === candidate;
        }

        updateBall(dt) {
            if (this.ball.owner) {
                return;
            }

            this.ball.trail.push({ x: this.ball.x, y: this.ball.y, z: this.ball.z });
            if (this.ball.trail.length > 10) {
                this.ball.trail.shift();
            }

            if (Math.abs(this.ball.spinY) > 0.1) {
                this.ball.vy += this.ball.spinY * dt * 2.2;
                this.ball.spinY *= Math.pow(0.45, dt);
            }

            this.ball.x += this.ball.vx * dt;
            this.ball.y += this.ball.vy * dt;
            this.ball.z += this.ball.vz * dt;

            if (this.ball.z > 0 || this.ball.vz !== 0) {
                this.ball.vz -= GRAVITY * dt;
                if (this.ball.z <= 0) {
                    this.ball.z = 0;
                    if (Math.abs(this.ball.vz) > 26) {
                        this.ball.vz = -this.ball.vz * this.weather.ballBounce;
                    } else {
                        this.ball.vz = 0;
                    }
                }
            }

            const drag = this.ball.z > 2 ? 0.55 : this.weather.ballFriction;
            const factor = Math.max(0, 1 - drag * dt);
            this.ball.vx *= factor;
            this.ball.vy *= factor;

            if (Math.abs(this.ball.x) >= PITCH_HALF_W) {
                const scoringSide = this.ball.x > 0 ? 'home' : 'away';
                if (Math.abs(this.ball.y) <= GOAL_HALF_W) {
                    if (Math.abs(Math.abs(this.ball.y) - GOAL_HALF_W) < 4 && this.ball.z <= CROSSBAR_HEIGHT) {
                        this.ball.vx = -this.ball.vx * 0.65;
                        this.ball.x = Math.sign(this.ball.x) * (PITCH_HALF_W - 2);
                        this.pushEvent('post', {
                            team: this.lastTouchTeam,
                            text: `ШТАНГА! Мяч со звоном отскакивает в поле!`
                        });
                        return;
                    }
                    if (Math.abs(this.ball.z - CROSSBAR_HEIGHT) < 4) {
                        this.ball.vx = -this.ball.vx * 0.55;
                        this.ball.vz = Math.abs(this.ball.vz) * 0.6 + 35;
                        this.ball.x = Math.sign(this.ball.x) * (PITCH_HALF_W - 2);
                        this.pushEvent('crossbar', {
                            team: this.lastTouchTeam,
                            text: `ПЕРЕКЛАДИНА спасает ворота!`
                        });
                        return;
                    }
                    if (this.ball.z < CROSSBAR_HEIGHT) {
                        this.scoreGoal(scoringSide);
                        return;
                    }
                }

                this.handleGoalLineOut(this.ball.x > 0 ? 1 : -1);
                return;
            }

            if (Math.abs(this.ball.y) > PITCH_HALF_H) {
                this.handleTouchlineOut(Math.sign(this.ball.y));
            }
        }

        scoreGoal(scoringTeam) {
            this.score[scoringTeam]++;
            this.state = 'goal';
            this.stateTimer = 1.8;
            this.kickoffTeam = scoringTeam === 'home' ? 'away' : 'home';
            const scorerName = (this.lastTouchPlayer && this.lastTouchPlayer.team === scoringTeam)
                ? this.lastTouchPlayer.name
                : (scoringTeam === 'home' ? this.homeTeam.roster[6].name : this.awayTeam.roster[6].name);

            const isGolden = this.half >= 3 && this.goldenGoal;
            this.pushEvent('goal', {
                team: scoringTeam,
                scorer: scorerName,
                goldenGoal: isGolden,
                score: { ...this.score },
                text: isGolden
                    ? `ЗОЛОТОЙ ГОЛ! ${scorerName} приносит победу сборной ${scoringTeam === 'home' ? this.homeTeam.name : this.awayTeam.name}!`
                    : `ГОООЛ! ${scorerName} поражает ворота! Счёт ${this.score.home}:${this.score.away}!`
            });
        }

        handleTouchlineOut(sideSign) {
            const receivingTeam = this.lastTouchTeam === 'home' ? 'away' : 'home';
            const throwX = clamp(this.ball.x, -PITCH_HALF_W + 30, PITCH_HALF_W - 30);
            const throwY = sideSign * (PITCH_HALF_H - 6);

            this.state = 'throw_in';
            this.stateTimer = 0.7;
            this.ball.x = throwX;
            this.ball.y = throwY;
            this.ball.z = 0;
            this.ball.vx = 0;
            this.ball.vy = 0;
            this.ball.vz = 0;

            const thrower = this.findNearestTeammateToPoint(receivingTeam, throwX, throwY);
            if (thrower) {
                thrower.x = throwX;
                thrower.y = throwY;
                this.givePossession(thrower);
            }
            this.setPiece = { type: 'throw_in', team: receivingTeam, x: throwX, y: throwY };
            this.pushEvent('throw_in', {
                team: receivingTeam,
                text: `Аут в пользу сборной ${receivingTeam === 'home' ? this.homeTeam.name : this.awayTeam.name}.`
            });
        }

        handleGoalLineOut(endSign) {
            const defendingTeam = endSign > 0 ? 'away' : 'home';
            const attackingTeam = endSign > 0 ? 'home' : 'away';

            if (this.lastTouchTeam === defendingTeam) {
                const cornerX = endSign * (PITCH_HALF_W - 8);
                const cornerY = (this.ball.y >= 0 ? 1 : -1) * (PITCH_HALF_H - 8);
                this.state = 'corner';
                this.stateTimer = 0.8;
                this.ball.x = cornerX;
                this.ball.y = cornerY;
                this.ball.z = 0;
                this.ball.vx = 0;
                this.ball.vy = 0;
                this.ball.vz = 0;
                this.stats[attackingTeam].corners++;

                const taker = this.findNearestTeammateToPoint(attackingTeam, cornerX, cornerY);
                if (taker) {
                    taker.x = cornerX;
                    taker.y = cornerY;
                    this.givePossession(taker);
                }
                this.setPiece = { type: 'corner', team: attackingTeam, x: cornerX, y: cornerY };
                this.pushEvent('corner', {
                    team: attackingTeam,
                    text: `Угловой удар подаёт сборная ${attackingTeam === 'home' ? this.homeTeam.name : this.awayTeam.name}!`
                });
            } else {
                const gkX = endSign * (PITCH_HALF_W - 42);
                const gkY = 0;
                this.state = 'goal_kick';
                this.stateTimer = 0.75;
                this.ball.x = gkX;
                this.ball.y = gkY;
                this.ball.z = 0;
                this.ball.vx = 0;
                this.ball.vy = 0;
                this.ball.vz = 0;

                const gk = this.players.find(p => p.team === defendingTeam && p.role === 'GK')
                    || this.findNearestTeammateToPoint(defendingTeam, gkX, gkY);
                if (gk) {
                    gk.x = gkX;
                    gk.y = gkY;
                    this.givePossession(gk);
                }
                this.setPiece = { type: 'goal_kick', team: defendingTeam, x: gkX, y: gkY };
                this.pushEvent('goal_kick', {
                    team: defendingTeam,
                    text: `Удар от ворот выполнит сборная ${defendingTeam === 'home' ? this.homeTeam.name : this.awayTeam.name}.`
                });
            }
        }
    }

    class Tournament {
        constructor(options = {}) {
            this.playerTeamId = options.playerTeam || 'RUS';
            this.rng = options.rng || Math.random;
            this.stage = 'group';
            this.matchday = 0;
            this.groups = this.buildInitialGroups(options.groups);
            this.standings = {};
            this.fixtures = {};
            this.initGroupFixturesAndStandings();
            this.knockout = {
                quarterFinals: [],
                semiFinals: [],
                finalMatch: null,
                champion: null
            };
        }

        buildInitialGroups(customGroups) {
            if (customGroups) return customGroups;
            return {
                A: ['FRA', 'BRA', 'RUS', 'MEX'],
                B: ['ITA', 'ENG', 'ESP', 'NGA'],
                C: ['NED', 'ARG', 'CRO', 'JPN'],
                D: ['GER', 'DEN', 'YUG', 'COL']
            };
        }

        initGroupFixturesAndStandings() {
            for (const [groupName, teamIds] of Object.entries(this.groups)) {
                this.standings[groupName] = teamIds.map(id => ({
                    teamId: id,
                    name: TEAMS[id].name,
                    P: 0,
                    W: 0,
                    D: 0,
                    L: 0,
                    GF: 0,
                    GA: 0,
                    GD: 0,
                    Pts: 0
                }));

                this.fixtures[groupName] = [
                    [
                        { home: teamIds[0], away: teamIds[1], played: false, homeGoals: 0, awayGoals: 0 },
                        { home: teamIds[2], away: teamIds[3], played: false, homeGoals: 0, awayGoals: 0 }
                    ],
                    [
                        { home: teamIds[0], away: teamIds[2], played: false, homeGoals: 0, awayGoals: 0 },
                        { home: teamIds[1], away: teamIds[3], played: false, homeGoals: 0, awayGoals: 0 }
                    ],
                    [
                        { home: teamIds[3], away: teamIds[0], played: false, homeGoals: 0, awayGoals: 0 },
                        { home: teamIds[1], away: teamIds[2], played: false, homeGoals: 0, awayGoals: 0 }
                    ]
                ];
            }
        }

        getPlayerGroup() {
            for (const [g, list] of Object.entries(this.groups)) {
                if (list.includes(this.playerTeamId)) return g;
            }
            return 'A';
        }

        getNextPlayerFixture() {
            if (this.stage === 'group') {
                if (this.matchday >= 3) return null;
                const g = this.getPlayerGroup();
                const dayMatches = this.fixtures[g][this.matchday];
                return dayMatches.find(m => m.home === this.playerTeamId || m.away === this.playerTeamId) || null;
            }
            if (this.stage === 'quarter') {
                return this.knockout.quarterFinals.find(m => !m.played && (m.home === this.playerTeamId || m.away === this.playerTeamId)) || null;
            }
            if (this.stage === 'semi') {
                return this.knockout.semiFinals.find(m => !m.played && (m.home === this.playerTeamId || m.away === this.playerTeamId)) || null;
            }
            if (this.stage === 'final') {
                const fm = this.knockout.finalMatch;
                if (fm && !fm.played && (fm.home === this.playerTeamId || fm.away === this.playerTeamId)) {
                    return fm;
                }
            }
            return null;
        }

        simulateAiScore(homeId, awayId, allowDraw = true) {
            const h = TEAMS[homeId] || TEAMS.FRA;
            const a = TEAMS[awayId] || TEAMS.BRA;
            const hPower = (h.ratings.att + h.ratings.mid + h.ratings.def) / 300;
            const aPower = (a.ratings.att + a.ratings.mid + a.ratings.def) / 300;
            let homeGoals = Math.max(0, Math.floor(this.rng() * 3.4 * hPower + (hPower - aPower) * 2));
            let awayGoals = Math.max(0, Math.floor(this.rng() * 3.2 * aPower + (aPower - hPower) * 2));
            if (!allowDraw && homeGoals === awayGoals) {
                if (this.rng() < 0.5 + (hPower - aPower)) {
                    homeGoals++;
                } else {
                    awayGoals++;
                }
            }
            return { homeGoals, awayGoals };
        }

        recordPlayerMatchResult(homeGoals, awayGoals, winnerSide = null) {
            if (this.stage === 'group') {
                if (this.matchday >= 3) return;
                for (const [groupName, rounds] of Object.entries(this.fixtures)) {
                    const dayMatches = rounds[this.matchday];
                    for (const m of dayMatches) {
                        if (m.home === this.playerTeamId || m.away === this.playerTeamId) {
                            m.homeGoals = homeGoals;
                            m.awayGoals = awayGoals;
                            m.played = true;
                        } else {
                            const sim = this.simulateAiScore(m.home, m.away, true);
                            m.homeGoals = sim.homeGoals;
                            m.awayGoals = sim.awayGoals;
                            m.played = true;
                        }
                        this.applyGroupResult(groupName, m.home, m.away, m.homeGoals, m.awayGoals);
                    }
                    this.sortGroupStandings(groupName);
                }
                this.matchday++;
                if (this.matchday >= 3) {
                    this.buildQuarterFinals();
                }
                return;
            }

            if (this.stage === 'quarter') {
                this.resolveKnockoutRound(this.knockout.quarterFinals, homeGoals, awayGoals, winnerSide);
                this.buildSemiFinals();
                return;
            }

            if (this.stage === 'semi') {
                this.resolveKnockoutRound(this.knockout.semiFinals, homeGoals, awayGoals, winnerSide);
                this.buildFinal();
                return;
            }

            if (this.stage === 'final' && this.knockout.finalMatch) {
                const fm = this.knockout.finalMatch;
                if (fm.home === this.playerTeamId || fm.away === this.playerTeamId) {
                    fm.homeGoals = homeGoals;
                    fm.awayGoals = awayGoals;
                    fm.winner = homeGoals > awayGoals ? fm.home : (awayGoals > homeGoals ? fm.away : (winnerSide === 'away' ? fm.away : fm.home));
                } else {
                    const sim = this.simulateAiScore(fm.home, fm.away, false);
                    fm.homeGoals = sim.homeGoals;
                    fm.awayGoals = sim.awayGoals;
                    fm.winner = sim.homeGoals > sim.awayGoals ? fm.home : fm.away;
                }
                fm.played = true;
                this.knockout.champion = fm.winner;
                this.stage = 'completed';
            }
        }

        applyGroupResult(groupName, homeId, awayId, hg, ag) {
            const table = this.standings[groupName];
            const hRow = table.find(r => r.teamId === homeId);
            const aRow = table.find(r => r.teamId === awayId);
            if (!hRow || !aRow) return;

            hRow.P++;
            aRow.P++;
            hRow.GF += hg;
            hRow.GA += ag;
            hRow.GD = hRow.GF - hRow.GA;
            aRow.GF += ag;
            aRow.GA += hg;
            aRow.GD = aRow.GF - aRow.GA;

            if (hg > ag) {
                hRow.W++;
                hRow.Pts += 3;
                aRow.L++;
            } else if (ag > hg) {
                aRow.W++;
                aRow.Pts += 3;
                hRow.L++;
            } else {
                hRow.D++;
                aRow.D++;
                hRow.Pts += 1;
                aRow.Pts += 1;
            }
        }

        sortGroupStandings(groupName) {
            this.standings[groupName].sort((a, b) => {
                if (b.Pts !== a.Pts) return b.Pts - a.Pts;
                if (b.GD !== a.GD) return b.GD - a.GD;
                return b.GF - a.GF;
            });
        }

        buildQuarterFinals() {
            this.stage = 'quarter';
            const A = this.standings.A;
            const B = this.standings.B;
            const C = this.standings.C;
            const D = this.standings.D;
            this.knockout.quarterFinals = [
                { id: 'QF1', home: A[0].teamId, away: B[1].teamId, played: false, homeGoals: 0, awayGoals: 0, winner: null },
                { id: 'QF2', home: B[0].teamId, away: A[1].teamId, played: false, homeGoals: 0, awayGoals: 0, winner: null },
                { id: 'QF3', home: C[0].teamId, away: D[1].teamId, played: false, homeGoals: 0, awayGoals: 0, winner: null },
                { id: 'QF4', home: D[0].teamId, away: C[1].teamId, played: false, homeGoals: 0, awayGoals: 0, winner: null }
            ];
        }

        resolveKnockoutRound(matches, playerHomeGoals, playerAwayGoals, winnerSide) {
            for (const m of matches) {
                if (m.home === this.playerTeamId || m.away === this.playerTeamId) {
                    m.homeGoals = playerHomeGoals;
                    m.awayGoals = playerAwayGoals;
                    if (playerHomeGoals > playerAwayGoals) {
                        m.winner = m.home;
                    } else if (playerAwayGoals > playerHomeGoals) {
                        m.winner = m.away;
                    } else {
                        m.winner = winnerSide === 'away' ? m.away : m.home;
                    }
                    m.played = true;
                } else {
                    const sim = this.simulateAiScore(m.home, m.away, false);
                    m.homeGoals = sim.homeGoals;
                    m.awayGoals = sim.awayGoals;
                    m.winner = sim.homeGoals > sim.awayGoals ? m.home : m.away;
                    m.played = true;
                }
            }
        }

        buildSemiFinals() {
            this.stage = 'semi';
            const qf = this.knockout.quarterFinals;
            this.knockout.semiFinals = [
                { id: 'SF1', home: qf[0].winner, away: qf[2].winner, played: false, homeGoals: 0, awayGoals: 0, winner: null },
                { id: 'SF2', home: qf[1].winner, away: qf[3].winner, played: false, homeGoals: 0, awayGoals: 0, winner: null }
            ];
        }

        buildFinal() {
            this.stage = 'final';
            const sf = this.knockout.semiFinals;
            this.knockout.finalMatch = {
                id: 'FINAL',
                home: sf[0].winner,
                away: sf[1].winner,
                played: false,
                homeGoals: 0,
                awayGoals: 0,
                winner: null
            };
        }
    }

    const WorldCup98 = {
        PITCH_WIDTH,
        PITCH_HEIGHT,
        PITCH_HALF_W,
        PITCH_HALF_H,
        GOAL_WIDTH,
        GOAL_HALF_W,
        GOAL_DEPTH,
        CROSSBAR_HEIGHT,
        PENALTY_BOX_W,
        PENALTY_BOX_H,
        SIX_YARD_W,
        SIX_YARD_H,
        STADIUMS,
        WEATHER_TYPES,
        FORMATIONS,
        MENTALITIES,
        TEAMS,
        CLASSIC_SCENARIOS,
        getTacticalBonus,
        PenaltyShootout,
        Match,
        Tournament
    };

    globalScope.WorldCup98 = WorldCup98;
    if (typeof module !== 'undefined' && module.exports) {
        module.exports = WorldCup98;
    }
})(typeof globalThis !== 'undefined' ? globalThis : window);
