(function (A) {
  'use strict';
  A.Scripts = A.Scripts || {};
  A.Scripts.ch1 = { file: 'ay-ch1', start: 'ch1_start', src: `
@ch1_start
chapter ch1
set instinct, day=1, acts=0, suspicion=0, doses=0, poured=0, dose_today=none
bg pol_room dawn
music cover
-: Рилот. Поместье Пола Секуры, 31 год до битвы при Явине.
-: Эйла просыпается в незнакомой комнате. Как её зовут, она знает. Больше почти ничего.
show nima right servant smile lekku=still
nima: Проснулась! Хозяин велел позвать его, как только ты откроешь глаза.
show aayla left dancer afraid lekku=tense
aayla: Где я?
nima: Дома, госпожа. Сейчас он сам всё расскажет.
hide nima
show pol right robe smile lekku=hello
pol: Эйла. Как ты меня напугала.
aayla: Простите. Я вас не помню.
face pol calm lekku=still
pol: Знаю. Лихорадка выжгла тебе память, лекарь предупреждал. Я твой дядя, Пол.
if pol_tone == polite
pol: Ты и больная благодарила меня за каждый глоток воды. Вежливая девочка.
end
if pol_tone == cold
pol: Ты была резка со мной, пока болела. Я не сержусь. Жар говорил за тебя.
end
if pol_tone == father
pol: В бреду ты спрашивала про отца. Когда окрепнешь, я расскажу.
end
aayla: А кто я?
face pol smile lekku=still
pol: Танцовщица. Лучшая в моём доме. Гости приезжают с Кала'уна, чтобы на тебя посмотреть.
goto ch1_dose

@ch1_morning
set acts=0, rehearsed=false, dose_today=none, done_rehearse=false, done_nima=false, done_bala=false, done_guest=false, done_pol=false, done_balcony=false
bg pol_room dawn
music cover
if day == 2
-: Утро второго дня.
end
if day == 3
-: Утро третьего дня.
end
if day == 4
-: Утро четвёртого дня.
end
if day == 5
-: Утро пятого дня.
end
show aayla left dancer calm lekku=still
if suspicion >= 100
goto ch1_watched
end
if suspicion >= 70
show pol right robe calm lekku=tense
pol: Ты стала странная, Эйла. Смотришь так, будто прикидываешь, где выход.
else
if suspicion >= 40
show pol right robe calm lekku=still
pol: Говорят, ты вчера бродила по дому. Тебе что-то нужно? Спроси меня.
else
show pol right robe smile lekku=still
pol: Доброе утро, девочка. Ты сегодня свежее, чем вчера.
end
end
goto ch1_dose

@ch1_dose
-: Пол протягивает чашку. Напиток мерцает и пахнет сладко.
if knows_dose
-: Теперь Эйла знает, что от него в голове становится пусто, как у Нимы в тот вечер.
end
if suspicion >= 50
choice lekku=pol need=2
> Выпить. -> ch1_drink
> [lie] Сделать вид, что пьёшь. -> ch1_pretend
end
else
choice lekku=pol need=1
> Выпить. -> ch1_drink
> [lie] Сделать вид, что пьёшь. -> ch1_pretend
end
end

@ch1_drink
set doses+1, dose_today=drunk, suspicion-5
-: Эйла пьёт. Холодно и сладко, и мысли снова путаются.
face pol smile lekku=still
pol: Умница.
goto ch1_after

@ch1_pretend
if lekku_read
face pol angry lekku=tense
pol: Лекку у тебя дрожат, девочка. Пей. Я подожду.
-: Пол не уходит, пока чашка не пустеет.
set doses+1, dose_today=watched, suspicion+25
goto ch1_after
end
-: Эйла держит напиток во рту, пока дядя не отворачивается к окну.
if bala_trick
-: Потом, как учила Бала, сплёвывает его в кадку с грибами.
set suspicion+8
else
-: Потом выплёскивает его в кадку с грибами. Грибы светятся чуть ярче.
set suspicion+15
end
set poured+1, dose_today=poured
goto ch1_after

@ch1_watched
show pol right robe calm lekku=still
pol: Сегодня я посижу с тобой, пока ты пьёшь.
-: Он не сводит с неё глаз, пока чашка не пустеет. Спорить Эйла не решается.
set doses+1, dose_today=watched, suspicion=60
goto ch1_after

@ch1_after
if day == 1
face pol smile lekku=still
pol: Отдыхай. Нима покажет дом. Мисра ждёт тебя в зале, вечером гости.
hide all
-: Дел на день два, не больше: вечером танец, и к нему надо успеть.
map pol_estate room
end
if day == 5
goto ch1_arrival
end
face pol calm lekku=still
pol: Я на совете клана до вечера. Вечером гости. Не подведи меня.
hide all
-: Дядя уходит. В доме становится тише.
map pol_estate room

@ch1_arrival
bg pol_hall dusk
-: Во дворе шум. Привратник впускает двоих киффаров в пыльных плащах.
show clansman left travel calm
clansman: Глава клана Секура, к тебе гость с Киффу. Он просит крова.
show pol right robe smile lekku=hello
pol: Гостю клана Секура рады. Нима, приготовь гостевую.
show stranger center early thoughtful
-: Второй киффар молчит. Он смотрит на Эйлу так, будто давно её искал.
show aayla left dancer afraid lekku=tense
-: Эйле становится не по себе. Она его не знает.
face pol calm lekku=still
pol: Эйла, ступай к Мисре. Вечером будешь танцевать для гостя.
hide all
map pol_estate room

@ch1_next
if acts >= 2
goto ch1_evening
end
field

@ch1_rehearse
bg pol_hall dusk
show misra right dancer calm lekku=still
if done_rehearse
misra: На сегодня хватит. Ноги береги к вечеру.
field
end
set done_rehearse, rehearsed, acts+1, misra_n+1
show aayla left dancer calm lekku=still
if misra_n == 1
-: Мисра хлопает в ладоши, отбивая ритм. Эйла кружится и сразу понимает, что слишком быстро.
misra: Медленнее! Ты не уворачиваешься, ты танцуешь. Никто не бьёт тебя.
face aayla shy lekku=down
aayla: Тело само так.
misra: Тогда учи тело. С начала.
goto ch1_next
end
if misra_n == 2
misra: Сегодня лекку. Гости смотрят на них больше, чем на ноги.
-: Мисра показывает жест приветствия: правый кончик вверх. Лекку Эйлы повторяют его раньше, чем она успевает подумать.
face misra surprised lekku=up
misra: Кто тебя этому учил?
face aayla thoughtful lekku=still
aayla: Не помню. Может, никто.
goto ch1_next
end
if misra_n == 3
misra: Ты падаешь и встаёшь так, будто тебя учили драться. Танцовщице это лишнее.
misra: Слушай. Тело может гореть, а лекку должны быть спокойны. Тогда никто не прочтёт, что у тебя внутри.
-: До самого обеда Эйла учится держать лекку неподвижно, когда сердце колотится.
set restraint+1
face misra smile lekku=still
misra: Вот. Теперь даже я не знаю, о чём ты думаешь.
goto ch1_next
end
-: Мисра гоняет её по залу, пока не начинают дрожать колени.
goto ch1_next

@ch1_nima
bg pol_servants dusk
show nima right servant smile lekku=still
if done_nima
nima: Ой, мне ещё бельё развешивать. Потом поболтаем!
field
end
set done_nima, acts+1, nima_n+1
show aayla left dancer calm lekku=still
if nima_n == 1
nima: Я тебе каждое утро чашку ношу, а ты меня даже по имени не знаешь. Нима я.
aayla: Нима. Давно я здесь живу?
nima: Неделю. Хозяин привёз тебя ночью, ты горела вся.
nima: Лекарство он тебе сам наливает, из своей фляги. Никому не доверяет.
goto ch1_next
end
if nima_n == 2
-: Нима оглядывается на дверь и понижает голос.
nima: На прошлой неделе у хозяина ужинали джедаи. Киффар и твилечка, голубая, как ты.
face aayla surprised lekku=up
aayla: И где они теперь?
nima: Ушли в старую шахту на севере и не вернулись. А через день привезли тебя.
face nima surprised lekku=tense
nima: Ой. Ты только хозяину не говори, что я болтала.
goto ch1_next
end
if nima_n == 3
nima: Скажу тебе одну вещь. Я раз попробовала твоё лекарство. Сладкое оно.
nima: А потом весь вечер не могла вспомнить, куда дела ключи. И как меня зовут, на минуту тоже.
face aayla thoughtful lekku=down
aayla: Значит, вот почему я ничего не помню.
set knows_dose
goto ch1_next
end
-: Нима рассказывает про новые занавески в зале. Время уходит.
goto ch1_next

@ch1_bala
bg pol_servants dusk
show bala right cook calm lekku=still
if done_bala
bala: Ушла, ушла отсюда! У меня тесто.
field
end
set done_bala, acts+1, bala_n+1
show aayla left dancer calm lekku=still
if bala_n == 1
bala: Ешь. Танцовщицы, которые падают в обморок, хозяину не нужны.
-: Бала ставит перед ней миску рикритовой похлёбки.
bala: Мой племянник работал в северной шахте. Вернулся пустой. Имя матери не помнит.
aayla: Шахту же закрыли.
bala: Закрыли. А повозки туда ходят каждую ночь.
goto ch1_next
end
if bala_n == 2
bala: Ты не танцовщица. Я их видела сотню.
face aayla surprised lekku=up
aayla: А кто тогда?
bala: Ты садишься спиной к стене и лицом к двери. Так сидят стражники, а не танцовщицы.
goto ch1_next
end
if bala_n == 3
bala: Видела я, как ты морщишься над чашкой. Слушай старуху.
bala: Держи во рту, а как хозяин отвернётся, плюй в кадку с грибами. Грибам всё равно, а лишних брызг не будет.
set bala_trick
aayla: Зачем вы мне помогаете?
bala: Не люблю, когда людей делают пустыми.
goto ch1_next
end
-: Бала ворчит про цены на рикритовое мясо. Время уходит.
goto ch1_next

@ch1_merchant
bg pol_hall dusk
show merchant right rich smile lekku=still
if done_guest
merchant: Красавица, я весь день здесь. Приходи вечером посмотреть, как я проиграю дяде в сабакк.
field
end
set done_guest, acts+1, merchant_n+1
show aayla left dancer calm lekku=still
if merchant_n == 1
merchant: Так это ты та самая танцовщица? Я ради тебя через пол-Рилота ехал.
aayla: Вы торгуете с моим дядей?
merchant: Рилл. Весь север держит Пол Секура. Ну, кроме старой шахты, её закрыли из-за пауков.
merchant: Странно только, что груз оттуда идёт до сих пор. Но это не моё дело.
goto ch1_next
end
merchant: Опять ты! Скажи дяде, что цены у него как у хатта.
choice
> Спросить про джедаев, что были здесь. -> ch1_merchant_ask | suspicion+10
> Спросить про сенатора, о котором говорят гости. -> ch1_merchant_senate
end

@ch1_merchant_ask
face merchant surprised lekku=tense
merchant: Джедаи? Тише ты. Пол не любит, когда о них спрашивают. Улетели, и всё.
-: Вечером дядя наверняка узнает, о чём она спрашивала.
goto ch1_next

@ch1_merchant_senate
merchant: Наш сенатор на Корусанте любит рилл больше, чем закон. И твой дядя с ним дружит.
merchant: Дружба с сенатором дорогая. Кто-то её оплачивает.
goto ch1_next

@ch1_envoy
bg pol_hall dusk
show envoy right council calm lekku=still
if done_guest
envoy: Я жду главу клана. Не отвлекай меня, девочка.
field
end
set done_guest, acts+1, envoy_n+1
show aayla left dancer calm lekku=still
if envoy_n == 1
envoy: Ты похожа на дочь его брата. Говорили, её ребёнком забрали джедаи.
aayla: Я его племянница. Он сам сказал.
face envoy smile lekku=still
envoy: Тогда тебе повезло вернуться домой. Не всем везёт.
goto ch1_next
end
envoy: Совет слышал, что у Пола ужинали джедаи. Он говорит, они улетели на другой день.
choice
> Расспросить её. -> ch1_envoy_ask | suspicion+10
> Промолчать. -> ch1_envoy_quiet
end

@ch1_envoy_ask
aayla: А куда они летели?
face envoy surprised lekku=tense
envoy: Этого он не сказал, а совет не спросил. Странно, да?
-: Посланница смотрит на неё внимательнее, чем раньше.
goto ch1_next

@ch1_envoy_quiet
-: Эйла молчит. Посланница кивает, будто это был правильный ответ.
goto ch1_next

@ch1_pol
bg pol_hall dusk
show pol right robe smile lekku=still
if done_pol
pol: Иди, девочка. У меня дела.
field
end
set done_pol, acts+1, suspicion-10
show aayla left dancer calm lekku=still
if day == 5
face pol calm lekku=tense
pol: Сегодня танцуй для гостя. И не говори с ним, о чём бы он ни спросил.
aayla: Он смотрит на меня, как на знакомую.
pol: Он с дороги и плохо видит. Ступай.
goto ch1_next
end
pol: Помоги мне встретить гостей. Улыбайся, наливай вино. Это тоже служба клану.
-: Эйла улыбается торговцам и посланникам, пока у неё не начинает болеть лицо.
face pol smile lekku=still
pol: Ты моя кровь, Эйла. Я никому тебя не отдам.
goto ch1_next

@ch1_balcony
bg pol_balcony dusk
if done_balcony
-: Эйла уже была здесь сегодня. Ветер всё тот же.
field
end
set done_balcony, acts+1, balcony_n+1
show aayla center dancer thoughtful lekku=still
if balcony_n == 1
-: Под балконом пропасть, внизу огни города. Сумеречная полоса тянется до края неба.
-: Эйле не страшно. Наоборот, тело просит прыгнуть, как будто знает, что ничего не случится.
aayla: Глупость какая.
goto ch1_next
end
if balcony_n == 2
-: Эйла закрывает глаза и всё равно знает, где кто стоит во дворе.
aayla: Кто-то учил меня смотреть так. Не глазами.
set suspicion-5
goto ch1_next
end
if balcony_n == 3
-: Эйла пересчитывает дни. Каждое утро чашка, и каждое утро немного меньше её самой.
aayla: Если я перестану пить, что я вспомню? И захочу ли?
goto ch1_next
end
-: Эйла смотрит на сумеречную полосу, пока не стынут пальцы.
goto ch1_next

@ch1_study
bg pol_study dusk
set saw_study, acts+1, clue_pol_estate_f
-: Дверь в кабинет приоткрыта: слуги убирают, пока хозяина нет.
show aayla center dancer afraid lekku=tense
-: На столе книга с записями. Рилл, рилл, повозки на север каждую ночь. Шахта, которую все считают закрытой.
-: В ящике стола фляга. Жидкость в ней мерцает так же, как утренний напиток.
aayla: Лекарство из его фляги.
-: Эйла кладёт всё на место и уходит, пока никто не вернулся.
goto ch1_next

@ch1_tunic
bg pol_store dusk
set saw_tunic, acts+1
-: В кладовой пахнет пылью. В дальнем сундуке, под тюками ткани, лежит свёрнутая туника. Простая, бурая, совсем не для танцев.
show aayla center dancer thoughtful lekku=still
-: Эйла касается грубой ткани, и комната уходит из-под ног.
hide all
still tholme_test
music memory
-: Высокий человек с тихим голосом опускается перед ней на колено. Ей года два, и всё вокруг пахнет зверем и страхом.
-: Рядом мальчик-киффар с жёлтой полосой через лицо. «Мастер, проверьте её. Она меня позвала. Без слов».
-: Человек долго смотрит ей в глаза. «Хорошо, Квинлан. Проверим».
recall 2
still off
music cover
show aayla center dancer surprised lekku=up
aayla: Квинлан.
-: Имя ничего не значит. Но рука помнит тунику лучше, чем голова.
goto ch1_next

@ch1_holo
bg pol_study night
set heard_holo, acts+1
-: У двери кабинета Эйла слышит голос дяди. Он с кем-то говорит, и этот кто-то шипит помехами.
show patron right holo calm lekku=still
patron: ...он здесь, у тебя под крышей. Ты знаешь, кто он.
show pol left robe angry lekku=tense
pol: Он ничего не помнит. Как и она. Я сделал, как вы велели.
patron: Ты сделал наполовину. Убей его. Сегодня.
pol: Это джедай. Если Орден...
patron: Орден ищет пропавших, а не мёртвых. Сегодня, Пол.
hide all
show aayla center dancer afraid lekku=tense
-: Эйла отступает от двери, пока её не заметили. Убить гостя. Того, что смотрит на неё как на знакомую.
goto ch1_next

@ch1_caught
show guard right guard angry lekku=tense
guard: Госпожа, сюда нельзя. Хозяин будет недоволен.
show aayla left dancer shy lekku=down
aayla: Я заблудилась.
guard: Конечно. Я провожу.
-: Стражник ведёт её обратно до самой комнаты. Вечером дядя всё узнает.
set suspicion+15, acts+1
hide all
if acts >= 2
goto ch1_evening
end
map pol_estate room

@ch1_evening
bg pol_hall night
music cover
-: Вечер. Зал полон гостей, светильники качаются от музыки.
show aayla center dancer calm lekku=still
if day == 3
goto ch1_dance_choice
end
if day == 5
goto ch1_dance_guest
end
if rehearsed
-: Эйла танцует, как учила Мисра. Гости стихают и забывают про вино.
show pol right robe smile lekku=still
pol: Видите? Лучшая в моём доме.
set suspicion-10
else
-: Без репетиции ноги путаются. Эйла сбивается с ритма, и музыканты сбиваются вместе с ней.
show pol right robe angry lekku=tense
pol: Завтра ты весь день у Мисры.
set suspicion+5
end
goto ch1_night

@ch1_dance_choice
-: Сегодня музыка быстрее. Посреди танца тело вдруг само знает, что делать дальше.
choice
> Танцевать, как учила Мисра. -> ch1_dance_taught | suspicion-5
> Позволить телу вести. -> ch1_dance_body | suspicion+15
end

@ch1_dance_taught
-: Эйла держит ритм. Гости хлопают, дядя доволен.
goto ch1_night

@ch1_dance_body
-: Эйла взлетает в сальто через светильник и приземляется беззвучно. На миг ей хорошо, как будто она наконец стала собой.
show pol right robe calm lekku=tense
-: Гости ревут от восторга. Лекку дяди не двигаются совсем.
pol: Где ты этому научилась?
face aayla shy lekku=down
aayla: Не знаю, дядя.
goto ch1_night

@ch1_dance_guest
-: Незнакомец сидит в первом ряду. Он не пьёт и не хлопает, только смотрит.
show stranger right early thoughtful
-: Эйла танцует для него, как велел дядя. Его взгляд мешает ей сильнее, чем музыка.
show pol left robe calm lekku=tense
-: Пол весь вечер смотрит не на неё, а на гостя.
goto ch1_night

@ch1_night
bg pol_room night
music memory
hide all
-: Ночь. Эйла засыпает.
if dose_today == poured && poured == 1
goto ch1_mem1
end
if dose_today == poured && poured == 2
goto ch1_mem4
end
if dose_today == poured && poured == 3
goto ch1_mem5
end
if dose_today == poured && poured == 4
goto ch1_mem6
end
if dose_today == poured && poured == 5
goto ch1_mem10
end
if dose_today == watched
-: Сон приходит сразу и без картинок.
else
-: Снов нет. Утром она не вспомнит, снилось ли ей что-нибудь.
end
goto ch1_dawn

@ch1_mem1
still wampa
-: Холод, рёв, запах мокрой шерсти. Огромная белая тень ломает решётку.
-: Она совсем маленькая. Чужой дом, чужие руки, и зверь идёт прямо к ней.
-: Она зовёт. Без слов, изо всех сил, так, что звенит в ушах.
-: И кто-то слышит. Мальчик-киффар с жёлтой полосой через лицо прыгает между ней и зверем.
recall 1
still off
-: Эйла просыпается. Ладонь горит, будто она только что кого-то оттолкнула.
goto ch1_dawn

@ch1_mem4
still padawan
-: Ей около десяти. Тот самый киффар, уже взрослый, стоит перед ней в зале Храма.
-: «Отныне ты мой падаван». Она стоит очень прямо и не может перестать улыбаться.
-: Первый урок: выстрел летит в неё, и клинок встречает его сам, раньше мысли.
recall 4
still off
-: Эйла просыпается и ловит себя на том, что заслоняется рукой от чего-то, чего нет.
goto ch1_dawn

@ch1_mem5
still heart13
-: День рождения. Ей тринадцать. Киффар кладёт ей в ладони камень, тёплый, как живой уголь.
-: «Сердце огня. С моей родины, с Киффу». Камень светится изнутри, и ей спокойно.
recall 5
still off
-: Эйла просыпается с пустыми ладонями. Покой остаётся с ней до утра.
goto ch1_dawn

@ch1_mem6
still tda
-: Маленький зверёк с белым мехом лежит у неё на руках и не дышит. Т'да.
-: Киффар сидит рядом. «Он теперь часть Силы. И будет жить в твоём сердце».
-: Потом другая планета, огромные грибы, и маленькая могила под одним из них. Фелуция.
recall 6
still off
-: Эйла просыпается в слезах. Ей не стыдно.
goto ch1_dawn

@ch1_mem10
still tatooine
-: Два солнца и песок, который везде. Она с киффаром на Татуине, под чужими именами.
-: Где-то в том же городе застрял мастер Квай-Гон Джинн. Их работа: быть незаметными.
-: Она учится идти так, чтобы никто не слышал шагов.
recall 10
still off
-: Эйла просыпается и долго лежит, слушая дом. Каждый шорох понятен.
goto ch1_dawn

@ch1_dawn
if day == 5
goto ch1_stranger
end
set day+1
goto ch1_morning

@ch1_stranger
bg pol_room night
music aayla
-: Её будит тихий шаг. У постели стоит незнакомец-киффар.
show stranger right early resolute
show aayla left dancer afraid lekku=tense
aayla: Что вам нужно? Я позову стражу.
stranger: Не надо стражи. Посмотри.
-: Он протягивает ей рукоять светового меча.
cg your_saber
stranger: Это твой меч, Эйла. Твой световой меч. Возьми.
choice
> Взять меч. -> ch1_take | saber, bond.vos+1
> Не брать. -> ch1_refuse
end

@ch1_take
-: Рукоять ложится в ладонь так, будто всегда там лежала. А память не приходит.
cg off
face stranger sad
stranger: Ничего?
aayla: Ничего. Простите.
goto ch1_stranger_go

@ch1_refuse
-: Эйла прячет руки за спину. Незнакомец долго держит рукоять перед ней, потом опускает.
cg off
face stranger sad
stranger: Ты правда не помнишь.
goto ch1_stranger_go

@ch1_stranger_go
face stranger angry
stranger: Тогда я поговорю с твоим дядей. Он знает больше, чем говорит.
hide stranger
-: Он уходит. Через минуту из покоев дяди доносится крик.
goto ch1_balcony_night

@ch1_balcony_night
bg pol_balcony night
music battle
-: Эйла бежит на крик. Двери в покои дяди распахнуты, дальше балкон.
show pol left robe surprised lekku=tense
show stranger right early angry
-: Незнакомец держит руку перед собой, не касаясь Пола. Лекку дяди сами затягиваются у него на горле.
stranger: Кто тебе платит? Имя.
pol: Не... знаю...
-: С пальцев незнакомца срывается молния. Пол кричит.
pol: Каа! Сенатор Чом Фрей Каа! Это он!
show aayla center dancer angry lekku=tense
-: Эйла не помнит этого человека. Она помнит дядю, его чашку и его голос.
choice
> Страх: он убьёт дядю. -> ch1_fear | feeling=fear
> Гнев: как он смеет. -> ch1_anger | feeling=anger
end

@ch1_fear
-: Страшно. Если она ничего не сделает, дядя умрёт у неё на глазах.
goto ch1_push

@ch1_anger
-: Гнев вспыхивает сразу. Этот чужак пришёл в их дом и мучает её семью.
goto ch1_push

@ch1_push
-: Эйла не знает, как это делается. Она просто выбрасывает руку вперёд.
cg balcony
-: Воздух бьёт, как стена. Пол и незнакомец перелетают через перила.
-: Незнакомца у самого края ловит за руку краснокожий деваронец. Откуда он взялся, Эйла не видела.
-: Пол падает в темноту. Крика нет.
cg off
hide all
if !saber
-: На плитах балкона лежит рукоять меча. Эйла поднимает её, сама не зная зачем.
set saber
end
show stranger_devaronian right spacer surprised
stranger_devaronian: Уходим, джедай, уходим! Сейчас тут будет вся стража клана!
hide all
show aayla center dancer angry lekku=tense
-: Деваронец утаскивает незнакомца в темноту. Внизу уже кричат стражники.
aayla: Это он. Он пришёл, и дядя умер.
-: Эйла не помнит, кто она. Но она запомнит этого киффара.
set escape
music ryloth
-: Топот на лестнице. Стражники ищут убийцу хозяина. Танцовщицу с ним они тоже ищут.
map pol_estate balcony

@ch1_backdoor
bg pol_servants night
-: В людских не спят. Нима, Бала и Мисра жмутся у очага.
show nima left servant surprised lekku=tense
nima: Это правда? Хозяин...
show aayla center dancer sad lekku=down
aayla: Правда. Мне нужно уходить.
show bala right cook calm lekku=still
bala: Стража сейчас всех будет трясти. Кто с тобой дружил, тому достанется первому.
-: Предупредить успеешь одного, пока стража не спустилась.
choice
> Ниме: беги к родне в Лессу, пока не рассвело. -> ch1_warn_nima | warned=nima
> Бале: спрячь девчонок в погребе. -> ch1_warn_bala | warned=bala
> Мисре: уходи через сады вместе со мной. -> ch1_warn_misra | warned=misra
end

@ch1_warn_nima
face nima surprised lekku=up
nima: К тётке? Да, она меня спрячет. Спасибо, госпожа.
goto ch1_leave

@ch1_warn_bala
face bala smile lekku=still
bala: Погреб у меня глубокий, а стражники ленивые. Не полезут.
goto ch1_leave

@ch1_warn_misra
show misra right dancer calm lekku=still
misra: Нет. Я старая, со мной ты не убежишь. Я скажу им, что ты ушла через ворота.
goto ch1_leave

@ch1_leave
hide all
-: Эйла выскальзывает через чёрный ход. Дальше Каменные сады, а за ними пещеры.
map rock_gardens start

@ch1_gardens
bg pol_gardens dusk
show aayla center dancer thoughtful lekku=still
-: В садах ветер. Камни висят в воздухе и плывут, как облака, медленно и сами по себе.
-: Говорят, их можно переставлять. Но гостей просят дать ветру сделать это самому.
aayla: Смотреть и не трогать.
-: Погоня осталась позади. Эйла переводит дух и идёт дальше.
field

@ch1_caves
bg ryloth_caves night
show aayla center dancer afraid lekku=tense
-: За садами начинаются дикие пещеры. Сюда не ходят даже стражники.
-: Из темноты щёлкает что-то большое. Панцирь, щупальца, хвост с жалом. Лилек.
hide all
battle lylek_a enemy
-: Лилек затих. Эйла смотрит на свою ладонь. Она ударила его, не касаясь.
show aayla center dancer surprised lekku=up
aayla: Как тогда, на балконе.
field

@ch1_lair
bg ryloth_caves night
show aayla center dancer resolute lekku=tense
-: Впереди тянет горячим ветром: выход на поверхность. Но проход перегораживает лилек, огромный, старый, весь в шрамах.
hide all
battle lylek_boss
-: Старый лилек падает и больше не встаёт. Эйла выбирается наверх.
map port_road start

@ch1_port
bg ryloth_port dusk
show captain right spacer calm
-: У причала корабль контрабандистов. Грузчики торопятся, пока буря не вернулась.
captain: Шевелитесь! Курс на Киффекс, а стражи Киффу не ждут опоздавших.
show aayla left dancer resolute lekku=tense
-: Киффекс. Киффары. Тот, на балконе, тоже был киффар.
aayla: Я тебя найду.
hide all
-: Пока грузчики спорят у трапа, Эйла проскальзывает в трюм и прячется между ящиками.
cg pod
-: Между Киффу и Киффексом стражи Киффу открывают огонь. Корабль разваливается.
-: К тюремной планете уходит одна спасательная капсула.
cg off
goto ch2_start
` };
})(globalThis.Aayla98 = globalThis.Aayla98 || {});
