# Сплеш-арты героев HSR 98: промпты

Картинки генерируются в ChatGPT, Gemini или Grok. Готовые файлы складываются в эту папку: `content/hsr98/splash/<ключ>.png`. Оригинальные Splash Art для референса лежат в `content/hsr98/splash/refs/` (список и ключи в `refs/INDEX.md`).

## Зачем это нужно

Сейчас в трёх местах HSR 98 герой показан не артом, а кодом: вырезанной головой (`G.drawBust`), 3D-фигуркой на космическом фоне (`G.drawFigure`) или `G.figureCanvas`. Нужен один арт на героя, который играет во всех трёх местах:

| Где | Файл и функция | Что показано сейчас | Как арт будет использован |
| --- | --- | --- | --- |
| Итоги призыва, выбитые карточки | `hsr-convene.js`, `rackCard` | узкая карточка 56 × 300 px, внутри `G.figureCanvas` героя | арт на всю высоту карточки, видна центральная вертикальная полоса |
| Следы | `hsr-ui-menu.js`, раздел `traces` (фон `ui.fullBg(c, 392)`, фигурка `G.drawFigure` в точке 306, 444) | пустое космическое небо и фигурка под деревом узлов | арт на фоне всего экрана 640 × 480, затемнён, поверх идут узлы, левое меню и правая панель |
| Возвышение | `hsr-ui-levelup.js`, `draw`, `drawAscend` (`G.drawBust(c, look, 26, 66, 5)`) | просто крупное лицо героя слева | арт во всю левую колонку 366 × 386 px, справа панель материалов |

Подключено в коде (30.10.2026): модуль `js/apps/hsr98/hsr-splash.js` читает картинки из `hsr-splash-pix.js`, который собирает `tools/hsr-cone-pix.py --splash`. Герой без картинки показывается как раньше (фигурка или лицо), поэтому арты можно добавлять по одному. Ещё одно место: плашки «Результатов прыжка» (`hsr-warp.js`) берут из арта верхнюю часть (голова и торс) вместо лица. На возвышении арт стоит во всей колонке, а на экране повышения уровня в той же колонке, потому что это один экран.

## Форматы

Один арт на героя: вертикальный, 5:7, сетка 200 × 280 логических пикселей. Картинка сохраняется так, чтобы одна логическая клетка была 10 × 10 точек: 2000 × 2800. Обработка потом найдёт сетку (ключ `--pixel`, как у конусов) и вырежет 200 × 280 без размытия. Если модель не держит сетку, годится и 1000 × 1400, но клеток должно быть не меньше 200 × 280.

Зоны по высоте и ширине (в долях картинки, нужны для всех трёх мест сразу):

| Зона | Что в ней | Почему |
| --- | --- | --- |
| Центральные 26% ширины (колонки 74–126 из 200) на всей высоте | голова, торс и ноги героя целиком | карточка 56 × 300 px при масштабе 300 / 280 показывает только эту полосу |
| Голова: верх на 10–12% высоты, ступни на 88–90% | рост героя | сверху на карточке плашка «НОВЫЙ» (около 16 px), снизу полоса звёзд редкости (24 px) |
| Левая половина верхних 13% | спокойный, тёмный, без деталей | на возвышении там плашка «Возвышение» и строка «Путь / имя» |
| Левые и правые 25%, верх и низ 8% | тёмно-синий или тёмный цвет стихии, простой узор, без важных деталей | арт стоит на тёмном космическом фоне, края должны в него сливаться; на Следах левое меню и правая панель закрывают края |
| Центральные 60% ширины | сам герой и главный образ сцены | дерево узлов Следов закрывает область x 186–434, арт под ним затемнён примерно до 40% |

Размер героя: в высоту 75–80% картинки, голова около 11–13% высоты. Лицо должно читаться и в узкой карточке, и в колонке возвышения (масштаб около 1,4).

## Как делать

1. Открой чат с генерацией картинок. Приложи оригинальный арт `refs/<ключ>.png` как референс. Вставь по порядку: общий стиль (блок ниже) и промпт героя целиком (строки `Hero:`, `Pose:`, `Scene:`, `Palette:`). Для героев без оригинала (коллаборации) приложи арт героя и вставь вместо общего стиля блок из раздела «Коллаборации и CCC».
2. Сначала сделай одного героя и приложи его картинку к остальным как референс стиля, чтобы пиксель-арт не гулял между героями.
3. Сгенерируй 3–4 варианта, выбери лучший. Проверка: вырежи центральную полосу 74–126 колонок и посмотри (это карточка), уменьши до 183 × 256 (nearest neighbour) (это возвышение), затемни до 40% и положи на 640 × 480 (это Следы). Лицо и силуэт должны читаться на карточке, а края не должны спорить с интерфейсом.
4. Сохрани как `content/hsr98/splash/<ключ>.png`. Ключ равен ключу в `H.CHARS`: `trail-m`, `trail-f`, `trail_p-m`, `trail_p-f` (Первопроходец по полу и пути), остальные по ключу в заголовке промпта.
5. Запусти `python tools/hsr-cone-pix.py --splash himeko путь/к/himeko.png --pixel --colors 64`. Скрипт найдёт сетку пикселей, вырежет 200 × 280, положит результат в `content/hsr98/splash/himeko.png` и пересоберёт `js/apps/hsr98/hsr-splash-pix.js`, который читает игра. Ключи те же, что у конусов: `--colors`, `--crop`, `--preview файл.png`. Для Первопроходца ключ с суффиксом, например `trail-f`; игра берёт мужской или женский арт по полу героя.
6. Журнал в конце файла обновляй вручную, как у конусов.

## Общий стиль (вставлять в начало каждого промпта)

> Authentic 16-bit era pixel art character splash illustration, as drawn for the character screen of a 1998 PC game. Portrait orientation, aspect ratio 5:7, built on a strict 200 × 280 logical pixel grid: every logical pixel is one flat solid block of exactly 10 × 10 real pixels (2000 × 2800 pixels in total), perfectly aligned to the grid, no half pixels. Chunky clearly visible square pixels, stepped pixelated outlines (jaggies), hand-placed checkerboard dithering for shading, limited 48-colour palette, strictly no anti-aliasing, no smooth gradients, no blur, no glow halos, no soft shadows, no smooth vector lines, no 3D render, no photo look. The picture fills the whole canvas edge to edge: no transparent, white or magenta background, no cut-out silhouette edge, no sticker outline, no frame, no border, no card UI, no text, no letters, no numbers, no logo, no watermark, no signature. Composition: exactly ONE character, the whole body visible from head to feet (standing, floating or seated), centred horizontally, about 75 to 80 percent of the picture height, the top of the head at about 11 percent of the height and the feet at about 89 percent; keep the head, torso and legs inside the central quarter of the width, props, wings and effects may spread wider. Around the character is the scene of the attached splash art, simplified into a tall vertical layout and filling the entire canvas; the outer quarter of each side and the top and bottom edges fade to a dark, simple, low-contrast tone (deep navy or a very dark shade of the element colour) so the picture can sit on a dark space background; the upper-left corner is calm and dark. The character is the brightest, most saturated and most contrasty element, the scene behind is darker and lower in contrast. Light from the top-left, hard-edged cel shading with 2 to 3 tones per colour, a continuous 1-logical-pixel dark outline around the character. Clear, readable pixel-art face: eyes are 2 to 3 logical pixels with a bright 1-pixel highlight, no blurry features. Use the attached splash art as reference for the face, hair, outfit, props, pose, mood, scene motif and colours of the character: redraw it as new pixel art re-composed into this tall portrait, not a 1:1 copy, and drop the original's round cut-out shape.

