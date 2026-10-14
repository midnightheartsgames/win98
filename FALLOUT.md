# Fallout (Win 98 Edition)

Fallout: A Post-Nuclear Role-Playing Game (Interplay Productions, 1997), version 1.2, running inside the project. The game is a new JavaScript engine that reads the original data from `content/Fallout`: maps, prototypes, art, fonts, palettes, message files, sound effects, speech, music, movies and the compiled INT scripts. The scripts run on the project's own bytecode VM. Rules, screen layouts and constants that exist only in `FALLOUTW.EXE` were decoded from its disassembly and written again in JavaScript; the large tables are extracted from the EXE into generated modules. No original executable code runs.

Decisions taken with the user before the work started:

- Rules of version 1.2 as they are, original bugs included. Bugs are fixed only after the whole game works.
- English first (original text and voice). The Russian translation is a separate stage.
- Three resolution modes: 640x480, 800x600 and "fit the game window".
- No exe and no installer: the game starts only inside the project, after it is bought and downloaded in the in-system Steam.

## Where it lives

- **Steam**: catalog id `fallout` in `js/game-manager.js` (`steam: true`, $19.99, genre, 4 tags, 2 screenshot captions). The game is not preinstalled and has no setup wizard or web store; everything that launches it points to Steam (`gameManager.showInSteam('fallout')`) while it is not installed. Steam screenshots `content/steam/fallout-1.jpg` (caravans at the Hub gate) and `fallout-2.jpg` (talk with Aradesh) come from the recipe `fallout` in `tools/steam-shots-recipes.cjs`: `node tools/steam-shots.cjs fallout`.
- **After installation**: desktop icon **Fallout** (the Vault Boy icon in `js/icons.js` is drawn from `content/Fallout/fallout.ico`), Start menu → **Fallout**, `C:\Games\Fallout\FALLOUTW.EXE` with `README.TXT` (controls) and an empty `DATA\SAVEGAME`. Run: `fallout`, `fallout.exe`, `falloutw`, `falloutw.exe`, `fallout1`, `fallout 1`, `фоллаут` (`fallout2` still opens the Fallout 2 Demo). Clippy has tips for the game window and a launcher entry; 3ADVANCED lists the game.
- **Window**: `appFallout.open()` in `js/apps/fallout-app.js`, window id `app_fallout`. The client area matches the resolution mode: 640x480 or 800x600, and a change of the mode resizes the window (`onResolution`). A maximized window scales the picture by whole numbers only (a 1244x752 area stays at 1x, centred on black); an area smaller than the picture shrinks it. In the "fit" resolution mode the game renders at the size of the window itself.
- **Standalone page**: `fallout.html`. Without parameters it plays the logo movie and opens the main menu; `?map=NAME` (optional `&tile=N&elev=N`) starts a new game on that map. `window.fogame` is the `FO.Game` instance. F9 opens the map viewer (PgUp/PgDn previous/next map, `[` `]` elevation, R roofs, L day or night light, Home map start, F9 back to the game); the Win 98 window passes `debug: false`, so F9 does nothing there.
- **Data access**: the DAT directory is read once; files are fetched with HTTP Range requests (`server.js` answers ranges for `.dat`; the Electron app uses the same server) and unpacked with LZSS. Loose files in `DATA` override the archives; their list is generated into `fo-files.js`. The Electron build (`tools/build-exe.mjs`) ships `MASTER.DAT`, `CRITTER.DAT` and `DATA` without `SAVEGAME`, and leaves out the EXE and DLL files, the hi-res patch files, `Manual`, `Extras` and the readme files.
- **Storage**: `localStorage['fallout98_prefs']` (preferences and the screen settings `res`, `sideArt`, `scaling`); IndexedDB database `fallout98`, store `saves`, keys `meta<slot>` and `data<slot>`.
- **Tests**: `npm run test:fallout` (629 checks, about 7 s, part of `npm test`) and `npm run test:fallout-bot` (map sweep, dialogue sweep, story bot to the ending, about 30 s).
- **Russian version**: the game runs in Russian when the Win 98 language is Russian (`fallout.html?lang=ru` on the standalone page). Texts, fonts and interface art are laid over the original data from `content/fallout-ru`; the voice stays English. Details, rules and the glossary are in [FALLOUT-RU.md](FALLOUT-RU.md).

## Controls

These are the keys of the original game.

| Input | Action |
| --- | --- |
| Left click | Walk, or act with the action cursor |
| Right click | Switch between the walk and action cursors |
| Hold the left button on an object | Action menu: look, talk, use, use an item, skill, rotate, cancel |
| A | Start combat |
| Space | End the turn |
| Enter | End combat |
| N | Next weapon mode |
| B | Swap hands |
| M | Switch the cursor mode |
| I / C / P / S | Inventory / character / Pip-Boy / Skilldex |
| Z | Pip-Boy clock |
| Tab | Automap |
| O, Esc | Options |
| 1–8 | Sneak, Lockpick, Steal, Traps, First Aid, Doctor, Science, Repair |
| Home | Centre on the player |
| , / . | Turn left / right |
| / | Current date and time |
| + / - | Brightness |
| Arrows, mouse at the screen edge | Scroll the map |
| F1 | Help screen |
| F4, Ctrl+S | Save |
| F5, Ctrl+L | Load |
| F6 / F7 | Quick save / quick load (the first use asks for the slot) |
| F10, Ctrl+Q, Ctrl+X | Quit to the main menu |

