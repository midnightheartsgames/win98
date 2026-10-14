# Fallout: Russian version

How the Russian text of the Fallout remake ([FALLOUT.md](FALLOUT.md)) is organised, the rules the translation follows, and the glossary. The game runs in Russian when the Win 98 system language is Russian (`fallout.html?lang=ru` on the standalone page); the voice stays English.

## Files

Everything Russian lives in `content/fallout-ru/` and is laid over the original data at run time (`FO.Data` overlay). The original files in `content/Fallout` are never changed.

| Path | What it holds |
| --- | --- |
| `TEXT/DIALOG/<SCRIPT>.txt`, `TEXT/GAME/<FILE>.txt` | Russian lines for the English `.MSG` file of the same name: one line per message, `<number> <text>`, UTF-8. Missing numbers stay English. The speech file names come from the English `.MSG`. |
| `TEXT/CUTS/*`, `TEXT/CREDITS.TXT`, `TEXT/QUOTES.TXT` | Full Russian copies of the movie subtitles, ending narration and credits, same format as the English files. |
| `TEXT/STRINGS.txt` | `English<TAB>Russian` pairs for text that is not in a `.MSG`: string literals inside INT scripts, strings of the engine itself (months of the `/` key, resolution knob, dialogue "about" button, the kill title pattern `%s Kills`). |
| `PREMADE/*.BIO` | Biographies of the three premade characters. |
| `FONT0.AAF` … `FONT4.AAF` | The five game fonts with Cyrillic letters in the cp1251 slots. Built by `node tools/fallout-ru-fonts.cjs`: font 101 has hand-drawn letters (`tools/fallout-ru-glyphs.cjs`), fonts 100 and 102–104 get letters rasterised from Bahnschrift and Impact in headless Edge. Latin letters stay the original ones. |
| `ART/INTRFACE/*.FRM` | Interface art whose labels are baked into the picture, redrawn with Russian labels by `node tools/fallout-ru-art.cjs`. |

After adding or renaming a file run `node tools/fallout-data.cjs files` (refreshes the overlay list `FO.RU` in `fo-files.js`; the test fails when it is stale).

## Tools

- `node tools/fallout-ru.cjs dump DIALOG/NAME [from] [to]` prints the English lines with their role and the speakers: `P` the player's option, `N` an NPC reply, `F` floating text, `D` a look/description line, `S` another string, `-` unknown; `*` marks lines with speech. The first line lists the critters that use the script, with their gender and maps.
- `node tools/fallout-ru.cjs status [N]` shows coverage and the biggest untranslated files.
- `node tools/fallout-ru.cjs check` validates the Russian files: numbers exist in English, `%s`/`%d` sequences unchanged and in the same order, no braces, gender forms well formed (it also flags broken suffix forms such as `сообразительный~|ая~`), leading and trailing spaces the same as in English, no unexpected characters, no Latin letters (studio names and the title Fallout excepted).
- `node tools/fallout-ru.cjs widths GAME/EDITOR 300 318 101` compares English and Russian widths in a font, for labels with a fixed place on screen.
- `node tests/fallout-bot.js maps dialogs story --ru` runs the bot with the Russian overlay.

## Interface art

`node tools/fallout-ru-art.cjs [FILE.FRM ...] [--preview DIR]` reads the original FRM from the game data, erases the English label and draws the Russian one, then writes `content/fallout-ru/ART/INTRFACE/<FILE>`; `--preview` saves a PNG with the original above the result. It needs Edge, like the fonts tool: labels are rasterised in headless Edge with system fonts (Verdana, Bahnschrift) scaled to the cap height and letter width of the original label. The table `ART` in the tool lists every edit:

- `clear: [x, y, w, h]` erases a rectangle by filling it from its border with the texture noise of the surroundings; with `ink: 'yellow' | 'light' | 'help'` only the pixels of the label colour (grown by `grow` pixels) are erased, which keeps the art around the letters (the help screen, the automap switch lever, the review button).
- `text`, `box`, `style` draw a label centred in the box (or `align: 'left' | 'right'`); `fit` narrows the letters to a maximum width. Styles set the font, cap height, letter width and spacing, colour, drop shadow, worn paint (`wear`) and solid letters without smoothing (`solid`, the help screen).
- `sprite` builds a new FRM of the label's own size for the attack mode texts on the active item button (УДАР, ОЧЕРЕДЬ, БЕЗ ОРУЖИЯ, ОД...). The engine aligns them by their width.

Russian art: the interface bar and its 800 pixel version `HR_IFACE_800.FRM` (НАВЫКИ, ОЗ, КБ, ИНВ, КАРТА, ПЕРС, ПИП and their pressed buttons), the side art preview `HR_IFACE_SELECT.FRM` (the cut SKILLDEX fragment is erased), end turn and end combat buttons (ХОД, БОЙ), the attack mode sprites, inventory, loot, use-on, move-multiple, called shot, barter, dialogue and review windows, the Pip-Boy menu and months, world map location labels and the ГОРОД/МИР switch, the automap buttons and ВЫС/НИЗ, the stat labels of the character screens (СИ ВО ВЫ ОБ ИН ЛО УД), the character selection screen and the F1 help screen.

