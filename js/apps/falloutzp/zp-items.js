(function (Z) {
  'use strict';

  const I = {};
  const add = o => { I[o.id] = o; return o; };

  const W = (id, name, o) => add(Object.assign({ id, name, cat: 'weapon', cond: 1, ap: 20, crit: 0, critMult: 1, str: 0, skillReq: 0, w: 2, v: 50, range: 40, spread: 1.5, rof: 2, mag: 0, ammo: null, reload: 2, pellets: 1 }, o));
  W('fists', 'Кулаки', { wtype: 'unarmed', skill: 'unarmed', dmg: 4, rof: 2.2, ap: 10, range: 1.6, w: 0, v: 0, durab: 0, hidden: true, model: 'fists' });
  W('kastet', 'Кастет', { wtype: 'unarmed', skill: 'unarmed', dmg: 8, rof: 2.1, ap: 12, range: 1.6, w: 1, v: 30, durab: 400, model: 'kastet', desc: 'Латунный кастет. Самбо самбом, а железо в кулаке — довод.' });
  W('sambo', 'Силовая перчатка «Самбо»', { wtype: 'unarmed', skill: 'unarmed', dmg: 24, rof: 1.6, ap: 18, range: 1.7, w: 5, v: 900, str: 5, skillReq: 50, durab: 500, knock: 0.25, model: 'glove', desc: 'Опытный образец для бригад спасателей: пневмопривод в каждом пальце.' });
  W('knife', 'Нож разведчика НР-40', { wtype: 'melee', skill: 'melee', dmg: 10, rof: 2.2, ap: 12, crit: 10, critMult: 1.5, range: 1.7, w: 1, v: 40, durab: 400, model: 'knife', desc: 'Армейский нож образца 1940 года. Надёжен, как довоенная тушёнка.' });
  W('lopatka', 'Сапёрная лопатка', { wtype: 'melee', skill: 'melee', dmg: 14, rof: 1.6, ap: 18, range: 1.9, w: 2, v: 45, durab: 500, model: 'shovel', desc: 'МПЛ-50. Копать окоп, рубить корни, разбираться с колорадами.' });
  W('crowbar', 'Монтировка', { wtype: 'melee', skill: 'melee', dmg: 12, rof: 1.7, ap: 16, range: 1.9, w: 3, v: 30, durab: 600, model: 'crowbar' });
  W('rebar', 'Арматура', { wtype: 'melee', skill: 'melee', dmg: 15, rof: 1.3, ap: 20, range: 2.1, w: 4, v: 15, str: 4, durab: 500, model: 'rebar', desc: 'Кусок арматуры с бетонным комом на конце. Любимое оружие ударников.' });
  W('axe', 'Топор', { wtype: 'melee', skill: 'melee', dmg: 19, rof: 1.3, ap: 22, range: 1.9, w: 4, v: 60, str: 5, durab: 500, model: 'axe' });
  W('sabre', 'Казачья шашка', { wtype: 'melee', skill: 'melee', dmg: 23, rof: 1.8, ap: 18, crit: 5, critMult: 1.5, range: 2.2, w: 3, v: 260, str: 4, skillReq: 30, durab: 500, model: 'sabre', desc: 'Шашка образца 1927 года, перекованная сечевыми ковалями.' });
  W('sabreAtaman', 'Шашка кошевого', { wtype: 'melee', skill: 'melee', dmg: 31, rof: 1.9, ap: 18, crit: 10, critMult: 2, range: 2.3, w: 3, v: 900, str: 4, skillReq: 45, durab: 900, model: 'sabre', unique: true, desc: 'Рукоять обмотана красным шнуром, на клинке выбито: «За волю».' });
  W('sledge', 'Кувалда', { wtype: 'melee', skill: 'melee', dmg: 36, rof: 0.75, ap: 32, range: 2.2, w: 12, v: 120, str: 7, twoHand: true, knock: 0.4, durab: 800, model: 'sledge', desc: 'Пять килограммов калёной стали на берёзовой ручке.' });

  W('pm', 'ПМ', { wtype: 'pistol', skill: 'guns', dmg: 14, rof: 3.2, mag: 8, ammo: 'a918', spread: 1.4, range: 40, ap: 17, w: 2, v: 150, reload: 1.6, durab: 900, model: 'pm', sound: 'pistol', desc: 'Пистолет Макарова. Лёгкий, надёжный, слабоват против мутантов.' });
  W('tt', 'ТТ', { wtype: 'pistol', skill: 'guns', dmg: 18, rof: 2.8, mag: 8, ammo: 'a762t', spread: 1.2, range: 50, ap: 18, crit: 2, w: 2, v: 260, reload: 1.7, durab: 800, model: 'tt', sound: 'pistol', desc: 'Тульский Токарева. Пуля шьёт ватник насквозь.' });
  W('ttFirma', 'ТТ «Фирма»', { wtype: 'pistol', skill: 'guns', dmg: 24, rof: 3.2, mag: 9, ammo: 'a762t', spread: 0.8, range: 60, ap: 16, crit: 6, critMult: 1.5, w: 2, v: 1400, reload: 1.4, durab: 1600, model: 'tt', sound: 'pistol', unique: true, chrome: true, desc: 'Хромированный ТТ с перламутровыми щёчками. Из него стреляли вам в голову.' });
  W('nagan', 'Наган', { wtype: 'revolver', skill: 'guns', dmg: 24, rof: 1.8, mag: 7, ammo: 'a762n', spread: 1.0, range: 50, ap: 22, crit: 4, w: 2, v: 280, reload: 3.6, perRound: true, durab: 1000, model: 'nagan', sound: 'revolver', desc: 'Револьвер системы Нагана. Барабан на семь патронов, заряжать по одному.' });
  W('obrez', 'Обрез', { wtype: 'shotgun', skill: 'guns', dmg: 6, pellets: 8, rof: 3.5, mag: 2, ammo: 'a12', spread: 9, range: 12, ap: 22, w: 3, v: 120, reload: 2.4, durab: 500, model: 'obrez', sound: 'shotgun', desc: 'Двустволка, укороченная ножовкой. В упор — страшное дело.' });
  W('toz', 'ТОЗ-34', { wtype: 'shotgun', skill: 'guns', dmg: 7, pellets: 8, rof: 2.4, mag: 2, ammo: 'a12', spread: 5, range: 22, ap: 26, w: 4, v: 220, reload: 2.6, twoHand: true, durab: 800, model: 'toz', sound: 'shotgun', desc: 'Охотничья двустволка Тульского завода.' });
  W('mosin', 'Винтовка Мосина', { wtype: 'rifle', skill: 'guns', dmg: 44, rof: 0.9, mag: 5, ammo: 'a762r', spread: 0.25, range: 130, ap: 30, crit: 5, critMult: 1.5, str: 5, w: 5, v: 420, reload: 3.4, perRound: true, twoHand: true, durab: 1200, model: 'mosin', sound: 'rifle', desc: 'Трёхлинейка образца 1891/30 года. Сечевики любят её больше жён.' });
  W('mosinScope', 'Снайперская трёхлинейка', { wtype: 'rifle', skill: 'guns', dmg: 46, rof: 0.9, mag: 5, ammo: 'a762r', spread: 0.15, range: 160, ap: 30, crit: 8, critMult: 2, str: 5, w: 6, v: 780, reload: 3.4, perRound: true, twoHand: true, scope: 3.5, durab: 1200, model: 'mosin', sound: 'rifle', desc: 'С прицелом ПУ. Видно каждую ворсинку на ушах байбака.' });
  W('sks', 'СКС', { wtype: 'rifle', skill: 'guns', dmg: 25, rof: 2.6, mag: 10, ammo: 'a762k', spread: 0.6, range: 90, ap: 22, crit: 3, str: 4, w: 4, v: 480, reload: 2.8, twoHand: true, durab: 1300, model: 'sks', sound: 'rifle', desc: 'Самозарядный карабин Симонова. Штык откидной, характер покладистый.' });
  W('akm', 'АКМ', { wtype: 'auto', skill: 'guns', dmg: 18, rof: 10, mag: 30, ammo: 'a762k', spread: 1.8, range: 70, ap: 26, auto: true, str: 5, w: 4, v: 900, reload: 2.4, twoHand: true, durab: 2400, model: 'akm', sound: 'auto', desc: 'Автомат Калашникова модернизированный. Ему всё равно, сколько лет прошло.' });
  W('ppsh', 'ППШ-77', { wtype: 'smg', skill: 'guns', dmg: 12, rof: 14, mag: 71, ammo: 'a762t', spread: 3.0, range: 35, ap: 24, auto: true, str: 4, w: 5, v: 640, reload: 3.2, twoHand: true, durab: 2400, model: 'ppsh', sound: 'smg', desc: 'Пистолет-пулемёт Шпагина с дисковым магазином на 71 патрон.' });
  W('svd', 'СВД', { wtype: 'rifle', skill: 'guns', dmg: 50, rof: 2, mag: 10, ammo: 'a762r', spread: 0.12, range: 180, ap: 28, crit: 8, critMult: 2, str: 5, skillReq: 45, w: 5, v: 2200, reload: 2.8, twoHand: true, scope: 4, durab: 1600, model: 'svd', sound: 'rifle', desc: 'Снайперская винтовка Драгунова. Оптика ПСО-1, сетка в тысячных.' });
  W('molniya', 'Разрядник «Молния»', { wtype: 'energyPistol', skill: 'energy', dmg: 22, rof: 2.2, mag: 20, ammo: 'krona', spread: 1.0, range: 28, ap: 20, chain: 1, w: 3, v: 700, reload: 1.8, durab: 1200, model: 'molniya', sound: 'arc', desc: 'Ручной электроразрядник, гордость НИИ «Энергоприбор». Дуга перескакивает на соседнюю цель.' });
  W('luch', 'СВЧ-излучатель «Луч»', { wtype: 'energyPistol', skill: 'energy', dmg: 16, rof: 3, mag: 30, ammo: 'krona', spread: 1.2, range: 35, ap: 18, burn: 4, w: 3, v: 520, reload: 1.6, durab: 1000, model: 'luch', sound: 'beam', desc: 'Снято с дружинника. Греет так, что ватник дымится.' });
  W('giper', 'Гиперболоид «ГЛ-2»', { wtype: 'energyRifle', skill: 'energy', dmg: 34, rof: 2.4, mag: 24, ammo: 'accu', spread: 0.35, range: 110, ap: 24, burn: 6, crit: 4, str: 4, skillReq: 40, w: 7, v: 2600, reload: 2.4, twoHand: true, durab: 1500, model: 'giper', sound: 'ray', desc: 'Тепловой луч по схеме инженера Гарина. Режет листовое железо и всё, что за ним.' });
  W('f1', 'Граната Ф-1', { wtype: 'throw', skill: 'explosives', dmg: 95, radius: 7, rof: 0.8, ap: 23, w: 0.6, v: 90, thrown: true, fuse: 3.5, stack: true, model: 'f1', desc: 'Оборонительная «лимонка». Бросать из-за укрытия.' });
  W('rgd', 'Граната РГД-5', { wtype: 'throw', skill: 'explosives', dmg: 70, radius: 5, rof: 0.8, ap: 20, w: 0.4, v: 60, thrown: true, fuse: 3.5, stack: true, model: 'rgd' });
  W('molotov', 'Коктейль Молотова', { wtype: 'throw', skill: 'explosives', dmg: 20, radius: 3.5, fire: 10, rof: 0.8, ap: 20, w: 0.5, v: 30, thrown: true, impact: true, stack: true, model: 'molotov', desc: 'Бутылка самогона с тряпкой. Колорады горят весело.' });
  W('tnt', 'Тротиловая шашка', { wtype: 'throw', skill: 'explosives', dmg: 120, radius: 6, rof: 0.6, ap: 26, w: 0.4, v: 110, thrown: true, fuse: 4, stack: true, model: 'tnt', desc: 'Двухсотграммовая шашка с огнепроводным шнуром.' });
  W('mine', 'Мина ПМН', { wtype: 'mine', skill: 'explosives', dmg: 110, radius: 4, rof: 0.5, ap: 30, w: 0.6, v: 80, mine: true, stack: true, model: 'mine' });
  W('rivet', 'Клепальный молот', { wtype: 'pistol', skill: 'guns', dmg: 20, rof: 2, mag: 12, ammo: 'rivets', spread: 2.2, range: 25, ap: 20, str: 5, w: 6, v: 300, reload: 2.4, durab: 1000, model: 'rivet', sound: 'rivet', desc: 'Пневматический клепальщик ударников. Заклёпки летят как пули.' });

  const A = (id, name, v, w, desc) => add({ id, name, cat: 'ammo', v, w: w || 0, stack: true, desc });
  A('a918', 'Патроны 9×18 мм', 1, 0, 'Для ПМ.');
  A('a762t', 'Патроны 7,62×25 мм', 2, 0, 'Для ТТ и ППШ.');
  A('a762n', 'Патроны 7,62×38 мм', 2, 0, 'Для нагана.');
  A('a762k', 'Патроны 7,62×39 мм', 3, 0, 'Для АКМ и СКС.');
  A('a762r', 'Патроны 7,62×54R', 5, 0, 'Винтовочный патрон для трёхлинейки и СВД.');
  A('a12', 'Патроны 12 калибра', 3, 0, 'Картечь в бумажной гильзе.');
  A('krona', 'Батарейка «Крона»', 4, 0, 'Девять вольт советского качества. Питает разрядники и излучатели.');
  A('accu', 'Аккумулятор «Гиперболоид»', 8, 0, 'Свинцово-радиевая батарея для тепловых излучателей.');
  A('rivets', 'Заклёпки', 1, 0, 'Стальные заклёпки для клепальщика.');

  const AP = (id, name, slot, dt, o) => add(Object.assign({ id, name, cat: 'apparel', slot, dt, w: 2, v: 30, cond: 1, durab: 600 }, o));
  AP('vatnik', 'Ватник', 'body', 2, { w: 3, v: 25, model: 'vatnik', desc: 'Стёганка на вате. Тепло, мягко, пахнет махоркой.' });
  AP('workwear', 'Спецовка металлурга', 'body', 4, { w: 5, v: 60, fireRes: 20, model: 'workwear', desc: 'Брезент с огнеупорной пропиткой ЗАлК.' });
  AP('gimnastyorka', 'Гимнастёрка', 'body', 3, { w: 3, v: 50, model: 'gimn' });
  AP('shinel', 'Шинель Комендатуры', 'body', 8, { w: 8, v: 220, faction: 'komendatura', model: 'shinel', desc: 'Серое сукно, красные петлицы. В ней вас примут за своего на КПП.' });
  AP('zhupan', 'Жупан сечевика', 'body', 6, { w: 5, v: 180, faction: 'sich', model: 'zhupan', desc: 'Синий жупан, широкий пояс. На острове в таком сойдёте за своего.' });
  AP('kozhanka', 'Кожанка кооператора', 'body', 5, { w: 4, v: 260, faction: 'coop', bonus: { cha: 1 }, model: 'kozhanka', desc: 'Чёрная кожа, фирменная молния. Пахнет деньгами.' });
  AP('montana', 'Джинсы и куртка «Монтана»', 'body', 3, { w: 3, v: 1200, bonus: { cha: 2 }, unique: true, model: 'jeans', desc: 'Настоящий импорт довоенной поставки. Двести лет в очереди — и вот.' });
  AP('bronik', 'Бронежилет 6Б2', 'body', 12, { w: 12, v: 600, bonus: { agi: -1 }, model: 'bronik', desc: 'Титановые пластины в чехле из капрона.' });
  AP('ozk', 'Костюм ОЗК', 'body', 4, { w: 6, v: 280, rr: 30, model: 'ozk', desc: 'Общевойсковой защитный комплект. Резина, тальк, никакой радиации.' });
  AP('labcoat', 'Белый халат', 'body', 1, { w: 2, v: 60, bonus: { sk_medicine: 5 }, model: 'labcoat' });
  AP('bogatyr', 'Броня «Богатырь»', 'body', 22, { w: 40, v: 4200, bonus: { str: 1 }, power: true, model: 'bogatyr', desc: 'Экзоскелет пехоты образца 2069 года. Без курса подготовки в нём не сделать и шага.' });
  AP('dress', 'Ситцевое платье', 'body', 1, { w: 1, v: 20, model: 'dress' });
  AP('telnyashka', 'Тельняшка и клёши', 'body', 1, { w: 1, v: 20, bonus: { agi: 0 }, model: 'telnyashka' });
  AP('ushanka', 'Шапка-ушанка', 'head', 1, { w: 1, v: 15, model: 'ushanka' });
  AP('kepka', 'Кепка', 'head', 0, { w: 0.5, v: 8, model: 'kepka' });
  AP('kaska', 'Каска', 'head', 3, { w: 2, v: 40, model: 'kaska' });
  AP('furazhka', 'Фуражка Комендатуры', 'head', 1, { w: 1, v: 40, faction: 'komendatura', model: 'furazhka' });
  AP('papakha', 'Папаха', 'head', 1, { w: 1, v: 40, faction: 'sich', model: 'papakha' });
  AP('gasmask', 'Противогаз ГП-5', 'head', 1, { w: 1, v: 70, rr: 15, gas: true, bonus: { per: -1 }, model: 'gasmask', desc: 'Резиновая маска с коробкой фильтра. Хоботы смотрят на него с тоской.' });
  AP('helmBog', 'Шлем «Богатырь»', 'head', 6, { w: 6, v: 900, power: true, model: 'helmBog' });
  AP('glasses', 'Очки в роговой оправе', 'eyes', 0, { w: 0, v: 20, glasses: true, model: 'glasses' });

  const AID = (id, name, o) => add(Object.assign({ id, name, cat: 'aid', w: 0.5, v: 10, stack: true }, o));
  AID('stim', 'Шприц-тюбик', { heal: 30, over: 2, v: 75, desc: 'Из аптечки АИ. Колоть в бедро прямо через одежду.' });
  AID('stimBig', 'Шприц-тюбик «Богатырь»', { heal: 75, over: 3, v: 180, desc: 'Усиленная армейская формула.' });
  AID('b190', 'Радиопротектор Б-190', { rad: -150, over: 10, v: 60, desc: 'Таблетки из гнезда №3 аптечки АИ-2. Горькие.' });
  AID('kiodine', 'Калий йодистый', { effect: { rr: 25 }, dur: 240, v: 40, desc: 'Йод для щитовидки. Радиация липнет хуже.' });
  AID('promedol', 'Промедол', { effect: { dt: 10 }, dur: 60, addict: 0.1, v: 80, desc: 'Обезболивающее. Боль уходит, остаётся упрямство.' });
  AID('stakhanovit', 'Стахановит', { effect: { dmg: 25 }, dur: 60, addict: 0.15, v: 90, desc: 'Таблетки «трудового героизма». Пятилетку — за смену! (Побочные эффекты см. ударников.)' });
  AID('sidnocarb', 'Сиднокарб', { effect: { apRestore: 30 }, dur: 0, addict: 0.1, v: 70, desc: 'Стимулятор космонавтов. Мир на минуту становится медленнее.' });
  AID('metan', 'Метан', { effect: { str: 2, end: 3 }, dur: 240, addict: 0.1, v: 70, desc: 'Анаболик для штангистов. Плечи шире, мысли уже.' });
  AID('nootrop', 'Ноотроп', { effect: { int: 2, per: 2 }, dur: 240, addict: 0.1, v: 60, desc: 'Таблетки для студентов перед сессией.' });
  AID('medbag', 'Сумка санинструктора', { limbs: true, heal: 10, v: 120, w: 1, desc: 'Шины, бинты, жгут. Вправит любую конечность.' });
  const F = (id, name, heal, o) => add(Object.assign({ id, name, cat: 'aid', food: true, heal, over: 4, w: 0.5, v: 5, stack: true }, o));
  F('tushenka', 'Тушёнка', 18, { rad: 2, v: 12, fod: 120, desc: 'Говядина тушёная, ГОСТ. Банка пережила войну, переживёт и вас.' });
  F('sgushenka', 'Сгущёнка', 12, { rad: 2, v: 10, fod: 80, h2o: -10, desc: 'Молоко цельное сгущённое с сахаром. Дырку проделать ножом.' });
  F('kilka', 'Килька в томате', 9, { rad: 2, v: 6, fod: 70 });
  F('bread', 'Хлеб «Кирпич»', 6, { rad: 1, v: 4, fod: 60, desc: 'Окаменевший буханок. Размочить в воде.' });
  F('salo', 'Сало', 14, { v: 14, fod: 110 });
  F('egg', 'Яйцо бройлера', 6, { rad: 1, v: 6, fod: 50, desc: 'Размером с дыню.' });
  F('apricot', 'Абрикосы', 5, { rad: 1, v: 4, fod: 30, h2o: 10 });
  F('potato', 'Картошка', 4, { rad: 1, v: 3, fod: 40 });
  F('seeds', 'Семечки', 2, { v: 3, fod: 20, desc: 'Жареные, кулёчком из газеты.' });
  F('larva', 'Колорадская личинка', 4, { rad: 8, v: 2, fod: 40, desc: 'Сочная. Лучше не думать.' });
  F('baibakRaw', 'Мясо байбака', 6, { rad: 4, v: 6, fod: 60 });
  F('baibakCooked', 'Жареный байбак', 22, { rad: 1, v: 18, fod: 150 });
  F('somRaw', 'Мясо сома', 8, { rad: 10, v: 8, fod: 70 });
  F('ukha', 'Уха из сома', 30, { rad: 3, v: 30, fod: 160, h2o: 40 });
  F('broilerRaw', 'Мясо бройлера', 8, { rad: 3, v: 8, fod: 80 });
  F('omelet', 'Омлет из яйца бройлера', 20, { rad: 1, v: 16, fod: 140 });
  F('koloradGrill', 'Колорад на углях', 14, { rad: 3, v: 10, fod: 100, desc: 'Хрустит, как раки. Почти.' });
  F('water', 'Вода питьевая', 6, { v: 10, h2o: 150, drink: true, desc: 'Чистая вода в бутылке из-под «Боржоми».' });
  F('dneprWater', 'Вода из Днепра', 3, { rad: 10, v: 2, h2o: 150, drink: true });
  F('kvass', 'Квас', 8, { rad: 1, v: 8, h2o: 120, drink: true });
  F('sitro', 'Ситро «Буратино»', 8, { rad: 1, v: 12, h2o: 100, drink: true, effect: { apRestore: 8 }, desc: 'Сладкая газировка с усатым мальчиком на этикетке.' });
  F('samogon', 'Самогон', 2, { v: 15, h2o: 30, drink: true, alcohol: true, effect: { str: 1, cha: 1, int: -1 }, dur: 120, desc: 'Свекольный, дважды перегнанный. Горит синим.' });
  F('vodka', 'Водка «Пшеничная»', 2, { v: 30, h2o: 20, drink: true, alcohol: true, effect: { str: 1, cha: 1, int: -1, per: -1 }, dur: 240, desc: 'Довоенная, с бескозыркой. Талон на неё стоил дороже электричества.' });

  const M = (id, name, v, w, o) => add(Object.assign({ id, name, cat: 'misc', v, w: w === undefined ? 0.5 : w, stack: true }, o || {}));
  M('talon', 'Талоны', 1, 0, { currency: true, desc: 'Талон на 1 кВт·ч электроэнергии. Принимаются от Сечи до Соцгорода.' });
  M('perfokarta', 'Перфокарта АСУ «Днепр»', 0, 0, { quest: true, stack: false, desc: 'Плотный картон с рядами пробитых отверстий. Гриф «Особой важности», адресат: Облисполком, подвал 3, абонент «Плановик».' });
  M('bullet', 'Пуля в банке', 0, 0.2, { quest: true, stack: false, desc: 'Сплющенная пуля 7,62×25 мм, извлечённая из вашей головы. Доктор Ласточкина сохранила её на память.' });
  M('lockpick', 'Отмычка', 1, 0, { desc: 'Согнутая шпилька. Ломается, если давить.' });
  M('repairkit', 'Ремкомплект оружейный', 120, 2, { repair: 25, desc: 'Ветошь, масло, шомпол, запасные пружины.' });
  M('tape', 'Изолента', 6, 0.1);
  M('glue', 'Клей БФ-6', 8, 0.2);
  M('spring', 'Пружина', 4, 0.1);
  M('tube', 'Радиолампа', 12, 0.2, { desc: 'Лампа 6П14П. В хозяйстве пригодится.' });
  M('capacitor', 'Конденсатор', 10, 0.2);
  M('wire', 'Медная проволока', 6, 0.3);
  M('bottle', 'Пустая бутылка', 1, 0.5);
  M('rag', 'Тряпка', 1, 0.1);
  M('can', 'Пустая консервная банка', 0, 0.2);
  M('wrench', 'Гаечный ключ', 5, 1);
  M('iron', 'Утюг', 6, 3, { desc: 'Чугунный, с угольками.' });
  M('samovar', 'Самовар', 70, 6, { desc: 'Тульский, медный, на сапоге. Кооператоры дадут хорошую цену.' });
  M('glass', 'Гранёный стакан', 4, 0.3, { desc: 'Работа скульптора Мухиной. Не бьётся, если ронять плашмя.' });
  M('badgeGTO', 'Значок ГТО', 15, 0, { desc: 'Серебряный значок второй степени.' });
  M('tie', 'Пионерский галстук', 5, 0);
  M('komsomol', 'Комсомольский билет', 3, 0);
  M('clock', 'Будильник «Слава»', 15, 1);
  M('belomor', 'Папиросы «Беломорканал»', 6, 0.1, { desc: 'Пачка на двадцать пять папирос. Валюта не хуже талонов.' });
  M('matches', 'Спички', 2, 0);
  M('filter', 'Фильтр ФПК', 40, 0.5, { desc: 'Фильтрующе-поглощающая коробка к промышленному противогазу.' });
  M('chitin', 'Колорадский хитин', 12, 1, { desc: 'Полосатая пластина панциря. Крепче иной брони.' });
  M('feather', 'Перо мартына', 3, 0);
  M('whisker', 'Ус Царь-сома', 400, 2, { desc: 'Трёхметровый, жёсткий, как трос.' });
  M('pectoral', 'Золотая пектораль', 2500, 1.5, { desc: 'Скифское нагрудное украшение. Звери, кони, люди — всё из золота.' });
  M('relay', 'Реле РЭС-9', 18, 0.1);
  M('fuse', 'Огнепроводный шнур', 4, 0.1);
  M('tntRaw', 'Тротил', 20, 0.5);
  M('kerosene', 'Керосин', 10, 1);
  M('dust', 'Дуст', 25, 2, { desc: 'Ядохимикат против колорадского жука. Довоенный, от него и людям нехорошо.' });

  const B = (id, name, skill, o) => add(Object.assign({ id, name, cat: 'book', skill, w: 1, v: 150, stack: true }, o));
  B('bkMed', 'Справочник фельдшера', 'medicine');
  B('bkRep', 'Справочник слесаря-ремонтника', 'repair');
  B('bkSci', 'Программирование для ЭВМ «Днепр»', 'science');
  B('bkGuns', 'Устав караульной службы', 'guns');
  B('bkEnergy', 'Электротехника для ПТУ', 'energy');
  B('bkExp', 'Справочник подрывника', 'explosives');
  B('bkBarter', 'Политэкономия социализма', 'barter');
  B('bkSpeech', 'Ораторское искусство', 'speech');
  B('bkSurv', 'Книга о вкусной и здоровой пище', 'survival');
  B('bkUnarmed', 'Самбо для начинающих', 'unarmed');
  B('bkMelee', 'Фехтование на шашках', 'melee');
  B('bkLock', 'Замки и запоры', 'lockpick');
  B('bkSneak', 'Тихая охота', 'sneak');
  const MG = (id, name, skill) => add({ id, name, cat: 'book', mag: true, skill, w: 0.2, v: 25, stack: true });
  MG('mgSci', '«Техника — молодёжи»', 'science');
  MG('mgMed', '«Здоровье»', 'medicine');
  MG('mgSpeech', '«Огонёк»', 'speech');
  MG('mgBarter', '«Крокодил»', 'barter');
  MG('mgRep', '«За рулём»', 'repair');
  MG('mgGuns', '«Военные знания»', 'guns');
  MG('mgEnergy', '«Юный техник»', 'energy');
  MG('mgSurv', '«Охота и охотничье хозяйство»', 'survival');
  MG('mgSneak', '«Знание — сила»', 'sneak');
  MG('mgLock', '«Изобретатель и рационализатор»', 'lockpick');

  Z.ITEMS = I;
  Z.item = id => I[id];

  Z.RECIPES = [
    { id: 'molotov', at: 'bench', skill: ['explosives', 15], need: { bottle: 1, samogon: 1, rag: 1 }, out: ['molotov', 1] },
    { id: 'repairkit', at: 'bench', skill: ['repair', 40], need: { tape: 2, glue: 1, spring: 1, wrench: 1 }, keep: ['wrench'], out: ['repairkit', 1] },
    { id: 'tnt', at: 'bench', skill: ['explosives', 35], need: { tntRaw: 1, fuse: 1 }, out: ['tnt', 1] },
    { id: 'krona', at: 'bench', skill: ['science', 35], need: { capacitor: 1, wire: 1, can: 1 }, out: ['krona', 8] },
    { id: 'rivets', at: 'bench', skill: ['repair', 25], need: { can: 2, wire: 1 }, out: ['rivets', 12] },
    { id: 'stim', at: 'bench', skill: ['medicine', 55], need: { glass: 1, samogon: 1, apricot: 2 }, out: ['stim', 1] },
    { id: 'baibakCooked', at: 'fire', skill: ['survival', 10], need: { baibakRaw: 1 }, out: ['baibakCooked', 1] },
    { id: 'ukha', at: 'fire', skill: ['survival', 30], need: { somRaw: 1, potato: 1, dneprWater: 1 }, out: ['ukha', 1] },
    { id: 'omelet', at: 'fire', skill: ['survival', 20], need: { egg: 1 }, out: ['omelet', 1] },
    { id: 'koloradGrill', at: 'fire', skill: ['survival', 15], need: { larva: 2 }, out: ['koloradGrill', 1] },
    { id: 'broilerCooked', at: 'fire', skill: ['survival', 10], need: { broilerRaw: 1 }, out: ['salo', 1] },
    { id: 'boilWater', at: 'fire', skill: ['survival', 25], need: { dneprWater: 1 }, out: ['water', 1] }
  ];

  Z.itemValue = (id, cond) => {
    const d = I[id];
    if (!d) return 0;
    if (cond === undefined || d.stack) return d.v;
    return Math.max(1, Math.round(d.v * (0.25 + 0.75 * cond)));
  };
})(globalThis.FalloutZP = globalThis.FalloutZP || {});
