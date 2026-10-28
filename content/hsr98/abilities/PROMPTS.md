# Иконки способностей «Рубежа Экспресса»: промпты

Картинки генерируются в ChatGPT, Gemini или Grok. Готовые файлы складываются в эту папку: `content/hsr98/abilities/<герой>-<слот>.png`.

## Зачем это нужно

В полосе способностей арены «Рубежа Экспресса» (`js/apps/hsr98/hsr-ui-hd-arena.js`, `drawSlot`) каждая способность рисуется функцией `G.hdAbilIcon` из `js/apps/hsr98/hsr-hd-art.js`. Сейчас это обрезанное лицо героя с цветным налётом стихии и значком слота: у всех четырёх слотов одно и то же лицо, различить способности можно только по букве. Нужны настоящие иконки: у каждой способности свой образ.

Всего 21 герой × 4 слота = 84 иконки:

| Слот | Клавиша | Что это | Как называется в коде |
| --- | --- | --- | --- |
| `q` | Q | Навык, активка со стоимостью энергии | `skill` |
| `e` | E | Техника, вторая активка | `tech` |
| `t` | T | Талант, пассивка (не нажимается) | `talent` |
| `r` | R | Абсолютная техника, ульта | `ult` |

Иконка показывается квадратом 40 × 40 px в полосе внизу экрана. Поверх неё код рисует:

| Что | Где |
| --- | --- |
| Чёрная рамка вокруг квадрата | по краю |
| Значок слота и стихии | правый верхний угол, примерно 18 × 18 px |
| Буква клавиши | левый нижний угол, 12 × 12 px |
| Стоимость энергии | правый нижний угол |
| Затемнение перезарядки, цифра секунд, `×N` зарядов | на всей иконке |

Поэтому в промптах правый верхний и левый нижний углы оставлены спокойными, а рамки, букв и цифр на картинке быть не должно. Если новые иконки читаются сами, значок слота в правом верхнем углу можно убрать из кода.

## Как делать

1. Открой чат с генерацией картинок. Приложи арт героя как референс (Full Artwork или портрет, одного изображения хватает). Вставь по порядку: общий стиль, блок слота (Q, E, T или R), промпт способности целиком, включая строки `Hero:` и `Icon:`.
2. Сначала сгенерируй `q` героя и приложи его как дополнительный референс к остальным трём слотам, чтобы палитра героя не гуляла.
3. Сгенерируй 3–4 варианта и выбери тот, что читается лучше всего. Проверка: уменьши до 40 × 40 и до 20 × 20 (nearest neighbour). Главный предмет и цвет стихии должны узнаваться. Если узнаётся только крупно, вариант не годится.
4. Сохрани как `content/hsr98/abilities/<герой>-<слот>.png`, 512 × 512, например `himeko-r.png`. Ключ героя равен ключу в `HD.HEROES` (`trail`, `himeko`, `seele`, `blade`, `clara`, `danheng`, `topaz`, `herta`, `jingyuan`, `bronya`, `asta`, `ruanmei`, `kafka`, `silverwolf`, `welt`, `march`, `gepard`, `fuxuan`, `natasha`, `bailu`, `luocha`), слот это `q`, `e`, `t` или `r`.
5. Запусти `python tools/hsr-ability-pix.py` (все иконки) или `python tools/hsr-ability-pix.py himeko asta-t` (герой целиком или один слот). Скрипт уменьшает картинку до 64 × 64 с палитрой в 64 цвета, кладёт результат в `content/hsr98/abilities/pix/` и пересобирает `js/apps/hsr98/hsr-ability-pix.js`, который читает `hdAbilIcon`. Ключ `--preview файл.png` сохраняет контрольный лист всех иконок, `--colors 48` уменьшает палитру. Слот без картинки показывает лицо героя, как раньше.

## Общий стиль (вставлять в начало каждого промпта)

