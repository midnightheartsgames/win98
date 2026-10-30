# Heroes 98: список картинок

Файл собирает `node tools/heroes98-art-list.cjs` из `js/apps/heroes98/he-art.js`. Руками не править: правится `he-art.js`, затем список собирается заново. Как рисовать и сдавать — `HEROES-98-ART.md`.

Всего записей: 812. Пометка «доп.» — дополнение (Звездочёты и Грибница), его рисуют после выпуска.

## Существа: Лига

| id | Имя | Ур. | Кадр | Анимации | Как выглядит |
| --- | --- | --- | --- | --- | --- |
| `unit/militia` | Ополченцы | 1 | 96×96 | idle 6, move 8, attack 8, hit 4, defend 3, death 8 | горожане дельты в стёганках и войлочных шапках, длинные копья, жёлтая повязка Лиги |
| `unit/pikeman` | Пикинёры | 1 A | 96×96 | idle 6, move 8, attack 8, hit 4, defend 3, death 8 | кирасы-нагрудники, шлемы с гребнем, пики вдвое выше роста |
| `unit/shieldbearer` | Щитоносцы | 1 B | 96×96 | idle 6, move 8, attack 8, hit 4, defend 3, death 8 | ростовые щиты с гербом-колоколом, короткие копья |
| `unit/crossbow` | Арбалетчики | 2 | 96×96 | idle 6, move 8, attack 8, shoot 8, hit 4, defend 3, death 8 | тяжёлые арбалеты с воротом, стёганые куртки, береты с пером |
| `unit/heavycrossbow` | Тяжёлые арбалетчики | 2 A | 96×96 | idle 6, move 8, attack 8, shoot 8, hit 4, defend 3, death 8 | латные наплечники, щит-павеза за спиной |
| `unit/skirmisher` | Застрельщики | 2 B | 96×96 | idle 6, move 8, attack 8, shoot 8, hit 4, defend 3, death 8 | лёгкие арбалеты, кожаные куртки, бегут пригнувшись |
| `unit/ringer` | Звонари | 3 | 96×96 | idle 6, move 8, attack 8, skill 8, hit 4, defend 3, death 8 | звонари в серых рясах с ручными колоколами на древках |
| `unit/alarmist` | Набатчики | 3 A | 96×96 | idle 6, move 8, attack 8, skill 8, hit 4, defend 3, death 8 | двое несут набатный колокол на коромысле, красные повязки |
| `unit/herald` | Благовестники | 3 B | 96×96 | idle 6, move 8, attack 8, skill 8, hit 4, defend 3, death 8 | белые рясы с золотой вышивкой, серебряные колокольчики |
| `unit/plated` | Латники | 4 | 128×128 | idle 6, move 8, attack 8, hit 4, defend 3, death 8 | полный доспех, длинные мечи, шлемы-салады |
| `unit/halberdier` | Алебардисты | 4 A | 128×128 | idle 6, move 8, attack 8, hit 4, defend 3, death 8 | латы, длинные алебарды с крюком |
| `unit/cityguard` | Гвардия ратуши | 4 B | 128×128 | idle 6, move 8, attack 8, hit 4, defend 3, death 8 | латы с гербом города, большие щиты и боевые молоты |
| `unit/aeronaut` | Аэронавты | 5 | 128×128 | idle 6, move 8, attack 8, shoot 8, hit 4, defend 3, death 8 | воздушный шар из лоскутной ткани, в корзине двое с мушкетами |
| `unit/bomber` | Бомбардиры | 5 A | 128×128 | idle 6, move 8, attack 8, shoot 8, hit 4, defend 3, death 8 | шар с подвешенными ядрами-бомбами и горящими фитилями |
| `unit/spotter` | Дозорные | 5 B | 128×128 | idle 6, move 8, attack 8, shoot 8, hit 4, defend 3, death 8 | маленький шар с подзорной трубой и сигнальными флажками |
| `unit/horseguard` | Конная гвардия | 6 | 192×160 | idle 6, move 8, attack 8, hit 4, defend 3, death 8 | всадники в кирасах на тяжёлых конях, копья с вымпелами |
| `unit/palaceknight` | Рыцари Палаты | 6 A | 192×160 | idle 6, move 8, attack 8, hit 4, defend 3, death 8 | латы, плюмаж, длинное копьё, попона с колоколом |
| `unit/cuirassier` | Кирасиры | 6 B | 192×160 | idle 6, move 8, attack 8, shoot 8, hit 4, defend 3, death 8 | чернёные кирасы, пистоли в кобурах, палаши |
| `unit/bombard` | Бомбарда | 7 | 192×160 | idle 6, move 8, attack 8, shoot 8, hit 4, defend 3, death 8 | бронзовая пушка на дубовом лафете, расчёт из двух пушкарей |
| `unit/mortar` | Мортира | 7 A | 192×160 | idle 6, move 8, attack 8, shoot 8, hit 4, defend 3, death 8 | короткая толстая мортира, ствол смотрит в небо |
| `unit/culverin` | Кулеврина | 7 B | 192×160 | idle 6, move 8, attack 8, shoot 8, hit 4, defend 3, death 8 | длинная тонкая пушка на высоком лафете с колёсами |

## Существа: Курганы

| id | Имя | Ур. | Кадр | Анимации | Как выглядит |
| --- | --- | --- | --- | --- | --- |
| `unit/shade` | Тени предков | 1 | 96×96 | idle 6, move 8, attack 8, hit 4, defend 3, death 8 | полупрозрачные степные воины в остроконечных шапках, без ног, сизый туман |
| `unit/mourner` | Вопленицы | 1 A | 96×96 | idle 6, move 8, attack 8, hit 4, defend 3, death 8 | призрачные женщины в длинных платках, ладони у лица |
| `unit/dustguard` | Стражи праха | 1 B | 96×96 | idle 6, move 8, attack 8, hit 4, defend 3, death 8 | плотные тени в доспехах из соляных пластин, ступают по земле |
| `unit/horsebow` | Конные лучники | 2 | 96×96 | idle 6, move 8, attack 8, shoot 8, hit 4, defend 3, death 8 | мёртвые всадники в кожаных доспехах на костлявых степных лошадях, составные луки |
| `unit/steppearcher` | Степные стрелки | 2 A | 96×96 | idle 6, move 8, attack 8, shoot 8, hit 4, defend 3, death 8 | луки больше, колчаны с белыми перьями, ленты на шапках |
| `unit/lasso` | Арканщики | 2 B | 96×96 | idle 6, move 8, attack 8, shoot 8, skill 8, hit 4, defend 3, death 8 | волосяные арканы кружат над головой |
| `unit/stonewoman` | Каменные бабы | 3 | 96×96 | idle 6, move 8, attack 8, hit 4, defend 3, death 8 | серые каменные идолы с плоскими лицами, руки держат чашу у живота |
| `unit/kinidol` | Идолы рода | 3 A | 96×96 | idle 6, move 8, attack 8, hit 4, defend 3, death 8 | идол в резных родовых узорах, натёртый охрой |
| `unit/speakingstone` | Говорящие камни | 3 B | 96×96 | idle 6, move 8, attack 8, skill 8, hit 4, defend 3, death 8 | идол в трещинах, глаза светятся голубым |
| `unit/eaglespirit` | Духи беркутов | 4 | 128×128 | idle 6, move 8, attack 8, hit 4, defend 3, death 8 | огромные беркуты из дыма и перьев |
| `unit/stormeagle` | Беркуты бури | 4 A | 128×128 | idle 6, move 8, attack 8, hit 4, defend 3, death 8 | тёмные беркуты, в крыльях молнии |
| `unit/soulcatcher` | Ловцы душ | 4 B | 128×128 | idle 6, move 8, attack 8, hit 4, defend 3, death 8 | беркут с золотыми когтями и связкой амулетов |
| `unit/saltnoyon` | Засоленные нойоны | 5 | 128×128 | idle 6, move 8, attack 8, hit 4, defend 3, death 8 | мумии знати в шёлковых халатах под соляной коркой, золотые маски |
| `unit/shamannoyon` | Нойоны-шаманы | 5 A | 128×128 | idle 6, move 8, attack 8, skill 8, hit 4, defend 3, death 8 | мумии с бубнами и рогатыми шапками |
| `unit/thousander` | Тысячники | 5 B | 128×128 | idle 6, move 8, attack 8, hit 4, defend 3, death 8 | мумия с бунчуком: конский хвост на древке |
| `unit/bonebull` | Костяные туры | 6 | 192×160 | idle 6, move 8, attack 8, hit 4, defend 3, death 8 | огромные быки из костей, рога в соляной корке |
| `unit/thunderbull` | Громовые туры | 6 A | 192×160 | idle 6, move 8, attack 8, hit 4, defend 3, death 8 | медные колокольцы на рогах, искры под копытами |
| `unit/greybull` | Седые туры | 6 B | 192×160 | idle 6, move 8, attack 8, hit 4, defend 3, death 8 | старые туры, клочья белой шерсти на костях |
| `unit/stonekhan` | Каменный хан | 7 | 192×160 | idle 6, move 8, attack 8, skill 8, hit 4, defend 3, death 8 | колоссальная статуя хана в шлеме, в трещинах золото |
| `unit/kurgankhan` | Хан-курган | 7 A | 192×160 | idle 6, move 8, attack 8, hit 4, defend 3, death 8 | на плечах статуи растёт трава кургана |
| `unit/stormkhan` | Хан бурь | 7 B | 192×160 | idle 6, move 8, attack 8, shoot 8, hit 4, defend 3, death 8 | вокруг статуи вихрь снега и соли |

## Существа: Чаща

| id | Имя | Ур. | Кадр | Анимации | Как выглядит |
| --- | --- | --- | --- | --- | --- |
| `unit/auka` | Ауки | 1 | 96×96 | idle 6, move 8, attack 8, hit 4, defend 3, death 8 | маленькие лохматые духи из мха с большими глазами |
| `unit/mocker` | Пересмешники | 1 A | 96×96 | idle 6, move 8, attack 8, hit 4, defend 3, death 8 | ауки с птичьими клювами и хохолками |
| `unit/wisp` | Блуждающие огни | 1 B | 96×96 | idle 6, move 8, attack 8, shoot 8, hit 4, defend 3, death 8 | зеленоватые огоньки с хитрыми лицами |
| `unit/werewolf` | Волколаки | 2 | 96×96 | idle 6, move 8, attack 8, hit 4, defend 3, death 8 | люди-волки в рваных рубахах, бегут на четвереньках |
| `unit/elderwolf` | Матёрые волколаки | 2 A | 96×96 | idle 6, move 8, attack 8, hit 4, defend 3, death 8 | крупнее, седые загривки |
| `unit/greyturn` | Серые оборотни | 2 B | 96×96 | idle 6, move 8, attack 8, skill 8, hit 4, defend 3, death 8 | полуволки в волчьих шкурах, воют |
| `unit/bereginya` | Берегини | 3 | 96×96 | idle 6, move 8, attack 8, skill 8, hit 4, defend 3, death 8 | девы в белых рубахах с венками, прозрачные покровы |
| `unit/keeper` | Хранительницы | 3 A | 96×96 | idle 6, move 8, attack 8, skill 8, hit 4, defend 3, death 8 | с вышитыми обережными рушниками |
| `unit/rusalka` | Русалки | 3 B | 96×96 | idle 6, move 8, attack 8, skill 8, hit 4, defend 3, death 8 | зеленоволосые, мокрые, длинные руки |
| `unit/kikimora` | Кикиморы | 4 | 128×128 | idle 6, move 8, attack 8, shoot 8, hit 4, defend 3, death 8 | сгорбленные болотные старухи из коряги и тины, кидают комья |
| `unit/bogwitch` | Болотницы | 4 A | 128×128 | idle 6, move 8, attack 8, shoot 8, hit 4, defend 3, death 8 | с жабами на плечах |
| `unit/spinner` | Пряхи | 4 B | 128×128 | idle 6, move 8, attack 8, shoot 8, hit 4, defend 3, death 8 | с прялками и нитями-паутиной |
| `unit/sirin` | Сирины | 5 | 128×128 | idle 6, move 8, attack 8, hit 4, defend 3, death 8 | птицы с женскими лицами, тёмно-синие перья |
| `unit/alkonost` | Алконосты | 5 A | 128×128 | idle 6, move 8, attack 8, skill 8, hit 4, defend 3, death 8 | золотисто-белые перья, светлые лица |
| `unit/gamayun` | Гамаюны | 5 B | 128×128 | idle 6, move 8, attack 8, skill 8, hit 4, defend 3, death 8 | пёстрые перья, вещие глаза |
| `unit/leshy` | Лешие | 6 | 192×160 | idle 6, move 8, attack 8, hit 4, defend 3, death 8 | огромные старики из коры и мха, борода из лишайника |
| `unit/borovik` | Боровики | 6 A | 192×160 | idle 6, move 8, attack 8, hit 4, defend 3, death 8 | грибы на плечах, корни вместо ног |
| `unit/warden` | Лесовики-сторожа | 6 B | 192×160 | idle 6, move 8, attack 8, skill 8, hit 4, defend 3, death 8 | дубины из пней, шапки из бересты |
| `unit/zmey` | Змей | 7 | 192×160 | idle 6, move 8, attack 8, hit 4, defend 3, death 8 | лесной змей-дракон, зелёная чешуя, крылья как листья |
| `unit/threeheaded` | Трёхглавый змей | 7 A | 192×160 | idle 6, move 8, attack 8, hit 4, defend 3, death 8 | три головы на длинных шеях |
| `unit/firezmey` | Огненный змей | 7 B | 192×160 | idle 6, move 8, attack 8, hit 4, defend 3, death 8 | красно-оранжевая чешуя, пламя из пасти |

