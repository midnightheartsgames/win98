(function (A) {
  'use strict';
  A.Scripts = A.Scripts || {};
  A.Scripts.int = { file: 'ay-int.js', start: 'int_start', src: `
@int_start
chapter int
bg intrepid_gym night
music memory
-: «Интрепид» идёт с Киффу к Корусанту. В тренировочном отсеке гудят двигатели, в иллюминаторе одни звёзды.
show aayla left padawan thoughtful lekku=still
show plo right robe calm
plo: Твоя память вернулась кусками. Они лежат как попало, поэтому ты им не веришь.
plo: Я могу помочь их разложить. Для этого мне придётся войти в твой разум. Позволишь?
choice
  > Позволить. -> int_open
  > Спросить, каково это. -> int_ask
end

@int_ask
aayla: Каково это, когда кто-то ходит у тебя в голове?
plo: Похоже на сон, который помнишь утром. Я держу свет, смотришь ты.
aayla: Хорошо. Входите.
goto int_open

@int_open
-: Пло Кун касается её лба. Голос у него в голове звучит так же ровно, как снаружи.
if missed > 0
plo: Здесь лежат и те, что ты пропустила на Рилоте. Я их вытащу. Картинки будут бледными, и умения вернутся не сразу.
memory restore
else
plo: Всё, что ты вернула на Рилоте, на месте. Хорошо.
end
plo: Под ними есть ещё один обрывок. Свежий. В нём кто-то стреляет.
still ryloth_stun
recall 12
face aayla angry lekku=tense
aayla: Асанте. Она выстрелила мне в спину в рилловой шахте. Потом был дядя и стакан.
face plo calm
plo: Теперь ты знаешь, откуда пришла пустота. Страху труднее войти, когда знаешь, где дверь.
still off
face aayla calm lekku=still
plo: Остальное сложи сама. По порядку, как жила.
memory palace
if palace >= 5
plo: Ровная линия. Почти без разрывов.
else
plo: Не всё на своём месте. Ничего страшного, ты к ним ещё вернёшься.
end
goto int_dallin

@int_dallin
bg intrepid_bridge night
music temple
show plo center robe calm
show dallin right crew smile
dallin: Мастер Пло! Мне сказали, что вы на борту, и я пришёл сам.
plo: Джейс Даллин. Рад тебя видеть.
show aayla left padawan surprised lekku=still
-: Лицо у Даллина в старых шрамах. В Галактике есть бакта, и таких шрамов почти никто не носит.
choice
  > Спросить про шрамы. -> int_scars
  > Отвести взгляд. -> int_scars_quiet
end

@int_scars
aayla: Простите. Откуда у вас эти шрамы?
dallin: Это мои боевые знамёна. С войны Старка.
goto int_war

@int_scars_quiet
-: Эйла отводит глаза, но Даллин уже заметил.
dallin: Смотрите, падаван, я не обижусь. Это мои боевые знамёна. С войны Старка.
goto int_war

@int_war
dallin: Бакты тогда не хватало никому. Раны заживали как придётся.
show mace right robe calm
mace: Четырнадцать лет назад. Квинлан был тогда падаваном у Толма.
show tholme center robe calm
tholme: Ему было тринадцать. Тебе он рассказывал эту историю много раз.
face aayla sad lekku=down
aayla: Я её не помню. На этом месте пусто.
tholme: Тогда расскажем мы. Каждый то, что видел сам.
hide all
bg avos_mine night
music memory
-: 44 ДБЯ. Контрабандист Иако Старк собрал пиратов в Торговое объединение Старка. На Тиферре взорвался завод, бакты стало мало, и цены взлетели.
show mace right robe calm
mace: Сенатор Валорум предложил переговоры на Троикене: Республика, Торговая федерация и Старк. Джедаи полетели охранять делегатов.
show plo left robe calm
plo: Старк заманил нас в ловушку. Моего учителя Тивокку смертельно ранили. Он успел велеть мне держать солдат.
show dallin center crew calm
dallin: Солдат сенатора Таркина. Мы засели в старой спайсовой шахте в горе Авос. Еды на десять дней, бакты ни капли.
hide all
show tholme left robe calm
tholme: Мы с Квинланом были на Тиферре и искали, кто взорвал завод. Потом добрались до Авоса.
tholme: Квинлан узнал, что Тивокка умер, и ушёл один вглубь шахты. Они с Оби-Ваном разбудили пожирателей.
-: Пожиратели плоти. Мелкие синие насекомые Троикена, светятся в темноте и едят всё живое.
show plo right robe calm
plo: Мы с Толмом и Квай-Гоном пошли за мальчиками.
battle stark_cave none
goto int_after

@int_after
memory stark
still stark_veterans
-: Мальчики выбежали из пещеры. Толм, Пло Кун и Квай-Гон обрушили вход и запечатали пожирателей внутри.
still off
bg intrepid_bridge night
music temple
show plo left robe calm
show dallin right crew calm
plo: Потом сенатор Таркин подорвал последний заряд и открыл пещеру сам. Пожиратели съели солдат Старка. Таркин погиб в том же взрыве.
dallin: Таркина назвали героем Троикена. А жизнь мне спас мастер Пло. Я этого не забываю.
plo: Ты сам держал своих людей, Джейс.
hide all
show tholme right robe calm
show aayla left padawan thoughtful lekku=still
set xp+300
choice
  > Поблагодарить ветеранов. -> int_thanks | bond.tholme+1
  > Сказать, что это чужая память. -> int_alien
end

@int_thanks
aayla: Спасибо. Теперь на этом месте хоть что-то есть.
tholme: Там правда. Квинлан рассказывал то же самое, только громче.
goto int_coruscant

@int_alien
aayla: Это ваша память, не моя. Я слушала и ничего не вспомнила.
tholme: Знаю. Своей она не станет. Зато в ней нет ни слова лжи.
goto int_coruscant

@int_coruscant
bg temple_garden dusk
music temple
-: Корусант. Толм рассказал Йоде всё, что было на Рилоте и Киффексе.
show yoda right robe calm
show aayla left padawan sad lekku=down
yoda: Нашлась ты, Эйла. Рад я этому.
aayla: Я не знаю, нашлась ли, мастер. Иногда мне кажется, что я всё ещё там.
yoda: Строго себя не суди. Многое с тобой случилось.
aayla: Во мне чего-то не хватает. Раньше там что-то было.
cg yoda
yoda: Терпение, Эйла. Джедай ты по-прежнему, и сила превозмочь с тобой. Но верить в это ты должна.
choice
  > Спросить, куда идти дальше. -> int_yoda_where
  > Промолчать и слушать. -> int_yoda_quiet
end

@int_yoda_where
aayla: А если я снова пойду не туда?
yoda: Туда ведёт Сила, где нужна ты. Куда хочешь ты, не всегда. Слушай её.
goto int_yoda_end

@int_yoda_quiet
-: Эйла молчит. Йода тоже молчит, пока в саду не загораются фонари.
yoda: К тому, что нужно, ведёт нас Сила. Чего хотим, не всегда даёт. Помни.
goto int_yoda_end

@int_yoda_end
cg off
aayla: Я постараюсь поверить, мастер.
yoda: С тобой Сила. Поможет она тебе.
goto int_blade

@int_blade
bg temple_cell night
music memory
show tholme right robe calm
show aayla left padawan calm lekku=still
tholme: С красным клинком ты ходила, пока училась у Квинлана. Теперь ты учишься у меня. Собери себе новый.
aayla: Я не помню, как собирают клинок.
tholme: Руки помнят лучше головы. Начни с кристалла.
-: Толм кладёт перед ней кристалл. Эйла садится на коврик, закрывает глаза и держит кристалл на ладонях.
choice
  > Думать о Сердце огня. -> int_blade_heart
  > Думать о словах Йоды. -> int_blade_yoda
  > Ни о чём не думать. -> int_blade_still
end

@int_blade_heart
-: Она думает о камне Квинлана, тёплом, как уголь. Кристалл в ладонях тоже теплеет.
goto int_blade_made

@int_blade_yoda
-: «Верить в это ты должна». Эйла повторяет слова, пока они не перестают быть словами.
goto int_blade_made

@int_blade_still
-: Мысли уходят одна за другой. Остаются тишина и кристалл.
goto int_blade_made

@int_blade_made
cg blue_blade
-: Части рукояти поднимаются над полом и сходятся вокруг кристалла. Эйла не открывает глаз.
sfx ignite
-: Клинок зажигается синим.
set blade_blue, xp+300
cg off
face tholme smile
tholme: Синий. Хороший цвет для начала.
face aayla smile lekku=up
aayla: Он мой. Я это чувствую.
bond tholme
respite p1
bg temple_pad day
music temple
show tholme right robe calm
show aayla left padawan resolute lekku=still
tholme: Совет зовёт нас обоих. На Рилоте неспокойно, и там мне понадобишься ты.
aayla: Я готова, мастер.
goto ch3_start

@rs_meditate_p1
bg temple_garden day
music temple
show yoda right robe calm
show aayla left padawan calm lekku=still
-: В Саду медитаций тихо. Йода сидит на камне у воды и не оборачивается.
yoda: Садись. Мешать не буду.
-: Эйла медитирует, пока не перестаёт слышать воду. Тьма отступает.
memory palace
yoda: Легче стало?
aayla: Легче, мастер.
return

@tr_deflect2
bg respite
music temple
if respite == p1
show xiaan right padawan smile lekku=up
show aayla left padawan calm lekku=still
xiaan: Эйла! Дроид для отражения свободен. Я поставлю ему третий ствол.
-: Тренировочный дроид стреляет с трёх сторон. Эйла держит клинок у груди и отводит выстрелы обратно.
xiaan: Три из трёх! Я так не умею.
aayla: Научишься. Не смотри на ствол, смотри на дроида целиком.
else
show aayla left robe calm lekku=still
-: Тренировочный дроид стреляет с трёх сторон. Эйла держит клинок у груди и отводит выстрелы обратно.
-: К вечеру дроид промахивается чаще, чем попадает. Своими же выстрелами.
end
-: Отражение II: в стойке три выстрела, назад уходит три четверти урона.
return

@tr_push2
bg respite
music temple
if respite == p1
show xiaan right padawan surprised lekku=tense
show aayla left padawan resolute lekku=still
-: Сиань держит щит. Первый толчок едва её сдвигает. Второй отбрасывает к матам.
xiaan: Ой. Это было сильно.
aayla: Прости. Я не рассчитала.
face xiaan smile
xiaan: Не извиняйся. Синяки учат быстрее, это все знают.
else
show tholme right robe calm
show aayla left robe resolute lekku=still
tholme: Толкни меня. Не жалей.
-: Первый толчок Толм принимает на месте. Второй сдвигает его на шаг.
tholme: Хорошо. Ещё раз, и я начну обижаться.
end
-: Толчок II: толчок бьёт в полтора раза сильнее.
return

@tr_restraint
bg respite
music temple
if respite == p1
show xiaan right padawan smile lekku=up
show aayla left padawan calm lekku=still
xiaan: Давай в «правду и ложь». Я спрашиваю, ты отвечаешь, а я смотрю на лекку.
-: Сиань спрашивает, Эйла отвечает и иногда врёт. С каждым разом угадывать Сиань всё труднее.
xiaan: Последний раз я не поняла. Ты соврала?
aayla: Не скажу.
else
show aayla left robe calm lekku=still
-: Эйла сидит перед зеркалом и рассказывает себе небылицы. Лекку должны молчать.
-: К концу дня они молчат даже тогда, когда она врёт про мастера Йоду.
end
-: Сдержанность лекку выросла на ступень: ложь труднее прочесть.
return

@rs_archive_ch3
bg temple_archive night
music temple
show aayla left padawan thoughtful lekku=still
-: В архиве Башни первого знания пусто и сине. На столе Толма лежит подборка о Рилоте.
-: Правящий совет Лессу. Клан Фенн ведёт Ро Фенн, тучный белокожий твилек. «Фенн» по-твилекски значит «трудолюбивый».
-: Сына, Х'ариса, Ро Фенн изгнал с Рилота за тяжкие преступления.
-: Клан Секура в совете представляет Лон Секура. Его сын Нат наследует клан.
-: Моргукаи. Тайное общество воинов-каджайн'са'никто с Кинтана, только мужчины. Учатся убивать тех, кто владеет Силой. Отец и сын могут убить друг друга ради трофея.
aayla: Лон Секура. Ещё один мой дядя. Надеюсь, этот без фляги.
-: Архив: в следующем задании слабости врагов видны с первого хода.
return
` };
})(globalThis.Aayla98 = globalThis.Aayla98 || {});
