# Overwatch 98

A from-scratch 6v6 hero shooter built on the rules of Overwatch as it launched in 2016, reimagined as a 2000-era release. It has twelve heroes, eight maps in four modes, bots at three skill levels, a training range with a tutorial, Play of the Game, killcams, medals, levels and loot boxes. Rendering is WebGL with baked vertex lighting and low-resolution pixelated output. All models, textures, sounds and music are generated in code.

- Distribution: sold in the in-system Steam client (`steam: true` in `js/game-manager.js`, $38.99). The game is not preinstalled.
- After installation you get: a desktop icon **Overwatch 98**, a Start menu entry **Overwatch 98**, and `C:\Games\Overwatch\OVERWATCH.EXE`. Run accepts `overwatch`, `ow`, `ow98`, `overwatch 98` and `овервотч`.
- Standalone page: `ow98.html` (`window.owui` is the UI instance).
- Test: `npm run test:ow98` checks navigation on every map and stage, hero kits, the tutorial and range, hero models and skins, cosmetic icons, the F7 debug key, one bot match per map, page wiring and the zero-comment rule. It runs about 770 checks in 15–50 s, including checks that every emote moves, every dance loops, no two victory poses are alike and every animation stays finite. Add `--quick` to skip the bot matches, or `-v` for per-map results.

## Controls

| Input | Action |
| --- | --- |
| W A S D, mouse | Move, look |
| Left / right mouse button | Primary / secondary fire |
| Space, Ctrl | Jump, crouch |
| Shift, E | Abilities |
| Q | Ultimate |
| R, V | Reload, melee |
| 1 / 2 | Weapon slot (Mercy, Torbjörn) |
| H | Hero select. Works in spawn, while dead, and anywhere in the training range. |
| Tab | Scoreboard |
| T, B | Spray, emote |
| X, Z, C | Voice lines: need healing, group up, ultimate status |
| Esc | Pause menu |
| F7 | Debug: adds five loot boxes (works in menus and in a match) |

## Heroes

| Role | Heroes |
| --- | --- |
| Offense | McCree, Soldier: 76, Tracer |
| Defense | Junkrat, Torbjörn, Widowmaker |
| Tank | Reinhardt, Roadhog, Winston |
| Support | Lúcio, Mercy, Zenyatta |

- Stats, kits and Russian descriptions live in `O.HEROES` (`ow-data.js`). Kit logic is in `ow-kits.js` / `ow-kits2.js`.
- Armor reduces each hit by `min(5, damage / 2)`.
- Ultimate charge comes from damage and healing at 1:1, plus a passive 4 per second.
- Every team is limited to one of each hero.
- The training robot `trainbot` has `training: true`. It is not in `HERO_ORDER`, so players cannot pick it.

## Hero gallery and cosmetics

- **Collection** (`ГАЛЕРЕЯ ГЕРОЕВ`): heroes grouped by role, each card shows the hero icon, the name and how many of the hero's 41 items are collected.
- **Hero screen**: a category rail (skins, emotes, victory poses, voice lines, sprays, highlight intros), the item list with an icon for every item, the selected item's rarity plate and one action button.
  - Selecting an item previews it: skins recolour the model, emotes and poses play on the model, intros replay with a camera sweep, voice lines are spoken and shown as a subtitle.
  - Sprays replace the model: the selected spray is shown painted on a brick wall.
  - Buying takes two presses of the action button (the second press confirms).
  - Keys: ↑/↓ item, ←/→ category, Space buy or equip, Esc back. Dragging the model with the left mouse button turns it.
- **Live model**: the hero is a real 3D model on a pedestal, rendered every frame. It uses a second transparent WebGL canvas (`ui.stageCanvas()`, `Renderer.showcase`) that is moved into whichever screen shows a hero: the main menu, the hero screen and hero select. On the stage the hero plays a calm idle with the weapon lowered.
- **Item icons**: skins use the hero's portrait in that skin, emotes and poses a white silhouette of the pose, sprays their art, voice lines and intros a category glyph. Loot boxes show the same icons.
- **Player icons**: twenty icons (`O.playerIconArt`) are picked and bought on the profile's `ИКОНКИ ИГРОКА` tab. The chosen icon appears on the player badge.
- **Sprays**: `Портрет` is a stencil of the hero's portrait and `Пиксели` a 16×16 pixel copy of it. The other sprays are drawn shapes in the hero's colours (`O.HERO_TINT`).
- **Legendary skins have their own models.** Rare and epic skins recolour the base model. Each of the 24 legendary skins also changes the geometry through a kit in `ow-skins.js` (`O.SKIN_KITS[hero][skin]`): `hide` lists base parts to drop (for example `locks`, `head`, `serape`, `visor`, `crest`, `wings`, `halo`) and `add(M, S, P)` builds the new parts. Examples: Punk Tracer's mohawk and spiked collar, Strike Commander without the mask, Gambler's frock coat and cards in the hat, Scarecrow's sack head, Odile's tutu and feather crown, Blackhardt's spikes and torn cape, Lionhardt's mane, Sanitarium's straitjacket and muzzle cage, Explorer's pith helmet, Ribbit's frog hood, Devil Mercy's horns, bat wings and tail, Nutcracker's shako.

