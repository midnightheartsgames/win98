# Иконки Steam-игр: промпты

Картинки генерируются в ChatGPT, Gemini или Grok. Готовые файлы складываются в эту папку: `content/app-icons/<ключ>.png`.

## Зачем это нужно

Игры из каталога `js/game-manager.js` (`steam: true`) показывают иконку из `Icons[game.icon]` в `js/icons.js`. Одна и та же иконка видна:

| Где | Размер |
| --- | --- |
| Список игр в Steam, панель задач, заголовок окна, Пуск (малые) | 16 × 16 |
| Рабочий стол, ярлыки, меню Пуск, `C:\Games` | 32 × 32 |
| Шапка окна игры в Steam | 48 × 48 |

Уже готовы 41 игра из 48 (39 новых плюс `fallout` и `hsr98`). Остались семь, у них пока старые рисунки из кода: `half-life`, `diablo`, `homm1`, `fallout2`, `neon-racer`, `lucas-quest`, `sammax202`. Промпты для них ниже. Ещё одна проблема: `neon-racer` (Midnight Glide) сейчас показывает иконку `burnout`, которая принадлежит демо с диска Игромании. Ему нужен свой ключ `neon-racer`: после генерации замени `icon: 'burnout'` на `icon: 'neon-racer'` у `neon-racer` в `js/apps/advanced-site.js` и `js/game-manager.js`.

## Как делать

1. Открой чат с генерацией картинок. Приложи один-два скриншота игры (`content/steam/<id>-1.jpg`, `<id>-2.jpg`, id указан в каждом разделе) и вставь общий стиль, а сразу за ним промпт игры целиком, включая строку `Game:`.
2. Сгенерируй 3–4 варианта и выбери тот, что читается лучше всего. Проверка: уменьши картинку до 32 × 32 и до 16 × 16 (nearest neighbour). Силуэт и главный цвет должны узнаваться. Если узнаётся только крупно, вариант не годится.
3. Сохрани в `content/app-icons/<ключ>.png`. Ключ равен значению `icon` из каталога, а не `id`: например `lucas-quest.png` для игры `quest`. Размер 512 × 512, фон сплошной `#FF00FF`.
4. Запусти `python tools/app-icon-pix.py` (все файлы папки) или `python tools/app-icon-pix.py doom sammax` (только указанные ключи). Скрипт вырезает фон `#FF00FF` (только связанный с краями, шум JPEG тоже убирается), обрезает до квадрата по содержимому, сжимает сам файл до 128 × 128 и 96 цветов (около 6 КБ вместо 1,5 МБ) и вписывает значок 64 × 64 (64 цвета) в `js/icons.js` вместо старого рисунка с тем же ключом. Повторный запуск безопасен.

## Что за игры

Почти все игры проекта это переделки известных игр под Win 98: у них то же название, герои и мир, но своя графика и урезанный объём. Генератор не знает об этом и подменяет игру чем-то похожим (для Serious Sam он нарисовал героя другой игры). Поэтому в каждом промпте есть строка `Game:`: на какой именно игре основана наша, что она из себя представляет и что генератору рисовать нельзя. Не удаляй её.

Для игр без прототипа (Midnight Glide, LucasQuest 98, Catniss, Хаято и другие) в строке `Game:` написано, что это оригинальная игра, и перечислены ближайшие образы, которые нельзя рисовать вместо неё.

## Общий стиль (вставлять в начало каждого промпта)

> Authentic 16-bit era desktop program icon, pixel art. Square 1:1 canvas of 512 × 512 pixels built on a strict 32 × 32 logical pixel grid: every logical pixel is one flat solid block of exactly 16 × 16 real pixels, perfectly aligned to the grid, no half pixels. Classic Win 98 icon look: one bold, clearly readable object or character, centred, filling about 85% of the canvas, a continuous 1-logical-pixel near-black outline around the whole shape, light coming from the top-left, hard-edged shading with 2 to 3 tones per colour, bright highlights on the top-left edges, only sparse light checkerboard dithering. Maximum 24 colours in total, saturated and high contrast. Strictly no anti-aliasing, no gradients, no blur, no glow, no soft shadows, no smooth vector lines, no 3D render, no photo look. The silhouette must stay recognisable when the icon is shrunk to 32 × 32 and even 16 × 16, so use big simple shapes and leave out tiny details. Background: one flat solid pure magenta #FF00FF everywhere outside the icon, no ground shadow, no gradient, no frame, no border, no rounded plate, no UI. Do not use magenta anywhere inside the icon. No text, no letters, no numbers, no logo, no watermark, unless the prompt below says otherwise. The prompt below names the exact game the icon is for and what it is based on. Draw only that game: never substitute another well-known game, hero, mascot or franchise from a similar genre, and do not copy any official logo or key art. Use the attached screenshots only as reference for the identity, outfit and colours of the game: draw a new, simplified, iconic composition, not a copy of the screenshot.