## Code

All engine modules are in `js/apps/fallout/`, namespace `FO`. `fallout.html` and `index.html` load them in the order below (the test checks both). Every module except `fo-game.js` also loads in Node: the test and the bot run the game without a browser.

| Module | Contents |
| --- | --- |
| `fo-core.js` | Big-endian byte reader, C strings, name keys |
| `fo-dat.js` | DAT directory, LZSS, `Data` (archives plus loose files, Range requests in the browser, files in Node), `prefetch` of whole folders |
| `fo-formats.js` | PAL, FRM, MSG, LST, SCRIPTS.LST, GAM and INI readers |
| `fo-files.js` | Generated: loose files of `DATA` (`FO.LOOSE`) |
| `fo-exe.js` | Generated: tables from `FALLOUTW.EXE` (`FO.EXE`) |
| `fo-gen.js` | Generated: elevator stops (`FO.GEN.elevators`) |
| `fo-hex.js` | Hex and square grid geometry, steps, distances |
| `fo-art.js` | FIDs, art lists, critter art names, frame cache |
| `fo-proto.js` | PRO prototypes, PIDs, names and descriptions |
| `fo-map.js` | MAP reader (tiles, script groups, objects), roofs |
| `fo-color.js` | Palette, colour tables, palette cycling, fades, brightness |
| `fo-render.js` | 8-bit `Screen`, map draw order, object rectangles, outlines |
| `fo-light.js` | Light sources and per-hex light |
| `fo-text.js` | FON fonts and the EXE line wrap |
| `fo-acm.js` | ACM audio decoder |
| `fo-sound.js` | Web Audio: music, sound effects with the EXE name rules, speech, lip sync, volumes |
| `fo-mve.js` | MVE movie decoder |
| `fo-path.js` | Path finding |
| `fo-anim.js` | Animation sequences of critters and objects |
| `fo-rules.js` | Stats, skills, traits, perks, levels, premade characters |
| `fo-world.js` | `World`: objects, tiles, elevations, seen flags, map states |
| `fo-vm.js` | INT bytecode VM |
| `fo-scripts.js` | Script instances, events, timers, message lists, language filter, the player's script |
| `fo-ops.js` | Opcode library |
| `fo-combat.js` | To-hit, damage, critical hits, weapon modes and ranges |
| `fo-ai.js` | AI packets and decisions |
| `fo-attack.js` | Attack sequencing, death animations, knockback, dropped items |
| `fo-items.js` | Drugs, addiction, poison, radiation, explosions, item use |
| `fo-travel.js` | World map travel, encounters, midnight, map aging |
| `fo-save.js` | Save data, slot store, thumbnails, restore |
| `fo-ui.js` | Screen windows, buttons, action menu, message box |
| `fo-turns.js` | Combat turn loop, called shots |
| `fo-iface.js` | Interface bar |
| `fo-dialog.js` | Talking heads, dialogue, review |
| `fo-inven.js` | Inventory, loot, steal, quantity dialog |
| `fo-barter.js` | Barter |
| `fo-charscr.js` | Character screen and character creation |
| `fo-perkdlg.js` | Perk picker |
| `fo-select.js` | Premade character selection |
| `fo-panels.js` | Skilldex and skill use, elevator, options, help pictures, pause |
| `fo-automap.js` | Automap |
| `fo-pipboy.js` | Pip-Boy |
| `fo-worldmap.js` | World map and town map screens |
| `fo-prefs.js` | Preferences, screen settings, brightness |
| `fo-movie.js` | Movie playback, fades |
| `fo-endgame.js` | Ending slides and movie, death screen, narration |
| `fo-saveload.js` | Save and load screens, quick save and quick load |
| `fo-viewer.js` | Map viewer (debug, standalone page only) |
| `fo-play.js` | The map mode: input, cursors, actions, floating text |
| `fo-menu.js` | Boot, main menu, credits, new game |
| `fo-game.js` | Canvas, input, resolution, mode switching |

`js/apps/fallout-app.js` is the Win 98 window around `FO.Game`; `css/apps/fallout.css` styles the canvas.

## Screen modes

The modes are 640x480, 800x600 and "fit the window". They are chosen with the RESOLUTION knob of the preferences or in the screen settings window. Everything above 640x480 follows the hi-res patch that ships with the GOG data (`f1_res.ini`, art `HR_*.FRM` in `DATA`):

