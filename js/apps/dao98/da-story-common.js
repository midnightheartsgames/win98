(function (D) {
  'use strict';
  const H = (race, sex, o) => Object.assign({ kind: 'humanoid', race, sex }, o);

  D.COMPANIONS = {
    alistair: { name: 'Алистер', race: 'human', cls: 'warrior', sex: 'm', model: H('human', 'm', { skin: '#e8c4a0', hair: '#9a6a30', hairStyle: 'short', beard: 'stubble', eyes: '#5a3a1a' }), lvl: 2, attr: { str: 16, dex: 13, wil: 11, mag: 10, cun: 11, con: 14 }, equip: { main: 'longsword_iron', off: 'kite_iron', chest: 'chain_chest', gloves: 'chain_gloves', boots: 'chain_boots' }, ab: ['shield_bash', 'powerful'], skills: { combat_training: 1, combat_tactics: 1 }, build: 'warrior', dlg: 'alistair_talk', bio: 'Серый Страж из прошлого набора Дункана, до этого послушник-храмовник. Шутит, когда нервничает, а нервничает часто.' },
    morrigan: { name: 'Морриган', race: 'human', cls: 'mage', sex: 'f', model: H('human', 'f', { skin: '#f0d6bc', hair: '#141010', hairStyle: 'tail', eyes: '#c8a020' }), lvl: 3, attr: { str: 10, dex: 12, wil: 14, mag: 17, cun: 12, con: 11 }, equip: { main: 'staff2', chest: 'witch_robe' }, ab: ['winters_grasp', 'rock_armor', 'stonefist'], skills: { herbalism: 1, survival: 1 }, build: 'witch', dlg: 'morrigan_talk', bio: 'Дочь Флемет, ведьма из Диких земель Коркари. Не любит Церковь, города и лишние вопросы.', approval: 0 },
    dog: { name: 'Пёс', race: 'beast', cls: 'warrior', sex: 'm', model: { kind: 'dog', col: '#8a6238' }, nat: { dmgBase: 11, spd: 1.45, arm: 3, move: 1.1 }, lvl: 2, attr: { str: 16, dex: 14, wil: 10, mag: 10, cun: 10, con: 15 }, ab: ['overwhelm'], radius: 0.45, build: 'dog', dlg: 'dog_talk', bio: 'Боевой мабари. Хозяина он выбрал сам и передумывать не собирается.', dog: 1, approval: 50 },
    leliana: { name: 'Лелиана', race: 'human', cls: 'rogue', sex: 'f', model: H('human', 'f', { skin: '#f4dcc4', hair: '#b04a20', hairStyle: 'short', eyes: '#3a5a8a' }), lvl: 4, attr: { str: 11, dex: 16, wil: 11, mag: 10, cun: 15, con: 11 }, equip: { main: 'shortbow_grey', chest: 'leather_chest_q', boots: 'leather_boots', gloves: 'leather_gloves' }, set2: { main: 'dagger_iron', off: 'dagger_iron' }, ab: ['pinning_shot', 'aim'], skills: { coercion: 1, stealing: 1, herbalism: 1 }, build: 'archer', dlg: 'leliana_talk', bio: 'Сестра из церкви Лотеринга. Уверена, что Создатель послал ей видение и велел идти с вами.' },
    sten: { name: 'Стэн', race: 'qunari', cls: 'warrior', sex: 'm', model: H('qunari', 'm', { skin: '#a88c70', hair: '#e8e4dc', hairStyle: 'crop', eyes: '#a08040' }), lvl: 5, attr: { str: 19, dex: 12, wil: 11, mag: 10, cun: 11, con: 16 }, equip: { main: 'greatsword_iron', chest: 'studded_chest' }, ab: ['pommel_strike', 'powerful', 'indomitable'], skills: { combat_training: 2 }, build: 'warrior2h', dlg: 'sten_talk', bio: 'Воин-кунари из армии Бересаада. Сидел в клетке у Лотеринга и ждал смерти за убийство фермерской семьи.', radius: 0.45 },
    gilmore: { name: 'Сэр Гилмор', race: 'human', cls: 'warrior', sex: 'm', model: H('human', 'm', { skin: '#e8c4a0', hair: '#6a4020', hairStyle: 'short', beard: 'none' }), lvl: 2, attr: { str: 15, dex: 13, con: 14 }, equip: { main: 'longsword_grey', off: 'kite_iron', chest: 'highever_chest', boots: 'chain_boots' }, ab: ['shield_bash'], temp: 1, build: 'warrior', scale: false },
    eleanor: { name: 'Тейрна Элеанора', race: 'human', cls: 'rogue', sex: 'f', model: H('human', 'f', { skin: '#f0d0b4', hair: '#6a4020', hairStyle: 'tail' }), lvl: 3, attr: { str: 11, dex: 16, cun: 13, con: 12 }, equip: { main: 'longbow_grey', chest: 'highever_leather', boots: 'leather_boots' }, set2: { main: 'dagger_grey', off: 'dagger_iron' }, ab: ['pinning_shot', 'aim'], temp: 1, build: 'archer', scale: false },
    gorim: { name: 'Горим', race: 'dwarf', cls: 'warrior', sex: 'm', model: H('dwarf', 'm', { skin: '#e0b896', hair: '#5a3a1a', hairStyle: 'short', beard: 'braided' }), lvl: 2, attr: { str: 16, dex: 12, con: 15 }, equip: { main: 'longsword_grey', off: 'kite_iron', chest: 'dwarf_heavy_chest', head: 'dwarf_helm' }, ab: ['shield_bash', 'shield_defense'], temp: 1, build: 'warrior', scale: false },
    leske: { name: 'Леске', race: 'dwarf', cls: 'rogue', sex: 'm', model: H('dwarf', 'm', { skin: '#d0a07c', hair: '#3a2414', hairStyle: 'crop', beard: 'goatee', tattoo: 'brand' }), lvl: 2, attr: { str: 12, dex: 16, cun: 13, con: 13 }, equip: { main: 'dagger_grey', off: 'dagger_iron', chest: 'carta_leather' }, ab: ['dirty_fighting', 'dual_training'], temp: 1, build: 'rogue', scale: false },
    soris: { name: 'Сорис', race: 'elf', cls: 'rogue', sex: 'm', model: H('elf', 'm', { skin: '#e8c4a0', hair: '#6a4020', hairStyle: 'short' }), lvl: 2, attr: { str: 12, dex: 15, cun: 12, con: 12 }, equip: { main: 'longsword_iron', off: 'dagger_iron', chest: 'wedding_clothes' }, ab: ['dirty_fighting'], temp: 1, build: 'rogue', scale: false },
    tamlen: { name: 'Тамлен', race: 'elf', cls: 'rogue', sex: 'm', model: H('elf', 'm', { skin: '#e8c8a8', hair: '#c8a060', hairStyle: 'long', tattoo: 'vallaslin' }), lvl: 2, attr: { str: 11, dex: 16, cun: 13, con: 12 }, equip: { main: 'longbow_iron', chest: 'dalish_armor', boots: 'dalish_boots' }, ab: ['pinning_shot'], temp: 1, build: 'archer', scale: false },
    merrill: { name: 'Меррил', race: 'elf', cls: 'mage', sex: 'f', model: H('elf', 'f', { skin: '#f0d6bc', hair: '#1a1410', hairStyle: 'short', tattoo: 'vallaslin', eyes: '#4a8a4a' }), lvl: 3, attr: { mag: 17, wil: 14, cun: 12, con: 11 }, equip: { main: 'staff1', chest: 'chasind_robe' }, ab: ['heal', 'stonefist', 'rock_armor'], temp: 1, build: 'mage', scale: false },
    jowan: { name: 'Йован', race: 'human', cls: 'mage', sex: 'm', model: H('human', 'm', { skin: '#e8c4a0', hair: '#1a1410', hairStyle: 'short', beard: 'stubble' }), lvl: 2, attr: { mag: 15, wil: 13, con: 11 }, equip: { main: 'staff1', chest: 'apprentice_robe' }, ab: ['drain_life', 'disorient'], temp: 1, build: 'mage', scale: false },
    daveth: { name: 'Дэвет', race: 'human', cls: 'rogue', sex: 'm', model: H('human', 'm', { skin: '#d8b090', hair: '#3a2414', hairStyle: 'tail', beard: 'stubble' }), lvl: 2, attr: { str: 12, dex: 15, cun: 13, con: 12 }, equip: { main: 'dagger_grey', off: 'dagger_iron', chest: 'leather_chest', boots: 'leather_boots' }, ab: ['dirty_fighting', 'dual_training'], temp: 1, build: 'rogue', scale: false },
    jory: { name: 'Сэр Джори', race: 'human', cls: 'warrior', sex: 'm', model: H('human', 'm', { skin: '#e8c4a0', hair: '#1a1410', hairStyle: 'short', beard: 'full' }), lvl: 3, attr: { str: 17, dex: 12, con: 15 }, equip: { main: 'greatsword_grey', chest: 'splint_chest', boots: 'chain_boots' }, ab: ['pommel_strike', 'powerful'], temp: 1, build: 'warrior2h', scale: false },
    tower_guard: { name: 'Стражник башни', race: 'human', cls: 'warrior', sex: 'm', model: H('human', 'm', { skin: '#d8b090', hair: '#6a4020', hairStyle: 'short', beard: 'full' }), lvl: 4, attr: { str: 16, dex: 13, con: 15 }, equip: { main: 'longsword_grey', off: 'kite_grey', chest: 'chain_chest', head: 'chain_head' }, ab: ['shield_bash', 'shield_defense', 'taunt'], temp: 1, build: 'warrior', lvlBonus: 0 },
    tower_archer: { name: 'Лучник башни', race: 'human', cls: 'rogue', sex: 'm', model: H('human', 'm', { skin: '#e0b896', hair: '#3a2414', hairStyle: 'short', beard: 'stubble' }), lvl: 4, attr: { dex: 16, cun: 13, con: 13 }, equip: { main: 'longbow_iron', chest: 'studded_chest', head: 'leather_head' }, ab: ['pinning_shot', 'aim'], temp: 1, build: 'archer', lvlBonus: 0 },
    circle_mage: { name: 'Маг Круга', race: 'human', cls: 'mage', sex: 'f', model: H('human', 'f', { skin: '#f0d0b4', hair: '#c8a060', hairStyle: 'tail' }), lvl: 4, attr: { mag: 17, wil: 15, con: 11 }, equip: { main: 'staff2', chest: 'mage_robe' }, ab: ['heal', 'winters_grasp', 'rejuvenate'], temp: 1, build: 'mage', lvlBonus: 0 }
  };

  D.npc('duncan', { name: 'Дункан', race: 'human', sex: 'm', lvl: 10, cls: 'warrior', model: H('human', 'm', { skin: '#c89a74', hair: '#1a1410', hairStyle: 'tail', beard: 'full', armor: 'warden', tint: '#4a5a7a' }), equip: { main: 'longsword_steel', off: 'dagger_steel', chest: 'warden_chest' }, attr: { str: 18, dex: 18, con: 16 } });

  D.TOASTS = {
    saved: 'Игра сохранена',
    mouse_learned: 'Вы научились принимать облик мыши (кнопка на панели действий).',
    tainted: 'Вы чувствуете скверну в крови.'
  };

  D.WORLD = {
    highever: { name: 'Хайевер', x: 0.52, y: 0.14, locked: 'Замок захвачен людьми Хоу.' },
    denerim: { name: 'Денерим', x: 0.74, y: 0.36, locked: 'Столица далеко на северо-востоке. Не сейчас.' },
    redcliffe: { name: 'Редклиф', x: 0.3, y: 0.46, locked: 'До Редклифа ещё долгий путь.' },
    circle: { name: 'Башня Круга', x: 0.4, y: 0.38, locked: 'Круг магов на озере Каленхад. Позже.' },
    orzammar: { name: 'Орзаммар', x: 0.16, y: 0.4, locked: 'Путь в горы займёт недели.' },
    brecilian: { name: 'Бресилианский лес', x: 0.62, y: 0.6, locked: 'Долийцев сейчас не найти.' },
    lothering: { name: 'Лотеринг', x: 0.5, y: 0.62, area: 'lothering', spot: 'from_road' },
    ostagar: { name: 'Остагар', x: 0.46, y: 0.9, locked: 'Там сейчас только порождения тьмы.' },
    wilds: { name: 'Дебри Коркари', x: 0.38, y: 0.86, locked: 'Хижина Флемет осталась позади.' }
  };
  D.worldDestinations = (g, from) => Object.entries(D.WORLD).map(([id, w]) => ({ id, name: w.name, x: w.x, y: w.y, open: !w.locked && id !== from && !!w.area, note: w.locked || '', here: id === from }));
  D.pickEncounter = (g, from, to) => {
    if (to === 'lothering' && !g.flags.enc_road_done) return { area: 'road_camp', spot: 'start' };
    return null;
  };

  D.codex('grey_wardens', 'Культура и история', 'Серые Стражи', 'Орден возник во время Первого Мора, когда воины со всего Тедаса поняли, что поодиночке порождений тьмы не остановить. Стражи принимают в свои ряды кого угодно: преступника, гнома из Пыльного города, мага, беглого раба. Важно одно: способность сражаться и готовность отдать всё. Правом призыва они забирают рекрутов даже у королей.');
  D.codex('darkspawn', 'Существа', 'Порождения тьмы', 'Порождения тьмы живут под землёй и выходят на поверхность стаями. Их кровь несёт скверну: тех, кто её коснулся, ждёт смерть или безумие. Гарлоки высоки и сильны, генлоки коренасты и хитры. Эмиссары владеют магией, а огры способны смять рыцаря вместе с конём.');
  D.codex('blight', 'Культура и история', 'Мор', 'Когда порождения тьмы находят одного из спящих древних богов, скверна превращает его в Архидемона. За ним на поверхность выходит орда. Моров было четыре, и каждый опустошал целые страны. Считается, что только Серые Стражи могут убить Архидемона окончательно.');
  D.codex('maker', 'Магия и религия', 'Создатель и Андрасте', 'Церковь учит, что Создатель отвернулся от мира, увидев грехи своих детей, и вернётся, когда песнь Андрасте прозвучит во всех уголках Тедаса. Андрасте, Невеста Создателя, повела людей против Тевинтерской империи и была предана и сожжена на костре.');
  D.codex('chantry', 'Магия и религия', 'Церковь', 'Церковь с престолом в Вал Руайо правит душами большей части Тедаса. Преподобные матери ведут службы, храмовники стерегут магов. В Ферелдене Церковь сильна, но ферелденцы помнят и то, что орлесианские солдаты молились тому же Создателю.');
  D.codex('circle', 'Магия и религия', 'Круг магов', 'Всех детей с даром магии забирают в Круг. Там они учатся под надзором храмовников. Маг, который не прошёл Истязание, остаётся учеником навсегда. Или его делают Усмирённым: он перестаёт видеть сны, чувствовать и колдовать.');
  D.codex('fade', 'Магия и религия', 'Тень', 'Тень — мир духов, куда каждый смертный, кроме гномов, попадает во сне. Там живут духи и демоны: гнева, голода, лени, желания, гордыни. Маги ближе всех к Тени, и демоны это знают.');
  D.codex('ferelden', 'Места', 'Ферелден', 'Ферелден — королевство на юге Тедаса. Сорок лет назад его захватила Орлесианская империя, а тридцать лет назад король Марик и Логейн Мак Тир изгнали захватчиков. Теперь правит сын Марика, король Кайлан. Страной фактически управляют эрлы, банны и тейрны, а собрание знати зовётся Собранием земель.');
  D.codex('mabari', 'Существа', 'Мабари', 'Мабари — боевые псы Ферелдена, гордость каждого знатного дома. Говорят, что мабари сам выбирает хозяина и остаётся с ним до смерти. Эти псы умнее многих людей, и ферелденцы охотно этим хвастаются.');
  D.codex('templars', 'Магия и религия', 'Храмовники', 'Воины Церкви, обученные противостоять магии. Лириум даёт им силу гасить заклинания и чуять магию крови. Храмовники охраняют Круги и охотятся на отступников.');
  D.codex('lyrium', 'Предметы и записи', 'Лириум', 'Лириум добывают гномы. Сырой он опасен для всех, кроме гномов, а очищенный усиливает связь мага с Тенью. Храмовники тоже пьют лириум и платят за это зависимостью.');
  D.codex('dwarves', 'Культура и история', 'Гномы', 'Гномы давно потеряли большую часть своих подземных владений. Каждый гном принадлежит к касте, и каста определяет, кем он станет. Совершенных чтут наравне с богами. Гномы не видят снов и почти не поддаются магии.');
  D.codex('elves', 'Культура и история', 'Эльфы', 'После падения Долов эльфы разделились. Городские эльфы живут в эльфинажах человеческих городов, работают слугами и почти всё забыли. Долийцы кочуют по лесам и пытаются вернуть утраченное: язык, богов, историю.');
  D.codex('archdemon', 'Существа', 'Архидемон', 'Древний бог, заражённый скверной. Он принимает облик огромного дракона и ведёт за собой орду. Если убить его обычным оружием, его сущность переселится в ближайшее порождение тьмы и возродится.');
  D.codex('item_poultice', 'Предметы и записи', 'Припарки', 'Смесь эльфийского корня и других трав на льняной основе. Хорошая припарка останавливает кровь за несколько вдохов. Травники Круга умеют делать их сильнее.');

  D.questDef('main_blight', { name: 'Мор', stages: { 1: 'Дункан, Серый Страж, забрал вас в Остагар. Там армия короля Кайлана готовится встретить порождений тьмы.', 2: 'Король и Дункан ждут вас в лагере Остагара.', 3: 'Армия разбита. Логейн бросил короля. Вы и Алистер выжили благодаря Флемет. Нужно собрать армию по договорам Серых Стражей.', 4: 'Лотеринг — первая деревня на пути на север. Там можно передохнуть и решить, что делать дальше.', 9: 'Глава окончена.' }, done: 9 });

  D.ORIGIN_INTRO = {
    hn: [{ img: 'archdemon', text: 'Во тьме под землёй что-то проснулось. Порождения тьмы выходят на поверхность, и на юге Ферелдена уже горят деревни.' }, { img: 'castle_night', text: 'Король Кайлан собирает армию в древней крепости Остагар. Тейрн Брайс Кусланд отправляет туда войска Хайевера. Его младший ребёнок остаётся дома.' }],
    mage: [{ img: 'archdemon', text: 'Во тьме под землёй что-то проснулось. Порождения тьмы выходят на поверхность, и на юге Ферелдена уже горят деревни.' }, { img: 'circle', text: 'Но в Башне Круга на озере Каленхад об этом пока не думают. Здесь маги учатся жить под присмотром храмовников. Этой ночью очередного ученика ведут на Истязание.' }],
    ce: [{ img: 'archdemon', text: 'Во тьме под землёй что-то проснулось. Порождения тьмы выходят на поверхность, и на юге Ферелдена уже горят деревни.' }, { img: 'alienage', text: 'Денерим, столица Ферелдена. За каменной стеной эльфинажа живут эльфы: слуги, подёнщики, нищие. Сегодня в эльфинаже праздник, у кого-то свадьба.' }],
    de: [{ img: 'archdemon', text: 'Во тьме под землёй что-то проснулось. Порождения тьмы выходят на поверхность, и на юге Ферелдена уже горят деревни.' }, { img: 'forest', text: 'Долийцы, последние вольные эльфы, кочуют по лесам Ферелдена. Клан Хранительницы Маретари встал лагерем в чаще у Бресилианского леса. Охотники ушли далеко от стоянки.' }],
    dn: [{ img: 'archdemon', text: 'Во тьме под землёй что-то проснулось. Порождения тьмы выходят на поверхность, и на юге Ферелдена уже горят деревни.' }, { img: 'orzammar', text: 'Под горами, в Орзаммаре, гномы веками сдерживают порождений тьмы на Глубинных тропах. Сегодня король Эндрин Эдукан устраивает пир в честь своего второго ребёнка.' }],
    dc: [{ img: 'archdemon', text: 'Во тьме под землёй что-то проснулось. Порождения тьмы выходят на поверхность, и на юге Ферелдена уже горят деревни.' }, { img: 'dusttown', text: 'Орзаммар, Пыльный город. Здесь живут те, кого каста не признаёт: безкастовые, клеймёные с рождения. Выжить тут можно, только работая на Хартию.' }]
  };
  D.ACHIEVEMENTS = {
    origin_hn: { name: 'Кровь Кусландов', desc: 'Пройти предысторию человека-дворянина.' },
    origin_mage: { name: 'Истязание', desc: 'Пройти предысторию мага.' },
    origin_ce: { name: 'Свадьба в эльфинаже', desc: 'Пройти предысторию городского эльфа.' },
    origin_de: { name: 'Зеркало прошлого', desc: 'Пройти предысторию долийского эльфа.' },
    origin_dn: { name: 'Изгнанник', desc: 'Пройти предысторию гнома-аристократа.' },
    origin_dc: { name: 'Без касты', desc: 'Пройти предысторию гнома-простолюдина.' },
    joining: { name: 'Посвящение', desc: 'Стать Серым Стражем.' },
    ogre: { name: 'Убийца огров', desc: 'Победить огра на вершине башни Ишала.' },
    lothering: { name: 'Путь на север', desc: 'Покинуть Лотеринг и завершить главу.' },
    all_origins: { name: 'Шесть судеб', desc: 'Пройти все шесть предысторий.' },
    persuader: { name: 'Острый язык', desc: 'Пройти десять проверок убеждения или запугивания.' },
    rich: { name: 'Полный кошель', desc: 'Скопить 10 золотых.' },
    party: { name: 'Отряд в сборе', desc: 'Собрать в отряде Алистера, Морриган, Лелиану и Стэна.' }
  };
  if (typeof module !== 'undefined' && module.exports) module.exports = D;
})(globalThis.Dao98 = globalThis.Dao98 || {});