## Существа: Прилив

| id | Имя | Ур. | Кадр | Анимации | Как выглядит |
| --- | --- | --- | --- | --- | --- |
| `unit/shellman` | Панцирники | 1 | 96×96 | idle 6, move 8, attack 8, hit 4, defend 3, death 8 | люди-крабы с панцирными щитами и короткими копьями |
| `unit/claw` | Клешненосцы | 1 A | 96×96 | idle 6, move 8, attack 8, hit 4, defend 3, death 8 | огромная клешня вместо правой руки |
| `unit/shellback` | Ракушечники | 1 B | 96×96 | idle 6, move 8, attack 8, hit 4, defend 3, death 8 | спины в ракушках, как щит |
| `unit/harpooner` | Гарпунщики | 2 | 96×96 | idle 6, move 8, attack 8, shoot 8, hit 4, defend 3, death 8 | приливники с гарпунами на верёвках, сети за спиной |
| `unit/whaler` | Китобои | 2 A | 96×96 | idle 6, move 8, attack 8, shoot 8, hit 4, defend 3, death 8 | большие гарпуны с зазубринами |
| `unit/netter` | Сетеметатели | 2 B | 96×96 | idle 6, move 8, attack 8, shoot 8, hit 4, defend 3, death 8 | круглые сети с грузилами |
| `unit/jelly` | Медузы | 3 | 96×96 | idle 6, move 8, attack 8, hit 4, defend 3, death 8 | парящие прозрачные медузы с длинными щупальцами |
| `unit/deeplight` | Огни глубин | 3 A | 96×96 | idle 6, move 8, attack 8, hit 4, defend 3, death 8 | медузы светятся голубым |
| `unit/stinger` | Жгучие медузы | 3 B | 96×96 | idle 6, move 8, attack 8, hit 4, defend 3, death 8 | красноватые, жгучие нити |
| `unit/seawitch` | Морские ведьмы | 4 | 128×128 | idle 6, move 8, attack 8, shoot 8, skill 8, hit 4, defend 3, death 8 | кожа цвета волны, волосы-водоросли, кораллы |
| `unit/abyssinger` | Певуньи бездны | 4 A | 128×128 | idle 6, move 8, attack 8, shoot 8, hit 4, defend 3, death 8 | с раковиной-рожком |
| `unit/saltwitch` | Солёные ведьмы | 4 B | 128×128 | idle 6, move 8, attack 8, shoot 8, hit 4, defend 3, death 8 | в соляной корке, белые глаза |
| `unit/rayrider` | Наездники на скатах | 5 | 128×128 | idle 6, move 8, attack 8, hit 4, defend 3, death 8 | всадник на огромном скате, парит над землёй |
| `unit/stormray` | Грозовые скаты | 5 A | 128×128 | idle 6, move 8, attack 8, hit 4, defend 3, death 8 | искры на крыльях ската |
| `unit/nightray` | Ночные скаты | 5 B | 128×128 | idle 6, move 8, attack 8, hit 4, defend 3, death 8 | тёмно-фиолетовые, почти невидимые |
| `unit/turtlefort` | Черепахи-крепости | 6 | 192×160 | idle 6, move 8, attack 8, shoot 8, hit 4, defend 3, death 8 | огромная черепаха с деревянной башней и стрелками |
| `unit/turtleram` | Черепахи-тараны | 6 A | 192×160 | idle 6, move 8, attack 8, hit 4, defend 3, death 8 | панцирь с окованным тараном |
| `unit/turtlebeacon` | Черепахи-маяки | 6 B | 192×160 | idle 6, move 8, attack 8, skill 8, hit 4, defend 3, death 8 | фонарь-маяк на панцире |
| `unit/kraken` | Кракен | 7 | 192×160 | idle 6, move 8, attack 8, skill 8, hit 4, defend 3, death 8 | огромный кальмар, щупальца выходят из лужи воды |
| `unit/ancientkraken` | Древний кракен | 7 A | 192×160 | idle 6, move 8, attack 8, skill 8, hit 4, defend 3, death 8 | в ракушках и кораллах |
| `unit/devourer` | Кракен-пожиратель | 7 B | 192×160 | idle 6, move 8, attack 8, skill 8, hit 4, defend 3, death 8 | огромная пасть-клюв |

## Существа: Горнила

| id | Имя | Ур. | Кадр | Анимации | Как выглядит |
| --- | --- | --- | --- | --- | --- |
| `unit/apprentice` | Подмастерья горна | 1 | 96×96 | idle 6, move 8, attack 8, hit 4, defend 3, death 8 | закопчённые парни в фартуках с молотками, искры |
| `unit/hammerer` | Молотобойцы | 1 A | 96×96 | idle 6, move 8, attack 8, hit 4, defend 3, death 8 | тяжёлые кувалды |
| `unit/stoker` | Кочегары | 1 B | 96×96 | idle 6, move 8, attack 8, shoot 8, hit 4, defend 3, death 8 | лопаты и мешки угля, бросают угли |
| `unit/salamander` | Саламандры | 2 | 96×96 | idle 6, move 8, attack 8, hit 4, defend 3, death 8 | ящеролюди с огненными прожилками на коже |
| `unit/firelizard` | Огневки | 2 A | 96×96 | idle 6, move 8, attack 8, hit 4, defend 3, death 8 | языки пламени на спине |
| `unit/bladelizard` | Ящеры-клинки | 2 B | 96×96 | idle 6, move 8, attack 8, hit 4, defend 3, death 8 | два серповидных клинка |
| `unit/obsidianspider` | Обсидиановые пауки | 3 | 96×96 | idle 6, move 8, attack 8, hit 4, defend 3, death 8 | пауки из чёрного стекла с красным отблеском |
| `unit/glassblower` | Стеклодувы | 3 A | 96×96 | idle 6, move 8, attack 8, shoot 8, hit 4, defend 3, death 8 | раздутое стеклянное брюшко |
| `unit/blackspider` | Чёрные пауки | 3 B | 96×96 | idle 6, move 8, attack 8, hit 4, defend 3, death 8 | матовые, ядовито-зелёные капли |
| `unit/caster` | Литейщики | 4 | 128×128 | idle 6, move 8, attack 8, shoot 8, hit 4, defend 3, death 8 | кожаные доспехи и маски, ковши с расплавом |
| `unit/mastercaster` | Мастера литья | 4 A | 128×128 | idle 6, move 8, attack 8, shoot 8, hit 4, defend 3, death 8 | большие ковши на цепях |
| `unit/temperer` | Закальщики | 4 B | 128×128 | idle 6, move 8, attack 8, shoot 8, skill 8, hit 4, defend 3, death 8 | клещи и бадья воды, клубы пара |
| `unit/steamling` | Паровики | 5 | 128×128 | idle 6, move 8, attack 8, hit 4, defend 3, death 8 | духи пара в облаке, свистящие клапаны |
| `unit/geyser` | Гейзеры | 5 A | 128×128 | idle 6, move 8, attack 8, hit 4, defend 3, death 8 | столб кипятка с лицом |
| `unit/overheated` | Перегретые | 5 B | 128×128 | idle 6, move 8, attack 8, hit 4, defend 3, death 8 | раскалены докрасна, трещины |
| `unit/slaggiant` | Шлаковые великаны | 6 | 192×160 | idle 6, move 8, attack 8, hit 4, defend 3, death 8 | великаны из шлака и застывшей лавы |
| `unit/obsidiangiant` | Обсидиановые великаны | 6 A | 192×160 | idle 6, move 8, attack 8, hit 4, defend 3, death 8 | чёрный блестящий обсидиан |
| `unit/slagthrower` | Метатели шлака | 6 B | 192×160 | idle 6, move 8, attack 8, shoot 8, hit 4, defend 3, death 8 | держат глыбу над головой |
| `unit/volcano` | Ходячий вулкан | 7 | 192×160 | idle 6, move 8, attack 8, shoot 8, hit 4, defend 3, death 8 | гора на каменных ногах, кратер дымится, лава стекает |
| `unit/firemountain` | Огнедышащая гора | 7 A | 192×160 | idle 6, move 8, attack 8, shoot 8, hit 4, defend 3, death 8 | пасть-кратер извергает пламя |
| `unit/sleepingvolcano` | Спящий вулкан | 7 B | 192×160 | idle 6, move 8, attack 8, shoot 8, hit 4, defend 3, death 8 | тёмный, тлеет изнутри, мох на склонах |

## Существа: Престол

| id | Имя | Ур. | Кадр | Анимации | Как выглядит |
| --- | --- | --- | --- | --- | --- |
| `unit/legionary` | Призрачные легионеры | 1 | 96×96 | idle 6, move 8, attack 8, hit 4, defend 3, death 8 | призрачные солдаты в старинных белых доспехах с прямоугольными щитами |
| `unit/standardbearer` | Знаменосцы | 1 A | 96×96 | idle 6, move 8, attack 8, hit 4, defend 3, death 8 | серебряное лунное знамя |
| `unit/mirrorlegion` | Зерцальные легионеры | 1 B | 96×96 | idle 6, move 8, attack 8, hit 4, defend 3, death 8 | щиты-зеркала |
| `unit/moonarcher` | Лунные лучницы | 2 | 96×96 | idle 6, move 8, attack 8, shoot 8, hit 4, defend 3, death 8 | девы в серебристых кольчугах с длинными белыми луками |
| `unit/silverarcher` | Серебряные лучницы | 2 A | 96×96 | idle 6, move 8, attack 8, shoot 8, hit 4, defend 3, death 8 | два колчана за спиной |
| `unit/moonhunter` | Ловчие луны | 2 B | 96×96 | idle 6, move 8, attack 8, shoot 8, hit 4, defend 3, death 8 | капюшоны, стрелы с лунными наконечниками |
| `unit/mirrorguard` | Зеркальные стражи | 3 | 96×96 | idle 6, move 8, attack 8, hit 4, defend 3, death 8 | статуи из зеркального хрусталя с алебардами |
| `unit/prismguard` | Призматические стражи | 3 A | 96×96 | idle 6, move 8, attack 8, hit 4, defend 3, death 8 | разноцветные блики на гранях |
| `unit/mirrorswap` | Стражи-зеркала | 3 B | 96×96 | idle 6, move 8, attack 8, skill 8, hit 4, defend 3, death 8 | плоские, как ростовые зеркала |
| `unit/moonmaiden` | Лунные девы | 4 | 128×128 | idle 6, move 8, attack 8, shoot 8, skill 8, hit 4, defend 3, death 8 | жрицы в белых одеждах с серпами-лунами |
| `unit/whitemaiden` | Девы Белой луны | 4 A | 128×128 | idle 6, move 8, attack 8, shoot 8, skill 8, hit 4, defend 3, death 8 | венец-полумесяц, мягкое свечение |
| `unit/silvermaiden` | Девы Серебряной луны | 4 B | 128×128 | idle 6, move 8, attack 8, shoot 8, skill 8, hit 4, defend 3, death 8 | вуали, серебряная пыль |
| `unit/deerrider` | Всадники на лунных оленях | 5 | 128×128 | idle 6, move 8, attack 8, hit 4, defend 3, death 8 | всадники на белых оленях с серебряными рогами |
| `unit/silverrider` | Серебряные всадники | 5 A | 128×128 | idle 6, move 8, attack 8, hit 4, defend 3, death 8 | латы, копья |
| `unit/deerhunter` | Олени-ловчие | 5 B | 128×128 | idle 6, move 8, attack 8, shoot 8, hit 4, defend 3, death 8 | дротики в колчанах у седла |
| `unit/throneknight` | Рыцари Престола | 6 | 192×160 | idle 6, move 8, attack 8, hit 4, defend 3, death 8 | тяжёлые рыцари в белых латах, плащи, большие мечи |
| `unit/oathkeeper` | Хранители клятвы | 6 A | 192×160 | idle 6, move 8, attack 8, hit 4, defend 3, death 8 | башенные щиты |
| `unit/punisher` | Каратели | 6 B | 192×160 | idle 6, move 8, attack 8, hit 4, defend 3, death 8 | двуручные мечи, чёрные плащи поверх белых лат |
| `unit/shard` | Живой осколок | 7 | 192×160 | idle 6, move 8, attack 8, shoot 8, hit 4, defend 3, death 8 | парящий кристалл-осколок луны размером с дом, светится изнутри |
| `unit/radiantshard` | Сияющий осколок | 7 A | 192×160 | idle 6, move 8, attack 8, shoot 8, hit 4, defend 3, death 8 | тёплый золотистый свет |
| `unit/darkshard` | Тёмный осколок | 7 B | 192×160 | idle 6, move 8, attack 8, shoot 8, hit 4, defend 3, death 8 | тёмно-фиолетовый, свет гаснет вокруг |

## Существа: Звездочёты (доп.)

