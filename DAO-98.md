# Dragon Age: Origins 98

A browser remake of Dragon Age: Origins, made to look like a PC game from 2000: low-poly segmented characters, vertex lighting, fog and procedural textures. The game covers all six origin stories, Ostagar, the Korcari Wilds, the Tower of Ishal, Flemeth's hut and the road to Lothering. It stops when the party leaves Lothering. Combat runs in real time with pause. Companions follow editable tactics, and they approve or disapprove of your choices.

- Desktop: icon **Dragon Age 98**, Start menu → **Dragon Age 98**, `C:\Games\DAO98\DAORIGINS.EXE`, Run: `dao`, `dao98`, `daorigins`, `dragonage`, `dragon age`, `драгон эйдж`, `эпоха драконов`.
- Standalone page: `dao98.html` (`window.daui` is the UI instance).
- Test: `npm run test:dao98`. The bot plays every origin through Lothering, about 6 500 checks in under two seconds.

## Controls

| Input | Action |
| --- | --- |
| Left click | Move, attack, talk, loot, open a door, use an exit |
| Right click | Stop the current order, or cancel ability targeting |
| Right mouse drag | Rotate and tilt the camera |
| Wheel | Zoom from behind the shoulder up to the tactical view |
| W/A/S/D, arrows | Move relative to the camera |
| Q / E, R | Turn the camera, snap it behind the leader |
| Space | Pause. Orders given while paused are carried out on resume |
| F1–F4, click a portrait | Control another party member. Shift+click adds them to the selection |
| B, H | Select the whole party, hold position |
| Tab (hold) | Highlight everything you can interact with |
| 1–0 | Quickbar slots. In dialogue they pick a reply |
| C K I J M T N P | Character, abilities, inventory, journal and codex, map, tactics, crafting, party |
| L | Enlarge the combat log |
| Esc | Game menu (save, load, settings, quit) |
| F5 / F9 | Quick save / quick load |

## Content

- **Character creation:** human, elf or dwarf; warrior, rogue or mage; male or female; appearance, attribute points, a skill and a starting talent. The race and class choice decides the origin.
- **Origins (6):**
  - Human noble: Castle Highever, the mabari in the larder, Howe's betrayal at night, the escape with Duncan.
  - Magi: the Harrowing in the Fade (the mouse, the Spirit of Valor, the rage demon), Irving, Jowan's phylactery in the vault.
  - City elf: the wedding in the Denerim alienage, Vaughan's raid, rescuing the brides from the estate.
  - Dalish elf: the ruins with Tamlen, the mirror, waking in camp, the search with Merrill.
  - Dwarf noble: the Proving in Orzammar, the Aeducan thaig, Bhelen's trap and exile to the Deep Roads.
  - Dwarf commoner: Dust Town, Beraht's job with Leske, the Proving under a borrowed name.
- **Main chapter:** Ostagar (King Cailan, Alistair, the blood vials, the treaties in the Wilds, the Joining), the Tower of Ishal and the beacon, the ogre, Flemeth's hut, Morrigan, the Imperial Highway, Lothering (the bandit toll, the Chantry board, Sten in the cage, Leliana in the tavern).
- **Side quests:** the injured mabari, the hungry prisoner, the missing scouts, the treaties, the Lothering board jobs, the bandit camp, the wild beasts by the fields, poultices for the refugees, plus the side quests inside each origin.
- **Areas (25):** Highever, the Fade, the Circle Tower and its vault, the alienage, the arl's estate, the Dalish road, the elven ruins, the Dalish camp, the Orzammar palace, the Proving arena, the Aeducan thaig, the Deep Roads, Dust Town, Beraht's hideout, Ostagar, the Korcari Wilds, the Ishal approach, the Ishal floors, the Ishal top, Flemeth's hut, the Imperial Highway camp, Lothering, the Dane's Refuge tavern and the Lothering chantry.
- **Rules:** six attributes, eight skills with four ranks, about 70 talents and spells in four-step lines, weapon sets, armor and fatigue, crits and backstabs, threat, statuses (stun, knockdown, sleep, paralysis, freeze, horror, pin), injuries after a party member falls, and friendly fire from Normal difficulty up. Crafting covers herbalism, poisons and traps. Companions have approval and favourite gifts. Click one outside combat to talk. The codex fills up as you explore.
- **Voiced dialogue:** the browser's speech synthesis reads every dialogue line aloud. Each speaker gets a Russian voice and pitch from their sex, race and name, and the narrator has a voice of their own. The "Озвучка диалогов" block in Esc → Settings turns voicing on or off and sets its volume, speech rate and the voices for male roles, female roles and the narrator (the narrator can also be muted). Voicing needs a Russian speech voice installed in the OS or browser.

