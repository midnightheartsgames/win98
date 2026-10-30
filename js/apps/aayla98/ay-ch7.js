(function (A) {
  'use strict';
  A.Scripts = A.Scripts || {};
  A.Scripts.ch7 = { file: 'ay-ch7.js', start: 'ch7_start', src: `
@ch7_start
chapter ch7
bg intrepid_gym night
music aayla
-: 19 ДБЯ. Крейсер «Интрепид» идёт к Фелуции. Блая опять перебросили, не дав закончить задание, и он злится.
show bly right bare calm
show aayla left robe smile lekku=still
bly: Генерал, разрешите размяться. Ещё час без дела, и я начну чистить броню соседям.
aayla: Становись, коммандер. Только руки.
battle bly_spar7 none
cg sparring
-: Они дерутся, пока оба не начинают смеяться. Ни один не хочет уступать первым.
cg off
show ekria center padawan smile
-: В отсек заглядывает девушка с синими волосами. Падаван Экрия, слайсер. Её недавно приписали к отряду Эйлы.
ekria: Простите, что помешала. Я нашла Барисс Оффи. Её держат на Фелуции, в тюрьме Нигко.
bond ekria
goto ch7_yoda

@ch7_yoda
hide all
bg intrepid_bridge night
music temple
show bly right phase2 calm
show ekria center padawan calm
show aayla left robe afraid lekku=tense
-: На маяке Эйлы мигает послание Йоды. Связь рвётся: на Корусант напали, бой идёт над самым городом.
choice
  > Приказать лететь к Корусанту. -> ch7_coruscant
  > Спросить совета у Блая и Экрии. -> ch7_advice | bond.ekria+1
end

@ch7_coruscant
aayla: Коммандер, курс на Корусант. Немедленно.
bly: Генерал, мы слишком далеко. Пока дойдём, всё кончится.
ekria: А Шу Май на Фелуции прямо сейчас. Если мы её возьмём, это поможет больше.
goto ch7_decide

@ch7_advice
aayla: Что скажете?
bly: Мы слишком далеко от Корусанта, генерал. А Шу Май рядом.
ekria: Глава Торговой гильдии стоит любой эскадрильи над Корусантом. Я посчитала.
goto ch7_decide

@ch7_decide
face aayla resolute lekku=still
aayla: Хорошо. Летим на Фелуцию.
-: До Фелуции два дня пути. Блай приносит ещё одну сводку: на Эндоре пропало разведывательное отделение 327-го. Пост сепаратистов там брошен.
choice
  > Слетать на Эндор вместо отдыха. -> ch7_endor | endor rs_p9
  > Остаться на «Интрепиде». -> ch7_rest
end

@ch7_rest
hide all
respite p9
goto ch7_felucia

@ch7_endor
hide all
bg endor_forest day
music aayla
show bly right phase2 calm
show aayla left robe calm lekku=still
-: Система Эндор. Лесная луна, деревья выше башен Храма. Пост сепаратистов пуст.
-: Вокруг лежат части дроидов и броня клонов. Самих клонов нет нигде.
bly: Здесь стреляли все во всех, генерал. А потом кто-то унёс тела. Дроиды так не делают.
aayla: Я осмотрю лес. Одна. Держи канонерки наготове.
bly: Генерал...
aayla: Одна, Блай.
map endor_forest

@ch7_droid
bg endor_forest day
music duel
show droid right b1 surprised
show aayla left robe resolute lekku=tense
-: Из кустов поднимается боевой дроид и вскидывает бластер. Синий клинок быстрее.
-: Через миг у дроида нет ни рук, ни ног. Он лежит в траве и продолжает говорить.
droid: Эй! Это было обидно. И нечестно. Я, между прочим, последний из своей роты.
aayla: Что здесь случилось?
droid: Что-то большое. Оно пришло с горы и съело твоих клонов. Нас оно есть не стало. Невкусные.
-: Сверху что-то коротко свистит. В шею Эйлы впивается дротик, и лес плывёт.
goto ch7_village

@ch7_village
hide all
bg ewok_village day
music aayla
show ewok right hood calm
show droid center b1 smile
show aayla left robe surprised lekku=tense
-: Эйла просыпается в хижине на дереве. Вокруг невысокие пушистые существа с копьями. Эвоки.
-: Вождь говорит долго и торжественно. Дроид, которого эвоки притащили следом, переводит.
droid: Они считают, что ты лесной дух. А раз ты дух, твой долг убить Зверя в Пасти Горы.
droid: Это то самое большое, что съело твоих клонов. Я бы на твоём месте отказался. Но я не дух.
choice
  > Согласиться. -> ch7_village_yes | dark-2
  > Спросить, почему дух должен убивать. -> ch7_village_why
end

@ch7_village_why
aayla: Почему лесной дух должен убивать?
droid: Они говорят, что так было всегда. Духи приходят с неба и убивают зверей. Очень удобная религия.
goto ch7_village_yes

@ch7_village_yes
aayla: Я пойду. Но ты пойдёшь со мной. Будешь переводить.
droid: Меня понесут? Прекрасно. Хоть какой-то толк от того, что ты отрубила мне ноги.
set with_droid
map endor_mountain

@ch7_climb_1
bg endor_mountain dusk
show droid right b1 smile
show aayla left robe calm lekku=still
droid: Зачем ты вообще жалеешь своих клонов? Их делают на Камино тысячами.
aayla: Каждый из них один. Как и ты.
droid: Я не один. Я последний. Это разные вещи.
field

@ch7_climb_2
bg endor_mountain dusk
show droid right b1 angry
show aayla left robe calm lekku=still
droid: Скажи честно. У тебя вообще есть джедайские умения? Пока я видел только, как ты рубишь беззащитных дроидов.
aayla: Ещё одно слово, и я понесу тебя вниз головой.
droid: Вот. Угрозы. Очень по-джедайски.
field

@ch7_climb_3
bg endor_mountain dusk
show droid right b1 surprised
show aayla left robe thoughtful lekku=tense
-: Тропа уходит к чёрной дыре в скале. Пасть Горы. Из неё пахнет старой кровью.
droid: Знаешь, я передумал. Я подожду здесь. Можно я подожду здесь?
field

@ch7_beast
bg endor_cave night
music duel
show aayla left robe afraid lekku=tense
-: У входа Эйла спотыкается о гору костей. Грохот катится в глубину пещеры.
-: Из темноты выходит Зверь: шесть ног, шесть глаз, щупальца вокруг пасти.
-: Первым ударом он пронзает дроида когтем. Дроид успевает сказать: «Я же говорил».
set !with_droid
battle endor_beast none
goto ch7_endor_end

@ch7_endor_end
hide all
bg endor_forest day
music aayla
show bly right phase2 resolute
show aayla left robe smile lekku=still
bly: Генерал! Мы искали вас всю ночь. Я уже собирался поднимать отделение.
aayla: Я была на прогулке, коммандер. Летим на Фелуцию.
bly_thinks: Прогулка. На ней кровь Зверя и дротик в волосах. Генерал умеет гулять.
set bond.bly+1
cg forest_spirit
-: Эвоки нарисуют на коре большую картину: синий лесной дух обрушивает гору на Зверя.
cg off
set xp+150
goto ch7_felucia

@ch7_felucia
hide all
bg felucia_jungle day
music battle
show clone501 right phase2 calm
show aayla left robe resolute lekku=tense
-: Фелуция. Грибные джунгли до горизонта. 182-й легион пропал без вести, 501-й прорвался сюда сквозь акклеев.
clone501: Генерал Секура! Одну канонерку сбили, шагоход без энергии, а с холма идут дроиды.
aayla: Где канонерка?
clone501: В зарослях, за акклеями. В ней энергоячейка.
set with_bly
map felucia_jungle

@ch7_cell
if cell
-: В канонерке больше нечего брать.
field
end
bg felucia_jungle day
show aayla left robe resolute lekku=still
-: Канонерка лежит на боку, обшивка горячая. Эйла вырезает клинком люк и вытаскивает энергоячейку.
set cell
field

@ch7_walker
if walker_on
-: Шагоход стоит и ждёт приказа.
field
end
if !cell
-: Шагоход AT-TE разбит, но цел. Нужна энергоячейка. Её можно взять в сбитой канонерке.
field
end
bg felucia_jungle day
music duel
show clone501 right phase2 angry
show aayla left robe resolute lekku=tense
-: Эйла ставит ячейку на место. С холма спускаются супердроиды.
battle hill_droids none
hide all
cg bravest
-: Шагоход оживает, и его пушка накрывает танки сепаратистов. Солдаты 501-го встают из-за укрытий.
aayla: Вы самые храбрые солдаты, каких я видела.
cg off
set walker_on
set xp+120
-: Под грибным деревом бьют противотанковые турели. Их шесть.
field

@ch7_turrets_a
bg felucia_jungle day
battle turrets_a none
set turrets_a
-: Первые три турели молчат.
field

@ch7_turrets_b
bg felucia_jungle day
battle turrets_b none
set turrets_b
-: Последние турели молчат. Дорога к Нигко открыта.
field

@ch7_jungle_end
hide all
set xp+100
goto ch7_nigkoe

@ch7_nigkoe
bg felucia_nigkoe day
music cover
show ekria right padawan smile
show bly center phase2 calm
show aayla left robe resolute lekku=still
-: Тюрьма Нигко среди грибов. Экрия, Блай и Эйла подходят к ней тихо, втроём.
ekria: Ворота я открою за десять секунд. Коды охраны у меня, Гильдия платит за связь плохим специалистам.
set nigkoe_codes
set with_ekria
-: Барисс и её падавана Зондера держат в нижнем блоке. Охраняют коммандос-госсамы и дроиды.
map nigkoe_prison

@ch7_cells
bg felucia_nigkoe day
music aayla
show barriss right robe smile
show aayla left robe smile lekku=still
-: Двери камер расходятся. Барисс Оффи выходит первой, за ней высокий селонианин, падаван Зондер.
barriss: Мастер Секура. Я знала, что Совет кого-нибудь пришлёт. Не знала, что так быстро.
aayla: Благодари Экрию. Она нашла тебя по счетам Шу Май.
set freed
field

@ch7_legion
bg felucia_nigkoe day
music duel
show bly right phase2 resolute
show barriss center robe surprised
show aayla left robe afraid lekku=tense
-: У ворот тюрьмы выстраивается целый легион дроидов. Через ворота уже не выйти.
bly: Вниз нельзя, значит, наверх. На крыше генератор щита. Сниму его, и наши смогут сесть.
-: Зондер кивает: он видел, как сюда садились шаттлы Гильдии. Только на крышу.
set legion
field

@ch7_roof
bg felucia_nigkoe day
music battle
show bly right phase2 resolute
show aayla left robe resolute lekku=still
-: На крыше Блай ставит заряд на генератор щита. Щит гаснет, и над тюрьмой сразу появляются канонерки 327-го.
bly: Эвакуация, генерал. Всех вытащили.
set xp+150
set !with_ekria
goto ch7_kwayteow

@ch7_kwayteow
hide all
bg felucia_kwayteow dusk
music battle
show barriss right robe calm
show aayla left robe resolute lekku=tense
-: База Шу Май у Квай-Теоу. Шу Май, глава Торговой гильдии, прячется здесь. Сначала надо отвлечь охрану у ворот.
barriss: Мы с Зондером пойдём с вами. Хватит с нас камер.
battle kwayteow_guards none
-: Супердроиды у ворот лежат грудой металла. Джедаи и клоны садятся на спидербайки.
goto ch7_bikes

@ch7_bikes
bg felucia_kwayteow dusk
-: Байки несутся к базе сквозь грибной лес. Над деревьями поднимаются истребители дроидов.
flight felucia
goto ch7_waterfall

@ch7_waterfall
hide all
cg waterfall
-: У реки Эйла кричит: «Прыгаем!» Байки уходят в заросли, а джедаи летят в воду и дальше, вниз по водопаду.
cg off
bg felucia_river dusk
music memory
show aayla left robe resolute lekku=tense
-: Вход в базу под водой. Плыть далеко.
if rank.kit >= 1
-: Эйла вспоминает Камино и Кита: дышать медленно, как вода. Воздуха хватит надолго.
end
map kwayteow_water

@ch7_air_fail
-: Воздух кончается. Эйла выныривает у подножия водопада и пробует снова.
map kwayteow_water

@ch7_base
hide all
bg kwayteow_inside night
music cover
show ekria right padawan sad
show barriss center robe calm
show aayla left robe thoughtful lekku=still
-: База пуста. Шаттл Шу Май улетел несколько дней назад, и с тех пор сюда никто не входил.
ekria: Голосеть заработала. Учитель, бой за Корусант кончился. Канцлер жив.
-: Комлинк Эйлы оживает. Голос Блая хрипит.
bly: Генерал, база заполняется ядом. Мои люди падают у входа.
ekria: Отсчёт самоуничтожения! Он идёт с той секунды, как мы вошли.
aayla: Все наружу. Быстро!
set with_ekria
map kwayteow_escape

@ch7_escape_fail
-: Газ отрезает коридор. Эйла возвращается и ищет другой путь.
map kwayteow_escape

@ch7_escape_out
hide all
bg felucia_river dusk
music duel
-: Джедаи и клоны выбегают из базы за миг до взрыва. Над Квай-Теоу встаёт огненный гриб.
set !with_ekria
set xp+200
goto ch7_report

@ch7_report
bg felucia_camp night
music temple
show mace right robe calm
show aayla left robe sad lekku=down
aayla: Взрыв выпустил в воду сильный яд. Вода на Фелуции связана по всей планете.
aayla: Экрия посчитала: через четыре дня заражена будет вся планета. Погибнут миллионы.
mace: Тогда у вас четыре дня, мастер Секура. Подкрепление уже идёт.
hide mace
show drake right padawan calm
show bly center phase2 calm
-: Стасс Алли привозит подкрепление и улетает дальше, на Салеуками. Следом прилетает падаван Дрейк Ло'ган. Его учителя убил Гривус.
bly: Небо над станциями прикрыто плотнее всего. Значит, идём по земле.
bly: Мастер Оффи с отрядом на Хар-Гау. Падаваны на Цзяоцзы. Мы с вами проводим их и идём к Ниянго.
aayla: Согласна. Отдыхаем до рассвета.
respite p10
goto ch7_jiaozi

@ch7_jiaozi
hide all
bg felucia_jungle day
music battle
show ekria right padawan resolute
show aayla left robe calm lekku=still
-: Цзяоцзы. Падаваны устраивают ложную атаку и уводят охрану от станции очистки.
ekria: Учитель, дальше мы сами. Идите к Ниянго.
if heart_given
-: Под воротником у Экрии светится камень с Киффу.
end
aayla: Береги их, Экрия.
goto ch7_niango

@ch7_niango
hide all
bg felucia_niango day
music battle
show bly right phase2 calm
show aayla left robe resolute lekku=still
-: По дороге к Ниянго разведка докладывает: впереди бронетехника сепаратистов. Отряд встаёт среди огромных грибов.
battle niango_wave none
goto ch7_bird

@ch7_bird
hide all
bg felucia_niango day
music aayla
cg bird
-: Становится тихо. Над грибами взлетает фелуцианская птица, и Эйла поднимает голову.
cg off
show bly right phase2 calm
bly_thinks: Входящий приказ. Канцлер. Приказ шестьдесят шесть.
bly_thinks: Генерал Секура. Предатель Республики. Исполнять.
set !with_bly
if dark >= 70
goto ch7_end_dark
end
if rank.bly >= 5 && honoghr_deflected && bly_told && dark < 40
goto ch7_turn
end
goto ch7_end_canon

@ch7_turn
-: Что-то холодное касается затылка, как взгляд в спину.
choice timer=5
  > Обернуться. -> ch7_end_other
  > Смотреть на птицу. -> ch7_end_canon
end

@ch7_end_canon
hide all
bg felucia_niango day
music memory
-: Выстрелы бьют в спину. Эйла не успевает зажечь клинок. Она падает под большим грибом, а клоны всё стреляют.
-: На Цзяоцзы Экрия видит это через камеры шлемов. Падаваны уходят в джунгли, пока за ними не пришли.
cg end_felucia
-: Птица уходит в небо над грибами.
cg off
set ending=felucia
goto ch7_legacy

@ch7_legacy
bg temple_archive night
music temple
cg legacy
-: Империя запишет, что Эйла Секура и Барисс Оффи травили воду Фелуции. Записи составит Сейт Пестаж. Травили сепаратисты.
-: Боец 501-го напишет в дневнике: «Когда пришла её смерть, я надеялся, что быстрая. Это она заслужила».
-: Другой вспомнит: без её железной воли никто из них не вышел бы с Фелуции живым и в своём уме.
-: Квинлан Вос, сам спасаясь от своих клонов, почувствует пустоту на месте Эйлы.
-: Даррус Джет увидит её гибель в видении и долго не сможет прийти в себя.
-: Миры, которым она помогала, будут её помнить. Кое-где её имя сольётся с именами местных богинь.
if endor
-: На Эндоре эвоки будут беречь картину, где синий лесной дух обрушивает гору на Зверя.
end
if heart_given
-: Экрия спрячется на Корусанте и будет носить на шее тёплый камень с Киффу.
end
cg off
-: Ушедший становится частью Силы и живёт в сердце. Так когда-то Вос сказал маленькой Эйле о Т'да.
credits

@ch7_end_other
hide all
bg felucia_niango day
music duel
-: Эйла оборачивается раньше, чем успевает подумать. Её чутьё не раз ловило тех, кто задумал её предать. Сейчас оно кричит.
show bly right phase2 sad
-: Блай смотрит на неё поверх бластера. Палец лежит на спуске. Он медлит.
-: Другие клоны стреляют. Синий и зелёный клинки отбивают выстрелы один за другим.
bly: Уходите, генерал.
cg end_other
-: Эйла уходит в джунгли, к падаванам. Блай опускает оружие и долго смотрит ей вслед.
cg off
-: Блай доложит, что генерал Секура уничтожена. Имперская запись о её смерти будет ложью и здесь.
-: Эйла, Экрия, Зондер и Дрейк доберутся до Корусанта и уйдут на нижние уровни. Джедаи, которых нет ни в одном списке.
if heart_given
-: Камень с Киффу греет ладони Экрии. Эйла улыбается: теперь он точно попал в нужные руки.
end
set ending=other
credits

@ch7_end_dark
hide all
bg felucia_niango day
music karkko
-: Гнев приходит раньше выстрела. Эйла разворачивается, и клинки уже горят.
-: Отделение падает. Последним падает Блай. Он так и не успевает выстрелить.
-: Где-то очень далеко смеётся голос, который она слышала на Киффексе. Каркко.
cg end_dark
-: Эйла уходит в джунгли одна.
cg off
-: Потом во Внешнем кольце пойдёт слух о синей твилечке с двумя клинками. Она убивает и солдат Империи, и тех, кто им служит.
set ending=dark
credits

@rs_meditate_p9
bg intrepid_cabin night
music temple
show aayla left robe calm lekku=still
-: В каюте тихо, только гудят двигатели «Интрепида». Эйла садится у иллюминатора и закрывает глаза.
-: Перед глазами война, которая всё никак не кончится. Эйла отпускает её медленно.
return

@rs_meditate_p10
bg felucia_stream night
music temple
show aayla left robe calm lekku=still
-: Ручей у лагеря. Где-то здесь, на Фелуции, Эйла когда-то похоронила Т'да. Холмик зарос светящимися грибами.
-: Ушедший становится частью Силы и живёт в сердце. Эйла сидит у воды, пока Тьма не уходит совсем.
return
` };
})(globalThis.Aayla98 = globalThis.Aayla98 || {});