## Animation

### Emotes and victory poses

Every hero has six emotes and seven victory poses of their own. They are based on the hero's cosmetics in Overwatch and are not shared between heroes.

| Hero | Emotes | Victory poses |
| --- | --- | --- |
| Tracer | Стойка, Посижу, Хохот, Ура!, Вертушка, Свинг | Героическая, Честь, Через плечо, Сидя, Фейерверк, Медаль, Уверенность |
| Soldier: 76 | Стойка, На колено, Смешно, Я слежу, Отжимания, Танец ветерана | Героическая, На изготовку, Кулак вверх, Солдат, Честь, На колено, Тост |
| McCree | Стойка, Привал, Смешок, Ковбойский трюк, Шляпа, Кантри | Героическая, Через плечо, Спокойно, Дуэль, Руки вверх, Перекур, Медаль |
| Junkrat | Стойка, Лентяй, Хи-хи, Жонглёр, Водевиль, Крысиный бег | Героическая, Бе-бе-бе, На колене, Вредно для здоровья, Фото в профиль, Детонатор, Медаль |
| Torbjörn | Стойка, Перерыв, Гогот, Каблуки, Кулачный бой, Пляска | Героическая, Перекур, Молот, На турели, Фейерверк, Отдых, Медаль |
| Widowmaker | Стойка, Отдых, Восторг, Поцелуй вдовы, Поклон, Балет | Героическая, Визор, Взгляд, Через плечо, Веер, Паучок, На прицеле |
| Reinhardt | Стойка, Преклонение, Хохот, Вызов, Шуплаттлер, Салют воина | Героическая, Легенда, Уверенность, Сила, Колено, Триумф, Тост |
| Roadhog | Стойка, Устал, Хрюк, Бу!, Банка, Свинский танец | Героическая, Класс, Палец вверх, Устал, Рок, Фото, Тост |
| Winston | Стойка, Посидим, Смешно, Рык, Арахисовое масло, Твист | Героическая, Зверь, Очки, Мыслитель, Бенгальские огни, Арахисовое масло, Победа |
| Lúcio | Стойка, Отдых, Хлопок по колену, В ритме, Капоэйра, Лунная походка | Героическая, Ритм, Уверенно, К бою, Барабан, Стойка на руке, Присел |
| Mercy | Стойка, Отдых, Аплодисменты, Кадуцей, Нет пульса, Хастл | Героическая, К бою, Ангел, Беззаботность, Фонарик, Зонтик, Гордость |
| Zenyatta | Стойка, Медитация, Щекотно, Вызов, Аплодисменты, Танец | Героическая, Гармония, Равновесие, Мир, Медитация, Медали, Прошу |

