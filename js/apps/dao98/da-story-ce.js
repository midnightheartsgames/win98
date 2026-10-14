(function (D) {
  'use strict';
  const H = (race, sex, o) => Object.assign({ kind: 'humanoid', race, sex }, o);
  const elf = (sex, tint, o) => H('elf', sex, Object.assign({ armor: 'cloth', tint, skin: '#e8c4a0', hair: '#6a4020', hairStyle: sex === 'f' ? 'tail' : 'short' }, o));

  D.COMPANIONS.nelaros = { name: 'Нелорос', race: 'elf', cls: 'warrior', sex: 'm', model: elf('m', '#d8d0c0', { armor: 'wedding', hair: '#c8a060' }), lvl: 2, attr: { str: 14, dex: 14, con: 13 }, equip: { main: 'longsword_iron', chest: 'wedding_clothes' }, ab: ['precise_striking'], temp: 1, build: 'warrior', scale: false };

  D.npc('cyrion', { name: 'Сирион', model: elf('m', '#6a5a4a', { hair: '#8a8a8a', beard: 'none' }) });
  D.npc('shianni', { name: 'Шианни', sex: 'f', model: elf('f', '#7a4a5a', { hair: '#b04a20', hairStyle: 'short' }) });
  D.npc('soris_npc', { name: 'Сорис', model: D.COMPANIONS.soris.model });
  D.npc('nesiara', { name: 'Несиара', sex: 'f', model: elf('f', '#e0d8c8', { armor: 'wedding', hair: '#c8a060', hairStyle: 'long' }) });
  D.npc('nelaros_npc', { name: 'Нелорос', model: D.COMPANIONS.nelaros.model });
  D.npc('valora', { name: 'Валора', sex: 'f', model: elf('f', '#e0d8c8', { armor: 'wedding', hair: '#3a2414', hairStyle: 'braids' }) });
  D.npc('valendrian', { name: 'Старейшина Валендриан', model: elf('m', '#4a5a3a', { hair: '#d8d8d8', hairStyle: 'long', armor: 'robe' }) });
  D.npc('alarith', { name: 'Аларит', model: elf('m', '#5a4a3a', { hair: '#3a2414', beard: 'none' }) });
  D.npc('ce_elf', { name: 'Житель эльфинажа', model: elf('m', '#6a6a5a'), barks: ['Со свадьбой! Давно у нас не было праздника.', 'Говорят, на юге война. Нас-то это не касается.', 'Смотри, стражники опять у ворот.'], wander: 3 });
  D.npc('ce_elf_f', { name: 'Жительница эльфинажа', sex: 'f', model: elf('f', '#8a6a6a'), barks: ['Какая красивая свадьба будет!', 'Шианни опять что-то задумала, я по глазам вижу.'], wander: 3 });
  D.npc('ce_child', { name: 'Ребёнок', model: elf('m', '#8a7a5a', { scale: 0.6 }), wander: 4, barks: ['А у вас правда свадьба? А пирог будет?'] });
  D.npc('vaughan_npc', { name: 'Вон Кенделлс', model: H('human', 'm', { skin: '#f0d0b4', hair: '#c8a060', hairStyle: 'short', armor: 'noble', tint: '#5a2a5a' }), equip: { main: 'vaughan_sword' } });
  D.npc('vaughan_friend', { name: 'Приятель Вона', model: H('human', 'm', { skin: '#e8c4a0', hair: '#3a2414', hairStyle: 'short', armor: 'noble', tint: '#3a5a4a' }), equip: { main: 'longsword_iron' } });
  D.npc('ce_captain', { name: 'Капитан городской стражи', model: H('human', 'm', { armor: 'splint', tint: '#6a5a2a', beard: 'full', helm: 'splint' }), equip: { main: 'longsword_grey', off: 'kite_iron' } });
  D.npc('ce_servant', { name: 'Эльфийка-служанка', sex: 'f', model: elf('f', '#8a8a7a'), anim: 'work' });

  D.TEMPLATES.vaughan = { id: 'vaughan', name: 'Вон Кенделлс', race: 'human', model: D.NPCS.vaughan_npc.model, cls: 'warrior', lvl: 3, attr: { str: 13, dex: 13, con: 12 }, hp: 125, equip: { main: 'vaughan_sword' }, ab: ['precise_striking'], xp: 300, loot: 'noble', rank: 'lt' };

  D.questDef('ce_wedding', { name: 'Свадьба в эльфинаже', stages: { 1: 'Сегодня ваша свадьба. Отец велел найти кузена Сориса, у него тоже свадьба. Шианни ждёт на площади.', 2: 'Сорис у лавки Аларита. Надо отвести его к невестам.', 3: 'Вы познакомились с тем, с кем вас сосватали. Старейшина Валендриан ждёт у помоста.', 4: 'Всё готово. Поговорите с Валендрианом, чтобы начать обряд.', 9: 'Свадьбу сорвали люди Вона Кенделлса.' }, done: 9, xp: 350 });
  D.questDef('ce_rescue', { name: 'Спасти невест', stages: { 1: 'Вон и его люди увели Шианни, Валору и других девушек в поместье эрла. Сорис раздобыл оружие.', 2: 'Ворота эльфинажа ведут в город. Поместье эрла рядом.', 3: 'Вы в поместье эрла Денерима. Нужно найти покои Вона.', 4: 'Вон мёртв. Девушки свободны.', 5: 'Вы взяли деньги Вона. Девушки остались в поместье.', 9: 'Вы вернулись в эльфинаж. Дункан воспользовался правом призыва, чтобы спасти вас от виселицы.' }, done: 9, xp: 500 });
  D.questDef('ce_alarith', { name: 'Подарок Аларита', stages: { 1: 'Аларит обещал свадебный подарок, если вы заглянете в его лавку после обряда.', 9: 'Аларит отдал подарок.' }, done: 9, xp: 50 });

  D.codex('alienage', 'Места', 'Эльфинаж Денерима', 'Огороженный квартал, где живут эльфы Денерима. Посреди главной площади растёт древо — валладахл, память о родных лесах, которых никто из здешних эльфов не видел. Люди заходят сюда по делам, и редко с добром.');
  D.codex('vaughan', 'Персонажи', 'Вон Кенделлс', 'Сын эрла Денерима, Урьена Кенделлса. Скучающий, жестокий, уверенный, что закон на его стороне. Обычно так и есть.');

  D.area('alienage', {
    name: 'Эльфинаж Денерима', w: 84, h: 66, codex: 'alienage', onEnter: 'ce_enter', art: 'alienage',
    theme: g => (g.flag('ce_night') ? 'alienage_eve' : 'alienage'),
    build(b) {
      b.fill('dirt');
      b.noiseHeights(0.15, 8, 71);
      b.wall(0, 0, 84, 2, 'brick', 6); b.wall(0, 64, 84, 2, 'brick', 6); b.wall(0, 0, 2, 66, 'brick', 6); b.wall(82, 0, 2, 66, 'brick', 6);
      b.clear(40, 0, 4, 2, 'cobble');
      b.exit('to_estate', 41, 1, { to: 'estate', at: 'start', req: 'quest.ce_rescue>=2', reqText: 'Ворота эльфинажа. За ними город.', label: 'Ворота в город' });
      b.ground(28, 20, 28, 26, 'cobble');
      b.path([[42, 2], [42, 20]], 4, 'cobble');
      b.path([[28, 40], [15, 48]], 3, 'road'); b.path([[56, 40], [70, 56]], 3, 'road'); b.path([[42, 46], [42, 62]], 3, 'road');
      b.prop('bigtree', 41, 31);
      b.raise(37, 12, 10, 6, 0.5);
      b.ground(37, 12, 10, 6, 'wood');
      b.prop('altar', 41, 12, { col: '#d8c060' });
      b.props('banner', [[36, 12], [47, 12], [36, 17], [47, 17]], { col: '#4a8a3a' });
      b.props('planter', [[37, 18], [46, 18]]);
      for (const [x, z, w, d] of [[4, 4, 10, 8], [16, 4, 10, 8], [54, 4, 10, 8], [66, 4, 12, 8], [4, 16, 10, 10], [66, 16, 12, 9], [4, 30, 10, 10], [66, 30, 12, 10], [58, 50, 10, 10], [72, 52, 8, 8], [22, 52, 10, 9], [48, 54, 8, 7]]) b.house(x, z, w, d, { closed: 1, wall: 'timber', roof: 'thatch' });
      b.room(4, 44, 12, 10, { wall: 'timber', floor: 'wood', h: 3.4 });
      b.roofShell(4, 44, 12, 10, { mat: 'thatch', h: 3.4, peak: 2.6, hideInside: true });
      b.opening(15, 48, 1, 1, 'wood');
      b.door('ce_home_door', 15, 48, { axis: 'z', open: true });
      b.props('bed', [[5, 45], [7, 45]]); b.prop('table', 9, 50); b.prop('chest', 13, 45); b.prop('cauldron', 5, 51); b.props('chair', [[9, 49], [10, 51]]);
      b.light(9, 48, { kind: 'candle', y: 1, r: 6 });
      b.prop('stall', 55, 36, { col: '#4a6a3a' }); b.props('crate', [[59, 36], [59, 37]]);
      b.prop('well', 62, 44); b.props('barrel', [[20, 26], [21, 26], [62, 26]]); b.props('crate', [[24, 44], [25, 44]]); b.prop('cart', 70, 44);
      b.props('bench', [[32, 26], [48, 26], [32, 38], [48, 38]]);
      b.props('table', [[34, 22], [46, 22]]); b.props('candles', [[34, 22], [46, 22]]);
      for (const [x, z] of [[30, 22], [54, 22], [30, 44], [54, 44], [42, 10], [42, 4]]) b.light(x, z, { r: 8 });
      b.light(41, 14, { kind: 'brazier', y: 1.3, r: 9, if: 'ce_night' }); b.prop('brazier', 44, 14, { if: 'ce_night' });
      b.spot('home', 8, 49, Math.PI / 2);
      b.spot('from_estate', 42, 4, Math.PI);
      b.npc('cyrion', 10, 47, { face: -1.6, dlg: 'ce_cyrion', unless: 'ce_end_now' });
      b.npc('shianni', 38, 36, { face: 0.5, dlg: 'ce_shianni', unless: 'ce_kidnapped' });
      b.npc('soris_npc', 57, 39, { face: -1.5, dlg: 'ce_soris', unless: 'ce_soris_moved' });
      b.npc('soris_npc', 44, 22, { face: Math.PI, dlg: 'ce_soris2', if: 'ce_soris_moved', unless: 'ce_kidnapped' });
      b.npc('soris_npc', 11, 51, { face: -2, dlg: 'ce_cyrion', if: 'ce_kidnapped', unless: 'ce_armed' });
      b.npc('nesiara', 42, 21, { face: Math.PI, dlg: 'ce_betrothed', if: 'male', unless: 'ce_kidnapped' });
      b.npc('nelaros_npc', 42, 21, { face: Math.PI, dlg: 'ce_betrothed', if: 'female', unless: 'ce_kidnapped' });
      b.npc('valora', 45, 21, { face: Math.PI, unless: 'ce_kidnapped' });
      b.npc('valendrian', 41, 15, { face: 0, dlg: 'ce_valendrian', unless: 'ce_kidnapped' });
      b.npc('alarith', 55, 38, { face: -0.3, dlg: 'ce_alarith' });
      b.npc('ce_elf', 34, 30, {}); b.npc('ce_elf_f', 50, 30, {}); b.npc('ce_elf', 26, 40, { anim: 'sit' }); b.npc('ce_elf_f', 60, 28, {}); b.npc('ce_child', 45, 40, {}); b.npc('ce_child', 30, 34, {}); b.npc('ce_elf', 70, 56, { anim: 'drink' });
      b.trig('ce_vaughan_trig', 34, 18, 16, 6, { run: 'ce_vaughan', req: 'quest.ce_wedding>=3', unless: 'ce_vaughan_met' });
      b.box('ce_home_chest', 13, 45, { kind: 'chest', loot: [['ring_duster', 1], ['poultice_lesser', 1]], gold: 80, label: 'Семейный сундук' });
      b.box('ce_barrel', 20, 26, { kind: 'barrel', loot: [['elfroot', 2]] });
    }
  });

  D.area('estate', {
    name: 'Поместье эрла Денерима', w: 60, h: 50, wallH: 5, theme: 'estate', onEnter: 'estate_enter', art: 'castle_night',
    build(b) {
      b.fill('wood');
      b.wall(0, 0, 60, 50, 'stone', 5);
      b.hall(24, 40, 12, 8, { floor: 'stone' });
      b.hall(4, 34, 16, 13, { floor: 'stone' });
      b.opening(20, 42, 4, 2, 'stone');
      b.hall(26, 20, 8, 20, { floor: 'carpet' });
      b.opening(28, 39, 4, 1, 'stone');
      b.hall(4, 14, 18, 14, { floor: 'wood' });
      b.opening(22, 22, 4, 2, 'wood');
      b.hall(38, 20, 18, 16, { floor: 'rug' });
      b.opening(34, 26, 4, 2, 'wood');
      b.hall(28, 12, 4, 8, { floor: 'carpet' });
      b.hall(8, 3, 32, 9, { floor: 'wood' });
      b.hall(44, 3, 12, 13, { floor: 'rug' });
      b.opening(40, 6, 4, 1, 'wood');
      b.door('es_vdoor', 41, 6, { axis: 'z', lock: 2, key: 'vaughan_key', lockText: 'Покои Вона заперты. Ключ, наверное, у кого-то из стражи.' });
      b.clear(29, 48, 2, 2, 'stone');
      b.exit('estate_out', 29, 48, { to: 'alienage', at: 'from_estate', label: 'Выход для слуг', req: 'quest.ce_rescue>=4', reqText: 'Сначала найдите девушек.' });
      b.prop('forge', 5, 35); b.props('table', [[10, 40], [14, 40]]); b.prop('cauldron', 8, 44); b.props('barrel', [[18, 35], [18, 36]]); b.light(6, 36, { kind: 'fire', y: 0.8, r: 9 });
      for (let i = 0; i < 4; i++) b.prop('bed', 5 + i * 4, 15); b.props('rack', [[20, 15], [20, 16]]); b.prop('table', 11, 22); b.prop('chest', 5, 25);
      b.prop('table', 44, 26); b.prop('table', 48, 26); b.props('chair', [[43, 25], [46, 25], [49, 25], [43, 28], [46, 28], [49, 28]]); b.props('candles', [[45, 26], [49, 26]]); b.prop('painting', 47, 20); b.prop('fountain', 51, 32);
      b.props('banner', [[10, 3], [20, 3], [30, 3]], { col: '#6a5a2a' }); b.props('pillar', [[14, 8], [24, 8], [34, 8]]); b.prop('statue', 38, 4);
      b.prop('bed', 52, 4); b.prop('bed', 53, 4); b.prop('wardrobe', 45, 4); b.prop('table', 48, 10); b.prop('throne', 54, 12);
      for (const [x, z] of [[29, 44], [12, 38], [12, 20], [29, 28], [29, 15], [46, 22], [52, 30], [20, 6], [48, 8], [36, 8]]) b.light(x, z, { r: 8 });
      b.spot('start', 29, 46, Math.PI);
      b.npc('ce_servant', 12, 42, { face: 0, dlg: 'ce_servant' });
      b.foes('guard_denerim', [[8, 18], [14, 22]], { group: 'es_barracks' });
      b.foes('guard_denerim', [[29, 24], [30, 30]], { group: 'es_corr' });
      b.foes('noble_thug', [[44, 30], [50, 24]], { group: 'es_dining' });
      b.foe('guard_captain', 20, 7, { group: 'es_upper', opts: { hpMul: 0.7 } });
      b.foe('guard_denerim', 32, 6, { group: 'es_upper' });
      b.foe('vaughan', 50, 10, { group: 'es_vaughan', neutral: true, dlg: 'ce_vaughan_final', face: -1.5 });
      b.foe('noble_thug', 48, 12, { group: 'es_vaughan', neutral: true, dlg: 'ce_vaughan_final' });
      b.npc('shianni', 54, 14, { face: -1.5, anim: 'cower', dlg: 'ce_shianni_saved', unless: 'ce_bribed' });
      b.npc('valora', 53, 12, { face: -1.5, anim: 'cower', unless: 'ce_bribed' });
      b.npc('nesiara', 55, 10, { face: -1.5, anim: 'cower', if: 'male', unless: 'ce_bribed' });
      b.box('es_barracks_chest', 5, 25, { kind: 'chest', loot: [['vaughan_key', 1], ['poultice_lesser', 2]], gold: 200 });
      b.box('es_rack', 20, 16, { kind: 'crate', loot: [['longsword_grey', 1], ['leather_chest_q', 1], ['kite_iron', 1]] });
      b.box('es_kitchen', 10, 40, { kind: 'barrel', loot: [['poultice_lesser', 1]] });
      b.box('es_wardrobe', 45, 4, { kind: 'wardrobe', loot: [['noble_clothes', 1], ['ring_silver', 1]], gold: 900 });
    }
  });

  D.dialogs(`
== ce_cyrion
@ start
=> night ?ce_kidnapped ?!ce_armed
=> later ?ce_armed
cyrion: Вот и настал этот день. Моё дитя выходит замуж. Мать бы тобой гордилась, {name}.
* Я немного волнуюсь. => nerv
* Ты правда рад этой свадьбе? => glad
@ nerv
cyrion: Все волнуются. Я на своей свадьбе чуть не упал с помоста. Твоя мать потом смеялась над этим двадцать лет.
=> task
@ glad
cyrion: Твой суженый... хорош{ая семья|ий парень}. Из Хайевера, из приличной семьи. Сваты старались. Всё будет хорошо.
=> task
@ task
cyrion: Шианни забегала, искала тебя. И Сорис куда-то пропал, а у него тоже сегодня свадьба. Найди его, ладно? А я пока соберусь.
! quest:ce_wedding:1 codex:elves
@ night
cyrion: Ты очнул{ся|ась}! Хвала Создателю... Они увели Шианни, Валору и других. Вон Кенделлс. Сын эрла.
soris_npc: Я принёс оружие. Аларит прятал его под прилавком. Пойдёшь со мной? Мы вытащим их.
* Идём. Прямо сейчас. => arm
* Это самоубийство. Но я иду. => arm
@ arm
cyrion: Будьте осторожны. Вернитесь живыми. Оба.
! set:ce_armed join:soris remove:soris_npc quest:ce_rescue:2 do:ce_arm
@ later
cyrion: Идите. Ворота на севере.

== ce_shianni
@ start
shianni: Вот ты где, {name}! Ну-ка, дай посмотрю на тебя. Ничего, сойдёт. Для эльфинажа.
* Спасибо, кузина. Очень ободряет. => soris
* Где Сорис? => soris
@ soris
shianni: Сорис? Трясётся где-то у лавки Аларита. Сходи, успокой его, а то он сбежит со своей свадьбы. А я пока найду, чем бы тут отпраздновать.
! quest:ce_wedding:2

== ce_soris
@ start
soris_npc: А, это ты. Я уж думал, это Шианни опять идёт меня ругать. Слушай, а может, ну её, эту свадьбу? Сбежим вдвоём?
* Не бойся, Сорис. Всё будет хорошо. => ok
* Сбежим? И куда, к долийцам? => joke
@ joke
soris_npc: Ха. Долийцы бы нас на порог не пустили. Ладно. Идём. Невесты ждут у помоста.
=> ok
@ ok
soris_npc: Пойдём вместе. Одному страшно.
! set:ce_soris_moved do:ce_soris_walk

== ce_soris2
@ start
soris_npc: Твоя... твой суженый уже здесь. Иди, поздоровайся.

== ce_betrothed
@ start
=> after ?quest.ce_wedding>=3
=> f ?female
nesiara: Ты, должно быть, {name}. Я Несиара. Я... не знала, как ты выглядишь. Сваты говорили, ты красивый. Не соврали.
* Ты тоже очень красивая. => ok
* Рад знакомству. Надеюсь, мы поладим. => ok
@ f
nelaros_npc: Ты {name}? Я Нелорос. Я ехал из Хайевера три дня и всё думал, какая ты. Кажется, мне повезло.
* Ты тоже ничего. => ok
* Надеюсь, мы поладим. => ok
@ ok
valora: А я Валора, невеста Сориса. Он такой смешной, когда нервничает.
soris_npc: Я не нервничаю!
! quest:ce_wedding:3
@ after
narr: Вы обмениваетесь смущёнными улыбками.

== ce_vaughan
@ start
vaughan_npc: Ну и ну. Что за праздник? Свадьба у остроухих? Какое совпадение. Мы как раз искали, чем развлечься.
vaughan_friend: Смотри, Вон, сколько девиц. И все нарядные.
shianni: Катитесь отсюда. Вам здесь не рады.
vaughan_npc: Не рады? Я сын эрла. Мне везде рады. Особенно тут, где всё принадлежит моему отцу.
* Оставьте нас. Это наша свадьба. => polite
* Ещё шаг, и пожалеешь. => threat
@ polite
vaughan_npc: Какая вежливость. Мне даже скучно стало.
=> bottle
@ threat
vaughan_npc: Смелый эльф. Я запомню твоё лицо.
=> bottle
@ bottle
narr: Шианни подходит к Вону сзади и бьёт его бутылкой по голове. Вон падает в пыль.
vaughan_friend: Ты... Ты ударила сына эрла! Уходим. Уносим его. Вы ещё пожалеете, остроухие!
shianni: Ой. Кажется, я перестаралась.
valendrian: Что здесь произошло? Всем успокоиться. Друзья, готовьтесь к обряду, пока эти господа не вернулись. У нас сегодня ещё один гость.
duncan: Приветствую. Меня зовут Дункан. Я давний друг Валендриана.
valendrian: Дункан из Серых Стражей. Он ищет рекрутов. Но сегодня он мой гость на свадьбе.
! set:ce_vaughan_met quest:ce_wedding:4 codex:vaughan codex:grey_wardens

== ce_valendrian
@ start
=> go ?quest.ce_wedding>=4
valendrian: Ждём остальных. Найди Сориса и своего суженого, и начнём.
@ go
valendrian: Все собрались? Тогда начнём, пока ничего больше не случилось.
* Я готов{|а}. => wed
* Ещё минуту. => end
@ wed
valendrian: Друзья! Сегодня мы соединяем две пары перед Создателем...
narr: Ворота эльфинажа распахиваются. Вон Кенделлс с перевязанной головой входит в сопровождении вооружённых стражников.
vaughan_npc: Простите, что прерываю. Это ведь праздник, верно? А какой праздник без девушек? Взять их!
! quest:ce_wedding:9 run:ce_kidnap

== ce_alarith
@ start
=> gift ?ce_armed ?quest.ce_alarith<9
alarith: Поздравляю, поздравляю! Загляни после обряда, у меня для тебя подарок.
! quest:ce_alarith:1
@ gift
alarith: Сорис всё рассказал. Держи. Это немного, но пригодится. Верни их, слышишь?
! give:poultice_lesser:3 give:leather_chest:1 quest:ce_alarith:9

== ce_servant
@ start
ce_servant: Вы... эльфы? Из эльфинажа? Вы пришли за девушками? Их увели наверх, в покои Вона. Ключ от покоев у капитана стражи, в казарме на западе.
* Спасибо. Прячься. => end
* Помоги нам пройти. => help
@ help
ce_servant: Я могу только одно: вот припарки с кухни. Идите через коридор, в столовой пьют его дружки.
! give:poultice_lesser:2

== ce_vaughan_final
@ start
vaughan: Ну надо же. Эльф с мечом в моём доме. Отец будет в восторге.
* Где девушки? => where
* Ты умрёшь. => fight
@ where
vaughan: Там, за мной. Живые. Пока. Слушай, давай договоримся. Я дам тебе золото. Много. Ты уйдёшь, а я забуду, что видел тебя.
* Сколько? => bribe
* Нет. Ты за всё заплатишь. => fight
@ bribe
vaughan: Сотня золотых. Нет? Ладно, сотни у меня нет. Пять. Пять золотых, и ты уходишь. Девушки останутся.
soris: Ты что, серьёзно думаешь об этом?
* Беру деньги. => take
* Нет. Я пришёл за ними. => fight
@ take
vaughan: {Разумный эльф|Разумная эльфийка}. Уходите через кухню. И помни: ты меня не {видел|видела}.
! gold:50000 set:ce_bribed quest:ce_rescue:5 do:ce_bribe
@ fight
vaughan: Ну что ж. Покажите этим остроухим их место!
! fight:es_vaughan

== ce_shianni_saved
@ start
shianni: {name}... Ты пришёл{|ла}. Он... они... Я не хочу об этом говорить. Уведи нас отсюда.
* Всё кончено. Идём домой. => go
@ go
valora: Спасибо... Спасибо вам обоим.
! quest:ce_rescue:4 do:ce_saved

== ce_end
@ start
ce_captain: Кто из вас убил сына эрла? Отвечайте!
* Я. Вон заслужил смерть. => me
* Сорис здесь ни при чём. Это я. => me
@ me
soris: Нет! Я тоже был там!
ce_captain: Благородно. Но за убийство знатного человека кто-то должен ответить. Иначе мы перевешаем половину эльфинажа.
valendrian: Капитан, прошу вас...
duncan: Позвольте, капитан. Я Дункан из Серых Стражей. Я призываю этого эльфа в наш орден. По праву призыва.
ce_captain: Право призыва... Хм. Эрлу это не понравится. Но спорить со Стражами я не стану. Забирайте. И чтобы {его|её} в Денериме больше не видели.
cyrion: {name}... Береги себя.
shianni: Иди. Ты спас{|ла} нас. Иди и не оглядывайся.
* Прощай, отец. => bye
@ bye
duncan: Нам пора. Путь до Остагара неблизкий.
! quest:ce_rescue:9 leave:soris run:ce_end_go
`);

  D.script('ce_enter', function* (g) {
    if (g.flag('ce_end_now') && !g.flag('ce_end_done')) {
      g.set('ce_end_done');
      yield 0.5;
      g.spawnNpc('ce_captain', 42.5, 8.5, Math.PI);
      g.spawnNpc('duncan', 45.5, 9.5, Math.PI);
      g.spawnNpc('valendrian', 39.5, 9.5, Math.PI);
      g.spawnNpc('cyrion', 38.5, 11.5, 2);
      if (!g.flag('ce_bribed')) g.spawnNpc('shianni', 46.5, 11.5, -2);
      g.startDialog('ce_end', g.npcEnt('ce_captain'));
      return;
    }
    if (g.flag('ce_started')) {
      if (g.flag('ce_kidnapped') && !g.flag('ce_armed')) { yield 0.8; g.startDialog('ce_cyrion', g.npcEnt('cyrion')); }
      return;
    }
    g.set('ce_started');
    yield 0.6;
    g.startDialog('ce_cyrion', g.npcEnt('cyrion'));
  });
  D.script('ce_soris_walk', g => {
    const s = g.npcEnt('soris_npc');
    if (s) { g.walkNpc(s, 44.5, 22.5, Math.PI, 1); s.dlg = 'ce_soris2'; }
  });
  D.script('ce_vaughan', function* (g) {
    g.cutscene(true);
    const v = g.spawnNpc('vaughan_npc', 42.5, 6.5, 0);
    const f1 = g.spawnNpc('vaughan_friend', 40.5, 5.5, 0);
    g.walkNpc(v, 40.5, 30.5, 0, 1);
    g.walkNpc(f1, 38.5, 29.5, 0, 1);
    yield 3;
    g.cutscene(false);
    g.startDialog('ce_vaughan', v);
    yield 'dlg';
    g.hideNpc('vaughan_npc'); g.hideNpc('vaughan_friend');
    g.spawnNpc('duncan', 39.5, 17.5, 0.5);
  });
  D.script('ce_kidnap', function* (g) {
    g.cutscene(true);
    g.emit('fade', { out: 1, t: 1 });
    yield 1;
    g.showSlides([
      { img: 'wedding', text: 'Стражники рассыпаются по площади. Кто-то кричит, кто-то бежит. Шианни дерётся, как дикая кошка, пока её не скручивают.' },
      { img: 'alienage', text: 'Вы бросаетесь наперерез, и последнее, что вы видите, — рукоять меча, летящая вам в лицо.' }
    ]);
    yield 'slides';
    g.set('ce_kidnapped'); g.set('ce_night');
    g.setQuest('ce_rescue', 1);
    g.cutscene(false);
    g.goto('alienage', 'home');
  });
  D.script('ce_arm', g => {
    const c = g.pc;
    if (c.equip.chest === 'wedding_clothes') { g.give('leather_chest', 1); g.equipFromInv(c, 'chest', 'leather_chest'); }
    if (!c.equip.main) { const w = c.cls === 'rogue' ? 'dagger_iron' : 'longsword_iron'; g.give(w, 1); g.equipFromInv(c, 'main', w); if (c.cls === 'rogue') { g.give('dagger_iron', 1); g.equipFromInv(c, 'off', 'dagger_iron'); } }
    if (g.pc.sex === 'f') g.join('nelaros');
  });
  D.script('estate_enter', function* (g) {
    if (g.flag('es_seen')) return;
    g.set('es_seen');
    g.setQuest('ce_rescue', 3);
    yield 0.5;
    g.toast('Поместье эрла. Тихо.');
  });
  D.GROUPS.es_vaughan = { onClear: 'es_vaughan_dead' };
  D.script('es_vaughan_dead', function* (g) {
    yield 0.8;
    g.startDialog('ce_shianni_saved', g.npcEnt('shianni'));
  });
  D.script('ce_saved', g => {
    g.set('ce_end_now');
    for (const id of ['shianni', 'valora', 'nesiara']) { const e = g.npcEnt(id); if (e) { e.anim = 'idle'; e.following = true; e.faction = 'ally'; } }
  });
  D.script('ce_bribe', g => {
    g.set('ce_end_now');
    for (const e of g.ents.filter(x => x.group === 'es_vaughan')) { e.gone = true; }
    g.setQuest('ce_rescue', 4);
  });
  D.script('ce_end_go', function* (g) {
    g.cutscene(true);
    g.emit('fade', { out: 1, t: 1 });
    yield 1;
    g.showSlides([
      { img: 'alienage', text: 'Утром вы покидаете эльфинаж вместе с Дунканом. У ворот стоят все: отец, Шианни, Валендриан. Никто не машет вслед.' },
      { img: 'road_south', text: 'Денерим остаётся позади. Дорога на юг, к Остагару, долгая. Дункан говорит мало, но однажды замечает: «Ты сделал{|а} то, на что у многих не хватило бы смелости».' }
    ]);
    yield 'slides';
    g.cutscene(false);
    D.toOstagar(g);
  });
  D.ORIGIN_SETUP.ce = g => {
    const c = g.pc;
    Object.assign(c.equip, { chest: 'wedding_clothes' });
    g.give('poultice_lesser', 2);
    g.addGold(300);
    g.events = [];
  };
  if (typeof module !== 'undefined' && module.exports) module.exports = D;
})(globalThis.Dao98 = globalThis.Dao98 || {});
