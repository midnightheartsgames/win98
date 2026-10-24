window.interpediaReg('worldcup98', 'project', {
  title: `World Cup 98 (футбольный симулятор)`,
  hatnote: `Статья портала «Наш проект» — об игре с компакт-диска журнала «Игромания». О других играх каталога см. [[steam|Steam]].`,
  infobox: {
    title: `World Cup 98`,
    badgeText: `Футбольный симулятор`,
    fields: [
      { label: `Жанр`, value: `футбольный симулятор` },
      { label: `Разработчик`, value: `EA Sports (1998, по каталогу игр)` },
      { label: `Тема`, value: `Чемпионат мира по футболу во Франции, 1998` },
      { label: `Сборные`, value: `16, четыре группы A–D` },
      { label: `Арены`, value: `4 стадиона, 3 вида погоды` },
      { label: `Режимы`, value: `турнир, товарищеский матч, классические матчи, серия пенальти` },
      { label: `Распространение`, value: `демоверсия на [[cdrom|компакт-диске]] «Игромании», диск D:` },
      { label: `Размер установщика`, value: `16,8 МБ` }
    ]
  },
  lead: `<strong>World Cup 98</strong> — футбольный симулятор по Чемпионату мира 1998 года во Франции. В каталоге игр системы он числится как «официальный симулятор» от EA Sports и распространяется демоверсией на диске журнала «Игромания». Игра работает в окне [[windows98|Win 98]] и воспроизводит турнир в упрощённом виде: 16 сборных в четырёх группах, плей-off с четвертьфинала, четыре арены и матчи семь на семь.

Сам чемпионат проходил с 10 июня по 12 июля 1998 года; финал на «Стад де Франс» в Сен-Дени Франция выиграла у Бразилии со счётом 3:0. Игра берёт из него арены, составы и несколько реальных сюжетов, но состав участников у неё свой: например, в группу A поставлена сборная России, которой в финальной части реального турнира не было.`,
  sections: [
    { id: 'install', title: 'Распространение и установка', content: `World Cup 98 в каталоге системы помечена как DEMO и стоит 0. В Steam она не продаётся: это исключение из общего правила, по которому игры системы покупаются через [[steam|клиент Steam]]. Установщик <code>worldcup98.exe</code> лежит на компакт-диске «Игромании» в папке <code>D:\\demo</code>, весит 16,8 МБ и ставит игру в папку <code>WorldCup98</code>; запускающий файл называется <code>WORLDCUP98.EXE</code>.

Пока игра не установлена, значка на рабочем столе и пункта в меню «Пуск» нет, а попытка запустить её подсказывает установить игру с диска «Игромания». После установки появляются значок, пункт меню и папка в разделе игр. Сайт журнала, один из сайтов [[runet|Рунета]], доступен в [[ie5|Internet Explorer]] по адресу www.igromania.ru. Общий обзор проекта дан в статье [[win98clone|о Microslop Win 98 Web Clone]].` },
    { id: 'tournament', title: 'Турнир ЧМ-98', content: `Главный режим — «Чемпионат мира '98». По умолчанию игрок ведёт сборную России, но сборную можно сменить, начав новый турнир. Игра сохраняет ход турнира в браузере, поэтому кнопка в меню называется «Начать ЧМ-98» или «Продолжить ЧМ-98».

<table class="interpedia-wikitable">
<tr><th>Группа</th><th>Сборные</th></tr>
<tr><td>A</td><td>Франция, Бразилия, Россия, Мексика</td></tr>
<tr><td>B</td><td>Италия, Англия, Испания, Нигерия</td></tr>
<tr><td>C</td><td>Нидерланды, Аргентина, Хорватия, Япония</td></tr>
<tr><td>D</td><td>Германия, Дания, Югославия, Колумбия</td></tr>
</table>

В группе три тура. Сыграв свой матч, игрок получает результаты остальных пар, которые игра рассчитывает по рейтингам сборных. Таблица ранжирует команды по очкам (3 за победу, 1 за ничью), затем по разности мячей и по забитым мячам. Из каждой группы выходят двое: пары четвертьфиналов — 1A–2B, 1B–2A, 1C–2D, 1D–2C, затем полуфиналы и финал. Групповые матчи идут без дополнительного времени, плей-off допускает его. Финал проходит на «Стад де Франс» вечером, остальные матчи турнира — в Марселе днём.

Проиграв, игрок видит сообщение о завершении выступления и может начать турнир заново.` },
    { id: 'match', title: 'Матч и управление', content: `В каждой команде семь игроков: вратарь и шесть полевых. Поле условно имеет размер 840 на 520, ворота — 124 единицы в ширину. У мяча есть высота, поэтому возможны навесы, удары с лёта и подкрутка. Матч судит арбитр: игра показывает фолы, жёлтые и красные карточки, штрафные, угловые, вбрасывания, удары от ворот и пенальти.

<table class="interpedia-wikitable">
<tr><th>Клавиши</th><th>Действие</th></tr>
<tr><td>Стрелки или WASD</td><td>движение и направление удара</td></tr>
<tr><td>Shift</td><td>спринт</td></tr>
<tr><td>X или J</td><td>пас низом; без мяча — смена игрока</td></tr>
<tr><td>C или K</td><td>навес в штрафную; без мяча — подкат</td></tr>
<tr><td>Пробел или Z</td><td>удар (чем дольше держать, тем сильнее); без мяча — отбор</td></tr>
<tr><td>E или V</td><td>финт</td></tr>
<tr><td>1, 2, 3</td><td>тактика на лету</td></tr>
</table>

Длина тайма зависит от режима: 55 секунд реального времени в турнире, 60 в товарищеском матче и 65 в классических сценариях. Табло пересчитывает их в привычные 45 минут. Если после второго тайма в плей-off или товарищеском матче счёт равный, играются два дополнительных тайма (по 30 секунд). Действует правило «Золотого гола»: первый забитый мяч в овертайме заканчивает матч, а если голов нет, назначается серия пенальти.` },
    { id: 'tactics', title: 'Тактика, арены и погода', content: `Игра предлагает четыре схемы. Для каждой указано, против какой она сильна и какой уступает: если схема игрока переигрывает схему соперника, перехваты и удары получают бонус около 9%.

<table class="interpedia-wikitable">
<tr><th>Схема</th><th>Название в игре</th><th>Сильна против</th><th>Уязвима к</th></tr>
<tr><td>4-4-2</td><td>Классика</td><td>4-3-3</td><td>3-5-2</td></tr>
<tr><td>4-3-3</td><td>Атака флангами</td><td>5-3-2</td><td>4-4-2</td></tr>
<tr><td>3-5-2</td><td>Контроль центра</td><td>4-4-2</td><td>5-3-2</td></tr>
<tr><td>5-3-2</td><td>Катеначчо</td><td>3-5-2</td><td>4-3-3</td></tr>
</table>

Три установки на игру выбираются клавишами 1–3: «Контратака» (подкаты сильнее на 12%, удары слабее на 4%), «Баланс» и «Прессинг» (скорость и удары выше на 5% и 8%, отбор слабее на 6%).

Арен четыре: «Стад де Франс» в Сен-Дени (80 000 мест), «Парк де Пренс» в Париже (48 500), «Велодром» в Марселе (60 000) и «Жерлан» в Лионе (44 000). Погода влияет на трение и отскок мяча, подкаты, расход сил и ошибки передач; в ливень трение мяча меньше (1,38 против 2,15 днём), а множитель подката равен 1,32.` },
    { id: 'teams', title: 'Сборные', content: `У каждой из 16 сборных есть пять рейтингов (атака, центр, оборона, скорость, вратарь), собственная расстановка и семь именных игроков с параметрами скорости, удара, паса и обороны.

<ul>
<li><strong>Франция</strong> — 4-3-3; сильнее всего оборона (95); в составе Бартез, Тюрам, Десайи, Пети, Зидан, Анри и Джоркаефф.</li>
<li><strong>Бразилия</strong> — 4-4-2; атака 97 и скорость 96; Таффарел, Кафу, Роберто Карлос, Дунга, Ривалдо, Бебето и Роналдо.</li>
<li><strong>Россия</strong> — 3-5-2; Овчинников, Онопко, Карпин, Мостовой, Аленичев, Титов и Бесчастных.</li>
</ul>

Рейтинги нужны ещё и для расчёта матчей, которые игрок не играет сам: в турнире результаты соперников выводятся из суммы атаки, центра и обороны с небольшой долей случайности.` },
    { id: 'classics', title: 'Классические матчи', content: `Режим «Классические матчи» («Архив телетрансляций») — пять сценариев с готовым счётом и минутой старта. Игрок берёт управление сборной и должен изменить исход.

<table class="interpedia-wikitable">
<tr><th>Сценарий</th><th>Старт</th><th>Арена и погода</th></tr>
<tr><td>Сен-Дени 1998, финал: Франция 2:0 Бразилия; игрок ведёт Бразилию</td><td>65-я минута</td><td>«Стад де Франс», вечер</td></tr>
<tr><td>Париж: Франция 2:2 Россия; игрок ведёт Россию</td><td>72-я минута</td><td>«Стад де Франс», вечер</td></tr>
<tr><td>Марсель, четвертьфинал: Нидерланды 1:1 Аргентина; игрок ведёт Нидерланды</td><td>80-я минута</td><td>«Велодром», солнце</td></tr>
<tr><td>Сент-Этьен, 1/8 финала: Англия 2:2 Аргентина; игрок ведёт Англию</td><td>75-я минута</td><td>«Жерлан», ливень</td></tr>
<tr><td>Италия 0:0 Бразилия, дополнительное время; игрок ведёт Италию</td><td>91-я минута, «Золотой гол»</td><td>«Парк де Пренс», солнце</td></tr>
</table>

В сценариях половина матча длится 65 секунд, овертайм разрешён, а «Золотой гол» включён.` },
    { id: 'shootout', title: 'Серия пенальти', content: `«Серия пенальти» работает как отдельный режим и как завершение матча. Бьющий выбирает один из шести секторов ворот (верхний левый и правый, под перекладину, нижние и по центру низом), при ударе вратаря игрока выбирается сторона прыжка. Слишком сильный удар уходит выше ворот, удар в самый угол с большой силой может попасть в штангу, а вратарь с высоким рейтингом чаще берёт мяч.

Сначала каждая команда бьёт по пять раз; серия кончается досрочно, если соперник уже не может догнать. При равенстве назначаются дополнительные пары ударов до первой разницы. Бьют по очереди шесть полевых игроков состава.` }
  ],
  seeAlso: ['win98clone', 'cdrom', 'steam', 'windows98', 'ie5'],
  references: [
    `FIFA. Laws of the Game. — Zürich, 1998.`,
    `Игромания: журнал о компьютерных играх с компакт-диском. — 1998–1999.`,
    `Каталог игр Microslop Win 98 Web Clone: World Cup 98 (демоверсия), D:\\demo\\worldcup98.exe.`
  ],
  links: [['http://www.igromania.ru', 'Журнал «Игромания»'], ['http://www.steampowered.com', 'Steam']],
  categories: ['Наш проект', 'Спортивные игры', 'Видеоигры']
}, {
  title: `World Cup 98 (football simulator)`,
  hatnote: `An article from the "Our Project" portal, about a game from the Igromania magazine CD. For the rest of the game catalog see [[steam|Steam]].`,
  infobox: {
    title: `World Cup 98`,
    badgeText: `Football simulator`,
    fields: [
      { label: `Genre`, value: `football simulator` },
      { label: `Developer`, value: `EA Sports (1998, per the game catalog)` },
      { label: `Theme`, value: `the 1998 FIFA World Cup in France` },
      { label: `Teams`, value: `16, four groups A–D` },
      { label: `Venues`, value: `4 stadiums, 3 kinds of weather` },
      { label: `Modes`, value: `tournament, friendly, classic matches, penalty shootout` },
      { label: `Distribution`, value: `demo on the Igromania [[cdrom|CD-ROM]], drive D:` },
      { label: `Installer size`, value: `16.8 MB` }
    ]
  },
  lead: `<strong>World Cup 98</strong> is a football simulator based on the 1998 World Cup in France. The system's game catalog lists it as an "official simulator" from EA Sports, shipped as a demo on the Igromania magazine disc. It runs in a [[windows98|Win 98]] window and reproduces the tournament in simplified form: 16 teams in four groups, knockouts from the quarter-finals, four venues and seven-a-side matches.

The real tournament ran from 10 June to 12 July 1998, and France beat Brazil 3-0 in the final at the Stade de France in Saint-Denis. The game takes its venues, squads and a few real storylines from it, but its field of teams is its own: for example, Russia is placed in group A, although Russia did not play in the finals of the real tournament.`,
  sections: [
    { id: 'install', title: 'Distribution and installation', content: `World Cup 98 is marked DEMO in the system catalog and costs 0. It is not sold on Steam: this is an exception to the general rule that the system's games are bought through the [[steam|Steam client]]. The installer <code>worldcup98.exe</code> sits on the Igromania CD in the <code>D:\\demo</code> folder, weighs 16.8 MB and installs the game into a folder called <code>WorldCup98</code>; the executable is <code>WORLDCUP98.EXE</code>.

While the game is not installed there is no desktop icon or Start menu entry, and trying to launch it suggests installing it from the Igromania disc. After installation the icon, the menu item and a folder in the games section appear. The magazine's site, one of the sites of the [[runet|Russian Internet]], opens in [[ie5|Internet Explorer]] at www.igromania.ru, and the project as a whole is covered in the article on [[win98clone|Microslop Win 98 Web Clone]].` },
    { id: 'tournament', title: 'The World Cup 98 tournament', content: `The main mode is "World Cup '98". By default the player leads Russia, but the team can be changed by starting a new tournament. The game keeps the tournament's progress in the browser, so the menu button reads "Start WC-98" or "Continue WC-98".

<table class="interpedia-wikitable">
<tr><th>Group</th><th>Teams</th></tr>
<tr><td>A</td><td>France, Brazil, Russia, Mexico</td></tr>
<tr><td>B</td><td>Italy, England, Spain, Nigeria</td></tr>
<tr><td>C</td><td>Netherlands, Argentina, Croatia, Japan</td></tr>
<tr><td>D</td><td>Germany, Denmark, Yugoslavia, Colombia</td></tr>
</table>

Each group has three match days. After the player's match the game supplies the other results, calculated from team ratings. The table ranks teams by points (3 for a win, 1 for a draw), then goal difference, then goals scored. Two teams per group advance: the quarter-finals are 1A-2B, 1B-2A, 1C-2D and 1D-2C, followed by the semi-finals and the final. Group matches have no extra time; knockout matches allow it. The final is played at the Stade de France in the evening, the other tournament matches in Marseille by day.

After a loss the player sees a message that the team's run is over and can start a new tournament.` },
    { id: 'match', title: 'The match and controls', content: `Each team has seven players: a goalkeeper and six outfield players. The pitch measures 840 by 520 units and the goal is 124 units wide. The ball has height, so lobs, volleys and curling shots are possible. The referee shows fouls, yellow and red cards, free kicks, corners, throw-ins, goal kicks and penalties.

<table class="interpedia-wikitable">
<tr><th>Keys</th><th>Action</th></tr>
<tr><td>Arrows or WASD</td><td>movement and aim</td></tr>
<tr><td>Shift</td><td>sprint</td></tr>
<tr><td>X or J</td><td>ground pass; without the ball, switch player</td></tr>
<tr><td>C or K</td><td>lob into the box; without the ball, slide tackle</td></tr>
<tr><td>Space or Z</td><td>shot (hold longer for more power); without the ball, tackle</td></tr>
<tr><td>E or V</td><td>skill move</td></tr>
<tr><td>1, 2, 3</td><td>tactics on the fly</td></tr>
</table>

Half length depends on the mode: 55 seconds of real time in the tournament, 60 in a friendly and 65 in the classic scenarios. The scoreboard rescales them to the familiar 45 minutes. If the score is level after the second half in a knockout or friendly match, two extra-time periods are played (30 seconds each). The "golden goal" rule applies: the first goal in extra time ends the match, and if nobody scores a penalty shootout follows.` },
    { id: 'tactics', title: 'Tactics, venues and weather', content: `The game offers four formations. Each has a formation it beats and one it loses to: if the player's formation counters the opponent's, interceptions and shots get a bonus of about 9%.

<table class="interpedia-wikitable">
<tr><th>Formation</th><th>Name in the game</th><th>Strong against</th><th>Weak against</th></tr>
<tr><td>4-4-2</td><td>Classic</td><td>4-3-3</td><td>3-5-2</td></tr>
<tr><td>4-3-3</td><td>Wing attack</td><td>5-3-2</td><td>4-4-2</td></tr>
<tr><td>3-5-2</td><td>Midfield control</td><td>4-4-2</td><td>5-3-2</td></tr>
<tr><td>5-3-2</td><td>Catenaccio</td><td>3-5-2</td><td>4-3-3</td></tr>
</table>

Three attitudes are chosen with keys 1-3: "Counterattack" (tackles stronger by 12%, shots weaker by 4%), "Balance" and "Pressing" (speed and shots higher by 5% and 8%, tackling weaker by 6%).

There are four venues: the Stade de France in Saint-Denis (80,000 seats), the Parc des Princes in Paris (48,500), the Velodrome in Marseille (60,000) and Gerland in Lyon (44,000). Weather affects ball friction and bounce, slide tackles, stamina and passing errors; in heavy rain ball friction is lower (1.38 against 2.15 by day) and the slide tackle multiplier is 1.32.` },
    { id: 'teams', title: 'The teams', content: `Each of the 16 teams has five ratings (attack, midfield, defense, speed, goalkeeper), its own formation and seven named players with speed, shooting, passing and defense values.

<ul>
<li><strong>France</strong>: 4-3-3; defense is highest at 95; the squad has Barthez, Thuram, Desailly, Petit, Zidane, Henry and Djorkaeff.</li>
<li><strong>Brazil</strong>: 4-4-2; attack 97 and speed 96; Taffarel, Cafu, Roberto Carlos, Dunga, Rivaldo, Bebeto and Ronaldo.</li>
<li><strong>Russia</strong>: 3-5-2; Ovchinnikov, Onopko, Karpin, Mostovoi, Alenichev, Titov and Beschastnykh.</li>
</ul>

The ratings also drive the matches the player does not play: in the tournament the other results are derived from the sum of attack, midfield and defense with a small element of chance.` },
    { id: 'classics', title: 'Classic matches', content: `The "Classic matches" mode ("Broadcast archive") has five scenarios with a preset score and starting minute. The player takes over a team and has to change the outcome.

<table class="interpedia-wikitable">
<tr><th>Scenario</th><th>Start</th><th>Venue and weather</th></tr>
<tr><td>Saint-Denis 1998, final: France 2-0 Brazil; the player leads Brazil</td><td>65th minute</td><td>Stade de France, evening</td></tr>
<tr><td>Paris: France 2-2 Russia; the player leads Russia</td><td>72nd minute</td><td>Stade de France, evening</td></tr>
<tr><td>Marseille, quarter-final: Netherlands 1-1 Argentina; the player leads the Netherlands</td><td>80th minute</td><td>Velodrome, sunshine</td></tr>
<tr><td>Saint-Etienne, round of 16: England 2-2 Argentina; the player leads England</td><td>75th minute</td><td>Gerland, heavy rain</td></tr>
<tr><td>Italy 0-0 Brazil, extra time; the player leads Italy</td><td>91st minute, golden goal</td><td>Parc des Princes, sunshine</td></tr>
</table>

In the scenarios a half lasts 65 seconds, extra time is allowed and the golden goal is switched on.` },
    { id: 'shootout', title: 'Penalty shootout', content: `The penalty shootout works both as a separate mode and as the finish of a match. The kicker picks one of six goal sectors (upper left and right, under the crossbar, the two lower corners, and low down the middle); when the player's goalkeeper defends, the player picks the side to dive to. A shot that is too hard sails over, a hard shot into the very corner can hit the post, and a keeper with a high rating saves more often.

Each team first takes five kicks; the shootout ends early if the opponent can no longer catch up. If it is still level, extra pairs of kicks follow until one side leads. The six outfield players of the squad take the kicks in turn.` }
  ],
  seeAlso: ['win98clone', 'cdrom', 'steam', 'windows98', 'ie5'],
  references: [
    `FIFA. Laws of the Game. Zürich, 1998.`,
    `Igromania: a computer games magazine with a CD-ROM, 1998-1999.`,
    `Microslop Win 98 Web Clone game catalog: World Cup 98 (demo), D:\\demo\\worldcup98.exe.`
  ],
  links: [['http://www.igromania.ru', 'Igromania magazine'], ['http://www.steampowered.com', 'Steam']],
  categories: ['Our Project', 'Sports Games', 'Video Games']
}, ['wc98', 'worldcup', 'france98']);

