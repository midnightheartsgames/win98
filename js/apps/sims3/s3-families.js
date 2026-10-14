(function (S) {
  'use strict';
  const F = (first, gender, age, traits, o) => Object.assign({ first, gender, age, traits }, o || {});

  const FAMILIES = [
    {
      key: 'landgraab', last: 'Ландграаб', lot: 'landgraab', funds: 68000,
      desc: 'Самая богатая семья города. Джеффри управляет бизнесом, Нэнси делает политическую карьеру, а Малкольм делает всё, чтобы родители краснели.',
      members: [
        F('Джеффри', 'm', 'adult', ['ambitious', 'snob', 'workaholic', 'charismatic', 'frugal'], { job: ['business', 9], ltw: 'ltw_rich', look: { skin: 1, hair: 'side', hairC: '#4a3020' } }),
        F('Нэнси', 'f', 'adult', ['snob', 'perfectionist', 'neat', 'excitable', 'great_kisser'], { job: ['political', 5], ltw: 'ltw_leader', look: { skin: 0, hair: 'bob', hairC: '#d8b060' } }),
        F('Малкольм', 'm', 'teen', ['mean_spirited', 'party_animal', 'inappropriate', 'daredevil'], { ltw: 'ltw_rock', look: { skin: 1, hair: 'spiky', hairC: '#4a3020' } })
      ],
      rels: [[0, 1, 70, 'married'], [0, 2, 45, 'family'], [1, 2, 40, 'family']]
    },
    {
      key: 'goth', last: 'Гот', lot: 'goth', funds: 42000,
      desc: 'Старинная семья из мрачного особняка у кладбища. Гюнтер одержим наукой, Корнелия держит дом в идеальном порядке, а юный Мортимер читает всё подряд.',
      members: [
        F('Гюнтер', 'm', 'adult', ['genius', 'snob', 'loner', 'ambitious', 'frugal'], { job: ['science', 6], ltw: 'ltw_scientist', look: { skin: 0, hair: 'side', hairC: '#1c1814' } }),
        F('Корнелия', 'f', 'adult', ['neat', 'snob', 'good', 'family_oriented', 'perfectionist'], { ltw: 'ltw_family', look: { skin: 0, hair: 'bun', hairC: '#1c1814' } }),
        F('Мортимер', 'm', 'child', ['genius', 'bookworm', 'loner'], { look: { skin: 0, hair: 'short', hairC: '#1c1814' } })
      ],
      rels: [[0, 1, 60, 'married'], [0, 2, 50, 'family'], [1, 2, 65, 'family']]
    },
    {
      key: 'alto', last: 'Альто', lot: 'alto', funds: 51000,
      desc: 'Ник Альто ведёт дела, о которых лучше не спрашивать. Его жена Вита не прощает обид, а дочь Холли мечтает о большой сцене.',
      members: [
        F('Ник', 'm', 'adult', ['charismatic', 'evil', 'ambitious', 'workaholic', 'kleptomaniac'], { job: ['criminal', 7, 'evil'], ltw: 'ltw_crime', look: { skin: 2, hair: 'side', hairC: '#1c1814' } }),
        F('Вита', 'f', 'adult', ['snob', 'flirty', 'hot_headed', 'great_kisser', 'athletic'], { ltw: 'ltw_heartbreaker', look: { skin: 2, hair: 'long', hairC: '#1c1814' } }),
        F('Холли', 'f', 'teen', ['artistic', 'excitable', 'virtuoso', 'friendly'], { ltw: 'ltw_maestro', look: { skin: 2, hair: 'ponytail', hairC: '#4a3020' } })
      ],
      rels: [[0, 1, 50, 'married'], [0, 2, 55, 'family'], [1, 2, 45, 'family']]
    },
    {
      key: 'hogan', last: 'Хоган', lot: 'hogan', funds: 9000,
      desc: 'Мэтью Хоган, звезда местной футбольной команды, в одиночку растит сына. Джейкоб хочет быть похожим на отца, но пока чаще падает, чем бегает.',
      members: [
        F('Мэтью', 'm', 'adult', ['athletic', 'friendly', 'good_sense_of_humor', 'family_oriented', 'brave'], { job: ['sports', 6], ltw: 'ltw_athlete', look: { skin: 4, hair: 'crew', hairC: '#1c1814' } }),
        F('Джейкоб', 'm', 'child', ['athletic', 'excitable', 'clumsy'], { look: { skin: 4, hair: 'crew', hairC: '#1c1814' } })
      ],
      rels: [[0, 1, 70, 'family']]
    },
    {
      key: 'frost', last: 'Фрост', lot: 'frost', funds: 6500,
      desc: 'Джастин и Кэти снимают дом на двоих. Он играет в группе и не выключает музыку, она пишет статьи и мечтает о тишине.',
      members: [
        F('Джастин', 'm', 'ya', ['party_animal', 'flirty', 'computer_whiz', 'slob', 'charismatic'], { job: ['music', 2], ltw: 'ltw_rock', look: { skin: 1, hair: 'long_m', hairC: '#a8481c' } }),
        F('Кэти', 'f', 'ya', ['bookworm', 'artistic', 'shy', 'vegetarian', 'loves_outdoors'], { last: 'Уокер', job: ['journalism', 3], ltw: 'ltw_author', look: { skin: 0, hair: 'curly', hairC: '#6a3a1c' } })
      ],
      rels: [[0, 1, 30, 'friend']]
    },
    {
      key: 'scott', last: 'Скотт', lot: 'scott', funds: 8000,
      desc: 'Кевин и Эмили поженились месяц назад и только что въехали в свой первый дом.',
      members: [
        F('Кевин', 'm', 'ya', ['handy', 'good', 'friendly', 'ambitious', 'lucky'], { job: ['military', 3], ltw: 'ltw_astronaut', look: { skin: 1, hair: 'short', hairC: '#d8b060' } }),
        F('Эмили', 'f', 'ya', ['hopeless_romantic', 'natural_cook', 'excitable', 'family_oriented', 'friendly'], { job: ['culinary', 3], ltw: 'ltw_chef', look: { skin: 1, hair: 'ponytail', hairC: '#a8481c' } })
      ],
      rels: [[0, 1, 85, 'married']]
    },
    {
      key: 'aldridge', last: 'Олдридж', lot: 'aldridge', funds: 14000,
      desc: 'Уолтер и Грейс прожили вместе сорок лет. Он ворчит и копается в огороде, она печёт пироги для всей улицы.',
      members: [
        F('Уолтер', 'm', 'elder', ['grumpy', 'green_thumb', 'angler', 'frugal', 'loner'], { ltw: 'ltw_garden', look: { skin: 0, hair: 'short', hairC: '#c8c8cc' } }),
        F('Грейс', 'f', 'elder', ['good', 'natural_cook', 'family_oriented', 'friendly', 'neat'], { ltw: 'ltw_recipes', look: { skin: 0, hair: 'bun', hairC: '#e8e8ec' } })
      ],
      rels: [[0, 1, 75, 'married']]
    },
    {
      key: 'mitchell', last: 'Митчелл', lot: 'mitchell', funds: 11000,
      desc: 'Обычная большая семья: папа-журналист любит диван, мама-врач любит порядок, а дети любят всё ломать.',
      members: [
        F('Пол', 'm', 'adult', ['couch_potato', 'good_sense_of_humor', 'friendly', 'lucky', 'family_oriented'], { job: ['journalism', 4], ltw: 'ltw_popular', look: { skin: 3, hair: 'short', hairC: '#4a3020' } }),
        F('Сара', 'f', 'adult', ['neat', 'ambitious', 'workaholic', 'natural_cook', 'good'], { job: ['medical', 6], ltw: 'ltw_surgeon', look: { skin: 2, hair: 'bob', hairC: '#6a3a1c' } }),
        F('Райан', 'm', 'child', ['clumsy', 'athletic', 'friendly'], { look: { skin: 3, hair: 'crew', hairC: '#4a3020' } }),
        F('Хизер', 'f', 'toddler', ['athletic', 'neat'], { look: { skin: 3, hair: 'pigtails', hairC: '#6a3a1c' } })
      ],
      rels: [[0, 1, 65, 'married'], [0, 2, 55, 'family'], [1, 2, 55, 'family'], [0, 3, 60, 'family'], [1, 3, 60, 'family'], [2, 3, 30, 'family']]
    },
    {
      key: 'parker', last: 'Паркер', lot: 'parker', funds: 12000,
      desc: 'Лиза Паркер раскрывает преступления, а дома пытается понять собственную дочь. Эмма не выпускает из рук книги и гитару.',
      members: [
        F('Лиза', 'f', 'adult', ['ambitious', 'workaholic', 'neat', 'charismatic', 'brave'], { job: ['law', 5], ltw: 'ltw_spy', look: { skin: 5, hair: 'short_f', hairC: '#1c1814' } }),
        F('Эмма', 'f', 'teen', ['bookworm', 'genius', 'shy', 'virtuoso'], { ltw: 'ltw_author', look: { skin: 5, hair: 'afro', hairC: '#1c1814' } })
      ],
      rels: [[0, 1, 45, 'family']]
    },
    {
      key: 'king', last: 'Кинг', lot: 'king', funds: 10000,
      desc: 'Грегори Кинг работает в научном центре и разговаривает с тостером. Соседи стараются не заходить к нему в гости.',
      members: [
        F('Грегори', 'm', 'adult', ['insane', 'genius', 'loner', 'technophobe', 'kleptomaniac'], { job: ['science', 6], ltw: 'ltw_scientist', look: { skin: 1, hair: 'spiky', hairC: '#8a8a8a' } })
      ],
      rels: []
    }
  ];

  Object.assign(S, { FAMILIES });
  if (typeof module !== 'undefined' && module.exports) module.exports = S;
})(globalThis.Sims3 = globalThis.Sims3 || {});