Если модель не слушается:

- Картинка гладкая, с градиентами или свечением: добавь «Think of it as a 200 × 280 sprite scaled up 10 times with nearest neighbour, like a 1998 game asset.»
- Прозрачный или белый фон, силуэт-клякса как на оригинале: добавь «Fill the whole canvas with the painted scene, no empty background, no cut-out shape.»
- Нарисованы рамка, карточка, подпись или имя: добавь «No frame, no border, no card, no text: the picture itself is the whole canvas.»
- Герой маленький или обрезан: добавь «The character is big and fully in frame, head near the top fifth, feet near the bottom, nothing cut off.»
- Герой не по центру или широкая поза: добавь «Narrow, vertical pose, the body inside the middle quarter of the width.»
- Слишком много мелочей: добавь «Fewer details, bigger shapes, at most 5 main shapes in the scene.»
- Лицо кривое: добавь «The face is the sharpest detail, drawn with clean 2-pixel eyes and a small simple mouth.»
- Цвета ушли от героя: добавь «Stick to the palette of the Palette line and the colours of the reference.»

## Принципы образов

Чтобы 44 арта не слиплись, берём из оригинала три вещи: позу героя, главный предмет сцены (поезд, клён, зонты, паучьи лилии, телескоп) и цвет стихии. Круглую «кляксу» оригинала не повторяем: сцена достраивается вверх и вниз так, чтобы заполнить вертикальный холст, а края темнеют. Широкие горизонтальные композиции оригинала (Первопроходец в огне, Хук, Серебряный Волк, Цинцюэ) разворачиваются вдоль вертикали: предметы по бокам переезжают выше и ниже героя.

| Цвет стихии | Палитра |
| --- | --- |
| Физический | сталь, серый, белый, золотой акцент |
| Огненный | оранжевый `#ff6a30`, жёлтый, тёмно-красный |
| Ледяной | бледно-голубой `#8adfff`, белый, тёмно-синий |
| Электрический | фиолетовый `#c07aff`, белый, тёмно-пурпурный |
| Ветряной | мятно-зелёный `#5fe0a8`, белый, тёмно-бирюзовый |
| Квантовый | индиго `#8a7aff`, розово-лиловый, чёрный |
| Мнимый | золотисто-жёлтый `#ffd850`, кремовый, коричневый |

Цвета стихий здесь ведут сцену, но не отменяют цвета самого героя и оригинала: если на арте Лоча зелёно-белый, он зелёно-белый.

## Герои из Honkai: Star Rail

Референс каждого героя: `refs/<ключ>.png`. В описаниях «Оригинал» кратко, что нарисовано на Splash Art; внешность, предметы и цвета сверяй по приложенной картинке.

### `trail-m`: Первопроходец, мужской (5★, Разрушение, физический) — готово 31.10.2026
Оригинал: `refs/trail-m.png`. Первопроходец парит в центре, вокруг него шар ночного звёздного неба с облаками, по верхнему краю Звёздный экспресс (паровоз с горящей фарой) на кромке белых облаков; золотая искра в руке, жёлтая лента.
> Hero: the Trailblazer, male: short messy grey hair, golden eyes, calm face, white shirt, long open black coat with gold lining, a flowing yellow-gold ribbon, black trousers, black boots. Pose: floating weightlessly in a slight diagonal, one hand raised with a small glowing golden spark in the palm, coat tails drifting. Scene: the Astral Express steam locomotive curves across the top of the picture, its headlamp glowing, riding a bank of white-lilac clouds; behind and under the figure a big round window of deep blue starry night with swirls of cloud around its lower edge, fading to dark navy at the borders. Palette: deep navy, cobalt blue, white clouds, brass gold accents, steel grey, black coat.

### `trail-f`: Первопроходец, женский (5★, Разрушение, физический) — готово 31.10.2026
Оригинал: `refs/trail-f.png`. Та же сцена, героиня с длинными серыми волосами.
> Hero: the Trailblazer, female: long grey hair, golden eyes, white shirt, short open black coat with gold lining, a flowing yellow-gold ribbon, short black skirt, black boots (legs and outfit as in the reference). Pose: floating weightlessly in a slight diagonal, one hand raised with a small glowing golden spark in the palm, hair and ribbon drifting. Scene: the Astral Express steam locomotive curves across the top of the picture, its headlamp glowing, riding a bank of white-lilac clouds; behind and under the figure a big round window of deep blue starry night with swirls of cloud around its lower edge, fading to dark navy at the borders. Palette: deep navy, cobalt blue, white clouds, brass gold accents, steel grey, black coat.

### `trail_p-m`: Первопроходец, мужской, Сохранение (5★, Сохранение, огненный) — готово 31.10.2026
Оригинал: `refs/trail_p-m.png`. Герой в вихре оранжево-золотого огня, за ним огромный золотой ключ, справа синие кристальные щиты, в пламени бледные силуэты. Композиция горизонтальная: разворачиваем по вертикали.
> Hero: the Trailblazer, male: short messy grey hair, golden eyes, determined face, white shirt, black coat with gold lining, black trousers and boots. Pose: standing braced and leaning slightly forward, a large angular blue-violet crystal shield held beside him, the other fist clenched. Scene: a tall column of orange and gold flames shaped like leaves rising from the bottom to the top of the picture, a huge pale golden key standing diagonally behind him, shards of blue-violet crystal near the shield, faint pale cream silhouettes of other figures fading inside the flames; the sides and corners dim to dark maroon-black. Palette: orange, yellow, gold, dark red, blue-violet accent, black coat, dark maroon background.

### `trail_p-f`: Первопроходец, женский, Сохранение (5★, Сохранение, огненный) — готово 31.10.2026
Оригинал: `refs/trail_p-f.png`.
> Hero: the Trailblazer, female: long grey hair, golden eyes, determined face, white shirt, black coat with gold lining, short black skirt, black boots (as in the reference). Pose: standing braced and leaning slightly forward, a large angular blue-violet crystal shield held beside her, the other fist clenched. Scene: a tall column of orange and gold flames shaped like leaves rising from the bottom to the top of the picture, a huge pale golden key standing diagonally behind her, shards of blue-violet crystal near the shield, faint pale cream silhouettes of other figures fading inside the flames; the sides and corners dim to dark maroon-black. Palette: orange, yellow, gold, dark red, blue-violet accent, black coat, dark maroon background.

### `march`: Март 7 (4★, Сохранение, лёд) — готово 30.10.2026
Оригинал: `refs/march.png` (Preservation). Запасной вариант Охоты: `refs/march-hunt.png`, в игре не используется. Март 7 с розовыми волосами тянет ледяной лук, вокруг огромные розово-голубые лепестки-крылья, снежинки и цветки клевера.
> Hero: March 7th (Preservation): short pink hair with a fading tint, pink-and-blue eyes, cheerful open-mouth smile, white-and-blue sailor-style top with a pale pink cape, short blue skirt, black shoes, a camera on her hip. Pose: leaping up on the tip of one foot, drawing a large white-and-ice-blue bow, one hand to her cheek. Scene: huge translucent petal-wings in pink and cyan spreading behind her in a vertical fan, small ice flowers and four-pointed snowflake stars, a ribbon of ice crystals under her feet; the borders dim to deep indigo. Palette: pale cyan, pink, white, deep blue, indigo background.

