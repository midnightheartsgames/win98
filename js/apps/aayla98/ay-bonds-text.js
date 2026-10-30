(function (A) {
  'use strict';
  A.Scripts = A.Scripts || {};
  A.BOND_SCENES = {
    bond_tholme_1: 'Толм учит Эйлу стоять в тени так, чтобы Сила в ней не гудела. Он был наблюдателем Ордена в секторе Киффу.',
    bond_tholme_2: 'Толм учился у анзати Акку Сеи и показал Эйле, как держать Силу близко, будто запахнуть плащ.',
    bond_tholme_talk: 'Толм был занят донесениями и попросил прийти вечером.',
    bond_traa_1: 'На Киффу Т\'ра Саа простила Эйлу за холмы и показала, как дышат корни: медленно и долго.',
    bond_tholme_3: 'Толм учил Эйлу прятать в себе Силу так, чтобы её не чуял даже тот, кто сам слышит Силу.',
    bond_tholme_4: 'После моргукаев Толм признался, что кортозис научил его бить первым, и учил этому Эйлу.',
    bond_vos_1: 'На свалке Орд-Мантелла Вос рассказал, что тоже терял память, когда искал её на Рилоте.',
    bond_vos_2: 'Вос признался, что всё ещё смотрит на Эйлу как на ученицу, хоть она и рыцарь.',
    bond_vos_talk: 'Вос торопился на задание и обещал поговорить в другой раз.',
    bond_villie_1: 'Вилли объяснил Эйле, как ставить на исход драки, и сам поставил на неё.',
    bond_villie_2: 'Вилли открыл для Эйлы свой трюм с контрабандой. Цены, по его словам, для своих.',
    bond_villie_3: 'Вилли бросил Эйле фишку на счастье. Фишка уже трижды спасала ему жизнь.',
    bond_villie_talk: 'Вилли был занят ремонтом «Инферно» и ругался на всех подряд.',
    bond_secura_1: 'Лон и Нат встретили Эйлу у входа в пещерный город. Лон рассказал о её отце.',
    bond_secura_2: 'Нат учил Эйлу держать лекку так, чтобы их не мог прочесть даже Фенн.',
    bond_secura_talk: 'Лон был занят в совете, а Нат на уроках.',
    bond_vos_3: 'На «Колесе» Вос признался, что в сети шпионов верит только ей. Эйла обещала прийти по первому зову.',
    bond_kit_1: 'На Камино Кит дышал за Эйлу под водой, а потом прочёл по её лекку, как ей было страшно.',
    bond_kit_2: 'В Саду медитаций Кит бросал камешки в воду и сказал, что приходит туда, потому что там бывает Эйла.',
    bond_kit_3: 'В отсеке корабля Кит и Эйла соединили Шии-Чо и Атару в один двойной вихрь.',
    bond_kit_talk: 'Кит спешил на совет генералов и обещал поговорить позже.',
    bond_bly_1: 'После первого спарринга Блай спросил, почему Эйла дерётся без клинка, и рассказал о своих людях.',
    bond_bly_talk: 'Блай строил корпус к смотру и просил зайти вечером.',
    bond_traa_2: 'В трюме корабля Т\'ра Саа растила побеги из ладоней и рассказывала об Элсе, которая смеялась над её садами.',
    bond_traa_3: 'Т\'ра Саа научила Эйлу затягивать раны Силой: медленно, как растут корни.',
    bond_traa_talk: 'Т\'ра Саа медитировала и попросила зайти позже.',
    bond_kit_4: 'Ночью на мостике Кит заговорил о Т\'ра Саа и Толме, которые любят и не держат друг друга. Эйле пришлось выбирать.',
    bond_kit_5: 'В Саду медитаций Кит сказал, что больше не задерживает дыхание, когда Эйлу посылают на задание.',
    bond_kit_5_held: 'В Саду медитаций они встречались тайком, и Кит признался, что держит дыхание каждый раз, когда Эйла уходит в бой.',
    bond_bly_2: 'Блай показал Эйле, как не открываться после удара. Они дрались, пока не устали оба.',
    bond_secura_3: 'Нат прислал письмо с Рилота: Ро Фенна судили, а Лон гордится тем, что Эйла из клана Секура.',
    bond_vos_4: 'Через сеть Толма пришла шифровка от Воса: он всё ещё помнит, как учил Эйлу, и просит не верить слухам.',
    bond_vos_5: 'В подземелье разума Эйла протянула Восу руку и отпустила его: теперь он идёт сам, а она только светит.',
    bond_tholme_5: 'После Салеуками Толм медитировал рядом с Эйлой и сказал, что учить ему её больше нечему.',
    bond_bly_3: 'На Хоногре Блай стрелял в Воса, чтобы спасти генерала. Он решил, что будет прикрывать её и дальше.',
    bond_bly_4: 'На крейсере Блай спросил о Хоногре. Эйла рассказала, почему для неё задание провалено.',
    bond_kit_5_holo: 'По голосвязи Кит сказал, что больше не задерживает дыхание, когда Эйлу посылают на задание.',
    bond_ekria_1: 'На «Интрепиде» Экрия нашла Барисс Оффи по банковским переводам Шу Май и показала Эйле, как вскрывать замки дроидов.',
    bond_ekria_2: 'Экрия рассказала о погибшем учителе и научила Эйлу видеть ловушки там, где их рассчитал бы враг.',
    bond_ekria_3: 'У ручья на Фелуции Эйла решала, отдать ли Экрии Сердце огня.',
    bond_ekria_talk: 'Экрия сидела над расчётами и просила зайти позже.',
    bond_bly_5: 'Блай сказал, что пойдёт за генералом куда угодно, и отделение 327-го научилось бить залпом по её знаку.'
  };
  A.Scripts.bonds = { file: 'ay-bonds-text.js', start: null, src: `
@bond_tholme_1
bg temple_cell night
music memory
show tholme right robe calm
show aayla left padawan thoughtful lekku=still
tholme: Встань у стены. Туда, где кончается свет лампы.
-: Эйла встаёт в тень. Толм прикручивает лампу.
tholme: Сейчас ты прячешься. Попробуй стать частью тени. Сила в тебе гудит, и её слышно издалека.
aayla: Как её приглушить?
tholme: Дыши медленнее. Не думай о том, кто ищет. Думай о стене за спиной.
cg bond_tholme
-: Эйла дышит медленнее. Лампа мигает, и Толм на миг смотрит туда, где её нет.
tholme: Вот. Я потерял тебя на полвздоха.
choice
  > Спросить, где он этому научился. -> bond_tholme_1_where | bond.tholme+1
  > Попросить ещё раз. -> bond_tholme_1_again
end

@bond_tholme_1_where
aayla: Где вы этому научились?
tholme: Я много лет был наблюдателем Ордена в секторе Киффу. Там меня не должны были замечать. Там же я нашёл Квинлана.
goto bond_tholme_1_end

@bond_tholme_1_again
aayla: Ещё раз. Хочу на целый вздох.
face tholme smile
tholme: Хорошо. Только лампу я больше трогать не буду.
-: Во второй раз Толм теряет её на целый вздох.
goto bond_tholme_1_end

@bond_tholme_1_end
cg off
tholme: Когда крадёшься, держись теней. Враги заметят тебя только вблизи.
return

@bond_tholme_2
if respite == p5
bg taskforce_bridge night
else
bg temple_council day
end
music temple
show tholme right robe calm
show aayla left padawan calm lekku=still
-: Совет уже разошёлся. Толм сидит в пустом зале и читает донесения.
aayla: Мастер, на Киффексе вы дрались с анзати так, будто знали каждый их шаг.
tholme: Знал. Я учился у анзати. Его зовут Акку Сеи, он учит на Анзате убийц.
aayla: Джедай учился у убийцы?
choice
  > Сказать это с упрёком. -> bond_tholme_2_blame | bond.tholme-1
  > Спросить, чему он научился. -> bond_tholme_2_what | bond.tholme+1
end

@bond_tholme_2_blame
aayla: Странный выбор учителя для джедая.
tholme: Странный. Зато Квинлан жив, и я тоже. Анзати не любят, когда у них уводят добычу.
goto bond_tholme_2_lesson

@bond_tholme_2_what
aayla: И чему вы у него научились?
tholme: Ходить так, чтобы тебя не чуяли. Зверь слышит Силу раньше шагов. Её надо держать близко, как плащ на ветру.
goto bond_tholme_2_lesson

@bond_tholme_2_lesson
cg bond_tholme
-: Толм показывает, как собрать Силу к себе, будто запахнуть плащ. С третьего раза у Эйлы выходит.
tholme: Звери тебя теперь не заметят, пока ты крадёшься. С людьми так не получится, у них есть глаза.
cg off
return

@bond_tholme_talk
bg temple_council day
music temple
show tholme right robe calm
show aayla left padawan calm lekku=still
-: Толм читает донесения. Он отвечает коротко, но не прогоняет её.
tholme: Приходи вечером. Мне надо дочитать.
return

@bond_traa_1
bg kiffu_hall day
music temple
show traa right robe calm
show aayla left kiffex shy lekku=down
-: Совет кончился. Т'ра Саа стоит у окна, неподвижная, как дерево.
aayla: Мастер Т'ра Саа. В холмах я привела на вас анзати. Простите меня.
traa: Ты их привела, а я их держала. Никто не умер. Для такого дня это хороший итог.
choice
  > Спросить, почему она не ушла. -> bond_traa_1_why | bond.traa+1
  > Сказать, что не заслуживает прощения. -> bond_traa_1_guilt
end

@bond_traa_1_why
aayla: Вас сбили над Киффексом. Почему вы всё равно пошли за нами в холмы?
traa: После Толма наблюдатель Ордена в секторе Киффу я. Уйти отсюда я не могу.
aayla: Даже когда в вас стреляют свои?
traa: Мне кажется, Шейф нарочно не предупредила стражей обо мне. Корабль сбили. Я стояла в лесу деревом, пока меня искали. Деревья умеют ждать.
goto bond_traa_1_end

@bond_traa_1_guilt
aayla: Я не заслуживаю, чтобы меня прощали.
traa: Я учила Мейса Винду, когда он был падаваном. Ученики ошибаются. Учителя тоже. С этим живут.
face aayla sad lekku=still
aayla: Долго?
face traa smile
traa: У нети долго всё. Тебе хватит меньшего.
goto bond_traa_1_end

@bond_traa_1_end
cg bond_traa
-: Т'ра Саа садится на пол и показывает, как дышат корни: медленно и долго. Эйла садится рядом.
traa: Покой держи на вдох дольше, чем хочется.
cg off
return

@bond_tholme_3
if respite == p5
bg taskforce_bridge night
else
bg temple_hall day
end
music temple
show tholme right robe calm
show aayla left robe calm lekku=still
tholme: В доме Фенна тебя не раскрыли по Силе. Там некому было её слышать. Другие услышат.
aayla: Анзати? Каркко слышал меня с другого конца Киффекса.
tholme: Вот именно. Плащ прячет тебя от зверей. Теперь спрячь Силу от тех, кто сам её слышит.
choice
  > Спросить, от кого он прятался сам. -> bond_tholme_3_who | bond.tholme+1
  > Попросить начать сразу. -> bond_tholme_3_now
end

@bond_tholme_3_who
tholme: Наблюдатель Ордена прячется от всех. От тех, за кем следит, и от тех, кто следит за ним.
goto bond_tholme_3_lesson

@bond_tholme_3_now
face tholme smile
tholme: Начнём. Только не сжимай Силу в кулак. Её надо опустить, как голос.
goto bond_tholme_3_lesson

@bond_tholme_3_lesson
cg bond_tholme
-: Толм закрывает глаза и ищет её Силой по всему залу. Три раза находит. На четвёртый проходит мимо.
tholme: Вот так. Сила врагов тебя теперь не чует.
cg off
return

@bond_tholme_4
if respite == p5
bg taskforce_bridge night
else
bg temple_hall day
end
music temple
show tholme right robe thoughtful
show aayla left robe calm lekku=still
tholme: Цир победил меня одним ударом. Знаешь почему? Он ударил первым, а я ещё смотрел.
aayla: Вы джедай. Джедаи не нападают первыми.
tholme: Джедаи не начинают войн. Это другое. Если враг уже здесь, первый удар твой.
choice
  > Согласиться. -> bond_tholme_4_yes | bond.tholme+1
  > Возразить. -> bond_tholme_4_no
end

@bond_tholme_4_yes
aayla: Тогда я буду бить из тени, пока они смотрят.
goto bond_tholme_4_end

@bond_tholme_4_no
aayla: А если я ошибусь и ударю того, кто не враг?
tholme: Тогда смотри дольше, чем бьёшь. Но когда бьёшь, бей.
goto bond_tholme_4_end

@bond_tholme_4_end
-: До вечера они отрабатывают один удар: из тени, без звука, в первый миг боя.
-: Если отряд напал первым, первый удар Эйлы клинком вдвое сильнее.
return

@bond_vos_1
bg ordmantell_junk day
music aayla
show vos right early calm
show aayla left robe sad lekku=down
vos: Знаешь, я ведь тоже терял память. Когда искал тебя на Рилоте.
aayla: Ты? Тоже?
vos: Я помнил своё имя и то, что умею драться. Остальное возвращалось кусками. Как у тебя.
choice
  > Спросить, что вернулось первым. -> bond_vos_1_first | bond.vos+1
  > Спросить, почему он не вернулся в Храм. -> bond_vos_1_temple
end

@bond_vos_1_first
vos: Ты. Как ты зовёшь меня через Силу у хатта. Тебе было два года.
face aayla smile lekku=up
aayla: Это и у меня было первым. Вампа и ты.
goto bond_vos_1_end

@bond_vos_1_temple
vos: Совет решил, что меня тоже коснулась Тьма. Они не ошиблись. Мне надо было побыть одному.
goto bond_vos_1_end

@bond_vos_1_end
vos: Дай мне руку. Смотри, как я читаю вещи.
-: Вос касается рукояти её меча и называет три её последних удара. Эйла пробует сама на его наручах.
-: Прочтение Эйлы теперь показывает два хода врага и его слабости.
return

@bond_vos_2
if respite == p3
bg temple_cell night
music temple
show vos right early calm
show aayla left robe calm lekku=still
-: Голограмма Воса мигает. Он где-то далеко и, судя по шуму за спиной, бежит.
vos: Рыцарь Секура! Говори быстрее, у меня тут погоня.
else
bg temple_garden dusk
music temple
show vos right early calm
show aayla left robe calm lekku=still
-: Крыша над Садом медитаций. Вос показывает ей звёзды, среди которых Киффу.
end
vos: Я до сих пор смотрю на тебя и жду, что ты упадёшь. Глупо, ты же рыцарь.
aayla: Я тоже до сих пор жду, что ты прибежишь меня ловить.
choice
  > Сказать, что больше не нужно ловить. -> bond_vos_2_free
  > Сказать, что ей это нравится. -> bond_vos_2_warm | bond.vos+1
end

@bond_vos_2_free
aayla: Мне больше не надо, чтобы меня ловили. Мне надо, чтобы ты был жив.
vos: Это я могу. Наверное.
goto bond_vos_2_end

@bond_vos_2_warm
aayla: Мне нравится, что ты ждёшь. Только не говори Совету.
face vos smile
vos: Совет и так знает. Он всё знает. Это раздражает.
goto bond_vos_2_end

@bond_vos_2_end
cg bond_vos
-: Они молчат и смотрят вверх. Рядом с Восом это молчание никогда не бывает пустым.
cg off
return

@bond_vos_talk
if respite == p7 || respite == p8
goto bond_vos_talk_cipher
end
bg temple_garden day
show vos right early calm
show aayla left robe calm lekku=still
vos: Прости, рыцарь, у меня через час вылет. Поговорим, когда вернусь.
return

@bond_vos_talk_cipher
bg holstice_hospital day
show tholme right robe calm
show aayla left robe calm lekku=still
tholme: Шифровки от Квинлана нет уже неделю. Приходи позже, Эйла.
return

@bond_villie_1
bg kintan_wastes day
music aayla
show villie right spacer smile
show aayla left robe calm lekku=still
villie: Смотри, красавица. Перед дракой я всегда ставлю. Быстро ли кончится, все ли уйдут целыми.
aayla: А если проиграешь?
villie: Тогда я проиграл деньги. Когда не ставишь, проигрываешь только жизнь. Скучно.
choice
  > Сказать, что джедаи не играют на деньги. -> bond_villie_1_no
  > Спросить, как поставить. -> bond_villie_1_how | bond.villie+1
end

@bond_villie_1_no
villie: Джедаи и в сабакк не играют, а потом удивляются, почему их все обыгрывают.
goto bond_villie_1_end

@bond_villie_1_how
villie: Говоришь, на что ставишь, кладёшь кредиты. Угадала, получаешь втрое. Нет, Орден получает меньше.
goto bond_villie_1_end

@bond_villie_1_end
-: Вилли показывает, как он считает шансы. Эйла запоминает больше, чем показывает.
-: Когда Вилли нет рядом, Эйла может поставить сама: «Ставка» в бою.
return

@bond_villie_2
bg temple_pad dusk
music aayla
show villie right spacer smile
show aayla left robe calm lekku=still
villie: Рыцарь! Поздравляю. У меня для рыцарей скидка. Только тсс.
aayla: Что у тебя в трюме, Вилли?
villie: Бакта, которой нет ни в одной описи. Стимуляторы. Вспышки. Всё, что спасает, когда Орден опаздывает.
choice
  > Спросить, откуда это. -> bond_villie_2_where
  > Посмеяться и посмотреть товар. -> bond_villie_2_look | bond.villie+1
end

@bond_villie_2_where
villie: Откуда? Из трюма. А в трюм оно попало, когда никто не смотрел.
goto bond_villie_2_end

@bond_villie_2_look
face aayla laugh lekku=up
aayla: Покажи. Только чтобы мастер Толм не видел.
goto bond_villie_2_end

@bond_villie_2_end
-: Лавка Вилли открыта. Её можно найти в меню паузы.
return

@bond_villie_3
bg temple_pad day
music aayla
show villie right spacer thoughtful
show aayla left robe calm lekku=still
villie: Держи. Это фишка из казино на Нар-Шаддаа. Она трижды меня вытаскивала.
aayla: И ты её отдаёшь?
villie: У меня есть ещё. А ты лезешь туда, откуда фишки не возвращаются.
choice
  > Взять фишку. -> bond_villie_3_take | bond.villie+1
  > Спросить, зачем ему это. -> bond_villie_3_why
end

@bond_villie_3_take
aayla: Спасибо, Вилли. Правда.
goto bond_villie_3_end

@bond_villie_3_why
villie: Если ты пропадёшь, на кого мне ставить? На Квинлана? Он сам себя обыгрывает.
goto bond_villie_3_end

@bond_villie_3_end
cg bond_villie
-: Фишка тёплая и чуть липкая. Эйла кладёт её в пояс.
-: Счастливая фишка: раз за главу, когда отряд падает, Эйла встаёт с частью здоровья.
cg off
return

@bond_villie_talk
bg temple_pad day
show villie right spacer angry
show aayla left robe calm lekku=still
villie: Не сейчас! Гипердвигатель опять пахнет жареным, а это плохая примета.
return

@bond_secura_1
bg secura_chamber day
music ryloth
show lon right robe calm
show nat center child smile
show aayla left robe calm lekku=still
cg bond_secura
-: Лон и Нат провожают её до входа в пещерный город.
lon: Твой отец был моим братом. Он умер, когда тебе было два. Мы не уберегли тебя тогда.
cg off
choice
  > Спросить об отце. -> bond_secura_1_father | bond.secura+1
  > Сказать, что не держит зла. -> bond_secura_1_peace
end

@bond_secura_1_father
lon: Он смеялся громче всех в доме. Ты смеёшься так же. Я услышал вчера и испугался.
goto bond_secura_1_end

@bond_secura_1_peace
aayla: Я не держу зла. Меня нашли джедаи. Может, так было нужно.
lon: Может быть. А может, нам просто повезло, что Сила оказалась умнее нас.
goto bond_secura_1_end

@bond_secura_1_end
-: Нат показывает ей старый танец лекку, который танцуют в клане после болезни. Медленный, почти без движения.
-: Танец лекку: раз на месте Эйла может станцевать его в меню паузы, и отряд залечит раны.
return

@bond_secura_2
bg secura_chamber day
music ryloth
show nat center child smile
show aayla left robe calm lekku=still
-: Нат подрос. Ро Фенн ушёл в Светлые земли и не вернулся, как требует обычай.
nat: Тётя Эйла, давай в «молчащие лекку». Я загадываю, ты прячешь.
choice
  > Согласиться. -> bond_secura_2_play | bond.secura+1
  > Спросить про Ро Фенна. -> bond_secura_2_fenn
end

@bond_secura_2_fenn
nat: Отец говорит, совет поступил правильно. А я рад, что больше не вижу его на пирах.
goto bond_secura_2_play

@bond_secura_2_play
-: Нат смотрит на её лекку и угадывает всё хуже. Последний раз он не угадывает совсем.
set restraint+1
-: Сдержанность лекку выросла на ступень.
return

@bond_secura_talk
bg secura_chamber day
show lon right robe calm
show aayla left robe calm lekku=still
lon: Прости, Эйла. Совет собирается через час, а Нат на уроках.
return

@bond_vos_3
bg wheel_maint night
music aayla
show vos right clonewars calm
show aayla left jayzaa calm lekku=still
vos: Знаешь, что самое трудное в сети шпионов? Каждому, кто в ней, приходится верить на слово.
vos: Тукарти, Халин, бармены, пилоты. Всех не проверишь. А ты единственная, кого мне проверять не надо.
choice
  > Предложить работать вместе. -> bond_vos_3_together | bond.vos+1
  > Сказать, что верить надо и другим. -> bond_vos_3_trust
end

@bond_vos_3_together
aayla: Тогда держи меня в сети. Позовёшь, и я приду.
vos: Вдвоём, как раньше? Хорошо. Только теперь ловить меня придётся тебе.
goto bond_vos_3_end

@bond_vos_3_trust
aayla: Верить придётся не только мне. Толму. Совету. Себе.
vos: Себе труднее всего. Но ты права. И если что, ты рядом.
goto bond_vos_3_end

@bond_vos_3_end
-: Они стоят спиной к спине, как на свалке Орд-Мантелла. Теперь Вос бережёт её спину, а она его.
return

@bond_kit_1
bg kamino_platform day
music aayla
show kit right robe smile
show aayla left robe shy lekku=down
kit: У тебя лекку опущены. Это от холода или от того, что было под водой?
aayla: Ты читаешь лекку? Среди не-твилеков таких почти нет.
kit: Наутолане с детства читают того, кто рядом в воде. Лекку говорят громче, чем ты думаешь.
choice lekku=kit need=3
  > [lie] Сказать, что это от холода. -> bond_kit_1_lie
  > Признаться, что испугалась. -> bond_kit_1_fear | bond.kit+1
  > Промолчать. -> bond_kit_1_quiet
end

@bond_kit_1_lie
if lekku_tell
kit: Лекку говорят другое. Не стыдись, Секура. Под водой боятся все. Кроме наутолан.
else
kit: Холод, значит. Ладно. Сделаю вид, что поверил.
end
goto bond_kit_1_end

@bond_kit_1_fear
aayla: Я испугалась. Там, внизу, я думала, что больше не увижу света.
kit: Увидела же. Я был рядом. Под водой я всегда рядом, запомни.
goto bond_kit_1_end

@bond_kit_1_quiet
-: Эйла молчит. Кит кивает, будто ответ ему и так понятен.
goto bond_kit_1_end

@bond_kit_1_end
kit: Если опять полетишь в воду, зови. Дышать я умею за двоих.
return

@bond_kit_2
if respite == p5
bg taskforce_hold night
else
bg temple_garden dusk
end
music aayla
show kit right robe smile
show aayla left robe calm lekku=still
-: Кит сидит у воды в Саду медитаций и бросает в неё камешки. Каждый ложится рядом с предыдущим.
kit: Говорят, ты теперь мастер. Мастеру положено скучать на советах. Как успехи?
aayla: Скучаю отлично. А ты почему здесь?
kit: Здесь вода. И здесь бываешь ты.
choice lekku=kit need=3
  > Напомнить про Кодекс. -> bond_kit_2_code
  > [lie] Сказать, что зашла случайно. -> bond_kit_2_lie
  > Сесть рядом. -> bond_kit_2_sit | bond.kit+1
end

@bond_kit_2_code
aayla: Кит. Кодекс не запрещает дружбу. Но ты сейчас говоришь не о дружбе.
kit: Я говорю о воде и камешках, мастер Секура. Остальное ты прочла сама.
goto bond_kit_2_end

@bond_kit_2_lie
if lekku_tell
kit: Случайно? Твои лекку пришли сюда раньше тебя.
else
kit: Случайно так случайно. Садись, раз уж зашла.
end
goto bond_kit_2_end

@bond_kit_2_sit
-: Эйла садится рядом. Кит протягивает ей камешек.
kit: Бросай. Только не дальше моего. А то я расстроюсь.
goto bond_kit_2_end

@bond_kit_2_end
-: Камешки ложатся в воду рядом. Круги расходятся и пересекаются.
return

@bond_kit_3
if respite == p5
bg taskforce_hold night
else
bg temple_hall day
end
music aayla
show kit right robe resolute
show aayla left robe resolute lekku=still
if respite == p5
-: В грузовом отсеке пусто. Кит сдвигает ящики к стенам.
else
-: В тренировочном зале пусто. Кит сдвигает скамьи к стенам.
end
kit: Шии-Чо и Атару. Мой круг и твои прыжки. Хочу проверить, что выйдет, если вместе.
-: Они кружат по пустому полу. Кит держит середину, Эйла летит над ним. Два клинка у неё и один у него.
choice
  > Прыгать над его кругом. -> bond_kit_3_leap | bond.kit+1
  > Встать спиной к спине. -> bond_kit_3_back
end

@bond_kit_3_leap
aayla: Держи круг. Я пройду над ним.
kit: Тогда не промахнись мимо меня, Секура.
goto bond_kit_3_end

@bond_kit_3_back
aayla: Спиной к спине. Твой круг и мой.
kit: Два круга. Дроидам не понравится.
goto bond_kit_3_end

@bond_kit_3_end
-: Ящик у стены распадается на четыре ровных куска. Кит смеётся.
kit: Двойной вихрь. Звучит как название коктейля. Надо запомнить.
return

@bond_kit_talk
bg temple_garden day
show kit right robe smile
show aayla left robe calm lekku=still
kit: Не сейчас, Секура. Меня ждут на совете генералов. Улыбайся там за меня.
return

@bond_bly_1
bg temple_hall day
music aayla
show bly right bare calm
show aayla left robe calm lekku=still
bly: Разрешите вопрос, генерал. Почему вы не взяли клинок? С ним вы уложили бы меня за секунду.
aayla: Клинок решает за меня слишком быстро. Мне нужно знать, на что я способна без него.
bly: С бронёй так же. Без неё учишься держать удар.
choice
  > Спросить о его броне. -> bond_bly_1_armor
  > Спросить о его людях. -> bond_bly_1_men | bond.bly+1
end

@bond_bly_1_armor
bly: Броня держит выстрел. Голову она не держит, это приходится самому.
goto bond_bly_1_end

@bond_bly_1_men
bly: Триста двадцать седьмой? Лучшие люди, каких делает Камино. Вы увидите, генерал.
goto bond_bly_1_end

@bond_bly_1_end
-: Блай надевает шлем и уходит к корпусу. У двери он оборачивается.
bly: До завтра, генерал. Мат никуда не денется.
return

@bond_bly_talk
if respite == p8
bg cruiser_deck night
else
bg temple_pad day
end
show bly right phase1 calm
show aayla left robe calm lekku=still
bly: Простите, генерал. Корпус готовится к смотру. Зайдите вечером.
return

@bond_traa_2
bg taskforce_hold night
music aayla
show traa right robe calm
show aayla left robe calm lekku=still
-: В грузовом отсеке Т'ра Саа сидит среди ящиков. Из её ладоней тянутся тонкие побеги и ищут щели в полу.
traa: Корни ищут воду даже здесь. Элса смеялась, что я и на корабле разведу сад.
choice
  > Спросить об Элсе. -> bond_traa_2_elsah | bond.traa+1
  > Спросить о корнях. -> bond_traa_2_roots
end

@bond_traa_2_elsah
aayla: Какой она была?
traa: Громкой. Спорила с половиной Сената и мирила вторую половину. Мы дружили с тех пор, как она пришла в Сенат. Для нети это немного.
goto bond_traa_2_end

@bond_traa_2_roots
aayla: Как вы держите врага корнями так долго?
traa: Я не держу. Я прошу. Корни сами решают, кого не отпускать.
goto bond_traa_2_end

@bond_traa_2_end
-: Побеги обвивают запястье Эйлы и замирают, будто прислушиваются.
traa: В следующем бою мои корни продержат дольше. Они тебя запомнили.
return

@bond_traa_3
bg taskforce_bridge night
music aayla
show traa right robe smile
show aayla left robe calm lekku=still
traa: Ты нашла ту, что убила Элсу, и оставила её жить. В твои годы я бы так не смогла.
traa: Дай руку. Сила умеет не только толкать. Она умеет затягивать.
-: Т'ра Саа кладёт ладонь на старый шрам Эйлы. Под кожей тепло, будто там пустил корни росток.
choice
  > Спросить, почему она учит этому. -> bond_traa_3_why | bond.traa+1
  > Поблагодарить. -> bond_traa_3_thanks
end

@bond_traa_3_why
aayla: Почему вы учите меня этому сейчас?
traa: Потому что ты научилась не только брать. Исцелять может тот, кто умеет отдавать.
goto bond_traa_3_end

@bond_traa_3_thanks
aayla: Спасибо, мастер. За Киффу. И за это.
traa: Благодарность тоже лечит. Хуже Силы, но лечит.
goto bond_traa_3_end

@bond_traa_3_end
cg bond_traa
-: К утру Эйла умеет затянуть рану на ладони. Медленно, как растут корни.
cg off
return

@bond_traa_talk
bg taskforce_hold night
show traa right robe calm
show aayla left robe calm lekku=still
traa: Я медитирую, Эйла. Приходи, когда корни уснут.
return

@bond_kit_4
bg taskforce_bridge night
music aayla
show kit right robe calm
show aayla left robe calm lekku=still
-: Ночью на мостике никого. Кит стоит у стекла и смотрит на звёзды, будто это вода.
kit: Т'ра Саа и Толм любят друг друга, ты знала? И никто из них не держит другого. Я долго не понимал, как так можно.
aayla: А теперь понимаешь?
kit: Теперь я читаю твои лекку и понимаю, что придётся выбирать. Нам обоим.
choice lekku=kit need=3 gestures=love
  > Отпустить его. -> bond_kit_4_letgo | letgo.kit+1
  > Удержать. -> bond_kit_4_hold | dark+10 kit_held
end

@bond_kit_4_letgo
aayla: Я не хочу держаться за тебя, Кит. Я хочу, чтобы ты просто был.
kit: Как вода. Она есть, даже когда ты из неё вышел.
-: Он улыбается, и в этой улыбке нет обиды.
goto bond_kit_4_end

@bond_kit_4_hold
aayla: Я не хочу отпускать. Пусть Совет думает что хочет.
kit: Тогда держи крепче, Секура. И не говори Толму.
-: Где-то глубоко, там, где раньше звучал голос Каркко, что-то довольно шевелится.
goto bond_kit_4_end

@bond_kit_4_end
cg bond_kit
-: Они стоят у стекла до утра. Лекку и щупальца почти касаются.
cg off
return

@bond_kit_5
if respite == p8
goto bond_kit_5_holo
end
bg temple_garden dusk
music aayla
show kit right robe smile
show aayla left robe calm lekku=still
if kit_held
goto bond_kit_5_held
end
-: Кит бросает камешки в воду, как тогда. Они не ищут друг друга взглядом, просто сидят рядом.
kit: Знаешь, я больше не задерживаю дыхание, когда тебя посылают на задание. Ты всё равно со мной.
aayla: Я тоже это чувствую. Как будто ты рядом в каждом бою.
-: Отпущенная связь: каждый третий ход Эйла получает Темп, даже когда Кита нет рядом.
return

@bond_kit_5_held
-: Они встречаются так, чтобы никто не видел. Получается всё хуже.
kit: Мейс сегодня смотрел на меня так, будто всё знает. Наверное, знает.
aayla: Пусть. Я не жалею.
kit: Я тоже. Но каждый раз, когда ты уходишь в бой, я задерживаю дыхание.
-: Каждый третий ход Эйла получает Темп, но только когда Кит рядом.
return

@bond_bly_2
if respite == p6
bg temple_pad day
else
bg taskforce_deck night
end
music aayla
show bly right bare calm
show aayla left robe calm lekku=still
bly: Разрешите сказать, генерал. Вы бьёте сильно, но после удара открываетесь. В бою так долго не живут.
choice
  > Предложить показать на деле. -> bond_bly_2_show | bond.bly+1
  > Сказать, что знает. -> bond_bly_2_know
end

@bond_bly_2_show
aayla: Покажи. Только не жалей меня, коммандер.
bly: Я и не собирался, генерал.
goto bond_bly_2_end

@bond_bly_2_know
aayla: Знаю. Толм говорил то же самое восемь лет подряд.
bly: Тогда пусть девятый год будет последним. Становитесь.
goto bond_bly_2_end

@bond_bly_2_end
-: Они дерутся, пока не устают оба. К концу Эйла закрывается после каждого удара, не думая.
-: Рукопашная Эйлы бьёт на пятую часть сильнее.
return

@bond_secura_3
bg temple_cell night
music ryloth
show aayla left robe calm lekku=still
-: В келье ждёт письмо с Рилота. Почерк неровный, детский: Нат учится писать на общем.
-: «Тётя Эйла! Ро Фенна судили и отправили в Светлые земли. Отец говорит, что совет теперь честнее. Я в это не очень верю».
-: Ниже приписка рукой Лона: «Клан Секура гордится тобой. На Рилоте теперь говорят: джедай из нашего клана».
choice
  > Написать Нату ответ. -> bond_secura_3_write | bond.secura+1
  > Перечитать приписку Лона. -> bond_secura_3_read
end

@bond_secura_3_write
-: Эйла пишет о Девароне, о слугах-мастерах и о том, что честность совета зависит и от Ната тоже.
goto bond_secura_3_end

@bond_secura_3_read
-: Эйла перечитывает приписку трижды. Клан, который когда-то продал её, теперь говорит «наша».
goto bond_secura_3_end

@bond_secura_3_end
cg bond_secura
-: Имя клана теперь звучит иначе. С твилеками Эйле говорить легче.
cg off
return
@bond_kit_5_holo
bg cruiser_bridge night
music aayla
show kit right robe smile
show aayla left robe calm lekku=still
-: Голограмма Кита мигает над проектором. Он на другом краю галактики, но улыбается так же.
if kit_held
goto bond_kit_5_holo_held
end
kit: Слышал про Хоногр. Знаешь, я больше не задерживаю дыхание, когда тебя посылают на задание. Ты всё равно со мной.
aayla: Я тоже это чувствую. Как будто ты рядом в каждом бою.
-: Отпущенная связь: каждый третий ход Эйла получает Темп, даже когда Кита нет рядом.
return

@bond_kit_5_holo_held
kit: Слышал про Хоногр. Каждый раз, когда тебя посылают в бой, я задерживаю дыхание, Секура.
aayla: Я знаю. Мне тоже без тебя тяжело.
-: Каждый третий ход Эйла получает Темп, но только когда Кит рядом.
return

@bond_vos_4
if respite == p7
bg holstice_hospital day
else
bg cruiser_bridge night
end
music aayla
show tholme right robe calm
show aayla left robe calm lekku=still
tholme: Пришла шифровка через мою сеть. Через трёх посредников, старым кодом Киффу. Для тебя.
-: Голос Воса звучит глухо, будто он говорит, прикрыв рот ладонью.
vos: Эйла. Если Толм дал тебе это, значит, он мне ещё верит. Про меня скажут много плохого. Половина будет правдой.
vos: Я всё ещё помню, как ты в десять лет стояла передо мной очень прямо. Держись так же. И не ищи меня.
choice
  > Записать ответ тем же кодом. -> bond_vos_4_reply | bond.vos+1
  > Спросить Толма, жив ли в Восе джедай. -> bond_vos_4_ask
end

@bond_vos_4_reply
aayla: Квинлан. Я не ищу. Я жду. Возвращайся.
tholme: Дойдёт через неделю. Если дойдёт.
goto bond_vos_4_end

@bond_vos_4_ask
aayla: Мастер, в нём ещё жив джедай?
tholme: Он прислал тебе шифровку, хотя это опасно. Сама и ответь.
goto bond_vos_4_end

@bond_vos_4_end
-: Толм стирает запись. В сети Толма ничего не хранят дольше, чем нужно.
return

@bond_vos_5
bg vos_mind night
music aayla
show vos right clonewars calm
show aayla left robe calm lekku=still
-: Темнота светлеет. Квинлан стоит рядом, и между ними нет больше ни учителя, ни ученицы.
vos: Ты держала меня, когда я падал. Теперь можешь отпустить.
aayla: Отпускаю. Иди сам, Квинлан. Если что, я посвечу.
cg bond_vos
-: Отпустить не значит потерять. Эйла чувствует его в Силе, как тепло камня с Киффу.
cg off
-: Связь отпущена. Сумеречный танец и Темп в начале каждого боя.
return

@bond_tholme_5
bg saleucami_complex night
music temple
show tholme right robe smile
show aayla left robe calm lekku=still
-: Они сидят на камне посреди разбитого зала. Толм вытирает кровь с виска и смеётся тихо, одними глазами.
tholme: Вдвоём мы вытащили его, Эйла. Одному мне бы не хватило сил.
tholme: Мне больше нечему тебя учить. Теперь можно просто медитировать рядом.
cg bond_tholme
-: Сила течёт между ними ровно, как вода в спокойном ручье.
cg off
-: Медитация вдвоём: раз за главу в меню паузы можно вернуть отряду всю Силу.
return

@bond_bly_3
bg honoghr_forest day
music aayla
show bly right phase2 calm
show aayla left robe calm lekku=still
bly: Генерал. Я стрелял в джедая. Если нужно, подам рапорт.
aayla: Ты спасал мне жизнь, Блай. Рапорта не нужно.
bly_thinks: Генерал говорит, рапорта не нужно. Значит, в следующий раз опять стрелять мне. Буду ближе.
bly: Тогда я встану между вами и следующим, генерал. Кто бы он ни был.
-: Прикрыть генерала: в бою Блай принимает выстрелы и броски, нацеленные в Эйлу.
return

@bond_bly_4
bg cruiser_deck night
music aayla
show bly right bare calm
show aayla left robe calm lekku=still
-: В отсеке отделения пусто, бойцы спят. Блай чистит пистолеты и не поднимает головы.
if honoghr_deflected
goto bond_bly_4_why
end
bly: Разрешите вопрос, генерал. Контейнер у нас. Почему вы говорите, что задание провалено?
choice
  > Объяснить, что погибла целая планета. -> bond_bly_4_world | bond.bly+1
  > Сказать, что Вос ушёл. -> bond_bly_4_vos
end

@bond_bly_4_why
bly: Разрешите вопрос, генерал. На Хоногре вы отбили мой выстрел. Почему?
choice
  > Объяснить, что Вос ей как отец. -> bond_bly_4_father | bly_told bond.bly+1
  > Сказать, что это не его дело. -> bond_bly_4_cold
end

@bond_bly_4_father
aayla: Вос мне как отец, Блай. Он меня нашёл, когда мне было два года. Он падает, а я не могу смотреть, как его убивают.
bly: Понимаю, генерал. Вернее, не понимаю. Но запомню.
bly_thinks: У клонов нет отцов. Есть сержанты. Наверное, это похоже.
goto bond_bly_4_end

@bond_bly_4_cold
aayla: Это не твоё дело, коммандер.
bly: Есть, генерал.
-: Он снова чистит пистолеты. Тише, чем раньше.
goto bond_bly_4_end

@bond_bly_4_world
aayla: Мы забрали контейнер и улетели. А Хоногр остался умирать. Целый мир, Блай.
bly: Задание было про контейнер, генерал.
aayla: Вот поэтому оно и провалено.
goto bond_bly_4_end

@bond_bly_4_vos
aayla: Квинлан ушёл. И я не знаю, вернётся ли он.
bly: Вернётся, генерал. Плохие пули всегда возвращаются.
goto bond_bly_4_end

@bond_bly_4_end
cg bond_bly
-: Они сидят молча, пока свет в отсеке не гаснет на ночь.
cg off
return
@bond_ekria_1
bg intrepid_gym night
music aayla
show ekria right padawan smile
show aayla left robe calm lekku=still
ekria: Шу Май осторожна, учитель. Но банки болтливы. Три перевода охране тюрьмы, и все из одного кошелька.
aayla: Ты нашла Барисс по счетам?
ekria: По процентам. Деньги всегда текут туда, где их ждут. Хотите, покажу, как говорить с замками дроидов?
choice
  > Попросить показать. -> bond_ekria_1_show | bond.ekria+1
  > Спросить, кто её учил. -> bond_ekria_1_who
end

@bond_ekria_1_show
-: Экрия раскрывает датапад. Через минуту учебный дроид в углу отсека послушно поворачивается к своей мишени.
ekria: Видите? Дроид верит последнему, кто с ним говорил. Как некоторые сенаторы.
goto bond_ekria_1_end

@bond_ekria_1_who
ekria: Мой учитель погиб в начале войны. С тех пор меня учат расчёты.
-: Она говорит это ровно, как цифры. Эйла слышит, сколько за этим тишины.
goto bond_ekria_1_end

@bond_ekria_1_end
-: Взлом: Эйла может на два хода повернуть дроида или турель против своих.
return

@bond_ekria_talk
if respite == p10
bg felucia_camp night
else
bg intrepid_bridge night
end
show ekria right padawan calm
show aayla left robe calm lekku=still
ekria: Учитель, я почти сошлась с цифрами. Дайте мне час.
return

@bond_ekria_2
bg intrepid_bridge night
music aayla
show ekria right padawan calm
show aayla left robe calm lekku=still
-: Экрия сидит на мостике одна и считает. На экране схема тюрьмы Нигко.
ekria: Мой учитель говорил: ловушку ставят там, где её рассчитал бы ты сам. Значит, надо считать за врага.
aayla: Ты скучаешь по нему.
choice
  > Сказать, что учитель гордился бы ей. -> bond_ekria_2_proud | bond.ekria+1
  > Попросить научить считать за врага. -> bond_ekria_2_teach
end

@bond_ekria_2_proud
aayla: Он бы тобой гордился, Экрия.
ekria: Он бы сказал, что я считаю слишком медленно. Но спасибо, учитель.
goto bond_ekria_2_end

@bond_ekria_2_teach
aayla: Научи меня считать за врага.
ekria: Смотрите. Где бы вы спрятали турель, если бы не хотели, чтобы её нашли?
goto bond_ekria_2_end

@bond_ekria_2_end
-: Расчёт: тайники и ловушки на картах видны без Чутья.
return

@bond_ekria_3
bg felucia_stream night
music aayla
show ekria right padawan sad
show aayla left robe calm lekku=still
-: Ручей у лагеря. Здесь, на Фелуции, Эйла когда-то похоронила Т'да. Холмик зарос светящимися грибами.
ekria: Учитель, а что у вас на шее? Он светится, как уголь.
aayla: Сердце огня. Камень с Киффу. Его подарил мне Вос, когда мне было тринадцать. Потом он не раз ко мне возвращался.
choice
  > Отдать камень Экрии. -> bond_ekria_3_give | heart_given bond.ekria+1
  > Оставить камень себе. -> bond_ekria_3_keep
end

@bond_ekria_3_give
aayla: Возьми. Он греет, когда холодно и когда страшно. Тебе он нужнее.
ekria: Учитель, я не могу...
aayla: Можешь. Камни с Киффу любят переходить из рук в руки.
cg bond_ekria
-: Экрия сжимает камень в ладони. Он светится между её пальцев.
cg off
goto bond_ekria_3_end

@bond_ekria_3_keep
aayla: Я пока не могу с ним расстаться. Но я научу тебя тому, чему он научил меня: тепло можно носить в себе.
ekria: Я запомню, учитель.
goto bond_ekria_3_end

@bond_ekria_3_end
-: Ручей тихо шумит. Экрия сидит рядом, пока не гаснут грибы.
return

@bond_bly_5
if respite == p10
bg felucia_camp night
else
bg intrepid_gym night
end
music aayla
show bly right bare smile
show aayla left robe smile lekku=still
bly: Генерал. Отделение отработало залп по вашему знаку. Взмах левой рукой, и мы бьём все разом.
aayla: Вы самые храбрые солдаты, каких я видела, Блай. Я уже говорила это 501-му. Вам тоже скажу.
bly: Мы пойдём за вами куда угодно, генерал. Это не приказ. Это мы так решили.
choice
  > Поблагодарить его. -> bond_bly_5_thanks | bond.bly+1
  > Пошутить про спарринг. -> bond_bly_5_joke
end

@bond_bly_5_thanks
aayla: Спасибо, Блай. Я рада, что ты рядом.
bly_thinks: Генерал рада, что я рядом. Я тоже. Броня держит выстрел. Остальное держит она.
goto bond_bly_5_end

@bond_bly_5_joke
aayla: Куда угодно, только не на мат после спарринга?
bly: Туда тоже, генерал. Но вы снова будете первой.
goto bond_bly_5_end

@bond_bly_5_end
cg bond_bly
-: Отделение 327-го: Блай раз за бой зовёт отделение, и оно даёт залп по всем врагам.
cg off
return
` };
})(globalThis.Aayla98 = globalThis.Aayla98 || {});
