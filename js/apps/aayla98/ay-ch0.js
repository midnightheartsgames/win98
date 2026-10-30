(function (A) {
  'use strict';
  A.Scripts = A.Scripts || {};
  A.Scripts.pro = { file: 'ay-ch0', start: 'pro_garden', src: `
@pro_garden
bg temple_garden day
music temple
-: Корусант, Храм джедаев. Сад медитаций, 31 год до битвы при Явине.
show xiaan right padawan calm lekku=still
xiaan: Ты уже третий круг вокруг фонтана делаешь.
show aayla left padawan smile lekku=still
aayla: Я так думаю. На ходу лучше получается.
xiaan: А о чём думаешь?
face aayla thoughtful lekku=down
aayla: О Рилоте. Мы с мастером Восом сегодня туда летим.
face xiaan surprised lekku=up
xiaan: На Рилот? Ты же оттуда! Тебе, наверное, интересно, какой он.
set restraint=1
choice lekku=xiaan need=2
> Интересно. Я его совсем не помню. -> pro_garden_true
> [lie] Мне всё равно. Это обычное задание. -> pro_garden_lie
end

@pro_garden_true
if lekku_read
face xiaan smile lekku=up
xiaan: Вижу. У тебя лекку прямо дрожат от нетерпения.
face aayla laugh lekku=up
aayla: Вот и прячь от вас что-нибудь.
else
face xiaan calm lekku=still
xiaan: Я бы тоже хотела посмотреть. Хоть одним глазком.
end
goto pro_garden_stone

@pro_garden_lie
if lekku_tell
face xiaan smile lekku=up
xiaan: Обычное? А лекку у тебя говорят совсем другое.
face aayla shy lekku=down
aayla: Твилеку врать бесполезно. Запомни, это пригодится.
else
face xiaan surprised lekku=up
xiaan: Говоришь «всё равно», а лекку кричат «очень интересно». Это ты нарочно?
face aayla smile lekku=up
aayla: Нарочно. Чтобы ты не расслаблялась.
end
goto pro_garden_stone

@pro_garden_stone
face aayla calm lekku=still
-: Эйла достаёт из поясной сумки камень. Он тёплый и светится изнутри, как уголёк.
cg heart_of_fire
aayla: Знаешь, что это?
xiaan: Сердце огня, с Киффу. Тебе его мастер Вос подарил.
aayla: На тринадцатилетие. Пусть побудет у тебя, пока я не вернусь.
xiaan: У меня? Но он же твой.
choice
> Береги его. Это подарок Воса. -> pro_garden_keep | xiaan_tone=keep
> Когда страшно, сожми его в руке. Помогает. -> pro_garden_fear | xiaan_tone=fear
> Только мастеру Восу не говори. Обидится. -> pro_garden_joke | xiaan_tone=joke
end

@pro_garden_keep
face xiaan smile lekku=up
xiaan: Сберегу. Честное слово.
goto pro_garden_vos

@pro_garden_fear
face xiaan surprised lekku=still
xiaan: А тебе самой разве бывает страшно?
face aayla thoughtful lekku=down
aayla: Бывает. Поэтому я и знаю, что помогает.
goto pro_garden_vos

@pro_garden_joke
face xiaan smile lekku=up
xiaan: Он всё равно узнает. Он же всё узнаёт, стоит ему потрогать вещь.
face aayla laugh lekku=up
aayla: Значит, пусть ничего не трогает.
goto pro_garden_vos

@pro_garden_vos
cg off
show vos center early smile
vos: Вот ты где. Корабль ждёт, падаван. Рилот сам себя не расследует.
face aayla smile lekku=up
aayla: Иду, мастер.
face vos thoughtful
vos: Сиань, присмотри за садом, пока нас нет.
-: Сиань остаётся у фонтана с тёплым камнем в ладонях.
goto pro_lessu

@pro_lessu
bg lessu_market dusk
music ryloth
-: Рилот, Лессу. Нижний рынок устроен в огромной пещере, подальше от жары.
show vos left early calm
show aayla right padawan calm lekku=still
vos: Два ящика глиттерилла на Корусанте, и оба пришли отсюда. Где-то здесь их грузили.
aayla: Будем спрашивать?
vos: Будем смотреть. И ничего не трогай раньше меня.
face aayla surprised lekku=up
aayla: Почему?
face vos smile
vos: Вещи рассказывают мне, где побывали. Твои пальцы им помешают.
face aayla smile lekku=up
aayla: Тогда я буду смотреть через Силу. Так можно?
vos: Так нужно.
map lessu_market start

@pro_warehouse
bg lessu_tunnels night
-: Дверь поддаётся с третьего толчка. Склад пуст: полки сняты, на полу светлые квадраты от ящиков.
show vos left early thoughtful
show aayla right padawan calm lekku=still
if clue_ryll_tunnels_u
aayla: Те разводы в туннеле вели сюда.
end
vos: Ушли недавно. Торопились.
-: В углу забыт один ящик. Вос кладёт на крышку ладонь.
vos: Его привезли с севера, из старой шахты. На крышке печать клана Секура.
face aayla surprised lekku=tense
aayla: Клан Секура? Это же мой клан.
vos: Значит, идём в гости к твоему дяде.
face aayla thoughtful lekku=down
aayla: Я его даже не помню.
face vos calm
vos: Он тебя помнит. Нам этого хватит.
goto pro_pol

@pro_pol
bg pol_hall dusk
music ryloth
-: Поместье Пола Секуры вырублено в скале над городом. Слуги ведут гостей в зал для танцев.
show pol center robe smile lekku=hello
pol: Эйла! Племянница! Ты выросла, а я всё помню тебя вот такой.
-: Эйла видит его впервые с двух лет. Тогда он продал её хатту.
hide pol
show aayla left padawan calm lekku=still
show pol right robe smile lekku=still
pol: Мастер Вос, клан Секура рад джедаям. Садитесь, ужин сейчас подадут.
choice lekku=pol need=1
> [lie] Спасибо, что приняли нас, дядя. -> pro_pol_polite | pol_tone=polite, bond.secura+1
> Мы здесь по делу Ордена. -> pro_pol_cold | pol_tone=cold
> Расскажите о моём отце. -> pro_pol_father | pol_tone=father, bond.secura+2
end

@pro_pol_polite
if lekku_read
face pol calm lekku=still
pol: Вежливые слова и холодные лекку. Хорошо тебя учили в Храме.
else
face pol smile lekku=up
pol: Какие манеры. Храм сделал из тебя настоящую Секуру.
end
goto pro_pol_glitter

@pro_pol_cold
face pol calm lekku=still
pol: По делу. Что ж, джедаи всегда приходят по делу.
goto pro_pol_glitter

@pro_pol_father
face pol surprised lekku=tense
pol: Твоего отца давно нет, Эйла. Не будем о грустном за ужином.
face aayla sad lekku=down
goto pro_pol_glitter

@pro_pol_glitter
show vos center early calm
vos: Мы ищем глиттерилл. Ящики с печатью вашего клана лежали на складе под рынком.
face pol surprised lekku=up
pol: С печатью клана? Подделка. Совет следит за каждым ящиком рилла.
vos: А старая шахта на севере?
face pol calm lekku=still
pol: Закрыта. Туда пришли пауки с Кесселя и разжирели на рилле. Рабочие разбежались.
vos: Мы посмотрим.
face pol smile lekku=still
pol: Как пожелаете, мастер джедай. Только не говорите потом, что я не предупреждал.
hide all
-: У ворот поместья Вос долго молчит.
show vos left early thoughtful
show aayla right padawan thoughtful lekku=still
vos: Он ни разу не отвёл глаза.
aayla: И лекку у него ни разу не дрогнули. Так держать их может только тот, кто долго учился.
face vos resolute
vos: Идём в шахту. Прямо сейчас.
map ryll_mine start

@pro_asante
-: У развилки из темноты выходит киффарка в форме стражей Киффу. Бластер она держит стволом вниз.
show vos left early surprised
show asante right guard calm
vos: Асанте?
face asante smile
asante: Здравствуй, кузен. Не думала встретить тебя в рилловой яме.
face vos smile
vos: Эйла, это моя кузина Асанте. Стражница Киффу.
show aayla center padawan calm lekku=still
aayla: Что стражи Киффу делают на Рилоте?
asante: Ищут то же, что и вы. Глиттерилл добрался и до нас.
-: Эйла пробует прочесть её через Силу. Не выходит: Асанте спокойна и закрыта.
choice
> Хорошо, что нас теперь трое. -> pro_asante_trust | asante_tone=trust
> Мастер, мы её не ждали. -> pro_asante_doubt | asante_tone=doubt
end

@pro_asante_trust
face asante smile
asante: Втроём надёжнее. Я пойду последней и прикрою вам спину.
goto pro_asante_join

@pro_asante_doubt
face vos angry
vos: Она моя кузина, падаван.
face asante smile
asante: Девочка права, осторожность не помешает. Я пойду последней и прикрою вам спину.
goto pro_asante_join

@pro_asante_join
set asante_joined
-: Асанте идёт следом. Её шагов почти не слышно.
field

@pro_lair
bg ryll_mine night
music battle
-: Логово. Своды затянуты паутиной, на полу пустые коконы и кости.
show vos left early resolute
show aayla right padawan resolute lekku=tense
vos: Сверху!
-: С потолка спускается паук размером с грузовой спидер. Следом ещё двое поменьше.
show asante center guard calm
asante: Я держу вход. Работайте.
hide all
battle spider_boss
-: Огромный паук бьётся в последний раз и затихает. В логове становится очень тихо.
show vos left early smile
show aayla right padawan smile lekku=up
aayla: Мастер, видели? Он даже не понял, откуда...
-: Выстрел бьёт Эйле в спину.
hide all
-: Ноги подкашиваются. Последнее, что она слышит: Вос кричит её имя.
cg glitteryll
music aayla
-: Сколько прошло времени, неизвестно. Чьи-то руки поднимают ей голову.
pol: Тише, девочка. Пей.
asante: А этого куда?
pol: Сначала пусть выпьет. Каждый день понемногу.
-: Напиток холодный и сладкий. Мысли путаются и уходят одна за другой.
cg off
forget
goto ch1_start
` };
})(globalThis.Aayla98 = globalThis.Aayla98 || {});
