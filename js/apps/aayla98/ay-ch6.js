(function (A) {
  'use strict';
  A.Scripts = A.Scripts || {};
  A.Scripts.ch6 = { file: 'ay-ch6.js', start: 'ch6_start', src: `
@ch6_start
chapter ch6
bg holstice_hospital day
music temple
-: 20 ДБЯ. Нью-Холстис, мир госпиталей. Здесь стоит памятник всем джедаям, павшим со дня основания Республики.
show bly right phase1 calm
show aayla left robe calm lekku=still
bly: Мандалорцы отступают по всему фронту, генерал Секура. Но в строю шестьдесят процентов.
aayla: Знаю, коммандер. Пока с Камино не пришлют пополнение, будем обходиться тем, что есть.
bly: Другим частям не легче, я понимаю. Просто докладываю.
choice
  > Спросить, кого потеряли. -> ch6_losses | bond.bly+1
  > Поблагодарить корпус. -> ch6_thanks
end

@ch6_losses
aayla: Кого мы потеряли, Блай?
bly: Список будет к вечеру, генерал. Вы его прочтёте, я знаю. Не все генералы читают.
goto ch6_hospital

@ch6_thanks
aayla: Передай корпусу: мандалорцы бегут, потому что вы стояли.
bly: Передам, генерал. Им это нужно.
goto ch6_hospital

@ch6_hospital
hide all
bg holstice_hospital day
show tholme right robe sad
show aayla left robe calm lekku=still
-: В госпитале тихо. Т'ра Саа плавает в баке с бактой. На Нулле она защищала полевой госпиталь, и наёмники Конфедерации сожгли её почти целиком.
-: Толм сидит у бака. Похоже, он сидит здесь давно.
aayla: Мастер. Как она?
tholme: Нети живут долго и заживают медленно. Она поправится. А меня там не было.
choice
  > Сказать, что он не смог бы её спасти. -> ch6_tholme_blame
  > Молча сесть рядом. -> ch6_tholme_sit | bond.tholme+1
end

@ch6_tholme_blame
aayla: Вас послали на другое задание. Вы не могли быть в двух местах сразу.
tholme: Головой я это понимаю. Сердцем пока нет.
goto ch6_secret

@ch6_tholme_sit
-: Эйла садится рядом. Они долго смотрят, как в баке поднимаются пузырьки.
tholme: Спасибо. Иногда лучше, когда ничего не говорят.
goto ch6_secret

@ch6_secret
tholme: Эйла, ты должна знать правду о Квинлане. Он не предавал Орден.
tholme: Это мой план. Квинлан ушёл к Дуку двойным агентом, чтобы шпионить за ним изнутри. Совет знал.
face aayla surprised lekku=tense
choice
  > Спросить, почему он молчал. -> ch6_secret_why
  > Обрадоваться: Вос не предатель. -> ch6_secret_glad | bond.vos+1
end

@ch6_secret_why
aayla: Почему вы молчали, мастер? Даже когда показали мне голограмму?
tholme: Чтобы Дуку поверил, должны были поверить все. Ты тоже.
goto ch6_secret_end

@ch6_secret_glad
aayla: Значит, он не ушёл. Он всё это время был с нами.
tholme: Был. Я надеюсь, что и сейчас с нами.
goto ch6_secret_end

@ch6_secret_end
face tholme sad
tholme: Йода тогда сказал мне: опасна игра, которую ведёт Квинлан. Для него опаснее всего. Тем, кем притворяешься, стать можешь.
tholme: Он убивал по приказу Дуку, Эйла. Я боюсь, что он пал по-настоящему.
aayla: Если он пал, я его верну.
tholme: Если пал, я сам найду его и позову тебя. А пока тебя ждёт твой корпус.
set xp+50
respite p7
goto ch6_honoghr

@ch6_honoghr
hide all
bg honoghr_forest day
music karkko
show bly right phase2 calm
show aayla left robe resolute lekku=still
-: Хоногр. Над планетой подбили сепаратистский корабль «Гахенна». Он вёз на Набу новый яд, тысяча сто тридцать восьмой.
-: «Гахенна» упала в лес и снесла вершину самой высокой горы. Яд течёт в почву, и лес умирает.
-: У Блая новая броня, фаза II. Он ещё ни разу в ней не воевал.
bly_thinks: Броня держит выстрел. Голову она не держит. Голову держит задание.
bly_thinks: Генерал Рии'ке Эн пошёл за сепаратистами вниз. Думал только о доказательствах: яд и то, зачем он сепаратистам. Это стоит уважения.
bly_thinks: Эн нашёл контейнер с данными о яде в ракатанском храме. Ногри унесли его туда с обломков. Генерал велела Эну не показываться, пока не придём мы.
bly_thinks: Ногри уже убили всех, кто сюда спустился, республиканцев и сепаратистов. Эн успел передать, что его заметили. На этом связь оборвалась.
aayla: Тихо идём, Блай. Ногри видят в этом лесу лучше нас.
bly: Есть, генерал. Отделение, за мной. Смотреть на деревья.
set with_bly
map honoghr_forest

@ch6_en_trail
bg honoghr_forest day
show aayla left robe sad lekku=down
-: На камнях разложены белые пластины брони. Шлемы клонов, наплечники, перчатки. Ногри развешивают их, как трофеи.
bly_thinks: Ногри убивают всех, кто приходит с неба. Им всё равно, какой на нём цвет.
field

@ch6_ambush
bg honoghr_forest day
music duel
show bly right phase2 resolute
show aayla left robe resolute lekku=tense
-: Ступени ракатанского храма уже видны сквозь мёртвые ветви. И тут лес оживает.
bly: Ногри! На деревьях! Отделение, круговая оборона!
battle honoghr_ambush enemy
set squad_lost
hide all
show bly right phase2 sad
show aayla left robe angry lekku=tense
-: Блай ставит бойца в заслон у входа: если тот упадёт, его место займёт следующий.
bly_thinks: К дверям храма от отделения остаёмся мы двое. Генерал и я.
battle temple_horde none
goto ch6_vos

@ch6_vos
hide all
bg honoghr_temple night
music karkko
show vos right clonewars calm
show bly center phase2 angry
show aayla left robe surprised lekku=tense
-: Человек с бластером выходит из темноты. Последний ногри падает у его ног.
vos: Здравствуй, Эйла. Ты всегда умела найти неприятности.
bly: Вос. Предатель. Генерал, отойдите, я его сниму.
choice
  > Приказать Блаю опустить оружие. -> ch6_order | bond.bly-1
  > Спросить Воса, на чьей он стороне. -> ch6_ask_side
end

@ch6_order
aayla: Коммандер, оружие вниз. Это приказ.
bly: Есть, генерал.
bly_thinks: Приказ есть приказ. Но палец я с крючка не убираю.
goto ch6_ask_side

@ch6_ask_side
aayla: Квинлан. На чьей ты стороне?
vos: На твоей, как всегда. Я двойной агент, Толм же тебе сказал. Дуку думает, что я его человек.
vos: Мне нужен этот контейнер не меньше вашего. Помогу его забрать, а Дуку скажу, что опоздал.
choice
  > Поручиться за Воса. -> ch6_vouch | bond.vos+1 vouched
  > Взять его с собой, но следить. -> ch6_watch
end

@ch6_vouch
aayla: Я ему верю, Блай. Он пойдёт с нами.
bly: Как скажете, генерал.
bly_thinks: Она ему верит. Я верю ей. Ему я не верю. Это у меня от Джанго Фетта, так говорят инструкторы.
goto ch6_temple

@ch6_watch
aayla: Пойдёшь впереди, Квинлан. И руки держи на виду.
vos: Ты стала строже. Мне это нравится.
bly_thinks: Генерал знает, что делает. Но держит его на виду. Правильно держит.
goto ch6_temple

@ch6_temple
hide all
set with_vos
set xp+80
-: Втроём они уходят в глубину храма. Ногри стерегут центральный зал, а древние стражи храма всё ещё ходят по коридорам.
map honoghr_temple

@ch6_en_body
bg honoghr_temple night
show aayla left robe sad lekku=down
-: У стены лежит человек в коричневой робе. Рядом рукоять светового меча с зелёным кристаллом.
-: Генерал Рии'ке Эн. Его клона ногри унесли, а сам он дрался до конца.
set en_found
bly_thinks: Он нашёл, где лежит контейнер, и не ушёл. Это стоит уважения.
field

@ch6_sigils
bg honoghr_temple night
show vos right clonewars thoughtful
show aayla left robe calm lekku=still
-: Дверь хранилища покрыта знаками. Вос кладёт на них голые ладони и закрывает глаза.
vos: Ракатанцы. Им тысячи лет. Тот, кто откроет дверь, получит рой гипердротиков ногри.
vos: Я открою. А ты достань контейнер Силой, пока дротики летят в меня. Только быстро.
set sigils_read
-: Контейнер стоит за решёткой в глубине хранилища. Его можно притянуть Силой.
field

@ch6_sip
bg honoghr_temple night
music duel
show vos right clonewars resolute
show aayla left robe resolute lekku=tense
-: Вос дёргает створку. Из стен со свистом летят гипердротики. Контейнер прыгает в ладонь Эйлы.
-: Дверь уже не закрыть. Они бегут назад по коридору, которым пришёл Вос, и дротики стучат о камень за спиной.
set xp+80
goto ch6_ship

@ch6_ship
hide all
bg honoghr_ship dusk
music karkko
show vos right clonewars calm
show bly center phase2 calm
show aayla left robe calm lekku=still
-: Поляна у корабля Воса, «Скорп-Иона». Мёртвые деревья стоят вокруг, как обгоревшие колонны.
vos: Отдай контейнер мне, Эйла.
aayla: Что?
vos: Мне нужно доверие Дуку. Если я принесу ему это, он подпустит меня ближе. Тогда я узнаю, кто второй ситх, и убью его.
face aayla angry lekku=tense
aayla: Этот яд хотели вылить на Набу. Контейнер летит в Республику.
-: Эйла зажигает клинок. Вос зажигает свой.
bly: Отойдите от генерала!
-: Вос даже не оборачивается. Блай отлетает в сторону и бьётся о ствол.
battle vos_honoghr none
goto ch6_fallen

@ch6_fallen
hide all
bg honoghr_ship dusk
show vos right clonewars angry
show aayla left robe afraid lekku=tense
-: Клинок Эйлы лежит в траве. Вос поднимает свой над её головой.
vos: Последний раз, Эйла. Контейнер.
choice
  > Сказать, что он пал и что ему придётся её убить. -> ch6_fallen_kill
  > Позвать его домой, на Корусант. -> ch6_fallen_home | bond.vos+1
  > Промолчать. -> ch6_fallen_silent
end

@ch6_fallen_kill
aayla: Ты пал, Квинлан. Хочешь контейнер, придётся меня убить.
-: Глаза Воса на миг желтеют. Клинок дрожит у её шеи.
goto ch6_shots

@ch6_fallen_home
aayla: Если в тебе осталось хоть что-то хорошее, полетели со мной на Корусант. Или убей меня здесь.
-: Вос молчит. Клинок дрожит у её шеи. Он почти опускает его.
goto ch6_shots

@ch6_fallen_silent
-: Эйла молчит и смотрит ему в глаза. Клинок дрожит у её шеи.
goto ch6_shots

@ch6_shots
if duel_honoghr_bly == covered
bly_thinks: Генерал прикрыла меня от его броска. Я на ногах. Я вижу цель.
else
bly_thinks: Голова гудит. Встать. Броня держит. Голова держит. Цель на ногах.
end
-: Выстрел. Вос вскрикивает и хватается за плечо.
cg bly_shoots
-: Блай стреляет ещё раз. Теперь уже чтобы убить.
choice
  > Отбить выстрел Блая. -> ch6_deflect | honoghr_deflected
  > Не мешать. -> ch6_letshoot | dark+5
end

@ch6_deflect
-: Синий клинок прыгает в руку Эйлы, и второй выстрел уходит в небо.
cg off
-: Вос бросается к «Скорп-Иону». Корабль уходит над мёртвым лесом.
goto ch6_honoghr_end

@ch6_letshoot
-: Эйла не двигается. Второй выстрел обжигает Восу бок.
cg off
-: Вос, шатаясь, добирается до «Скорп-Иона». Корабль уходит, оставляя дымный след.
goto ch6_honoghr_end

@ch6_honoghr_end
hide all
bg honoghr_forest day
music aayla
show bly right phase2 calm
show aayla left robe sad lekku=down
if rank.bly >= 2
bond bly
end
cg honoghr
-: Контейнер уходит в Республику. Никто не остаётся помогать ногри. Через несколько недель яд губит Хоногр целиком.
cg off
bly_thinks: Задание выполнено. Контейнер у нас. Почему же генерал говорит, что мы провалились?
set xp+150
set !with_vos
respite p8
goto ch6_anzat

@ch6_anzat
hide all
bg anzat_school night
music cover
show tholme right robe calm
show aayla left robe calm lekku=still
-: Квинлан вернулся в Орден. Оби-Ван ручается за него. Вос принёс сведения: Сора Булк, правая рука Дуку, всё время летает на Анзат.
tholme: Слишком долго я посылал на смерть своих людей и держал руки чистыми. На Анзат я полечу сам.
-: Толм поставил себе протез ноги. Он всю жизнь не любил машины в теле, но теперь он идёт, не хромая.
tholme: Мой старый учитель живёт здесь. Акку Сеи. Я его уважаю, но другом он мне никогда не был.
aayla: А я?
tholme: А ты найдёшь корабль Булка. Начни с кантины «Мэггот». Там знают всё, что стоит денег.
set !with_bly
goto ch6_seii

@ch6_seii
hide all
bg anzat_school night
show akku right robe calm
show tholme left robe calm
-: Акку Сеи медитирует в пустом зале. Толм входит бесшумно, как учили анзати, и подносит рукоять к его горлу.
akku: Ты стал тише, Толм. Я тебя не слышал. Ты нашёл Катичака?
tholme: Нашёл. Он мёртв. Я пришёл не за этим. В последнее время на Анзат часто летает другой джедай. Сора Булк. Мне нужно знать зачем.
akku: Кодекс анзати запрещает говорить о заказах и о том, кого убили. Ты знаешь, Толм. Мне нечего тебе сказать.
set seii_code
-: Из теней выходят трое учеников. Акку Сеи даже не встаёт.
akku: Они попробуют тебя убить. Не стесняйся убивать сам.
tholme: Я обойдусь.
battle seii_students none
goto ch6_seii_after

@ch6_seii_after
hide all
bg anzat_school night
show akku right robe calm
show tholme left robe thoughtful
-: Ученики лежат без сознания. Ни одного смертельного удара.
akku: Вставайте. Вернитесь к урокам.
tholme: Трое учеников у одного учителя. По обычаю у анзати учитель берёт одного.
akku: Других учителей на Анзате сейчас нет.
tholme: Значит, их увёл Булк. Спасибо, учитель. Ты ничего мне не сказал.
set xp+80
goto ch6_maggot

@ch6_maggot
hide all
bg anzat_cantina night
music cover
show gort right spacer calm
show aayla left robe calm lekku=still
-: Кантина «Мэггот». У стойки сидит огромный хук с фиолетовой кожей. Его зовут Горт, и он видел всех, кто прилетал на Анзат.
gort: Вику с двумя мечами? Видел. Только память у меня плохая, джедайка. Сама не возвращается.
choice
  > Заплатить пятьдесят кредитов. -> ch6_gort_pay | credits-50
  > Внушить ему, что он хочет помочь. -> ch6_gort_mind
  > Пригрозить. -> ch6_gort_threat | dark+2
end

@ch6_gort_pay
-: Кредиты исчезают в огромной ладони.
gort: О, вспомнил. Его шаттл стоит на частной площадке за складами. Охрана там серьёзная.
goto ch6_gort_end

@ch6_gort_mind
aayla: Ты хочешь мне помочь.
gort: Я хочу тебе помочь. Шаттл вику стоит на частной площадке за складами. Только тихо, там охрана.
goto ch6_gort_end

@ch6_gort_threat
aayla: Память можно и освежить, Горт.
gort: Ладно, ладно. Площадка за складами. И держись подальше от его охранника, он не человек.
goto ch6_gort_end

@ch6_gort_end
hide all
bg anzat_dock night
-: Частная площадка за складами. Шаттл Булка стоит под прожекторами, по краям ходит охрана.
-: Нужно пробраться к шаттлу и скачать журналы полётов. Тихо, в тени ящиков.
map anzat_dock

@ch6_dock_seen
bg anzat_dock night
show aayla left robe afraid lekku=tense
-: Луч фонаря скользит по ящикам. Эйла ныряет в тень и уходит к складам, пока её не узнали.
map anzat_dock

@ch6_logs
bg anzat_dock night
show aayla left robe resolute lekku=still
-: Люк шаттла не заперт. Эйла подключает датапад к бортовому компьютеру и скачивает журналы полётов.
set logs
-: Готово. Теперь назад, тем же путём.
field

@ch6_bokclone
bg anzat_dock night
music duel
show aayla left robe surprised lekku=tense
-: С крыши шаттла спрыгивает никто в доспехе моргукая. Кортозисный посох, красные глаза.
aayla: Бок? Я видела, как ты шагнул в пропасть на Кинтане!
-: Моргукай не отвечает. Он молча бросается на неё.
battle bok_clone none
goto ch6_bulq

@ch6_bulq
hide all
bg anzat_dock night
music karkko
show bulq right robe calm
show kelkko center robe calm
show aayla left robe afraid lekku=tense
-: Эйла прячется за ящиками. К шаттлу идут двое: вику в тёмной робе и анзат с каштановыми волосами.
bulq: Учителей на Анзате больше не будет, Келкко. Все, кто согласился, уже в пути.
kelkko: Мои люди научат их всему. Моргукаи и без нас были страшны. С нами они станут тенью.
bulq: Дуку ждёт эту армию. Не подведите его.
-: Булк вдруг останавливается и оглядывается. Будто что-то почувствовал.
bulq: Где охранник? Он должен стоять у трапа.
kelkko: Моргукаи не любят приказов. Бродит где-нибудь.
-: Булк ещё миг стоит неподвижно, потом поднимается в шаттл. Шаттл уходит в ночь.
set xp+100
goto ch6_rendezvous

@ch6_rendezvous
hide all
bg anzat_dock night
show tholme right robe thoughtful
show aayla left robe thoughtful lekku=still
-: Толм и Эйла встречаются на своём корабле и читают журналы. Булк раз за разом летает на Салеуками.
tholme: Там у него база. Надо лететь туда.
aayla: Мне приказано лететь на Тригалис, мастер Толм. На Салеуками вам придётся лететь одному.
tholme: Одному мне привычнее. Я позову, когда что-то найду.
aayla: И этот моргукай у шаттла. Он был похож на Бока, как брат.
tholme: Значит, у Бока появились братья. Плохая новость, Эйла.
goto ch6_trigalis

@ch6_trigalis
hide all
bg trigalis_swamp day
music aayla
show obiwan right robe smile
show aayla left robe smile lekku=still
-: Тригалис. Болота, жёлтые птицы над водой и город Новый Коронет, где за деньги продают что угодно.
-: Оби-Ван Кеноби приходит на встречу в болотной грязи по колено.
aayla: Я думала, вы проберётесь в город тихо.
obiwan: Иначе не вышло, мастер Секура. Болота оказались опаснее, чем я думал.
aayla: Я знаю, зачем вы здесь, Оби-Ван. Ксист продаёт Конфедерации оружие и сведения. Он расскажет вам, куда ушла Вентресс.
obiwan: Тогда мне понадобится корабль. Мой остался в болоте.
choice
  > Отдать ему свой истребитель. -> ch6_fighter
  > Пошутить, что болото его не отдаст. -> ch6_fighter_joke
end

@ch6_fighter_joke
aayla: Болото своё не отдаёт, мастер Кеноби. Берите мой.
obiwan: Я верну его. Почти целым.
goto ch6_fighter

@ch6_fighter
-: Утром Оби-Ван улетает на истребителе Эйлы. Она остаётся ждать транспорт.
-: Ночью приходит вызов от Толма. Голос тихий, связь рвётся.
show tholme center robe resolute
tholme: Эйла. Салеуками. В пещерах под городом клонируют моргукаев. Генетический образец дал Бок. Их учат анзати.
tholme: Армия убийц для Дуку. Я остаюсь внизу. Пусть Республика летит сюда, и быстро.
hide tholme
set xp+50
goto ch6_saleucami

@ch6_saleucami
hide all
bg saleucami_camp day
music battle
show rancisis right robe calm
show aayla left robe resolute lekku=still
-: 19 ДБЯ. Осада Салеуками идёт пятый месяц. Город под щитом, ионная пушка держит флот на орбите.
-: Республикой командует магистр Оппо Рансисис. Его заместитель Квинлан Вос. Говорят, он раскаялся.
rancisis: Мастер Секура. Синей эскадрилье нужен пилот, а вашим людям генерал. Сегодня и то и другое.
hide rancisis
show vos right clonewars calm
show bly center phase2 calm
vos: В прошлый раз ты в меня стрелял.
bly: В прошлый раз вы были врагом. Теперь говорят, что нет.
vos: Говорят. А ты?
bly: А я выполняю приказы, генерал.
choice
  > Отослать Блая и поговорить с Восом наедине. -> ch6_alone | bond.vos+1
  > Сказать обоим, что война общая. -> ch6_both | bond.bly+1
end

@ch6_alone
hide bly
aayla: Коммандер, оставь нас.
aayla: Квинлан. Ты правда вернулся?
vos: Я там, где нужен, Эйла. Как всегда. Не спрашивай больше, ладно?
-: Он улыбается слишком быстро. Эйла запоминает эту улыбку.
goto ch6_flight

@ch6_both
aayla: Потом разберётесь, кто в кого стрелял. Сегодня у нас один враг.
vos: Твой генерал умеет командовать, клон.
bly: Знаю, генерал.
goto ch6_flight

@ch6_flight
hide all
bg saleucami_camp day
-: Синяя эскадрилья взлетает. Под красно-бурой «Этой-2» течёт магма.
flight saleucami
goto ch6_camp

@ch6_camp
hide all
bg saleucami_camp night
music duel
show bly right phase2 resolute
show aayla left robe resolute lekku=tense
-: Ионные пушки разбиты, республиканцы входят в город. А ночью из туннелей в лагерь лезут клоны-моргукаи.
bly: Генерал! Они уже за периметром!
set with_bly
set with_vos
battle camp_clones none
set !with_bly
goto ch6_rancisis

@ch6_rancisis
hide all
bg saleucami_camp night
music karkko
show vos right clonewars sad
show aayla left robe afraid lekku=tense
-: Атака на лагерь была только отвлечением. Магистра Рансисиса нашли в его покоях. Его убил Сора Булк.
-: Где-то под городом гаснет огонёк, который Эйла чувствовала все эти месяцы. Толма больше нет в Силе.
choice
  > Спросить Воса, где он был ночью. -> ch6_where
  > Сказать, что Толма больше не чувствует. -> ch6_tholme_gone
end

@ch6_where
aayla: Где ты был ночью, Квинлан?
vos: В туннелях. Искал Булка. Не нашёл.
-: Он не смотрит ей в глаза.
goto ch6_plan

@ch6_tholme_gone
aayla: Я не чувствую Толма. Его нет в Силе.
vos: Он сильный. Он умеет прятаться. Не хорони его раньше времени.
-: Голос Воса ровный. Слишком ровный.
goto ch6_plan

@ch6_plan
vos: Я теперь командую. Я прочёл тело Рансисиса, его план у меня. Пока войска атакуют, мы с тобой спустимся в туннели к главному генератору щита.
vos: Заложим заряды, щит упадёт, флот разнесёт комплекс. Бери всё, что может пригодиться.
set xp+80
map saleucami_caverns

@ch6_vos_leaves
bg saleucami_caverns night
show vos right clonewars calm
show aayla left robe thoughtful lekku=still
vos: Здесь развилка. Я проверю северный туннель. Заряды на генераторах заложишь сама, ты справишься.
aayla: Квинлан...
vos: Я тебя найду. Обещаю.
hide vos
set !with_vos
-: Вос уходит в темноту. Эйла остаётся одна среди гула магмы.
field

@ch6_charge_a
set charge_a
goto ch6_charge

@ch6_charge_b
set charge_b
goto ch6_charge

@ch6_charge_c
set charge_c
goto ch6_charge

@ch6_charge
bg saleucami_caverns night
show aayla left robe resolute lekku=tense
-: Эйла крепит заряд к кожуху генератора и ставит таймер. Генератор гудит так, что дрожат зубы.
if charge_a && charge_b && charge_c
goto ch6_bok
end
-: Генераторов три. Остальные дальше по залу.
field

@ch6_bok
bg saleucami_gate night
music duel
show bok right armor angry
show aayla left robe resolute lekku=tense
-: Третий заряд встаёт на место. За спиной гудят лазерные ворота, а из прохода выходит Бок. Тот самый, без правой кисти, с кибернетической рукой.
-: На руке кортозисная перчатка. Эйла зажигает клинок, и он гаснет от первого касания.
battle bok_gate none
goto ch6_bok_end

@ch6_bok_end
hide all
cg bok_gate
-: Ворота вспыхивают. Последний моргукай рода Бока больше не встанет.
cg off
-: Магма в стенах ревёт. Удержание сорвалось, станцию вот-вот зальёт.
set xp+150
goto ch6_hall

@ch6_hall
bg saleucami_complex night
music karkko
show tholme right robe calm
show aayla left robe surprised lekku=tense
-: В главном зале комплекса Эйла находит Толма. Живого.
tholme: Я отрезал себя от Силы целиком. Ты перестала меня чувствовать и решила, что я мёртв. Так я и хотел.
tholme: Квинлан выбрал, Эйла. Дуку велел ему убить Халин, а он перерезал её цепи. Он сказал Дуку: «Меня зовут Квинлан Вос, и я джедай».
-: Посреди зала Вос бьётся с Сорой Булком. Булк ведёт бой стилем Ваапад, и с каждым ударом Вос уходит глубже во тьму.
tholme: Булк тянет его на тёмную сторону. Один Квинлан не выберется. Войдём к нему вместе.
choice
  > Сесть рядом с Толмом и закрыть глаза. -> ch6_enter
  > Броситься к Восу с клинком. -> ch6_enter_rush | dark+3
end

@ch6_enter_rush
aayla: Я его вытащу!
tholme: Клинком ты его не вытащишь. Сядь, Эйла.
goto ch6_enter

@ch6_enter
hide all
-: Эйла садится на камень и закрывает глаза. Гул магмы уходит. Вокруг темнота, и где-то в ней Квинлан.
set with_tholme
map vos_mind

@ch6_mind_medallion
bg vos_mind night
music memory
show aayla left robe sad lekku=down
-: Медальон с Киффу. Маленький Квинлан держит его в ладонях и видит то, что видел медальон.
-: Его мать Квиан и отец Петрос останавливают корабль анзати у Киффекса. Анзати пьют их жизнь, а мальчик смотрит.
set mind_medallion
-: Отсюда его тьма. Эйла запоминает это место.
field

@ch6_mind_sanctum
bg vos_mind night
music memory
show aayla left robe calm lekku=still
-: Святилище Каркко. Вос гасит клинок перед своей падаваном, которая хочет его убить.
-: Здесь он выбрал её, а не бой. Здесь в темноте светлее.
set mind_sanctum
field

@ch6_mind_balcony
bg vos_mind night
music memory
show aayla left robe afraid lekku=tense
-: Балкон в Лессу. Вос без памяти держит Пола Секуру Силой и бьёт его молнией. Ему нужно имя.
-: Потом толчок, перила, падение. Эйла узнаёт свою руку.
set mind_balcony
-: Эту ночь они помнят оба. Каждый по-своему.
field

@ch6_mind_kiffu
bg vos_mind night
music memory
show aayla left robe sad lekku=down
-: Киффу. Дуку шепчет, что Шейф Тинте хранит тёмную тайну. Вос читает её прошлое и видит сделку: Тинте отдала его родителей анзати.
-: Ярость, вспышка клинка. Шейф падает. Дуку улыбается.
set mind_kiffu
-: Это самое тёмное место. Здесь Квинлан и потерялся.
field

@ch6_shadows
bg vos_mind night
music duel
show vos right clonewars angry
show aayla left robe resolute lekku=tense
-: В конце пути темнота встаёт в полный рост. Из неё выходит Вос. Глаза у него жёлтые.
vos: Второй ситх, которого ты ищешь, это я. Я всегда им был.
-: За ним поднимаются тени: Шейф Тинте, Каркко. Всё, что Квинлан носил в себе годами.
battle vos_dark none
goto ch6_hand

@ch6_hand
hide all
bg vos_mind night
music aayla
show vos right clonewars sad
show aayla left robe calm lekku=still
-: Тени рассыпаются. В темноте сидит Квинлан, такой, каким его знала Эйла. Уставший.
vos: Ты пришла. Ты и Толм. Я думал, меня уже нечем вытащить.
choice
  > Протянуть ему руку. -> ch6_hand_give
  > Сказать, что отпускает его. -> ch6_hand_letgo | bond.vos+1
end

@ch6_hand_give
aayla: Держись, Квинлан. Я не уйду без тебя.
goto ch6_hand_end

@ch6_hand_letgo
aayla: Я не держу тебя, Квинлан. Иди сам. Я только посвечу.
vos: Ты выросла, Эйла. Совсем выросла.
goto ch6_hand_end

@ch6_hand_end
cg hand_dark
-: Эйла протягивает руку в темноту. Квинлан берёт её.
cg off
set letgo.vos+1
if rank.vos >= 4
bond vos
end
if rank.tholme >= 4
bond tholme
end
goto ch6_bulq_falls

@ch6_bulq_falls
hide all
bg saleucami_complex night
music battle
show vos right clonewars resolute
show aayla left robe calm lekku=still
-: Эйла открывает глаза. Вос стоит на коленях, Булк заносит клинок для последнего удара.
-: Вос встаёт и поворачивается. Один удар поперёк груди, и Сора Булк падает. Ваапад его ученика оказался сильнее.
-: Магма заливает зал, флот Республики уже бьёт по комплексу. Джедаи уходят через туннели.
set !with_tholme
set xp+150
goto ch6_end

@ch6_end
hide all
bg saleucami_camp day
music temple
show vos right clonewars smile
show tholme center robe calm
show aayla left robe calm lekku=still
vos: Меня шлют на Бос-Питти. Опять война.
tholme: А тебя, Эйла, на Фелуцию. Барисс Оффи там нужна помощь.
aayla: Блай уже грузит корпус. Он не любит, когда его перебрасывают.
vos: Береги себя, Эйла. И его тоже.
-: Салеуками пал. Моргукаи почти все погибли в залитых магмой туннелях. Почти.
goto ch7_start

@rs_meditate_p7
bg holstice_memorial day
music temple
show aayla left robe calm lekku=still
-: Памятник павшим джедаям. В высокой колонне кружат светящиеся мотыльки памяти. С каждым годом войны их становится больше.
-: Эйла медитирует, пока свет мотыльков не становится ровным. Тьма отступает.
return

@rs_meditate_p8
bg cruiser_medbay night
music temple
show aayla left robe calm lekku=still
-: В медотсеке крейсера пахнет бактой. Блаю зашили бок и отпустили. Эйла садится на пустую койку и закрывает глаза.
-: Перед глазами мёртвый лес Хоногра. Она отпускает его медленно, дерево за деревом.
return

@rs_archive_ch7
if respite == p7
bg holstice_hospital day
else
bg cruiser_bridge night
end
music temple
show aayla left robe thoughtful lekku=still
-: Сводка с Внешнего кольца. Фелуция, мир грибных джунглей. Торговая гильдия держит там станции очистки воды.
-: В джунглях бродят акклеи, огромные и тяжёлые. Клинок их почти не берёт, их надо валить Силой и гранатами.
aayla: Если пошлют на Фелуцию, Блаю понадобится много гранат.
-: Архив: в следующем задании слабости врагов видны с первого хода.
return
` };
})(globalThis.Aayla98 = globalThis.Aayla98 || {});
