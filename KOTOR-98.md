# Star Wars: Knights of the Old Republic 98 — глава «Тарис»

A from-scratch browser remake of the Taris segment of KOTOR. It runs from waking up in the Upper City apartment to the escape aboard the Ebon Hawk. The game uses real-time combat with pause on d20 rules, a WebGL third-person view, branching dialogue with Light/Dark choices, six companions, pazaak, swoop racing and the dueling ring.

- Desktop: icon **KOTOR 98**, Start menu → **Star Wars: KOTOR 98**, `C:\Games\KOTOR98\KOTOR.EXE`, Run: `kotor`, `kotor98`, `swkotor`, `котор`.
- Standalone page: `kotor98.html` (`window.ktui` is the UI instance).
- Test: `npm run test:kotor98` (about 25 000 checks in under a second).

## Controls

| Input | Action |
| --- | --- |
| Left click | Move, attack, talk, use a door, container, terminal or exit |
| W/A/S/D, arrows | Move relative to the camera |
| Q/E, right mouse drag, wheel | Rotate, tilt and zoom the camera |
| Space | Pause. Orders given while paused are queued |
| Tab, 1–3, click a portrait | Switch the controlled party member |
| F / H / G / R | Use nearest object / medpac / grenade at the target / rest |
| U I C K J M P L | Equipment, inventory, character, abilities, journal, map, party, messages |
| Esc | System menu (save, load, settings) |
| F5 / F9 | Quick save / quick load |
| 1–9 in dialogue | Choose a reply |

## Content

- **Areas (12):** Upper City apartments, Upper City, Upper City cantina, dueling ring, Lower City, Javyar's cantina, Hidden Bek base, Undercity, sewers, Black Vulkar base, swoop platform, Sith military base, Davik Kang's estate.
- **Main quest:** Carth → rumours in the Lower City → Gadon Thek → Mission Vao → Undercity and sewers (Zaalbar, rancor bait) → Vulkar base and the prototype accelerator → swoop race → Brejik and Bastila → Canderous → T3-M4 → launch codes from the Sith governor → Davik and Calo Nord in the hangar → Ebon Hawk.
- **Side quests:** Sith raid on the Duros, dueling ring (Marl to Bendak Starkiller), rakghoul serum (Zelka Forn or the Sith), the Promised Land journals, pazaak champions, Davik's prisoner.
- **Rules:** Soldier, Scout and Scoundrel. Point-buy attributes, eight skills, feats (Power Attack, Flurry, Rapid Shot, Sniper Shot and others), sneak attack, saving throws, crits and threat ranges, energy shields, grenades, mines, and locks opened with Security. Bastila's Force powers: Cure, Stun, Push and Battle Meditation. Jedi can deflect blaster bolts.

## Module layout (`js/apps/kotor98/`)

| File | Owns |
| --- | --- |
| `kt-core.js` | RNG, A* pathfinding, line of sight, XP curve |
| `kt-data.js` | Classes, feats, powers, items, models, creature templates, shops, quests |
| `kt-rules.js` | Creature creation, derived stats, attack rolls, level-up, equip rules |
| `kt-dialog.js` | Dialogue DSL parser and validators |
| `kt-maps.js` | Tile legend, themes, ASCII areas with mark definitions |
| `kt-game.js` | Game state, areas, doors, interaction, dialogue runtime, shops, saves |
| `kt-combat.js` | Update loop, movement, party/hostile AI, rounds, damage, Force, grenades |
| `kt-pazaak.js`, `kt-swoop.js` | Mini-game logic (headless, testable) |
| `kt-story-*.js` | NPCs, dialogues and scripts for each part of Taris |
| `kt-gl.js` | WebGL renderer: tile meshes, city skyline, primitive character models, effects, picking |
| `kt-audio.js` | Synthesized sound effects and music |
| `kt-ui*.js` | HUD, panels, title, character creation, prologue, pazaak, swoop, ending |

## Authoring notes

- **Maps** are ASCII rows. `{#16}` expands to sixteen `#`. Every row must have the same width, and the test checks this. Lowercase letters, digits and a few uppercase letters that are not tiles are marks defined in `marks` (`npc`, `foe`, `box`, `exit`, `door`, `use`, `trig`, `mine`, `spot`).
- **Dialogues** use a line DSL: `== id`, `@ start ?cond`, `# node speaker !action`, `- reply -> target | ?cond !action ~skill:dc:failNode`, `> next`. Actions such as `fight`, `goto`, `shop` and `run` run after the dialogue closes. Use `now:` for a script that must run at once (terminals, cutscene beats).
- **Balance** is checked by the test bot. It plays the whole chapter with automatic combat and no pause. Tune `K.XP_MULT`, the XP curve in `kt-core.js` and enemy templates. Then run the test with `KT_SEED=1..8` and `KT_CLS=soldier|scout|scoundrel`.

## Design pillars

1. **Tactical pause.** Every fight can be stopped, read and re-planned. Rounds are 2.6 s, and the combat log shows the d20 math.
2. **Choices with weight.** Every major encounter can be solved with persuasion, a skill or violence. Light and Dark side points are tracked.
3. **A layered city.** The descent goes Upper City → Lower City → Undercity → sewers. The calm hubs (apartment, cantinas, Bek base) alternate with combat peaks. Each area has one landmark: the Sith tower, the swoop arch, the outcast village fires, the rancor den.
