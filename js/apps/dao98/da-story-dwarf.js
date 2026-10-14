(function (D) {
  'use strict';
  const H = (race, sex, o) => Object.assign({ kind: 'humanoid', race, sex }, o);
  const dw = (sex, o) => H('dwarf', sex, Object.assign({ skin: '#e0b896', hair: '#5a3a1a', hairStyle: 'short', beard: sex === 'f' ? 'none' : 'full' }, o));

  D.THEMES.dwarf_hall = { sky: ['#000', '#000'], fog: '#1a0c06', fogNear: 20, fogFar: 70, amb: [0.4, 0.3, 0.24], sun: [0, 0, 0], sunDir: [0, -1, 0], outdoor: 0, music: 'dwarf', ceil: 'w_dwarf' };
  D.THEMES.dusttown = { sky: ['#000', '#050302'], fog: '#120c08', fogNear: 14, fogFar: 55, amb: [0.28, 0.24, 0.2], sun: [0.2, 0.1, 0.05], sunDir: [0, -1, 0], outdoor: 1, music: 'deep', cave: 1, weather: 'ash' };

  D.COMPANIONS.dn_scout = { name: 'Разведчик Эдуканов', race: 'dwarf', cls: 'rogue', sex: 'm', model: dw('m', { hair: '#8a3a1a', hairStyle: 'crop', beard: 'goatee' }), lvl: 2, attr: { str: 12, dex: 15, cun: 12, con: 13 }, equip: { main: 'shortbow_iron', chest: 'leather_chest' }, set2: { main: 'dagger_iron', off: 'dagger_iron' }, ab: ['pinning_shot'], temp: 1, build: 'archer', scale: false };

  D.npc('endrin', { name: 'Король Эндрин Эдукан', model: dw('m', { hair: '#b0b0b0', beard: 'braided', armor: 'dwarfplate', helm: 'dwarfplate' }), anim: 'idle' });
  D.npc('trian', { name: 'Триан Эдукан', model: dw('m', { hair: '#3a2414', beard: 'braided', armor: 'dwarfplate' }), equip: { main: 'longsword_steel', off: 'kite_steel' } });
  D.npc('bhelen', { name: 'Бхелен Эдукан', model: dw('m', { hair: '#6a4020', beard: 'goatee', armor: 'noble', tint: '#6a3a1a' }) });
  D.npc('harrowmont', { name: 'Лорд Харроумонт', model: dw('m', { hair: '#d0d0d0', beard: 'full', armor: 'noble', tint: '#2a4a3a' }) });
  D.npc('helmi', { name: 'Леди Хельми', sex: 'f', model: dw('f', { hair: '#c8a060', hairStyle: 'braids', armor: 'noble', tint: '#6a2a4a' }), barks: ['Какой прекрасный день для Испытания!'] });
  D.npc('gorim_npc', { name: 'Горим', model: D.COMPANIONS.gorim.model, equip: D.COMPANIONS.gorim.equip });
  D.npc('orz_guard', { name: 'Стражник дворца', model: dw('m', { armor: 'dwarfplate', helm: 'dwarfplate', beard: 'braided' }), equip: { main: 'longsword_iron', off: 'kite_iron' }, anim: 'guard', barks: ['Слава дому Эдукан.', 'Да хранят Камень ваши шаги.'] });
  D.npc('orz_noble', { name: 'Знатный гном', model: dw('m', { armor: 'noble', tint: '#4a3a6a', beard: 'braided' }), barks: ['Второй ребёнок короля — командующий? Посмотрим, посмотрим.', 'Триан снова не в духе.'], wander: 2 });
  D.npc('proving_master', { name: 'Распорядитель Испытания', model: dw('m', { hair: '#8a8a8a', beard: 'full', armor: 'noble', tint: '#6a5a2a' }), anim: 'talk' });
  D.npc('spectator', { name: 'Зритель', model: dw('m', { armor: 'cloth', tint: '#5a4a3a' }), anim: 'dance', barks: ['Давай! Давай!', 'Ставлю на новичка!'] });
  D.npc('rica', { name: 'Рика', sex: 'f', model: dw('f', { hair: '#3a2414', hairStyle: 'long', armor: 'noble', tint: '#7a4a6a', tattoo: 'brand' }) });
  D.npc('dc_mother', { name: 'Мать', sex: 'f', model: dw('f', { hair: '#8a8a8a', hairStyle: 'tail', armor: 'cloth', tint: '#4a4238', tattoo: 'brand' }), anim: 'drink' });
  D.npc('leske_npc', { name: 'Леске', model: D.COMPANIONS.leske.model, equip: D.COMPANIONS.leske.equip });
  D.npc('beraht_npc', { name: 'Беракт', model: D.TEMPLATES.beraht.model });
  D.npc('carta_guard', { name: 'Громила Хартии', model: dw('m', { armor: 'studded', tint: '#4a3a2a', tattoo: 'brand' }), equip: { main: 'mace_iron' }, anim: 'guard', barks: ['Проходи. Беракт ждёт.', 'Чего уставился?'] });
  D.npc('duster', { name: 'Житель Пыльного города', model: dw('m', { armor: 'cloth', tint: '#3a3228', tattoo: 'brand', beard: 'stubble' }), barks: ['Подай медяк, а? Нет? Ну и ладно.', 'Хартия опять кого-то искала.', 'Говорят, наверху солнце. Врут, небось.'], wander: 3 });
  D.npc('duster_f', { name: 'Жительница Пыльного города', sex: 'f', model: dw('f', { armor: 'cloth', tint: '#4a3a30', tattoo: 'brand' }), anim: 'sit', barks: ['Мой сын ушёл в Хартию. Больше я его не видела.'] });
  D.npc('warden_ally', { name: 'Серый Страж', model: H('human', 'm', { armor: 'warden', tint: '#4a5a7a', beard: 'full' }), equip: { main: 'longsword_steel', off: 'kite_steel' } });

  D.TEMPLATES.proving_dn = Object.assign({}, D.TEMPLATES.proving_fighter, { id: 'proving_dn', name: 'Воин дома Дейс', lvl: 2 });
  D.TEMPLATES.proving_dn2 = Object.assign({}, D.TEMPLATES.proving_fighter, { id: 'proving_dn2', name: 'Воин дома Мейно', lvl: 2, equip: { main: 'greataxe_iron', chest: 'chain_chest' }, ab: ['pommel_strike'] });
  D.TEMPLATES.proving_dn3 = Object.assign({}, D.TEMPLATES.proving_fighter, { id: 'proving_dn3', name: 'Чемпион дома Бемот', lvl: 3, hp: 150, equip: { main: 'longsword_grey', off: 'kite_iron', chest: 'chain_chest' }, ab: ['shield_bash'] });

  D.questDef('dn_main', { name: 'День чести', stages: { 1: 'Сегодня в вашу честь проводят Испытание. Арена к востоку от дворца.', 2: 'Вы победили на Испытании. Отец ждёт в тронном зале.', 3: 'Король отправляет вас с Трианом в тейг Эдуканов за щитом основателя дома. Ворота на Глубинные тропы на юге дворца.', 9: 'Вас обвинили в убийстве Триана и изгнали на Глубинные тропы.' }, done: 9, xp: 300 });
  D.questDef('dn_shield', { name: 'Щит Эдукана', stages: { 1: 'Найдите в заброшенном тейге щит Совершенного Эдукана.', 2: 'Щит у вас. Пора возвращаться.', 9: 'Щит так и не попал к отцу.' }, done: 9, xp: 250 });
  D.questDef('dn_exile', { name: 'Изгнание', stages: { 1: 'Вас оставили на Глубинных тропах с мечом и щитом. Пути назад нет.', 9: 'Дункан из Серых Стражей нашёл вас и призвал в орден.' }, done: 9, xp: 300 });
  D.questDef('dc_main', { name: 'Работа для Беракта', stages: { 1: 'Леске говорит, что Беракт хочет вас видеть. Его лавка в Пыльном городе.', 2: 'Беракт велел выступить на Испытании вместо Эверда и проиграть... то есть выиграть, но по его правилам. Арена на севере.', 3: 'Обман раскрылся. Вас бросили в камеру.', 4: 'Леске вытащил вас. Беракт в своём логове. Пора поквитаться.', 9: 'Беракт мёртв. Дункан из Серых Стражей видел ваше Испытание и забрал вас с собой.' }, done: 9, xp: 400 });
  D.questDef('dc_proving', { name: 'Бойцы Испытания', stages: { 1: 'Три поединка на арене Испытания.', 9: 'Вы выиграли все три поединка.' }, done: 9, xp: 200 });

  D.codex('orzammar', 'Места', 'Орзаммар', 'Последний великий город гномов, высеченный в толще гор. Здесь правит король, которого избирает Собрание знатных домов, а жизнь каждого гнома определяет каста, в которой он родился.');
  D.codex('proving', 'Культура и история', 'Испытание', 'Поединки на арене Орзаммара. Предки гномов верили, что в Испытании рассудит сам Камень. Сегодня здесь решают споры знатных домов и добывают славу.');
  D.codex('casteless', 'Культура и история', 'Безкастовые', 'Гномы без касты. Их клеймят на лице при рождении, им нельзя работать честным трудом, их имена не заносят в Память. Большинство живёт в Пыльном городе и работает на Хартию.');
  D.codex('carta', 'Культура и история', 'Хартия', 'Преступное сообщество Орзаммара. Контрабанда лириума, ростовщичество, наёмные убийцы. Хартия держит Пыльный город в кулаке.');
  D.codex('deep_roads', 'Места', 'Глубинные тропы', 'Когда-то эти дороги связывали десятки гномьих тейгов по всему подгорью. Теперь почти все они потеряны, и по ним ходят порождения тьмы.');
  D.codex('paragon', 'Культура и история', 'Совершенные', 'Гномы, чьи дела так велики, что Собрание признаёт их живыми предками. Совершенный Эдукан основал дом, к которому принадлежат нынешние короли.');

  D.area('orz_palace', {
    name: 'Королевский дворец Орзаммара', w: 70, h: 60, wallH: 7, theme: 'dwarf_hall', codex: 'orzammar', onEnter: 'dn_enter', art: 'orzammar',
    build(b) {
      b.fill('dwarf');
      b.wall(0, 0, 70, 60, 'dwarf', 8);
      b.hall(4, 4, 12, 10, { floor: 'rug', h: 6 });
      b.opening(16, 8, 2, 2, 'dwarf');
      b.hall(18, 4, 4, 48, { floor: 'dwarf', h: 7 });
      b.hall(24, 4, 30, 24, { floor: 'dwarf', h: 9 });
      b.ground(37, 6, 4, 22, 'carpet');
      b.opening(22, 14, 2, 3, 'dwarf');
      b.hall(56, 4, 11, 10, { floor: 'rug' });
      b.opening(54, 8, 2, 2, 'dwarf');
      b.hall(24, 32, 30, 16, { floor: 'dwarf', h: 8 });
      b.opening(22, 38, 2, 3, 'dwarf');
      b.opening(37, 28, 3, 4, 'dwarf');
      b.hall(54, 38, 14, 3, { floor: 'dwarf' });
      b.clear(67, 38, 3, 3, 'dwarf');
      b.exit('to_proving', 68, 39, { to: 'orz_proving', at: 'start', label: 'Арена Испытания' });
      b.hall(18, 52, 4, 6, { floor: 'deeproad' });
      b.clear(19, 58, 2, 2, 'deeproad');
      b.exit('to_thaig', 19, 58, { to: 'aeducan_thaig', at: 'start', label: 'Ворота на Глубинные тропы', req: 'quest.dn_main>=3', reqText: 'Стражники не откроют ворота без приказа короля.' });
      b.props('dpillar', [[27, 8], [27, 16], [27, 24], [50, 8], [50, 16], [50, 24], [28, 35], [48, 35], [28, 44], [48, 44]]);
      b.prop('throne', 38, 5); b.prop('statue_big', 31, 4); b.prop('statue_big', 45, 4);
      b.props('lavafall', [[24, 12], [53, 12], [24, 20], [53, 20]]);
      b.props('banner', [[33, 5], [43, 5]], { col: '#8a3a1a' });
      b.props('table', [[30, 38], [34, 38], [42, 38], [46, 38], [30, 43], [46, 43]]); b.props('bench', [[30, 39], [42, 39], [30, 42], [46, 42]]); b.props('candles', [[31, 38], [43, 38]]);
      b.prop('bed', 5, 5); b.prop('wardrobe', 14, 5); b.prop('chest', 5, 11); b.prop('table', 10, 9); b.prop('rack', 14, 12);
      b.props('bookcase', [[57, 4], [60, 4]]); b.prop('table', 61, 9);
      for (const [x, z] of [[10, 8], [20, 10], [20, 30], [20, 48], [30, 10], [46, 10], [38, 25], [30, 36], [46, 36], [60, 8], [60, 39]]) b.light(x, z, { r: 9, col: [1, 0.6, 0.3] });
      b.light(38, 16, { kind: 'lava', r: 12, col: [1, 0.4, 0.1], y: 3 });
      b.spot('room', 8, 9, Math.PI / 2);
      b.spot('from_proving', 64, 39, -Math.PI / 2);
      b.spot('hall', 38, 22, Math.PI);
      b.npc('gorim_npc', 12, 9, { face: -1.5, dlg: 'dn_gorim', unless: 'dn_gorim_joined' });
      b.npc('endrin', 38, 7, { face: 0, dlg: 'dn_endrin' });
      b.npc('trian', 35, 10, { face: 0.6, dlg: 'dn_trian', unless: 'dn_expedition' });
      b.npc('bhelen', 41, 10, { face: -0.6, dlg: 'dn_bhelen', unless: 'dn_expedition' });
      b.npc('harrowmont', 44, 37, { face: 3, dlg: 'dn_harrowmont' });
      b.npc('helmi', 32, 40, { face: 1.5 }); b.npc('orz_noble', 38, 44, {}); b.npc('orz_noble', 26, 45, {});
      b.npc('orz_guard', 20, 20, { face: 1.5 }); b.npc('orz_guard', 20, 50, { face: 0 }); b.npc('orz_guard', 36, 26, { face: Math.PI }); b.npc('orz_guard', 40, 26, { face: Math.PI });
      b.box('dn_room_chest', 5, 11, { kind: 'chest', loot: [['poultice_lesser', 2], ['amulet_dwarf', 1]], gold: 1500 });
    }
  });

  D.area('orz_proving', {
    name: 'Арена Испытания', w: 50, h: 44, theme: 'orzammar', codex: 'proving', onEnter: 'proving_enter', art: 'proving',
    build(b) {
      b.fill('sand');
      b.wall(0, 0, 50, 44, 'dwarf', 9);
      b.each(0, 0, 50, 44, (x, z, i) => {
        const d = Math.hypot(x + 0.5 - 25, z + 0.5 - 20);
        if (d < 13) { b.solid[i] = 0; b.floor[i] = D.FI.sand; }
        else if (d < 16 && z < 33) { b.solid[i] = 1; b.wallMat[i] = D.WI.dwarf; b.wallH[i] = 1.6 + (d - 13) * 0.9; }
      });
      b.clear(22, 30, 6, 14, 'dwarf');
      b.clear(4, 34, 16, 8, 'dwarf');
      b.clear(30, 34, 16, 8, 'dwarf');
      b.clear(20, 34, 10, 4, 'dwarf');
      b.exit('proving_out_dn', 24, 43, { to: 'orz_palace', at: 'from_proving', label: 'Во дворец', if: 'origin=dn', req: 'quest.dn_main>=2', reqText: 'Испытание ещё не окончено.' });
      b.exit('proving_out_dc', 25, 43, { to: 'dust_town', at: 'from_proving', label: 'В Пыльный город', if: 'origin=dc', req: 'dc_never', reqText: 'Стража не выпустит «Эверда» с арены, пока Испытание не окончено.' });
      b.props('banner', [[14, 8], [36, 8], [25, 4]], { col: '#8a3a1a' });
      b.props('dpillar', [[4, 34], [19, 34], [30, 34], [45, 34]]);
      b.props('brazier', [[12, 20], [38, 20]]); b.light(13, 20, { kind: 'brazier', y: 1.3, r: 12 }); b.light(38, 20, { kind: 'brazier', y: 1.3, r: 12 });
      b.light(25, 6, { kind: 'lava', r: 14, col: [1, 0.4, 0.1], y: 4 }); b.light(25, 36, { r: 9 });
      b.spot('start', 25, 40, Math.PI);
      b.spot('arena', 25, 26, Math.PI);
      b.npc('proving_master', 26, 33, { face: Math.PI, dlg: 'proving_master' });
      b.npc('spectator', 8, 37, {}); b.npc('spectator', 12, 39, {}); b.npc('spectator', 34, 37, {}); b.npc('spectator', 40, 39, {}); b.npc('spectator', 16, 36, {});
      b.npc('duncan', 42, 37, { face: -1.5, if: 'origin=dc', dlg: 'dc_duncan_arena', unless: 'dc_arrested' });
    }
  });

  D.area('aeducan_thaig', {
    name: 'Тейг Эдуканов', w: 80, h: 60, theme: 'deeproads', codex: 'deep_roads', onEnter: 'thaig_enter', art: 'deeproads',
    build(b) {
      b.fill('deeproad');
      b.wall(0, 0, 80, 60, 'cave', 8);
      b.hall(2, 26, 8, 8, { floor: 'deeproad', roof: false });
      b.hall(8, 26, 40, 8, { floor: 'deeproad', roof: false });
      b.hall(20, 6, 18, 20, { floor: 'deeproad', roof: false });
      b.opening(27, 24, 3, 3, 'deeproad');
      b.hall(48, 14, 28, 34, { floor: 'dwarf', roof: false });
      b.hall(30, 38, 14, 16, { floor: 'deeproad', roof: false });
      b.opening(35, 34, 3, 4, 'deeproad');
      b.noiseHeights(0.4, 6, 101, (x, z) => x < 48);
      b.props('dpillar', [[14, 25], [22, 25], [30, 34], [40, 25], [52, 18], [52, 42], [72, 18], [72, 42]]);
      b.props('rubble', [[16, 30], [34, 28], [58, 22], [66, 40], [26, 12]], { tex: 'stone' });
      b.props('bones', [[24, 14], [36, 44], [60, 30]]);
      b.props('statue_big', [[70, 29]]);
      b.use('shield_pedestal', 67, 30, { kind: 'altar', label: 'Пьедестал со щитом', run: 'dn_take_shield', once: true });
      b.props('pod', [[32, 8], [22, 20], [40, 48]]);
      b.props('lavafall', [[48, 20], [48, 40]]);
      for (const [x, z] of [[6, 30], [20, 30], [34, 30], [28, 14], [60, 30], [70, 22], [70, 38], [36, 46]]) b.light(x, z, { r: 9, col: [0.9, 0.55, 0.3] });
      b.light(49, 30, { kind: 'lava', r: 12, col: [1, 0.4, 0.1], y: 2 });
      b.spot('start', 4, 30, Math.PI / 2);
      b.foes('deepstalker', [[26, 12], [30, 16], [34, 10]], { group: 'th_stalk' });
      b.foe('deepstalker_leader', 30, 8, { group: 'th_stalk' });
      b.foes('darkspawn_deep', [[40, 29], [44, 31]], { group: 'th_ds1' });
      b.foes('genlock', [[58, 24], [62, 36]], { group: 'th_ds2' });
      b.foe('genlock_archer', 66, 26, { group: 'th_ds2' });
      b.foes('giant_spider', [[34, 44], [38, 48]], { group: 'th_spider' });
      b.box('th_chest', 40, 50, { kind: 'chest', table: 'ruin', loot: [['aeducan_leather', 1]] });
      b.box('th_bones', 60, 30, { kind: 'bones', loot: [['lyrium_dust', 2], ['deep_mushroom', 2]] });
      b.trig('trian_trig', 8, 25, 10, 10, { run: 'dn_trian_found', req: 'dn_shield_taken', once: true });
    }
  });

  D.area('deep_exile', {
    name: 'Глубинные тропы', w: 64, h: 44, theme: 'deeproads', onEnter: 'exile_enter', art: 'deeproads',
    build(b) {
      b.fill('deeproad');
      b.wall(0, 0, 64, 44, 'cave', 8);
      b.hall(2, 16, 60, 12, { floor: 'deeproad', roof: false });
      b.hall(26, 4, 12, 12, { floor: 'deeproad', roof: false });
      b.noiseHeights(0.5, 6, 111);
      b.props('dpillar', [[12, 15], [24, 28], [40, 15], [52, 28]]);
      b.props('rubble', [[20, 20], [44, 24]], { tex: 'stone' });
      b.props('corpse', [[30, 22], [34, 20]], { col: '#5a4a3a' });
      b.prop('campfire', 58, 22, { fire: 1 }); b.light(58, 22, { kind: 'fire', y: 0.6, r: 10 });
      for (const [x, z] of [[8, 22], [30, 10], [46, 22]]) b.light(x, z, { r: 8, col: [0.9, 0.55, 0.3] });
      b.spot('start', 4, 22, Math.PI / 2);
      b.foe('genlock', 26, 22, { group: 'ex_ds' });
      b.box('ex_pack', 7, 20, { kind: 'sack', label: 'Мешок изгнанника', loot: [['poultice_lesser', 3]] });
      b.foe('genlock_archer', 32, 8, { group: 'ex_ds2' });
      b.foe('genlock', 30, 12, { group: 'ex_ds2' });
      b.box('ex_corpse', 34, 20, { kind: 'corpse', loot: [['poultice_lesser', 2]], gold: 100 });
    }
  });

  D.area('dust_town', {
    name: 'Пыльный город', w: 72, h: 56, theme: 'dusttown', codex: 'casteless', onEnter: 'dc_enter', art: 'dusttown',
    build(b) {
      b.fill('dirt');
      b.wall(0, 0, 72, 56, 'cave', 9);
      b.clear(3, 3, 66, 50, 'dirt');
      b.noiseHeights(0.3, 8, 121);
      b.path([[35, 2], [35, 20], [20, 30], [12, 44]], 3, 'ash');
      b.path([[35, 20], [52, 14]], 3, 'ash');
      b.room(4, 40, 12, 10, { wall: 'cave', floor: 'dirt', h: 3.4 });
      b.opening(15, 44, 1, 2, 'dirt');
      b.room(46, 6, 16, 11, { wall: 'dwarf', floor: 'wood', h: 4 });
      b.opening(50, 16, 2, 1, 'wood');
      b.door('dc_shop_door', 50, 16, { axis: 'x', open: true });
      for (const [x, z] of [[20, 6], [8, 12], [8, 24], [24, 42], [40, 44], [56, 30], [60, 44], [44, 30], [20, 18]]) b.prop('hut', x, z);
      b.props('crate', [[30, 30], [31, 30], [48, 40]]); b.props('barrel', [[28, 34], [62, 24]]); b.props('bedroll', [[32, 40], [34, 42], [52, 38]]); b.props('campfire', [[33, 38], [52, 36]], { fire: 1 });
      b.light(33, 38, { kind: 'fire', y: 0.6, r: 9 }); b.light(52, 36, { kind: 'fire', y: 0.6, r: 9 });
      b.prop('counter', 50, 8); b.props('crate', [[56, 7], [57, 7], [60, 12]]); b.prop('chest', 60, 7);
      b.prop('bed', 5, 41); b.prop('table', 10, 46); b.props('barrel', [[13, 41]]); b.prop('bedroll', 6, 46);
      for (const [x, z] of [[10, 44], [54, 11], [35, 10], [20, 28], [40, 20]]) b.light(x, z, { r: 8, col: [1, 0.6, 0.3] });
      b.clear(34, 0, 3, 3, 'ash');
      b.exit('to_proving_dc', 35, 1, { to: 'orz_proving', at: 'start', label: 'Дорога к арене', req: 'quest.dc_main>=2', reqText: 'Сначала поговорите с Бераком.' });
      b.spot('home', 8, 45, Math.PI / 2);
      b.spot('from_proving', 35, 4, Math.PI);
      b.npc('dc_mother', 11, 42, { face: -1.5, dlg: 'dc_mother' });
      b.npc('rica', 7, 47, { face: 1, dlg: 'dc_rica' });
      b.npc('beraht_npc', 53, 9, { face: 0, dlg: 'dc_beraht' });
      b.npc('carta_guard', 49, 18, { face: 0 }); b.npc('carta_guard', 53, 18, { face: 0 });
      b.npc('duster', 30, 32, {}); b.npc('duster_f', 34, 40, { anim: 'sit' }); b.npc('duster', 44, 36, {}); b.npc('duster_f', 22, 24, {});
      b.box('dc_home', 13, 41, { kind: 'barrel', loot: [['poultice_lesser', 1]], gold: 30 });
    }
  });

  D.area('beraht_hideout', {
    name: 'Логово Беракта', w: 46, h: 40, wallH: 4, theme: 'estate', onEnter: 'hideout_enter', art: 'dusttown',
    build(b) {
      b.fill('wood');
      b.wall(0, 0, 46, 40, 'dwarf', 5);
      b.hall(18, 32, 10, 6, { floor: 'stone' });
      b.hall(8, 18, 30, 12, { floor: 'wood' });
      b.opening(21, 30, 4, 2, 'wood');
      b.hall(4, 4, 14, 12, { floor: 'stone' });
      b.opening(10, 16, 2, 2, 'stone');
      b.hall(26, 4, 16, 12, { floor: 'rug' });
      b.opening(32, 16, 2, 2, 'rug');
      b.door('bh_office', 32, 16, { axis: 'x' });
      b.props('table', [[14, 22], [26, 24]]); b.props('chair', [[13, 22], [16, 22], [25, 24]]); b.props('barrel', [[9, 19], [9, 20], [36, 19]]); b.props('crate', [[5, 5], [6, 5], [16, 14], [17, 14]]);
      b.prop('table', 33, 8); b.prop('throne', 33, 5); b.prop('chest', 40, 5); b.props('bookcase', [[27, 4]]);
      for (const [x, z] of [[22, 35], [12, 24], [30, 24], [10, 10], [34, 10]]) b.light(x, z, { r: 8 });
      b.spot('start', 23, 36, Math.PI);
      b.clear(22, 38, 2, 2, 'stone');
      b.exit('hideout_out', 22, 39, { to: 'dust_town', at: 'from_proving', label: 'Выход', req: 'quest.dc_main>=9', reqText: 'Беракт ещё жив.' });
      b.foes('carta_thug', [[12, 22], [20, 26]], { group: 'bh_a' });
      b.foe('carta_cutter', 30, 22, { group: 'bh_a' });
      b.foes('carta_cutter', [[8, 8], [14, 10]], { group: 'bh_b' });
      b.foe('beraht', 33, 7, { group: 'bh_boss' });
      b.foe('carta_thug', 37, 10, { group: 'bh_boss' });
      b.box('beraht_chest', 40, 5, { kind: 'chest', lock: 9, key2: 'beraht_key', loot: [['beraht_blade', 1], ['lyrium_dust', 3]], gold: 3000, lockText: 'Сундук Беракта. Ключ он носил на шее.' });
      b.box('bh_crates', 5, 5, { kind: 'crate', loot: [['poultice_lesser', 2], ['carta_leather', 1]] });
    }
  });

  D.dialogs(`
== dn_gorim
@ start
gorim_npc: {Мой лорд|Моя леди}, вы проснулись! Сегодня великий день. Король назначит вас командующим, а в вашу честь проведут Испытание. Потом пир.
* Кто будет драться за меня на Испытании? => proving
* Как настроение у моих братьев? => brothers
@ brothers
gorim_npc: Триан ворчит, как обычно. Считает, что второму ребёнку не положено столько почестей. А Бхелен всё время спрашивает, где вы.
=> proving
@ proving
gorim_npc: Вы сами будете драться, конечно. Вся знать хочет посмотреть. Арена к востоку от дворца. Я пойду с вами, как ваш секундант.
! join:gorim set:dn_gorim_joined remove:gorim_npc quest:dn_main:1 codex:orzammar

== dn_endrin
@ start
=> expedition ?quest.dn_main>=2
endrin: Иди на Испытание, дитя моё. Вся знать ждёт. Покажи им кровь Эдуканов.
@ expedition
endrin: Ты оказал{|а} честь нашему дому. А теперь я прошу о большем. В старом тейге нашего рода, на Глубинных тропах, разведчики нашли щит Совершенного Эдукана.
endrin: Возьми отряд и принеси его. Если ты вернёшь щит, Собрание не сможет отрицать, что ты достойн{ый|ая} наследни{к|ца}. Триан пойдёт отдельно, своей дорогой.
* Я принесу щит, отец. => go
* А если Триан задумал недоброе? => trian
@ trian
endrin: Триан твой брат. Он груб, но предать семью не посмеет. Иди.
=> go
@ go
endrin: Разведчик будет ждать вас у ворот на юге дворца. Да хранят тебя предки.
! quest:dn_main:3 quest:dn_shield:1 set:dn_expedition join:dn_scout codex:paragon

== dn_trian
@ start
trian: Второй ребёнок и командующий. Отец совсем размяк. Не путайся у меня под ногами, и мы поладим.
* Я не претендую на твой трон, Триан. => calm
* Однажды ты пожалеешь о своём тоне. => rude
@ calm
trian: Посмотрим.
@ rude
trian: Угрозы? От тебя? Ступай на свою арену.

== dn_bhelen
@ start
=> secret ?quest.dn_main>=2
bhelen: {Брат|Сестра}! Удачи на Испытании. Я поставил на тебя. Много.
@ secret
bhelen: Послушай. Мне стало известно, что Триан собирается убить тебя на Глубинных тропах. Он боится, что отец назовёт тебя наследником.
* Не верю. Он не посмеет. => doubt
* Что ты предлагаешь? => plan
@ doubt
bhelen: Может быть. Но будь осторожн{ым|ой}, ладно? Я не хочу тебя потерять.
@ plan
bhelen: Ударить первым. Или хотя бы быть готов{ым|ой}. Больше ничего сказать не могу, здесь уши у каждой колонны.
* Я не стану убивать брата. => doubt

== dn_harrowmont
@ start
harrowmont: Поздравляю, {мой лорд|моя леди}. Ваш отец гордится вами. Будьте осторожны с Собранием. Здесь каждый ищет выгоду, особенно когда король стареет.
! codex:dwarves

== proving_master
@ start
=> dc ?origin=dc
=> dn_done ?quest.dn_main>=2
proving_master: Приветствую, {мой лорд|моя леди}! Для нас большая честь. Три поединка в вашу честь, если позволите. Бой до сдачи.
* Начинайте. => go
* Позже. => end
@ go
proving_master: Пусть Камень рассудит! Первый противник!
! run:proving_start
@ dn_done
proving_master: Великолепные поединки! Об этом дне будут говорить.
@ dc
=> dc_go ?quest.dc_main>=2 ?quest.dc_proving<9 ?!proving_round
proving_master: Эверд? Ты что-то стал ниже ростом. Ладно, неважно. Готов к бою?
@ dc_go
proving_master: Эверд! Наконец-то. Ты опоздал. Три поединка. Ну, давай, на арену.
* (Кивнуть под шлемом) => go

== dc_leske_arena
@ start
leske: Только не проиграй. Беракт поставил на тебя кучу денег. И держи шлем пониже, а то признают.

== dc_duncan_arena
@ start
duncan: Хорошо дерёшься. Для «Эверда». Не беспокойся, я никому не скажу. Пока что.

== dc_exposed
@ start
proving_master: Стоп! Стоп, я сказал! Кто это? Это не Эверд! Эверд валяется пьяный у себя дома, мне только что донесли!
narr: С вас срывают шлем. Трибуны ахают: на лице клеймо безкастового.
proving_master: Безкастовая грязь на священной арене! Стража, взять {его|её}!
leske: Беги, я найду тебя! Я... Ах ты ж...
! set:dc_arrested quest:dc_main:3 run:dc_jail

== dc_mother
@ start
dc_mother: А, это ты. Принеси мамочке выпить, а? Нет? Ну и катись.
* Мама, может, хватит пить? => stop
* Ладно. => end
@ stop
dc_mother: Хватит? Ты мне ещё указывать будешь? Если бы не я, ты бы давно сдох{|ла} в канаве.

== dc_rica
@ start
rica: Ты уже встал{|а}? Я иду на приём к знати. Может, кто-нибудь из благородных возьмёт меня в наложницы. Тогда у моего ребёнка будет каста.
* Будь осторожна, Рика. => careful
* Это унизительно. => shame
@ careful
rica: Буду. А ты не лезь в дела Беракта. Он опасен.
@ shame
rica: Унизительно — жить в Пыльном городе. А это шанс. Для нас обоих.

== dc_leske_start
@ start
leske: Эй, соня, вставай! Беракт хочет тебя видеть. Сейчас же. Говорит, есть работа, от которой нельзя отказаться.
* Что за работа? => what
* Беракт мне надоел. => tired
@ tired
leske: Надоел, не надоел, а ослушаешься — пустит на корм глубинным охотникам. Пошли.
=> what
@ what
leske: Не знаю. Что-то с Испытанием. Его лавка на востоке. Пошли, я с тобой.
! join:leske remove:leske_npc quest:dc_main:1 codex:carta

== dc_beraht
@ start
=> after ?quest.dc_main>=2
beraht_npc: Вот и ты. Слушай внимательно, потому что повторять я не буду. Эверд должен был драться на Испытании за дом Бемот. Эверд пьян. Поэтому драться будешь ты.
* В его доспехах? Меня узнают. => armor
* Что я с этого получу? => pay
@ armor
beraht_npc: Под шлемом никто не разглядит твоё клеймо. Просто дерись и выиграй. На тебя поставлены хорошие деньги.
=> pay
@ pay
beraht_npc: Получишь то, что получаешь всегда. Жизнь. И долю, если всё пройдёт гладко. Арена на севере. Иди.
! quest:dc_main:2 quest:dc_proving:1 codex:proving
@ after
beraht_npc: Чего ты ещё тут? Арена на севере!

== dc_leske_rescue
@ start
leske: Ну и видок у тебя. Держи, твои вещи. Стражник продулся мне в кости и оставил ключи. Шучу. Я его стукнул.
leske: Беракт нас сдал. Говорит, мы сами всё затеяли. Он в своём логове, собирает деньги и бежит из города. Самое время заглянуть к нему.
* Идём. Пора с ним поквитаться. => go
@ go
! join:leske quest:dc_main:4 run:dc_to_hideout

== dc_beraht_end
@ start
duncan: Впечатляет. Сначала арена, потом логово Хартии. Меня зовут Дункан, я из Серых Стражей. Я видел твоё Испытание.
leske: Страж? Что Стражу нужно от безкастовых?
duncan: Мне нужны воины. Ты безкаст{овый|овая} и только что убил{|а} главаря Хартии. Здесь тебя ждёт казнь. У Стражей тебя ждёт Мор. Выбирай.
* Я иду с тобой. => go
* А Леске? => leske
@ leske
duncan: Только один. Прости, друг.
leske: Иди. Я найду, как выжить. Я всегда нахожу. И передай Рике, что... а, ладно, сам передам.
=> go
@ go
duncan: Тогда пойдём. Путь наверх долгий.
! quest:dc_main:9 leave:leske run:dc_end

== dn_trian_body
@ start
narr: У стены лежит тело Триана. Рядом его стражники, все мертвы. Удары нанесены гномьим оружием.
bhelen: Отец, смотрите! Триан! Я же говорил, что {он|она} на это способ{ен|на}!
endrin: Нет... Мой сын...
* Это ложь! Я не убивал{|а} его! => deny
* Это ты, Бхелен! Ты всё подстроил! => accuse
@ deny
bhelen: Мой разведчик видел, как {он|она} нападал{|а}! Спросите его!
=> arrest
@ accuse
bhelen: Как ты смеешь! Отец, {он|она} обвиняет меня, чтобы спасти свою шкуру!
=> arrest
@ arrest
endrin: Хватит. Взять {его|её}. Собрание решит.
gorim: {Мой лорд|Моя леди}, я с вами до конца...
! run:dn_trial

== dn_exile_duncan
@ start
duncan: Ты жив{|а}. Я слышал о твоём изгнании. Меня зовут Дункан, я Серый Страж.
* Что тебе нужно? => what
* Изгнанник вам не нужен. => what
@ what
duncan: Изгнанников на Глубинных тропах ждёт смерть. Но есть другой путь. Серые Стражи. Мы не спрашиваем, кем ты был{|а} раньше. Нам важно, как ты сражаешься.
* Я иду с вами. => go
@ go
duncan: Хорошо. Мы выйдем наверх через ворота Орзаммара. Там никто не посмеет тебя остановить. Право призыва Стражей выше решения Собрания.
! quest:dn_exile:9 run:dn_end
`);

  D.script('dn_enter', function* (g) {
    if (g.flag('dn_started') || g.origin !== 'dn') return;
    g.set('dn_started');
    yield 0.6;
    g.startDialog('dn_gorim', g.npcEnt('gorim_npc'));
  });
  D.script('proving_enter', function* (g) {
    if (g.origin === 'dc' && g.flag('dc_proving_won') && !g.flag('dc_arrested')) { yield 0.5; g.startDialog('dc_exposed', g.npcEnt('proving_master')); }
  });
  D.script('proving_start', function* (g) {
    const round = (g.flags.proving_round || 0) + 1;
    g.flags.proving_round = round;
    if (round === 1) {
      const keys = g.party.filter(c => c !== g.pc).map(c => c.key);
      g.flags.proving_party = keys.join(',');
      for (const k of keys) g.leave(k);
      g.flags.nonlethal_fight = 'proving_lost';
    }
    const tpls = g.origin === 'dn' ? ['proving_dn', 'proving_dn2', 'proving_dn3'] : ['proving_fighter', 'proving_dn2', 'proving_dn3'];
    const names = g.origin === 'dn' ? [null, null, null] : ['Воин дома Бемот', 'Боец из Торговой касты', 'Чемпион дома Дейс'];
    g.cutscene(true);
    const l = g.leader;
    g.placeEnt(l, 25.5, 26.5); l.face = Math.PI;
    g.party.forEach((c, i) => { if (c !== l) { g.placeEnt(c, 20 + i * 3, 31); c.order = null; } });
    yield 0.5;
    const e = g.spawn(tpls[round - 1], 25.5, 14.5, { group: 'proving', name: names[round - 1] || undefined, face: 0 });
    e.nonlethal = 1;
    g.toast('Поединок ' + round + ': ' + e.name);
    g.cutscene(false);
    g.set('proving_solo');
    yield 0.8;
    e.aware = true;
    g.fightGroup('proving');
  });
  D.GROUPS.proving = { onClear: 'proving_next' };
  D.script('proving_next', function* (g) {
    delete g.flags.cleared_proving;
    const round = g.flags.proving_round || 1;
    for (const e of g.ents.filter(x => x.group === 'proving')) { e.gone = true; e.dead = true; }
    g.healParty();
    g.giveXp(120);
    if (round < 3) {
      g.toast('Победа! Следующий противник.');
      yield 1.5;
      g.runScript('proving_start');
      return;
    }
    g.toast('Три победы! Трибуны ревут.');
    delete g.flags.nonlethal_fight;
    for (const k of (g.flags.proving_party || '').split(',').filter(Boolean)) g.join(k);
    if (g.origin === 'dn') { g.setQuest('dn_main', 2); g.emit('toast', { text: 'Отец ждёт в тронном зале.' }); }
    else { g.setQuest('dc_proving', 9); g.set('dc_proving_won'); yield 1; g.startDialog('dc_exposed', g.npcEnt('proving_master')); }
  });
  D.script('proving_lost', function* (g) {
    g.mode = 'play';
    g.healParty();
    for (const e of g.ents.filter(x => x.group === 'proving')) { e.gone = true; e.dead = true; }
    g.flags.proving_round = Math.max(0, (g.flags.proving_round || 1) - 1);
    delete g.flags.cleared_proving;
    g.combat = false;
    g.toast('Вы проиграли поединок. Распорядитель, пожав плечами, даёт вам реванш.');
    yield 2;
    g.runScript('proving_start');
  });
  D.script('thaig_enter', function* (g) {
    if (g.flag('th_seen')) return;
    g.set('th_seen');
    yield 0.5;
    g.toast('Глубинные тропы. Здесь тихо. Слишком тихо.');
  });
  D.script('dn_take_shield', g => {
    g.give('aeducan_shield', 1, true);
    g.set('dn_shield_taken');
    g.setQuest('dn_shield', 2);
  });
  D.script('dn_trian_found', function* (g) {
    g.cutscene(true);
    g.spawnNpc('trian', 12.5, 28.5, 0).anim = 'dead';
    g.npcEnt('trian').dead = true;
    g.spawnNpc('bhelen', 5.5, 30.5, Math.PI / 2);
    g.spawnNpc('endrin', 5.5, 28.5, Math.PI / 2);
    g.spawnNpc('orz_guard', 4.5, 32.5, Math.PI / 2);
    yield 1;
    g.cutscene(false);
    g.startDialog('dn_trian_body', g.npcEnt('bhelen'));
  });
  D.script('dn_trial', function* (g) {
    g.cutscene(true);
    g.emit('fade', { out: 1, t: 1 });
    yield 1;
    g.showSlides([
      { img: 'orzammar', text: 'Собрание знатных домов. Разведчик Бхелена клянется, что видел, как вы убили Триана. Горима лишают звания. Ваш голос тонет в криках.' },
      { img: 'orzammar', text: 'Король Эндрин молчит. Потом говорит одно слово: изгнание. Ваше имя вычеркнут из Памяти, как будто вас никогда не было.' },
      { img: 'deeproads', text: 'Вас выводят за ворота Орзаммара на Глубинные тропы и оставляют там с мечом и щитом. Такова традиция: изгнанник должен умереть в бою.' }
    ]);
    yield 'slides';
    g.leave('gorim'); g.leave('dn_scout');
    g.take('aeducan_shield', 1);
    g.setQuest('dn_main', 9);
    g.setQuest('dn_shield', 9);
    g.setQuest('dn_exile', 1);
    g.healParty();
    if (!g.pc.equip.main) { g.give('longsword_iron'); g.equipFromInv(g.pc, 'main', 'longsword_iron'); }
    g.cutscene(false);
    g.goto('deep_exile', 'start');
  });
  D.script('exile_enter', function* (g) {
    if (g.flag('ex_seen')) return;
    g.set('ex_seen');
    yield 0.5;
    g.toast('Изгнание. Никто не придёт на помощь.');
  });
  D.GROUPS.ex_ds2 = { onClear: 'exile_duncan' };
  D.script('exile_duncan', function* (g) {
    if (g.flag('ex_duncan') || g.ents.some(e => (e.group === 'ex_ds' || e.group === 'ex_ds2') && !e.dead)) return;
    g.set('ex_duncan');
    yield 1;
    const d = g.spawnNpc('duncan', 56.5, 22.5, -Math.PI / 2);
    g.spawnNpc('warden_ally', 57.5, 24.5, -Math.PI / 2);
    g.walkNpc(d, g.leader.x + 2, g.leader.z, -Math.PI / 2, 1.2);
    yield 2.5;
    g.startDialog('dn_exile_duncan', d);
  });
  D.GROUPS.ex_ds = { onClear: 'exile_duncan' };
  D.script('dn_end', function* (g) {
    g.cutscene(true);
    g.emit('fade', { out: 1, t: 1 });
    yield 1;
    g.showSlides([
      { img: 'orzammar', text: 'Дункан ведёт вас обратно к воротам Орзаммара. Стража отводит глаза: право призыва Серых Стражей не оспорит даже Собрание.' },
      { img: 'road_south', text: 'Впервые в жизни вы видите небо. Оно огромное, и от него кружится голова. Дункан смеётся: «Привыкнешь. Остагар ждёт».' }
    ]);
    yield 'slides';
    g.cutscene(false);
    D.toOstagar(g);
  });

  D.script('dc_enter', function* (g) {
    if (g.origin !== 'dc' || g.flag('dc_started')) return;
    g.set('dc_started');
    yield 0.6;
    const l = g.spawnNpc('leske_npc', 12.5, 45.5, -1.5);
    l.dlg = 'dc_leske_start';
    g.startDialog('dc_leske_start', l);
  });
  D.script('dc_jail', function* (g) {
    g.cutscene(true);
    g.emit('fade', { out: 1, t: 1 });
    yield 1;
    g.showSlides([{ img: 'dusttown', text: 'Камера под ареной. Сырость, темнота и звон цепей. Никто не придёт за безкастовым. Проходит ночь, потом ещё одна.' }]);
    yield 'slides';
    g.leave('leske');
    g.healParty();
    g.cutscene(false);
    yield 0.5;
    const l = g.spawnNpc('leske_npc', g.leader.x + 1, g.leader.z, 0);
    g.startDialog('dc_leske_rescue', l);
  });
  D.script('dc_to_hideout', function* (g) {
    g.hideNpc('leske_npc');
    g.goto('beraht_hideout', 'start');
  });
  D.script('hideout_enter', function* (g) {
    if (g.flag('bh_seen')) return;
    g.set('bh_seen');
    yield 0.5;
    g.toast('Логово Беракта. Громилы Хартии уже ждут.');
  });
  D.GROUPS.bh_boss = { onClear: 'beraht_dead' };
  D.script('beraht_dead', function* (g) {
    g.give('beraht_key', 1, true);
    yield 1;
    const d = g.spawnNpc('duncan', 23.5, 33.5, 0);
    g.walkNpc(d, g.leader.x + 1.5, g.leader.z + 1, 0, 1.2);
    yield 2;
    g.startDialog('dc_beraht_end', d);
  });
  D.script('dc_end', function* (g) {
    g.cutscene(true);
    g.emit('fade', { out: 1, t: 1 });
    yield 1;
    g.showSlides([
      { img: 'dusttown', text: 'Вы в последний раз проходите через Пыльный город. Рика стоит у двери и долго смотрит вам вслед.' },
      { img: 'road_south', text: 'Над воротами Орзаммара небо. Огромное и пустое. Дункан кладёт руку вам на плечо: «Не смотри вверх слишком долго. Упадёшь».' }
    ]);
    yield 'slides';
    g.cutscene(false);
    D.toOstagar(g);
  });

  D.ORIGIN_SETUP.dn = g => {
    const c = g.pc;
    if (c.cls === 'warrior') Object.assign(c.equip, { main: 'aeducan_blade', off: 'kite_iron', chest: 'dwarf_heavy_chest', boots: 'chain_boots' });
    else Object.assign(c.equip, { main: 'aeducan_dagger', off: 'dagger_grey', chest: 'aeducan_leather', boots: 'leather_boots' });
    g.give('poultice_lesser', 3);
    g.addGold(3000);
    g.events = [];
  };
  D.ORIGIN_SETUP.dc = g => {
    const c = g.pc;
    if (c.cls === 'warrior') Object.assign(c.equip, { main: 'mace_iron', off: 'buckler_iron', chest: 'carta_leather' });
    else Object.assign(c.equip, { main: 'dagger_iron', off: 'dagger_iron', chest: 'carta_leather' });
    g.give('poultice_lesser', 2);
    g.addGold(40);
    g.events = [];
  };
  if (typeof module !== 'undefined' && module.exports) module.exports = D;
})(globalThis.Dao98 = globalThis.Dao98 || {});
