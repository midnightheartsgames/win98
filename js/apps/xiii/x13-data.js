(function (X) {
  'use strict';

  X.WEAPONS = {
    fists: { name: 'Кулаки', slot: 1, kind: 'melee', dmg: 30, ko: true, range: 1.7, rate: 0.42, noise: 2, icon: 'fist' },
    object: { name: 'Подручный предмет', slot: 1, kind: 'melee', dmg: 60, ko: true, koOneHit: true, range: 1.9, rate: 0.6, noise: 5, icon: 'object' },
    knife: { name: 'Метательные ножи', slot: 2, kind: 'throw', dmg: 85, headMul: 3, speed: 26, gravity: 7, rate: 0.55, clip: 0, max: 10, silent: true, noise: 1, icon: 'knife' },
    beretta: { name: 'Беретта 9 мм', slot: 3, kind: 'hitscan', dmg: 24, headMul: 5, clip: 15, max: 120, rate: 0.2, spread: 0.014, recoil: 0.035, reload: 1.4, noise: 34, ammo: '9mm', icon: 'pistol' },
    silenced: { name: 'Беретта с глушителем', slot: 3, kind: 'hitscan', dmg: 22, headMul: 5, clip: 15, max: 120, rate: 0.24, spread: 0.012, recoil: 0.03, reload: 1.5, noise: 4, silent: true, ammo: '9mm', icon: 'silenced' },
    magnum: { name: '.44 Special', slot: 3, kind: 'hitscan', dmg: 62, headMul: 4, clip: 6, max: 48, rate: 0.55, spread: 0.008, recoil: 0.1, reload: 2.2, noise: 42, ammo: '44', icon: 'revolver' },
    shotgun: { name: 'Помповое ружьё', slot: 4, kind: 'hitscan', dmg: 15, pellets: 9, headMul: 2, clip: 8, max: 48, rate: 0.95, spread: 0.075, recoil: 0.12, reload: 0.5, shellReload: true, noise: 44, ammo: 'shell', icon: 'shotgun' },
    m16: { name: 'M16', slot: 5, kind: 'hitscan', dmg: 21, headMul: 4, clip: 30, max: 240, rate: 0.09, auto: true, spread: 0.022, recoil: 0.014, reload: 2.0, noise: 44, ammo: '556', icon: 'rifle' },
    kalash: { name: 'Калашников', slot: 5, kind: 'hitscan', dmg: 27, headMul: 4, clip: 30, max: 210, rate: 0.11, auto: true, spread: 0.03, recoil: 0.02, reload: 2.3, noise: 46, ammo: '762', icon: 'ak' },
    sniper: { name: 'Снайперская винтовка', slot: 6, kind: 'hitscan', dmg: 130, headMul: 4, clip: 5, max: 40, rate: 1.1, spread: 0.05, zoomSpread: 0.0008, zoom: [3.5, 9], sway: 0.012, recoil: 0.14, reload: 2.6, noise: 52, ammo: '308', icon: 'sniper' },
    crossbow: { name: 'Арбалет', slot: 6, kind: 'proj', proj: 'bolt', dmg: 140, headMul: 3, speed: 62, gravity: 2.5, clip: 1, max: 20, rate: 0.3, reload: 1.3, zoom: [3], sway: 0.008, silent: true, noise: 1, icon: 'crossbow' },
    harpoon: { name: 'Гарпун', slot: 7, kind: 'proj', proj: 'harpoon', dmg: 160, headMul: 2, speed: 40, gravity: 4, clip: 1, max: 12, rate: 0.3, reload: 1.6, silent: true, noise: 3, underwater: true, icon: 'harpoon' },
    m60: { name: 'M60', slot: 7, kind: 'hitscan', dmg: 30, headMul: 3, clip: 100, max: 300, rate: 0.085, auto: true, spread: 0.036, recoil: 0.022, reload: 4.2, noise: 55, heavy: 0.8, ammo: '762n', icon: 'm60' },
    bazooka: { name: 'Базука', slot: 8, kind: 'proj', proj: 'rocket', dmg: 260, radius: 5.5, speed: 30, gravity: 0, clip: 1, max: 8, rate: 0.5, reload: 2.4, noise: 60, heavy: 0.85, icon: 'bazooka' },
    grenade: { name: 'Гранаты', slot: 9, kind: 'grenade', dmg: 220, radius: 6.5, fuse: 2.4, speed: 14, clip: 0, max: 8, rate: 1.0, noise: 60, icon: 'grenade' }
  };
  X.WEAPON_ORDER = ['fists', 'object', 'knife', 'beretta', 'silenced', 'magnum', 'shotgun', 'm16', 'kalash', 'sniper', 'crossbow', 'harpoon', 'm60', 'bazooka', 'grenade'];

  X.OBJECTS = {
    chair: { name: 'Стул', hits: 1 },
    bottle: { name: 'Бутылка', hits: 1 },
    ashtray: { name: 'Пепельница', hits: 1 },
    broom: { name: 'Швабра', hits: 2 },
    shovel: { name: 'Лопата', hits: 3 },
    extinguisher: { name: 'Огнетушитель', hits: 2 },
    lamp: { name: 'Настольная лампа', hits: 1 },
    stool: { name: 'Табурет', hits: 1 }
  };

  X.TEAMS = { player: 0, ally: 0, enemy: 1, neutral: 2, prisoner: 3 };
  X.hostile = function (a, b) {
    if (a === b) return false;
    if (a === 'neutral' || b === 'neutral') return false;
    if ((a === 'player' || a === 'ally') && (b === 'player' || b === 'ally')) return false;
    if (a === 'prisoner' && b !== 'enemy') return false;
    if (b === 'prisoner' && a !== 'enemy') return false;
    return true;
  };

  X.LINES = {
    thug: {
      spot: ['Вот он!', 'Эй, ты!', 'Это он, Тринадцатый!', 'Кончай его!'],
      hear: ['Что это было?', 'Кто здесь?', 'Слышал?'],
      calm: ['Показалось...', 'Никого.', 'Ладно, работаем.'],
      hurt: ['А-а!', 'Чёрт!', 'Я ранен!'],
      body: ['Здесь тело!', 'Кто-то его уложил!'],
      lost: ['Куда он делся?', 'Ищите его!'],
      hostage: ['Не стреляйте!', 'Отпусти его!']
    },
    soldier: {
      spot: ['Контакт!', 'Нарушитель!', 'Стоять!', 'Огонь!'],
      hear: ['Слышал выстрел?', 'Проверю.', 'Что за шум?'],
      calm: ['Чисто.', 'Отбой.', 'Возвращаюсь на пост.'],
      hurt: ['Я задет!', 'Санитара!', 'Проклятье!'],
      body: ['Солдат убит!', 'Тревога, у нас убитый!'],
      lost: ['Потерял цель!', 'Прочесать сектор!'],
      hostage: ['Не стрелять!', 'У него заложник!'],
      alarm: ['Поднимаю тревогу!', 'Тревога!']
    },
    agent: {
      spot: ['ФБР! Ни с места!', 'Руки вверх!', 'Он сбежал!'],
      hear: ['Что там?', 'Проверьте коридор.'],
      calm: ['Всё тихо.', 'Никого.'],
      hurt: ['Ох!', 'Больно!'],
      body: ['Агент без сознания!', 'Тут наш человек!'],
      lost: ['Ищите Роуланда!', 'Перекрыть выходы!'],
      hostage: ['Не стрелять, там агент!', 'Отпусти его, Роуланд!'],
      alarm: ['Включаю тревогу!']
    },
    guard: {
      spot: ['Стоять, заключённый!', 'Побег!', 'Лежать!'],
      hear: ['Кто там шумит?', 'Эй?'],
      calm: ['Тишина.', 'Всё под контролем.'],
      hurt: ['Меня зацепило!', 'А-а!'],
      body: ['Охранник убит!'],
      lost: ['Где он?', 'Обыскать блок!'],
      hostage: ['Не стрелять!'],
      alarm: ['Тревога в блоке!']
    },
    civilian: {
      spot: ['Помогите!', 'Не стреляйте!', 'А-а-а!'],
      hear: ['Что происходит?'],
      calm: ['Господи...'],
      hurt: ['Ай!'],
      body: ['Здесь человек!'],
      lost: ['...'],
      hostage: ['Отпустите!']
    }
  };

  X.CHARS = {
    xiii: { name: 'XIII', team: 'player', hp: 100, look: { face: 'xiii', hair: 'blond', coat: [0.22, 0.28, 0.4], shirt: [0.8, 0.78, 0.7], pants: [0.2, 0.22, 0.28], shoes: [0.12, 0.08, 0.06], skin: 0 } },
    sally: { name: 'Салли', team: 'neutral', hp: 60, lines: 'civilian', look: { face: 'sally', hair: 'bun', female: true, coat: [0.85, 0.2, 0.15], shirt: [0.85, 0.2, 0.15], pants: [0.9, 0.85, 0.7], shoes: [0.9, 0.9, 0.85], skin: 1 } },
    hitman: { name: 'Киллер', team: 'enemy', hp: 90, lines: 'thug', weapon: 'beretta', look: { face: 'hitman', hat: 'beanie', hatColor: [0.18, 0.22, 0.14], coat: [0.52, 0.27, 0.14], shirt: [0.35, 0.33, 0.28], pants: [0.24, 0.24, 0.2], shoes: [0.1, 0.08, 0.06], skin: 0 } },
    hitman2: { name: 'Киллер', team: 'enemy', hp: 90, lines: 'thug', weapon: 'beretta', look: { face: 'hitman2', hat: 'cap', hatColor: [0.3, 0.12, 0.1], coat: [0.28, 0.3, 0.36], shirt: [0.6, 0.55, 0.45], pants: [0.3, 0.26, 0.2], shoes: [0.1, 0.08, 0.06], skin: 0 } },
    killer: { name: 'Люди Мангуста', team: 'enemy', hp: 100, lines: 'thug', weapon: 'm16', look: { face: 'killer', hair: 'slick', glasses: true, coat: [0.1, 0.1, 0.12], shirt: [0.85, 0.85, 0.85], tie: [0.5, 0.05, 0.05], pants: [0.1, 0.1, 0.12], shoes: [0.05, 0.05, 0.05], skin: 0 } },
    bankguard: { name: 'Охранник банка', team: 'neutral', hp: 80, lines: 'civilian', noKill: true, look: { face: 'guard', hat: 'police', hatColor: [0.15, 0.2, 0.4], coat: [0.2, 0.26, 0.46], shirt: [0.2, 0.26, 0.46], pants: [0.15, 0.18, 0.3], shoes: [0.05, 0.05, 0.05], skin: 1 } },
    clerk: { name: 'Клерк', team: 'neutral', hp: 60, lines: 'civilian', noKill: true, look: { face: 'clerk', hair: 'bald', glasses: false, coat: [0.46, 0.42, 0.36], shirt: [0.9, 0.9, 0.85], tie: [0.2, 0.3, 0.55], pants: [0.35, 0.32, 0.28], shoes: [0.15, 0.1, 0.05], skin: 0 } },
    civilian: { name: 'Посетитель', team: 'neutral', hp: 60, lines: 'civilian', noKill: true, look: { face: 'civ', hair: 'brown', coat: [0.55, 0.5, 0.3], shirt: [0.8, 0.7, 0.5], pants: [0.3, 0.3, 0.35], shoes: [0.2, 0.12, 0.06], skin: 2 } },
    civilian2: { name: 'Посетительница', team: 'neutral', hp: 60, lines: 'civilian', noKill: true, look: { face: 'civf', hair: 'bob', female: true, coat: [0.6, 0.25, 0.4], shirt: [0.6, 0.25, 0.4], pants: [0.25, 0.2, 0.3], shoes: [0.2, 0.1, 0.1], skin: 1 } },
    agent: { name: 'Агент ФБР', team: 'enemy', hp: 80, lines: 'agent', weapon: 'beretta', noKill: true, look: { face: 'agent', hair: 'short', coat: [0.2, 0.22, 0.26], shirt: [0.88, 0.88, 0.9], tie: [0.12, 0.14, 0.3], pants: [0.2, 0.22, 0.26], shoes: [0.05, 0.05, 0.05], skin: 0 } },
    agent2: { name: 'Агент ФБР', team: 'enemy', hp: 80, lines: 'agent', weapon: 'beretta', noKill: true, look: { face: 'agent2', hair: 'brown', coat: [0.34, 0.3, 0.26], shirt: [0.75, 0.8, 0.9], tie: [0.45, 0.1, 0.1], pants: [0.3, 0.27, 0.23], shoes: [0.1, 0.07, 0.05], skin: 2 } },
    fbiguard: { name: 'Охрана ФБР', team: 'enemy', hp: 90, lines: 'agent', weapon: 'beretta', noKill: true, look: { face: 'guard', hat: 'police', hatColor: [0.1, 0.1, 0.12], coat: [0.14, 0.14, 0.16], shirt: [0.14, 0.14, 0.16], pants: [0.14, 0.14, 0.16], shoes: [0.05, 0.05, 0.05], skin: 1, vest: [0.1, 0.1, 0.1] } },
    jones: { name: 'Майор Джонс', team: 'ally', hp: 250, lines: 'soldier', weapon: 'm16', look: { face: 'jones', hair: 'short_dark', female: true, hat: 'beret', hatColor: [0.2, 0.3, 0.15], coat: [0.3, 0.34, 0.2], shirt: [0.3, 0.34, 0.2], pants: [0.28, 0.3, 0.18], shoes: [0.08, 0.06, 0.04], skin: 3 } },
    commando: { name: 'Спецназ заговора', team: 'enemy', hp: 110, lines: 'soldier', weapon: 'kalash', look: { face: 'mask', hat: 'balaclava', hatColor: [0.08, 0.08, 0.09], coat: [0.12, 0.12, 0.14], shirt: [0.12, 0.12, 0.14], pants: [0.12, 0.12, 0.14], shoes: [0.04, 0.04, 0.04], skin: 0, vest: [0.2, 0.2, 0.18] } },
    docker: { name: 'Бандит', team: 'enemy', hp: 95, lines: 'thug', weapon: 'shotgun', look: { face: 'docker', hat: 'beanie', hatColor: [0.45, 0.12, 0.1], coat: [0.2, 0.3, 0.45], shirt: [0.5, 0.4, 0.3], pants: [0.2, 0.2, 0.25], shoes: [0.15, 0.1, 0.05], skin: 2 } },
    soldier: { name: 'Солдат', team: 'enemy', hp: 110, lines: 'soldier', weapon: 'm16', look: { face: 'soldier', hat: 'helmet', hatColor: [0.3, 0.32, 0.3], coat: [0.82, 0.84, 0.86], shirt: [0.82, 0.84, 0.86], pants: [0.7, 0.72, 0.74], shoes: [0.3, 0.24, 0.18], skin: 0, vest: [0.1, 0.1, 0.1], camo: 'snow' } },
    officer: { name: 'Офицер', team: 'enemy', hp: 100, lines: 'soldier', weapon: 'beretta', look: { face: 'officer', hat: 'officer', hatColor: [0.25, 0.3, 0.2], coat: [0.3, 0.34, 0.24], shirt: [0.3, 0.34, 0.24], pants: [0.26, 0.3, 0.2], shoes: [0.05, 0.05, 0.05], skin: 0 } },
    carrington: { name: 'Генерал Кэррингтон', team: 'ally', hp: 300, lines: 'soldier', weapon: null, look: { face: 'carrington', hair: 'white', coat: [0.3, 0.34, 0.2], shirt: [0.8, 0.78, 0.7], pants: [0.28, 0.3, 0.18], shoes: [0.05, 0.05, 0.05], skin: 0 } },
    merc: { name: 'Наёмник', team: 'enemy', hp: 105, lines: 'thug', weapon: 'shotgun', look: { face: 'merc', hat: 'cap', hatColor: [0.55, 0.35, 0.1], coat: [0.55, 0.14, 0.12], shirt: [0.4, 0.3, 0.2], pants: [0.3, 0.32, 0.22], shoes: [0.2, 0.12, 0.05], skin: 2, camo: 'plaid' } },
    merc2: { name: 'Наёмник', team: 'enemy', hp: 105, lines: 'thug', weapon: 'sniper', look: { face: 'merc2', hat: 'cap', hatColor: [0.2, 0.3, 0.15], coat: [0.35, 0.38, 0.22], shirt: [0.4, 0.3, 0.2], pants: [0.3, 0.32, 0.22], shoes: [0.2, 0.12, 0.05], skin: 0, camo: 'woods' } },
    guard: { name: 'Охранник тюрьмы', team: 'enemy', hp: 100, lines: 'guard', weapon: 'shotgun', look: { face: 'pguard', hat: 'police', hatColor: [0.18, 0.2, 0.26], coat: [0.36, 0.4, 0.48], shirt: [0.36, 0.4, 0.48], pants: [0.2, 0.22, 0.28], shoes: [0.05, 0.05, 0.05], skin: 1 } },
    prisoner: { name: 'Заключённый', team: 'prisoner', hp: 80, lines: 'thug', weapon: null, look: { face: 'prisoner', hair: 'shaved', coat: [0.92, 0.45, 0.12], shirt: [0.92, 0.45, 0.12], pants: [0.92, 0.45, 0.12], shoes: [0.9, 0.9, 0.9], skin: 2 } },
    irish: { name: 'Ирландец', team: 'enemy', hp: 900, lines: 'thug', weapon: 'm60', boss: true, look: { face: 'irish', hair: 'red', beard: true, coat: [0.2, 0.35, 0.18], shirt: [0.7, 0.66, 0.5], pants: [0.3, 0.26, 0.2], shoes: [0.1, 0.07, 0.05], skin: 0, big: 1.12 } },
    mongoose: { name: 'Мангуст', team: 'enemy', hp: 1400, lines: 'thug', weapon: 'magnum', boss: true, look: { face: 'mongoose', hair: 'bald', glasses: true, coat: [0.55, 0.52, 0.46], shirt: [0.2, 0.2, 0.22], pants: [0.5, 0.47, 0.42], shoes: [0.05, 0.05, 0.05], skin: 0, gloves: true, tall: 1.06 } },
    kim: { name: 'Ким', team: 'neutral', hp: 60, lines: 'civilian', look: { face: 'kim', hair: 'long_blond', female: true, coat: [0.9, 0.88, 0.82], shirt: [0.9, 0.88, 0.82], pants: [0.35, 0.45, 0.6], shoes: [0.3, 0.2, 0.1], skin: 0 } },
    oldman: { name: 'Старик Бен', team: 'neutral', hp: 60, lines: 'civilian', look: { face: 'oldman', hair: 'white', beard: true, coat: [0.5, 0.35, 0.2], shirt: [0.6, 0.2, 0.15], pants: [0.3, 0.3, 0.35], shoes: [0.2, 0.12, 0.05], skin: 0, camo: 'plaid' } },
    numberone: { name: 'Номер Один', team: 'neutral', hp: 60, lines: 'civilian', look: { face: 'shadow', hair: 'short', coat: [0.08, 0.08, 0.1], shirt: [0.8, 0.8, 0.8], tie: [0.4, 0.05, 0.05], pants: [0.08, 0.08, 0.1], shoes: [0.03, 0.03, 0.03], skin: 0 } }
  };

  X.SKILLS = {
    sense: { name: 'Шестое чувство', desc: 'Шаги врагов проступают сквозь стены: ТАП ТАП ТАП.' },
    marksman: { name: 'Меткий стрелок', desc: 'Разброс пистолетов и автоматов меньше на треть.' },
    silent: { name: 'Бесшумный шаг', desc: 'Шагом и вприсядку вас почти не слышно.' },
    hands: { name: 'Ловкие руки', desc: 'Отмычка и перезарядка на треть быстрее.' },
    cold: { name: 'Хладнокровие', desc: 'Прицел снайперской винтовки и арбалета не дрожит.' },
    tough: { name: 'Второе дыхание', desc: 'Здоровье само восстанавливается до 40.' },
    knives: { name: 'Нож в рукаве', desc: 'Ножи летят быстрее, в запасе до 15 ножей.' }
  };

  X.ITEMS = {
    medkit: { name: 'Аптечка', max: 4 },
    food: { name: 'Перекус', heal: 15 },
    vest: { name: 'Бронежилет', armor: 50 },
    helmet: { name: 'Каска' },
    lockpick: { name: 'Отмычка' },
    document: { name: 'Документ' },
    key: { name: 'Ключ' }
  };

  X.DIFFICULTY = [
    { id: 'easy', name: 'Лёгкий', dmg: 0.45, acc: 0.7, sight: 0.75, react: 1.4 },
    { id: 'normal', name: 'Нормальный', dmg: 0.8, acc: 1, sight: 1, react: 1 },
    { id: 'hard', name: 'Трудный', dmg: 1.15, acc: 1.2, sight: 1.25, react: 0.75 }
  ];

  X.WORDS = {
    beretta: ['BLAM', 'BANG'], silenced: ['pft'], magnum: ['KA-BLAM!', 'BLAM!'], shotgun: ['BOOM', 'KA-CHUNK'],
    m16: ['RATATAT'], kalash: ['TRATATA'], sniper: ['KRAK!'], crossbow: ['TWANG'], harpoon: ['THWIP'],
    m60: ['BRRRAT'], bazooka: ['FWOOSH'], explode: ['BOOM!', 'KABOOM!'], punch: ['WHAM!', 'POW!', 'SOCK!'],
    object: ['BONK!', 'KRASH!', 'CLONK!'], glass: ['KRASH'], pain: ['AARGH', 'ARRRR', 'UGH!', 'AAAH!'],
    ko: ['ZZZ'], steps: ['TAP', 'TAP TAP', 'TAP TAP TAP'], splash: ['SPLASH'], knife: ['THUNK'], door: ['CREAK'], alarm: ['WEEOO!']
  };

  X.LEVELS = [];
  X.addLevel = function (def) {
    const i = X.LEVELS.findIndex(l => l.id === def.id);
    if (i >= 0) X.LEVELS[i] = def; else X.LEVELS.push(def);
    X.LEVELS.sort((a, b) => a.n - b.n);
  };
  X.level = id => X.LEVELS.find(l => l.id === id) || null;
})(globalThis.XIII = globalThis.XIII || {});
