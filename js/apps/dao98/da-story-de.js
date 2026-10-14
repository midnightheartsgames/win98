(function (D) {
  'use strict';
  const H = (race, sex, o) => Object.assign({ kind: 'humanoid', race, sex }, o);
  const dalish = (sex, tint, o) => H('elf', sex, Object.assign({ armor: 'dalish', tint, skin: '#e8c8a8', hair: '#6a4020', hairStyle: sex === 'f' ? 'tail' : 'long', tattoo: 'vallaslin' }, o));

  D.npc('tamlen_npc', { name: 'Тамлен', model: D.COMPANIONS.tamlen.model, equip: { main: 'longbow_iron' } });
  D.npc('marethari', { name: 'Хранительница Маретари', sex: 'f', model: dalish('f', '#4a5a3a', { hair: '#d8d8d8', armor: 'robe', tint: '#4a6a3a' }), equip: { main: 'staff3' } });
  D.npc('merrill_npc', { name: 'Меррил', sex: 'f', model: D.COMPANIONS.merrill.model, equip: { main: 'staff1' } });
  D.npc('ashalle', { name: 'Ашалле', sex: 'f', model: dalish('f', '#6a5a3a', { hair: '#8a8a8a' }) });
  D.npc('ilen', { name: 'Мастер Илен', model: dalish('m', '#5a4a3a', { hair: '#8a6a4a', beard: 'none' }), anim: 'work' });
  D.npc('paivel', { name: 'Хахрен Пайвел', model: dalish('m', '#4a4a3a', { hair: '#e0e0e0', armor: 'robe', tint: '#5a4a2a' }), anim: 'sit' });
  D.npc('fenarel', { name: 'Фенарель', model: dalish('m', '#5a6a3a', { hair: '#1a1410' }), equip: { main: 'shortbow_iron' } });
  D.npc('de_elf', { name: 'Долиец', model: dalish('m', '#6a5a3a'), barks: ['Андаран атиши, да\'лен.', 'Хранительница беспокоится. Говорят, в лесу пахнет гнилью.', 'Галлы нервничают третий день.'], wander: 3 });
  D.npc('de_elf_f', { name: 'Долийка', sex: 'f', model: dalish('f', '#5a6a4a'), barks: ['Скоро снимаемся с места. Люди слишком близко.', 'Ты {был|была} в тех руинах? Правда?'], wander: 3 });

  D.TEMPLATES.shem_bandit = Object.assign({}, D.TEMPLATES.bandit, { id: 'shem_bandit', name: 'Человек-бродяга', lvl: 1, attr: { dex: 12, str: 11 }, equip: { main: 'dagger_iron', chest: 'leather_chest' }, ab: [], xp: 25 });

  D.questDef('de_ruins', { name: 'Руины в лесу', stages: { 1: 'Тамлен хочет осмотреть пещеру с руинами, о которой говорили люди. Она к востоку по тропе.', 2: 'В пещере древние эльфийские руины. Тамлен идёт вперёд.', 3: 'В глубине руин стоит странное зеркало.', 9: 'Тамлен коснулся зеркала. Больше вы ничего не помните.' }, done: 9, xp: 300 });
  D.questDef('de_tamlen', { name: 'Потерянный Тамлен', stages: { 1: 'Вы очнулись на стоянке. Тамлен пропал. Хранительница просит вернуться в руины вместе с Меррил.', 2: 'В руинах порождения тьмы.', 9: 'Тамлена не найти. Дункан разбил зеркало и забрал вас в Серые Стражи: скверна уже в вашей крови.' }, done: 9, xp: 400 });
  D.questDef('de_ilen', { name: 'Лук мастера Илена', stages: { 1: 'Мастер Илен делает лук для лучшего охотника клана.', 9: 'Мастер Илен отдал вам долийский длинный лук.' }, done: 9, xp: 80 });

  D.codex('dalish', 'Культура и история', 'Долийцы', 'Кланы долийских эльфов кочуют по лесам Тедаса на аравелях, похожих на лодки на колёсах. Их ведут Хранители, они берегут остатки древнего знания. Долийцы не доверяют людям и не любят городских эльфов, которые, по их мнению, забыли себя.');
  D.codex('vallaslin', 'Культура и история', 'Валласлин', 'Узоры на лицах долийцев. Каждый рисунок посвящён одному из богов эльфийского пантеона. Эльф без валласлина у долийцев считается ребёнком, сколько бы лет ему ни было.');
  D.codex('eluvian', 'Магия и религия', 'Элувианы', 'Древние эльфийские зеркала. Хранители считают, что через них эльфы Арлатана говорили друг с другом на огромных расстояниях. Какие силы в них остались сейчас, не знает никто.');
  D.codex('halla', 'Существа', 'Галлы', 'Белые олени с изогнутыми рогами. Долийцы разводят их, чтобы тянуть аравели, и почитают как священных животных.');
  D.codex('arlathan', 'Культура и история', 'Арлатан', 'Древняя столица эльфов, где, по легендам, эльфы жили вечно и не старели. Тевинтерские маги разрушили её, и эльфы начали стареть и умирать, как люди.');

  D.area('dalish_road', {
    name: 'Лес у стоянки клана', w: 92, h: 70, theme: 'forest', onEnter: 'de_road_enter', codex: 'dalish', art: 'forest',
    build(b) {
      b.fill('forest');
      b.noiseHeights(1.2, 11, 81);
      b.edgeCliffs(3, 6);
      b.path([[6, 36], [20, 34], [34, 40], [48, 32], [62, 36], [76, 34], [88, 35]], 3, 'mud');
      b.pond(30, 18, 6, -0.25, 'marsh', 3);
      b.pond(58, 54, 7, -0.25, 'marsh', 3);
      b.rockWall(80, 3, 9, 29, 7); b.rockWall(80, 39, 9, 28, 7);
      b.clear(80, 32, 12, 7, 'stone');
      b.ground(84, 32, 8, 7, 'deeproad');
      b.exit('to_ruins', 89, 35, { to: 'elf_ruins', at: 'start', label: 'Вход в пещеру' });
      b.props('web', [[76, 30], [78, 40]]);
      b.props('corpse', [[70, 38]], { col: '#6a5a3a' });
      b.scatter(['tree', 'pine', 'bigtree'], 3, 3, 78, 64, 150, { gap: 2 });
      b.scatter(['bush', 'rock', 'stump'], 3, 3, 78, 64, 60);
      b.spot('start', 8, 36, Math.PI / 2);
      b.spot('from_ruins', 84, 35, -Math.PI / 2);
      b.npc('tamlen_npc', 14, 34, { face: 1.5, unless: 'de_tamlen_joined' });
      b.foes('shem_bandit', [[20, 32], [21, 36], [19, 38]], { group: 'dr_humans', neutral: true, dlg: 'de_humans', face: -1.5 });
      b.foes('wolf', [[44, 30], [47, 34]], { group: 'dr_wolves' });
      b.foes('giant_spider', [[72, 32], [74, 38]], { group: 'dr_spiders' });
      b.box('dr_corpse', 70, 38, { kind: 'corpse', loot: [['poultice_lesser', 1], ['elfroot', 2]], gold: 40 });
    }
  });

  D.area('elf_ruins', {
    name: 'Древние руины', w: 60, h: 56, wallH: 5, theme: 'elfruins', codex: 'arlathan', onEnter: 'ruins_enter', art: 'mirror',
    build(b) {
      b.fill('elfstone');
      b.wall(0, 0, 60, 56, 'elfruin', 6);
      b.hall(27, 44, 6, 10, { floor: 'elfstone' });
      b.hall(14, 28, 32, 16, { floor: 'elfstone', h: 7 });
      b.hall(3, 28, 10, 16, { floor: 'moss' });
      b.opening(13, 34, 1, 3, 'elfstone');
      b.hall(47, 28, 10, 16, { floor: 'moss' });
      b.opening(46, 34, 1, 3, 'elfstone');
      b.hall(27, 16, 6, 12, { floor: 'elfstone' });
      b.hall(18, 3, 24, 13, { floor: 'elfstone', h: 7 });
      b.clear(29, 54, 2, 2, 'elfstone');
      b.exit('ruins_out', 29, 55, { to: 'dalish_road', at: 'from_ruins', label: 'Выход из пещеры', unless: 'de_return' });
      b.exit('ruins_out2', 30, 55, { to: 'dalish_camp', at: 'from_ruins', label: 'Выход из пещеры', if: 'de_return' });
      b.props('pillar', [[17, 31], [17, 40], [42, 31], [42, 40], [24, 31], [35, 31]], { tex: 'w_elfruin', h: 7 });
      b.props('statue', [[20, 5], [39, 5], [29, 30]]);
      b.props('rubble', [[20, 36], [38, 38], [6, 30], [52, 40], [30, 20]], { tex: 'moss' });
      b.props('web', [[4, 29], [54, 30], [50, 42]]);
      b.props('bones', [[8, 36], [22, 42], [36, 12]]);
      b.props('crystal', [[5, 42], [55, 29]]);
      b.use('eluvian', 29, 4, { kind: 'mirror', label: 'Зеркало', run: 'de_mirror', unless: 'de_return' });
      b.use('eluvian_b', 29, 4, { kind: 'mirror', label: 'Зеркало', run: 'de_mirror2', if: 'de_return' });
      for (const [x, z] of [[29, 50], [20, 35], [40, 35], [8, 36], [52, 36], [29, 22], [23, 9], [36, 9]]) b.light(x, z, { r: 8, col: [0.5, 0.9, 0.7] });
      b.light(29, 6, { kind: 'magic', col: [0.4, 1, 0.9], r: 10, y: 1.5 });
      b.spot('start', 30, 52, Math.PI);
      b.foes('skeleton', [[26, 36], [34, 34]], { group: 'er_skel', unless: 'de_return' });
      b.foe('skeleton_archer', 30, 30, { group: 'er_skel', unless: 'de_return' });
      b.foes('giant_spider', [[7, 34], [50, 38]], { group: 'er_spider', unless: 'de_return' });
      b.foes('genlock', [[26, 36], [34, 34]], { group: 'er_ds1', if: 'de_return' });
      b.foe('genlock_archer', 30, 30, { group: 'er_ds1', if: 'de_return' });
      b.foes('genlock', [[26, 12], [33, 12]], { group: 'er_ds2', if: 'de_return' });
      b.npc('duncan', 31, 8, { face: 0, if: 'de_return', dlg: 'de_duncan' });
      b.box('er_chest', 5, 30, { kind: 'chest', loot: [['amulet_dalish', 1]], gold: 250 });
      b.box('er_bones', 53, 42, { kind: 'bones', table: 'ruin' });
    }
  });

  D.area('dalish_camp', {
    name: 'Стоянка клана', w: 70, h: 60, theme: 'forest', onEnter: 'camp_enter', codex: 'halla', art: 'forest',
    build(b) {
      b.fill('grass');
      b.noiseHeights(0.5, 10, 91);
      b.edgeCliffs(3, 6);
      b.ground(20, 18, 30, 26, 'forest');
      b.props('aravel', [[18, 16], [26, 14], [44, 16], [50, 26], [16, 34]], { col: '#8a3a2a' });
      b.props('aravel', [[38, 42]], { col: '#3a6a3a' });
      b.props('campfire', [[34, 30], [22, 26]], { fire: 1 });
      b.light(34, 30, { kind: 'fire', y: 0.6, r: 12 }); b.light(22, 26, { kind: 'fire', y: 0.6, r: 9 });
      b.props('totem', [[30, 22], [40, 36]]);
      b.props('tent', [[46, 36], [12, 24]], { col: '#6a5a3a' });
      b.props('bedroll', [[24, 30], [26, 32], [42, 30]]);
      b.props('log', [[31, 32], [36, 27]]);
      b.prop('anvil', 48, 22); b.prop('rack', 47, 20);
      b.scatter(['bigtree', 'tree', 'pine'], 3, 3, 64, 54, 55, { gap: 3, avoid: (x, z) => x > 12 && x < 56 && z > 10 && z < 48 });
      b.scatter(['bush', 'rock'], 3, 3, 64, 54, 30, { avoid: (x, z) => x > 14 && x < 54 && z > 12 && z < 46 });
      b.path([[34, 30], [66, 30]], 3, 'mud');
      b.clear(64, 28, 4, 5, 'mud');
      b.exit('camp_to_ruins', 66, 30, { to: 'elf_ruins', at: 'start', label: 'Тропа к руинам', req: 'de_return', reqText: 'Сначала поговорите с Хранительницей.' });
      b.spot('wake', 24, 32, 0);
      b.spot('from_ruins', 62, 30, -Math.PI / 2);
      b.npc('marethari', 33, 27, { face: 0, dlg: 'de_keeper' });
      b.npc('merrill_npc', 36, 27, { face: -0.5, dlg: 'de_merrill', unless: 'de_return' });
      b.npc('ashalle', 25, 30, { face: 1.5, dlg: 'de_ashalle' });
      b.npc('ilen', 48, 23, { face: 3, dlg: 'de_ilen' });
      b.npc('paivel', 33, 32, { face: 3, dlg: 'de_paivel' });
      b.npc('fenarel', 44, 28, { face: -1.5, dlg: 'de_fenarel' });
      b.npc('de_elf', 20, 22, {}); b.npc('de_elf_f', 42, 38, {}); b.npc('de_elf', 50, 34, { anim: 'work' }); b.npc('de_elf_f', 16, 28, { anim: 'sit' });
      b.box('camp_chest', 12, 26, { kind: 'chest', loot: [['poultice_lesser', 2], ['dalish_gloves', 1]] });
    }
  });

  D.dialogs(`
== de_humans
@ start
=> after ?de_humans_done
tamlen: Смотри, кого я поймал. Три шемлена прятались в кустах. Говорят, что просто охотились.
shem_bandit: Прошу, мы не хотели ничего плохого! Мы нашли пещеру, там старые камни, статуи... Думали, там сокровища!
tamlen: Пещера? С руинами? Где?
shem_bandit: На востоке, по тропе! Там было что-то... страшное. Демон какой-то. Мы убежали.
* Отпусти их, Тамлен. => free
* Шемлены лгут. Убить их. => kill
* Ты врёшь. Что вы там взяли? => question
@ question
shem_bandit: Ничего! Только вот... кусочек зеркала. Возьмите, возьмите!
! give:mirror_shard
=> choose
@ choose
tamlen: Ну что, отпустим?
* Пусть уходят. И пусть не возвращаются. => free
* Нет. Они видели стоянку клана. => kill
@ free
tamlen: Бегите, шемлены. Пока мы добрые. Пойдём, посмотрим на эти руины. Сколько лет никто из наших их не видел!
! set:de_humans_done quest:de_ruins:1 do:de_humans_flee
@ kill
tamlen: Как скажешь. Хотя... мне это не нравится.
! set:de_humans_done quest:de_ruins:1 fight:dr_humans
@ after
tamlen: Пойдём к пещере. Она на востоке.

== de_keeper
@ start
=> after ?de_return
marethari: Да'лен. Ты очнулся{|ась}. Хвала Творцам. Тебя принёс человек, Серый Страж по имени Дункан. Ты {был|была} в лихорадке два дня.
* Где Тамлен? => tamlen
* Что со мной было? => what
@ what
marethari: Скверна. Она в твоей крови. Я сделала, что смогла, но магия не излечивает её полностью.
=> tamlen
@ tamlen
marethari: Тамлена Дункан не нашёл. Ты должен{|на} вернуться в руины и узнать, что с ним случилось. Меррил пойдёт с тобой. Она моя Первая, её магия поможет.
* Я пойду. => go
* А Дункан? Где он? => duncan
@ duncan
marethari: Страж ушёл в руины раньше вас. Он говорит, что из-под земли поднимается Мор. Если это правда, всему нашему народу грозит беда.
=> go
@ go
merrill_npc: Я готова, Хранительница. Пойдём, {name}. Руины к востоку по тропе.
! set:de_return quest:de_tamlen:1 join:merrill remove:merrill_npc codex:vallaslin
@ after
marethari: Иди. И будь осторожн{ым|ой}.

== de_merrill
@ start
merrill_npc: Ты очнул{ся|ась}! Я так рада. Хранительница хочет поговорить с тобой.

== de_ashalle
@ start
ashalle: {name}, дитя моё. Я растила тебя с тех пор, как твои родители погибли. Не пугай меня так больше.
* Прости, Ашалле. => end
* Расскажи о моих родителях. => parents once
@ parents
ashalle: Твой отец был охотником, а мать была Хранительницей другого клана, пока не пришла к нам. Их не стало, когда ты была совсем маленькой. Они бы гордились тобой.
=> start

== de_ilen
@ start
=> done ?quest.de_ilen>=9
ilen: А, охотник. Я как раз закончил лук. Лучший за последние годы. Хочешь взглянуть?
* Покажи. => bow
* Не сейчас. => end
@ bow
ilen: Держи. Для лучшего охотника клана. Тамлен хотел его, знаешь ли. Верни его домой, и лук станет вдвое ценнее.
! give:dalish_longbow quest:de_ilen:9
@ done
ilen: Как лук? Бьёт точно?

== de_paivel
@ start
paivel: Сядь, да'лен. Хочешь послушать о днях Арлатана, когда наш народ не знал ни старости, ни смерти?
* Расскажи. => tale
* В другой раз, хахрен. => end
@ tale
paivel: Когда-то эльфы жили вечно. Мы спали веками и просыпались, а мир был прежним. Потом пришли люди из Тевинтера. Они разрушили Арлатан, и мы узнали, что такое смерть.
! codex:arlathan codex:eluvian xp:30

== de_fenarel
@ start
fenarel: Тамлен... Мы росли вместе. Найди его, слышишь? Если понадобится помощь, я пойду с тобой. Но Хранительница велела мне охранять стоянку.

== de_duncan
@ start
duncan: Вы вернулись. Я надеялся, что лихорадка отступит.
merrill: Страж? Это вы принесли {name} в лагерь?
duncan: Я. Порождения тьмы пришли из этих глубин. Зеркало осквернено, в нём скверна. Твой друг прикоснулся к нему и исчез.
* Где Тамлен? => tamlen
* Разбейте зеркало. => smash
@ tamlen
duncan: Не знаю. Мне жаль. Скверна забрала его, как забирает почти всех.
=> smash
@ smash
narr: Дункан бьёт по зеркалу рукоятью меча. Стекло взрывается зелёным светом и осыпается на пол.
duncan: Скверна уже в тебе. Ты умрёшь от неё, если не станешь Серым Стражем. Я говорил с вашей Хранительницей. Она отпускает тебя.
merrill: Отпускает? Но... она не могла...
duncan: Могла. Она хочет, чтобы ты жил{|а}. Пойдём со мной, и я спасу тебе жизнь. Остагар ждёт.
* Я пойду. Ради клана. => go
* У меня есть выбор? => go
@ go
merrill: Я расскажу клану. Прощай, {name}. Дареним, да'лен.
! quest:de_tamlen:9 quest:de_ruins:9 leave:merrill run:de_end
`);

  D.script('de_road_enter', function* (g) {
    if (g.flag('de_started')) return;
    g.set('de_started');
    g.join('tamlen');
    g.set('de_tamlen_joined');
    g.hideNpc('tamlen_npc');
    yield 0.6;
    g.startDialog('de_humans', g.ents.find(e => e.group === 'dr_humans'));
  });
  D.script('de_humans_flee', function* (g) {
    for (const e of g.ents.filter(x => x.group === 'dr_humans')) g.walkNpc(e, 6, 20, 0, 1.4);
    yield 3;
    for (const e of g.ents.filter(x => x.group === 'dr_humans')) { e.gone = true; e.dead = true; if (e.objKey) g.stateFor(g.areaId).dead[e.objKey] = 1; }
    g.giveXp(100);
  });
  D.script('ruins_enter', function* (g) {
    if (g.flag('de_return')) { if (!g.flag('de_ret_seen')) { g.set('de_ret_seen'); g.setQuest('de_tamlen', 2); yield 0.5; g.toast('Здесь пахнет порождениями тьмы.'); } return; }
    if (g.flag('de_ruins_seen')) return;
    g.set('de_ruins_seen');
    g.setQuest('de_ruins', 2);
    yield 0.5;
    g.float(g.roster.tamlen || g.pc, 'Посмотри на эти стены! Это же наш народ строил!', '#fff');
  });
  D.script('de_mirror', function* (g) {
    g.setQuest('de_ruins', 3);
    g.cutscene(true);
    const t = g.roster.tamlen;
    if (t) g.float(t, 'Смотри, оно светится! Я вижу... что-то там, внутри...', '#fff');
    yield 2;
    g.showSlides([
      { img: 'mirror', text: 'Тамлен касается зеркала. Стекло вспыхивает, и по руинам прокатывается волна холода.' },
      { img: 'mirror', text: 'Вы видите в отражении тёмный подземный лабиринт и чувствуете, как что-то пробирается под кожу. Потом наступает темнота.' },
      { img: 'forest', text: 'Два дня лихорадки. Обрывки голосов. Кто-то несёт вас на руках, кто-то говорит на языке шемленов.' }
    ]);
    yield 'slides';
    g.leave('tamlen');
    g.setQuest('de_ruins', 9);
    g.emit('toast', { text: D.TOASTS.tainted });
    g.healParty();
    g.cutscene(false);
    g.goto('dalish_camp', 'wake');
  });
  D.script('camp_enter', function* (g) {
    if (g.flag('de_woke')) return;
    g.set('de_woke');
    yield 0.8;
    g.startDialog('de_keeper', g.npcEnt('marethari'));
  });
  D.script('de_mirror2', g => { g.startDialog('de_duncan', g.npcEnt('duncan')); });
  D.script('de_end', function* (g) {
    g.cutscene(true);
    g.emit('fade', { out: 1, t: 1 });
    yield 1;
    g.showSlides([
      { img: 'forest', text: 'Клан провожает вас молча. Хранительница кладёт руку вам на плечо и шепчет что-то на древнем языке. Ашалле плачет.' },
      { img: 'road_south', text: 'Дункан ведёт вас на юг, к Остагару. Впервые в жизни вы идёте туда, где живут люди, и не собираетесь от них прятаться.' }
    ]);
    yield 'slides';
    g.cutscene(false);
    D.toOstagar(g);
  });
  D.ORIGIN_SETUP.de = g => {
    const c = g.pc;
    if (c.cls === 'warrior') Object.assign(c.equip, { main: 'longsword_iron', off: 'buckler_iron', chest: 'dalish_armor', boots: 'dalish_boots' });
    else { Object.assign(c.equip, { main: 'shortbow_iron', chest: 'dalish_armor', boots: 'dalish_boots' }); c.set2 = { main: 'dagger_iron', off: 'dagger_iron' }; }
    g.give('poultice_lesser', 3);
    g.addGold(200);
    g.events = [];
  };
  if (typeof module !== 'undefined' && module.exports) module.exports = D;
})(globalThis.Dao98 = globalThis.Dao98 || {});
