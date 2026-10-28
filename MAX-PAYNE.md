# Max Payne (Win 98 Edition)

A third-person shooter built from scratch for this project in the spirit of Max Payne (Remedy, 2001). New York, January 2001, the worst blizzard in the city's history. Three years after junkies high on Valkyr killed his wife and daughter, DEA agent Max Payne works undercover inside the Punchinello family. His partner Alex Balder is shot at Roscoe Street Station, the police decide Max did it, and Max goes after Jack Lupino, the man whose people were there. The game covers the tutorial, the prologue and all nine chapters of Part I, "The American Dream".

The renderer is WebGL 2 with baked lightmaps (per-face texels, shadow rays, ambient occlusion), procedural canvas textures, rigid-bone skinned characters and a post pass for bullet time (sepia, radial blur, heartbeat), graphic-novel grading and film grain. The story is told on graphic-novel pages: every panel is either a staged in-engine shot (a level or a small set, actors with poses, snow or rain, muzzle flashes) or a procedural 2D drawing (skyline, newspaper, letter, phone, TV, syringe and so on), with captions and speech balloons. Menus are DOM, the HUD is a 2D canvas, music and sound effects are synthesised with Web Audio. All text is in Russian and follows `game-human-style.md`.

- Distribution: Igromania CD demo (`maxpayne_demo`, `cdDemo: true` in `js/game-manager.js`, `D:\demo\maxpaynedemo.exe`). Not sold in Steam and not preinstalled; everything that launches it points to the CD (`gameManager.showOnCd`) when it is not installed.
- After installation: desktop icon **Max Payne**, Start menu → **Max Payne**, `C:\Games\MaxPayne\MAXPAYNE.EXE` (with `README.TXT`), Run: `maxpayne`, `maxpayne.exe`, `max payne`, `макс пейн`, `max`. Task Manager shows `maxpayne.exe`. Clippy has tips for the game window, ADVANCED 98 lists the game, and a Steam friend (`Mona_S`) plays it.
- Window: `appMaxPayne.open()` in `js/apps/maxpayne-app.js`, window id `app_maxpayne`.
- Standalone page: `maxpayne.html` (`window.mpui` is the UI instance, `mpui.game` the running level, `mpui.r` the renderer, `mpui.startLevel(id, opts)` starts a chapter).
- Storage: `localStorage` keys `mp98_profile_v1` (unlocked chapters, Part I completion, difficulty, deaths per chapter for adaptive difficulty), `mp98_opts_v1` (settings) and `mp98_saves_v1` (save slots with full level snapshots).
- Tests: `npm run test:maxpayne` (39 checks, see below).

## Controls

| Input | Action |
| --- | --- |
| W/A/S/D | Move |
| Mouse | Aim (pointer lock) |
| Left click | Fire, swing a melee weapon, throw |
| Right click | Bullet time when standing still; shootdodge when moving |
| Shift | Bullet time |
| Q | Shootdodge in the direction of movement |
| Space | Jump |
| C, Ctrl | Crouch |
| Alt | Walk |
| X | Take cover at a wall or a barrier; press again to leave |
| In cover | Move along the cover; fire or step toward the wall to lean out and shoot; step away from the wall, jump or shootdodge to leave |
| E, F | Use: doors, buttons, phones, TVs, notes, keypads, lifts |
| R | Reload |
| H, Backspace | Take a painkiller |
| G | Quick throw (grenade or Molotov cocktail) |
| 1–5, wheel | Weapon slots |
| Tab | Max's current thought (the objective) |
| Enter | Skip a subtitle line |
| F5 / F9 | Quick save / quick load |
| Esc | Pause menu; skip a graphic-novel sequence |

## Core rules