| id | Имя | Ур. | Кадр | Анимации | Как выглядит |
| --- | --- | --- | --- | --- | --- |
| `unit/clockservant` | Заводные слуги | 1 | 96×96 | idle 6, move 8, attack 8, hit 4, defend 3, death 8 | маленькие латунные человечки с ключом в спине |
| `unit/clockguard` | Заводные стражи | 1 A | 96×96 | idle 6, move 8, attack 8, hit 4, defend 3, death 8 | щиты-шестерни |
| `unit/clockshooter` | Заводные стрелки | 1 B | 96×96 | idle 6, move 8, attack 8, shoot 8, hit 4, defend 3, death 8 | маленькие арбалеты на плечах |
| `unit/novice` | Ученики | 2 | 96×96 | idle 6, move 8, attack 8, shoot 8, hit 4, defend 3, death 8 | юноши в синих мантиях, искрящиеся жезлы |
| `unit/observer` | Наблюдатели | 2 A | 96×96 | idle 6, move 8, attack 8, shoot 8, hit 4, defend 3, death 8 | подзорные трубы |
| `unit/sparkthrower` | Искромёты | 2 B | 96×96 | idle 6, move 8, attack 8, shoot 8, hit 4, defend 3, death 8 | жезлы сыплют искрами |
| `unit/brassowl` | Медные совы | 3 | 96×96 | idle 6, move 8, attack 8, hit 4, defend 3, death 8 | латунные совы с линзами вместо глаз |
| `unit/scoutowl` | Совы-разведчицы | 3 A | 96×96 | idle 6, move 8, attack 8, hit 4, defend 3, death 8 | длинные линзы-трубы |
| `unit/thunderowl` | Громовые совы | 3 B | 96×96 | idle 6, move 8, attack 8, hit 4, defend 3, death 8 | медные катушки и искры |
| `unit/astrologer` | Астрологи | 4 | 128×128 | idle 6, move 8, attack 8, shoot 8, skill 8, hit 4, defend 3, death 8 | старцы в синих мантиях со звёздами, астролябии |
| `unit/seer` | Прорицатели | 4 A | 128×128 | idle 6, move 8, attack 8, shoot 8, skill 8, hit 4, defend 3, death 8 | повязки на глазах, свитки |
| `unit/meteorcaller` | Метеорщики | 4 B | 128×128 | idle 6, move 8, attack 8, shoot 8, skill 8, hit 4, defend 3, death 8 | посохи с огненным камнем |
| `unit/clockwatch` | Часовые | 5 | 128×128 | idle 6, move 8, attack 8, hit 4, defend 3, death 8 | высокие механизмы с циферблатом на груди |
| `unit/pendulum` | Маятники | 5 A | 128×128 | idle 6, move 8, attack 8, hit 4, defend 3, death 8 | маятник-клинок вместо руки |
| `unit/chronometer` | Хронометры | 5 B | 128×128 | idle 6, move 8, attack 8, skill 8, hit 4, defend 3, death 8 | множество циферблатов |
| `unit/irbisrider` | Наездники на ирбисах | 6 | 192×160 | idle 6, move 8, attack 8, hit 4, defend 3, death 8 | всадники на снежных барсах |
| `unit/stormirbis` | Ирбисы бури | 6 A | 192×160 | idle 6, move 8, attack 8, hit 4, defend 3, death 8 | снежный вихрь у лап |
| `unit/irbisleader` | Вожаки ирбисов | 6 B | 192×160 | idle 6, move 8, attack 8, hit 4, defend 3, death 8 | шкуры и рога на шлемах |
| `unit/skywhale` | Небесный кит | 7 | 192×160 | idle 6, move 8, attack 8, skill 8, hit 4, defend 3, death 8 | летающий кит в облаках, звёзды на коже |
| `unit/starwhale` | Звёздный кит | 7 A | 192×160 | idle 6, move 8, attack 8, skill 8, hit 4, defend 3, death 8 | созвездия светятся на боках |
| `unit/guardwhale` | Кит-хранитель | 7 B | 192×160 | idle 6, move 8, attack 8, hit 4, defend 3, death 8 | броня из латунных пластин |

## Существа: Грибница (доп.)

| id | Имя | Ур. | Кадр | Анимации | Как выглядит |
| --- | --- | --- | --- | --- | --- |
| `unit/morel` | Сморчки | 1 | 96×96 | idle 6, move 8, attack 8, hit 4, defend 3, death 8 | ходячие сморчки на ножках-корнях |
| `unit/falsemorel` | Строчки | 1 A | 96×96 | idle 6, move 8, attack 8, hit 4, defend 3, death 8 | складчатые бурые шляпки |
| `unit/puffball` | Дождевики | 1 B | 96×96 | idle 6, move 8, attack 8, hit 4, defend 3, death 8 | круглые белые дождевики, пыль спор |
| `unit/beetle` | Жуки-носильщики | 2 | 96×96 | idle 6, move 8, attack 8, hit 4, defend 3, death 8 | большие пещерные жуки с грибами на спине |
| `unit/bombardier` | Жуки-бомбардиры | 2 A | 96×96 | idle 6, move 8, attack 8, shoot 8, hit 4, defend 3, death 8 | брюшко с кислотой |
| `unit/digger` | Жуки-копатели | 2 B | 96×96 | idle 6, move 8, attack 8, skill 8, hit 4, defend 3, death 8 | лапы-лопаты |
| `unit/toadstool` | Поганки | 3 | 96×96 | idle 6, move 8, attack 8, shoot 8, hit 4, defend 3, death 8 | бледные грибы-девы в шляпках-юбках |
| `unit/palecap` | Бледные поганки | 3 A | 96×96 | idle 6, move 8, attack 8, shoot 8, hit 4, defend 3, death 8 | почти прозрачные |
| `unit/falsehoney` | Ложные опята | 3 B | 96×96 | idle 6, move 8, attack 8, shoot 8, hit 4, defend 3, death 8 | рыжие гроздья |
| `unit/bracket` | Трутовики | 4 | 192×160 | idle 6, move 8, attack 8, hit 4, defend 3, death 8 | грибы-великаны на обломках стволов |
| `unit/chaga` | Чаговики | 4 A | 192×160 | idle 6, move 8, attack 8, skill 8, hit 4, defend 3, death 8 | чёрные наросты чаги |
| `unit/bracketram` | Трутовики-тараны | 4 B | 192×160 | idle 6, move 8, attack 8, hit 4, defend 3, death 8 | каменные наросты на груди |
| `unit/nightmoth` | Ночницы | 5 | 128×128 | idle 6, move 8, attack 8, hit 4, defend 3, death 8 | огромные ночные бабочки со светящейся пыльцой |
| `unit/bloodmoth` | Совки-кровососы | 5 A | 128×128 | idle 6, move 8, attack 8, hit 4, defend 3, death 8 | красные глаза и хоботок |
| `unit/hawkmoth` | Бражники | 5 B | 128×128 | idle 6, move 8, attack 8, hit 4, defend 3, death 8 | узкие быстрые крылья |
| `unit/amanita` | Мухоморы-воители | 6 | 192×160 | idle 6, move 8, attack 8, hit 4, defend 3, death 8 | великаны-мухоморы с красными шляпками и копьями |
| `unit/panthercap` | Пантерные мухоморы | 6 A | 192×160 | idle 6, move 8, attack 8, hit 4, defend 3, death 8 | бурые шляпки в белых пятнах |
| `unit/kingcap` | Королевские мухоморы | 6 B | 192×160 | idle 6, move 8, attack 8, hit 4, defend 3, death 8 | золотистые шляпки, корона-кольцо |
| `unit/moonworm` | Лунный червь | 7 | 192×160 | idle 6, move 8, attack 8, hit 4, defend 3, death 8 | огромный червь с серебристой кожей, внутри лунный свет |
| `unit/glowworm` | Сияющий червь | 7 A | 192×160 | idle 6, move 8, attack 8, hit 4, defend 3, death 8 | светится зелёным |
| `unit/broodworm` | Червь-матка | 7 B | 192×160 | idle 6, move 8, attack 8, skill 8, hit 4, defend 3, death 8 | спина в коконах-яйцах |

## Существа: Нейтралы

| id | Имя | Ур. | Кадр | Анимации | Как выглядит |
| --- | --- | --- | --- | --- | --- |
| `unit/bees` | Дикие пчёлы | 1 | 96×96 | idle 6, move 8, attack 8, hit 4, defend 3, death 8 | гудящий рой крупных пчёл |
| `unit/bandits` | Разбойники | 1 | 96×96 | idle 6, move 8, attack 8, hit 4, defend 3, death 8 | оборванцы с топорами и ножами, повязки на лицах |
| `unit/wolves` | Волки | 2 | 96×96 | idle 6, move 8, attack 8, hit 4, defend 3, death 8 | серые волки |
| `unit/boars` | Вепри | 2 | 96×96 | idle 6, move 8, attack 8, hit 4, defend 3, death 8 | клыкастые вепри |
| `unit/mercenaries` | Наёмники | 2 | 96×96 | idle 6, move 8, attack 8, hit 4, defend 3, death 8 | наёмные копейщики в разномастных доспехах |
| `unit/bears` | Медведи | 3 | 96×96 | idle 6, move 8, attack 8, hit 4, defend 3, death 8 | бурые медведи |
| `unit/mountaineagles` | Горные орлы | 3 | 96×96 | idle 6, move 8, attack 8, hit 4, defend 3, death 8 | крупные горные орлы |
| `unit/scorpions` | Солончаковые скорпионы | 3 | 96×96 | idle 6, move 8, attack 8, hit 4, defend 3, death 8 | белёсые скорпионы с солью на панцире |
| `unit/pirates` | Пираты | 3 | 96×96 | idle 6, move 8, attack 8, hit 4, defend 3, death 8 | пираты Чаши с абордажными саблями |
| `unit/bountyhunters` | Охотники за головами | 4 | 128×128 | idle 6, move 8, attack 8, shoot 8, hit 4, defend 3, death 8 | арбалеты, плащи, мешки для трофеев |
| `unit/hermits` | Отшельники | 4 | 128×128 | idle 6, move 8, attack 8, shoot 8, skill 8, hit 4, defend 3, death 8 | лохматые колдуны с посохами |
| `unit/whitespirit` | Белый дух | 4 | 128×128 | idle 6, move 8, attack 8, skill 8, hit 4, defend 3, death 8 | сияющий белый дух-облако |
| `unit/redspirit` | Алый дух | 4 | 128×128 | idle 6, move 8, attack 8, hit 4, defend 3, death 8 | дух из пламени |
| `unit/azurespirit` | Лазурный дух | 4 | 128×128 | idle 6, move 8, attack 8, hit 4, defend 3, death 8 | дух из воды и льда |
| `unit/greenspirit` | Зелёный дух | 4 | 128×128 | idle 6, move 8, attack 8, hit 4, defend 3, death 8 | дух из листьев и стеблей |
| `unit/silverspirit` | Серебряный дух | 5 | 128×128 | idle 6, move 8, attack 8, hit 4, defend 3, death 8 | мерцающий серебряный дух |
| `unit/goldspirit` | Золотой дух | 5 | 128×128 | idle 6, move 8, attack 8, skill 8, hit 4, defend 3, death 8 | дух из золотого света с кольцами |
| `unit/blackspirit` | Чёрный дух | 5 | 128×128 | idle 6, move 8, attack 8, hit 4, defend 3, death 8 | чёрный дым с белыми глазами |
| `unit/seaserpent` | Морской змей | 5 | 192×160 | idle 6, move 8, attack 8, hit 4, defend 3, death 8 | длинный змей с плавниками |
| `unit/bridgetroll` | Мостовые тролли | 5 | 192×160 | idle 6, move 8, attack 8, hit 4, defend 3, death 8 | мшистые тролли с дубинами |
| `unit/stonegiant` | Каменные великаны | 6 | 192×160 | idle 6, move 8, attack 8, shoot 8, hit 4, defend 3, death 8 | великаны из валунов |
| `unit/moondream` | Сны Восьмой луны | 6 | 128×128 | idle 6, move 8, attack 8, hit 4, defend 3, death 8 | безликие фигуры из лунного света и тумана |
| `unit/ancientlizard` | Древний ящер | 7 | 192×160 | idle 6, move 8, attack 8, hit 4, defend 3, death 8 | старый крылатый ящер, пламя по линии |

## Существа: Призванные

| id | Имя | Ур. | Кадр | Анимации | Как выглядит |
| --- | --- | --- | --- | --- | --- |
| `unit/forestgiant` | Лесной великан | 6 | 192×160 | idle 6, move 8, attack 8, hit 4, defend 3, death 8 | великан из стволов и мха, в волосах птичьи гнёзда, призван заклинанием |

## Герои на карте

| id | Класс | Кадр | Кадры | Как выглядит |
| --- | --- | --- | --- | --- |
| `mapero/captain` | Капитан | 64×64 | 8 направлений × (стоит 1 + идёт 8) | кирасир Лиги на гнедом коне, жёлтый плащ |
| `mapero/magister` | Магистр | 64×64 | 8 направлений × (стоит 1 + идёт 8) | маг гильдии Меры в мантии с весами на груди, белый конь |
| `mapero/noyon` | Нойон | 64×64 | 8 направлений × (стоит 1 + идёт 8) | мёртвый полководец в соляной броне на костлявом коне |
| `mapero/shaman` | Шаман | 64×64 | 8 направлений × (стоит 1 + идёт 8) | живой шаман в белом войлоке с бубном, на степной лошадке |
| `mapero/huntsman` | Ловчий | 64×64 | 8 направлений × (стоит 1 + идёт 8) | охотник в зелёном плаще с луком, верхом на лосе |
| `mapero/sage` | Ведун | 64×64 | 8 направлений × (стоит 1 + идёт 8) | ведун с посохом из корня и венком, верхом на лосе |
| `mapero/chief` | Вожак | 64×64 | 8 направлений × (стоит 1 + идёт 8) | приливник в панцирных латах верхом на огромном крабе |
| `mapero/deeppriest` | Жрец глубин | 64×64 | 8 направлений × (стоит 1 + идёт 8) | жрец с раковиной-рогом верхом на огромном крабе |
| `mapero/forgemaster` | Горновой | 64×64 | 8 направлений × (стоит 1 + идёт 8) | кузнец в кожаном фартуке и латах с молотом, верхом на огненном ящере |
| `mapero/flamekeeper` | Пламенник | 64×64 | 8 направлений × (стоит 1 + идёт 8) | жрец огня в чёрной мантии с жаровней, верхом на огненном ящере |
| `mapero/royalknight` | Рыцарь Престола | 64×64 | 8 направлений × (стоит 1 + идёт 8) | рыцарь в белых латах на белом олене |
| `mapero/mirrormage` | Зерцальщик | 64×64 | 8 направлений × (стоит 1 + идёт 8) | маг с зеркальным щитом в серебряной мантии на белом олене |
| `mapero/mechanic` | Механик (доп.) | 64×64 | 8 направлений × (стоит 1 + идёт 8) | мастер в латунных очках с гаечным ключом, верхом на ирбисе |
| `mapero/astronomer` | Звездочёт (доп.) | 64×64 | 8 направлений × (стоит 1 + идёт 8) | звездочёт в синей мантии с телескопом, верхом на ирбисе |
| `mapero/sprouted` | Проросший (доп.) | 64×64 | 8 направлений × (стоит 1 + идёт 8) | воин, проросший грибами, верхом на пещерном жуке |
| `mapero/dreamer` | Сновидец (доп.) | 64×64 | 8 направлений × (стоит 1 + идёт 8) | бледный сновидец со светящимися грибами, верхом на пещерном жуке |

