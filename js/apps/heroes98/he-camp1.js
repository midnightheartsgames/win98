(function (H) {
  'use strict';
  const scenes1 = `event day 1 -> n1_dawn
event defeat raid1 -> n1_raid1
event defeat raid2 -> n1_raid2
event defeat raid3 -> n1_raid3
event capture sawmill -> n1_saw
event capture oremine -> n1_ore
event visit mill repeat -> n1_mill

@n1_dawn
show adelina left
show bellman right
bellman: Третий набат за ночь, капитан. Звонить ещё?
adelina: Звони, пока весь Брод не проснётся.
bellman: Брод и так не спит. С заречных сёл дым.
adelina: Сколько их?
bellman: Пастух сказал: тени. Считать не стал, бежал.
hide bellman
show sergeant right
adelina: Йорис, кто у нас под рукой?
sergeant: Ополчение с вечерней смены. И те, кто успел обуться.
adelina: Стоять плечом к плечу. Кто бьёт одного, получает от всех соседей. Объясни им это по дороге.
sergeant: Объясню, если будет кому.
goal add raids "Отбить три набега на сёла" to raid1 raid2 raid3
goal add mines "Взять лесопилку и рудник" to sawmill oremine
goal add mill "Дойти до мельницы Ренье Даля"
say Щёлкните по клетке, появится путь. Второй щелчок ведёт героя. Шаги на день показаны полосой внизу, «Конец дня» справа.
say Черта Лиги, Строй: когда ваш отряд бьют вплотную, отряды Лиги рядом с ним наносят удар в ответ. Ставьте отряды рядом.
say Цели миссии в Державе, клавиша K, вкладка «Цели».
end

@n1_raid1
show adelina left
show sergeant right
sergeant: Первое село чистое. Двоих наших унесли к колодцу, живы.
adelina: Что они взяли?
sergeant: Ничего. Амбар цел, скот цел. Просто шли и били.
adelina: Деньги с брошенных дворов собери. Двор ополчения за холмом наймёт ещё людей, если платить вперёд.
say Золото и ресурсы лежат на карте кучами: наступите на них. Двор ополчения нанимает при посещении.
end

@n1_raid2
show adelina left
show sergeant right
sergeant: У Гюнтера рука висит. Тень его только задела. Говорит, холодно и пальцы не держат.
adelina: Пройдёт?
sergeant: К вечеру, говорят. Если доживём до вечера.
say Тени предков снижают Натиск тех, кого коснулись. Стрелки и удар первыми спасают от этого холода.
end

@n1_raid3
show adelina left
show sergeant right
sergeant: Капитан, взгляните. На костях соль.
adelina: Они из степи. Там всех кладут в соль.
sergeant: Мой дед привёз из степи кость на память. Серая была, как зола, и крошилась.
adelina: А эта?
sergeant: Белая. И сырая. Пальцы щиплет.
adelina: Значит, из кургана их подняли не в прошлом веке. В этом месяце.
sergeant: Курганы сами не открываются.
adelina: Нет.
set raids_done
goal done raids
scene n1_check
end

@n1_saw
say Лесопилка ваша. Шахта приносит ресурс каждый день, флаг на ней показывает владельца.
set saw_done
scene n1_mines
end

@n1_ore
say Рудник ваш, руда пойдёт в дело.
set ore_done
scene n1_mines
end

@n1_mines
if flag saw_done
if flag ore_done
goal done mines
set mines_done
scene n1_check
end
end
end

@n1_check
if flag raids_done
if flag mines_done
set n1_ready
goal point mill mill
say Сёла отбиты, шахты ваши. Осталось дойти до мельницы.
end
end
end

@n1_mill
show adelina left
show renier right
if flag n1_ready
renier: Капитан Корвен. Я думал, вы сразу пойдёте в Звонград докладывать.
adelina: Докладывать пока нечего. Вы Ренье Даль?
renier: Мельник. Дважды старшина ополчения, оба раза не по своей воле.
adelina: В Броду есть стена?
renier: Частокол. Стеной его зовут те, кто не видел стены.
adelina: Тогда начнём с частокола.
goal done mill
win
else
renier: Мельница цела, капитан. А вот за рекой ещё горит.
adelina: Знаю. Сначала сёла и шахты.
renier: Мука подождёт. Она терпеливая.
end
end
`;

  const scenes2 = `event day 1 -> n2_start
event day 2 -> n2_paper
event day 8 -> n2_week2
event day 15 -> n2_week3
event built market -> n2_market
event built dwell2 -> n2_range
event built dwell3 -> n2_bells
event capture fort -> n2_fort
event flag n2_all -> n2_win

@n2_start
show adelina left
show renier right
renier: Вот он, Мельничный Брод. Две сотни дворов, один частокол и я.
adelina: Что дальше по дороге?
renier: Старая застава на переправе. Там сидят разбойники, им платят, хотя никто не знает кто. Зерно не проходит.
adelina: Сколько у нас времени?
renier: Подвоз кончится к концу третьей недели. Потом люди уйдут сами.
adelina: Значит, к концу третьей недели застава будет наша. Нужны стрелки и колокол.
goal add range "Построить Стрелковый тир"
goal add bells "Построить Звонницу"
goal add fort "Взять разбойничью заставу до конца третьей недели" to fort
goal lose day 21
say Щёлкните по городу или его значку. В городе можно строить одно здание в день и нанимать существ. Чертёж открывается клавишей B.
end

@n2_paper
show adelina left
show renier right
renier: Пришла бумага из Ратуши. Лига оплатила контракт: наёмники у дальнего брода пойдут к нам за обычную плату.
adelina: Разбойники на разбойников?
renier: Нет, эти честно торгуются. За золото и строго по договору.
deal hire mercs for 19
say Контракт «Наём»: названный отряд присоединится к герою Лиги без боя. Идите к отмеченному бумагой отряду и примите его. Контракты видны в Державе.
end

@n2_market
show renier right
renier: Рынок готов. Лишнее дерево теперь можно менять на руду. Курс плохой, но честный.
say Чем больше рынков у игрока, тем лучше курс. Торговля идёт через кнопку «Рынок» в городе.
end

@n2_range
say Стрелковый тир построен, арбалетчики ждут найма.
goal done range
set range_done
scene n2_check
end

@n2_bells
say Звонница построена. Звонари бьют звоном издалека, а рядом с ними отряды держатся смелее.
goal done bells
set bells_done
scene n2_check
end

@n2_week2
show renier right
renier: Новая неделя. На дворах новые люди, в тире новые стрелки.
say В первый день недели жилища пополняются. Не нанятые копятся, но не больше чем за две недели.
end

@n2_week3
show renier right
renier: Последняя неделя, капитан. Подводы уже разворачивают.
end

@n2_fort
show adelina left
show sergeant right
sergeant: Застава наша. Капитан, в кладовой тюки. Плащи, белые, новые, ни пятна.
adelina: Сколько?
sergeant: Сорок с лишним. Разбойники их не носили, те в рванье. Хранили, как чужую поклажу.
adelina: Кто забирал?
sergeant: Говорят, забирали по осени, через соляной путь. Платили серебром и не торговались.
adelina: Разбойникам никто не платит не торгуясь.
goal done fort
set fort_done
scene n2_check
end

@n2_check
if flag range_done
if flag bells_done
if flag fort_done
set n2_all
end
end
end
end

@n2_win
show adelina left
show renier right
renier: Подводы пошли. Брод будет с мукой.
adelina: А я пойду по соляному пути. Хочу увидеть, куда уходят белые плащи.
win
end
`;

  const scenes3 = `event day 1 -> n3_start
event heroes 2 -> n3_second
event caravan solevarsk repeat -> n3_salt
event visit camp -> n3_camp
event defeat ambush -> n3_after
event visit kurgan repeat -> n3_kurgan
event flag n3_all -> n3_win

@n3_start
show adelina left
show mirabel right
mirabel: Капитан Корвен, я веду книги Солеварска. Три обоза сырца стоят в Броду, а варницы пустуют четвёртую неделю.
adelina: Что мешает?
mirabel: Разбойники на дороге, мёртвые за дорогой и наш бургомистр, который не подписывает охрану.
adelina: Мальс?
mirabel: Он. Я не спрашиваю почему. Я только считаю, сколько это стоит. Без соли цех не заплатит ополчению.
adelina: Сколько обозов нужно?
mirabel: Три. Каждый обоз принесёт золото и соль.
goal add salt "Провести три обоза в Солеварск" to solevarsk ford1 ford2
goal add second "Нанять второго героя в таверне"
goal add camp "Найти шаманку, о которой говорят на тракте" to camp
say Обоз идёт сам, но только по чистой дороге: отряды на пути его не пропустят. Откройте Солеварск, Обозная станция, и выберите, откуда идти.
end

@n3_second
say Второй герой поведёт своё войско. Рядом стоящие герои меняются отрядами и вещами: щёлкните по герою, стоящему рядом.
goal done second
set second_done
scene n3_check
end

@n3_salt
if flag salt2
set salt3
say Третий обоз в Солеварске.
give gold 1500
give salt 2
goal done salt
scene n3_check
else
if flag salt1
set salt2
say Второй обоз в Солеварске. Остался один.
give gold 1500
give salt 2
else
set salt1
say Первый обоз в Солеварске. Осталось два.
give gold 1500
give salt 2
end
end
end

@n3_camp
show adelina left
show aisulu right
aisulu: Не подходи с той стороны, там ветер. Ты с колоколами?
adelina: Капитан стражи Звонграда. На ваших людях свежая соль.
aisulu: Они не мои. Они ничьи теперь. Я спрашивала. Они не знают, кто их поднял, но все идут сюда, на запад.
adelina: Кто вскрыл курган?
aisulu: Те, кто в белом. Унесли Солевой венец. Без него хан не лежит.
show sergeant left
sergeant: Капитан, на дороге люди. Там наши. Наши щиты, наше знамя.
aisulu: Посмотри на их ноги. У них нет теней.
hide sergeant
show adelina left
show cloak right
cloak: Капитан Корвен. Вы далеко от своих колоколов.
adelina: Кто вы?
cloak: Никто, с кем стоит воевать. Нам нужна шаманка, остальных мы не держим.
adelina: Откуда у вас моё войско?
cloak: Это отражение. Оно ничего не весит, пока вы сами его не испугаетесь. Отойдите, капитан. Мы заняты тем, что спасёт и вашу дельту.
spawn hero aisulu 0 57 26 0 aisulu
spawn mirror 0.5 56 22 0 ambush
reveal 56 22 4
goal done camp
goal add ambush "Разбить отражения" to ambush
say Отражение повторяет ваш самый сильный отряд. Айсулу теперь с вами: это второй герой, ходите им как обычно.
end

@n3_after
show adelina left
show aisulu right
aisulu: Они рассыпались, как соль в воде.
adelina: А тот, в белом?
aisulu: Ушёл раньше, чем они упали. Он знал, чем кончится.
aisulu: Мне нужно к кургану на северо-востоке. Предки там говорят яснее. Можешь не провожать.
adelina: Йорис, это Лига теперь спорит с Орденом?
show sergeant right
sergeant: Спорить будем потом, капитан. Сначала обозы.
goal done ambush
goal add kurgan "Необязательно: довести Айсулу до кургана" to kurgan
set ambush_done
scene n3_check
end

@n3_kurgan
if hero aisulu
show aisulu left
aisulu: Здесь. Я слышу их.
aisulu: Хан встал без венца и зовёт род на дельту. Я пойду за венцом, а ты разбирайся со своими.
aisulu: Если придётся выбирать между дельтой и степью, я выберу тех, кто молчит. Запомни это, капитан.
goal done kurgan
keep aisulu_led
else
say Курган молчит. Камень холодный, говорить с ним может только шаманка.
end
end

@n3_check
if flag second_done
if flag ambush_done
if flag salt3
set n3_all
end
end
end
end

@n3_win
show adelina left
show mirabel right
mirabel: Три обоза, цех заплатил. Это первое ваше дело, которое сошлось с моими книгами.
adelina: А подпись Мальса?
mirabel: Об этом я хотела поговорить в Звонграде. Не при людях. Я нашла ещё кое-что в счетах Ратуши.
win
end
`;

  const scenes4 = `event day 1 -> n4_start
event capture yard1 -> n4_yard1
event capture yard2 -> n4_yard2
event capture yard3 -> n4_yard3
event visit letters repeat -> n4_letters
event day 8 -> n4_late
event flag n4_all -> n4_win

@n4_start
show adelina left
show mirabel right
mirabel: Год назад архив Ратуши выдал карты степных курганов. Подпись бургомистра, плата в книги не внесена.
adelina: Куда ушли деньги?
mirabel: На три гильдейских подворья. Они записаны на людей, которых не существует. Я проверяла.
adelina: Он знает, что вы проверяли?
mirabel: Он знает, что я считаю. Этого ему хватит. Я бы дала ему десять дней до отъезда.
show malse right
malse: Капитан! Мирабель! Какая поздняя работа. Город вам благодарен, город вам заплатит, вы только скажите сколько.
adelina: Откройте подворья, бургомистр.
malse: Завтра, послезавтра, после совета. Там же товар цехов, поймите. Есть порядок.
hide malse
show mirabel right
goal add yards "Взять три подворья Мальса за 10 дней" to yard1 yard2 yard3
goal add letters "Найти письма Мальса"
goal lose day 10
deal bounty watch 1500 salt 2 at zvongrad for 9
deal supply ore 6 2400 at zvongrad for 9
say Контракт «Награда» платит за победу над отмеченным отрядом. Контракт «Поставка»: привезите ресурс в город контракта и сдайте в Ратуше контрактов, там же новые бумаги каждую неделю.
say Золото нужно сейчас: за 10 дней войско само не вырастет. Начинайте с наёма.
end

@n4_yard1
show sergeant left
sergeant: Первое подворье. В амбарах пусто, в счётной комнате зола.
scene n4_count
end

@n4_yard2
show sergeant left
sergeant: Второе. Жгли бумаги ещё утром. Кто-то их предупредил.
scene n4_count
end

@n4_yard3
show sergeant left
sergeant: Третье наше. Сторож говорит, коробка с письмами уехала на старую мельницу за каналом.
reveal 63 65 4
scene n4_count
end

@n4_count
if flag y2
set y3
goal done yards
goal point letters letters
scene n4_check
else
if flag y1
set y2
else
set y1
end
end
end

@n4_letters
show adelina left
if flag y3
show mirabel right
mirabel: Вот они. Переписка с человеком, который подписывается одной буквой.
adelina: О чём?
mirabel: Об оплате. Карты курганов, проводники, охрана дорог. И отдельно: «к новой луне Звонград должен быть занят своими стенами».
adelina: Набег?
mirabel: Нойон мёртвых, с востока, по соляному пути. Мальс не просто продал карты. Он продал нам дату.
set letters_done
goal done letters
scene n4_check
else
say В мельнице заперто. Сторож ждёт, пока подворья падут: без ключей оттуда коробку не вынести.
end
end

@n4_late
show mirabel right
mirabel: Прошла неделя, капитан. Я считаю дни, он считает дорогу.
end

@n4_check
if flag y3
if flag letters_done
set n4_all
end
end
end

@n4_win
show adelina left
show sergeant right
sergeant: Его экипаж ушёл через южные ворота. Белые ехали рядом, открыто.
adelina: Пусть едет. Звони на всех колокольнях дельты. У нас меньше месяца.
win
end
`;

  const scenes5 = `event day 1 -> n5_start
event day 4 -> n5_wave1
event day 8 -> n5_wave2
event day 12 -> n5_wave3
event day 15 -> n5_held
event defeat noyon -> n5_won
event capture brod -> n5_brod
event capture solevarsk -> n5_soleva
event capture zvongrad -> n5_back

@n5_start
show adelina left
show bellman right
bellman: Набат, капитан?
adelina: Набат.
bellman: Вот теперь звоню так, как учили. Сорок лет ждал и лучше бы не дождался.
hide bellman
show ortwin right
ortwin: Капитан, Литейная яма отдала одно орудие. Больше не успею.
adelina: Бомбарда стреляет?
ortwin: Четыре раза. Потом можно ею подпереть ворота.
give unit bombard 1
hide ortwin
show sergeant right
sergeant: Брод и Солеварск ещё наши. Из них можно вести людей обозами.
adelina: Сначала продержаться. Четырнадцать дней, пока подойдут все сёла.
goal add hold "Удержать Звонград 14 дней" stay zvongrad
goal add noyon "Разбить нойона мёртвых" to noyon
goal lose town zvongrad
aim player 1 zvongrad
scene n5_size0
say Города и обозы теперь ваше войско. Кузня продаёт машины для боя: шатёр, стреломёт, повозка. В осаде башни и ров работают на вас.
end

@n5_wave1
show sergeant right
sergeant: С востока ещё колонна. Идут к Броду.
sergeant: И вот что, капитан. Взяли одного живого, если это можно так назвать. Тень с бляхой рода. Сидит в подвале Ратуши и молчит.
adelina: Пусть сидит. Не трогать.
spawn hero yesui 1 74 28 0 wave1
army wave1 shade 30 horsebow 18 stonewoman 8
scene n5_size1
aim player 1 zvongrad brod
end

@n5_wave2
show sergeant right
sergeant: С севера идут каменные. Медленно, но идут.
spawn hero burtas 1 40 3 0 wave2
army wave2 stonewoman 10 eaglespirit 6 saltnoyon 2
scene n5_size2
end

@n5_wave3
show sergeant right
sergeant: Третья рать. Это всё, что у них есть, или мне так хочется думать.
spawn hero ketebai 1 75 40 0 wave3
army wave3 horsebow 20 eaglespirit 8 saltnoyon 4 bonebull 2
scene n5_size3
aim player 1 zvongrad solevarsk
end

@n5_held
if owns zvongrad
show adelina left
show bellman right
bellman: Четырнадцатый день. Сёла подошли, капитан. На стенах теперь тесно.
adelina: Тогда хватит сидеть. Найдём нойона.
army zvongrad militia 200 crossbow 60 ringer 30 plated 14
say Ополчение сёл встало в гарнизон Звонграда. Город теперь держится сам, Аделина может идти за нойоном.
goal done hold
goal safe zvongrad
aim player 1 adelina
end
end

@n5_size0
if not diff easy
army noyon shade 30 horsebow 14 stonewoman 8 eaglespirit 4 saltnoyon 2 bonebull 1
end
if diff hard
army noyon shade 30 horsebow 14 stonewoman 8 eaglespirit 4 saltnoyon 2 bonebull 1
end
if diff impossible
army noyon shade 60 horsebow 28 stonewoman 16 eaglespirit 8 saltnoyon 4 bonebull 2
end
end

@n5_size1
if not diff easy
army wave1 shade 10 horsebow 6 stonewoman 2
end
if diff hard
army wave1 shade 10 horsebow 6 stonewoman 2
end
if diff impossible
army wave1 shade 20 horsebow 12 stonewoman 4
end
end

@n5_size2
if not diff easy
army wave2 stonewoman 4 eaglespirit 2 saltnoyon 1
end
if diff hard
army wave2 stonewoman 4 eaglespirit 2 saltnoyon 1
end
if diff impossible
army wave2 stonewoman 8 eaglespirit 4 saltnoyon 2
end
end

@n5_size3
if not diff easy
army wave3 horsebow 6 eaglespirit 2 saltnoyon 1 bonebull 1
end
if diff hard
army wave3 horsebow 6 eaglespirit 2 saltnoyon 1 bonebull 1
end
if diff impossible
army wave3 horsebow 12 eaglespirit 4 saltnoyon 2 bonebull 1
end
end

@n5_brod
say Мельничный Брод снова ваш.
end

@n5_soleva
say Солеварск снова ваш.
end

@n5_back
if flag noyon_down
goal done retake
scene n5_final
else
say Звонград снова ваш.
end
end

@n5_won
set noyon_down
goal done noyon
if owns zvongrad
scene n5_final
else
show adelina left
show sergeant right
sergeant: Нойон лёг, капитан. А над Ратушей всё ещё чужой бунчук.
adelina: Значит, идём домой и снимаем его.
goal add retake "Вернуть Звонград" to zvongrad
end
end

@n5_final
show adelina left
show sergeant right
sergeant: Нойон лёг. Рать без него стоит и не знает, куда идти.
adelina: Пленный ещё здесь?
hide sergeant
show spirit right
spirit: Я слышу колокол. Твой город стоит.
adelina: Ты знаешь шаманку Айсулу?
spirit: Её знают все, кто лежит в соли.
adelina: Отнеси ей это. Письма бургомистра, с подписями и датой.
spirit: Ты отпускаешь меня?
adelina: Я отдаю долг, который не брала. Ваших разбудили за наши деньги. Она должна знать, с кого спрашивать.
spirit: Живые так не делают.
adelina: Иди, пока я считаю это разумным.
keep letters_sent
goal done hold
win
end
`;

  H.Campaign.add({
    id: 'nabat',
    number: 1,
    faction: 'league',
    name: 'Набат',
    theme: 'camp_nabat',
    hero: 'adelina',
    about: 'Весна 999 года. Мёртвые из степи идут на сёла дельты. Капитан стражи Звонграда собирает ополчение и узнаёт, кто за это заплатил.',
    opening: [
      'Над Звонградом висит Золотой колокол. По нему вся Лига сверяет часы, платит долги и встаёт на работу.',
      'Этой весной лунные недели идут не так, как записано у звездочётов. В небе горит восьмой свет. Его зовут Гостьей и стараются не смотреть вверх.',
      'В степи Ак-Туз уже сто тридцать лет не было войны. Курганы молчат, каменные бабы смотрят на восток.',
      'Ночью на сёла дельты выходят тени. Первым об этом узнаёт старый звонарь у Мельничного Брода.'
    ],
    ending: [
      'Звонград устоял. Колокол бил четырнадцать дней, и в дельте его слышали до самого моря.',
      'Хендрик Мальс уехал с белыми плащами. Его имя соскоблили с ратушной доски, но счёт по нему не закрыт.',
      'Пленный дух ушёл в степь с письмами. Кайдар-хан всё ещё стоит без венца, и у степи теперь есть вопрос к живым.',
      'Аделина Корвен осталась в Звонграде считать павших. Она знает, что у этой войны есть хозяин, и знает цвет его плаща.'
    ],
    missions: [
      {
        id: 'nabat1',
        name: 'Колокол на рассвете',
        levelCap: 4,
        about: 'Малая карта, своего города нет.',
        brief: 'За ночь звонили трижды. Тени вышли к заречным сёлам, и Аделина Корвен оказалась ближе всех, у кого есть право приказывать. Войска у неё столько, сколько успело обуться.\n\nОтбейте набеги, возьмите лесопилку и рудник для ополчения и дойдите до мельницы Ренье Даля на том конце дороги. Это старшина местного ополчения, и без него Брод никого не послушает.',
        goals: ['Отбить три набега на сёла', 'Взять лесопилку и рудник', 'Дойти до мельницы Ренье Даля'],
        lose: 'Аделина пала',
        bonuses: [{ kind: 'unit', unit: 'militia', count: 12 }, { kind: 'res', res: { gold: 1500 } }, { kind: 'art', id: 'couriers' }],
        scenes: scenes1
      },
      {
        id: 'nabat2',
        name: 'Мельничный брод',
        levelCap: 7,
        about: 'Малая карта, свой город.',
        brief: 'Мельничный Брод стоит на единственной дороге, по которой зерно идёт из верхних сёл. Дорогу перекрыла старая застава на переправе, и сидящим там разбойникам кто-то платит.\n\nОтстройте город: стрелковый тир, звонницу и всё, что успеете. Наймите войско и возьмите заставу до конца третьей недели. Лига прислала контракт на наёмников, им стоит воспользоваться.',
        goals: ['Построить Стрелковый тир', 'Построить Звонницу', 'Взять разбойничью заставу до конца третьей недели'],
        lose: 'Застава не взята за три недели, Аделина пала или город потерян',
        bonuses: [{ kind: 'res', res: { gold: 2500, wood: 5, ore: 5 } }, { kind: 'unit', unit: 'crossbow', count: 8 }, { kind: 'art', id: 'quilted' }],
        scenes: scenes2
      },
      {
        id: 'nabat3',
        name: 'Соляной путь',
        levelCap: 10,
        about: 'Средняя карта, два города.',
        brief: 'Из заставы белые плащи уходили по соляному пути. Этой же дорогой должны идти обозы сырца на варницы Солеварска, и магистр Мирабель Фосс считает убытки от каждого дня простоя.\n\nПроведите три обоза, расчистив им дорогу. Наймите второго героя: одной парой рук тракт не удержать. А на тракте говорят о молодой шаманке, которая ходит от кургана к кургану и задаёт вопросы.',
        goals: ['Провести три обоза в Солеварск', 'Нанять второго героя', 'Найти шаманку и выжить после встречи', 'Необязательно: довести Айсулу до кургана'],
        lose: 'Аделина пала или потеряны оба города',
        bonuses: [{ kind: 'unit', unit: 'ringer', count: 6 }, { kind: 'res', res: { gold: 3000, sulfur: 3 } }, { kind: 'art', id: 'saltring' }],
        scenes: scenes3
      },
      {
        id: 'nabat4',
        name: 'Ночь в Ратуше',
        levelCap: 13,
        about: 'Средняя карта, гонка на 10 дней.',
        brief: 'Счета Ратуши не сходятся на сумму, за которую можно купить карты всех курганов степи. Подпись одна: бургомистр Хендрик Мальс. Деньги ушли на три гильдейских подворья, а он уже считает дни до отъезда.\n\nУ вас десять дней. Возьмите подворья, найдите его письма. Контракты Ратуши дают золото быстрее, чем прирост: награда за стражу Мальса и поставка для цехов уже на столе.',
        goals: ['Взять три подворья Мальса за 10 дней', 'Найти письма Мальса'],
        lose: 'Прошло 10 дней, Аделина пала или потерян Звонград',
        bonuses: [{ kind: 'res', res: { gold: 5000 } }, { kind: 'unit', unit: 'plated', count: 5 }, { kind: 'art', id: 'couriers' }],
        scenes: scenes4
      },
      {
        id: 'nabat5',
        name: 'Набат',
        levelCap: 16,
        about: 'Средняя карта, осада, три города.',
        brief: 'Письма не солгали. К новой луне нойон мёртвых вышел к Звонграду, а за ним идут ещё три рати. Город должен простоять четырнадцать дней, пока подойдут все сёла дельты.\n\nДержите стены, ведите людей обозами из Брода и Солеварска, покупайте машины. Ортвин Брасс успел отлить одну Бомбарду. Когда осада захлебнётся, идите за самим нойоном.',
        goals: ['Удержать Звонград 14 дней', 'Разбить нойона мёртвых'],
        lose: 'Звонград взят или Аделина пала',
        bonuses: [{ kind: 'unit', unit: 'horseguard', count: 3 }, { kind: 'res', res: { gold: 8000, sulfur: 5 } }, { kind: 'art', id: 'bellcuirass' }],
        scenes: scenes5
      }
    ]
  });
})(globalThis.Heroes98 = globalThis.Heroes98 || {});
