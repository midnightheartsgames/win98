(function (H) {
  'use strict';
  const T = H.TUNING, AV = T.avBase;
  const { sv, atkOf, spdOf, alive } = H.battleStat;

  const SUITS = [
    { id: 'bamboo', name: 'Бамбук', col: '#5ad08a' },
    { id: 'circle', name: 'Круги', col: '#5aa8ff' },
    { id: 'sign', name: 'Знаки', col: '#ff6a6a' }
  ];
  const OWN = ['basic', 'skill', 'ult', 'enhanced'];
  const SURVIVAL = 'Реакция выживания';
  const BURDEN = 'Ноша';
  const KISS = 'Огненный поцелуй';
  const BOW = 'Ревущая тетива';
  const KESTREL = 'Ныряющий ястреб';
  const BENE = 'Благословение';
  const KONG = 'Закрытый конг';

  const KITS = {
    lynx: {
      name: 'Рысь', fullName: 'Рысь Ландау', path: 'abundance', elem: 'quant', rarity: 4, energy: 100,
      base: { hp: 144, atk: 67, def: 75, spd: 100 },
      look: { skin: '#f8e2d6', hair: '#e2b56e', hairHi: '#f4d494', eye: '#3aa8e0', eye2: '#a8e4f8', bangs: 'wisp', sides: 'jaw', back: 'short', crown: 'smooth', gloss: true, ahoge: true, body: 'petite', coat: 'parka', coatLen: 3, coatFlare: 3, top: '#ecebef', lining: '#c8c6cc', trim: '#f8f8fa', inner: '#2a48b8', collar: 'high', lower: '#3a2c28', low: 'skirt', skirtLen: 5, legs: '#2a5ad0', shoes: '#1e1e24', gloves: '#2a2426', acc: ['cathood:#f2f2f6', 'capelet:#2a94b0', 'scarf:#2a48b8', 'longgloves', 'crossbelt:#7a4ab8', 'vial:#2a5ad8', 'boots:#1e1e24', 'bootcuff:#f6f6f8', 'kneeplate:#1e1e24'] },
      basic: { name: 'Техника ледоруба', target: 'single', text: 'квантовый урон 50% макс. HP Рыси.', fx: [{ k: 'dmg', m: 0, hpM: 0.5 }] },
      skill: { name: 'Пора открывать консервы', target: 'ally', text: 'Реакция выживания на 2 хода: макс. HP +8% HP Рыси, Разрушение и Сохранение притягивают удары. Лечит 12%.', fx: [{ k: 'survival' }, { k: 'heal', m: 0.12, flat: 35, who: 'target' }, { k: 'lynxHot' }] },
      ult: { name: 'Первая помощь на снежных полях', target: 'allies', text: 'снимает по одному ослаблению со всех и лечит каждого на 14% HP Рыси.', fx: [{ k: 'cleanseAll' }, { k: 'heal', m: 0.14, flat: 40, who: 'allies' }, { k: 'lynxHot', all: true }] },
      talent: 'Навык и абс. техника лечат цели 3 хода. Под Реакцией выживания лечение сильнее.',
      tech: { name: 'Шоколадный энергетический батончик', text: 'Весь отряд начинает бой с периодическим лечением.', fx: 'lynxTech' },
      contact: [{ name: 'Молча спрятаться в капюшон', tag: 'silent' }, { name: 'Угостить консервами', tag: 'kind' }]
    },
    luka: {
      name: 'Лука', path: 'nihility', elem: 'phys', rarity: 4, energy: 130,
      base: { hp: 163, atk: 79, def: 66, spd: 103 },
      look: { skin: '#f6dcc8', hair: '#d4283a', hairHi: '#f25a5a', eye: '#4a72e0', eye2: '#9ab8ff', bangs: 'swoop', sides: 'jaw', back: 'short', crown: 'swept', gloss: true, ahoge: true, jaw: 'v', body: 'lean', sex: 'm', coat: 'openvest', top: '#a8203a', lining: '#e8742a', trim: '#e8742a', inner: '#d8d4cc', collar: 'bare', lower: '#5a3a2c', low: 'pants', shoes: '#1e1c22', gloves: '#1e1c22', tailsLining: '#e8742a', tailsTo: 'knee', tailsOne: 'r', acc: ['keychoker:#1e1c22', 'earring:#c8ccd4', 'lavatee:#26222a', 'mecharm:#3a3c46', 'armbandr:#1e1c22', 'tails:#a8203a', 'hipbelt:#a8203a', 'shinL:#9a1c30', 'legR:#1e1c22', 'boots:#1e1c22'] },
      basic: { name: 'Прямой удар', target: 'single', fx: [{ k: 'dmg', m: 1.0 }, { k: 'will', v: 1 }] },
      enhanced: { name: 'Раскалывающий небеса кулак', target: 'single', text: 'тратит 2 Воли: от 3 до 6 Прямых ударов по 20% и Восходящий апперкот 80%. Апперкот взрывает Кровотечение на 85%.', fx: [{ k: 'lukaFist' }] },
      skill: { name: 'Кровоточащий удар', target: 'single', text: 'урон 120%, снимает усиление, Кровотечение на 3 хода: 24% макс. HP цели, не больше 340% атаки.', fx: [{ k: 'dispel' }, { k: 'dmg', m: 1.2 }, { k: 'lukaBleed' }, { k: 'will', v: 1 }] },
      ult: { name: 'Решающий удар', target: 'single', text: '+2 Воли к битве. Получаемый целью урон +20% на 3 хода, затем урон 330%.', fx: [{ k: 'will', v: 2 }, { k: 'lukaMark' }, { k: 'dmg', m: 3.3 }] },
      talent: 'Базовая атака и навык дают Волю к битве (до 4). При 2 Волях базовая атака усиливается.',
      tech: { name: 'Предвкушение', text: 'Удар и Кровотечение по случайному врагу, +1 Воля к битве.', fx: 'lukaTech' },
      contact: [{ name: 'Встать в стойку', tag: 'threat' }, { name: 'Рассказать про ринг', tag: 'joke' }]
    },
    sushang: {
      name: 'Сушан', path: 'hunt', elem: 'phys', rarity: 4, energy: 120,
      base: { hp: 144, atk: 77, def: 57, spd: 107 },
      look: { skin: '#f9e2d6', hair: '#5a3424', hairHi: '#7e5038', eye: '#a8582a', eye2: '#c87a3a', bangs: 'blunt', sides: 'straight', back: 'twin', crown: 'smooth', gloss: true, body: 'f', coat: 'bodice', top: '#f4f2ee', trim: '#d8b050', inner: '#f4f2ee', neck: '#1e1a22', collar: 'bare', lower: '#f4f2ee', hem: '#e8e4dc', low: 'skirt', skirtLen: 6, shoes: '#1e1a22', band: '#1e1a22', cuff: '#f4f2ee', tailsLining: '#5a3a8a', tailsTo: 'calf', acc: ['tassel:#9a3aa0', 'braidrings:#e8b030', 'detsleeves:#e8a830', 'waistcorset:#1e1a22', 'frogknot:#8a2a8a', 'tails:#1e1a22', 'garter:#d8b050', 'boots:#1e1a22', 'bootcuff:#f4f2f4'] },
      basic: { name: 'Искусство рыцарского меча: Звёздный ореол', short: 'Звёздный ореол', target: 'single', fx: [{ k: 'dmg', m: 1.0 }] },
      skill: { name: 'Искусство рыцарского меча: Падение гор', short: 'Падение гор', target: 'single', text: 'урон 200%. Стойка меча: доп. удар 100% с шансом 33%, по пробитому врагу всегда.', fx: [{ k: 'dmg', m: 2.0 }, { k: 'swordStance' }] },
      ult: { name: 'Форма Тайсюй: Вестник рассвета', short: 'Вестник рассвета', target: 'single', text: 'урон 320%, Сушан сразу ходит снова. 2 хода: атака +30%, две доп. Стойки меча по 50%.', fx: [{ k: 'dmg', m: 3.2, tough: 30 }, { k: 'buff', s: 'atkP', v: 0.3, turns: 2, who: 'self', name: 'Вестник рассвета' }, { k: 'advance', v: 1, who: 'self' }] },
      talent: 'Пробитие любого врага: скорость +15% на 2 хода. Атака при пробитом враге продвигает её ход.',
      tech: { name: 'Искусство рыцарского меча: Рывок', text: 'Физический урон всем врагам в начале боя.', fx: 'sushangTech' },
      contact: [{ name: 'Предложить помощь', tag: 'kind' }, { name: 'Вызвать на поединок', tag: 'threat' }]
    },
    xueyi: {
      name: 'Сюэи', path: 'destruction', elem: 'quant', rarity: 4, energy: 120,
      base: { hp: 144, atk: 81, def: 54, spd: 103 },
      look: { skin: '#f8e4dc', hair: '#2a2026', hairHi: '#4a3a44', eye: '#b82a40', eye2: '#e0606e', bangs: 'sidepart', sides: 'shag', back: 'short', crown: 'smooth', gloss: true, streak: '#c8303a', streakShape: 'under', body: 'f', coat: 'openvest', top: '#1e4a6a', trim: '#d8b050', inner: '#f0eef2', neck: '#1c1a20', collar: 'bare', lower: '#1c1a22', low: 'shorts', legs: '#f2eef2', shoes: '#1e1c22', gloves: '#1e3a5a', tailsLining: '#4a0a14', tailsTo: 'ankle', acc: ['choker:#c8303a', 'detsleeves:#f0eef2', 'longgloves', 'goldcuff:#d8b050', 'charmpanel:#1e3458', 'onimask:#c8242c', 'tails:#7a1420', 'ankle:#1e1c22'] },
      basic: { name: 'Шило развеивания Мары', target: 'single', fx: [{ k: 'dmg', m: 1.0 }] },
      skill: { name: 'Подчинение зла', target: 'blast', text: 'квантовый урон 140% (соседним 70%).', fx: [{ k: 'dmg', m: 1.4, adj: 0.7 }] },
      ult: { name: 'Божественная кара', target: 'single', text: 'урон 250% по стойкости любой уязвимости. Чем больше снято стойкости, тем сильнее удар, до +60%.', fx: [{ k: 'castigation', m: 2.5, tough: 40 }] },
      talent: 'Снятая стойкость копит Карму (до 8), на 8 бьёт 3 раза по 90%. Урон + эффект пробития.',
      tech: { name: 'Немедленная казнь', text: 'Квантовый урон всем врагам в начале боя.', fx: 'xueyiTech' },
      contact: [{ name: 'Огласить приговор', tag: 'threat' }, { name: 'Застыть как кукла', tag: 'silent' }]
    },
    tingyun: {
      name: 'Тинъюнь', path: 'harmony', elem: 'elec', rarity: 4, energy: 130,
      base: { hp: 115, atk: 72, def: 54, spd: 112 },
      look: { skin: '#f9e2d6', hair: '#3a241e', hairHi: '#5a3a2e', tips: '#a8302a', tipsFade: true, eye: '#5aa84a', eye2: '#9ad87a', bangs: 'swoop', sides: 'flick', back: 'short', crown: 'smooth', gloss: true, body: 'f', coat: 'bodice', top: '#4a3428', trim: '#d8b050', inner: '#f4f2ee', neck: '#f2eee6', collar: 'bare', lower: '#f4f2ee', hem: '#4a3428', low: 'skirt', skirtLen: 6, shoes: '#c8a058', tailsLining: '#d84a3a', tailsTo: 'ankle', acc: ['foxears:#3a2a26', 'dropgem:#3ad8b0', 'puff:#f2eee6', 'waistcorset:#c8302a', 'tails:#b82a2a', 'bangle:#5ad8a0', 'socks:#f2eee6'] },
      basic: { name: 'Выдворение', target: 'single', text: 'электрический урон 140%.', fx: [{ k: 'dmg', m: 1.4 }] },
      skill: { name: 'Успокаивающая мелодия', target: 'ally', noSelf: true, text: 'Благословение на 3 хода: атака +50% (не больше 25% атаки Тинъюнь), атаки союзника бьют молнией на 44%.', fx: [{ k: 'benediction' }] },
      ult: { name: 'Ритуал счастливого знамения', target: 'ally', text: 'союзнику 50 энергии и урон +50% на 2 хода.', fx: [{ k: 'omen' }] },
      talent: 'Когда Тинъюнь бьёт врага, благословлённый союзник добивает его молнией на 66% атаки.',
      tech: { name: 'Нежный бриз', text: 'Тинъюнь начинает бой с 50 энергии.', fx: 'tingyunTech' },
      contact: [{ name: 'Сторговаться', tag: 'bribe' }, { name: 'Помахать веером', tag: 'cute' }]
    },
    hanya: {
      name: 'Ханья', path: 'harmony', elem: 'phys', rarity: 4, energy: 140,
      base: { hp: 125, atk: 77, def: 48, spd: 110 },
      look: { skin: '#f9e4dc', hair: '#a4b8c4', hairHi: '#d0dce4', tips: '#6a8aa0', tipsFade: true, eye: '#7a8a9a', eye2: '#b0c0cc', bangs: 'sweep', sides: 'long', back: 'shoulder', crown: 'smooth', gloss: true, body: 'f', coat: 'bodice', top: '#1e2440', trim: '#d8b050', inner: '#2a5a9a', neck: 'none', collar: 'bare', lower: '#4a3434', low: 'shorts', shoes: '#1e1c22', gloves: '#2a2224', bootsTo: 'calf', tailsLining: '#6a1018', tailsTo: 'ankle', acc: ['sweephorns:#1c1a24', 'dangleR:#c83040', 'jadecollar:#d8b050', 'knotbar:#2a5a9a', 'armorpad:#d8b050', 'longgloves', 'goldcuff:#d8b050', 'lotussash:#2a5a9a', 'sealpanel:#1e2440', 'hipswirl:#1c1a20', 'thightattoo:#1c1a20', 'brushpen:#d8b050', 'tails:#9a1c28', 'boots:#1e1c22', 'bootgem:#3a6aa0', 'tasselanklet:#d8b050'] },
      basic: { name: 'Кисть оракула', target: 'single', fx: [{ k: 'dmg', m: 1.0 }] },
      skill: { name: 'Оковы самсары', target: 'single', text: 'урон 240% и Ноша: каждые 2 атаки отряда по цели дают очко навыка (дважды).', fx: [{ k: 'dmg', m: 2.4 }, { k: 'burden' }] },
      ult: { name: 'Следование указам десяти владык', short: 'Указ десяти владык', target: 'ally', text: 'союзнику скорость +20% скорости Ханья и атака +60% на 2 хода.', fx: [{ k: 'edict' }] },
      talent: 'Атака по врагу с Ношей даёт союзнику урон +30% на 2 хода.',
      tech: { name: 'Правосудие преисподней', text: 'Ноша на случайного врага в начале боя.', fx: 'hanyaTech' },
      contact: [{ name: 'Записать в протокол', tag: 'science' }, { name: 'Зачитать указ', tag: 'threat' }]
    },
    qingque: {
      name: 'Цинцюэ', path: 'erudition', elem: 'quant', rarity: 4, energy: 140,
      base: { hp: 139, atk: 89, def: 60, spd: 98 },
      look: { skin: '#f9e2d6', hair: '#8a7c6e', hairHi: '#a89a8a', eye: '#4a983a', eye2: '#7ac858', bangs: 'sweep', sides: 'flick', back: 'tail', crown: 'smooth', gloss: true, body: 'petite', coat: 'bodice', top: '#2a8070', trim: '#d8b050', inner: '#2a8070', neck: '#1e1c22', collar: 'bare', lower: '#f0f0ee', hem: '#2a8070', low: 'skirt', skirtLen: 6, shoes: '#1e1c22', cuff: '#2a8a6a', acc: ['hairclip:#8ad8e8', 'bellsleeves:#1e1c22', 'peplum:#2a8070', 'frogknot:#c8303a', 'ankle:#1e1c22', 'anklecuff:#f2f2ee'] },
      basic: { name: 'Самостоятельная победа', target: 'single', text: 'сбрасывает кость самой бедной масти, квантовый урон 100%.', fx: [{ k: 'dmg', m: 1.0 }, { k: 'toss' }] },
      enhanced: { name: 'Вишенка на торте!', target: 'blast', text: 'урон 240% (соседним 100%), Закрытый конг кончается.', fx: [{ k: 'dmg', m: 2.4, adj: 1.0, tough: 20, adjTough: 10 }, { k: 'kongEnd' }] },
      skill: { name: 'Последняя кость', target: 'self', keepTurn: true, text: 'тянет 2 кости, урон +28% до конца хода (до 4 раз). Ход не кончается.', fx: [{ k: 'draw', v: 2 }] },
      ult: { name: 'Четыре закрытых Рыбы? Победа!', short: 'Четыре Рыбы? Победа!', target: 'all', text: 'квантовый урон 200% всем, рука из 4 костей одной масти: сразу Закрытый конг.', fx: [{ k: 'dmg', m: 2.0 }, { k: 'kong' }] },
      talent: 'В начале хода союзника тянет кость. 4 одной масти: Закрытый конг, атака +72%, удар сильнее.',
      tech: { name: 'Игра против себя', text: 'Цинцюэ начинает бой с двумя костями.', fx: 'qingqueTech' },
      contact: [{ name: 'Сыграть партию', tag: 'joke' }, { name: 'Зевнуть', tag: 'silent' }]
    },
    yukong: {
      name: 'Юйкун', path: 'harmony', elem: 'imag', rarity: 4, energy: 130,
      base: { hp: 125, atk: 81, def: 51, spd: 107 },
      look: { skin: '#f9e2d6', hair: '#1e4448', hairHi: '#2e6266', eye: '#8a6ad8', eye2: '#c0a8f4', bangs: 'swoop', sides: 'flick', back: 'tail', crown: 'smooth', gloss: true, body: 'tallf', coat: 'bodice', top: '#e2eaf6', trim: '#d8b050', inner: '#dce8f4', neck: '#3a2a22', collar: 'bare', lower: '#3a2a22', low: 'shorts', shoes: '#1e1c22', gloves: '#4a3426', tailsLining: '#1e2450', tailsTo: 'ankle', acc: ['foxears:#1e3a40', 'hairorn:#d8b050', 'furcollar:#f2f2f6', 'puff:#2a3270', 'leotard:#3a2a22', 'apronw:#dce8f4', 'longgloves', 'tails:#2a3270', 'ankle:#1e1c22'] },
      basic: { name: 'Стрелок', target: 'single', fx: [{ k: 'dmg', m: 1.0 }] },
      arrow: { name: 'Семь слоёв, одна стрела', target: 'single', text: 'мнимый урон 200%, двойной урон по стойкости. Раз в два хода.', fx: [{ k: 'dmg', m: 2.0, tough: 20 }] },
      skill: { name: 'Воодушевляющий залп', target: 'self', text: 'Ревущая тетива, 2 уровня: атака отряда +80%. Конец хода союзника снимает уровень.', fx: [{ k: 'bowstrings' }] },
      ult: { name: 'Ныряющий ястреб', target: 'single', text: 'урон 380%. Если тетива натянута, отряду крит. шанс +28% и крит. урон +65%.', fx: [{ k: 'kestrel' }, { k: 'dmg', m: 3.8, tough: 30 }] },
      talent: 'Раз в два хода базовая атака сильнее и вдвое бьёт по стойкости. Мнимый урон отряда +12%.',
      tech: { name: 'В погоне за ветром', text: 'Бой начинается с натянутой тетивой, 2 уровня.', fx: 'yukongTech' },
      contact: [{ name: 'Отдать приказ', tag: 'threat' }, { name: 'Вежливо поклониться', tag: 'kind' }]
    },
    guinaifen: {
      name: 'Гуйнайфэнь', path: 'nihility', elem: 'fire', rarity: 4, energy: 120,
      base: { hp: 120, atk: 79, def: 60, spd: 106 },
      look: { skin: '#f8e2d6', hair: '#e89a7a', hairHi: '#f8c4a8', eye: '#d89a2a', eye2: '#f4c860', bangs: 'sweep', sides: 'long', back: 'side', sideR: true, crown: 'smooth', gloss: true, body: 'f', coat: 'bodice', top: '#c8302e', trim: '#d8b050', inner: '#c8302e', neck: 'none', collar: 'bare', lower: '#f2eeea', low: 'skirt', skirtLen: 6, legs: '#3e3236', shoes: '#1e1c2a', gloves: '#4a3028', tailsLining: '#7a1420', tailsGold: '#d8b050', tailsTo: 'ankle', acc: ['choker:#d8b050', 'lotus:#d02a2a', 'dangle:#2a8a7a', 'cloudbust:#d8b050', 'waistcorset:#1e1a1e', 'petalcuff:#d8b050', 'ropecoil:#d0705e', 'hipbow:#c8302e', 'cloudhem:#d8b050', 'thighswirl:#d8b050', 'tails:#b82430', 'ankle:#1e1c2a', 'anklegold:#d8b050', 'glove1', 'glovecuff:#1c1a20'] },
      basic: { name: 'Стоячие овации', target: 'single', text: 'огненный урон 100%, с шансом 80% Горение на 2 хода.', fx: [{ k: 'dmg', m: 1.0 }, { k: 'dot', type: 'burn', m: T.guinaBurn, turns: 2, chance: 0.8 }] },
      skill: { name: 'Горящее приветствие', target: 'blast', text: 'урон 120% (соседним 40%) и Горение на 2 хода всем задетым.', fx: [{ k: 'dmg', m: 1.2, adj: 0.4 }, { k: 'dot', type: 'burn', m: T.guinaBurn, turns: 2, chance: 1 }] },
      ult: { name: 'Подходи, соберём народ!', target: 'all', text: 'огненный урон 120% всем, каждое Горение сразу наносит 92% урона.', fx: [{ k: 'dmg', m: 1.2 }, { k: 'burnBurst', v: T.burnBurst }] },
      talent: 'Урон от Горения даёт врагу Огненный поцелуй: урон по нему +7% (до 3 раз). По горящим +20%.',
      tech: { name: 'Представление акробатических умений', short: 'Акробатика', text: 'Четыре огненных удара по случайным врагам, каждый даёт Огненный поцелуй.', fx: 'guinaTech' },
      contact: [{ name: 'Показать фокус', tag: 'cute' }, { name: 'Попросить подписаться', tag: 'joke' }]
    }
  };

  const FUSIONS = {
    f_landau3: { name: 'Ландау в сборе', members: ['lynx', 'gepard', 'serval'], target: 'all', text: 'Молния Сервал по всем и Шок, щиты Гепарда отряду. Рысь даёт Гепарду Реакцию выживания и лечит всех.', fx: [{ k: 'dmg', m: 1.6, e: 'elec', tough: 15, statOf: 'serval' }, { k: 'dot', type: 'shock', m: 0.6, turns: 2, chance: 1, statOf: 'serval' }, { k: 'shield', m: 0.3, flat: 40, turns: 2, who: 'allies', statOf: 'gepard' }, { k: 'survivalTo', v: 'gepard', statOf: 'lynx' }, { k: 'heal', m: 0.1, flat: 30, who: 'allies', statOf: 'lynx' }] },
    f_ring: { name: 'Урок бокса', members: ['luka', 'hook'], target: 'single', text: 'Серия Луки и огонь Хук: Кровотечение и Горение, затем оба срабатывают.', fx: [{ k: 'dmg', m: 2.0, e: 'phys', tough: 30, statOf: 'luka' }, { k: 'lukaBleed', statOf: 'luka' }, { k: 'dmg', m: 1.5, e: 'fire', tough: 15, statOf: 'hook' }, { k: 'dot', type: 'burn', m: 0.5, turns: 2, chance: 1, statOf: 'hook' }, { k: 'detonate', v: 'ult', main: true, statOf: 'luka' }] },
    f_alley: { name: 'Под аплодисменты', members: ['sushang', 'guinaifen'], target: 'all', text: 'Огонь и Горение всем, Огненный поцелуй. Сушан бьёт Стойкой меча каждого горящего.', fx: [{ k: 'dmg', m: 1.4, e: 'fire', tough: 15, statOf: 'guinaifen' }, { k: 'dot', type: 'burn', m: 0.9, turns: 2, chance: 1, statOf: 'guinaifen' }, { k: 'kissAll' }, { k: 'stanceAll', statOf: 'sushang' }] },
    f_judges: { name: 'Сёстры-судьи', members: ['hanya', 'xueyi'], target: 'single', text: 'Ханья кладёт Ношу, Сюэи бьёт по любой стойкости. Карма сразу полна.', fx: [{ k: 'burden', statOf: 'hanya' }, { k: 'dmg', m: 2.4, e: 'quant', tough: 40, anyTough: true, statOf: 'xueyi' }, { k: 'dmg', m: 1.2, e: 'phys', tough: 15, statOf: 'hanya' }, { k: 'karmaFull' }] },
    f_helm: { name: 'Небесный флот', members: ['yukong', 'tingyun'], target: 'single', text: 'Стрела и молния по цели. Тетива натянута, отряду +20 энергии, самый сильный союзник получает Благословение.', fx: [{ k: 'dmg', m: 2.4, e: 'imag', tough: 30, statOf: 'yukong' }, { k: 'dmg', m: 1.2, e: 'elec', tough: 15, statOf: 'tingyun' }, { k: 'bowstrings', statOf: 'yukong' }, { k: 'energy', v: 20 }, { k: 'beneBest', statOf: 'tingyun' }] },
    f_table: { name: 'Ставка на представление', members: ['qingque', 'guinaifen'], target: 'all', text: 'Квант и огонь по всем, Горение. Цинцюэ сразу в Закрытом конге.', fx: [{ k: 'dmg', m: 1.5, e: 'quant', tough: 15, statOf: 'qingque' }, { k: 'dmg', m: 1.0, e: 'fire', tough: 15, statOf: 'guinaifen' }, { k: 'dot', type: 'burn', m: 0.9, turns: 2, chance: 1, statOf: 'guinaifen' }, { k: 'kong' }] }
  };

  const FX = ['survival', 'survivalTo', 'lynxHot', 'will', 'lukaFist', 'lukaBleed', 'lukaMark', 'swordStance', 'stanceAll', 'castigation', 'karmaFull', 'benediction', 'beneBest', 'omen', 'burden', 'edict', 'toss', 'draw', 'kong', 'kongEnd', 'bowstrings', 'kestrel', 'burnBurst', 'kissAll'];

  const ally = (b, id) => b.allies.find(a => a.charId === id && alive(a)) || null;
  const lowest = list => list.reduce((a, b) => (b.hp / b.maxHp < a.hp / a.maxHp ? b : a));

  Object.assign(H.Battle.prototype, {
    foursStart() {
      for (const a of this.allies) {
        if (a.charId === 'luka') a.flags.will = 1;
        if (a.charId === 'xueyi') {
          a.flags.karma = 0; a.flags.karmaF = 0;
          a.base.breakE = (a.base.breakE || 0) + T.xueyiBreakE;
          const v = Math.min(T.xueyiBreakCap, a.base.breakE);
          if (v > 0) a.buffs.push({ s: 'dmgP', v, turns: 999, name: 'Предзнаменующий замысел', perm: true });
        }
        if (a.charId === 'qingque') { a.flags.tiles = []; a.flags.tileStack = 0; }
        if (a.charId === 'yukong') { a.flags.bow = 0; a.flags.arrowCd = 0; for (const b of this.allies) b.buffs.push({ s: 'imagP', v: 0.12, turns: 999, name: 'Лук наследия', perm: true }); }
        if (a.charId === 'guinaifen' && alive(a)) this.advance(a, 0.25);
      }
    },

    foursTech(fx, src) {
      switch (fx) {
        case 'lynxTech': for (const a of this.livingAllies) this.lynxHot(src, a); return true;
        case 'lukaTech': {
          const t = this.rng.pick(this.living);
          if (t) { this.hit(src, t, 0.5, { e: 'phys', tough: 10 }); if (alive(t)) this.lukaBleed(src, t); }
          this.gainWill(src, 1);
          return true;
        }
        case 'sushangTech': for (const e of this.living.slice()) this.hit(src, e, 0.8, { e: 'phys', tough: 10 }); return true;
        case 'xueyiTech': for (const e of this.living.slice()) this.hit(src, e, 0.8, { e: 'quant', tough: 10 }); return true;
        case 'tingyunTech':
          src.energy = Math.min(src.maxEnergy, src.energy + 50);
          this.push({ t: 'status', u: src, text: 'Энергия +50', col: '#ffe080' });
          return true;
        case 'hanyaTech': { const t = this.rng.pick(this.living); if (t) this.burden(src, t); return true; }
        case 'qingqueTech': this.drawTiles(src, 2); return true;
        case 'yukongTech': this.bowstrings(src, false); return true;
        case 'guinaTech':
          for (let i = 0; i < 4; i++) {
            const t = this.rng.pick(this.living);
            if (!t) break;
            this.hit(src, t, 0.5, { e: 'fire', tough: 5 });
            if (alive(t)) this.firekiss(src, t, true);
          }
          return true;
      }
      return false;
    },

    foursFx(f, actor, src, R, hitSet, kind) {
      switch (f.k) {
        case 'survival': if (R.ally) this.survival(src, R.ally); return true;
        case 'survivalTo': { const a = ally(this, f.v); if (a) this.survival(src, a); return true; }
        case 'lynxHot':
          for (const a of f.all ? this.livingAllies : [R.ally || actor]) this.lynxHot(src, a);
          return true;
        case 'will': this.gainWill(actor, f.v); return true;
        case 'lukaFist': this.lukaFist(actor, R.main, hitSet); return true;
        case 'lukaBleed': if (R.main && alive(R.main)) this.lukaBleed(src, R.main); return true;
        case 'lukaMark':
          if (R.main && alive(R.main)) {
            if (this.rng.chance(this.effectChance(src, R.main, 1))) this.addBuff(R.main, { s: 'vuln', v: 0.2, turns: 3, name: 'Решающий удар', debuff: true });
            else this.resisted(src);
          }
          return true;
        case 'swordStance': if (R.main) this.swordStance(src, R.main, hitSet); return true;
        case 'stanceAll':
          for (const t of this.living.slice()) if (t.dots.some(d => d.type === 'burn')) { this.stanceHit(src, t, 1); hitSet.add(t); }
          return true;
        case 'castigation': if (R.main) this.castigation(src, R.main, f, hitSet); return true;
        case 'karmaFull': { const x = ally(this, 'xueyi'); if (x) this.gainKarma(x, T.karmaMax); return true; }
        case 'benediction': if (R.ally) this.benediction(src, R.ally); return true;
        case 'beneBest': {
          const pool = this.livingAllies.filter(a => a !== src);
          if (pool.length) this.benediction(src, pool.reduce((a, b) => (atkOf(b) > atkOf(a) ? b : a)));
          return true;
        }
        case 'omen': this.omen(src, R.ally === actor ? this.livingAllies.filter(a => a !== actor).sort((a, b) => a.energy / a.maxEnergy - b.energy / b.maxEnergy)[0] || actor : R.ally || actor); return true;
        case 'burden': { const t = R.main || this.living[0]; if (t && alive(t)) this.burden(src, t); return true; }
        case 'edict': {
          const a = R.ally || actor;
          this.addBuff(a, { s: 'spd', v: Math.round(spdOf(src) * 0.2), turns: 2, name: 'Указ' });
          this.addBuff(a, { s: 'atkP', v: 0.6, turns: 2, name: 'Указ: атака' }, true);
          return true;
        }
        case 'toss': this.tossTile(actor); return true;
        case 'draw': {
          this.drawTiles(actor, f.v);
          actor.flags.tileStack = Math.min(T.tileStacks, (actor.flags.tileStack || 0) + 1);
          this.push({ t: 'status', u: actor, text: 'Урон +' + Math.round(T.tileDmg * 100 * actor.flags.tileStack) + '%', col: '#ffe080' });
          if (!actor.flags.tileRefund) { actor.flags.tileRefund = true; const sp = this.sp; this.sp = Math.min(T.spMax, this.sp + 1); if (this.sp > sp) this.push({ t: 'status', u: actor, text: 'Очко навыка +1', col: '#ffe080' }); }
          return true;
        }
        case 'kong': {
          const q = actor.charId === 'qingque' ? actor : ally(this, 'qingque');
          if (q) { const s = this.rng.int(3); q.flags.tiles = [s, s, s, s]; this.push({ t: 'tiles', u: q, tiles: q.flags.tiles.slice() }); this.enterKong(q); }
          return true;
        }
        case 'kongEnd': this.leaveKong(actor); return true;
        case 'bowstrings': { const y = actor.charId === 'yukong' ? actor : ally(this, 'yukong'); if (y) this.bowstrings(y, this.current === y); return true; }
        case 'kestrel':
          if ((actor.flags.bow || 0) > 0) {
            for (const a of this.livingAllies) {
              this.addBuff(a, { s: 'critR', v: T.bowCritR, turns: 999, name: KESTREL }, a !== actor);
              this.addBuff(a, { s: 'critD', v: T.bowCritD, turns: 999, name: KESTREL + ': крит. урон' }, true);
            }
          }
          return true;
        case 'burnBurst':
          for (const t of [...hitSet]) {
            if (!alive(t) || t.side !== 'enemy') continue;
            const d = t.dots.find(x => x.type === 'burn');
            if (!d) continue;
            this.hit(d.src || src, t, 0, { fixed: d.dmg * (d.stacks || 1) * f.v, e: 'fire', isDot: true, dot: true, label: 'Горение: представление' });
            if (alive(t)) this.foursBurn(t);
          }
          return true;
        case 'kissAll': { const g = ally(this, 'guinaifen'); if (g) for (const t of this.living) this.firekiss(g, t, true); return true; }
      }
      return false;
    },

    foursPreview(f, src, actor, R, addHit, k) {
      if (f.k === 'lukaFist' && R.main) {
        addHit(src, R.main, T.lukaJab * 4.5, { kind: k, tough: 15 });
        addHit(src, R.main, T.lukaUpper, { kind: k, tough: 5 });
      }
      if ((f.k === 'castigation') && R.main) addHit(src, R.main, f.m, { kind: k, tough: f.tough, anyTough: true });
    },

    foursAbility(u, kind) {
      if (kind !== 'basic') return null;
      if (u.charId === 'luka' && (u.flags.will || 0) >= 2) return { ab: u.kit.enhanced, kind: 'enhanced' };
      if (u.charId === 'qingque' && u.flags.kong) return { ab: u.kit.enhanced, kind: 'enhanced' };
      if (u.charId === 'yukong' && !(u.flags.arrowCd > 0)) return { ab: u.kit.arrow, kind: 'basic' };
      return null;
    },

    foursLocked(u) { return !!u && u.charId === 'qingque' && !!u.flags.kong; },

    foursTurn(u) {
      const q = ally(this, 'qingque');
      if (q) this.drawTiles(q, 1);
      if (u.charId === 'qingque' && !u.flags.kong && this.kongHand(u)) this.enterKong(u);
      if (u.charId === 'tingyun') this.gainEnergy(u, 5);
      if (u.charId === 'yukong' && u.flags.arrowCd > 0) u.flags.arrowCd--;
    },

    foursEnd(u) {
      if (u.side !== 'ally') return;
      for (const b of u.buffs) if (b.turns <= 0 && b.hpAdd) this.dropHp(u, b);
      if (u.charId === 'qingque') u.flags.tileStack = 0;
      const y = ally(this, 'yukong');
      if (y && y.flags.bow > 0) {
        if (u === y && y.flags.bowSkip) y.flags.bowSkip = false;
        else this.setBow(y, y.flags.bow - 1);
      }
    },

    foursHurt(u) {
      if (!u || u.side !== 'ally' || !u.buffs.some(b => b.name === SURVIVAL)) return;
      const lx = ally(this, 'lynx');
      if (lx) this.gainEnergy(lx, 2);
    },

    foursTough(src, tgt, amt, o) {
      if (!src || src.side !== 'ally' || amt <= 0 || o.karma) return;
      const x = ally(this, 'xueyi');
      if (!x) return;
      if (src === x) {
        x.flags.karmaF = (x.flags.karmaF || 0) + amt;
        const n = Math.floor(x.flags.karmaF / 10);
        x.flags.karmaF -= n * 10;
        if (n > 0) this.gainKarma(x, n);
      } else if (x.flags.karmaAct !== this.actSerial) {
        x.flags.karmaAct = this.actSerial;
        this.gainKarma(x, 1);
      }
    },

    foursBreak(src, tgt) {
      const s = ally(this, 'sushang');
      if (s) this.addBuff(s, { s: 'spdP', v: T.sushangSpd, turns: 2, name: 'Плавный клинок' });
    },

    foursBurn(t) {
      const g = ally(this, 'guinaifen');
      if (g && alive(t)) this.firekiss(g, t, false);
    },

    foursDmg(src, tgt, o) {
      let v = 0;
      if (src.charId === 'qingque') v += T.tileDmg * (src.flags.tileStack || 0);
      if (src.charId === 'guinaifen' && tgt.dots.some(d => d.type === 'burn')) v += 0.2;
      if (src.side === 'ally' && tgt.side === 'enemy' && this.burdened(tgt) && OWN.includes(o.kind) && !src.buffs.some(b => b.name === 'Наказание')) v += T.sanctionDmg;
      return v;
    },

    foursAfter(u, kind, hits) {
      const own = OWN.includes(kind);
      if (own && hits.length) {
        const bt = hits.find(t => this.burdened(t));
        if (bt) this.burdenCount(u, bt);
      }
      const ty = ally(this, 'tingyun'), bene = ty && ty.flags.bene;
      if (own && hits.length && bene && bene === u && alive(u) && u.buffs.some(b => b.name === BENE)) {
        const t = this.rng.pick(hits.filter(alive));
        if (t) this.hit(u, t, T.beneHit, { e: 'elec', label: BENE });
      }
      if (u.charId === 'tingyun' && own && hits.length && bene && alive(bene) && bene.buffs.some(b => b.name === BENE)) {
        const t = hits.find(alive);
        if (t) this.hit(bene, t, T.tingyunHit, { e: 'elec', label: 'Небесное сияние' });
      }
      if (u.charId === 'sushang' && (kind === 'basic' || kind === 'skill') && this.living.some(e => e.broken)) u.flags.advanceAfter = (u.flags.advanceAfter || 0) + T.sushangAdvance;
      if (u.charId === 'yukong' && kind === 'basic' && !(u.flags.arrowCd > 0)) u.flags.arrowCd = 2;
      const y = ally(this, 'yukong');
      if (y && y.flags.bow > 0 && kind !== 'fusion') this.gainEnergy(y, 2);
    },

    foursFollow() {
      const x = this.karmaReady;
      if (!x || this.over) return false;
      this.karmaReady = null;
      if (!alive(x) || !this.living.length) return false;
      this.setKarma(x, 0);
      const prev = this.acting;
      this.acting = x;
      this.push({ t: 'act', u: x, name: 'Кармическое искупление', kind: 'follow' });
      const hits = [];
      for (let i = 0; i < 3; i++) {
        const t = this.rng.pick(this.living);
        if (!t) break;
        this.hit(x, t, T.karmaHit, { e: 'quant', tough: 5, kind: 'follow', karma: true, label: 'Карма' });
        hits.push(t);
      }
      this.gainEnergy(x, 6);
      if (this.su) this.bless('follow', { u: x, hits });
      this.acting = prev;
      this.cleanup();
      return true;
    },

    foursClear() {
      for (const a of this.allies) for (const b of a.buffs) if (b.hpAdd) this.dropHp(a, b);
    },

    foursHoldUlt(u) {
      if (u.charId === 'yukong') return !(u.flags.bow > 0);
      if (u.charId === 'tingyun' || u.charId === 'hanya') return this.livingAllies.length < 2;
      return false;
    },

    foursUltAlly(u) {
      const others = this.livingAllies.filter(a => a !== u);
      if (!others.length) return u;
      if (u.charId === 'tingyun') return others.sort((a, b) => a.energy / a.maxEnergy - b.energy / b.maxEnergy || atkOf(b) - atkOf(a))[0];
      if (u.charId === 'hanya') return others.reduce((a, b) => (atkOf(b) > atkOf(a) ? b : a));
      return u;
    },

    foursAuto(u) {
      const tgt = this.autoTarget(u);
      switch (u.charId) {
        case 'lynx': {
          const low = lowest(this.livingAllies);
          const bare = this.livingAllies.filter(a => a !== u && !a.buffs.some(b => b.name === SURVIVAL));
          const tank = bare.find(a => a.path === 'preservation') || bare.find(a => a.path === 'destruction' && a.hp > a.maxHp * 0.7);
          if (this.sp >= 1 && low.hp < low.maxHp * 0.5) return this.act('skill', low);
          if (this.sp >= 4 && tank) return this.act('skill', tank);
          return this.act('basic', tgt);
        }
        case 'luka': {
          if ((u.flags.will || 0) >= 2) return this.act('basic', tgt);
          const raw = this.living.filter(e => !e.dots.some(d => d.type === 'bleed')).sort((a, b) => b.hp - a.hp)[0];
          if (raw && this.sp >= 1) return this.act('skill', raw);
          return this.act('basic', tgt);
        }
        case 'tingyun': {
          const best = this.livingAllies.filter(a => a !== u).sort((a, b) => atkOf(b) - atkOf(a))[0];
          if (best && this.sp >= 1 && !best.buffs.some(b => b.name === BENE && b.turns > 1)) return this.act('skill', best);
          return this.act('basic', tgt);
        }
        case 'hanya': {
          const big = this.living.reduce((a, b) => (b.hp > a.hp ? b : a));
          if (this.sp >= 1 && !this.living.some(e => this.burdened(e))) return this.act('skill', big);
          const bt = this.living.find(e => this.burdened(e));
          return this.act('basic', bt || tgt);
        }
        case 'qingque': {
          if (u.flags.kong) return this.act('basic', this.living.reduce((a, b) => (this.adjacent(this.living, b).length > this.adjacent(this.living, a).length ? b : a)));
          const h = u.flags.tiles || [], top = Math.max(0, ...[0, 1, 2].map(k => h.filter(x => x === k).length)), st = u.flags.tileStack || 0;
          if (st < T.tileStacks && (this.sp >= 2 || (this.sp >= 1 && top >= 3))) return this.act('skill', u);
          return this.act('basic', tgt);
        }
        case 'yukong':
          if (!(u.flags.bow > 0) && this.sp >= 1) return this.act('skill', u);
          return this.act('basic', tgt);
        case 'guinaifen': {
          const cold = this.living.filter(e => !e.dots.some(d => d.type === 'burn'));
          if (cold.length && this.sp >= 1) return this.act('skill', cold.reduce((a, b) => (this.adjacent(this.living, b).filter(x => !x.dots.some(d => d.type === 'burn')).length > this.adjacent(this.living, a).filter(x => !x.dots.some(d => d.type === 'burn')).length ? b : a)));
          return this.act('basic', tgt);
        }
      }
      return null;
    },

    survival(src, a) {
      if (!alive(a)) return;
      const old = a.buffs.find(b => b.name === SURVIVAL);
      if (old) { this.dropHp(a, old); a.buffs = a.buffs.filter(b => b !== old && b.name !== SURVIVAL + ': агро'); }
      const add = Math.round(src.maxHp * T.survivalHp + T.survivalFlat * H.grow(src.lvl));
      a.maxHp += add;
      a.hp += add;
      this.addBuff(a, { s: 'survival', v: 0, turns: 2, name: SURVIVAL, hpAdd: add });
      if (a.path === 'destruction' || a.path === 'preservation') this.addBuff(a, { s: 'aggro', v: T.survivalAggro, turns: 2, name: SURVIVAL + ': агро' }, true);
      this.push({ t: 'heal', u: a, v: add, hp: a.hp });
    },

    dropHp(u, b) {
      if (!b.hpAdd) return;
      u.maxHp = Math.max(1, u.maxHp - b.hpAdd);
      b.hpAdd = 0;
      if (u.hp > u.maxHp) u.hp = u.maxHp;
      this.push({ t: 'heal', u, v: 0, hp: u.hp });
    },

    lynxHot(src, a) {
      if (!alive(a)) return;
      const surv = a.buffs.some(b => b.name === SURVIVAL);
      const v = Math.round(src.maxHp * (T.lynxHot + (surv ? T.lynxHotSurv : 0)) + T.lynxHotFlat * H.grow(src.lvl));
      this.addBuff(a, { s: 'hotMark', v: 0, turns: T.lynxHotTurns, name: 'Опыт выживания', hot: v, src }, true);
    },

    gainWill(u, n) {
      if (!u || u.charId !== 'luka' || !alive(u)) return;
      const before = u.flags.will || 0;
      u.flags.will = Math.min(T.willMax, before + n);
      const got = u.flags.will - before;
      if (got > 0) this.gainEnergy(u, 3 * got);
      if (u.flags.will !== before) this.push({ t: 'stack', u, key: 'Will', v: u.flags.will, text: got > 0 ? 'Воля +' + got : null, col: '#ff8a6a' });
    },

    lukaBleed(src, t) {
      if (!alive(t)) return;
      if (!this.rng.chance(this.effectChance(src, t, 1))) { this.resisted(src); return; }
      const dmg = Math.min(t.maxHp * T.lukaBleed * (t.data && (t.data.boss || t.data.elite) ? 0.4 : 1), atkOf(src) * T.lukaBleedCap);
      this.addDot(src, t, 'bleed', dmg, 3);
    },

    lukaFist(u, t, hitSet) {
      if (!t || !alive(t)) return;
      u.flags.will = Math.max(0, (u.flags.will || 0) - 2);
      this.push({ t: 'stack', u, key: 'Will', v: u.flags.will });
      const n = 3 + this.rng.int(4);
      let jabs = 0;
      for (let i = 0; i < n && alive(t); i++) {
        this.hit(u, t, T.lukaJab, { kind: 'enhanced', tough: 3, label: 'Прямой удар' });
        jabs++;
        if (alive(t) && this.rng.chance(0.5)) { this.hit(u, t, T.lukaJab, { kind: 'enhanced', label: 'Прямой удар' }); jabs++; }
      }
      hitSet.add(t);
      if (!alive(t)) return;
      this.push({ t: 'status', u: t, text: 'Ударов: ' + jabs, col: '#ffb0a0' });
      this.hit(u, t, T.lukaUpper, { kind: 'enhanced', tough: 8, label: 'Восходящий апперкот' });
      const d = alive(t) && t.dots.find(x => x.type === 'bleed');
      if (d) this.hit(d.src || u, t, 0, { fixed: d.dmg * (d.stacks || 1) * T.lukaDet, e: 'phys', isDot: true, dot: true, label: 'Кровотечение: апперкот' });
    },

    swordStance(src, t, hitSet) {
      if (!alive(t)) return;
      const sure = t.broken, dawn = src.buffs.some(b => b.name === 'Вестник рассвета');
      if (sure || this.rng.chance(T.stanceChance)) this.stanceHit(src, t, 1);
      if (dawn) for (let i = 0; i < 2; i++) if (alive(t) && (sure || this.rng.chance(T.stanceChance))) this.stanceHit(src, t, 0.5);
      hitSet.add(t);
    },

    stanceHit(src, t, k) {
      if (!alive(t)) return;
      this.hit(src, t, T.stanceDmg * k, { e: 'phys', label: 'Стойка меча' });
    },

    castigation(src, t, f, hitSet) {
      if (!alive(t)) return;
      const cut = t.broken ? 0 : Math.min(t.tough, f.tough * (1 + sv(src, 'breakEff')) * (1 + sv(t, 'toughIn')));
      this.hit(src, t, f.m, { kind: 'ult', tough: f.tough, anyTough: true, e: 'quant', extraBonus: T.xueyiUltBonus * Math.min(1, cut / 40) });
      hitSet.add(t);
    },

    gainKarma(x, n) {
      if (!alive(x)) return;
      this.setKarma(x, Math.min(T.karmaMax, (x.flags.karma || 0) + n));
      if (x.flags.karma >= T.karmaMax) this.karmaReady = x;
    },

    setKarma(x, v) {
      const before = x.flags.karma || 0;
      x.flags.karma = v;
      if (v !== before) this.push({ t: 'stack', u: x, key: 'Karma', v, text: v > before && v >= T.karmaMax ? 'Карма!' : null, col: '#c8a0ff' });
    },

    benediction(src, a) {
      if (!alive(a)) return;
      const prev = src.flags.bene;
      if (prev && prev !== a) prev.buffs = prev.buffs.filter(b => b.name !== BENE);
      src.flags.bene = a;
      const v = Math.min(T.beneAtk, T.beneCap * atkOf(src) / Math.max(1, a.base.atk));
      this.addBuff(a, { s: 'atkP', v, turns: 3, name: BENE });
    },

    omen(src, a) {
      if (!alive(a)) return;
      a.energy = Math.min(a.maxEnergy, a.energy + T.tingyunUltEnergy);
      this.push({ t: 'status', u: a, text: 'Энергия +' + T.tingyunUltEnergy, col: '#ffe080' });
      this.addBuff(a, { s: 'dmgP', v: 0.5, turns: 2, name: 'Счастливое знамение' });
    },

    burdened(t) { return !!t && t.side === 'enemy' && t.buffs.some(b => b.name === BURDEN); },

    burden(src, t) {
      for (const e of this.enemies) if (e !== t && this.burdened(e)) e.buffs = e.buffs.filter(b => b.name !== BURDEN);
      t.flags.burdenN = 0;
      t.flags.burdenTrig = 0;
      t.flags.burdenBy = src;
      this.addBuff(t, { s: 'burden', v: 0, turns: 99, name: BURDEN, debuff: true });
    },

    burdenCount(u, t) {
      this.addBuff(u, { s: 'dmgP', v: T.sanctionDmg, turns: 2, name: 'Наказание' }, true);
      t.flags.burdenN = (t.flags.burdenN || 0) + 1;
      if (t.flags.burdenN < T.burdenHits) return;
      t.flags.burdenN = 0;
      t.flags.burdenTrig = (t.flags.burdenTrig || 0) + 1;
      const sp = this.sp;
      this.sp = Math.min(T.spMax, this.sp + 1);
      this.push({ t: 'status', u: t, text: this.sp > sp ? 'Ноша: очко навыка +1' : 'Ноша', col: '#ffe080' });
      if (alive(u)) this.addBuff(u, { s: 'atkP', v: 0.1, turns: 1, name: 'Ведение протокола' }, true);
      const h = ally(this, 'hanya');
      if (h) this.gainEnergy(h, 2);
      if (t.flags.burdenTrig >= T.burdenTrig) { t.buffs = t.buffs.filter(b => b.name !== BURDEN); this.push({ t: 'status', u: t, text: 'Ноша снята' }); }
    },

    kongHand(u) { const h = u.flags.tiles || []; return h.length >= T.tilesMax && h.every(x => x === h[0]); },

    drawTiles(u, n) {
      if (!u || u.charId !== 'qingque' || !alive(u)) return;
      const h = u.flags.tiles || (u.flags.tiles = []);
      for (let i = 0; i < n; i++) {
        const s = this.rng.int(SUITS.length);
        if (h.length >= T.tilesMax) {
          const cnt = SUITS.map((_, k) => h.filter(x => x === k).length);
          const top = cnt.indexOf(Math.max(...cnt));
          const pool = cnt.map((c, k) => k).filter(k => cnt[k] > 0 && k !== top);
          const drop = pool.length ? pool.reduce((a, b) => (cnt[b] < cnt[a] ? b : a)) : top;
          h.splice(h.indexOf(drop), 1);
        }
        h.push(s);
      }
      h.sort((a, b) => a - b);
      this.push({ t: 'tiles', u, tiles: h.slice() });
      if (this.current === u && this.acting === u && !u.flags.kong && this.kongHand(u)) this.enterKong(u);
    },

    tossTile(u) {
      const h = u.flags.tiles || [];
      if (!h.length) return;
      const cnt = SUITS.map((_, k) => h.filter(x => x === k).length);
      const pool = cnt.map((c, k) => k).filter(k => cnt[k] > 0);
      const drop = pool.reduce((a, b) => (cnt[b] < cnt[a] ? b : a));
      h.splice(h.indexOf(drop), 1);
      this.push({ t: 'tiles', u, tiles: h.slice() });
    },

    enterKong(u) {
      if (!alive(u) || u.flags.kong) return;
      u.flags.kong = true;
      u.flags.tiles = [];
      this.push({ t: 'tiles', u, tiles: [], kong: true });
      this.addBuff(u, { s: 'atkP', v: T.kongAtk, turns: 999, name: KONG });
    },

    leaveKong(u) {
      if (!u.flags.kong) return;
      u.flags.kong = false;
      u.buffs = u.buffs.filter(b => b.name !== KONG);
      this.push({ t: 'tiles', u, tiles: (u.flags.tiles || []).slice(), kong: false });
    },

    bowstrings(y, fresh) {
      if (!alive(y)) return;
      y.flags.bowSkip = !!fresh;
      this.setBow(y, 2);
    },

    setBow(y, v) {
      const before = y.flags.bow || 0;
      y.flags.bow = Math.max(0, v);
      if (y.flags.bow > 0) { for (const a of this.livingAllies) if (!a.buffs.some(b => b.name === BOW)) a.buffs.push({ s: 'atkP', v: T.bowAtk, turns: 999, name: BOW }); }
      else for (const a of this.allies) a.buffs = a.buffs.filter(b => b.name !== BOW && !b.name.startsWith(KESTREL));
      if (y.flags.bow !== before) this.push({ t: 'stack', u: y, key: 'Bow', v: y.flags.bow, text: y.flags.bow > before ? BOW : y.flags.bow ? null : 'Тетива ослабла', col: '#ffd850' });
    },

    firekiss(g, t, sure) {
      if (!alive(t) || t.side !== 'enemy') return;
      if (!sure && !this.rng.chance(this.effectChance(g, t, 1))) { this.resisted(g); return; }
      const cur = t.buffs.find(b => b.name === KISS);
      const n = Math.min(T.kissMax, (cur ? Math.round(cur.v / T.kissVuln) : 0) + 1);
      this.addBuff(t, { s: 'vuln', v: T.kissVuln * n, turns: T.kissTurns, name: KISS, debuff: true }, !!cur);
    }
  });

  Object.assign(H.CHARS, KITS);
  Object.assign(H.FUSIONS, FUSIONS);
  H.FOURS = { KITS, FUSIONS, FX, SUITS, IDS: Object.keys(KITS) };
  if (typeof module !== 'undefined') module.exports = H;
})(globalThis.Hsr98 = globalThis.Hsr98 || {});
