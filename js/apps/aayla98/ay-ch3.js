(function (A) {
  'use strict';
  A.Scripts = A.Scripts || {};
  A.Scripts.ch3 = { file: 'ay-ch3.js', start: 'ch3_start', src: `
@ch3_start
chapter ch3
bg temple_council day
music temple
show mace center robe calm
show tholme right robe calm
show aayla left robe calm lekku=still
mace: На Рилоте кризис. Правящий совет раскололся, и кланы просят у Ордена посредника.
tholme: Пол Секура погиб. По обычаю за главой клана в Светлые земли уходит один из его товарищей по совету. На этот раз очередь Ро Фенна.
mace: Ро Фенн никуда не пошёл. Он прячется, и половина совета делает вид, что так и надо.
face aayla sad lekku=down
aayla: Дядя Пол погиб из-за меня. Это я столкнула его с балкона.
choice
  > Признаться Толму, что ей страшно ехать. -> ch3_fear | bond.tholme+1
  > Сказать, что готова. -> ch3_ready
end

@ch3_fear
aayla: Мне страшно туда возвращаться, мастер.
tholme: Хорошо, что ты это говоришь вслух. Страх, о котором молчат, начинает решать за тебя.
goto ch3_plan

@ch3_ready
aayla: Я готова. Это мой клан, мне и разбираться.
tholme: Готовность и вина плохо уживаются вместе. Держи их порознь.
goto ch3_plan

@ch3_plan
tholme: Я буду говорить с советом. Ты войдёшь в дом Фенна рабыней. При слугах говорят свободно.
mace: Будь осторожна, падаван. В доме Фенна все твилеки, и лекку там читают лучше, чем слова.
hide all
bg fenn_feast night
music cover
cover servant
-: Лессу. Эйла входит в дом Ро Фенна в одежде рабыни. Так она узнаёт, какой была бы её жизнь, останься она на Рилоте.
cg servant
-: Подать, убрать, молчать. Слуг не замечают, и при них говорят обо всём.
cg off
show overseer right steward calm
show aayla left servant calm lekku=still
overseer: Новенькая? Риэла из Кала'уна. Кухня, зал, пол. Хозяин не любит грязи и разговоров.
choice lekku=overseer need=1
  > Поклониться молча. -> ch3_bow
  > [lie] Сказать, что прислуживала в доме совета. -> ch3_brag
end

@ch3_bow
-: Эйла кланяется. Надсмотрщик кивает, будто иначе и быть не могло.
goto ch3_house

@ch3_brag
if lekku_tell
face overseer angry
overseer: Лекку у тебя дёргаются, как у воровки. Работай и не ври.
set sus+15
else
overseer: В доме совета? Тогда не разобьёшь кувшин. Работай.
end
goto ch3_house

@ch3_house
hide all
-: Нужны три сведения: кого наняли, что задумано и когда. Без них к Толму идти не с чем.
map fenn_house

@ch3_maid
bg fenn_feast night
show maid right servant calm lekku=still
show aayla left servant calm lekku=still
if intel_maid
maid: Иди спать, Риэла. Завтра опять пир.
field
end
maid: Ты новенькая? Я тоже была новенькая. Три года назад.
maid: Тут два правила. Не смотри хозяину в глаза. И не ходи туда, где ковры.
choice lekku=maid need=2
  > Спросить, кого ждут по ночам. -> ch3_maid_ask
  > [lie] Сказать, что потеряла серьгу у покоев. -> ch3_maid_lie
  > Спросить, как она здесь оказалась. -> ch3_maid_story
end

@ch3_maid_story
maid: Отец продал за долги. Здесь хотя бы кормят.
aayla: А если бы ты могла уйти?
maid: Куда? В Светлые земли? Сюда хотя бы ветер не доходит.
-: Эйла вспоминает сундук с сетчатым комбинезоном. Не приди Вос, она бы до сих пор танцевала перед гостями дяди.
goto ch3_maid_ask

@ch3_maid_lie
if lekku_tell
maid: Серьгу? У тебя лекку дрожат. Не ври мне, Риэла. Мне незачем на тебя доносить.
set sus+10
else
maid: У покоев? Не ходи туда, там стража. Лучше спроси меня, я тут всё знаю.
end
goto ch3_maid_ask

@ch3_maid_ask
maid: Сегодня после второго пира хозяин велел не выходить из людской. Никому из рабов.
maid: А повар ворчал, что кормит двоих с Кинтана. Сидят в дальней комнате и ни с кем не говорят.
set intel_maid
-: Сведение: после второго пира рабы должны сидеть в людской. Ночью что-то случится.
field

@ch3_screen
cg servant
-: Эйла встаёт за ширмой с подносом. По ту сторону Ро Фенн и деваронец в потёртой куртке.
rofenn: Двое с Кинтана выйдут после второго пира. Твоё дело довезти их и груз.
stranger_devaronian: Груз маленький и шумный, я так понимаю. Шумные грузы стоят дороже.
rofenn: Получишь вдвое, если груз доедет живым.
stranger_devaronian: Я вожу всё, кроме налоговых инспекторов. Будет вам живой груз.
cg off
set intel_screen
-: Сведение: Ро Фенн нанял пилота-деваронца. Двоих с Кинтана и «груз» увезут после второго пира.
field

@ch3_study
bg fenn_study night
show aayla left servant afraid lekku=tense
-: На столе Ро Фенна датапад и схема дома Секура. Одно окно обведено.
-: В датападе письмо: «Отец, сделай, что должно. Мальчик исчезнет, Лон уступит совет мне, и тебе не придётся идти в Светлые земли. Х.»
aayla: Х'арис. Изгнанный сын Фенна. А окно на схеме... это детская Ната.
set intel_study
-: Сведение: Х'арис Фенн хочет власти в совете, а сына Лона Секуры заберут через окно детской.
field

@ch3_overseer
bg fenn_feast night
show overseer right steward calm
show aayla left servant calm lekku=still
if sus >= 50
face overseer angry
overseer: На тебя жалуются, Риэла. Ещё раз увижу без дела, продам на рудники.
else
overseer: Котлы, вино, пол. Успеешь до второго пира, получишь лишнюю миску.
end
choice
  > Спросить, кто хозяин дома. -> ch3_overseer_ask
  > Кивнуть и вернуться к работе. -> ch3_overseer_nod
end

@ch3_overseer_ask
set sus+5
overseer: Ро Фенн, глава клана и член совета. Рабыне больше знать не нужно.
field

@ch3_overseer_nod
set sus-5
-: Надсмотрщик отворачивается. Для него она уже часть стены.
field

@ch3_backdoor
if intel_screen && intel_study && intel_maid
goto ch3_report
end
-: У чёрного хода никого. Идти к Толму пока не с чем.
field

@ch3_exposed
bg fenn_feast night
show overseer right steward angry
show aayla left servant afraid lekku=tense
overseer: Стража! Эта рабыня шарит по дому!
-: Риэлу раскрыли. Тихо уйти больше не получится.
battle fenn_a none
if !intel_study
-: Эйла лезет по карнизу к окну кабинета, а по коридору уже бегут люди.
battle fenn_b none
set intel_study
-: Схема дома Секура и письмо Х'ариса. Окно детской обведено.
end
if !intel_screen
-: С крыши Эйла видит, как деваронец уходит к порту. Он говорит в комлинк: «после второго пира, двое с Кинтана».
set intel_screen
end
if !intel_maid
-: Служанка шепчет ей вслед из людской: «Сегодня ночью. Хозяин велел никому не выходить».
set intel_maid
end
goto ch3_report

@ch3_report
cover end
set xp+300
bg lessu_tunnels night
music ryloth
show tholme right robe calm
show aayla left servant resolute lekku=still
aayla: Ро Фенн нанял пилота и двоих с Кинтана. Сегодня ночью они заберут Ната через окно детской. Это затея Х'ариса.
tholme: Значит, Х'арис вернулся. Тогда это уже не переговоры. Идём в дом Секура, сейчас.
goto ch3_night

@ch3_night
bg secura_chamber night
music duel
-: Дом Секура. Детская Ната. Толм входит первым.
show tsyr right armor angry
show bok left armor angry
-: В комнате двое никто в тёмных доспехах. У каждого посох.
tsyr: Джиидай.
-: Толм зажигает клинок. Посох Цира встречает его, и клинок гаснет. Кортозис.
-: Толм падает. Цир поднимает посох для последнего удара.
hide all
show aayla left robe resolute lekku=tense
aayla: Стража! В детскую!
battle morgukai_night none
-: Моргукаи уходят в окно. У Цира на плече Нат. Толм поднимается, держась за стену.
show tholme right robe sad
tholme: Кортозис. Я слышал о нём, но встречать не доводилось. Клинок о него гаснет. Бей рукой, бей Силой.
goto ch3_port

@ch3_port
bg ryloth_port night
show tholme right robe resolute
show aayla left robe calm lekku=still
tholme: Их увезёт пилот, о котором ты слышала. Я проберусь на его корабль. Ты держись поодаль.
-: Толм уходит в тень у трапа «Инферно». Через минуту на борт поднимаются двое никто с мешком на плече.
-: Эйла идёт за деваронцем. Тот оглядывается, ухмыляется и взлетает.
aayla: Мастер на борту. Теперь он у них.
-: Эйла садится на камни у края площадки и закрывает глаза. Сила тянет её прочь с Рилота.
-: Утром она берёт место на первом же грузовике. Куда он летит, она узнаёт уже в трюме.
goto ch3_ordmantell

@ch3_ordmantell
bg ordmantell_junk day
music aayla
-: Орд-Мантелл. Свалка размером с город. Эйла и сама не знает, почему сошла здесь.
map ordmantell_junk

@ch3_junk_shots
-: За грудой металла стреляют. Между выстрелами кто-то смеётся. Смех знакомый.
field

@ch3_junk_vos
show vos right early resolute
show aayla left robe surprised lekku=up
vos: Падаван? Здесь? Становись рядом, их тут много.
set with_vos, met_vos
battle hunters_a none
cg junkyard
-: Последний охотник убегает за груду лома. Эйла и Вос стоят спиной к спине.
cg off
show vos right early smile
vos: Ты откуда здесь взялась?
aayla: Сила привела. Мастер Толм в плену, моргукаи увезли Ната Секуру. И ещё я хочу рассказать тебе всё. С самого Рилота.
-: Она рассказывает о дяде и глиттерилле, о Киффексе и Каркко, о «Интрепиде». Вос слушает и ни разу не перебивает.
bond vos
vos: Толма я вытащу из любой ямы. Деваронец на «Инферно»? Я его знаю. Это Вилли.
set xp+200
field

@ch3_villie
show villie right spacer smile
show vos left early calm
villie: Квинлан! И с тобой красивая твилечка. Это не к добру.
vos: Ты возил моргукаев, Вилли. И Толма вместе с ними.
villie: Я вожу всех, кто платит. Толм, кстати, не заплатил.
show aayla center robe resolute lekku=still
choice
  > Предложить ему сделку. -> ch3_villie_deal
  > Пригрозить. -> ch3_villie_threat | dark+2
  > Спросить, на кого он ставит. -> ch3_villie_bet | bond.villie+1
end

@ch3_villie_deal
aayla: Отвези нас туда, куда отвёз их. Орден заплатит.
villie: Орден платит медленно. Ладно, уговорили.
goto ch3_villie_go

@ch3_villie_threat
aayla: Или ты везёшь нас за ними, или объясняешь всё это Совету джедаев.
villie: Как грубо. Мне нравится. Летим.
goto ch3_villie_go

@ch3_villie_bet
aayla: Ты ведь ставишь на всё подряд. На кого сейчас: на двух никто или на двух джедаев?
villie: О, вот это разговор. Ставлю на вас. Немного. Но ставлю.
goto ch3_villie_go

@ch3_villie_go
-: Моргукаи улетели с Орд-Мантелла на Кинтан, родину никто. Там крепость Х'ариса Фенна. Вилли знает дорогу.
bond villie
goto ch3_flight

@ch3_flight
bg kintan_wastes day
music duel
-: Над Кинтаном «Инферно» встречает истребитель. В кабине Бок.
-: Вилли ругается и уступает штурвал Эйле.
flight kintan
sfx rocks
-: Истребитель Бока уходит в чёрные пески, волоча дым.
show villie right spacer surprised
villie: Где ты так летать научилась?
show aayla left robe thoughtful lekku=still
aayla: Не помню. Правда не помню.
set with_villie
map kintan_wastes

@ch3_villie_stays
show villie right spacer calm
villie: Дальше пешком. Я посторожу корабль. И свою ставку.
set !with_villie
field

@ch3_ambush
if sand_seen
-: Песок впереди шевелится. Эйла замечает это раньше, чем из него встают двое никто.
battle morgukai_wastes none
else
-: Песок взрывается прямо под ногами. Моргукаи ждали в засаде.
battle morgukai_wastes enemy
end
-: Цир и Бок отстают на склоне. Впереди красное зарево: река лавы.
field

@ch3_lava
bg kintan_lava dusk
show vos right early resolute
show aayla left robe afraid lekku=tense
vos: Камни через лаву. Я первый, ты за мной. Не останавливайся.
-: Вос перепрыгивает. Эйла разбегается, и Бок хватает её за ноги.
cg lava
-: Она прыгает Силой, и они перелетают реку вдвоём.
-: Цир стреляет в джедайку и попадает в сына. Бок падает на камень посреди лавы.
tsyr: Добыча уходит. Если ты мой сын, если ты настоящий моргукай, ты выберешься.
cg off
-: Цир уходит к крепости. Бок не может перепрыгнуть обратно.
goto ch3_fortress

@ch3_fortress
bg kintan_fortress night
music karkko
show vos right early resolute
show aayla left robe resolute lekku=still
vos: Цир будет ждать у ворот. Я займу его. Ты ищи Толма и мальчика.
aayla: А если Бок выберется?
vos: Тогда займу обоих.
set !with_vos
map kintan_fortress

@ch3_cell
bg kintan_fortress night
show nat center child surprised
show aayla left robe resolute lekku=tense
-: За дверью темницы гудит дроид. Толм лежит на полу без движения. В углу сидит мальчик-твилек.
nat: Он умер! Дроид сказал, что он умер!
-: AX/RX, медицинский дроид Х'ариса, поворачивает к ребёнку манипулятор со скальпелем.
battle axrx_boss none
-: Клинок Эйлы проходит по шее дроида. Голова AX/RX падает к ногам Толма.
show tholme right robe calm
tholme: Анзати научили меня останавливать сердце. Дроиду этого хватило.
show nat center child calm
nat: Когда умер Ван, я остался единственным наследником. Моя смерть ударила бы по отцу и по клану. Иногда я думаю, что отец хотел бы, чтобы вместо Вана умер я.
tholme: Твой отец сейчас ищет тебя по всему Рилоту. Пойдём, проверим, кто из нас прав.
set xp+300
goto ch3_edge

@ch3_edge
bg kintan_fortress night
-: Во дворе Вос стоит над телом Цира. Клинок Толма снова у Воса в руке.
-: Из тени выходит Бок, обожжённый лавой, и бьёт Воса посохом в спину. Вос падает.
show bok right armor angry
show aayla left robe resolute lekku=tense
bok: Отец ошибся. Добыча никуда не ушла.
battle bok_edge none
-: Бок стоит на краю обрыва и смотрит на обрубок руки.
choice
  > Добить. -> ch3_bok_kill | dark+5
  > Опустить клинок. -> ch3_bok_spare
end

@ch3_bok_kill
-: Эйла поднимает клинок. Бок смотрит на неё и делает шаг назад, в пропасть.
goto ch3_bok_fall

@ch3_bok_spare
-: Эйла гасит клинок. Бок смотрит на неё и делает шаг назад, в пропасть.
goto ch3_bok_fall

@ch3_bok_fall
-: Он падает молча. Внизу сотни метров камня.
show vos right early calm
vos: Спасибо. Он бы меня добил.
aayla: Он сам выбрал.
vos: Моргукаи всегда выбирают сами.
goto ch3_ryloth

@ch3_ryloth
bg secura_chamber day
music ryloth
show lon right robe smile
show nat center child smile
show aayla left robe calm lekku=still
-: Нат дома. Вилли прилетел к Лону Секуре раньше джедаев и велел ничего не делать, пока не будет вестей. Лон ждал.
lon: Совет больше не прячет Ро Фенна. Он пойдёт в Светлые земли. А Х'арис бежал к графу Дуку.
show tholme left robe smile
tholme: Ты храбро держался, Лон. То есть Нат. Прости, мальчик.
-: Толм в первый раз за всё задание смеётся над собой.
hide tholme
show aayla left robe sad lekku=down
aayla: Дядя Лон... Пол был вашим братом. Я...
lon: Я знаю, что было на балконе. Пол сам поил тебя глиттериллом. А ты вернула мне сына.
bond secura
goto ch3_knight

@ch3_knight
bg temple_council day
music temple
cg knighting
-: Корусант. Совет джедаев посвящает Эйлу Секуру в рыцари. Квинлан Вос становится мастером.
cg off
show vos right early smile
show aayla left robe laugh lekku=up
vos: Рыцарь Секура. А я помню, как ты пряталась от вампы.
aayla: Теперь и я это помню.
set xp+300
respite p2
bg temple_garden dusk
show aayla left robe thoughtful lekku=still
-: Дальше годы идут быстрее, чем задания. Совет посылает рыцаря Секуру то на одну планету, то на другую.
respite p3
bg temple_pad dusk
show aayla left robe resolute lekku=still
-: 22 ДБЯ. На Джеонозисе вот-вот начнётся то, что потом назовут Войнами клонов.
goto ch4_start

@rs_meditate_p2
bg temple_garden day
music temple
show vos right early calm
show aayla left robe calm lekku=still
-: В Саду медитаций Вос сидит на камне у воды. Он не медитирует, он ест фрукт.
vos: Медитируй, рыцарь. Я тихо.
-: Эйла медитирует. Тьма уходит из неё, как вода из треснувшей чаши.
memory palace
vos: Ну как? Стало тише?
aayla: Стало. Пока ты не заговорил.
return

@rs_meditate_p3
bg temple_garden dusk
music temple
show aayla left robe calm lekku=still
-: Эйла медитирует в Саду медитаций. Вос далеко, Толм занят, вода шумит ровно, как и год назад.
-: Тьма отступает. Обрывки памяти встают на свои места чуть ровнее.
memory palace
return

@rs_archive_ch4
bg temple_archive night
music temple
show aayla left robe thoughtful lekku=still
-: Архив Башни первого знания. Эйла читает донесения о недовольных системах.
-: Граф Дуку ушёл из Ордена вскоре после битвы за Набу. Теперь вокруг него собираются системы, которые хотят выйти из Республики.
-: Торговая федерация так и не распустила армию боевых дроидов. Против дроидов работают ион и отражённые выстрелы, страх на них не действует.
aayla: Если дойдёт до войны, драться придётся с машинами.
-: Архив: в следующем задании слабости врагов видны с первого хода.
return

@tr_djemso
bg respite
music temple
show tholme right robe calm
show aayla left robe resolute lekku=still
if respite == p2
tholme: Атару хорош, пока ты двигаешься. Моргукаи показали, что бывает, когда двигаться некуда.
else
tholme: Годы идут, а ты всё прыгаешь. Попробуем стоять.
end
tholme: Джем-Со. Принимаешь удар клинком, и вся его сила уходит в твой ответ.
-: Толм бьёт раз за разом. Эйла принимает удары и отвечает. К вечеру её ответы начинают опережать его удары.
-: Джем-Со: стойка до своего хода. Принятый удар даёт Темп, на удар вблизи Эйла отвечает клинком.
return
` };
})(globalThis.Aayla98 = globalThis.Aayla98 || {});
