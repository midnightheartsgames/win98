(function (H) {
  'use strict';
  const scenes1 = `event day 1 -> z1_start
event built special1 -> z1_ring
event visit circle1 -> z1_circle
event defeat cut1 -> z1_cut1
event defeat cut2 -> z1_cut2
event defeat cut3 -> z1_cut3
event flag z1_all -> z1_win

@z1_start
show vedana left
show yarina right
yarina: Топоры в трёх рощах. Ночью рубят, днём складывают. Считают, что лес спит.
vedana: Какие рощи?
yarina: Заповедные. Все три. Межевые камни свалены.
vedana: Тогда сперва поговорим с теми, кто рубит. Потом с теми, кто свалил камни. Это могут быть разные люди.
yarina: Боровой уже точит корни. Он разговаривать не будет.
goal add cut1 "Остановить порубку в Ольховом логу" to cut1
goal add cut2 "Остановить порубку на Сосновой пади" to cut2
goal add cut3 "Остановить порубку у Тихого бора" to cut3
goal add ring "Построить Ведьмино кольцо в городе"
say Перед боем можно поставить заросли на своей половине поля. Ваши существа проходят сквозь них, а враг обходит.
end

@z1_cut1
show yarina right
yarina: Первые ушли. Бросили пилу и обед. Пила хорошая, цеховая.
goal done cut1
set c1
scene z1_check
end

@z1_cut2
show yarina right
yarina: Эти дрались за каждое бревно. Лес им платит плохо, значит, платит кто-то другой.
goal done cut2
set c2
scene z1_check
end

@z1_cut3
show yarina right
yarina: Третья роща чистая. У старшего лесоруба был сундук с бумагами.
goal done cut3
set c3
scene z1_check
end

@z1_ring
show vedana left
vedana: Кольцо выросло. Теперь хозяин леса может шагнуть от него к любому своему кругу.
say Ведьмино кольцо: герой Чащи в городе раз в день переходит к своему кольцу или кругу за половину шагов дня. Откройте город и щёлкните по кольцу.
goal done ring
set r1
goal add circle "Занять ведьмин круг у Кривой топи" to circle1
scene z1_check
end

@z1_circle
show vedana left
vedana: Старый круг. Его не трогали лет двести, а он всё помнит, куда вести.
say Круг ваш. Отсюда можно уйти к кольцу в городе.
goal done circle
set r2
scene z1_check
end

@z1_check
if flag c1
if flag c2
if flag c3
if flag r1
if flag r2
set z1_all
end
end
end
end
end
end

@z1_win
show vedana left
show yarina right
yarina: Вот бумага. С печатью, с колоколом, с подписью. Я такие не читаю.
vedana: Хендрик Мальс. Договор на три рощи, на десять лет вперёд. Его из Звонграда выгнали, а подпись всё ещё рубит.
yarina: Значит, Лига.
vedana: Значит, один человек и те, кто ему поверил. Зови Борового на разговор, пока он сам не пришёл.
win
end
`;

  const scenes2 = `event day 1 -> z2_start
event army sirin 6 -> z2_sirin
event army bereginya 16 -> z2_bereg
event day 8 -> z2_warn
event day 10 -> z2_turn
event defeat v1 -> z2_burn
event defeat v2 -> z2_burn2
event defeat borovoy -> z2_gone

@z2_start
show vedana left
show borovoy right
borovoy: Шестьсот лет я слушаю вашу бумагу. Три рощи стояли под топором. Где была бумага?
vedana: Там же, где и ты: в лесу. Рощи целы, топоры ушли. Дай мне две недели собрать сиринов и берегинь.
borovoy: Зачем тебе птицы?
vedana: Сёла Заречья поверят песне раньше, чем лешему.
borovoy: Десять дней. Потом я сам поговорю с сёлами.
goal add sirin "Собрать 6 сиринов в Гнездовье" to nest
goal add bereg "Собрать 16 берегинь у Святого родника" to spring
give amber 10
give gold 6000
say Боровой пока союзник: его войско стоит у Старого бора. Гнездовье и родник охраняют, и места там немного.
end

@z2_sirin
show vedana left
vedana: Сирины пришли. Поют плохо, зато долго.
goal done sirin
set got_s
scene z2_check
end

@z2_bereg
show vedana left
vedana: Берегини оставили родники и пошли за мной. Это им дорого обойдётся, им и мне.
goal done bereg
set got_b
scene z2_check
end

@z2_check
if flag got_s
if flag got_b
set z2_gathered
end
end
end

@z2_warn
show yarina right
yarina: В бору точат корни. Боровой выйдет через два дня, а до сёл ему идти совсем недолго.
end

@z2_turn
show vedana left
show borovoy right
if flag z2_gathered
borovoy: Собрала птиц и девок у родников. Думала, я не вижу.
vedana: Думала, ты услышишь. Рощи целы, Грамота цела, сёла ни при чём.
borovoy: Сёла рубили. Я иду.
else
borovoy: Десять дней прошло. Где твоя песня?
vedana: Подожди хотя бы до новой луны.
borovoy: Луна теперь ходит как попало. А я нет.
army borovoy leshy 1 werewolf 12
if not flag got_s
goal fail sirin
end
if not flag got_b
goal fail bereg
end
end
team 1 1
patrol borovoy 0
aim player 1 v1 v2
goal add stop "Остановить Борового" to borovoy
goal add keep "Не отдать ему оба села"
say Боровой больше не союзник. Если он дойдёт до обоих сёл, всё зря.
end

@z2_burn
say Первое село горит. Огонь лесной, тушить нечем.
if flag burned
goal fail keep
scene z2_lost
else
set burned
end
end

@z2_burn2
say Второе село горит. Огонь лесной, тушить нечем.
if flag burned
goal fail keep
scene z2_lost
else
set burned
end
end

@z2_lost
show vedana left
vedana: Обе межи перейдены. Теперь у Грамоты нет второй стороны.
lose
end

@z2_gone
show vedana left
show borovoy right
borovoy: Сколько лет я держал этот лес, а ты держала бумагу.
vedana: Бумага держала лес лучше, чем ты думаешь.
show cloak right
cloak: Простите, что вмешиваюсь. Закон, который нельзя защитить, ничего не стоит. У нас для старого хозяина есть работа.
show borovoy right
borovoy: Эти хотя бы не зовут меня на разговор.
show cloak right
vedana: Они зовут тебя на поводок. Просто пока не слышишь.
say Боровой ушёл с белыми плащами. Часть леса ушла за ним.
goal done stop
if not flag burned
goal done keep
keep villages_kept
end
if flag burned
goal done keep
end
keep borovoy_left
win
end
`;

  const scenes3 = `event day 1 -> z3_start
event done stone1 -> z3_stone1
event defeat camp2 -> z3_camp2
event done stone2 -> z3_stone2
event done stone3 -> z3_stone3
event capture stan any -> z3_stan
event flag z3_all -> z3_win

@z3_start
show vedana left
show adelina right
adelina: Ты Ведана. Мне сказали, ты не любишь бумаги с колоколом.
vedana: Не люблю подпись Мальса на моих рощах.
adelina: Я тоже. Его лесорубы наняты на год вперёд, и плату им никто не отменил.
if kept spared_villages
adelina: Шаманка с востока прошла мимо моих сёл и не тронула ни одного. Я решила, что с лесом тоже можно говорить.
else
adelina: После степи я никому не верю на слово. Но лесорубов надо гнать.
end
vedana: Грамоту подтверждают у трёх межевых камней. Первому дань, второму чистую землю, третьему сторожей. Так записано, и так будет.
adelina: А записано, кто выгоняет наёмников?
vedana: Не записано. Поэтому я рада, что ты пришла.
goal add stone1 "Принести первому камню дань: 5 янтаря" to stone1
goal add stone2 "Очистить землю у второго камня" to camp2
goal add stone3 "Оставить у третьего камня сторожей: 10 волколаков" to stone3
goal add stan "Выгнать наёмников из Лесного Стана" to stan
aim player 1 camp1 stan
say Отряд Аделины ваш союзник и идёт на наёмников сам. Межевые камни подтверждаете вы: подойдите и отдайте то, что камень просит.
end

@z3_stone1
show vedana left
vedana: Первый камень стоит. Янтарь на месте, и никто его не возьмёт. Это не обычай, просто сюда боятся ходить.
goal done stone1
set s1
scene z3_check
end

@z3_camp2
say Лагерь у второго камня разбит. Осталось показать камню чистую землю.
goal point stone2 stone2
end

@z3_stone2
show vedana left
vedana: Второй камень стоит. Земля чистая, только щепки.
goal done stone2
set s2
scene z3_check
end

@z3_stone3
show yarina right
yarina: Волколаки у третьего камня. Сказала им, что это ненадолго.
show vedana left
vedana: А это надолго?
yarina: Они не считают.
goal done stone3
set s3
scene z3_check
end

@z3_stan
show adelina right
adelina: Лесной Стан пуст. Наёмники сказали, что их контракт кончается с их жизнью, и решили не проверять.
goal done stan
set s4
scene z3_check
end

@z3_check
if flag s1
if flag s2
if flag s3
if flag s4
set z3_all
end
end
end
end
end

@z3_win
show vedana left
show adelina right
adelina: Грамота подтверждена. Я подпишу за дельту, если дадут перо.
show guildman right
guildman: Цехи Звонграда рады миру, почтенные. Мир стоит денег: договоры не исполнены, лес не срублен, задаток выдан.
vedana: Договоры Мальса.
guildman: Договоры Звонграда, подписанные Мальсом. Для суда разница большая, для счёта никакой.
show adelina right
adelina: Я их не звала. Но это мой город, и остановить их я не могу.
choice
- Заплатить, чтобы рощи и сёла остались в покое. -> z3_pay
- Не платить. Грамота старше их договоров. -> z3_refuse
end
end

@z3_pay
take gold 4000
show guildman right
guildman: Приятно иметь дело с разумным лесом.
show adelina right
adelina: Запомни эту сумму. Я потом спрошу с них.
keep zap_paid
win
end

@z3_refuse
show guildman right
guildman: Тогда мы наймём других. Лес большой, а денег у нас больше.
show adelina right
adelina: Они не шутят. Держи лес, я подержу город.
keep zap_refused
win
end
`;

  const scenes4 = `event day 1 -> z4_start
event defeat post1 -> z4_post1
event defeat post2 -> z4_post2
event defeat post3 -> z4_post3
event flag z4_all -> z4_free

@z4_start
show vedana left
show yarina right
yarina: Озеро стоит. Не замёрзло, просто стоит, как зеркало. Рыба лежит на дне и смотрит вверх.
vedana: Три столба у воды. Кто поставил?
yarina: Те, кто ходит в белом. Боровой показал им дорогу.
vedana: Там спит Змей. Если вода не движется, он не проснётся. Если не проснётся, некому будет спросить, зачем им лес.
goal add post1 "Разбить зеркальный столб у северной протоки" to post1
goal add post2 "Разбить зеркальный столб у Кривого брода" to post2
goal add post3 "Разбить зеркальный столб на острове" to shore post3
say Один столб стоит на острове: туда идёт паром. Лес и болото вас не задерживают, вода задерживает всех.
end

@z4_post1
show vedana left
vedana: Рассыпался. Внутри пусто, как в разбитом колоколе.
say Вода у северной протоки пошла.
goal done post1
set p1
scene z4_check
end

@z4_post2
show yarina right
yarina: У брода стало слышно лягушек. Не думала, что обрадуюсь.
goal done post2
set p2
scene z4_check
end

@z4_post3
show vedana left
vedana: Этот рассыпался. Посмотрим, кто проснётся, когда упадут все.
goal done post3
set p3
goal point post1 isle post1
goal point post2 isle post2
scene z4_check
end

@z4_check
if flag p1
if flag p2
if flag p3
set z4_all
end
end
end
end

@z4_free
show vedana left
show zmey right
zmey: Кто стучал?
vedana: Ведана, хранит Грамоту. Твоё озеро было заперто.
zmey: Я заметил. Двести лет лежу и думаю, а тут ещё и пошевелиться нельзя. Обидно.
vedana: Зачем им Змеево озеро?
zmey: Озеро им незачем. Они меня заперли, чтобы я не видел, куда идут. Но я слышу корни. Им нужна Живая ветвь.
vedana: Ветвь держит лес с самой Грамоты. Без неё он только деревья.
zmey: Вот и я о том же. Веди, ведунья. Я голоден и очень хочу с кем-нибудь поговорить.
give unit zmey 1
keep snake_free
win
end
`;

  const scenes5 = `event day 1 -> z5_start
event day 6 -> z5_wave1
event day 13 -> z5_wave2
event day 20 -> z5_wave3
event day 22 -> z5_held
event defeat borovoy -> z5_beaten
event flag z5_end -> z5_final

@z5_start
show vedana left
show yarina right
yarina: Боровой идёт. С ним половина бора и люди в белом. Хочет к берёзе.
vedana: Сколько нам держать?
yarina: До новой луны ещё три недели. После неё лес проснётся весь, тогда и он не сунется.
goal add hold "Удержать Священную берёзу 21 день или разбить Борового" stay grove
if kept snake_free
show zmey right
zmey: Я тут. Пока что.
give unit zmey 1
end
if kept zap_paid
show adelina right
adelina: Цехи получили своё, а я получила от них двадцать арбалетов. Распишись.
give unit crossbow 20
end
if kept zap_refused
show yarina right
yarina: Цехи наняли ещё топоров. Они идут с первой волной.
end
if kept villages_kept
say Сёла Заречья прислали зерно и золото: они помнят, кто их не отдал.
give gold 4000
end
aim player 1 grove
say Берёза стоит в вашем городе. Если город падёт, всё кончено. Волны придут с востока.
end

@z5_wave1
spawn hero velimir 1 104 40 0 wave1
army wave1 werewolf 30 kikimora 8 sirin 2
if kept zap_refused
army wave1 mercenaries 40
end
if not diff easy
army wave1 werewolf 20 kikimora 4
end
if diff hard
army wave1 werewolf 20 kikimora 4 sirin 2
end
if diff impossible
army wave1 werewolf 40 kikimora 8 sirin 4
end
say С востока идёт первая волна.
end

@z5_wave2
spawn hero gorazd 1 104 60 0 wave2
army wave2 werewolf 40 kikimora 14 sirin 4 leshy 2
if not diff easy
army wave2 kikimora 6 sirin 2 leshy 1
end
if diff hard
army wave2 kikimora 6 sirin 2 leshy 1
end
if diff impossible
army wave2 kikimora 12 sirin 4 leshy 2
end
say С востока идёт вторая волна. В ней лешие.
end

@z5_wave3
spawn hero milava 1 104 80 0 wave3
army wave3 kikimora 20 sirin 8 leshy 4
if not diff easy
army wave3 kikimora 8 sirin 4 leshy 2
end
if diff hard
army wave3 kikimora 8 sirin 4 leshy 2
end
if diff impossible
army wave3 kikimora 16 sirin 8 leshy 4
end
show yarina right
yarina: Третья. Большая. Это те, кто ещё вчера были нашими.
end

@z5_held
show yarina right
yarina: Новая луна. Лес встал, чувствуешь?
goal done hold
set z5_end
end

@z5_beaten
show borovoy right
borovoy: Я помню этот лес без людей. Ты не помнишь.
show vedana left
vedana: Я помню, что его можно выбрать ещё раз. Это и есть Грамота, старик.
goal done hold
set z5_end
end

@z5_final
show vedana left
show cloak right
cloak: Хорошо держалась, ведунья. Посмотри на север.
vedana: Вижу. Вся роща в смоле.
cloak: Один факел. Мы не жжём зря. Нам нужна только ветка.
vedana: Живая ветвь держит лес с самой Грамоты.
cloak: Тогда тебе решать, что ему держать дальше.
if army zmey
show zmey right
zmey: Скажи слово, и я съем этого человека. Потом придут другие, но будет приятно.
keep snake_alive
show cloak right
end
vedana: Закон, который сжигает рощу ради своей бумаги, мне не нужен. Возьми. И запомни: я приду за ней.
cloak: Все так говорят.
vedana: Не все держат слово шестьсот лет. Это записано.
keep branch_given
win
end
`;

  H.Campaign.add({
    id: 'zapoved',
    number: 3,
    faction: 'thicket',
    name: 'Заповедь',
    theme: 'camp_zapoved',
    hero: 'vedana',
    about: 'Лето 999 года. Лесорубы гильдий подходят к заповедным рощам, а старый леший Боровой зовёт лес на войну с людьми. Ведунья Ведана хранит Грамоту и хочет удержать лес от бойни.',
    opening: [
      'Шестьсот лет назад сёла дельты и духи леса поделили землю и записали это на бересте. С тех пор в заповедных рощах не рубят. Эту бумагу зовут Грамотой.',
      'Этим летом в рощах застучали топоры. Договор на порубку подписан как положено, с печатью и колоколом.',
      'Старый леший Боровой говорит, что бумагу пора сжечь вместе с теми, кто её подписал. Его слушают. Он старше Грамоты и помнит лес без людей.',
      'Ведана хранит Грамоту. У неё нет войска, зато есть хороший почерк и привычка договариваться с теми, кто её не любит.'
    ],
    ending: [
      'Живая ветвь уехала на белых повозках к Чаше. Лес остался стоять, но ночью стал тише, чем положено.',
      'Боровой ушёл с теми, кто обещал ему лес без людей. Он пока не спрашивал, куда в таком лесу денутся лешие.',
      'Грамота подтверждена у трёх камней. Подпись дельты стоит рядом с подписью леса, и обе пока держатся.',
      'Ведана дописала в Грамоту одну строку своим хорошим почерком: «Ветвь отдана. Ветвь будет возвращена». Закон живёт, пока его выбирают заново.'
    ],
    missions: [
      {
        id: 'zap1',
        name: 'Аукнется',
        levelCap: 5,
        about: 'Малая карта, свой город.',
        brief: 'В трёх заповедных рощах стучат топоры, и межевые камни уже свалены. Ведана хочет остановить порубку раньше, чем Боровой поднимет лес.\n\nПрогоните лесорубов из трёх рощ. Постройте в городе Ведьмино кольцо: оно ведёт к своим кольцам и кругам. Заросли перед боем ставьте там, где враг пойдёт, ваши существа проходят сквозь них.',
        goals: ['Остановить порубку в трёх рощах', 'Построить Ведьмино кольцо', 'Занять ведьмин круг у Кривой топи'],
        lose: 'Ведана пала или потерян город',
        bonuses: [{ kind: 'unit', unit: 'werewolf', count: 8 }, { kind: 'res', res: { gold: 1500, amber: 2 } }, { kind: 'art', id: 'saltcharm' }],
        scenes: scenes1
      },
      {
        id: 'zap2',
        name: 'Леший не спит',
        levelCap: 8,
        about: 'Средняя карта, союзник, который станет врагом.',
        brief: 'Боровой дал Ведане десять дней. За это время надо собрать сиринов и берегинь: сёлам нужна песня, а не лешие.\n\nСоберите 6 сиринов и 16 берегинь. На десятый день Боровой выйдет на сёла Заречья. Остановите его и не отдайте ему оба села: одно потерять можно, за два лес вам не простит.',
        goals: ['Собрать сиринов и берегинь', 'Остановить Борового на десятый день', 'Не отдать ему оба села'],
        lose: 'Ведана пала или сгорели оба села',
        bonuses: [{ kind: 'res', res: { gold: 3000, amber: 4 } }, { kind: 'unit', unit: 'bereginya', count: 8 }, { kind: 'art', id: 'quilted' }],
        scenes: scenes2
      },
      {
        id: 'zap3',
        name: 'Грамота',
        levelCap: 11,
        about: 'Средняя карта, союзник из другого народа.',
        brief: 'Лесорубы Мальса наняты на год вперёд и ушли только за соседний холм. Капитан Аделина Корвен привела отряд: у неё к этой подписи свой счёт.\n\nПодтвердите Грамоту у трёх межевых камней, каждый просит своё. Вместе с Аделиной выгоните наёмников из Лесного Стана. Когда всё кончится, кому-то придётся платить.',
        goals: ['Подтвердить Грамоту у трёх камней', 'Выгнать наёмников из Лесного Стана'],
        lose: 'Ведана пала или потерян город',
        bonuses: [{ kind: 'unit', unit: 'kikimora', count: 6 }, { kind: 'res', res: { gold: 3000, amber: 6 } }, { kind: 'art', id: 'saltring' }],
        scenes: scenes3
      },
      {
        id: 'zap4',
        name: 'Змеево озеро',
        levelCap: 14,
        about: 'Средняя карта, вода и лес.',
        brief: 'Белые плащи поставили у Змеева озера три зеркальных столба, и вода перестала двигаться. Под этой водой двести лет спит Змей, единственный, кто видел, что им нужно в лесу.\n\nРазбейте все три столба. Один стоит на острове, туда ходит паром. Столбы стерегут не люди, а то, что столбы показывают.',
        goals: ['Разбить три зеркальных столба', 'Разбудить Змея'],
        lose: 'Ведана пала',
        bonuses: [{ kind: 'unit', unit: 'sirin', count: 4 }, { kind: 'res', res: { gold: 5000 } }, { kind: 'art', id: 'couriers' }],
        scenes: scenes4
      },
      {
        id: 'zap5',
        name: 'Живая ветвь',
        levelCap: 18,
        about: 'Большая карта, оборона.',
        brief: 'Боровой идёт к Священной берёзе, с ним половина бора и люди в белом. До новой луны три недели: потом лес проснётся весь, и подойти к берёзе будет нельзя.\n\nУдержите город с берёзой 21 день или разбейте Борового. Волны идут с востока, и каждая крупнее прежней.',
        goals: ['Удержать Священную берёзу 21 день или разбить Борового'],
        lose: 'Ведана пала или потерян город',
        bonuses: [{ kind: 'unit', unit: 'leshy', count: 4 }, { kind: 'res', res: { gold: 8000, amber: 6 } }, { kind: 'art', id: 'khanaxe' }],
        scenes: scenes5
      }
    ]
  });
})(globalThis.Heroes98 = globalThis.Heroes98 || {});