Если модель не слушается:

- Картинка гладкая, с градиентами: добавь «Think of it as a 32 × 32 sprite scaled up 16 times with nearest neighbour, like a 1998 desktop icon.»
- Фон не пурпурный или есть тень на земле: добавь «The background must be exactly #FF00FF, flat, with no shadow under the object.»
- Появился текст: добавь «Remove all text and letters.»
- Слишком много мелочей: добавь «Fewer details, bigger shapes, at most 3 main shapes.»
- Модель рисует плашку или рамку под иконкой: добавь «No background plate, the object floats alone on the magenta.» (для Sam & Max это не относится: там диск входит в макет)
- Модель нарисовала героя или эмблему другой игры: добавь «This is NOT <название чужой игры>. Do not draw <её герой или символ>. Draw only what the Icon line describes.»

## Стрелки и шутеры

### `half-life`: Half-Life 98 (id `half-life`, шутер)
Основа: первый Half-Life (1998), Чёрная Меза. Не Half-Life 2.
Референс: `content/steam/half-life-1.jpg`, `half-life-2.jpg`.
> Game: a small remake of the original Half-Life (1998, Valve): the Black Mesa research facility, the resonance cascade, aliens from Xen and HECU soldiers, hero Gordon Freeman in an orange hazard suit. It is NOT Half-Life 2 and has no Combine, no City 17, no gravity gun. Icon: a large orange Greek letter lambda in the centre of a dark circular emblem, a red crowbar crossing diagonally behind the circle. A small amber hazard stripe on the ring. Palette: orange, dark grey, black, red, a little white.

## Ролевые игры и фэнтези

### `diablo`: Diablo (id `diablo`, ролевой экшен)
Основа: первый Diablo (1996), Тристрам и собор. Не Diablo II, III и IV.
Референс: `content/steam/diablo-1.jpg`, `diablo-2.jpg`.
> Game: a small remake of the first Diablo (1996, Blizzard North): the town of Tristram and the 16 levels of the cathedral and hell beneath it, with a Warrior, Rogue and Sorcerer, ending in a fight with the Lord of Terror. It is NOT Diablo II, III or IV. Icon: a gothic cathedral doorway seen from the front, black stone with a pointed arch, a stair going down inside it into a hot red-orange glow, a tiny grey knight silhouette on the top step, a small bone-white skull above the keystone. Palette: black, grey stone, red, orange, bone white.

### `homm1`: Heroes of Might and Magic 98 (id `homm1`, пошаговая стратегия)
Основа: первая Heroes of Might and Magic (1995), Энрот и Морглин Айронфист. Не HoMM III и позже.
Референс: `content/steam/homm1-1.jpg`, `homm1-2.jpg`.
> Game: a small remake of the very first Heroes of Might and Magic (1995, New World Computing): the land of Enroth, lord Morglin Ironfist, four castle classes (knight, barbarian, sorceress, warlock), turn-based hero adventures and tactical battles. It is NOT Heroes of Might and Magic III or later, and not a Might and Magic first-person RPG. Icon: a golden crown with a big red gem in front of a round blue castle tower with a small red banner on top, a tiny wizard star sparkle beside the crown. Heraldic and bright. Palette: gold, royal blue, red, stone grey, white sparkle.

## Fallout

### `fallout2`: Fallout 2 Demo (id `fallout2`, ролевая игра)
Основа: демо Fallout 2 (1998) с Храмом Испытаний. Не Fallout 3, 4 и New Vegas.
Референс: `content/steam/fallout2-1.jpg`, `fallout2-2.jpg`.
> Game: a small remake of the Fallout 2 demo (1998, Black Isle Studios): the isometric post-apocalyptic RPG, only the Temple of Trials as the Chosen One, with turn-based fights against ants and scorpions and the S.P.E.C.I.A.L. character sheet. It is NOT Fallout 3, Fallout 4, New Vegas or the TV show, and not a 3D game. Icon: a chunky arm-worn computer (a Pip-Boy 2000 style device) on a cuff strap: worn tan metal body, a round green CRT screen showing seven short vertical stat bars, big orange knobs on the side. It must feel like a sibling of the existing Fallout icon (warm orange and tan with a black outline) but clearly different: an object, not a face. Palette: tan, orange, phosphor green, black.