- **Bullet time** slows the world to 0.28 of normal speed. The hourglass drains while it is on and refills with every kill. The player's rate of fire is slowed less than the world, so bullet time is a firepower advantage, not just a camera effect.
- **Shootdodge** is a sideways or forward dive in bullet time. The flight uses world time; getting down and back up uses real time and stays short. Max lands on his back and can keep shooting on the floor.
- **Bullets are visible projectiles.** Enemy shots can be dodged, and tracers show where fire comes from.
- **Painkillers** (up to 8) heal 48 points over a few seconds, not instantly.
- **Weapons**: steel pipe, baseball bat, Beretta, dual Berettas, Desert Eagle, pump-action shotgun, sawed-off shotgun, Ingram, dual Ingrams, grenades, Molotov cocktails. Picking up a second Beretta or Ingram gives the dual version.
- **Difficulty**: Fugitive (story mode), Hard-boiled (normal), Dead on Arrival (7 saves per chapter) and New York Minute (one minute per chapter, each kill adds time). The last two unlock after Part I is finished. Damage adapts slightly after repeated deaths in the same chapter.
- **Cover** (X) is a short stop to reload, heal and pick the next move, not a place to win the fight. See [Cover](#cover).
- **Enemies** take cover, fire in bursts, throw grenades and Molotovs, bark lines to each other and react to noise. Civilians cower, police hold their fire when told to, bosses have their own lines and phases.
- **TVs, phones and notes** carry optional story: news broadcasts about the blizzard and the hunt for Max, "Address Unknown", "Lords & Ladies", "Captain Baseball Bat Boy", security footage, letters and lists found on desks.

## Chapters

| # | Id | Chapter | What happens |
| --- | --- | --- | --- |
| – | `tutorial` | Обучение / Tutorial | DEA training basement with B.B.: shooting range, jumps, bullet time behind cover and at a gas cylinder, shootdodge, and a training house where every target shoots back. |
| – | `prologue` | Пролог | New Jersey, 1998. Max comes home in the rain and finds the front door open. Junkies on Valkyr are in the house; he fights through to the nursery and the bedroom, too late. |
| 1 | `roscoe` | Станция Роско-стрит (Roscoe Street Station) | Lupino's people hold the subway station. Find a station worker who knows the control-room code, follow him through the fighting, drive a train out of the lower platform and leave the tunnel by the left branch. |
| 2 | `crimescene` | Прямой репортаж с места преступления (Live from the Crime Scene) | The closed 1941 part of the station and a flooded tunnel lead to a bank vault the robbers are emptying. Open the vault from the console, blow a wall from behind crates, climb to the lobby. Alex is shot from above; the police arrive and Max has to get out through the ticket office gate. |
| 3 | `bogart` | Играя в Богарта (Playing It Bogart) | Lupino's hotel. Get in through the glass of the back room, go down to the residential floors, take the service lift up to the Finito brothers and fight them in the suite, then take the suite lift down. |
| 4 | `bloodveins` | Кровавые вены Нью-Йорка (The Blood Veins of New York) | The hotel basement, kitchen and banquet hall where Valkyr is unloaded. Find the bar key on the tables, kill Rico Muerte and read Punchinello's letter on his desk, then get into the locked lobby through the roof skylights and open the main doors from the reception desk. |
| 5 | `gun` | Пусть заговорят стволы (Let the Gun Do the Talking) | A car bomb goes off outside the hotel. The tenement across the street is Lupino's den and it is wired to blow. Enter through the alley cellar, find the stair key, climb while floors collapse, cross a caved-in flat and leave by the kitchen window and the fire escape. Alfred Woden calls on a payphone. |
| 6 | `wings` | Страх, что даёт людям крылья (Fear That Gives Men Wings) | Vinnie Gognitti's block. Get the club password from his people next door, follow a guide who is not as friendly as he looks, get past the bouncer, ride the club lift, cross the pipes to the next roof and chase Vinnie across the rooftops until he jumps onto a passing El train. Max jumps after him. |
| 7 | `brutality` | Жестокость полиции (Police Brutality) | The El platform. Vinnie runs, the police are already there with searchlights. Get off the roof unseen, call the lift, go down through the roof hut and corner Vinnie in a loft behind a barricade. |
| 8 | `ragnarock` | Рагнарок (Ragna Rock) | Lupino's goth club in an old church. Open the hall doors from the security room, fight on the dance floor under strobes and against shooters on the balcony, go through the DJ mezzanine, the backstage rooms and the roof beams, and drop the stage scenery from the control panel. |
| 9 | `empire` | Империя зла (An Empire of Evil) | Below the club: a candle room, a corridor with a gate lever and an arena where Lupino's guards throw Molotovs from the galleries. Lupino, high on Valkyr, fights from his throne room. His letter from Punchinello ends Part I. |

## Cover

Design goal: cover must feed the game's own verbs (bullet time, shootdodge, painkillers) instead of replacing them with a peek-and-wait loop. Three rules follow from that:

1. **Geometry protects, not a damage multiplier.** Bullets are projectiles, so cover works only where a box really stands between the shooter and Max's hit spheres. A barrier 0.9 m high hides the body but not always the head; a crate stops bullets until it breaks.
2. **Leaning out is the price of shooting.** Max cannot shoot from a hidden pose. Fire (or a step toward the wall) pops him up over low cover or out past the corner of tall cover in 0.13 s; he stays out while firing and drops back 0.55 s after the last shot. A click shorter than the pop is queued, so no shot is lost. Shots fired from cover are braced (spread x0.75).
3. **Hiding costs time.** Enemies keep shooting at the cover while they see any part of Max. When he stays hidden for 2.2 s (3.4 s on Fugitive, 1.6 s on the two hard modes) and the cover blocks an enemy's line to his chest, that enemy throws a grenade or Molotov if he has one, otherwise one enemy at a time flanks to a spot 2.5 to 9 m away with a clear line to Max and barks about it. Leaning out to fight drains the timer twice as fast as hiding fills it.

Rules and numbers (`COVER` in `mp-game.js`):

| Rule | Value |
| --- | --- |
| Reach | Max takes cover at a face up to 1.45 m away in the move or look direction, or 0.9 m in any direction |
| Low cover | top 0.88 to 1.3 m above the floor: Max crouches with his back to it (posture `cover`, head sphere at 1.1 m) and stands up to shoot |
| Tall cover | top 1.3 m or higher: Max stands with his back to it and can shoot only from a corner (the wall ends within 0.7 m and there is room to step out); firing at a flat wall leaves cover |
| Not cover | glass, doors, lifts and trains, stairs, gas cylinders, anything lower than 0.88 m |
| Enter | 0.3 s slide to the wall; bullet time does not slow Max's own cover moves below half speed |
| Move | 1.7 m/s along the face; Max stops 0.12 m before the end instead of sliding off |
| Leave | X, a step away from the wall held for 0.22 s, jump, shootdodge (dives along the input or straight away from the wall), a melee swing, or the cover breaking |

The camera keeps its free aim in cover; its shoulder swaps to the side of the corner Max can lean out of, and the pivot rises to 1.4 m behind low cover so the player sees over it. The HUD offers `[X] Укрыться` only near usable cover while enemies are in combat (or during the tutorial lessons), so the prompt does not follow the player down every corridor.

Teaching follows the tutorial's own order: the range barrier introduces cover before the three targets that shoot back (B.B. waits for the player to take cover, or moves on after 12 s), the jump room's pillars twist it into corner shooting and diving out of cover, and the training house combines everything. Enemies use the same cover poses: an enemy at a cover spot within 1.1 m of the blocking box presses his back to it while hidden and stands to shoot.

Level pass. Arenas where the only protection was the doorway got cover islands so the player can advance in beats and enemies have something to hold: a crate stack on the Roscoe Street lower platform, two writing desks and two marble columns in the bank lobby, overturned banquet tables in the Blood Veins hall (two by the entrance, one on the gangsters' side), an overturned table and a crate in the tenement hall of chapter 5, an overturned table and a crate in Vinnie's club ambush, a dumpster and a pallet on the basketball court, and two overturned tables on the Ragna Rock dance floor (still exposed to the balcony on purpose). The Empire of Evil arena stays open: its Molotov throwers on the galleries and Lupino's charge are meant to keep Max moving. `tableside` is the overturned-table decor model; crates added as cover have 90 HP so they survive about ten enemy hits.

## Animation

Characters use rigid bones posed in `mp-anim.js`. Mixamo clips are converted by `node tools/mixamo-import.cjs maxpayne` from `src/mixamo/maxpayne` (plain `.dae` or zipped files, detected by content, whatever the extension) into `mp-mocap.js`:

- Locomotion: `idle` (relaxed), `idle_stance` (armed lower body, imported at 15 fps), `idle_look` and `idle_shift` (unarmed variety picked per character), `walk`, `run`, `sprint` (player run speed), `run_stop`, `turn_l`/`turn_r` (the feet catch up when the aim turns more than 50 degrees while standing).
- Air and landing: `jump_up`, `fall`, `land_hard` (falls faster than 8.6 m/s: 0.45 s at 30% speed), `land_roll` (the same fall while running forward: no slowdown, fall damage starts 2.5 m/s later). Both landing clips are grounded on their lowest ankle (`ground: 'min'`) because Mixamo starts them in the air.
- Cover: `cover_in_*`, `cover_out_*`, `cover_idle_*`, `cover_left_*`, `cover_right_*` for `low` and `tall`. Cover poses are built in the wall's frame and rotated into the actor's frame (`toFrame`), then blended by how hidden Max is; the gun arm is held up at the chest.

## Module layout (`js/apps/maxpayne/`)

| File | Contents |
| --- | --- |
| `mp-core.js` | Namespace, math helpers, RNG, `M.levelOrder`, `M.defineLevel` |
| `mp-data.js` | Ammo, weapons, difficulty table, enemy types, barks, item names |
| `mp-world.js` | Collision world (boxes, dynamic props, zones, lights), level builder (`B.plan` floor plans with per-room heights, doors, windows, gaps; stairs, decor, decals, groups) |
| `mp-nav.js` | Multi-level 0.5 m navigation grid with step and stair edges, A* and string pulling |
| `mp-game.js` | Simulation: player, weapons, bullet time, shootdodge, projectiles, props (doors, glass, lifts, trains, keypads, phones, TVs), explosions, fire, pickups, triggers, script API, snapshots |
| `mp-ai.js` | Enemy and NPC behaviour: ambush, patrol, search, combat with cover, hostage, flee routes, police, cower, surrender |
| `mp-l00-tutorial.js` … `mp-l10-empire.js` | One file per chapter: world settings, geometry, props, items, characters, triggers and event handlers |
| `mp-story.js` | Graphic-novel pages for every chapter and the TV shows |
| `mp-sets.js` | Small sets used only by novel panels (roof, apartment, DEA office, street, station) |
| `mp-tex.js`, `mp-gl.js`, `mp-anim.js`, `mp-models.js`, `mp-render.js`, `mp-fx.js` | Textures, GL wrappers, skeletal poses, character and prop meshes, renderer with lightmap baking, particles and decals |
| `mp-mocap.js` | Generated Mixamo clips (see [Animation](#animation)); regenerate, never edit by hand |
| `mp-hud.js`, `mp-audio.js`, `mp-novel.js`, `mp-menu.js`, `mp-ui.js` | HUD, synthesised audio and music, graphic-novel player, menus, input and the game loop |

## Level scripting

Levels are data plus handlers. `triggers` are boxes that emit `enter:<id>`; props and characters emit `use:<id>`, `dead:<id>`, `kill:<group>`, `pick:<item>`, `break:<id>`, `mover:<id>`, `talk:<id>` and others. Handlers in `on` receive the game object and call the script API: `say`, `think`, `hint`, `setThought`, `dialog`, `later`, `wake`, `alert`, `show`, `cam`, `novel`, `music`, `checkpoint`, `finish`, `fail`, `unlock`, `openDoor`, `moverGo`, `explode`, `addFire`, `addItem`, `breakGlass` and so on.

Pitfalls worth knowing before editing a level:

- `B.plan` rooms that touch share a wall unless a gap or door is declared on the shared edge. Rooms stacked on top of each other subtract the upper room's footprint from the lower ceiling automatically.
- Outdoor zones decide where snow and rain fall and where moonlight reaches. Every roofed interior inside an outdoor zone needs its own smaller `outdoor: false` zone.
- Novel shots with `set: 'level'` use the currently loaded level. Keep the camera inside a room and the actors inside the camera's field of view; `rel: 'player'` offsets the shot to the player's position.
- Anyone standing on a mover (train, lift, El car) is carried by its per-frame delta, but only while they are on the ground and the ground object is that mover's prop. A character placed slightly above the roof or floor of a mover is left behind.

## Tests

`npm run test:maxpayne` builds every chapter, checks the navigation grid and item placement, runs a scripted walkthrough of all eleven levels to their `finish`, and checks bullet time, shootdodge, painkillers, enemy damage, explosive cylinders, save snapshots, cover (low barrier: hide, slide, queued pop-up shot, leave; tall pillar: corner lean, flat wall exits on fire; hits taken in cover versus in the open; flanking or grenades against a hiding Max; cover in snapshots), hard landing and roll, decoding of every cover, landing and turning clip with finite poses, that no story or dialogue text uses em dashes, that every chapter has valid intro and outro pages, and that no source file contains comments.

`tools/maxpayne-shots.cjs <outDir> <steps.cjs>` opens `maxpayne.html` in headless Edge over the DevTools protocol and runs a list of `eval`, `shot`, `sleep`, `click` and `key` steps. `mpShots.level(id)`, `mpShots.place(x, y, z, yaw, pitch)`, `mpShots.pump(frames)` and `mpShots.stats()` are available in `eval` steps. Set `MP_PAGE=index.html` and `MP_READY` to test the game inside the desktop. For frame-exact pose shots stop the page's own loop first (`cancelAnimationFrame(mpui.raf); mpui.frame = () => {}`) and advance only with `mpShots.pump`, otherwise the game keeps running between steps.