window.interpediaReg('samandmax', 'project', {
  title: `Sam & Max: серия SAMMAX (эпизоды 101–106 и 201–202)`,
  hatnote: `Статья портала «Наш проект». О движке и квесте LucasQuest 98 рассказывает статья [[scumm|LucasQuest 98 и движок SCUMM]].`,
  infobox: {
    title: `Sam & Max`,
    badgeText: `Серия квестов`,
    fields: [
      { label: `Жанр`, value: `квест point-and-click` },
      { label: `Герои`, value: `Сэм и Макс, Вольная полиция` },
      { label: `Эпизоды`, value: `восемь: 101–106 и 201–202` },
      { label: `Экран`, value: `320×200, 256 цветов` },
      { label: `Носитель`, value: `1 [[cdrom|CD-ROM]] на эпизод, 38–54 МБ` },
      { label: `Цена`, value: `от $21.99 до $30.99` },
      { label: `Распространение`, value: `покупка в [[steam|Steam]]` },
      { label: `Первоисточник`, value: `комиксы Стива Пёрселла` }
    ]
  },
  lead: `<strong>Sam & Max</strong> — серия приключенческих игр про Вольную полицию, из каталога Steam нашей системы: шесть эпизодов первого сезона (101–106) и два эпизода второго (201 и 202). Герои — Сэм, собака в костюме, и Макс, гиперактивный кролик-нечто. Все эпизоды сделаны как классические квесты: рисованные экраны 320×200, курсор-действие, инвентарь в коробке и диалоги иконками.

Персонажей придумал Стив Пёрселл в комиксах о «вольных полицейских», а первой игрой по ним стала Sam & Max Hit the Road (1993), построенная на движке [[scumm|SCUMM]]. Эпизоды нашей серии сделаны «в духе» этой игры, но у них собственный движок и четыре действия вместо девяти глаголов.`,
  sections: [
    { id: 'history', title: 'Происхождение', content: `Сэм и Макс впервые появились в комиксах Стива Пёрселла в 1987 году: вольные полицейские — собака и «кролик-нечто» — разбирают дела со странными преступниками и абсурдными диалогами. В 1993 году LucasArts выпустила по комиксам игру Sam & Max Hit the Road на движке [[scumm|SCUMM]]. Позже студия перешла на трёхмерный движок и выпустила [[grimfandango|Grim Fandango]] (1998).

Серия эпизодов, о которой идёт речь, продолжает традицию Hit the Road в формате «сезона»: каждый эпизод — отдельная игра с законченным делом, а улики прошлых дел копятся в шкафу офиса.` },
    { id: 'heroes', title: 'Мир и герои', content: `Действие происходит в вымышленном городе, где у Вольной полиции есть офис с телефоном, шкафом и окном на улицу. По городу ездит автомобиль Де Сото, в котором Сэм и Макс едут от одного места к другому и ввязываются в погони.

<ul>
<li><strong>Сэм</strong> — собака в костюме, герой, которым управляет игрок.</li>
<li><strong>Макс</strong> — напарник, который одновременно ещё и предмет инвентаря: его можно «применить» почти к чему угодно. Если заговорить с Максом, он подскажет, что делать дальше.</li>
<li><strong>Боско</strong> — хозяин «лавки неудобств» с Антивор-О-Матом; в эпизоде 105 у него простуда за миллиард долларов, в 202 защитные бункеры.</li>
<li><strong>Сибил Пандемик</strong> — психотерапевт, в эпизоде 102 издаёт жёлтую газету; в 104 и 202 у неё свидания.</li>
<li><strong>Джимми Два Зуба</strong> — крыса, держащая телефон в заложниках в первом эпизоде.</li>
<li><strong>Хью Блисс</strong> — ведущий викторины и фокусник, которого игрок встречает не единожды.</li>
</ul>` },
    { id: 'controls', title: 'Управление', content: `Игровой экран разделён на сцену и панель действий. Четыре действия переключаются клавишами 1–4 или правой кнопкой мыши по кругу: идти, смотреть, использовать, говорить. Предмет можно взять из инвентаря и применить к объекту или к Максу. Инвентарь открывается щелчком по коробке на экране или клавишами I и Tab (в русской раскладке — Ш).

Клавиша Esc отменяет выбор или открывает меню, F5 тоже открывает меню, пробел ставит игру на паузу, точка пропускает фразу, Esc во время ролика пропускает его. В диалогах реплики выбираются щелчком или цифрами. Меню сохраняет игру в семи ячейках, а при смене комнаты игра записывает автосохранение; в настройках меняются скорость текста, громкость музыки и звуков.` },
    { id: 'season1', title: 'Первый сезон (101–106)', content: `<table class="interpedia-wikitable">
<tr><th>Эпизод</th><th>Название</th><th>Цена</th><th>Размер</th><th>Сюжет</th></tr>
<tr><td>101</td><td>Culture Shock</td><td>$21.99</td><td>38 МБ</td><td>Бывшие звёзды детского шоу «Сода-Попперы» разрисовывают стены, а за ними стоят гипнотические кассеты «Ай-Бо» Брэди Калчера. Нужно получить антигипнотический шлем из дуршлага.</td></tr>
<tr><td>102</td><td>Situation: Comedy</td><td>$23.99</td><td>41 МБ</td><td>Ведущая Майра Стамп держит зрителей в студии. Съёмки ситкома, викторина Хью Блисса и прямой эфир «Майры!».</td></tr>
<tr><td>103</td><td>The Mole, the Mob and the Meatball</td><td>$25.49</td><td>44 МБ</td><td>Крот комиссара в Игрушечной мафии замолчал. Казино Теда И. Бэра, три поручения мафии, фабрика гипнотических мишек.</td></tr>
<tr><td>104</td><td>Abe Lincoln Must Die!</td><td>$26.49</td><td>46 МБ</td><td>Президент запретил пудинг и обязал страну обниматься по четвергам. Вашингтон, предвыборные дебаты, погоня за шестиметровой статуей.</td></tr>
<tr><td>105</td><td>Reality 2.0</td><td>$28.49</td><td>48 МБ</td><td>Компьютеры сошли с ума. Улица существует в двух версиях, и значок очков переносит Сэма из одной в другую.</td></tr>
<tr><td>106</td><td>Bright Side of the Moon</td><td>$29.49</td><td>50 МБ</td><td>Над городом стоит ночная радуга с Луны. Море Спокойствия, «Пузырь Покоя» и четыре фокуса Хью Блисса в финале закрывают сезон.</td></tr>
</table>` },
    { id: 'season2', title: 'Второй сезон (201 и 202)', content: `<table class="interpedia-wikitable">
<tr><th>Эпизод</th><th>Название</th><th>Цена</th><th>Размер</th><th>Сюжет</th></tr>
<tr><td>201</td><td>Ice Station Santa</td><td>$30.49</td><td>52 МБ</td><td>За неделю до Рождества робот Маймтрон 9000 пытается снести офис. Северный полюс, мастерская Санты и три Рождества за тремя порталами; финальный бой ведётся игрушками.</td></tr>
<tr><td>202</td><td>Moai Better Blues</td><td>$30.99</td><td>54 МБ</td><td>У входа в офис открывается Бермудский треугольник, ведущий на остров Пасхи. Гигантские каменные головы, вулкан Беллависта и верховный жрец Мистер Лопатка.</td></tr>
</table>

Эпизоды второго сезона дороже и больше эпизодов первого; в обоих в шкафу офиса хранятся вещдоки прошлых дел.` },
    { id: 'continuity', title: 'Связь эпизодов и улики в шкафу', content: `Главный общий элемент серии — шкаф в офисе Вольной полиции. Начиная с эпизода 104 в нём лежат улики прошлых дел: парик Брэди, Мистер Мишка, шулер Леонард. В 105 к ним добавляется голова президента, в 106 — очки Реальности 2.0, а в эпизоде 201 в шкафу уже улики всех дел прошлого сезона, от парика Брэди до банки с Хью Блиссом.

Эпизоды покупаются по отдельности, и каждый следующий стоит дороже предыдущего: от $21.99 за эпизод 101 до $30.99 за 202. Размер установки растёт от 38 до 54 МБ.` },
    { id: 'distribution', title: 'Распространение', content: `Все эпизоды помечены в каталоге как покупаемые через Steam. Клиент скачивают с сайта www.steampowered.com в [[ie5|Internet Explorer]], затем покупают и скачивают нужный эпизод. У каждого эпизода свой установщик (<code>Setup_SamMax.exe</code>, <code>Setup_SamMax102.exe</code> и так далее), своя папка (<code>SamMax</code>, <code>SamMax102</code> ...) и свой запускающий файл (<code>SAMMAX.EXE</code>, <code>SAMMAX2.EXE</code> ... <code>SAMMAX22.EXE</code>). Значок на рабочем столе, пункт меню «Пуск» и файлы в разделе игр появляются, только когда эпизод установлен.

Игры работают в окне [[windows98|Win 98]]. Общий обзор системы — в статье [[win98clone|о Microslop Win 98 Web Clone]]. Сайт студии открывается по адресу www.lucasarts.com.` }
  ],
  seeAlso: ['scumm', 'grimfandango', 'steam', 'win98clone', 'windows98'],
  references: [
    `Purcell S. Sam & Max Surf the Highway. — Marlowe & Company, 1995.`,
    `LucasArts. Sam & Max Hit the Road: руководство пользователя. — 1993.`,
    `Каталог Steam системы Microslop Win 98 Web Clone: эпизоды Sam & Max.`
  ],
  links: [['http://www.lucasarts.com', 'LucasArts'], ['http://www.steampowered.com', 'Steam']],
  categories: ['Наш проект', 'Приключенческие игры', 'LucasArts']
}, {
  title: `Sam & Max: the SAMMAX series (episodes 101-106 and 201-202)`,
  hatnote: `An article from the "Our Project" portal. For the engine and the LucasQuest 98 adventure see [[scumm|LucasQuest 98 & SCUMM Engine]].`,
  infobox: {
    title: `Sam & Max`,
    badgeText: `Adventure game series`,
    fields: [
      { label: `Genre`, value: `point-and-click adventure` },
      { label: `Heroes`, value: `Sam and Max, the Freelance Police` },
      { label: `Episodes`, value: `eight: 101-106 and 201-202` },
      { label: `Screen`, value: `320×200, 256 colors` },
      { label: `Media`, value: `one [[cdrom|CD-ROM]] per episode, 38-54 MB` },
      { label: `Price`, value: `$21.99 to $30.99` },
      { label: `Distribution`, value: `purchased on [[steam|Steam]]` },
      { label: `Source material`, value: `comics by Steve Purcell` }
    ]
  },
  lead: `<strong>Sam & Max</strong> is a series of adventure games about the Freelance Police in our system's Steam catalog: six episodes of the first season (101-106) and two of the second (201 and 202). The heroes are Sam, a dog in a suit, and Max, a hyperkinetic rabbity-thing. Every episode is built as a classic adventure: hand-drawn 320×200 screens, an action cursor, an inventory box and dialogues with icons.

The characters were created by Steve Purcell in his comics about "freelance police", and the first game made from them was Sam & Max Hit the Road (1993), built on the [[scumm|SCUMM]] engine. The episodes in our series are made "in the spirit of" that game, but they use their own engine and four actions instead of nine verbs.`,
  sections: [
    { id: 'history', title: 'Origins', content: `Sam and Max first appeared in Steve Purcell's comics in 1987: freelance police, a dog and a rabbity-thing, handle cases with strange criminals and absurd dialogue. In 1993 LucasArts released Sam & Max Hit the Road on the [[scumm|SCUMM]] engine. The studio later moved to a 3D engine and released [[grimfandango|Grim Fandango]] (1998).

The episodes discussed here continue the Hit the Road tradition in a "season" format: every episode is a separate game with a complete case, while evidence from earlier cases piles up in the office closet.` },
    { id: 'heroes', title: 'The world and its heroes', content: `The action takes place in an invented city where the Freelance Police have an office with a telephone, a closet and a window onto the street. A De Soto car drives around the city, taking Sam and Max from one place to another and into chases.

<ul>
<li><strong>Sam</strong> is the dog in a suit, the hero the player controls.</li>
<li><strong>Max</strong> is the partner who is also an inventory item: he can be "used" on almost anything. Talk to Max and he hints at what to do next.</li>
<li><strong>Bosco</strong> runs the "inconvenience store" with the Anti-Theft-O-Matic; in episode 105 he has a cold worth a billion dollars, in 202 protective bunkers.</li>
<li><strong>Sybil Pandemik</strong> is a psychotherapist who publishes a tabloid in episode 102; in 104 and 202 she goes on dates.</li>
<li><strong>Jimmy Two-Teeth</strong> is the rat who holds the telephone hostage in the first episode.</li>
<li><strong>Hugh Bliss</strong> is a quiz host and magician whom the player meets more than once.</li>
</ul>` },
    { id: 'controls', title: 'Controls', content: `The game screen is divided into the scene and the action panel. The four actions are switched with keys 1-4 or cycled with the right mouse button: walk, look, use, talk. An item can be taken from the inventory and applied to an object or to Max. The inventory opens by clicking the box on screen or with the I and Tab keys (Ш on the Russian layout).

Esc cancels a selection or opens the menu, F5 also opens the menu, Space pauses, the period key skips a line and Esc during a cutscene skips it. In dialogues replies are chosen with a click or the number keys. The menu saves the game in seven slots, and the game writes an autosave when the room changes; the options change text speed and the volume of music and sound.` },
    { id: 'season1', title: 'Season one (101-106)', content: `<table class="interpedia-wikitable">
<tr><th>Episode</th><th>Title</th><th>Price</th><th>Size</th><th>Plot</th></tr>
<tr><td>101</td><td>Culture Shock</td><td>$21.99</td><td>38 MB</td><td>Former stars of the children's show "Soda Poppers" are painting walls, and behind them stand the hypnotic "I-Bo" tapes of Brady Culture. The goal is an anti-hypnosis helmet made from a colander.</td></tr>
<tr><td>102</td><td>Situation: Comedy</td><td>$23.99</td><td>41 MB</td><td>Host Myra Stump keeps the audience in the studio. Sitcom shooting, Hugh Bliss's quiz show and a live broadcast of "Myra!".</td></tr>
<tr><td>103</td><td>The Mole, the Mob and the Meatball</td><td>$25.49</td><td>44 MB</td><td>The commissioner's mole in the Toy Mafia has gone silent. Ted E. Bear's casino, three errands for the mob and a hypnotic teddy bear factory.</td></tr>
<tr><td>104</td><td>Abe Lincoln Must Die!</td><td>$26.49</td><td>46 MB</td><td>The president has banned pudding and ordered the country to hug on Thursdays. Washington, campaign debates and a chase after a twenty-foot statue.</td></tr>
<tr><td>105</td><td>Reality 2.0</td><td>$28.49</td><td>48 MB</td><td>Computers have gone mad. The street exists in two versions, and the glasses icon carries Sam from one to the other.</td></tr>
<tr><td>106</td><td>Bright Side of the Moon</td><td>$29.49</td><td>50 MB</td><td>A night rainbow stands over the city, coming from the Moon. The Sea of Tranquility, the "Bubble of Peace" and Hugh Bliss's four tricks close the season.</td></tr>
</table>` },
    { id: 'season2', title: 'Season two (201 and 202)', content: `<table class="interpedia-wikitable">
<tr><th>Episode</th><th>Title</th><th>Price</th><th>Size</th><th>Plot</th></tr>
<tr><td>201</td><td>Ice Station Santa</td><td>$30.49</td><td>52 MB</td><td>A week before Christmas the robot Maimtron 9000 tries to demolish the office. The North Pole, Santa's workshop and three Christmases behind three portals; the final fight is fought with toys.</td></tr>
<tr><td>202</td><td>Moai Better Blues</td><td>$30.99</td><td>54 MB</td><td>A Bermuda Triangle opens by the office door and leads to Easter Island. Giant stone heads, the Bellavista volcano and a high priest called Mister Lopatka.</td></tr>
</table>

Season two episodes cost more and are larger than those of season one; in both, the office closet holds evidence from earlier cases.` },
    { id: 'continuity', title: 'Episode links and the evidence closet', content: `The main shared element of the series is the closet in the Freelance Police office. From episode 104 on it holds evidence from earlier cases: Brady's wig, Mr. Teddy and the card shark Leonard. In 105 the president's head joins them, in 106 the Reality 2.0 glasses, and in episode 201 the closet holds evidence from all the cases of the previous season, from Brady's wig to a jar with Hugh Bliss.

The episodes are bought separately, and each is priced above the previous one: from $21.99 for episode 101 to $30.99 for 202. The installed size grows from 38 to 54 MB.` },
    { id: 'distribution', title: 'Distribution', content: `All episodes are marked in the catalog as purchased through Steam. The client is downloaded from www.steampowered.com in [[ie5|Internet Explorer]]; after that the player buys and downloads the needed episode. Every episode has its own installer (<code>Setup_SamMax.exe</code>, <code>Setup_SamMax102.exe</code> and so on), its own folder (<code>SamMax</code>, <code>SamMax102</code> ...) and its own executable (<code>SAMMAX.EXE</code>, <code>SAMMAX2.EXE</code> ... <code>SAMMAX22.EXE</code>). The desktop icon, the Start menu item and the files in the games section appear only when the episode is installed.

The games run in a [[windows98|Win 98]] window. The system as a whole is covered in the article on [[win98clone|Microslop Win 98 Web Clone]]. The studio's site opens at www.lucasarts.com.` }
  ],
  seeAlso: ['scumm', 'grimfandango', 'steam', 'win98clone', 'windows98'],
  references: [
    `Purcell, S. Sam & Max Surf the Highway. Marlowe & Company, 1995.`,
    `LucasArts. Sam & Max Hit the Road user manual, 1993.`,
    `Steam catalog of Microslop Win 98 Web Clone: the Sam & Max episodes.`
  ],
  links: [['http://www.lucasarts.com', 'LucasArts'], ['http://www.steampowered.com', 'Steam']],
  categories: ['Our Project', 'Adventure Games', 'LucasArts']
}, ['sammax', 'sam_and_max', 'sam-max']);