Art that stays as drawn: pictures inside the game world and logos (town map posters and blueprints, the Pip-Boy 2000 and Vault-Tec logos, elevator panels and warning signs, skill and perk card drawings, the small serial plates like KEEP CLEAR and PART NO), key names on the help screen, and the water chip note `PIP2.FRM` with `NOTENUMS.FRM`, which the engine does not show.

## What stays English

- `MAP.MSG` 0–65 and the map file names inside dialogue lines (`ShadyW.map`, `caves.map` in DUC and SAMMY): scripts and the debug display use them as file names.
- The `**END-PAR**` and `**END-DISK**` markers in `PIPBOY.MSG`: the holodisk reader looks for them.
- DOS commands and the directory listing on the demo computer (DEMOCOMP: `dir`, `cd fallout`, `fallout.exe`).
- Mapper-only files: `SCRNAME.MSG`, `PRO_TILE.MSG`, `EDITOR.MSG`, internal names in `PROTO.MSG` (damage types, body types, error strings).
- `SCRNSET.MSG` (hi-res patch texts): only the strings the game shows are translated: the main menu OPTIONS item, the options box, the screen settings window (0, 1, 3, 54, 55, 101, 106, 150–153). The rest describes DirectX, refresh rates and other settings of the patch for the PC release that the browser game does not have. Engine strings of that window (`Window`, `Black`, `Metal`, `Leather`) are in `STRINGS.txt`.

## Gender forms

- `~male|female~` follows the player's gender: `Ты ~пришёл|пришла~`. Use it whenever a line addresses the player in a gendered form or the player speaks about themself.
- `` `male|female` `` follows the gender of the speaking critter (dialogue replies, floating text, combat taunts). Use it when a script or AI packet is shared by men and women: `` Я `ранен|ранена` ``.
- In the player's dialogue options the backtick form follows the gender of the critter the player talks to: `` Ты `прав|права` ``, `` `Пошёл|Пошла` ты ``. Look-at lines printed by `display_msg` resolve it by the critter that owns the script.
- Both are resolved by the fonts when text is drawn. Where neutral wording reads naturally, prefer it.
- Write whole words in both forms (`~видел|видела~`), never suffixes (`видел~|а~`).

## Translation rules

- Follow `game-human-style.md`: natural Russian, minimal em dashes, no invented lore, keep every number, name, item and quest fact.
- NPCs speak to the player as **ты** unless the character is formal; system messages and narration use **вы**. Present tense and «вы» avoid gender where possible. The player always says «ты».
- Formal **вы**: Razlo and his wife, Katrina, Doc Morbid, Decker, Sheriff Greene, Sheriff Kenny, every member of the Children of the Cathedral (Lasher, Morpheus, Calder, Francis, Jeremiah, Orfeo, scholars, chanters, techs; Laura only in her public persona), Nicole, Talius, Amber, Zax, Marney, Mrs. Stapleton, the casino dealers, Brenden of the Brotherhood, the dying man in the desert (DEADGUY). The Lieutenant, the Master and the Nightkin say «ты».
- Pieces glued by scripts (`"Меня зовут " + name`, `"Вы получаете " + n + " ед. урона."`) keep the English leading and trailing spaces; a piece that starts with `.`, `,`, `!` or `?` may drop the leading space. Numbers glued to units use abbreviations after a space: `ед. урона.`, `ч.`, `сек.`, `дн.`. Caravan dates are month + day pieces: months like `в январе,` with a trailing space, days like `8-го`.
- Terminal and holodisk text is laid out with runs of spaces: the engine breaks a line at a run of spaces, so a forced break is 200 spaces and spacing inside a line is three spaces.
- Combat log and other templates keep names in the nominative: `Украдено: %s.`, `Вы видите труп: %s.`. Body part names in `COMBAT.MSG` are accusative with «в» (`в голову`) because they serve both as called-shot labels and inside sentences.
- Fixed UI places: keep labels within the English width (check with `widths`). Derived stats on the character screen ≤ 90 px in font 101, stat descriptors ≤ 55 px, inventory stat abbreviations are two letters (`СИ ВО ВЫ ОБ ИН ЛО УД`).
- Do not translate strings that scripts compare: the premade names `Max Stone`, `Natalia`, `Albert` (V13CAVE gives their starting items by name), map file names in `MAP.MSG` 0–65, debug strings.
- Russian quotes «», nested „“. Use the Cyrillic letter `х` for multiplication and Cyrillic look-alikes for model letters (`Т-51б`, `ТХ-28`); Roman numerals become digits.