### `danheng`: Дань Хэн (4★, Охота, ветер) — готово 30.10.2026
Оригинал: `refs/danheng.png`. Дань Хэн сидит на камнях под огромным красным клёном, копьё лежит рядом, внизу белая дымка.
> Hero: Dan Heng: black hair tied up with loose side locks, calm cold blue-grey eyes, dark coat with teal-green inner lining and a white top, a long spear. Pose: sitting on a rock with one knee raised, the spear resting across his lap, looking aside with a quiet face. Scene: a huge maple tree with flame-red leaves filling the top half of the picture, a few red leaves falling, grey rocks stepping down to the bottom, white mist at the base; the edges dim to dark teal-black. Palette: red-orange maple, mint green and teal, white mist, steel grey, near-black teal background.

### `himeko`: Химико (5★, Эрудиция, огонь) — готово 30.10.2026
Оригинал: `refs/himeko.png`. Химико поднимает руку, вокруг кольцо облаков и звёздное небо, огромное красно-белое перекрестие света (бликов) и гигантская пушка над ней, красный подол струится вниз.
> Hero: Himeko: long wavy crimson hair, golden-amber eyes, a black long coat with gold trim over a white-and-red evening dress with a long flowing red skirt, black heels. Pose: standing elegantly with one hand raised toward the light, the other hand on the dress, eyes half closed. Scene: a round window of deep violet starry sky in a ring of white clouds, a huge four-pointed cross of red-white light behind her head, the barrel of a giant gun-like machine above, the red skirt flowing downward into a swirl of red petals; the outer parts fade to dark purple-black. Palette: crimson, red, white, warm gold, deep violet, black coat, dark purple background.

### `welt`: Вельт (5★, Небытие, мнимый) — готово 30.10.2026
Оригинал: `refs/welt.png`. Вельт стоит в центре, вокруг парят осколки зеркал и ленты, на осколках едва видны другие герои, красная лента вьётся от трости.
> Hero: Welt: short brown hair, round glasses, golden eyes, a long light grey coat over a black waistcoat and white shirt, black trousers and boots, a long cane tied with a red ribbon. Pose: standing relaxed with the cane held in one hand and the other hand raised with two fingers lifted, a faint smile. Scene: a gravitational swirl of blue-violet space and white light, big broken shards of glass and mirror floating around him, a long red ribbon spiralling from the cane, tiny faint figures reflected in some of the shards; the edges dim to dark violet. Palette: golden yellow accent, grey, white, blue-violet space, red ribbon, dark purple background.

### `natasha`: Наташа (4★, Изобилие, физический) — готово 30.10.2026
Оригинал: `refs/natasha.png`. Наташа в светлой теплице-клинике у арочного окна, стеклянный шар-террариум, рядом двое детей, растения у ног.
> Hero: Natasha: long blue-teal hair, calm tired red eyes, a white medical mask pulled down under her chin, a white doctor's coat with red-white panels over a black dress, a brown satchel, black gloves, boots. Pose: standing slightly turned with a glass vial in one hand, looking kindly down at two small children at her feet. Scene: a tall arched window flooded with soft sunlight behind her, a hanging glass terrarium globe with a tiny plant, shelves of vials, green leaves and plants along the bottom; the sides dim to dark green-teal. Palette: soft green, warm cream, white, teal, red accent, dark teal background.

### `serval`: Сервал (4★, Эрудиция, молния) — готово 30.10.2026
Оригинал: `refs/serval.png`. Сервал сидит на стуле на сцене, у неё электрогитара-оружие, колонки, фиолетовые молнии, граффити за спиной.
> Hero: Serval: long pale-blonde hair, golden-yellow eyes, black-and-white performer outfit with long white wide trousers, buckled boots, an electric guitar-like weapon. Pose: sitting on the edge of a tall stool with the guitar across her lap, one hand plucking, a confident grin. Scene: a small dark stage, two big round blue speakers at her sides, violet lightning bolts jumping between amplifiers and cables, a graffiti-style wall behind her with halftone dots; the borders fade to dark purple-black. Palette: violet, white, electric blue, black, dark purple background.

### `asta`: Аста (4★, Гармония, огонь) — готово 30.10.2026
Оригинал: `refs/asta.png`. Аста сидит на гигантском телескопе в обсерватории, звёздное небо в куполе, линии созвездий.
> Hero: Asta: long pink-red hair, light blue eyes, a white-and-lavender short jacket-style top, a purple skirt, a black strap on her thigh, white boots. Pose: sitting on the barrel of a giant white-and-brass telescope, legs hanging, one hand at her chin, looking down with a gentle smile. Scene: an observatory dome opened to a deep violet starry sky with the Milky Way, thin glowing lines joining stars into constellations, brass gears and a round lens at the bottom; the edges dim to deep navy-violet. Palette: white, lavender, pink, brass gold, deep violet, hints of orange, dark navy background.

### `arlan`: Арлан (4★, Разрушение, молния) — готово 30.10.2026
Оригинал: `refs/arlan.png`. Арлан стоит на коленях/в наклоне под огромным рваным синим флагом, вокруг фиолетовые молнии, рядом маленькое бледное существо.
> Hero: Arlan: short silver-white hair, tanned dark skin, dark red eyes, a torn black-and-blue coat with a high collar and straps, black gloves, a short broken sword. Pose: crouched forward and looking sideways, one hand on the sword, coat tails ragged. Scene: a huge torn blue flag with a pale emblem hanging behind him, violet-white lightning bolts zigzagging around, ash and sparks, a small pale plush-like creature near his feet; the edges dim to dark purple-black. Palette: violet, white, deep blue, black, tan skin, dark navy-purple background.

### `herta`: Герта (4★, Эрудиция, лёд) — готово 30.10.2026
Оригинал: `refs/herta.png`. Герта и её куклы на круглом синем ковре у раскрытой книги, лавандовые цветы, красные ленты.
> Hero: Herta: long light-brown hair with a dark hair ornament, purple eyes, a dark brown-and-cream dress with a bow and cuffs, white socks, a doll-like body. Pose: sitting upright and cool on the edge of a big open book with her chin lifted, other identical doll bodies sleeping around her. Scene: a round blue rug with a pattern, an open storybook, three small sleeping doll copies of Herta lying nearby, lavender-purple flowers, thin red ribbons floating up; the borders dim to deep blue. Palette: violet, pale cyan, cream, deep blue, red ribbon accents, dark navy background.

### `gepard`: Гепард (5★, Сохранение, лёд) — готово 30.10.2026
Оригинал: `refs/gepard.png`. Гепард шагает по заснеженной лестнице, длинный синий плащ, ледяной светящийся клинок, огромный щит.
> Hero: Gepard: short golden-blond hair, blue eyes, a firm calm face, white-and-blue Silvermane Guard commander armour with gold buttons, a long blue cape billowing behind him, white trousers, tall boots. Pose: striding forward in a heroic three-quarter pose, a huge glowing ice-blue sword in one hand and a large shield behind him. Scene: a flight of snowy stone steps, a swirl of the blue cape across the picture, falling snow, clouds in a pale blue sky at the top, frost crystals at the foot; the edges dim to deep blue. Palette: pale cyan, white, deep cobalt blue, steel grey, gold buttons, dark navy background.

### `bronya`: Броня (5★, Гармония, ветер) — готово 30.10.2026
Оригинал: `refs/bronya.png`. Броня стоит в сине-серебряном ледяном замке, держит копьё-ружьё, вокруг острые ледяные кристаллы.
> Hero: Bronya: long silver-grey hair, grey eyes, a white-and-blue Silvermane officer outfit with a blue bow and a long blue cape, black gloves, dark stockings, boots, a long rifle-lance. Pose: standing upright and composed, the long weapon held vertically at her side, looking ahead with quiet resolve. Scene: tall sharp ice crystals and silver spires of a frozen tower rising behind her, a cold blue sheen on the floor, drifting snow and pale blue light; the borders dim to deep indigo-navy. Palette: pale cyan, white, silver, deep blue, a touch of mint green, dark navy background.

