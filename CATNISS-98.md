# Catniss — Win 98 Edition

Original 2D platformer built from the asset pack in `content/Catniss/`. In the project fiction it is a small 2000 release by Kotelok Games. Game id `catniss`, sold only through the in-system Steam client (`steam: true`, $7.99, `C:\Games\Catniss\CATNISS.EXE`). The $7.99 price matches Avatar 98 on purpose (user request), so `catniss` is not in the distinct-price list of `tests/steam.test.js`.

## Hook

A white van with «ОТЛОВ» on its side takes the kittens from the yard. On the first bump its back door swings open and three of them jump out somewhere along the road. The ginger cat Catniss follows the van: meadow, mountains, construction site, neon city. Snezhka is still in the cage on the van roof.

## Pillars

1. **Cat agility.** Three verbs that feel like a cat: a variable jump, a pounce (short horizontal dash that also attacks) and claws on walls (cling, slide, kick off).
2. **Four places, four rules.** Every world adds its own hazards instead of harder copies of the same ones.
3. **Curiosity pays.** One goldfish bag per level, always breadcrumbed: cracked walls, a glint under a bridge, coins leading into a wall, a bag seen far above.

Target aesthetics: challenge (precise jumps), discovery (fish bags), fantasy (being a nimble cat).

## Loops

| Loop | Length | Content |
| --- | --- | --- |
| Moment | seconds | Run, jump, pounce, cling, stomp. Every action has a sound, dust or squash. |
| Session | 2–5 min | One level: teach → develop → twist, 1–2 checkpoint boxes, an exit door or a cage. |
| Meta | 13 levels | Unlock levels in order, rescue a kitten per world (playable skin), fill the aquarium (12 fish), open the bonus level. |

## Rules

- **Lives are health.** Hearts in the HUD, max 9 (cats have nine lives). A hit costs one heart with knockback and 1.3 s of invulnerability. Pits, water and the wolf pack cost one heart and respawn at the last box. At 0 the level restarts. Every level starts with at least 5. 50 coins or a milk bowl give one heart.
- **Stomp** any enemy from above. **Pounce** (`X`) knocks enemies out from the side, refills itself after a hit, a landing or a wall cling. Dogs and wolves take two hits; the first one stuns them (harmless while stunned).
- **Claws:** in the air, hold toward a wall to slide slowly, press jump to kick off. One wall gives about +2.6 tiles once; shafts of 2–3 tiles can be climbed by zigzag.
- Planks (`=`, `-`) are one-way; `↓`+`Z` drops through them. Cat-size crawlspaces are one tile high; dogs (18 px) cannot follow.
- Secrets: cracked walls `X` look solid (faint crack marks) and are passable.

Player metrics (`C.PH` in `cn-core.js`, measured by the test): hitbox 14×13, run 105 px/s, full jump 3.4 tiles high, about 4 tiles across, pounce extends a running jump to 5.4–7.8 tiles. Tiles are 16 px, the screen is 320×240 and is scaled by an integer factor.

## Worlds and levels

| Level | Name | Teaches / tests | Fish hiding place |
| --- | --- | --- | --- |
| 1-1 | Утро во дворе | run, jump, stomp hens, coins, box, crawlspace | chamber inside the hill, entered from the tunnel through a cracked tile |
| 1-2 | Овечий выгон | sheep bounce (hold jump for higher), claws in a shaft, birds | crack in the bridge on the cliff top, coins above it |
| 1-3 | Через ручей | pounce, water, bridges, dog; rescue Уголёк | ledge under a long bridge (`↓`+`Z`) |
| 2-1 | Горная тропа | cracked stones, diving birds, wolves | cave under the path, entered by a cracked stone |
| 2-2 | Ущелье | vertical climb, shafts, rock spikes | cracked wall at the top shelf |
| 2-3 | Волчья погоня | autoscroll chase (62 px/s, 2 s head start); rescue Черника | high route of planks above the cracked stones |
| 3-1 | Ворота стройки | conveyors, falling bricks (shadow warning), guard dogs | inside a hanging pillar, jump up into it |
| 3-2 | Строительные леса | moving platforms, lift, pigeons | plank at the crane top, ride the second lift |
| 3-3 | Котельная | steam vents (puff before a blast), vents on pillars over spikes; rescue Пятнашка | cracked room at the end of the catwalk |
| 4-1 | Ночная улица | cars (wait on awnings or ride the roof), blinking neon | trapdoor in the cafe roof |
| 4-2 | Крыши | fans, neon bridges, crows | high plank above a fan |
| 4-3 | Фургон «ОТЛОВ» | boss; rescue Снежка, credits | kiosk with cracked walls |
| B | Рыбный день | bonus coin run, opens with all 12 fish | — |

Boss: the van drives to one side of the arena, opens the back doors (1, 2, then 3 dogs), then the cage on its roof glows for 3.4 s. Stomp or pounce the glowing cage three times. Its sides hurt only while it moves; the roof is a platform. Losing a life keeps the van damage.

