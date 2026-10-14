(function (D) {
  'use strict';
  const H = (race, sex, o) => Object.assign({ kind: 'humanoid', race, sex }, o);
  const villager = (sex, tint, o) => H('human', sex, Object.assign({ armor: 'cloth', tint, skin: '#e0b896', hair: '#6a4020', hairStyle: sex === 'f' ? 'tail' : 'short' }, o));

  D.npc('bandit_leader_npc', { name: 'Главарь разбойников', model: H('human', 'm', { armor: 'chain', tint: '#6a4a2a', beard: 'full', hair: '#3a2414' }), equip: { main: 'longsword_grey', off: 'kite_iron' } });
  D.npc('lot_chanter', { name: 'Церковный глашатай', model: villager('m', '#c8b890', { armor: 'robe', hair: '#8a8a8a', beard: 'full' }), anim: 'talk' });
  D.npc('lot_merchant', { name: 'Торговец', model: villager('m', '#6a4a2a', { fat: 1, beard: 'full' }) });
  D.npc('lot_farmer', { name: 'Фермер', model: villager('m', '#7a6a4a', { hair: '#9a6a30', beard: 'stubble' }), barks: ['Урожай пропадёт. Кто ж его теперь соберёт.'] });
  D.npc('lot_refugee', { name: 'Беженка', sex: 'f', model: villager('f', '#6a6a5a'), wander: 2, barks: ['Мы шли с юга три дня. Там никого не осталось.', 'Говорят, король погиб. Правда?', 'Храни нас Андрасте.'] });
  D.npc('lot_refugee_m', { name: 'Беженец', model: villager('m', '#5a5040'), barks: ['Логейн нас спас, говорят. Врут, наверное.', 'Куда теперь идти? На север? А там что?'] });
  D.npc('lot_child', { name: 'Ребёнок', model: villager('m', '#8a7a5a', { scale: 0.6 }), wander: 3, barks: ['Вы Серый Страж? Настоящий?'] });
  D.npc('sten_npc', { name: 'Кунари в клетке', model: D.COMPANIONS.sten.model, anim: 'sit', radius: 0.45 });
  D.npc('lot_mother', { name: 'Преподобная мать', sex: 'f', model: H('human', 'f', { skin: '#f0d0b4', hair: '#c8c8c8', hairStyle: 'tail', armor: 'robe', tint: '#c8b890', helm: 'hat' }) });
  D.npc('ser_bryant', { name: 'Сэр Брайант', model: H('human', 'm', { skin: '#e0b896', hair: '#8a8a8a', hairStyle: 'short', beard: 'full', armor: 'templar' }), equip: { main: 'longsword_steel', off: 'kite_steel' } });
  D.npc('lot_sister', { name: 'Сестра Церкви', sex: 'f', model: H('human', 'f', { skin: '#f0d0b4', hair: '#6a4020', hairStyle: 'tail', armor: 'robe', tint: '#d8c8a0' }), anim: 'kneel' });
  D.npc('barkeep', { name: 'Трактирщик', model: villager('m', '#8a6a4a', { hair: '#3a2414', beard: 'goatee', fat: 1 }) });
  D.npc('lot_drunk', { name: 'Пьяница', model: villager('m', '#5a4a3a', { beard: 'stubble' }), anim: 'drink', barks: ['Ещё кружку! За покойного короля!', 'Порождения тьмы? Ик. Пусть приходят.'] });
  D.npc('leliana_npc', { name: 'Лелиана', sex: 'f', model: D.COMPANIONS.leliana.model, equip: { main: 'dagger_iron', chest: 'clothes' } });
  D.npc('lot_sergeant', { name: 'Сержант Логейна', model: H('human', 'm', { armor: 'splint', tint: '#3a4a5a', beard: 'full' }), equip: { main: 'greatsword_grey' } });

  D.TEMPLATES.lot_sergeant_foe = Object.assign({}, D.TEMPLATES.loghain_sergeant, { id: 'lot_sergeant_foe', name: 'Сержант Логейна' });

  D.questDef('lot_main', { name: 'Лотеринг', stages: { 1: 'Лотеринг — последняя деревня перед землями эрлов. Здесь можно пополнить припасы и узнать новости.', 2: 'Солдаты Логейна в таверне искали Серых Стражей. Логейн объявил вас изменниками и убийцами короля.', 9: 'Вы покинули Лотеринг.' }, done: 9, xp: 300 });
  D.questDef('lot_toll', { name: 'Дорожная пошлина', stages: { 1: 'На тракте у Лотеринга разбойники берут с беженцев «пошлину».', 8: 'Разбойники больше никого не тронут.', 9: 'Разбойники сбежали, прихватив остатки гордости.' }, done: 8, xp: 200 });
  D.questDef('lot_board', { name: 'Доска объявлений', stages: { 1: 'Глашатай у доски в центре Лотеринга платит за помощь деревне.', 9: 'Вы выполнили все поручения с доски.' }, done: 9, xp: 150 });
  D.questDef('lot_camp', { name: 'Разбойничий лагерь', stages: { 1: 'В лесу к юго-западу от деревни засели разбойники. Глашатай обещал награду.', 2: 'Лагерь разбойников уничтожен. Вернитесь к глашатаю.', 9: 'Награда получена.' }, done: 9, xp: 250 });
  D.questDef('lot_beasts', { name: 'Хищники у полей', stages: { 1: 'У южных полей бродят волки и медведь. Фермеры боятся выходить.', 2: 'Хищники убиты. Вернитесь к глашатаю.', 9: 'Награда получена.' }, done: 9, xp: 200 });
  D.questDef('lot_poultices', { name: 'Лекарства для беженцев', stages: { 1: 'Сестра в церкви просит три припарки здоровья для раненых беженцев.', 9: 'Беженцы получили лекарства.' }, done: 9, xp: 200 });
  D.questDef('lot_sten', { name: 'Кунари в клетке', stages: { 1: 'Великан-кунари в клетке у церкви убил семью фермеров и ждёт смерти. Освободить его может только преподобная мать.', 2: 'Преподобная мать отдала вам ключ от клетки.', 9: 'Стэн из Берескарна присоединился к отряду.' }, done: 9, xp: 250 });
  D.questDef('lot_leliana', { name: 'Послушница из Лотеринга', stages: { 1: 'Сестра Лелиана хочет пойти с вами. Говорит, ей было видение.', 9: 'Лелиана в отряде.' }, done: 9, xp: 150 });

  D.codex('lothering', 'Места', 'Лотеринг', 'Деревня у Имперского тракта, на границе южных земель. Обычно здесь тихо. Теперь дорога забита беженцами с юга, а в таверне «Приют Дэйна» пьют солдаты, которые не хотят говорить, куда делась армия короля.');
  D.codex('qunari', 'Культура и история', 'Кунари', 'Огромные воины с далёкого севера, из-за моря. Их учение, Кун, определяет место каждого в обществе. Кунари воевали с Тевинтером и Орлеем, а в Ферелдене их почти никто не видел.');
  D.codex('leliana', 'Персонажи', 'Лелиана', 'Послушница лотерингской церкви. У неё мягкий орлейский выговор, быстрые руки и привычка петь, когда думает, что никто не слышит. Она уверена, что Создатель послал ей видение о Море.');
  D.codex('sten', 'Персонажи', 'Стэн', 'Кунари из Берескарна. Сам отдался в руки людей после убийства семьи фермеров и ждёт казни в клетке. Говорит мало, смотрит прямо, не извиняется.');
  D.codex('eamon', 'Персонажи', 'Эрл Эамон', 'Эрл Редклифа, брат покойной королевы Ровены и дядя короля Кайлана. Один из самых уважаемых людей в Ферелдене. Если кто и может бросить вызов Логейну, то он.');

  D.SHOPS.lot_merchant = { name: 'Лавка торговца', desc: 'Торговец поднял цены втрое, пока беженцы идут с юга.', markup: 1.6, items: [['poultice_lesser', 8], ['poultice', 5], ['poultice_greater', 1], ['lyrium_lesser', 5], ['lyrium', 2], ['injury_kit', 4], ['stamina_draught', 4], ['elfroot', 8], ['flask', 20], ['deathroot', 4], ['distillation', 6], ['lyrium_dust', 3], ['longsword_steel', 1], ['greataxe_grey', 1], ['longbow_grey', 1], ['dagger_steel', 1], ['staff3', 1], ['splint_chest', 1], ['studded_chest_q', 1], ['kite_steel', 1], ['chain_head_q', 1], ['enchanter_robe', 1], ['ring_silver', 1], ['belt_warrior', 1], ['amulet_dalish', 1], ['gift_statuette', 1], ['gift_black_mirror', 1], ['gift_chantry_amulet', 1], ['gift_flowers', 3], ['gift_qunari_blade', 1], ['mabari_crunch', 6], ['trap_trigger', 4], ['metal_shards', 6], ['fire_bomb', 2], ['acid_flask', 2]] };
  D.SHOPS.lot_bar = { name: 'Стойка «Приюта Дэйна»', desc: 'Эль, похлёбка и немного лекарств.', markup: 1.2, items: [['poultice_lesser', 5], ['stamina_draught', 3], ['mabari_crunch', 4], ['gift_ring', 1]] };

  D.area('lothering', {
    name: 'Лотеринг', w: 112, h: 96, theme: 'lothering', codex: 'lothering', onEnter: 'lot_enter', art: 'lothering',
    build(b) {
      b.fill('grass');
      b.noiseHeights(0.9, 12, 61);
      b.edgeCliffs(2, 6);
      b.path([[2, 18], [18, 22], [34, 34], [52, 44], [70, 44], [90, 30], [108, 8]], 4, 'road');
      b.path([[52, 44], [56, 60], [56, 80], [40, 90]], 3, 'road');
      b.path([[70, 44], [80, 62]], 3, 'road');
      b.ground(46, 38, 30, 16, 'cobble');
      b.ground(60, 64, 30, 22, 'dirt');
      for (let i = 0; i < 5; i++) b.ground(62 + i * 6, 66, 4, 18, 'straw');
      b.ground(14, 60, 24, 24, 'forest');
      b.pond(92, 60, 6, -0.25, 'marsh', 3);
      b.house(40, 26, 8, 6, { closed: 1, wall: 'timber' }); b.house(58, 26, 7, 6, { closed: 1, wall: 'timber' }); b.house(78, 34, 7, 6, { closed: 1, wall: 'timber', axis: 'z' });
      b.house(40, 54, 7, 6, { closed: 1, wall: 'timber' }); b.house(80, 48, 8, 6, { closed: 1, wall: 'timber' }); b.house(66, 22, 6, 5, { closed: 1, wall: 'timber' });
      b.house(28, 40, 8, 7, { closed: 1, wall: 'timber', roof: 'slate' });
      b.wall(60, 50, 12, 10, 'stone', 7);
      b.roofShell(60, 50, 12, 10, { mat: 'slate', h: 7, peak: 4, axis: 'z' });
      b.clear(65, 50, 2, 1, 'cobble');
      b.exit('to_chantry', 65, 49, { to: 'lot_chantry', at: 'door', label: 'Церковь Лотеринга' });
      b.wall(48, 30, 8, 6, 'timber', 4);
      b.roofShell(48, 30, 8, 6, { mat: 'thatch', h: 4, peak: 2.4 });
      b.clear(51, 36, 2, 1, 'cobble');
      b.exit('to_tavern', 51, 36, { to: 'lot_tavern', at: 'door', label: 'Таверна «Приют Дэйна»' });
      b.prop('windmill', 86, 70);
      b.prop('well', 60, 44); b.prop('board', 56, 42); b.prop('cage', 72, 50);
      b.props('fence', [[62, 64], [64, 64], [66, 64], [68, 64], [70, 64], [72, 64], [74, 64], [76, 64], [78, 64], [80, 64]]);
      b.props('cart', [[20, 20], [74, 42]], { load: 1 }); b.props('hay', [[84, 40], [85, 40]]); b.props('crate', [[47, 44], [48, 44]]); b.prop('stall', 62, 38, { col: '#3a5a8a' });
      b.props('bedroll', [[44, 46], [46, 48], [36, 36], [34, 38], [74, 56], [76, 58]]);
      b.props('campfire', [[45, 48], [35, 34], [76, 55]], { fire: 1 });
      b.light(45, 48, { kind: 'fire', y: 0.6, r: 8 }); b.light(35, 34, { kind: 'fire', y: 0.6, r: 8 }); b.light(76, 55, { kind: 'fire', y: 0.6, r: 8 });
      b.props('tent', [[30, 30], [84, 54]], { col: '#8a7a60' });
      b.prop('signpost', 12, 20); b.prop('grave', 98, 44); b.prop('grave', 100, 44); b.prop('grave', 99, 46);
      b.props('corpse', [[26, 64], [30, 70]], { col: '#6a5a3a' });
      b.props('tent', [[20, 72]], { col: '#5a4a3a' }); b.prop('campfire', 24, 70, { fire: 1 }); b.light(24, 70, { kind: 'fire', y: 0.6, r: 8 });
      b.scatter(['tree', 'pine', 'bush'], 3, 3, 106, 18, 30, { gap: 2 });
      b.scatter(['tree', 'pine', 'bush', 'rock'], 3, 56, 40, 36, 45, { gap: 2 });
      b.scatter(['tree', 'bush'], 90, 72, 18, 20, 16, { gap: 2 });
      b.scatter(['tree', 'bush', 'rock'], 94, 14, 14, 40, 14, { gap: 2 });
      b.spot('from_road', 5, 18, Math.PI / 2);
      b.spot('from_tavern', 51, 38, 0);
      b.spot('from_chantry', 65, 47, Math.PI);
      b.clear(106, 5, 5, 5, 'road');
      b.exit('to_north', 108, 7, { run: 'lot_leave_try', label: 'Дорога на север' });
      b.foe('bandit_leader', 22, 25, { group: 'lot_toll', neutral: true, dlg: 'lot_toll', opts: { name: 'Главарь разбойников' } });
      b.foes('bandit', [[20, 27], [25, 23], [24, 28]], { group: 'lot_toll', neutral: true, dlg: 'lot_toll' });
      b.foe('bandit_archer', 18, 24, { group: 'lot_toll', neutral: true, dlg: 'lot_toll' });
      b.npc('lot_refugee', 16, 21, { face: 0.5, unless: 'cleared_lot_toll', dlg: 'lot_refugee_road' });
      b.foes('bandit', [[18, 66], [22, 74], [16, 72]], { group: 'lot_bcamp', if: 'quest.lot_camp>=1' });
      b.foe('bandit_thug', 20, 68, { group: 'lot_bcamp', if: 'quest.lot_camp>=1' });
      b.foe('bandit_archer', 24, 76, { group: 'lot_bcamp', if: 'quest.lot_camp>=1' });
      b.box('camp_chest', 21, 72, { kind: 'chest', lock: 1, table: 'bandit_rich', if: 'quest.lot_camp>=1' });
      b.foe('bear', 96, 84, { group: 'lot_beasts', if: 'quest.lot_beasts>=1' });
      b.foes('wolf', [[92, 80], [100, 86], [94, 88]], { group: 'lot_beasts', if: 'quest.lot_beasts>=1' });
      b.npc('lot_chanter', 57, 44, { face: -0.3, dlg: 'lot_chanter' });
      b.npc('lot_merchant', 63, 40, { face: 0, dlg: 'lot_merchant' });
      b.npc('sten_npc', 72, 50, { face: -1.6, unless: 'quest.lot_sten>=9', dlg: 'sten_cage' });
      b.npc('lot_farmer', 70, 64, { face: 0, anim: 'work' }); b.npc('lot_farmer', 58, 70, { face: 2, anim: 'work' });
      b.npc('lot_refugee', 44, 47, { anim: 'sit', face: 0.5 }); b.npc('lot_refugee', 36, 36, { face: 2 }); b.npc('lot_refugee_m', 46, 49, { anim: 'sit', face: -1 }); b.npc('lot_refugee_m', 76, 57, { anim: 'sit', face: 1 }); b.npc('lot_refugee', 55, 48, {}); b.npc('lot_child', 50, 46, {});
      b.box('lot_barrel', 47, 45, { kind: 'barrel', loot: [['elfroot', 2]] });
      b.box('lot_crate', 79, 43, { kind: 'crate', loot: [['flask', 2], ['distillation', 1]] });
      b.box('grave_offer', 99, 45, { kind: 'sack', loot: [['gift_flowers', 1]], gold: 40 });
    }
  });

  D.area('lot_tavern', {
    name: 'Таверна «Приют Дэйна»', w: 30, h: 24, wallH: 4, theme: 'tavern', onEnter: 'tavern_enter', art: 'lothering',
    build(b) {
      b.fill('wood');
      b.room(0, 0, 30, 24, { wall: 'timber', floor: 'wood', h: 4 });
      b.clear(14, 23, 2, 1, 'wood');
      b.exit('tavern_out', 14, 23, { to: 'lothering', at: 'from_tavern', label: 'Выход' });
      b.prop('counter', 3, 3); b.props('barrel', [[1, 1], [2, 1], [8, 1], [9, 1]]);
      b.prop('forge', 24, 1, { tex: 'brick' }); b.light(25, 2, { kind: 'fire', y: 0.8, r: 9 });
      for (const [x, z] of [[6, 9], [14, 9], [22, 9], [6, 15], [22, 15]]) { b.prop('table_round', x, z); b.prop('chair', x - 1, z); b.prop('chair', x + 1, z); }
      b.prop('table', 13, 15); b.props('bench', [[13, 14], [13, 16]]);
      b.props('candles', [[6, 9], [14, 9], [22, 9]]);
      for (const [x, z] of [[4, 5], [15, 4], [26, 6], [5, 18], [24, 18], [15, 20]]) b.light(x, z, { r: 7 });
      b.spot('door', 14, 21, Math.PI);
      b.npc('barkeep', 4, 5, { face: 0, dlg: 'barkeep' });
      b.npc('lot_drunk', 7, 10, { anim: 'drink', face: 3 });
      b.npc('lot_refugee_m', 21, 10, { anim: 'sit', face: 1.5 });
      b.npc('leliana_npc', 17, 12, { face: 0, unless: 'quest.lot_leliana>=9', dlg: 'leliana_join' });
      b.npc('lot_sergeant', 14, 16, { face: Math.PI, unless: 'tavern_fought', dlg: 'tavern_fight' });
      b.foe('lot_sergeant_foe', 14, 17, { group: 'tav', neutral: true, dlg: 'tavern_fight', if: 'tavern_fight_on', unless: 'tavern_fought' });
      b.foes('loghain_soldier', [[12, 17], [16, 17], [13, 19]], { group: 'tav', neutral: true, if: 'tavern_fight_on', unless: 'tavern_fought' });
      b.foe('loghain_archer', 18, 19, { group: 'tav', neutral: true, if: 'tavern_fight_on', unless: 'tavern_fought' });
    }
  });

  D.area('lot_chantry', {
    name: 'Церковь Лотеринга', w: 34, h: 30, wallH: 7, theme: 'chantry', art: 'lothering',
    build(b) {
      b.fill('marble');
      b.room(0, 0, 34, 30, { wall: 'marble', floor: 'marble', h: 7 });
      b.ground(15, 4, 4, 25, 'carpet');
      b.clear(16, 29, 2, 1, 'marble');
      b.exit('chantry_out', 16, 29, { to: 'lothering', at: 'from_chantry', label: 'Выход' });
      b.prop('statue_big', 16, 1, { flame: 1 }); b.prop('altar', 16, 5);
      b.props('candles', [[13, 4], [20, 4], [12, 6], [21, 6]]);
      for (let i = 0; i < 5; i++) { b.prop('pew', 9, 10 + i * 3); b.prop('pew', 21, 10 + i * 3); }
      b.props('pillar', [[6, 8], [27, 8], [6, 16], [27, 16], [6, 24], [27, 24]], { tex: 'w_marble' });
      b.props('banner', [[3, 3], [30, 3]], { col: '#c8a040' });
      b.props('bedroll', [[2, 12], [2, 15], [2, 18], [31, 12], [31, 15]]);
      for (const [x, z] of [[16, 3], [4, 10], [29, 10], [4, 22], [29, 22], [16, 26]]) b.light(x, z, { r: 9, col: [1, 0.85, 0.6] });
      b.spot('door', 16, 27, Math.PI);
      b.npc('lot_mother', 16, 7, { face: Math.PI, dlg: 'lot_mother' });
      b.npc('ser_bryant', 12, 9, { face: 1.6, dlg: 'ser_bryant' });
      b.npc('lot_sister', 3, 14, { face: 1.5, dlg: 'lot_sister', anim: 'kneel' });
      b.npc('lot_refugee', 2, 17, { anim: 'lie', face: 0 }); b.npc('lot_refugee_m', 31, 13, { anim: 'sit', face: -1.5 }); b.npc('lot_refugee', 22, 13, { anim: 'pray', face: 0 }); b.npc('lot_child', 10, 20, {});
      b.box('chantry_box', 30, 3, { kind: 'chest', lock: 3, loot: [['amulet_andraste', 1], ['poultice', 2]], gold: 600 });
    }
  });

  D.dialogs(`
== lot_refugee_road
@ start
lot_refugee: Осторожно! Там, впереди, разбойники. Требуют «пошлину» за проход в Лотеринг. У нас ничего нет, а им всё мало.
! quest:lot_toll:1

== lot_toll
@ start
bandit_leader: Стоять! Дорога платная. Пошлина с головы... ну, скажем, всё, что у вас есть. Шучу. Хотя нет, не шучу.
alistair: Разбойники. Замечательно. Как будто нам мало порождений тьмы.
* Мы Серые Стражи. Уйди с дороги. => wardens
* [Запугивание] Беги, пока можешь. Последние, кто нам мешал, кормят ворон. => scared %intimidate:5:laugh
* [Убеждение] Мы только что вышли из боя с ордой. Вы правда хотите быть следующими? => scared %persuade:5:laugh
* Нападаем! => fight
@ wardens
bandit_leader: Стражи? Слыхали, слыхали. Говорят, Стражи убили короля. Логейн за ваши головы хорошо заплатит!
=> fight
@ laugh
bandit_leader: Ха! Слова ничего не стоят. Взять их!
=> fight
@ scared
bandit_leader: Эй-эй, полегче! Мы просто... уходим. Идёмте, ребята. Лотеринг нам больше не интересен.
! quest:lot_toll:9 do:lot_toll_flee
@ fight
! fight:lot_toll quest:lot_toll:1

== lot_chanter
@ start
=> turnin ?quest.lot_camp=2|quest.lot_beasts=2
lot_chanter: Слушайте, люди Лотеринга! Церковь платит тем, кто поможет деревне в трудный час! Вы, путник, не ищете работы?
* Какая работа? => jobs
* Не сейчас. => end
@ jobs
lot_chanter: В лесу к юго-западу засели разбойники. Грабят беженцев. На южных полях бродят волки и медведь, скот задирают. А сестра в церкви просит лекарств для раненых.
* Я займусь разбойниками. => camp ?quest.lot_camp=0
* Я займусь хищниками. => beasts ?quest.lot_beasts=0
* Я помогу сестре. => sister ?quest.lot_poultices=0
* Хорошо, посмотрим. => end
@ camp
lot_chanter: Да хранит вас Создатель. Лагерь где-то в лесу, за старыми могилами.
! quest:lot_camp:1 quest:lot_board:1
=> jobs
@ beasts
lot_chanter: Поля за мельницей. Будьте осторожны, медведь здоровенный.
! quest:lot_beasts:1 quest:lot_board:1
=> jobs
@ sister
lot_chanter: Сестра в церкви. Она скажет, что нужно.
! quest:lot_poultices:1 quest:lot_board:1
=> jobs
@ turnin
lot_chanter: Вы вернулись! И с добрыми вестями, как я погляжу. Вот обещанная награда, Церковь держит слово.
! do:lot_board_pay
=> jobs

== lot_merchant
@ start
lot_merchant: Добро пожаловать! Припасы, оружие, травы. Цены, правда, выросли. Сами понимаете, война.
* Покажи товар. => shop
* Ты обдираешь беженцев. => greed once
* Ничего. => end
@ greed
lot_merchant: Обдираю? Я торгую! Каждый сейчас выживает, как может.
* [Убеждение] Люди запомнят, кто им помог, а кто нажился. Сбавь цены. => cheap %persuade:5:no
* [Запугивание] Сбавь цены. Или я сам{|а} назначу тебе цену. => cheap %intimidate:6:no
* Как знаешь. => shop
@ cheap
lot_merchant: Ладно... ладно. Скидка. Для вас и для беженцев. Только не надо так смотреть.
! set:disc_lot_merchant ap:alistair:2 ap:morrigan:-2
=> shop
@ no
lot_merchant: Нет уж. Цены мои, и лавка моя.
=> shop
@ shop
! shop:lot_merchant

== sten_cage
@ start
=> free ?item.cell_key>=1
sten_npc: Чего тебе?
* Кто ты? => who
* Почему ты в клетке? => why
* Ничего. => end
@ who
sten_npc: Я Стэн из Берескарна. Солдат Бересаада, авангарда армии кунари.
! codex:qunari
=> why
@ why
sten_npc: Я убил восьмерых. Семью фермера. Детей тоже. Я не отрицаю. Я жду смерти от порождений тьмы или от голода, как решит ваша преподобная мать.
* Зачем ты это сделал? => reason
* Ухожу. => end
* Мы можем тебя освободить. Будешь сражаться с Мором. => offer
@ reason
sten_npc: Я потерял свой меч. Без меча кунари — ничто. Я очнулся, и меча не было. Люди на ферме... Мне нечего больше сказать.
=> offer_ask
@ offer_ask
sten_npc: Если хочешь что-то сказать, говори. Если нет, уходи.
* Мы можем тебя освободить. Будешь сражаться с Мором. => offer
* Ухожу. => end
@ offer
sten_npc: Искупить вину в бою с Мором? Хм. Это... достойная смерть. Лучше, чем в клетке. Но ключ у вашей преподобной матери.
! quest:lot_sten:1
@ free
sten_npc: Ты вернул{ся|ась}. С ключом.
* Ты свободен. Сражайся с нами. => join
* Я передумал{|а}. => end
@ join
sten_npc: Хорошо. Я пойду с тобой и буду сражаться с порождениями тьмы. Посмотрим, куда это нас приведёт.
alistair: Кунари-убийца в отряде. Ну хоть не ведьма. А, погоди...
morrigan: Я всё слышу, храмовник.
! take:cell_key join:sten remove:sten_npc quest:lot_sten:9 codex:sten

== lot_mother
@ start
=> after ?quest.lot_sten>=2
lot_mother: Мир тебе, дитя. Церковь открыта для всех, кто ищет утешения в эти тёмные дни.
* Что с кунари в клетке? => sten ?quest.lot_sten>=1
* Что вы знаете о битве при Остагаре? => ost once
* Благословите нас, мать. => bless once
* Прощайте. => end
@ ost
lot_mother: Говорят, тейрн Логейн вывел то, что осталось от армии. Говорят, король пал из-за измены Серых Стражей. Я не знаю, чему верить.
alistair: Изменники? Мы? Это Логейн...
=> start
@ bless
lot_mother: Да осветит Создатель вашу дорогу. Идите с миром.
! ap:alistair:1
=> start
@ sten
lot_mother: Кунари? Он убил целую семью. Сам признался. Пусть Создатель решает его судьбу.
* Отпустите его с нами. Он будет сражаться с Мором. => plead
* [Убеждение] Смерть в бою с порождениями тьмы — справедливее, чем голодная смерть в клетке. Разве Песнь не говорит о милосердии? => key %persuade:4:no
* [Запугивание] Вы отдадите ключ. Серые Стражи имеют право призыва. => key %intimidate:5:no
* Серые Стражи могут призвать кого угодно. Это закон. => warden
@ plead
lot_mother: Я не могу просто отпустить убийцу, дитя.
=> sten2
@ sten2
lot_mother: Если есть причина, по которой я должна передумать, назови её.
* [Убеждение] Смерть в бою с порождениями тьмы — справедливее, чем голодная смерть в клетке. Разве Песнь не говорит о милосердии? => key %persuade:4:no
* [Запугивание] Вы отдадите ключ. Серые Стражи имеют право призыва. => key %intimidate:5:no
* Серые Стражи могут призвать кого угодно. Это закон. => warden
* Ладно, пусть сидит. => end
@ warden
lot_mother: Право призыва... Да, я слышала о нём. Серые Стражи... пусть так. Но если он кого-то убьёт, этот грех ляжет и на вас.
=> key
@ key
lot_mother: Хорошо. Возьмите ключ. Да простит нас обоих Создатель.
! give:cell_key quest:lot_sten:2
@ no
lot_mother: Нет. Я не стану рисковать жизнями людей.
=> sten2
@ after
lot_mother: Идите с миром. И не дайте ему никого убить.

== ser_bryant
@ start
ser_bryant: Страж? Не бойтесь, я не стану вас хватать. Я не верю в сказки Логейна. Люди тут напуганы и голодны, и я делаю что могу.
* Как дела в деревне? => village once
* Удачи вам, сэр. => end
@ village
ser_bryant: Беженцы идут с юга. Разбойники наглеют. Мне не хватает людей, чтобы всех защитить. Если хотите помочь, загляните к глашатаю у доски в центре деревни.
=> start

== lot_sister
@ start
=> done ?quest.lot_poultices>=9
=> give ?quest.lot_poultices>=1
lot_sister: Столько раненых, а припарок нет. Храни нас Андрасте...
! quest:lot_poultices:1
@ give
lot_sister: Вы принесли припарки? Нам нужны хотя бы три.
* Вот, возьмите три припарки. => ok ?item.poultice_lesser>=3
* Позже. => end
@ ok
lot_sister: Благослови вас Создатель! Вот, это всё, что у нас есть. Возьмите.
! take:poultice_lesser:3 quest:lot_poultices:9 gold:600 ap:alistair:3 ap:leliana:3 ap:morrigan:-2 do:lot_board_check
@ done
lot_sister: Раненым уже легче. Спасибо вам.

== barkeep
@ start
barkeep: Добро пожаловать в «Приют Дэйна». Эль, похлёбка, постель. И поменьше вопросов, особенно сейчас.
* Что продаёшь? => shop
* Что за солдаты здесь? => soldiers ?!tavern_fought once
* Ничего. => end
@ soldiers
barkeep: Люди тейрна Логейна. Говорят, ищут Серых Стражей. Сидят тут третий день. Я бы на вашем месте к ним не подходил.
=> start
@ shop
! shop:lot_bar

== tavern_fight
@ start
lot_sergeant: Ну-ну. Кто это к нам пожаловал? Не те ли самые Серые Стражи, что убили короля? Тейрн Логейн назначил за вас награду.
alistair: Убили короля? Это ложь! Логейн бросил его умирать!
lot_sergeant: Рассказывай. Взять их, ребята. Живыми или мёртвыми, но лучше мёртвыми.
leliana_npc: Постойте! Такие благородные господа, и так неблагородно себя ведут. Это Серые Стражи, они сражались за нас всех.
lot_sergeant: Не лезь, сестричка. А то и тебя прихватим.
* [Запугивание] Уходите. Или не выйдете отсюда вовсе. => flee %intimidate:7:fight
* Мы не хотим драки. Уходите, и никто не пострадает. => fight
* Тогда начнём. => fight
@ flee
lot_sergeant: Хм. Ладно. Не здесь. Мы ещё встретимся, Страж.
! set:tavern_fought quest:lot_main:2 remove:lot_sergeant do:tav_flee
=> after
@ fight
lot_sergeant: За тейрна!
! set:tavern_fight_on quest:lot_main:2 remove:lot_sergeant do:tav_spawn
@ after
leliana_npc: Хорошо, что обошлось без крови. Здесь её и так пролилось достаточно.

== leliana_join
@ start
=> hi ?!tavern_fought
leliana_npc: Вы... Серые Стражи. Я Лелиана, послушница здешней церкви. Возьмите меня с собой.
* Зачем тебе это? => why
* Ты умеешь драться? => fight
@ hi
leliana_npc: Здравствуйте. Будьте осторожны, в таверне люди Логейна.
@ why
leliana_npc: Мне был сон. Видение. Создатель показал мне, что вы должны остановить Мор, а я должна помочь вам. Я знаю, как это звучит.
morrigan: Как бред сумасшедшей.
* Я верю тебе. => join
* Нам пригодится любая помощь. => join
* Нет. Оставайся в церкви. => no
@ fight
leliana_npc: Вы же видели. Я не всегда была послушницей. Лук и кинжал мне привычнее чётки.
=> why
@ join
leliana_npc: Спасибо. Вы не пожалеете, обещаю.
! join:leliana remove:leliana_npc quest:lot_leliana:9 codex:leliana ap:leliana:5
@ no
leliana_npc: Как хотите. Но если передумаете, я буду здесь. Мне кажется, мы ещё встретимся.
! quest:lot_leliana:1

== lot_leave
@ start
alistair: Прежде чем идти дальше... Нам нужно решить, куда. Эрл Эамон в Редклифе. Гномы в Орзаммаре. Маги на озере Каленхад. Долийцы где-то в лесах.
morrigan: Главное — не оставаться на месте. Логейн уже ищет вас.
* Идём на север. Лотеринг скоро падёт. => go
* Ещё не всё сделано здесь. => end
@ go
! run:lot_end

== leliana_talk
@ start
leliana: Да? Что-то хотели?
* Расскажи о своём видении. => vision once
* Ты из Орлея? => orlais once
* Ничего. => end
@ vision
leliana: Я видела во сне тьму, которая поглощает землю. А потом услышала голос: иди. Утром я увидела вас. Разве это совпадение?
* Может, и нет. => kind
* Сны — это просто сны. => harsh
@ kind
leliana: Вы добрее, чем многие. Спасибо.
! ap:leliana:3
=> start
@ harsh
leliana: Может быть. Но я пойду с вами всё равно.
! ap:leliana:-2
=> start
@ orlais
leliana: Да. Я выросла в Вал Руайо. Была... бардом. Пела, танцевала, слушала чужие секреты. А потом пришла в Церковь. Долгая история.
=> start

== sten_talk
@ start
sten: Говори.
* Что такое Кун? => qun once
* Ты правда убил тех людей? => kill once
* Ничего. => end
@ qun
sten: Кун — это путь. Каждый знает своё место. Солдат сражается. Жрец учит. Никто не делает то, для чего не создан.
! codex:qunari
=> start
@ kill
sten: Да. Я не прошу прощения. Я прошу возможности искупить вину. Ты дал{|а} её. Этого достаточно.
! ap:sten:3
=> start
`);

  D.script('lot_enter', function* (g) {
    if (g.flag('lot_seen')) return;
    g.set('lot_seen');
    g.setQuest('lot_main', 1);
    g.setQuest('main_blight', 4);
    yield 0.5;
    g.toast('Лотеринг');
  });
  D.script('lot_toll_flee', function* (g) {
    for (const e of g.ents.filter(x => x.group === 'lot_toll' && !x.dead)) g.walkNpc(e, 2, 30, 0, 1.3);
    yield 3;
    for (const e of g.ents.filter(x => x.group === 'lot_toll')) { e.gone = true; e.dead = true; if (e.objKey) g.stateFor(g.areaId).dead[e.objKey] = 1; }
    g.set('cleared_lot_toll');
    g.giveXp(200);
  });
  D.GROUPS.lot_toll = { onClear: 'lot_toll_done' };
  D.script('lot_toll_done', g => { g.setQuest('lot_toll', 8); g.hideNpc('lot_refugee'); });
  D.GROUPS.lot_bcamp = { onClear: 'lot_camp_done' };
  D.script('lot_camp_done', g => g.setQuest('lot_camp', 2));
  D.GROUPS.lot_beasts = { onClear: 'lot_beasts_done' };
  D.script('lot_beasts_done', g => g.setQuest('lot_beasts', 2));
  D.script('lot_board_pay', g => {
    if (g.quests.lot_camp === 2) { g.setQuest('lot_camp', 9); g.addGold(1500); }
    if (g.quests.lot_beasts === 2) { g.setQuest('lot_beasts', 9); g.addGold(1000); }
    D.SCRIPTS.lot_board_check(g);
  });
  D.script('lot_board_check', g => {
    if (['lot_camp', 'lot_beasts', 'lot_poultices'].every(q => g.questDone(q))) g.setQuest('lot_board', 9);
  });
  D.script('tavern_enter', function* (g) {
    if (g.flag('tavern_seen')) return;
    g.set('tavern_seen');
    yield 0.8;
    const s = g.npcEnt('lot_sergeant');
    if (s) g.startDialog('tavern_fight', s);
  });
  D.script('tav_spawn', g => {
    const spots = [[14.5, 17.5, 'lot_sergeant_foe'], [12.5, 17.5, 'loghain_soldier'], [16.5, 17.5, 'loghain_soldier'], [13.5, 19.5, 'loghain_soldier'], [18.5, 19.5, 'loghain_archer']];
    for (const [x, z, t] of spots) { const e = g.spawn(t, x, z, { group: 'tav', face: Math.PI }); e.aware = true; }
    g.fightGroup('tav');
    const l = g.npcEnt('leliana_npc');
    if (l) { l.faction = 'ally'; l.following = false; }
  });
  D.GROUPS.tav = { onClear: 'tav_done' };
  D.script('tav_done', function* (g) {
    g.set('tavern_fought');
    yield 1;
    const l = g.npcEnt('leliana_npc');
    if (l) { l.faction = 'neutral'; g.startDialog('leliana_join', l); }
  });
  D.script('tav_flee', function* (g) {
    g.giveXp(250);
    yield 0.3;
    const l = g.npcEnt('leliana_npc');
    if (l) g.startDialog('leliana_join', l);
  });
  D.script('lot_leave_try', g => {
    if (g.combat) return;
    g.startDialog('lot_leave', null);
  });
  D.script('lot_end', function* (g) {
    g.cutscene(true);
    g.setQuest('lot_main', 9);
    g.emit('fade', { out: 1, t: 1.5 });
    yield 1.5;
    g.showSlides([
      { img: 'lothering', text: 'Отряд покидает Лотеринг. Через несколько дней орда дойдёт до деревни, и от неё останется только пепел.' },
      { img: 'road_south', text: 'Впереди долгая дорога. Договоры Серых Стражей в походной сумке, Логейн объявил вас изменниками, а Мор только начинается.' }
    ]);
    yield 'slides';
    g.setQuest('main_blight', 9);
    g.emit('achieve', { id: 'lothering' });
    const all = ['alistair', 'morrigan', 'leliana', 'sten'].every(k => g.roster[k]);
    if (all) g.emit('achieve', { id: 'party' });
    if (g.gold >= 100000) g.emit('achieve', { id: 'rich' });
    const lines = [
      '{name} {family}, ' + (D.ORIGINS[g.origin] ? D.ORIGINS[g.origin].name.toLowerCase() : '') + ', стал{|а} одним из двух последних Серых Стражей Ферелдена.',
      g.roster.leliana ? 'Лелиана пошла за вами, веря в своё видение.' : 'Лелиана осталась в Лотеринге. Может быть, вы ещё встретитесь.',
      g.roster.sten ? 'Стэн из Берескарна ищет искупления в бою с порождениями тьмы.' : 'Кунари так и остался в клетке ждать орду.',
      g.roster.dog ? 'Мабари идёт рядом, и ему нет дела до политики.' : 'Где-то в королевской псарне ждал хозяина мабари. Не дождался.',
      'Продолжение следует: Редклиф, Круг магов, Орзаммар, эльфы Бресилианского леса и Собрание земель.'
    ];
    g.mode = 'end';
    g.cutscene(false);
    g.mode = 'end';
    g.emit('end', { lines });
  });
  if (typeof module !== 'undefined' && module.exports) module.exports = D;
})(globalThis.Dao98 = globalThis.Dao98 || {});