### `seele`: Зеле (5★, Охота, квант) — готово 30.10.2026
Оригинал: `refs/seele.png`. Зеле в огромном круге взмаха фиолетовой косы, позади красная луна, фиолетовые лепестки-бабочки, красная лента.
> Hero: Seele: short dark purple-blue hair with a red bow-like ribbon, purple eyes, a black outfit with purple accents, long black gloves, a red ribbon streaming, a huge scythe. Pose: in a graceful spinning attack, one leg lifted, the scythe swinging around her. Scene: a large blood-red full moon behind her head, wide violet-and-white crescent slashes forming a spiral around the figure, butterfly-wing shapes and petals, a pink-violet burst below her; the outer parts dim to dark purple-black. Palette: indigo, violet, pale lilac, blood red moon, black, dark purple background.

### `sampo`: Сампо (4★, Небытие, ветер) — готово 30.10.2026
Оригинал: `refs/sampo.png`. Сампо сидит в воздухе с рукой у головы, цепь, фиолетовые когти-серпы, полная луна и ночной город.
> Hero: Sampo: swept dark blue hair with a lighter tuft, sly narrow eyes, a red vest over a white shirt, dark trousers, black gloves, a silver chain with a hook. Pose: floating cross-legged in the air with one hand to his forehead and the other holding the chain, a mocking smile. Scene: a big pale full moon at the top, a night city skyline far below, white-and-lilac wind slashes circling him, a large violet crescent claw; the edges dim to deep navy. Palette: mint green and white wind streaks, red accent, deep navy-violet night, dark background.

### `hook`: Хук (4★, Разрушение, огонь) — готово 30.10.2026
Оригинал: `refs/hook.png`. Хук, маленькая девочка в шляпе-кроте, среди золотых искр и огня, а за ней куча плюшевых игрушек и круглых лиц детей Подземья.
> Hero: Hook: a very small girl with golden-yellow twin tails, big golden eyes, a mole-shaped hat, a brown jacket with a white fur collar and a yellow ribbon, a short dark skirt, boots, a toy hammer. Pose: standing proud and cheerful, hammer on her shoulder, one foot forward. Scene: a rising tongue of orange and yellow flame behind her, a pile of plush toys and round cartoon faces of children in the top half, four-pointed golden stars, white sparks; the edges dim to dark maroon. Palette: orange, yellow, gold, white, dark red, brown, dark maroon background.

### `pela`: Пела (4★, Небытие, лёд) — готово 30.10.2026
Оригинал: `refs/pela.png`. Пела в вихре ледяных волн и колец-линз, оранжевые лучи пересекают сцену.
> Hero: Pela: short dark purple hair with a small clip, light blue eyes, a white-and-light-blue intelligence-officer uniform with a short jacket, a short skirt, dark tights, boots, thin glasses. Pose: in a light combat stance on tiptoes, one hand raised with a floating holographic lens ring. Scene: wide ice-blue and deep blue waves swirling around her in a vertical spiral, thin rings of light, two orange laser beams crossing with a star flash, drifting book pages; the edges dim to deep blue-black. Palette: pale cyan, white, deep blue, orange accent, dark navy background.

### `ruanmei`: Жуань Мэй (5★, Гармония, лёд) — готово 30.10.2026
Оригинал: `refs/ruanmei.png`. Жуань Мэй сидит у окна с деревянными ставнями, ветка сливы, белый дым, листья на полу.
> Hero: Ruan Mei: long dark brown hair with flower and pearl pins, gentle teal-green eyes, a teal-and-white qipao-style dress with gold trim, black lace gloves, dark blue heels. Pose: sitting on the edge of a low bench with her legs crossed, one hand resting by her face, a soft sleepy smile. Scene: a window with open wooden shutters behind her, a plum-blossom branch with white flowers bending in from the top, curling white steam, golden fallen leaves on the floor, a tiny lab device at her side; the edges dim to dark teal-navy. Palette: teal, pale cyan, white, wood brown, gold, dark navy background.

### `kafka`: Кафка (5★, Небытие, молния) — готово 30.10.2026
Оригинал: `refs/kafka.png`. Кафка среди больших чёрных зонтов под дождём, розово-фиолетовая подсветка на земле, вдалеке тёмный силуэт.
> Hero: Kafka: wine-purple hair, purple-pink eyes, dark sunglasses pushed up, a white shirt, a long black coat with red details, red gloves, black shorts, a long sword. Pose: standing at ease and half turned toward the viewer, one hand lifting the coat, a calm dangerous smile. Scene: five big black umbrellas open at different angles above and around her, fine rain lines, a magenta-violet glow on the ground under her feet, a faint tall dark silhouette under an umbrella far behind; the edges dim to near-black purple. Palette: violet, magenta, pink-violet, black, white accent, dark purple background.

### `silverwolf`: Серебряный Волк (5★, Небытие, квант) — готово 30.10.2026
Оригинал: `refs/silverwolf.png`. Серебряный Волк сидит в потоке пиксельных блоков и голографических экранов, вокруг мини-версии героини, игровая консоль-доска.
> Hero: Silver Wolf: silver-grey hair in a ponytail with a dark bow, pale blue eyes, blue goggles on her head, a dark crop jacket with white fur collar and blue lining, a short skirt, thigh straps, boots. Pose: lounging on a floating game console like a surfboard, one hand holding a handheld console, a smug smile. Scene: a vertical stream of violet and cyan pixel blocks, holographic pink triangle and cursor icons, tiny chibi copies of herself, a dark blue swirl behind; the edges dim to deep navy. Palette: indigo, pink-violet, cyan, white, black, dark navy background.

### `blade`: Блэйд (5★, Разрушение, ветер) — готово 30.10.2026
Оригинал: `refs/blade.png`. Блэйд стоит на каменной плите среди красных паучьих лилий, сзади тёмное небо и сухие ветви, внизу висит меч.
> Hero: Blade: long dark blue-black hair with a red streak, red eyes, a long black coat with a red-lined cape, grey trousers, bandaged hand, a long curved sword held point-down. Pose: standing tall and still, both hands on the sword hilt in front of him, grim face. Scene: a stone slab at his feet surrounded by clusters of red spider lilies, dead branches and a dark teal sky, a pale moon, a faint mist; the edges dim to near-black green. Palette: blood red, black, dark teal, mint green wind hints, grey, dark green background.

### `bailu`: Байлу (5★, Изобилие, молния) — готово 30.10.2026
Оригинал: `refs/bailu.png`. Байлу плывёт под водой среди рыб, кораллов и пузырьков, ярко-голубая толща.
> Hero: Bailu: pale lavender hair with a long twin braid, small horns, big teal-green eyes, a white-and-blue robe with gold tassels and teal bracelets, a small dragon tail. Pose: swimming upward with her arms out in a playful dive, cheeks puffed, delighted face. Scene: a bright blue underwater scene with sunbeams from the top, orange and yellow-striped fish, pink and orange coral at the bottom, round bubbles; the borders darken to deep blue. Palette: turquoise, bright blue, lavender, soft green, pink coral, white, deep blue background.

