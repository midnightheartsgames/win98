# The Sims 3 (2000 edition)

A life simulation built from scratch for this project, imagined as The Sims 3 released in 2000: the gameplay and interface of The Sims 3 (base game only, no expansions) drawn with the look of The Sims 1. The whole town of Sunset Valley (Сансет Вэлли) is simulated at once: neighbours go to work, make friends, fall in love, age and have children while the player runs one household. The renderer is WebGL 1 with an isometric orthographic camera (four rotations, four zoom levels, walls up / cutaway / down), low-poly sims assembled from rigid parts, and a procedural texture atlas. Menus, the HUD and dialogs are DOM; music, sound effects, ambience and Simlish voices are synthesised with Web Audio. All text is in Russian.

- Distribution: sold in the in-system Steam client (`steam: true` in `js/game-manager.js`, $43.99). The game is not preinstalled.
- After installation: desktop icon **The Sims 3**, Start menu → **The Sims 3**, `C:\Games\Sims3\SIMS3.EXE` (with `README.TXT`), Run: `sims`, `sims3`, `sims3.exe`, `sims 3`, `the sims 3`, `симс`, `симс 3`, `симы`. Task Manager shows `sims3.exe`. Clippy has tips for the game window.
- Window: `appSims3.open()` in `js/apps/sims3-app.js`, window id `app_sims3`.
- Standalone page: `sims3.html` (`window.s3ui` is the UI instance, `s3ui.game` the running game, `s3ui.r` the renderer).
- Saves: `localStorage` key `sims3_2000_saves` (up to six slots with thumbnails), settings under `sims3_2000_settings`.
- Test: `npm run test:sims3` (about 2700 checks in about 4.5 seconds, including a three-day simulation, a day on two floors, weather, the family inventory and save/load round trips).

## Controls

| Input | Action |
| --- | --- |
| Left click | Pie menu of an object, a Sim or the ground; single choices on the ground run at once |
| Right click | Cancel the current action (live mode), drop the held object (buy/build) |
| Drag, arrows, W/A/S/D | Scroll the camera |
| Q / E, `,` / `.` | Rotate the camera |
| Wheel, Z / X, + / - | Zoom; zooming out past the last level opens the map |
| Space, P, 0 | Pause |
| 1, 2, 3 | Normal, fast and very fast speed |
| Tab | Next Sim of the household |
| Home, H | Center the camera on the selected Sim |
| F1 / F2 / F3 | Live, Buy, Build mode |
| M | Map view |
| Page Up / Page Down | Floor up / down (Build mode can go one floor above the top one) |
| V | Walls up / cutaway / down |
| R, Shift+R | Rotate the object being placed |
| Delete, Backspace | Sell the held or hovered object |
| I (buy) | Put the held or hovered object into the family inventory |
| Shift (buy) | Keep placing copies of the same object |
| Shift (build) | Floor or paint the whole room |
| F5 | Save |
| F7 | Debug menu: money, happiness points, weather, time of day |
| Esc | Close a dialog, leave Buy/Build/Map, open the game menu |

## Screens

- **Loading**: spinning plumbob, progress bar and joke lines while the town is generated and the first frame is built.
- **Main menu**: the living town behind a blurred frame, the selected save (family portraits, lot, funds, in-game day, save date), save thumbnails, New Game, a random tip, options, help and exit.
- **New game**: create a family in the editor or pick one of the ten households of Sunset Valley (Landgraab, Goth, Alto, Hogan, Frost, Scott, Aldridge, Mitchell and others).
- **Create a Sim**: appearance (name, gender, age from toddler to elder, skin, body sliders, eyes, voice), hair (portrait previews), five outfit categories with tops, bottoms, shoes and ties, personality (trait slots by age, trait grid by category with conflicts, favourites, zodiac, lifetime wish chosen from five options that fit the traits), household strip with relationships (spouse, partner, child, parent, sibling, roommate), randomize and turntable preview.
- **Move in**: the whole town at map zoom with pins on lots for sale (green when affordable), a card per lot with price, size, beds and baths, and a close look at the house before buying.
- **Live mode HUD**: household portraits, camera ring with wall, zoom and floor buttons (floor number badge), mode buttons, funds; wish panel with offered wishes, four promise slots, portrait, lifetime wish and happiness points, clock with a weather icon and forecast tooltip, speed; mood meter with moodlets; the Sim panel with eight tabs (needs, relationships, career and school, skills with journals, opportunities, happiness rewards, inventory with personal and family views, simology); the action queue; notifications with actions.
- **Buy mode**: catalogue by function or by room, thumbnails rendered from the real models, info panel with stats and Create-a-Style swatches for both colour slots, placement ghost with validity colour and cost, hand tool to move objects (surface items move with their table), sell tool with depreciation (full refund for objects bought in the same session), family inventory (box button or I): objects go in for free, come back for free and keep colours, state and damage.
- **Build mode**: works on the floor shown by the camera ring. Walls, rooms, fences (railings upstairs), doors, windows, floors (Shift fills a room), stairs and the elevator, wallpaper and paint (Shift paints the room), yard terrain (it also fills pools back in), swimming pools (§40 per tile) and pool ladders, roofs (hip, gable, shed, flat or none, three pitches, twelve colours, free-standing roof pieces at §12 per tile) and the sledgehammer (walls, doors, windows, stairs, elevators, ladders). Upper floors and walls need rooms below within two tiles; the room tool lays the floor of an upper room. New exterior faces get the lot's siding; the front door is recalculated after every change.
- **Debug menu (F7)**: money, happiness points for the selected Sim or the household, the four kinds of weather, and time of day. Time is fast-forwarded by simulating the skipped hours.
- **Map view**: pins for the family, workplaces and shops, public venues and homes with filters; a card per lot with the actions the selected Sim can take there.
- **Options**: graphics (shadows, tree fading, hover tips), sound (voices, effects, music, ambience with mute and defaults), game (autonomy, aging, lifespan, story progression, wishes, tips), camera (edge scrolling, inverted rotation), music per mode.

