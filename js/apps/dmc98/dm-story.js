(function (S) {
  'use strict';
  const { lerp, clamp } = S;
  const DT = 1 / 60, PI = Math.PI;
  const N = 'Неро', DA = 'Данте', KY = 'Кирие', CR = 'Кредо', SA = 'Санктус', AG = 'Агнус', BE = 'Бериал', BA = 'Баэль';

  const CUTS = {
    m1_intro: {
      actors: { nero: ['nero', 4, -15.55, 0, { pose: 'sit' }], kyrie: ['kyrie', 0, 17.6, PI, { y: 1.2, pose: 'sing' }], sanctus: ['sanctus', 0, 20.2, PI, { y: 1.2, pose: 'pray' }], credo: ['credo', -5, 13.4, 0.4, { pose: 'arms' }], k1: ['knight', -7, 18.5, PI, { y: 1.2, pose: 'arms' }], k2: ['knight', 7, 18.5, PI, { y: 1.2, pose: 'arms' }], dante: ['dante', 0, 16.8, 0, { y: 16, hide: true }] },
      player: [0, 6, 0],
      shots: [
        { d: 5, cam: [0, 7, -24, 0, 3, 18], to: [0, 6.2, -18, 0, 3, 18], fade: 'in', music: 'church', say: ['', 'Фортуна. Остров, где Спарду, тёмного рыцаря, предавшего свой род ради людей, почитают как бога.'] },
        { d: 4.5, cam: [1.6, 2.7, 14, 0, 2.7, 17.6], to: [1.2, 2.8, 14.6, 0, 2.7, 17.6], say: [KY, '♪ Сквозь тьму и печаль к свету, что хранит нас... ♪'] },
        { d: 4.5, cam: [6.8, 1.9, -12.4, 4, 1.3, -15.6], say: [N, '(Опять эти гимны. Я здесь только ради неё.)'] },
        { d: 4.5, cam: [-2.8, 1.9, 11, -5, 1.6, 13.4], say: [CR, '(Неро опять сидит на последнем ряду. Хоть пришёл вовремя.)'] },
        { d: 5, cam: [0, 2.6, 15.2, 0, 2.9, 20.2], to: [0, 2.8, 15.8, 0, 2.9, 20.2], do: { kyrie: { to: [-3, 18.5], y: 1.2, walk: true, pose: 'arms' }, sanctus: { pose: 'talk' } }, say: [SA, 'Братья и сёстры! Две тысячи лет назад Спарда восстал против своего рода, чтобы спасти человечество...'] },
        { d: 4.5, cam: [2, 2.4, 15.8, 0, 2.9, 20.2], say: [SA, '...и мы, Орден Меча, храним его завет. Да пребудет с нами...'] },
        { d: 1.8, cam: [0, 4, 8, 0, 13, 15], do: { dante: { show: true, fly: [0, 1.2, 16.8], anim: 'helm' } }, fx: [{ t: 'glassburst', x: 0, y: 15.5, z: 15 }, { t: 'flash', c: [1, 1, 1], a: 0.8 }], sfx: 'glass', shake: 0.6 },
        { d: 2.4, cam: [3, 2.5, 13.2, 0, 2, 18], do: { dante: { anim: 'gunsE' }, sanctus: { pose: 'down', y: 1.2 } }, sfx: ['gunE', 'gunE', 'gunE'], say: [KY, 'Нет!..'] },
        { d: 2.6, cam: [0, 3.5, 11, 0, 2, 17.5], do: { k1: { to: [-1.5, 17.6], y: 1.2, walk: true, pose: null, anim: 'overE' }, k2: { to: [1.5, 17.6], y: 1.2, walk: true, pose: null, anim: 'overE' }, dante: { anim: 'a4', at: 0.5 } } },
        { d: 2.4, cam: [-1, 2.4, 14.5, -3.3, 2.2, 18.8], do: { k1: { pose: 'down', at: [-3.5, 18.4] }, k2: { pose: 'down', at: [3.5, 18.4] }, credo: { at: [-3.8, 19.2], y: 1.2, pose: 'point', face: 0.4 }, kyrie: { pose: 'pray' } }, say: [CR, 'Кирие, назад!'] },
        { d: 3, cam: [6.4, 2.5, -10, 4, 1.5, -15.6], do: { nero: { pose: null, combat: true } }, say: [N, 'Похоже, проповедь окончена.'] },
        { d: 2.2, cam: [-6, 3, -4, 0, 1.5, 5], do: { nero: { to: [0, 6], jump: 3, anim: 'hop' }, dante: { to: [0, 12], y: 0, jump: 1.5, anim: 'hop' } }, sfx: 'jump' },
        { d: 3, cam: [-2.5, 1.9, 3.4, 0, 1.6, 12], do: { dante: { face: PI, anim: null, combat: true }, nero: { face: 0, anim: null } }, say: [CR, 'Неро! Задержи его!'] },
        { d: 2.4, cam: [1.4, 1.8, 3.6, 0, 1.6, 6], say: [N, 'С удовольствием.'] },
        { d: 3.6, cam: [1.8, 1.9, 14.4, 0, 1.6, 6], do: { dante: { anim: 'taunt' } }, say: [DA, 'Ну давай, малыш. Посмотрим, на что ты способен.'] },
        { d: 3, cam: [0, 1.5, 9, 0, 1.5, 6], to: [0, 1.6, 8.3, 0, 1.5, 6], do: { nero: { anim: 'dt' } }, fx: [{ t: 'armglow', who: 'nero' }], say: [N, 'Ты испортил Кирие праздник. Сейчас пожалеешь.'] }
      ]
    },
    m1_end: {
      actors: { nero: ['nero', 0, 6.8, 0, { combat: true }], dante: ['dante', 0, 10, PI, { pose: 'down' }], credo: ['credo', -3, 17, PI, { y: 1.2, hide: true }] },
      player: [0, 6.8, 0],
      shots: [
        { d: 3, cam: [3, 1.5, 6, 0, 0.8, 10], fade: 'in', music: 'none', say: [DA, 'Ха-ха... А ты неплох, малыш.'] },
        { d: 3, cam: [-2.5, 1.8, 7, 0, 1.3, 10], do: { dante: { pose: null, anim: 'getup' } }, say: [DA, 'Эта рука... Мы с тобой одной породы.'] },
        { d: 2.6, cam: [1.5, 1.7, 9.2, 0, 1.6, 6.8], say: [N, 'Я ничем на тебя не похож.'] },
        { d: 2.4, cam: [0, 2, 4, 0, 7, 14], do: { dante: { fly: [0, 17, 15], anim: 'hop' } }, sfx: 'jump', say: [DA, 'Ещё увидимся, малыш!'] },
        { d: 4.2, cam: [-5, 2.2, 5, -1.5, 1.5, 9], do: { dante: { hide: true }, credo: { show: true, to: [-2, 11], y: 0, walk: true } }, say: [CR, 'Неро! Он ушёл к замку Фортуны. Найди его. Кирие я отведу в безопасное место.'] },
        { d: 2.8, cam: [1.5, 1.7, 4.5, 0, 1.6, 6.8], do: { credo: { pose: 'talk' } }, say: [N, 'Как скажешь, капитан.'], fade: 'out' }
      ]
    },
    m2_intro: {
      actors: { nero: ['nero', 0, -8, 0], kyrie: ['kyrie', 0, -6.4, PI, { pose: 'talk' }], credo: ['credo', -6, -12, 1, { pose: 'arms' }], k1: ['knight', -7.5, -13, 1], k2: ['knight', -7.8, -10.6, 1.2], s1: ['scarecrow', -5, 2, PI, { hide: true, y: 12 }], s2: ['scarecrow', 4, 1, PI, { hide: true, y: 12 }], s3: ['scarecrowLeg', 0, 5, PI, { hide: true, y: 12 }] },
      player: [0, -8, 0],
      shots: [
        { d: 4, cam: [10, 6, -18, 0, 1, -6], to: [8, 5, -16, 0, 1, -6], fade: 'in', music: 'explore', say: ['', 'Площадь у Оперы. Час спустя.'] },
        { d: 3.8, cam: [1, 1.8, -10, 0, 1.5, -6.4], say: [KY, 'Неро, твоя рука... Она снова светится.'] },
        { d: 4, cam: [0.8, 1.7, -4.6, 0, 1.5, -8], do: { nero: { pose: 'arms' } }, say: [N, 'Пустяки. Тебе нельзя здесь оставаться, Кирие.'] },
        { d: 5, cam: [-2, 1.8, -9, -6, 1.5, -12], do: { credo: { pose: 'talk' } }, say: [CR, 'Кирие, идём. Рыцари проводят нас. Неро — Данте ушёл к замку. Не подведи Орден.'] },
        { d: 3.4, cam: [0, 2, -11.2, 0, 1.4, -6.4], do: { credo: { pose: 'arms' } }, say: [KY, 'Будь осторожен... Обещаешь?'] },
        { d: 2.4, cam: [0.8, 1.7, -4.6, 0, 1.5, -8], do: { nero: { pose: null } }, say: [N, 'Обещаю.'] },
        { d: 3.6, cam: [4, 2, -12, -8, 1.2, -10], do: { kyrie: { to: [-22, -12], walk: true, pose: null }, credo: { to: [-22, -13.5], walk: true, pose: null }, k1: { to: [-23, -14], walk: true }, k2: { to: [-23, -10], walk: true } } },
        { d: 2.6, cam: [0, 1.2, -12, 0, 2, 0], do: { s1: { show: true, fly: [-5, 0, 2] }, s2: { show: true, fly: [4, 0, 1] }, s3: { show: true, fly: [0, 0, 5] }, kyrie: { hide: true }, credo: { hide: true }, k1: { hide: true }, k2: { hide: true } }, sfx: 'thud', shake: 0.5, fx: [{ t: 'spawnfx', x: -5, y: 0, z: 2 }, { t: 'spawnfx', x: 4, y: 0, z: 1 }, { t: 'spawnfx', x: 0, y: 0, z: 5 }] },
        { d: 3, cam: [1, 1.6, -5.5, 0, 1.6, -8], do: { nero: { combat: true, anim: 'taunt' } }, say: [N, 'Опять эти чучела. Ладно, разомнусь.'] }
      ]
    },
    mega_intro: {
      actors: { mega: ['mega', 0, 10, PI, { y: 9 }] },
      shots: [
        { d: 2, cam: [2.5, 0.8, 3, 0, 3, 10], do: { mega: { fly: [0, 0, 10] } }, sfx: 'thud', shake: 0.8, fx: [{ t: 'shock', x: 0, y: 0, z: 10, r: 3 }] },
        { d: 3, cam: [0, 2.2, 5.5, 0, 3.2, 10], to: [0, 2.5, 6.2, 0, 3.2, 10], do: { mega: { anim: 'attack' } }, say: [N, 'Этот хотя бы покрупнее.'] }
      ]
    },
    evil_legacy: {
      actors: { nero: ['nero', 0, 21.3, 0, { y: 0.9 }], relic: ['obj:evilLegacy', 0, 23, 0, { y: 2.3 }] },
      player: [0, 21, PI],
      shots: [
        { d: 2.6, cam: [2.5, 2.4, 19, 0, 2.2, 23], do: { nero: { pose: 'reach' } }, sfx: 'keyitem' },
        { d: 3.2, cam: [-1.5, 1.9, 19.4, 0, 1.9, 21.3], do: { relic: { hide: true }, nero: { pose: null, anim: 'dt' } }, fx: [{ t: 'flash', c: [0.4, 0.6, 1], a: 0.8 }, { t: 'armglow', who: 'nero' }], say: [N, 'Рука... она будто впитала его силу.'] },
        { d: 4.5, cam: [-1.5, 1.9, 19.4, 0, 1.9, 21.3], say: ['', 'Получено: «Злое наследие». Рука дьявола теперь цепляется за синие огни в воздухе — Hell Bound (L).'] },
        { d: 2.8, cam: [0, 3, 12, 0, 6, 0], fx: [{ t: 'glassburst', x: -9.5, y: 7, z: -2 }, { t: 'glassburst', x: 9.5, y: 7, z: 6 }], sfx: 'glass', shake: 0.3, say: [N, 'Ну конечно. Как же без вас.'] }
      ]
    },
    berial_intro: {
      actors: { nero: ['nero', 0, -10, 0, { combat: true }], berial: ['berial', 0, 10, PI, { y: -7 }] },
      player: [0, -10, 0],
      shots: [
        { d: 2.6, cam: [0, 2, -14, 0, 3, 6], sfx: 'rumble', shake: 0.6, fx: [{ t: 'shock', x: 0, y: 0, z: 10, r: 5, fire: true }] },
        { d: 3.2, cam: [7, 2, -2, 0, 5, 10], do: { berial: { fly: [0, 0, 10], anim: 'roar' } }, sfx: 'roarB', shake: 0.8, fx: [{ t: 'explode', x: 0, y: 1, z: 10, r: 4, kind: 'fire' }] },
        { d: 4.4, cam: [0, 4, 2.5, 0, 6.5, 10], do: { berial: { anim: null } }, say: [BE, 'Человек... Ты посмел ступить во владения Бериала?'] },
        { d: 4, cam: [3, 7.5, 6, 0, 1.5, -10], say: [BE, 'Моё пламя испепелит тебя, как и всех, кто приходил до тебя!'] },
        { d: 3.4, cam: [1.2, 1.7, -7.5, 0, 1.6, -10], do: { nero: { anim: 'taunt' } }, say: [N, 'Большой, горячий и болтливый. Давай покончим с этим.'] }
      ]
    },
    m2_end: {
      actors: { nero: ['nero', 0, 0, 0, { combat: true }], berial: ['berial', 0, 8, PI, { anim: 'dead', animU: 1 }] },
      player: [0, 0, 0],
      shots: [
        { d: 4.4, cam: [7, 3, -2, 0, 2.5, 8], fade: 'in', say: [BE, 'Невозможно... Человек не может... Эта сила... кровь... Спарды...'] },
        { d: 2.6, cam: [7, 3.4, -1, 0, 2.5, 8], do: { berial: { hide: true } }, fx: [{ t: 'explode', x: 0, y: 2, z: 8, r: 5, kind: 'fire' }, { t: 'smoke', x: 0, y: 2, z: 8 }], sfx: 'boom' },
        { d: 3.4, cam: [1.2, 1.7, 2.3, 0, 1.5, 0], do: { nero: { pose: 'reach' } }, say: [N, 'Кровь Спарды? Бредит перед смертью.'] },
        { d: 4, cam: [-2, 1.8, -3, 0, 4, 20], do: { nero: { pose: null } }, say: [N, 'Замок Фортуны за этими скалами. Данте где-то там.'], fade: 'out' }
      ]
    },
    m4_intro: {
      actors: { nero: ['nero', 0, 10.6, 0, { pose: 'talk' }], f1: ['frost', -4, -4, 0, { hide: true, y: 8 }], f2: ['frost', 4, -4, 0, { hide: true, y: 8 }] },
      player: [0, 10, PI],
      shots: [
        { d: 4, cam: [6, 4, 2, 0, 2, 9], to: [5, 3.6, 3, 0, 2, 9], fade: 'in', music: 'castle', say: ['', 'Замок Фортуны. Библиотека Ордена.'] },
        { d: 5, cam: [1.2, 2.1, 9.2, 0, 1.4, 11.3], say: [N, '«...и когда пробудится Спаситель, врата ада падут, и настанет вечный мир». Спаситель?'] },
        { d: 3.6, cam: [-1.5, 1.8, 12.6, 0, 1.6, 10.6], say: [N, 'Об этом на проповедях не рассказывают.'] },
        { d: 2.6, cam: [0, 3, 4, 0, 1, -4], do: { nero: { pose: null, face: PI, combat: true }, f1: { show: true, fly: [-4, 0, -4] }, f2: { show: true, fly: [4, 0, -4] } }, sfx: 'freeze', fx: [{ t: 'shatter', x: -4, y: 1, z: -4 }, { t: 'shatter', x: 4, y: 1, z: -4 }], shake: 0.3 },
        { d: 3.4, cam: [-5.5, 1.2, -1, -4, 1.9, -4], do: { f1: { anim: 'spit' } }, sfx: 'roarS', say: [N, 'Холодновато для библиотеки. Посмотрим, как вы таете.'] }
      ]
    },
    angelo_intro: {
      actors: { an: ['angelo', 0, -12, 0, { hide: true }] },
      shots: [
        { d: 2.8, cam: [2.2, 1.5, -8, 0, 2, -12], do: { an: { show: true } }, fx: [{ t: 'spawnfx', x: 0, y: 0, z: -12, big: true }], sfx: 'metal', say: [N, 'Доспехи Ордена? Кто там внутри?'] },
        { d: 3, cam: [0.6, 2.6, -10.4, 0, 2.5, -12], do: { an: { anim: 'shieldE' } }, say: [N, '...Никого. Доспехи пусты.'] }
      ]
    },
    bael_intro: {
      actors: { nero: ['nero', 0, -12, 0, { combat: true }], bael: ['bael', 0, 9, PI, { y: -5 }] },
      player: [0, -12, 0],
      shots: [
        { d: 3.2, cam: [0, 3, -16, 0, 1, 8], fade: 'in', sfx: 'wind', say: ['', 'Кладбище воинов. Снег не таял здесь сотни лет.'] },
        { d: 2.4, cam: [6, 2, 0, 0, 0, 8], shake: 0.5, sfx: 'rumble', fx: [{ t: 'snowburst', x: 0, y: 0, z: 9 }, { t: 'snowburst', x: 2, y: 0, z: 7 }] },
        { d: 3.2, cam: [10, 4, -2, 0, 3, 9], do: { bael: { fly: [0, 0, 9] } }, sfx: 'roarF', fx: [{ t: 'shatter', x: 0, y: 1, z: 9 }] },
        { d: 4.6, cam: [0, 5, 0.5, 0, 5, 9], do: { bael: { anim: 'lure' } }, say: [BA, 'Ха-ха-ха... Тёплая кровь. Как давно Баэль не пробовал тёплой крови...'] },
        { d: 3, cam: [1.2, 1.7, -9.5, 0, 1.6, -12], do: { bael: { anim: null } }, say: [N, 'Лягушка с фонариками. Отлично.'] }
      ]
    },
    m4_end: {
      actors: { nero: ['nero', 0, 1, 0, { combat: true }], bael: ['bael', 0, 9, PI, { anim: 'dead', animU: 1 }] },
      player: [0, 1, 0],
      shots: [
        { d: 3.8, cam: [8, 3, 2, 0, 2.5, 9], fade: 'in', say: [BA, 'Проклятье... Проклятый род Спарды...'] },
        { d: 2.2, cam: [8, 3.4, 3, 0, 2.5, 9], do: { bael: { hide: true } }, fx: [{ t: 'shatter', x: 0, y: 2, z: 9 }, { t: 'shatter', x: 1.5, y: 1, z: 8 }, { t: 'snowburst', x: 0, y: 0, z: 9 }], sfx: 'icebreak' },
        { d: 3.6, cam: [1.2, 1.7, 3.2, 0, 1.5, 1], say: [N, 'Снова Спарда. Каждый демон твердит это имя.'] },
        { d: 4, cam: [-3, 2, 6, 0, 1, 22], say: [N, 'Под замком что-то есть. Орден прячет больше, чем я думал.'], fade: 'out' }
      ]
    },
    m6_intro: {
      actors: { nero: ['nero', 0, 1, 0] },
      player: [0, 5, 0],
      shots: [
        { d: 3.6, cam: [0, 6, 20, 0, 1, 3], fade: 'in', music: 'lab', do: { nero: { to: [0, 5], walk: true } }, say: ['', 'Подземная лаборатория Ордена.'] },
        { d: 3.6, cam: [-4, 2, 7.4, -7, 2.5, 8], say: [N, 'Доспехи... растут в колбах?'] },
        { d: 4.6, cam: [2, 2, 3, 0, 1.6, 5.5], say: [AG, 'Д-д-добро пожаловать в мою лабораторию, мальчик! Ты видишь рождение ангелов!'] },
        { d: 3.8, cam: [1, 1.7, 7.4, 0, 1.6, 5], say: [N, 'Ангелов? Это демоны в доспехах Ордена.'] },
        { d: 4.6, cam: [0, 3, 12, 0, 1.5, 5], say: [AG, 'Орден и д-д-демоны — одно целое! Проходи, проходи. Я жду тебя.'] }
      ]
    },
    mephisto_intro: {
      actors: { m1: ['mephisto', -4, 64, PI, { y: 6 }], m2: ['mephisto', 4, 64, PI, { y: 6 }] },
      shots: [
        { d: 3, cam: [0, 2, 55, 0, 2.5, 64], do: { m1: { fly: [-4, 1.4, 64] }, m2: { fly: [4, 1.4, 64] } }, sfx: 'cloak' },
        { d: 3.6, cam: [-2, 2.6, 61, -4, 2.6, 64], say: [N, 'Призраки в плащах. Мечом их не взять — сорву покров выстрелом.'] }
      ]
    },
    agnus_intro: {
      actors: { nero: ['nero', 0, -8, 0, { combat: true }], agnus: ['agnusY', 0, 13, PI, { y: 4, pose: 'talk' }], g1: ['gladius', -3, 4, PI, { y: 3, hide: true }], g2: ['gladius', 0, 5, PI, { y: 4, hide: true }], g3: ['gladius', 3, 4, PI, { y: 3, hide: true }] },
      player: [0, -8, 0],
      shots: [
        { d: 3, cam: [0, 3, -14, 0, 5, 12], fade: 'in', music: 'boss', say: ['', 'Зал сотворения ангелов.'] },
        { d: 4.6, cam: [0, 6, 7, 0, 5.6, 13], say: [AG, 'Т-т-твоя рука! Ямато откликается на неё! Какой в-в-великолепный образец!'] },
        { d: 3, cam: [1.2, 1.7, -5.5, 0, 1.6, -8], say: [N, 'Выходи из своей банки, очкарик.'] },
        { d: 4.4, cam: [0, 6, 7, 0, 5.6, 13], say: [AG, 'Ха! Это стекло в-в-выдержит что угодно! Гладиусы! Приведите его ко мне!'] },
        { d: 2.6, cam: [0, 2, -12, 0, 3, 2], do: { g1: { show: true }, g2: { show: true }, g3: { show: true } }, fx: [{ t: 'spawnfx', x: -3, y: 3, z: 4 }, { t: 'spawnfx', x: 0, y: 4, z: 5 }, { t: 'spawnfx', x: 3, y: 3, z: 4 }], sfx: 'spawn' }
      ]
    },
    m6_end: {
      actors: { nero: ['nero', 0, 2, 0, { combat: true }], agnus: ['agnusY', 0, 12.5, PI, { y: 4, pose: 'talk' }] },
      player: [0, 2, 0],
      shots: [
        { d: 2.6, cam: [5, 5, 4, 0, 5, 11], fade: 'in', fx: [{ t: 'glassburst', x: 0, y: 6.5, z: 10 }], sfx: 'glass', say: [AG, 'Н-н-нет! Моё стекло!'] },
        { d: 3.2, cam: [2.2, 1.8, 3, 0, 1.5, 5.5], do: { agnus: { fly: [0, 0, 6], pose: 'arms' } }, say: [AG, 'Ты не получишь его! Ямато принадлежит Ордену!'] },
        { d: 1.8, cam: [3, 1.4, 2.5, 0, 1.2, 2.5], do: { agnus: { to: [0, 3], pose: null, anim: 'thrustE' }, nero: { pose: 'stabbed' } }, fx: [{ t: 'flash', c: [0.8, 0, 0], a: 0.8 }], sfx: 'stab' },
        { d: 3.4, cam: [0.8, 1.2, 4.6, 0, 1, 2], do: { agnus: { to: [0, 6], pose: 'talk', anim: null } }, music: 'none', say: [AG, 'Кровь... кровь Спарды... Какая ж-ж-жалость.'] },
        { d: 3.8, cam: [0, 1.6, 5, 0, 1.2, 2], to: [0, 1.4, 3.9, 0, 1.2, 2], fx: [{ t: 'armglow', who: 'nero' }], sfx: 'heartbeat', say: [N, 'Ямато... Я слышу его. Он зовёт меня.'] },
        { d: 3.2, cam: [4, 2, 6, 0, 1.5, 2.5], do: { nero: { pose: null, anim: 'dt' } }, fx: [{ t: 'flash', c: [0.4, 0.5, 1], a: 1 }, { t: 'dton', who: 'nero' }], sfx: 'dt', shake: 0.8, say: [N, 'Хочешь силы Спарды? Получай!'] },
        { d: 3.2, cam: [0, 2, 0, 0, 1.5, 9], do: { agnus: { to: [0, 12], walk: true, pose: null } }, say: [AG, 'Н-н-невероятно! Я должен доложить Его Святейшеству!'] },
        { d: 3.6, cam: [1.4, 1.7, 4, 0, 1.6, 2], do: { agnus: { hide: true } }, fx: [{ t: 'spawnfx', x: 0, y: 0, z: 12 }], say: [N, 'Беги, беги. Теперь я знаю, кого искать.'] },
        { d: 4, cam: [1.4, 1.7, 4, 0, 1.6, 2], say: ['', 'DEVIL TRIGGER ПРОБУЖДЁН. Клавиша O — когда шкала заполнена хотя бы на три деления.'], fade: 'out' }
      ]
    },
    assault_intro: {
      actors: { a1: ['assault', -5, 8, PI, { y: 7 }], a2: ['assault', 5, 8, PI, { y: 7 }], a3: ['assault', 0, 14, PI, { y: 8 }] },
      shots: [
        { d: 2.6, cam: [0, 1.5, 0, 0, 4, 10], do: { a1: { fly: [-5, 0, 8], anim: 'pounce' }, a2: { fly: [5, 0, 8], anim: 'pounce' }, a3: { fly: [0, 0, 14], anim: 'pounce' } }, sfx: 'roarS' },
        { d: 3, cam: [1.5, 1.1, 5.2, 0, 1.2, 8], do: { a1: { anim: 'claw' } }, say: [N, 'Ящерицы со щитами. Лес становится всё уютнее.'] }
      ]
    },
    m8_intro: {
      actors: { nero: ['nero', 0, -28, 0], credo: ['credo', 0, -15, PI, { pose: 'arms' }] },
      player: [0, -22, 0],
      shots: [
        { d: 3.8, cam: [6, 4, -30, 0, 2, -20], fade: 'in', music: 'forest', do: { nero: { to: [0, -22], walk: true } }, say: ['', 'Лес Митис. Дорога к штабу Ордена.'] },
        { d: 4.2, cam: [1.5, 1.8, -24, 0, 1.7, -15], say: [CR, 'Неро. Ты присвоил меч, принадлежащий Ордену.'] },
        { d: 4.8, cam: [0.8, 1.8, -17.4, 0, 1.6, -22], say: [N, 'Ямато сам выбрал меня. А твой Орден выращивает демонов в подвалах замка.'] },
        { d: 4.8, cam: [1.5, 1.8, -24, 0, 1.7, -15], do: { credo: { pose: 'point' } }, say: [CR, 'Ложь! Сдайся — и я попрошу Его Святейшество о милосердии.'] },
        { d: 2.8, cam: [0.8, 1.8, -17.4, 0, 1.6, -22], do: { credo: { pose: 'arms' } }, say: [N, 'Прости, Кредо. Мне некогда.'] },
        { d: 3.4, cam: [3, 2, -20, 0, 4, -15], do: { credo: { fly: [0, 14, -2], pose: null, anim: 'hop' } }, sfx: 'jump', say: [CR, 'Тогда встретимся на мосту. И я не буду сдерживаться.'] }
      ]
    },
    credo_intro: {
      actors: { nero: ['nero', 0, -8, 0, { combat: true }], credo: ['credo', 0, 6, PI, { pose: 'arms' }] },
      player: [0, -8, 0],
      shots: [
        { d: 3.2, cam: [8, 3, -10, 0, 1.5, 0], fade: 'in', music: 'none', say: ['', 'Мост Гран Альбум.'] },
        { d: 4.4, cam: [1.4, 1.8, 3.4, 0, 1.7, 6], say: [CR, 'Его Святейшество приказал доставить тебя. Живым... или мёртвым.'] },
        { d: 3.8, cam: [0.8, 1.8, -5.5, 0, 1.6, -8], say: [N, 'Ты же видел, что они творят. Открой глаза, Кредо!'] },
        { d: 4.4, cam: [1.4, 1.8, 3.4, 0, 1.7, 6], do: { credo: { pose: null, combat: true } }, say: [CR, 'Я поклялся защищать Орден. И Кирие. Даже от тебя.'] },
        { d: 3.2, cam: [0, 2.5, -1, 0, 2, 6], do: { credo: { model: 'credoAngelo', anim: 'dt' } }, fx: [{ t: 'flash', c: [1, 0.95, 0.7], a: 1 }, { t: 'shock', x: 0, y: 0, z: 6, r: 4 }], sfx: 'dt', shake: 0.6 },
        { d: 2.8, cam: [1, 1.7, -6, 0, 1.6, -8], say: [N, '...И ты тоже, Кредо.'] }
      ]
    },
    m8_end: {
      actors: { nero: ['nero', 0, 0, 0, { combat: true }], credo: ['credo', 0, 4, PI, { pose: 'kneel' }], kyrie: ['kyrie', 0, -30, 0], agnus: ['agnus', 0, -8, 0, { hide: true, pose: 'carry' }] },
      player: [0, 0, 0],
      shots: [
        { d: 3.8, cam: [3, 1.4, 1.5, 0, 1, 4], fade: 'in', music: 'none', say: [CR, 'Ты сильнее, чем я думал... Неро.'] },
        { d: 3.2, cam: [0, 2, -12, 0, 1.5, -2], do: { kyrie: { to: [0, -5], walk: true }, nero: { face: PI } }, say: [KY, 'Неро! Брат!'] },
        { d: 3.8, cam: [4, 2, -3, 0, 1.5, -7], do: { agnus: { show: true }, kyrie: { at: [0, -7.2], pose: 'hurt', face: PI } }, fx: [{ t: 'spawnfx', x: 0, y: 0, z: -8, big: true }], sfx: 'spawn', say: [AG, 'Ха-ха! Его Святейшество ж-ж-ждёт тебя, дитя!'] },
        { d: 2.6, cam: [1, 1.6, -2, 0, 1.6, 0], do: { agnus: { hide: true }, kyrie: { hide: true } }, fx: [{ t: 'spawnfx', x: 0, y: 0, z: -8, big: true }, { t: 'flash', c: [1, 1, 1], a: 0.7 }], say: [N, 'КИРИЕ!!!'] },
        { d: 4.2, cam: [2, 1.4, 5.6, 0, 1.2, 4], say: [CR, 'Агнус?! Санктус... Что всё это значит?'] },
        { d: 4.4, cam: [0.8, 1.7, -2, 0, 1.6, 0], do: { nero: { face: 0 } }, say: [N, 'Это значит, что твой Орден — ложь. Я иду за ней.'] },
        { d: 5, cam: [0, 3, -12, 0, 20, 140], to: [0, 4, -20, 0, 20, 140], say: ['', 'Штаб Ордена Меча.'], fade: 'out' }
      ]
    },
    finale: {
      actors: { dante: ['dante', 12.5, 10.5, -2.2, { y: 5.1, pose: 'arms' }] },
      shots: [
        { d: 4.8, cam: [8, 5, 5, 12.5, 6.2, 10.5], fade: 'in', music: 'menu', say: [DA, 'Малыш неплохо держится. Но настоящая вечеринка только начинается.'] },
        { d: 4, cam: [8, 5.4, 5.6, 12.5, 6.2, 10.5], do: { dante: { anim: 'taunt' } }, say: ['', 'ПРОДОЛЖЕНИЕ СЛЕДУЕТ...'], fade: 'out' }
      ]
    }
  };

  function mkActor(g, name, spec) {
    const [model, x, z, face, o = {}] = spec;
    const obj = model.startsWith('obj:');
    const gy = g.W.groundAt(x, z, 0.3, 40);
    return { name, obj: obj ? model.slice(4) : null, m: obj ? null : S.model(model), x, y: o.y != null ? o.y : (isFinite(gy) ? gy : 0), z, face, pose: o.pose || null, anim: o.anim || null, animU: o.animU || 0, t: 0, hidden: !!o.hide, moveK: 0, phase: 0, combat: o.combat ? 4 : 0, air: false, vy: 0 };
  }
  function cutRuntime(g, c, onEnd) {
    const R = { c, onEnd, i: -1, t: 0, st: 0, actors: {}, cam: [0, 2, 0, 0, 1, 1], say: null, fade: 0, fadeDir: 0 };
    for (const k in c.actors) R.actors[k] = mkActor(g, k, c.actors[k]);
    next(g, R);
    return R;
  }
  function next(g, R) {
    R.i++; R.st = 0;
    const s = R.c.shots[R.i];
    if (!s) { finish(g, R); return; }
    R.shot = s; R.say = s.say || null;
    R.cam0 = s.cam; R.cam1 = s.to || s.cam;
    R.fadeDir = s.fade === 'in' ? -1 : s.fade === 'out' ? 1 : 0;
    if (s.fade === 'in') R.fade = 1;
    for (const k in (s.do || {})) {
      const a = R.actors[k], o = s.do[k]; if (!a) continue;
      if (o.model) a.m = S.model(o.model);
      if (o.show) a.hidden = false;
      if (o.hide) a.hidden = true;
      if (o.at) { a.x = o.at[0]; a.z = o.at[1]; }
      if (o.y != null && !o.to && !o.fly) a.y = o.y;
      if ('pose' in o) a.pose = o.pose;
      if ('anim' in o) { a.anim = o.anim; a.animU = 0; a.animAt = o.at && typeof o.at === 'number' ? o.at : 0; }
      if (o.combat) a.combat = 4;
      if (o.face != null) a.face = o.face;
      a.mv = null;
      if (o.to || o.fly) {
        const tx = o.fly ? o.fly[0] : o.to[0], tz = o.fly ? o.fly[2] : o.to[1];
        let ty = o.fly ? o.fly[1] : o.y != null ? o.y : g.W.groundAt(tx, tz, 0.3, a.y + 3);
        if (!isFinite(ty)) ty = a.y;
        a.mv = { x0: a.x, y0: a.y, z0: a.z, x1: tx, y1: ty, z1: tz, jump: o.jump || 0, walk: !!o.walk };
        if (!o.fly && Math.hypot(tx - a.x, tz - a.z) > 0.2 && o.face == null) a.face = Math.atan2(tx - a.x, tz - a.z);
      }
    }
    for (const f of s.fx || []) {
      const e = Object.assign({}, f);
      if (e.who) { const a = R.actors[e.who]; if (a) { e.x = a.x; e.y = a.y; e.z = a.z; e.actor = a; } }
      g.ev(e);
    }
    for (const x of [].concat(s.sfx || [])) g.sfx(x);
    if (s.music) g.ev({ t: 'music', m: s.music });
    if (s.shake) g.shake = Math.max(g.shake, s.shake);
    if (R.say && R.say[1]) g.ev({ t: 'line', who: R.say[0] });
  }
  function finish(g, R) {
    const c = R.c;
    if (c.player) { const p = g.player; p.x = c.player[0]; p.z = c.player[1]; p.face = c.player[2]; const gy = g.W.groundAt(p.x, p.z, 0.3, p.y + 3); p.y = isFinite(gy) ? gy : p.y; p.vx = p.vy = p.vz = 0; p.st = 'move'; p.special = null; p.move = null; p.ground = true; }
    g.endCut();
  }
  function updateCut(g, inp) {
    const R = g.cut; if (!R) return;
    R.t += DT; R.st += DT;
    if (inp.skip && R.t > 0.4) { R.i = R.c.shots.length; finish(g, R); return; }
    const s = R.shot, u = clamp(R.st / s.d, 0, 1), e = u * u * (3 - 2 * u);
    R.cam = R.cam0.map((v, i) => lerp(v, R.cam1[i], e));
    if (R.fadeDir < 0) R.fade = Math.max(0, 1 - R.st / 0.6);
    else if (R.fadeDir > 0) R.fade = clamp((R.st - (s.d - 0.8)) / 0.8, 0, 1);
    else R.fade = 0;
    for (const k in R.actors) {
      const a = R.actors[k]; a.t += DT;
      if (a.anim) a.animU = clamp((R.st - (a.animAt || 0) * s.d) / Math.max(0.3, s.d * (1 - (a.animAt || 0))), 0, 1);
      if (a.mv) {
        const m = a.mv, k2 = m.walk ? u : e;
        a.x = lerp(m.x0, m.x1, k2); a.z = lerp(m.z0, m.z1, k2); a.y = lerp(m.y0, m.y1, k2) + (m.jump ? Math.sin(u * PI) * m.jump : 0);
        if (m.walk) { const sp = Math.hypot(m.x1 - m.x0, m.z1 - m.z0) / s.d; a.moveK = u < 1 ? Math.min(1, sp / 7.2) : 0; a.phase += sp * DT * 1.55; }
        if (u >= 1) { a.mv = null; a.moveK = 0; }
      }
    }
    if (R.st >= s.d) next(g, R);
  }

  const TIPS_M1 = [
    [0.5, 'Меч «Красная королева» — J. Серия ударов: J J J J.'],
    [7, 'Пробел — прыжок. В воздухе J — воздушная серия. Пробел у врага в воздухе — Enemy Step.'],
    [14, 'K — револьвер «Синяя роза». Удерживайте K и отпустите — заряженный выстрел.'],
    [21, 'Держите Shift — захват цели. С захватом: к врагу + J — Streak, от врага + J — High Roller.'],
    [28, 'С захватом: в сторону + Пробел — перекат. Так проще уходить от атак Данте.'],
    [35, 'I — газ рукояти Exceed. Нажмите I точно в момент удара мечом — EX-Act и заряженный удар.'],
    [42, 'U — насмешка. Разнообразные приёмы поднимают оценку стиля до SSS.']
  ];
  function tips(g, list) { for (const [t, text] of list) S.later(g, t, () => { if (!g.cleared && g.state === 'play') g.msg(text, 6.5, 'tip'); }); }
  function win(g, cut, then) { g.startCut(cut, () => { if (then) then(); g.clearMission(); }); }

  const HOOKS = {
    m1: {
      introEnd(g) { tips(g, TIPS_M1); },
      bossDead(g) { g.flags.boss_dante = true; win(g, 'm1_end'); }
    },
    m2: {
      introEnd(g) { g.startFight('plaza1'); S.later(g, 3, () => g.msg('L рядом с врагом — Buster, бросок рукой дьявола. С захватом издалека — Snatch, рывок.', 6.5, 'tip')); },
      item_evilLegacy(g) { g.startCut('evil_legacy', () => { g.flags.evilLegacy = true; g.startFight('cath1'); }); },
      bossDead(g) { g.flags.boss_berial = true; win(g, 'm2_end'); }
    },
    m4: {
      introEnd(g) { g.startFight('lib1'); S.later(g, 2, () => g.msg('Фросты не взлетают от High Roller. Хватайте их рукой дьявола (L).', 6, 'tip')); },
      bossDead(g) { g.flags.boss_bael = true; win(g, 'm4_end'); }
    },
    m6: {
      bossDead(g) { g.flags.boss_agnus = true; win(g, 'm6_end', () => { g.save.dt = true; g.player.dt = g.dtMax; }); }
    },
    m8: {
      introEnd(g) { if (g.save.dt) S.later(g, 2, () => g.msg('Devil Trigger — O. В режиме дьявола удары сильнее, а Buster — сокрушительнее.', 6, 'tip')); },
      bossDead(g) { g.flags.boss_credo = true; g.startCut('m8_end', () => { g.enterArea('bridge', 'fromWoods'); g.startCut('finale', () => { g.gameComplete = true; g.clearMission(); }); }); }
    }
  };
  S.CUTS = CUTS; S.HOOKS = HOOKS; S.cutRuntime = cutRuntime; S.updateCut = updateCut;
  if (typeof module !== 'undefined') module.exports = S;
})(globalThis.Dmc98 = globalThis.Dmc98 || {});
