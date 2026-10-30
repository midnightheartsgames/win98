(function (A) {
  'use strict';
  A.Scripts = A.Scripts || {};
  A.Scripts.ch2 = { file: 'ay-ch2', start: 'ch2_start', src: `
@ch2_start
chapter ch2
set instinct=false, retinue=false, released=false, temple_open=false
if feeling == anger
set dark=25
else
set dark=10
end
bg kiffex_crash dusk
music karkko
-: Киффекс, тюремная планета. 30 лет до битвы при Явине.
-: Капсула лежит в высокой траве и дымится. Эйла выбирается наружу. Корабля контрабандистов больше нет.
show aayla center dancer resolute lekku=tense
aayla: Киффары живут где-то здесь. И он тоже.
-: В голове звучит чужой голос. Он спокоен, будто ждал её давно.
voice: С той минуты, как ты ступила на эту планету, я чувствовал тебя... твои рассеянные мысли...
voice: Я послал тебе свою волю... Я притянул тебя к себе...
voice: ...потому что ты нужна мне, маленькая джедайка.
face aayla surprised lekku=up
aayla: Джедайка? Я танцовщица.
-: Голос не спорит. На горизонте темнеет храм, и ноги сами несут её туда.
map kiffex_temple start

@ch2_doors
bg kiffex_temple night
show aayla center dancer thoughtful lekku=still
-: Двери храма в три её роста. На них знаки, которых она не может прочесть.
-: Эйла касается камня. Плиты расходятся в стороны, будто узнали её.
voice: Этот храм открывается только джедаям. Видишь? Ты сама не знаешь, кто ты.
set temple_open
field

@ch2_voice
voice: Здесь живут мои дети. Они одичали без меня. Не дай им себя поймать.
field

@ch2_voice2
voice: Ближе. Тот киффар, которого ты ищешь, придёт сюда сам. Я обещаю.
-: Эйла не говорила о киффаре вслух. Голос знает.
field

@ch2_release
bg kiffex_sanctum night
music karkko
-: В центре святилища стоит человек в чёрном. Свет поля стазиса держит его, как стекло держит муху.
show karkko right robe calm
voice: Тысячу лет. Освободи меня, и я помогу тебе найти твоего киффара.
show aayla left dancer thoughtful lekku=still
choice
> Что ты мне за это дашь? -> ch2_release_ask | dark+2
> Кто тебя здесь запер? -> ch2_release_who
end

@ch2_release_ask
karkko: Силу. Ту, что у тебя отняли. И его, когда он придёт.
goto ch2_release_free

@ch2_release_who
karkko: Джедаи. Они боятся того, чего не понимают. Ты тоже их узнаешь.
goto ch2_release_free

@ch2_release_free
-: Эйла протягивает руку к полю. Свет трескается и гаснет.
cg release
-: Человек открывает глаза. У него в щеках что-то шевелится, и на миг он смотрит на неё как на еду.
cg off
show karkko right robe angry
karkko: Твой суп пахнет Силой, девочка. Я голодал тысячу лет.
face aayla afraid lekku=tense
-: Он стоит совсем близко. Потом отступает на шаг.
face karkko smile
karkko: Нет. Ты нужна мне живой. Я Волф Каркко, и ты будешь моей ученицей.
karkko: Мы выпьем суп других джедаев и уйдём из этой могилы. А потом я сделаю тебя королевой.
-: Эйла переодевается в то, что нашлось в храме: штаны, сапоги, жилет с одним рукавом. Платье танцовщицы остаётся на полу.
show aayla left kiffex resolute lekku=still
karkko: Твой красный клинок неплох. Но я дам тебе больше.
-: Каркко учит её тёмным дарам: молнии, ужасу и голосу, которому подчиняются его дети.
set gifts, released, retinue
-: Из темноты выходят двое одичавших анзати и склоняют головы перед Эйлой.
karkko: Мои дети голодны. Возьми пост стражей Киффу к югу отсюда. Пусть поедят.
map kiffex_post start

@ch2_post_end
bg kiffex_post night
show guardian right armor calm
-: У стены сидит раненый страж Киффу. Бластер лежит в стороне, до него не дотянуться.
guardian: Ты не анзат. Ты твилечка. Зачем ты с ними?
show aayla left kiffex resolute lekku=tense
-: Анзати за спиной Эйлы ждут её слова.
choice
> Убить его самой. -> ch2_post_kill | dark+10, post=kill
> Отвернуться: пусть анзати решают. -> ch2_post_turn | dark+5, post=turn
> Отпустить его. -> ch2_post_free | dark-5, post=free
end

@ch2_post_kill
-: Красный клинок опускается один раз. Анзати разочарованно шипят: суп пропал.
goto ch2_post_out

@ch2_post_turn
-: Эйла отворачивается к пульту. За спиной коротко вскрикивают, потом становится тихо.
goto ch2_post_out

@ch2_post_free
aayla: Уходи. Пока я не передумала.
face guardian surprised
guardian: Ты... Спасибо.
-: Страж уползает в ночь. Анзати смотрят ему вслед и молчат.
goto ch2_post_out

@ch2_post_out
hide all
-: К утру пост пустеет. На пульте ещё долго мигает вызов с Киффу.
goto ch2_coruscant

@ch2_coruscant
bg temple_council day
music temple
rest
-: Корусант, Храм джедаев. Несколько недель спустя.
show tinte right sheyf calm
tinte: Мастер Винду, на Киффексе вырезан пост стражей. Мне нужен джедай, который знает Киффекс. Мне нужен Квинлан.
show mace left robe calm
mace: Вос уже не тот, кем был. Но мы его пришлём.
hide tinte
bg temple_archive night
-: Башня первого знания. Хранитель Астаал Вилбум зовёт мастера Винду среди ночи.
show vilbum right robe surprised
vilbum: Мастер Винду, голокрон с легендой о Волфе Каркко включился сам. Такого не было при тринадцати хранителях до меня.
face mace angry
mace: Значит, Каркко свободен. А Вос летит на Киффекс, прямо к нему.
mace: Волф Каркко не должен покинуть Киффекс. Чего бы это ни стоило.
goto ch2_cantina

@ch2_cantina
bg kiffex_cantina night
music karkko
-: Киффекс, городок Дедэнд. Кантина «Чёрная дыра».
show karkko left robe calm
karkko: Мне нужен суп. Много супа. Приведи мне пленных, ученица.
hide karkko
-: В кантине дымно и тесно. Маленький слепой повар стучит половником у плиты. Рядом с ним сидят двое джедаев.
show zao right cook calm
zao: Суп сегодня горький. Значит, в зале кто-то не в ладу с Силой.
hide zao
show aayla left kiffex angry lekku=tense
-: Один из них киффар. Тот самый, с балкона.
aayla: Это он.
-: Анзати бросаются на посетителей. Кантина взрывается криками.
hide all
battle cantina_crowd
show tholme right robe surprised
tholme: Квинлан, справа! Это анзати!
show aayla left kiffex angry lekku=tense
if saw_tunic
-: Квинлан. Это имя было во сне про тунику. Эйла гонит мысль прочь.
end
show vos center early surprised
vos: Эйла? Эйла, это я!
aayla: Ты убил моего дядю.
hide all
battle duel_cantina
cg cantina
-: Клинки сходятся в дыму. В голове Эйлы снова звучит голос Каркко: задание важнее мести.
cg off
show aayla left kiffex thoughtful lekku=down
-: Лицо киффара так близко. На миг Эйла видит другое место и другой год.
still lodi
music memory
-: Солибус IV. Тайна лоди. Они с этим киффаром разгадывают её вдвоём. Больше память ничего не отдаёт.
recall 7
still off
music karkko
-: Эйла отступает. Анзати уводят пленных в темноту, джедаи бросаются следом.
goto ch2_hills

@ch2_hills
bg kiffex_hills dusk
show aayla center kiffex resolute lekku=tense
-: Погоня отстаёт на холмах. Дорога здесь одна, и джедаи пойдут по ней.
aayla: Спрячьтесь у дороги. Брать живыми, если получится. Каркко нужен их суп.
-: Решать, куда посадить двоих анзати, ей. Хорошее укрытие близко к дороге и за камнями.
map kiffex_hills start

@ch2_ambush
bg kiffex_hills dusk
show aayla center kiffex resolute lekku=tense
-: На дороге появляются джедаи. Анзати ждут сигнала.
if ambush_score >= 2
-: Оба анзати сидят там, где их не видно. Джедаи проходят прямо между ними.
else
-: Одного анзата видно с дороги. Седой джедай замедляет шаг.
end
show tholme right robe calm
tholme: Эйла. Я знаю, ты меня не помнишь. Я Толм. Я учил тебя, когда ты была маленькой.
hide all
still temple_years
music memory
-: Тренировочный зал Храма. Седой человек стоит у неё за спиной и говорит тихо: смотри не глазами.
-: Годы. Много лет одного и того же голоса.
recall 3
still off
-: Рядом с Толмом киффар. Он улыбается ей так, будто они вместе уже прыгали в пропасть.
still xoman
-: Ксоман III. Пираты небесных лодок, юная принцесса и прыжок с одной лодки на другую.
recall 8
still off
music duel
show aayla center kiffex angry lekku=tense
aayla: Хватит! Взять их!
-: Анзати бросаются на дорогу. И тут земля под ними оживает: корни хватают их за ноги.
show traa right robe calm
traa: Я Т'ра Саа, страж Киффекса. Уводи своих, девочка. Пока ещё можешь.
hide all
if ambush_score >= 2
battle traa_duel party
else
battle traa_duel
end
-: Эйла уводит анзати в холмы. Корни отпускают их, как только джедаи остаются позади.
goto ch2_report

@ch2_report
bg kiffex_sanctum night
music karkko
show karkko right robe calm
show aayla left kiffex sad lekku=down
aayla: Учитель, я не привела ни пленных, ни джедаев.
karkko: Знаю. Ты ушла из кантины, потому что я так захотел. Это была моя воля.
karkko: Суп джедая сделал бы меня сильнее. Намного сильнее.
-: Эйла смотрит на свои руки. Каркко ждёт.
choice
> Предложить ему себя. -> ch2_offer | offered, dark+5
> Промолчать. -> ch2_silent
end

@ch2_offer
aayla: Возьми мой. Я твоя ученица.
face karkko smile
karkko: Нет. Твой суп подождёт. Джедаи придут сами, им некуда деться.
goto ch2_fortress

@ch2_silent
face karkko smile
karkko: Молчишь. Правильно. Джедаи придут сами, им некуда деться.
goto ch2_fortress

@ch2_fortress
hide all
rest
-: Через несколько дней к храму приходят четверо джедаев. Анзати выходят им навстречу.
-: Снаружи гудят клинки и кричат анзати. Потом становится тихо. В святилище входит только один.
show vos right early resolute
show karkko center robe smile
karkko: Добро пожаловать в моё святилище. Тысячу лет оно было моей тюрьмой. Теперь это мой трон.
karkko: Кроме моей ученицы, ты мой первый гость.
show aayla left kiffex angry lekku=tense
karkko: Убей его, ученица.
-: Киффар не зажигает клинок. В его руке что-то светится тёплым светом.
hide all
battle duel_sanctum
goto ch2_lower

@ch2_lower
bg kiffex_sanctum night
music aayla
show vos right early calm
show aayla left kiffex sad lekku=down
-: Эйла опускает клинок. В ладони киффара лежит камень, тёплый, как уголь. Сердце огня.
cg sanctum
still terbeasts
-: Огден-Минор. Тербисты. Она и этот киффар спина к спине, и она его вытаскивает.
recall 9
still off
cg off
aayla: Мастер Вос.
face vos smile
vos: Вот и ты.
show karkko center robe angry
karkko: Я не терплю предателей.
cg lightning
-: Молния Каркко бьёт Эйлу в грудь. Мир становится белым, потом чёрным.
cg off
hide all
-: Вос остаётся с Каркко один на один.
battle karkko_boss
goto ch2_kiffu

@ch2_kiffu
bg kiffu_hall day
music temple
set retinue=false
-: Эйла приходит в себя на Киффу. Ей говорят, что Каркко мёртв: Вос разрубил его надвое.
show mace center robe calm
show aayla left kiffex sad lekku=down
mace: Тьма коснулась и тебя, и твоего учителя. Мы не можем оставить вас вместе.
show adi right robe calm
adi: Ты закончишь обучение у мастера Толма. Он тебя помнит.
show plo right robe calm
plo: Твоя память вернётся. Не вся и не сразу, но вернётся.
hide all
cg kiffu_council
-: В стороне ждут Толм и Т'ра Саа. Нети кивает Эйле так, будто они давно знакомы.
cg off
bond traa
show vos right early calm
show aayla left kiffex thoughtful lekku=still
vos: Я ухожу. Куда, не знаю. Буду листом на ветру и полечу, куда скажет Сила.
vos: Возьми. Сиань просила вернуть его тебе.
-: Он кладёт ей в ладонь Сердце огня. Камень тёплый.
aayla: Иди, мастер. Я справлюсь.
face vos smile
vos: Знаю.
hide all
set heart, letgo.vos+1
-: Корабль Воса уходит в небо Киффу. Эйла сжимает камень, пока он не становится тёплым, как её ладонь.
goto int_start
` };
})(globalThis.Aayla98 = globalThis.Aayla98 || {});