## Гонки и открытый город

### `neon-racer`: Midnight Glide (id `neon-racer`, аркадные гонки)
Основа: оригинальная игра без прототипа. Не Need for Speed и не Burnout.
Это новый ключ: иконка `burnout` сейчас показывается и у этой игры, нужно заменить на свою.
Референс: `content/steam/neon-racer-1.jpg`, `neon-racer-2.jpg`.
> Game: Midnight Glide, an original arcade night street racing game from 1998 (no real-world counterpart): drifting, nitro and traffic through a neon megacity. It is NOT Need for Speed, Burnout, Ridge Racer or Forza: do not copy any real car brand, logo or key art. Icon: a low sleek coupe in a rear three-quarter view racing forward, glowing red tail lights, a small blue nitro flame from the exhaust, two short neon streak trails (hot pink and cyan) fading out behind it. Night mood. Palette: dark navy, teal body, hot pink, cyan, red lights, white sparks.

## Квесты и юмор

### `lucas-quest`: LucasQuest 98 (id `quest`, квест)
Основа: оригинальная игра-пародия на пиратские квесты LucasArts (SCUMM). Не Monkey Island, никаких чужих логотипов и героев.
Референс: `content/steam/quest-1.jpg`, `quest-2.jpg`.
> Game: LucasQuest 98, an original point-and-click adventure parodying the LucasArts SCUMM pirate adventures, set in Castle Redmond in 1998, with its own hero Guybrush Bitewood and a rubber chicken. It is NOT Monkey Island: do not draw any official hero, ghost pirate or logo of that series, only the hero described here. Icon: a young pirate bust: blond hair tied in a short ponytail, a white laced-collar shirt, a brown vest, a sly lopsided grin; a rusty cutlass crossing behind him and a tiny black skull flag in the upper right corner. Palette: yellow blond, white, brown, navy, rust.

## Sam & Max (8 эпизодов)

Одна серия, восемь иконок, семь уже готовы (`sammax`, `sammax102`–`sammax106`, `sammax201`), осталась последняя. Основа: Sam & Max Save the World (Telltale, 2006, серия 1, эпизоды 101–106) и Sam & Max Beyond Time and Space (серия 2, эпизоды 201 и 202), по комиксам Стива Перселла, но у нас это рисованные пиксельные квесты в духе Sam & Max Hit the Road (1993). Это не мультсериал и не Scooby-Doo.

Общий макет: круглый цветной «диск» фона у каждого эпизода (свой цвет), на нём главный предмет эпизода крупно и по центру. Внизу в углах две маленькие головы-значка: слева Сэм (собака, бурая морда, светло-голубая шляпа-федора), справа Макс (белый кролик-нечто с огромной ухмылкой). Сначала сгенерируй `sammax` и приложи его как дополнительный референс к остальным, чтобы значки Сэма и Макса не менялись. В этой серии цветной диск нарушает правило «никаких плашек» из общего стиля, поэтому вставляй после общего стиля вот этот блок, а потом промпт эпизода:

> Series: Sam & Max, the detective duo from Steve Purcell's comics and the Telltale adventure games: Sam is a tall brown dog in a light-blue suit and fedora, Max is a short white hyperactive rabbit-like creature. It is NOT Scooby-Doo, not Snoopy, not Bugs Bunny and not Roger Rabbit. Icon family layout (this overrides the "no plate" rule above): a flat round coloured disc with a black outline as the backdrop, the main prop big and centred on it, and in the two lower corners two small head badges: on the left Sam, a brown dog in a light-blue fedora and light-blue suit; on the right Max, a white rabbit-like creature with a huge grin. Keep Sam and Max exactly the same in every icon of the series. The disc and the prop are the only things that change.

### `sammax202`: Эпизод 202, Moai Better Blues (id `sammax202`)
Референс: `content/steam/sammax202-1.jpg`, `sammax202-2.jpg`.
> Prop: a stone moai head with a single big blue tear running down, a small orange volcano with a lava glow behind it. Disc colour: lava orange-red.

## Журнал

Осталось: `half-life`, `diablo`, `homm1`, `fallout2`, `neon-racer`, `lucas-quest`, `sammax202`. Когда значок готов и подключён, удаляй его промпт из этого файла.