- Clips live in `ow-clips.js` (offense and defense heroes, the clip player) and `ow-clips2.js` (tanks and supports). A clip is a list of keyframes `[time, {BONE: [x, y, z]}, ..., ease]`. Bone names are `SP`, `HD`, `UAL`/`LAL`, `UAR`/`LAR`, `ULL`/`LLL`, `ULR`/`LLR`, `GUN`, `OFF`, `ALT`, `BK`, plus `rr` (root rotation) and `ro` (root offset in hip heights). Each key keeps the values of the previous key and changes only what it lists.
- Options: `loop: [from, to]` repeats a section (dances, sitting), `spline` makes smooth curves through the keys, `osc` adds sine motion to one channel, `mir()` mirrors a key left to right, `gun`/`off`/`w` choose which weapons stay in the hands, `icon` picks the frame for the item icon, `rest` sets the start pose (Zenyatta floats cross-legged).
- Motion capture: a clip with `mocap: '<name>'` instead of `keys` plays a recorded clip from `ow-mocap.js` (every frame becomes a key, `loop: true` repeats the whole clip). `ow-mocap.js` is generated by `node tools/mixamo-import.cjs overwatch` from the Collada files in `src/mixamo/overwatch/`; the clip table is in the tool. Tracer's dance (Свинг) is the first such clip. Its option `stay` removes the slow drift of the hips so the dance stays on the spot.
- Props: clips can put items into the scene (`props`). An item is attached to the right or left hand (`R`/`L`, the same axes as the weapons), the head (`H`), the chest (`C`) or the ground (`G`), and `path` animates it, for example Junkrat's juggled grenades. Item models are `O.ITEM_MODEL` in `ow-props.js`: mug, teacup, medal, firework rocket, sparkler, pumpkin, peanut butter jar, fan, parasol, lantern, drum and stick, bowl, Zenyatta's orbs, mugshot sign, detonator, dynamite, spider, grenade, soda can, turret and tire.
- Victory poses ease in for half a second and then breathe. Emotes blend in from the current pose and blend back out.
- In a match, `B` plays the equipped emote; the camera swings to the hero's front and slowly orbits. Looping emotes run until you move, shoot or jump. Attacking bots sometimes emote in their spawn room while they wait for the doors to open.
- The gallery replays emotes in a loop and restarts highlight intros with the camera sweep. Play of the Game starts with the hero's highlight intro clip (`O.Clips.intro`) seen from the front; the replay waits until the intro ends, so the intro never hides the start of the highlight.
- The post-match cards show each hero in their equipped victory pose; bots use one of their hero's poses.

### Third person

- Movement is measured from the hero's real velocity, so the run cycle follows the direction of travel: forward, backward and sideways steps, with the hips turned toward the direction of movement.
- Every hero has a gait (`GAIT` in `ow-anim.js`): stride, knee lift, bounce, lean and sway. Tracer sprints low, Junkrat limps on the peg leg, Torbjörn takes short heavy steps, Roadhog waddles, Widowmaker and Mercy walk on a line. Lúcio skates with alternating pushes, Zenyatta floats cross-legged and tilts toward his movement.
- Jumps tuck the legs on the way up and stretch them on the way down. Landings dip the body according to the fall speed. Crouching, sprinting, Reinhardt's barrier and Widowmaker's scope blend in and out instead of snapping.
- Hits make the hero flinch away from the attacker. Deaths fall backward, forward or to the side depending on where the killing blow came from.
- Every ability has its own pose: throws differ for grenades, fields, turrets and armor packs, Reinhardt's swings, Earthshatter and Fire Strike, Roadhog's hook, breather and Whole Hog, Winston's leap and Primal Rage punches, Mercy's resurrect and Guardian Angel, Lúcio's Sound Barrier, McCree's Deadeye and roll. Reloads are hero-specific (Tracer spins her pistols, McCree loads the cylinder by hand, Roadhog shoves scrap into the gun).

### First person

- The view model lags behind mouse movement on springs, rolls when strafing, bobs with the stride, dips on landing, lowers when crouching and breathes when standing still.
- Each hero raises the weapon after spawning, changing heroes or switching weapons (Torbjörn, Mercy).
- Weapons are split into parts that move on their own (view bones 4–6, `VM_PART` in `ow-anim.js`): McCree's cylinder turns after every shot and swings out to reload, Soldier: 76 and Widowmaker drop the magazine into the left hand, Junkrat twists the drum, Lúcio spins the speaker, Zenyatta's orbs return to both hands.
- Thrown abilities show the item in the left hand before it flies: flashbang, Biotic Field, pulse bomb, concussion mine, steel trap, turret, armor pack, venom mine, barrier projector and the breather canister.
- Recoil is a spring kick with a small alternating roll. McCree's left hand fans the hammer, Mercy pushes the staff forward while the beam is on, Reinhardt's hammer follows the swing.

## Graphics and effects