## Портреты героев кампаний

| id | Кто | Размер | Как выглядит |
| --- | --- | --- | --- |
| `portrait/adelina` | Аделина Корвен | 64×64 | капитан стражи Звонграда, около 30 лет, тёмные волосы под шлемом-капеллиной, шрам на подбородке |
| `portrait/malse` | Хендрик Мальс | 64×64 | бургомистр Звонграда, полный, в бархате и золотой цепи, бегающий взгляд |
| `portrait/aisulu` | Айсулу | 64×64 | молодая шаманка степи, 17 лет, белый войлочный колпак, косы с бусами, внимательные глаза |
| `portrait/kaidar` | Кайдар-хан | 64×64 | дух хана: соляная маска, шлем с бармицей, свет в пустых глазницах |
| `portrait/vedana` | Ведана | 64×64 | ведунья лет сорока, русые косы, венок из полыни, рубаха с вышивкой |
| `portrait/borovoy` | Боровой | 64×64 | старый леший: лицо из коры, борода-лишайник, жёлтые глаза |
| `portrait/naera` | Наэра | 64×64 | жрица Прилива, кожа с перламутровым отливом, волосы-водоросли, раковина на шее |
| `portrait/merra` | Мерра | 64×64 | младшая сестра Наэры, острые черты, белый плащ Ордена поверх панциря |
| `portrait/irga` | Ирга | 64×64 | кузнечиха Пепельного народа, сажа на коже, угли в глазах, короткие рыжие волосы |
| `portrait/garm` | Гарм Окалина | 64×64 | старший горн, седая борода в окалине, тяжёлая цепь мастера |
| `portrait/valeria` | Валерия | 64×64 | наследница Престола, 20 лет, серебряные глаза, белые латы с полумесяцем |
| `portrait/severin` | Северин Ладар | 64×64 | регент Престола, худой, седой, зеркальная маска на поясе, холодная улыбка |
| `portrait/feona` | Феона (доп.) | 64×64 | звездочётка, очки-линзы на лбу, синяя мантия со звёздами |
| `portrait/evdor` | мастер Евдор (доп.) | 64×64 | старый звездочёт, длинная борода, астролябия на груди |
| `portrait/tikhon` | Тихон (доп.) | 64×64 | грибник средних лет, кепка, лицо в бледных пятнах-грибах, добрые глаза |
| `portrait/renier` | Ренье Даль | 64×64 | мельник и старшина ополчения, за сорок, широкое лицо, мучная пыль на бровях, стёганый ворот |
| `portrait/ortwin` | Ортвин Брасс | 64×64 | литейщик, короткая седая борода, ожоги на щеке, кожаный фартук поверх кирасы |
| `portrait/yosta` | Йоста Ферн | 64×64 | бывший лоцман, обветренное лицо, щурится, серьга, берет с пером |
| `portrait/mirabel` | Мирабель Фосс | 64×64 | магистр счётных чар, строгая женщина лет пятидесяти, очки, тёмная мантия с весами |
| `portrait/kaspar` | Каспар Ланге | 64×64 | часовщик и маг Меры, худой, тонкие усы, лупа на лбу, синяя мантия |
| `portrait/iveta` | Ивета Солье | 64×64 | аптекарша и маг, тёмные волосы в узле, жёлтые пятна серы на пальцах у подбородка, зелёный воротник |
| `portrait/tobias` | Тобиас Верн | 64×64 | учитель цеховой школы, лысеющий, добродушный, мел за ухом, мантия с гербом цеха |
| `portrait/timar` | Тимар | 64×64 | мёртвый нойон, сухое лицо под соляной коркой, шлем с бунчуком, пустые глаза |
| `portrait/yesui` | Есуй | 64×64 | мёртвая воительница, бледное лицо, косы в соляной пыли, кожаный доспех, спокойный взгляд |
| `portrait/burtas` | Буртас | 64×64 | огромный мёртвый нойон, шрамы и соль на бороде, ожерелье из именных бирок |
| `portrait/ketebai` | Кетебай | 64×64 | мёртвый проводник караванов, лицо замотано платком, видны только светлые глаза |
| `portrait/kulpash` | Кулпаш | 64×64 | старая шаманка, морщинистое лицо, белый войлочный колпак, соль на ресницах |
| `portrait/saryg` | Сарыг-кам | 64×64 | шаман средних лет, иней в бороде, шапка из белого тура, бубен у плеча |
| `portrait/erden` | Ерден | 64×64 | молодой хранитель преданий, бритая голова, узор родов на шее, внимательный взгляд |

## Сцены городов (3D)

- `town/league` Город: Лига, 800×432: фон и слои `hall1` Староста, `hall2` Управа, `hall3` Ратуша, `hall4` Столица, `fort1` Частокол, `fort2` Стена, `fort3` Крепость, `tavern` Таверна, `market` Рынок, `store` Склад, `smith` Кузня, `guild1` Гильдия 1, `guild2` Гильдия 2, `guild3` Гильдия 3, `guild4` Гильдия 4, `guild5` Гильдия 5, `caravan` Обозная станция, `shipyard` Верфь, `dwell1` Жилище 1, `dwell1u` Улучшенное жилище 1, `dwell2` Жилище 2, `dwell2u` Улучшенное жилище 2, `dwell3` Жилище 3, `dwell3u` Улучшенное жилище 3, `dwell4` Жилище 4, `dwell4u` Улучшенное жилище 4, `dwell5` Жилище 5, `dwell5u` Улучшенное жилище 5, `dwell6` Жилище 6, `dwell6u` Улучшенное жилище 6, `dwell7` Жилище 7, `dwell7u` Улучшенное жилище 7, `special1` Ратуша контрактов, `special2` Колокольня, `special3` Пороховой двор, `special4` Торговая палата, `altar` Лунный алтарь.
- `town/barrows` Город: Курганы, 800×432: фон и слои `hall1` Староста, `hall2` Управа, `hall3` Ратуша, `hall4` Столица, `fort1` Частокол, `fort2` Стена, `fort3` Крепость, `tavern` Таверна, `market` Рынок, `store` Склад, `smith` Кузня, `guild1` Гильдия 1, `guild2` Гильдия 2, `guild3` Гильдия 3, `guild4` Гильдия 4, `guild5` Гильдия 5, `caravan` Обозная станция, `shipyard` Верфь, `dwell1` Жилище 1, `dwell1u` Улучшенное жилище 1, `dwell2` Жилище 2, `dwell2u` Улучшенное жилище 2, `dwell3` Жилище 3, `dwell3u` Улучшенное жилище 3, `dwell4` Жилище 4, `dwell4u` Улучшенное жилище 4, `dwell5` Жилище 5, `dwell5u` Улучшенное жилище 5, `dwell6` Жилище 6, `dwell6u` Улучшенное жилище 6, `dwell7` Жилище 7, `dwell7u` Улучшенное жилище 7, `special1` Курган, `special2` Камень-предок, `special3` Конный выгон, `special4` Юрта шаманов, `altar` Лунный алтарь.
- `town/thicket` Город: Чаща, 800×432: фон и слои `hall1` Староста, `hall2` Управа, `hall3` Ратуша, `hall4` Столица, `fort1` Частокол, `fort2` Стена, `fort3` Крепость, `tavern` Таверна, `market` Рынок, `store` Склад, `smith` Кузня, `guild1` Гильдия 1, `guild2` Гильдия 2, `guild3` Гильдия 3, `guild4` Гильдия 4, `guild5` Гильдия 5, `caravan` Обозная станция, `shipyard` Верфь, `dwell1` Жилище 1, `dwell1u` Улучшенное жилище 1, `dwell2` Жилище 2, `dwell2u` Улучшенное жилище 2, `dwell3` Жилище 3, `dwell3u` Улучшенное жилище 3, `dwell4` Жилище 4, `dwell4u` Улучшенное жилище 4, `dwell5` Жилище 5, `dwell5u` Улучшенное жилище 5, `dwell6` Жилище 6, `dwell6u` Улучшенное жилище 6, `dwell7` Жилище 7, `dwell7u` Улучшенное жилище 7, `special1` Ведьмино кольцо, `special2` Священная берёза, `special3` Медовый двор, `special4` Капище, `altar` Лунный алтарь.
- `town/tide` Город: Прилив, 800×432: фон и слои `hall1` Староста, `hall2` Управа, `hall3` Ратуша, `hall4` Столица, `fort1` Частокол, `fort2` Стена, `fort3` Крепость, `tavern` Таверна, `market` Рынок, `store` Склад, `smith` Кузня, `guild1` Гильдия 1, `guild2` Гильдия 2, `guild3` Гильдия 3, `guild4` Гильдия 4, `guild5` Гильдия 5, `caravan` Обозная станция, `shipyard` Верфь, `dwell1` Жилище 1, `dwell1u` Улучшенное жилище 1, `dwell2` Жилище 2, `dwell2u` Улучшенное жилище 2, `dwell3` Жилище 3, `dwell3u` Улучшенное жилище 3, `dwell4` Жилище 4, `dwell4u` Улучшенное жилище 4, `dwell5` Жилище 5, `dwell5u` Улучшенное жилище 5, `dwell6` Жилище 6, `dwell6u` Улучшенное жилище 6, `dwell7` Жилище 7, `dwell7u` Улучшенное жилище 7, `special1` Гавань, `special2` Коралловый сад, `special3` Маяк, `special4` Солеварня, `altar` Лунный алтарь.
- `town/forge` Город: Горнила, 800×432: фон и слои `hall1` Староста, `hall2` Управа, `hall3` Ратуша, `hall4` Столица, `fort1` Частокол, `fort2` Стена, `fort3` Крепость, `tavern` Таверна, `market` Рынок, `store` Склад, `smith` Кузня, `guild1` Гильдия 1, `guild2` Гильдия 2, `guild3` Гильдия 3, `guild4` Гильдия 4, `guild5` Гильдия 5, `caravan` Обозная станция, `shipyard` Верфь, `dwell1` Жилище 1, `dwell1u` Улучшенное жилище 1, `dwell2` Жилище 2, `dwell2u` Улучшенное жилище 2, `dwell3` Жилище 3, `dwell3u` Улучшенное жилище 3, `dwell4` Жилище 4, `dwell4u` Улучшенное жилище 4, `dwell5` Жилище 5, `dwell5u` Улучшенное жилище 5, `dwell6` Жилище 6, `dwell6u` Улучшенное жилище 6, `dwell7` Жилище 7, `dwell7u` Улучшенное жилище 7, `special1` Великий горн, `special2` Обсидиановые стены, `special3` Литейная, `special4` Пепельный алтарь, `altar` Лунный алтарь.
- `town/throne` Город: Престол, 800×432: фон и слои `hall1` Староста, `hall2` Управа, `hall3` Ратуша, `hall4` Столица, `fort1` Частокол, `fort2` Стена, `fort3` Крепость, `tavern` Таверна, `market` Рынок, `store` Склад, `smith` Кузня, `guild1` Гильдия 1, `guild2` Гильдия 2, `guild3` Гильдия 3, `guild4` Гильдия 4, `guild5` Гильдия 5, `caravan` Обозная станция, `shipyard` Верфь, `dwell1` Жилище 1, `dwell1u` Улучшенное жилище 1, `dwell2` Жилище 2, `dwell2u` Улучшенное жилище 2, `dwell3` Жилище 3, `dwell3u` Улучшенное жилище 3, `dwell4` Жилище 4, `dwell4u` Улучшенное жилище 4, `dwell5` Жилище 5, `dwell5u` Улучшенное жилище 5, `dwell6` Жилище 6, `dwell6u` Улучшенное жилище 6, `dwell7` Жилище 7, `dwell7u` Улучшенное жилище 7, `special1` Белый престол, `special2` Зеркальная зала, `special3` Конюшня оленей, `special4` Белый храм, `altar` Лунный алтарь.
- `town/stars` Город: Звездочёты (доп.), 800×432: фон и слои `hall1` Староста, `hall2` Управа, `hall3` Ратуша, `hall4` Столица, `fort1` Частокол, `fort2` Стена, `fort3` Крепость, `tavern` Таверна, `market` Рынок, `store` Склад, `smith` Кузня, `guild1` Гильдия 1, `guild2` Гильдия 2, `guild3` Гильдия 3, `guild4` Гильдия 4, `guild5` Гильдия 5, `caravan` Обозная станция, `shipyard` Верфь, `dwell1` Жилище 1, `dwell1u` Улучшенное жилище 1, `dwell2` Жилище 2, `dwell2u` Улучшенное жилище 2, `dwell3` Жилище 3, `dwell3u` Улучшенное жилище 3, `dwell4` Жилище 4, `dwell4u` Улучшенное жилище 4, `dwell5` Жилище 5, `dwell5u` Улучшенное жилище 5, `dwell6` Жилище 6, `dwell6u` Улучшенное жилище 6, `dwell7` Жилище 7, `dwell7u` Улучшенное жилище 7, `special1` Большой телескоп, `special2` Часовая башня, `special3` Мастерская механизмов, `special4` Библиотека звёзд, `altar` Лунный алтарь.
- `town/spore` Город: Грибница (доп.), 800×432: фон и слои `hall1` Староста, `hall2` Управа, `hall3` Ратуша, `hall4` Столица, `fort1` Частокол, `fort2` Стена, `fort3` Крепость, `tavern` Таверна, `market` Рынок, `store` Склад, `smith` Кузня, `guild1` Гильдия 1, `guild2` Гильдия 2, `guild3` Гильдия 3, `guild4` Гильдия 4, `guild5` Гильдия 5, `caravan` Обозная станция, `shipyard` Верфь, `dwell1` Жилище 1, `dwell1u` Улучшенное жилище 1, `dwell2` Жилище 2, `dwell2u` Улучшенное жилище 2, `dwell3` Жилище 3, `dwell3u` Улучшенное жилище 3, `dwell4` Жилище 4, `dwell4u` Улучшенное жилище 4, `dwell5` Жилище 5, `dwell5u` Улучшенное жилище 5, `dwell6` Жилище 6, `dwell6u` Улучшенное жилище 6, `dwell7` Жилище 7, `dwell7u` Улучшенное жилище 7, `special1` Грибные ходы, `special2` Споровая башня, `special3` Бродильный чан, `special4` Лунная жила, `altar` Лунный алтарь.

