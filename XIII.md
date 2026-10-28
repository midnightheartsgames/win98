# XIII (2000 edition)

A first-person shooter built from scratch for this project in the spirit of XIII: an amnesiac with a XIII tattoo on his collarbone, the murder of President Sheridan, and a conspiracy of twenty men known as "XX". The whole game is presented as a comic book. The WebGL 1 renderer draws ink outlines, flat cel lighting, hatching and paper grain; every headshot opens a strip of three frozen close-up panels; alarms, cameras and bosses appear in live picture-in-picture panels with red borders; sounds pop up as onomatopoeia ("TAP TAP", "BLAM", "AARGH"); and every chapter opens and closes with a comic page built from staged 3D scenes and procedural art panels. Menus are DOM, the HUD and speech balloons are a 2D canvas, music and sound effects are synthesised with Web Audio. All text is in Russian.

- Distribution: Igromania CD demo (`xiii_demo`, `cdDemo: true` in `js/game-manager.js`, `D:\demo\xiiidemo.exe`). Not sold in Steam, not preinstalled.
- After installation: desktop icon **XIII**, Start menu → **XIII**, `C:\Games\XIII\XIII.EXE` (with `README.TXT` and `SAVE`), Run: `xiii`, `xiii.exe`, `13`, `тринадцать`, `тринадцатый`. Task Manager shows `xiii.exe`. Clippy has tips for the game window, and a Steam friend (`Rowland_XIII`) plays it.
- Window: `appXiii.open()` in `js/apps/xiii-app.js`, window id `app_xiii`.
- Standalone page: `xiii.html` (`window.x13ui` is the UI instance, `x13ui.game` the running game, `x13ui.r` the renderer, `x13ui.startLevel(id, opts)` starts a chapter).
- Storage: `localStorage` keys `x13_profile_v1` (unlocked chapters, best times, found documents, difficulty, campaign progress with the carried loadout) and `x13_opts_v1` (settings). Checkpoints and F5/F9 quick saves live in memory for the current chapter.
- Test: `npm run test:xiii` (27 checks: every chapter is built, spawns are on the ground, triggers are reachable on the nav grid, a scripted walkthrough finishes every chapter, AI fights back, and no file contains comments).

## Controls

| Input | Action |
| --- | --- |
| W/A/S/D, arrows | Move |
| Mouse | Look (pointer lock) |
| Left click | Fire, punch, swing a chair or bottle, knock out a hostage |
| Right click | Zoom (sniper rifle, crossbow) |
| Space | Jump; swim up |
| C, Ctrl | Crouch; dive |
| Shift | Walk quietly |
| E, F | Use: doors, switches, lockpick, grappling hook, pick up objects, take a hostage, drag a body |
| R | Reload |
| 1–9, wheel | Weapons |
| Q | Last weapon |
| G | Throw a grenade |
| H | Use a medkit |
| Tab | Objectives |
| F5 / F9 | Quick save / quick load |
| Esc | Pause menu; skip a comic page |

## Chapters

| # | Id | Chapter | What happens |
| --- | --- | --- | --- |
| 1 | `brighton` | Brighton Beach | XIII wakes up on the beach with no memory. Killers arrive at the lifeguard hut; find a weapon, walk the boardwalk east and call from the phone box on Surf Avenue. |
| 2 | `bank` | Winslow Bank | Find safe deposit box 1313 in the vault without hurting visitors or guards, get the roof key from the manager's office, cross to the neighbouring roof and climb down the fire escape. |
| 3 | `fbi` | FBI Headquarters | Escape FBI headquarters without killing agents, recover your gear from the evidence room and meet Major Jones in the underground garage. |
| 4 | `jones` | Major Jones | Free Jones at the harbour (pier 13) without raising the alarm, then cover her while she starts the boat. |
| 5 | `emerald` | Emerald Base | Crawl through a culvert into a snowbound military base, optionally cut the generator to kill the searchlights, take the keycard from the headquarters and open the bunker. |
| 6 | `cell` | Carrington's Cell | Take the cell keys from the block warden, free General Carrington, survive the alarm and the block chief (M60) in the tunnel and ride the freight lift up with the general. |
| 7 | `cable` | Cable Car | Start the cable car from the operator booth, board with Carrington and ride down a gorge. Snipers on watchtowers and the crew of the oncoming car (a jig-back system: both cars meet at the tower) attack. At the tower the brake is jammed: climb to the top platform, release it and shoot down the helicopter (bazooka on the platform; it can also be destroyed on its pad before departure), then fight through the valley station. |
| 8 | `lake` | Kellownee Lake | Dusk over an open lake. Go around by the guarded road or swim across under the searchlight of a patrol boat that circles the island (diving hides you, the harpoon works underwater). Old Ben is dead in his cabin; his diary unlocks a memory. The Irishman arrives by boat at the sawmill, lands his men and leaves. |
| 9 | `hideout` | Kellownee Hideout | A night infiltration of the XX hunting lodge: searchlights on the roof and a generator to cut, the dining room with twenty chairs and the meeting protocol, a library with a sliding bookcase that hides a lift into an old mine, and the Irishman's cavern (boss, reinforcements at half health). After the fight XIII is gassed and captured. |
| 10 | `plainrock` | Plain Rock Penitentiary | XIII starts stripped in cell B-7 during a thunderstorm. Lightning cuts the power and opens every cell; the riot spills into the yard under the tower searchlights. The captain carries the armory key, the stairwell leads to the roof, where Mongoose waits (boss). Jones arrives by helicopter. To be continued. |

