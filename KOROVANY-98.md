# Корованы — Win 98 Edition

A 3D action RPG built from Kirill's letter ("Я джва года хочу такую игру"). In the project fiction it is a 2000 release by the small studio «Джва Года Софт», made after Kirill sent them his idea. Game id `korovany`, sold only through the in-system Steam client (`steam: true`, $22.22, `C:\Games\Korovany\KOROVANY.EXE`). Not preinstalled, no setup outside Steam.

Every feature below traces back to a line of the letter. The letter is the spec; where it is vague the choice is written down here.

| Letter | Game |
| --- | --- |
| играть лесными эльфами, охраной дворца и злодеем | three playable sides with their own start, home, order giver and campaign |
| деревянные домики, набегают солдаты дворца и злодеи | Листва village of log houses and treehouses; the director sends raids from both enemies, houses can burn |
| можно грабить корованы | cow-drawn wagon trains on the roads, with guards and loot chests; robbing affects the owner's standing |
| густой лес, вдали деревья картинкой, вблизи трёхмерные | the forest is ~18 000 trees; far trees are impostor billboards rendered from the real 3D trees, near trees are 3D meshes; the switch is a dithered crossfade |
| покупать как в Daggerfall | shops with haggling, services (healing, rooms, prosthetics), a house for sale, use-based skills, fast travel on the map |
| враги трёхмерные, труп тоже 3д | articulated 3D bodies, corpses are verlet ragdolls that stay where they fell and can be searched |
| прыгать | jumping with real heights, standing on walls and platforms |
| охрана: слушаться командира, защищать дворец, ходить в набеги | orders from Воевода Груздь, reprimands for disobedience, wages, raids |
| злой: сам себе командир, приказывать войскам, напасть на дворец | Evil recruits troops, gives squad orders and leads the assault on the palace himself |
| 4 зоны: люди (нейтрал), император, эльфы, злой в горах со старым фортом | one continuous 1.2 km map split into those four zones |
| отрубить руку, не вылечат = умрёт; глаз = пол экрана не видно; протез; нога = ползать, коляска, протез | hit-location damage, severing, bleeding, half-screen blindness, crawling, wheelchair, three tiers of prosthetics |
| сохранятся можно | six save slots plus quick save |

## Hook

Three sides fight over one valley. Elves hold the dense western forest, the Emperor holds the palace on the northern hill, and in the old fort in the eastern mountains sits the one the palace calls Злой. Nobody remembers his name. The town of Развилки in the middle trades with everyone and sends its cow wagons down every road.

## Theme