## Города на карте

| id | Что | Размер | След |
| --- | --- | --- | --- |
| `townmap/league-1` | Город Лига: частокол | 192×160 | 5×3 |
| `townmap/league-2` | Город Лига: стена | 192×160 | 5×3 |
| `townmap/league-3` | Город Лига: крепость | 192×160 | 5×3 |
| `townmap/barrows-1` | Город Курганы: частокол | 192×160 | 5×3 |
| `townmap/barrows-2` | Город Курганы: стена | 192×160 | 5×3 |
| `townmap/barrows-3` | Город Курганы: крепость | 192×160 | 5×3 |
| `townmap/thicket-1` | Город Чаща: частокол | 192×160 | 5×3 |
| `townmap/thicket-2` | Город Чаща: стена | 192×160 | 5×3 |
| `townmap/thicket-3` | Город Чаща: крепость | 192×160 | 5×3 |
| `townmap/tide-1` | Город Прилив: частокол | 192×160 | 5×3 |
| `townmap/tide-2` | Город Прилив: стена | 192×160 | 5×3 |
| `townmap/tide-3` | Город Прилив: крепость | 192×160 | 5×3 |
| `townmap/forge-1` | Город Горнила: частокол | 192×160 | 5×3 |
| `townmap/forge-2` | Город Горнила: стена | 192×160 | 5×3 |
| `townmap/forge-3` | Город Горнила: крепость | 192×160 | 5×3 |
| `townmap/throne-1` | Город Престол: частокол | 192×160 | 5×3 |
| `townmap/throne-2` | Город Престол: стена | 192×160 | 5×3 |
| `townmap/throne-3` | Город Престол: крепость | 192×160 | 5×3 |
| `townmap/stars-1` | Город Звездочёты: частокол (доп.) | 192×160 | 5×3 |
| `townmap/stars-2` | Город Звездочёты: стена (доп.) | 192×160 | 5×3 |
| `townmap/stars-3` | Город Звездочёты: крепость (доп.) | 192×160 | 5×3 |
| `townmap/spore-1` | Город Грибница: частокол (доп.) | 192×160 | 5×3 |
| `townmap/spore-2` | Город Грибница: стена (доп.) | 192×160 | 5×3 |
| `townmap/spore-3` | Город Грибница: крепость (доп.) | 192×160 | 5×3 |

## Объекты карты

| id | Что | След, клеток | Размер | Кадры и флаг |
| --- | --- | --- | --- | --- |
| `object/goldmine` | Золотой прииск | 3×2 | 112×96 | флаг |
| `object/sawmill` | Лесопилка | 3×2 | 112×96 | флаг, крутится колесо |
| `object/oremine` | Рудник | 3×2 | 112×96 | флаг |
| `object/saltworks` | Солеварня | 3×2 | 112×96 | флаг, пар |
| `object/ambermine` | Янтарная копь | 3×2 | 112×96 | флаг |
| `object/sulfurspring` | Серный ключ | 2×2 | 80×96 | флаг, жёлтый пар |
| `object/moonrift` | Лунный разлом | 3×2 | 112×96 | флаг, серебряный свет |
| `object/oldmine` | Заброшенная шахта | 3×2 | 112×96 |  |
| `object/res-gold` | Куча золота | 1×1 | 48×64 |  |
| `object/res-wood` | Брёвна | 1×1 | 48×64 |  |
| `object/res-ore` | Руда | 1×1 | 48×64 |  |
| `object/res-salt` | Соль | 1×1 | 48×64 |  |
| `object/res-amber` | Янтарь | 1×1 | 48×64 |  |
| `object/res-sulfur` | Сера | 1×1 | 48×64 |  |
| `object/res-moonsilver` | Лунное серебро | 1×1 | 48×64 |  |
| `object/chest` | Сундук | 1×1 | 48×64 |  |
| `object/campfire` | Костёр | 1×1 | 48×64 | 4 кадра огня |
| `object/wagon` | Брошенная повозка | 2×1 | 80×64 |  |
| `object/wreck` | Обломки на берегу | 2×1 | 80×64 |  |
| `object/barrel` | Бочка в воде | 1×1 | 48×64 | 4 кадра качки |
| `object/scroll` | Свиток | 1×1 | 48×64 |  |
| `object/moonshard` | Лунный осколок | 1×1 | 48×64 | мерцает |
| `object/traveler` | Вещи путника | 1×1 | 48×64 |  |
| `object/windmill` | Ветряная мельница | 3×3 | 112×128 | 8 кадров крыльев |
| `object/watermill` | Водяная мельница | 3×2 | 112×96 | 8 кадров колеса |
| `object/apiary` | Пасека | 2×2 | 80×96 |  |
| `object/well` | Колодец | 1×1 | 48×64 |  |
| `object/stable` | Конюшня | 3×2 | 112×96 |  |
| `object/atkstone` | Камень натиска | 2×2 | 80×96 |  |
| `object/ancestorshield` | Щит предков | 2×2 | 80×96 |  |
| `object/charmspring` | Источник чар | 2×2 | 80×96 | 4 кадра |
| `object/sagescroll` | Свиток мудреца | 2×2 | 80×96 |  |
| `object/knowledgetree` | Древо познания | 3×3 | 112×128 |  |
| `object/witchhut` | Хижина ведуна | 2×2 | 80×96 |  |
| `object/camp` | Учебный лагерь | 3×2 | 112×96 |  |
| `object/arena` | Арена | 3×3 | 112×128 |  |
| `object/shrine1` | Святилище 1 круга | 2×2 | 80×96 |  |
| `object/shrine2` | Святилище 2 круга | 2×2 | 80×96 |  |
| `object/shrine3` | Святилище 3 круга | 2×2 | 80×96 |  |
| `object/weekaltar` | Алтарь недели | 2×2 | 80×96 | цвет луны недели |
| `object/library` | Библиотека | 3×2 | 112×96 |  |
| `object/chapel` | Часовня | 2×2 | 80×96 |  |
| `object/luckspring` | Родник удачи | 2×1 | 80×64 |  |
| `object/idol` | Идол | 1×1 | 48×64 |  |
| `object/graveyard` | Погост | 3×2 | 112×96 |  |
| `object/portal1` | Портал в одну сторону | 2×2 | 80×96 | 8 кадров |
| `object/portal2` | Портал в обе стороны | 2×2 | 80×96 | 8 кадров |
| `object/moongate` | Лунные врата | 3×2 | 112×96 | закрыты и открыты, 8 кадров |
| `object/shipyard` | Верфь | 3×3 | 112×128 | флаг |
| `object/boat` | Лодка | 2×1 | 80×64 | 8 направлений, флаг |
| `object/whirlpool` | Водоворот | 2×2 | 80×96 | 8 кадров |
| `object/stairsdown` | Спуск в Подлунье | 2×2 | 80×96 |  |
| `object/stairsup` | Ход наверх | 2×2 | 80×96 |  |
| `object/ferry` | Паром | 2×1 | 80×64 |  |
| `object/watchtower` | Дозорная башня | 2×2 | 80×96 |  |
| `object/observatory` | Обсерватория | 3×3 | 112×128 |  |
| `object/cartographer` | Картограф | 2×2 | 80×96 |  |
| `object/market` | Рынок | 3×2 | 112×96 |  |
| `object/fair` | Ярмарка | 3×2 | 112×96 |  |
| `object/blackmarket` | Чёрный рынок | 2×2 | 80×96 |  |
| `object/inn` | Придорожная таверна | 3×2 | 112×96 |  |
| `object/mercenarycamp` | Наёмничий лагерь | 3×2 | 112×96 |  |
| `object/changeforge` | Кузня перемен | 2×2 | 80×96 |  |
| `object/outpost` | Застава | 2×1 | 80×64 | флаг |
| `object/prison` | Острог | 3×2 | 112×96 |  |
| `object/sealer` | Печатник | 2×2 | 80×96 | шатёр в цвет печати |
| `object/sealgate` | Застава печати | 1×1 | 48×64 | шлагбаум в цвет печати |
| `object/petitioner` | Хижина просителя | 2×2 | 80×96 |  |
| `object/questgate` | Ворота задания | 1×1 | 48×64 |  |
| `object/signstone` | Камень с надписью | 1×1 | 48×64 |  |
| `object/wagonruin` | Разорённый обоз | 3×2 | 112×96 |  |
| `object/wolfden` | Волчье логово | 3×2 | 112×96 |  |
| `object/eaglenest` | Гнездо орлов | 2×3 | 80×128 |  |
| `object/wildhive` | Дикий улей | 2×2 | 80×96 |  |
| `object/sunkentemple` | Затонувший храм | 3×3 | 112×128 |  |
| `object/khancrypt` | Склеп ханов | 3×2 | 112×96 |  |
| `object/piratecove` | Пиратская бухта | 3×3 | 112×128 |  |
| `object/trollcave` | Пещера троллей | 3×2 | 112×96 |  |
| `object/giantforge` | Кузня великанов | 3×3 | 112×128 | дым |
| `object/moonmine` | Лунный рудник | 3×2 | 112×96 |  |
| `object/ruinedobservatory` | Руина обсерватории | 3×3 | 112×128 |  |
| `object/thronetreasury` | Сокровищница Престола | 3×3 | 112×128 |  |
| `object/whiteruin` | Белая руина | 3×2 | 112×96 | флаг |
| `object/menhir` | Менгир | 1×2 | 48×96 |  |
| `object/digspot` | Ямка | 1×1 | 48×64 |  |
| `object/fungalring` | Грибной круг | 2×2 | 80×96 | светится |
| `object/crystalgrotto` | Кристальный грот | 3×2 | 112×96 |  |
| `object/witchring` | Ведьмин круг | 2×2 | 80×96 |  |
| `object/kurganstone` | Курганный камень | 2×2 | 80×96 |  |

## Жилища на карте

