# Fallout: Запорожье

An open-world role-playing game in the spirit of Fallout: New Vegas, moved to the Soviet Union of the Fallout universe, where the USSR never fell apart and lived on with vacuum tubes, atomic optimism and five-year plans until the Great War of 23 October 2077. The game takes place in Zaporozhye on 1 September 2280. This first release covers the Voznesenovsky district (Вознесеновский район, before 2016 Орджоникидзевский) on the left bank of the Dnieper and the islands Khortytsia and Bayda, the way the district's real borders run. The DniproHES dam stands just outside the district and is visible from almost everywhere in the north: it is the prize every faction wants, and the next chapter.

- Sold in Steam (`steam: true`, id `falloutzp`, `C:\Games\FalloutZP\FALLOUTZP.EXE`). Not preinstalled.
- Run: `falloutzp`, `fallout zp`, `fallout`, `фоллаут`, `запорожье`, `new vegas`.
- Standalone page: `falloutzp.html` (`window.zpui` is the UI instance).
- Code: `js/apps/falloutzp/zp-*.js`, namespace `globalThis.FalloutZP`, zero comments (AGENTS.md).

## One page

- **Fantasy.** A state courier («фельдъегерь») of the Main Post Office carried a sealed punched card across the Dnieper, was shot in the head on the way and thrown into the river. A worker robot pulled the body out under the old pear tree of Voznesenka. The courier wakes up in a village medical post with a bullet in a jar and one question: who, and why.
- **Aesthetic (MDA).** Discovery first (a compressed but recognisable Zaporozhye: Stalinist avenue, the circus dome, the cliffs of Khortytsia, the dam on the horizon), then fantasy (being the one who decides who gets the dam's power), then challenge (combat that rewards preparation, skills and the targeting computer).
- **Core verbs.** Explore, talk, shoot, aim with С.Т.Р.Е.Л.А., sneak, loot, trade, repair, pick locks, hack terminals, choose.
- **Loops.** Moment: moving through a dangerous landscape, reading threats on the compass, shooting with weight and feedback. Session: a location or a quest step with a clear arrival, a rising middle (a fight, a lock, a conversation with checks) and a payoff (loot, XP, a decision). Meta: levels, skills and perks open new solutions; reputation opens and closes doors; gear climbs from a Makarov to a heat-ray rifle; the map fills in; the ending is built from your choices.
- **Pillars.** «Выбор с последствиями» (every main problem has at least three solutions and someone remembers what you did), «Навык решает» (skills, not luck, open alternative paths: a [Красноречие 50] line, a terminal, a lock, a repair), «Советский ретрофутуризм» (tubes, red stars, talons, slogans — never modern Ukraine, never Fallout's American kitsch copied), «Опасная свобода» (the whole map is open from the start, danger rises with distance from Voznesenka).
- **Out of this release.** The dam itself, Sotsgorod and the right bank (next chapters), vehicles, settlement building, multiplayer.

## World and lore

In this timeline the Soviet Union met the 2070s as a superpower of lamp electronics and atomic cars. Zaporozhye was an energy and metal city: the DniproHES, the aluminium works ЗАлК, the steel plants. On 23 October 2077 a warhead aimed at the dam fell short into the industrial zone. The dam survived (concrete of the first five-year plans), the left bank burned, the granite of Khortytsia sheltered the island. Civil Defence shelters («убежища ГО») closed. Some opened two hundred years later, some never did.

Currency: **талоны** — pre-war ration coupons for electricity («талон на 1 кВт·ч»). Everyone still accepts them because whoever holds the dam can, one day, pay them out in power. This ties the economy to the main plot.

Pre-war technology names: the wrist computer **«Пионер-77»** (made by the Zaporozhye plant «Радиоприбор»), the targeting system **С.Т.Р.Е.Л.А.** («Стрелковая Тактическая Расчётно-Электронная Ламповая Автоматика»), the character chart **ГТО** («Готов к труду и обороне»), research institutes **НИИ**, shelters **Убежище ГО №…**.

## Factions

| Faction | Who | Base | Wants the punched card for |
| --- | --- | --- | --- |
| **Комендатура** | The Zaporozhye garrison: soldiers and clerks from Shelter ГО №1 under the dam, rules, ration coupons, conscription | Gorispolkom building on проспект Ленина; checkpoint at the bridge | Power for the garrison, martial law over the district |
| **Новая Сечь** | Islanders who revived Cossack law: the Rada, the Kosh, sabres and rifles, contempt for paperwork | The Sich fortress on northern Khortytsia | Cut the Komendatura off the grid and keep the island free |
| **Плановик** | АСУ «Плановик-77», the regional planning computer in the bunker under the Oblispolkom, still running the Plan, with robot patrols | Oblispolkom bunker | Restart the Five-Year Plan; robots govern |
| **Кооператоры** | Black-market co-op «Импульс», run from the Intourist hotel by its Chairman Аркадий «Фирма» Лисовой — the man who shot you | Hotel «Интурист», площадь Маяковского | Sell it to the highest bidder |
| **Вознесенка** | The village around Taras's pear tree on the embankment: farmers, fishermen, the doctor, the bar | Voznesenka | Survival; with your help, a free soviet of its own |
| **Шпана** | Young thugs from the ravines and the Victory Park | Парк Победы | Talons |
| **Хоботы «Красной воды»** | Gas-mask people of Shelter ГО №3 who kept their minds | Shelter №3 | Filters and to be left alone |
| **Бригада Кузьмича** | Intelligent Udarniki at ЗАлК | Electrolysis shop №3 | To fulfil the plan |

## Mutants and creatures

Nothing from Fallout's bestiary is reused. Each creature tests a different verb.

| Creature | What it is | How it fights | Counter |
| --- | --- | --- | --- |
| **Колорад** | Giant Colorado potato beetle from the kolkhoz fields | Swarms, armoured shell in front | Shoot the back or the legs; fire |
| **Колорад-матка** | The queen in the potato field | Lays eggs that hatch during the fight | Kill her first or burn the clutch |
| **Медведка** | Mole cricket the size of a calf | Burrows toward vibration, erupts under you, digs back in | Walk or sneak (vibration), shoot when it surfaces |
| **Мартын** | Black-headed gull grown to an eagle's size | Circles and dives from the cliffs | Shoot during the dive; С.Т.Р.Е.Л.А. |
| **Сом** | Dnieper catfish that crawls on its fins | Lurks with only the whiskers showing, lunges and drags into water | Stay off the waterline, shoot the head |
| **Царь-сом** | The legendary one in the plavni | Same, bigger, swallows | Quest boss |
| **Бройлер** | Escaped poultry-farm broilers | Fast flocks, spurs | Shotgun, explosives |
| **Байбак** | Steppe marmot the size of a dog | Flees; its whistle wakes everything around | Kill quietly or avoid |
| **Одичалый пёс** | Feral dogs | Packs that circle | Hold a position |
| **Подсолнух** | Lysenko-era sunflower that turns to light and spits husks | Stationary turret that tracks the brightest target | Darkness (switch off the Pioneer light), fire, flanking |
| **Хобот** | People whose ГП-5 gas masks grew into their faces over two centuries | Relentless melee, track by smell | Shoot the filter can (crippling it suffocates them) |
| **Хобот в ОЗК** | Same in a rubber protection suit | Armoured | Fire, energy weapons |
| **Ударник** | Workers of ЗАлК dosed with the pre-war drug «Стахановит» to triple the plan; slag-crusted giants who shout slogans | Sledgehammer charge, knockdown; the клепальщик fires a rivet gun | Keep distance, cripple the legs |
| **Дружинник** | People's-patrol robot with a red armband | Microwave emitter, asks for papers first | A pass, Science, robot perk |
| **Луноход** | Military tracked rover on the lunar chassis | Rocket pod and machine gun | Cripple the antenna (blind) or the wheels |
| **Агрегат** | Worker robot | Usually neutral; a broken one welds you | Repair or scrap |

People: Шпана, Комендатура soldiers, сечевики, кооператоры, мародёры.

## Character

**ГТО (S.P.E.C.I.A.L.)**: Сила, Восприятие, Выносливость, Обаяние, Интеллект, Ловкость, Удача, each 1–10, 40 points at creation.

| Derived | Formula |
| --- | --- |
| Здоровье | 100 + 20 × Выносливость + 5 × (level − 1) |
| Очки действия | 65 + 3 × Ловкость, regenerate 6 + 0.75 × Ловкость per second |
| Грузоподъёмность | 150 + 10 × Сила |
| Шанс крита | Удача % + weapon bonus |
| Очки навыков за уровень | 10 + ⌊Интеллект / 2⌋ |
| Опыт до уровня L | 25 × (3L + 2) × (L − 1); cap 30 |

**Skills** (initial 2 + 2 × stat + ⌈Удача / 2⌉, tagged +15, maximum 100): Торговля (Обаяние), Энергооружие (Восприятие), Подрывное дело (Восприятие), Стрелковое оружие (Ловкость), Взлом (Восприятие), Медицина (Интеллект), Холодное оружие (Сила), Ремонт (Интеллект), Наука (Интеллект), Скрытность (Ловкость), Красноречие (Обаяние), Выживание (Выносливость), Рукопашный бой (Выносливость).

**Traits** (up to two, chosen in the «анкета»): Тяжёлая рука, Торопыга, Педант, Очкарик, Мирный атом, Шальной, Хилый, Ломать — не строить, Метатель, Дикое Поле.

**Perks** every second level, with level, ГТО and skill requirements (the full table lives in `zp-rules.js`).

**Karma** −1000…1000: Враг народа, Хулиган, Гражданин, Сознательный гражданин, Герой Труда. **Reputation** per faction from fame and infamy: Нейтралитет, Свой, Уважаемый, Почётный / Подозрительный, Ненавистный, Враг, and «Неоднозначный» when both are high. Faction clothes work as disguises.

## Combat

- Real-time first or third person. Hitscan with a spread cone: weapon spread × skill factor (1.8 at skill 0 to 0.6 at 100) × aim × movement × crouch × condition.
- Damage = weapon × (0.5 + 0.5 × skill / 100) × perks × critical × body-part multiplier, then minus the target's damage threshold (at least 20 % passes).
- Body parts with their own health: crippled head blurs aim, arms widen spread, legs slow down. Creatures have their own parts (shell, wings, filter can, antenna, wheels).
- **С.Т.Р.Е.Л.А.**: pause, pick a target and a body part with its hit chance, queue shots for action points, watch them in slow motion.
- Condition: every shot wears the weapon; worn weapons jam and hit softer. Repair with a duplicate, a repair kit or at a vendor.
- Sneak: detection meter per observer from sight (light, distance, field of view, Скрытность) and sound (running, gunfire). [СКРЫТ] / [ВНИМАНИЕ] / [ОПАСНОСТЬ]. Sneak attacks are critical.

## Map

The real geography at 1:4 horizontally and 1:2 vertically, buildings at full size: OpenStreetMap shapes (© OpenStreetMap contributors, ODbL) and SRTM heights (NASA), imported by `tools/zp-import.cjs` into `zp-geo.js`. Frame: metres, x east, z south, origin 47.835° N, 35.105° E; river level is y = 0.

Locations of this chapter (real places, Soviet names):

| Area | Location | Use |
| --- | --- | --- |
| Left bank | **Вознесенка** around «Тарасова груша» on the embankment | Start, doctor, bar «Груша», сельмаг, сельсовет |
| | **Вознесенский рынок** | Trading hub, Komendatura tax post |
| | **Площадь Маяковского, гостиница «Интурист»** | Кооператоры, casino («Очко», «Спортлото»), Фирма |
| | **Проспект Ленина**: ЦУМ «Украина», кинотеатр им. Довженко, почтамт | Dungeon, courier guild |
| | **Горисполком** | Комендатура HQ, гауптвахта |
| | **Облисполком** and its bunker | Плановик |
| | **Цирк** | Arena fights for bets |
| | **ТЮЗ** | Хоботы nest |
| | **ДК «Орбита»** | Radio «Маяк-Запорожье» |
| | **Инфекционная больница**, **Алюминиевая балка** | Dungeons, wilderness in the city |
| | **Парк Победы**, **Вознесеновский парк** | Шпана, broilers |
| | **ЗАлК** and the red-mud storage | Udarniki, toxic zone |
| | **Убежище ГО №12 «Очередь»**, **Убежище ГО №3 «Красная вода»** | Shelters |
| | **Мост Преображенского** | Komendatura checkpoint, the finale |
| Khortytsia | **Сечь**, **музей истории казачества** (the Sich treasury), **Змиева пещера** (НИИ «Хортица») | Sich, lab |
| | Cliffs (Чёрная скала, Совутина, Наумова), sanctuaries, kurgans, the old oak, the balkas | Wilderness, secrets |
| | **Колхоз «Заветы Ильича»**, poultry farm, sunflower fields | Колорады, Бройлеры, Подсолнухи |
| | **Пионерлагерь «Чайка»**, **Скифский стан**, **плавни** with озеро Прогной and the fishermen's camp | Side quests |
| Bayda | **Остров Байда**, Vyshnevetsky's castle ruins | Secret |

The dam, Sotsgorod, the right bank and the rest of the left bank are a backdrop behind the river or behind barricades.

## Story

**Main quest (chapter I):**
1. «Медкомиссия» — character creation as a medical board in the village post: Форма 086/у (ГТО), the «анкета» (traits), «профориентация» (tag skills).
2. «Груша и Гиря» — the Шпана demand tribute from Voznesenka; defend the village or side with the gang. A captured thug names the man in imported jeans who paid them to dump the body.
3. «Их было трое» — the trail: the market, the post office (the parcel was addressed to «Облисполком, подвал 3, абонент Плановик»), the Intourist, the bridge (pass, bribe, rail deck or a swim), the Sich.
4. «Суд Рады» — Фирма hides under the Kosh's protection: a trial before the Rada with evidence, a duel by Cossack law, a night theft, or a deal.
5. «Адресат» — the Planner calls through the Pioneer. The card holds the codes of the dam's control system.
6. Faction route, one quest each: «Порядок на мосту» (Комендатура: remove the Sich outpost at the west end of the bridge), «Воля Сечи» (free two Cossacks from the Komendatura guardhouse), «Пятилетка» (Плановик: switch on the bridge substation), «Своя голова» (with Тимофей and his technical passport: switch the substation to Voznesenka).
7. «Битва за мост» on the two-tier Preobrazhensky bridge, then the newsreel ending slides («Новости дня»), built from the route, the Firma outcome, Voznesenka, side quests, companions and karma.

**Side quests in this release:** «Красная вода» (filters for Shelter №3), «Очередь» (Shelter №12), «Битва за урожай» (the Colorado queen), «Царь-сом» (plavni), «Зарница» (pioneer camp), «Норма выработки» (ЗАлК shop №3), «Письма» (post office), «Цирк» (three arena fights), «Голос Маяка» (DK «Орбита» radio), «Скифское золото» (the pectoral in a kurgan, needs a shovel), «Пропуск» (clear the ТЮЗ for the bridge pass), «Техпаспорт» (Тимофей), «Право на Сечь» (Ярина). Later: «Кулачный бой», «Гауптвахта», «Чумацкий шлях».

**Companions:** Ярина (Cossack scout expelled for being a woman in the Sich; rifles, sneaking) and Тимофей (worker robot «Агрегат-7»; repairs in the field; secretly a maintenance unit of the Planner).

## Implementation

### Code map

| Module | Role |
| --- | --- |
| `zp-core`, `zp-geo`, `zp-map`, `zp-town` | Math, imported OSM/SRTM data, terrain heights with `Z.TERRAIN_EDITS` (pads, mounds, cover), OSM buildings and trees; `Z.TOWN_HOOKS` run at the end of the town build |
| `zp-phys`, `zp-nav` | Collision world (prisms, cylinders, sloped floors) and the 2 m nav grid; `Z.NAV_HOOKS` patch it |
| `zp-rules`, `zp-items`, `zp-actor`, `zp-actors` | ГТО, skills, perks, items, actors, creatures and human templates |
| `zp-game`, `zp-play`, `zp-combat`, `zp-ai`, `zp-objects`, `zp-interiors`, `zp-quests`, `zp-dialogue`, `zp-save` | Simulation: cells, combat, AI (`ai.goal` marches a squad to a point), objects, interior builder, quests, dialogue DSL, saves |
| `zp-rig`, `zp-models`, `zp-creatures`, `zp-actorgfx` | Characters. `SkinBuilder.loft` builds bodies from superellipse rings, every vertex can blend two bones (bone 2 and its weight sit in the material bytes the skin shader does not need). `Z.Models.human` builds the head on a dense grid with face relief (nose, brows, lips, chin), a painted face texture (`Z.faceCanvas`, `Z.facePortrait` for the medical form), hair, beards and hats as shells over the head, hands from `Z.buildHand` (shared with the first-person view: palm, four fingers with three phalanges, thumb; poses `Z.HAND_POSES` and `Z.handWrap(R)`, which wraps the fingers around a handle of radius R; finger bones `fing`, `tip`, `thumb` curl them on the body), shoes and boots, and the outfit from `Z.OUTFITS` (collars, buttons, belts, coat tails that follow the thighs). `Z.dressedLook` turns the player's and companions' worn apparel into the look. All creatures are built in `zp-creatures` with `Z.MODEL_KIT` on the same rigs: the Colorado beetle and its queen, the mole cricket with digging claws, the black-headed gull, the catfish with barbels and a body that bends over five bones, broilers and the rooster, the marmot, the feral dog and the three-horned ox (the marmot and the ox are scaled by kind in `Anim.quad`), the sunflower, the Lunokhod, and the robots «Агрегат» (pioneer tie for Вожатый-7) and «Дружинник» (the Planner variant) |
| `zp-guns` | Weapon meshes from side-profile slabs (`slab`, `bar`) and barrels (`tube`), cached per model, with moving parts (`mag`, `slide`, `bolt`, `barrel`, `cyl` index ranges) and small props for reloads and gear (pistol magazine, stripper clip, shells, rounds, battery, holster, sheath, scabbard). `drawHeldList` draws each actor's weapon, its moving parts and extras from the matrices the animation computes |
| `zp-wield` | Weapon handling for both views. `Z.HOLD_DATA` gives every weapon model its grip (pistol grip, stock wrist, handle, ball) and support hold in gun space, its reload style (`box`, `grip`, `break`, `gate`, `clip`), bolt and gear (hip holster, back sling, belt, sheath, scabbard). Hand frames come from `Z.graspFrame`; one set of reload, bolt, swing, punch and throw tracks drives the first-person `Z.ViewModel` (draw/holster/swap, ADS, sprint, landing, quick throw with the left hand) and the third-person `Z.wieldTP` (the weapon is posed from the shoulders, both arms reach it by IK, fingers curl to the grip, holstered weapons hang on the body). The UI keeps a per-actor wield state (`a.wv`: shown weapon, draw progress); the sim adds `Z.SWAP_COOL`/`Z.DRAW_COOL` so shots wait for the draw |
| `zp-icons` | Item icons: amber pictograms drawn on canvas for every item (`Z.itemIcon`, `Z.iconHTML`), used in the Pioneer, barter, containers and the HUD |
| `zp-pieces`, `zp-piecegfx` | Site piece colliders and meshes (huts, kurens, palisades, kiosks, stalls, bridges, arch, dam, signs with Cyrillic text on face-texture layers 40–47) |
| `zp-sites` | `Z.defineSite`: local frames, auto pads, clearing OSM buildings and trees, doors and entrances, bridges from OSM roads (`Z.BRIDGE_SPECS`), colliders, nav |
| `zp-places` | Site data: Вознесенка, рынок, КПП, Сечь, музей, Змиева пещера, пионерлагерь, колхоз, птицефабрика, Скифский стан, дуб, плавни, Байда, Парк Победы, убежища, шламохранилище, площадь Маяковского, ДнепроГЭС, city entrances |
| `zp-people` | Named NPCs (`Z.NPCS`), vendors, spawn groups (`Z.SPAWN_GROUPS`), companions, lazy lookup of NPCs in unvisited interiors |
| `zp-rooms` | Interiors built from room rectangles (`plan`), props, objects, lights, NPCs and spawns |
| `zp-dlg` | All dialogues in the DSL |
| `zp-story` | Quests, notes, terminals, scripts, triggers (checkpoint, raid, island, battle), radiation zones, radio lines, ending slides, play area |
| `zp-extra` | UI-side systems: «Очко» table, newsreel ending, F7 debug menu (tabs Игрок: talons and experience; Карта: click anywhere on the map or on a place to teleport; Время: clock slider, times of day, weather; Сюжет: story shortcuts) on top of the `debugTeleport`, `debugSetClock`, `debugAdvance` and `debugXP` helpers in `zp-play`, Pioneer light (L), weather, survival needs, autosave on cell change |
| `falloutzp-app.js` | Window wrapper for the Win 98 desktop |

### Content formats

- **Site part**: `[kind, u, v, yaw, opts]` in the site frame (`at`, `rot`; `u` along the frame axis, `v` to its right). Segment kinds (`fence`, `picket`, `palisade`, `wall`, `ruinwall`, `sandbags`, `wire`, `pier`) take `[kind, u1, v1, u2, v2, opts]` and are split into 5 m pieces that follow the ground. Building kinds get a terrain pad automatically. `door: { to }` adds an interior door and a return mark `door_<cell>`.
- **Yaw**: one convention everywhere: an object with yaw `y` faces `(sin y, −cos y)`; yaw 0 faces north (−z). Meshes use `M4.trs(x, y, z, −yaw)`, colliders use `addBox(…, yaw)`.
- **Room**: `plan: { rooms: [[c0, r0, c1, r1, ch]], gaps, win, marks }`, one cell = 1 m; `,` is the second floor material, letters are marks (`A` is the entry). Exit doors go to `ext` with mark `door_<room>`.
- **Dialogue DSL**: `== tree`, `@ node`, `> line`, `! act; act ?cond`, `=> node ?cond` (condition optional), `* text -> node ?cond !act_with_underscores #skill:n:failnode %once`. Checks print their own `[Навык N]` label.

### Commands

- `node tests/falloutzp.test.js` — map and sites, both bridge tiers, all interiors, references, six main-quest routes (Комендатура, Сечь, Плановик, своя голова, суд Рады, поединок), side quests, arena, save/load with a companion, combat, F7 debug helpers, an icon for every item, Steam rules, no comments, Microslop/Win names.
- `node tools/steam-shots.cjs falloutzp` — Steam screenshots `content/steam/falloutzp-1.jpg` (Тарасова груша) and `-2.jpg` (the bridge at sunset).
- `node tools/falloutzp-shots.cjs <outDir> <steps.cjs>` — headless Edge screenshots of `falloutzp.html` driven by eval/key/shot steps.

## Interface

- **«Пионер-77»**: brown bakelite case, amber tube screen. СТАТ (state with labelled limb bars, ГТО, skills, perks, general), ВЕЩИ (weapons, apparel, aid, misc, ammo: rows with icons, an item card with a large icon, stats compared with what is worn or held, condition and key hints), ДАННЫЕ (map, quests, notes, radio).
- HUD: health and compass with markers lower left, action points, the held weapon's icon, condition and ammo lower right, the target's name and health on top, the sneak tag, XP and reputation messages.
- Dialogue: close-up of the speaker, reply list with check tags such as «[Красноречие 50]» and «[Наука]», success or failure marks.
- Barter, containers, workbench and campfire, the medical-board forms, level-up, terminals with the word-likeness hack, lock picking, «Очко» at the Intourist, waiting and sleeping, loading screens with Soviet posters, ending slides.

## Economy

Talons. Faucets: loot, quest rewards, selling. Sinks: ammo, aid, gear, vendor repairs, the doctor (limbs, radiation), bribes, the bridge toll, gambling, and implants at the НИИ doctor as the late sink. Barter skill moves buy prices from 1.6× to 1.15× and sell prices from 0.35× to 0.8× of the base value; reputation adds ±10 %.
