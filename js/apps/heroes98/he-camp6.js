(function (H) {
  'use strict';
  const scenes1 = `event day 1 -> v1_start
event done q1 -> v1_q1
event done q2 -> v1_q2
event done q3 -> v1_q3
event flag v1_all -> v1_plan
event visit archive repeat -> v1_archive

@v1_start
show valeria left
show marcella right
marcella: Наследница. Регент велел передать, что до Схождения вы не покидаете Белого двора.
valeria: Регент велит многое. Скажи, Марцелла, кому ты давала клятву?
marcella: Престолу.
valeria: Престол пуст. Значит, клятва ждёт того, кто на него сядет.
marcella: Так учат в Белом храме.
valeria: Тогда учись дальше. Мне нужны люди, которые служат трону, а не тому, кто стоит рядом с ним.
goal add q1 "Марцелла: прогнать мародёров у Старой колоннады" to loot q1
goal add q2 "Деций: Лунное серебро для упряжи оленей" to q2
goal add q3 "Октавия: привести легион к знамени" to q3
say По лунным дорогам героям Престола идти быстрее, чем по любой другой дороге.
say В начале боя герой Престола ставит рядом со своим отрядом его отражение. Оно бьёт в полную силу и исчезает от первого удара или через три раунда.
say Белая руина под вашим флагом каждую неделю даёт Престолу Лунное серебро.
end

@v1_q1
show marcella right
marcella: Мародёры ушли из колоннады. Рыцари видели, кто их прогнал. Видели и то, что регент не прислал никого.
valeria: Пойдёшь со мной?
marcella: Клятва ждёт того, кто сядет на трон. Пока я пойду за той, кто к нему ближе всех.
recall marcella 23 15 0 marcella
goal done q1
set k1
scene v1_check
end

@v1_q2
show decius right
decius: Серебро в упряжи. Олени ходят по лунным дорогам только в серебре, иначе им кажется, что под ногами пустота.
valeria: А тебе что кажется, Деций?
decius: Мне кажется, что регент хочет поднять луну, а оленям этого не объяснили. Берите мой двор, наследница.
give unit deerrider 3
goal done q2
set k2
scene v1_check
end

@v1_q3
show octavia right
octavia: Легион встал под знамя. Мёртвые не спорят, но и врать не умеют. Они говорят, что служили царям, а не регентам.
valeria: А ты?
octavia: Я ношу их знамя. Куда пойдёт знамя, туда и я.
give unit standardbearer 15
goal done q3
set k3
scene v1_check
end

@v1_check
if flag k1
if flag k2
if flag k3
set v1_all
end
end
end
end

@v1_plan
show marcella right
marcella: Рыцари с вами. Бумаги регента лежат в Зеркальном архиве. Стражам там всё равно, кто наследник, а кто нет.
valeria: Тогда пусть узнают меня в лицо.
goal add archive "Узнать план регента в Зеркальном архиве" to archive
end

@v1_archive
if flag read
else
if flag v1_all
show valeria left
say В архиве лежат расчёты Ордена: подъём Восьмой луны в ночь Схождения, тяга лунного сердца, Цепи луны из Горнил.
valeria: Здесь написано, что поднятая луна выплеснет Чашу. Вода дойдёт до Звонграда за одну ночь.
valeria: А цепь держит не луну. Она держит ту, кто стоит на луне. Царица будет делать то, что скажет держащий цепь.
show severin right
severin: Ты всегда читала быстрее, чем следовало.
valeria: Ты знал, что я приду сюда.
severin: Я знал, что ты сомневаешься. Сомнение хорошо в наследнице, пока оно не становится делом.
valeria: Оно стало.
severin: Тогда иди. Белые руины большие, а лунные дороги помнят, кто их хозяин.
set read
goal done archive
win
else
show valeria left
valeria: Без рыцарей двора стражи архива меня не пропустят. Сначала люди, потом бумаги.
end
end
end
`;

  const scenes2 = `event day 1 -> v2_start
event day 2 -> v2_hunt
event day 4 -> v2_third
event day 8 -> v2_half
event visit knights -> v2_knights
event visit edge -> v2_edge

@v2_start
show valeria left
show octavia right
octavia: Охотники регента вышли из Верхнего Престола. Кассиан Мор и Лукреция Вейн, у обоих олени.
valeria: До края руин две недели пути. По лунным дорогам меньше.
octavia: По лунным дорогам ездят и они.
valeria: Значит, ехать надо так, чтобы не встречаться. Где Марцелла?
octavia: Марцеллу с рыцарями заперли в Старой конюшне. Регент сказал, что клятвы надо проверять.
goal add edge "Дойти до края Белых руин" to edge
goal add knights "Вывести рыцарей Марцеллы из Старой конюшни" to knights
goal lose day 15
say Охотники выйдут за Валерией завтра. Перевал в середине держат рыцари регента, пройти можно севернее или южнее.
end

@v2_hunt
if not flag out
show octavia right
octavia: Охотники вышли. Олени у них быстрее наших легионеров, на дороге не обогнать.
spawn hero cassian 1 78 33 0 hunter1
spawn hero lucretia 1 78 47 0 hunter2
army hunter1 deerrider 5 silverrider 1
army hunter2 deerrider 6
if not diff easy
army hunter1 deerrider 3
army hunter2 deerrider 3
end
aim player 1 valeria
end
end

@v2_third
if not flag out
show octavia right
octavia: У края руин стоит Сабина Квинт со своими людьми. Регент перекрывает выход.
if not diff easy
army hunter3 deerrider 2 mirrorguard 4
end
end
end

@v2_half
if not flag out
show octavia right
octavia: Половина срока прошла. Охотники уже не прячутся, они знают, куда мы идём.
end
end

@v2_knights
show marcella right
marcella: Нас заперли за то, что мы помогли вам. Лучшей проверки клятвы я не видела.
valeria: Сколько вас?
marcella: Сколько осталось. Хватит, чтобы охотники пожалели.
give unit throneknight 2
goal done knights
set kn
keep knights_out
end

@v2_edge
show valeria left
show adelina right
adelina: Ты Валерия? Мне писали, что наследница Престола бежит к нам. Я думала, это ловушка.
valeria: А теперь?
adelina: Теперь думаю, что ловушка у тебя за спиной. Вот письма Мальса. Он продавал Ордену карты курганов, дорог и рощ. Здесь всё, что Орден взял за этот год.
if kept letters_half
adelina: Половину писем сожгли, когда степь брала форт. Но и того, что осталось, хватит.
end
valeria: Венец степи, ветвь Чащи, сердце луны, цепи Горнил. Он собрал всё.
adelina: Мы за ним весь год бегали поодиночке. Может, пора вместе.
if flag kn
else
goal fail knights
end
set out
goal done edge
win
end
`;

  const scenes3 = `event day 1 -> v3_start
event day 12 -> v3_raid
event done adel -> v3_adel
event done ais -> v3_ais
event done ved -> v3_ved
event done nae -> v3_nae
event done irg -> v3_irg
event flag v3_all -> v3_win

@v3_start
show valeria left
show adelina right
adelina: Пять краёв, пять человек, которые весь год воевали с Орденом. Каждый по-своему и каждый один.
valeria: И каждый захочет доказательств, что я не регент в другом плаще.
adelina: Захочет. Я бы захотела. Начни с того, о чём они просят.
goal add adel "Лига: Аделина просит разбить белых плащей у Мельничного Брода" to cloaks adel
goal add ais "Курганы: Айсулу просит соль для тризны" to ais
goal add ved "Чаща: Ведана просит разбить зеркальный столб" to pillar ved
goal add nae "Прилив: Наэра просит прогнать черпальню с берега" to dredge nae
goal add irg "Горнила: Ирга просит руду и серу" to irg
say Каждый, кому вы поможете, придёт к Валерии героем, с войском и всем, что заслужил за свой год.
if kept knights_out
show marcella right
marcella: Рыцари из Старой конюшни здесь. Пойдут туда, куда вы скажете.
give unit throneknight 2
end
if kept aisulu_led
show aisulu right
aisulu: Я пришла раньше. Аделина когда-то довела меня до кургана, теперь моя очередь вести.
recall aisulu 53 58 0 aisulu
army aisulu shade 40 horsebow 12
if kept kaidar_host
army aisulu stonewoman 8 bonebull 2
end
goal done ais
set j2
end
end

@v3_raid
if not flag v3_all
show lucretia right
lucretia: Наследница собирает чужих. Застава напомнит ей, кто здесь свой.
spawn hero lucretia 1 52 20 0 raid
army raid legionary 30 moonarcher 10
if not diff easy
army raid mirrorguard 8 moonmaiden 4
end
aim player 1 home
end
end

@v3_adel
show adelina right
adelina: Белые плащи разбиты. Среди пленных Мальс, бургомистр Звонграда.
show malse right
malse: Меня никто не заставлял. Я просто плохо считал: Орден платил больше, чем стоили карты.
show adelina right
adelina: Цеха Звонграда дадут ополчение. И я пойду с ним.
recall adelina 57 101 0 adelina
army adelina militia 40 crossbow 16
if kept spared_villages
army adelina pikeman 20
end
goal done adel
set j1
scene v3_check
end

@v3_ais
if flag j2
show aisulu right
aisulu: Соль на тризну принесена. Предки довольны, хотя я и так уже здесь.
else
show aisulu right
aisulu: Соль на тризну принесена. Предки слышат, что о них помнят, даже если помнит чужая наследница.
if kept kaidar_host
aisulu: Рать Кайдар-хана идёт со мной. Хан отдал её, чтобы я спросила с Ордена за его венец.
end
recall aisulu 99 59 0 aisulu
army aisulu shade 40 horsebow 12
if kept kaidar_host
army aisulu stonewoman 8 bonebull 2
end
goal done ais
set j2
end
scene v3_check
end

@v3_ved
show vedana right
vedana: Столб разбит. Лес слышит место, где он стоял, как слышит пень, где стояло дерево.
if kept snake_alive
vedana: Змей идёт с нами. Говорит, ни разу не летал так далеко от озера, и это хороший повод.
end
recall vedana 12 59 0 vedana
army vedana werewolf 20 bereginya 10
if kept snake_alive
army vedana zmey 1
end
goal done ved
set j3
scene v3_check
end

@v3_nae
show naera right
naera: Черпальня ушла. Вода снова поёт, хоть и тихо.
if kept merra_spared
show merra right
merra: Я тоже здесь. Я отдала регенту сердце, теперь хочу видеть, что он с ним сделает.
show naera right
naera: Она пойдёт со мной. Сестра остаётся сестрой.
end
recall naera 20 19 0 naera
army naera shellman 40 seawitch 8
if kept merra_spared
army naera seawitch 6
end
goal done nae
set j4
scene v3_check
end

@v3_irg
show irga right
irga: Руда и сера. Хватит на один горн. Ты знаешь, что я сделала со своей половиной цепи?
valeria: Знаю. Ты поставила шов, который лопнет, если цепью держать луну против воли.
irga: Тогда ты знаешь, зачем я иду.
recall irga 94 21 0 irga
army irga apprentice 40 salamander 10
if kept guilds_sworn
army irga caster 8
end
goal done irg
set j5
scene v3_check
end

@v3_check
if flag j1
if flag j2
if flag j3
if flag j4
if flag j5
set v3_all
end
end
end
end
end
end

@v3_win
show valeria left
show adelina right
adelina: Пять краёв с тобой. Не думала, что увижу это при жизни.
show severin right
severin: Красиво. Ты собрала всех, кого Орден обидел за год. Только год кончается.
valeria: Схождение в первую ночь тысячного года. Мы успеем.
severin: Луне не нужно ждать Схождения, если у неё есть сердце и цепь. Я начинаю подъём сейчас. До ночи Схождения двадцать восемь дней.
win
end
`;

  const scenes4 = `event day 1 -> v4_start
event day 7 -> v4_host
event capture r1 -> v4_r1
event capture r2 -> v4_r2
event capture r3 -> v4_r3
event flag v4_all -> v4_win

@v4_start
show valeria left
show aisulu right
aisulu: Лунные дороги сходятся к Верхнему Престолу. По ним регент гонит войско.
show vedana right
vedana: На каждой дороге руина, на каждой руине огонь Ордена. Возьмём руины, и дороги станут просто камнем.
valeria: Руины помнят своего хозяина. Посмотрим, кого они вспомнят.
goal add r1 "Взять северную руину и перерезать дорогу" to r1
goal add r2 "Взять срединную руину и перерезать дорогу" to r2
goal add r3 "Взять южную руину и перерезать дорогу" to r3
recall aisulu 8 56 0 aisulu
army aisulu shade 40 horsebow 12 stonewoman 6
if kept kaidar_host
army aisulu bonebull 3 stonekhan 1
end
recall vedana 8 58 0 vedana
army vedana werewolf 30 bereginya 10 kikimora 6
if kept snake_alive
army vedana zmey 1
end
say Взятая руина режет лунную дорогу возле себя. Войску регента придётся идти по камню.
end

@v4_host
show cornelius right
cornelius: Наследница. Я учил тебя в Белом храме читать молитвы луне. Теперь веду войско против тебя. Луна этого не просила.
valeria: Луна вообще ничего не просила, Корнелий. Просил регент.
spawn hero cornelius 1 100 57 0 host
army host legionary 40 moonarcher 16 mirrorguard 10 throneknight 2
if not diff easy
army host moonmaiden 6 deerrider 3
end
if diff impossible
army host throneknight 2 shard 1
end
aim player 1 home
end

@v4_r1
show aisulu right
aisulu: Под алтарём руины лежит Солевой венец. Орден держал его здесь, чтобы снять в ночь Схождения.
aisulu: Кайдар-хан ждал сто тридцать лет. Подождёт и до степи. Венец едет домой.
road 0 44 19 26 6
keep crown_back
goal done r1
set c1
scene v4_check
end

@v4_r2
show vedana right
vedana: Живая ветвь здесь, в серебряной чаше. Её поливали лунной водой, чтобы не засохла до Схождения.
vedana: Я клялась вернуть её. Клятвы в Чаще держат дольше, чем в городах.
road 0 44 54 26 5
keep branch_back
goal done r2
set c2
scene v4_check
end

@v4_r3
show valeria left
valeria: Южная дорога перерезана. Теперь регенту ходить пешком, как всем.
road 0 44 87 26 6
goal done r3
set c3
scene v4_check
end

@v4_check
if flag c1
if flag c2
if flag c3
set v4_all
end
end
end
end

@v4_win
show valeria left
show aisulu right
aisulu: Венец у меня. Ветвь у Веданы. У регента остались лунное сердце и половина цепи.
valeria: Сердце и цепь он понесёт в середину Чаши. Туда и пойдём.
win
end
`;

  const scenes5 = `event day 1 -> v5_start
event day 14 -> v5_half
event day 24 -> v5_late
event visit song -> v5_song
event capture alt1 -> v5_alt1
event capture alt2 -> v5_alt2
event flag v5_open -> v5_gate
event defeat regent -> v5_regent

@v5_start
show valeria left
show naera right
naera: Луна уже дышит. Я слышу её из любой воды. Мне нужен храм первой колыбельной, он внизу, под Срединой Чаши.
show aisulu right
aisulu: На мысах два алтаря Ордена. Пока они горят, луна поднимается сама.
show vedana right
vedana: Мы с Айсулу погасим их. А ты, наследница, иди к регенту, когда откроется Средина.
valeria: Средина откроется, только если луна заснёт. Двадцать восемь ночей. Начинаем.
goal add song "Довести Наэру к храму первой колыбельной" to down song
goal add alt1 "Погасить северный алтарь Ордена" to alt1
goal add alt2 "Погасить южный алтарь Ордена" to alt2
goal lose day 29
recall adelina 8 66 0 adelina
recall aisulu 8 72 0 aisulu
recall vedana 10 72 0 vedana
recall naera 10 66 0 naera
recall irga 8 74 0 irga
army adelina militia 60 crossbow 20 plated 4
army aisulu shade 60 horsebow 20 stonewoman 8
army vedana werewolf 30 bereginya 12 kikimora 8
army naera shellman 60 harpooner 20 seawitch 8
army irga apprentice 60 salamander 16 caster 8
if kept kaidar_host
army aisulu bonebull 3 stonekhan 1
end
if kept snake_alive
army vedana zmey 1
end
if kept merra_spared
army naera seawitch 8 rayrider 2
end
if kept guilds_sworn
army irga caster 6 slaggiant 1
end
if kept spared_villages
army adelina pikeman 30
end
if not diff easy
army regent throneknight 2 shard 1
army cassian mirrorguard 10
army lucretia mirrorguard 10
end
if diff impossible
army regent throneknight 3 shard 1
end
say Средину Чаши держит стража Снов. Она уйдёт, когда Наэра споёт, а оба алтаря погаснут.
say Спуск к храму стоит на островке у дамбы, по пути к Средине.
end

@v5_half
if not flag v5_open
show valeria left
valeria: Половина срока. На небе семь лун, а восьмой свет над водой стал ярче.
end
end

@v5_late
if not flag v5_open
show naera right
naera: Пять ночей. Луна уже не спит, она ворочается.
end
end

@v5_song
if beaten naera
show valeria left
valeria: Наэры нет с нами. Раковина у меня. Колыбельную споёт тот, кто её помнит.
say Валерия поёт колыбельную Прилива. Слова на чужом языке, но луна узнаёт мелодию.
else
move naera 74 72 1
show naera left
naera: Спи. Ты упала тысячу лет назад и до сих пор думаешь, что падаешь. Спи, мы держим.
say Наэра поёт. Вода в храме перестаёт дрожать.
end
goal done song
set s1
scene v5_check
end

@v5_alt1
show aisulu right
aisulu: Северный алтарь погас. Огонь Ордена горел на соли из моей степи. Теперь соль просто соль.
goal done alt1
set s2
scene v5_check
end

@v5_alt2
show vedana right
vedana: Южный алтарь погас. Под ним жгли мёртвые корни вместо дров. Больше не будут.
goal done alt2
set s3
scene v5_check
end

@v5_check
if flag s1
if flag s2
if flag s3
set v5_open
end
end
end
end

@v5_gate
gate open ward
show naera right
naera: Луна спит, но некрепко. Стража Снов ушла с Средины. Регент там один.
goal add regent "Разбить регента в середине Чаши" to regent
end

@v5_regent
if not flag v5_open
goal done song
goal done alt1
goal done alt2
end
show valeria left
show severin right
severin: Ты разбила войско, но не цепь. Половины цепи хватит, чтобы держать луну одну ночь. А одной ночи хватит, чтобы её поднять.
if kept link_flawed
show irga right
irga: Держи, регент. Тяни. Только помни, что моя половина откована с изъяном.
say Цепь натягивается и звенит. Звено, которое ковала Ирга, лопается, и вся цепь уходит в воду.
else
show irga right
irga: Цепь держится на одном звене. По нему я и бью.
say Ирга бьёт молотом по звену, и цепь уходит в воду.
end
show naera right
naera: Слышишь? Она засыпает. Она больше не падает.
show severin right
severin: Сорок лет я учил руины помнить. А они помнят только тебя.
valeria: Они помнят царей, Северин. Цари ушли под воду. Пусть там и спят.
choice
- Сесть на Белый престол. Руинам нужен хозяин, а не царица луны. -> v5_take
- Оставить трон пустым. Белые руины будут помнить, а не править. -> v5_leave
end
end

@v5_take
show valeria left
valeria: Я сяду на этот трон. Без луны над головой и без цепи. Пусть Престол будет просто городом на утёсе.
keep throne_taken
goal done regent
win
end

@v5_leave
show valeria left
valeria: Трон останется пустым. Пусть рыцари служат клятве, а не тому, кто на нём сидит. Я пойду смотреть, как просыпается Венец.
keep throne_left
goal done regent
win
end
`;

  const epilogue = f => [
    {
      faction: 'league', pic: 'picture/epilogue-league', title: 'Дельта Семи Рек',
      text: 'Утром в Звонграде звонили все колокола сразу, и никто не помнил, кто начал первым. Аделина Корвен вернулась в стражу.' + (f.spared_villages ? ' Сёла дельты целы, и в каждом в этот день пекли хлеб на всех.' : ' Сёла дельты отстраивались до лета, и Лига платила за каждое.') + (f.zap_paid ? ' Цеха получили свою плату за мир с Чащей и впервые не просили больше.' : f.zap_refused ? ' Цеха так и не получили платы за мир с Чащей и до сих пор считают убытки.' : '')
    },
    {
      faction: 'barrows', pic: 'picture/epilogue-barrows', title: 'Степь Ак-Туз',
      text: (f.crown_back ? 'Солевой венец вернулся в курган Кайдар-хана. Хан лёг и больше не вставал.' : 'Солевой венец так и не нашли. Кайдар-хан ворочается в кургане, но пока не встаёт.') + (f.kaidar_host ? ' Его рать ушла в степь вместе с ним.' : '') + ' Айсулу стала старшей шаманкой рода' + (f.promised_guilty ? ', и роды получили виновных, как она обещала.' : f.promised_time ? ', и роды дали ей время, как она просила.' : '.')
    },
    {
      faction: 'thicket', pic: 'picture/epilogue-thicket', title: 'Заповедная Чаща',
      text: (f.branch_back ? 'Живая ветвь вернулась к Священной берёзе и за одну ночь пустила корни.' : 'Живая ветвь сгорела в Белых руинах, и лес растил новую сто лет.') + (f.snake_alive ? ' Змей вернулся на своё озеро и рассказывает рыбам, как летал над Чашей.' : '') + ' Ведана снова хранит Грамоту' + (f.villages_kept ? ' и ходит в сёла на свадьбы.' : ' и редко выходит из леса.')
    },
    {
      faction: 'tide', pic: 'picture/epilogue-tide', title: 'Море Чаша',
      text: 'Восьмая луна спит под Чашей. Наэра поёт ей раз в год, а не каждую ночь, и у неё наконец есть выходной.' + (f.merra_spared ? ' Мерра вернулась на острова и учит младших петь, хотя сама поёт фальшиво.' : ' О Мерре на островах больше не говорят.') + (f.pearl_refused ? ' Перламутровые острова больше никому не платят дань.' : '')
    },
    {
      faction: 'forge', pic: 'picture/epilogue-forge', title: 'Пепельные Горнила',
      text: 'Над Старым Горном снова дым. Ирга отказалась от места в совете цехов и вернулась к наковальне.' + (f.guilds_sworn ? ' Четыре цеха до сих пор приходят к ней за советом раньше, чем к совету.' : '') + (f.judges_freed ? ' Отпущенные судьи первыми стёрли с наковален её клеймо изгнанницы.' : '')
    },
    {
      faction: 'throne', pic: 'picture/epilogue-throne', title: 'Белые руины',
      text: (f.throne_taken ? 'Валерия села на Белый престол без луны над головой. Белые руины стали городом на утёсе, а не столицей мёртвых царей.' : 'Белый престол стоит пустым. Рыцари по-прежнему служат клятве, а Валерия ходит по Венцу и смотрит, как он просыпается.') + ' Северина Ладара больше не видели. Говорят, он ушёл под воду искать царей.'
    }
  ];

  H.Campaign.add({
    id: 'tysyacha',
    number: 6,
    faction: 'throne',
    name: 'Тысячелетие',
    theme: 'camp_tysyacha',
    hero: 'valeria',
    about: 'Последние дни 999 года. Наследница Престола Валерия узнаёт, что поднятая луна выплеснет Чашу на Венец, и собирает тех, кто весь год шёл против Ордена.',
    opening: [
      'Тысячу лет назад Восьмая луна упала в мир. Лунные цари ушли под воду, Белые руины опустели.',
      'Сорок лет назад Орден Зеркала зажёг в руинах огни и посадил рядом с пустым троном регента. Регента зовут Северин Ладар, и он ждёт Схождения.',
      'Весь этот год Орден собирал по краям Венца то, что нужно для подъёма луны: Солевой венец, Живую ветвь, кусок лунного сердца и Цепи луны.',
      'Наследнице Престола Валерии двадцать лет. В ночь Схождения она должна стать царицей поднятой луны. Сегодня ей впервые позволили читать бумаги регента.'
    ],
    ending: [
      'В ночь Схождения цепь лопнула, и Восьмая луна не поднялась. Чаша осталась в своих берегах.',
      'Наэра пела до рассвета. Под водой ровно светилось лунное сердце, как светит сердце спящего.',
      'Пятеро, которые весь год воевали поодиночке, стояли на одном берегу и не знали, что сказать друг другу. Потом Ирга сказала, что хочет есть, и все согласились.',
      'Над Венцом взошло солнце первого дня тысячного года. На небе было семь лун, и никто не искал восьмую.'
    ],
    epilogue,
    missions: [
      {
        id: 'tys1',
        name: 'Белый двор',
        levelCap: 6,
        about: 'Средняя карта, задания при дворе.',
        brief: 'Регент Северин Ладар готовит Схождение. Наследница Валерия должна стать царицей поднятой луны, но впервые сомневается в том, чему её учили.\n\nСоберите верных рыцарей Белого двора: у каждого своя просьба. Потом узнайте в Зеркальном архиве, что задумал регент.',
        goals: ['Помочь трём рыцарям двора', 'Узнать план регента в Зеркальном архиве'],
        lose: 'Валерия пала или потерян Белый двор',
        bonuses: [{ kind: 'unit', unit: 'legionary', count: 20 }, { kind: 'res', res: { gold: 1500, moonsilver: 3 } }, { kind: 'art', id: 'scoutcloak' }],
        scenes: scenes1
      },
      {
        id: 'tys2',
        name: 'Бегство',
        levelCap: 10,
        about: 'Средняя карта, погоня.',
        brief: 'Регент знает о сомнениях Валерии. Его охотники уже вышли из Верхнего Престола, а край Белых руин в двух неделях пути.\n\nДойдите до края руин за 14 дней. По дороге можно вывести рыцарей Марцеллы, запертых в Старой конюшне.',
        goals: ['Дойти до края Белых руин за 14 дней', 'Необязательно: вывести рыцарей Марцеллы'],
        lose: 'Прошло 14 дней или Валерия пала',
        bonuses: [{ kind: 'unit', unit: 'deerrider', count: 3 }, { kind: 'res', res: { gold: 2000, moonsilver: 2 } }, { kind: 'art', id: 'couriers' }],
        scenes: scenes2
      },
      {
        id: 'tys3',
        name: 'Союз пяти',
        levelCap: 14,
        about: 'Большая карта, пять краёв.',
        brief: 'Весь год Орден обирал края Венца, и в каждом нашёлся тот, кто ему помешал. Только каждый воевал один.\n\nВыполните просьбы пяти героев прошлого года: Аделины, Айсулу, Веданы, Наэры и Ирги. Каждый, кому вы поможете, придёт к Валерии со своим войском.',
        goals: ['Выполнить просьбы пяти краёв'],
        lose: 'Валерия пала или потерян Серебряный Порог',
        bonuses: [{ kind: 'unit', unit: 'moonmaiden', count: 4 }, { kind: 'res', res: { gold: 4000, moonsilver: 4 } }, { kind: 'art', id: 'thoughtband' }],
        scenes: scenes3
      },
      {
        id: 'tys4',
        name: 'Белые руины',
        levelCap: 18,
        about: 'Большая карта, захват руин.',
        brief: 'Регент гонит войско по лунным дорогам. На каждой дороге стоит белая руина с огнём Ордена.\n\nВозьмите три руины и перережьте дороги. Руины помнят своего хозяина, но флаг на них ставит тот, кто пришёл первым.',
        goals: ['Взять три белые руины', 'Не потерять Стан Союза'],
        lose: 'Валерия пала или потерян Стан Союза',
        bonuses: [{ kind: 'unit', unit: 'throneknight', count: 2 }, { kind: 'res', res: { gold: 6000, moonsilver: 6 } }, { kind: 'art', id: 'striders' }],
        scenes: scenes4
      },
      {
        id: 'tys5',
        name: 'Ночь Схождения',
        levelCap: 22,
        about: 'Огромная карта, два уровня.',
        brief: 'Регент начал подъём раньше срока. До ночи Схождения 28 дней.\n\nДоведите Наэру к храму первой колыбельной под Срединой Чаши и погасите два алтаря Ордена на мысах. Когда луна уснёт, стража Средины уйдёт: тогда разбейте регента.',
        goals: ['Довести Наэру к храму первой колыбельной', 'Погасить два алтаря Ордена', 'Разбить регента до ночи Схождения'],
        lose: 'Прошло 28 дней, Валерия пала или потерян Стан Союза',
        bonuses: [{ kind: 'unit', unit: 'shard', count: 1 }, { kind: 'res', res: { gold: 8000, moonsilver: 8 } }, { kind: 'art', id: 'thronemail' }],
        scenes: scenes5
      }
    ]
  });
})(globalThis.Heroes98 = globalThis.Heroes98 || {});
