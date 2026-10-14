(function (O) {
  'use strict';

  O.ROLES = {
    offense: { ru: 'АТАКА', one: 'Атака', color: '#f06414' },
    defense: { ru: 'ЗАЩИТА', one: 'Защита', color: '#2d9bea' },
    tank: { ru: 'ТАНКИ', one: 'Танк', color: '#f2c12e' },
    support: { ru: 'ПОДДЕРЖКА', one: 'Поддержка', color: '#5bd35b' }
  };
  O.ROLE_ORDER = ['offense', 'defense', 'tank', 'support'];

  O.HERO_ORDER = ['mccree', 'soldier', 'tracer', 'junkrat', 'torbjorn', 'widowmaker', 'reinhardt', 'roadhog', 'winston', 'lucio', 'mercy', 'zenyatta'];

  O.MELEE = { dmg: 30, cd: 0.8, range: 2.6, arc: 0.7 };
  O.RESPAWN = 10;

  O.HEROES = {
    mccree: {
      id: 'mccree', name: 'MCCREE', role: 'offense', stars: 2, cross: 'dot',
      hp: 200, armor: 0, shield: 0, r: 0.36, h: 1.86, eye: 1.66, headR: 0.19, ultCost: 1250,
      real: 'Джесси Маккри', age: 37, job: 'Охотник за головами', base: 'Санта-Фе, Нью-Мексико, США', aff: 'Blackwatch (ранее)',
      bio: 'Бывший стрелок банды «Смертельная хватка», которого Blackwatch взяла на службу вместо тюрьмы. Теперь он странствует по пустошам и вершит правосудие с шестизарядником у бедра.',
      w: { dmg: 70, interval: 0.5, ammo: 6, reload: 1.5, fall: [20, 40, 0.5], crit: 2 },
      fan: { dmg: 45, interval: 0.13, spread: 0.075 },
      roll: { cd: 8, dist: 6, dur: 0.4 },
      flash: { cd: 10, dmg: 25, stun: 0.8, range: 7, r: 2.4 },
      deadeye: { dur: 6, rate: 120, speedMul: 0.3 },
      kit: [
        { key: 'ЛКМ', icon: 'revolver', name: 'Миротворец', desc: 'Точный выстрел из револьвера. Попадание в голову удваивает урон.' },
        { key: 'ПКМ', icon: 'fan', name: 'Веер пуль', desc: 'Все оставшиеся патроны выпускаются очередью с меньшей точностью.' },
        { key: 'SHIFT', icon: 'roll', name: 'Перекат', desc: 'Маккри перекатывается в сторону движения и сразу перезаряжает оружие.' },
        { key: 'E', icon: 'flash', name: 'Светошумовая граната', desc: 'Оглушает и слегка ранит противников рядом с точкой разрыва.' },
        { key: 'Q', icon: 'deadeye', name: 'Меткий стрелок', desc: 'Прицеливается во всех врагов в поле зрения. Чем дольше прицел, тем смертоноснее выстрел.', ult: true }
      ],
      ultLine: 'Пробил полдень.', ultLineEnemy: 'Пробил полдень...'
    },
    soldier: {
      id: 'soldier', name: 'SOLDIER: 76', role: 'offense', stars: 1, cross: 'cross',
      hp: 200, armor: 0, shield: 0, r: 0.36, h: 1.86, eye: 1.66, headR: 0.19, ultCost: 1500,
      real: 'Джек Моррисон', age: 55, job: 'Мститель', base: 'Индиана, США', aff: 'Overwatch (ранее)',
      bio: 'Легендарный командир Overwatch, которого все считали погибшим. Под маской Солдата-76 он ищет тех, кто разрушил организацию.',
      w: { dmg: 19, rate: 9, ammo: 25, reload: 1.5, spreadMin: 0.004, spreadMax: 0.032, bloom: 0.005, fall: [30, 50, 0.5], crit: 2 },
      helix: { cd: 8, dmg: 40, r: 3, speed: 50, count: 3, gap: 0.08 },
      sprint: { mul: 1.5 },
      field: { cd: 15, heal: 40, r: 5, dur: 5 },
      visor: { dur: 6 },
      kit: [
        { key: 'ЛКМ', icon: 'rifle', name: 'Тяжёлая импульсная винтовка', desc: 'Автоматическая винтовка, самая точная в первые выстрелы очереди.' },
        { key: 'ПКМ', icon: 'helix', name: 'Ракеты «Спираль»', desc: 'Залп из трёх ракет, взрывающихся при попадании.' },
        { key: 'SHIFT', icon: 'sprint', name: 'Спринт', desc: 'Удерживайте, чтобы бежать быстрее вперёд.' },
        { key: 'E', icon: 'field', name: 'Биотическое поле', desc: 'Излучатель лечит Солдата-76 и союзников рядом.' },
        { key: 'Q', icon: 'visor', name: 'Тактический визор', desc: 'Визор сам наводит оружие на ближайшую к прицелу цель.', ult: true }
      ],
      ultLine: 'Вы у меня на прицеле!', ultLineEnemy: 'Вы у меня на прицеле!'
    },
    tracer: {
      id: 'tracer', name: 'TRACER', role: 'offense', stars: 2, cross: 'tracer',
      hp: 150, armor: 0, shield: 0, r: 0.31, h: 1.62, eye: 1.46, headR: 0.17, ultCost: 1000,
      real: 'Лена Окстон', age: 26, job: 'Искательница приключений', base: 'Лондон, Англия', aff: 'Overwatch (ранее)',
      bio: 'Бывшая лётчица-испытатель, выпавшая из потока времени. Хронометр на груди держит её в настоящем, а вечный оптимизм — в строю.',
      w: { dmg: 6, rate: 20, ammo: 40, reload: 1.1, spread: 0.03, fall: [11, 30, 0.3], crit: 2 },
      blink: { dist: 7.5, charges: 3, cd: 3 },
      recall: { cd: 12, back: 3, dur: 1.25 },
      bomb: { dmg: 400, r: 3, fuse: 1, speed: 16 },
      kit: [
        { key: 'ЛКМ', icon: 'pistols', name: 'Импульсные пистолеты', desc: 'Два скорострельных пистолета, смертельных вблизи.' },
        { key: 'SHIFT', icon: 'blink', name: 'Скачок', desc: 'Мгновенный рывок в сторону движения. До трёх зарядов.' },
        { key: 'E', icon: 'recall', name: 'Возврат', desc: 'Возвращает Трейсер туда, где она была три секунды назад, вместе со здоровьем и патронами.' },
        { key: 'Q', icon: 'pulsebomb', name: 'Импульсная бомба', desc: 'Липкая бомба, которая взрывается через секунду.', ult: true }
      ],
      ultLine: 'Держите подарочек!', ultLineEnemy: 'Держите подарочек!'
    },
    junkrat: {
      id: 'junkrat', name: 'JUNKRAT', role: 'defense', stars: 2, cross: 'circle',
      hp: 200, armor: 0, shield: 0, r: 0.35, h: 1.9, eye: 1.68, headR: 0.18, ultCost: 1400,
      real: 'Джеймисон Фаулер', age: 25, job: 'Подрывник, вор', base: 'Джанкертаун, Австралия', aff: 'Нет',
      bio: 'Безумный подрывник из радиоактивных пустошей Австралии. Грабит, взрывает и смеётся, а за ним по пятам ходит Турбосвин.',
      w: { dmg: 120, r: 2, ammo: 5, interval: 0.667, reload: 1.5, speed: 25, grav: 14, fuse: 1.3, selfMul: 0.5 },
      mine: { cd: 10, dmg: 120, r: 2.6, knock: 13, speed: 18 },
      trap: { cd: 10, dmg: 80, root: 2.5, r: 1.1 },
      tire: { dur: 10, speed: 12, dmg: 600, r: 5, hp: 100 },
      mayhem: { count: 6, dmg: 50, r: 2 },
      kit: [
        { key: 'ЛКМ', icon: 'frag', name: 'Гранатомёт', desc: 'Прыгучие гранаты взрываются при попадании во врага или через секунду.' },
        { key: 'SHIFT', icon: 'mine', name: 'Фугас', desc: 'Бросьте мину и подорвите её правой кнопкой. Подбрасывает всех, включая Крысавчика.' },
        { key: 'E', icon: 'trap', name: 'Капкан', desc: 'Капкан ранит и обездвиживает первого врага, который в него наступит.' },
        { key: 'Q', icon: 'tire', name: 'Адская шина', desc: 'Управляйте заводной шиной-бомбой. Она заезжает на стены и взрывается по команде.', ult: true },
        { key: 'ПАССИВ', icon: 'mayhem', name: 'Сюрприз!', desc: 'После гибели Крысавчик роняет горсть гранат.' }
      ],
      ultLine: 'Ложись, сейчас рванёт!', ultLineEnemy: 'Ложись, сейчас рванёт!'
    },
    torbjorn: {
      id: 'torbjorn', name: 'TORBJÖRN', role: 'defense', stars: 2, cross: 'circle',
      hp: 200, armor: 0, shield: 0, r: 0.4, h: 1.45, eye: 1.3, headR: 0.2, ultCost: 1500,
      real: 'Торбьорн Линдхольм', age: 57, job: 'Оружейник', base: 'Гётеборг, Швеция', aff: 'Overwatch (ранее)',
      bio: 'Гениальный инженер, создавший половину оружия Overwatch. Строит турели прямо в бою и раздаёт союзникам самодельную броню.',
      w: { dmg: 70, interval: 0.6, ammo: 18, reload: 2.0, speed: 60, grav: 5, crit: 2 },
      alt: { pellets: 10, dmg: 12, spread: 0.12, ammo: 3, interval: 0.8, fall: [8, 15, 0.3] },
      hammer: { dmg: 55, interval: 0.8, range: 2.8, repair: 50, hits: 3 },
      turret: { cd: 10, build: 2, range: 40, levels: [{ hp: 150, dmg: 14, rate: 4 }, { hp: 300, dmg: 14, rate: 8 }, { hp: 800, dmg: 14, rate: 10 }] },
      pack: { cost: 50, armor: 75 },
      scrap: { kill: 25, passive: 1.5, max: 200 },
      molten: { dur: 12, armor: 300, rateMul: 1.6 },
      kit: [
        { key: 'ЛКМ', icon: 'rivet', name: 'Клепальщик', desc: 'Раскалённые заклёпки летят по дуге. ПКМ — залп картечью вблизи.' },
        { key: '2', icon: 'hammer', name: 'Кузнечный молот', desc: 'Молот чинит и улучшает турель, а заодно бьёт врагов.' },
        { key: 'SHIFT', icon: 'turret', name: 'Установка турели', desc: 'Турель сама стреляет по врагам. Три удара молота улучшают её.' },
        { key: 'E', icon: 'armor', name: 'Бронепакет', desc: 'Из металлолома Торбьорн делает бронепакет для себя или союзника.' },
        { key: 'Q', icon: 'molten', name: 'Раскалённое ядро', desc: 'Торбьорн получает броню и стреляет быстрее, а турель достигает третьего уровня.', ult: true }
      ],
      ultLine: 'Раскалённое ядро!', ultLineEnemy: 'Раскалённое ядро!'
    },
    widowmaker: {
      id: 'widowmaker', name: 'WIDOWMAKER', role: 'defense', stars: 2, cross: 'widow',
      hp: 200, armor: 0, shield: 0, r: 0.33, h: 1.8, eye: 1.64, headR: 0.17, ultCost: 1250,
      real: 'Амели Лакруа', age: 33, job: 'Наёмная убийца', base: 'Замок Гийяр, Франция', aff: '«Коготь»',
      bio: 'Балерина, которую «Коготь» превратил в идеальное оружие. Её сердце бьётся медленно, а пуля всегда находит цель.',
      auto: { dmg: 13, rate: 10, spread: 0.03, fall: [20, 40, 0.5], crit: 2 },
      scope: { min: 12, max: 120, charge: 1.0, crit: 2.5, cost: 3, interval: 0.5, speedMul: 0.5, fov: 0.55 },
      ammo: 30, reload: 1.55,
      hook: { cd: 12, range: 20, speed: 22 },
      venom: { cd: 15, dmg: 75, dur: 5, r: 3 },
      infra: { dur: 15 },
      kit: [
        { key: 'ЛКМ', icon: 'sniper', name: 'Поцелуй вдовы', desc: 'Без прицела — автомат. С оптикой — снайперская винтовка с зарядом выстрела.' },
        { key: 'SHIFT', icon: 'grapple', name: 'Крюк-кошка', desc: 'Крюк затягивает Роковую вдову на уступ.' },
        { key: 'E', icon: 'venom', name: 'Ядовитая мина', desc: 'Мина отравляет всех врагов рядом, когда кто-то её задевает.' },
        { key: 'Q', icon: 'infra', name: 'Инфразрение', desc: 'Вся команда видит врагов сквозь стены.', ult: true }
      ],
      ultLine: 'От меня не спрятаться.', ultLineEnemy: 'От меня не спрятаться.'
    },
    reinhardt: {
      id: 'reinhardt', name: 'REINHARDT', role: 'tank', stars: 1, cross: 'rein',
      hp: 300, armor: 200, shield: 0, r: 0.62, h: 2.45, eye: 2.12, headR: 0.28, ultCost: 1600,
      real: 'Райнхардт Вильгельм', age: 61, job: 'Искатель приключений', base: 'Штутгарт, Германия', aff: 'Overwatch (ранее)',
      bio: 'Рыцарь старой закалки в силовой броне. Он давно не молод, но по-прежнему встаёт стеной между друзьями и опасностью.',
      hammer: { dmg: 75, interval: 0.9, range: 5, arc: 1.0, delay: 0.3 },
      barrier: { hp: 2000, regen: 225, delay: 2, breakCd: 5, w: 5, h: 3.1, speedMul: 0.7 },
      charge: { cd: 10, speed: 16, dur: 2.6, pinDmg: 300, dropDmg: 150, bump: 50, turn: 1.1 },
      strike: { cd: 6, dmg: 100, speed: 25, range: 30 },
      shatter: { range: 20, arc: 0.55, dmg: 50, down: 2.5 },
      kit: [
        { key: 'ЛКМ', icon: 'rhammer', name: 'Ракетный молот', desc: 'Широкий удар молотом по всем врагам перед Райнхардтом.' },
        { key: 'ПКМ', icon: 'barrier', name: 'Барьерное поле', desc: 'Удерживайте, чтобы выставить огромный щит перед собой.' },
        { key: 'SHIFT', icon: 'charge', name: 'Рывок', desc: 'Разгон с захватом первого врага и ударом о стену.' },
        { key: 'E', icon: 'strike', name: 'Огненный удар', desc: 'Взмах молота выпускает пламя, пронзающее врагов.' },
        { key: 'Q', icon: 'shatter', name: 'Землетрясение', desc: 'Удар по земле сбивает с ног всех врагов перед Райнхардтом.', ult: true }
      ],
      ultLine: 'Молот опускается!', ultLineEnemy: 'Молот опускается!'
    },
    roadhog: {
      id: 'roadhog', name: 'ROADHOG', role: 'tank', stars: 1, cross: 'circle',
      hp: 600, armor: 0, shield: 0, r: 0.64, h: 2.32, eye: 2.0, headR: 0.28, ultCost: 1600,
      real: 'Мако Резерфорд', age: 48, job: 'Силовик, телохранитель', base: 'Джанкертаун, Австралия', aff: 'Нет',
      bio: 'Громила в противогазе, бывший эко-активист, ставший безжалостным отшельником пустошей. Телохранитель Крысавчика — за долю в добыче.',
      w: { pellets: 25, dmg: 6, spread: 0.12, interval: 0.85, ammo: 4, reload: 1.5, fall: [10, 20, 0.3] },
      alt: { burst: 5, spread: 0.07 },
      hook: { cd: 8, range: 20, speed: 40, dmg: 30, pullTo: 3 },
      breather: { cd: 8, heal: 300, dur: 1, speedMul: 0.5 },
      hog: { dur: 6, rate: 12, pellets: 12, dmg: 5, spread: 0.25, knock: 6 },
      kit: [
        { key: 'ЛКМ', icon: 'scrapgun', name: 'Обрез', desc: 'Широкий заряд шрапнели. ПКМ — снаряд разрывается дальше и бьёт кучнее.' },
        { key: 'SHIFT', icon: 'hook', name: 'Цепной крюк', desc: 'Крюк подтягивает врага прямо к Турбосвину.' },
        { key: 'E', icon: 'breather', name: 'Передышка', desc: 'Турбосвин вдыхает лечебный газ и восстанавливает здоровье.' },
        { key: 'Q', icon: 'wholehog', name: 'Свинство', desc: 'Непрерывный поток шрапнели отбрасывает врагов.', ult: true }
      ],
      ultLine: 'Время свинства!', ultLineEnemy: 'Время свинства!'
    },
    winston: {
      id: 'winston', name: 'WINSTON', role: 'tank', stars: 2, cross: 'circle',
      hp: 400, armor: 100, shield: 0, r: 0.62, h: 2.2, eye: 1.92, headR: 0.3, ultCost: 1500,
      real: 'Уинстон', age: 29, job: 'Учёный, искатель приключений', base: 'Лунная колония «Горизонт»', aff: 'Overwatch (ранее)',
      bio: 'Генетически изменённая горилла и блестящий учёный. Именно он решился собрать Overwatch снова.',
      tesla: { dps: 60, range: 8, targets: 4, cone: 0.55, ammo: 100, drain: 22, reload: 1.5 },
      jump: { cd: 6, vh: 15, vy: 8.5, landDmg: 50, landR: 3.5 },
      bubble: { cd: 13, hp: 600, r: 5, dur: 6, throw: 5 },
      rage: { dur: 10, hp: 1000, dmg: 40, knock: 12, jumpCd: 1, range: 3.8, interval: 0.9 },
      kit: [
        { key: 'ЛКМ', icon: 'tesla', name: 'Тесла-пушка', desc: 'Короткая дуга электричества бьёт сразу нескольких врагов.' },
        { key: 'SHIFT', icon: 'jumppack', name: 'Прыжковый ранец', desc: 'Длинный прыжок вперёд. Приземление ранит врагов рядом.' },
        { key: 'E', icon: 'bubble', name: 'Генератор барьера', desc: 'Купол защищает союзников внутри от вражеского огня.' },
        { key: 'Q', icon: 'rage', name: 'Ярость зверя', desc: 'Уинстон становится сильнее, раскидывает врагов и чаще прыгает.', ult: true }
      ],
      ultLine: 'Р-р-р-р-а-а-а-а!', ultLineEnemy: 'Р-р-р-р-а-а-а-а!'
    },
    lucio: {
      id: 'lucio', name: 'LÚCIO', role: 'support', stars: 2, cross: 'circle',
      hp: 200, armor: 0, shield: 0, r: 0.32, h: 1.74, eye: 1.56, headR: 0.18, ultCost: 1600,
      real: 'Лусио Коррейя дус Сантус', age: 26, job: 'Диджей, борец за свободу', base: 'Рио-де-Жанейро, Бразилия', aff: 'Нет',
      bio: 'Звезда мировой сцены и борец за права простых людей. Его музыка лечит раны и ускоряет шаг.',
      w: { dmg: 18, speed: 50, burst: 4, gap: 0.11, interval: 0.95, ammo: 20, reload: 1.25, crit: 2 },
      wave: { cd: 4, dmg: 25, range: 8, arc: 0.62, knock: 11 },
      song: { r: 20, heal: 16, selfMul: 0.5, speed: 1.3 },
      amp: { cd: 12, dur: 3, heal: 60, speed: 1.7 },
      barrier: { shields: 500, r: 30, dur: 6 },
      kit: [
        { key: 'ЛКМ', icon: 'amp', name: 'Звуковой усилитель', desc: 'Очередь из четырёх звуковых снарядов.' },
        { key: 'ПКМ', icon: 'soundwave', name: 'Звуковая волна', desc: 'Волна отбрасывает врагов перед Лусио.' },
        { key: 'SHIFT', icon: 'crossfade', name: 'Смена трека', desc: 'Переключает музыку: лечение или ускорение для союзников рядом.' },
        { key: 'E', icon: 'ampitup', name: 'Громче!', desc: 'Ненадолго усиливает эффект текущей песни.' },
        { key: 'Q', icon: 'soundbarrier', name: 'Звуковой барьер', desc: 'Союзники рядом получают мощные временные щиты.', ult: true },
        { key: 'ПАССИВ', icon: 'wallride', name: 'Езда по стенам', desc: 'Удерживайте прыжок у стены, чтобы ехать по ней.' }
      ],
      ultLine: 'Врубаем на полную!', ultLineEnemy: 'Врубаем на полную!'
    },
    mercy: {
      id: 'mercy', name: 'MERCY', role: 'support', stars: 1, cross: 'mercy',
      hp: 200, armor: 0, shield: 0, r: 0.32, h: 1.74, eye: 1.56, headR: 0.17, ultCost: 1800,
      real: 'Ангела Циглер', age: 37, job: 'Полевой врач, учёный', base: 'Цюрих, Швейцария', aff: 'Overwatch (ранее)',
      bio: 'Выдающийся врач и изобретательница нанобиологического лечения. Её крылья приносят надежду туда, где идёт бой.',
      staff: { heal: 50, boost: 1.3, range: 15, keep: 20 },
      blaster: { dmg: 20, speed: 50, rate: 5, ammo: 20, reload: 1.4, crit: 2 },
      ga: { cd: 1.5, range: 30, speed: 17 },
      descent: { fall: 1.6 },
      regen: { delay: 1, rate: 20 },
      rez: { r: 15, invuln: 1.5 },
      kit: [
        { key: 'ЛКМ', icon: 'staff', name: 'Кадуцей', desc: 'Луч лечит союзника. ПКМ — луч усиливает его урон.' },
        { key: '2', icon: 'blaster', name: 'Кадуцей-бластер', desc: 'Лёгкий пистолет для самозащиты.' },
        { key: 'SHIFT', icon: 'angel', name: 'Ангел-хранитель', desc: 'Ангел летит к союзнику, на которого смотрит.' },
        { key: 'ПРОБЕЛ', icon: 'descent', name: 'Ангельское снижение', desc: 'Удерживайте прыжок в воздухе, чтобы медленно парить.' },
        { key: 'Q', icon: 'rez', name: 'Воскрешение', desc: 'Возвращает к жизни погибших союзников рядом.', ult: true }
      ],
      ultLine: 'Герои не умирают!', ultLineEnemy: 'Герои не умирают!'
    },
    zenyatta: {
      id: 'zenyatta', name: 'ZENYATTA', role: 'support', stars: 3, cross: 'zen',
      hp: 50, armor: 0, shield: 150, r: 0.36, h: 1.86, eye: 1.66, headR: 0.2, ultCost: 1600,
      real: 'Тэккартха Дзенъятта', age: 20, job: 'Странствующий монах', base: 'Непал', aff: 'Шамбали',
      bio: 'Омник-монах, покинувший монастырь, чтобы помогать людям и машинам обрести гармонию.',
      orb: { dmg: 40, speed: 80, interval: 0.42, ammo: 20, reload: 2.0, crit: 2 },
      volley: { per: 0.45, max: 5 },
      harmony: { heal: 30, range: 40, los: 3 },
      discord: { mul: 1.5, range: 40, los: 3 },
      trans: { dur: 6, heal: 300, r: 10, speed: 2.0 },
      kit: [
        { key: 'ЛКМ', icon: 'orb', name: 'Сфера разрушения', desc: 'Сферы энергии. Удерживайте ПКМ, чтобы собрать залп до пяти сфер.' },
        { key: 'SHIFT', icon: 'harmony', name: 'Сфера гармонии', desc: 'Сфера над союзником постоянно лечит его.' },
        { key: 'E', icon: 'discord', name: 'Сфера раздора', desc: 'Враг под этой сферой получает больше урона.' },
        { key: 'Q', icon: 'trans', name: 'Трансцендентность', desc: 'Дзенъятта становится неуязвим и быстро лечит всех союзников рядом.', ult: true }
      ],
      ultLine: 'Обретите покой.', ultLineEnemy: 'Обретите покой.'
    },
    trainbot: {
      id: 'trainbot', name: 'ТРЕНИРОВОЧНЫЙ РОБОТ', role: 'tank', training: true, stars: 1, cross: 'cross',
      hp: 200, armor: 0, shield: 0, r: 0.42, h: 1.9, eye: 1.7, headR: 0.22, ultCost: 1e9,
      real: 'Омник-мишень', age: 0, job: 'Мишень', base: 'Тренировочный полигон', aff: 'Overwatch',
      bio: 'Списанный рабочий омник, переделанный в движущуюся мишень для новобранцев.',
      w: { dmg: 6, rate: 1.6, ammo: 999, reload: 1, spread: 0.06, fall: [15, 35, 0.5], crit: 2 },
      kit: [{ key: 'ЛКМ', icon: 'rifle', name: 'Учебный бластер', desc: 'Слабые одиночные выстрелы.' }],
      ultLine: '', ultLineEnemy: ''
    }
  };

  O.MAP_LIST = [
    { id: 'hanamura', name: 'HANAMURA', loc: 'Япония', mode: 'assault', blurb: 'Храмовый квартал клана Шимада в цветении сакуры.' },
    { id: 'volskaya', name: 'VOLSKAYA INDUSTRIES', loc: 'Россия', mode: 'assault', blurb: 'Заснеженные цеха, где собирают боевых роботов «Святогор».' },
    { id: 'dorado', name: 'DORADO', loc: 'Мексика', mode: 'escort', blurb: 'Праздничный вечер в прибрежном городе и электростанция «ЛюмериКо».' },
    { id: 'gibraltar', name: 'WATCHPOINT: GIBRALTAR', loc: 'Гибралтар', mode: 'escort', blurb: 'Заброшенный пост наблюдения Overwatch и стартовая площадка ракеты.' },
    { id: 'hollywood', name: 'HOLLYWOOD', loc: 'США', mode: 'hybrid', blurb: 'Киностудия «Голдшир», улицы с пальмами и декорации Дикого Запада.' },
    { id: 'kingsrow', name: "KING'S ROW", loc: 'Англия', mode: 'hybrid', blurb: 'Вечерний Лондон, метро и район омников.' },
    { id: 'ilios', name: 'ILIOS', loc: 'Греция', mode: 'control', blurb: 'Белые улочки острова: маяк, колодец и древние руины.', stages: ['LIGHTHOUSE', 'WELL', 'RUINS'], stagesRu: ['Маяк', 'Колодец', 'Руины'] },
    { id: 'lijiang', name: 'LIJIANG TOWER', loc: 'Китай', mode: 'control', blurb: 'Ночной рынок, сад и центр управления на вершине башни.', stages: ['NIGHT MARKET', 'GARDEN', 'CONTROL CENTER'], stagesRu: ['Ночной рынок', 'Сад', 'Центр управления'] }
  ];

  O.MODE_INFO = {
    assault: { ru: 'ЗАХВАТ ТОЧЕК', att: 'АТАКУЙТЕ ОБЪЕКТ', def: 'ЗАЩИЩАЙТЕ ОБЪЕКТ', rule: 'Атакующие захватывают две точки по очереди. Защитники держат их до конца времени.' },
    escort: { ru: 'СОПРОВОЖДЕНИЕ', att: 'СОПРОВОЖДАЙТЕ ГРУЗ', def: 'ОСТАНОВИТЕ ГРУЗ', rule: 'Атакующие ведут груз через контрольные пункты. Защитники не дают ему дойти до цели.' },
    hybrid: { ru: 'ГИБРИД', att: 'АТАКУЙТЕ ОБЪЕКТ', def: 'ЗАЩИЩАЙТЕ ОБЪЕКТ', rule: 'Сначала атакующие захватывают точку A, затем сопровождают груз до конца пути.' },
    control: { ru: 'КОНТРОЛЬ', att: 'ЗАХВАТИТЕ ОБЪЕКТ', def: 'УДЕРЖИВАЙТЕ ОБЪЕКТ', rule: 'Обе команды борются за одну точку. Первая, набравшая 100%, выигрывает раунд. Матч до двух побед.' }
  };

  O.BOT_NAMES = [
    'Sakkaya', 'Aggression', 'Tsuna', 'Hplaa', 'Nuotti', 'Apsu', 'griever', 'Saekki', 'Kuroneko', 'Wolfram', 'SnowFox', 'Pelmen',
    'Chmonya', 'Vityok', 'DedMoroz', 'Kotletka', 'Ryzhik', 'ProstoKek', 'Nastya', 'Kupidon', 'KAPIBARA', 'LeRoi', 'Zmey', 'Dima1999',
    'Tractor', 'Paragon', 'Kvas', 'TiltBoy', 'BigPapa', 'Sova', 'Borsch', 'Majino', 'Chirwood', 'Ehm', 'Glorfindel', 'Kaban',
    'Myshka', 'Lisichka', 'NoScope', 'Pchela', 'Klubnika', 'Druzhba', 'Heisenberg', 'Oblomov', 'Varenik', 'Lampochka', 'Kefir', 'Zayats',
    'Voldemar', 'Babushka', 'Shaman', 'Molodoy', 'Sputnik', 'Kosmos', 'Yozhik', 'Bublik', 'Samovar', 'Grom', 'Ptichka', 'Karandash',
    'Hanzo_Main', 'GenjiPls', 'PotG_Hunter', 'Payload', 'Overtime', 'Nerf_This', 'Kaktus', 'Medved', 'Tushkan', 'Pryanik'
  ];

  O.CHAT = {
    start: ['gl hf', 'всем удачи', 'gl', 'погнали', 'кто танк?', 'нужен второй хил', 'не стакайтесь', 'go go go', 'hf', 'собираемся вместе'],
    kill: ['ez', 'изи', 'nice', 'лол', 'красиво', 'gg ez', 'ha', 'поймал'],
    death: ['лаги...', 'хил где?', 'нужно лечение!', 'ну и ну', 'откуда он', 'снайпер слева', 'крысавчик опять', 'ну конечно', 'wtf', 'реально?'],
    ally: ['нужно лечение!', 'группируемся', 'ульта готова', 'идём на точку', 'не лезьте по одному', 'держим точку', 'толкаем груз', 'фланг справа'],
    win: ['gg', 'gg wp', 'гг', 'gg ez', 'спасибо за игру', 'хорошо сыграли'],
    lose: ['gg', 'гг', 'в следующий раз', 'ну хоть потг', 'gg wp', 'реванш?'],
    potg: ['ну конечно', 'заслуженно', 'красавчик', 'лол опять он', 'повезло']
  };

  O.ANNOUNCE = {
    prepAtt: 'Подготовка к атаке', prepDef: 'Подготовка к обороне',
    attA: 'Атакуйте объект А', defA: 'Защищайте объект А', attB: 'Атакуйте объект Б', defB: 'Защищайте объект Б',
    capOurs: 'Объект захвачен', capTheirs: 'Противник захватил объект',
    capturing: 'Мы захватываем объект', losing: 'Противник захватывает объект',
    pushOurs: 'Груз продвигается', pushTheirs: 'Противник толкает груз',
    cpOurs: 'Контрольный пункт пройден', cpTheirs: 'Противник прошёл контрольный пункт',
    stopOurs: 'Груз остановлен', payloadAtt: 'Сопровождайте груз', payloadDef: 'Остановите груз',
    overtime: 'Дополнительное время!', victory: 'Победа!', defeat: 'Поражение', draw: 'Ничья',
    roundWon: 'Раунд выигран', roundLost: 'Раунд проигран', unlocked: 'Объект открыт',
    ctrlOurs: 'Мы контролируем объект', ctrlTheirs: 'Противник контролирует объект',
    begin: 'Бой начался', fiveSec: 'Пять секунд'
  };
})(globalThis.Ow98 = globalThis.Ow98 || {});
