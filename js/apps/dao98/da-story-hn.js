(function (D) {
  'use strict';
  const H = (race, sex, o) => Object.assign({ kind: 'humanoid', race, sex }, o);
  const guardLook = H('human', 'm', { armor: 'highever', tint: '#3a5a9a', helm: 'chain' });

  D.npc('bryce', { name: 'Тейрн Брайс Кусланд', model: H('human', 'm', { skin: '#e0b896', hair: '#8a8a8a', hairStyle: 'short', beard: 'full', armor: 'noble', tint: '#2a3a6a' }), lvl: 8 });
  D.npc('howe', { name: 'Эрл Рендон Хоу', model: H('human', 'm', { skin: '#e8c8a8', hair: '#3a2414', hairStyle: 'tail', beard: 'goatee', armor: 'noble', tint: '#5a1a1a' }), lvl: 8 });
  D.npc('mother', { name: 'Тейрна Элеанора', sex: 'f', model: H('human', 'f', { skin: '#f0d0b4', hair: '#6a4020', hairStyle: 'tail', armor: 'noble', tint: '#3a4a8a' }) });
  D.npc('mother_night', { name: 'Тейрна Элеанора', sex: 'f', model: H('human', 'f', { skin: '#f0d0b4', hair: '#6a4020', hairStyle: 'tail', armor: 'studded', tint: '#3a4a6a' }), equip: { main: 'longbow_grey' } });
  D.npc('fergus', { name: 'Фергюс Кусланд', model: H('human', 'm', { skin: '#e8c4a0', hair: '#3a2414', hairStyle: 'short', beard: 'full', armor: 'highever', tint: '#3a5a9a' }), equip: { main: 'longsword_steel' } });
  D.npc('oriana', { name: 'Ориана', sex: 'f', model: H('human', 'f', { skin: '#e8c8a8', hair: '#1a1410', hairStyle: 'long', armor: 'noble', tint: '#8a6a3a' }) });
  D.npc('oren', { name: 'Орен', model: H('human', 'm', { skin: '#f0d0b4', hair: '#3a2414', hairStyle: 'short', armor: 'cloth', tint: '#6a8a5a', scale: 0.6 }) });
  D.npc('nan', { name: 'Нэн', sex: 'f', model: H('human', 'f', { skin: '#e8c4a0', hair: '#b0b0b0', hairStyle: 'tail', armor: 'cloth', tint: '#7a6a5a', fat: 1 }), anim: 'work' });
  D.npc('gilmore_npc', { name: 'Сэр Гилмор', model: H('human', 'm', { skin: '#e8c4a0', hair: '#6a4020', hairStyle: 'short', armor: 'highever', tint: '#3a5a9a' }), equip: { main: 'longsword_grey', off: 'kite_iron' } });
  D.npc('aldous', { name: 'Брат Алдус', model: H('human', 'm', { skin: '#e8c8a8', hair: '#c8c8c8', hairStyle: 'bald', beard: 'full', armor: 'robe', tint: '#6a5a3a' }), anim: 'read' });
  D.npc('landra', { name: 'Леди Ландра', sex: 'f', model: H('human', 'f', { skin: '#f0d0b4', hair: '#c8a060', hairStyle: 'long', armor: 'noble', tint: '#7a2a4a' }), anim: 'drink' });
  D.npc('dairren', { name: 'Дайррен', model: H('human', 'm', { skin: '#f0d0b4', hair: '#c8a060', hairStyle: 'short', armor: 'noble', tint: '#4a6a3a' }), barks: ['Говорят, король Кайлан сам поведёт армию!', 'Мать опять выпила лишнего. Не обращайте внимания.'] });
  D.npc('iona', { name: 'Иона', sex: 'f', model: H('elf', 'f', { skin: '#f0d0b4', hair: '#c8a060', hairStyle: 'tail', armor: 'cloth', tint: '#5a5a6a' }), barks: ['Леди Ландра просила вина. Опять.', 'Замок у вас большой. Я уже дважды заблудилась.'] });
  D.npc('hn_guard', { name: 'Стражник Хайевера', model: guardLook, equip: { main: 'longsword_iron', off: 'kite_iron' }, anim: 'guard', barks: ['Милорд.', 'Спокойного дня.', 'Войска эрла Хоу ещё в пути, говорят.', 'Мабари опять на кухне. Удачи.'] });
  D.npc('hn_mabari', { name: 'Мабари', race: 'beast', model: { kind: 'dog', col: '#8a6238' }, nat: { dmgBase: 10, spd: 1.5, arm: 2 } });

  D.TEMPLATES.hn_castle_guard = { id: 'hn_castle_guard', name: 'Стражник Хайевера', race: 'human', model: guardLook, cls: 'warrior', lvl: 2, attr: { str: 14, dex: 12, con: 13 }, equip: { main: 'longsword_iron', off: 'kite_iron', chest: 'highever_chest' }, ab: [], xp: 0, loot: 'none', rank: 'normal' };

  D.questDef('hn_main', { name: 'Отец ждёт', stages: { 1: 'Тейрн Брайс ждёт вас в главном зале замка.', 2: 'Вы передали Фергюсу приказ отца. Мать хотела вас видеть.', 9: 'День подошёл к концу.' }, done: 9 });
  D.questDef('hn_dog', { name: 'Мабари в кладовой', stages: { 1: 'Кухарка Нэн жалуется, что ваш мабари опять пробрался в кладовую. Кухня в восточном крыле замка.', 2: 'Нэн показала дверь в кладовую. Пёс где-то там, как и крысы.', 9: 'Пёс снова с вами. Нэн может спокойно печь свои пироги.' }, done: 9, xp: 150 });
  D.questDef('hn_fergus', { name: 'Приказ для Фергюса', stages: { 1: 'Отец просил передать Фергюсу, чтобы тот вёл войска на юг, в Остагар. Покои брата в западном крыле.', 9: 'Фергюс выступил на юг во главе войска Хайевера.' }, done: 9, xp: 100 });
  D.questDef('hn_escape', { name: 'Бегство из Хайевера', stages: { 1: 'Люди Хоу напали на замок. Нужно найти отца. Мать говорит, что он ушёл к главному залу.', 2: 'Ориана и Орен мертвы. Хоу заплатит за это.', 3: 'Сэр Гилмор держит главные ворота. Отец, раненый, ушёл к кладовой: там выход для слуг.', 9: 'Отец умирает в Хайевере. Мать осталась с ним. Дункан вывел вас из замка по праву призыва Серых Стражей.' }, done: 9, xp: 400 });
  D.questDef('hn_vault', { name: 'Наследие Кусландов', stages: { 1: 'Мать дала вам ключ от сокровищницы в восточном крыле. Там семейные меч и щит.', 9: 'Меч и щит Кусландов не достанутся Хоу.' }, done: 9, xp: 150 });

  D.codex('cousland', 'Персонажи', 'Семья Кусланд', 'Кусланды правят тейрнством Хайевер на северном побережье Ферелдена с незапамятных времён. Тейрн Брайс сражался бок о бок с королём Мариком. Его жена Элеанора в молодости была известна тем, что выходила в море с пиратами и возвращалась с добычей. Старший сын Фергюс унаследует тейрнство.');
  D.codex('howe', 'Персонажи', 'Рендон Хоу', 'Эрл Амарантайна, старый боевой товарищ тейрна Брайса. Хоу честолюбив и считает, что его род обделили землями и титулами. Сегодня ночью он показал, чего стоит его дружба.');
  D.codex('highever', 'Места', 'Хайевер', 'Замок Кусландов стоит над морем на севере Ферелдена. Стены его пережили орлесианскую оккупацию: в Хайевере говорят, что захватчики брали город трижды и трижды уходили ни с чем.');

  D.area('highever', {
    name: 'Замок Хайевер', w: 86, h: 78, wallH: 5, codex: 'highever',
    theme: g => (g.flag('hn_night') ? 'castle_night' : 'castle_day'), onEnter: 'hn_enter',
    build(b) {
      b.fill('grass');
      b.noiseHeights(0.6, 9, 4, (x, z) => x < 2 || z < 2 || x > 83 || z > 73);
      b.wall(3, 3, 80, 42, 'stone', 6);
      b.hall(29, 19, 27, 24, { floor: 'flag', h: 7 });
      b.ground(40, 20, 5, 23, 'carpet');
      b.opening(41, 43, 3, 2, 'flag');
      b.hall(14, 30, 15, 3, { floor: 'flag', h: 5 });
      b.hall(14, 5, 3, 36, { floor: 'flag', h: 5 });
      b.hall(4, 5, 9, 9, { floor: 'wood' });
      b.hall(4, 15, 9, 10, { floor: 'wood' });
      b.hall(4, 26, 9, 11, { floor: 'wood' });
      b.hall(4, 38, 9, 6, { floor: 'wood' });
      b.hall(18, 5, 10, 9, { floor: 'wood' });
      b.hall(18, 16, 10, 12, { floor: 'wood' });
      b.hall(18, 34, 10, 10, { floor: 'flag' });
      b.hall(35, 6, 15, 11, { floor: 'wood' });
      b.opening(42, 17, 1, 2, 'flag');
      b.hall(56, 30, 12, 3, { floor: 'flag', h: 5 });
      b.hall(68, 5, 3, 36, { floor: 'flag', h: 5 });
      b.hall(72, 5, 9, 9, { floor: 'flag' });
      b.hall(72, 15, 9, 12, { floor: 'flag' });
      b.hall(72, 28, 9, 13, { floor: 'flag' });
      b.hall(58, 5, 9, 10, { floor: 'wood' });
      b.hall(58, 16, 9, 13, { floor: 'flag' });
      b.hall(58, 34, 9, 10, { floor: 'flag' });
      for (const [x, z] of [[13, 9], [13, 19], [13, 31], [13, 40], [17, 9], [17, 21], [22, 33], [71, 9], [71, 20], [76, 27], [67, 9], [67, 21], [62, 33]]) b.opening(x, z, 1, 1, 'flag');
      b.opening(27, 30, 2, 3, 'flag');
      b.opening(56, 30, 1, 3, 'flag');
      b.door('d_pc', 13, 9, { axis: 'z', open: true });
      b.door('d_parents', 13, 19, { axis: 'z' });
      b.door('d_fergus', 13, 31, { axis: 'z', open: true });
      b.door('d_landra', 17, 21, { axis: 'z', open: true });
      b.door('d_library', 17, 9, { axis: 'z', open: true });
      b.door('d_armory', 22, 33, { axis: 'x', lock: 2 });
      b.door('d_vault', 71, 9, { axis: 'z', lock: 9, key: 'vault_key', lockText: 'Сокровищница заперта. Ключ у матери.' });
      b.door('d_kitchen', 71, 20, { axis: 'z', open: true });
      b.door('d_larder', 76, 27, { axis: 'x' });
      b.door('d_study', 42, 17, { axis: 'x' });
      b.opening(81, 36, 2, 1, 'flag');
      b.exit('servants_exit', 81, 36, { run: 'hn_exit_try', label: 'Проход для слуг' });
      b.wall(17, 44, 51, 30, 'stone', 6);
      b.clear(18, 45, 49, 28, 'cobble');
      b.opening(41, 43, 3, 3, 'flag');
      b.ground(38, 45, 9, 28, 'road');
      b.wall(17, 70, 4, 4, 'stone', 9); b.wall(64, 70, 4, 4, 'stone', 9);
      b.wall(17, 44, 3, 3, 'stone', 9); b.wall(65, 44, 3, 3, 'stone', 9);
      b.clear(41, 73, 3, 1, 'road');
      b.prop('gate', 41, 73, { block: 1 }); b.prop('gate', 42, 73, { block: 1 }); b.prop('gate', 43, 73, { block: 1 });
      b.prop('pillar', 33, 23); b.prop('pillar', 33, 29); b.prop('pillar', 33, 35); b.prop('pillar', 51, 23); b.prop('pillar', 51, 29); b.prop('pillar', 51, 35);
      b.prop('throne', 44, 19, { rot: 0 });
      b.prop('table', 36, 25, { rot: 1 }); b.prop('table', 36, 31, { rot: 1 }); b.prop('table', 48, 25, { rot: 1 }); b.prop('table', 48, 31, { rot: 1 });
      b.props('bench', [[37, 25, 1], [37, 31, 1], [47, 25, 1], [47, 31, 1]]);
      b.props('banner', [[31, 19], [53, 19], [29, 26], [55, 26], [29, 38], [55, 38]], { col: '#2a4a9a' });
      b.light(30, 30, { kind: 'brazier', y: 1.4, r: 9 }); b.prop('brazier', 30, 30);
      b.light(54, 30, { kind: 'brazier', y: 1.4, r: 9 }); b.prop('brazier', 54, 30);
      b.light(38, 20, { r: 8 }); b.light(46, 20, { r: 8 }); b.light(42, 41, { r: 8 });
      b.light(15, 12, { r: 6 }); b.light(15, 24, { r: 6 }); b.light(15, 36, { r: 6 }); b.light(21, 31, { r: 6 });
      b.light(69, 12, { r: 6 }); b.light(69, 24, { r: 6 }); b.light(69, 36, { r: 6 }); b.light(62, 31, { r: 6 });
      b.prop('bed', 5, 6); b.prop('chest', 11, 6); b.prop('wardrobe', 5, 12); b.prop('table_round', 9, 11); b.light(8, 8, { kind: 'candle', y: 1.0, r: 5 });
      b.prop('bed', 5, 16); b.prop('bed', 6, 16); b.prop('wardrobe', 11, 16); b.prop('table', 8, 22); b.light(8, 20, { kind: 'candle', y: 1.0, r: 5 });
      b.prop('bed', 5, 27); b.prop('bed', 11, 34, { rot: 0 }); b.prop('chest', 5, 35); b.prop('table_round', 9, 29); b.light(8, 31, { kind: 'candle', y: 1.0, r: 5 });
      b.props('crate', [[5, 39], [6, 39], [11, 42]]); b.props('barrel', [[5, 42], [11, 39]]);
      b.props('bookcase', [[18, 5], [21, 5], [24, 5]]); b.props('bookcase', [[26, 8, 1], [26, 11, 1]]); b.prop('table', 20, 10); b.prop('lectern', 23, 9); b.light(22, 8, { kind: 'candle', y: 1.1, r: 6 });
      b.prop('bed', 19, 16); b.prop('bed', 26, 16); b.prop('table_round', 23, 22); b.props('chair', [[22, 22], [24, 23]]); b.prop('wardrobe', 26, 26); b.light(22, 20, { kind: 'candle', y: 1.1, r: 6 });
      b.props('rack', [[18, 35], [19, 35], [26, 35], [26, 36]]); b.prop('dummy', 21, 39); b.prop('anvil', 25, 41);
      b.props('bookcase', [[35, 6], [38, 6]]); b.prop('table', 41, 10); b.prop('chair', 42, 12); b.light(42, 8, { kind: 'candle', y: 1.1, r: 6 });
      b.props('chest', [[73, 6], [75, 6], [79, 6]]); b.prop('statue', 79, 11); b.light(76, 9, { kind: 'candle', y: 1.0, r: 5 });
      b.prop('forge', 78, 16); b.prop('cauldron', 74, 17); b.prop('table', 75, 21); b.prop('table', 75, 24); b.props('barrel', [[79, 25], [79, 24], [73, 25]]); b.light(79, 17, { kind: 'fire', y: 0.8, r: 9 });
      b.props('barrel', [[73, 29], [73, 30], [74, 29], [79, 29], [79, 30], [73, 39], [74, 39]]); b.props('crate', [[77, 29], [78, 29], [79, 39], [79, 38], [73, 34]]); b.props('sack', [[75, 30], [77, 39], [78, 34]]); b.light(76, 33, { kind: 'candle', y: 1.5, r: 6 });
      b.props('bed', [[59, 6], [61, 6], [63, 6], [65, 6]]); b.prop('table', 61, 11);
      b.props('rack', [[59, 17], [60, 17], [65, 17]]); b.prop('table', 61, 22); b.props('chair', [[60, 22], [63, 22]]);
      b.props('crate', [[59, 35], [60, 35], [65, 42], [59, 42]]); b.props('barrel', [[64, 35], [65, 35]]);
      b.prop('well', 29, 57); b.props('dummy', [[23, 50], [26, 50], [29, 50]]); b.props('rack', [[22, 47], [23, 47]]);
      b.props('hay', [[60, 49], [61, 49], [62, 49]]); b.prop('cart', 58, 56); b.props('crate', [[61, 63], [62, 63], [61, 64]]); b.props('barrel', [[20, 66], [21, 66], [20, 67]]);
      b.prop('stall', 50, 64);
      b.light(39, 46, { r: 7 }); b.light(45, 46, { r: 7 }); b.light(39, 70, { r: 7 }); b.light(45, 70, { r: 7 });
      b.light(30, 60, { kind: 'fire', y: 0.6, r: 10, col: [1, 0.5, 0.2], if: 'hn_night' }); b.light(55, 55, { kind: 'fire', y: 0.6, r: 10, col: [1, 0.5, 0.2], if: 'hn_night' });
      b.prop('campfire', 30, 60, { if: 'hn_night', fire: 1 }); b.prop('campfire', 55, 55, { if: 'hn_night', fire: 1 });
      b.scatter(['pine', 'tree'], 0, 0, 86, 3, 18); b.scatter(['pine', 'tree'], 0, 74, 86, 4, 16); b.scatter(['pine'], 83, 0, 3, 78, 10); b.scatter(['pine'], 0, 0, 3, 78, 10);

      b.spot('pc_room', 7, 9, Math.PI / 2); b.spot('bed', 7, 8, Math.PI / 2);
      b.npc('gilmore_npc', 11, 9, { face: -Math.PI / 2, unless: 'hn_started' });
      b.npc('bryce', 42, 22, { face: 0, unless: 'hn_night' });
      b.npc('howe', 39, 23, { face: 0.6, unless: 'hn_night' });
      b.npc('duncan', 45, 23, { face: -0.6, if: 'hn_met_bryce', unless: 'hn_night' });
      b.npc('hn_guard', 40, 41, { face: 0, unless: 'hn_night' }); b.npc('hn_guard', 44, 41, { face: 0, unless: 'hn_night' });
      b.npc('hn_guard', 30, 62, { wander: 4, unless: 'hn_night' }); b.npc('hn_guard', 50, 52, { wander: 5, unless: 'hn_night' }); b.npc('hn_guard', 42, 70, { face: 0, unless: 'hn_night', anim: 'guard' });
      b.npc('mother', 22, 20, { face: 1.2, unless: 'hn_night' }); b.npc('landra', 24, 22, { face: -1.8, unless: 'hn_night' }); b.npc('dairren', 20, 24, { face: 0.4, unless: 'hn_night' }); b.npc('iona', 26, 19, { face: -1.2, unless: 'hn_night' });
      b.npc('fergus', 8, 30, { face: 0.8, unless: ['hn_night', 'quest.hn_fergus>=9'] });
      b.npc('oriana', 6, 32, { face: 1.6, unless: 'hn_night' }); b.npc('oren', 9, 33, { face: 3, unless: 'hn_night' });
      b.npc('nan', 76, 19, { face: 3.1, unless: 'hn_night' });
      b.npc('aldous', 21, 9, { face: 1.5, unless: 'hn_night' });
      b.npc('hn_mabari', 76, 38, { face: 3.1, unless: ['hn_night', 'quest.hn_dog>=9'] });
      b.foes('giant_rat', [[74, 31], [78, 32], [75, 35], [79, 36], [77, 37], [73, 37]], { group: 'hn_rats', unless: 'quest.hn_dog>=9', asleep: true });
      b.trig('hn_larder_trig', 72, 28, 9, 3, { run: 'hn_larder_enter', unless: ['hn_night', 'quest.hn_dog>=9'] });

      b.npc('mother_night', 11, 9, { face: -Math.PI / 2, if: 'hn_night', unless: 'hn_mother_joined' });
      b.foes('howe_soldier', [[15, 16], [15, 18]], { group: 'hn_c1', if: 'hn_night' });
      b.foe('howe_archer', 15, 26, { group: 'hn_c1', if: 'hn_night' });
      b.foes('howe_soldier', [[20, 31], [24, 30]], { group: 'hn_c2', if: 'hn_night' });
      b.foe('howe_archer', 25, 32, { group: 'hn_c2', if: 'hn_night' });
      b.prop('corpse', 7, 32, { if: 'hn_night' }); b.prop('corpse', 9, 33, { if: 'hn_night', small: 1 });
      b.trig('hn_oriana', 4, 26, 9, 11, { run: 'hn_oriana', if: 'hn_night' });
      b.foes('howe_soldier', [[20, 18], [25, 24]], { group: 'hn_c3', if: 'hn_night' });
      b.prop('corpse', 22, 21, { if: 'hn_night' }); b.prop('corpse', 24, 19, { if: 'hn_night' });
      b.foes('howe_soldier', [[38, 28], [46, 28], [42, 34]], { group: 'hn_hall', if: 'hn_night' });
      b.foe('howe_archer', 35, 21, { group: 'hn_hall', if: 'hn_night' });
      b.foe('howe_knight', 42, 24, { group: 'hn_hall', if: 'hn_night' });
      b.foes('hn_castle_guard', [[40, 38], [44, 38], [42, 40]], { group: 'hn_allies', ally: true, if: 'hn_night' });
      b.foes('howe_soldier', [[35, 55], [48, 60], [42, 64], [26, 64]], { group: 'hn_yard', if: 'hn_night' });
      b.foe('howe_archer', 55, 60, { group: 'hn_yard', if: 'hn_night' });
      b.foes('hn_castle_guard', [[40, 67], [44, 67], [42, 68]], { group: 'hn_allies2', ally: true, if: 'hn_night' });
      b.npc('gilmore_npc', 42, 69, { face: 3.1, if: 'hn_night', dlg: 'hn_gilmore_night', anim: 'guard' });
      b.foes('howe_soldier', [[62, 30], [64, 31]], { group: 'hn_c4', if: 'hn_night' });
      b.foe('howe_knight', 69, 12, { group: 'hn_c5', if: 'hn_night' });
      b.foe('howe_soldier', 69, 8, { group: 'hn_c5', if: 'hn_night' });
      b.foe('howe_soldier', 77, 22, { group: 'hn_c6', if: 'hn_night' });
      b.foe('howe_archer', 79, 18, { group: 'hn_c6', if: 'hn_night' });
      b.prop('corpse', 75, 20, { if: 'hn_night' });
      b.box('vault_chest', 77, 6, { kind: 'chest', loot: [['cousland_sword', 1], ['cousland_shield', 1]], gold: 2500, run: 'hn_vault_open', if: 'hn_night' });
      b.box('vault_chest_day', 77, 6, { kind: 'chest', lock: 9, lockText: 'Семейная сокровищница. Без отцовского разрешения сюда нельзя.', unless: 'hn_night' });
      b.npc('bryce', 77, 36, { face: -1.6, if: 'hn_night', anim: 'wounded', dlg: 'hn_bryce_dying' });
      b.npc('duncan', 75, 34, { face: 1.6, if: 'hn_night', dlg: 'hn_bryce_dying' });
      b.trig('hn_larder_night', 72, 32, 9, 8, { run: 'hn_larder_night', if: 'hn_night', req: '!combat' });

      b.box('pc_chest', 11, 6, { kind: 'chest', loot: [['poultice_lesser', 2], ['ring_iron', 1]], gold: 300 });
      b.box('armory_chest', 25, 42, { kind: 'chest', lock: 2, table: 'soldier_rich', loot: [['chain_head', 1]] });
      b.box('study_chest', 36, 12, { kind: 'chest', lock: 1, gold: 800, loot: [['amulet_andraste', 1]] });
      b.box('kitchen_barrel', 73, 24, { kind: 'barrel', noblock: 1, loot: [['elfroot', 3], ['flask', 2]] });
      b.box('barracks_chest', 65, 11, { kind: 'chest', loot: [['poultice_lesser', 1], ['leather_boots', 1]], gold: 120 });
      b.box('guard_crate', 59, 24, { kind: 'crate', loot: [['stamina_draught', 1]] });
      b.box('storage_crate', 60, 41, { kind: 'crate', loot: [['trap_trigger', 1], ['metal_shards', 2]] });
      b.box('landra_chest', 19, 26, { kind: 'chest', lock: 1, gold: 400, loot: [['ring_silver', 1]], unless: 'hn_night' });
    }
  });

  D.dialogs(`
== hn_gilmore
@ start
gilmore_npc: А, вы уже встали. Простите, что без стука. Нэн рвёт и мечет: ваш мабари снова пробрался в кладовую.
* Опять? Что он там устроил? => what
* Доброе утро, сэр Гилмор. => what
@ what
gilmore_npc: Служанки визжат, Нэн грозится уйти от нас навсегда. Пёс не пускает туда ни души. И ещё: тейрн просил вас зайти в главный зал.
* Сначала заберу пса. Пойдёшь со мной? => go
* Отец ждёт. Пса заберу потом. => go
@ go
gilmore_npc: С удовольствием. Если в кладовой опять крысы, лишний меч не помешает. Кухня в восточном крыле, главный зал прямо по коридору.
! set:hn_started join:gilmore remove:gilmore_npc quest:hn_dog:1 quest:hn_main:1

== hn_bryce
@ start
=> after ?hn_met_bryce
bryce: А вот и {name}. Рендон, ты ведь помнишь моего младш{его|ую}?
howe: Как же, как же. {Вырос|Выросла} так, что не узнать. {Моя Делайла|Мой Томас} о вас всё время спрашивает.
* Приветствую, эрл Хоу. => greet
* Отец, ты хотел меня видеть? => orders
@ greet
howe: Вежлив{|а}, как всегда. Брайс, ты воспитал достойную смену.
bryce: Не льсти, а то зазнается.
=> orders
@ orders
bryce: Слушай. Армия короля собирается в Остагаре. Войска Рендона задерживаются, поэтому Фергюс поведёт наших людей вперёд, а мы с эрлом выступим следом.
bryce: Пока меня нет, замок на тебе. Мать поможет. Держи порядок и не давай страже скучать.
* Я справлюсь. => duncan
* Я хочу пойти с вами на войну. => want
@ want
bryce: Знаю. Но кто-то из Кусландов должен остаться в Хайевере. Твоя очередь ещё придёт.
=> duncan
@ duncan
hn_guard: Милорд, прибыл Дункан из Серых Стражей. Говорит, дело не терпит.
bryce: Впусти его.
! do:hn_duncan_in
duncan: Тейрн Кусланд. Благодарю, что приняли меня без промедления.
bryce: Рендон, это Дункан, командор Серых Стражей Ферелдена. Он ищет новобранцев.
howe: Стражи в Хайевере? Мне об этом не сообщали.
bryce: Я не обязан сообщать тебе о своих гостях, Рендон.
duncan: Я присматриваюсь к сэру Гилмору. Но и о вашем {сыне|дочери} наслышан. Говорят, {он|она} неплохо держит меч.
bryce: Нет уж. Один мой ребёнок уходит на войну. Второго Стражам я не отдам.
* Я могу решить сам{|а}. => self
* Отец прав. Моё место здесь. => agree
* Кто такие Серые Стражи? => who
@ who
duncan: Орден, который сражается с порождениями тьмы. Мы берём лучших, откуда бы они ни пришли. На юге говорят о Море. Боюсь, это не просто слухи.
! codex:grey_wardens
=> refuse
@ self
bryce: Сам{|а}? Пока я жив, решаю я. Не обижайся, Дункан.
=> refuse
@ agree
duncan: Разумно. Я не стану настаивать.
=> refuse
@ refuse
duncan: Ваше право, тейрн.
bryce: Найди Фергюса и скажи ему выступать на юг. Потом загляни к матери. И ради Андрасте, забери пса из кладовой, пока Нэн не ушла от нас.
! set:hn_met_bryce quest:hn_fergus:1 codex:howe
@ after
bryce: Фергюс, наверное, у себя в покоях. Прощается с Орианой и Ореном.
* А если войска Хоу опоздают снова? => late once
* Иду. => end
@ late
bryce: Рендон мой старый друг. Мы воевали вместе с Мариком. Раз он говорит, что догонит, значит, догонит.
howe: Непременно, Брайс. Непременно.
=> after

== hn_nan
@ start
=> done ?quest.hn_dog>=9
nan: Опять вы. Ваша псина засела в моей кладовой, как у себя дома. Служанки визжат, крысы жрут, а я не могу достать муку!
* Сейчас разберусь. => go
* Нэн, ты же любишь этого пса. => love
@ love
nan: Люблю? Я его кормлю. Это разные вещи. Забирайте свою скотину и дайте мне работать.
=> go
@ go
nan: Кладовая за той дверью. И не натопчите мне.
! quest:hn_dog:2
@ done
nan: Пёс у вас? Хвала Андрасте. Идите, идите, у меня пироги.

== hn_dog_found
@ start
narr: Мабари выбирается из-за бочек и облизывается. Судя по всему, крысы понравились ему больше муки.
gilmore: Ну вот, пёс цел, а крысам не повезло. Если позволите, я вернусь к воротам.
* Спасибо, Гилмор. => ok
* Хороший мальчик. Идём. => ok
@ ok
! join:dog leave:gilmore quest:hn_dog:9 codex:mabari
narr: Пёс радостно гавкает и пристраивается рядом.

== hn_fergus
@ start
=> after ?quest.hn_fergus>=9
fergus: А, младш{ий брат|ая сестрёнка}! Пришёл{|ла} проводить? Или отец прислал поторопить?
* Отец велел выступать. => orders
* Ориана, Орен, доброе утро. => family
@ family
oriana: Доброе утро. Орен с рассвета ходит за отцом хвостом.
oren: Я тоже хочу на войну! У меня есть меч!
fergus: Видишь? Растёт смена. Лет через десять порождения тьмы будут прятаться от одного его имени.
=> orders
@ orders
fergus: Значит, пора. А я думал, успею позавтракать. Не скучай тут. Привезу тебе голову порождения тьмы. Ну, или зуб.
* Береги себя, Фергюс. => bye
* Не проиграй там войну без меня. => joke
@ joke
fergus: Ха! Постараюсь. Хотя без тебя будет скучновато.
=> bye
@ bye
oriana: Возвращайся, любимый. Мы будем ждать.
fergus: Вернусь. Обещаю.
! quest:hn_fergus:9 quest:hn_main:2 remove:fergus
@ after
oriana: Он уже уехал. Орен всё утро простоял у окна.

== hn_mother
@ start
=> ready ?quest.hn_fergus>=9 ?hn_met_bryce
mother: Вот ты где. Леди Ландра как раз рассказывала, как её Дайррен мечтает о славе.
landra: Мечтает, мечтает. Не то что некоторые, кто целыми днями возится с собаками. Правда, {дорогой|милочка}?
* Рад{|а} вас видеть, леди Ландра. => polite
* Вы уже с утра за вином, миледи? => rude
@ polite
landra: Какие манеры! Элеанора, хоть кого-то ты вырастила как следует.
=> duty
@ rude
landra: Ха! Язычок совсем как у матери в молодости.
mother: Не слушай её. И не дерзи гостям.
=> duty
@ duty
mother: Отец, наверное, дал тебе поручения. Займись ими. Поговорим вечером.
@ ready
mother: Фергюс уехал? Хорошо. Уже темнеет. Отдохни, {name}, завтра отец выступает, а замок останется на нас двоих.
* Спокойной ночи, мама. => sleep
* Я ещё немного пройдусь. => end
@ sleep
mother: Спокойной ночи. И пса с собой возьми, а то он опять сбежит к Нэн.
! run:hn_night

== hn_aldous
@ start
aldous: А, мой бывший ученик. Пришли наконец выучить историю, которую прогуливали десять лет?
* Расскажи о Ферелдене. => history
* Что ты знаешь о Серых Стражах? => wardens
* В другой раз, Алдус. => end
@ history
aldous: Сорок лет назад Орлей держал Ферелден за горло. Король Марик и его друг Логейн Мак Тир подняли восстание и выгнали орлесианцев. Ваш отец тогда... впрочем, вы опять не слушаете.
! codex:ferelden xp:25
=> more
@ wardens
aldous: Стражи сражались в каждом Море. При короле Арленде их изгнали из Ферелдена, а вернул их Марик. Говорят, они знают о порождениях тьмы то, чего не знает никто.
! codex:grey_wardens
=> more
@ more
aldous: Что-нибудь ещё?
* Расскажи о Море. => blight once
* Нет, спасибо. => end
@ blight
aldous: Мор начинается, когда порождения тьмы находят одного из древних богов и заражают его скверной. Последний был четыреста лет назад. Если орда на юге — это Мор, всем нам будет не до уроков.
! codex:blight
=> more

== hn_landra
@ start
landra: Ваша матушка в молодости плавала с пиратами, вы знали? Сама рассказывала. После третьего кубка.

== hn_night_mother
@ start
narr: Вас будит лай мабари. За дверью звенит сталь. В комнату вбегает мать с луком в руках, кольчуга натянута прямо на ночную рубашку.
mother_night: {name}, вставай! Люди Хоу в замке! Они открыли ворота и режут всех подряд!
* Хоу? Он же друг отца! => betray
* Где отец? => father
@ betray
mother_night: Друг... Этот ублюдок всё продумал. Его войска не задерживались. Они ждали ночи.
=> father
@ father
mother_night: Брайс пошёл к главному залу, когда всё началось. Надо найти его. Потом уходим через проход для слуг в кладовой.
mother_night: Возьми ключ от сокровищницы. Там меч и щит нашего рода. Хоу их не получит.
! join:eleanor remove:mother_night give:vault_key quest:hn_escape:1 quest:hn_vault:1 codex:cousland
* Идём. Они за это заплатят. => go
* Сначала Ориана и Орен! => oren
@ oren
mother_night: Да. Их комната рядом. Скорее!
=> go
@ go
narr: В коридоре топот сапог. Чужие гербы на щитах.

== hn_oriana_dead
@ start
narr: Ориана лежит у кровати. Рядом маленький Орен, всё ещё сжимающий деревянный меч. Дверь выбита.
eleanor: Нет... Только не они. Орен... мой мальчик...
* Мама, нам нужно идти. => go
* (Молча закрыть им глаза) => go
@ go
eleanor: Хоу заплатит за каждого из них. Клянусь Создателем.
! quest:hn_escape:2

== hn_gilmore_night
@ start
gilmore_npc: Вы живы! Хвала Создателю. Ворота мы пока держим, но их слишком много.
* Где отец? => father
* Держитесь, Гилмор. => father
@ father
gilmore_npc: Тейрн был здесь. Его ранили, он ушёл к кладовой. Там выход для слуг. Бегите, пока мы стоим!
! quest:hn_escape:3

== hn_bryce_dying
@ start
bryce: {name}... Элеанора... Хвала Создателю, вы живы.
eleanor: Брайс! Ты ранен... Дай посмотреть.
bryce: Поздно, милая. Меня достали ещё у ворот. Сюда я дошёл, а дальше уже не смогу.
duncan: Люди Хоу вот-вот будут здесь. Я выведу вас через проход для слуг, но тейрна нам не донести.
* Мы тебя не бросим, отец! => refuse
* Дункан, помоги ему! => help
@ refuse
bryce: Бросите. Кто-то из Кусландов должен выжить и рассказать королю, что сделал Хоу.
=> deal
@ help
duncan: Помог бы, если б мог. Рана смертельна.
=> deal
@ deal
bryce: Дункан... Ты хотел взять {моего сына|мою дочь} в Стражи. Бери сейчас. Только выведи отсюда.
duncan: Выведу. Но взамен {он станет|она станет} Серым Стражем. Мне нужны люди в Остагаре, а времени мало.
eleanor: Я останусь с Брайсом. Не спорь. Я задержу их, сколько смогу.
* Мама, нет! => mother
* Я пойду с Дунканом. => accept
@ mother
eleanor: Я прожила с ним тридцать лет. Не отнимай у меня последние минуты. Иди. Найди Фергюса и расскажи ему. И возьми кольцо. Оно моё с тех пор, как я вышла замуж.
! give:ring_highever
=> accept
@ accept
bryce: Я горжусь тобой. Иди.
duncan: Пора. Быстро.
! leave:eleanor quest:hn_escape:9 quest:hn_main:9 run:hn_end
`);

  D.script('hn_enter', function* (g) {
    if (!g.flag('hn_started')) {
      yield 0.6;
      g.startDialog('hn_gilmore', g.npcEnt('gilmore_npc'));
    }
  });
  D.script('hn_duncan_in', g => { g.spawnNpc('duncan', 45.5, 23.5, -0.6); });
  D.script('hn_larder_enter', function* (g) {
    g.fightGroup('hn_rats');
    yield 'fight';
    const dog = g.npcEnt('hn_mabari');
    if (dog) g.walkNpc(dog, g.leader.x + 1, g.leader.z + 1);
    yield 0.8;
    g.startDialog('hn_dog_found', dog);
  });
  D.GROUPS.hn_rats = {};
  D.script('hn_night', function* (g) {
    g.cutscene(true);
    g.emit('fade', { out: 1, t: 1.2 });
    yield 1.3;
    g.showSlides([
      { img: 'castle_night', text: 'Ночь опускается на Хайевер. Фергюс увёл войско на юг, тейрн ждёт отряды эрла Хоу, которые подойдут к утру.' },
      { img: 'castle_fire', text: 'Но задолго до рассвета у ворот замка вспыхивают факелы. Кто-то изнутри поднимает решётку.' }
    ]);
    yield 'slides';
    g.set('hn_night');
    g.doorState('highever', 'd_larder', false);
    g.doorState('highever', 'd_vault', false);
    if (!g.roster.dog) g.join('dog');
    g.goto('highever', 'bed');
    yield () => !g.pendingGoto && g.mode !== 'loading';
    g.emit('fade', { out: 0, t: 1 });
    g.cutscene(false);
    yield 0.5;
    g.startDialog('hn_night_mother', g.npcEnt('mother_night'));
  });
  D.script('hn_oriana', g => { g.startDialog('hn_oriana_dead', null); });
  D.script('hn_vault_open', g => { g.setQuest('hn_vault', 9); g.toast('Меч и щит Кусландов в ваших руках.'); });
  D.script('hn_larder_night', function* (g) {
    yield 0.3;
    const b = g.npcEnt('bryce');
    g.startDialog('hn_bryce_dying', b);
  });
  D.script('hn_exit_try', g => {
    if (g.questDone('hn_escape')) return;
    g.toast(g.flag('hn_night') ? 'Сначала найдите отца.' : 'Проход для слуг. Сейчас он вам ни к чему.');
  });
  D.script('hn_end', function* (g) {
    g.cutscene(true);
    g.emit('fade', { out: 1, t: 1 });
    yield 1;
    g.showSlides([
      { img: 'escape', text: 'Вы с Дунканом выбираетесь из замка через проход для слуг. Позади горит Хайевер. Никто не гонится за вами: люди Хоу слишком заняты грабежом.' },
      { img: 'road_south', text: 'Много дней вы едете на юг. Дункан почти не говорит. Однажды вечером он сказал только: «В Остагаре ты сможешь рассказать всё королю. Но сначала ты станешь Стражем».' }
    ]);
    yield 'slides';
    g.cutscene(false);
    D.toOstagar(g);
  });

  for (const [n, d] of [['bryce', 'hn_bryce'], ['howe', 'hn_bryce'], ['nan', 'hn_nan'], ['fergus', 'hn_fergus'], ['oriana', 'hn_fergus'], ['mother', 'hn_mother'], ['landra', 'hn_landra'], ['aldous', 'hn_aldous'], ['gilmore_npc', 'hn_gilmore']]) D.NPCS[n].dlg = d;
  D.ORIGIN_SETUP.hn = g => {
    const c = g.pc;
    if (c.cls === 'warrior') Object.assign(c.equip, { main: 'longsword_iron', off: 'buckler_iron', chest: 'highever_chest', boots: 'chain_boots', gloves: 'leather_gloves' });
    else { Object.assign(c.equip, { main: 'dagger_iron', off: 'dagger_iron', chest: 'highever_leather', boots: 'leather_boots' }); c.set2 = { main: 'shortbow_iron', off: null }; }
    g.give('poultice_lesser', 3);
    g.addGold(5000);
    g.events = [];
  };
  if (typeof module !== 'undefined' && module.exports) module.exports = D;
})(globalThis.Dao98 = globalThis.Dao98 || {});
