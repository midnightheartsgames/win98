# Sam & Max: Culture Shock

A point-and-click adventure that retells Sam & Max Save the World, Episode 101 "Culture Shock", as if it had been released in 2000 with the look and interface of Sam & Max Hit the Road (1993). Everything is drawn in code at 320×200 with a 256-colour palette: black-outlined cartoon backgrounds with dithered shading, animated characters, SCUMM-style coloured speech above the speakers, the verb cursor, Sam's cardboard box for the inventory and conversation icons. The dialogue is original writing in Russian; the plot follows the episode's story beats and puzzle chain, extended with new puzzles and gags.

- Distribution: sold in the in-system Steam client (`steam: true` in `js/game-manager.js`, $21.99). The game is not preinstalled.
- After installation: desktop icon **Sam & Max**, Start menu → **Sam & Max: Culture Shock**, `C:\Games\SamMax\SAMMAX.EXE`, Run: `sammax`, `sam & max`, `sam and max`, `culture shock`, `сэм и макс`, `культурный шок`. (`sam` still starts Serious Sam.)
- Standalone page: `sammax.html` (`window.smxui` is the UI instance, `smxui.g` the game).
- Test: `npm run test:sammax` (about 20 000 checks in about 1.2 seconds).

## Controls

| Input | Action |
| --- | --- |
| Left click | Walk, or apply the current cursor to what is under it |
| Right click / wheel | Next cursor: walk → look → use → talk. With an item held: put it back |
| 1 – 4 | Choose the cursor directly |
| Box in the lower left, I, Tab | Open Sam's box (inventory). Look cursor describes an item, any other cursor picks it up |
| Item on item / on anything | Hold an item and click the target |
| . | Skip the current line |
| Esc | Skip a cutscene; otherwise close the box, drop the item or open the menu |
| F5 | Menu: save (7 slots and an autosave), load, settings (text speed, music, sound) |
| Space | Pause |
| Conversations | Hover an icon to read the line, click it or press 1 – 9 |
| DeSoto | Arrows or clicks change lanes; tools on the right: wheel, gun, megaphone, horn, back home |

Talking to Max gives a hint for the current situation. The game cannot be lost and cannot get stuck.

## Story and puzzle chain

1. **Office.** Jimmy Two-Teeth holds the phone hostage and wants Swiss cheese. Open the closet, shoot the cheese pile with the gun to make it Swiss, take a piece and put it at the rat hole. Jimmy comes out; use Max on him and Max dangles him out of the window (he is afraid of heights). The Commissioner calls: the Soda Poppers are terrorising the neighbourhood.
2. **Investigation.** Specs sprays "EYE-BO" graffiti on the street and mentions that his glasses see everything in front of him but nothing above. Bosco sells a tear gas grenade launcher for $10 000, explains his Shoplift-O-Matic (a spring-loaded boxing glove above the door) and the windowless van that brings free Eye-Bo tapes. Take a tape from the stand and play it on the office VCR: the tape hypnotises Sam and Max until Max craves popcorn. Afterwards the TV shows five segments about the Soda Poppers and Brady Culture with hints about each weakness.
3. **Sybil.** Peepers sits in Sybil's office wearing her wig; the real Sybil is locked in the closet. Free her. Once the tape has been watched she explains the cure: a blow to the head resets a fresh hypnosis, a deep one has to be fought inside the subject's dream.
4. **Whizzer.** Use Max on Bosco's toilet door. Whizzer, who always needs to go, drops his basket and waits. Put Bosco's cheese into the basket and call Max out. Whizzer leaves with unpaid cheese and the Shoplift-O-Matic knocks him back to normal.
5. **Specs.** Take the spray can from the car behind the DeSoto and paint over Specs' old graffiti. He rushes to repaint it, directly under the office window. Drop the bowling ball from the window.
6. **Peepers.** Drive the DeSoto to the highway patrol, shoot out a taillight and order the driver to pull over with the megaphone; he pays the $10 000 fine from a bag marked "First National Bank". Buy the launcher, gas Peepers so he cannot see, then knock him out with the boxing glove.
7. **The van.** With all three cured, the Poppers point at the Eye-Bo van, which escapes. Chase it on the highway, dodge the tape crates it throws and shoot both rear tyres. It crashes at Brady Culture's Home for Former Child Stars.
8. **Admission.** The form from the gate lists three symptoms of "artificial personality disorder" (random per game: money or fame, dentistry or hair styling, marrying one's mother or watching one's peers grow old). The cymbal monkey at the gate wants a psychiatrist's signature, so Sybil runs three tests: inkblots (answer to match the obsession), free association (use the gun or the glove on Sybil for the trigger words only) and dream analysis (set the silhouette and the box in a dream room: Sybil and a wedding cake, or Max and a birthday cake).
9. **Hypnosis.** The signed form opens the gate. Brady hypnotises Sam with his Hypno-Tron and keeps Max as the star of his next show. Hypnotised Sam delivers tapes to Bosco and cannot use the car. Taking the cheese and walking out lets the Shoplift-O-Matic knock him out.
10. **Sam's dream.** Four Bradys live in the purple office: a light bulb (switch it off), a TV (take the coat-hanger antenna), a cheese in the closet (pump up Jimmy with the bicycle pump so he eats it) and Brady wearing Max's body. The loose One Way sign flips the room upside down; shoot its nail, catch Max's head as it falls and put it back on Max's body.
11. **The helmet.** Bosco once tried to build a hypnosis blocker; Sybil gives Sam a helmet diagram; Bosco needs an antenna and the office coat hanger completes the colander helmet. Its antenna also transmits Sam's voice on Brady's wavelength.
12. **Finale.** In the studio Brady hides in a glass booth with a reset button, the Poppers guard him and Max sits strapped to the "Star" chair. Talking to the Poppers builds two-part commands. The Poppers cannot attack their Master, and Brady resets them while he sits at the console. The solution is "Worship Brady Culture" (he comes out to bask), "Become Brady Culture" (each Popper now believes he is the real Brady) and "Attack Brady Culture" (they pile on the impostor). Brady flies into the Hypno-Tron, all hypnosis breaks, and Brady ends up staring at his own reflection. The Commissioner calls the office to close the case, followed by the credits.