### `yanqing`: Яньцин (5★, Охота, лёд) — готово 30.10.2026
Оригинал: `refs/yanqing.png`. Яньцин в прыжке, вокруг светящиеся ледяные мечи, внизу город-корабль Сяньчжоу в дымке.
> Hero: Yanqing: golden-blond hair tied in a high ponytail with a pink tassel, golden eyes, a white-and-dark-blue Xianzhou outfit with a pink tassel and a dark sash, white trousers, black-and-white boots, a long sword. Pose: leaping with one leg raised and the sword in his hand, a bright open smile. Scene: three glowing ice-blue flying swords circling him, a curve of pale blue ice, a wooden deck and the towers of a Xianzhou ship city in mist below, white clouds; the edges dim to deep blue. Palette: pale cyan, white, deep blue, gold hair, wood brown, dark navy background.

### `clara`: Клара (5★, Разрушение, физический) — готово 30.10.2026
Оригинал: `refs/clara.png`. Клара сидит в снегу на камнях, за спиной огромный тёмный Сварог с меховым воротником.
> Hero: Clara: short white hair, red eyes, a white-and-red coat with a fur collar, bare feet, a red ribbon. Pose: sitting on a stone with her feet drawn up, a doll in her hands, looking calmly at the viewer. Scene: the giant dark grey boxy robot Svarog towering behind her with a furred collar, its big fist beside her, drifting snowflakes, a stone-paved ground; the edges dim to dark slate-blue. Palette: steel grey, red, white, dark navy, a touch of pale blue, dark slate background.

### `lynx`: Рысь (4★, Изобилие, квантовый) — готово 30.10.2026
Оригинал: `refs/lynx.png`. Рысь у кемпинговой палатки с лампочкой, зелёное северное сияние, снег и силуэт собаки.
> Hero: Lynx: short golden-blond hair with a fluffy white-and-blue fur hat, blue eyes, a teal-blue winter coat with white fur, mittens, boots. Pose: sitting in a folding camp chair holding a steaming cup, glancing sideways with a gentle smile. Scene: a warm lit orange tent behind her with a bulb, a green-teal aurora across the sky, snow and frost at the bottom, a dark dog's head silhouette in the lower corner; the edges dim to dark blue. Palette: aurora green, warm orange, ice blue, white, deep blue, indigo accent, dark navy background.

### `luka`: Лука (4★, Небытие, физический) — готово 30.10.2026
Оригинал: `refs/luka.png`. Лука на боксёрском ринге в свете прожектора, большие экраны, огромные перчатки со звездой, канаты и клетка.
> Hero: Luka: spiky red hair, a bandaged face and hands, a short torn red-white jacket, black trousers with a belt, a metal brace on one leg, black boots, one boxing glove on his fist. Pose: a boxer's stance with raised fists, looking forward with a confident grin. Scene: a spotlight cone from above, ring ropes and a cage fence, two big TV screens with abstract light, giant blue boxing gloves with white stars at the bottom; the edges dim to dark brown-black. Palette: red, warm gold, blue, white, steel grey, dark brown background.

### `sushang`: Сушан (4★, Охота, физический) — готово 30.10.2026
Оригинал: `refs/sushang.png`. Сушан сидит на ветке золотого гинкго, красные ленты, облака, птичка, меч.
> Hero: Sushang: long brown hair in a braid with a bell ornament, light eyes, a white-and-yellow Xianzhou outfit with a dark sash and red ribbons, boots, a slim sword. Pose: sitting on a thick branch, one leg dangling, the sword resting on her shoulder, a carefree smile, a small bird nearby. Scene: a big tree with golden ginkgo leaves filling the upper picture, red ribbons tied to the branch, white clouds and blue sky peeking at the bottom; the edges dim to dark warm brown. Palette: gold, yellow, white, red ribbons, sky blue, brown, dark brown background.

### `xueyi`: Сюэи (4★, Разрушение, квант) — готово 30.10.2026
Оригинал: `refs/xueyi.png`. Сюэи сидит в арке-капсуле, вокруг механические шестерни, цепи и красно-синий узорный венок.
> Hero: Xueyi: short dark brown hair, calm dark eyes, a white-and-teal Xianzhou judge outfit with a black sleeve and red details, white stockings, black shoes. Pose: sitting upright and still in a throne-like frame, hands lightly resting, a serious face. Scene: an ornate stone arch around her, brass gears, chains and mechanical fixtures on both sides, a red-and-blue radial leaf ornament of the Order behind; the edges dim to dark red-indigo. Palette: deep red, cobalt blue, brass, white, teal, indigo accents, dark navy-maroon background.

### `tingyun`: Тинъюнь (4★, Гармония, молния) — готово 30.10.2026
Оригинал: `refs/tingyun.png`. Тиньюнь полулёжа, лис рядом, огромный пушистый хвост, золотые гонги, барабаны, коробки, красные ткани.
> Hero: Tingyun: black hair with a white-red fox-ear headpiece, fox ears and a big fluffy brown fox tail, amber eyes, a red-and-white short kimono-style dress with a black collar and gold embroidery, long red-teal sleeves, sandals. Pose: lounging with her hands behind her head, one knee raised, a playful smile, a small white fox at her feet. Scene: big golden gongs and lantern-shaped drums, antique wooden boxes, coins and tassels, long red silk draped across the picture; the edges dim to dark brown-maroon. Palette: red, gold, brown, white, teal, dark maroon background.

### `hanya`: Ханья (4★, Гармония, физический) — готово 30.10.2026
Оригинал: `refs/hanya.png`. Ханья сидит среди бумаг и книг, вокруг синий призрачный огонь, у стены свитки, рядом кошка.
> Hero: Hanya: long silver-grey hair, ice-grey eyes, a dark navy ornate robe with gold trim, a long skirt, a dark hair ornament. Pose: sitting cross-legged on a rug with a brush and a scroll, her gaze lowered, a serious cool face. Scene: stacks of old books and scrolls around her, scattered paper sheets on the floor, a calm cat, several blue ghost flames floating, purple stone walls; the edges dim to dark indigo. Palette: indigo, blue ghost-fire cyan, paper cream, silver, violet, dark purple background.

### `qingque`: Цинцюэ (4★, Эрудиция, квант) — готово 30.10.2026
Оригинал: `refs/qingque.png`. Цинцюэ с мацзян-костями, огромный развёрнутый свиток-чертёж, зелёные звёзды, облака, маленькая Цинцюэ спит в пузыре.
> Hero: Qingque: short light-brown hair with a green hair ornament, green-gold eyes, a green-and-black cropped jacket with a white short skirt, black gloves, brown boots, glowing green mahjong tiles. Pose: standing in a spin with one hand tossing glowing mahjong tiles into the air, a sly delighted smile. Scene: a giant unrolled scroll of drawings behind her, soft cream cloud puffs, a green four-pointed star flare, a small sleeping Qingque in a bubble at the bottom corner; the edges dim to dark teal. Palette: jade green, teal, cream, gold, black, dark teal background.

### `yukong`: Юйкун (4★, Гармония, мнимый) — готово 30.10.2026
Оригинал: `refs/yukong.png`. Юйкун сидит на кровле корабля Сяньчжоу на закате, рядом маленькая лисичка, большой белый змей-кайт.
> Hero: Yukong: a fox-eared woman with long dark blue-green hair and a fluffy tail, a dark navy Xianzhou uniform with gold trim, a pale blue sleeve, black boots. Pose: sitting on a ship roof with one knee up and a hand resting on it, looking into the distance with grief and resolve, a small fox-eared child next to her. Scene: a golden orange sunset sky filling the picture, the curved tiled roof of a Xianzhou ship, a big white-and-blue kite pennant at the bottom, drifting birds; the edges dim to dark red-brown. Palette: warm orange, gold, navy blue, white, teal, amber background darkening to maroon.