- **Premise:** a maimed body stays a life as long as someone cares for it.
- **Counter-premise (Злой):** the Empire throws its broken people away, so the broken take what they need by force.
- Злой was an imperial officer who lost his left arm and right eye in the war against the elves. The palace struck the names of maimed veterans out of the Chronicle stone. His army in the fort is made of such veterans, and many of them walk on pegs and carry hooks.
- Each side treats its wounded differently, and that is mechanical: elves heal elves for free at the herbalist, the guard's treasury pays half of a guard's prosthetic while he has no reprimands, the fort smithy forges hooks and pegs at half price for Evil's people. The town prosthetist sells to everyone at full price.
- Motifs: the **prosthetic** (worn by NPCs, looted from corpses, bought, fitted), the **name** (the scraped Chronicle stone in the palace yard; playing as Злой the name field reads «Имя не придумано» until the finale, where the player carves a name into the stone), the **cow** (every caravan is pulled by cows; the joke of the title and the valley's living trade).

## Pillars

1. **Every hit lands somewhere.** Damage goes to the body part the blade or arrow actually touched. Limbs can be broken, severed or replaced, for the player and for every NPC.
2. **The valley lives without you.** Caravans travel, raids march, spies sneak, corpses stay. The player joins events that would happen anyway.
3. **Your side, your rules.** Elves defend and rob, guards obey and protect, Evil commands. The same world is played three ways.

Target aesthetics: fantasy (being an elf partisan, a palace guard or a warlord), challenge (melee where aim height matters), discovery (the forest, the fort, caravan routes from rumours).

## Loops

| Loop | Length | Content |
| --- | --- | --- |
| Moment | seconds | Swing at the height you look at, block, jump, shoot. Every hit shows where it landed on the HUD body doll and on the body itself. |
| Session | 5–15 min | One order or one free activity: rob a caravan, repel a raid, stand a post, recruit and march. Ends with loot, wages or a wound to fix. |
| Meta | 7 orders per side | Campaign orders, gear, skills, prosthetics, a house, faction standing. Each side has its own finale and ending text. Free play continues after the ending. |

## Body and injuries

Skeleton of 16 joints, 6 hit parts: head, torso, left/right arm, left/right leg. Every part has its own HP; torso and head hits go to the main HP, limb hits go to the limb and half of it to the main HP.

- **Broken limb:** limb HP at 0 from a blunt hit, or from a cut that did not sever. An arm drops what it holds, a leg makes you limp. A healer fixes it.
- **Severed limb:** limb HP at 0 from a cutting weapon, chance grows with the weapon's `cut` and the overflow damage. The piece falls as its own ragdoll. The stump bleeds: about 1.2 HP/s, so roughly a minute to live. A bandage (`B`) or a healer stops it; a friendly medic NPC runs over and bandages allies. Cutting a lower segment (forearm, shin) loses the limb below the joint; an upper segment loses the whole limb.
- **Head:** a cutting blow that empties the head HP takes the head off (death). A thrust or an arrow to the head can put out an eye: the player loses that half of the screen (a black half with a soft edge). Two lost eyes leave only a dim blur.
- **No arm:** right arm lost: the weapon moves to the left hand with a speed penalty, no shield. Both arms lost: kick only.
- **No leg:** crawl at 0.9 m/s with a low camera, or sit in a wheelchair, or fit a prosthetic.

Prosthetics (bought, or taken from corpses of veterans; simple ones can be strapped on by yourself, good ones need a master):

| Part | Prosthetic | Price | Effect |
| --- | --- | --- | --- |
| arm | Крюк | 60 | holds a shield strap, hook attack 6 dmg; no weapon |
| arm | Деревянная рука | 140 | holds a shield or a dagger, −20% swing speed |
| arm | Железная рука (master) | 480 | full use, +2 armour on that arm |
| leg | Деревянная нога | 80 | 3.4 m/s, no sprint, jump 60% |
| leg | Кованая нога (master) | 520 | full speed, sprint 90% |
| legs | Коляска | 160 | sit in it without legs: 3.6 m/s on flat ground, slow uphill, no jumps |
| eye | Стеклянный глаз | 40 | looks real, does not see |
| eye | Зрячий кристалл (master) | 420 | restores the half of the view with a faint tint |

## Combat

- `LMB` swing or shoot, `RMB` block (or draw the bow). Swing height follows the look pitch: look up for the head and arms, level for the torso, down for the legs. Spears and daggers thrust, swords and axes swing sideways, maces chop from above.
- Melee is geometric: during the strike window the blade segment (hand to tip) is swept against the capsules of nearby bodies. The first capsule touched is the hit part. An arm held in front of the chest gets hit first.
- Blocking from the front within 70°: shield takes 80% off, a weapon 50%; no severing through a block; costs stamina.
- Arrows are projectiles with gravity, tested against capsules; they stick in the ground and can be picked up.
- Weapons (dmg, swing time, reach, cut): Нож 9 / 0.45 s / 1.2 m / 0.4; Эльфийский клинок 13 / 0.55 / 1.5 / 0.7; Меч 16 / 0.7 / 1.7 / 0.8; Топор 21 / 0.9 / 1.6 / 1.2; Секира 32 / 1.25 / 2.0 / 1.6; Копьё 18 / 0.8 / 2.6 / 0.25; Булава 19 / 0.85 / 1.5 / 0; Лук 18 at full draw; Арбалет 30, reload 2.2 s.
- Skills grow by use (Daggerfall style): Ближний бой, Стрельба, Блок, Атлетика, Торговля, Скрытность. 1–100, small effects.

## Zones and places

Map 1200 × 1200 m, x east, z south, heightfield every 4 m.

| Zone | Where | Places |
| --- | --- | --- |
| 1. Люди (нейтрал) | centre, farmland and a lake | Развилки: market, tavern «Корова и колесо», healer Матрёна, prosthetist «Деревяшкин и сын», armourer, general store, a house for sale, militia |
| 2. Император | north, a hill over wheat fields | the palace: walls with a walkway, gate towers, courtyard, barracks, Chronicle stone, keep with the throne hall; commander Груздь, Emperor Велимир III |
| 3. Эльфы | west, the dense forest | Листва: log houses, treehouses on stilts, Elder Ясень's oak, herbalist, archery range; the partisan camp further in |
| 4. Злой | east, mountains | the old fort on a plateau up a switchback road: broken walls, towers, keep yard, recruit board, smithy |

Roads: Развилки–palace (main caravan road), Развилки–fort (mountain road), Развилки–forest trail, palace–fort (military road), palace–forest (raid road).

## The living valley (director)

- **Caravans:** 2–3 wagons pulled by cows, a driver and 2–4 guards. Imperial supply runs Развилки → palace every ~8 game hours (wages chest, grain, wine). Smugglers run Развилки → fort at night. Robbing: deal with the guards, then search the wagons. Rumours in town tell when the next caravan leaves.
- **Raids:** palace and fort send squads to Листва, the fort sends squads to the palace, elves send partisans and spies into the palace and the fort. Squads march along roads, fight, set elf houses on fire. Houses are rebuilt after two days.
- **Strength:** each side has a pool that refills slowly; garrisons are topped up from it. A side at zero pool stops raiding.
- Time: one real second is one game minute.

## The three campaigns

**Эльф** (Elder Ясень): 1 «Первая стража» repel scouts at the edge of Листва; 2 «Корован» rob the imperial supply caravan; 3 «Набег» defend the village from palace soldiers; 4 «Глаза леса» steal the guard rota from the palace barracks unseen (hood, crouch, night); 5 «Двойной удар» defend against Evil's warband, then rob a smuggler caravan; 6 «Партизаны» lead partisans to burn the fort's supply tents; 7 «Последний лист» Evil's army marches through the forest: kill Злой.

**Охрана дворца** (Воевода Груздь): 1 «Присяга» stand the gate post until relieved and check the travellers (one is an elf spy); 2 «Обоз» escort the supply caravan; 3 «Шпион» find the elf spy in Развилки from rumours and pull off hoods; 4 «Набег на Листву» march with the squad, burn three houses; 5 «Ночь у ворот» defend the palace from Evil's assault; 6 «Разведка» reach the lookout over the fort and come back; 7 «Штурм форта» break the fort gate and kill Злой.
Obedience rules while an order is active: stay at the post, stay within 40 m of the commander on a march, do not rob imperial caravans, do not attack townsfolk. Each breach is a reprimand; three reprimands mean arrest (pay a fine, sit in the cell or fight and become an outlaw). Wages 30 per day at the commander while there are no reprimands.

**Злой** (self-commanded, the war table in the fort lists goals instead of orders): 1 «Сбор войска» recruit six soldiers; 2 «Казна» take 400 gold from caravans; 3 «Лесная заноза» repel the partisans that attack the fort; 4 «Тихий набег» burn Листва's lookout; 5 «Глаза дворца» kill the palace commander's scouts on the military road; 6 «Таран» bring the army to the palace gate and break it; 7 «Трон» kill Velimir III and carve your name into the Chronicle stone.
Squad orders (`Q` then a number): 1 за мной, 2 стоять здесь, 3 атаковать цель под прицелом, 4 вольная охота, 5 на дворец.

Every finale checks world state, so killing Злой early (as an elf) completes that objective in advance.

## Economy

Gold. Faucets: caravan chests (30–200 gold plus goods to sell), corpses (5–40), order rewards (30–300), guard wages (30 per day), Evil's daily tribute (40 per day from the mountain villages). Sinks: prosthetics (40–520), healing (25–60, free for elves at their herbalist), weapons and armour (20–600), recruiting (60 per soldier), room 5 per night, the town house 1500, a fine 150. Haggling: one try per shop per day, success by Торговля skill and standing gives −10…−25%, failure gives +10% until the next day.

## Controls

`WASD` move, `Shift` sprint, `Space` jump, `C` crouch, `LMB` attack, `RMB` block or aim, `R` sheathe or draw, `1`–`4` weapon slots, `E` use, talk, search, `B` bandage, `H` potion, `V` first or third person, `I` inventory, `M` map (fast travel), `J` journal, `Q` squad orders (Evil), `T` wait, `F5` quick save, `F9` quick load, `Esc` menu.

## Technical layout

- Modules `js/apps/korovany/kv-*.js`: `core` (math, noise, rng), `data` (items, kinds, shops, texts), `world` (terrain, roads, places, buildings, trees, colliders, nav grid), `body` (skeleton, procedural poses, IK, hit capsules, ragdolls), `game` (actors, physics, combat, injuries, inventory, trade, saves), `ai` (NPC behaviour, squads, director), `quests` (campaigns), `tex`, `models`, `render` (WebGL 1), `audio`, `ui` (loop, camera, input, HUD), `screens` (DOM windows). Wrapper `js/apps/korovany-app.js`, page `korovany.html` (`window.kvui`), css `css/apps/korovany.css`. Saves: index in `localStorage` key `korovany98_saves`, each slot in `korovany98_save_<slot>` (slots 1–6, `quick`, `auto`); options in `korovany98_options`.
- `game`, `ai`, `quests`, `body`, `world` are DOM-free, so the whole valley runs in Node for tests.
- Trees: per species a 3D mesh and an impostor cell rendered from it into an atlas at start. Far trees are static billboard buffers per 64 m chunk; near trees (radius set in options) are drawn as instanced 3D meshes. Both use a screen-door dither on the distance band, so a tree turns into its 3D version as you walk up to it.
- Bodies of all actors, corpses, limbs, wagons and cows are transformed on the CPU into one dynamic buffer per frame.
- Test `node tests/korovany.test.js` (`npm run test:korovany`, about 10 s): load order and zero comments, world (zones, roads, dense forest, walkable spots, paths into buildings), body capsules and aim height, severing, bleeding to death, the medic who bandages you, prosthetics and mobility modes, eyes, NPC duels and ragdolls, caravan robbing, shops, haggling, house, recruiting, reprimands and arrest, save and load, fast travel, three full campaign walkthroughs and three days of the director.
- Browser checks: `node tools/korovany-shots.cjs <out> <steps.cjs>` (headless Edge with SwiftShader; helpers `kvShots.start(fac)`, `tp(x, z, yaw, pitch)`, `hour(h)`, `run(sec)`, `info()`). `KV_PAGE=index.html KV_READY='!!(window.winManager && window.appSteam)'` runs it on the desktop.
- Steam screenshots: `node tools/steam-shots.cjs korovany` (recipe in `tools/steam-shots-recipes.cjs`).

## Pitfalls

- Spawn and teleport with `world.groundAt(x, z)`, never `floorAt(x, z, 999)`: the latter puts people on top of platforms and roofs.
- The impostor atlas is 1024×256 with 128 px cells; billboard u = species × 0.125, v grows from the tree base (GL texture origin).
- A fleeing NPC and its chaser used to run at the same speed forever; wounded actors (below 35% health) now run slower and chasers sprint after a fleeing target.
- Camera collision tests trees as well as buildings; without it the third-person camera ends up inside trunks in the forest.
