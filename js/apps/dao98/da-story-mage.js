(function (D) {
  'use strict';
  const H = (race, sex, o) => Object.assign({ kind: 'humanoid', race, sex }, o);
  const templar = H('human', 'm', { armor: 'templar', helm: 'plate' });

  D.npc('mouse', { name: 'Мышь', model: H('human', 'm', { skin: '#c8d0e0', hair: '#6a6a7a', hairStyle: 'short', armor: 'robe', tint: '#6a6a8a', ghost: 1 }) });
  D.npc('mouse_small', { name: 'Мышь', race: 'beast', model: { kind: 'mouse', col: '#8a7a6a' } });
  D.npc('valor_npc', { name: 'Дух Доблести', model: H('human', 'm', { skin: '#b8c8e8', ghost: 1, armor: 'plate', tint: '#9ab' }), equip: { main: 'longsword_steel', off: 'kite_steel' } });
  D.npc('jowan_npc', { name: 'Йован', model: D.COMPANIONS.jowan.model, equip: { main: 'staff1', chest: 'apprentice_robe' } });
  D.npc('lily', { name: 'Лили', sex: 'f', model: H('human', 'f', { skin: '#f0d0b4', hair: '#8a3a1a', hairStyle: 'tail', armor: 'robe', tint: '#d8c8a0' }) });
  D.npc('irving', { name: 'Первый чародей Ирвинг', model: H('human', 'm', { skin: '#e8c8a8', hair: '#e8e8e8', hairStyle: 'short', beard: 'full', armor: 'robe', tint: '#3a3a6a' }), equip: { main: 'staff3' } });
  D.npc('greagoir', { name: 'Рыцарь-командор Грегуар', model: H('human', 'm', { skin: '#e0b896', hair: '#6a6a6a', hairStyle: 'bald', beard: 'goatee', armor: 'templar' }), equip: { main: 'longsword_steel', off: 'kite_steel' } });
  D.npc('owain', { name: 'Оуэн', model: H('human', 'm', { skin: '#e8c4a0', hair: '#3a2414', hairStyle: 'short', armor: 'robe', tint: '#6a6a5a', tattoo: 'scar' }), anim: 'idle' });
  D.npc('circle_templar', { name: 'Храмовник', model: templar, equip: { main: 'longsword_iron', off: 'kite_iron' }, anim: 'guard', barks: ['Проходи, маг.', 'Я за тобой присматриваю.', 'Не задерживайся.'] });
  D.npc('apprentice', { name: 'Ученик', model: H('human', 'm', { skin: '#e8c4a0', hair: '#6a4020', hairStyle: 'short', armor: 'robe', tint: '#8a7a5a' }), barks: ['Ты прошёл{|ла} Истязание? Правда? Как там?', 'Говорят, Йована скоро усмирят.', 'Опять эти храмовники.'] });
  D.npc('apprentice_f', { name: 'Ученица', sex: 'f', model: H('elf', 'f', { skin: '#f0d6bc', hair: '#c8a060', hairStyle: 'tail', armor: 'robe', tint: '#8a7a5a' }), anim: 'read', barks: ['Тише, я читаю.', 'Ирвинг говорит, в Остагаре нужны маги.'] });
  D.npc('enchanter', { name: 'Чародей', model: H('human', 'm', { skin: '#d8b090', hair: '#b0b0b0', hairStyle: 'bald', beard: 'full', armor: 'robe', tint: '#5a3a6a' }), anim: 'read', barks: ['Поздравляю с Истязанием. Теперь начнётся настоящая учёба.'] });

  Object.assign(D.TEMPLATES.valor, { nonlethal: 1, ab: [], hp: 95, attr: { str: 12, dex: 12, con: 12 }, equip: { main: 'longsword_iron', off: 'buckler_iron' } });
  D.TEMPLATES.vault_sentinel = { id: 'vault_sentinel', name: 'Страж хранилища', race: 'spirit', model: H('human', 'm', { skin: '#8a9ab0', ghost: 1, armor: 'plate', tint: '#6a7a9a', helm: 'plate' }), cls: 'warrior', lvl: 2, attr: { str: 14, dex: 11, con: 12 }, equip: { main: 'mace_iron' }, ab: [], xp: 60, loot: 'none', rank: 'normal' };

  D.ITEMS.requisition = { id: 'requisition', name: 'Бланк требования', type: 'quest', cat: 'quest', price: 0, ic: 'scroll', desc: 'Бланк на выдачу имущества Круга с печатью Первого чародея. Графа «что выдать» пустая.', tier: 1, quest: 1 };

  D.questDef('mg_harrowing', { name: 'Истязание', stages: { 1: 'Вы в Тени. Где-то здесь ждёт демон. Чтобы пройти Истязание, его нужно победить.', 2: 'Мышь научил вас принимать облик мыши. Так можно пролезть в узкую щель на севере.', 3: 'Демон гнева повержен.', 9: 'Вы прошли Истязание и стали магом Круга.' }, done: 9, xp: 400 });
  D.questDef('mg_valor', { name: 'Дух Доблести', stages: { 1: 'Дух Доблести предлагает свой посох тому, кто докажет свою силу.', 9: 'Дух Доблести отдал вам посох.' }, done: 9, xp: 150 });
  D.questDef('mg_irving', { name: 'Новый маг', stages: { 1: 'Первый чародей Ирвинг ждёт вас в своём кабинете на севере этажа.', 9: 'Ирвинг поздравил вас с Истязанием.' }, done: 9, xp: 100 });
  D.questDef('mg_jowan', { name: 'Филактерия Йована', stages: { 1: 'Йован хочет поговорить с вами наедине. Он в часовне.', 2: 'Йована собираются усмирить. Он хочет уничтожить свою филактерию в хранилище. Для двери хранилища нужен огненный жезл со склада.', 3: 'Жезл у вас. Спускайтесь в хранилище с Йованом.', 4: 'Филактерия Йована уничтожена. Пора возвращаться.', 9: 'Йован оказался магом крови и сбежал. Дункан забрал вас в Серые Стражи.' }, done: 9, xp: 400 });

  D.codex('harrowing', 'Магия и религия', 'Истязание', 'Испытание для учеников Круга. Мага погружают в Тень с помощью лириума, и там его находит демон. Храмовник стоит рядом с мечом наготове. Если ученик поддастся демону, он не проснётся. О самом испытании запрещено рассказывать.');
  D.codex('irving', 'Персонажи', 'Ирвинг', 'Первый чародей Круга магов Ферелдена. Старик с мягким голосом, который умеет договариваться с храмовниками лучше, чем кто-либо до него.');
  D.codex('tranquil', 'Магия и религия', 'Усмирённые', 'Усмирение отрезает мага от Тени. Он больше не видит снов, не чувствует гнева или радости и не может колдовать. Зато демоны ему не страшны. Усмирённые ведут дела Круга: торгуют, переписывают книги, зачаровывают вещи.');
  D.codex('blood_magic', 'Магия и религия', 'Магия крови', 'Запретная магия, которая черпает силу из крови. Маг крови может подчинять чужой разум. Церковь считает её худшим из грехов, храмовники убивают таких магов без суда.');

  D.area('harrowing', {
    name: 'Тень', w: 72, h: 64, theme: 'fade', onEnter: 'fade_enter', codex: 'fade', art: 'fade',
    build(b) {
      b.fill('fade');
      b.pit(0, 0, 72, 64);
      b.clear(4, 40, 18, 18, 'fade');
      b.clear(21, 46, 6, 3, 'fade');
      b.clear(26, 38, 16, 16, 'fade');
      b.clear(41, 44, 6, 3, 'fade');
      b.clear(46, 36, 18, 20, 'fade');
      b.clear(32, 24, 3, 15, 'fade');
      b.wall(28, 30, 11, 1, 'fade', 4);
      b.hole(33, 30);
      b.clear(20, 4, 32, 21, 'fade');
      b.noiseHeights(0.9, 7, 9);
      b.props('fadeisle', [[10, 20], [60, 14], [4, 30], [66, 30], [40, 58], [60, 60]]);
      b.props('deadtree', [[6, 42], [18, 54], [28, 40], [39, 51], [48, 38], [62, 52], [22, 6], [49, 20]]);
      b.props('crystal', [[14, 56], [30, 50], [58, 38], [36, 8], [24, 22]]);
      b.props('statue', [[50, 50], [36, 16]]);
      b.props('rubble', [[10, 50], [35, 45], [55, 46]], { tex: 'stone' });
      b.light(12, 48, { kind: 'magic', col: [0.4, 1, 0.7], r: 10, y: 2 }); b.light(34, 45, { kind: 'magic', col: [0.7, 0.4, 1], r: 10, y: 2 }); b.light(55, 45, { kind: 'magic', col: [0.4, 0.8, 1], r: 11, y: 2 }); b.light(36, 14, { kind: 'magic', col: [1, 0.4, 0.2], r: 14, y: 2 }); b.light(33, 28, { kind: 'magic', col: [0.8, 0.8, 1], r: 6, y: 1 });
      b.spot('start', 8, 52, 0.8);
      b.npc('mouse', 12, 47, { face: -2.2, dlg: 'mouse_talk', unless: 'cleared_fa_rage' });
      b.foes('wisp', [[30, 42], [36, 47]], { group: 'fa_wisps' });
      b.foe('fade_wolf', 48, 53, { group: 'fa_wolves' });
      b.foe('valor', 58, 44, { group: 'fa_valor', neutral: true, dlg: 'valor_talk', face: -1.5 });
      b.foe('rage_demon', 36, 12, { group: 'fa_rage', opts: { hpMul: 0.75 } });
      b.use('fade_pool', 10, 42, { kind: 'fountain', label: 'Родник Тени', run: 'fade_pool', once: true });
    }
  });

  D.area('circle', {
    name: 'Башня Круга', w: 70, h: 56, wallH: 6, theme: 'circle', codex: 'circle', onEnter: 'circle_enter', art: 'circle',
    build(b) {
      b.fill('marble');
      b.wall(0, 0, 70, 56, 'marble', 6);
      b.hall(24, 18, 22, 20, { floor: 'marble', h: 8 });
      b.ground(33, 18, 3, 20, 'carpet');
      b.hall(3, 18, 18, 20, { floor: 'wood' });
      b.opening(21, 26, 3, 3, 'marble');
      b.hall(26, 3, 18, 12, { floor: 'rug' });
      b.opening(33, 15, 3, 3, 'marble');
      b.hall(49, 18, 18, 20, { floor: 'wood' });
      b.opening(46, 26, 3, 3, 'marble');
      b.opening(33, 38, 3, 3, 'marble');
      b.hall(8, 41, 54, 3, { floor: 'marble' });
      b.hall(3, 46, 18, 8, { floor: 'stone' });
      b.opening(11, 44, 2, 2, 'stone');
      b.hall(49, 46, 18, 8, { floor: 'marble' });
      b.opening(56, 44, 2, 2, 'marble');
      b.hall(29, 46, 11, 8, { floor: 'stone' });
      b.opening(33, 44, 3, 2, 'stone');
      b.door('d_storage', 11, 44, { axis: 'x', open: true }); b.door('d_chapel', 56, 44, { axis: 'x', open: true });
      b.door('d_stairs', 34, 45, { axis: 'x', lock: 9, key: 'rod_of_fire', lockText: 'Дверь в хранилище запечатана магией. Нужен огненный жезл.' });
      b.props('pillar', [[26, 20], [43, 20], [26, 35], [43, 35], [26, 27], [43, 27]], { tex: 'w_marble' });
      b.prop('statue_big', 34, 26, { flame: 1 });
      for (let i = 0; i < 4; i++) { b.prop('bed', 4 + i * 4, 19); b.prop('bed', 4 + i * 4, 35); b.prop('chest', 5 + i * 4, 22); }
      b.props('bookcase', [[50, 18], [53, 18], [56, 18], [59, 18], [62, 18]]);
      for (let i = 0; i < 3; i++) b.props('bookcase', [[52, 23 + i * 5, 1], [60, 23 + i * 5, 1]]);
      b.props('table', [[55, 32], [55, 26]]); b.props('lectern', [[64, 30]]); b.props('chair', [[54, 33], [57, 33]]);
      b.props('bookcase', [[27, 3], [30, 3], [38, 3], [41, 3]]); b.prop('table', 34, 8); b.prop('chair', 35, 6); b.prop('painting', 35, 3); b.prop('banner', 28, 12, { col: '#3a3a6a' }); b.prop('banner', 41, 12, { col: '#3a3a6a' });
      b.props('crate', [[4, 47], [5, 47], [4, 48], [17, 52], [18, 52]]); b.props('barrel', [[19, 47], [19, 48]]); b.prop('counter', 8, 50); b.props('rack', [[14, 47], [15, 47]]);
      b.prop('altar', 57, 47); b.props('pew', [[51, 50], [59, 50]]); b.props('candles', [[55, 47], [60, 47]]); b.prop('statue', 64, 47);
      b.props('rubble', [[31, 52], [37, 52]], { tex: 'stone' });
      for (const [x, z] of [[10, 22], [10, 32], [30, 22], [38, 22], [30, 33], [38, 33], [58, 22], [58, 32], [34, 6], [20, 42], [48, 42], [10, 49], [58, 49], [34, 50]]) b.light(x, z, { r: 8, col: [1, 0.85, 0.65] });
      b.light(34, 27, { kind: 'magic', col: [0.5, 0.6, 1], r: 10, y: 3 });
      b.spot('bed', 6, 21, Math.PI / 2);
      b.spot('from_vault', 34, 42, 0);
      b.exit('to_vault', 34, 47, { to: 'circle_vault', at: 'start', label: 'Спуск в хранилище' });
      b.npc('jowan_npc', 8, 23, { face: 1.5, dlg: 'jowan_wake', unless: 'mg_jowan_chapel' });
      b.npc('jowan_npc', 54, 49, { face: 0, dlg: 'jowan_plan', if: 'mg_jowan_chapel', unless: 'mg_vault_go' });
      b.npc('lily', 55, 51, { face: -0.5, dlg: 'lily_talk', unless: 'mg_vault_go' });
      b.npc('irving', 34, 10, { face: 0, dlg: 'irving_talk', unless: 'mg_vault_done' });
      b.npc('greagoir', 31, 10, { face: 0.4, dlg: 'greagoir_talk', unless: 'mg_vault_done' });
      b.npc('duncan', 37, 10, { face: -0.4, dlg: 'mg_duncan', unless: 'mg_vault_done' });
      b.npc('owain', 9, 49, { face: 0, dlg: 'owain_talk' });
      b.npc('circle_templar', 23, 25, { face: 1.5 }); b.npc('circle_templar', 47, 29, { face: -1.5 }); b.npc('circle_templar', 32, 43, { face: 0, dlg: 'templar_door' }); b.npc('circle_templar', 30, 30, { wander: 5 });
      b.npc('apprentice', 12, 28, { wander: 4 }); b.npc('apprentice', 40, 30, { wander: 5 }); b.npc('apprentice_f', 56, 30, { face: 3, anim: 'read' }); b.npc('enchanter', 62, 24, { face: -1.5, anim: 'read' }); b.npc('apprentice_f', 16, 33, { anim: 'sit', face: 0 });
      b.box('irving_desk', 36, 8, { kind: 'chest', label: 'Стол Первого чародея', loot: [['requisition', 1]], if: 'quest.mg_jowan>=2' });
      b.box('pc_chest', 5, 22, { kind: 'chest', loot: [['lyrium_lesser', 1], ['elfroot', 2]], gold: 150 });
      b.box('library_shelf', 62, 18, { kind: 'bookcase', loot: [['lyrium_dust', 1]], run: 'circle_lib' });
      b.box('storage_crate', 17, 52, { kind: 'crate', loot: [['flask', 3], ['poultice_lesser', 1]] });
    }
  });

  D.area('circle_vault', {
    name: 'Хранилище Круга', w: 46, h: 40, wallH: 5, theme: 'elfruins', music: 'ruins', art: 'circle',
    build(b) {
      b.fill('stone');
      b.wall(0, 0, 46, 40, 'dark', 5);
      b.hall(20, 32, 6, 6, { floor: 'stone' });
      b.hall(21, 20, 4, 12, { floor: 'stone' });
      b.hall(6, 16, 34, 4, { floor: 'marble' });
      b.hall(4, 4, 12, 12, { floor: 'marble' });
      b.hall(30, 4, 12, 12, { floor: 'marble' });
      b.hall(18, 4, 10, 8, { floor: 'marble' });
      b.opening(22, 12, 2, 4, 'marble');
      b.opening(8, 14, 2, 2, 'marble'); b.opening(36, 14, 2, 2, 'marble');
      b.door('v_d1', 22, 12, { axis: 'x' });
      b.props('pillar', [[10, 17], [16, 17], [28, 17], [34, 17]], { tex: 'w_marble' });
      b.props('bookcase', [[5, 4], [8, 4], [11, 4], [31, 4], [34, 4], [37, 4]]);
      b.props('crystal', [[6, 10], [40, 10], [20, 8]]);
      b.prop('altar', 22, 5);
      b.use('phylactery_shelf', 22, 6, { kind: 'lectern', label: 'Полка с филактериями', run: 'mg_phylactery', once: true });
      for (const [x, z] of [[23, 35], [23, 24], [12, 18], [34, 18], [10, 9], [36, 9], [23, 8]]) b.light(x, z, { r: 7, col: [0.6, 0.7, 1] });
      b.light(22, 6, { kind: 'magic', col: [1, 0.3, 0.3], r: 6, y: 1.5 });
      b.spot('start', 23, 36, Math.PI);
      b.exit('vault_up', 23, 38, { to: 'circle', at: 'from_vault', label: 'Наверх' });
      b.foes('vault_sentinel', [[22, 24], [24, 26]], { group: 'cv_a' });
      b.foes('wisp', [[8, 9], [12, 7]], { group: 'cv_b' });
      b.foe('vault_sentinel', 36, 8, { group: 'cv_c' });
      b.foe('wisp', 33, 10, { group: 'cv_c' });
      b.box('cv_chest1', 5, 13, { kind: 'chest', loot: [['lyrium', 1], ['ring_lyrium', 1]], gold: 300 });
      b.box('cv_chest2', 40, 13, { kind: 'chest', table: 'darkspawn_rich', loot: [['enchanter_robe', 1]] });
    }
  });

  D.dialogs(`
== mouse_talk
@ start
=> teach ?mg_mouse_ready ?!mg_mouse
=> after ?mg_mouse
mouse: Ещё один ученик. Бедняга. Ты в Тени, если не догадал{ся|ась}. Это твоё Истязание.
* Кто ты? => who
* Что мне делать? => what
@ who
mouse: Зови меня Мышь. Я тоже был учеником. Моё Истязание давно закончилось, а я так и не проснулся. Остались только обрывки.
=> what
@ what
mouse: Где-то здесь демон. Найди его и победи. Или он найдёт тебя сам, это обычно хуже. Я пойду с тобой, если не возражаешь. Вдвоём не так страшно.
! quest:mg_harrowing:1 codex:harrowing follow:mouse
@ teach
mouse: Видишь ту стену? Демон за ней. Человеку не пролезть, а вот мыши — запросто. Хочешь, научу? Надо просто перестать думать о себе как о человеке.
* Научи. => learn
* Звучит подозрительно. => sus
@ sus
mouse: Подозрительно? В Тени всё подозрительно. Но другого пути я не знаю.
=> learn
@ learn
narr: Мир становится огромным. Вы чувствуете усы, хвост и запах пыли. Потом снова становитесь собой. Теперь вы знаете, как это делается.
! do:mg_learn_mouse quest:mg_harrowing:2
@ after
mouse: Щель в стене на севере. Стань мышью и пролезай. Я буду рядом.

== valor_talk
@ start
=> done ?quest.mg_valor>=9
valor_npc: Стой. Я Доблесть. Здесь, среди кошмаров, я храню то, что осталось от храбрости. Ты ищешь демона гнева?
* Да. Помоги мне. => help
* Кто ты такой? => who
@ who
valor_npc: Дух. Не демон. Демоны хотят того, чего у них нет. Я хочу лишь, чтобы смелость не пропала даром.
=> help
@ help
valor_npc: Мой посох поможет тебе. Но я не отдам его слабому. Докажи свою силу в бою.
* Сразимся. => fight
* [Убеждение] Настоящая доблесть — идти против демона. Я иду. Разве этого мало? => won %persuade:4:fight
@ won
valor_npc: Хм. Верно сказано. Возьми посох. И не подведи его.
! quest:mg_valor:9 do:mg_valor_staff
@ fight
valor_npc: К бою!
! quest:mg_valor:1 fight:fa_valor
@ done
valor_npc: Иди. Демон ждёт.

== valor_yield
@ start
valor_npc: Довольно. Ты силён... сильна... ты достаточно силён духом. Посох твой.
! quest:mg_valor:9 do:mg_valor_staff

== mouse_reveal
@ start
mouse: Ты сделал{|а} это! Демон повержен! Ты прошёл{|ла} Истязание!
mouse: Хотя... не совсем. Знаешь, что последнее испытание — это я?
narr: Мышь меняется. Тень за ним растёт, изгибается, и из неё смотрит что-то старое и голодное.
mouse: Демоны так долго ждут. Ты сильн{ый|ая}. Впусти меня, и я сделаю тебя сильнее. Храмовники ничего не заметят.
* Нет. Убирайся. => no
* Я тебя раскусил{|а}. Ты и есть демон. => no
@ no
mouse: Жаль. Ты бы далеко пош{ёл|ла}. Ну что ж. Просыпайся, маг.
! quest:mg_harrowing:9 run:mg_wake

== jowan_wake
@ start
jowan_npc: Ты вернул{ся|ась}! Я так боялся. Ты ведь прош{ёл|ла}, да? Храмовники тебя не тронули?
* Прош{ёл|ла}. Я теперь маг. => yes
* Что было, то было. Не спрашивай. => yes
@ yes
jowan_npc: Слава Создателю. Ирвинг хотел тебя видеть. Он в своём кабинете. А потом... найди меня, ладно? Мне нужно поговорить. Только не при храмовниках.
! quest:mg_irving:1 quest:mg_jowan:1 set:mg_jowan_chapel do:mg_jowan_walk

== irving_talk
@ start
=> later ?quest.mg_irving>=9
irving: А, вот и наш новый маг. Добро пожаловать, {name}. Ты прош{ёл|ла} Истязание с честью. Грегуар, не хмурься.
greagoir: Я не хмурюсь. Я наблюдаю. Это моя работа.
irving: Позволь представить Дункана из Серых Стражей. Он ищет рекрутов для Остагара.
duncan: Ирвинг высоко о тебе отзывается. Я слышал, демон тебя не соблазнил. Это редкость.
* Я рад{|а} служить Кругу. => ring
* Серые Стражи берут магов? => wardens
@ wardens
duncan: Мы берём всех, кто способен сражаться. Маги нам нужны.
greagoir: Круг не отдаст своих магов так просто, Страж.
=> ring
@ ring
irving: Держи. Кольцо Истязания. Теперь ты полноправный маг Круга. Иди, отдохни. Твои книги и вещи уже перенесли в новую комнату.
! give:ring_harrowing quest:mg_irving:9 codex:irving
@ later
irving: Отдыхай, {name}. Ты это заслужил{|а}.

== greagoir_talk
@ start
greagoir: Истязание пройдено. Хорошо. Но я слежу за каждым магом этой башни. Помни об этом.

== mg_duncan
@ start
duncan: Круг — хорошая школа. Но на юге сейчас решается судьба всего Ферелдена.

== jowan_plan
@ start
=> go ?item.rod_of_fire>=1
=> wait ?quest.mg_jowan>=2
jowan_npc: Слушай. Мне больше не к кому идти. Ирвинг и Грегуар решили меня усмирить. Говорят, я занимаюсь магией крови.
lily: Это неправда! Йован никогда бы...
* А ты занимаешься? => blood
* Что тебе нужно? => need
@ blood
jowan_npc: Нет! Клянусь. Просто я плохо учусь, и храмовники мне не доверяют.
=> need
@ need
jowan_npc: Моя филактерия в хранилище. Если её уничтожить, храмовники меня не найдут, и я сбегу. С Лили.
lily: Дверь хранилища открывается огненным жезлом. Жезлы хранит Оуэн на складе.
* Я помогу. => help
* Это против правил Круга. => rules
@ rules
jowan_npc: Правил? Меня хотят превратить в пустую оболочку, а ты про правила?
* Ладно. Я помогу. => help
@ help
jowan_npc: Спасибо! Достань жезл у Оуэна. Потом встретимся здесь, и спустимся вместе.
! quest:mg_jowan:2 codex:tranquil
@ wait
jowan_npc: Жезл у Оуэна, на складе у юго-западной стены.
@ go
jowan_npc: Жезл у тебя? Отлично! Идём к хранилищу. Лили отвлечёт храмовника у двери.
lily: Я поговорю с ним. Он меня знает.
! quest:mg_jowan:3 set:mg_vault_go join:jowan remove:jowan_npc remove:lily do:mg_templar_away

== lily_talk
@ start
lily: Джовен говорил о тебе. Надеюсь, ты ему поможешь.

== owain_talk
@ start
=> got ?item.rod_of_fire>=1
owain: Добро пожаловать на склад. Чем могу служить?
* Мне нужен огненный жезл. => rod ?quest.mg_jowan>=2
* Ничего, спасибо. => end
@ rod
owain: Огненный жезл выдаётся по требованию с печатью Первого чародея.
* Вот требование. => give ?item.requisition>=1
* [Ложь] Ирвинг сам послал меня. Ему срочно. => give %lie:3:nolie
* Я вернусь. => end
@ nolie
owain: Без требования не могу. Бланки есть у Первого чародея. Обычно лежат в столе.
@ give
owain: Всё по правилам. Вот жезл. Распишитесь здесь. Благодарю.
! take:requisition give:rod_of_fire
@ got
owain: Жезл выдан. Верните, когда закончите.

== templar_door
@ start
circle_templar: В хранилище без разрешения нельзя. Ступай, маг.

== mg_confront
@ start
greagoir: Вот они. Я же говорил, Ирвинг. Маг крови и его пособник.
irving: Йован, что ты наделал?
jowan: Я... я не хотел, чтобы так вышло!
lily: Йован, скажи им, что это неправда! Ты ведь не маг крови!
greagoir: Филактерия уничтожена. Этого достаточно.
jowan: Простите. Я не могу позволить им меня схватить.
narr: Йован проводит ножом по ладони. Кровь вспыхивает, и храмовники падают, как подкошенные. Лили отшатывается от него.
lily: Нет... Йован... Ты лгал мне всё это время.
jowan: Лили, пойдём со мной! Пожалуйста!
lily: Держись от меня подальше.
narr: Йован бросается к выходу и исчезает.
! leave:jowan
greagoir: Лили отправится в Эонар. А этот маг помогал магу крови. Я требую, чтобы {его|её} усмирили.
duncan: Нет. Я призываю {name} в Серые Стражи. Право призыва, Грегуар. Даже Церковь не может его оспорить.
irving: Дункан прав, Грегуар. Пусть {name} идёт. Так будет лучше для всех.
greagoir: Хорошо. Но если я ещё раз увижу этого мага в своей башне...
* Я не знал{|а}, что он маг крови. => sorry
* Спасибо, Дункан. => thanks
@ sorry
duncan: Верю. Но ты сделал{|а} выбор, и отвечать придётся. Отвечать будешь в Остагаре.
=> thanks
@ thanks
duncan: Собирайся. Мы уходим сегодня же.
! quest:mg_jowan:9 codex:blood_magic run:mg_end
`);

  D.script('fade_enter', function* (g) {
    if (g.flag('fade_seen')) return;
    g.set('fade_seen');
    yield 0.6;
    g.startDialog('mouse_talk', g.npcEnt('mouse'));
  });
  D.script('fade_pool', g => { g.healParty(); g.toast('Сила Тени наполняет вас.'); g.give('lyrium_lesser', 2, true); g.give('poultice_lesser', 1, true); });
  D.script('mg_learn_mouse', g => { g.set('mg_mouse'); g.give('mouse_form', 1); g.toast(D.TOASTS.mouse_learned); });
  D.GROUPS.fa_wisps = { onClear: 'fa_wisps_done' };
  D.script('fa_wisps_done', g => { g.set('mg_mouse_ready'); g.float(g.pc, 'Мышь машет вам рукой', '#cfe'); });
  D.GROUPS.fa_valor = { onClear: 'fa_valor_done' };
  D.script('fa_valor_done', function* (g) {
    yield 0.5;
    const v = g.ents.find(e => e.key === 'valor');
    g.startDialog('valor_yield', v);
  });
  D.script('mg_valor_staff', g => {
    g.give('valor_staff', 1, true);
    g.equipFromInv(g.pc, 'main', 'valor_staff');
    const v = g.ents.find(e => e.key === 'valor');
    if (v) { v.gone = true; v.dead = true; }
    g.set('mg_mouse_ready');
  });
  D.GROUPS.fa_rage = { onClear: 'fa_rage_dead' };
  D.script('fa_rage_dead', function* (g) {
    g.setQuest('mg_harrowing', 3);
    if (g.pc.mouse) g.setMouse(false);
    yield 1;
    const m = g.spawnNpc('mouse', g.pc.x + 1.5, g.pc.z + 1.5, 0);
    g.startDialog('mouse_reveal', m);
  });
  D.script('mg_wake', function* (g) {
    g.cutscene(true);
    g.emit('fade', { out: 1, t: 1.5 });
    yield 1.5;
    if (g.pc.mouse) g.setMouse(false);
    g.take('mouse_form', 1);
    if (g.pc.equip.main === 'valor_staff') g.pc.equip.main = 'staff1';
    g.take('valor_staff', 9);
    D.recalc(g.pc);
    g.showSlides([{ img: 'circle', text: 'Вы просыпаетесь на холодном полу Истязательной. Над вами храмовник с мечом. Он долго смотрит вам в глаза, потом убирает клинок в ножны.' }]);
    yield 'slides';
    g.healParty();
    g.giveXp(200);
    g.cutscene(false);
    g.goto('circle', 'bed');
  });
  D.script('circle_enter', function* (g) {
    if (g.flag('mg_confront_now') && !g.flag('mg_vault_done')) {
      g.set('mg_vault_done');
      yield 0.5;
      g.spawnNpc('greagoir', 34.5, 38.5, Math.PI);
      g.spawnNpc('irving', 32.5, 38.5, Math.PI);
      g.spawnNpc('duncan', 36.5, 38.5, Math.PI);
      g.spawnNpc('lily', 31.5, 40.5, 1.5);
      g.spawnNpc('circle_templar', 38.5, 37.5, Math.PI);
      g.startDialog('mg_confront', g.npcEnt('greagoir'));
      return;
    }
    if (g.flag('mg_woke')) return;
    g.set('mg_woke');
    yield 0.6;
    g.startDialog('jowan_wake', g.npcEnt('jowan_npc'));
  });
  D.script('mg_jowan_walk', g => {
    const j = g.npcEnt('jowan_npc');
    if (!j) return;
    j.dlg = 'jowan_plan';
    g.walkNpc(j, 54.5, 49.5, 0, 1);
  });
  D.script('circle_lib', g => { g.addCodex('tranquil'); });
  D.script('mg_templar_away', g => {
    const t = g.ents.filter(e => e.key === 'circle_templar').sort((a, b) => D.dist(a.x, a.z, 32.5, 43.5) - D.dist(b.x, b.z, 32.5, 43.5))[0];
    if (t) g.ents.splice(g.ents.indexOf(t), 1);
    g.setDoor('d_stairs', true);
    g.take('rod_of_fire', 1);
  });
  D.script('mg_phylactery', function* (g) {
    g.cutscene(true);
    g.float(g.roster.jowan || g.pc, 'Вот она! Моя филактерия!', '#fff');
    yield 1.5;
    g.sound('hit_crit');
    g.toast('Йован разбивает стеклянный флакон с кровью.');
    g.setQuest('mg_jowan', 4);
    g.set('mg_confront_now');
    g.cutscene(false);
  });
  D.script('mg_end', function* (g) {
    g.cutscene(true);
    g.emit('fade', { out: 1, t: 1 });
    yield 1;
    g.showSlides([
      { img: 'circle', text: 'Утром Дункан уводит вас из Башни. Лодка скользит по серой воде озера Каленхад, храмовники смотрят вслед с причала.' },
      { img: 'road_south', text: 'Дорога на юг занимает много дней. Дункан рассказывает о Море, о Серых Стражах и о том, что в Остагаре собирается армия короля.' }
    ]);
    yield 'slides';
    g.cutscene(false);
    D.toOstagar(g);
  });
  D.ORIGIN_SETUP.mage = g => {
    const c = g.pc;
    Object.assign(c.equip, { main: 'staff1', chest: 'apprentice_robe' });
    g.give('lyrium_lesser', 3);
    g.give('poultice_lesser', 2);
    g.addGold(1500);
    g.events = [];
  };
  if (typeof module !== 'undefined' && module.exports) module.exports = D;
})(globalThis.Dao98 = globalThis.Dao98 || {});
