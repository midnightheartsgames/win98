# Где плов? — Win 98 Edition

Original time-management game about a plov house (чайхана) in a Tashkent mahalla, dated 2000 in the project fiction. The chef (ошпаз, no personal name) uses the look from the user's reference (brown skin, silver-white hair with a dark lock, magenta eyes, nose bandage, cream jacket with blue trim, black gauntlet on the right hand, bare left forearm with a blue armband and a cream glove, blue trousers, knee pad, black boots) wearing a white apron with a name badge and a chef's toque. Game id `plov`, sold only through the in-system Steam client (`steam: true`, $16.99, `C:\Games\Plov\PLOV.EXE`).

Status 2026-11-03: hidden from players until the next rework. The catalog entry lives in `gameManager.hiddenGames` (js/game-manager.js), not in `catalog`, so Steam, steampowered.com, the web98 landing and every catalog reader skip it, and `isInstalled('plov')` is always false: the desktop icon, the Start menu item and `C:\Games\Plov` disappear even for players who bought it, while their purchase stays in the saved state. The Run command is off while hidden, and Clippy's launcher, the advanced-site listing, the Steam friend and the GamerZone topic were removed. To bring the game back, move `plov` from `hiddenGames` into `catalog` and restore those shortcuts.

## Pillars

1. **The kazan is the heart.** Plov is cooked in batches with timed stages that need the chef at the right moment; every other station orbits it.
2. **Readable bustle.** Every need is one card over one place: a raised hand, the dishes of an order, coins, a cloth over a dirty table, a ring timer. Gold corner brackets mean "you can act here".
3. **Generous dastarkhan.** Warm feedback (coins fly to the counter, hearts, series pops), soft failure (a day never ends early, savings grow even on a failed day).

Target aesthetics: challenge (juggling timers), fantasy (running a chaikhana), sensation (juicy feedback).

## Loops

| Loop | Length | Content |
| --- | --- | --- |
| Moment | seconds | Pick the most urgent need, click it (clicks queue up to five jobs), watch the chef walk and act. |
| Session | 3–5 min | One day: waves of guests with breathers, two or three kazan batches, a revenue goal with three star thresholds. |
| Meta | 10 days | Unlock the next day, collect stars, spend savings at the bazaar on upgrades, read the recipe book and the pattern album. |

## Verbs and rules

- **Seat** a waiting group: click it, then a table (or drag it, or Tab + digit 1–6). Small tables seat two, topchans four. Seating is instant; guests walk themselves.
- **Take the order** when a hand is raised. The order is a table order: one lyagan of plov (two for some big groups), up to two extras, one drink; capped by `min(level.maxItems, size + 1)`.
- **Cook.** Kazan: empty → meat (1.2 s) → frying 6 s → needs carrots with onion (chopped at the board, 2.2 s) within 14 s or it burns → zirvak 7 s → rice within 16 s or it burns → steaming 10 s → 8 lyagans. Tea: one click brews two pots in 4.5 s. Compote: a jar with 8 servings, refill 1.6 s. Achichuk: chopped on the spot, 1.8 s. Tandoor: four samsa (day 5) or two samsa and two non (day 6+), 9 s, then 12 s to take it out before it burns.
- **Carry** two items. The pass (4 slots) is a buffer; the bin throws an item away. The last lyagan can go to the pass so a new batch can start.
- **Serve** by clicking the table with matching items in hands; each item restores patience.
- **Collect** coins when the group finishes, then **clean** the table (0.7 s).
- **Second round** (day 7+): some groups order tea, compote or pastry after eating.
- **Specials:** business people (fast patience, 1.8× tips), the critic (VIP, jumps the line, +800 on a happy visit, −1000 on leaving), wedding couriers (wait at the gate for 2–3 lyagans).

