(function (D) {
  'use strict';
  const H = (race, sex, o) => Object.assign({ kind: 'humanoid', race, sex }, o);
  const soldier = (tint, extra) => H('human', 'm', Object.assign({ armor: 'chain', tint, helm: 'chain' }, extra));

  D.npc('cailan', { name: 'Король Кайлан', model: H('human', 'm', { skin: '#f0d0b4', hair: '#e8c870', hairStyle: 'long', armor: 'plate', tint: '#d8b050' }), equip: { main: 'longsword_steel', off: 'kite_steel' }, lvl: 10 });
  D.npc('loghain', { name: 'Тейрн Логейн Мак Тир', model: H('human', 'm', { skin: '#d8b090', hair: '#1a1410', hairStyle: 'long', armor: 'splint', tint: '#3a3a44' }), equip: { main: 'longsword_steel', off: 'kite_steel' }, lvl: 12 });
  D.npc('uldred', { name: 'Старший чародей Ульдред', model: H('human', 'm', { skin: '#e8c4a0', hair: '#3a2414', hairStyle: 'bald', beard: 'goatee', armor: 'robe', tint: '#7a2a2a' }), equip: { main: 'staff3' } });
  D.npc('wynne', { name: 'Винн', sex: 'f', model: H('human', 'f', { skin: '#f0d0b4', hair: '#e0e0e0', hairStyle: 'tail', armor: 'robe', tint: '#3a5a8a' }), equip: { main: 'staff2' } });
  D.npc('ost_mage', { name: 'Маг Круга', model: H('human', 'm', { skin: '#e8c4a0', hair: '#6a4020', hairStyle: 'short', armor: 'robe', tint: '#5a4a7a' }), equip: { main: 'staff1' }, barks: ['Храмовники следят даже здесь. Как будто у нас мало забот.'] });
  D.npc('ost_alistair', { name: 'Алистер', model: D.COMPANIONS.alistair.model, equip: D.COMPANIONS.alistair.equip });
  D.npc('kennel_master', { name: 'Псарь', model: H('human', 'm', { skin: '#d8b090', hair: '#3a2414', hairStyle: 'short', beard: 'full', armor: 'leather', tint: '#6a4a2a' }), anim: 'kneel' });
  D.npc('ost_mabari', { name: 'Больной мабари', race: 'beast', model: { kind: 'dog', col: '#7a5a38' }, nat: { dmgBase: 8 }, anim: 'sit' });
  D.npc('quartermaster', { name: 'Интендант', model: H('human', 'm', { skin: '#e0b896', hair: '#6a6a6a', hairStyle: 'bald', beard: 'full', armor: 'leather', tint: '#5a4a3a', fat: 1 }) });
  D.npc('ost_prisoner', { name: 'Пленник', model: H('human', 'm', { skin: '#c89a74', hair: '#3a2414', hairStyle: 'long', beard: 'full', armor: 'cloth', tint: '#4a4238' }), anim: 'sit' });
  D.npc('cage_guard', { name: 'Часовой', model: soldier('#7a2a1a'), equip: { main: 'longsword_iron', off: 'kite_iron' }, anim: 'guard' });
  D.npc('ost_mother', { name: 'Преподобная мать', sex: 'f', model: H('human', 'f', { skin: '#f0d0b4', hair: '#c8c8c8', hairStyle: 'tail', armor: 'robe', tint: '#c8b890', helm: 'hat' }), anim: 'pray' });
  D.npc('daveth', { name: 'Дэвет', model: D.COMPANIONS.daveth.model, equip: D.COMPANIONS.daveth.equip });
  D.npc('jory', { name: 'Сэр Джори', model: D.COMPANIONS.jory.model, equip: D.COMPANIONS.jory.equip });
  D.npc('ost_soldier', { name: 'Солдат', model: soldier('#7a2a1a'), equip: { main: 'longsword_iron', off: 'kite_iron' }, barks: ['За короля!', 'Говорят, порождений тьмы там тысячи.', 'Третья победа подряд. Ещё немного, и по домам.', 'Не хотел бы я оказаться в дебрях ночью.', 'Эй, новобранец, держись поближе к Стражам.'] });
  D.npc('ost_escort', { name: 'Королевский гвардеец', model: H('human', 'm', { armor: 'plate', tint: '#8a1a1a', helm: 'plate' }), equip: { main: 'longsword_steel', off: 'kite_steel' }, anim: 'guard' });
  D.npc('ost_kingsguard', { name: 'Королевский гвардеец', model: H('human', 'm', { armor: 'plate', tint: '#8a1a1a', helm: 'plate' }), equip: { main: 'longsword_steel', off: 'kite_steel' }, anim: 'guard', barks: ['Проходите.', 'Король в добром расположении духа.'] });
  D.npc('loghain_guard', { name: 'Солдат Логейна', model: soldier('#3a4a5a'), equip: { main: 'longsword_iron', off: 'kite_iron' }, anim: 'guard', barks: ['Тейрн занят.', 'Ступай своей дорогой, Страж.'] });
  D.npc('wilds_guard', { name: 'Часовой у ворот', model: soldier('#7a2a1a'), equip: { main: 'longsword_iron', off: 'kite_iron' }, anim: 'guard' });
  D.npc('ost_healer', { name: 'Лекарь', sex: 'f', model: H('human', 'f', { skin: '#e8c4a0', hair: '#6a4020', hairStyle: 'tail', armor: 'cloth', tint: '#d8d0c0' }), anim: 'kneel', barks: ['Не стойте над душой. Этому уже не помочь.', 'Эльфийского корня опять не хватает.'] });
  D.npc('ost_wounded', { name: 'Раненый солдат', model: soldier('#7a2a1a', { helm: null }), anim: 'lie', barks: ['Они... они выходили из-под земли...'] });
  D.npc('wilds_scout', { name: 'Раненый разведчик', model: soldier('#5a4a2a', { helm: null, armor: 'leather' }), anim: 'wounded' });
  D.npc('morrigan_npc', { name: 'Морриган', sex: 'f', model: D.COMPANIONS.morrigan.model, equip: D.COMPANIONS.morrigan.equip });
  D.npc('flemeth', { name: 'Флемет', sex: 'f', model: H('human', 'f', { skin: '#e0c0a0', hair: '#b8b0a0', hairStyle: 'long', armor: 'robe', tint: '#5a2a2a' }), lvl: 20 });
  D.npc('tower_soldier', { name: 'Солдат у башни', model: soldier('#7a2a1a'), equip: { main: 'longsword_iron', off: 'kite_iron' } });
  D.npc('road_dog', { name: 'Мабари', race: 'beast', model: { kind: 'dog', col: '#8a6238' }, nat: { dmgBase: 10 } });

  D.TEMPLATES.ferelden_soldier = { id: 'ferelden_soldier', name: 'Солдат Ферелдена', race: 'human', model: soldier('#7a2a1a'), cls: 'warrior', lvl: 3, attr: { str: 15, dex: 12, con: 14 }, equip: { main: 'longsword_iron', off: 'kite_iron', chest: 'chain_chest' }, ab: ['shield_bash'], xp: 0, loot: 'none', rank: 'normal' };

  D.questDef('ost_main', { name: 'Остагар', stages: { 1: 'Дункан велел найти Алистера, ещё одного Серого Стража. Алистер где-то у палаток магов.', 2: 'Алистер отведёт вас к костру Дункана на южной окраине лагеря.', 3: 'Для Посвящения нужно три склянки крови порождений тьмы и старинные договоры Серых Стражей из дебрей Коркари.', 4: 'Вы вернулись с кровью и договорами. Дункан ждёт у своего костра, чтобы начать Посвящение.', 5: 'Вы стали Серым Стражем. Дункан ждёт вас на военном совете у королевского шатра.', 6: 'Вам с Алистером поручено зажечь сигнальный огонь на вершине башни Ишала, когда начнётся битва.', 9: 'Сигнальный огонь зажжён. Но Логейн не пришёл на помощь.' }, done: 9, xp: 600 });
  D.questDef('ost_blood', { name: 'Кровь порождений тьмы', stages: { 1: 'Добудьте три склянки крови порождений тьмы в дебрях Коркари.', 2: 'У вас достаточно крови.', 9: 'Кровь передана Дункану.' }, done: 9, xp: 200 });
  D.questDef('ost_treaties', { name: 'Договоры Серых Стражей', stages: { 1: 'В дебрях Коркари, в руинах старой башни, Стражи когда-то хранили свои договоры. Сундук был запечатан магией.', 2: 'Сундук пуст. Странная девушка по имени Морриган говорит, что договоры у её матери.', 3: 'Мать Морриган, Флемет, отдала вам договоры.', 9: 'Договоры у Дункана.' }, done: 9, xp: 250 });
  D.questDef('ost_dog', { name: 'Мабари-подранок', stages: { 1: 'Боевой пёс в королевской псарне проглотил кровь порождений тьмы. Псарь говорит, что его может спасти цветок, растущий в дебрях Коркари.', 2: 'Цветок у вас. Отнесите его псарю.', 9: 'Мабари поправляется. Псарь говорит, что пёс, похоже, выбрал вас.' }, done: 9, xp: 150 });
  D.questDef('ost_prisoner', { name: 'Голодный пленник', stages: { 1: 'Пленник в клетке просит еды. Его судьба — дело короля, а вот паёк можно попросить у часового.', 2: 'У вас есть еда для пленника.', 3: 'Пленник рассказал о тайнике в дебрях Коркари, у старой стоянки к западу от болот.', 9: 'Тайник дезертира найден.' }, done: 9, xp: 120 });
  D.questDef('ost_scouts', { name: 'Пропавшие разведчики', stages: { 1: 'Раненый разведчик у входа в дебри просил узнать, что стало с его товарищами.', 2: 'Вы нашли тела разведчиков. Порождения тьмы никого не пощадили.', 9: 'Разведчик узнал о судьбе товарищей.' }, done: 9, xp: 150 });

  D.codex('cailan', 'Персонажи', 'Король Кайлан', 'Сын короля Марика. Кайлан молод, храбр и любит легенды о героях больше, чем скучные донесения. Он женат на Аноре, дочери Логейна. Детей у них нет, и при дворе об этом шепчутся.');
  D.codex('loghain', 'Персонажи', 'Логейн Мак Тир', 'Тейрн Гварена, герой войны за освобождение Ферелдена. Сын фермера, он добился всего своим мечом. Логейн не доверяет Орлею, Серым Стражам и, похоже, никому, кроме собственной дочери.');
  D.codex('ostagar', 'Места', 'Остагар', 'Древняя крепость Тевинтерской империи на краю дебрей Коркари. Здесь сходятся дороги с юга, и здесь король решил остановить орду. Над руинами возвышается башня Ишала, самая высокая точка крепости.');
  D.codex('wilds', 'Места', 'Дебри Коркари', 'Болотистые леса на юге Ферелдена. Здесь живут чазинды, дикие племена, которых не покорили ни тевинтерцы, ни ферелденцы. Ходят легенды о ведьмах дебрей, которые крадут детей.');
  D.codex('flemeth', 'Персонажи', 'Флемет', 'В ферелденских сказках Флемет — ведьма, которая соблазнила мужей и прокляла их, превратилась в дракона и прожила сотни лет. Чазинды говорят о ней с опаской. Женщина из хижины в дебрях смеётся над этими сказками и не спешит их опровергать.');
  D.codex('joining', 'Культура и история', 'Посвящение', 'Обряд, которым человек становится Серым Стражем. Что именно в нём происходит, держится в тайне. Известно лишь, что выживают не все.');
  D.codex('ishal', 'Места', 'Башня Ишала', 'Тевинтерская башня над Остагаром. Когда-то с её вершины подавали сигналы на много миль. Сигнальный огонь на ней должен дать войскам Логейна знак ударить во фланг орды.');

  D.SHOPS.ost_qm = { name: 'Припасы интенданта', desc: 'Интендант королевской армии торгует тем, что осталось от поставок.', markup: 1.25, items: [['poultice_lesser', 10], ['poultice', 4], ['lyrium_lesser', 4], ['injury_kit', 3], ['stamina_draught', 3], ['flask', 20], ['elfroot', 10], ['longsword_grey', 1], ['greatsword_grey', 1], ['dagger_grey', 2], ['shortbow_grey', 1], ['longbow_iron', 1], ['staff2', 1], ['kite_grey', 1], ['chain_chest', 1], ['studded_chest', 1], ['chain_head', 1], ['leather_boots_q', 1], ['mage_robe', 1], ['belt_leather', 1], ['mabari_crunch', 5], ['trap_trigger', 3], ['metal_shards', 5]] };

  D.toOstagar = g => {
    for (const c of g.party.slice()) if (c.temp) g.leave(c.key);
    if (g.roster.dog) { g.leave('dog'); delete g.roster.dog; g.set('dog_owned'); g.set('dog_kennel'); }
    for (const k of Object.keys(g.roster)) if (g.roster[k].temp) delete g.roster[k];
    g.set('origin_done');
    g.emit('achieve', { id: 'origin_' + g.origin });
    g.setQuest('main_blight', 1);
    g.healParty();
    g.pc.injuries = [];
    D.recalc(g.pc);
    g.goto('ostagar', 'arrive');
  };

  D.area('ostagar', {
    name: 'Остагар', w: 120, h: 92, wallH: 6, codex: 'ostagar', onEnter: 'ost_enter', art: 'ostagar',
    theme: g => (g.flag('ost_joined') ? 'ostagar_night' : 'ostagar'),
    build(b) {
      b.fill('grass');
      b.noiseHeights(0.35, 10, 11);
      b.edgeCliffs(2, 8);
      b.pit(35, 0, 26, 92);
      b.clear(35, 41, 26, 5, 'ruin');
      b.wall(35, 40, 26, 1, 'ruin', 1.2); b.wall(35, 46, 26, 1, 'ruin', 1.2);
      b.heights((x, z, v) => (x >= 34 && x <= 62 && z >= 40 && z <= 47 ? 0 : v));
      b.ground(3, 41, 32, 5, 'road');
      b.wall(27, 28, 3, 12, 'ruin', 7); b.wall(27, 47, 3, 14, 'ruin', 7);
      b.ground(61, 3, 56, 86, 'dirt');
      b.ground(88, 36, 24, 18, 'grass'); b.ground(64, 18, 16, 10, 'grass');
      b.wall(61, 26, 3, 14, 'ruin', 8); b.wall(61, 47, 3, 14, 'ruin', 8);
      b.path([[62, 43], [75, 43], [86, 38], [86, 60], [86, 88]], 3, 'road');
      b.path([[75, 43], [75, 20], [80, 12]], 3, 'road');
      b.path([[86, 60], [72, 67]], 2, 'road');
      b.path([[86, 60], [104, 71]], 2, 'road');
      b.clear(84, 88, 5, 4, 'road');
      b.exit('to_wilds', 86, 90, { to: 'wilds', at: 'from_ostagar', req: 'quest.ost_main>=3', reqText: 'Часовые не пустят вас в дебри без приказа Дункана.', label: 'Дебри Коркари' });
      b.wall(97, 3, 15, 14, 'ruin', 18);
      b.wall(94, 9, 3, 3, 'ruin', 9); b.wall(112, 9, 3, 3, 'ruin', 9);
      b.ground(100, 17, 8, 3, 'ruin');
      b.exit('to_ishal', 104, 17, { to: 'ishal_yard', at: 'start', req: 'ost_battle', reqText: 'Башня Ишала закрыта. Её откроют, когда начнётся битва.', label: 'Башня Ишала' });
      b.wall(99, 63, 17, 1, 'ruin', 6); b.wall(99, 81, 17, 1, 'ruin', 6); b.wall(115, 63, 1, 19, 'ruin', 6); b.wall(99, 63, 1, 7, 'ruin', 6); b.wall(99, 74, 1, 8, 'ruin', 6);
      b.ground(100, 64, 15, 17, 'ruin');
      b.props('pillar', [[102, 66], [112, 66], [102, 78], [112, 78]], { tex: 'w_ruin', h: 5 });
      b.prop('chalice', 107, 71);
      b.prop('statue_big', 106, 64);
      b.light(107, 69, { kind: 'brazier', y: 1.3, r: 9 }); b.prop('brazier', 104, 71); b.prop('brazier', 110, 71);
      b.spot('joining', 107, 73, Math.PI);
      b.props('tent', [[66, 5], [83, 5]], { col: '#c8a040' });
      b.prop('tent', 72, 3, { col: '#a02a1a' });
      b.prop('table', 79, 12, { rot: 0 }); b.props('banner', [[76, 9], [84, 9]], { col: '#a02a1a' }); b.prop('banner', 70, 12, { col: '#3a4a5a' });
      b.light(79, 11, { kind: 'brazier', y: 1.3, r: 8 }); b.prop('brazier', 77, 14); b.prop('brazier', 83, 14);
      for (let i = 0; i < 4; i++) b.prop('tent', 90 + i * 5, 24, { col: '#b0a080', rot: i % 2 });
      for (let i = 0; i < 4; i++) b.prop('tent', 66 + i * 5, 30, { col: '#b0a080' });
      for (let i = 0; i < 3; i++) b.prop('tent', 90 + i * 5, 60, { col: '#b0a080' });
      b.props('tent', [[71, 49], [75, 49], [79, 49]], { col: '#4a5a8a' });
      b.props('bedroll', [[67, 36], [69, 36], [96, 30], [98, 30]]);
      b.prop('stall', 85, 28, { col: '#6a5a2a' }); b.props('crate', [[89, 29], [89, 30], [83, 29]]); b.props('barrel', [[88, 32], [83, 32]]);
      b.props('fence', [[101, 26], [102, 26], [103, 26], [104, 26], [105, 26], [106, 26], [107, 26], [108, 26], [109, 26], [101, 36], [102, 36], [103, 36], [106, 36], [107, 36], [108, 36], [109, 36]]);
      for (let z = 27; z < 36; z++) { b.prop('fence', 100, z, { rot: 1 }); b.prop('fence', 110, z, { rot: 1 }); }
      b.props('hay', [[108, 28], [108, 29]]);
      b.prop('altar', 93, 49); b.prop('candles', 92, 49); b.prop('candles', 96, 49); b.prop('statue', 94, 47);
      b.light(94, 51, { kind: 'candle', y: 1.0, r: 7 });
      b.prop('cage', 104, 44);
      b.props('campfire', [[70, 68], [75, 38], [95, 40], [80, 58], [98, 55]], { fire: 1 });
      b.light(70, 68, { kind: 'fire', y: 0.6, r: 11 }); b.light(75, 38, { kind: 'fire', y: 0.6, r: 9 }); b.light(95, 40, { kind: 'fire', y: 0.6, r: 9 }); b.light(80, 58, { kind: 'fire', y: 0.6, r: 9 }); b.light(98, 55, { kind: 'fire', y: 0.6, r: 9 });
      b.props('log', [[68, 70], [70, 66]]);
      b.props('bedroll', [[76, 55], [78, 55], [80, 55]]);
      b.props('rubble', [[65, 60], [66, 75], [90, 80], [95, 70], [70, 25]], { tex: 'stone' });
      b.props('pillar', [[64, 50], [64, 36], [92, 44], [80, 80]], { tex: 'w_ruin', h: 4 });
      b.props('statue', [[30, 38], [30, 48]]);
      b.light(62, 39, { r: 8 }); b.light(62, 47, { r: 8 }); b.light(28, 40, { r: 8 }); b.light(28, 46, { r: 8 });
      b.props('ballista', [[70, 82], [100, 84]]);
      b.props('rack', [[90, 34], [91, 34], [67, 42]]);
      b.scatter(['pine', 'tree', 'rock'], 4, 4, 22, 34, 12, { gap: 2 });
      b.scatter(['pine', 'tree', 'rock'], 4, 50, 22, 38, 12, { gap: 2 });
      b.scatter(['rock', 'bush'], 62, 72, 30, 14, 10);
      b.spot('arrive', 7, 43, Math.PI / 2);
      b.spot('from_wilds', 86, 85, Math.PI);
      b.spot('after_joining', 106, 72, -Math.PI / 2);
      b.spot('council', 79, 16, Math.PI);
      b.trig('council_trig', 72, 12, 14, 7, { run: 'ost_council_go', if: 'quest.ost_main>=5', unless: 'ost_battle' });
      b.npc('cailan', 13, 43, { face: -Math.PI / 2, unless: 'ost_arrived' });
      b.npc('ost_escort', 14, 41, { face: -Math.PI / 2, unless: 'ost_arrived' }); b.npc('ost_escort', 14, 45, { face: -Math.PI / 2, unless: 'ost_arrived' });
      b.npc('duncan', 8, 45, { face: Math.PI / 2, unless: 'ost_arrived' });
      b.npc('cailan', 78, 10, { face: Math.PI, if: 'ost_arrived', unless: 'ost_battle' });
      b.npc('ost_kingsguard', 75, 8, { face: 0 }); b.npc('ost_kingsguard', 83, 8, { face: 0 });
      b.npc('loghain', 81, 10, { face: Math.PI, if: 'ost_arrived', unless: 'ost_battle' });
      b.npc('uldred', 79, 14, { face: 0, if: 'ost_joined', unless: 'ost_battle' });
      b.npc('loghain_guard', 69, 14, { face: 1.5 }); b.npc('loghain_guard', 71, 15, { face: 1.5 });
      b.npc('duncan', 72, 68, { face: -Math.PI / 2, if: 'ost_arrived', unless: 'ost_joined' });
      b.npc('duncan', 77, 13, { face: 0.5, if: 'ost_joined', unless: 'ost_battle' });
      b.npc('daveth', 68, 70, { face: 0.8, unless: 'ost_wilds_go' }); b.npc('jory', 72, 71, { face: -0.8, unless: 'ost_wilds_go' });
      b.npc('ost_alistair', 81, 56, { face: -Math.PI / 2, unless: 'ost_alistair_met' });
      b.npc('ost_mage', 78, 56, { face: Math.PI / 2 });
      b.npc('wynne', 74, 54, { face: 0 });
      b.npc('kennel_master', 104, 31, { face: 1.5 });
      b.npc('ost_mabari', 106, 31, { face: -1.5, unless: 'quest.ost_dog>=9' });
      b.npc('quartermaster', 86, 31, { face: 0 });
      b.npc('ost_prisoner', 104, 44, { face: -1.5, unless: 'quest.ost_prisoner>=3' });
      b.npc('cage_guard', 102, 47, { face: -0.5 });
      b.npc('ost_mother', 94, 51, { face: 0 });
      b.npc('wilds_guard', 84, 86, { face: 0 }); b.npc('wilds_guard', 88, 86, { face: 0 });
      b.npc('ost_healer', 97, 57, { face: 1 }); b.npc('ost_wounded', 99, 57, { face: 1 }); b.npc('ost_wounded', 99, 59, { face: 1 });
      b.npc('ost_soldier', 74, 36, { wander: 3 }); b.npc('ost_soldier', 96, 42, { anim: 'sit', face: 3 }); b.npc('ost_soldier', 93, 41, { anim: 'sit', face: 1.5 }); b.npc('ost_soldier', 68, 40, { wander: 4 }); b.npc('ost_soldier', 90, 70, { wander: 6 }); b.npc('ost_soldier', 66, 45, { anim: 'guard', face: -1.5 }); b.npc('ost_soldier', 66, 41, { anim: 'guard', face: -1.5 });
      b.box('ost_chest1', 67, 31, { kind: 'chest', lock: 2, table: 'soldier_rich' });
      b.box('ost_crate1', 93, 26, { kind: 'crate', loot: [['poultice_lesser', 2], ['elfroot', 2]] });
      b.box('ost_barrel', 76, 47, { kind: 'barrel', loot: [['flask', 3], ['deathroot', 1]] });
      b.box('warden_chest', 74, 67, { kind: 'chest', loot: [['poultice_lesser', 2], ['injury_kit', 1]], gold: 300 });
    }
  });

  D.area('wilds', {
    name: 'Дебри Коркари', w: 120, h: 112, codex: 'wilds', theme: 'wilds', onKill: 'wilds_kill', onEnter: 'wilds_enter', art: 'flemeth',
    build(b) {
      b.fill('forest');
      b.noiseHeights(1.3, 13, 21);
      b.edgeCliffs(3, 7);
      b.path([[60, 1], [60, 14], [50, 26], [40, 30], [48, 40], [72, 38], [80, 48], [70, 60], [56, 66], [44, 58], [30, 52]], 3, 'mud');
      b.path([[70, 60], [72, 76], [66, 90], [66, 96]], 3, 'mud');
      b.path([[72, 76], [90, 84], [100, 96], [98, 104]], 3, 'mud');
      b.path([[80, 48], [96, 56], [104, 70]], 2, 'mud');
      b.clear(58, 0, 5, 4, 'mud');
      b.pond(30, 30, 7, -0.25, 'marsh', 3.5);
      b.pond(88, 30, 8, -0.25, 'marsh', 4);
      b.pond(40, 80, 9, -0.25, 'marsh', 5);
      b.pond(84, 70, 5, -0.2, 'marsh');
      b.pond(58, 50, 4, -0.2, 'marsh');
      b.pond(18, 94, 8, -0.25, 'marsh', 4);
      b.ground(94, 94, 12, 12, 'grass');
      b.wall(60, 86, 1, 7, 'ruin', 4); b.wall(72, 86, 1, 5, 'ruin', 3); b.wall(60, 86, 6, 1, 'ruin', 5); b.wall(68, 86, 5, 1, 'ruin', 2); b.wall(60, 99, 5, 1, 'ruin', 3); b.wall(69, 99, 4, 1, 'ruin', 4); b.wall(72, 94, 1, 6, 'ruin', 2);
      b.ground(61, 87, 11, 12, 'ruin');
      b.props('pillar', [[62, 88], [70, 88], [62, 97]], { tex: 'w_ruin', h: 3 });
      b.props('rubble', [[65, 90], [69, 96], [63, 93], [71, 91]], { tex: 'stone' });
      b.use('treaty_chest', 66, 92, { kind: 'chest', label: 'Старый сундук Стражей', run: 'wilds_chest', once: true, if: 'quest.ost_treaties>=1', unless: 'quest.ost_treaties>=2' });
      b.prop('hut', 97, 97);
      b.props('fence', [[95, 101], [96, 101], [101, 101], [102, 101]]);
      b.prop('campfire', 99, 102, { fire: 1 }); b.light(99, 102, { kind: 'fire', y: 0.6, r: 9 });
      b.prop('cauldron', 95, 98, { glow: 1 });
      b.props('bones', [[94, 96], [102, 97]]);
      b.props('corpse', [[26, 48], [28, 50], [34, 46]], { col: '#5a4a2a' });
      b.use('scout_bodies', 29, 48, { label: 'Тела разведчиков', run: 'wilds_scouts', once: true, if: 'quest.ost_scouts>=1', unless: 'quest.ost_scouts>=2' });
      b.use('mabari_flower', 24, 52, { kind: 'planter', label: 'Цветок у болота', run: 'wilds_flower', once: true, if: 'quest.ost_dog>=1', unless: 'quest.ost_dog>=2' });
      b.box('deserter_cache', 14, 70, { kind: 'chest', lock: 2, table: 'bandit_rich', loot: [['longbow_grey', 1], ['amulet_andraste', 1], ['poultice', 2]], gold: 1200, run: 'wilds_cache', if: 'quest.ost_prisoner>=3' });
      b.props('bedroll', [[16, 68], [18, 70]]); b.prop('campfire', 17, 72); b.prop('cart', 12, 66, { load: 1 });
      b.path([[30, 52], [16, 70]], 2, 'mud');
      b.props('corpse', [[46, 38], [50, 36]], { col: '#6a2a1a' });
      b.box('dead_soldier', 48, 37, { kind: 'corpse', col: '#6a2a1a', loot: [['poultice_lesser', 1]], gold: 60 });
      b.props('web', [[90, 60], [94, 58]]);
      b.npc('wilds_scout', 62, 10, { face: 3.1, anim: 'wounded', dlg: 'wilds_scout' });
      b.foes('wolf', [[40, 24], [43, 22], [44, 26]], { group: 'w_wolves' });
      b.foes('genlock', [[74, 34], [77, 36], [72, 37]], { group: 'w_gen1' });
      b.foe('genlock_archer', 78, 32, { group: 'w_gen1' });
      b.foes('hurlock', [[92, 52], [95, 55]], { group: 'w_gen2' });
      b.foe('genlock_emissary', 97, 52, { group: 'w_gen2' });
      b.foes('blight_wolf', [[78, 80], [82, 82]], { group: 'w_bwolf' });
      b.foes('genlock', [[52, 64], [55, 67]], { group: 'w_gen3' });
      b.foe('hurlock', 50, 66, { group: 'w_gen3' });
      b.foes('giant_spider', [[92, 62], [96, 64]], { group: 'w_spider' });
      b.foes('genlock', [[66, 80], [70, 82]], { group: 'w_gen4' });
      b.foe('genlock_archer', 64, 84, { group: 'w_gen4' });
      b.npc('morrigan_npc', 67, 94, { face: 0, if: 'wilds_morrigan', unless: 'quest.ost_treaties>=3' });
      b.npc('flemeth', 99, 99, { face: -1.5, if: 'wilds_morrigan', unless: 'quest.ost_treaties>=3' });
      b.scatter(['deadtree', 'tree', 'pine'], 3, 3, 114, 106, 330, { gap: 1 });
      b.scatter(['bush', 'rock', 'stump'], 3, 3, 114, 106, 120);
      b.spot('from_ostagar', 60, 4, 0);
      b.exit('to_ostagar', 60, 1, { to: 'ostagar', at: 'from_wilds', label: 'Остагар' });
    }
  });

  D.area('ishal_yard', {
    name: 'Подступы к башне Ишала', w: 60, h: 50, theme: 'ostagar_night', music: 'battle', onEnter: 'ishal_yard_enter', codex: 'ishal', art: 'tower',
    build(b) {
      b.fill('dirt');
      b.noiseHeights(0.2, 8, 31);
      b.edgeCliffs(2, 8);
      b.ground(10, 5, 40, 42, 'ruin');
      b.wall(18, 3, 24, 10, 'ruin', 18);
      b.clear(29, 12, 2, 1, 'ruin');
      b.exit('ishal_door', 29, 13, { to: 'ishal_floor', at: 'start', label: 'Вход в башню', req: 'cleared_iy_main', reqText: 'Сначала расчистите путь к дверям.' });
      b.wall(8, 18, 2, 12, 'ruin', 5); b.wall(50, 18, 2, 12, 'ruin', 5);
      b.props('rubble', [[20, 20], [36, 24], [26, 32], [44, 36]], { tex: 'stone' });
      b.props('corpse', [[22, 26], [34, 30], [28, 38], [40, 22]], { col: '#7a2a1a' });
      b.props('campfire', [[16, 30], [44, 30]], { fire: 1 });
      b.light(16, 30, { kind: 'fire', y: 0.6, r: 12 }); b.light(44, 30, { kind: 'fire', y: 0.6, r: 12 }); b.light(30, 14, { r: 9 });
      b.props('ballista', [[12, 40], [46, 40]]);
      b.spot('start', 30, 45, Math.PI);
      b.npc('tower_soldier', 30, 42, { face: 0, dlg: 'ishal_soldier', unless: 'ishal_party' });
      b.foes('genlock', [[24, 22], [34, 20], [30, 24]], { group: 'iy_main' });
      b.foe('hurlock', 28, 18, { group: 'iy_main' });
      b.foe('genlock_archer', 38, 17, { group: 'iy_main' });
      b.foes('ferelden_soldier', [[26, 36], [34, 36]], { group: 'iy_allies', ally: true });
    }
  });

  D.area('ishal_floor', {
    name: 'Башня Ишала', w: 44, h: 44, wallH: 5, theme: 'tower', music: 'battle', art: 'tower',
    build(b) {
      b.fill('stone');
      b.wall(0, 0, 44, 44, 'ruin', 6);
      b.hall(18, 34, 8, 8, { floor: 'stone' });
      b.hall(4, 24, 36, 9, { floor: 'stone' });
      b.hall(4, 4, 12, 18, { floor: 'wood' });
      b.hall(28, 4, 12, 18, { floor: 'stone' });
      b.hall(18, 4, 8, 18, { floor: 'stone' });
      b.opening(20, 33, 4, 1, 'stone');
      b.opening(9, 22, 2, 2, 'stone'); b.opening(33, 22, 2, 2, 'stone'); b.opening(21, 22, 2, 2, 'stone');
      b.opening(16, 10, 2, 1, 'stone'); b.opening(26, 14, 2, 1, 'stone');
      b.door('if_d1', 9, 22, { axis: 'x', open: true }); b.door('if_d2', 33, 22, { axis: 'x' }); b.door('if_d3', 16, 10, { axis: 'z' }); b.door('if_d4', 26, 14, { axis: 'z' });
      b.props('pillar', [[10, 27], [20, 27], [30, 27], [10, 30], [30, 30]], { tex: 'w_ruin' });
      b.props('bed', [[5, 5], [7, 5], [9, 5]]); b.props('table', [[12, 12], [5, 16]]); b.props('rack', [[14, 5], [15, 5]]);
      b.props('bookcase', [[29, 5], [32, 5], [35, 5]]); b.prop('table', 33, 12); b.prop('lectern', 30, 16); b.prop('cauldron', 37, 18, { glow: 1 });
      b.props('barrel', [[19, 5], [20, 5], [24, 5]]); b.props('crate', [[19, 8], [24, 8]]);
      b.props('corpse', [[14, 28], [26, 30], [6, 12], [34, 14]], { col: '#7a2a1a' });
      b.props('corpse', [[22, 36]], { col: '#4a3a5a' });
      for (const [x, z] of [[6, 26], [38, 26], [22, 38], [10, 8], [34, 8], [22, 12], [16, 30]]) b.light(x, z, { r: 8 });
      b.light(37, 18, { kind: 'magic', col: [0.3, 0.9, 0.3], r: 6 });
      b.spot('start', 22, 40, Math.PI);
      b.ground(20, 5, 4, 3, 'ruin');
      b.exit('to_top', 22, 5, { to: 'ishal_top', at: 'start', label: 'Лестница наверх', req: 'cleared_if_alpha', reqText: 'Лестницу перекрыли порождения тьмы.' });
      b.foes('genlock', [[12, 28], [16, 26], [26, 28]], { group: 'if_hall' });
      b.foe('genlock_archer', 30, 31, { group: 'if_hall' });
      b.foe('hurlock_2h', 34, 28, { group: 'if_hall' });
      b.foes('genlock_rogue', [[6, 10], [12, 16]], { group: 'if_barracks' });
      b.foe('hurlock', 8, 18, { group: 'if_barracks' });
      b.foe('genlock_emissary', 36, 8, { group: 'if_lab' });
      b.foe('hurlock', 32, 12, { group: 'if_lab' });
      b.foe('hurlock_alpha', 22, 9, { group: 'if_alpha' });
      b.foe('genlock', 21, 13, { group: 'if_alpha' });
      b.box('if_chest1', 5, 19, { kind: 'chest', table: 'soldier_rich', loot: [['poultice', 2]] });
      b.box('if_chest2', 38, 5, { kind: 'chest', lock: 2, loot: [['lyrium', 2], ['ring_lyrium', 1]], gold: 500 });
      b.box('if_rack', 14, 6, { kind: 'crate', loot: [['ishal_bow', 1]] });
    }
  });

  D.area('ishal_top', {
    name: 'Вершина башни Ишала', w: 34, h: 34, theme: 'tower_top', music: 'battle', onEnter: 'ishal_top_enter', art: 'tower',
    build(b) {
      b.fill('ruin');
      b.wall(0, 0, 34, 34, 'ruin', 2.4);
      b.clear(3, 3, 28, 28, 'ruin');
      b.each(0, 0, 34, 34, (x, z, i) => { const d = Math.hypot(x + 0.5 - 17, z + 0.5 - 17); if (d > 14.5) { b.solid[i] = 1; b.wallMat[i] = D.WI.ruin; b.wallH[i] = 2.2; } });
      b.use('beacon', 16, 8, { kind: 'beacon', label: 'Сигнальный костёр', run: 'ishal_beacon', litFlag: 'ishal_lit', req: 'cleared_it_ogre', reqText: 'Огр не даст вам подойти.' });
      b.props('corpse', [[10, 14], [22, 20], [14, 24]], { col: '#7a2a1a' });
      b.props('rubble', [[8, 10], [24, 12], [26, 24]], { tex: 'stone' });
      b.light(17, 17, { kind: 'fire', y: 0.5, r: 12, col: [1, 0.5, 0.2] }); b.prop('campfire', 17, 17, { fire: 1 });
      b.light(8, 20, { r: 8 }); b.light(26, 20, { r: 8 });
      b.spot('start', 17, 28, Math.PI);
      b.foe('ogre', 17, 12, { group: 'it_ogre' });
      b.foe('genlock', 23, 13, { group: 'it_ogre' });
      b.box('it_supplies', 26, 26, { kind: 'crate', loot: [['poultice', 2], ['injury_kit', 1]] });
    }
  });

  D.area('flemeth_hut', {
    name: 'Хижина Флемет', w: 50, h: 48, theme: 'hut', onEnter: 'hut_enter', art: 'flemeth',
    build(b) {
      b.fill('forest');
      b.noiseHeights(0.6, 9, 41);
      b.edgeCliffs(2, 6);
      b.room(18, 16, 11, 9, { wall: 'palisade', floor: 'wood', h: 3.2 });
      b.clear(23, 24, 2, 1, 'wood');
      b.roofShell(18, 16, 11, 9, { mat: 'thatch', h: 3.2, peak: 2.4, hideInside: true, axis: 'x' });
      b.prop('bed', 20, 17); b.prop('table', 24, 20); b.prop('cauldron', 27, 18, { glow: 1 }); b.props('bookcase', [[22, 17]]); b.props('crate', [[27, 22]]);
      b.light(24, 19, { kind: 'candle', y: 1.2, r: 7 }); b.light(27, 18, { kind: 'magic', col: [0.3, 0.9, 0.3], r: 5 });
      b.pond(12, 36, 7, -0.25, 'marsh', 3);
      b.pond(38, 38, 5, -0.25, 'marsh');
      b.path([[24, 25], [24, 34], [30, 44], [30, 47]], 2, 'mud');
      b.prop('campfire', 30, 30, { fire: 1 }); b.light(30, 30, { kind: 'fire', y: 0.6, r: 10 });
      b.props('bones', [[34, 26], [14, 26]]); b.props('totem', [[20, 27], [28, 27]]);
      b.scatter(['deadtree', 'tree', 'pine'], 3, 3, 44, 42, 50, { gap: 2 });
      b.scatter(['bush', 'rock'], 3, 3, 44, 42, 30);
      b.spot('bed', 21, 19, Math.PI / 2);
      b.npc('morrigan_npc', 24, 22, { face: -1.5, if: 'hut_awake', unless: 'hut_morrigan_joined', dlg: 'hut_morrigan2' });
      b.npc('flemeth', 30, 32, { face: Math.PI, unless: 'hut_done', dlg: 'hut_flemeth' });
      b.npc('ost_alistair', 32, 34, { face: -2.2, unless: 'hut_done', dlg: 'hut_flemeth' });
      b.clear(29, 46, 3, 2, 'mud');
      b.exit('hut_leave', 30, 46, { map: 'wilds', label: 'Тропа из дебрей', req: 'hut_done', reqText: 'Сначала поговорите с Флемет и Алистером.' });
      b.spot('outside', 24, 27, 0);
    }
  });

  D.area('road_camp', {
    name: 'Имперский тракт', w: 56, h: 40, theme: 'lothering', music: 'wilds', onEnter: 'road_enter', art: 'road_south',
    build(b) {
      b.fill('grass');
      b.noiseHeights(0.8, 9, 51);
      b.edgeCliffs(2, 6);
      b.path([[2, 20], [20, 18], [36, 22], [54, 20]], 4, 'road');
      b.pond(40, 8, 4, -0.2, 'marsh');
      b.props('cart', [[24, 22]], { load: 1 }); b.props('corpse', [[22, 24], [27, 20]], { col: '#6a5a3a' });
      b.scatter(['tree', 'pine', 'bush', 'rock'], 3, 3, 50, 34, 60, { gap: 2 });
      b.spot('start', 5, 20, Math.PI / 2);
      b.foes('genlock', [[30, 18], [33, 22], [31, 25]], { group: 'road_ds' });
      b.foe('genlock_archer', 36, 16, { group: 'road_ds' });
      b.foe('hurlock', 34, 20, { group: 'road_ds' });
      b.npc('road_dog', 40, 20, { face: -1.5, if: 'dog_owned', unless: 'road_dog_joined' });
      b.clear(53, 18, 3, 5, 'road');
      b.exit('road_on', 54, 20, { to: 'lothering', at: 'from_road', label: 'Дорога на Лотеринг', req: 'cleared_road_ds', reqText: 'Порождения тьмы не дадут пройти.' });
    }
  });

  D.dialogs(`
== ost_arrive
@ start
duncan: Вот и Остагар. Стены старые, тевинтерские, но держат. Смотри, нас встречают.
cailan: Дункан! А я уже боялся, что ты пропустишь всё веселье.
duncan: Ни за что, ваше величество.
cailan: А это, значит, новобранец? Мне говорили, что ты кого-то везёшь.
=> hn ?origin=hn
=> dn ?origin=dn
=> dc ?origin=dc
=> ce ?origin=ce
=> de ?origin=de
=> mage ?origin=mage
@ hn
cailan: Кусланд... Мне рассказали о Хайевере. Если Хоу и правда на такое пошёл, он ответит. Даю слово: как только разобьём орду, я пошлю войско на север.
* Благодарю, ваше величество. => plan
* Хоу заслуживает смерти. => hn2
@ hn2
cailan: Заслуживает. И получит, если вина докажется. Но сначала порождения тьмы.
=> plan
@ dn
cailan: Гном из Орзаммара! Жаль, что твой народ не прислал нам армию. Впрочем, один гном у Стражей лучше, чем ни одного.
* Я не посол Орзаммара. => plan
* Орзаммару хватает своих порождений тьмы. => plan
@ dc
cailan: Гном! Говорят, в Орзаммаре порождений тьмы видят чаще, чем солнце. Ты нам пригодишься.
* Солнце я до прошлой недели и не видел. => plan
* Я постараюсь. => plan
@ ce
cailan: Эльф из Денерима? Хорошо, что Стражи берут всех, кто умеет драться. Мне бы в армию побольше таких.
* Спасибо, ваше величество. => plan
* Скажите это эрлу Денерима. => ce2
@ ce2
cailan: Эрлу? А что с ним? Ладно, потом расскажешь. Сейчас не до того.
=> plan
@ de
cailan: Долийка? Или долиец? Прости, я впервые вижу вас так близко. Говорят, ваши лучники стреляют лучше всех в Ферелдене.
* Говорят правду. => plan
* Я здесь не ради Ферелдена. => plan
@ mage
cailan: Маг Круга! Первый чародей Ирвинг прислал нам немало ваших. Огонь против порождений тьмы работает на загляденье.
* Для этого нас и учат. => plan
* Надеюсь, храмовники тоже так думают. => plan
@ plan
cailan: Три битвы, и три победы. Если так пойдёт, Мор кончится, не успев начаться. Логейн, конечно, считает иначе. Он всегда считает иначе.
duncan: Орда растёт, ваше величество. Я бы не спешил праздновать.
cailan: Да-да. Мне пора, иначе Логейн умрёт от скуки на своём совете. Удачи, Страж. Увидимся в бою!
duncan: Располагайся в лагере. Найди Алистера, он тоже Серый Страж. Он у палаток магов. Когда будете готовы, приходите к моему костру.
! set:ost_arrived quest:ost_main:1 quest:main_blight:2 codex:cailan codex:ostagar run:ost_king_leave

== ost_alistair_meet
@ start
ost_mage: Передайте преподобной матери, что я занят. Я не мальчик на побегушках!
ost_alistair: А я, по-вашему, посланник Церкви по призванию? Она велела передать, я передал. Все претензии к ней.
ost_mage: Шутите сколько угодно, храмовник. Мне некогда.
ost_alistair: Хм. Вот и поговорили. Знаете, что хорошо в Море? Он всех объединяет.
* Ты Алистер? => meet
* Я тоже не люблю магов. => mages
* Поговорим о Море позже. Я новобран{ец|ка}. => meet
@ mages
ost_alistair: Не то чтобы не люблю. Просто я какое-то время готовился в храмовники. Маги этого не забывают.
! ap:alistair:-1
=> meet
@ meet
ost_alistair: Да, я Алистер. Самый младший Страж. А вы, должно быть, новобранец Дункана. Рад знакомству. Вы ведь не маг, правда? Если маг, простите за это всё.
* Я маг. ?mage => mage
* Нет. И ты прощён. ?!mage => ok
@ mage
ost_alistair: Ну конечно. Великолепно. Ладно, раз вы в Стражах, мне всё равно придётся с вами дружить.
=> ok
@ ok
ost_alistair: Дункан велел отвести вас к его костру, как только освоитесь. Он хочет, чтобы Посвящение прошло поскорее. Если хотите пройтись по лагерю, я подожду.
* Сначала осмотрюсь. => bye
* Идём к Дункану. => bye
@ bye
ost_alistair: Костёр на южной стороне лагеря, за палатками. Встретимся там.
! set:ost_alistair_met quest:ost_main:2 run:ost_alistair_go

== duncan_fire
@ start
=> joined ?ost_joined
=> ready ?item.darkspawn_blood>=3 ?item.treaties>=1
=> waiting ?ost_wilds_go
duncan: Вижу, ты {нашёл|нашла} Алистера. Хорошо. Это Дэвет и сэр Джори, ещё двое рекрутов. Вы пройдёте Посвящение вместе.
daveth: Приветствую. Не удивляйтесь, если что-нибудь пропадёт из кармана. Шучу. В основном.
jory: Сэр Джори из Редклифа. Я... рад знакомству.
duncan: Для Посвящения нужно три склянки крови порождений тьмы. Их вы добудете в дебрях Коркари. И ещё одно дело. В старых руинах в дебрях Стражи когда-то хранили договоры. Их запечатали в сундуке, магия должна была сохранить бумагу.
* Что за договоры? => treaties
* Кровь порождений тьмы? Зачем? => blood
* Мы готовы. => go
@ treaties
duncan: По этим договорам гномы, долийцы и маги Круга обязаны помочь Серым Стражам во время Мора. Сейчас они могут понадобиться.
! codex:grey_wardens
=> start2
@ blood
duncan: Узнаешь во время Посвящения. Большего я пока не скажу.
=> start2
@ start2
duncan: Алистер пойдёт с вами. Он проследит, чтобы вы вернулись. Выход в дебри на южной окраине лагеря.
* Мы готовы. => go
@ go
duncan: Удачи. И будьте осторожны. Дебри Коркари не прощают ошибок.
! set:ost_wilds_go quest:ost_main:3 quest:ost_blood:1 quest:ost_treaties:1 join:alistair join:daveth join:jory remove:daveth remove:jory
@ waiting
duncan: Кровь и договоры. Без них Посвящения не будет. Выход в дебри на юге.
@ ready
duncan: Вы вернулись. И с тем, что нужно. Отлично.
alistair: Дункан, там была девушка. Ведьма дебрей. И её мать отдала нам договоры. Просто так.
duncan: Ведьмы дебрей? Хм. Главное, что договоры у нас. Время не терпит. Идёмте. Посвящение пройдёт в старом храме.
! take:darkspawn_blood:3 take:treaties:1 quest:ost_blood:9 quest:ost_treaties:9 quest:ost_main:4 run:ost_joining
@ joined
duncan: Совет у королевского шатра. Я жду тебя там.

== ost_joining
@ start
duncan: Серые Стражи давно вышли из тени Первого Мора. Тогда люди оказались бессильны перед ордой. Первые Стражи выпили кровь порождений тьмы и подчинили себе скверну.
daveth: Мы... выпьем их кровь?
duncan: Как первые Стражи до вас. Это источник нашей силы и нашей победы. Те, кто выживет, почувствуют орду и услышат Архидемона.
jory: Те, кто выживет?
duncan: Не все переживают Посвящение. Поэтому оно держится в тайне. Алистер, слова.
alistair: Присоединяйтесь к нам, братья и сёстры. Присоединяйтесь к нам в тени, где мы стоим на страже. Присоединяйтесь к нам, и наш долг станет вашим. И если погибнете, знайте: ваша жертва не будет забыта. И однажды мы присоединимся к вам.
duncan: Дэвет. Подойди.
narr: Дэвет берёт кубок и пьёт. Его пальцы белеют. Он хватается за горло, падает на колени и больше не встаёт.
duncan: Мне жаль, Дэвет. Сэр Джори. Подойди.
jory: Нет. У меня жена в Хайевере. Ребёнок скоро родится. Если бы я знал... Это не честно! Вы не имеете права!
narr: Джори обнажает меч. Дункан двигается быстрее. Короткий удар кинжалом, и рыцарь падает рядом с Дэветом.
duncan: Мне жаль. Но Посвящение не остановить. {name}. Ты станешь Серым Стражем.
* (Взять кубок и выпить) => drink
* Сколько ещё людей вы так убили? => ask
@ ask
duncan: Слишком много. И каждый стоит у меня перед глазами. Пей.
=> drink
@ drink
narr: Кровь густая и горькая, как расплавленная медь. Мир проваливается во тьму. Из тьмы поднимается огромный дракон с горящими глазами и смотрит прямо на вас.
! run:ost_joining_after

== ost_joining_wake
@ start
alistair: Всё кончено. Добро пожаловать.
duncan: Двое погибли. Но ты с нами. Как себя чувствуешь?
* Как будто в меня влили болото. => fine
* Я видел{|а} дракона. => dream
@ dream
alistair: Архидемона. Мне тоже снилось, в первую ночь. Это пройдёт. Хотя нет, не пройдёт.
=> fine
@ fine
duncan: Прежде чем мы продолжим... У каждого Стража есть такой амулет. С каплей крови из кубка. Чтобы помнить тех, кто не дошёл.
duncan: Отдохни. А потом приходи к королевскому шатру. Король хочет, чтобы Стражи были на совете.
! give:amulet_warden quest:ost_main:5 codex:joining run:ost_after_wake

== ost_council
@ start
loghain: ...Моё решение окончательно. Кайлан, вы не можете стоять в первых рядах, как простой рыцарь.
cailan: Могу и буду. Я не собираюсь отсиживаться в тылу, пока другие сражаются за меня. Серые Стражи будут рядом со мной.
loghain: Серые Стражи. Нам не нужна помощь Орлея и их прикормленных Стражей, чтобы защитить Ферелден.
cailan: Не нужна? Орда растёт каждый день! Я напишу императрице Селине, и точка.
loghain: Мы не нуждаемся в орлесианцах. Ни в их солдатах, ни в их милости.
duncan: Ваше величество, план прежний?
cailan: Прежний. Как только орда пойдёт в атаку, мы встретим её здесь, у стен. Потом на башне Ишала зажгут огонь, и люди Логейна ударят с фланга.
uldred: Маги Круга готовы. Мы можем подать сигнал сами, ваше величество.
loghain: Магам я этого не доверю. Нужен кто-то надёжный.
cailan: Тогда Серые Стражи! Алистер и новый Страж зажгут огонь на башне.
alistair: Что? Я не буду сражаться? Я буду... зажигать костёр?
duncan: Таково решение короля, Алистер. Если огонь не зажгут, всё пойдёт прахом.
alistair: Ладно, ладно. Но если королю понадобится ещё один Страж в платье, чтобы отвлечь врага, я пас.
loghain: Решено. Битва начнётся с наступлением ночи.
* (Промолчать) => end_
* Я зажгу огонь. => end_
@ end_
duncan: Иди, {name}. Когда начнётся битва, беги к башне. Я буду с королём.
* Удачи, Дункан. => bye
* Мы ещё увидимся? => see
@ see
duncan: Мы Серые Стражи. Мы всегда видимся снова. Так или иначе.
=> bye
@ bye
! quest:ost_main:6 codex:loghain codex:ishal run:ost_battle

== wilds_scout
@ start
=> done ?quest.ost_scouts>=2
wilds_scout: Стражи? Слава Создателю. Нас было семеро. Шли на разведку, и они вылезли прямо из земли. Я один вернулся... Если найдёте остальных... хоть похороните по-человечески.
* Мы посмотрим. => ok
* Держись. Помощь придёт. => ok
@ ok
! quest:ost_scouts:1
@ done
wilds_scout: Все? Все погибли... Спасибо, что сказали. Возьмите, мне они уже ни к чему.
! quest:ost_scouts:9 give:poultice:2

== morrigan_meet
@ start
morrigan_npc: Так-так. Что тут у нас? Стервятники, что копаются в костях давно мёртвой добычи? Или незваные гости, пришедшие в эти пустоши, где давно всё мертво?
* Кто ты? => who
* Мы не стервятники. => who
alistair: Осторожно. Она из чазиндов, наверное. А за ней придут и другие.
morrigan_npc: Ты боишься, что я наброшу на тебя чары? Ууу...
alistair: Да, так что осторожнее. Она колдунья.
@ who
morrigan_npc: Меня зовут Морриган. Я смотрела на вас давно. Вы ищете что-то в сундуке, которого больше нет.
* Здесь были договоры Серых Стражей. => treaties
* Это ты их украла? => stole
@ stole
morrigan_npc: Украла? Как грубо. Трудно украсть то, что годами лежит без присмотра.
alistair: Ведьма дебрей! Вот, я же говорил!
=> treaties
@ treaties
morrigan_npc: Их забрала моя мать. Хотите, отведу вас к ней? Она не кусается. Почти.
* Веди. => go
* Можно ли тебе доверять? => trust
@ trust
morrigan_npc: А у тебя есть выбор? Договоры у неё, а не у меня.
=> go
@ go
morrigan_npc: Идите за мной. Хижина на юго-востоке, за болотами.
! set:wilds_morrigan quest:ost_treaties:2 codex:wilds

== flemeth_meet
@ start
=> after ?quest.ost_treaties>=3
flemeth: Ну, что тут у нас? Серые Стражи в моих болотах. Давно их не видели.
morrigan_npc: Они пришли за договорами, мать.
flemeth: Я знаю. Думаешь, я не вижу, кто стоит у моей двери?
alistair: Ведьма дебрей. Она нас в жаб превратит.
flemeth: Какой скептичный юноша. А ты, {name}? Во что веришь ты? Что с тобой будет?
* Я верю, что вы мне не враг. => friend
* Я не знаю, во что верю. => unsure
* Отдайте договоры, и мы уйдём. => rude
@ friend
flemeth: Ха! Хорошо сказано. Не у всех хватает на это ума.
=> give
@ unsure
flemeth: Честный ответ. Редкость.
=> give
@ rude
flemeth: Прямо к делу. Как скучно. Но пусть будет по-твоему.
=> give
@ give
flemeth: Вот ваши договоры. Печать давно истлела, а я их сберегла. Отнесите их Стражам и скажите, что угроза куда больше, чем они думают.
* Спасибо. => bye
* Кто вы такая на самом деле? => who
@ who
flemeth: Кто я? Старуха в болоте. Одни зовут меня Флемет, другие ведьмой, третьи и вовсе не зовут. Имена мало что значат.
! codex:flemeth
=> bye
@ bye
flemeth: Ступайте. Морриган, проводи гостей. Им ещё многое предстоит.
morrigan_npc: Как скажешь, мать.
! give:treaties quest:ost_treaties:3 codex:flemeth
@ after
flemeth: Идите. Ваши Стражи ждут.

== ishal_soldier
@ start
tower_soldier: Стражи! Башню захватили! Порождения тьмы полезли из старых тоннелей под крепостью. Мы потеряли почти всех!
* Нам нужно зажечь огонь на вершине. => go
* Сколько их там? => many
@ many
tower_soldier: Не знаю. Много. Там даже огры, говорят.
=> go
@ go
tower_soldier: Тогда я с вами. И ещё один наш, из уцелевших. Вдвоём от нас толку мало, а вчетвером прорвёмся.
alistair: Больше мечей нам не помешает. Вперёд!
! set:ishal_party join:tower_guard remove:tower_soldier quest:ost_main:6 do:ishal_third

== hut_wake
@ start
morrigan_npc: О, ты очнул{ся|ась}. Мать будет рада. Она говорит, что ты нужн{ен|на} живым.
* Где я? Что произошло? => what
* Где Алистер? => ali
@ ali
morrigan_npc: Снаружи. Сидит у воды и смотрит в одну точку. Его тоже вытащили.
=> what
@ what
morrigan_npc: Ты в хижине матери. Башню захватили. Вас обоих подобрали на вершине, пока порождения тьмы разбирали трупы. Тот человек, что должен был прийти на ваш сигнал, отступил. Армия короля погибла.
* Король мёртв? => king
* А Дункан? => king
@ king
morrigan_npc: Мёртв. Все, кто стоял у стен, мертвы. Мать хочет говорить с тобой. Она снаружи.
! set:hut_awake quest:ost_main:9 quest:main_blight:3

== hut_flemeth
@ start
alistair: Ты жив{|а}! Я думал... Я думал, я остался один.
flemeth: Рада видеть тебя на ногах. Твой друг уже опасался худшего.
alistair: Дункан мёртв. Король мёртв. Логейн бросил их! Он видел сигнал и увёл армию. Как он мог?
flemeth: Люди всегда ищут, кому бы отдать власть. А власть ищет тех, кто её возьмёт. Логейн не исключение.
* Спасибо, что спасли нас. => thanks
* Почему вы нас спасли? => why
@ why
flemeth: Потому что кто-то должен остановить Мор. А Серые Стражи, живые, пригодятся больше, чем мёртвые.
=> plan
@ thanks
flemeth: Благодари мою дочь. Это она вытащила вас оттуда. Я лишь помогла.
=> plan
@ plan
alistair: Нас двое. Двое Стражей против орды. У нас нет армии, нет короля...
* У нас есть договоры. => treaties
* Надо остановить Логейна. => loghain
@ loghain
alistair: Да! Но одним нам с ним не справиться. Эрл Эамон в Редклифе. Он дядя короля и ненавидит Логейна. Он поможет. А ещё... договоры!
=> treaties
@ treaties
alistair: Гномы, эльфы, маги. По договорам они обязаны нам помочь. Мы соберём армию!
flemeth: Вот и славно. А чтобы вы не заблудились по дороге, с вами пойдёт Морриган.
morrigan_npc: Что? Мать, я не...
flemeth: Ты пойдёшь. Ты давно хотела вырваться из этих болот. Её магия вам пригодится, Стражи. А её вредность вы переживёте.
alistair: Ведьма дебрей в нашем отряде? Мы ещё и её тащить будем?
* Нам нужна любая помощь. => accept
* Морриган, ты хочешь с нами? => ask
@ ask
morrigan_npc: Хочу ли я? Мне не оставили выбора. Но я пойду. С вами хотя бы нескучно.
=> accept
@ accept
morrigan_npc: Хорошо. Я готова. Пойдём, пока мать не передумала.
flemeth: Путь ваш лежит на север. Ближайшая деревня — Лотеринг. Идите через дебри на тракт.
! join:morrigan set:hut_done set:hut_morrigan_joined remove:morrigan_npc remove:flemeth remove:ost_alistair join:alistair codex:loghain quest:main_blight:4 xp:500

== hut_morrigan2
@ start
morrigan_npc: Мать ждёт снаружи. И твой друг-храмовник тоже.

== road_dog_found
@ start
narr: Из кустов выскакивает мабари, весь в чужой чёрной крови. Он бежит прямо к вам и радостно лает.
=> hn ?origin=hn
alistair: Это же пёс из королевской псарни. Тот самый, которому ты принёс цветок! Он нас нашёл!
* Хороший пёс. Пойдёшь с нами? => join
@ hn
alistair: Он твой? Мабари сам выбирает хозяина, говорят. И сам его находит. Похоже, правда.
* Хороший мальчик. Я знал{|а}, что ты вернёшься. => join
@ join
narr: Пёс гавкает дважды. Похоже, это «да».
! join:dog set:road_dog_joined remove:road_dog codex:mabari

== kennel_master
@ start
=> hn_dog ?origin=hn
=> done ?quest.ost_dog>=9
=> cure ?item.mabari_flower>=1
=> wait ?quest.ost_dog>=1
kennel_master: Осторожно, этот пёс болен. Бедняга наглотался крови порождений тьмы в последней битве. Хороший мабари, жалко его.
* Можно ему помочь? => help
* Жаль. Удачи ему. => end
@ help
kennel_master: Есть один цветок, растёт в дебрях Коркари. Чазинды им от скверны лечат. Если попадётся, принесите. Я бы сам пошёл, да кто ж меня в дебри пустит.
! quest:ost_dog:1
@ wait
kennel_master: Цветок из дебрей, помните? Белый, с жёлтой серединой. Растёт у воды.
@ cure
kennel_master: Этот? Он самый! Сейчас сделаю отвар. Держи его, приятель, вот так... Молодец.
narr: Мабари долго смотрит на вас, потом тычется мокрым носом в ладонь.
kennel_master: Надо же. Он вас выбрал. Мабари так делают, знаете? Выбирают хозяина раз и навсегда. Когда поправится, найдёт вас сам.
! take:mabari_flower quest:ost_dog:9 set:dog_owned codex:mabari
@ done
kennel_master: Пёс поправляется. Всё рвётся за вами.
@ hn_dog
kennel_master: Это ваш мабари? Отличный пёс. Я присмотрю за ним, пока вы в дебрях. Потом заберёте.
! set:dog_owned codex:mabari

== quartermaster
@ start
quartermaster: Чего надо? Припасы для армии, не для каждого встречного. Хотя... у Стражей деньги водятся.
* Покажи товар. => shop
* Цены у тебя грабительские. => haggle once
* Ничего. => end
@ haggle
quartermaster: Не нравится — иди в Лотеринг. Три дня пешком, если порождения не сожрут.
* [Убеждение] Серые Стражи сражаются за всех. Помоги им, и тебя запомнят. => ok %persuade:4:fail
* [Запугивание] Или ты снизишь цены, или я поговорю с королём о пропавших припасах. => ok %intimidate:4:fail
* Ладно. Показывай. => shop
@ ok
quartermaster: Ладно, ладно! Будет вам скидка. Только никому ни слова.
! set:disc_ost_qm
=> shop
@ fail
quartermaster: Ха. Иди, иди. Цены прежние.
=> shop
@ shop
! shop:ost_qm

== ost_prisoner
@ start
=> told ?quest.ost_prisoner>=3
=> fed ?item.soldier_ration>=1
ost_prisoner: Эй! Ты. Дай поесть. Меня уже три дня не кормят. Я умру тут раньше, чем меня повесят.
* За что ты здесь? => why
* Посмотрю, что можно сделать. => ok
* Сам виноват. => end
@ why
ost_prisoner: Я хотел сбежать. Видел, что там, в дебрях. Порождения тьмы. Тысячи. А меня за это в клетку.
=> ok
@ ok
ost_prisoner: У часового есть паёк. Уговори его. Я в долгу не останусь, у меня кое-что спрятано.
! quest:ost_prisoner:1
@ fed
ost_prisoner: Еда! Спасибо... Слушай. Я со своими прятал вещи в дебрях, на старой стоянке к западу от болот. Сундук под телегой. Забирай, мне уже не понадобится.
! take:soldier_ration quest:ost_prisoner:3
@ told
ost_prisoner: Иди уже. Пока тебя тут не увидели.

== cage_guard
@ start
=> after ?quest.ost_prisoner>=2
=> ask ?quest.ost_prisoner>=1
cage_guard: Не разговаривай с пленником. Приказ.
@ ask
cage_guard: Паёк для него? Приказано не кормить. Этот трус хотел сбежать с поля боя.
* [Убеждение] Если он умрёт от голода, допросить его уже не выйдет. => give %persuade:3:no
* Держи серебро. Отдай паёк. => pay ?gold>=100
* Ладно. => end
@ give
cage_guard: Хм. В этом есть смысл. Держите. Но я ничего не видел.
! give:soldier_ration quest:ost_prisoner:2
@ pay
cage_guard: За серебро, так и быть. Всё равно у меня аппетита нет.
! gold:-100 give:soldier_ration quest:ost_prisoner:2
@ no
cage_guard: Нет. Приказ есть приказ.
@ after
cage_guard: Я ничего не видел.

== ost_mother
@ start
ost_mother: Да хранит тебя Создатель, дитя. Скоро многие предстанут перед ним. Хочешь ли ты благословения перед битвой?
* Да, мать. => bless once
* Что говорит Церковь о Море? => blight once
* Нет, спасибо. => end
@ bless
ost_mother: Да будет Андрасте твоим щитом, и да не ослабеет твоя рука. Иди с миром.
! ap:alistair:1 codex:maker
=> start
@ blight
ost_mother: Мор — кара за гордыню тевинтерских магов, которые ворвались в Золотой город. Так говорит Песнь Света. Мы молимся, чтобы кара эта прошла мимо Ферелдена.
! codex:chantry
=> start

== wynne_talk
@ start
wynne: Новый Страж? Да хранит тебя Создатель. Меня зовут Винн, я из Круга магов. Нужна помощь целительницы, пока есть время?
* Расскажи о Круге. => circle once
* Что скажешь о битве? => battle once
* Пока нет. => end
@ circle
wynne: Круг — наш дом. Храмовники следят за нами, и не без причины. Но большинство из нас просто хотят учиться и приносить пользу.
! codex:circle
=> start
@ battle
wynne: Я лечила раненых после прошлых боёв. Эти твари не знают ни страха, ни пощады. Держитесь вместе. Вот, возьми, пригодится.
! give:poultice_lesser:2 codex:darkspawn
=> start

== cailan_talk
@ start
cailan: Страж! Готовишься к славной битве? Знаешь, я всегда мечтал сражаться рядом с Серыми Стражами. Как в старых легендах.
* Мор — это не легенда. => real
* Я тоже рад{|а} служить королю. => proud
@ real
cailan: Конечно. Но и легенды откуда-то берутся, правда? Иди, отдохни. Скоро будет жарко.
@ proud
cailan: Отлично! Посмотрим, что скажет Логейн, когда Стражи разобьют орду без его хитростей.

== loghain_talk
@ start
loghain: Страж. Иди отдыхай, пока можешь. Здесь тебе делать нечего.
* Что вы думаете о Серых Стражах? => wardens
* Как скажете. => end
@ wardens
loghain: Думаю, что Ферелден сорок лет обходился без них и обойдётся впредь. Но король любит сказки. Ступай.
! codex:loghain

== daveth_talk
@ start
daveth: Если спросишь, как я сюда попал, отвечу честно. Меня поймали на воровстве. Дункан заступился и забрал в Стражи. Лучше, чем петля.
* Тебе страшно? => fear
* Удачи нам всем. => end
@ fear
daveth: Страшно? Ещё бы. Но я видел, что эти твари делают с деревнями. Пусть лучше я их, чем они меня.

== jory_talk
@ start
jory: Я выиграл турнир в Редклифе, и Дункан сам меня пригласил. Жена в Хайевере ждёт ребёнка. Надеюсь, Посвящение не займёт много времени.
* Уверен, всё будет хорошо. => end
* Что ты знаешь о Посвящении? => know
@ know
jory: Ничего. И это меня пугает. Почему такая тайна?

== ost_mage_talk
@ start
ost_mage: Храмовники следят за каждым моим шагом, а теперь ещё и Церковь шлёт записки. Вы от них? Нет? Тогда оставьте меня.

== wilds_guard
@ start
wilds_guard: Дебри Коркари. Туда ходят либо смелые, либо глупые. Порождения тьмы там на каждом шагу. Будьте осторожны, Страж.
`);

  D.dialogs(`
== alistair_talk
@ start
=> post ?hut_done
alistair: Что-то нужно?
* Расскажи о себе. => about once
* Каково это — быть Серым Стражем? => warden once
* Ничего. Идём дальше. => end
@ about
alistair: Обо мне? Ну, я вырос в Редклифе, в замке эрла Эамона. Потом меня отдали в Церковь, учиться на храмовника. Дункан меня оттуда вытащил. Лучшее, что со мной случалось.
! ap:alistair:2
=> start
@ warden
alistair: Кормят лучше, чем в Церкви. Ну и порождения тьмы, конечно. Их мы чувствуем. Ты тоже скоро начнёшь.
=> start
@ post
alistair: Я всё думаю о Дункане. Он был мне почти отцом. А теперь... что теперь?
* Мы продолжим его дело. => honor
* Горевать будем потом. Сейчас нужно выжить. => cold
* Расскажи мне о Дункане. => duncan once
* Об эрле Эамоне. => eamon once
* Идём. => end
@ honor
alistair: Да. Ты прав{|а}. Он бы этого хотел. Спасибо.
! ap:alistair:5
@ cold
alistair: Выжить, да. Конечно. Ты, наверное, прав{|а}. Просто... не очень-то у тебя с утешениями.
! ap:alistair:-3
@ duncan
alistair: Он нашёл меня, когда я уже готовился принять обеты храмовника. Сказал, что видит во мне воина. Больше никто так не говорил.
! ap:alistair:3
=> post
@ eamon
alistair: Эрл Эамон — дядя короля Кайлана. Он меня растил, пока я не стал слишком... неудобным. Он хороший человек, и у него есть армия. Если кто и выступит против Логейна, то он.
=> post

== morrigan_talk
@ start
morrigan: Хм? Говори, раз уж пришёл{|ла}.
* Расскажи о своей матери. => mother once
* Ты правда ведьма дебрей? => witch once
* Как тебе Алистер? => ali once
* Ничего. => end
@ mother
morrigan: Мать растила меня в дебрях, вдали от людей. Учила магии, учила выживать. Её сказки я слышала с детства. Верю ли я им? Иногда.
! ap:morrigan:2
=> start
@ witch
morrigan: Так нас называют. Мне всё равно. Я маг-отступник, Круг меня никогда не видел, и не увидит.
=> start
@ ali
morrigan: Алистер? Он милый, как щенок. И так же полезен в разговоре.
* Ха! Согласен{|на}. => laugh
* Будь к нему добрее. => kind
@ laugh
morrigan: Хоть кто-то в этом отряде с чувством юмора.
! ap:morrigan:3 ap:alistair:-1
=> start
@ kind
morrigan: Добрее? Доброта — роскошь для тех, кому ничего не грозит.
! ap:morrigan:-2
=> start

== dog_talk
@ start
narr: Мабари виляет обрубком хвоста и смотрит на вас с нескрываемым обожанием.
* Хороший пёс. => good
* Поищешь что-нибудь интересное? => sniff once
* Пошли. => end
@ good
narr: Пёс радостно гавкает.
@ sniff
narr: Пёс обнюхивает землю и приносит вам... кость. Очень довольный собой.
! give:gift_bone
`);

  D.script('ost_enter', function* (g) {
    if (!g.flag('ost_arrived')) {
      yield 0.5;
      g.startDialog('ost_arrive', g.npcEnt('cailan'));
    }
  });
  D.script('ost_king_leave', function* (g) {
    for (const id of ['cailan', 'ost_escort', 'duncan']) for (const e of g.ents.filter(x => x.key === id)) g.walkNpc(e, 58, 43, Math.PI / 2, 1.2);
    yield 4;
    g.hideNpc('cailan'); g.hideNpc('ost_escort'); g.hideNpc('duncan');
    g.spawnNpc('cailan', 78.5, 10.5, Math.PI);
    g.spawnNpc('loghain', 81.5, 10.5, Math.PI);
    g.spawnNpc('duncan', 72.5, 68.5, -Math.PI / 2);
  });
  D.script('ost_alistair_go', g => {
    g.removeNpc('ost_alistair');
  });
  D.script('ost_joining', function* (g) {
    g.cutscene(true);
    g.emit('fade', { out: 1, t: 1 });
    yield 1;
    g.goto('ostagar', 'joining');
    yield () => !g.pendingGoto && g.mode !== 'loading';
    g.spawnNpc('duncan', 107.5, 70.5, 0);
    g.spawnNpc('daveth', 105.5, 73.5, 0.8);
    g.spawnNpc('jory', 109.5, 73.5, -0.8);
    g.leave('daveth'); g.leave('jory');
    g.emit('fade', { out: 0, t: 1 });
    yield 1;
    g.cutscene(false);
    g.startDialog('ost_joining', g.npcEnt('duncan'));
  });
  D.script('ost_joining_after', function* (g) {
    g.cutscene(true);
    g.showSlides([{ img: 'joining', text: 'Кровь обжигает горло. Дэвет и Джори лежат у ваших ног.' }, { img: 'archdemon', text: 'Во тьме открывается глаз. Огромный дракон, чешуя которого покрыта скверной, поворачивает голову и смотрит на вас. Вы слышите тысячи голосов, и все они поют ему.' }]);
    yield 'slides';
    g.removeNpc('daveth'); g.removeNpc('jory');
    g.set('ost_joined');
    g.emit('achieve', { id: 'joining' });
    g.giveXp(600);
    g.cutscene(false);
    yield 0.3;
    g.startDialog('ost_joining_wake', g.npcEnt('duncan'));
  });
  D.script('ost_after_wake', function* (g) {
    g.cutscene(true);
    g.emit('fade', { out: 1, t: 1 });
    yield 1;
    g.goto('ostagar', 'after_joining');
    yield () => !g.pendingGoto && g.mode !== 'loading';
    g.emit('fade', { out: 0, t: 1 });
    g.cutscene(false);
    g.toast('Стемнело. Военный совет собирается у королевского шатра.');
  });
  D.script('ost_council_go', function* (g) {
    yield 0.2;
    g.startDialog('ost_council', g.npcEnt('loghain'));
  });
  D.script('ost_battle', function* (g) {
    g.cutscene(true);
    g.emit('fade', { out: 1, t: 1 });
    yield 1;
    g.showSlides([
      { img: 'battle', text: 'Ночь. Идёт дождь. Из леса выходит орда: тысячи порождений тьмы, огры, эмиссары. Лучники Остагара дают залп горящими стрелами.' },
      { img: 'battle', text: 'Король Кайлан и Дункан ведут армию навстречу. Мабари бегут впереди. Строй держится, но порождений тьмы слишком много.' },
      { img: 'tower', text: 'Вы с Алистером бежите через мост к башне Ишала. Но у её подножия уже идёт бой: орда пробралась в крепость по старым тоннелям.' }
    ]);
    yield 'slides';
    g.set('ost_battle');
    g.emit('fade', { out: 0, t: 1 });
    g.cutscene(false);
    g.goto('ishal_yard', 'start');
  });
  D.script('ishal_yard_enter', function* (g) {
    if (g.flag('ishal_party')) return;
    yield 0.4;
    g.startDialog('ishal_soldier', g.npcEnt('tower_soldier'));
  });
  D.script('ishal_third', g => { g.join(g.pc.cls === 'mage' ? 'tower_archer' : 'circle_mage'); });
  D.script('ishal_top_enter', function* (g) {
    if (g.flag('it_seen')) return;
    g.set('it_seen');
    yield 0.4;
    g.toast('Огр!');
    g.sound('ogre_roar');
  });
  D.script('ishal_beacon', function* (g) {
    g.set('ishal_lit');
    g.cutscene(true);
    g.sound('fire');
    yield 2;
    g.showSlides([
      { img: 'tower', text: 'Огонь вспыхивает на вершине башни. Где-то внизу войска Логейна должны увидеть сигнал и ударить во фланг.' },
      { img: 'battle', text: 'Но с холма над полем боя знамёна Гварена разворачиваются и уходят в темноту. Логейн уводит армию.' },
      { img: 'battle', text: 'Король Кайлан остаётся один против орды. Огр поднимает его в воздух. Дункан, израненный, падает рядом.' },
      { img: 'tower', text: 'На вершину башни лезут новые порождения тьмы. Стрелы, одна за другой. Алистер падает. Вы падаете следом. Последнее, что вы видите, — огромная тень, пикирующая с неба.' }
    ]);
    yield 'slides';
    for (const c of g.party.slice()) if (c.temp) g.leave(c.key);
    g.leave('alistair');
    g.set('ost_fallen');
    g.emit('achieve', { id: 'ogre' });
    g.healParty();
    g.cutscene(false);
    g.goto('flemeth_hut', 'bed');
  });
  D.script('hut_enter', function* (g) {
    if (g.flag('hut_awake')) return;
    g.pc.anim = 'getup';
    g.pc.animT = 0;
    const m = g.spawnNpc('morrigan_npc', 24.5, 21.5, -1.5);
    m.dlg = 'hut_morrigan2';
    yield 1;
    g.startDialog('hut_wake', m);
  });
  D.GROUPS.it_ogre = { onClear: 'it_ogre_dead' };
  D.script('it_ogre_dead', g => { g.toast('Путь к сигнальному костру свободен.'); });
  D.script('wilds_enter', function* (g) {
    if (!g.flag('wilds_seen')) {
      g.set('wilds_seen');
      yield 0.5;
      g.float(g.roster.alistair || g.pc, 'Держитесь вместе. Здесь опасно.', '#fff');
    }
  });
  D.script('wilds_kill', (g, ctx) => {
    const e = ctx.ent;
    if (e.race !== 'darkspawn' || g.count('darkspawn_blood') >= 3 || (g.quests.ost_blood || 0) < 1 || g.questDone('ost_blood')) return;
    g.give('darkspawn_blood', 1, true);
    if (g.count('darkspawn_blood') >= 3) g.setQuest('ost_blood', 2);
  });
  D.script('wilds_chest', function* (g) {
    g.toast('Сундук пуст. Печать давно сломана.');
    yield 0.8;
    g.spawnNpc('morrigan_npc', 66.5, 95.5, Math.PI);
    g.startDialog('morrigan_meet', g.npcEnt('morrigan_npc'));
    yield 'dlg';
    g.spawnNpc('flemeth', 99.5, 99.5, -1.5);
    g.walkNpc('morrigan_npc', 98.5, 99.5, -1.5, 1);
  });
  D.script('wilds_flower', g => { g.give('mabari_flower', 1, true); g.setQuest('ost_dog', 2); });
  D.script('wilds_scouts', g => { g.setQuest('ost_scouts', 2); g.toast('Разведчики мертвы. Кто-то из них ещё сжимает меч.'); g.give('ring_iron', 1, true); });
  D.script('wilds_cache', g => { g.setQuest('ost_prisoner', 9); });
  D.script('road_enter', function* (g) {
    if (g.flag('road_seen')) return;
    g.set('road_seen');
    g.set('enc_road_done');
    yield 0.5;
    g.toast('Засада порождений тьмы!');
    g.fightGroup('road_ds');
  });
  D.GROUPS.road_ds = { onClear: 'road_clear' };
  D.script('road_clear', function* (g) {
    if (!g.flag('dog_owned') || g.flag('road_dog_joined')) return;
    yield 1;
    const d = g.npcEnt('road_dog');
    if (d) g.walkNpc(d, g.leader.x + 1.5, g.leader.z, -1.5, 1.4);
    yield 1.5;
    g.startDialog('road_dog_found', d);
  });

  D.ITEMS.soldier_ration = { id: 'soldier_ration', name: 'Солдатский паёк', type: 'quest', cat: 'quest', price: 0, ic: 'bag', desc: 'Сухари, вяленое мясо и кусок сыра.', tier: 1, quest: 1 };

  const talk = (id, dlg) => { D.NPCS[id].dlg = dlg; };
  talk('duncan', 'duncan_fire'); talk('ost_alistair', 'ost_alistair_meet'); talk('kennel_master', 'kennel_master'); talk('quartermaster', 'quartermaster');
  talk('ost_prisoner', 'ost_prisoner'); talk('cage_guard', 'cage_guard'); talk('ost_mother', 'ost_mother'); talk('wynne', 'wynne_talk'); talk('cailan', 'cailan_talk');
  talk('loghain', 'loghain_talk'); talk('daveth', 'daveth_talk'); talk('jory', 'jory_talk'); talk('ost_mage', 'ost_mage_talk'); talk('wilds_guard', 'wilds_guard');
  talk('flemeth', 'flemeth_meet'); talk('morrigan_npc', 'morrigan_meet');
  if (typeof module !== 'undefined' && module.exports) module.exports = D;
})(globalThis.Dao98 = globalThis.Dao98 || {});