### `guinaifen`: Гуйнайфэнь (4★, Небытие, огонь) — готово 30.10.2026
Оригинал: `refs/guinaifen.png`. Гуйнайфэнь выдувает огонь, рядом два льва для танца льва, красные искры, стол с вазой.
> Hero: Guinaifen: orange-pink hair in twin tails with red ribbons, amber eyes, a red-and-white short Chinese-style dress with a white skirt and black trim, dark stockings, boots, a fire-breathing torch. Pose: striking a performer's pose with a torch in each hand, blowing a stream of fire above her, a cheerful grin. Scene: a huge arc of orange flames curling over her, two white-and-gold lion-dance heads at the bottom, a small wooden table with a vase, scattered red petals and embers; the edges dim to dark maroon-black. Palette: orange, yellow, red, white, gold, dark maroon background.

### `jingyuan`: Цзин Юань (5★, Эрудиция, молния) — готово 30.10.2026
Оригинал: `refs/jingyuan.png`. Цзин Юань сидит за доской го, рядом большой белый лев, свечи и ароматный дым в форме ореола.
> Hero: Jing Yuan: long silver-white hair in a high ponytail with a red streak, golden eyes half closed, black-and-gold general's armour, red trousers, tall boots. Pose: sitting relaxed on a low stool with one knee bent and a hand resting on it, a go board before him, a faint smile. Scene: a large white lion-like spirit beast lying behind him, two lit candles, curling white incense smoke shaped into a symmetrical halo above his head, a wooden floor with a rug; the edges dim to dark brown-violet. Palette: white, gold, black, red accent, soft violet lightning hints, dark purple-brown background.

### `luocha`: Лоча (5★, Изобилие, мнимый) — готово 30.10.2026
Оригинал: `refs/luocha.png`. Лоча стоит на колене на травяном островке среди белых лилий у бирюзового пруда, позади каменный гроб.
> Hero: Luocha: long cream-blond hair, gentle green eyes, a white-and-green long robe with gold trim, white gloves, tall boots. Pose: kneeling on one knee by the water, one hand resting on his knee and the other near a lily, a kind quiet face. Scene: a small grassy island with white lilies and irises, a pond of turquoise water with ripples in the lower third, a pale stone coffin-like slab behind him, soft green light; the edges dim to dark olive-teal. Palette: soft green, cream, white, turquoise, gold, dark olive background.

### `imbibitor`: Дань Хэн: Пожиратель Луны (5★, Разрушение, мнимый) — готово 31.10.2026
Оригинал: `refs/imbibitor.png`. Дань Хэн: Пожиратель Луны с зелёными рогами стоит над водой, вокруг огромный бирюзовый дракон, жёлтая луна.
> Hero: Dan Heng Imbibitor Lunae: long dark hair, teal-green glowing horns, teal-green eyes, a white-and-teal robe with a black sash, a long spear. Pose: standing on the water with the spear held at his side, a stern calm face. Scene: a huge coiled teal-green Eastern dragon surrounding him from above, a round yellow-gold moon, flying water droplets and splashes, a white lotus under his feet; the edges dim to dark teal-navy. Palette: teal, mint green, white, gold moon, deep navy, dark green-blue background.

### `fuxuan`: Фу Сюань (5★, Сохранение, квант) — готово 31.10.2026
Оригинал: `refs/fuxuan.png`. Фу Сюань в высокой раме, по бокам фиолетовые полотна с символами, созвездия, шашечный пол, чёрная сфера наверху.
> Hero: Fu Xuan: long pink-lilac hair with a golden hair ornament, pink eyes, a golden mark on her forehead, a purple-and-gold dress with a high collar, white stockings, small shoes. Pose: standing with one arm raised toward the stars, the other hand lowered holding a glowing divination ring, a calm face with closed eyes. Scene: two tall purple banners with abstract glyphs hanging on both sides, thin constellation lines in a violet starry void, a chessboard-like floor of purple and gold tiles, a dark round sphere at the top; the edges dim to deep purple. Palette: violet, gold, pink, indigo, white, dark purple background.

### `jingliu`: Цзинлю (5★, Разрушение, лёд) — готово 31.10.2026
Оригинал: `refs/jingliu.png`. Цзинлю парит над кристаллами, лунный свет, фиолетово-синие кристаллические лотосы, тёмные руки под ногами.
> Hero: Jingliu: long silver-white hair, red eyes, a dark blue-and-white dress with a black bodice, a long thin sword hanging down in one hand. Pose: floating upright above the surface with her eyes half closed, a cold remote expression. Scene: a pale full moon in a dark blue night, sharp blue-violet ice crystals shaped like lotuses around her feet, a violet starry water below with dark ghostly hands rising from it, a thin vertical line of light from the sword tip; the edges dim to near-black indigo. Palette: icy blue, white, violet, deep indigo, black, dark navy background.

### `topaz`: Топаз и Счетовод (5★, Охота, огонь) — готово 31.10.2026
Оригинал: `refs/topaz.png`. Топаз сидит на куче золота, золотой Счетовод рядом, весы, большая синяя планета-глобус, монеты летят.
> Hero: Topaz and Numby: Topaz has short silver-white hair with a red streak, purple eyes, a red-and-black corporate jacket with a white top, dark stockings, black boots; Numby is a small chubby golden pig-like companion. Pose: sitting with her legs crossed on a heap of gold, one hand tossing a coin, Numby on her lap, a smug smile. Scene: a pile of golden coins and ingots, a brass balance scale and a small globe at the left, white swirling lines, flying coins, a pale rose cloth at the top; the edges dim to dark navy-brown. Palette: gold, red, white, deep navy, brown, dark maroon background.

### `huohuo`: Хохо (5★, Изобилие, ветер) — готово 31.10.2026
Оригинал: `refs/huohuo.png`. Хохо среди ночных скал и сухого дерева, вокруг оранжевые бумажные лисы-талисманы, голубой призрачный огонь.
> Hero: Huohuo: a small girl with long green hair in twin tails, a black hat with a talisman, teal eyes with a frightened look, a dark green-and-black short robe, a flag-staff, a tail-like ornament. Pose: crouched slightly, clutching the staff, looking back over her shoulder in fear. Scene: dark blue rocks and a bare tree, glowing blue ghost fire, several orange paper-fox talismans floating, small pale ghosts; the edges dim to deep navy. Palette: teal, mint green, orange paper accents, blue ghost-fire, black, dark navy background.

### `argenti`: Аргенти (5★, Эрудиция, физический) — готово 31.10.2026
Оригинал: `refs/argenti.png`. Аргенти стоит на ступенях перед высоким витражом, огромный красный плащ, свечи, лепестки.
> Hero: Argenti: long red hair, green eyes, silver-white knight armour with gold trim, a huge red cape flowing to the floor, white gloves. Pose: standing at attention with a calm gentle smile, a small red rose in one hand. Scene: a tall arched stained-glass window of gold and amber behind him, stone steps with a red carpet, rows of burning candles, red rose petals drifting, broken marble; the edges dim to dark red-black. Palette: crimson, silver, gold, white, amber, dark maroon background.