Chapter 10 was not in the requested list of nine names; Plain Rock Penitentiary was added as the finale so the campaign has ten chapters.

## Systems

- **Stealth AI** (`x13-ai.js`): vision cones scaled by light (`def.light`, `dark`/`lit` zones, `powerLight` after a power cut), suspicion that grows into "?" and then alert, hearing of steps, shots and impacts, bodies that raise suspicion, alarm buttons that alerted guards run to, security cameras and searchlights that open a picture-in-picture panel and alert nearby enemies. Modes: guard, patrol (path + wait), sniper, follow (allies with orders `follow`/`goto`/`hold`), civilian. Cover points (`points`) for bosses, grenadiers, taunts.
- **Player verbs** (`x13-game.js`): hitscan and projectile weapons (knives and crossbow bolts can be picked up again), zoom with sway (steadied by the "cold blood" skill), melee and throwable objects, hostages as shields, knockouts, lockpicking, grappling hooks, ladders, swimming with an air meter, fall damage, medkits, armour.
- **Memories and skills**: reading certain documents or reaching story beats plays a flashback and unlocks a skill: sixth sense (footsteps through walls), marksman, silent step, quick hands, cold blood, second wind (health regenerates to 40) and knife mastery.
- **Documents**: collectibles saved into the profile; the XX dossier in the main menu shows them per chapter.
- **Moving groups**: rigid sets of blocks, visuals, characters, items and usables that move along paths (`g.moveGroup(id, points, speed, { ev, loop, face, turn })`). Riders standing on the floor or inside the group's `carry` box are carried along; groups can turn to face their direction of travel. Used by the lifts, both cable cars and the boats.
- **Vehicles**: `B.vehicle('heli', …)`; the helicopter AI orbits a centre, fires bursts and rockets, pitches and rolls with its speed, and crashes when destroyed. `friendly: true` turns the AI off (Jones's rescue helicopter). Bosses (characters and vehicles) show a health bar at the bottom of the screen while they are engaged.
- **Weather and time of day**: per-chapter sky, fog and light; snow and rain particles are culled under roofs; lightning is a scripted `def.post` flash with the `thunder` sound.
- **Checkpoints and carry**: `g.checkpoint(name)` serializes the whole game (characters, doors, groups, vehicles, flags, objectives); the loadout carries into the next chapter unless the chapter strips it (Plain Rock).

## Ink & Newsprint

The visual philosophy behind the renderer and the procedural textures.

Nothing on screen is painted; everything is inked. Surfaces are not described by photographs but by the marks a comic artist would make over them: a hard boundary between light and shadow, a second boundary where the shadow deepens, hatching that follows the direction a pen would take across a wall, and a black contour wherever depth or orientation breaks. The algorithm treats a frame as a page that is drawn twice: once as flat colour laid down by a colourist who owns only three or four tones per material, and once as ink that the letterer's pen draws on top. The ink is derived, never authored: a Laplacian of inverse depth finds silhouettes, a comparison of octahedrally packed normals finds creases, and distance thins the line so the far city dissolves into colour. The whole look is the product of painstaking tuning, of line widths and band thresholds adjusted until the result reads like a printed page rather than a filter.

Colour is seeded, not stored. Every material is grown from a seeded random stream: planks from wobbling parallel lines with knots, brick from staggered rows with mortar noise, snow from speckles with blue shadow blotches, water from interference bands. The seed guarantees that the same wall is always the same wall, while the parameters (dot density, blotch size, crack count, stroke wobble) give each material its own handwriting. The atlas of faces follows the same rule: a face is a set of strokes (brows, nose line, mouth, stubble hatching) placed by a small grammar, so a guard, an officer and General Carrington differ by parameters, not by pixels.

Light is quantised like print. Direct light falls into two or three bands with a soft edge only a few percent wide; point lights add discrete pools that end with a visible rim, the way a colourist cuts a lamp's glow with a single shape. Vertical surfaces receive world-space hatching whose density rises as the light falls, and the paper texture adds a faint grain to every pixel so that flat colour never looks digital. Panels reuse the same pipeline with a duotone map: sepia for memories, red for danger, grey for the dead; the composite pass swaps the palette, not the scene.

Time is divided into panels. A headshot freezes three frames of the victim's head from three angles, each captured a fraction of a second apart, so the violence reads as a sequence rather than an explosion of pixels; the panels slide in with a white border like cut paper. Alarms, cameras, searchlights and bosses open live insets that keep rendering while the player acts, and onomatopoeia are drawn as seeded, jittered lettering that grows and fades in world space. Cutscenes are comic pages whose panels are either staged 3D shots of puppets posed on the level geometry, or procedural art cards (tattoo, key, photograph, dossier, silhouette, map, explosion) drawn with the same stroke library as the textures.

The master-level craft lies in restraint: every parameter (edge threshold, hatch spacing, band softness, grain amount, panel timing) was refined through countless iterations so that the page stays legible in the middle of a firefight. The algorithm should always feel like the careful work of an artist at the absolute top of the craft, never like noise laid over a 3D game.

## Code layout (`js/apps/xiii/`)

| File | Contents |
| --- | --- |
| `x13-core.js` | Math, 4×4 matrices, seeded RNG and hashing, constants (tick 1/60 s, gravity, player metrics) |
| `x13-data.js` | Weapons, objects, characters (looks, teams, hit points), lines, skills, items, difficulty, onomatopoeia, level registry (`X.addLevel`, `X.level`) |
| `x13-world.js` | Blocks and movers on a spatial grid, terrains (with holes), water, ladders, rays that ignore terrain when they start underground; the level `Builder` DSL |
| `x13-nav.js` | Layered 0.5 m navigation grid (group geometry included at its start position), A*, regions |
| `x13-props.js` | Prop library (furniture, vehicles, watchtowers, cell bars, pylons, rails, lamps, …) |
| `x13-game.js` | Simulation: player movement, weapons, use system, doors, groups, vehicles, projectiles, explosions, cameras, searchlights, alarms, objectives, script events, checkpoints, loadout |
| `x13-ai.js` | Enemy and ally AI, helicopter AI |
| `x13-l01-brighton.js` … `x13-l10-plainrock.js` | One file per chapter: environment, loadout, geometry, characters, triggers, script, tick/post hooks, comic pages |
| `x13-tex.js` | Procedural materials and face atlas ("Ink & Newsprint") |
| `x13-gl.js`, `x13-models.js` | Mesh builders, skinned characters and poses, weapons and view models |
| `x13-render.js` | G-buffer, colour, ink composite, sky with painted bands, water, beams, vehicles, panels |
| `x13-fx.js` | Particles, decals, tracers, weather |
| `x13-hud.js`, `x13-panels.js`, `x13-comic.js` | HUD and balloons, picture-in-picture panels, comic pages and procedural art cards |
| `x13-audio.js` | Synthesised sound effects, ambience and music |
| `x13-menu.js`, `x13-ui.js` | Menus (chapters, dossier, options), input, camera, game loop |

## Level DSL notes

- Rooms: `B.room(x0, z0, x1, z1, y, h, { doors: { n|s|e|w: [[offset, width, height]] }, windows, skip })`. The `n` wall is at `z0`, `s` at `z1`, `w` at `x0`, `e` at `x1`; offsets are measured from `x0` or `z0`.
- `B.wall(...)` cannot stack two holes in the same horizontal range at different heights; build one wall per storey instead.
- Shelves and bookshelves have their open side on local `+z`; the back faces the wall at `-z`.
- Floors laid on flat terrain need a few centimetres of height difference (terrain at `Y - 0.06`) or they z-fight.
- A lift or cable car that passes through terrain needs a terrain hole (`B.terrain({ …, holes: [[x0, z0, x1, z1]] })`) aligned to the terrain cells.
- Groups: build their contents in local coordinates inside `B.group(id, x, y, z, yaw, fn, { carry })`; characters inside a group are static and ride with it. Script `c.grp = 'id'` to make an ally ride (Cable Car).
- Triggers only fire once unless the handler resets `g.flags['!zone:<id>']`; group arrival events (`ev`) can fire repeatedly.
- `noReach: true` on a trigger skips the reachability test (places reached by lift, cable car or boat).

## Verification notes

- `node tests/xiii.test.js [filter]` runs the suite; each chapter has a scripted walkthrough in `WALK` (teleports, kills, uses switches, rides groups, checks flags).
- Browser checks use headless Edge over CDP (see the project's CDP recipe): load `xiii.html`, call `x13ui.startLevel(id)`, place the player via `x13ui.game.player` and take screenshots. Close Edge with CDP `Browser.close` plus `taskkill /T`, or the processes leak.
