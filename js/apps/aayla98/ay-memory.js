(function (A) {
  'use strict';
  const m = (id, still, at, year, title, place, reward, text) => Object.assign({ id, still, at, year, title, place, text }, reward);

  const HINTS = {
    1: 'Эйле два года. Хатт, его новая вампа и падаван-подросток с жёлтой полосой на лице.',
    2: 'Девочку из логова хатта привели к учителю того самого падавана.',
    3: 'Храм. Эйле от двух до десяти лет, учит её Толм.',
    4: 'Эйле около десяти. У неё теперь свой учитель.',
    5: 'Тринадцатый день рождения. Подарок с Киффу.',
    6: 'Камень с Киффу висит у Эйлы на шее, когда она хоронит Т\'да.',
    7: 'Первое задание после похорон Т\'да. Солибус IV.',
    8: 'Вос по дороге на Ксоман III вспоминает лоди.',
    9: 'После Ксомана III Вос и Эйла летят на Огден-Минор.',
    10: '32 ДБЯ. На Татуине застрял мастер Квай-Гон Джинн.',
    11: 'Рассказ ветеранов: гора Авос на Троикене, 44 ДБЯ.',
    12: '31 ДБЯ. Вос пропал, Эйла ищет его на Рилоте.'
  };

  A.MEMORY = [
    m(1, 'wampa', 46, '46 ДБЯ', 'Вампа', 'гл. 1, первая вылитая доза', { skill: 'push', field: ['push'] },
      'Двухлетняя Эйла живёт у хатта, которому её продали после смерти отца. Его новая вампа вырывается на свободу. Эйла зовёт через Силу, и падаван Квинлан Вос её слышит и успевает первым.'),
    m(2, 'tholme_test', 45.6, '46 ДБЯ', 'Испытание', 'гл. 1, джедайская туника в кладовой', { skill: 'sense', field: ['sense'] },
      'Вос уговаривает своего учителя Толма проверить девочку. Толм соглашается, и Эйлу забирают учиться в Храм на Корусант.'),
    m(3, 'temple_years', 42, '46–38 ДБЯ', 'Годы у Толма', 'гл. 2, голос Толма в холмах', { skill: 'focus' },
      'Годы учёбы в Храме у мастера Толма.'),
    m(4, 'padawan', 38, 'около 38 ДБЯ', 'Падаван', 'гл. 1, вторая вылитая доза', { skill: 'deflect' },
      'Эйле около десяти лет. Квинлан Вос берёт её в падаваны.'),
    m(5, 'heart13', 35, 'около 35 ДБЯ', 'Тринадцать лет', 'гл. 1, третья вылитая доза', { skill: 'calm' },
      'На тринадцатилетие Вос дарит Эйле Сердце огня, тёплый светящийся камень со своей родины, Киффу.'),
    m(6, 'tda', 34.4, '', 'Т\'да', 'гл. 1, четвёртая вылитая доза', { field: ['meditate'] },
      'Умирает Т\'да, зверёк Эйлы. Вос утешает её: ушедший становится частью Силы и живёт в сердце. Эйла хоронит Т\'да на Фелуции.'),
    m(7, 'lodi', 33.8, '', 'Тайна лоди', 'гл. 2, кантина', { skill: 'foresee' },
      'Вос и Эйла разгадывают тайну лоди на Солибусе IV.'),
    m(8, 'xoman', 33.4, '', 'Ксоман III', 'гл. 2, засада', { skill: 'leap' },
      'Вос и Эйла спасают юную принцессу от пиратов небесных лодок на Ксомане III.'),
    m(9, 'terbeasts', 33, '', 'Тербисты', 'гл. 2, святилище', { field: ['jump'] },
      'Вос и Эйла против тербистов Огдена-Минор.'),
    m(10, 'tatooine', 32, '32 ДБЯ', 'Татуин', 'гл. 1, пятая вылитая доза', { field: ['sneak'] },
      'Вос и Эйла работают на Татуине под прикрытием, пока там застрял мастер Квай-Гон Джинн.'),
    m(11, 'stark', 44, '44 ДБЯ', 'Война Старка', 'не находится', { gap: true, told: 'stark_veterans', toldTitle: 'Рассказ ветеранов', toldText: 'Даллин, Толм и советники рассказали о войне Старка на «Интрепиде». Квинлану тогда было тринадцать. В пещере горы Авос его и Оби-Вана спасли от пожирателей Толм, Пло Кун и Квай-Гон.' },
      'Здесь был рассказ Воса о войне Старка, в которой он воевал падаваном. Рассказ не вернулся.'),
    m(12, 'ryloth_stun', 31, '31 ДБЯ', 'Рилот', 'интерлюдия, с Пло Куном', { skill: 'mindguard' },
      'Рилот, рилловая шахта. Асанте Вос стреляет Эйле в спину.')
  ];

  A.Memory = {
    FROM: 48,
    DOSES: [1, 4, 5, 6, 10],
    HINTS,
    PALACE_MAX: 6,
    slots() {
      return A.MEMORY.slice().sort((a, b) => b.at - a.at || a.id - b.id).map(e => e.id);
    },
    get(id) {
      return A.MEMORY.find(e => e.id === id) || null;
    },
    has(S, id) {
      return (S.memory || []).includes(id);
    },
    faded(S, id) {
      return (S.faded || []).includes(id);
    },
    ready(S, id) {
      return A.Memory.has(S, id) && (!A.Memory.faded(S, id) || A.reached(S, 'ch3'));
    },
    recall(S, id) {
      const e = A.Memory.get(id);
      if (!e || e.gap) throw new Error('no memory fragment ' + id);
      if (!S.memory) S.memory = [];
      if (!S.memory.includes(id)) S.memory.push(id);
      return e;
    },
    missed(S) {
      return A.MEMORY.filter(e => !e.gap && e.id !== 12 && !A.Memory.has(S, e.id)).map(e => e.id);
    },
    restore(S) {
      const ids = A.Memory.missed(S);
      if (!S.faded) S.faded = [];
      for (const id of ids) {
        A.Memory.recall(S, id);
        if (!S.faded.includes(id)) S.faded.push(id);
      }
      return ids;
    },
    told(S) {
      return !!S.flags.stark_told;
    },
    tell(S) {
      S.flags.stark_told = true;
    },
    pieces(S) {
      return A.Memory.slots().filter(id => !A.Memory.get(id).gap && A.Memory.has(S, id));
    },
    score(order) {
      const line = A.Memory.slots().filter(id => !A.Memory.get(id).gap);
      let pairs = 0;
      for (let i = 0; i + 1 < line.length; i++) if (order[i] === line[i] && order[i + 1] === line[i + 1]) pairs++;
      return Math.min(A.Memory.PALACE_MAX, pairs);
    },
    solve() {
      return A.Memory.slots().filter(id => !A.Memory.get(id).gap);
    },
    arrange(S, order) {
      const line = A.Memory.slots().filter(id => !A.Memory.get(id).gap);
      if (order.length !== line.length) throw new Error('the palace has ' + line.length + ' places');
      const will = A.Memory.score(order);
      S.palace = { order: order.slice(), will: Math.max(will, S.palace ? S.palace.will : 0) };
      return will;
    },
    will(S) {
      return S.palace ? S.palace.will : 0;
    },
    skills(S) {
      return A.MEMORY.filter(e => e.skill && A.Memory.ready(S, e.id)).map(e => e.skill);
    },
    can(S, ability) {
      if (!S.flags.forgot) return true;
      if (ability === 'pull') return A.reached(S, 'ch2') && A.Memory.can(S, 'push');
      return A.MEMORY.some(e => e.field && e.field.includes(ability) && A.Memory.ready(S, e.id));
    },
    reward(e) {
      const parts = [];
      if (e.skill) parts.push('приём «' + A.SKILLS[e.skill].name + '»');
      for (const f of e.field || []) parts.push(A.Memory.FIELD[f]);
      return parts.join(', ');
    },
    FIELD: { push: 'толчок в поле', pull: 'притяжение в поле', sense: 'Чутьё в поле', meditate: 'медитация в движении', jump: 'прыжок Силой', sneak: 'скрытность в поле' }
  };
})(globalThis.Aayla98 = globalThis.Aayla98 || {});