- **Interface bar**: from 800 pixels wide the 800 bar (`HR_IFACE_800.FRM`, buttons 160 pixels to the right of the 640 layout); wider screens fill the sides with metal (`HR_IFACELFT1`/`RHT1`, default) or leather (`HR_IFACELFT2`/`RHT2`) art or leave them black. The side art starts at the bar and is cut at the screen edge.
- **Panels over the map** (inventory, character screen, Pip-Boy, preferences, save and load, dialogue, barter, automap, called shot, message boxes) stay 640x480 and are centred above the bar when the screen is tall enough; the map and the bar stay visible around them. The dialogue uses the bordered art `HR_ALLTLK.FRM`, whose head window is 5 pixels lower.
- **Pictures**: movies, the help screen, the death screen, the ending slides and the main menu picture are scaled by the "Panel Scaling" setting: original size, fit keeping the shape (default) or fill the screen. At 640x480 they keep their original size. The hi-res main menu uses `HR_MAINMENU.FRM` with the button panel `HR_MENU_BG.FRM` 24 pixels around the buttons.
- **Main menu**: the sixth plate of `MAINMENU.FRM` holds OPTIONS (`SCRNSET.MSG` 3), which opens a box (`HR_OPTIONS_BG.FRM`) with game preferences and screen settings.
- **Screen settings** (`FO.ScreenSettings`, art `HR_SCRN_BG.FRM`): resolution list on the left monitor, sliders for the picture scaling and the side art, a preview of the side art in `HR_IFACE_SELECT.FRM`, DONE and CANCEL. The settings are kept in the browser, not in saves.
- The world map, the character selection and the credits stay centred on black.

## Data from FALLOUTW.EXE

`node tools/fallout-data.cjs` writes `fo-files.js`, `fo-exe.js` and `fo-gen.js`. It reads `content/Fallout/FALLOUTW.EXE`, so it runs only where the original files are present. The generated modules are part of the project, and the game itself never reads the EXE. The test checks that `fo-files.js` matches the `DATA` folder.

`FO.EXE` holds: palette cycles, movie list, encounter and special maps, map music, quests, holodisks, holidays, automap flags, hit locations, critical hit tables (critters, player, failures), perks, radiation and addiction effects, stat and skill tables, player stats, premade characters, the world map, the MVE audio delta table and map place names.

Address conversion for the disassembly: code VA = file offset − 0x400 + 0x410000, data VA = file offset − 0xD0E00 + 0x4F0000. Colours in the code are indexes into the colour table at 0x6A3B00, indexed by RGB555.

## Saves

- 10 slots with 224x133 thumbnails (F4/F5 screens), a quick slot (F6/F7), descriptions up to 29 characters.
- The preferences are saved with the game and restored on load, like in 1.2. The resolution mode is not part of a save.
- A save made during combat resumes the same turn order.
- `FO.saveData(play)` returns plain JSON: world objects field by field (object references as ids), script local variables, map states, global variables, time, preferences. `FO.loadGameData` rebuilds the world, re-runs the map scripts with the load flag and puts the player back on the saved tile.
- To save new state, add plain fields to the world, script or map state and extend the round-trip checks in `saves()` of `tests/fallout.test.js`.

## Tests and tools

- `tests/fallout.test.js`: archives and loose files, every file in the archives, sample assets, geometry, all 72 maps with their scripts, movement, script VM (stack check of every opcode signature), Pip-Boy, combat, items, rules, world map travel, audio and movie decoders, objects, saves, shell wiring, and code checks (no comments, naming rule, module order in `fallout.html` and `index.html`).
- `tests/fallout-bot.js maps dialogs story` (`--map=NAME`, `-v`, `--seed=N`, `--ru` to play with the Russian overlay):
  - `maps` starts every map, plays 3 seconds, saves, checks that the restored world matches, then loads the save without script errors.
  - `dialogs` walks every dialogue option of every talking script (about 300 scripts) and calls every other procedure without VM errors.
  - `story` plays the main quest with a fixed seed: water chip, radscorpions, the vats, the Master, the return to Vault 13 and the ending movie, with a save and load after each step.
- `node tools/fallout-shots.cjs <out> <steps.cjs>`: screenshots from headless Edge over the DevTools protocol. Environment: `FO_PAGE` (default `fallout.html?map=V13ENT`), `FO_READY`, `FO_SIZE`. Steps: `eval`, `gshot`, `shot`, `move`, `click`, `key`, `sleep`.

## Status

Stages 0–12 are done (4–5 October 2026): data and formats, map renderer and light, movement and exit grids, script VM, interface screens, combat, rules, world map, sound and movies, saves with the bot run to the ending, Win 98 and Steam, the Russian version, the hi-res modes.

Original 1.2 behaviour kept on purpose:

- Children are invisible: this release has no art for them.
- `ADYTOWNR.FleeDude` loops forever when `random(0, 5)` gives 5; the VM budget stops it.
- In the save description box the "DESCRIPTION" title and the CANCEL label move right by the slot index.

To check later:

- The order of the white fade and the death or ending screens when the game ends.
- Combat outlines: the EXE draws outline types 1 and 8 as palette gradients; the remake uses plain colours.
- Side quests other than the radscorpions are covered only by the dialogue sweep, not by the story bot.