- **Hitscan shots** (`ow-fx.js`, `O.FX_SHOT`): every `tracer` kind from the kits has a style. `pulse` (Tracer, Soldier: 76, Widowmaker's auto fire, the training bot) is a glowing bolt that flies to the target; `tracer` (McCree, turret) a fast thin streak; `pellet` (Roadhog, Torbjörn's alt fire) short streaks; `sniper` (Widowmaker scoped) a beam that fades and leaves a smoke trail. The impact waits until the bolt arrives: sparks, a dust puff and a bullet hole that fades after 9 s on walls, a flash and sparks on heroes (more for critical hits), a hex flash on barriers.
- **Muzzle flashes**: third person from the tracer event; in first person the flash is drawn at the barrel of the view model (`VM_MUZZLE` in `ow-render.js`), and your own shots start at the barrel you see on screen (`Renderer.fpMuzzle`).
- **Projectiles** leave trails (`PROJ[kind].trail`: smoke, fuse sparks, embers, sparkles, sonic rings, flames, venom drips). Explosions have a flash, fireballs, a shock ring, sparks, smoke and a light.
- **Dynamic lights**: shots, impacts, explosions, glowing projectiles and Biotic Field emit short lights (`parts.light`). Every frame the four strongest lights near the camera go to the world, water and model shaders.
- **Shaders**: models are lit per pixel (wrap diffuse, sky/ground ambient, rim light, specular from a per-vertex gloss channel `aMat`); gloss comes from `O.HERO_GLOSS` colour slots. Hit heroes flash white for 0.12 s. The world shader adds dynamic lights and fog that glows toward the sun. Water has its own shader with moving waves, Fresnel sky reflection and sun glints.
- **Sky**: procedural clouds per map time (`CLOUDS`: day, dusk, night, rain), sun disc and halo, twinkling stars and a moon at night. On the rain map lightning flashes light the sky, water and world and a thunder sound follows. Rain falls as streaks.
- **Post-processing** (option `СВЕЧЕНИЕ И ВИНЬЕТКА`, `opts.post`): the scene renders into a framebuffer whose alpha channel is a glow mask (emissive world faces carry negative vertex colours, emissive model parts, additive effects, the sun). Bloom blurs only the masked pixels at quarter resolution, then the composite adds a slight saturation boost and a vignette.

## Maps and modes

| Mode | Maps | Rules |
| --- | --- | --- |
| Assault | Hanamura, Volskaya Industries | Capture A, then B. Captures lock progress in thirds. Overtime uses a 3 s fuse. |
| Escort | Dorado, Watchpoint: Gibraltar | Payload speed rises with 1, 2 or 3 pushers (1.4 / 1.75 / 2.05 m/s). The payload rolls back after 10 s with no attackers. Two checkpoints extend the timer. |
| Hybrid | Hollywood, King's Row | Capture point A, then escort the payload through one checkpoint to the end. |
| Control | Ilios, Lijiang Tower | Best of three rounds. Each round loads the next sub-map. The point unlocks after 30 s, and holding it at 99% triggers overtime. |

Map files:

- `ow-maps-assault.js`, `ow-maps-escort.js` and `ow-maps-hybrid.js` hold one map definition each.
- `ow-maps-control.js` holds `stages: [...]` sub-maps built from mirrored halves (`mirror(B, s)`). Both teams get identical geometry.
- `ow-maps-range.js` holds the training range.

Each map is built from the `MapBuilder` API in `ow-world.js`: boxes, walls with holes, stairs, ramps, roofs, houses, props, decals, signs, lights, spawn rooms, points, the payload path, health packs and AI hints.

Stage-based spawn rooms follow three rules:

- `owners` lets a shared room belong to the defenders in one stage and the attackers in the next.
- When the stage changes, any hero standing in a room that the enemy now owns is moved out of it.
- Walk distances between the spawns and the objective were balanced with batch simulations.

## Training

- **Tutorial**: 9 steps with Soldier: 76. They cover movement, jumping onto the crates, destroying three robots, reloading, Helix Rockets, sprint, Biotic Field and Tactical Visor. The ultimate is charged automatically before the last lesson. The steps live in `TUTORIAL` in `ow-modes.js`, and the HUD shows them in a panel at the top of the screen.
- **Training range**:
  - Enemy robots take posts from `hint('bot', ..., { tag })` entries:
    - `static`: stand still.
    - `strafe`: sidestep along a lane.
    - `shoot`: fire back when they can see you.
  - Friendly medic robots (`hurt`) lose health so supports can practise healing.
  - Destroyed robots return to their posts after 3 s.
  - The match starts as soon as the player picks a hero.

## AI

`ow-ai.js` runs perception, team planning and per-hero ability logic:

- **Perception and planning**: bots share knowledge of enemies with their team.
- **Attackers**:
  - They gather at a rally point and push once enough of the team is alive and near the objective.
  - On payload maps, the rally point is taken from the nav path between the team's spawn and the payload.
  - After losing half the team, the survivors pull back and wait for the respawns.
- **Defenders**: they hold map hints and move back to the objective when it is contested.
- **Aim model**: reaction time, aim error, turn rate, projectile lead and ballistic arcs.
- **Edge guard**: bots never step toward ground that is missing or below the kill plane.
- **Training robots**: robots with a drill use `AI.drill` instead of the full AI.

## Architecture

All modules are plain IIFEs on `globalThis.Ow98`. They are listed in load order below and loaded by both `ow98.html` and `index.html`.

| Module | Purpose |
| --- | --- |
| `ow-core.js` | Math, RNG, 4×4 matrices, helpers |
| `ow-data.js` | Heroes, maps list, modes text, bot names, chat |
| `ow-world.js` | Collision world, `MapBuilder`, props collision table, `O.buildMap` |
| `ow-nav.js` | 1 m nav grid, team-owned spawn nodes, A* |
| `ow-maps-*.js` | Map definitions and `O.RANGE_TEAMS` |
| `ow-game.js` | 60 Hz fixed-step simulation, heroes, damage, projectiles, deployables |
| `ow-modes.js` | Assault, escort, hybrid, control, practice and the tutorial |
| `ow-kits.js`, `ow-kits2.js` | Hero kits |
| `ow-ai.js` | Bots and training drills |
| `ow-replay.js` | 30 Hz recording, killcam, Play of the Game |
| `ow-tex.js`, `ow-mesh.js`, `ow-models.js`, `ow-skins.js`, `ow-clips.js`, `ow-clips2.js`, `ow-anim.js`, `ow-props.js`, `ow-fx.js`, `ow-render.js` | Procedural textures, world mesh with baked lighting, hero models, legendary skin kits, emote and victory pose clips, animation, props and cosmetic items, particles and shot effects, WebGL renderer with post-processing |
| `ow-profile.js`, `ow-audio.js`, `ow-icons.js` | Profile, loot and career; synthesized audio; pixel icons |
| `ow-hud.js`, `ow-screens.js`, `ow-gallery.js`, `ow-ui.js` | Canvas HUD, DOM menus, hero gallery with the live model stage and item icons, match lifecycle and input |
| `ow98-app.js` | Win98 window wrapper (`window.appOw98.open()`) |

The simulation modules run in Node without a browser. That is how the tests and balance batches work.

## Verification notes

- To take headless browser screenshots, use Edge over the DevTools protocol with SwiftShader. Pumping frames by hand with `owui.frame(t)` from an evaluate call schedules an extra `requestAnimationFrame` on every call, so cancel `owui.raf` and replace `owui.frameBound` with a no-op first.
- World decals (signs, windows, posters, spawn doors) have their own groups (`d:` prefix). They are wound counter-clockwise and drawn with polygon offset.
- The model stage canvas keeps its WebGL context while it is moved between screens. Screens re-render their HTML on every click, so never create the canvas inside screen markup.
- Hero models are built from boxes, spheres and tubes in `ow-models.js`. Face details sit on the head sphere through `headFront()`. Skins only override colour slots that exist in the hero's base palette (the test checks this).
- Hero animation timestamps (`vis.shotT`, `vis.actT`) are game time. The renderer passes `scene.gt` to the hero and view-model poses; before this fix recoil, action poses and muzzle flashes compared them with the UI clock and almost never played.
- The test fires every hero's primary weapon and checks that each effect event draws something, that every tracer kind has a shot style, that metal parts carry gloss, and that every legendary skin adds its own parts and hides only parts that exist.
- `node tools/ow98-shots.cjs <out> pose|emote [hero ...] [--w= --h= --yaw= --only=key,key --tag=]` renders contact sheets of victory poses (final frame) or emotes (eight frames each) with a private renderer. `node tools/ow98-shots.cjs <out> steps <file.cjs>` runs a steps file in a live page with helpers: `owPump(n, dt)` pumps frames, `owHero(id)` swaps the player's hero, `owTP(dist, angle, height, hero)` renders a third-person camera, `owGrab(label)` stores the frame and `['sheet', name, 'owSheet(cols)']` saves the stored frames as one image.
- Clip time is game time minus `vis.poseT`. The renderer blends `vis.pose` in and out per hero (`animState`), so a pose change never snaps; the gallery passes `ct` to restart emotes and intros.