Patience is five hearts. Decay per second: line 0.085, waiting to order 0.11, waiting for food 0.055, waiting to pay 0.1, all scaled by guest type, day and upgrades. At one heart the guest turns red and grumbles; at zero the group leaves (penalty 150 per person).

## Economy

- Prices: plov 700, samsa 250, achichuk 200, non 150, compote 150, tea 100.
- Tips: 50 × people × type × (hearts/5)^1.5 × sign upgrade.
- Speed bonus: the whole order within 12 s + 4 s per item adds 15% of its price.
- Series: service actions less than 5 s apart build a series up to ×6, each step pays 10 × series.
- Penalties: guest leaves, burnt kazan (−300), burnt tandoor (−100).
- Savings: 25% of the day's revenue goes to the savings box, even on a failed day (catch-up). The bazaar sells 13 upgrade levels for 26 800 in total: soft ichigi (walk speed), Chust pchak (chopping), big kazan (+2 lyagans), saxaul firewood (kazan stages), big samovar, tape recorder (line patience), new kurpachas (table patience), new tandoor, sign with bulbs (tips).

## Days

| Day | Title | New | Groups | Tables | Goal / expert |
| --- | --- | --- | --- | --- | --- |
| 1 | Открытие | plov, tutorial | 5 | 4 | 2 600 / 4 300 |
| 2 | Чай для соседей | black and green tea | 7 | 4 | 5 000 / 7 300 |
| 3 | Ачичук | salad, groups of three | 8 | 4 | 6 600 / 9 600 |
| 4 | Жаркий полдень | compote, groups of four, lunch rush | 10 | 5 | 9 300 / 13 600 |
| 5 | Самса из тандыра | tandoor, samsa | 10 | 5 | 9 800 / 14 200 |
| 6 | Горячий нон | non (mixed tandoor batches) | 11 | 5 | 10 800 / 15 300 |
| 7 | Чай после плова | second-round orders | 11 | 6 | 10 800 / 14 800 |
| 8 | Деловые люди | business people | 11 | 6 | 10 200 / 13 800 |
| 9 | Визит критика | two critics | 10 + 2 | 6 | 11 500 / 15 400 |
| 10 | Свадебный плов | three wedding couriers, a critic | 11 + 4 | 6 | 15 000 / 19 900 |

Each element is introduced where it is safe (a mentor tip pauses the game), developed on the next day, then combined on days 9–10. Waves (`waves: [start, count, spread]`) make a sawtooth: calm opening, rush, a one-group breather, second rush, tail.

**Balance method.** `P.Bot` plays through the sim API with a priority planner (deliver held food, kazan emergencies, tables needed by the line, pay, orders, fetch food with two-hand batching, prep ahead, clean). `slow` adds a think pause every time the chef becomes idle. Goals were set from three bots over several seeds: perfect (slow 0, no upgrades) must always reach the goal; human-like (slow 0.6 with the upgrades a player can afford by that day) must reach it on average; experts sit near the perfect bot. Tune one knob at a time and rerun (`tests/plov.test.js -v` prints the averages).

## Screens

