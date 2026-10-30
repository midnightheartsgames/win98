(function (A) {
  'use strict';
  A.Scripts = A.Scripts || {};
  A.Scripts.ch5 = { file: 'ay-ch5.js', start: 'ch5_start', src: `
@ch5_start
chapter ch5
bg taskforce_bridge night
music temple
-: 22 ДБЯ. У Кореллианского торгового хребта пропадают суда Республики. Налётчики знают маршруты конвоев заранее.
-: Совет посылает оперативную группу: мастера Толм, Т'ра Саа, Кит Фисто, Ан'йа Куро и мастер Эйла Секура.
show traa right robe calm
show aayla left robe calm lekku=still
-: Т'ра Саа ждёт вызова от давней подруги, сенатора Элсы'сай'Моро с Деварона.
elsah: Т'ра, налётчики сидят на Девароне. Я знаю, кто сливает им маршруты. Это...
-: Голограмма вздрагивает. За спиной Элсы мелькает рыжая женщина с антенной на голове. Выстрел. Связь обрывается.
face traa sad
traa: Элса...
show kuro center robe calm
kuro: Антенна в черепе. Такую охотницу я знаю одну. Когда-то я её учила.
choice
  > Положить руку на плечо Т'ра Саа. -> ch5_traa_comfort | bond.traa+1
  > Спросить Куро об охотнице. -> ch5_kuro_ask
end

@ch5_traa_comfort
aayla: Мне жаль, мастер.
traa: Нети живут долго и теряют многих. К этому не привыкают. Спасибо, Эйла.
goto ch5_holo

@ch5_kuro_ask
aayla: Кто она?
kuro: Аурра Синг. Охотница на джедаев. Её бросили все, и меня она ненавидит больше остальных.
goto ch5_holo

@ch5_holo
hide all
bg taskforce_bridge night
show tholme right robe sad
show aayla left robe calm lekku=still
tholme: Эйла. Тебе нужно это увидеть. Пришло через мою сеть.
cg vos_holo
vos: Я ушёл к Конфедерации. Орден держит меня на поводке, Дуку его снял. Не ищите меня.
-: Голограмма гаснет. Толм молчит и смотрит в пол.
cg off
set letgo.vos+1
choice
  > Сказать, что не верит. -> ch5_holo_doubt | bond.vos+1
  > Отпустить его. -> ch5_holo_letgo | bond.tholme+1
  > Спросить, знал ли Толм. -> ch5_holo_ask
end

@ch5_holo_doubt
aayla: Это не он. Квинлан никогда бы так не сказал.
tholme: Люди меняются, Эйла. Даже он.
goto ch5_plan

@ch5_holo_letgo
aayla: Если он выбрал, я не могу выбрать за него. Пусть идёт.
tholme: Ты стала сильнее, чем я думал.
goto ch5_plan

@ch5_holo_ask
aayla: Вы знали, мастер?
tholme: Я знал, что он молчит. Остальное знает только он.
-: Толм отворачивается слишком быстро.
goto ch5_plan

@ch5_plan
hide all
show kit right robe smile
show aayla left robe calm lekku=still
kit: Элса успела сказать главное: база налётчиков на Девароне. Мы с Т'ра Саа останемся на орбите.
show tholme center robe calm
tholme: А мы спустимся к сенатору Вьен'сай'Маллок. Ты будешь Туулаа Донитой, избалованной дочерью твилекского судовладельца.
tholme: Мы с Куро пойдём твоими слугами. Я Майлз Крофт, она Саба. Приказывай нам, как приказывала бы наследница.
aayla: Приказывать вам? Мастер, это будет самое трудное задание в моей жизни.
hide all
bg devaron_suite day
music cover
cover tuulaa
-: Деварон. Дом сенатора стоит на скале над городом. Туулаа Донита сходит с корабля в бело-лиловом платье.
-: Нужно узнать три вещи: кто сливает маршруты, где база и кто убил Элсу. И тратить деньги: наследницы не скупятся.
map devaron_suite

@ch5_jeweler
bg devaron_suite day
show aayla left tuulaa calm lekku=still
if jewel_earrings && jewel_pin
jeweler: Госпожа, всё лучшее в моей лавке уже ваше.
field
end
jeweler: Госпожа Донита! Кристаллы с Мимбана, серебро с Корусанта. Для такой гостьи у меня найдётся всё.
if credits >= 80
goto ch5_jeweler_buy
end
-: Кошелёк наследницы пуст. Ювелир улыбается всё вежливее.
field

@ch5_jeweler_buy
choice
  > Купить серьги за восемьдесят кредитов. -> ch5_buy_earrings | credits-80 spent+1 sus-15 jewel_earrings
  > Купить шпильку за пятьдесят. -> ch5_buy_pin | credits-50 spent+1 sus-12 jewel_pin
  > Скривиться и уйти. -> ch5_jeweler_snub | sus-5
end

@ch5_buy_earrings
-: Туулаа примеряет серьги, морщится и всё равно берёт. Вся галерея видит, как она платит.
field

@ch5_buy_pin
-: Шпилька с кристаллом ложится в волосы между лекку. Ювелир кланяется.
field

@ch5_jeweler_snub
aayla: На Рилоте такие кристаллы дарят служанкам.
jeweler: Госпожа шутит. Госпожа непременно вернётся.
field

@ch5_tailor
bg devaron_suite day
show aayla left tuulaa calm lekku=still
if bought_gown
-: Портной снимает мерки с другой гостьи и делает вид, что не замечает наследницу.
field
end
-: Портной раскладывает шелка. На каждом ценник, от которого у рыцаря-джедая закружилась бы голова.
if credits >= 60
goto ch5_tailor_buy
end
-: Денег на шелка уже нет. Туулаа фыркает и уходит, будто шелка ей не понравились.
field

@ch5_tailor_buy
choice
  > Заказать платье за шестьдесят кредитов. -> ch5_buy_gown | credits-60 spent+1 sus-15 bought_gown
  > Потребовать скидку, раз она дочь судовладельца. -> ch5_tailor_haggle | sus-5
end

@ch5_buy_gown
-: Туулаа заказывает платье и громко объясняет, каким оно должно быть. Портной всё записывает и кланяется.
field

@ch5_tailor_haggle
aayla: Мой отец возит шёлк тоннами. Неужели я буду платить, как все?
-: Портной смеётся. Наследницы торгуются ради удовольствия, это все знают.
field

@ch5_saba
bg devaron_suite day
show saba right servant calm
show aayla left tuulaa calm lekku=still
if intel_route
saba: Что ещё угодно госпоже?
field
end
saba: Госпожа звала?
choice
  > Велеть ей подслушать у кабинета сенатора. -> ch5_saba_rude | sus-5
  > Вежливо попросить её помочь. -> ch5_saba_polite | sus+10
end

@ch5_saba_rude
aayla: Саба, мне скучно. Постой у кабинета сенатора и запомни, о чём там говорят. Потом расскажешь.
saba: Как прикажет госпожа.
-: Куро уходит, опустив голову, как настоящая служанка. Слуг здесь не замечают.
goto ch5_saba_back

@ch5_saba_polite
aayla: Мастер, если вам не трудно, послушайте у кабинета сенатора.
-: Служанка сенатора, проходившая мимо, удивлённо оглядывается. Наследницы так со слугами не говорят.
saba: Сделаю. Только не зови меня мастером при людях.
goto ch5_saba_back

@ch5_saba_back
-: Через час Куро возвращается со стопкой полотенец.
saba: Сенатор каждый вечер говорит с кем-то на частоте Синих гор. Называет даты и маршруты конвоев.
set intel_route
-: Сведение: маршруты конвоев налётчикам отдаёт сама сенатор Вьен'сай'Маллок.
field

@ch5_miles
bg devaron_suite day
show miles right servant calm
show aayla left tuulaa calm lekku=still
if intel_route && intel_mountains && intel_hunter
goto ch5_masters_go
end
if intel_mountains
miles: Госпожа желает чего-нибудь ещё?
field
end
miles: Госпожа звала?
choice
  > Послать его в город за сплетнями. -> ch5_miles_rude | sus-5
  > Спросить, что он предлагает. -> ch5_miles_ask
end

@ch5_miles_rude
aayla: Майлз, сходи в город. Купи мне сладостей и узнай, о чём болтают в порту.
miles: Сию минуту, госпожа.
goto ch5_miles_back

@ch5_miles_ask
aayla: Что ты предлагаешь?
miles: Слуги в порту знают больше, чем сенаторы. Отпустите меня за покупками, госпожа.
goto ch5_miles_back

@ch5_miles_back
-: К вечеру Толм возвращается с кульком сладостей.
miles: В порту говорят, что по ночам шаттлы летят к Синим горам. Хотя в горах никто не живёт.
set intel_mountains
-: Сведение: база налётчиков где-то в Синих горах.
field

@ch5_senator
bg devaron_suite day
show malloc right senator smile
show aayla left tuulaa calm lekku=still
if senator_met
malloc: Вам удобно, дорогая? Скажите слугам, если чего-нибудь не хватает.
field
end
set senator_met
malloc: Госпожа Донита! Мой дом в вашем распоряжении. Отец здоров? Как верфи?
choice
  > Пожаловаться на деваронский климат. -> ch5_senator_whine | sus-5
  > Спросить о гибели сенатора Элсы. -> ch5_senator_elsa | sus+10
  > Похвалить её дом. -> ch5_senator_praise
end

@ch5_senator_whine
aayla: Здесь так сухо! Мои лекку уже трескаются. На Рилоте хотя бы дуют ветра.
malloc: Бедняжка. Я велю принести вам масла с Альдераана.
field

@ch5_senator_elsa
aayla: Говорят, в Сенате убили вашу коллегу. Это правда?
face malloc angry
malloc: Ужасная история. Но вам, дорогая, незачем об этом думать. Это политика.
-: Сенатор улыбается снова, но в улыбке что-то изменилось.
field

@ch5_senator_praise
aayla: Какой у вас дом! Отец удавится от зависти.
malloc: Передайте ему, что Деварон всегда рад богатым друзьям.
field

@ch5_desk
bg devaron_suite day
show aayla left tuulaa afraid lekku=tense
if intel_route
-: На столе всё как прежде. Маршруты Эйла уже знает.
field
end
-: В кабинете пусто. На столе датапад сенатора, а в нём таблица: даты, суда, проценты.
-: Маршруты республиканских конвоев. И пометка: «доля для Синих гор».
set intel_route
-: Сведение: маршруты налётчикам отдаёт сама сенатор.
field

@ch5_hunter
bg devaron_suite day
show aayla left tuulaa surprised lekku=tense
-: Дверь кабинета открывается. Выходит женщина с алебастровой кожей и рыжим пучком волос. Из черепа торчит антенна.
-: Женщина скользит взглядом по наследнице, как по мебели, и уходит к выходу на террасу.
aayla: Та самая, с голограммы. Она здесь, в доме сенатора.
set intel_hunter
-: Сведение: охотница, убившая Элсу, работает на сенатора.
field

@ch5_masters_go
bg devaron_suite night
music cover
show miles right servant calm
show saba center servant calm
show aayla left tuulaa thoughtful lekku=still
miles: Сенатор, Синие горы, охотница. Всё сходится. Мы с Куро ночью пойдём в горы и найдём базу.
aayla: А я?
miles: А ты останешься Туулаей. Если сенатор что-то заподозрит, лучше пусть смотрит на тебя.
saba: Не скучай, госпожа.
hide all
-: Ночью Толм и Куро уходят в горы. Утром их нет. Комлинк молчит.
-: Эйла идёт к сенатору. Туулаа так не ходит: быстро и не глядя по сторонам.
goto ch5_confront

@ch5_confront
bg devaron_suite day
show malloc right senator smile
show aayla left tuulaa resolute lekku=tense
malloc: Вы рано, дорогая. Что-то случилось со слугами?
choice
  > Сбросить роль. -> ch5_confront_jedi
  > Сыграть наследницу до конца. -> ch5_confront_heiress
end

@ch5_confront_jedi
aayla: Я Эйла Секура, мастер-джедай. Я видела ваши маршруты и вашу охотницу. Где база?
face malloc angry
malloc: Джедай под моей крышей. Как неловко. Что ж, ищите в Синих горах, в ущелье за водопадом. Если найдёте.
goto ch5_confront_end

@ch5_confront_heiress
aayla: Мои слуги пропали в Синих горах. Отец будет в ярости, если я вернусь без них. Где эти горы?
malloc: Ущелье за водопадом, дорогая. Ваши слуги наверняка там. Идите, не бойтесь.
-: Сенатор улыбается так, будто отправляет гостью на прогулку. Эйла понимает: её отправляют в ловушку.
goto ch5_confront_end

@ch5_confront_end
cover end
set xp+100
hide all
bg devaron_hills dusk
music karkko
-: Синие горы. Эйла снимает платье наследницы и надевает робу. Где-то здесь база налётчиков. И её мастера.
map devaron_base

@ch5_exposed
bg devaron_suite day
music duel
show aayla left tuulaa afraid lekku=tense
dguard: Эта наследница не та, за кого себя выдаёт! Взять её!
-: Стража сенатора бежит со всех сторон. Тихо уже не получится.
battle devaron_guards none
if !intel_route
-: В кабинете сенатора Эйла хватает датапад: маршруты конвоев и доля для Синих гор.
set intel_route
end
if !intel_mountains
-: Пилот у посадочной площадки сам рассказывает про ночные шаттлы к Синим горам.
set intel_mountains
end
if !intel_hunter
-: На террасе мелькает рыжий пучок волос и антенна. Охотница уходит к горам.
set intel_hunter
end
goto ch5_masters_go

@ch5_cave
bg devaron_base night
music duel
show aayla left robe resolute lekku=tense
-: Свежий завал у пещеры. Из-под камней доносится голос Толма: «Эйла, это ловушка!»
show aurra right hunter smile
aurra: Таких, как я, в галактике нет! Я правосудие! Я погибель джедаев!
aurra: Я снюсь их падаванам. Я выпью твой страх и пролью твою кровь. Я Аурра Синг!
battle aurra_duel none
cg antenna
-: Клинок Эйлы проходит над головой Аурры. Антенна падает в пыль.
cg off
show aurra right hunter angry
show aayla left robe calm lekku=still
aurra: Без неё я ничего не чую... Ты отняла у меня всё!
choice
  > Сказать, что её не бросали, она ушла сама. -> ch5_aurra_truth
  > Пожалеть её. -> ch5_aurra_pity | dark-3
  > Промолчать. -> ch5_aurra_silent
end

@ch5_aurra_truth
aayla: Тебя никто не бросал, Аурра. Ты сама выбрала ненависть. Каждый день выбирала.
aurra: Тебе легко говорить. Тебя всегда кто-то ловил.
goto ch5_aurra_end

@ch5_aurra_pity
aayla: Мне жаль, что с тобой так поступили. Правда жаль.
aurra: Жалость джедаев. Худшее, что у вас есть.
goto ch5_aurra_end

@ch5_aurra_silent
-: Эйла молчит. Аурра отводит глаза первой.
goto ch5_aurra_end

@ch5_aurra_end
hide all
-: Эйла разбирает завал Силой, камень за камнем. Толм и Куро выбираются на свет, покрытые пылью.
show kuro right robe calm
show aayla left robe calm lekku=still
kuro: Она была моей ученицей. Я не смогла её удержать. Ты смогла её остановить.
-: Аурру передают деваронским властям. Её отправят в тюрьму на Ову IV.
set xp+200
goto ch5_raid

@ch5_raid
bg devaron_base day
music battle
show kit right robe resolute
show traa center robe calm
show aayla left robe resolute lekku=tense
-: Эйла передаёт на орбиту всё, что узнала. Кит и Т'ра Саа спускаются с отрядом Республики.
kit: Маршруты, база, сенатор. Ты за три дня сделала больше, чем флот за месяц.
traa: Элса просила найти предателя. Теперь она может спать спокойно.
set with_kit
set with_traa
battle raiders_final none
set !with_kit
set !with_traa
-: Налётчики бегут из Синих гор. Сенатора Вьен'сай'Маллок арестовывают в её доме.
set xp+200
respite p5
goto ch5_after

@ch5_after
bg taskforce_bridge night
music aayla
show aayla left robe thoughtful lekku=still
-: Корабль идёт к Корусанту. Мастера разошлись по каютам.
if rank.traa >= 2
bond traa
end
if rank.kit >= 3
bond kit
end
goto ch5_cavamina

@ch5_cavamina
bg cavamina_cantina night
music cover
hide all
-: 21 ДБЯ. Луна Кавамина-Минор. Эйла с отделением элитных клонов должна арестовать наёмника Аттуму Дуума.
show aayla left robe calm lekku=still
clonesgt: Люди Дуума ждут нас в кантине, генерал. Мы прикроем вход.
aayla: Без нужды не стрелять. Дуум нужен живым.
hide all
-: В кантине тихо. Слишком тихо. Бармен смотрит не на неё, а на дверь за её спиной.
battle cavamina_cantina none
-: Клонов больше нет. Эйла одна прорывается к своей «Дельте-7Б».
-: Над лесом её сбивают. Последнее, что она успевает, это сигнал бедствия на канале Дельта-622-Эхо.
goto ch5_forest

@ch5_forest
bg cavamina_forest day
music duel
show aayla left robe afraid lekku=tense
-: Эйла выбирается из обломков. По лесу идут наёмники во главе с рыжим человеком со шрамом через глаз.
sabat: Сабат, начальник охраны Аттумы Дуума. Беги, джедай. Мне нравится, когда бегут.
-: Из леса выходят люди в простых одеждах. Впереди высокий человек без светового меча.
show shonju center robe calm
shonju: Сабат. Можешь уйти. Можешь драться. Выбирай.
battle forest_sabat none
hide all
cg shonju
-: Шон-Джу склоняется над Эйлой. Последнее, что она видит, это его ладони, светящиеся Силой.
cg off
rest
goto ch5_castle

@ch5_castle
bg shonju_castle day
music aayla
show aayla left robe calm lekku=still
-: Эйла просыпается в каменном зале. Раны перевязаны. Во дворе ученики бьют воздух ладонями, и воздух гудит.
show shonju right robe calm
shonju: Меня зовут Шон-Джу. Это мои ученики. Тех, кого Орден не взял или выгнал.
aayla: Вы учились в Храме?
shonju: Учился. Мне сказали, что я вижу в Силе оружие. И что рыцарем я не стану никогда.
shonju: Я выбросил световой меч. Теперь Сила идёт через руки. Я учусь у своих учеников не меньше, чем они у меня.
choice
  > Сказать, что Орден ошибся. -> ch5_castle_wrong
  > Сказать, что Орден, может быть, был прав. -> ch5_castle_right
  > Спросить о Дууме. -> ch5_castle_duum
end

@ch5_castle_wrong
aayla: Может быть, Орден ошибся. Мастера тоже ошибаются.
shonju: Ты первая джедайка, которая это говорит.
goto ch5_castle_plan

@ch5_castle_right
aayla: Сила не оружие. Может, они видели то, чего не видели вы.
face shonju angry
shonju: Они видели мальчика, которого проще выгнать, чем понять.
goto ch5_castle_plan

@ch5_castle_duum
aayla: Мне нужно найти Дуума. У вас есть связь?
shonju: Связи нет. Но Дуум нужен и мне. Он наживается на войне, а мои ученики на этой луне живут.
goto ch5_castle_plan

@ch5_castle_plan
shonju: Утром угоним бомбардировщики Сабата. База Дуума в поясе астероидов, мы долетим туда за час.
aayla: Вместе?
shonju: Вместе.
goto ch5_hq

@ch5_hq
bg duum_hq night
music cover
show shonju right robe calm
show aayla left robe resolute lekku=tense
-: Бомбардировщики садятся в ангаре станции. Охрана принимает их за своих.
-: На полпути к пульту Шон-Джу вдруг бьёт ладонью по сигнальной панели. Воет тревога.
aayla: Что вы делаете?!
shonju: Так быстрее. Нас приведут прямо к Дууму.
hide shonju
battle duum_guards none
-: Из-за угла выходит Сабат. Он держит у виска Шон-Джу бластер.
sabat: Брось клинок, джедай. Или твой друг останется без головы.
-: Эйла опускает клинок.
hide all
show duum right merc smile
show aayla left robe angry lekku=tense
-: Их связывают в зале у турбины. Приходит Аттума Дуум и забирает её клинок.
duum: За джедая дадут хороший выкуп. За двух ещё лучше.
duum: А пока смотрите. Я позвал сюда флоты Республики и Конфедерации. Между ними мои мины.
hide duum
-: Дуум уходит смотреть на свой фейерверк. Сабат следит за пленниками и за экраном.
show shonju right robe angry
shonju: Я убью Дуума, Эйла. Джедаи не смогли его поймать. Пусть вся галактика знает, кто смог.
-: Путы на руках Шон-Джу лопаются. Он бросается на Сабата и швыряет его в турбину. Грохот, вспышка, огонь.
shonju: Твоя судьба в твоих руках, джедай. Только не мешай мне.
hide all
-: Огонь ползёт по залу к Эйле. Она закрывает глаза и тянется к Силе. Путы рвутся.
map duum_hq

@ch5_fire_fail
-: Огонь отрезает дорогу. Эйла отступает туда, где начала, и ищет другой путь.
map duum_hq

@ch5_control
bg duum_hq night
music duel
show shonju right robe angry
show aayla left robe resolute lekku=tense
-: Пульт управления горит. Аттума Дуум лежит у стены: под разорванной одеждой металл. Он киборг.
-: Шон-Джу заносит ладонь для последнего удара.
aayla: Хватит! Он под моей стражей.
shonju: Ты выбрала свой путь, джедай. Так иди по нему до конца.
battle shonju_duel none
hide all
cg laugh
-: Шон-Джу держал её за лекку, и она смеялась. Теперь он стоит в огне без рук.
cg off
show shonju right robe angry
shonju: Вы, джедаи, всё у меня отнимаете! Сколько вам ещё нужно?
-: Он убегает в пламя. Пока они дрались, Дуум исчез.
hide shonju
show aayla left robe sad lekku=down
-: Станция разваливается. Эйла добирается до ангара и угоняет последний бомбардировщик.
set xp+200
goto ch5_yoda

@ch5_yoda
bg temple_garden day
music temple
show yoda right robe calm
show aayla left robe sad lekku=down
aayla: Клоны погибли. Дуум ушёл. Шон-Джу... я отняла у него руки, мастер.
yoda: Трагичны события были, да, но провалом задание твоё не стало. Уничтожено дело Дуума.
yoda: И перемену в тебе я чувствую, Эйла Секура.
cg found
face aayla calm lekku=still
aayla: Да... может быть. Наверное, я нашла в себе то, чего не хватало.
cg off
set found_self
set xp+100
respite p6
goto ch6_start

@rs_meditate_p5
bg taskforce_medbay night
music temple
show aayla left robe calm lekku=still
-: В медотсеке тихо, только гудят приборы. Эйла садится на пустую койку и закрывает глаза.
-: Тьма отступает. Аурра где-то далеко кричит в пустоту, но здесь её не слышно.
memory palace
return

@rs_meditate_p6
bg temple_garden day
music temple
show yoda right robe calm
show aayla left robe calm lekku=still
-: Йода сидит у воды. Он ничего не спрашивает о Кавамине-Минор.
yoda: Отдохни. Нужна ты будешь скоро.
-: Эйла медитирует. Тьма уходит, обрывки памяти ложатся на свои места.
memory palace
return

@rs_archive_ch6
if respite == p5
bg taskforce_bridge night
else
bg temple_archive night
end
music temple
show aayla left robe thoughtful lekku=still
-: Донесения о мандалорских протекторах у Нью-Холстиса. И ещё одно, короткое: на Хоногре, планете ногри, пропал отряд генерала Рии'ке Эна.
-: Ногри. Маленькие, быстрые, бьют из засады и травят клинки. Разум их почти не берёт.
aayla: Если пошлют туда, надо брать противоядие.
-: Архив: в следующем задании слабости врагов видны с первого хода.
return

@tr_push3
bg respite
music temple
show aayla left robe resolute lekku=still
-: Грузовой контейнер весит больше, чем десять дроидов. Эйла толкает раз, другой. На третий он едет через весь отсек.
-: Толчок III: бьёт вдвое сильнее и тяжёлого врага сдвигает с первого раза.
return
` };
})(globalThis.Aayla98 = globalThis.Aayla98 || {});