> Authentic 16-bit era pixel art ability icon for the skill bar of a strategy-RPG hero, as drawn for a 1998 PC game. Square 1:1 canvas of 512 × 512 pixels built on a strict 32 × 32 logical pixel grid: every logical pixel is one flat solid block of exactly 16 × 16 real pixels, perfectly aligned to the grid, no half pixels. The picture fills the whole square edge to edge: no transparent or magenta background, no frame, no border, no rounded plate, no button, no UI, no text, no letters, no numbers, no logo, no watermark (the game draws its own border, key letter, cooldown and cost on top). One bold, instantly readable subject with a big simple silhouette, built from a few large shapes, so that it stays recognisable when shrunk to 40 × 40 and even 20 × 20; leave out tiny details. Light from the top-left, hard-edged cel shading with 2 to 3 tones per colour, bright 1-logical-pixel highlights on the top-left edges, a continuous 1-logical-pixel near-black navy outline (#0a0c1c) around the main subject, only sparse checkerboard dithering. The background is dark and saturated (deep navy, purple or near-black tinted by the element colour) with a clear bright focal point, so the subject pops with strong contrast. Maximum 20 colours in total. Strictly no anti-aliasing, no smooth gradients, no blur, no glow halos, no soft shadows, no smooth vector lines, no 3D render, no photo look, no modern flat design. The element colour carries the whole icon: physical = steel grey and white; fire = orange #ff6a30 with yellow and dark red; ice = pale cyan #8adfff with white and deep blue; lightning = violet #c07aff with white and dark purple; wind = mint green #5fe0a8 with white and dark teal; quantum = indigo #8a7aff with pink-violet and black; imaginary = golden yellow #ffd850 with cream and brown; healing = soft green #86e39a with white. Keep the top-right corner and the bottom-left corner of the picture calm and dark: no important detail there, the game puts a badge and a key letter on them. The prompt below names the exact hero and the exact ability. Draw only that ability: do not copy any official skill icon, key art or logo, do not substitute another hero's ability, and do not draw the hero's face unless the prompt says so. Use the attached artwork only as a reference for the hero's outfit and colours; draw a new, simplified, iconic composition.

Если модель не слушается:

- Картинка гладкая, с градиентами или свечением: добавь «Think of it as a 32 × 32 sprite scaled up 16 times with nearest neighbour, like a 1998 icon.»
- Нарисована рамка, плашка или кнопка: добавь «No frame, no border, no plate: the picture itself is the square.»
- Появился текст, цифры или клавиша: добавь «Remove all text, letters and numbers.»
- Слишком много мелочей: добавь «Fewer details, bigger shapes, at most 3 main shapes.»
- Вместо способности нарисован портрет героя: добавь «No portrait, no face. Draw only the effect and props described in the Icon line.»
- Не хватает деталей и всё слишком грубо: добавь «Use a 48 × 48 logical grid with blocks of 10 or 11 real pixels instead.» (потом файл всё равно приводится к 64 × 64)
- Сильно не совпадает цвет стихии: повтори нужную стихию из списка и добавь «The icon must be dominated by <цвет>.»

## Блоки слотов (вставлять после общего стиля, один из четырёх)

### Q: Навык (активка)

> Slot: ACTIVE SKILL (Q). Composition: dynamic and diagonal, a frozen moment of the action at its peak. The effect itself (the strike, the trail of the weapon, the spell, the projectile) is the hero of the picture, large and cutting across the square from the lower-left to the upper-right, with a few small sparks or fragments. Saturated and bright. No face.

### E: Техника (активка)

> Slot: ACTIVE TECHNIQUE (E). Composition: calmer and symmetric. A single emblem object, sign or prop in the exact centre, big and clean, inside a faint circular ring or zone drawn with the element colour, a few small particles around it. Slightly darker and calmer than a skill icon. No face.

### T: Талант (пассивка)

> Slot: PASSIVE TALENT (T). Composition: a single small emblem inside a diamond-shaped (rhombus) dark medallion in the centre of the square, with a 2-logical-pixel steel-grey rim; the area outside the medallion is a dark, muted, simply patterned field in a deep shade of the element colour. The palette is clearly more muted and less saturated than an active icon, so that it reads as something that works by itself, not as a button to press. Only the emblem has a bright accent. No face.

### R: Абсолютная техника (ульта)

> Slot: ULTIMATE (R). Composition: the biggest and most dramatic icon of the set. A huge central effect with a white-gold hot core and a strong radial burst of wide rays, the main subject nearly touching the edges of the square, maximum contrast and saturation. A 2-logical-pixel gold inner edge runs along the whole border of the picture. The small dark silhouette of the hero may appear only if the prompt says so, never the face.

## Принципы образов

Чтобы 84 иконки не слипались, у каждого слота свой язык, а у каждого героя свой предмет и свой цвет.

| Слот | Что показываем | Яркость | Форма |
| --- | --- | --- | --- |
| Q | Сам удар или выстрел в пике | высокая | диагональ |
| E | Предмет, знак или зона | средняя | круг и центр |
| T | Эмблема правила | приглушённая | ромб |
| R | Огромный эффект и лучи | максимум | лучи и золотой край |

Что делает способность, взято из `js/apps/hsr98/hsr-hd-heroes.js` (тексты `KITS.<герой>.text`) и `js/apps/hsr98/hsr-data.js` (названия). Названия талантов и образы (двойная спираль у Жуань Мэй, тыква-горлянка у Байлу, созвездие у Асты, Повелитель молний у Цзин Юаня и другие) сверены с официальными описаниями способностей из открытой выгрузки StarRailRes (`index_new/en` и `index_new/ru`, `character_skills.json`). Вики на Fandom для запросов закрыта (ошибка 403), поэтому внешность героев описана по данным проекта (`look` в `hsr-data.js`) и референсу, который прикладывается к запросу.

Название способности на картинку не пишется: оно показывается во всплывающей подсказке.

## Первопроходец (`trail`, Разрушение, физический)

Приметы: длинные серые волосы, золотые глаза, тёмное пальто с золотой подкладкой, бейсбольная бита.

### `trail-q`: Хоум-ран в упокой (Навык)
Что делает: размах по дуге 120° с отбрасыванием, основная цель получает вдвое больше.
> Hero: the Trailblazer, grey long hair, dark coat with gold lining. Icon: a spiked baseball bat swung in a wide silver crescent arc from the lower-left to the upper-right, a white impact star at the end of the arc, small steel-grey chips and dust flying outwards, a faint pale crescent shockwave behind the bat. Palette: steel grey, white, gold accent on the grip, dark navy background.

### `trail-e`: Бессмертный третий удар (Техника)
Что делает: за 3 с лечит героя и союзные постройки вокруг.
> Hero: the Trailblazer. Icon: a baseball and a wooden bat crossing in the centre, in a soft green healing ring, three small white-green plus signs rising from the ring. A calm sports-emblem look. Palette: steel grey, white, soft green, gold stitching on the ball, dark navy background.

### `trail-t`: Талант: Идеальный отрыв (Пассивка)
Что делает: после пробития стойкости урон атаки растёт на 20% на 10 с, до двух раз.
> Hero: the Trailblazer. Icon: inside the dark diamond medallion a cracked grey shield with a white fracture line through it and two small gold up-arrows above it, one per stack. Palette: steel grey, white, gold, muted dark slate field.

### `trail-r`: Звёздный туз (Ульта)
Что делает: прыжок в точку и удар по кругу.
> Hero: the Trailblazer, as a small black silhouette with a bat raised high in the middle. Icon: the silhouette leaping from above onto a white-gold star-shaped crater, a huge cracked circular shockwave on the ground, long white rays and flying rock slabs, a giant spiked ball (a star) falling behind the silhouette. Palette: white, gold, steel grey, a bit of orange, dark navy.

## Химико (`himeko`, Эрудиция, огонь)

Приметы: длинные красные волосы, янтарные глаза, красно-чёрный костюм, огненная магия.

### `himeko-q`: Расплавленный взрыв (Навык)
Что делает: огненный шар в точку, круг 80 по цели и вокруг.
> Hero: Himeko, long red hair, red and black outfit. Icon: a big molten fireball with a bright yellow core and an orange-red shell flying diagonally to the upper right, a trail of flame behind it, a few lava droplets and a ring of embers at the point of impact. Palette: yellow, orange, dark red, black, deep maroon background.

### `himeko-e`: Неполное сгорание (Техника)
Что делает: область 160 на 6 с, враги получают +20% огненного урона.
> Hero: Himeko. Icon: a burning circle on the ground seen from above, an orange ring with a small flame flickering in the centre and a red down-pointing arrow over it meaning weakened resistance, a few drifting sparks. Palette: orange, yellow, dark red, black, maroon background.

### `himeko-t`: Талант: Победный рывок (Пассивка)
Что делает: пробития копят заряды, на трёх зарядах огненная волна по всем врагам.
> Hero: Himeko. Icon: inside the dark diamond medallion three small flame orbs in a row, the first two lit orange and the third dim, a thin ring of fire around the three. Palette: orange, dark red, grey-brown, muted maroon field.

### `himeko-r`: Небесная вспышка (Ульта)
Что делает: удар с орбиты по кругу 200, энергия за каждое добивание.
> Hero: Himeko, small dark silhouette far below with long flowing hair. Icon: a fiery comet beam striking straight down from the top into a vast white-yellow explosion with a huge orange-red crown of flames, a starry sky strip at the top, wide rays, flying embers. Palette: white, yellow, orange, red, dark purple-black sky.

## Зеле (`seele`, Охота, квант)

Приметы: короткие тёмно-синие волосы, фиолетовые глаза, тёмный костюм, синие бабочки.

### `seele-q`: Ливень лезвий (Навык)
Что делает: рывок к цели и удар, скорость атаки и передвижения +25% на 6 с.
> Hero: Seele, short dark blue hair, black and blue outfit, scythe-like blade. Icon: a long slender indigo blade in a diagonal dash, three parallel violet cut lines streaking past a dark shape, afterimages of the blade in fading shades, a few small quantum-blue butterflies at the edge. Palette: indigo, violet, pale lilac, black, dark navy background.

### `seele-e`: Призрачный шаг (Техника)
Что делает: 3 с невидимости, враги теряют её из целей, первый удар даёт Усиление.
> Hero: Seele. Icon: a pale violet butterfly in the centre dissolving into small square pixels at its wing edges, a faint dotted ring around it, a dark eye-shaped slit crossed out. Palette: indigo, violet, pale lilac, black, dark navy background.

### `seele-t`: Талант: Повторное появление (Пассивка)
Что делает: добивание сбрасывает перезарядку Навыка и даёт Усиление.
> Hero: Seele. Icon: inside the dark diamond medallion a pale violet butterfly rising out of a dissolving dark shape, a short blade under it and a curling violet arrow that returns in a circle (an extra turn). Palette: indigo, violet, muted dark purple field.

### `seele-r`: Бабочка и лезвие (Ульта)
Что делает: рывок до 300 и мощный удар, Усиление на 6 с.
> Hero: Seele, small dark silhouette mid-dash with a long scythe. Icon: a giant violet butterfly with wings spread across the whole square, a single blinding white slash cutting through its centre from corner to corner, a swarm of small blue butterflies bursting out of the cut, wide indigo rays. Palette: white, violet, indigo, pink-violet, black.

## Блэйд (`blade`, Разрушение, ветер)

Приметы: длинные тёмные волосы, красные глаза, чёрное длинное пальто, длинный изогнутый меч, зелёный свет в груди.

### `blade-q`: Адский пейзаж (Навык)
Что делает: тратит часть НР, 9 с усиленного урона, Атака превращается в «Частокол мечей».
> Hero: Blade, long dark hair, long black coat, a long curved sword. Icon: a ring of five long black swords rising from the ground like a palisade, their tips pointing up around a blood-red moon, mint-green wind streaks swirling between the blades, a few red drops. Palette: mint green, dark teal, blood red, black, near-black green background.

### `blade-e`: Ветер кармы (Техника)
Что делает: тратит часть НР, рывок на 180 сквозь врагов.
> Hero: Blade. Icon: a single long green-white slash line cutting horizontally through the whole square, a long dark sword at its end, three small severed black fragments flying off, speed lines of green wind behind. Palette: mint green, white, dark teal, black, near-black background.

### `blade-t`: Талант: Дар Шуху (Пассивка)
Что делает: потеря и трата НР копят заряды, на пяти зарядах удар по всем и лечение.
> Hero: Blade. Icon: inside the dark diamond medallion a cracked dark-red heart pierced by a short black sword, five small dots around it in a ring, the first lit green. Palette: dark red, mint green, grey-black, muted dark teal field.

### `blade-r`: Смертный приговор (Ульта)
Что делает: НР становится 50%, огромный удар по кругу.
> Hero: Blade, small black silhouette in the centre. Icon: a gigantic circular sword shockwave of mint-green and white wind, a ring of countless thin blades radiating outwards, a blood-red cracked sphere in the middle with a dark silhouette in front of it, dark red rays between the green ones. Palette: mint green, white, blood red, black, dark teal.

## Клара (`clara`, Разрушение, физический)

Приметы: короткие белые волосы с красными лентами, красные глаза, белый костюм. Её спутник Сварог: тяжёлый квадратный робот-страж, тёмно-серый с красным.

### `clara-q`: Осторожно, Сварог (Навык)
Что делает: Сварог бьёт всех врагов вокруг, помеченных ещё раз, метки снимаются.
> Hero: Clara and her robot Svarog, a hulking boxy dark grey and red guardian robot. Icon: Svarog's huge red-and-grey mechanical fist crashing down from the top onto the ground, white impact star at its centre, a ring of cracks and flying concrete chunks, a small red target mark at the edge. Palette: steel grey, red, white, dark navy background.

### `clara-e`: Небольшая цена победы (Техника)
Что делает: удар по кругу, враги вокруг бьют только Клару 3 с.
> Hero: Clara. Icon: a red target mark (concentric circles with a cross) in the centre with a small white pistol pointing at it, a ring of three small angry red arrows pointing inwards at the target from the sides. Palette: red, white, steel grey, dark navy background.

### `clara-t`: Талант: Потому что мы семья (Пассивка)
Что делает: меньше урона, ударившему Клару достаётся метка и ответ Сварога.
> Hero: Clara and Svarog. Icon: inside the dark diamond medallion a grey shield with a red robot eye in its centre and a small red bolt shooting back out from the shield to the right. Palette: steel grey, red, white, muted dark slate field.

### `clara-r`: Обещание, а не приказ (Ульта)
Что делает: 6 с сниженного урона, агрессия ×4, две усиленные контратаки Сварога.
> Hero: Clara and Svarog, small silhouette of the girl standing in front of a gigantic Svarog. Icon: the huge robot behind her with two big red eyes glowing, both arms raised and white-hot, a red-and-white protective ring around the girl, wide red rays, flying sparks. Palette: red, white, steel grey, black, dark maroon.

## Дань Хэн (`danheng`, Охота, ветер)

Приметы: чёрные волосы, голубые глаза, тёмная одежда с зелёной подкладкой, длинное копьё.

### `danheng-q`: Пронзающая буря (Навык)
Что делает: выпад копья по линии, замедление.
> Hero: Dan Heng, black hair, dark coat, long spear. Icon: a long spear thrust from the left to the upper right with its steel tip in the centre, a green-white cone of wind spiralling around the shaft, speed lines, a small pale-blue snail-slow mark at the end. Palette: mint green, white, steel grey, dark teal, near-black navy background.

### `danheng-e`: Тихий ветер (Техника)
Что делает: урон атаки +40% и скорость передвижения +20% на 9 с.
> Hero: Dan Heng. Icon: a mint-green spiral of wind with a small feather or leaf in its centre, two white up-pointing chevrons above, a faint ring around. Palette: mint green, white, dark teal, near-black background.

### `danheng-t`: Талант: Превосходство досягаемости (Пассивка)
Что делает: после Навыка или Техники две Атаки игнорируют часть брони.
> Hero: Dan Heng. Icon: inside the dark diamond medallion a spear tip piercing a cracked grey round shield, two small green dots beside it. Palette: mint green, steel grey, white, muted dark teal field.

### `danheng-r`: Эфирный дракон (Ульта)
Что делает: дракон бьёт по линии 320 перед героем, замедленных сильнее.
> Hero: Dan Heng, tiny dark silhouette at the bottom-left holding a spear. Icon: a huge azure-green Eastern dragon with long whiskers and a gaping mouth bursting diagonally across the whole square, a body made of coils of wind, white-green lightning rays around its head. Palette: mint green, white, teal, pale gold eyes, dark navy.

## Топаз и Счетовод (`topaz`, Охота, огонь)

Приметы: светлые серо-серебристые волосы с красной прядью, фиолетовые глаза, красно-чёрная куртка, пистолет. Счетовод: её спутник, упитанная свинка-бухгалтер.

### `topaz-q`: Трудности с оплатой? (Навык)
Что делает: «Справка о задолженности» на цель, Счетовод сразу бьёт.
> Hero: Topaz and Numby, her stout chubby pig companion. Icon: a red-stamped white debt certificate (paper with abstract red stamp mark and no readable text) pinned onto a small target ring, a small red-orange fire burst at its corner, two flying gold coins. Palette: white, red, orange, gold, dark maroon background.

### `topaz-e`: Дотация (Техника)
Что делает: 6 с: удары Счетовода дают энергию и скорость.
> Hero: Topaz. Icon: a big gold coin in the centre with a bold small flame symbol on it (no letters), a stack of three coins under it, small white-gold sparks rising, a faint orange ring. Palette: gold, yellow, orange, dark red, maroon background.

### `topaz-t`: Талант: Рынок свинок?! (Пассивка)
Что делает: Счетовод ходит сам и бьёт должника.
> Hero: Topaz and Numby. Icon: inside the dark diamond medallion the round snout and ears of a small pink-orange pig with two black dots for eyes, a tiny red target ring above it. Palette: pink, orange, red, muted dark brown field.

### `topaz-r`: Из убытка в прибыль! (Ульта)
Что делает: 10 с: удары Счетовода +150%, интервал вдвое короче.
> Hero: Topaz and Numby, small silhouettes. Icon: a giant rising orange-and-gold arrow shaped like a stock chart going steeply up to the upper right, a huge gold coin behind it, a golden pig silhouette leaping on the arrow, a shower of coins and fire rays. Palette: gold, white, orange, red, dark maroon.

## Герта (`herta`, Эрудиция, лёд)

Приметы: длинные светло-коричневые волосы, фиолетовые глаза, фиолетовое платье с бантом, кукла-марионетка.

### `herta-q`: Ну держись! (Навык)
Что делает: кукла бьёт по кругу вокруг Герты, сильнее по здоровым.
> Hero: Herta, long brown hair, purple dress, a small puppet. Icon: a small purple-and-white wooden puppet doll with a big bow, kicking with a raised foot, pale cyan ice shards bursting in a ring around it, a white-blue impact star. Palette: pale cyan, white, violet, deep blue, dark navy background.

### `herta-e`: Кукла на удачу (Техника)
Что делает: урон атаки +40% на 9 с, замедление на Герту не действует.
> Hero: Herta. Icon: a small wooden puppet marionette hand-cross (two crossed sticks) with strings, a small lucky clover-shaped snowflake hanging from it, a faint cyan ring. Palette: pale cyan, white, violet, brown wood, dark navy background.

### `herta-t`: Талант: Дай-ка я попробую (Пассивка)
Что делает: когда враг падает ниже 50% НР, кукла бьёт льдом по кругу.
> Hero: Herta. Icon: inside the dark diamond medallion a half-empty heart-shaped bar with a pale cyan ice crystal cracking down through it, a tiny violet bow at the top. Palette: pale cyan, white, violet, muted dark blue field.

### `herta-r`: Немного волшебства (Ульта)
Что делает: лёд по кругу 260 вокруг Герты.
> Hero: Herta, small silhouette with a big bow at the bottom. Icon: a gigantic six-pointed snowflake of ice spikes erupting outwards in a wide circle, a violet magic circle on the ground with stars around, flying ice shards, a white-blue core. Palette: white, pale cyan, violet, deep blue, dark navy.

## Цзин Юань (`jingyuan`, Эрудиция, молния)

Приметы: длинные светло-серые волосы, золотые глаза, тёмно-золотая генеральская броня, копьё. Повелитель молний: золотой дух-воин с молниями.

### `jingyuan-q`: Раскалывающийся зенит (Навык)
Что делает: удар по кругу 140, Повелитель молний получает ударов в серию.
> Hero: Jing Yuan, light grey hair, gold armour, a lance, and his Lightlord. Icon: a golden ornate spear point descending in the centre, a ring of violet-white lightning bolts splitting outwards from it on the ground, small gold sparks, a purple storm sky corner. Palette: violet, white, gold, dark purple, near-black background.

### `jingyuan-e`: Призыв духа (Техника)
Что делает: следующая серия Повелителя сразу и с лишними ударами.
> Hero: Jing Yuan. Icon: a golden halberd-headed helmet or spirit mask of the Lightlord in the centre inside a faint violet ring, two small lightning forks beside it. Palette: gold, violet, white, dark purple, near-black background.

### `jingyuan-t`: Талант: Искоренение праны (Пассивка)
Что делает: Повелитель ходит сам и бьёт сериями.
> Hero: Jing Yuan and the Lightlord. Icon: inside the dark diamond medallion a small gold warrior spirit mask with three violet-white lightning bolts fanning out under it. Palette: violet, white, gold, muted dark purple field.

### `jingyuan-r`: Несущий свет (Ульта)
Что делает: удар по кругу 220, Повелитель получает ещё три удара.
> Hero: Jing Yuan, small silhouette with a lance, and a giant golden spirit warrior looming behind him. Icon: the huge spirit raising a halberd that is covered in white-violet lightning, a giant circle of thunderbolts striking down from clouds, gold armour shining, wide violet rays. Palette: white, violet, gold, dark purple.

## Броня (`bronya`, Гармония, ветер)

Приметы: длинные серебристо-серые волосы, тёмно-серые глаза, чёрно-белый военный костюм, знамя.

### `bronya-q`: Боевой приказ (Навык)
Что делает: снимает ослабления, +66% урона на 3 с, сбрасывает Технику.
> Hero: Bronya, silver-grey hair, black and white military uniform. Icon: a white-gloved hand raised in a command salute with a small green-white wind swirl around the fingers, a green up-arrow glowing over it, small star sparks. Palette: mint green, white, steel grey, dark teal, near-black background.

### `bronya-e`: Знамя командира (Техника)
Что делает: знамя в точке на 10 с, союзники в круге бьют сильнее и быстрее.
> Hero: Bronya. Icon: a tall battle flag on a pole planted in the ground, a white-green cloth with an abstract wing emblem, a wide green ring on the ground around the pole, small up-arrows. Palette: white, mint green, steel grey, dark teal, near-black background.

### `bronya-t`: Талант: На шаг впереди (Пассивка)
Что делает: каждая Атака сокращает перезарядки Навыка и Техники.
> Hero: Bronya. Icon: inside the dark diamond medallion a round clock face with a green circular arrow running counter-clockwise around it, a tiny white wing on top. Palette: mint green, white, grey, muted dark teal field.

### `bronya-r`: Марш Белобога (Ульта)
Что делает: союзники вокруг получают +55% урона и критический урон на 6 с.
> Hero: Bronya, small silhouette holding a flag in the centre. Icon: a giant white wing-shaped banner spread across the top half, a wave of green wind and golden music-like rays sweeping over a marching crowd of small silhouettes at the bottom, a big white-gold star above. Palette: white, mint green, gold, dark teal, near-black navy.

## Аста (`asta`, Гармония, огонь)

Приметы: розово-рыжие волосы, голубые глаза, красно-розовая спортивная куртка, станционный техник.

### `asta-q`: Метеоритный шторм (Навык)
Что делает: 5 отскоков по врагам.
> Hero: Asta, pink-red hair, red jacket. Icon: a small burning meteor bouncing diagonally between three stars in a zigzag line, an orange flame trail along the whole path, a white star spark at each bounce. Palette: orange, yellow, red, white, dark purple-red background.

### `asta-e`: Звездопад (Техника)
Что делает: метеоры по кругу 140 в точке: три удара за 1,5 с.
> Hero: Asta. Icon: three small meteors falling from the top into a dotted orange target circle on the ground, tiny star shapes around, fiery tails pointing up. Palette: orange, yellow, red, white, dark navy-red background.

### `asta-t`: Талант: Астрометрия (Пассивка)
Что делает: заряды от попаданий, союзникам +14% атаки за заряд.
> Hero: Asta. Icon: inside the dark diamond medallion a small star chart: five stars joined by thin lines into a constellation, the first three lit orange and two dim, a tiny red up-arrow above. Palette: orange, yellow, red, muted dark maroon field.

### `asta-r`: Астральное благословение (Ульта)
Что делает: союзникам в 300 скорость атаки и передвижения на 6 с.
> Hero: Asta, small silhouette with a wide pink-red ponytail. Icon: a huge radiant five-pointed star of fire with a white core in the centre, a large ring of orange speed lines flowing around it, small star sparkles, wide yellow-red rays. Palette: yellow, white, orange, red, deep purple.

## Жуань Мэй (`ruanmei`, Гармония, лёд)

Приметы: тёмные волосы, бирюзовые глаза, бело-зелёный церемониальный халат, шёлковые нити, цветы.

### `ruanmei-q`: Повторяющаяся мелодия пения струн (Навык)
Что делает: «Обертон» на 9 с союзникам: урон +32%, урон по стойкости +50%.
> Hero: Ruan Mei, dark hair, white and teal robe. Icon: a short zither (guqin-like string instrument) with four glowing pale-cyan strings, three small cyan musical wave arcs rising from the strings, a small white plum blossom on one corner. Palette: pale cyan, white, teal, brown wood, dark navy background.

### `ruanmei-e`: Шёлковая серенада (Техника)
Что делает: «Обертон» на 6 с и шёлк по кругу в точке: замедление и стойкость.
> Hero: Ruan Mei. Icon: a round spiderweb-like silk pattern of pale cyan threads spread on the ground in a circle, a small silk needle or spindle in the centre, a snowflake crystal at one thread crossing. Palette: pale cyan, white, teal, dark navy background.

### `ruanmei-t`: Талант: Соматотипическая спираль (Пассивка)
Что делает: скорость союзников +10%, пробитие добавляет ледяной урон.
> Hero: Ruan Mei. Icon: inside the dark diamond medallion a glowing pale-cyan DNA double helix, twisting vertically, with a small snowflake at its top and a tiny plum blossom at its base. Palette: pale cyan, white, teal, muted dark navy field.

### `ruanmei-r`: Лепестки на воде, отдых во сне (Ульта)
Что делает: поле 220 на 8 с: союзники игнорируют броню, пробитый враг снова оцепенеет.
> Hero: Ruan Mei, small silhouette in a long robe sitting at the bottom. Icon: a round pond of pale-cyan water with a huge ring of floating blossom petals, concentric ripples, a flowering branch hanging from the top with frozen petals falling, wide white-cyan rays. Palette: white, pale cyan, teal, pink petals, dark navy.

## Кафка (`kafka`, Небытие, молния)

Приметы: пурпурно-винные волосы, розово-фиолетовые глаза, тёмное длинное пальто с мехом, тёмные очки.

### `kafka-q`: Ласковый лунный свет (Навык)
Что делает: удар по цели и вокруг, периодический урон срабатывает сразу.
> Hero: Kafka, wine-purple hair, long dark coat, sunglasses. Icon: a violet-white crescent moon slashing diagonally with a thin sword line, small violet lightning forks along its edge, a small pink drop at the tip. Palette: violet, pink-violet, white, black, dark purple background.

### `kafka-e`: Прощение не связано с милосердием (Техника)
Что делает: нити по кругу в точке: урон и Шок.
> Hero: Kafka. Icon: a round web of violet threads with small lightning sparks at the junctions, spread on the ground in a circle, a thin silver needle in the centre. Palette: violet, white, pink-violet, black, dark purple background.

### `kafka-t`: Талант: Жестокая нежность (Пассивка)
Что делает: каждая третья атака даёт бонус-удар и Шок.
> Hero: Kafka. Icon: inside the dark diamond medallion three small violet lightning bolts in a row, the third one larger and white, a thin pink thread through them. Palette: violet, white, pink-violet, muted dark purple field.

### `kafka-r`: Сумеречная трель (Ульта)
Что делает: все враги в 260 получают урон и Шок, Шок сразу срабатывает.
> Hero: Kafka, small dark silhouette with a long coat in the middle. Icon: a big violet-white lightning storm bursting out of the silhouette in all directions, a ring of pink-violet electric nets, a giant dark spiderweb behind, a crescent moon at the top, wide purple rays. Palette: violet, white, pink-violet, black, dark purple.

## Серебряный Волк (`silverwolf`, Небытие, квант)

Приметы: серебристо-серые волосы, бледные глаза, тёмная худи с серыми деталями, ноутбук и игровая приставка, глитчи.

### `silverwolf-q`: Разрешить изменения? (Навык)
Что делает: удар, слабость к квантовому урону на цель.
> Hero: Silver Wolf, light silver hair, dark hoodie. Icon: an indigo pixel-style dialog window (no text, only blocks and a blank bar) with a bright cursor arrow clicking it, a quantum-indigo crack running across it, scattered square glitch pixels. Palette: indigo, pink-violet, white, black, dark navy background.

### `silverwolf-e`: Программа принудительного выхода (Техника)
Что делает: взлом по кругу: стойкость, враги зависают.
> Hero: Silver Wolf. Icon: a retro round pixelated loading or hourglass symbol in the centre made of square blocks, a red-pink power button symbol (circle with a vertical line, no letters) crossed with a glitch line, small square pixels falling off. Palette: indigo, pink-violet, white, black, dark navy background.

### `silverwolf-t`: Талант: Ожидание ответа системы... (Пассивка)
Что делает: удар с шансом вносит Баг: враг слабее.
> Hero: Silver Wolf. Icon: inside the dark diamond medallion a small round bug beetle shape built from pixel blocks with six legs, one of its blocks glitch-shifted sideways. Palette: indigo, pink-violet, white, muted dark purple field.

### `silverwolf-r`: Пользователь забанен (Ульта)
Что делает: сильнейший удар и −45% брони цели на 9 с.
> Hero: Silver Wolf, small silhouette with a hood. Icon: a giant red-pink forbidden sign (circle with a diagonal bar) shattering a big pixelated screen behind it, a flood of indigo and pink glitch blocks bursting out, a hammer-shaped cursor above, wide violet rays. Palette: indigo, pink-violet, red, white, black, dark navy.

## Вельт (`welt`, Небытие, мнимый)

Приметы: каштановые волосы, золотые глаза, длинное коричнево-бежевое пальто, трость.

### `welt-q`: Гравитационное ядро (Навык)
Что делает: 3 отскока, каждый может замедлить.
> Hero: Welt, brown hair, long beige-brown coat, a cane. Icon: a golden-yellow glowing orb with a black spiral core bouncing along three connected arcs, small cream dust rings at each bounce, a faint downward arrow showing slowing. Palette: golden yellow, cream, brown, black, dark brown-purple background.

### `welt-e`: Гравитационная тюрьма (Техника)
Что делает: волна вокруг Вельта: отбрасывание и замедление.
> Hero: Welt. Icon: a round golden shockwave ring pushing outwards from the centre with the end of a brown cane planted in the middle, two heavy downward arrows over the ring, small floating cream stones. Palette: golden yellow, cream, brown, black, dark brown-purple background.

### `welt-t`: Талант: Искажение времени (Пассивка)
Что делает: удары по замедленным врагам бьют ещё мнимым уроном.
> Hero: Welt. Icon: inside the dark diamond medallion a bent clock face with melted golden hands and a small snail shape under it, a thin golden lightning slash across. Palette: golden yellow, cream, brown, muted dark brown field.

### `welt-r`: Синтетическая чёрная дыра (Ульта)
Что делает: дыра в точке 3 с тянет врагов, затем удар и Заточение.
> Hero: Welt, small silhouette with a cane at the bottom. Icon: a huge black hole with a bright golden rim in the centre of the square, golden-yellow spiral arms pulling small debris and tiny figures into it, a ring of cream light, wide yellow rays. Palette: black, golden yellow, cream, brown, dark purple.

## Март 7 (`march`, Сохранение, лёд)

Приметы: светло-розовые волосы с розовыми кончиками, розовые глаза, бело-розовая одежда, лук со льдом, фотоаппарат.

### `march-q`: Защитная дуга (Навык)
Что делает: щит союзнику, враги вокруг бьют его.
> Hero: March 7th, pink hair, pink and white outfit. Icon: a big round pale-cyan ice shield with a white snowflake in the middle and a pink ring around it, a bow limb at its side, small ice crystals around. Palette: pale cyan, white, pink, deep blue, dark navy background.

### `march-e`: Застывший миг (Техника)
Что делает: ледяная стрела по линии замораживает цель и окружающих.
> Hero: March 7th. Icon: a long ice arrow flying diagonally with a pink feather end and a crystal arrowhead, frozen enemy-shaped ice block with a white flash at the arrowhead, a few frost sparks. Palette: pale cyan, white, pink, deep blue, dark navy background.

### `march-t`: Талант: Девичья сила (Пассивка)
Что делает: враг, ударивший союзника под щитом, получает ответную стрелу.
> Hero: March 7th. Icon: inside the dark diamond medallion a small cyan shield with a short pink-feathered arrow shooting out of its right side, a tiny snowflake. Palette: pale cyan, pink, white, muted dark blue field.

### `march-r`: Ледяной дождь (Ульта)
Что делает: стрелы по кругу в точке, шанс заморозить.
> Hero: March 7th, small silhouette with a bow aiming upward. Icon: a big dark sky with dozens of pale-cyan ice arrows with pink feathers raining down onto a white frozen circle on the ground, ice crystals bursting, a snowflake in the centre of the circle, wide white-blue rays. Palette: white, pale cyan, pink, deep blue, dark navy.

## Гепард (`gepard`, Сохранение, лёд)

Приметы: светлые золотисто-серые волосы, синие глаза, тяжёлая броня среброгривых стражей, большой щит.

### `gepard-q`: Кулак мерзлоты (Навык)
Что делает: удар, шанс заморозить цель.
> Hero: Gepard, heavy silvery armour, big shield. Icon: a huge armoured steel gauntlet fist punching forward and to the upper right, covered in pale-cyan frost, a white-blue impact star at the knuckles, flying ice shards. Palette: steel grey, pale cyan, white, deep blue, dark navy background.

### `gepard-e`: Щит Среброгривых (Техника)
Что делает: щит себе и союзникам на 9 с.
> Hero: Gepard. Icon: a big heater-style silver shield with a pale-cyan crest of a mane shape (no text), a faint cyan ring around it, small white plus sparkles. Palette: steel grey, white, pale cyan, deep blue, dark navy background.

### `gepard-t`: Талант: Непреклонная воля (Пассивка)
Что делает: раз за волну смертельный удар не убивает: встаёт с 50% НР.
> Hero: Gepard. Icon: inside the dark diamond medallion a cracked half-heart rising from a broken shield, a tiny upward arrow, a pale cyan mark at the crack. Palette: steel grey, pale cyan, red heart accent, muted dark blue field.

### `gepard-r`: Несокрушимая стена (Ульта)
Что делает: щит всем союзникам с базой и турелями, враги бьют Гепарда.
> Hero: Gepard, small silhouette. Icon: a gigantic wall of ice-blue and steel shields rising from the ground across the whole square, a huge shield with a mane crest in its centre, frost bursting from the edges, wide white-cyan rays. Palette: steel grey, pale cyan, white, deep blue, dark navy.

## Фу Сюань (`fuxuan`, Сохранение, квант)

Приметы: длинные розово-лиловые волосы, розовые глаза, фиолетово-золотое платье, золотая метка на лбу.

### `fuxuan-q`: Ведомо звёздам, указано сердцем (Навык)
Что делает: «Матрица предвидения»: большая часть урона по союзникам уходит на Фу Сюань, шанс крита.
> Hero: Fu Xuan, long pink-lilac hair, purple and gold dress. Icon: a glowing gold-and-violet hexagram-like diagram plate (eight trigram lines in a ring, no letters) floating in the centre, a small eye in its middle, indigo sparks around it. Palette: gold, violet, indigo, pink, dark purple background.

### `fuxuan-e`: Пророчеству сопутствует вера (Техника)
Что делает: перенос к союзной постройке и Матрица.
> Hero: Fu Xuan. Icon: a gold-violet hexagram diagram with a dotted arc leaping from it to a small turret tower on the right, a small star trail along the arc, a faint ring. Palette: gold, violet, indigo, steel grey, dark purple background.

### `fuxuan-t`: Талант: Невзгоды порождают благодать (Пассивка)
Что делает: отряд получает на 18% меньше урона, самолечение на 50% НР.
> Hero: Fu Xuan. Icon: inside the dark diamond medallion a small gold third eye on a violet shield with a tiny heart under it. Palette: gold, violet, pink, muted dark purple field.

### `fuxuan-r`: Единение скорби нации (Ульта)
Что делает: урон по всем врагам в процентах НР, лечение построек.
> Hero: Fu Xuan, small silhouette with a long dress. Icon: a giant golden-violet divination diagram circle covering the whole square with a big hexagram, a huge eye at the centre, golden threads reaching outwards to small tower shapes, pink-indigo sparks, wide gold-violet rays. Palette: gold, violet, indigo, pink, dark purple.

## Наташа (`natasha`, Изобилие, физический)

Приметы: сине-бирюзовые волосы до плеч, красные глаза, белая медицинская маска, белый халат, зелёный флакон.

### `natasha-q`: Любовь и исцеление (Навык)
Что делает: лечение союзника и регенерация.
> Hero: Natasha, blue-teal shoulder-length hair, white doctor's coat. Icon: a heart-shaped green glowing medicine vial with a cork, a white cross on its front, two small plus signs rising from it, a soft green ring below. Palette: soft green, white, teal, red heart accent, dark teal background.

### `natasha-e`: Гипноз (Техника)
Что делает: облако по кругу на 5 с: враги слабее и медленнее.
> Hero: Natasha. Icon: a drifting round cloud of pale violet-teal mist with a spiral hypnotic swirl in its middle, two small sleepy closed-eye shapes, a few pale bubbles. Palette: teal, pale lilac, white, dark teal-purple background.

### `natasha-t`: Талант: Иннервация (Пассивка)
Что делает: лечение союзников ниже 30% НР сильнее на 50%.
> Hero: Natasha. Icon: inside the dark diamond medallion a small heart with a green pulse line running through it like a nerve impulse, a plus mark and a tiny green up-arrow. Palette: soft green, white, red, muted dark teal field.

### `natasha-r`: Благодать (Ульта)
Что делает: лечит всех союзников вокруг, базу и турели.
> Hero: Natasha, small silhouette in a white coat with her arms spread. Icon: a huge white-green flower-like burst of healing light with eight petals and plus signs, a ring of green lights spreading to small base and tower shapes, a soft white core, wide pale green rays. Palette: white, soft green, teal, red accent, dark teal.

## Байлу (`bailu`, Изобилие, молния)

Приметы: бледно-сиреневые волосы, маленькие рога, бирюзовые глаза, светлая одежда, юная видьядхара-дракон.

### `bailu-q`: Песнь среди облаков (Навык)
Что делает: лечение отскакивает ещё на двух раненых.
> Hero: Bailu, pale lavender hair, small dragon horns. Icon: a small violet-white lightning bolt bouncing between three small green hearts connected by a zigzag arc, soft green pluses rising at each heart, a tiny lavender cloud under them. Palette: violet, soft green, white, lavender, dark purple background.

### `bailu-e`: Прогулка под дождём (Техника)
Что делает: Оживление на 9 с себе и союзникам.
> Hero: Bailu. Icon: a small round rain cloud in violet and lavender with large green-white raindrops falling from it, each drop with a tiny plus mark, a faint green ring below. Palette: lavender, violet, soft green, white, dark purple background.

### `bailu-t`: Талант: Успеть помочь всему миру (Пассивка)
Что делает: союзник с Оживлением лечится, когда его бьют, раз за волну спасает от гибели.
> Hero: Bailu. Icon: inside the dark diamond medallion a small round gourd (calabash) bottle with a cork, glowing green elixir inside and a tiny plus on it, a thin violet lightning ring around it. Palette: violet, soft green, white, muted dark purple field.

### `bailu-r`: Благодатный громовой прыжок (Ульта)
Что делает: лечит всех союзников вокруг и даёт Оживление.
> Hero: Bailu, small silhouette of a girl with horns leaping. Icon: a huge violet-white dragon-like thunderbolt looping across the square with a rain of green healing droplets and plus signs falling from it, lavender clouds at the bottom, a bright white-green core, wide violet rays. Palette: white, violet, soft green, lavender, dark purple.

## Лоча (`luocha`, Изобилие, мнимый)

Приметы: длинные светлые кремовые волосы, оливково-жёлтые глаза, бело-чёрная длинная одежда, гроб за спиной, цветок бездны.

### `luocha-q`: Молитва цветка бездны (Навык)
Что делает: лечит союзника, прибавляет Цветок Бездны.
> Hero: Luocha, long cream hair, white and black long coat, a coffin on his back. Icon: a single pale cream flower with dark petal veins and a golden heart blooming from a small open palm, small green plus signs rising from its petals, golden dust. Palette: cream, golden yellow, soft green, black, dark olive background.

### `luocha-e`: Милосердие дурака (Техника)
Что делает: сразу открывает Зону на 6 с.
> Hero: Luocha. Icon: a round golden-yellow circle on the ground made of a ring of small flower petals around a black coffin lid standing upright in the centre, a faint ring, small golden sparks. Palette: golden yellow, cream, black, olive, dark brown background.

### `luocha-t`: Талант: Круговорот жизни (Пассивка)
Что делает: союзник ниже 50% НР лечится сам, на двух Цветках в Зоне атаки лечат.
> Hero: Luocha. Icon: inside the dark diamond medallion two small cream flowers side by side with a tiny green plus between them, a thin golden ring. Palette: cream, golden yellow, soft green, muted dark olive field.

### `luocha-r`: Желание смерти (Ульта)
Что делает: снимает усиления с врагов и бьёт по ним, прибавляет Цветок.
> Hero: Luocha, small silhouette with a long coat. Icon: a huge golden circular blossom of petals unfolding wide across the square, a giant black coffin behind it opening with golden light, a ring of thin black and gold swords, dark cream rays, floating petals. Palette: golden yellow, cream, black, white, dark olive-brown.

## Журнал

Готовы и подключены все 84 иконки. Перегенерировать стоит `asta-t`, `bronya-e`, `welt-t` и `bailu-q`: на них остался нарисованный фон-«прозрачность» или белые углы. Когда перегенерируешь, сохрани файл в эту папку под тем же именем и запусти `python tools/hsr-ability-pix.py <ключ>`.
