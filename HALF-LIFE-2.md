# Half-Life 2 (2000 Edition)

What *Half-Life 2* could have been if Valve had shipped it in November 2000: the whole fourteen-chapter journey from the City 17 train station to Breen's reactor, built for a Pentium II with a 16 MB accelerator. It renders at 320x240 to 800x600 through a first-generation 3D card (WebGL) or a point-sampled "software" mode, uses baked vertex lighting, 16-bit ordered dithering, fog, blocky low-poly models and loading screens between maps. Physics and the gravity gun stay, because they are the reason the game exists. Written from scratch for the Win 98 desktop; it shares no code or assets with *Half-Life 98* or any other game in this project.

- Buy and download it in the Steam client (`hl2`, $49.99). It is never preinstalled.
- After installing: desktop icon, Start menu, Run (`hl2`, `hl2.exe`, `half-life 2`, `халф-лайф 2`, `гордон`), `C:\Games\HL2\HL2.EXE`.
- Standalone page: `hl2.html` (exposes `window.hlui`).
- Tests: `npm run test:hl2` (`node tests/hl2.test.js`, about 3 s, 20 tests including a scripted run of every chapter).

## Design

**Premise.** The player is a silent physicist dropped into an occupied city. The story is never told in cutscenes: every line is spoken while the player keeps control, and every set piece happens in the level.

**Pillars.**
1. *Physics is a weapon.* Almost every fight has a prop answer: barrels, sawblades, radiators, cars, energy balls, even enemies.
2. *One unbroken journey.* Fourteen chapters flow into each other; loading screens are the only interruption.
3. *From citizen to leader.* The player starts unarmed, then gains a crowbar, a boat, a gravity gun, an antlion swarm and finally a squad.
4. *2000 hardware honesty.* Everything must look plausible on a TNT2: flat-shaded boxes, 64 px textures, per-vertex light, fog.

**Verbs.** Move, jump, crouch-jump, sprint on suit power; use and carry (`E`); shoot (primary and alternate fire); gravity gun pull, hold, punt and throw; drive (airboat, buggy); command a swarm (bugbait) and a squad (`G`).

**Loops.**
- Moment to moment: aim, shoot, grab and throw. Crates break into supplies, barrels chain, sawblades cut zombies in half.
- Chapter: every chapter teaches one new verb, tests it, then twists it (the can in chapter 1, counterweights in chapter 3, floats in chapter 4, the gravity gun lesson in chapter 5, the supercharged gun in chapter 13).
- Meta: chapter select, three difficulties, and a hidden rebel lambda cache (λ) in almost every chapter.

**Economy.** Health (kits, vials, wall chargers), suit armour (batteries, chargers, absorbs 80 % of damage), suit auxiliary power (sprint, flashlight, oxygen), ammunition per weapon type with caps. Crates are the main faucet; the infinite rocket crate in the late chapters is deliberately bottomless, because the striders are the sink.

**Difficulty.** Easy, Normal, Hard scale damage taken (0.5 / 1 / 1.5), damage dealt (1.25 / 1 / 0.85) and ammo pickups (1.5 / 1 / 0.75). Enemy fire starts inaccurate after they acquire a target and settles within 1.6 s, so the player always gets a warning burst.

## Chapters

| # | Chapter | New verb or set piece |
|---|---|---|
| 1 | Прибытие (Point Insertion) | G-Man intro, carrying (the can: put it in the bin or throw it at the cop), Barney undercover, apartment raid, rooftop escape, Alyx's rescue |
| 2 | Красный день календаря | Kleiner's lab, H.E.V. suit and HUD, health and suit chargers, teleport accident through Breen's office |
| 3 | Канал (Route Kanal) | Crowbar from Barney, breakable crates, pistol, sludge, seesaw puzzle solved with cinder-block counterweights, barnacles, manhacks, SMG |
| 4 | Водная преграда | Airboat, bridge ambushes, a canal gate opened from a hut, float ramp raised by pushing buoyant barrels into cages, hunter-chopper boss killed with the vortigaunt-mounted gun |
| 5 | Восточная Чёрная Меза | Lift down into the lab, Eli and Mossman, gravity gun lesson, fetch with Dog, Combine assault, escape tunnel |
| 6 | Мы не ходим в Рейвенхолм | Night, flashlight, zombies of three kinds, headcrabs, car drop trap, blade trap, sawblades, Father Grigori and his shotgun, cemetery stand |
| 7 | Шоссе 17 | Buggy with tau cannon, smooth coastal terrain, forcefield checkpoint, ravine jump, antlions from the sand, RPG against a gunship at the lighthouse |
| 8 | Песчаные ловушки | Sand wakes the swarm, thumpers are safe zones, prop bridges, antlion guard killed with explosive barrels, bugbait and a friendly swarm against an outpost |
| 9 | Нова Проспект | Prison yard with the swarm, gate control, cell block with walkways, knocking turrets over with the gravity gun, crossbow |
| 10 | Запутанность | Alyx as companion, friendly turrets placed with the gravity gun, three assault waves, Mossman's betrayal, teleport |
| 11 | Антигражданин Один | A week later: burning city, rebel squad orders, strider on the plaza, Barney and the RPG |
| 12 | Следуйте за Фрименом! | Two striders and a gunship with endless rocket crates, the gate to the Citadel |
| 13 | Наши благодетели | Confiscation field, supercharged gravity gun that grabs soldiers, energy ball dispensers, lift to the top |
| 14 | Тёмная энергия | Breen, three energy balls into the dark energy reactor, G-Man, credits |

