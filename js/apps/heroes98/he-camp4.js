(function (H) {
  'use strict';
  const scenes1 = `event day 1 -> c1_start
event visit grot1 -> c1_g1
event visit grot2 -> c1_g2
event visit grot3 -> c1_g3
event defeat raid -> c1_raid
event flag c1_all -> c1_win

@c1_start
show naera left
show oola right
oola: Слышишь? Опять ворочается.
naera: Третью ночь подряд. Я пела до рассвета, а она всё равно бьёт в дно.
oola: Так бьётся сердце, когда его будят. Кто-то будит её снаружи.
naera: Кто?
oola: Сперва спой в трёх гротах. Если и после этого не уснёт, будем искать кто.
goal add g1 "Спеть в Северном гроте" to grot1
goal add g2 "Спеть в Жемчужном гроте" to grot2
goal add g3 "Спеть в Глубоком гроте" to grot3
show luar right
luar: И ещё. У Кривого рифа стоят пираты. Ловят наших ныряльщиц и продают на северный берег.
naera: Сколько их?
luar: Больше, чем я возьму одной рукой. Пойду с тобой.
goal add raid "Разогнать пиратов у Кривого рифа" to raid
say Герои Прилива ходят по воде без кораблей. Клетка воды стоит полтора шага, суша и мели дешевле.
say В бою нечётные раунды дают отрядам Прилива +25 % урона, чётные +25 % Стойкости. Фаза подписана рядом с номером раунда.
if kept branch_given
show oola right
oola: С севера по рекам идут белые повозки. Говорят, везут ветку из Чащи. Живую.
naera: Зачем людям в белом живая ветка?
oola: Не знаю. Но если они собирают старые вещи, до нас тоже дойдут.
end
end

@c1_g1
show naera left
naera: Северный грот слышит. Эхо уходит до самого дна.
say Наэра поёт. Вода у берега становится гладкой, как в безветрие.
goal done g1
set s1
scene c1_check
end

@c1_g2
show naera left
show luar right
luar: Пираты на том берегу замолчали, пока ты пела.
naera: Они слушали не меня. Они слушали, как вода затихла.
goal done g2
set s2
scene c1_check
end

@c1_g3
show naera left
naera: Глубокий грот самый старый. Здесь пели ещё до того, как колыбельную записали.
goal done g3
set s3
scene c1_check
end

@c1_check
if flag s1
if flag s2
if flag s3
if not flag woke
set woke
scene c1_awake
end
end
end
end
if flag woke
if flag rd
set c1_all
end
end
end

@c1_awake
show naera left
show oola right
naera: Все три грота. Она не спит.
oola: Тысячу лет засыпала после первого грота. Значит, кто-то держит её и не даёт уснуть.
naera: Кто?
oola: Тот, кто черпает дно у Нижнего Престола. По ночам там белые огни, ныряльщицы их видели.
naera: Мерра тоже говорила про белые огни. Ещё весной.
oola: Мерра много про что говорила. Спроси у неё, когда найдёшь.
end

@c1_raid
show luar right
luar: Риф чистый. Ныряльщицы вернутся домой к ночи.
goal done raid
set rd
scene c1_check
end

@c1_win
show naera left
show oola right
oola: Собирай людей. Если луна не спит, Чаше тоже не спать.
naera: Сначала перламутровые острова. Там лучшие черепахи и самые упрямые старосты.
win
end
`;

  const scenes2 = `event day 1 -> c2_start
event capture isl1 -> c2_isl1
event capture isl2 -> c2_isl2
event capture isl3 -> c2_isl3
event army turtlefort 3 -> c2_fleet
event day 15 -> c2_ships
event defeat ships -> c2_beaten
event flag c2_all -> c2_win

@c2_start
show naera left
show luar right
luar: Три острова, три старосты, и все трое платят людям в белом. За что, не говорят.
naera: Нам скажут.
luar: Они нас не любят, Наэра. Мы поём, а они ныряют за жемчугом. Им кажется, что работают только они.
goal add isl1 "Взять Жемчужную Банку" to isl1
goal add isl2 "Взять Солёный Риф" to isl2
goal add isl3 "Взять Белую Отмель" to isl3
goal add fleet "Собрать флот: 3 черепахи-крепости" to turtles
say Черепах-крепостей продают на Черепашьей отмели к югу от города. Нужны золото, соль и янтарь.
say Белые корабли придут на 15 день. Острова, которые к этому дню останутся за старостами, дадут им людей.
end

@c2_isl1
show naera left
show arla right
arla: Город твой. Жемчуг тоже, если умеешь нырять.
naera: Мне не нужен жемчуг. Мне нужно знать, кому вы платите.
arla: Людям в белом. Они пришли весной и сказали, что Чаша скоро обмелеет. Кто платит, тот сохранит свои банки.
naera: Чаша не обмелеет.
arla: Они черпают дно, жрица. Ковш за ковшом. Я видела сама.
goal done isl1
set i1
scene c2_check
end

@c2_isl2
show luar right
luar: Солёный Риф наш. Староста ушёл на лодке, пока мы поднимались к воротам.
goal done isl2
set i2
scene c2_check
end

@c2_isl3
show naera left
naera: Белая Отмель. Отсюда видно, где кончается наша вода.
goal done isl3
set i3
scene c2_check
end

@c2_fleet
show luar right
luar: Три черепахи. Белые корабли таких не видели, а наши дети на них выросли.
goal done fleet
set f1
scene c2_check
end

@c2_ships
spawn hero yosta 1 71 40 0 ships
army ships crossbow 24 mercenaries 30 plated 4
if not owns isl1
army ships pirates 16
end
if not owns isl2
army ships pirates 16
end
if not owns isl3
army ships pirates 16
end
if not diff easy
army ships crossbow 10 plated 2
end
if diff hard
army ships crossbow 10 plated 2
end
if diff impossible
army ships crossbow 20 plated 4 bountyhunters 10
end
show naera left
show yosta right
yosta: Жрица Наэра? Йоста Ферн, лоцман. Меня наняли провести эти корабли через ваши мели.
naera: Кто нанял?
yosta: Те, кто платит вперёд. Я водил баржи по всем семи рекам и ни разу не спрашивал, что в мешках.
naera: Сейчас спроси.
yosta: Сейчас поздно. Мне платят и за то, чтобы я не слушал песен.
goal add ships "Разбить белые корабли Йосты Ферна" to ships
aim player 1 home
end

@c2_beaten
show yosta right
yosta: Мели ваши, деньги их. Я ухожу на берег, там хотя бы не поют.
goal done ships
set sh
scene c2_check
end

@c2_check
if flag i1
if flag i2
if flag i3
if flag f1
if flag sh
set c2_all
end
end
end
end
end
end

@c2_win
show naera left
show arla right
arla: Острова твои. Но белые вернутся. Им заплачено за всю осень.
naera: Тогда пусть острова решат, кому они платят дань.
arla: Решай ты. Ты же у нас поёшь.
choice
- Отдать белым их дань из казны Прилива, чтобы они ушли с банок. -> c2_pay
- Не платить. Пусть приходят за данью сами. -> c2_refuse
end
end

@c2_pay
take gold 3000
show arla right
arla: Щедро. Белые уберут одну черпальню с наших банок, им больше нечего тут сторожить.
keep pearl_paid
win
end

@c2_refuse
show arla right
arla: Тогда я дам тебе гарпунщиков. Если уж драться, то вместе.
keep pearl_refused
win
end
`;

  const scenes3 = `event day 1 -> c3_start
event defeat dr1 -> c3_dr1
event defeat dr2 -> c3_dr2
event defeat dr3 -> c3_dr3
event defeat merra -> c3_merra
event day 14 -> c3_late
event flag c3_all -> c3_win

@c3_start
show naera left
show luar right
luar: Четыре черпальни. Стоят вокруг Нижнего Престола, черпают днём и ночью.
naera: Сколько у нас времени?
luar: Три недели. Потом они дойдут до сердца, и черпать будет нечего.
goal add dr1 "Разбить черпальню у Китовой гряды" to dr1
goal add dr2 "Разбить черпальню у Солёных ворот" to dr2
goal add dr3 "Разбить черпальню на Жемчужных банках" to dr3
goal add dr4 "Разбить черпальню у Нижнего Престола" to merra
goal lose day 21
say Бой на воде идёт на палубе. Отряды Прилива дерутся там с +1 моралью.
if kept pearl_paid
show arla right
arla: Белые сдержали слово. С Жемчужных банок ушла одна черпальня.
gate open dr3
end
if kept pearl_refused
show arla right
arla: Мои гарпунщики с тобой. Им не терпится вернуть дань обратно.
give unit harpooner 20
end
if kept snake_free
show luar right
luar: По реке из Чащи пришли два морских змея. Сказали, что их прислал Змей из озера и что он помнит долг.
give unit seaserpent 2
end
end

@c3_dr1
show luar right
luar: Первая. На ней ковши из лиговой меди. Хорошая работа для плохого дела.
goal done dr1
set d1
scene c3_flag
scene c3_check
end

@c3_dr2
show naera left
naera: Вторая. Вода в Солёных воротах снова идёт как надо.
goal done dr2
set d2
scene c3_flag
scene c3_check
end

@c3_dr3
show luar right
luar: Жемчужные банки свободны.
goal done dr3
set d3
scene c3_flag
scene c3_check
end

@c3_flag
if not flag seen
set seen
show naera left
show luar right
luar: Наэра, над четвёртой черпальней не белый флаг. Синий, с раковиной.
naera: Флаг жрицы глубин. Такой есть у меня и ещё у одной женщины в Чаше.
luar: У кого?
naera: У моей сестры.
end
end

@c3_merra
show naera left
show merra right
merra: Ты всегда пела громче, чем я. Но сражаешься ты, оказывается, тоже лучше.
naera: Зачем ты им помогаешь?
merra: Помогаю? Я показала им, где копать. Без меня они черпали бы ещё сто лет.
naera: Ты знаешь, что там внизу.
merra: Знаю. Там тот, кому тысячу лет не дают проснуться. Я ухожу, сестра. Ищи меня в Нижнем Престоле.
goal done dr4
set d4
scene c3_check
end

@c3_late
if not flag c3_all
show luar right
luar: Прошло две недели. Ещё семь дней, и черпальни дойдут до сердца.
end
end

@c3_check
if flag d1
if flag d2
if flag d3
if flag d4
set c3_all
end
end
end
end
end

@c3_win
show naera left
show luar right
luar: Флот стоит. Но под водой уже прорублен ход, его видно с палубы.
naera: Значит, вниз. Туда, где тысячу лет никто не был.
if day 15
else
keep dredges_fast
end
win
end
`;

  const scenes4 = `event day 1 -> c4_start
event visit down1 -> c4_down
event visit down2 -> c4_down
event defeat dig -> c4_dig
event defeat shell -> c4_shell
event flag c4_all -> c4_win

@c4_start
show naera left
show oola right
oola: Под нами Нижний Престол. Город Лунных царей, он ушёл под воду в ночь Падения.
naera: Как туда спуститься?
oola: Водоворотами. Они ведут вниз, если не бояться. В затонувшем храме лежит раковина колыбельной, первая. С неё пели все остальные.
naera: Зачем она мне?
oola: Затем, что твоей песни луне уже мало. Ей нужна та, что старше тебя.
goal add shell "Найти раковину колыбельной в Затонувшем храме" to down1 down2 shell
goal add dig "Прогнать черпальщиков от лунного разлома" to down1 down2 dig
say Водоворот переносит героя на другой уровень. Герои Прилива проходят водоворот без потерь.
end

@c4_down
if not flag below
set below
show naera left
naera: Тихо. Даже вода здесь не шевелится.
say Нижний Престол. Улицы, залитые водой, и дворцы под ней. Сокровищницы города ещё охраняют.
goal point shell shell
goal point dig dig
end
end

@c4_dig
show naera left
show ortwin right
ortwin: Литейщик Ортвин Брасс. Я ставил им ковши и машины. Об остальном договаривайтесь с жрицей.
naera: С какой жрицей?
ortwin: С вашей. Она забрала кусок, ради которого всё затевалось, и ушла наверх ещё утром.
goal done dig
set dg
scene c4_check
end

@c4_shell
show naera left
naera: Раковина. Если приложить к уху, слышно не море.
say Наэра слушает. В раковине бьётся сердце: медленно, с перебоями, как у больного.
naera: Она живая. И ей больно.
keep shell_found
goal done shell
set sl
scene c4_check
end

@c4_check
if flag dg
if flag sl
set c4_all
end
end
end

@c4_win
show naera left
show merra right
merra: Не гонись за мной, Наэра. Ей больно, потому что её держат на дне. Наверху ей будет легче.
naera: Наверху её ждут цепи.
merra: Цепи куют не для неё. Регент обещал.
naera: Регент обещал тебе, а не ей.
keep heart_taken
win
end
`;

  const scenes5 = `event day 1 -> c5_start
event day 3 -> c5_ebb
event day 6 -> c5_flood
event day 9 -> c5_ebb
event day 12 -> c5_flood
event day 15 -> c5_ebb
event day 18 -> c5_flood
event day 21 -> c5_ebb
event day 24 -> c5_flood
event day 27 -> c5_ebb
event day 4 -> c5_leave1
event day 7 -> c5_leave2
event day 8 -> c5_wave1
event day 16 -> c5_wave2
event defeat merra -> c5_caught

@c5_start
show naera left
show oola right
oola: Мерра ушла к Белой гавани. Там флагман регента. Через четыре недели он поднимет паруса.
naera: Тогда у меня четыре недели.
oola: Она идёт не прямо. Ждёт на островах, пока за ней не придут, и уходит дальше.
oola: Чаша сейчас дышит неровно. Каждые три дня вода уходит и возвращается. На отливе поднимаются мели и рифы.
naera: А на мелях пройдут их солдаты.
oola: И твои тоже. Смотри на воду.
goal add merra "Догнать Мерру" to merra
goal lose day 28
if not diff easy
army merra seawitch 6 stinger 6 stormray 2
army harbor crossbow 10 plated 2
end
if diff hard
army merra seawitch 4 stinger 6 turtlefort 1
end
if diff impossible
army merra seawitch 10 stinger 12 stormray 3 turtlefort 2
army harbor crossbow 20 plated 6
end
if kept shell_found
show naera left
naera: У меня есть раковина. Если сердце ещё на дне, она его услышит.
end
if kept dredges_fast
show luar right
luar: Мы разбили черпальни быстро, белые не успели поднять всех людей. У них в гавани половина гарнизона.
end
aim player 1 home
end

@c5_ebb
terrain sand 35 55 15 3
terrain sand 70 54 14 5
terrain rock 70 30 2 18
terrain rock 70 65 2 18
if not flag ebb1
set ebb1
show naera left
naera: Отлив. Вода ушла с мелей, поднялись рифы.
say На отливе мели становятся сушей, а рифы перекрывают проливы. Через три дня вода вернётся.
end
end

@c5_flood
terrain water 35 55 15 3
terrain water 70 54 14 5
terrain water 70 30 2 18
terrain water 70 65 2 18
end

@c5_leave1
if not beaten merra
move merra 87 93
show luar right
luar: Мерра ушла с северного острова ночью. Её парус видели на юге.
end
end

@c5_leave2
if not beaten merra
move merra 100 52
show luar right
luar: Мерра в Белой гавани. Теперь её придётся брать вместе со стенами.
end
end

@c5_wave1
spawn hero ortwin 1 92 60 0 wave1
army wave1 crossbow 30 mercenaries 40 plated 8 bountyhunters 8
if not diff easy
army wave1 crossbow 20 plated 4
end
if diff impossible
army wave1 crossbow 30 plated 8 bountyhunters 12
end
show luar right
luar: С Белой гавани сошли солдаты. Ждут отлива, чтобы пройти по мелям.
end

@c5_wave2
spawn hero yosta 1 92 64 0 wave2
army wave2 crossbow 40 mercenaries 50 plated 10 bountyhunters 12
if not diff easy
army wave2 crossbow 20 plated 6
end
if diff impossible
army wave2 crossbow 40 plated 10 bountyhunters 16
end
show yosta right
yosta: Опять вы. Мне платят за каждый ваш остров, жрица. Не обижайтесь.
end

@c5_caught
show naera left
show merra right
merra: Опоздала. Сердце уже на флагмане. Регент ушёл на рассвете.
naera: Зачем, Мерра?
merra: Вы тысячу лет поёте одну песню и не знаете, чем она кончается. Я хотела услышать конец.
naera: У неё нет конца. Её поют, пока нужно.
merra: Вот и пой. А я посмотрю, кто из нас был прав.
naera: Уходи. Ты моя сестра, и луна это слышит.
goal done merra
keep merra_spared
keep heart_given
win
end
`;

  H.Campaign.add({
    id: 'chasha',
    number: 4,
    faction: 'tide',
    name: 'Чаша',
    theme: 'camp_chasha',
    hero: 'naera',
    about: 'Осень 999 года. Восьмая луна под водой бьётся, как сердце, а белый флот Престола черпает дно у Нижнего Престола. Жрица глубин Наэра должна допеть колыбельную. Её сестра Мерра верит Ордену.',
    opening: [
      'Тысячу лет назад Восьмая луна упала в мир. На её месте Чаша, круглое море, и под ним она спит.',
      'Народ Прилива поёт ей колыбельную. Каждую ночь, в трёх гротах, без перерыва. Это работа, и выходных у неё нет.',
      'Этой осенью луна перестала засыпать. Над Нижним Престолом по ночам горят белые огни.',
      'Наэра, жрица глубин, поёт с шести лет. Её младшая сестра Мерра однажды спросила, зачем. Ответ ей дали люди в белых плащах.'
    ],
    ending: [
      'Флагман регента ушёл к Белым руинам. В его трюме кусок лунного сердца.',
      'Мерра осталась в Белой гавани одна. Её никто не держит, и уходить ей некуда.',
      'Перламутровые острова больше не платят дань. Черепахи стоят у каждого рифа.',
      'Наэра поёт каждую ночь. Раковина колыбельной лежит у неё на коленях, и в ней слышно, как бьётся сердце. Медленно. Пока бьётся.'
    ],
    missions: [
      {
        id: 'cha1',
        name: 'Колыбельная',
        levelCap: 5,
        about: 'Малая карта, свой город.',
        brief: 'Третью ночь Восьмая луна бьёт в дно Чаши и не засыпает. Старшая певчая Оола посылает Наэру спеть в трёх древних гротах.\n\nУ Кривого рифа стоят пираты, они ловят ныряльщиц Прилива. Луар просит разогнать их, пока не поздно.',
        goals: ['Спеть в трёх гротах', 'Разогнать пиратов у Кривого рифа'],
        lose: 'Наэра пала или потерян город',
        bonuses: [{ kind: 'unit', unit: 'shellman', count: 20 }, { kind: 'res', res: { gold: 1500, salt: 2 } }, { kind: 'art', id: 'reedhat' }],
        scenes: scenes1
      },
      {
        id: 'cha2',
        name: 'Перламутровые острова',
        levelCap: 8,
        about: 'Средняя карта, острова и вода.',
        brief: 'Перламутровые острова платят дань людям в белом и не верят жрицам. Без их черепах Прилив не выставит флот.\n\nВозьмите три островных города и соберите три черепахи-крепости. На 15 день придут белые корабли, и каждый остров, что останется за старостами, даст им людей.',
        goals: ['Взять три островных города', 'Собрать флот из трёх черепах-крепостей', 'Разбить белые корабли'],
        lose: 'Наэра пала или потерян город',
        bonuses: [{ kind: 'res', res: { gold: 3000, salt: 3, amber: 3 } }, { kind: 'unit', unit: 'jelly', count: 8 }, { kind: 'art', id: 'wovenring' }],
        scenes: scenes2
      },
      {
        id: 'cha3',
        name: 'Белый флот',
        levelCap: 11,
        about: 'Большая карта, вода, гонка.',
        brief: 'Четыре черпальни белого флота стоят вокруг Нижнего Престола и черпают дно день и ночь. Через три недели они дойдут до лунного сердца.\n\nРазбейте все четыре черпальни за 21 день. Над четвёртой поднят чужой флаг.',
        goals: ['Разбить четыре черпальни за 21 день'],
        lose: 'Прошёл 21 день или Наэра пала',
        bonuses: [{ kind: 'unit', unit: 'harpooner', count: 12 }, { kind: 'res', res: { gold: 4000, salt: 4 } }, { kind: 'art', id: 'couriers' }],
        scenes: scenes3
      },
      {
        id: 'cha4',
        name: 'Нижний Престол',
        levelCap: 14,
        about: 'Средняя карта, два уровня.',
        brief: 'Под Чашей лежит Нижний Престол, город Лунных царей. Туда ведут водовороты, а в затонувшем храме хранится первая раковина колыбельной.\n\nСпуститесь вниз, найдите раковину и прогоните черпальщиков от лунного разлома.',
        goals: ['Найти раковину колыбельной', 'Прогнать черпальщиков от лунного разлома'],
        lose: 'Наэра пала',
        bonuses: [{ kind: 'unit', unit: 'seawitch', count: 6 }, { kind: 'res', res: { gold: 5000 } }, { kind: 'art', id: 'moonamulet' }],
        scenes: scenes4
      },
      {
        id: 'cha5',
        name: 'Девятый вал',
        levelCap: 18,
        about: 'Большая карта, которая дышит.',
        brief: 'Мерра унесла кусок лунного сердца в Белую гавань, где стоит флагман регента. Через 28 дней он поднимет паруса.\n\nМерра идёт к гавани не прямо, а с острова на остров. Чаша дышит: каждые три дня поднимаются мели и рифы, потом вода возвращается. Догоните Мерру, пока флагман не ушёл.',
        goals: ['Догнать Мерру за 28 дней'],
        lose: 'Прошло 28 дней, Наэра пала или потерян город',
        bonuses: [{ kind: 'unit', unit: 'turtlefort', count: 3 }, { kind: 'res', res: { gold: 8000, salt: 6, amber: 6 } }, { kind: 'art', id: 'hawkcloak' }],
        scenes: scenes5
      }
    ]
  });
})(globalThis.Heroes98 = globalThis.Heroes98 || {});