| id | Что | Размер | Как выглядит |
| --- | --- | --- | --- |
| `dwelling/militia` | Жилище: Ополченцы | 80×96 | жилище, где живут ополченцы (горожане дельты в стёганках и войлочных шапках, длинные копья, жёлтая повязка Лиги) |
| `dwelling/crossbow` | Жилище: Арбалетчики | 80×96 | жилище, где живут арбалетчики (тяжёлые арбалеты с воротом, стёганые куртки, береты с пером) |
| `dwelling/ringer` | Жилище: Звонари | 80×96 | жилище, где живут звонари (звонари в серых рясах с ручными колоколами на древках) |
| `dwelling/plated` | Жилище: Латники | 80×96 | жилище, где живут латники (полный доспех, длинные мечи, шлемы-салады) |
| `dwelling/aeronaut` | Жилище: Аэронавты | 112×96 | жилище, где живут аэронавты (воздушный шар из лоскутной ткани, в корзине двое с мушкетами) |
| `dwelling/horseguard` | Жилище: Конная гвардия | 112×96 | жилище, где живут конная гвардия (всадники в кирасах на тяжёлых конях, копья с вымпелами) |
| `dwelling/bombard` | Жилище: Бомбарда | 112×96 | жилище, где живут бомбарда (бронзовая пушка на дубовом лафете, расчёт из двух пушкарей) |
| `dwelling/shade` | Жилище: Тени предков | 80×96 | жилище, где живут тени предков (полупрозрачные степные воины в остроконечных шапках, без ног, сизый туман) |
| `dwelling/horsebow` | Жилище: Конные лучники | 80×96 | жилище, где живут конные лучники (мёртвые всадники в кожаных доспехах на костлявых степных лошадях, составные луки) |
| `dwelling/stonewoman` | Жилище: Каменные бабы | 80×96 | жилище, где живут каменные бабы (серые каменные идолы с плоскими лицами, руки держат чашу у живота) |
| `dwelling/eaglespirit` | Жилище: Духи беркутов | 80×96 | жилище, где живут духи беркутов (огромные беркуты из дыма и перьев) |
| `dwelling/saltnoyon` | Жилище: Засоленные нойоны | 112×96 | жилище, где живут засоленные нойоны (мумии знати в шёлковых халатах под соляной коркой, золотые маски) |
| `dwelling/bonebull` | Жилище: Костяные туры | 112×96 | жилище, где живут костяные туры (огромные быки из костей, рога в соляной корке) |
| `dwelling/stonekhan` | Жилище: Каменный хан | 112×96 | жилище, где живут каменный хан (колоссальная статуя хана в шлеме, в трещинах золото) |
| `dwelling/auka` | Жилище: Ауки | 80×96 | жилище, где живут ауки (маленькие лохматые духи из мха с большими глазами) |
| `dwelling/werewolf` | Жилище: Волколаки | 80×96 | жилище, где живут волколаки (люди-волки в рваных рубахах, бегут на четвереньках) |
| `dwelling/bereginya` | Жилище: Берегини | 80×96 | жилище, где живут берегини (девы в белых рубахах с венками, прозрачные покровы) |
| `dwelling/kikimora` | Жилище: Кикиморы | 80×96 | жилище, где живут кикиморы (сгорбленные болотные старухи из коряги и тины, кидают комья) |
| `dwelling/sirin` | Жилище: Сирины | 112×96 | жилище, где живут сирины (птицы с женскими лицами, тёмно-синие перья) |
| `dwelling/leshy` | Жилище: Лешие | 112×96 | жилище, где живут лешие (огромные старики из коры и мха, борода из лишайника) |
| `dwelling/zmey` | Жилище: Змей | 112×96 | жилище, где живут змей (лесной змей-дракон, зелёная чешуя, крылья как листья) |
| `dwelling/shellman` | Жилище: Панцирники | 80×96 | жилище, где живут панцирники (люди-крабы с панцирными щитами и короткими копьями) |
| `dwelling/harpooner` | Жилище: Гарпунщики | 80×96 | жилище, где живут гарпунщики (приливники с гарпунами на верёвках, сети за спиной) |
| `dwelling/jelly` | Жилище: Медузы | 80×96 | жилище, где живут медузы (парящие прозрачные медузы с длинными щупальцами) |
| `dwelling/seawitch` | Жилище: Морские ведьмы | 80×96 | жилище, где живут морские ведьмы (кожа цвета волны, волосы-водоросли, кораллы) |
| `dwelling/rayrider` | Жилище: Наездники на скатах | 112×96 | жилище, где живут наездники на скатах (всадник на огромном скате, парит над землёй) |
| `dwelling/turtlefort` | Жилище: Черепахи-крепости | 112×96 | жилище, где живут черепахи-крепости (огромная черепаха с деревянной башней и стрелками) |
| `dwelling/kraken` | Жилище: Кракен | 112×96 | жилище, где живут кракен (огромный кальмар, щупальца выходят из лужи воды) |
| `dwelling/apprentice` | Жилище: Подмастерья горна | 80×96 | жилище, где живут подмастерья горна (закопчённые парни в фартуках с молотками, искры) |
| `dwelling/salamander` | Жилище: Саламандры | 80×96 | жилище, где живут саламандры (ящеролюди с огненными прожилками на коже) |
| `dwelling/obsidianspider` | Жилище: Обсидиановые пауки | 80×96 | жилище, где живут обсидиановые пауки (пауки из чёрного стекла с красным отблеском) |
| `dwelling/caster` | Жилище: Литейщики | 80×96 | жилище, где живут литейщики (кожаные доспехи и маски, ковши с расплавом) |
| `dwelling/steamling` | Жилище: Паровики | 112×96 | жилище, где живут паровики (духи пара в облаке, свистящие клапаны) |
| `dwelling/slaggiant` | Жилище: Шлаковые великаны | 112×96 | жилище, где живут шлаковые великаны (великаны из шлака и застывшей лавы) |
| `dwelling/volcano` | Жилище: Ходячий вулкан | 112×96 | жилище, где живут ходячий вулкан (гора на каменных ногах, кратер дымится, лава стекает) |
| `dwelling/legionary` | Жилище: Призрачные легионеры | 80×96 | жилище, где живут призрачные легионеры (призрачные солдаты в старинных белых доспехах с прямоугольными щитами) |
| `dwelling/moonarcher` | Жилище: Лунные лучницы | 80×96 | жилище, где живут лунные лучницы (девы в серебристых кольчугах с длинными белыми луками) |
| `dwelling/mirrorguard` | Жилище: Зеркальные стражи | 80×96 | жилище, где живут зеркальные стражи (статуи из зеркального хрусталя с алебардами) |
| `dwelling/moonmaiden` | Жилище: Лунные девы | 80×96 | жилище, где живут лунные девы (жрицы в белых одеждах с серпами-лунами) |
| `dwelling/deerrider` | Жилище: Всадники на лунных оленях | 112×96 | жилище, где живут всадники на лунных оленях (всадники на белых оленях с серебряными рогами) |
| `dwelling/throneknight` | Жилище: Рыцари Престола | 112×96 | жилище, где живут рыцари престола (тяжёлые рыцари в белых латах, плащи, большие мечи) |
| `dwelling/shard` | Жилище: Живой осколок | 112×96 | жилище, где живут живой осколок (парящий кристалл-осколок луны размером с дом, светится изнутри) |
| `dwelling/clockservant` | Жилище: Заводные слуги (доп.) | 80×96 | жилище, где живут заводные слуги (маленькие латунные человечки с ключом в спине) |
| `dwelling/novice` | Жилище: Ученики (доп.) | 80×96 | жилище, где живут ученики (юноши в синих мантиях, искрящиеся жезлы) |
| `dwelling/brassowl` | Жилище: Медные совы (доп.) | 80×96 | жилище, где живут медные совы (латунные совы с линзами вместо глаз) |
| `dwelling/astrologer` | Жилище: Астрологи (доп.) | 80×96 | жилище, где живут астрологи (старцы в синих мантиях со звёздами, астролябии) |
| `dwelling/clockwatch` | Жилище: Часовые (доп.) | 112×96 | жилище, где живут часовые (высокие механизмы с циферблатом на груди) |
| `dwelling/irbisrider` | Жилище: Наездники на ирбисах (доп.) | 112×96 | жилище, где живут наездники на ирбисах (всадники на снежных барсах) |
| `dwelling/skywhale` | Жилище: Небесный кит (доп.) | 112×96 | жилище, где живут небесный кит (летающий кит в облаках, звёзды на коже) |
| `dwelling/morel` | Жилище: Сморчки (доп.) | 80×96 | жилище, где живут сморчки (ходячие сморчки на ножках-корнях) |
| `dwelling/beetle` | Жилище: Жуки-носильщики (доп.) | 80×96 | жилище, где живут жуки-носильщики (большие пещерные жуки с грибами на спине) |
| `dwelling/toadstool` | Жилище: Поганки (доп.) | 80×96 | жилище, где живут поганки (бледные грибы-девы в шляпках-юбках) |
| `dwelling/bracket` | Жилище: Трутовики (доп.) | 80×96 | жилище, где живут трутовики (грибы-великаны на обломках стволов) |
| `dwelling/nightmoth` | Жилище: Ночницы (доп.) | 112×96 | жилище, где живут ночницы (огромные ночные бабочки со светящейся пыльцой) |
| `dwelling/amanita` | Жилище: Мухоморы-воители (доп.) | 112×96 | жилище, где живут мухоморы-воители (великаны-мухоморы с красными шляпками и копьями) |
| `dwelling/moonworm` | Жилище: Лунный червь (доп.) | 112×96 | жилище, где живут лунный червь (огромный червь с серебристой кожей, внутри лунный свет) |
| `dwelling/bees` | Жилище: Дикие пчёлы | 80×96 | жилище, где живут дикие пчёлы (гудящий рой крупных пчёл) |
| `dwelling/bandits` | Жилище: Разбойники | 80×96 | жилище, где живут разбойники (оборванцы с топорами и ножами, повязки на лицах) |
| `dwelling/wolves` | Жилище: Волки | 80×96 | жилище, где живут волки (серые волки) |
| `dwelling/boars` | Жилище: Вепри | 80×96 | жилище, где живут вепри (клыкастые вепри) |
| `dwelling/mercenaries` | Жилище: Наёмники | 80×96 | жилище, где живут наёмники (наёмные копейщики в разномастных доспехах) |
| `dwelling/bears` | Жилище: Медведи | 80×96 | жилище, где живут медведи (бурые медведи) |
| `dwelling/mountaineagles` | Жилище: Горные орлы | 80×96 | жилище, где живут горные орлы (крупные горные орлы) |
| `dwelling/scorpions` | Жилище: Солончаковые скорпионы | 80×96 | жилище, где живут солончаковые скорпионы (белёсые скорпионы с солью на панцире) |
| `dwelling/pirates` | Жилище: Пираты | 80×96 | жилище, где живут пираты (пираты Чаши с абордажными саблями) |
| `dwelling/bountyhunters` | Жилище: Охотники за головами | 80×96 | жилище, где живут охотники за головами (арбалеты, плащи, мешки для трофеев) |
| `dwelling/hermits` | Жилище: Отшельники | 80×96 | жилище, где живут отшельники (лохматые колдуны с посохами) |
| `dwelling/whitespirit` | Жилище: Белый дух | 80×96 | жилище, где живут белый дух (сияющий белый дух-облако) |
| `dwelling/redspirit` | Жилище: Алый дух | 80×96 | жилище, где живут алый дух (дух из пламени) |
| `dwelling/azurespirit` | Жилище: Лазурный дух | 80×96 | жилище, где живут лазурный дух (дух из воды и льда) |
| `dwelling/greenspirit` | Жилище: Зелёный дух | 80×96 | жилище, где живут зелёный дух (дух из листьев и стеблей) |
| `dwelling/silverspirit` | Жилище: Серебряный дух | 112×96 | жилище, где живут серебряный дух (мерцающий серебряный дух) |
| `dwelling/goldspirit` | Жилище: Золотой дух | 112×96 | жилище, где живут золотой дух (дух из золотого света с кольцами) |
| `dwelling/blackspirit` | Жилище: Чёрный дух | 112×96 | жилище, где живут чёрный дух (чёрный дым с белыми глазами) |
| `dwelling/seaserpent` | Жилище: Морской змей | 112×96 | жилище, где живут морской змей (длинный змей с плавниками) |
| `dwelling/bridgetroll` | Жилище: Мостовые тролли | 112×96 | жилище, где живут мостовые тролли (мшистые тролли с дубинами) |
| `dwelling/stonegiant` | Жилище: Каменные великаны | 112×96 | жилище, где живут каменные великаны (великаны из валунов) |
| `dwelling/moondream` | Жилище: Сны Восьмой луны | 112×96 | жилище, где живут сны восьмой луны (безликие фигуры из лунного света и тумана) |
| `dwelling/ancientlizard` | Жилище: Древний ящер | 112×96 | жилище, где живут древний ящер (старый крылатый ящер, пламя по линии) |
| `dwelling/forestgiant` | Жилище: Лесной великан | 112×96 | жилище, где живут лесной великан (великан из стволов и мха, в волосах птичьи гнёзда, призван заклинанием) |

## Местность

| id | Что | Плитка | Набор |
| --- | --- | --- | --- |
| `terrain/meadow` | Луг | 32×32 | 3 целых плитки и 16 краёв по углам |
| `terrain/steppe` | Степь | 32×32 | 3 целых плитки и 16 краёв по углам |
| `terrain/palegrass` | Бледный луг | 32×32 | 3 целых плитки и 16 краёв по углам |
| `terrain/forest` | Лес | 32×32 | 3 целых плитки и 16 краёв по углам |
| `terrain/swamp` | Болото | 32×32 | 3 целых плитки и 16 краёв по углам |
| `terrain/sand` | Песок | 32×32 | 3 целых плитки и 16 краёв по углам |
| `terrain/saltflat` | Солончак | 32×32 | 3 целых плитки и 16 краёв по углам |
| `terrain/highland` | Нагорье и снег | 32×32 | 3 целых плитки и 16 краёв по углам |
| `terrain/ash` | Пепел | 32×32 | 3 целых плитки и 16 краёв по углам |
| `terrain/lava` | Лава | 32×32 | 3 целых плитки и 16 краёв, по 8 кадров анимации |
| `terrain/water` | Вода | 32×32 | 3 целых плитки и 16 краёв, по 8 кадров анимации |
| `terrain/cave` | Пещерный пол | 32×32 | 3 целых плитки и 16 краёв по углам |
| `terrain/fungal` | Грибной мох | 32×32 | 3 целых плитки и 16 краёв по углам |
| `terrain/rock` | Скалы | 32×32 | 3 целых плитки и 16 краёв по углам |

## Дороги и реки

| id | Что | Плитка | Набор |
| --- | --- | --- | --- |
| `road/dirt` | Грунтовая дорога | 32×32 | 16 форм |
| `road/paved` | Мощёная дорога | 32×32 | 16 форм |
| `road/moon` | Лунная дорога | 32×32 | 16 форм |
| `road/river` | Река | 32×32 | 16 форм |
| `road/muddy` | Мутная река | 32×32 | 16 форм |

## Особые поля

| id | Что | Плитка | Набор |
| --- | --- | --- | --- |
| `overlay/moonglade` | Лунная поляна | 32×32 | 4 варианта |
| `overlay/moonless` | Пустошь без луны | 32×32 | 4 варианта |
| `overlay/holyground` | Святая земля | 32×32 | 4 варианта |
| `overlay/foglow` | Туманная низина | 32×32 | 4 варианта |
| `overlay/saltcrust` | Солёная корка | 32×32 | 4 варианта |

## Декор

