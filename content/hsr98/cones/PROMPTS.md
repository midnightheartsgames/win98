# Арт световых конусов HSR 98: промпты

Картинки генерируются в ChatGPT, Gemini или Grok. Обработку и подключение в игру делает `tools/hsr-cone-pix.py`.

## Как делать

1. Открой чат с генерацией картинок. Приложи Full Artwork конуса как референс и вставь общий стиль и промпт конуса.
2. Сохрани результат в любую папку. Имя файла: ключ конуса, например `postop.png`.
3. Запусти `python tools/hsr-cone-pix.py postop путь/к/postop.png`.
   - Скрипт обрежет картинку до 5:7, уменьшит до 160 × 224, сведёт палитру (по умолчанию 48 цветов) и положит результат в `content/hsr98/cones/postop.png`.
   - Затем он пересоберёт `js/apps/hsr98/hsr-cone-pix.js`, который игра читает.
   - Ключи: `--colors 32` (меньше цветов), `--cell 2` (крупнее пиксели), `--crop 0,0.1,1,0.9` (своя рамка в долях), `--preview файл.png` (увеличенный просмотр).
4. Конус без картинки рисуется сценой из кода, как раньше.

## Общий стиль (вставлять в начало каждого промпта)

Стиль автора, проверен на «Стрелах» (Gemini, затем pixelartvillage.com):

> Authentic low-res 16-bit pixel art illustration for a 1990s JRPG card (SNES / early PlayStation era). Portrait orientation, aspect ratio 5:7. Chunky, clearly visible square pixels, distinct pixel grid, stepped pixelated outlines (jaggies), heavy pixelation. Limited 32-color palette, heavy checkerboard dithering for shading, strictly no anti-aliasing, no smooth vector lines, no high-res gradients. No text, no logo, no frame, no border, no card UI. Use the attached artwork only as reference for the scene, characters, outfits and mood: draw a completely new composition, not a 1:1 copy. Clear, readable pixel-art faces and hands.

Готовый пиксель-арт обрабатывается с ключом `--pixel`: скрипт находит сетку пикселей (у «Стрел» одна клетка = 10 точек, около 172 × 243 клеток), берёт по точке из каждой клетки, срезает однотонную рамку и вырезает середину 160 × 224 без масштабирования, так что пиксели остаются квадратными 1 : 1. Пример: `python tools/hsr-cone-pix.py arrows arrows.png --pixel --colors 64`. Если клеток меньше 160 × 224, картинка растягивается по ближайшему соседу, и часть пикселей становится шире соседних (так вышло у «Беседы после операции»: 728 × 1024, клетка 5 точек, 145 × 204 клеток). Лучше сохранять картинку так, чтобы клеток было не меньше 160 × 224, например 1728 × 2432 при клетке 10 точек. Цвета сводятся октодеревом (`FASTOCTREE`), оно сохраняет мелкие яркие пятна: красную ленту, синие перчатки, свет в банке.

## Промпты

### `arrows`: Стрелы (3★, Охота) — готово 22.10.2026
> A white unicorn-like stag with a flowing golden-white mane rearing up among dark pines with flat golden-rimmed crowns, a huge pale golden sun disc behind it, turquoise water and spear heads pointing in from the edges, small blue spirit lights. Dark green and gold palette.

### `cornucopia`: Рог изобилия (3★, Изобилие) — готово 22.10.2026
> Giant golden wheat ears framing a round swirling window that shows a peaceful valley with blue mountains, a river, green hills and terraced fields; cream sky; teal grass and a golden wave in the corners.

### `collapsing`: Падение небес (3★, Разрушение) — готово 22.10.2026
> A dark ruined watchtower with a torn flag, tilted, in front of an enormous orange sun; large stylised flames bursting from behind it; billowing cream clouds with red outlines at the bottom; dark grainy sky.

### `amber`: Янтарь (3★, Сохранение) — готово 22.10.2026
> A faceted pale crystal shell holding a glowing amber stone with a golden crescent inside, floating in a starry dark-blue void; white jagged streaks above, violet lightning bolts, teal ribbons curving along the sides, small cream clouds in a corner.

### `void`: Пустота (3★, Небытие) — готово 22.10.2026
> A black hole at the top with a bright rim, spiral arms of dark blue ink swirling down the whole image, small planets around it (blue, glowing pale-blue, orange with a golden halo, dark ones with golden edges).

### `chorus`: Хор (3★, Гармония) — готово 22.10.2026
> A golden four-pointed star with a flower in the centre, radiating thin golden rays inside a dark arch; around it white flame-headed dancing figures holding hands in a heart-shaped ring; blue waves rising from below.