Title (logo, the chef with a lyagan, turning suzani), ledger «Дафтар» (two-page book: days with stars and locks, briefing with the day's menu where new dishes carry a «новое» tag, goals), intro card (story, a showcase of what is new: large dish icons with price or the new guest type with a note, companies, tables, menu, goal and master line), play screen, pause, results receipt (sales, tips, bonuses, penalties, stars stamped one by one, savings), bazaar (market stall, nine goods on shelves with price tags and level pips, detail card), recipe book (seven tabs incl. controls drawn as keycaps, guests and the pattern album), finale (lights, fireworks, credits). The game pauses when its window is not the top window.

## Interface

The visual language is a chaikhana in 2000: carved walnut plaques and inset wells with a light top bevel, glazed ceramic buttons, rishtan cobalt and turquoise, ikat borders, Tahoma and Palatino, Windows 98 keycaps for every key hint.

- **Top bar.** A paper day tag nailed to the beam; the cash well (coin, amount, the next threshold as «цель ★ 10 800» or «дальше ★★ …», a track with one, two and three star notches); the guests well (served plus lost of all companies and one bead per company in arrival order: green served, red lost, gold ring present, dim still to come); the series well (a doira whose ring drains with the series window); pause.
- **Bottom bar.** Both hands as wells with the dish icon and its short name (an empty hand shows a faint palm); the context hint with a keycap (Space for the focused target, LMB for the hovered one, 1–6 while seating); a keycap legend; five job slots that show what the chef will do next (station, dish, table number, footprints for a floor click) with their order numbers. The same numbers float over the targets in the yard.
- **Need cards.** Every group that waits shows one card: dishes of the order on saucers (a delivered dish fades and gets a green check, a dish the chef is carrying glows gold), the raised hand or the coins, a patience strip with five hearts at the bottom, a draining gold fuse along the top edge while the speed bonus is still possible, an «ещё» tab for second orders. Low patience turns the strip red and makes the border blink. A card turns half transparent while the chef stands behind it. Waiting companies at the gate get a card beside them with their size and a type badge (VIP star, briefcase); clicking or dragging from the card works like clicking the guests.
- **Seating.** While a company is selected, every table badge shows its capacity and turns green when the company fits (a table that does not fit is dimmed, not only recoloured); the hovered table gets green or red corner brackets and a dashed line follows the cursor.
- **Recipe board.** A wooden board hangs above the kazan with four action nodes (meat, carrot with onion, rice, lyagan) joined by grooves that fill during the timed stages (fry, zirvak, dam). The node that needs the chef pulses gold with a burn ring that blinks red in the last five seconds and turns green when the right item is in his hands; the lyagan node shows the portions left; a burnt kazan shows a red board with a broom. The pot itself starts to smoke before it burns. The tandoor has a smaller board (dough, then the baked load) with the same language.
- **Mentor dialogs.** Bakhtiyor-aka speaks from an arched niche portrait that rises above the paper, with a name plaque and a keycap hint next to «Далее».

## Icons and sprites

`pl-icons.js` draws every item at a 32-unit design size in three-quarter view with the ink outline, soft volume and one highlight, and caches the result at three times the needed pixel size:

- **Dishes:** plov on a rishtan lyagan (golden dome, yellow and orange carrots, meat, a garlic head, a quail egg, chickpeas), achichuk in a cotton-pattern kosa, samsa with sesame and nigella, non with a stamped centre, black tea (red-brown glazed choynak with gold dots, amber tea in the piala), green tea (white pakhta choynak, a leaf, green-gold tea), compote in a glass jug with apricots and cherries, carrots with onion in a wooden bowl. Leftover versions (a lyagan with grains, an empty kosa, crumbs) sit on dirty tables.
- **Bazaar goods** at a 64-unit size: ichigi with kalish, a Chust pchak with its sheath, the big kazan with a kapkir, saxaul logs, a brass samovar with a teapot on top, a double-cassette tape recorder, stacked kurpachas in generated ikat, a tandoor on a brick plinth, the «ОШ» sign with bulbs.
- **Glyphs:** raised hand, coins, broom, meat, rice sack, dough, knife, kapkir, notepad, cloth, guests, doira, footprints, station minis, flower, lock, check, star, heart, sweat drop, anger mark, sparkle.

Characters keep the paper-doll renderer and gained: a raised hand while waiting to order (front and profile), blinking, emotes over the head (sweat drop when impatient, a pulsing anger mark when angry), a cane for aksakals, a mustache and beard that leave the mouth visible, sleeves in the chapan colour, eyes and brows placed on the seated head. The chef holds the tool of the current action (pchak, kapkir, notepad, cloth, broom, coins, dough) and the progress plaque above him shows the same icon. `Art.drawCharHD` draws a character directly with detailed eyes for large views (title, results, finale, intro, recipe book, busts) instead of scaling a cached sprite.

## Абр: the algorithmic philosophy of the patterns

Abr means cloud: ikat threads are dyed in bundles and shift on the loom, so every edge is feathered. All ornaments in the game are generated by seeded algorithms (`pl-ornament.js`) and are identical for the same seed:

- **Ikat** — a motif function over a tile (amulet diamonds, combs, flames, stripes) sampled thread by thread; each warp thread gets its own offset from 1D value noise, which produces the cloudy edges.
- **Suzani** — n-fold rosettes (6–12) of layered almond petals, a ring of alternating dots and an outer vine with leaves.
- **Rishtan** — a cobalt rim band, a sinusoidal vine with almonds on the crests and dot trefoils in the troughs, a double ring and a central rosette; two glaze schemes (white ground, turquoise ground). Small plates keep only the rim and the centre so they stay readable.
- **Girih** stars for beams and HUD strips, **chust** peppers on doppi caps, **pakhta** cotton on teapots, basketweave brick paving and dappled vine shadows.

Topchan mattresses, tablecloths, wall plates, guests' robes and dresses all take their own seed. The recipe book tab «Узоры» is a seed browser.

## Architecture

Namespace `Plov`, zero comments. Modules in `js/apps/plov/` (load order): `pl-core` (constants, RNG, helpers), `pl-data` (items, stations, tables, guest types, days, upgrades, texts), `pl-sim` (grid A* with string pulling, `Game`, `Bot`, `simulate`; no DOM, runs in Node), `pl-ornament` (generators), `pl-art` (paper-doll character renderer, cached 2× canvases, `drawCharHD`, hearts, coins, stars), `pl-icons` (dishes, leftovers, bazaar goods and glyphs, cached 3× sprites), `pl-scene` (courtyard background, stations, recipe boards, tables), `pl-audio` (WebAudio sfx and doira/dutar music, follows the OS mute and volume), `pl-ui` (canvas, scaling, input, glazed buttons, wells, plaques, keycaps, save, title, settings), `pl-ui-game` (play screen, HUD, cards, busts), `pl-ui-menu` (ledger, bazaar, recipes, results, finale). Wrapper `js/apps/plov-app.js` (`appPlov`), styles `css/apps/plov.css`, standalone page `plov.html` (`window.plui`). Logical resolution 800×600, the backing store follows the window size and DPR. Save key `plov98_save`.

The sim emits events (`sfx`, `pop`, `cash`, `combo`, `hearts`, `angry`, `nope`, `end`) that the UI turns into sound, particles and coins; the UI never mutates the sim except through `click`, `seat`, `setMove`, `interact`, `clearQueue`, `ack`.

## Tests and tools

- `node tests/plov.test.js` (`npm run test:plov`, ~10 s, 810 checks): data consistency, text style (no em dashes, gender-neutral lines about the chef), walkability of every use spot and seat, station mechanics (kazan stages and burning, tea pots, tandoor, pass, bin, hands), seating rules, VIP line jump, the full day 1 tutorial, keyboard focus and the job queue, bot balance over all days, determinism, an icon for every dish, leftover, bazaar good and UI glyph, a recipe board stage for every kazan state, a stub-canvas run of every screen and all ten days, seating through a queue card, guest beads matching served and lost companies, OS integration and zero comments.
- `node tools/plov-shots.cjs <outDir> <steps.cjs>` drives headless Edge over CDP (`plShots.reset/play/bot/pump/info`, steps `eval`, `shot` with optional clip, `lshot` with a clip in logical 800×600 coordinates and a capture scale, `lclick`/`ldrag` in logical coordinates or from an expression, `kdown`/`kup`/`key`). `PL_DPR=2` renders at double density, `PL_HTML=<file>` loads a scratch page (icon and sprite sheets), `PL_PAGE=index.html` tests inside the desktop.
