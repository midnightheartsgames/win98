# Legion Arena (Легионы Рима) — Win 98 Edition

Clone of Slitherine's Legion Arena (2005): plan a battle in camp and on the deployment map, then watch hundreds of soldiers carry out the plan in real time while you spend scarce command points on the moments that matter. Game id `legion`, sold only through the in-system Steam client (`steam: true`).

## Pillars

1. **The plan decides.** Deployment, formation and doctrine settle most of a battle. Live orders cost command points that refill slowly.
2. **Readable melee.** Up to ~1,500 soldiers, yet the player can always tell which squad is winning, wavering or running.
3. **The legion grows.** Squads keep names, men, levels, skills, equipment and history between battles. Losses cost glory to replace.

Target aesthetics: challenge (tactical puzzle), fantasy (Roman commander), expression (army building, names, colours).

## Loops

| Loop | Length | Content |
| --- | --- | --- |
| Moment | seconds | Watch the clash, redirect a squad (move/attack/formation/doctrine, 1 order = unit order cost), signal the reserve, rally, pull cavalry out to recharge. |
| Session | 5–12 min | Briefing, deployment puzzle with the enemy visible, battle, results with medal and per-squad table. |
| Meta | campaign | Glory recruits and replenishes, denarii buy equipment, experience promotes squads (one skill per level), medals unlock the next battle, gold medals grant a god's favour. |

## Rules (from the original data, adapted)