### `databank`: База данных (3★, Эрудиция) — готово 22.10.2026
> A tall old library seen from below: tilted wooden shelves with red and brown books marked with golden diamonds, a teal patterned wall, ladders, hanging lamps; a golden Erudition emblem (four-pointed stars, two arcs, an open book) glowing in the upper half; white paper-like waves with gold edges at the bottom corners.

### `postop`: Беседа после операции (4★, Изобилие) — готово 22.10.2026
> Natasha from Honkai: Star Rail (blue-teal shoulder-length hair, tired red eyes, white medical mask, black high collar, white doctor's coat, green vial pendant, red ribbon on her arm, blue surgical gloves) sitting by a hospital bed, gently holding the bandaged forearm of a sleeping dark-haired patient in an oxygen mask. Pale teal curtains, a jar with glowing mushrooms and medicine bottles on the bedside table. Quiet, tired, warm mood.

### `goodnight`: Спокойной ночи и мирного сна (4★, Небытие) — готово 22.10.2026
> Pela from Honkai: Star Rail (short dark purple hair, hair clip, golden hair ornament, dark uniform jacket with gold trim) asleep at her desk on a pile of papers, her glasses taken off next to her, a pen in her gloved hand. Serval (blonde, white sleeve) gently covers her with a red cloak with a golden pattern; a stack of documents, warm desk-lamp light in a dark room. Soft, cosy mood.

### `memories`: Воспоминания о прошлом (4★, Гармония) — готово 22.10.2026
> An old warm-toned photograph scene: a smiling blonde woman in a dark uniform with medals and a green sash sits on a sofa and hugs a small girl from behind; the girl (young Bronya from Honkai: Star Rail: silver drill curls, brown beret, dark dress with a ribbon, white frilly socks) sits on her lap licking a red candy, looking shy. Soft window light, slightly faded nostalgic colours.

### `swordplay`: Фехтование (4★, Охота) — готово 22.10.2026
> Sushang from Honkai: Star Rail (long brown hair in a braid with a bell ornament, yellow long-sleeved coat with purple trim, white dress) holds a slim ornate silver sword upright in front of her, looking at the blade thoughtfully, her own big sword strapped behind. Blurred warm interior with red pillars and golden light.

### `trend`: Тренд галактического рынка (4★, Сохранение) — готово 22.10.2026
> Topaz from Honkai: Star Rail (short silver hair with a red streak, dark corporate jacket with red details) stands with one hand on her hip and the other hovering over a glowing holographic globe on a pedestal; floating data panels, stock charts and neon rings around her, a dim purple-blue office, a small shadowy figure in a hat in the background.

### `underthesky`: Под голубым небом (4★, Разрушение) — готово 22.10.2026
> Two silver-haired sisters close together in a sunny meadow of white daisies and wheat: the younger one with grey eyes wears a flower crown, the older one with red eyes and a beaded necklace laughs and holds her from behind, both in light summer clothes. Bright blue sky, flower petals in the air, happy mood.

### `geniuses`: Отдых гениев (4★, Эрудиция) — готово 22.10.2026
> Ruan Mei (dark hair with pearl ornaments, eyes closed, calm) and Herta in her doll body (long grey hair, purple eyes, finger at her lips) sit at a table with green dango, small red cups and a teacup; a large black mechanical gloved hand (Screwllum) reaches in from the right, a top-hat silhouette above. Warm afternoon light, relaxed mood.

### `goodluck`: Благоприятный день (4★, Радость) — готово 22.10.2026
> A pink-haired girl in a frilly pink-and-white dress with a flower hair ornament holds playing cards to her face and peeks over them with a smug grin; behind her on a red sofa a calm silver-haired woman with a blue feather hair ornament smiles and holds a card between two fingers. A glowing purple orb and cards on the table, cosy dim room, star constellations faint in the air. Playful, mischievous mood.

### `sneering`: Насмешка (3★, Радость) — готово 22.10.2026
> A symbolic poster-like scene with no people: a dark crimson ornate arch hanging from the top like a jagged crown or theatre curtain, below it a huge grinning mouth shaped like a goblet with a row of teeth, its stem dripping down; tall flames burning on both sides, black leaves in the lower corners, a pale pink glow in the centre with thin red streaks. Unsettling, mocking mood.

### `fermata`: Фермата (4★, Небытие) — готово 22.10.2026
> Kafka from Honkai: Star Rail (wine-red hair, purple eyes, calm sly smile) relaxes in a white clawfoot bathtub, arms folded on the rim, a wine glass dangling from her fingers; a large brass gramophone horn plays beside the tub on a dark wooden stand, potted plants, a bright window with soft daylight and steam.

### `quid`: Равноценный обмен (4★, Изобилие) — готово 22.10.2026
> Bailu from Honkai: Star Rail (small dragon girl with lilac-blue hair, little horns, green eyes, blue-and-white robe with gold tassels and teal bracelets) winks and pouts while two slender hands from outside the frame playfully squeeze her chubby cheeks. Warm light, soft bokeh, cute and funny mood.

### `wildfire`: Мы — Дикий Огонь (4★, Сохранение) — готово 22.10.2026
> Young Seele from Honkai: Star Rail as a small girl (messy dark purple hair, tearful purple eyes, white puffy-sleeved shirt, red wristband) leaning against a wooden post in the snow, holding back tears, while a big rough gloved hand of an adult rests on her head from above. Cold dark Underworld street, falling snow, warm feeling of family.

### `river`: Весенние потоки рек (4★, Охота) — готово 22.10.2026
> Yanqing from Honkai: Star Rail (cheerful blond boy with golden eyes, dark blue and white Xianzhou outfit, pink tassel, white trousers rolled up) stepping barefoot into a clear sparkling stream, laughing, his sword in hand; green bamboo leaves, sun rays, a small swallow on a branch in the corner. Fresh spring mood.

### `pastfuture`: Прошлое и будущее (4★, Гармония) — готово 22.10.2026
> Yukong from Honkai: Star Rail (fox woman with long dark blue hair, fox ears and a big fluffy pale tail, dark navy Xianzhou uniform with gold trim) kneels in the ruins of a battlefield, holding a broken paper kite to her chest, looking up with grief and anger; burning embers, orange fire and smoke behind her, scorched planks on the ground.

### `woof`: Гав! Время прогулок! (4★, Разрушение) — готово 22.10.2026
> A fluffy cream-white dog floating happily in open space in a round glass astronaut helmet, eyes closed, tongue out, paws spread; a blue lanyard with an ID badge around its neck; a deep blue starry sky with a curve of a blue planet below and the edge of a space station. Cute, carefree mood.

### `breakfast`: Важность завтрака (4★, Эрудиция) — готово 22.10.2026
> Pom-Pom from Honkai: Star Rail (small black-and-white rabbit-like conductor with big blue eyes and a tall red conductor hat with a gold badge) peeks proudly over a breakfast table seen from above: sandwiches on a wooden tray, a fried egg on toast, a slice of strawberry cake, a cup of tea, a newspaper, a notebook with a pen, a camera, a phone and a photo. Warm morning light, cosy mood.

### `milkyway`: Ночь на Млечном Пути (5★, Эрудиция) — готово 22.10.2026
> Himeko from Honkai: Star Rail (long flowing crimson hair, golden eyes, elegant white-and-black dress with red ribbons, black coat with gold trim) floats gracefully through a deep blue starry night sky, eyes half closed, one hand near her face, hair and ribbons streaming in a long diagonal; star trails and the Milky Way behind her, a dark mountain ridge at the bottom. Dreamy, serene mood.

### `butthebattle`: Битва не окончена (5★, Гармония) — готово 22.10.2026
> Bronya from Honkai: Star Rail (long silver-grey hair, grey eyes, white-and-blue Silvermane officer outfit with a blue bow, black gloves) stands in profile holding her long rifle-lance upright, looking ahead with quiet resolve; behind her the huge blurred dark-steel armour of a Silvermane mecha and blue banners, cold blue light and drifting snow. Solemn, determined mood.

### `moment`: Момент победы (5★, Сохранение) — готово 22.10.2026
> Gepard from Honkai: Star Rail (short blond hair, blue eyes, white-and-blue Silvermane commander armour with gold buttons and a blue cape) strides forward in a dynamic three-quarter pose, gloved fist clenched, cape and blue scarf whipping in the wind; sparks, smoke and a burning sky behind him, a giant shield edge at the side. Heroic, unyielding mood.

### `sword_rumor`: Кровь прошлого (4★, Разрушение) — готово 22.10.2026
> A fierce young warrior with messy sandy hair and golden eyes, gritted teeth, dark armour with red sash, slashes through a stormy sea of souls; dark tentacles rise from huge waves around him, glowing bubbles and spray, a red dawn breaking behind. Furious, heroic mood.

### `masquerade`: Больше пота, меньше слёз (4★, Память) — готово 22.10.2026
> Feixiao from Honkai: Star Rail (white-haired fox-eared woman general, teal eyes, long hair in a high ponytail with teal streaks, dark green crop top, black shorts, red ribbons, bandaged hands) delivers a high kick to a heavy red punching bag in a training hall, the bag folding in half; night light from a window, sweat drops shining. Powerful, confident mood.

### `mirror`: Отражение прошлой меня (5★, Гармония) — готово 22.10.2026
> Ruan Mei from Honkai: Star Rail (long dark brown hair with flower and pearl hairpins, gentle green eyes, pale teal-and-white qipao, black lace gloves) embraces her own reflection in a large ornate golden mirror, cheek to cheek, eyes half closed; white plum blossoms drifting, red and teal silk behind. Melancholic, elegant mood.

### `night`: В ночи (5★, Охота) — готово 22.10.2026
> Seele from Honkai: Star Rail (long dark purple-blue hair, purple eyes, dark outfit with purple accents and a red ribbon, long black gloves, her big scythe) turns gracefully in the moonlit night, one arm raised, surrounded by glowing blue butterflies over a field of blue flowers; deep navy and violet palette. Lonely but brave mood.

### `patience`: Просто надо подождать (5★, Небытие) — готово 22.10.2026
> Kafka from Honkai: Star Rail (wine-red hair, purple sunglasses pushed up on her head, purple eyes, white shirt, black coat with red details, red gloves) sits at a dinner table in a tall gothic high-backed chair, smiling dangerously, a fork in her gloved hand; a steak on a plate, a wine glass, a candle and a stained-glass window behind her. Elegant, menacing mood.

### `rain`: Непрекращающийся дождь (5★, Небытие) — готово 22.10.2026
> Silver Wolf from Honkai: Star Rail (grey-blue hair with a ponytail, blue goggles on her head, oversized dark blue jacket with white fur hood, handheld game console) squats on a ledge and blows a pink bubblegum bubble, bored and smug; neon purple rain, holographic screens and pixel UI panels floating around her. Cool gamer mood.

### `unreachable`: Недоступная сторона (5★, Разрушение) — готово 22.10.2026
> Blade from Honkai: Star Rail (long dark blue hair, red eyes, dark coat with red-lined tails, bandaged arm, broken sword at his side) stands with arms crossed in a misty graveyard of swords stuck in the ground, a huge sword hilt in the foreground, dead branches, cold pale moonlight, red ribbons tied to some swords fluttering. Grim, lonely mood.

### `beforedawn`: До рассвета (5★, Эрудиция) — готово 22.10.2026
> Jing Yuan from Honkai: Star Rail (long silver-white hair in a high ponytail with a red streak, golden eyes half closed, black-and-gold general's armour, red trousers) sits relaxed and leaning back in his office chair, one hand resting on his knee, a scroll in the other, a small bird perched on his shoulder; warm sunlit study with green plants and stacked scrolls. Calm, confident mood.

### `coffin`: Эхо из гроба (5★, Изобилие) — готово 22.10.2026
> Luocha from Honkai: Star Rail (long blond hair, gentle green eyes, white-and-teal robe with gold trim) kneels beside a dark coffin wrapped in thorny black vines, his hand gripping the thorns; white lilies and irises all around, soft pale light from a window above. Calm, mysterious mood.

### `brighter`: Ярче солнца (5★, Разрушение) — готово 22.10.2026
> Dan Heng Imbibitor Lunae from Honkai: Star Rail (long dark hair, teal glowing horns, teal-green eyes, white-and-teal robe torn open at the shoulder) leans forward in a dark teal dungeon, chained by heavy chains on his raised arm, a beam of light falling on his face. Intense, defiant mood.

### `shuteyes`: Она закрыла глаза (5★, Сохранение) — готово 22.10.2026
> Fu Xuan from Honkai: Star Rail (long pink hair in twin low ponytails, eyes closed, a third-eye mark on her forehead, purple-and-gold robe) holds a glowing purple matrix orb with a golden frame in her cupped hands; a pair of large shadowy hands covers her eyes from behind, purple cosmic light and stars. Mystic, solemn mood.

### `ownsword`: Отныне я сама буду мечом (5★, Разрушение) — готово 22.10.2026
> Jingliu from Honkai: Star Rail (long white hair, red eyes with a blindfold slipped down, dark blue dress with white details) stands over moonlit ice-cold water holding a shattered sword, white lotus flowers floating, petals drifting, a full moon behind. Cold, beautiful, lonely mood.

### `blissful`: Тревога и блаженство (5★, Охота) — готово 22.10.2026
> Topaz from Honkai: Star Rail (short white hair with a red streak, purple eyes, red-and-white corporate outfit) laughs on a couch, almost buried under a pile of happy dogs and cats, her little golden piggy Numby among them, a cat batting at a feather toy, a Venetian mask nearby. Cheerful, chaotic, cosy mood.

### `fright`: Ночь страха (5★, Изобилие) — готово 22.10.2026
> Huohuo from Honkai: Star Rail (small girl with long green hair, teal eyes, black hat with a talisman, dark green robe) peeks fearfully from behind a doorframe, clutching her flag-staff weapon to her chest; glowing yellow paper talismans in the shape of little figures drift around, teal ghostly light. Scared but brave, funny mood.

### `gaze`: Остановись, мгновенье (5★, Эрудиция) — готово 22.10.2026
> Argenti from Honkai: Star Rail (long red hair, green eyes, silver knight armour with gold trim) gently raises a red rose to his lips with his eyes half closed; rose petals drifting, a pale hand reaching toward him from the right, soft white light and red roses with thorns. Romantic, devoted mood.

### `baptism`: Крещение чистой мысли (5★, Охота) — готово 22.10.2026
> Dr. Ratio from Honkai: Star Rail (short dark purple hair, golden eyes, golden laurel wreath on his head) relaxes in a bathtub up to his shoulders, arm resting on the rim, looking thoughtfully over his shoulder; an open book, floating rose petals, soap bubbles and a small yellow rubber duck, sheer white curtains and bright daylight. Calm, intellectual mood.

## Свои конусы (коллаборации и CCC)

У этих конусов нет оригинального арта, поэтому общий стиль другой: референсом служит арт самого героя (официальный рендер или страница героя на вики игры), а сцена придумана заново. Прикладывай картинку героя, а не конуса.

Общий стиль для своих конусов (вставлять в начало вместо общего стиля выше):

> Authentic low-res 16-bit pixel art illustration for a 1990s JRPG card (SNES / early PlayStation era). Portrait orientation, aspect ratio 5:7. Chunky, clearly visible square pixels, distinct pixel grid, stepped pixelated outlines (jaggies), heavy pixelation. Limited 32-color palette, heavy checkerboard dithering for shading, strictly no anti-aliasing, no smooth vector lines, no high-res gradients. No text, no logo, no frame, no border, no card UI. This is an original scene, not a copy of any existing artwork: a quiet everyday memory from the character's life, framed like a still from a film, waist-up or closer. Use the attached character art only to get the face, hair, eyes and outfit right. Clear, readable pixel-art faces and hands.

### Zenless Zone Zero

#### `shrine`: Сто процентов дыни (5★, Охота, Хосими Мияби) — готово 22.10.2026
> Hoshimi Miyabi from Zenless Zone Zero (long straight black hair with blunt bangs, black fox ears, red eyes, teal-and-white Section 6 uniform with gold trim, katana resting beside her) sits very seriously at an office table covered with melon products: melon bread, a bottle of green melon soda, melon ice cream, a bag of melon candies and a cut fresh melon. She takes a careful bite of melon bread with her eyes closed, a small notebook with a pencil in her other hand. Across the table Soukaku (small oni girl with white hair, little horns, a mask on the side of her head) slumps with a spoon in her mouth, exhausted. Evening light through blinds, a stack of untouched reports in the corner. Deadpan, funny mood.

#### `weaver`: Луна, что светит звёздам (5★, Небытие, Цукисиро Янаги) — готово 22.10.2026
> Tsukishiro Yanagi from Zenless Zone Zero (long pink-rose hair, glasses, white-and-black Section 6 uniform with a black bow, headset) works late at her office desk under a desk lamp, glasses pushed up, signing the last report from a tall stack; a half-eaten bean bun on a napkin, her naginata with a small clock on it leaning on the desk, the clock showing past two at night. Through the window a big full moon; on a sofa behind her Hoshimi Miyabi sleeps sitting up with her katana in her arms. Blue moonlight and warm lamp light. Quiet, tired, caring mood.

#### `starlight`: Звёздные рыцари не проигрывают (4★, Эрудиция, Билли Кид) — готово 22.10.2026
> Billy Kid from Zenless Zone Zero (android with a black face visor showing two glowing yellow star eyes, spiky white hair, red jacket, black trousers) sits cross-legged on the floor in front of an old CRT TV at night, polishing one of his two revolvers with a cloth, the other revolver on his knee; the TV shows a hero in shining armour striking a heroic pose in the finale of a show; a small Starlight Knight action figure on top of the TV, a cup of instant coffee he cannot drink, an old red scarf hanging on the back of a chair, a crumpled repair bill on the floor. Blue TV glow in a dark room. Earnest, cozy mood.

#### `vault`: Как купить солнце (4★, Небытие, Николь Демара) — готово 22.10.2026
> Nicole Demara from Zenless Zone Zero (long pink hair in two wavy twintails, green eyes, black cropped jacket with white fur trim, black shorts) stands at a window in a shabby old orphanage room and holds up a small hand mirror, bouncing a bright sunbeam across the wall onto the pillow of a girl lying in bed, who smiles with her eyes closed; on the windowsill an empty open wallet and a few Denny coins. Dust in the warm light. Tender, bittersweet mood.

#### `battery`: Трек без названия (4★, Охота, Энби Демара) — готово 22.10.2026
> Anby Demara from Zenless Zone Zero (short silver-white hair, orange eyes, big black headphones, lime-green jacket with black details) sits on the edge of a rooftop at night writing her name with a marker on the label of a cassette tape, a cheap cassette player and a half-eaten burger in paper beside her; the neon city of New Eridu below, a faint electric spark on the headphones. Calm, lonely-but-hopeful mood.

### Wuthering Waves

#### `lethe`: Место у окна (5★, Память, Фролова) — готово 22.10.2026
> Phrolova from Wuthering Waves (pale young woman, long greyish-white hair in braids held by red clasps, the right half of her face covered by a white bandage, a faint different hue in her left eye, red dress with a light pink underside and a grey skirt, detached sleeves, black leggings) sits on a chair by a tall window in a quiet old room filled with sheet music, gramophone records and small music boxes stacked on shelves; she tunes her violin with her eyes half closed, the bow resting on her knee; on a small saucer beside her a half-eaten redcurrant tart; outside the window a fountain glitters in a dim park with a Ferris wheel far away, and in the window glass a faint reflection of a tall masked figure (Hecate) stands behind her. Red, black and pale grey palette, soft candle light. Melancholic, quiet mood.

#### `lullaby`: Сказка о чёрном ягнёнке (5★, Разрушение, Скар) — готово 22.10.2026
> Scar from Wuthering Waves (tall slim young man with spiky white hair that is red underneath, several scars on his face including one through his left eye, red right eye and grey left eye, golden ankh earrings, grey jumpsuit, black left arm) sits cross-legged by a small campfire at night among burnt ruins, grinning widely while telling a story with lively hand gestures; a small girl wrapped in his oversized open red jacket listens beside him, hugging her knees; in his other hand a small carved black lamb figure; in the campfire smoke the faint shapes of a shepherd and a flock of white lambs. Orange firelight, dark blue night. Unsettling but tender mood.

### KonoSuba

#### `chunchunmaru`: Это был трактор (4★, Радость, Казума Сато) — готово 22.10.2026
> Kazuma Satou from KonoSuba (ordinary young man with short brown hair, green eyes, annoyed face, green tracksuit) stands in a bright white heavenly room with a single chair and points straight at Aqua; Aqua (goddess with long light-blue hair in a hair ring, blue eyes, blue-and-white outfit with a translucent pink sash) sits on the chair laughing so hard she holds her stomach, a bag of potato chips in her lap; pages of a catalog of magic swords, armour and cheat powers flutter in the air around them. Soft white and pastel light. Comedic mood.

#### `hagoromo`: Номер на бис (5★, Изобилие, Аква) — готово 22.10.2026
> Aqua from KonoSuba (long light-blue hair in a hair ring, blue eyes, blue-and-white outfit, translucent pink hagoromo sash) stands on a tavern table in the town of Axel and opens a folding fan from which a burst of flowers blooms, beaming proudly; adventurers around cheer with mugs raised and toss coins that she pushes away with her foot; in the corner Kazuma sits with his head in his hand, holding a long unpaid bill. Warm lamplight, wooden tavern. Lively, funny mood.

#### `manastaff`: Взрыв на сегодня (5★, Эрудиция, Мегумин) — готово 22.10.2026
> Megumin from KonoSuba (short black hair, red eyes, big black witch hat, eyepatch, red dress with a black cape) hangs limp and exhausted on Kazuma Satou's back as he carries her piggyback home across a grassy hill at sunset; her long staff with a red crystal drags behind; a black cat with tiny bat wings (Chomusuke) sits on her hat; behind them a fresh smoking crater from her Explosion. Orange sunset sky. Warm, funny, nostalgic mood.

#### `adamantite`: Молитва о друге (5★, Сохранение, Даркнесс) — готово 22.10.2026
> Young Darkness (Lalatina) from KonoSuba as a lonely noble girl (long blonde hair in a ponytail, blue eyes, simple elegant noble dress) kneels alone and prays with folded hands in a small quiet chapel of the goddess Eris, candles and coloured light from a stained-glass window; at the chapel door a cheerful short-haired silver-haired girl thief with a scar on her cheek (Chris) peeks in and waves at her. Soft, hopeful mood.

### Persona 4

#### `truth`: Самый вкусный омлет (5★, Охота, Ю Наруками) — готово 22.10.2026
> Yu Narukami from Persona 4 (teenage boy with neat silver-grey bowl-cut hair, grey eyes, calm face, white shirt, a simple apron) sets a perfect fluffy omelette on a low kitchen table in a cosy Japanese home in the evening; his little cousin Nanako (small girl with brown hair in two short pigtails, pink shirt) beams at the plate with a spoon in her hand; pushed to the edge of the table, three plates of burnt smoking black lumps; an old CRT TV in the corner, warm lamp light. Warm, gentle, slightly funny mood.

#### `thread`: Стежок за стежком (5★, Разрушение, Канджи Тацуми) — готово 22.10.2026
> Kanji Tatsumi from Persona 4 (big tough teen with bleached blond slicked-back hair, piercings, black school jacket draped over his shoulders, skull T-shirt) sits alone at night in his family's old textile shop under a single lamp, carefully knitting a tiny cute knitted bunny plush with deep concentration; shelves behind him full of small knitted plushies and rolls of dyed cloth; outside the shop window a little kid presses their face to the glass, staring at the plushies. Warm, secret, tender mood.

#### `affection`: Просто Рисе (5★, Гармония, Рисэ Кудзикава) — готово 22.10.2026
> Rise Kujikawa from Persona 4 (former teen idol with reddish-brown hair in twin tails, brown eyes, white headscarf, white smock) stands behind the counter of her grandmother's small old tofu shop at sunset and hands a block of tofu wrapped in paper to a customer, smiling a small shy real smile; her old grandmother sits on a stool behind her; through the shop's glass door a crowd of fans with cameras presses outside. Soft orange light. Quiet, bittersweet mood.

#### `junesday`: Каждый день в «Джунс» (4★, Небытие, Ёсукэ Ханамура) — готово 22.10.2026
> Yosuke Hanamura from Persona 4 (teen boy with tousled light-brown hair, orange headphones around his neck, a store apron over his school shirt) sits on a plastic chair at a table in a supermarket rooftop food court at sunset after his shift, chin on his hand, looking out over a small rural town; on the table a paper tray of meat skewers and a soda; colourful sale banners flutter, a big closed parasol above. Nostalgic, quietly determined mood.

#### `dragontrial`: Испытание дракона (4★, Разрушение, Тиэ Сатонака) — готово 22.10.2026
> Chie Satonaka from Persona 4 (energetic teen girl with a short brown bob, brown eyes, green track jacket over her school uniform) practises a high kung-fu kick in her small bedroom in front of an old CRT TV paused on a martial arts movie scene, a worn VHS case of the film on the floor; a big poster of a kung-fu master on the wall behind her, a half-eaten steak bowl on the desk. Energetic, funny mood.

#### `amagiinn`: Гостиница «Амаги» (4★, Изобилие, Юкико Амаги) — готово 22.10.2026
> Yukiko Amagi from Persona 4 (graceful teen girl with long straight black hair, dark eyes, a pink kimono) stands at the entrance of an old traditional Japanese inn at dusk and bows to welcome guests; behind her the waitresses in kimono and the cooks in white bow too; paper lanterns glow, light snow falls on the stone path, steam from a hot spring rises behind the roof. Warm, calm, grateful mood.

### Cosplay Convention Crisis

Героини из новеллы автора, облик как в игре и в `content/CCC/*.png`. Сцены без откровенных поз и одежды: конус показывают в общем инвентаре.

#### `cccletter`: С любовью, Макото (5★, Охота, Макото Майн) — готово 22.10.2026
> Makoto Mine (young Japanese woman with very long straight pitch-black hair down to her lower back, fake round glasses, playful sly smile, sleek red-and-black thief jacket over a college outfit) sits alone at an empty table in a convention food court early in the morning, chin on her hand, watching the entrance doors; in front of her a cup of coffee going cold and a small envelope with a red cat sticker; chairs still upturned on the other tables, a cleaner far in the background, cosplay banners hanging from the ceiling. Soft cool morning light. Quiet, waiting, slightly lonely mood.

#### `cccmagic`: Настоящая магия (5★, Сохранение, Аманда Миллер) — готово 22.10.2026
> Little Amanda Miller as a 9-year-old tomboy girl (short blond hair to her shoulders, oversized t-shirt and shorts, sneakers) stands in the crowded hall of an old 1990s sci-fi fan convention and stares up in wonder at grown-up fans in shiny silver space-crew costumes and alien masks; next to her a small boy in a home-made cardboard box helmet, his face hidden; paper banners of a starship, a crowded dealer table with toy ships. Warm sepia old-photo colours. Nostalgic, wondering mood.

#### `cccpratia`: Фиолетовые небеса Пратии (5★, Память, Таллея из Авии) — готово 22.10.2026
> Young Talleah of Avia as a teenage alien princess (light-blue skin, silvery-white hair, bright big expressive eyes, blue sleeveless alien skinsuit, metallic forearm bands, a thin head harness) sits on the stone balustrade of a white royal palace balcony and reads an old glowing book of hero tales; below spreads an alien garden city under a violet-purple sky with two pale moons; five slim white-and-blue gynoid guards stand in a neat row on the path below. Calm, dreamy, wondering mood.

#### `cccgorilla`: Портрет гориллы (4★, Небытие) — готово 22.10.2026 (автор выбрал кадр с одним портретом)
> A slightly shabby hotel room at a convention centre: two beds, a half-unpacked backpack, a superhero costume thrown on the bed; on the wall hangs a large old oil portrait of a stern gorilla whose eyes seem to follow the viewer; in the open doorway Amanda Miller (young woman, short blond hair to her shoulders, green-and-black superhero costume with a glowing green ring) leans on the door frame with her arms crossed and smirks at the portrait. Warm hotel lamp light. Funny, slightly eerie mood.

#### `cccbadge`: Бейдж? Есть. (4★, Гармония) — готово 22.10.2026
> Inside a college bus on the way to a convention in the morning: Amanda Miller (young woman, short blond hair to her shoulders, boyish hoodie and jeans) stands in the aisle and holds out her hand with a smirk; in her other hand she dangles a convention badge on a lanyard; on the seat in front a stuffed backpack, a thick convention programme and a sandwich bag; other students with costume bags, sunlight through the bus windows, a big hotel and convention centre visible ahead. Cheerful, eager mood.

#### `cccstandee`: Картонный злодей (4★, Разрушение) — готово 22.10.2026
> Talleah of Avia in a cosplay of a red-haired alien superheroine (long red wig, orange-tinted skin, purple top and skirt, bright big eyes) in the busy main hall of a cosplay convention, aiming a sleek alien blaster with a furious face at a life-size cardboard cutout of a huge purple-skinned cosmic villain with a golden gauntlet that she has just knocked to the floor; cosplayers around look at her in surprise, convention booths and banners behind. Comedic, dynamic mood.

### Закрытый тест

Героини секретного прыжка (`HSR-LAB.md`). Референс: Full Artwork оригинала. Импорт: `python tools/hsr-cone-pix.py <ключ> <картинка> --pixel --colors 64`.

#### `undeniable`: Навстречу неоспоримому (5★, Эрудиция, Великая Герта) — готово 01.11.2026
> The Herta (young woman with very long straight ash-beige hair, violet eyes, calm proud profile, a huge wide-brimmed black witch hat with a lavender underside, purple iris flowers and a thin red band; black off-shoulder corset with silver trim, long black detached sleeves with white lace cuffs, dark stockings) sits in profile on a stack of books in a dark clock-tower study at the edge of the cosmos, one hand raised thoughtfully near her chin. In front of her an open book glows with golden handwriting while a purple quill writes by itself in the air. Foreground: a round glass flask of dark violet liquid with a teal stopper, a short candle with a purple flame, an old brass key on a purple ribbon. Tall shelves fade into shadow, a starry sky shows behind her. Quiet, thoughtful mood. Palette of deep indigo, violet and silver with warm gold from the book.

#### `timeflower`: Если бы время было цветком (5★, Гармония, Трибби) — готово 01.11.2026
> Tribbie (small girl with a short bright-red bob and a little side tuft, pointed elf ears, a black headband with white flowers with blue centers, cream dress with gold embroidery and red ribbons, a golden cloud pendant, two small golden wings, one black armored gauntlet) lies asleep on her back among scattered letters and sealed envelopes, eyes closed, soft smile, warm stripes of morning sunlight across her. At the top corner a second red-haired girl leans in with a red pen, her face half hidden by hair; at the lower corner a third red-haired girl with a flower crown is seen from behind, sorting envelopes. Around them an inkwell, a red wax seal and a feather. Tender, sleepy mood. Palette of warm cream, gold and vivid red with soft sunlight.

Промпты следующих конусов добавляются на их этапах.
