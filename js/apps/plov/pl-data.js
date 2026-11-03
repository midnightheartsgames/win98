(function (P) {
  'use strict';

  const ITEMS = {
    plov: { name: 'Плов', short: 'Плов', price: 700, kind: 'main' },
    achichuk: { name: 'Ачичук', short: 'Ачичук', price: 200, kind: 'extra' },
    samsa: { name: 'Самса', short: 'Самса', price: 250, kind: 'extra' },
    non: { name: 'Нон', short: 'Нон', price: 150, kind: 'extra' },
    teaBlack: { name: 'Чёрный чай', short: 'Чёрный', price: 100, kind: 'drink' },
    teaGreen: { name: 'Зелёный чай', short: 'Зелёный', price: 100, kind: 'drink' },
    compote: { name: 'Компот', short: 'Компот', price: 150, kind: 'drink' },
    veg: { name: 'Морковь с луком', short: 'Морковь', price: 0, kind: 'prep' }
  };
  const FOOD = ['plov', 'achichuk', 'samsa', 'non', 'teaBlack', 'teaGreen', 'compote'];
  const EXTRAS = ['achichuk', 'samsa', 'non'];
  const DRINKS = ['teaBlack', 'teaGreen', 'compote'];

  const STATIONS = [
    { id: 'teaBlack', kind: 'tea', item: 'teaBlack', x: 60, w: 34, need: ['teaBlack'], name: 'Чайник чёрного чая' },
    { id: 'teaGreen', kind: 'tea', item: 'teaGreen', x: 96, w: 34, need: ['teaGreen'], name: 'Чайник зелёного чая' },
    { id: 'compote', kind: 'compote', item: 'compote', x: 136, w: 44, need: ['compote'], name: 'Банка компота' },
    { id: 'prepVeg', kind: 'chop', item: 'veg', x: 186, w: 54, need: [], name: 'Доска для моркови' },
    { id: 'prepSalad', kind: 'chop', item: 'achichuk', x: 242, w: 54, need: ['achichuk'], name: 'Доска для ачичука' },
    { id: 'kazan', kind: 'kazan', x: 306, w: 120, need: [], name: 'Казан' },
    { id: 'tandoor', kind: 'tandoor', x: 436, w: 74, need: ['samsa', 'non'], name: 'Тандыр' },
    { id: 'stockSamsa', kind: 'stock', item: 'samsa', x: 514, w: 36, need: ['samsa'], name: 'Корзина самсы' },
    { id: 'stockNon', kind: 'stock', item: 'non', x: 552, w: 36, need: ['non'], name: 'Корзина лепёшек' },
    { id: 'pass0', kind: 'pass', x: 596, w: 34, need: [], name: 'Раздача' },
    { id: 'pass1', kind: 'pass', x: 630, w: 34, need: [], name: 'Раздача' },
    { id: 'pass2', kind: 'pass', x: 664, w: 34, need: [], name: 'Раздача' },
    { id: 'pass3', kind: 'pass', x: 698, w: 34, need: [], name: 'Раздача' },
    { id: 'bin', kind: 'bin', x: 740, w: 44, need: [], name: 'Ведро для объедков' }
  ];

  const TABLE_KINDS = {
    small: {
      cap: 2, rect: [-50, -24, 100, 44], hit: [-58, -66, 116, 94], use: [0, 42],
      seats: [{ dx: -38, dy: -4, dir: 'right', pose: 'sit' }, { dx: 38, dy: -4, dir: 'left', pose: 'sit' }],
      bubble: [0, -86]
    },
    topchan: {
      cap: 4, rect: [-80, -42, 160, 78], hit: [-82, -84, 164, 124], use: [0, 52],
      seats: [{ dx: -24, dy: -22, dir: 'down', pose: 'sitx' }, { dx: 24, dy: -22, dir: 'down', pose: 'sitx' }, { dx: -60, dy: 4, dir: 'right', pose: 'sitx' }, { dx: 60, dy: 4, dir: 'left', pose: 'sitx' }],
      bubble: [0, -100]
    }
  };

  const TABLES = [
    { id: 't1', n: 1, kind: 'small', x: 236, y: 302 },
    { id: 't2', n: 2, kind: 'topchan', x: 452, y: 306 },
    { id: 't3', n: 3, kind: 'small', x: 676, y: 302 },
    { id: 't4', n: 4, kind: 'topchan', x: 262, y: 458 },
    { id: 't5', n: 5, kind: 'small', x: 474, y: 454 },
    { id: 't6', n: 6, kind: 'topchan', x: 682, y: 458 }
  ];

  const QUEUE = [{ x: 60, y: 272 }, { x: 60, y: 334 }, { x: 60, y: 396 }, { x: 60, y: 458 }];
  const GATE = { x: -26, y: 508 };
  const TAKEAWAY = { x: 124, y: 506 };
  const DECOR = [{ x: 738, y: 506, w: 46, h: 28 }];

  const TUNE = {
    heroSpeed: 225, guestSpeed: 96, hearts: 5, queueCap: 4, handCap: 2, queueMax: 5,
    act: {
      kazanStart: 1.2, kazanVeg: 0.9, kazanRice: 1.0, kazanTake: 0.45, kazanClean: 2.0,
      chopVeg: 2.2, chopSalad: 1.8, teaBrew: 0.5, teaTake: 0.35, compotePour: 0.5, compoteRefill: 1.6,
      tandoorLoad: 1.0, tandoorTake: 0.6, tandoorClean: 1.4, stockTake: 0.3, passPut: 0.3, passTake: 0.3,
      bin: 0.4, order: 0.8, deliver: 0.35, pay: 0.5, clean: 0.7
    },
    kazan: { fry: 6, vegWindow: 14, zirvak: 7, riceWindow: 16, steam: 10, cap: 8 },
    tea: { brew: 4.5, pots: 2 },
    tandoor: { bake: 9, burnWindow: 12, stockCap: 8 },
    compote: { servings: 8 },
    decay: { queue: 0.085, waitOrder: 0.11, waitFood: 0.055, waitPay: 0.1, courier: 0.06 },
    bonus: { seat: 0.6, order: 0.4, deliver: 0.55, eat: 1.0 },
    read: 2.4, eatBase: 5, eatItem: 1.3,
    tipPerHead: 50, fastBase: 12, fastItem: 4, fastPct: 0.15,
    comboWindow: 5, comboMax: 6, comboStep: 10,
    angryPerHead: 150, vipFail: 1000, vipBonus: 800, courierFail: 500,
    burnKazan: 300, burnTandoor: 100, savings: 0.25
  };

  const TYPES = {
    neighbor: { name: 'Соседи', size: [1, 2], decay: 1, tip: 1, walk: 1, eat: 1, read: 1, extra: 1, drink: 1, drinks: { teaGreen: 2, teaBlack: 2, compote: 1 }, extras: { achichuk: 2, samsa: 1, non: 2 }, big: 0.3, second: 0.5 },
    elder: { name: 'Аксакалы', size: [1, 2], decay: 0.6, tip: 1.4, walk: 0.72, eat: 1.3, read: 1.3, extra: 0.8, drink: 1.3, drinks: { teaGreen: 5, teaBlack: 1 }, extras: { non: 3, achichuk: 1, samsa: 1 }, big: 0, second: 0.8 },
    student: { name: 'Студенты', size: [1, 3], decay: 0.9, tip: 0.6, walk: 1.2, eat: 0.8, read: 0.8, extra: 0.6, drink: 0.8, drinks: { teaBlack: 2, teaGreen: 1, compote: 2 }, extras: { samsa: 3, non: 1, achichuk: 1 }, big: 0.3, second: 0.3 },
    worker: { name: 'Строители', size: [2, 4], decay: 1.1, tip: 0.9, walk: 1, eat: 0.85, read: 0.8, extra: 1.1, drink: 1, drinks: { teaBlack: 3, teaGreen: 1, compote: 1 }, extras: { samsa: 3, non: 2, achichuk: 1 }, big: 0.7, second: 0.4 },
    family: { name: 'Семья', size: [3, 4], decay: 1.15, tip: 1.1, walk: 0.85, eat: 1.2, read: 1.2, extra: 1.2, drink: 1.2, drinks: { compote: 4, teaGreen: 1, teaBlack: 1 }, extras: { achichuk: 2, non: 2, samsa: 2 }, big: 0.5, second: 0.5 },
    tourist: { name: 'Туристы', size: [2, 3], decay: 0.95, tip: 1.3, walk: 0.9, eat: 1, read: 1.4, extra: 1.3, drink: 1.1, drinks: { teaGreen: 2, compote: 2, teaBlack: 1 }, extras: { samsa: 2, non: 2, achichuk: 2 }, big: 0.2, second: 0.6 },
    business: { name: 'Бизнесмен', size: [1, 2], decay: 1.5, tip: 1.8, walk: 1.15, eat: 0.7, read: 0.6, extra: 0.9, drink: 1, drinks: { teaBlack: 3, teaGreen: 1 }, extras: { achichuk: 3, samsa: 1, non: 1 }, big: 0, second: 0.2 },
    critic: { name: 'Критик', size: [1, 1], decay: 1.25, tip: 3, walk: 0.9, eat: 1.1, read: 1.5, extra: 2, drink: 2, drinks: { teaGreen: 3, teaBlack: 1, compote: 1 }, extras: { achichuk: 2, samsa: 1, non: 1 }, big: 0, second: 0, vip: true },
    courier: { name: 'Тойчи', size: [1, 1], decay: 0.9, tip: 1.5, walk: 1.1, eat: 0, read: 0, extra: 0, drink: 0, drinks: {}, extras: {}, big: 0, second: 0, courier: true }
  };

  const LEVELS = [
    {
      n: 1, title: 'Открытие',
      story: 'Бахтиёр-ака сорок лет варил плов в этом дворе. Сегодня он отдаёт казан молодому ошпазу, а сам садится у ворот и смотрит. Первый казан он уже сварил, соседи подходят к воротам.',
      news: 'Плов, столы и казан',
      items: ['plov'], tables: ['t1', 't2', 't4', 't5'],
      groups: 5, sizeMax: 2, mix: { neighbor: 1 },
      waves: [[1.5, 1, 0], [30, 2, 26], [80, 2, 24]],
      decay: 0.5, kazanStart: 3, extra: 0, drink: 0, maxItems: 1, second: 0,
      target: 2600, expert: 4300, tutorial: true
    },
    {
      n: 2, title: 'Чай для соседей',
      story: 'Вчера махалля ела плов, сегодня пришла за чаем. После плова тут без чая никто не уходит, а чайника в самоваре два: чёрный и зелёный.',
      news: 'Чёрный и зелёный чай',
      items: ['plov', 'teaBlack', 'teaGreen'], tables: ['t1', 't2', 't4', 't5'],
      groups: 7, sizeMax: 2, mix: { neighbor: 3, elder: 2, student: 1 },
      waves: [[2, 2, 14], [32, 3, 30], [84, 2, 22]],
      decay: 0.62, kazanStart: 6, extra: 0, drink: 0.9, maxItems: 2, second: 0,
      target: 5000, expert: 7300,
      tips: [{ when: 'item:teaBlack', id: 'tea', arrow: 'teaBlack' }, { when: 'item:teaGreen', id: 'tea', arrow: 'teaGreen' }]
    },
    {
      n: 3, title: 'Ачичук',
      story: 'На Алайском базаре подешевели помидоры, и гости вспомнили про ачичук. Помидоры, лук, соль и немного райхона, и всё режут прямо перед подачей.',
      news: 'Салат ачичук',
      items: ['plov', 'teaBlack', 'teaGreen', 'achichuk'], tables: ['t1', 't2', 't4', 't5'],
      groups: 8, sizeMax: 3, mix: { neighbor: 3, elder: 1, student: 2, worker: 2 },
      waves: [[2, 2, 12], [28, 3, 26], [70, 1, 0], [90, 2, 20]],
      decay: 0.72, kazanStart: 6, extra: 0.6, drink: 0.85, maxItems: 3, second: 0,
      target: 6600, expert: 9600,
      tips: [{ when: 'item:achichuk', id: 'salad', arrow: 'prepSalad' }]
    },
    {
      n: 4, title: 'Жаркий полдень',
      story: 'Сорок градусов в тени. Строители с соседней улицы пришли в обед всей бригадой, семьи просят холодного компота. Бахтиёр-ака вытащил из сарая ещё один стол.',
      news: 'Компот и большие компании',
      items: ['plov', 'teaBlack', 'teaGreen', 'achichuk', 'compote'], tables: ['t1', 't2', 't3', 't4', 't5'],
      groups: 10, sizeMax: 4, mix: { neighbor: 2, worker: 3, family: 3, student: 1, elder: 1 },
      waves: [[2, 2, 16], [34, 5, 34], [90, 1, 0], [108, 2, 22]],
      decay: 0.8, kazanStart: 6, extra: 0.55, drink: 0.9, maxItems: 3, second: 0,
      target: 9300, expert: 13600,
      tips: [{ when: 'start', id: 'compote', arrow: 'compote' }, { when: 'size:3', id: 'topchan', arrow: 'firstTopchan' }, { when: 'handsFull', id: 'pass', arrow: 'pass0' }]
    },
    {
      n: 5, title: 'Самса из тандыра',
      story: 'Глиняный тандыр у кухни наконец просох. Самсу в нём пекут на стенке, по четыре штуки за раз. Передержишь, и тесто сгорит.',
      news: 'Тандыр и самса',
      items: ['plov', 'teaBlack', 'teaGreen', 'achichuk', 'compote', 'samsa'], tables: ['t1', 't2', 't3', 't4', 't5'],
      groups: 10, sizeMax: 4, mix: { neighbor: 2, worker: 3, family: 2, student: 2, tourist: 1 },
      waves: [[2, 2, 14], [30, 3, 24], [66, 1, 0], [84, 4, 34]],
      decay: 0.82, kazanStart: 6, extra: 0.65, drink: 0.85, maxItems: 3, second: 0,
      target: 9800, expert: 14200,
      tips: [{ when: 'start', id: 'tandoor', arrow: 'tandoor' }]
    },
    {
      n: 6, title: 'Горячий нон',
      story: 'Какой плов без лепёшки. Нон тоже пекут в тандыре, и теперь в него идут сразу две самсы и две лепёшки. Туристы из гостиницы «Караван» фотографируют каждую.',
      news: 'Лепёшки нон',
      items: ['plov', 'teaBlack', 'teaGreen', 'achichuk', 'compote', 'samsa', 'non'], tables: ['t1', 't2', 't3', 't4', 't5'],
      groups: 11, sizeMax: 4, mix: { neighbor: 2, worker: 2, family: 2, elder: 1, tourist: 3 },
      waves: [[2, 2, 14], [30, 3, 26], [70, 1, 0], [90, 3, 28], [135, 2, 14]],
      decay: 0.86, kazanStart: 6, extra: 0.7, drink: 0.85, maxItems: 4, second: 0,
      target: 10800, expert: 15300,
      tips: [{ when: 'start', id: 'non', arrow: 'stockNon' }]
    },
    {
      n: 7, title: 'Чай после плова',
      story: 'Гости стали засиживаться. Поели плова, а уходить не хотят: ещё чайник, ещё компот, ещё самсу. Во дворе теперь шесть столов.',
      news: 'Второй заказ за столом',
      items: ['plov', 'teaBlack', 'teaGreen', 'achichuk', 'compote', 'samsa', 'non'], tables: ['t1', 't2', 't3', 't4', 't5', 't6'],
      groups: 11, sizeMax: 4, mix: { neighbor: 3, worker: 2, family: 2, elder: 2, tourist: 2, student: 1 },
      waves: [[2, 3, 18], [40, 3, 28], [88, 1, 0], [106, 2, 16], [140, 2, 16]],
      decay: 0.9, kazanStart: 6, extra: 0.6, drink: 0.85, maxItems: 4, second: 0.4,
      target: 10800, expert: 14800,
      tips: [{ when: 'second', id: 'second', arrow: 'secondTable' }]
    },
    {
      n: 8, title: 'Деловые люди',
      story: 'Напротив открылся офис фирмы «Хлопок-Трейд». Люди в пиджаках приходят с мобильниками, ждать не любят и платят щедро.',
      news: 'Нетерпеливые бизнесмены',
      items: ['plov', 'teaBlack', 'teaGreen', 'achichuk', 'compote', 'samsa', 'non'], tables: ['t1', 't2', 't3', 't4', 't5', 't6'],
      groups: 11, sizeMax: 4, mix: { business: 3, neighbor: 2, worker: 2, family: 1, tourist: 1, elder: 1 },
      waves: [[2, 2, 12], [28, 3, 24], [66, 1, 0], [84, 3, 26], [128, 2, 14]],
      decay: 0.92, kazanStart: 6, extra: 0.6, drink: 0.8, maxItems: 4, second: 0.4,
      target: 10200, expert: 13800,
      tips: [{ when: 'type:business', id: 'business', arrow: 'queue' }]
    },
    {
      n: 9, title: 'Визит критика',
      story: 'Газета «Ош-хабар» прислала критика. Он пишет про чайханы уже двадцать лет и ни разу не поставил пять звёзд. Приходит без предупреждения и в очереди не стоит.',
      news: 'VIP: кулинарный критик',
      items: ['plov', 'teaBlack', 'teaGreen', 'achichuk', 'compote', 'samsa', 'non'], tables: ['t1', 't2', 't3', 't4', 't5', 't6'],
      groups: 10, sizeMax: 4, mix: { neighbor: 2, business: 2, worker: 2, family: 2, tourist: 2, elder: 1 },
      special: [{ type: 'critic', at: 30 }, { type: 'critic', at: 118 }],
      waves: [[2, 3, 16], [38, 3, 28], [84, 1, 0], [104, 2, 16], [142, 1, 0]],
      decay: 0.9, kazanStart: 6, extra: 0.55, drink: 0.85, maxItems: 4, second: 0.4,
      target: 11500, expert: 15400,
      tips: [{ when: 'type:critic', id: 'critic', arrow: 'queue' }]
    },
    {
      n: 10, title: 'Свадебный плов',
      story: 'В махалле три свадьбы за один день. Тойчи ездят за пловом прямо к воротам, гостей во дворе столько, что Бахтиёр-ака сам встал разливать компот. Не встал, конечно. Но очень хотел.',
      news: 'Заказы на свадьбу',
      items: ['plov', 'teaBlack', 'teaGreen', 'achichuk', 'compote', 'samsa', 'non'], tables: ['t1', 't2', 't3', 't4', 't5', 't6'],
      groups: 11, sizeMax: 4, mix: { neighbor: 2, business: 2, worker: 2, family: 3, tourist: 2, elder: 1, student: 1 },
      special: [{ type: 'courier', at: 24, plov: 2 }, { type: 'courier', at: 92, plov: 3 }, { type: 'critic', at: 118 }, { type: 'courier', at: 156, plov: 3 }],
      waves: [[2, 3, 16], [38, 3, 28], [84, 2, 10], [108, 2, 16], [146, 1, 0]],
      decay: 0.92, kazanStart: 6, extra: 0.55, drink: 0.85, maxItems: 4, second: 0.4,
      target: 15000, expert: 19900,
      tips: [{ when: 'type:courier', id: 'courier', arrow: 'courier' }]
    }
  ];

  const UPGRADES = [
    { id: 'boots', name: 'Мягкие ичиги', from: 1, costs: [1000, 2800], desc: 'Кожаные сапожки без каблука. Ошпаз ходит быстрее.', levels: ['Шаг +12%', 'Шаг +24%'] },
    { id: 'pchak', name: 'Пчак из Чуста', from: 1, costs: [800, 2200], desc: 'Острый нож с костяной ручкой. Морковь и ачичук режутся быстрее.', levels: ['Нарезка на 20% быстрее', 'Нарезка на 36% быстрее'] },
    { id: 'kazan', name: 'Большой казан', from: 2, costs: [1800, 4200], desc: 'Чугунный казан пошире. С каждой закладки выходит больше плова.', levels: ['10 ляганов с закладки', '12 ляганов с закладки'] },
    { id: 'saxaul', name: 'Саксауловые дрова', from: 2, costs: [1500, 3600], desc: 'Саксаул горит жарко и ровно. Все этапы плова идут быстрее.', levels: ['Казан на 15% быстрее', 'Казан на 28% быстрее'] },
    { id: 'samovar', name: 'Большой самовар', from: 2, costs: [1200], desc: 'Тульский самовар на десять литров. Чай заваривается быстрее.', levels: ['Чай на 40% быстрее'] },
    { id: 'radio', name: 'Магнитофон', from: 3, costs: [1400], desc: 'Кассета с дутаром и дойрой. Гостям у ворот веселее ждать.', levels: ['Очередь терпит на 30% дольше'] },
    { id: 'kurpacha', name: 'Новые курпачи', from: 4, costs: [2000], desc: 'Мягкие стёганые подстилки на топчаны и табуреты. За столом ждать легче.', levels: ['За столами терпят на 20% дольше'] },
    { id: 'tandoor', name: 'Новый тандыр', from: 5, costs: [1700], desc: 'Толстые стенки держат жар. Печёт быстрее и не так быстро сжигает.', levels: ['Выпечка на 25% быстрее, горит в 1,5 раза позже'] },
    { id: 'sign', name: 'Вывеска с лампочками', from: 6, costs: [2600], desc: 'Разноцветные лампочки над воротами. Гости добрее и оставляют больше чаевых.', levels: ['Чаевые +25%'] }
  ];

  const TUTORIAL = [
    { id: 'hello', click: true },
    { id: 'seat', arrow: 'queue', until: 'seat', hold: true },
    { id: 'order', arrow: 'firstTable', until: 'order', hold: true },
    { id: 'plov', arrow: 'kazan', until: 'takePlov', hold: true },
    { id: 'serve', arrow: 'firstTable', until: 'deliver', hold: true },
    { id: 'eat', arrow: 'firstTable', until: 'pay', hold: true },
    { id: 'clean', arrow: 'dirtyTable', until: 'clean', hold: true },
    { id: 'queue', click: true },
    { id: 'kazan1', arrow: 'kazan', trigger: 'kazanEmpty', until: 'kazanStart' },
    { id: 'veg', arrow: 'prepVeg', until: 'veg' },
    { id: 'kazanVeg', arrow: 'kazan', trigger: 'needVeg', until: 'kazanVeg' },
    { id: 'rice', arrow: 'kazan', trigger: 'needRice', until: 'rice' },
    { id: 'steam', click: true }
  ];

  const TEXT = {
    title: 'Где плов?',
    mentor: 'Бахтиёр-ака',
    tut: {
      hello: 'Ассалому алайкум, болам! Сорок лет я варил здесь плов. Теперь казан твой. Первый я уже сварил, а вон и гости идут.',
      seat: 'Гости у ворот. Щёлкни по ним, потом по свободному столу. Можно и перетащить мышкой.',
      order: 'Рука поднята, значит, выбрали. Щёлкни по их столу, ошпаз подойдёт и запишет заказ.',
      plov: 'Плов берут из казана. Щёлкни по казану, ошпаз наложит ляган.',
      serve: 'Теперь неси. Щёлкни по столу с гостями.',
      eat: 'Пусть едят спокойно. Когда над столом появится монета, подойди за деньгами.',
      clean: 'Ушли довольные. Стол грязный, щёлкни по нему, ошпаз уберёт посуду.',
      queue: 'Ошпаз помнит до пяти дел подряд: щёлкай, куда идти, по порядку. Правая кнопка отменяет всё. А можно и пешком: стрелки или WASD, действие на Пробел.',
      kazan1: 'Казан пустой. Щёлкни по нему: ошпаз раскалит масло и заложит мясо.',
      veg: 'Мясо жарится. А ты пока нарежь морковь с луком, доска слева от казана.',
      kazanVeg: 'Мясо подрумянилось! Клади морковь с луком, пока не пригорело.',
      rice: 'Зирвак готов. Щёлкни по казану ещё раз, ошпаз засыплет рис и зиру.',
      steam: 'Теперь плов томится под крышкой. Поднимется пар, значит, готов. Только не зевай: мясо и зирвак без присмотра сгорят.'
    },
    tips: {
      tea: 'Чай заваривают в самоваре. Щёлкни по чайнику, и через пару секунд будет два чайника. Бери и неси. Зелёный в белом чайнике, чёрный в коричневом.',
      salad: 'Ачичук режут на второй доске: помидоры, лук, соль. Ошпаз режет его за пару секунд.',
      compote: 'Сегодня жарко, все хотят компот. Банка у самовара, в ней восемь порций. Пустую банку надо наполнить заново.',
      topchan: 'Троих и четверых сажай только на топчаны. За маленький стол помещаются двое.',
      pass: 'Руки заняты? Поставь блюдо на раздачу справа, потом заберёшь. А ненужное отправляй в ведро.',
      tandoor: 'В тандыр влезает четыре самсы. Загрузи его, а когда самса зарумянится, вынь её в корзину. Корзина рядом, из неё и берут.',
      non: 'Теперь в тандыр идут две самсы и две лепёшки сразу. Лепёшки и самса ложатся каждая в свою корзину.',
      second: 'Эти поели и снова подняли руку. После плова часто просят ещё чаю или самсы. Прими второй заказ.',
      business: 'Бизнесмен! Ждать он не умеет, зато платит вдвое. Сажай его первым.',
      critic: 'Критик из «Ош-хабар». Проходит без очереди, ждёт недолго. Накорми быстро, и газета напишет про нас хорошо.',
      courier: 'Тойчи за свадебным пловом! Ждёт у ворот, ему нужно несколько ляганов сразу. Неси плов прямо к нему.'
    },
    guests: {
      neighbor: 'Обычные гости махалли. Плов, чай, иногда салат.',
      elder: 'Ждут дольше всех, любят зелёный чай и лепёшки. Хорошие чаевые.',
      student: 'Едят быстро, платят мало, берут самсу.',
      worker: 'Приходят бригадой, часто заказывают два лягана.',
      tourist: 'Долго выбирают и пробуют всё подряд.',
      family: 'Трое или четверо, дети быстро устают ждать. Любят компот.',
      business: 'Спешит, но платит почти вдвое больше чаевых.',
      critic: 'Проходит без очереди. Довольный критик приносит 800 сум сверху.',
      courier: 'Ждёт у ворот и забирает несколько ляганов плова на свадьбу.'
    },
    lines: {
      angry: ['Ошпаз, где плов?!', 'Всё, мы уходим!', 'Сколько можно ждать?', 'Пойдём в другую чайхану.'],
      waitPlov: ['Ошпаз, где плов?', 'Ну скоро там?', 'Мы ждём...', 'Плов будет?'],
      happy: ['Рахмат!', 'Вкусно!', 'Зайдём ещё!', 'Как у мамы!', 'Зўр!'],
      elder: ['Не спеши, болам.', 'Рахмат, болам!'],
      business: ['Алло? Да, обедаю.', 'Я на связи.', 'Быстрее, у меня встреча.'],
      critic: ['Хм.', 'Запишем...', 'Недурно.'],
      courier: ['Плов на свадьбу!', 'Жених ждёт!'],
      kid: ['Мам, я есть хочу!', 'А самса будет?']
    },
    nope: {
      busyKazan: 'Плов ещё готовится',
      needVeg: 'Нужна морковь с луком',
      handsFull: 'Руки заняты',
      nothing: 'Нечего нести',
      notOrdered: 'Этого не заказывали',
      brewing: 'Чай заваривается',
      baking: 'Тандыр занят',
      stockFull: 'Корзина полна',
      empty: 'Пусто',
      emptyStock: 'Пусто, испеки в тандыре',
      eating: 'Гости едят',
      reading: 'Гости выбирают',
      walking: 'Гости ещё идут',
      dirty: 'Стол грязный',
      taken: 'Стол занят',
      small: 'Не поместятся',
      noGroup: 'Сначала выбери гостей',
      passFull: 'Некуда поставить',
      passEmpty: 'Здесь пусто',
      clean: 'Стол чистый',
      tooFar: 'Далеко'
    }
  };

  Object.assign(P, { ITEMS, FOOD, EXTRAS, DRINKS, STATIONS, TABLE_KINDS, TABLES, QUEUE, GATE, TAKEAWAY, DECOR, TUNE, TYPES, LEVELS, UPGRADES, TUTORIAL, TEXT });
  if (typeof module !== 'undefined' && module.exports) module.exports = P;
})(globalThis.Plov = globalThis.Plov || {});