## Module layout (`js/apps/dao98/`)

| File | Owns |
| --- | --- |
| `da-core.js` | Math helpers, RNG, noise, the navigation grid, A* paths, line of sight, money, the XP table |
| `da-data.js` | Attributes, races, classes, origins, skills, talent lines, items, recipes, injuries, enemy templates, loot tables, difficulty |
| `da-rules.js` | Creature creation, derived stats, equip rules, levelling and bot builds, hit and resist math, saves for creatures |
| `da-dialog.js` | Dialogue DSL parser, validator and condition evaluator |
| `da-world.js` | Floor and wall materials, props, the area `Builder`, themes and registries |
| `da-game.js` | Game state, areas, objects, doors, dialogue runtime, scripts, loot, shops, saves |
| `da-combat.js` | Update loop, orders, movement, tactics, abilities, damage, statuses, threat |
| `da-story-common.js` | Companions, shared NPCs, the world map, random road encounters, the codex, achievements |
| `da-story-*.js` | One file per origin (`hn`, `mage`, `ce`, `de`, `dwarf`), then `ostagar` and `lothering` |
| `da-tex.js`, `da-models.js`, `da-props.js` | Procedural textures, segmented character models and poses, prop meshes |
| `da-gl.js` | WebGL renderer: terrain and walls, baked light, sky, fog, roofs, particles, decals, picking |
| `da-icons.js`, `da-audio.js` | Item and ability icons drawn on canvas, synthesized sound, music and dialogue speech |
| `da-ui.js` | HUD, input, camera, dialogue view, loot, slides, loading screens, saves |
| `da-ui-book.js` | The parchment book panels, the game menu and settings |
| `da-ui-front.js` | Main menu, character creation, world map, credits, ending |

## Authoring notes

- **Areas** are built in code with `D.Builder`: `ground`, `room`, `hall`, `wall`, `opening`, `door`, `water`, `ramp`, `house`, `npc`, `foe`, `box`, `exit`, `trig`, `light`. Objects accept `req` conditions, and the game re-checks them live, so a chest or an exit can appear once a flag is set. Walls laid later overwrite earlier openings, so cut openings last.
- **Doors** block both movement and sight while closed. The area test flood-fills each area from its entry spots and fails if an NPC, chest, usable object, exit or enemy can't be reached.
- **Dialogue** uses a line DSL: `== id`, `@ node`, `speaker: text`, `! actions`, `=> target ?cond`, and replies as `* text => target ?cond !act %persuade:dc:failNode once`. `{male|female}`, `{name}` and `{family}` are substituted for the hero. Actions like `fight`, `goto`, `shop` and `run` happen after the dialogue closes. Use `do:` for an effect that has to happen at once.
- **Scripts** are generator functions. They can yield a delay in seconds, a predicate to wait for, or `'dlg'`, `'slides'`, `'fight'` and `'arrive'` to wait for those events.
- **Balance** is checked by the test bot. It plays with automatic tactics, rests between fights and equips the best gear it finds. Vary it with `DA_ORIGIN=hn|mage|ce|de|dn|dc`, `DA_SEED`, `DA_CLS=warrior|rogue|mage` and `DA_SEX=m|f`. `DA_ORIGIN_ONLY=1` stops after the origin, and `DA_DEBUG=1` logs each bot step with its position.

## Design pillars

1. **An origin that matters.** Each origin has its own areas, cast and ending. It also changes how people at Ostagar talk to you.
2. **Pause and plan.** Every fight can be stopped and every order changed. Tactics let companions handle the routine so you can focus on the dangerous targets.
3. **The book.** Every management screen is a page in the same parchment book. Each page is laid out for its own task: the equipment page follows the character, the inventory is a list, the map is a single wide sheet.