## Interface

Each screen was designed for its own job, not from a shared layout:

- **Title:** meadow parallax, three kittens walking, the big ginger cat (recoloured Topey art), wobbling logo, short menu.
- **Intro:** four story cards with small animated scenes and a typewriter caption.
- **Map:** one horizontal panorama of the four worlds along the van route, road with signposts (`1-1`… plates: orange open, green done, blue dot fish, yellow dot all coins), cages over rescue levels, kitten heads top-left (`C` cycles the playable cat), fish counter top-right (`Q` aquarium), level plate at the bottom.
- **Level:** only hearts, coins `found/total` and the level's fish bag. Signs open a speech bubble near the player. Banner with world and name for 2.8 s.
- **Pause / results / game over** are overlays on the frozen level.
- **Aquarium:** the 12 bags from `Fish.gif` at native resolution, dark silhouettes until found, hint line with the level.

Controls: arrows/WASD, `Z`/Space jump, `X`/Shift pounce, `↓`+`Z` drop, Esc/P pause, M music. Gamepad: A jump, X/B pounce, Start pause.

## Assets

| File | Use |
| --- | --- |
| `Sprites1.png` (32 px RPG sheet) | Catniss (orange), Уголёк (black), Черника (navy), Пятнашка (calico), Снежка (white) |
| `Sprites2.png` | dog (recoloured dark for the site, grey for the city), hen, sheep, wolf |
| `d2Uw9Pn.png` (48 px) | kitten portraits on the results card |
| `Birds.png` | sparrow, cardinal, jay, dove; crow is a dark recolour |
| `cat_sprite_sheet_by_inkybiscuits` | title art: white keyed by flood fill, grey recoloured to ginger |
| `GrassLand/` | tileset (recoloured per world from its PICO-8 palette), details, water, butterflies, exit door |
| `parallax_mountain_pack`, `parallax-industrial-web`, `cyberpunk-street-files` | backgrounds of worlds 2–4 |
| `24-color.png` | coin, resampled from 6 px art pixels to 16×16 |
| `Fish.gif` | 12 fish bags, frames decoded with `ImageDecoder` |
| `12157.ttf` | VCR OSD Mono with Cyrillic, all UI text |
| `Background music/1.mp3`, `2.mp3` | levels / menus and the boss |

Not used: `GXSCC` (a MIDI-to-chip converter, not game data). Procedural pixel art covers what the pack lacks: checkpoint box, cage, signs, spikes, milk, van, cars, vents, fans, droppers, bricks, conveyors, neon bars and signs (3×5 micro font).

## Architecture

`js/apps/catniss/` modules, namespace `Catniss`, load order `cn-core, cn-sim, cn-levels, cn-assets, cn-render, cn-audio, cn-ui, cn-screens`; wrapper `js/apps/catniss-app.js` (`appCatniss`), page `catniss.html` (`window.cnui`), save key `catniss98_save`.

- `cn-sim.js` has no DOM: fixed 120 Hz step, tile collision, entities, events drained by the UI for sound and particles. It runs in Node for tests.
- `cn-levels.js`: ASCII maps, joined from chunks with `join()` (rows padded with their last ground or water symbol). Map legend: `#` ground, `X` cracked passable wall, `C` cracked stone, `=` plank, `-` bridge, `<` `>` conveyor, `t`/`T` neon (two phases, `flicker` period), `^` spikes, `~`/`w` water, `P` start, `E` exit, `@` cage, `K` box, `o` coin, `F` fish, `M` milk, `?` sign (texts in `signs`, ordered by column), `h` hen, `d` dog, `l` wolf, `s` sheep, `b` bird, `r` diving bird, `u` butterfly (+3 coins), `m`/`n` horizontal/vertical platform with `:` end markers (centre positions), `V` vent, `f` fan, `x` brick dropper, `q` car lane, `Z` van; decor `Y` tree, `y` bush, `%` stone, `J` neon sign.
- `tools/catniss-reach.cjs` checks every level with the real player physics: BFS over standing tiles with walk, drop, jump (tap/full, with and without pounce at several moments) and wall zigzag policies. It reports the goal, the fish and the way back, unreachable coins and soft locks. `node tools/catniss-reach.cjs [id] -m` prints the map with reached tiles.

## Tests and tools

- `node tests/catniss.test.js` (`-v` prints checker timings): files and load order, zero comments, level structure, reachability of all 13 levels, jump metrics, stomp/pounce/hurt, dogs, checkpoints, coins and lives, cracked stones, steam, fans, conveyors, neon, water, cars, the chase, the full boss fight, cage rescue, progress unlocks, Steam catalog entry and gating.
- `node tools/catniss-shots.cjs <out> <steps.cjs>`: headless Edge, helpers `cnShots.reset/play/tp/run/info`, `lshot` crops in 320×240 coordinates.
- Steam screenshots: `node tools/steam-shots.cjs catniss`.