## Technology

| Layer | Approach |
|---|---|
| World | 2 m column grid per map (floor, optional ceiling and roof, so rooms can sit under walkable roofs), smooth height-field cells for terrain, water and sludge per cell, plus boxes, ramps and stairs from a small builder. Maps are painted with `grid().rect()` or generated procedurally (coast terrain). |
| Collision | Swept AABB against column solids, boxes, props, doors, vehicles and moving surfaces; step-up, slope limit, heightfield landing; lifts carry the player. |
| Physics | Axis-aligned rigid props with mass, bounce, friction, buoyancy, sleeping, stacking, impact damage, breakables with loot, explosive chains, a seesaw that balances torques and a float ramp driven by tethered floats. |
| Gravity gun | Pull within 22 m, hold within 3.4 m, punt and launch speeds scaled by mass; the supercharged version lifts 3 t and kills Combine soldiers on contact. |
| AI | Grid navigation (1 m nodes, layered, drop links, A*, string pulling) and per-type behaviour: soldiers with cover and flanking tactics, grenades and energy balls; allies that follow, hold, heal and avoid friendly fire; zombies that throw props, fast zombies that leap, poison zombies that throw crabs; headcrabs, antlions and the guard's charge; manhacks, scanners, barnacles, turrets, rollermines, hunter-chopper, gunship, striders with the warp cannon, APC, dropship. |
| Scripting | Declarative trigger scripts per map (zones, flags, deaths, props in zones, functions) with blocking steps: dialogue, waits, spawns, doors, NPC orders, teleports, fades, level changes. Subtitles are always on screen, like closed captions. |
| Rendering | WebGL 1, per-texture static buffers with baked vertex light and sky exposure, streamed dynamic batch for everything that moves, decals, billboards and beams, view model in its own pass, flashlight and four dynamic lights in the shader, fog, sky box with the Citadel on the skyline, 16-bit Bayer dithering, OpenGL or software look, 240 to 600 lines or window size. |
| Audio | Every sound synthesised with WebAudio, positional pan and fall-off, vehicle and gravity gun loops, a small step sequencer for music. |
| Saves | `localStorage`: autosave per chapter and checkpoint, quick save (F5 or F6), quick load (F9), five slots. Saves keep player, NPCs, props, doors, vehicles, scripts and flags. |

## Modules (`js/apps/hl2/`)

`h2-core` (math, matrices, heap), `h2-data` (weapons, ammo, items, props, NPCs, teams, difficulty), `h2-world` (map compiler, collision, raycast, light baking, navigation), `h2-phys`, `h2-fx`, `h2-game` (player, weapons, gravity gun, damage, scripts, saves), `h2-ai`, `h2-vehicle`, `h2-tex` (procedural textures, faces, signs, sky), `h2-models` (low-poly models, view models, batch builder), `h2-render`, `h2-audio`, `h2-maps-util` (grid painter, helpers, chapter list, chapter start kits), `h2-maps-c01` … `h2-maps-c14`, `h2-ui` (menus, options, HUD, subtitles, saves, credits). Desktop wrapper: `js/apps/hl2-app.js`; styles: `css/apps/hl2.css`.

## Controls

`W A S D` move, mouse look (click to lock the pointer, arrows also turn), `LMB`/`RMB` fire and alternate fire, `Space` jump, `C` or `Ctrl` crouch, `Shift` sprint, `Z` or `Alt` walk, `E` use and carry, `R` reload, `F` flashlight, `1`–`6` and the wheel select weapons, `Q` last weapon, `G` send the squad to the crosshair or recall it, `F6`/`F9` quick save and load, `Esc` menu.

## Testing and verification

`tests/hl2.test.js` loads every module in Node and checks: map compilation, free start positions and navigation for all chapters; stacking, sleeping and chained explosions; walking, jumping, stairs and fall damage; a scripted walkthrough of each chapter (the can, the seesaw counterweights, the barnacle, the airboat route with the float-ramp jump and the chopper kill, the Dog fetch, the Ravenholm traps, the buggy jump, the antlion guard with barrels, the bugbait swarm, turret tipping, turret defence, squad orders, rocket duels with striders and gunships, the supercharged gun, the reactor and the credits); save and load; the desktop wiring (Steam catalog, no preinstall, shell entry points, i18n); and a zero-comments scan of every file.

For visuals, drive headless Edge over CDP against `hl2.html`: `hlui.startChapter(i, skill)`, wait for `hlui.mode === 'play'`, then edit `hlui.game.player` and screenshot. `hlui.renderer.stats` reports draws and triangles.