- Stats per squad type come from `Squads.txt` (armour, damage, hit, agility, concuss, morale, health, shot stats, cost, men, formations). Skills and equipment come from `bonusdef.txt`, levels from `experience.txt`, terrain effectiveness from `TerrainModifiers.txt`, movement costs from `UnitSpds.txt`, formation bonuses from `formations.csv`, doctrines from `Orders.txt`, god favours from `prizes.txt`.
- Melee is simulated per soldier: hit chance from hit vs agility, damage from damage vs armour, critical kills, cavalry trample on the charge, morale damage from concuss. Terrain effectiveness scales attack and defence (skirmishers are weak in the open, heavy infantry and cavalry are weak in woods, hills and marsh).
- Missiles: javelins 30 m, bows 70 m, legion pilum one volley before contact. Limited ammo per squad.
- Morale: casualties, flank and rear attacks, nearby routs and a dead general drain it; the general's aura, officers and banners protect it. At zero the squad routs; it can be rallied twice if it gets clear.
- Army break: when dead, fled and routing men reach 68% of the enemy army (80% of the player's), every remaining squad of that side routs and can no longer rally. Elite squads (the black guard) and the general are exempt. The player's army holds longer because its losses carry over between battles.
- Cavalry: the charge (3 s after contact at a run) adds hit chance and damage and tramples infantry; in a standing melee against formed foot the riders hit 30% less often, so the intended use is charge, pull out, charge again. Spearmen and squares answer a frontal charge with a spear wall.
- Terrain: effectiveness scales the attacker's hit chance and damage by its square root and gives a defender standing in bad ground a small penalty, so heavy troops in woods or marsh lose most of their punch without becoming helpless.
- Command points: pool and regeneration belong to the general (Strategist and Quick Thinker skills). Each squad has an order cost (Drill lowers it, attack formations are cheaper). A dead general makes orders 50% dearer and halves regeneration.
- Doctrines: Advance, Charge, Hold, Long Hold, Envelop, Outflank, Seek Enemy, Hold Fire. Signal releases every holding squad.
- Enemy AI: one commander per side signals, rallies, protects its general and cycles cavalry (disengage after 10 s against spears or on low morale, recharge after 8 s). Cavalry hunts skirmishers, archers and routing squads; it hunts the player's legate only on battles with `ai.huntGeneral` (Кориолан, Разведчики галлов and every battle where the legate must survive) and on hard difficulty.

## Economy

- Glory: faucet = battle reward × medal multiplier (bronze 1.0, silver 1.25, gold 1.5). Sinks = recruitment (25–1,200), replenishment (80% of cost per man).
- Denarii: faucet = battle purse. Sink = equipment tiers 50–750.
- Experience: kills and survival. 12 levels (49…1,700 XP), each gives a skill pick and the stat bonus from `experience.txt`.
- Start: Legate, Toga Militia, Javelinmen, Scouts; 0 glory, 50 denarii. New unit types unlock as the campaign advances.

## Campaign (68 battles, 14 eras)

The whole Roman campaign of the original: every scenario of eras I to XIV in the order of `data/MapPurses.txt`. The two tutorial scenarios (11 and 79) are left out; battle 1 carries the tutorial hints instead. Enemy armies, positions, orders, formations, objectives, maps, purses, squad caps, briefings, squad names and era chronicles all come from the original files.

| Era | # | Battles |
| --- | --- | --- |
| I. Междоусобицы, 753-511 | 1-4 | Непокорные крестьяне, Экспедиция в Лаций, Засада сабинян, Разведка этрусков |
| II. Первые годы республики, 510-391 | 5-9 | Набег эквов, Герниканские фермеры, Кориолан, Латинские распри, Этруски у Цере |
| III. Галлы и латины, 390-344 | 10-13 | Люди в черном, Разведчики галлов, Охота на галлов, Поздние вести |
| IV. 1-я Самнитская война, 343-326 | 14-17 | Восстание рекрутов, Союзники кампанцев, Окончание войны, Присоединение Этрурии |
| V. 2-я Самнитская война, 326-304 | 18-22 | Освобождение Неаполя, Клавдинское ущелье, Лавтулы, Предательство этрусков, Последняя битва |
| VI. 3-я Самнитская война, 304-290 | 23-25 | Этруски, Сентий, Самниты |
| VII. Галлы и Пирр, 289-265 | 26-31 | Осада Арреция, Озеро Вадимо, Цизальпинская Галлия, Гераклея, Аускулум, Малвент |
| VIII. 1-я Пуническая война, 264-237 | 32-36 | Мессана, Агригент, Алалия, Адис, Баградас |
| IX. 2-я Пуническая война, 219-200 | 37-41 | Треббия, Канны, Дертозия, Илипа, Зама |
| X. Древнегреческие монархии, 199-160 | 42-45 | 2-я Македонская война, Сирийская война, Засада у Кипселы, Пидна |
| XI. Угроза с севера, 129-95 | 46-51 | Авиньон, Великаны Нореи, Агинн, Араузио, Аквы Секстиевы, Верцеллы |
| XII. Восстания рабов, 73-71 | 52-56 | Гора Везувий, Граннак, Переход через Альпы, Маленькая победа, Конец мечты |
| XIII. Войны Цезаря в Галлии, 71-56 | 57-61 | Бибракта, Мюлуз, Река Самбр, Засада у Диво, Осада Алезии |
| XIV. Гражданская война, 50-30 | 62-68 | Фарсал, Никополис, Зела, Африка, Тапс, Мунда, Филиппы |

Rewards are the original purses (500 to 4,625 glory), squad caps the original ones (at most 16). New unit types unlock along the history: velites and hastati after battle 1, nobles after 3, auxilia after 5, archers after 9, princeps after 13, auxiliary cavalry after 17, triarii after the Second Samnite War (22), elephants after Malventum (31), legionaries after Pydna (45), praetorians after Spartacus (56).

### What the battles ask of the player

The original objectives mix freely: rout the army, kill N men, kill their general, keep our legate alive, survive N minutes, stay under a loss cap, win before a time limit. The maps set the terrain problem (woods and hills for light troops, marsh at Caere, Aginnum and Bibracte, fordable rivers, the sea at the bay and beach maps, night on the coastal night map at Dertosia and the Alpine crossing). Hand-made additions in `TUNE`:

- 1 Непокорные крестьяне: tutorial hints; the enemy never signals and never hunts.
- 3 Засада сабинян: the sun sets over the survival timer.
- 7 Кориолан, 11 Разведчики галлов and every battle with «keep the legate alive» (4, 10, 32, 36, 47, 61, 65): enemy cavalry hunts the legate (`ai.huntGeneral`).
- 9 Этруски у Цере: the marsh reaches up to 22 m, so heavy troops lose their punch in most of the field.
- 10 Люди в черном: six squads of the Latin black guard (+2 levels, never break); destroy them and keep the legate.
- 11 Разведчики галлов: the chief walks off the east edge with his escort after 260 s or when threatened.
- 32 Мессана, 44 Засада у Кипселы, 46 Авиньон, 48 Агинн, 50 Аквы Секстиевы, 59 Самбр: the hardest battles of the original are a level or two lower (`lvl`) and some of their squads are dropped (`drop`); on the Sambre the wait is 7 minutes. They still need a plan: at Avignon hold until the fanatics' charge breaks, then attack; at Aginnum and on the Sambre hold the line and let the Gauls come; at Cypsela and Aquae Sextiae meet the charge at once.

### Where the data comes from

`tools/legion-scenarios.py` reads the install and writes `js/apps/legion/lg-scenarios.js` (`L.ORIGINAL_ERAS`, `L.ORIGINAL_SCENARIOS`); run it again after changing the extraction. `lg-levels.js` turns the records into levels and holds the hand tuning (`TUNE`: tutorial, sunset, escape, the black guard, titles, objective and zone overrides, enemy level shifts, dropped squads) and the medal table (`MEDALS`).

- `DB/scenario_N.bsf` (53,052 bytes): UTF-16 name at 0 whose first character is the order inside the era; 20 enemy placements of 136 bytes from 0x80: type at +0 (−4 for a general slot) and +24, formation index at +4 (`formations.csv`), order at +44 (`Orders.txt`), experience at +48 (hundreds of thousands = veteran grade), position at +68/+72 in quarter metres, group at byte +116, side at byte +133 (0 = unused editor slot). Scenario info at 0xAAE4: map index (`Battle/Maps/maplist.txt`), objective flags (1 survive, 2 kill, 8 losses, 16 keep our general, 32 kill theirs, 64 time limit), time, kill count, loss cap; era at 0xAB1C. The player's army and squad slots are editor leftovers and are ignored.
- `data/lang.str`: a table of UTF-16 offsets (it ends at the first value larger than the file) followed by the text. Squad names at 3491 + scenario × 20 + slot, briefings at 2543 + scenario × 4 (title before `~~`), era titles at 2309, era intros at 3144 and outros at 3207 (paragraphs split by `~`).
- Orientation: the original puts every enemy army in the eastern band of the map, so the player deploys in the western band and faces east. Scenario coordinates map straight onto our metres.
- Times: the original values (60 to 500) map to 4 to 12 minutes, `clamp(120 + 2 × value, 240, 720)` seconds. Loss caps are tripled because our battles are bloodier.
- Enemy level = stage + veteran grade − 1 (+1 for leaders), stage = 1 + (N − 1) / 7, shifted per battle by `TUNE.lvl`.
- Maps: canyon, bay and beach were added to `tools/legion-assets.py` (`python tools/legion-assets.py maps canyon bay beach`). `L.MAP_TERRAIN` sets the sea and river levels per map; rivers are fords everywhere (slow, weak ground), only the sea and the bottom of the canyon are deep water. Squads cannot be deployed standing in water.

Score = kill value + 25% of the value of every broken enemy squad + victory bonus (20% of the enemy army value × speed) − own dead × the average value of an enemy man. The penalty counts men, not denarii: late Roman squads cost far more per man than the levies they fight, and pricing losses at recruit cost pushed every late score to zero (the glory spent on replenishment already charges for them). Speed = clamp(2 − time / par, 0.5, 1.5), par 360 s by default; survival battles use speed 1.

### Balance method

- `tests/legion-stage-army.js` builds the army a player can have at battle N: squads unlocked by then, a budget from 70% of the glory earned so far, a count that grows from 4 to 16 squads, veterans at level 1 + (N − 1) / 5 and newer squads two levels lower.
- Three bot plans play every battle with two seeds: attack (the naive autopilot, signal at 20 s), defend (long hold, no signal) and hold then attack (long hold, signal at 120 s). Every battle must be won by at least one plan; `TUNE` lowers enemy levels or drops squads where none wins.
- Medal thresholds (`MEDALS`): silver = median winning bot score × 1.05, gold = best winning bot score × 1.12, rounded to 50.
- `tests/legion.test.js` plays eight battles spread over the campaign with the attack plan, plus Avignon (hold then attack), Aginnum and the Sambre (defend).
- Duels (`duel` helper in the test) keep the rock-paper-scissors: hastati beat light cavalry, spears stop cavalry, light cavalry beats militia and skirmishers in the open, elephants break heavy foot.

## Screens

Main menu → Camp → Campaign (era strip, era map, briefing with objectives, rewards, medal thresholds and scouting) → Deployment → Battle → Results. Quick Battle (Арена) builds a free army from a budget against a random enemy on any converted map.

- **Camp**: roster ledger (level coin, men and XP bars, gold stripe and chevron when a squad can be promoted, heart with missing men), parade ground with the 3D model, men and XP gauges with inline Replenish and Promote, a console of medallions (previous, rename, armoury, award, disband, next; arrow keys cycle squads) and the service record in four tabs: Навыки (phalerae harness, next slot, options for the next promotion), Снаряжение (armoury tiles with tier notches, next tier, price, requirement lock, special items, relics), Качества (grouped stats with icons, level/skill/equipment bonus shown as the gold part of the bar), История.
- **Campaign**: a strip of 14 era tablets (Roman numeral, medal dots, red for the current era) above the map. Eras I–III use the hand-drawn Latium sheet; eras IV–XIV use a parchment Mediterranean drawn from `lg-atlas.js` (coastlines and rivers as lon/lat polylines in an equirectangular projection, cities, Latin region names, battle coordinates, one view box per era fitted to the panel). Markers that land too close are pushed apart and keep a dotted leader to the real spot; the route joins the battles of the current era. The first visit to an era opens its chronicle from the original (intro), finishing an era shows the outro; «Летопись эпохи» reopens it (`profile.chronicle`).
- **Promotion**: options grouped by skill family, detail panel with the before/after stats of the whole level-up (level bonus plus skill), double click to confirm; the new phalera is struck onto the harness.
- **Recruit**: filter chips (all, infantry, missile, cavalry, elephants), unlocked and cheaper units first, price turns red when glory is short, locked units name the battle that unlocks them.
- **Deployment**: roster with class icons and level coins, battle card (objective, reward, squad cap), scouting grouped by unit type with counts, plan panel with formation and doctrine.
- **Battle**: objective chips with icons, clock, squad strip (number matches the banner, state icon, men and morale bars) docked above the selection panel, command console with the command-point bar, global orders and the favours as god coins; tooltips of own squads show their phalerae.
- **Results**: bronze, silver or gold phalera (iron cross on defeat), score, medal thresholds, rewards with icons, the favour coin, unlocked units and promotions.
- **Encyclopedia, unit page**: rotating model and stats with icons on the left; on the right the name, an epigraph (a real quote with author and work), the game description and terrain strength, then a parchment clipping «Из истории» with the period and three paragraphs of real history (origin, equipment, a battle that shows the unit at work), each fact tied to an ancient source in brackets. The camp links to it with «История отряда».

### Unit lore

`js/apps/legion/lg-lore.js` (`L.LORE[unitKey] = { quote, by, when, history[] }`) covers all 25 unit types. Quotes and facts come from Polybius, Livy, Caesar, Tacitus, Plutarch, Sallust, Vegetius, Josephus, Pliny, Festus, Frontinus, Diodorus and Cassius Dio; the Russian wording of quotes is our own translation, and every entry names book and chapter. Two threads run through the entries: Rome borrows the arms of its enemies (Etruscan phalanx, Samnite shield and javelin, Celtic mail, saddle and spatha, Numidian horse, Cretan and Syrian archers, Numidian elephants), and the army grows from farmers called away from the plough (Cato, Cincinnatus, Tiberius Gracchus, Marius). Keep new entries in the same shape: no em dashes, quote without outer quote marks (the page adds them), inner quotes as „…“.

## Interface language

Camp materials: dark wax tablets in wooden frames with a bronze hairline, bronze title plates with engraved capitals, bronze medallion buttons, Roman red cloth for the main action; the campaign stays on parchment. Palatino Linotype (Book Antiqua, Georgia) for names and headings, Tahoma for dense UI text. Responsive rules are container queries on `.lga` because the game window is smaller than the browser viewport inside the Win98 desktop.

Icons are drawn as SVG in `lg-icons.js` (glyph library in a 64 × 64 box, relief made of shadow, highlight and a metal gradient; data URLs are cached):
- skills are **phalerae** (Roman award discs): the enamel colour is the family (red attack, blue defence, green vitality, purple morale, ochre missile, slate formation, black command) and the metal is the tier (bronze, silver, gold, gold with beads and a laurel wreath); unlearned options are iron;
- equipment is a square bronze plaque with the item in iron, bronze, silver or gold by tier; relics have a gold frame with a garnet;
- favours are gold coins with the god's symbol (Mars shield and spear, Phobos mask, Hercules club, Apollo sun, Minerva owl, Diana moon, Mercury wing, Pluto bident);
- flat glyphs mark stats, unit classes, objectives and squad states; glory is a gold star, denarii a silver coin with the X mark.

Debug: **F7** anywhere in the game adds 500 glory and 500 denarii to the campaign army (`L.Army.grant`), refreshes every money display and the open screen (also inside dialogs).

## Code

- `js/apps/legion/lg-*.js`, namespace `Legion`, wrapper `js/apps/legion-app.js` (`appLegion`, window `app_legion`), page `legion.html` (`window.lgui`), styles `css/apps/legion.css`. `lg-icons.js` (`L.Icons`: `skill`, `equip`, `favour`, `stat`, `cls`, `objective`, `medal`, `glory`, `denarii`, `ui`, `img`, `html`) has no DOM dependency at load, so the Node test checks every icon.
- Campaign data: `lg-scenarios.js` is generated by `tools/legion-scenarios.py` from the original install; `lg-levels.js` builds `L.LEVELS` from it (`TUNE`, `MEDALS`, `L.MAP_TERRAIN`); `lg-atlas.js` (`L.ATLAS`) holds the campaign map.
- Assets: `tools/legion-assets.py` converts the original install in `content/Legion Arena/` into `content/legion/` (models `.lgm`, JPG/WebP textures, heightmaps, forest masks, UI PNGs from `Data.REZ`, MP3 sounds, intro MP4). The original folder is excluded from the exe build.
- `.lgm`: `LGM1`, V, T, F, 19 animation slots (start, count, ticks), uint16 indices, int16 UV (divide by 2048; the textures hold a 2×2 atlas), int16 xyz frames. Models come from the full detail `ANIM_<unit>.XAM` (480 to 1400 triangles), not from the `_1`..`_3` distance copies. Slots keep the order of the original name table: 0 stand (WAIT), 1–2 idle (WAIT1–2), 3 walk (WALK), 4–7 strikes (FIGHT1–4), 8–9 throw/shoot (SHOOT1–2), 10–13 deaths (DYING1–4), 14 flee without shield (ROUTING), 15 run (CHARGING), 16–17 combat stance (H2HWAIT1–2), 18 flee (ROUTING2). Walk, run and flee slots hold two step cycles and end on a copy of their first frame, so the renderer loops `count - 1` frames over the distance in `STRIDE` (ground covered by one loop, measured from the stance foot).
- Deployment: `Battle.autoDeploy` builds lines by class, `Battle.resolveDeploy` moves any squad that overlaps another or leaves the zone to the nearest free spot (remembered positions from the previous battle are mapped into the new zone first), `Battle.deployClashes` feeds the red outlines and blocks «В бой!».
- Test: `node tests/legion.test.js` (about 70 s, most of it the campaign winnability check). Screenshots: `node tools/legion-shots.cjs <out dir> <steps.cjs>` drives headless Edge over CDP; `lgShots.level(n)`, `start()`, `sim(sec)`, `cam(x, z, dist, yaw, pitch)`, `pump(frames)`.