### `ratio`: Доктор Рацио (5★, Охота, мнимый) — готово 31.10.2026
Оригинал: `refs/ratio.png`. Доктор Рацио шагает среди золотых руин и колонн, бело-голубая линия света пересекает кадр.
> Hero: Dr. Ratio: short dark blue-purple hair, golden eyes behind a calm gaze, a white jacket with blue trim over a black vest, blue trousers, black gloves, a golden laurel on his head. Pose: striding forward in a dynamic stylish pose, one hand lifted with a pointing finger. Scene: broken marble columns and golden dust, thin floating lines of golden Greek-style script as plain shapes with no readable letters, a bright cyan-white beam crossing from the upper-left; the edges dim to dark navy. Palette: gold, cream, deep blue, cyan-white beam, dark navy background.

## Коллаборации и CCC

Оригинальных Splash Art у них нет, и скачать их с вики HSR нельзя. Референсом служит арт самого героя: приложи официальный рендер или страницу героя из его игры, для героинь CCC используй `content/CCC/*.png` (Makoto Mine, Amanda Miller, Talleah of Avia and robots). Сцена придумана заново: героя ставим в динамичную позу на фоне простого символа его мира.

Общий стиль для коллабораций (вставлять вместо общего стиля выше):

> Authentic 16-bit era pixel art character splash illustration, as drawn for the character screen of a 1998 PC game. Portrait orientation, aspect ratio 5:7, built on a strict 200 × 280 logical pixel grid: every logical pixel is one flat solid block of exactly 10 × 10 real pixels (2000 × 2800 pixels in total), perfectly aligned to the grid. Chunky clearly visible square pixels, stepped pixelated outlines (jaggies), hand-placed checkerboard dithering, limited 48-colour palette, strictly no anti-aliasing, no smooth gradients, no blur, no glow halos, no 3D render, no photo look. The picture fills the whole canvas edge to edge: no transparent or white background, no frame, no border, no card UI, no text, no letters, no logo, no watermark. Composition: exactly ONE character, the whole body visible from head to feet, centred horizontally, about 75 to 80 percent of the picture height, the top of the head at about 11 percent and the feet at about 89 percent, head, torso and legs inside the central quarter of the width; props and effects may spread wider. This is an original scene, not a copy of any existing artwork: a dynamic key-art pose against a simple symbolic background from the character's own world, filling the canvas; the outer quarter of each side and the top and bottom edges fade to a dark, low-contrast tone so the picture can sit on a dark space background; the upper-left corner is calm and dark. The character is the brightest and most saturated element. Light from the top-left, hard-edged cel shading, a continuous 1-logical-pixel dark outline around the character, clear readable pixel-art face with 2 to 3 pixel eyes and a bright 1-pixel highlight. Use the attached character art only to get the face, hair, eyes and outfit right.

### Zenless Zone Zero

### `miyabi`: Хосими Мияби (5★, Охота, лёд) — готово 31.10.2026
> Hero: Hoshimi Miyabi: long straight black hair with blunt bangs, black fox ears, red eyes, a teal-and-white Section 6 uniform with gold trim, a katana. Pose: a calm iai stance, one hand on the sheath and the other on the hilt, eyes narrowed. Scene: thin pale-blue frost slashes crossing behind her, a thin crescent moon, the blurred neon skyline of a city far below, drifting frost flakes. Palette: pale cyan, white, teal, black hair, red eyes accent, dark navy background.

### `yanagi`: Цукисиро Янаги (5★, Небытие, молния) — готово 31.10.2026
> Hero: Tsukishiro Yanagi: long pink-rose hair, glasses, a white-and-black Section 6 uniform with a black bow, a headset, a naginata with a small clock on the blade. Pose: standing straight with the naginata planted beside her, a composed focused look. Scene: violet lightning arcs coiling around the blade, a big pale full moon behind her, a tall stack of papers at one side, the clock showing the late hour. Palette: violet, white, rose pink, black, soft gold, dark purple background.

### `billy`: Билли Кид (4★, Эрудиция, физический) — готово 31.10.2026
> Hero: Billy Kid: an android with a black face visor showing two glowing yellow star eyes, spiky white hair, a red jacket, black trousers, two revolvers. Pose: crossing both revolvers in front of his chest in a heroic stance, a long red scarf flying. Scene: a night sky with large yellow four-pointed stars and a faint old TV screen glow, a Starlight Knight emblem silhouette, sparks from the muzzles. Palette: red, yellow, white, black, steel grey, dark navy background.

### `nicole`: Николь Демара (4★, Небытие, квантовый) — готово 31.10.2026
> Hero: Nicole Demara: long pink hair in two wavy twintails, green eyes, a black cropped jacket with white fur trim, black shorts, a heavy gadget cannon on a strap at her side. Pose: flipping a gold coin with her thumb, a sly grin, one hip out. Scene: swirling gold coins and glowing violet-pink bank-vault light, a faint sunbeam from above, a small sleeping city skyline far below. Palette: pink, violet, gold, black, green accent, dark purple background.

### `anby`: Энби Демара (4★, Охота, молния) — готово 31.10.2026
> Hero: Anby Demara: short silver-white hair, orange eyes, big black headphones, a lime-green jacket with black details, a demon-blade katana. Pose: a low crouching stance with the blade drawn halfway and electric sparks racing over it. Scene: yellow-green lightning arcs, a rooftop edge at night with the neon city of New Eridu below, a faint cassette-tape reel in the sky. Palette: lime green, yellow, white, black, orange eyes accent, dark navy background.

### Wuthering Waves

### `phrolova`: Фролова (5★, Память, квантовый) — готово 31.10.2026
> Hero: Phrolova: pale young woman with long greyish-white hair in braids held by red clasps, the right half of her face covered by a white bandage, a red dress with a light pink underside and a grey skirt, detached sleeves, black leggings, a violin and bow. Pose: standing with the violin tucked under her chin and the bow lifted, eyes half closed. Scene: a tall faint masked figure in a long dress standing behind her like a shadow, drifting sheet music and music-box gears, red petals; deep black and wine red surroundings. Palette: red, black, pale grey, soft pink, indigo accents, dark crimson-black background.

### `scar`: Скар (5★, Разрушение, огонь) — готово 31.10.2026
> Hero: Scar: tall slim young man with spiky white hair that is red underneath, several scars on his face including one through his left eye, a red right eye and a grey left eye, golden ankh earrings, a grey jumpsuit, a black left arm. Pose: leaning forward with a wide grin, the black arm stretched out with flames curling over it, a small carved black lamb figure in the other hand. Scene: orange and red flames swirling upward behind him, burnt ruins and ash drifting, a few white lamb-shaped smoke wisps. Palette: red, orange, black, white hair, grey, dark maroon background.

### KonoSuba

### `kazuma`: Казума Сато (4★, Радость, ветер) — готово 31.10.2026
> Hero: Kazuma Satou: an ordinary young man with short brown hair, green eyes, a sly grin, a green-teal hooded cape over a light tunic, a katana, brown boots. Pose: stepping forward with one hand outstretched and fingers curled, a stolen coin pouch dangling from his other hand. Scene: a bright fantasy town street of Axel with timber houses and flags, a swirl of mint-green wind and flying coins around him, a pale blue sky. Palette: mint green, teal, warm brown, cream, sky blue, dark teal background.

### `aqua`: Аква (5★, Изобилие, лёд) — готово 31.10.2026
> Hero: Aqua: long light-blue hair in a hair ring, blue eyes, a blue-and-white outfit with a translucent pink hagoromo sash, detached sleeves, golden hem. Pose: standing on one foot with a folding fan open in her raised hand, a proud beaming smile. Scene: spiralling ribbons of clear water and sparkling bubbles around her, flowers bursting from the fan, small ice crystals, a soft pale blue glow. Palette: aqua blue, white, pale pink, gold, deep blue, dark navy background.