## Glossary

| English | Russian |
| --- | --- |
| Vault 13, Vault Dweller, Overseer | Убежище 13, житель Убежища, Смотритель |
| Vault-Tec, RobCo, Wattz Electronics, West Tek | «Волт-Тек», «Робко», «Уоттз Электроникс», «Вест-Тек» |
| Pip-Boy 2000, holodisk, water chip | Пип-Бой 2000, голодиск, водяной чип |
| Wasteland | Пустошь (пустошь in running text) |
| Shady Sands, Aradesh, Tandi, Seth, Razlo | Шейди-Сэндс, Арадеш, Танди, Сэт, Разло |
| Raiders, Khans, Garl | налётчики, Ханы, Гарл |
| Junktown, Killian Darkwater, Gizmo, Skulz, Crash House | Джанктаун, Киллиан Даркуотер, Гизмо, Черепа, Ночлежка |
| The Hub, Decker, Harold, Far Go Traders, Crimson Caravan, Water Merchants, Thieves Circle, Maltese Falcon | Хаб, Декер, Гарольд, «Фар Гоу», «Багровый караван», Водяные торговцы, Круг воров, «Мальтийский сокол» |
| Heights, Old Town, Downtown, Underground, skag, Hub bucks / scrip | Верхний город, Старый город, центр, Подполье, бродяга, крышки |
| Butch Harris, Rutger, Demetre Romara, Sheriff Justin Greene, Friendly Lending, Bob's Iguana Bits, All-in-One Store | Бутч Харрис, Рутгер, Деметр Ромара, шериф Джастин Грин, «Дружеский заём», «Кусочки игуаны от Боба», «Всё в одном» |
| Skum Pitt, Neal, Marcelle, Shark, Tycho, Kane | «Отстойник», Нил, Марсель, Акула, Тайко, Кейн |
| Necropolis, Set, ghoul, Glowing One, Watershed | Некрополь, Сет, гуль, светящийся, водокачка |
| Brotherhood of Steel, Lost Hills, Rhombus, Maxson, Cabbot, Vree, Paladin, Knight, Scribe, Initiate, Elder | Братство Стали, Лост-Хиллз, Ромбус, Мэксон, Кэббот, Ври, паладин, рыцарь, писец, послушник, старейшина |
| Boneyard, Adytum, Regulators, Blades, Gun Runners, Rippers, Followers of the Apocalypse, Nicole | Боунярд, Адитум, Регуляторы, Клинки, Оружейники, Потрошители, Последователи Апокалипсиса, Николь |
| Katja, Talius, Jake, Heather, Red Rider, Gabriel, Zack, MacRae, Dugan, Dane, Dr. Wu, Abel, Kyle, Mr. Handy | Катя, Талиус, Джейк, Хизер, «Красный всадник», Габриэль, Зак, Макрей, Дуган, Дейн, доктор Ву, Эйбел, Кайл, Мистер Помощник |
| Children of the Cathedral, Cathedral, Morpheus, Laura | Дети Собора, Собор, Морфеус, Лаура |
| Lasher, Holy Flame, Dark God, dipping, prime normal, pure-strain human, nullifier | Лашер (in puns «Хлестун»), Святое Пламя, Тёмный бог, окунание, нетронутый образец, человек чистой линии, обнулитель |
| Scrapheap (demo), Crypts, Fools | Свалка, Склепы, Дураки |
| The Master, Unity, super mutant, Lieutenant, Nightkin, Mariposa, Vats, FEV | Создатель, Единство, супермутант, Лейтенант, ночной сородич, Марипоза, чаны, ВРЭ (вирус рукотворной эволюции) |
| The Glow, Vault 15 | Сияние, Убежище 15 |
| radscorpion, deathclaw, mole rat, pig rat, brahmin, floater, centaur, mantis | радскорпион, коготь смерти, кротокрыс, свинокрыс, брамин, флоатер, кентавр, богомол |
| caps, Stimpak, Super Stimpak, RadAway, Rad-X, Mentats, Buffout, Psycho, Nuka-Cola | крышки, стимулятор, суперстимулятор, антирадин, Рад-Икс, ментаты, баффаут, психо, «Нюка-Кола» |
| S.P.E.C.I.A.L. | Сила, Восприятие, Выносливость, Обаяние, Интеллект, Ловкость, Удача |
| skills | Лёгкое оружие, Тяжёлое оружие, Энергооружие, Без оружия, Холодное оружие, Метание, Первая помощь, Врач, Скрытность, Взлом, Кража, Ловушки, Наука, Ремонт, Красноречие, Торговля, Азартные игры, Скиталец |
| tag skill, trait, perk, karma, Hit Points, Action Points, Armor Class | основной навык, черта, перк, карма, очки здоровья (ОЗ), очки действия (ОД), класс брони (КБ) |
