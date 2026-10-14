# Diablo II

An isometric action RPG built from scratch for this project: all seven heroes, the whole first act (Rogue Encampment to Andariel's lair), three difficulties and hardcore. Everything is drawn in code on an 800×600 canvas: procedural 3D rigs projected into 16 directions, per-pixel ground textures, cliffs, foliage and dungeon walls, a lightmap for darkness, and a Win-98-era interface with red/blue orbs, a four-slot belt, skill buttons and a stamina bar. Sound effects and music are synthesised with Web Audio. It shares no code with the older Diablo game in `js/apps/diablo*.js`. All text is in Russian.

- Distribution: sold in the in-system Steam client (`steam: true` in `js/game-manager.js`, $47.99). The game is not preinstalled.
- After installation: desktop icon **Diablo II**, Start menu → **Diablo II**, `C:\Games\Diablo2\DIABLO2.EXE` (with `README.TXT` and `SAVE`), Run: `diablo2`, `diablo2.exe`, `diablo ii`, `diablo 2`, `d2`, `диабло 2`, `диабло ii`, `дьябло 2`. Task Manager shows `Diablo II.exe`.
- Window: `appDiablo2.open()` in `js/apps/diablo2-app.js`, window id `app_diablo2`.
- Standalone page: `diablo2.html` (`window.d2ui` is the UI instance, `d2ui.g` the running game).
- Characters are stored in `localStorage` under `diablo2_98_chars`.
- Test: `npm run test:diablo2` (about 39 000 checks in about 40 seconds, most of it the bot section).

## Controls

| Input | Action |
| --- | --- |
| Left click | Walk, attack, talk, pick up, open, use the left skill. Hold to keep attacking or walking |
| Shift + left click | Attack in place |
| Right click | Cast the right skill at the cursor |
| Ctrl + left click | Sell an inventory or equipped item while trading |
| Shift + left click on a potion | Move it from the inventory to the belt |
| Ctrl (hold) | Show the tooltip of the item on the ground under the cursor |
| 1 – 4 | Drink from the belt column |
| F1 – F8 | Switch to a hotkeyed skill. Hover a skill in the S menu and press F1 – F8 to bind it |
| S | Right skill menu (the left menu opens from the left skill button) |
| I or B | Inventory |
| C or A | Character sheet |
| T | Skill tree |
| Q | Quest log |
| Tab | Automap overlay |
| W | Swap weapon sets I/II |
| R | Toggle run/walk |
| Alt | Show item labels on the ground |
| H | Help screen |
| Space | Close all panels |
| Esc | Close the top panel, otherwise the game menu (options, save and exit) |

## Content

- **Heroes:** Amazon, Assassin, Necromancer, Barbarian, Paladin, Sorceress, Druid. 107 skills in three trees each (strikes, missiles, novas, meteors, blizzards, walls, chain lightning, static field, teleport, buffs, curses, warcries, summons, traps, corpse skills, auras, shapeshifting, passives), with synergies.
- **Areas:** Rogue Encampment, Blood Moor, Den of Evil, Cold Plains, Burial Grounds, Stony Field, Dark Wood, Tristram, Black Marsh, Forgotten Tower (2 levels), Tamoe Highland, Barracks, Jail, Cathedral, Catacombs (2 levels) and Andariel's lair. Outdoor areas, caves and dungeons are generated per game from a seed; waypoints link them.
- **Quests:** Den of Evil (skill point), Sisters' Burial Grounds (free mercenary), Search for Cain (Tristram, identification), Forgotten Tower (Countess' gold and runes), Tools of the Trade (Horadric Malus, Charsi imbues an item), Sisters to the Slaughter (Andariel, unlocks the next difficulty).
- **Town:** Akara (potions, scrolls, identify), Charsi (weapons, armour, repair, imbue), Gheed (gamble), Kashya (mercenaries), Warriv, Cain (free identify after rescue), the stash with gold.
- **Monsters:** 22 families with champion packs, randomly named uniques with modifiers, and super uniques (Corpsefire, Bishibosh, Blood Raven, Rakanishu, Treehead Woodfist, Griswold, the Countess, the Smith, Pitspawn Fouldog, Bone Ash, Andariel).
- **Items:** 314 base items, magic/rare/set/unique quality, 110 uniques, 5 sets, 25 runes, 18 runewords, gems, sockets, charms, superior items, durability, identification, magic find.
- **Rules:** hit chance from attack rating and defence, resistances with a difficulty penalty, life and mana leech, crushing blow, open wounds, block, fast hit recovery, stamina, corpse retrieval after death (in hardcore the hero is lost), town portal, hireling that levels with the hero.

## Module layout (`js/apps/diablo2/`, load order)

| File | Owns |
| --- | --- |
| `d2-core.js` | Screen constants, palette, fonts, RNG, noise, iso projection helpers |
| `d2-data-classes.js` | Classes, base stats and all skill definitions (data-driven kinds and per-level values) |
| `d2-data-items.js` | Base items, affixes, uniques, sets, runes, runewords, gems |
| `d2-data-monsters.js` | Monster families, allies, modifiers, super uniques, level curves, difficulty multipliers |
| `d2-data-world.js` | Areas, NPCs, dialogue text, quest map |
| `d2-items.js` | Item creation, quality rolls, affixes, sockets, pricing, serialisation |
| `d2-path.js` | Walk/fly grids, A* with string pulling, line of sight, flood fill |
| `d2-mapgen.js` | Outdoor, cave, room-and-corridor, town and Tristram generators, roads, packs, objects |
| `d2-hero.js` | Characters, stat derivation, equipment, belt, inventory/stash grids, saving |
| `d2-game.js` | `Game`: areas, entities, movement, combat, loot, quests, NPC services, portals, waypoints |
| `d2-skills.js` | Skill execution, missiles, ground effects, auras, curses, summons |
| `d2-ai.js` | Monster, pet and mercenary behaviour, boss patterns |
| `d2-inv.js` | Held item, equip/unequip, belt, stash, trade |
| `d2-sprites.js`, `d2-models.js` | Rigs, poses and procedural models for heroes, monsters, NPCs; sprite cache |
| `d2-terrain.js` | Ground textures, chunks, cliffs, walls, foliage |
| `d2-icons.js` | Item and skill icons |
| `d2-render.js` | Frame composition, depth sort, lighting, effects, picking |
| `d2-hud.js`, `d2-panels.js` | Bottom bar, orbs, belt, talk box; inventory, character, skills, quests, trade, stash panels |
| `d2-screens.js` | Main menu, character select, class selection around the campfire, cinematics, credits |
| `d2-audio.js` | Synthesised sound effects and music |
| `d2-ui.js` | Canvas scaling, input, screens, menus, saves |

## Tests

`tests/diablo2.test.js` covers data integrity, map reachability, item rolls, hero stats, every skill in an arena, the whole Act I quest chain, economy, death and corpse retrieval, a bot run for each class and the shell integration (zero comments, script order, Steam catalog, i18n).

`tests/diablo2-bot.js` plays the act with a scripted build per class: `node tests/diablo2-bot.js <classes> <last area> [-p]`, for example `node tests/diablo2-bot.js paladin lair -p`. All seven classes reach Andariel's lair and kill her on normal.