### `megumin`: Мегумин (5★, Эрудиция, огонь) — готово 31.10.2026
> Hero: Megumin: short black hair, red eyes, a big black witch hat, an eyepatch, a red dress with a black cape, a long staff with a red crystal. Pose: the staff raised high in both hands, the cape whipping in the wind, a triumphant face. Scene: a huge crimson magic circle glowing in the sky above, a big orange explosion mushroom cloud far behind, flying embers. Palette: crimson, orange, black, white sparks, dark maroon background.

### `darkness`: Даркнесс (5★, Сохранение, физический) — готово 31.10.2026
> Hero: Darkness (Lalatina): long blonde ponytail, blue eyes, polished silver knight armour with gold trim and a short skirt guard, a big two-handed sword. Pose: standing braced and unyielding with the greatsword planted in front of her and both hands on the hilt, a stern proud face. Scene: golden light streaming from behind her, a sturdy stone castle wall, drifting dust and a faint holy cross of light. Palette: silver, gold, white, deep blue, warm cream, dark navy background.

### Persona 4

### `yu`: Ю Наруками (5★, Охота, молния) — готово 31.10.2026
> Hero: Yu Narukami: a teenage boy with neat silver-grey bowl-cut hair, grey eyes, a calm face, a dark school uniform, a katana. Pose: a ready stance with the katana held low, the other hand open. Scene: the towering black-armoured Persona Izanagi behind him with a long sword, a shattering blue tarot card in the air, blue-white lightning arcs, a faint fog of a TV-world sky. Palette: electric violet, white, steel blue, black, grey, dark purple background.

### `yosuke`: Ёсуке Ханамура (4★, Небытие, ветер) — готово 31.10.2026
> Hero: Yosuke Hanamura: a teen boy with tousled light-brown hair, orange headphones around his neck, a school shirt with an open jacket and a yellow scarf, two kunai-like daggers. Pose: spinning in a quick dash, a dagger in each hand, a cheeky grin. Scene: mint-green wind slashes circling him, the green-armoured Persona Susano-o as a hazy shape behind him, floating leaves. Palette: mint green, orange accent, white, warm brown, dark teal background.

### `chie`: Тиэ Сатонака (4★, Разрушение, лёд) — готово 31.10.2026
> Hero: Chie Satonaka: an energetic teen girl with a short brown bob, brown eyes, a green track jacket over a school uniform, sneakers. Pose: a high flying kick, hair and jacket flying, a fierce smile. Scene: a burst of pale blue ice shards from the kick, the yellow-and-white Persona Tomoe as a faint shape behind her, speed lines, a faint cracked floor. Palette: pale cyan, green, yellow, white, deep blue, dark navy background.

### `yukiko`: Юкико Амаги (4★, Изобилие, огонь) — готово 31.10.2026
> Hero: Yukiko Amagi: a graceful teen girl with long straight black hair, dark eyes, a pink kimono with a white obi, a folding war fan. Pose: standing with an open fan raised before her face, a quiet gentle smile. Scene: warm orange flames and sakura petals around her, the Persona Konohana Sakuya as a hazy fire-red shape behind her, an old paper lantern. Palette: orange, pink, red, cream, black hair, dark maroon background.

### `kanji`: Канджи Тацуми (5★, Разрушение, физический) — готово 31.10.2026
> Hero: Kanji Tatsumi: a big tough teen with bleached blond slicked-back hair, piercings, a black school jacket draped over his shoulders, a skull T-shirt. Pose: a wide stance with a huge steel folding chair held over his shoulder, a loud fierce grin. Scene: the armoured Persona Take-Mikazuchi as a hazy shape behind him, grey steel sparks and cracks in the floor, a faint hint of a knitted bunny hanging from his pocket. Palette: steel grey, white, black, gold hair, orange sparks, dark slate background.

### `rise`: Рисэ Кудзикава (5★, Гармония, мнимый) — готово 31.10.2026
> Hero: Rise Kujikawa: a former teen idol with reddish-brown hair in twin tails, brown eyes, a short white-and-pink idol stage outfit, a microphone. Pose: one hand reaching out to the viewer and the other holding the microphone, a bright real smile. Scene: the Persona Himiko floating behind her with a scanner visor, glowing golden scanning rings, pink-and-gold sparkles and stage lights. Palette: golden yellow, pink, white, cream, brown, dark brown-purple background.

### Cosplay Convention Crisis

Героини из новеллы автора, облик как в игре и в `content/CCC/*.png`. Сцены без откровенных поз и одежды: арт показывают в общем интерфейсе.

### `makoto`: Макото Майн (5★, Охота, мнимый) — готово 31.10.2026
> Hero: Makoto Mine: a young Japanese woman with very long straight pitch-black hair down to her lower back, fake round glasses, a playful sly smile, a sleek red-and-black thief jacket over a college outfit. Pose: balancing lightly on tiptoe, one hand holding a small envelope with a red cat sticker between two fingers, the other raised in a goodbye wave. Scene: a convention hall with hanging cosplay banners and a spotlight, cosplayer silhouettes far below, golden dust and drifting playing cards. Palette: red, black, golden yellow, cream, dark brown-purple background.

### `amanda`: Аманда Миллер (5★, Сохранение, ветер) — готово 31.10.2026
> Hero: Amanda Miller: a young woman with short blond hair to her shoulders, green eyes, a green-and-black superhero costume with a glowing green ring on her hand. Pose: flying up in a superhero stance, a fist forward and the ringed hand glowing, a confident smirk. Scene: a convention centre hall with banners and a big starship poster, a swirl of mint-green wind and light from the ring, floating paper flyers. Palette: mint green, black, white, warm cream, dark teal background.

### `talleah`: Таллея из Авии (5★, Память, квантовый) — готово 31.10.2026
> Hero: Talleah of Avia: an alien princess-hero with light-blue skin, silvery-white hair, bright big expressive eyes, a blue sleeveless alien skinsuit, metallic forearm bands, a thin head harness, a sleek alien blaster. Pose: standing with the blaster raised and an open palm held forward, a brave focused face. Scene: a violet-purple sky with two pale moons, the white spires of a royal palace, five slim white-and-blue gynoid guards in a neat row far below, drifting light motes. Palette: indigo, violet, white, light blue, silver, dark purple background.

Промпты следующих героев добавляются по мере их появления в игре.

## Журнал

Готово 64 из 64 артов (30.10.2026–31.10.2026): все 44 арта героев HSR (`himeko`, `march`, `danheng`, `welt`, `natasha`, `serval`, `asta`, `arlan`, `herta`, `gepard`, `bronya`, `seele`, `sampo`, `hook`, `pela`, `ruanmei`, `kafka`, `silverwolf`, `blade`, `bailu`, `yanqing`, `clara`, `lynx`, `luka`, `sushang`, `xueyi`, `tingyun`, `hanya`, `qingque`, `yukong`, `guinaifen`, `jingyuan`, `luocha`, `imbibitor`, `fuxuan`, `jingliu`, `topaz`, `huohuo`, `argenti`, `ratio`, `trail-m`, `trail-f`, `trail_p-m`, `trail_p-f`) и все 20 артов коллабораций (`miyabi`, `yanagi`, `billy`, `nicole`, `anby`, `phrolova`, `scar`, `kazuma`, `aqua`, `megumin`, `darkness`, `yu`, `yosuke`, `chie`, `yukiko`, `kanji`, `rise`, `makoto`, `amanda`, `talleah`). Референсы HSR и коллабораций лежат в `refs/` (не попадают в git).
