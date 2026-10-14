(function (S) {
  'use strict';
  const T = (name, cat, icon, desc, o) => Object.assign({ name, cat, icon, desc, age: 'toddler', conflicts: [], need: {}, skill: {}, auto: {}, soc: {}, wishes: [] }, o || {});

  const TRAITS = {
    absent_minded: T('Рассеянный', 'mental', 't_absent', 'Иногда забывает, что собирался сделать. И куда положил ключи.', { age: 'child', auto: { idle: 1.3 }, wishes: ['read_book'] }),
    ambitious: T('Честолюбивый', 'mental', 't_ambitious', 'Хочет большего. Быстрее растёт по карьерной лестнице, но расстраивается без повышений.', { age: 'teen', work: 1.2, conflicts: ['couch_potato'], wishes: ['promote', 'reach_level', 'job'] }),
    angler: T('Рыбак', 'lifestyle', 't_angler', 'Любит рыбалку больше всего на свете. Рыба клюёт у него лучше.', { age: 'child', skill: { fishing: 1.5 }, auto: { fish: 3 }, wishes: ['fish_any', 'fish_kind'] }),
    artistic: T('Творческий', 'mental', 't_artistic', 'Рисует и играет на гитаре с душой. Искусство даёт ему вдохновение.', { age: 'child', skill: { painting: 1.4, guitar: 1.2, writing: 1.2 }, auto: { paint: 2.5, guitar: 1.5 }, conflicts: ['cant_stand_art'], wishes: ['paint', 'sell_paint', 'play_guitar'] }),
    athletic: T('Спортсмен', 'physical', 't_athletic', 'Тренировки для него удовольствие. Без них скучает.', { skill: { athletic: 1.5 }, auto: { workout: 3, jog: 3 }, need: { energy: 0.95 }, conflicts: ['couch_potato'], wishes: ['workout', 'jog', 'skill_athletic'] }),
    bookworm: T('Книголюб', 'mental', 't_bookworm', 'Читает всё подряд. Книги развлекают его не хуже телевизора.', { age: 'child', skill: { writing: 1.3 }, auto: { read: 3.5 }, wishes: ['read_book', 'write'] }),
    brave: T('Храбрый', 'physical', 't_brave', 'Не боится пожаров, призраков и грабителей. Идеальный пожарный доброволец.', { age: 'child', conflicts: ['coward'], wishes: ['fight'] }),
    cant_stand_art: T('Не любит искусство', 'mental', 't_noart', 'Картины, музеи, гитары. Всё это кажется ему бессмысленным.', { age: 'child', conflicts: ['artistic', 'virtuoso'], auto: { paint: 0.1, guitar: 0.3 } }),
    charismatic: T('Харизматичный', 'social', 't_charismatic', 'Умеет расположить к себе кого угодно. Обаяние даётся ему легко.', { age: 'child', skill: { charisma: 1.5 }, soc_actor: 12, conflicts: ['shy'], wishes: ['meet_new', 'befriend', 'party'] }),
    childish: T('Ребячливый', 'social', 't_childish', 'В душе навсегда ребёнок. Любит игрушки и весёлые шутки.', { age: 'teen', auto: { play: 3, funny: 1.5 }, wishes: ['joke'] }),
    clumsy: T('Неуклюжий', 'physical', 't_clumsy', 'Спотыкается на ровном месте. Спорт даётся с трудом.', { skill: { athletic: 0.8 }, conflicts: [], wishes: [] }),
    commitment_issues: T('Боится обязательств', 'social', 't_commit', 'Не любит серьёзных отношений и долгой работы на одном месте.', { age: 'ya', conflicts: ['hopeless_romantic', 'family_oriented'], soc: { propose: -40 } }),
    computer_whiz: T('Компьютерный гений', 'mental', 't_computer', 'Разбирается в компьютерах и чинит их одним взглядом.', { age: 'child', auto: { computer: 3 }, skill: { writing: 1.1 }, conflicts: ['technophobe'], wishes: ['upgrade', 'write'] }),
    couch_potato: T('Лежебока', 'physical', 't_couch', 'Диван и телевизор. Больше ничего не нужно.', { auto: { tv: 3, workout: 0.2, jog: 0.1, nap: 1.5 }, skill: { athletic: 0.7 }, need: { energy: 1.1, fun: 0.9 }, conflicts: ['athletic', 'ambitious'], wishes: ['watch_tv', 'nap'] }),
    coward: T('Трус', 'mental', 't_coward', 'Боится всего: темноты, призраков, начальника.', { conflicts: ['brave', 'daredevil'], soc: { mean: -20 } }),
    daredevil: T('Сорвиголова', 'physical', 't_daredevil', 'Обожает риск. Спокойная жизнь нагоняет на него тоску.', { age: 'child', conflicts: ['coward'], skill: { athletic: 1.1 }, wishes: ['fight', 'visit'] }),
    dislikes_children: T('Не любит детей', 'social', 't_nokids', 'Дети шумные, липкие и вечно чего-то хотят.', { age: 'teen', conflicts: ['family_oriented'], soc: { child: -20 } }),
    evil: T('Злой', 'social', 't_evil', 'Радуется чужим несчастьям и злобно хохочет.', { age: 'child', auto: { mean: 3, swipe: 1.2 }, conflicts: ['good'], soc: { friendly: -10 }, wishes: ['mean', 'fight'] }),
    excitable: T('Возбудимый', 'social', 't_excitable', 'Радуется всему громко и от души.', { age: 'child', auto: { funny: 1.3 }, need: { fun: 1.1 }, wishes: ['party', 'visit'] }),
    family_oriented: T('Семьянин', 'social', 't_family', 'Семья для него важнее всего. Отлично ладит с детьми.', { age: 'teen', conflicts: ['dislikes_children', 'commitment_issues'], soc: { child: 20 }, wishes: ['baby', 'marry', 'teach_toddler'] }),
    flirty: T('Кокетливый', 'social', 't_flirty', 'Флиртует со всеми, кто ему нравится. И иногда с теми, кто не нравится.', { age: 'teen', auto: { romance: 2.5 }, soc: { romantic: 20 }, soc_romance: 15, conflicts: ['unflirty'], wishes: ['kiss', 'go_steady', 'woohoo'] }),
    friendly: T('Дружелюбный', 'social', 't_friendly', 'Легко находит друзей. Отношения с ним портятся медленнее.', { age: 'child', soc: { friendly: 15 }, soc_actor: 8, auto: { social: 1.5 }, conflicts: ['mean_spirited'], wishes: ['befriend', 'meet_new', 'chat'] }),
    frugal: T('Экономный', 'lifestyle', 't_frugal', 'Считает каждую симолеону. Счета для него немного меньше.', { age: 'child', bills: 0.85, wishes: ['money'] }),
    genius: T('Гений', 'mental', 't_genius', 'Логика даётся легко. Шахматы и телескоп увлекают его сильнее всего.', { age: 'child', skill: { logic: 1.5 }, auto: { chess: 2.5, stargaze: 2 }, wishes: ['chess_win', 'skill_logic', 'stargaze'] }),
    good: T('Добрый', 'social', 't_good', 'Помогает людям и радуется, когда им хорошо.', { age: 'child', soc: { friendly: 10, mean: -15 }, conflicts: ['evil'], wishes: ['befriend', 'hug'] }),
    good_sense_of_humor: T('Чувство юмора', 'social', 't_humor', 'Шутит к месту и смеётся от души.', { age: 'child', soc: { funny: 25 }, soc_funny: 20, conflicts: ['no_sense_of_humor'], wishes: ['joke'] }),
    great_kisser: T('Страстный', 'social', 't_kisser', 'Поцелуи с ним запоминаются надолго.', { age: 'teen', soc: { romantic: 10 }, soc_romance: 10, wishes: ['kiss'] }),
    green_thumb: T('Садовод', 'lifestyle', 't_garden', 'Растения у него растут быстрее и дают лучший урожай.', { age: 'child', skill: { gardening: 1.5 }, auto: { garden: 3 }, wishes: ['plant', 'harvest', 'harvest_q'] }),
    grumpy: T('Ворчун', 'social', 't_grumpy', 'Всем недоволен и не скрывает этого.', { age: 'child', soc: { friendly: -10, funny: -10 }, auto: { mean: 1.5 }, conflicts: [], wishes: ['mean'] }),
    handy: T('Мастер на все руки', 'mental', 't_handy', 'Чинит всё, что сломалось, быстро и без ударов током.', { age: 'child', skill: { handiness: 1.5 }, auto: { repair: 3 }, wishes: ['repair', 'upgrade'] }),
    heavy_sleeper: T('Крепкий сон', 'physical', 't_heavy', 'Спит как убитый и громко храпит.', { age: 'child', need: { energy: 0.95 }, conflicts: ['light_sleeper'] }),
    hopeless_romantic: T('Романтик', 'social', 't_romantic', 'Мечтает о большой любви. Без романтики грустит.', { age: 'teen', auto: { romance: 1.8 }, soc: { romantic: 15 }, conflicts: ['commitment_issues', 'unflirty'], wishes: ['go_steady', 'propose', 'marry', 'kiss'] }),
    hot_headed: T('Вспыльчивый', 'social', 't_hothead', 'Выходит из себя по любому поводу.', { age: 'child', auto: { mean: 1.8 }, soc: { mean: 10 }, wishes: ['fight', 'mean'] }),
    inappropriate: T('Бестактный', 'social', 't_inappropriate', 'Говорит то, что думает, в самый неподходящий момент.', { age: 'child', auto: { funny: 1.5 }, soc_actor: -5 }),
    insane: T('Сумасшедший', 'mental', 't_insane', 'Разговаривает с собой, ест странные вещи и совершенно счастлив.', { age: 'child', auto: { insane: 2 }, wishes: [] }),
    kleptomaniac: T('Клептоман', 'lifestyle', 't_klepto', 'Не может удержаться, чтобы не стащить что-нибудь.', { age: 'child', auto: { swipe: 3 }, wishes: ['swipe'] }),
    light_sleeper: T('Чуткий сон', 'physical', 't_light', 'Просыпается от любого шороха.', { age: 'child', need: { energy: 1.05 }, conflicts: ['heavy_sleeper'] }),
    loner: T('Одиночка', 'social', 't_loner', 'Любит тишину и покой. Общаться нужно реже, но недолго.', { age: 'child', need: { social: 0.5 }, auto: { social: 0.5, read: 1.3 }, conflicts: ['party_animal'], wishes: ['read_book', 'stargaze'] }),
    loves_outdoors: T('Любит природу', 'lifestyle', 't_outdoors', 'Чувствует себя счастливым на свежем воздухе.', { age: 'child', auto: { outdoors: 3, garden: 1.5, fish: 1.5 }, wishes: ['visit', 'fish_any', 'plant'] }),
    lucky: T('Везунчик', 'lifestyle', 't_lucky', 'Удача часто на его стороне.', { age: 'child', conflicts: ['unlucky'] }),
    mean_spirited: T('Злобный', 'social', 't_mean', 'Любит сказать гадость и посмотреть на реакцию.', { age: 'child', auto: { mean: 2.5 }, soc: { friendly: -15 }, conflicts: ['friendly', 'good'], wishes: ['mean'] }),
    natural_cook: T('Прирождённый повар', 'lifestyle', 't_cook', 'Готовит вкусно даже без рецепта и редко что-то сжигает.', { age: 'child', skill: { cooking: 1.5 }, auto: { cook: 2.5 }, wishes: ['cook', 'skill_cooking'] }),
    neat: T('Аккуратный', 'physical', 't_neat', 'Не выносит беспорядка и сам убирает за всеми.', { auto: { clean: 4, shower: 1.3 }, need: { hygiene: 1.2 }, conflicts: ['slob'], wishes: ['clean', 'shower'] }),
    neurotic: T('Невротик', 'mental', 't_neurotic', 'Всё время волнуется. Чистота и порядок его успокаивают.', { age: 'teen', auto: { clean: 2 }, wishes: ['clean'] }),
    no_sense_of_humor: T('Нет чувства юмора', 'social', 't_nohumor', 'Шутки его не смешат. Вообще.', { age: 'child', soc: { funny: -30 }, auto: { funny: 0.1 }, conflicts: ['good_sense_of_humor'] }),
    party_animal: T('Душа компании', 'social', 't_party', 'Вечеринки для него смысл жизни.', { age: 'teen', need: { social: 1.3 }, auto: { social: 1.8, dance: 2.5, party: 2 }, conflicts: ['loner'], wishes: ['party', 'dance', 'invite'] }),
    perfectionist: T('Перфекционист', 'mental', 't_perfect', 'Делает всё идеально, но дольше. Плохой результат его расстраивает.', { age: 'child', wishes: ['cook', 'paint'] }),
    shy: T('Застенчивый', 'social', 't_shy', 'Стесняется незнакомцев и больших компаний.', { age: 'child', soc_actor: -8, conflicts: ['charismatic'], auto: { social: 0.6 } }),
    slob: T('Неряха', 'physical', 't_slob', 'Беспорядок его не беспокоит. А гигиена падает быстрее.', { need: { hygiene: 0.8 }, auto: { clean: 0.05 }, conflicts: ['neat'] }),
    snob: T('Сноб', 'social', 't_snob', 'Ценит дорогие вещи и изысканную обстановку.', { age: 'teen', soc: { friendly: -5 }, wishes: ['buy_obj', 'visit'] }),
    technophobe: T('Технофоб', 'mental', 't_techno', 'Не доверяет технике. Компьютер и телевизор его раздражают.', { age: 'child', auto: { computer: 0.05, tv: 0.2, read: 1.5 }, conflicts: ['computer_whiz'], wishes: ['read_book', 'plant'] }),
    unflirty: T('Недотрога', 'social', 't_unflirty', 'Флирт ему неприятен. Романтика только с близким человеком.', { age: 'teen', soc: { romantic: -40 }, auto: { romance: 0.2 }, conflicts: ['flirty', 'hopeless_romantic'] }),
    unlucky: T('Неудачник', 'lifestyle', 't_unlucky', 'Если что-то может пойти не так, это случится именно с ним.', { age: 'child', conflicts: ['lucky'] }),
    vegetarian: T('Вегетарианец', 'lifestyle', 't_veggie', 'Не ест мясо. И очень расстраивается, если всё-таки съел.', { age: 'child' }),
    virtuoso: T('Виртуоз', 'lifestyle', 't_virtuoso', 'Музыка у него в крови. Гитара звучит как песня.', { age: 'child', skill: { guitar: 1.6 }, auto: { guitar: 3, music: 2 }, conflicts: ['cant_stand_art'], wishes: ['play_guitar', 'guitar_tips'] }),
    workaholic: T('Трудоголик', 'lifestyle', 't_workaholic', 'Работа приносит ему радость. Выходные только мешают.', { age: 'teen', work: 1.25, wishes: ['promote', 'reach_level'] })
  };
  const TRAIT_KEYS = Object.keys(TRAITS);
  for (const k of TRAIT_KEYS) {
    for (const c of TRAITS[k].conflicts) {
      if (TRAITS[c] && !TRAITS[c].conflicts.includes(k)) TRAITS[c].conflicts.push(k);
    }
  }
  const TRAIT_CATS = { mental: 'Ум', physical: 'Тело', social: 'Общение', lifestyle: 'Образ жизни' };

  Object.assign(S, { TRAITS, TRAIT_KEYS, TRAIT_CATS });
  if (typeof module !== 'undefined' && module.exports) module.exports = S;
})(globalThis.Sims3 = globalThis.Sims3 || {});
