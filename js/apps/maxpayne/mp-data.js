(function (M) {
  'use strict';
  M.AMMO = {
    '9mm': { name: '9 мм', max: 250 },
    '50ae': { name: '.50 AE', max: 63 },
    '12g': { name: '12 калибр', max: 64 },
    gren: { name: 'гранаты', max: 8 },
    molo: { name: 'коктейли Молотова', max: 8 }
  };
  M.WEAPONS = {
    pipe: { name: 'Железная труба', slot: 1, melee: true, dmg: 38, range: 1.9, cd: 0.52, hold: 'melee' },
    bat: { name: 'Бейсбольная бита', slot: 1, melee: true, dmg: 52, range: 2.0, cd: 0.62, hold: 'melee' },
    beretta: { name: 'Беретта', slot: 2, ammo: '9mm', clip: 18, dmg: 21, cd: 0.14, spread: 0.011, speed: 110, pellets: 1, reload: 1.3, sound: 'beretta', hold: 'pistol', semi: true, give: 18 },
    beretta2: { name: 'Две беретты', slot: 2, ammo: '9mm', clip: 36, dmg: 21, cd: 0.085, spread: 0.02, speed: 110, pellets: 1, reload: 1.9, sound: 'beretta', hold: 'dual', semi: true, needs: 'beretta', dualOf: 'beretta' },
    deagle: { name: 'Desert Eagle', slot: 2, ammo: '50ae', clip: 7, dmg: 62, cd: 0.4, spread: 0.007, speed: 130, pellets: 1, reload: 1.6, sound: 'deagle', hold: 'pistol', semi: true, give: 7 },
    pump: { name: 'Помповое ружьё', slot: 3, ammo: '12g', clip: 7, dmg: 12, cd: 0.82, spread: 0.07, speed: 80, pellets: 9, reload: 0.42, shellReload: true, sound: 'pump', hold: 'rifle', give: 7 },
    sawed: { name: 'Обрез', slot: 3, ammo: '12g', clip: 2, dmg: 12, cd: 0.26, spread: 0.11, speed: 75, pellets: 12, reload: 1.5, sound: 'sawed', hold: 'pistol', give: 6 },
    ingram: { name: 'Ингрэм', slot: 4, ammo: '9mm', clip: 32, dmg: 14, cd: 0.058, spread: 0.038, speed: 105, pellets: 1, reload: 1.4, sound: 'ingram', hold: 'pistol', auto: true, give: 32 },
    ingram2: { name: 'Два ингрэма', slot: 4, ammo: '9mm', clip: 64, dmg: 14, cd: 0.034, spread: 0.052, speed: 105, pellets: 1, reload: 2.1, sound: 'ingram', hold: 'dual', auto: true, needs: 'ingram', dualOf: 'ingram' },
    grenade: { name: 'Граната', slot: 5, ammo: 'gren', throwable: true, cd: 0.9, hold: 'throw', give: 2 },
    molotov: { name: 'Коктейль Молотова', slot: 5, ammo: 'molo', throwable: true, cd: 0.9, hold: 'throw', give: 2 }
  };
  M.WEAPON_ORDER = ['pipe', 'bat', 'beretta', 'beretta2', 'deagle', 'pump', 'sawed', 'ingram', 'ingram2', 'grenade', 'molotov'];

  M.DIFFICULTY = [
    { id: 'fugitive', name: 'Беглец', dmg: 0.55, acc: 0.75, react: 1.25, saves: -1, timer: false, desc: 'Для тех, кто пришёл за историей. Враги промахиваются чаще, а сохраняться можно сколько угодно.' },
    { id: 'hardboiled', name: 'Крутой', dmg: 1, acc: 1, react: 1, saves: -1, timer: false, desc: 'Нормальная сложность. Нью-Йорк стреляет в ответ.' },
    { id: 'doa', name: 'Мёртвый по прибытии', dmg: 1.3, acc: 1.15, react: 0.85, saves: 7, timer: false, desc: 'Семь сохранений на главу, враги злее и точнее. Открывается после первой части.', locked: true },
    { id: 'nym', name: 'Нью-йоркская минута', dmg: 1.15, acc: 1.1, react: 0.9, saves: -1, timer: true, desc: 'На главу даётся минута. Каждое убийство добавляет секунды. Открывается после первой части.', locked: true }
  ];

  M.ENEMY = {
    junkie: { name: 'Наркоман', hp: 55, speed: 3.6, react: [0.55, 0.95], acc: 0.9, look: 'junkie', barks: 'junkie' },
    thug: { name: 'Бандит', hp: 80, speed: 3.9, react: [0.45, 0.8], acc: 1, look: 'thug', barks: 'mob' },
    mobster: { name: 'Мафиози', hp: 95, speed: 3.9, react: [0.4, 0.75], acc: 1.05, look: 'mobster', barks: 'mob' },
    robber: { name: 'Грабитель', hp: 85, speed: 4.0, react: [0.4, 0.75], acc: 1, look: 'robber', barks: 'mob' },
    hooker: { name: 'Девица Лупино', hp: 110, speed: 4.1, react: [0.35, 0.6], acc: 1.1, look: 'hooker', barks: 'hooker', female: true },
    goth: { name: 'Громила Лупино', hp: 105, speed: 4.0, react: [0.35, 0.65], acc: 1.1, look: 'goth', barks: 'goth' },
    doorman: { name: 'Вышибала', hp: 120, speed: 3.6, react: [0.4, 0.7], acc: 1, look: 'doorman', barks: 'mob' },
    joey: { name: 'Джоуи Финито', hp: 260, speed: 4.1, react: [0.3, 0.5], acc: 1.15, look: 'finitoJoey', barks: 'finito', boss: true },
    virgilio: { name: 'Вирджилио Финито', hp: 260, speed: 3.9, react: [0.3, 0.5], acc: 1.15, look: 'finitoVirgilio', barks: 'finito', boss: true },
    rico: { name: 'Рико Муэрте', hp: 340, speed: 4.2, react: [0.25, 0.45], acc: 1.2, look: 'rico', barks: 'rico', boss: true },
    vinnie: { name: 'Винни Гоньитти', hp: 400, speed: 4.4, react: [0.3, 0.5], acc: 0.8, look: 'vinnie', barks: 'vinnie', boss: true },
    lupino: { name: 'Джек Лупино', hp: 950, speed: 5.0, react: [0.2, 0.35], acc: 1.2, look: 'lupino', barks: 'lupino', boss: true },
    cop: { name: 'Полицейский', hp: 9999, speed: 3.5, react: [0.5, 0.8], acc: 0.9, look: 'cop', barks: 'cop', friendly: true },
    worker: { name: 'Работник станции', hp: 60, speed: 3.2, react: [1, 1], acc: 0, look: 'worker', barks: 'civ', civilian: true },
    civ: { name: 'Жилец', hp: 50, speed: 3.0, react: [1, 1], acc: 0, look: 'tenant', barks: 'civ', civilian: true },
    dummy: { name: 'Мишень', hp: 40, speed: 0, react: [0.6, 0.9], acc: 0.8, look: 'dummy', barks: 'none', dummy: true },
    alex: { name: 'Алекс Балдер', hp: 9999, speed: 3.2, react: [1, 1], acc: 0, look: 'alex', barks: 'none', civilian: true },
    michelle: { name: 'Мишель', hp: 9999, speed: 0, react: [1, 1], acc: 0, look: 'michelle', barks: 'none', civilian: true, female: true }
  };

  M.BARKS = {
    mob: {
      spot: ['Это Пейн!', 'Вон он, у двери!', 'Гости пришли!', 'Эй, ты! Стоять!', 'Коп! Мочи его!', 'Джонни, у нас компания.', 'Ну вот и он, красавчик.'],
      hurt: ['Он меня зацепил!', 'Ай, мать твою!', 'Рука! Моя рука!', 'Больно же, сволочь!'],
      reload: ['Прикрой, перезаряжаюсь!', 'Патроны, патроны...', 'Пустой!'],
      ally: ['Сэла положили!', 'Он Томми завалил!', 'Этот псих всех перебьёт!', 'Да кто он такой вообще?'],
      grenade: ['Лови подарок!', 'Граната!', 'Держи, коп!'],
      search: ['Куда он делся?', 'Проверь за углом.', 'Я слышал выстрелы там.', 'Выходи, поговорим.'],
      flank: ['Он засел за укрытием! Обходи!', 'Держи его там, я зайду сбоку.', 'Прижали! Обойди слева!', 'Не высовывается. Сейчас вытащим.'],
      idle: ['Лупино сказал ждать. Ждём.', 'Холодина, как у тёщи в сердце.', 'Слышал, в Бронксе опять замело.', 'Кто взял мой кофе?', 'Двадцать минут. Потом я домой.']
    },
    junkie: {
      spot: ['Ты кто такой?!', 'Он настоящий? Он настоящий!', 'Ещё один! Ещё!', 'Не подходи, я вижу крылья!'],
      hurt: ['Не чувствую... ничего не чувствую!', 'Кровь тёплая...'],
      reload: ['Где... где патроны?'],
      ally: ['Он убил Ленни!', 'Они все падают...'],
      grenade: ['Бум!'],
      search: ['Кто здесь? Кто здесь?', 'Выходи, пёсик.'],
      flank: ['Он спрятался! Выкурим его!', 'Иди сбоку, сбоку!'],
      idle: ['Валькирия поёт...', 'Мне нужно ещё. Ещё чуть-чуть.', 'Стены дышат, чувак.']
    },
    hooker: {
      spot: ['Смотри-ка, мальчик заблудился.', 'Сюда, красавчик. Ближе.', 'Рико! У нас гость!'],
      hurt: ['Платье испортил, урод!', 'Ах ты...'],
      reload: ['Секунду, милый.'],
      ally: ['Ты за это заплатишь!'],
      grenade: ['Держи!'],
      search: ['Иди к мамочке.'],
      flank: ['Прячешься, красавчик? Я зайду с другой стороны.', 'Держите его, девочки, я обойду.'],
      idle: ['Рико обещал выходной. Врал, как всегда.']
    },
    goth: {
      spot: ['Волк видит тебя!', 'Жертва сама пришла!', 'Во имя Лупино!', 'Рагнарёк начинается с тебя!'],
      hurt: ['Кровь для владыки!', 'Ты ничего не понимаешь!'],
      reload: ['Заряжаю!'],
      ally: ['Он в Вальгалле. Ты пойдёшь в Хель.'],
      grenade: ['Огонь очистит!'],
      search: ['Он где-то в тенях.', 'Джек хочет его живым. Или нет.'],
      flank: ['Тень за камнем! Окружить!', 'Не дайте ему отсидеться!'],
      idle: ['Джек опять читает эти книжки вслух.', 'Бас в этом клубе мне уже снится.']
    },
    finito: {
      spot: ['Вирджилио, это он! Это Пейн!', 'Джоуи, не стой, стреляй!', 'Братья Финито передают привет!'],
      hurt: ['Он меня подстрелил, Вирджилио!', 'Мама будет в ярости!'],
      reload: ['Джоуи, прикрой!', 'Опять эта пружина заела!'],
      ally: ['Джоуи! Нет! Джоуи!', 'Вирджилио! Ты за это ответишь, коп!'],
      grenade: ['Держи!'],
      search: ['Он где-то тут. Я чую.', 'Не прячься, будет только хуже.'],
      flank: ['Джоуи, он за стенкой! Обходи!', 'Вирджилио, держи его, я сбоку!'],
      idle: ['Джоуи, ты дверь запер?', 'Сам запирай.']
    },
    rico: {
      spot: ['Сладкий, ты пришёл не в тот квартал.', 'Рико Муэрте не прощает визитов без записи!', 'Девочки, работаем!'],
      hurt: ['Костюм за три тысячи!', 'Ты мне заплатишь за химчистку!'],
      reload: ['Минутку, сладкий.'],
      ally: ['Это был мой лучший парень!'],
      grenade: ['Сюрприз!'],
      search: ['Иди сюда, коп. Рико ждёт.'],
      flank: ['Сидишь в норке, сладкий? Девочки, обойдите.'],
      idle: ['Где мои деньги? Где мои деньги?']
    },
    vinnie: {
      spot: ['Не-не-не! Это Пейн! Убейте его!', 'Мочите его, мочите!', 'Я плачу двойную цену за его голову!'],
      hurt: ['Он попал в меня! Он в меня попал!', 'Моя нога! Сволочь!'],
      reload: ['Чёрт, чёрт, чёрт!'],
      ally: ['Вы что, спите? Стреляйте!'],
      grenade: ['Жри!'],
      search: ['Где он? Скажите мне, где он!'],
      flank: ['Он засел! Обойдите его, идиоты!'],
      idle: ['Лупино меня убьёт. Точно убьёт.']
    },
    lupino: {
      spot: ['Волк голоден, Пейн!', 'Смотри на меня! Я Фенрир!', 'Кровь! Кровь для тёмных!'],
      hurt: ['Я не чувствую боли! Я выше боли!', 'Ещё! Ещё, червь!'],
      reload: ['Огонь Муспельхейма!'],
      ally: ['Слабые уходят первыми.'],
      grenade: ['Гори! Гори!', 'Сурт тебя заберёт!'],
      search: ['Иди ко мне, маленький Пейн.'],
      idle: ['Локи, Хель, Фенрир...']
    },
    cop: {
      spot: ['Полиция! Бросай оружие!', 'Это он! Это Пейн!', 'Стоять на месте!'],
      hurt: [], reload: [], ally: [], grenade: [], search: ['Проверьте крышу!'], idle: []
    },
    civ: { spot: ['Не стреляйте!'], hurt: ['Ай!'], reload: [], ally: [], grenade: [], search: [], idle: [] },
    none: { spot: [], hurt: [], reload: [], ally: [], grenade: [], search: [], idle: [] }
  };

  M.ITEM_NAMES = {
    painkillers: 'Обезболивающее',
    ammo9: 'Патроны 9 мм',
    ammo50: 'Патроны .50 AE',
    shells: 'Патроны 12 калибра',
    detonator: 'Детонатор',
    key: 'Ключ'
  };
})(globalThis.MaxPayne = globalThis.MaxPayne || {});