| id | Что | Размер |
| --- | --- | --- |
| `decor/meadow-tree1` | Луг: дерево | 64×64 |
| `decor/meadow-tree2` | Луг: дерево | 64×64 |
| `decor/meadow-tree3` | Луг: дерево | 64×64 |
| `decor/meadow-rock1` | Луг: камень | 64×64 |
| `decor/meadow-rock2` | Луг: камень | 64×64 |
| `decor/meadow-mountain` | Луг: гора | 160×128 |
| `decor/steppe-tree1` | Степь: дерево | 64×64 |
| `decor/steppe-tree2` | Степь: дерево | 64×64 |
| `decor/steppe-tree3` | Степь: дерево | 64×64 |
| `decor/steppe-rock1` | Степь: камень | 64×64 |
| `decor/steppe-rock2` | Степь: камень | 64×64 |
| `decor/steppe-mountain` | Степь: гора | 160×128 |
| `decor/palegrass-tree1` | Бледный луг: дерево | 64×64 |
| `decor/palegrass-tree2` | Бледный луг: дерево | 64×64 |
| `decor/palegrass-tree3` | Бледный луг: дерево | 64×64 |
| `decor/palegrass-rock1` | Бледный луг: камень | 64×64 |
| `decor/palegrass-rock2` | Бледный луг: камень | 64×64 |
| `decor/palegrass-mountain` | Бледный луг: гора | 160×128 |
| `decor/forest-tree1` | Лес: дерево | 64×64 |
| `decor/forest-tree2` | Лес: дерево | 64×64 |
| `decor/forest-tree3` | Лес: дерево | 64×64 |
| `decor/forest-rock1` | Лес: камень | 64×64 |
| `decor/forest-rock2` | Лес: камень | 64×64 |
| `decor/forest-mountain` | Лес: гора | 160×128 |
| `decor/swamp-tree1` | Болото: дерево | 64×64 |
| `decor/swamp-tree2` | Болото: дерево | 64×64 |
| `decor/swamp-tree3` | Болото: дерево | 64×64 |
| `decor/swamp-rock1` | Болото: камень | 64×64 |
| `decor/swamp-rock2` | Болото: камень | 64×64 |
| `decor/swamp-mountain` | Болото: гора | 160×128 |
| `decor/sand-tree1` | Песок: дерево | 64×64 |
| `decor/sand-tree2` | Песок: дерево | 64×64 |
| `decor/sand-tree3` | Песок: дерево | 64×64 |
| `decor/sand-rock1` | Песок: камень | 64×64 |
| `decor/sand-rock2` | Песок: камень | 64×64 |
| `decor/sand-mountain` | Песок: гора | 160×128 |
| `decor/saltflat-tree1` | Солончак: дерево | 64×64 |
| `decor/saltflat-tree2` | Солончак: дерево | 64×64 |
| `decor/saltflat-tree3` | Солончак: дерево | 64×64 |
| `decor/saltflat-rock1` | Солончак: камень | 64×64 |
| `decor/saltflat-rock2` | Солончак: камень | 64×64 |
| `decor/saltflat-mountain` | Солончак: гора | 160×128 |
| `decor/highland-tree1` | Нагорье и снег: дерево | 64×64 |
| `decor/highland-tree2` | Нагорье и снег: дерево | 64×64 |
| `decor/highland-tree3` | Нагорье и снег: дерево | 64×64 |
| `decor/highland-rock1` | Нагорье и снег: камень | 64×64 |
| `decor/highland-rock2` | Нагорье и снег: камень | 64×64 |
| `decor/highland-mountain` | Нагорье и снег: гора | 160×128 |
| `decor/ash-tree1` | Пепел: дерево | 64×64 |
| `decor/ash-tree2` | Пепел: дерево | 64×64 |
| `decor/ash-tree3` | Пепел: дерево | 64×64 |
| `decor/ash-rock1` | Пепел: камень | 64×64 |
| `decor/ash-rock2` | Пепел: камень | 64×64 |
| `decor/ash-mountain` | Пепел: гора | 160×128 |
| `decor/cave-tree1` | Пещерный пол: дерево | 64×64 |
| `decor/cave-tree2` | Пещерный пол: дерево | 64×64 |
| `decor/cave-tree3` | Пещерный пол: дерево | 64×64 |
| `decor/cave-rock1` | Пещерный пол: камень | 64×64 |
| `decor/cave-rock2` | Пещерный пол: камень | 64×64 |
| `decor/cave-mountain` | Пещерный пол: гора | 160×128 |
| `decor/fungal-tree1` | Грибной мох: дерево | 64×64 |
| `decor/fungal-tree2` | Грибной мох: дерево | 64×64 |
| `decor/fungal-tree3` | Грибной мох: дерево | 64×64 |
| `decor/fungal-rock1` | Грибной мох: камень | 64×64 |
| `decor/fungal-rock2` | Грибной мох: камень | 64×64 |
| `decor/fungal-mountain` | Грибной мох: гора | 160×128 |
| `decor/rock-tree1` | Скалы: дерево | 64×64 |
| `decor/rock-tree2` | Скалы: дерево | 64×64 |
| `decor/rock-tree3` | Скалы: дерево | 64×64 |
| `decor/rock-rock1` | Скалы: камень | 64×64 |
| `decor/rock-rock2` | Скалы: камень | 64×64 |
| `decor/rock-mountain` | Скалы: гора | 160×128 |

## Поля боя

| id | Что | Размер | Кадры |
| --- | --- | --- | --- |
| `field/meadow` | Поле: Луг | 800×496 | 6 препятствий 48–96 пикселей |
| `field/steppe` | Поле: Степь | 800×496 | 6 препятствий 48–96 пикселей |
| `field/palegrass` | Поле: Бледный луг | 800×496 | 6 препятствий 48–96 пикселей |
| `field/forest` | Поле: Лес | 800×496 | 6 препятствий 48–96 пикселей |
| `field/swamp` | Поле: Болото | 800×496 | 6 препятствий 48–96 пикселей |
| `field/sand` | Поле: Песок | 800×496 | 6 препятствий 48–96 пикселей |
| `field/saltflat` | Поле: Солончак | 800×496 | 6 препятствий 48–96 пикселей |
| `field/highland` | Поле: Нагорье и снег | 800×496 | 6 препятствий 48–96 пикселей |
| `field/ash` | Поле: Пепел | 800×496 | 6 препятствий 48–96 пикселей |
| `field/cave` | Поле: Пещерный пол | 800×496 | 6 препятствий 48–96 пикселей |
| `field/fungal` | Поле: Грибной мох | 800×496 | 6 препятствий 48–96 пикселей |
| `field/deck` | Поле: палубы двух кораблей | 800×496 |  |
| `siege/league` | Осада: Лига | 800×496 | стены целые, в трещинах, разбитые |
| `siege/barrows` | Осада: Курганы | 800×496 | стены целые, в трещинах, разбитые |
| `siege/thicket` | Осада: Чаща | 800×496 | стены целые, в трещинах, разбитые |
| `siege/tide` | Осада: Прилив | 800×496 | стены целые, в трещинах, разбитые |
| `siege/forge` | Осада: Горнила | 800×496 | стены целые, в трещинах, разбитые |
| `siege/throne` | Осада: Престол | 800×496 | стены целые, в трещинах, разбитые |
| `siege/stars` | Осада: Звездочёты (доп.) | 800×496 | стены целые, в трещинах, разбитые |
| `siege/spore` | Осада: Грибница (доп.) | 800×496 | стены целые, в трещинах, разбитые |

## Значки заклинаний

| id | Имя | Школа | Круг | Размер |
| --- | --- | --- | --- | --- |
| `spell/balm` | Лунный бальзам | Ясна | 1 | 48×48 |
| `spell/clearshield` | Ясный щит | Ясна | 1 | 48×48 |
| `spell/blessing` | Благословение | Ясна | 2 | 48×48 |
| `spell/cleanse` | Очищение | Ясна | 2 | 48×48 |
| `spell/dawn` | Свет зари | Ясна | 3 | 48×48 |
| `spell/mirrorarmor` | Отражающий доспех | Ясна | 3 | 48×48 |
| `spell/skyveil` | Небесный покров | Ясна | 4 | 48×48 |
| `spell/banish` | Изгнание | Ясна | 4 | 48×48 |
| `spell/resurrect` | Воскрешение | Ясна | 5 | 48×48 |
| `spell/whitefull` | Белое полнолуние | Ясна | 5 | 48×48 |
| `spell/spark` | Искра | Жарь | 1 | 48×48 |
| `spell/rage` | Ярость | Жарь | 1 | 48×48 |
| `spell/firearrow` | Огненная стрела | Жарь | 2 | 48×48 |
| `spell/hotwind` | Жаркий ветер | Жарь | 2 | 48×48 |
| `spell/fireball` | Огненный шар | Жарь | 3 | 48×48 |
| `spell/firewall` | Стена огня | Жарь | 3 | 48×48 |
| `spell/meteor` | Метеор | Жарь | 4 | 48×48 |
| `spell/firemadness` | Огненное безумие | Жарь | 4 | 48×48 |
| `spell/starfall` | Падение звезды | Жарь | 5 | 48×48 |
| `spell/firerain` | Огненный дождь | Жарь | 5 | 48×48 |
| `spell/chill` | Холод | Глубь | 1 | 48×48 |
| `spell/splash` | Брызги | Глубь | 1 | 48×48 |
| `spell/icearrow` | Ледяная стрела | Глубь | 2 | 48×48 |
| `spell/sleep` | Сон | Глубь | 2 | 48×48 |
| `spell/icering` | Ледяное кольцо | Глубь | 3 | 48×48 |
| `spell/current` | Течение | Глубь | 3 | 48×48 |
| `spell/numb` | Оцепенение | Глубь | 4 | 48×48 |
| `spell/deepfog` | Туман глубин | Глубь | 4 | 48×48 |
| `spell/icetomb` | Ледяная гробница | Глубь | 5 | 48×48 |
| `spell/flood` | Потоп | Глубь | 5 | 48×48 |
| `spell/thorns` | Колючки | Ростань | 1 | 48×48 |
| `spell/poisonspit` | Ядовитый плевок | Ростань | 1 | 48×48 |
| `spell/roots` | Корни | Ростань | 2 | 48×48 |
| `spell/stoneskin` | Каменная кожа | Ростань | 2 | 48×48 |
| `spell/packcall` | Зов стаи | Ростань | 3 | 48×48 |
| `spell/stonewall` | Каменная стена | Ростань | 3 | 48×48 |
| `spell/growth` | Рост | Ростань | 4 | 48×48 |
| `spell/poisoncloud` | Ядовитое облако | Ростань | 4 | 48×48 |
| `spell/giantcall` | Зов лесного великана | Ростань | 5 | 48×48 |
| `spell/lifebloom` | Цветение жизни | Ростань | 5 | 48×48 |
| `spell/shadow` | Тень | Морок | 1 | 48×48 |
| `spell/scare` | Испуг | Морок | 1 | 48×48 |
| `spell/blind` | Ослепление | Морок | 2 | 48×48 |
| `spell/phantom` | Морок-двойник | Морок | 2 | 48×48 |
| `spell/invis` | Невидимость | Морок | 3 | 48×48 |
| `spell/fear` | Страх | Морок | 3 | 48×48 |
| `spell/swap` | Подмена | Морок | 4 | 48×48 |
| `spell/terror` | Ужас | Морок | 4 | 48×48 |
| `spell/nightmare` | Кошмар | Морок | 5 | 48×48 |
| `spell/eclipse` | Затмение | Морок | 5 | 48×48 |
| `spell/hex` | Порча | Тлень | 1 | 48×48 |
| `spell/decay` | Тлен | Тлень | 1 | 48×48 |
| `spell/weakness` | Слабость | Тлень | 2 | 48×48 |
| `spell/rot` | Гниль | Тлень | 2 | 48×48 |
| `spell/drain` | Высасывание | Тлень | 3 | 48×48 |
| `spell/kurgancurse` | Проклятие кургана | Тлень | 3 | 48×48 |
| `spell/plague` | Мор | Тлень | 4 | 48×48 |
| `spell/blackmark` | Чёрная метка | Тлень | 4 | 48×48 |
| `spell/deathchill` | Смертный холод | Тлень | 5 | 48×48 |
| `spell/harvest` | Жатва | Тлень | 5 | 48×48 |
| `spell/haste` | Ускорение | Мера | 1 | 48×48 |
| `spell/glitch` | Сбой | Мера | 1 | 48×48 |
| `spell/measureshield` | Щит меры | Мера | 2 | 48×48 |
| `spell/truestrike` | Точный удар | Мера | 2 | 48×48 |
| `spell/dispel` | Развеять | Мера | 3 | 48×48 |
| `spell/repeat` | Повтор | Мера | 3 | 48×48 |
| `spell/masshaste` | Общее ускорение | Мера | 4 | 48×48 |
| `spell/rewind` | Поворот часов | Мера | 4 | 48×48 |
| `spell/timestop` | Остановка времени | Мера | 5 | 48×48 |
| `spell/order` | Мир порядка | Мера | 5 | 48×48 |
| `spell/highview` | Вид с высоты | Дорожные |  | 48×48 |
| `spell/moontrack` | Лунный след | Дорожные |  | 48×48 |
| `spell/tailwind` | Попутный ветер | Дорожные |  | 48×48 |
| `spell/callboat` | Призвать лодку | Дорожные |  | 48×48 |
| `spell/waterwalk` | Хождение по воде | Дорожные |  | 48×48 |
| `spell/return` | Возвращение | Дорожные |  | 48×48 |
| `spell/moongate` | Лунные врата | Дорожные |  | 48×48 |
| `spell/flight` | Полёт | Дорожные |  | 48×48 |

## Эффекты