## Module layout (`js/apps/sammax/`)

| File | Owns |
| --- | --- |
| `sm-core.js` | Screen size, palette ramps with darker/lighter tables, cycling and emissive colours, speech colours, RNG |
| `sm-paint.js` | Indexed buffers, polygon/ellipse/path/capsule rasterisation, outlined and shaded parts, dithered gradients, blitting, the `Pen` transform |
| `sm-font.js` | Hand-made 9-row pixel font with Latin and Cyrillic, measuring, wrapping, outlined text |
| `sm-sprites.js`, `sm-sprites2.js` | Sam and Max (four directions, walk cycle, talk, poses) and the other costumes: Jimmy, Bosco, Sybil, the Soda Poppers, Brady, the monkey, dream objects, the van, portraits; sprite cache |
| `sm-icons.js` | Inventory and dialogue icons, cursors, Sam's box |
| `sm-bg.js`, `sm-bg2.js`, `sm-bg3.js` | Room backgrounds and layers: office, street (640 px wide), Bosco's, Sybil's office, the Home's gate, the studio |
| `sm-engine.js` | `Game`: actors, grid pathfinding with string pulling, depth scaling, generator scripts, speech, verbs and hotspots, inventory, conversations, saves |
| `sm-render.js` | Frame composition by depth, speech placement, box, inventory panel, dialogue bar, room flip, shake, palette effects (fades, flashes, darkness, dream tint, palette cycling) |
| `sm-story.js` | Items, generic answers, Max's hints, symptoms, new game setup |
| `sm-room-*.js` | Rooms with hotspots, handlers, cutscenes and conversations |
| `sm-closeups.js` | Title card, TV programmes, title screen |
| `sm-drive.js` | City map, pseudo-3D highway for the patrol and the van chase |
| `sm-audio.js` | Synthesised sound effects and jazz themes per location |
| `sm-ui.js` | Canvas scaling, input, title, menus, saves, credits |

The engine files are shared with episode 102 (`SAM-MAX-102.md`). A game or UI created without an `ep` option uses the `SamMax` namespace as its episode; episode 102 passes `SamMax.EP102`, which carries its own rooms, items, conversations, layers, map destinations, title, credits and save keys.

## Authoring notes

- **Hotspots** are `{ id, name, rect | poly, walk, face, when, look, use, talk, items, exit }`. A handler is a string (Sam says it), an array (said in turn, the last one repeats) or a generator `function* (g)`. `items` maps item ids to handlers; `*` catches the rest. Clickable actors are configured under `room.actors` or in `S.ACTOR_HOT`.
- **Scripts** yield waitables: `g.say()`, `g.walkTo()`, `g.anim()`, a number of seconds, `g.fadeOut()`/`g.fadeIn()`, `g.until(fn)` or `g.talkTo(id)`. A script waiting for a conversation does not count as busy, so the player can choose options.
- **Background scripts** (`room.ambient`) move NPCs. A cutscene that waits for an NPC walk must set `actor.scripted = true` first, otherwise the ambient script can keep giving the NPC new paths and the cutscene never ends.
- **Layers** are cached sprites drawn by depth (`base` is the baseline, no `base` means behind everything). `key(g)` invalidates the cache when a layer depends on state.
- **Text** must only use characters the pixel font has; the test scans every Cyrillic string in the sources.
- **Saves** are allowed only when nothing blocking runs, no conversation is open and the room is not marked `noSave` (dream rooms, the studio).