window.interpediaReg('kovcheg', 'project', {
  title: `«Ковчег»: сайт-путеводитель по Honkai: Star Rail 98`,
  hatnote: `Статья портала «Наш проект». О самой игре см. раздел «Игра» ниже и сайт hsr.hoyoverse.com.`,
  infobox: {
    title: `Ковчег`,
    badgeText: `Фанатский сайт гайдов`,
    fields: [
      { label: `Адрес`, value: `www.kovcheg98.ru` },
      { label: `Открыт`, value: `12 октября 1999 года` },
      { label: `Девиз`, value: `«Каждой твари по паре»` },
      { label: `Редакция`, value: `Боцман, Штурман, Юнга` },
      { label: `Первый раздел`, value: `Honkai: Star Rail 98, версия 1.4 от 4 октября 1999 года` },
      { label: `Главная страница`, value: `тир-лист по замерам` },
      { label: `Вёрстка`, value: `таблицы шириной 760 пикселей, [[html|HTML]]` },
      { label: `Браузер`, value: `[[ie5|Internet Explorer 5.0]], разрешение 800×600` }
    ]
  },
  lead: `<strong>«Ковчег»</strong> — фанатский сайт гайдов, тир-листов и отрядов для ролевых игр, открытый 12 октября 1999 года по адресу www.kovcheg98.ru. Первый и пока единственный готовый раздел посвящён пошаговой игре Honkai: Star Rail 98: по ней сайт разбирает персонажей, собирает их в отряды и ставит оценки не по мнению редакции, а по замерам боёв.

Оформление и язык сайта выдержаны в морской теме: отряд называется экипажем, база отрядов — судовой ролью, страница героя — личным делом, а девиз «Каждой твари по паре» отсылает к парным ударам игры, Слияниям. Сайт найдётся в разделе «Поиск и порталы» каталога WebSeeker 98 и открывается в [[ie5|Internet Explorer]]; он входит и в [[webring|кольцо ретро-сайтов]].`,
  sections: [
    { id: 'history', title: 'Открытие и редакция', content: `Сайт открылся через неделю с небольшим после выхода версии 1.4 игры (4 октября 1999 года). Журнал обновлений показывает основные вехи:

<table class="interpedia-wikitable">
<tr><th>Дата</th><th>Событие</th></tr>
<tr><td>12.10.1999</td><td>«Ковчег спущен на воду»: первый раздел, версия 1.4</td></tr>
<tr><td>01.11.1999</td><td>личные дела всех персонажей версии 1.4, включая девять новых героев 4★ и «Хитрых зайцев»; первый тир-лист по замерам</td></tr>
<tr><td>06.11.1999</td><td>переключатель «без сигнатурного конуса» в тир-листе</td></tr>
<tr><td>19.12.1999</td><td>конструктор отряда: четверых выбирают в форме, а сайт сам прогоняет бой</td></tr>
</table>

Сайт ведут три вымышленных автора: Боцман — редактор, он отвечает посетителям в гостевой; Штурман отвечает за замеры и тир-листы; Юнга пишет статьи для новичков. На странице «О сайте» описана методика и показан счётчик посетителей, а в гостевой книге Боцман отвечает на вопросы вроде «почему этот персонаж стоит ниже, чем ожидалось». Внизу страниц висят кнопки размером 88×31: «IE 5.0 — смотреть лучше в», «800x600», «NOTEPAD — сделано в» и ссылка на официальный сайт игры.` },
    { id: 'structure', title: 'Устройство сайта', content: `Главная страница — «причал»: слева таблички игр, справа журнал обновлений, опрос «Кто лучший боец Зала забвения?» и счётчик. Открыта только игра HSR 98, остальные стоят «в доке» с пометкой «строится»: Star Wars: KOTOR 98, Dragon Age: Origins 98 (см. [[bioware98|ролевые игры BioWare]]), [[diablo2|Diablo II]] и Fallout: Запорожье.

Палуба HSR 98 состоит из «люков»:

<ul>
<li><strong>Тир-лист</strong> — кто сильнее в разных режимах.</li>
<li><strong>Экипаж</strong> — список персонажей с фильтрами по Пути, стихии, редкости и роли.</li>
<li><strong>Судовая роль</strong> — готовые отряды и замены для тех, у кого нет героев из событий.</li>
<li><strong>Зал забвения</strong> — пятнадцать этапов, враги по волнам, два отряда для этапов 11–15.</li>
<li><strong>Статьи</strong> — «Новичку», «Боевая математика», «Кого крутить», «Бесплатный отряд».</li>
<li><strong>Справочники</strong> — конусы, реликвии, Слияния, баннеры.</li>
<li><strong>Конструктор</strong> и <strong>Мой экипаж</strong> — расчёт собственного отряда и подбор отрядов по сохранению игры.</li>
</ul>

Отдельные страницы есть у Виртуальной вселенной (четыре мира) и у сюжетных боссов; каждая открывается по своему адресу, поэтому работают «Избранное» и история [[ie5|Internet Explorer]]. Неизвестный адрес ведёт на страницу «Такого на борту нет».` },
    { id: 'tier', title: 'Тир-лист', content: `Тир-лист — главная страница сайта. Это таблица «тир × роль»: колонки «Урон», «Второй урон», «Усиление» и «Выживание», а режимов четыре: «Зал забвения», «Боссы», «Виртуальная вселенная» и «Начало игры». Один персонаж может стоять в двух колонках. Тиры названы Т0, Т0.5, Т1, Т1.5, Т2, Т3 и Т4, цвет у них свой, но буква всегда написана текстом.

Под портретом персонажа стоят до трёх меток, например «ОН+» и «ОН−» (даёт или тратит очки навыка), «Доп. атаки», «Пер. урон», «Пробитие», «Усиление», «Ослабление», «Ускорение», «Задержка», «Щит», «Лечение», «Провокация», «Воскрешение», «Контроль» и «Слияние». Рамка портрета золотая у героев 5★ и сиреневая у 4★, значок стихии стоит в левом верхнем углу, а у героев, которые приходят по сюжету, в правом нижнем углу есть значок «Бесплатно». Режим можно переключать ссылками, а фильтры по редкости и Пути заданы формой с кнопкой «OK».` },
    { id: 'method', title: 'Методика замеров', content: `Главное отличие «Ковчега» от обычного фанатского сайта — оценки считаются по боям. Движок боя игры работает и без интерфейса, поэтому каждого персонажа можно прогнать через одни и те же сражения. Уровень героя равен уровню врагов, реликвии одинаковы по уровню, на каждый бой берутся несколько зёрен случайных чисел.

<ul>
<li><strong>Зал.</strong> Циклы на этапах 11–15 Зала забвения; проигрыш считается за 30 циклов.</li>
<li><strong>Боссы.</strong> Циклы на сюжетных боссах с повышенным запасом здоровья и атакой; проигрыш — 40 циклов.</li>
<li><strong>Выживание.</strong> Победы и павшие герои в тех же боях при усиленных врагах.</li>
<li><strong>Вселенная.</strong> Победы и время боёв в последнем из четырёх миров.</li>
<li><strong>Начало игры.</strong> Победы и циклы на первых боссах в слабых сборках.</li>
</ul>

Результат нормируется на лидера колонки. Пороги тиров: Т0 — не ниже 0,95 от лучшего, Т0.5 — 0,80, Т1 — 0,68, Т1.5 — 0,60, Т2 — 0,52, Т3 — 0,42, ниже идёт Т4. Редакция вправе сдвинуть персонажа на полшага без объяснения и на шаг с объяснением в карточке; больше шага сдвигать нельзя. Причина сдвига пишется на сайте: например, бот игры хуже человека играет за Мегумин и Ю на боссах, и на этих страницах есть пометка. Для «Второго урона», «Усиления» и «Выживания» считается вклад четвёртого: насколько быстрее проходит бой опорный отряд из трёх, если добавить персонажа.` },
    { id: 'teams', title: 'Отряды и конструктор', content: `«Судовая роль» разбита по архетипам: «Гиперкэрри», «Периодический урон», «Аномалии Секции 6», «Ещё раз!», «Отряд Казумы», «Пробитие», «Цепочка атак», «Пары со Слиянием» и другие. На строке отряда — четыре места с должностями (боец, второй урон, усиление, выживание), замена для каждого места, Слияния отряда и циклы из замеров.

Конструктор предлагает четыре списка героев, выбор этапа Зала или босса и кнопку «Рассчитать». Сайт показывает недостающие роли, баланс очков навыка, доступные Слияния, покрытие уязвимостей этапа и прогноз числа циклов; расчёт идёт в браузере тем же движком боя. Если повторить героя или выбрать пустой отряд, форма покажет ошибку, а если расчёт не удался, посоветует сменить состав.` },
    { id: 'articles', title: 'Статьи и справочники', content: `Раздел статей объясняет правила игры, на которых держатся оценки. «Новичку» рассказывает про очки навыка (общий запас, стартовых три, не больше пяти), энергию и абсолютные техники, пробитие уязвимости, шкалу хода, Контакт и Слияния. «Боевая математика» приводит формулы урона и защиты с примерами: так выглядели разборы на фанатских сайтах конца 1990-х. «Кого крутить» разбирает баннеры, валюты прыжков и гаранты, «Бесплатный отряд» — кто присоединяется по сюжету и как играть без прыжков.

В справочниках собраны все световые конусы с Путями и источниками, наборы реликвий и планарных украшений с порогами, все Слияния и текущие баннеры. Сюжет на сайте не пересказывается: о бесплатных героях сказано только, где они присоединяются.` },
    { id: 'design', title: 'Оформление', content: `Страницы набраны таблицами фиксированной ширины 760 пикселей по центру экрана. Фон — тёмно-синий «морской» узор, бумага для личных дел кремовая, акценты латунные. Заголовки выполнены гарнитурой Times New Roman, текст — Verdana 11 пунктов, числа замеров — Courier New. Нет скруглений, размытия, полупрозрачности и плавных переходов, как и положено [[html|HTML]] эпохи таблиц; палитра ограничена безопасными цветами. Подробнее о приёмах вёрстки того времени — в статье [[css|о CSS]].

Каждая страница имеет собственную форму: тир-лист, личное дело, судовая роль и разбор этапа Зала устроены по-разному, общими остаются шапка с вымпелом и строка навигации. Гостевая книга хранит записи посетителей в самом браузере; если хранилище закрыто, сайт показывает записи редакции и предупреждает, что новые не сохранятся.` },
    { id: 'game', title: 'Игра, о которой пишет сайт', content: `<strong>Honkai: Star Rail 98</strong> — бесплатная пошаговая игра в жанре JRPG, издание «Ярило-VI». Первопроходец просыпается на станции «Герта», отправляется на Звёздном экспрессе на ледяную Ярило-VI и сражается по шкале хода с общими очками навыка. Игру можно получить на официальном сайте hsr.hoyoverse.com (установщик <code>StarRail98_Setup.exe</code> сохраняется в папку «Загрузки», его мастер сам ставит игру и добавляет её в библиотеку Steam) и в клиенте [[steam|Steam]], где она тоже бесплатна. «Ковчег» игру не раздаёт: кнопка «Где взять игру» ведёт на официальный сайт и в Steam.

Версии, которые описывает сайт, выходили так: 1.0 — 26 апреля 1999 года, 1.1 — 7 июня (события и почта), 1.2 — 19 июля (Виртуальная вселенная и сообщения), 1.3 — 23 августа (Поиск сигнала, Секция 6, Призыв, Гильдия и Полуночный канал), 1.4 — 4 октября 1999 года (девять героев 4★, станция «Герта» как в оригинале, конвент Кон-Тон). Об игре как о части каталога проекта рассказывает статья [[win98clone|Microslop Win 98 Web Clone]]; народная энциклопедия по её миру работает на сайте www.astralwiki98.ru.` }
  ],
  seeAlso: ['win98clone', 'steam', 'ie5', 'webring', 'interpedia'],
  references: [
    `Lynch P. J., Horton S. Web Style Guide. — Yale University Press, 1999.`,
    `Musciano C., Kennedy B. HTML: The Definitive Guide. 3rd ed. — O'Reilly, 1998.`,
    `Ковчег: страница «О сайте и методике», www.kovcheg98.ru/about.`,
    `Honkai: Star Rail 98: официальный сайт, журнал версий 1.0–1.4, hsr.hoyoverse.com.`
  ],
  links: [['http://www.kovcheg98.ru', 'Ковчег: гайды и тир-листы'], ['http://hsr.hoyoverse.com', 'Honkai: Star Rail 98: официальный сайт'], ['http://www.astralwiki98.ru', 'АстралВики \'98']],
  categories: ['Наш проект', 'Фанатские сайты', 'Видеоигры']
}, {
  title: `Kovcheg: a guide site for Honkai: Star Rail 98`,
  hatnote: `An article from the "Our Project" portal. For the game itself see the "The game" section below and the site hsr.hoyoverse.com.`,
  infobox: {
    title: `Kovcheg`,
    badgeText: `Fan guide site`,
    fields: [
      { label: `Address`, value: `www.kovcheg98.ru` },
      { label: `Opened`, value: `12 October 1999` },
      { label: `Motto`, value: `"Two of every kind"` },
      { label: `Editorial team`, value: `Botsman, Shturman, Yunga` },
      { label: `First section`, value: `Honkai: Star Rail 98, version 1.4 of 4 October 1999` },
      { label: `Home page`, value: `a tier list built from measurements` },
      { label: `Layout`, value: `tables 760 pixels wide, [[html|HTML]]` },
      { label: `Browser`, value: `[[ie5|Internet Explorer 5.0]], 800×600 resolution` }
    ]
  },
  lead: `<strong>Kovcheg</strong> ("The Ark") is a fan site of guides, tier lists and teams for role-playing games, opened on 12 October 1999 at www.kovcheg98.ru. Its first and so far only finished section is devoted to the turn-based game Honkai: Star Rail 98: the site breaks down characters, assembles them into teams and rates them not by the editors' opinion but by measured battles.

The look and language of the site follow a nautical theme: a team is a crew, the team database is the muster roll, a hero's page is a personal file, and the motto "Two of every kind" alludes to the game's paired attacks, the Fusions. The site is listed in the "Search and portals" section of the WebSeeker 98 directory and opens in [[ie5|Internet Explorer]]; it also belongs to the [[webring|ring of retro sites]].`,
  sections: [
    { id: 'history', title: 'Opening and editorial team', content: `The site opened a little over a week after version 1.4 of the game was released (4 October 1999). The update log shows the main milestones:

<table class="interpedia-wikitable">
<tr><th>Date</th><th>Event</th></tr>
<tr><td>12.10.1999</td><td>"The Ark is launched": the first section, version 1.4</td></tr>
<tr><td>01.11.1999</td><td>personal files for all characters of version 1.4, including the nine new 4★ heroes and the "Cunning Hares"; the first measured tier list</td></tr>
<tr><td>06.11.1999</td><td>a "without signature cone" switch in the tier list</td></tr>
<tr><td>19.12.1999</td><td>the team builder: pick four in a form and the site runs the battle itself</td></tr>
</table>

The site is run by three fictional authors: Botsman is the editor and answers visitors in the guestbook; Shturman handles measurements and tier lists; Yunga writes articles for beginners. The "About" page describes the method and shows the visitor counter, and in the guestbook Botsman answers questions such as why a character ranks lower than expected. At the bottom of pages sit 88×31 buttons: "IE 5.0, best viewed in", "800x600", "NOTEPAD, made in" and a link to the game's official site.` },
    { id: 'structure', title: 'Site structure', content: `The home page is a "quay": game plaques on the left, an update log on the right, a poll "Who is the best fighter of the Forgotten Hall?" and a counter. Only HSR 98 is open; the other games sit "in dock" marked "under construction": Star Wars: KOTOR 98, Dragon Age: Origins 98 (see [[bioware98|BioWare role-playing games]]), [[diablo2|Diablo II]] and Fallout: Zaporozhye.

The HSR 98 deck consists of "hatches":

<ul>
<li><strong>Tier list</strong>: who is stronger in each mode.</li>
<li><strong>Crew</strong>: a list of characters with filters by Path, element, rarity and role.</li>
<li><strong>Muster roll</strong>: ready-made teams and substitutes for players without event heroes.</li>
<li><strong>Forgotten Hall</strong>: fifteen stages, enemies by wave, two teams for stages 11-15.</li>
<li><strong>Articles</strong>: "For beginners", "Battle math", "Whom to pull", "The free team".</li>
<li><strong>References</strong>: cones, relics, Fusions, banners.</li>
<li><strong>Builder</strong> and <strong>My crew</strong>: calculating your own team and picking teams from a game save.</li>
</ul>

The Virtual Universe (four worlds) and the story bosses have separate pages; each opens at its own address, so Favorites and the [[ie5|Internet Explorer]] history work. An unknown address leads to a page called "No such thing aboard".` },
    { id: 'tier', title: 'The tier list', content: `The tier list is the site's main page. It is a "tier × role" table: the columns are "Damage", "Second damage", "Support" and "Survival", and there are four modes: "Forgotten Hall", "Bosses", "Virtual Universe" and "Early game". One character can stand in two columns. Tiers are named T0, T0.5, T1, T1.5, T2, T3 and T4; each has its own color, but the letter is always written out as text.

Under a character's portrait sit up to three tags, for example "SP+" and "SP-" (gives or spends skill points), "Follow-up attacks", "Damage over time", "Break", "Buff", "Debuff", "Advance", "Delay", "Shield", "Heal", "Taunt", "Revive", "Control" and "Fusion". The portrait frame is gold for 5★ heroes and lilac for 4★, the element icon sits in the upper left corner, and heroes who join through the story get a "Free" badge in the lower right corner. The mode is switched with links, and the rarity and Path filters are a form with an "OK" button.` },
    { id: 'method', title: 'Measurement method', content: `The main difference between Kovcheg and an ordinary fan site is that ratings are computed from battles. The game's battle engine also runs without an interface, so every character can be put through the same fights. The hero's level equals the enemies' level, relics have the same level, and each battle is run with several random seeds.

<ul>
<li><strong>Hall.</strong> Cycles on stages 11-15 of the Forgotten Hall; a loss counts as 30 cycles.</li>
<li><strong>Bosses.</strong> Cycles on story bosses with raised health and attack; a loss counts as 40.</li>
<li><strong>Survival.</strong> Wins and fallen heroes in the same fights against strengthened enemies.</li>
<li><strong>Universe.</strong> Wins and battle time in the last of the four worlds.</li>
<li><strong>Early game.</strong> Wins and cycles against the first bosses with weak builds.</li>
</ul>

The result is normalized to the column leader. Tier thresholds: T0 is at least 0.95 of the best, T0.5 is 0.80, T1 is 0.68, T1.5 is 0.60, T2 is 0.52, T3 is 0.42, and below that is T4. The editors may shift a character half a step without explanation and a full step with an explanation on the card; more than one step is not allowed. The reason for a shift is written on the site: for example, the game's bot plays Megumin and Yu worse than a human on bosses, and those pages carry a note. For "Second damage", "Support" and "Survival" the contribution of a fourth member is computed: how much faster a core team of three clears the fight when the character is added.` },
    { id: 'teams', title: 'Teams and the builder', content: `The "Muster roll" is split by archetypes: "Hypercarry", "Damage over time", "Section 6 anomalies", "One more!", "Kazuma's team", "Break", "Attack chain", "Fusion pairs" and others. A team row shows four seats with duties (fighter, second damage, support, survival), a substitute for each seat, the team's Fusions and cycles from the measurements.

The builder offers four lists of heroes, a choice of Hall stage or boss and a "Calculate" button. The site shows missing roles, the skill point balance, available Fusions, coverage of the stage's weaknesses and a forecast of the number of cycles; the calculation runs in the browser with the same battle engine. If a hero is repeated or the team is empty the form shows an error, and if the calculation fails it advises changing the lineup.` },
    { id: 'articles', title: 'Articles and references', content: `The articles section explains the rules of the game on which the ratings rest. "For beginners" covers skill points (a shared pool, three at the start, at most five), energy and ultimates, weakness break, the turn bar, Contact and Fusions. "Battle math" gives the damage and defense formulas with examples, the way analyses looked on fan sites of the late 1990s. "Whom to pull" covers banners, pull currencies and pity counters, and "The free team" covers who joins through the story and how to play without pulls.

The references collect all light cones with their Paths and sources, relic sets and planar ornaments with thresholds, all Fusions and the current banners. The story is not retold on the site: for free heroes it only says where they join.` },
    { id: 'design', title: 'Appearance', content: `Pages are laid out in fixed-width tables of 760 pixels, centered. The background is a dark blue "sea" pattern, the paper of the personal files is cream and the accents are brass. Headings use Times New Roman, text uses 11-point Verdana, and measurement figures use Courier New. There are no rounded corners, blur, transparency or smooth transitions, as befits the table era of [[html|HTML]]; the palette is limited to safe colors. For the layout techniques of the time see the article on [[css|CSS]].

Every page has its own form: the tier list, the personal file, the muster roll and the Hall stage breakdown are built differently, and only the banner with the pennant and the navigation line are shared. The guestbook keeps visitors' entries in the browser itself; if storage is blocked, the site shows the editors' entries and warns that new ones will not be saved.` },
    { id: 'game', title: 'The game the site covers', content: `<strong>Honkai: Star Rail 98</strong> is a free turn-based JRPG, the "Yarilo-VI" edition. The Trailblazer wakes on Herta Station, sets off on the Astral Express to icy Yarilo-VI and fights on a turn bar with shared skill points. The game can be obtained from the official site hsr.hoyoverse.com (the installer <code>StarRail98_Setup.exe</code> is saved to the Downloads folder, and its wizard installs the game itself and adds it to the Steam library) and in the [[steam|Steam]] client, where it is free as well. Kovcheg does not distribute the game: its "Where to get the game" button leads to the official site and to Steam.

The versions the site describes were released like this: 1.0 on 26 April 1999, 1.1 on 7 June (events and mail), 1.2 on 19 July (Virtual Universe and messages), 1.3 on 23 August (Signal Search, Section 6, Summon, the Guild and the Midnight Channel), 1.4 on 4 October 1999 (nine 4★ heroes, Herta Station rebuilt as in the original, the Con-Ton convention). The game as part of the project catalog is covered in the article on [[win98clone|Microslop Win 98 Web Clone]]; a people's encyclopedia of its world runs at www.astralwiki98.ru.` }
  ],
  seeAlso: ['win98clone', 'steam', 'ie5', 'webring', 'interpedia'],
  references: [
    `Lynch, P. J., Horton, S. Web Style Guide. Yale University Press, 1999.`,
    `Musciano, C., Kennedy, B. HTML: The Definitive Guide. 3rd ed. O'Reilly, 1998.`,
    `Kovcheg: the "About the site and method" page, www.kovcheg98.ru/about.`,
    `Honkai: Star Rail 98: official site, version log 1.0-1.4, hsr.hoyoverse.com.`
  ],
  links: [['http://www.kovcheg98.ru', 'Kovcheg: guides and tier lists'], ['http://hsr.hoyoverse.com', 'Honkai: Star Rail 98: official site'], ['http://www.astralwiki98.ru', 'AstralWiki \'98']],
  categories: ['Our Project', 'Fan Sites', 'Video Games']
}, ['kovcheg98', 'kovcheg-guide']);