| id | Что | Кадр | Кадры |
| --- | --- | --- | --- |
| `effect/burst` | Огненная вспышка | 96×96 | 8–12 кадров |
| `effect/ice` | Лёд | 96×96 | 8–12 кадров |
| `effect/heal` | Лечение светом | 96×96 | 8–12 кадров |
| `effect/shadow` | Тень | 96×96 | 8–12 кадров |
| `effect/roots` | Корни | 96×96 | 8–12 кадров |
| `effect/poison` | Ядовитое облако | 96×96 | 8–12 кадров |
| `effect/time` | Рябь времени | 96×96 | 8–12 кадров |
| `effect/death` | Смертный туман | 96×96 | 8–12 кадров |
| `effect/meteor` | Метеор | 96×96 | 8–12 кадров |
| `effect/beam` | Лунный луч | 96×96 | 8–12 кадров |
| `effect/bell` | Звон | 96×96 | 8–12 кадров |
| `effect/spores` | Споры | 96×96 | 8–12 кадров |
| `effect/heat` | Жар | 96×96 | 8–12 кадров |
| `effect/mirror` | Отражение | 96×96 | 8–12 кадров |
| `effect/wave` | Волна | 96×96 | 8–12 кадров |
| `effect/lightning` | Разряд | 96×96 | 8–12 кадров |
| `effect/morale` | Порыв | 96×96 | 8–12 кадров |
| `effect/panic` | Смятение | 96×96 | 8–12 кадров |
| `effect/luck` | Удача | 96×96 | 8–12 кадров |
| `effect/summon` | Призыв | 96×96 | 8–12 кадров |

## Снаряды

| id | Что | Кадр | Кадры |
| --- | --- | --- | --- |
| `proj/arrow` | Стрела | 32×16 | 1–4 кадра |
| `proj/bolt` | Болт | 32×16 | 1–4 кадра |
| `proj/harpoon` | Гарпун | 32×16 | 1–4 кадра |
| `proj/coal` | Уголь | 32×16 | 1–4 кадра |
| `proj/lava` | Лавовый ком | 32×16 | 1–4 кадра |
| `proj/shot` | Ядро | 32×16 | 1–4 кадра |
| `proj/mud` | Тина | 32×16 | 1–4 кадра |
| `proj/spark` | Искра | 32×16 | 1–4 кадра |
| `proj/light` | Луч света | 32×16 | 1–4 кадра |
| `proj/acid` | Кислота | 32×16 | 1–4 кадра |
| `proj/javelin` | Дротик | 32×16 | 1–4 кадра |
| `proj/stone` | Глыба | 32×16 | 1–4 кадра |

## Значки навыков, приёмов и даров

| id | Имя | Размер | Заметка |
| --- | --- | --- | --- |
| `skill/tactics` | Тактика | 32×32 | значок, ступень рисует игра |
| `skill/offense` | Нападение | 32×32 | значок, ступень рисует игра |
| `skill/defense` | Оборона | 32×32 | значок, ступень рисует игра |
| `skill/archery` | Стрельба | 32×32 | значок, ступень рисует игра |
| `skill/leadership` | Лидерство | 32×32 | значок, ступень рисует игра |
| `skill/luck` | Удача | 32×32 | значок, ступень рисует игра |
| `skill/march` | Поход | 32×32 | значок, ступень рисует игра |
| `skill/scouting` | Разведка | 32×32 | значок, ступень рисует игра |
| `skill/treasury` | Казна | 32×32 | значок, ступень рисует игра |
| `skill/learning` | Учёность | 32×32 | значок, ступень рисует игра |
| `skill/sorcery` | Чародейство | 32×32 | значок, ступень рисует игра |
| `skill/machines` | Машины | 32×32 | значок, ступень рисует игра |
| `skill/yasna` | Ясна | 32×32 | значок, ступень рисует игра |
| `skill/zhar` | Жарь | 32×32 | значок, ступень рисует игра |
| `skill/glub` | Глубь | 32×32 | значок, ступень рисует игра |
| `skill/rostan` | Ростань | 32×32 | значок, ступень рисует игра |
| `skill/morok` | Морок | 32×32 | значок, ступень рисует игра |
| `skill/tlen` | Тлень | 32×32 | значок, ступень рисует игра |
| `skill/mera` | Мера | 32×32 | значок, ступень рисует игра |
| `perk/ambush` | Засада | 32×32 |  |
| `perk/recon` | Разведка боем | 32×32 |  |
| `perk/finish` | Добить | 32×32 |  |
| `perk/firstcharge` | Первый натиск | 32×32 |  |
| `perk/stand` | Глухая оборона | 32×32 |  |
| `perk/answer` | Ответ | 32×32 |  |
| `perk/aim` | Меткость | 32×32 |  |
| `perk/quiver` | Запас | 32×32 |  |
| `perk/warcry` | Клич | 32×32 |  |
| `perk/banner` | Знамя | 32×32 |  |
| `perk/fortune` | Везение | 32×32 |  |
| `perk/treasure` | Кладоискатель | 32×32 |  |
| `perk/trails` | Тропы | 32×32 |  |
| `perk/earlystart` | Ранний выход | 32×32 |  |
| `perk/spy` | Соглядатай | 32×32 |  |
| `perk/parley` | Переговоры | 32×32 |  |
| `perk/collector` | Сборщик | 32×32 |  |
| `perk/trader` | Торговец | 32×32 |  |
| `perk/bookworm` | Книжник | 32×32 |  |
| `perk/memory` | Память | 32×32 |  |
| `perk/echo` | Отголосок | 32×32 |  |
| `perk/quickword` | Быстрое слово | 32×32 |  |
| `perk/doubleshot` | Двойной выстрел | 32×32 |  |
| `perk/fieldmedic` | Полевой лекарь | 32×32 |  |
| `perk/radiance` | Сияние | 32×32 |  |
| `perk/lightdark` | Свет сквозь тьму | 32×32 |  |
| `perk/blaze` | Пожар | 32×32 |  |
| `perk/fireire` | Ярость огня | 32×32 |  |
| `perk/ice` | Лёд | 32×32 |  |
| `perk/coldwater` | Холодная вода | 32×32 |  |
| `perk/fertility` | Плодородие | 32×32 |  |
| `perk/roots` | Корни | 32×32 |  |
| `perk/double` | Двойник | 32×32 |  |
| `perk/shade` | Тень | 32×32 |  |
| `perk/blight` | Порча | 32×32 |  |
| `perk/reap` | Жатва | 32×32 |  |
| `perk/precision` | Точность | 32×32 |  |
| `perk/measureshield` | Щит меры | 32×32 |  |
| `talent/league-1` | Вербовщик | 32×32 |  |
| `talent/league-2` | Пошлина | 32×32 |  |
| `talent/league-3` | Сомкнуть ряды | 32×32 |  |
| `talent/league-4` | Стена щитов | 32×32 |  |
| `talent/league-5` | Порох | 32×32 |  |
| `talent/league-6` | Ополчение | 32×32 |  |
| `talent/league-7` | Великий набат | 32×32 | высший дар |
| `talent/barrows-1` | Тризна | 32×32 |  |
| `talent/barrows-2` | Ветер степи | 32×32 |  |
| `talent/barrows-3` | Неутешные | 32×32 |  |
| `talent/barrows-4` | Соль на ранах | 32×32 |  |
| `talent/barrows-5` | Курганная рать | 32×32 |  |
| `talent/barrows-6` | Последний удар | 32×32 |  |
| `talent/barrows-7` | Великий курган | 32×32 | высший дар |
| `talent/thicket-1` | Шёпот листвы | 32×32 |  |
| `talent/thicket-2` | Тропа зверя | 32×32 |  |
| `talent/thicket-3` | Колючие заросли | 32×32 |  |
| `talent/thicket-4` | Корни держат | 32×32 |  |
| `talent/thicket-5` | Короткий путь | 32×32 |  |
| `talent/thicket-6` | Лесная кровь | 32×32 |  |
| `talent/thicket-7` | Пробуждение леса | 32×32 | высший дар |
| `talent/tide-1` | Течение | 32×32 |  |
| `talent/tide-2` | Солёная кровь | 32×32 |  |
| `talent/tide-3` | Высокая вода | 32×32 |  |
| `talent/tide-4` | Тихая вода | 32×32 |  |
| `talent/tide-5` | Затопить | 32×32 |  |
| `talent/tide-6` | Морская торговля | 32×32 |  |
| `talent/tide-7` | Девятый вал | 32×32 | высший дар |
| `talent/forge-1` | Раскалённые клинки | 32×32 |  |
| `talent/forge-2` | Огнеупорность | 32×32 |  |
| `talent/forge-3` | Выдержка | 32×32 |  |
| `talent/forge-4` | Шлак | 32×32 |  |
| `talent/forge-5` | Рука мастера | 32×32 |  |
| `talent/forge-6` | Серный дым | 32×32 |  |
| `talent/forge-7` | Извержение | 32×32 | высший дар |
| `talent/throne-1` | Двойное отражение | 32×32 |  |
| `talent/throne-2` | Наследник руин | 32×32 |  |
| `talent/throne-3` | Холодный свет | 32×32 |  |
| `talent/throne-4` | Зеркальный щит | 32×32 |  |
| `talent/throne-5` | Лунная гвардия | 32×32 |  |
| `talent/throne-6` | Белая гвардия | 32×32 |  |
| `talent/throne-7` | Возвращение царей | 32×32 | высший дар |
| `talent/stars-1` | Таблицы (доп.) | 32×32 |  |
| `talent/stars-2` | Лунная оптика (доп.) | 32×32 |  |
| `talent/stars-3` | Тугая пружина (доп.) | 32×32 |  |
| `talent/stars-4` | Звездопад (доп.) | 32×32 |  |
| `talent/stars-5` | Двойной сдвиг (доп.) | 32×32 |  |
| `talent/stars-6` | Холодный ум (доп.) | 32×32 |  |
| `talent/stars-7` | Схождение (доп.) | 32×32 | высший дар |
| `talent/spore-1` | Длинные нити (доп.) | 32×32 |  |
| `talent/spore-2` | Густые споры (доп.) | 32×32 |  |
| `talent/spore-3` | Плесень (доп.) | 32×32 |  |
| `talent/spore-4` | Подземные ходы (доп.) | 32×32 |  |
| `talent/spore-5` | Колония (доп.) | 32×32 |  |
| `talent/spore-6` | Гниль (доп.) | 32×32 |  |
| `talent/spore-7` | Цветение (доп.) | 32×32 | высший дар |

## Ресурсы

| id | Что | Размер | Заметка |
| --- | --- | --- | --- |
| `resource/gold` | Золото | 32×32 | и копия 16×16 |
| `resource/wood` | Древесина | 32×32 | и копия 16×16 |
| `resource/ore` | Руда | 32×32 | и копия 16×16 |
| `resource/salt` | Соль | 32×32 | и копия 16×16 |
| `resource/amber` | Янтарь | 32×32 | и копия 16×16 |
| `resource/sulfur` | Сера | 32×32 | и копия 16×16 |
| `resource/moonsilver` | Лунное серебро | 32×32 | и копия 16×16 |

## Картины и значки лун

| id | Что | Размер | Как выглядит |
| --- | --- | --- | --- |
| `picture/title` | Титул | 800×600 | Чаша ночью, семь лун дугой, восьмой свет над водой |
| `picture/campaignmap` | Карта кампаний | 800×600 | материк Венец кольцом вокруг Чаши, края народов как часы на циферблате |
| `picture/victory` | Победа | 800×600 | знамя над взятым городом на рассвете |
| `picture/defeat` | Поражение | 800×600 | брошенный шлем в траве под тучами |
| `picture/campaign1` | Заставка кампании: Лига | 800×600 |  |
| `picture/campaign2` | Заставка кампании: Курганы | 800×600 |  |
| `picture/campaign3` | Заставка кампании: Чаща | 800×600 |  |
| `picture/campaign4` | Заставка кампании: Прилив | 800×600 |  |
| `picture/campaign5` | Заставка кампании: Горнила | 800×600 |  |
| `picture/campaign6` | Заставка кампании: Престол | 800×600 |  |
| `picture/campaign7` | Заставка кампании: Звездочёты (доп.) | 800×600 |  |
| `picture/campaign8` | Заставка кампании: Грибница (доп.) | 800×600 |  |
| `picture/epilogue-league` | Эпилог: Лига | 800×600 | первое утро тысячного года в краю народа |
| `picture/epilogue-barrows` | Эпилог: Курганы | 800×600 | первое утро тысячного года в краю народа |
| `picture/epilogue-thicket` | Эпилог: Чаща | 800×600 | первое утро тысячного года в краю народа |
| `picture/epilogue-tide` | Эпилог: Прилив | 800×600 | первое утро тысячного года в краю народа |
| `picture/epilogue-forge` | Эпилог: Горнила | 800×600 | первое утро тысячного года в краю народа |
| `picture/epilogue-throne` | Эпилог: Престол | 800×600 | первое утро тысячного года в краю народа |
| `picture/epilogue-stars` | Эпилог: Звездочёты (доп.) | 800×600 | первое утро тысячного года в краю народа |
| `picture/epilogue-spore` | Эпилог: Грибница (доп.) | 800×600 | первое утро тысячного года в краю народа |
| `moon/1` | Белая луна | 24×24 |  |
| `moon/2` | Алая луна | 24×24 |  |
| `moon/3` | Лазурная луна | 24×24 |  |
| `moon/4` | Зелёная луна | 24×24 |  |
| `moon/5` | Серебряная луна | 24×24 |  |
| `moon/6` | Золотая луна | 24×24 |  |
| `moon/7` | Чёрная луна | 24×24 |  |
| `moon/8` | Схождение | 24×24 |  |