## Simulation

- Six needs from -100 to 100, 129 moodlets, mood levels that feed lifetime happiness; 56 traits with need, skill, autonomy and social effects; 29 lifetime wishes; 55 wish types with promises; 16 happiness rewards.
- Ten skills with unlocks and challenges, three toddler skills; 22 recipes with quality and kitchen fires; fishing (16 fish), gardening (11 plants), collectibles, painting, novel writing with royalties, guitar tips.
- Swimming pools: pool tiles are terrain (`TER.pool`, not walkable). The Landgraab and Alto lots start with one; any household can dig one. Sims enter and leave only by a pool ladder; they swim on command or by themselves (fun, hygiene, athletic skill, the «Освежающее купание» moodlet).
- Eleven careers (branches at level 6 for criminal, law, military and music), three part-time jobs, work tones, promotions and firings, school with homework and grades, 24 opportunities.
- Relationships with chemistry, 53 social interactions, romance, marriage, move-ins, pregnancy, birth and adoption, aging with lifespan settings, midlife crisis, death, tombstones and ghosts.
- Services: Grim Reaper, firefighter, burglar and police, repairman, maid, pizza, social worker and repo man; weekly bills; story progression for the other households.
- Floors: four levels (`LEVELS`). Floors, rooms, walls and object layers are stored per level; A* runs over all levels and crosses them through links built from stairs (1×3, entry below, exit above) and elevators (a shaft that grows to every floor with floor at the shaft and its door). Sims follow stairs with a height offset and ride the elevator hidden. The Landgraab mansion has an upper floor with a library, an art studio and a roof terrace.
- Weather: clear, cloudy, rain and storm change every few hours by a Markov table (`WEATHER` in `s3-weather.js`). Rain soaks Sims outdoors (roofs, upper floors and roof pieces shelter them), waters gardens, keeps walk-by neighbours at home and makes outdoor activities less attractive; storms add lightning strikes and thunder. Indoor Sims get a cozy moodlet. The renderer blends sky, light, wet ground and rain streaks over half an hour.
- Family inventory: `hh.inv` keeps objects and personal items for the household. Sims give items to the family and take them back from the inventory tab; items of a deceased Sim move there.
- Time: one Sim minute per real second at normal speed (speeds 1, 3 and 10). Games start on Monday at 8:00.

## Code layout (`js/apps/sims3/`)

| Module | Role |
| --- | --- |
| `s3-core.js` | Constants, RNG, heap, formatting helpers |
| `s3-data*.js` | Needs, moodlets, skills, recipes, traits, careers, wishes, rewards, socials, objects, floors, wallpapers, doors, windows |
| `s3-world.js` | Tile world, walls on edges, layers, A*, rooms, front door detection |
| `s3-sim.js` | Sim class, looks, outfits, traits and lifetime wish helpers |
| `s3-blueprints.js`, `s3-families.js`, `s3-town.js` | House blueprints, the ten families, town generation |
| `s3-actions.js`, `s3-acts-*.js` | Generator-based actions and every interaction |
| `s3-social.js`, `s3-autonomy.js` | Social engine and autonomous choice |
| `s3-game.js`, `s3-life.js`, `s3-services.js`, `s3-weather.js`, `s3-save.js` | Game core and family inventory, life systems, services, weather, saves and new-game flow |
| `s3-tex.js`, `s3-geo.js`, `s3-models.js`, `s3-body.js`, `s3-render.js` | Texture atlas, geometry, object models, Sim bodies and animation, renderer |
| `s3-icons.js`, `s3-stage.js`, `s3-audio.js` | SVG icons, portraits and thumbnails, 2D overlay, synthesised audio |
| `s3-ui.js`, `s3-ui-hud.js`, `s3-ui-panels.js`, `s3-ui-build.js`, `s3-ui-cas.js`, `s3-ui-menu.js` | UI core and input, HUD, panels and dialogs, buy/build, Create a Sim, menus, map and options |

The logic modules (`s3-core` … `s3-save`) run in Node without a DOM; the test loads them and runs the simulation headless.

## Verification notes

- Headless browser checks go through the DevTools protocol against `sims3.html`. `s3ui.freshGame()`, `game.playFamily(id)` and `s3ui.startLive()` start a household directly; `s3ui.setSub('buy' | 'build' | 'map')`, `s3ui.startPlacing(type)`, `s3ui.newCASGame()` and `s3ui.optionsDialog()` open the other screens.
- The 2D overlay always keeps one almost transparent pixel after clearing. A fully cleared canvas was not recomposited in headless Edge, so stale labels stayed on screen.
- Wall picking for doors, windows and the sledgehammer accepts hits up to door height even when walls are cut away.
- When the camera looks at an upper floor, picking ignores Sims and objects below that floor's slab. At map zoom, or while the roof tool is active, the renderer shows every floor of the focused lot with full walls and roofs (`fullView`).
- `s3ui.setViewLv(n)` / `s3ui.stepLv(±1)` change floors, `s3ui.debugDialog()` opens the debug menu, `s3ui.skipToHour(h)` fast-forwards.
