# Другая война (Another War) — Win 98 Edition, Act I

Clone of Mirage Interactive's "Another War" (2002, Russian edition «Другая война»). This build covers the whole first act: the town of Annet in occupied southern France, from the arrival on the old truck to the departure for Yugoslavia. Game id `anotherwar`, sold only through the in-system Steam client (`steam: true`, `C:\Games\AnotherWar\AW.EXE`).

All art, animation, sound, music and voice come from the original install in `content/Another War` (excluded from the exe build), converted by `python tools/anotherwar-assets.py` into `content/anotherwar`. Dialogue, journal and item texts are rewritten from the Russian edition by the rules in `game-human-style.md`; voiced one-liners keep the wording of their recordings.

## Premise and pillars

A mercenary (Zygmunt by default, the player names him) comes to Annet because his old friend Pierre Dole asked for help. Pierre valued looted antiques for a German general, found a coded map inside a medieval book and ran. The general's men storm the café, the hero wakes in the castle dungeon, frees a drunken Wehrmacht mechanic named Johann and has to get both of them out of France. The whole game is Johann's story, told in a pub in May 1947.

1. **Johann tells it.** The frame is a pub story. Dying outside the dungeon asks "Игра окончена?"; answering No sends you back to the pub, where the listeners protest and Johann "remembers" how you survived, and play resumes in Café Rene with half health (original rule, `A_Death`). Death in the castle dungeon ends the game.
2. **Three heroes, three ways.** Strongman, Thief and Intellectual share the plot but open doors differently: the cell door (break it, pick it, bluff in German), the bookseller's desk (threat, theft, a fake order), the way under the church (smash the slab, climb down the well chain, solve the chair). Stat checks in dialogue (`test:int`, `test:cha(7)`) reward the build.
3. **Look at everything.** Every hotspot has a dry comment, most of them voiced. Curiosity pays: coins in the fountain, a knife under the potatoes, the Chaplin poster, the Roman inscription.
4. **Dice under a real-time war.** Combat is real time with the original d6 rules (skill dice + agility + luck against distance + target agility, damage = cartridge roll − armour). Pause is always available.
5. **Occupied, not grim.** The town is funny; the dungeon and the forest patrols are not. Humour lives in words, danger lives in guns.

Target aesthetics: discovery and narrative first, challenge second.

## Loops

| Loop | Length | Content |
| --- | --- | --- |
| Moment | seconds | Move by click, look (LMB on a hotspot), use/talk (RMB), fight with a drawn weapon (lazy auto-attack or Ctrl-aimed shots), use belt items 1-7. |
| Session | 10-30 min | One location or errand: read the town, get a lead in dialogue, fetch or trade the item, fight through a patrol, write it into Johann's diary. |
| Meta | the act | Level up (one point per level: +1 stat, a passive skill from the class tree, or a special skill), better guns and clothes from patrols, money from trading, the three knots of the act solved to leave Annet. |

## Act I structure

Foldback: the prologue and the dungeon are linear; the town is a hub with three parallel knots that reconverge on the departure (papers + repaired truck + Pierre's map).

1. **Prologue.** `StoryRoom` (pub, 1947) → `A01_Rynek` (truck arrives, driver Pierre says the truck is dead) → `A02_CafeRene` (Pierre Dole's story, the general, a blow on the head).
2. **Title card** «Акт I. В поисках никто не знает чего...» → `A03_Lochy`.
3. **Dungeon.** Class-specific cell escape, the drunk Johann behind a locked door (key near the torture cell), eavesdropping on Pierre's interrogation ("the map now belongs to God"), the strange crate with the hero's own belongings, guards with rifles and knives. Johann joins and leads out → `A07_Przedzamcze`, where a very literal sentry lets you leave.
4. **Town hub** (`A01`, `A02`, `A06`, `A04`, `A05`, `A08`, `A09`):
   - **Truck.** Driver asks for help → inspect the truck (gasket) → a peasant: the only car belonged to undertaker Alfred → Alfred talks only about plants → bookseller gives a fertiliser book → Alfred trades his old gasket → fix the truck (hero, or Johann).
   - **Papers for Johann.** Rene (after Alfred's hint) sends you to the forest hut past the castle; Alfred later gives the whistle and the password; the forest is full of manoeuvring Germans; agent "Roquefort" in `A11_Las` wants the lost supply crate hidden near the cemetery (`A08_KryptaMala`) → papers in the name of an SS special unit.
   - **Pierre's hiding place.** Gravedigger's bruises (bandage) → his fall from the bell tower and the stranger who came out of the well → measure the well → under the church (`A09_Katakumby`) past Gestapo agents → the stash with Pierre's map.
   - Side: the bocce balls of the three Verdun veterans (stolen by the bookseller; reward: Grenades skill), cheese for Rene (from the dungeon crates, sold in trade), Rene's whisky and the 1859 Saint-Chignon, the fountain, the poster column, the Gestapo shadow, the musicians, Edith.
5. **Departure.** With papers and the map, the repaired truck leaves for Yugoslavia → closing card «Акт II. Югославия — продолжение следует».

Forest locations `A12_LasSE/NE/NW/SW` are combat zones generated from the original zone tables (squads, officers, partisans, mines, supply crates); they respawn after 10 game minutes away.

## Rules (ported from the original Lua)

- **Stats:** strength, agility, intelligence, endurance, charisma, speed, luck (class base + 4 free points at creation). HP = 4 × endurance + ⌊luck/2⌋, +(max(0, end−7) + d6) per level. AC = agility − 9 + ⌊level/2⌋ + worn items.
- **People from templates** (every NPC, soldier and Johann) follow the original `GenerateHumanFormTML`: stats rolled from the template expressions, HP = 4 × endurance + ⌊luck/2⌋ plus one level increment per level (the `hitpoints` field of the template is ignored, which is why Johann's 10000 never shows), weapon skills from `kit_skills` (soldiers are trained with their weapon, 2d6), AC from the template except for allies (`HeroiNPC`), whose AC is computed from agility.
- **Classes:** Strongman 8/5/3/8/4/5/6 (fists), Thief 5/7/6/5/5/7/6 (knives), Intellectual 4/6/8/4/7/6/6 (pistols); all start with whisky, a little money and a leather jacket.
- **Levels:** XP thresholds 750, 1500, 2500, 4000, 6000, 8000... One point per level for a stat, a passive skill (class tree, levels 1-4) or a special skill (unlock table by ⌊level/2⌋, max level 4).
- **Hit:** attacker = weapon-skill dice (untrained d4, trained 2d6..5d6 with a critical on the maximum) + weapon bonus + agility + 0.3 × luck + to-hit; defender = distance in metres (60 px) + d6 + agility + 0.3 × luck + to-miss. Hit when attacker > defender; margins > 10 and > 20 halve or quarter armour; the maximum roll ignores it.
- **Damage:** cartridge class (normal 2-12, dum-dum/expanding 4-16, explosive 6-36) + weapon damage; melee = strength × 0.3 (fists), × 0.4 (gun butt), × 0.7 (knife, bayonet). Damage − AC, at least 1. Grenades: damage × (1 − dist/area) from half to full.
- **Weapons:** durability wears on every shot; jams grow likely below 80/50/30/10 %; repair with tools. Close range (< 60 px) uses the gun butt.
- **Awareness:** enemies see 6 m, lose you at 7.5 m, raise nearby allies; safe areas (town, café) sheathe weapons.
- **Specials (F1-F8, Space):** 8 per class with a recharge bar; the act unlocks what the level allows.
- **Death:** in `A03_Lochy` the game is over; elsewhere the pub frame, then Café Rene with half health, nothing lost.

## Interface

Original 800 × 600 layout drawn with the game's own GUI art (skin 1): bottom panel (hand weapon, HP, stamina, special recharge, XP, belt 1-7, message log, buttons), top bar (special skills, companion portraits). Screens: hero card, inventory (backpack grid by pack size, belt, hands, paper doll, ground), statistics and level-up, Johann's diary with quest summaries, map of Annet with travel between visited places, dialogue window, trade window, save/load (10 slots + quick), options, help. Keys follow the original readme (`W D R 1-7 I S N M P F1-F8 Space F11 F12 Esc`, `Ctrl` aim, `Enter` lazy attack); save and load are on `Ctrl+S` and `Ctrl+L`.

## Architecture

- `js/apps/anotherwar/aw-*.js`, namespace `AW`, wrapper `js/apps/anotherwar-app.js` (`appAnotherWar`), page `anotherwar.html` (`window.awui`), css `css/apps/anotherwar.css` (`aw-` prefix). New modules go into both `index.html` and `anotherwar.html`.
- Data from the converter: `content/anotherwar/data/*.json` (levels with objects, polygons, walk maps; templates of people and items; animation index; texts). Hand-written content: dialogues in `js/apps/anotherwar/aw-dlg-town.js`, `aw-dlg-cafe.js`, `aw-dlg-prison.js`, `aw-dlg-graveyard.js`, `aw-dlg-shop.js`, `aw-dlg-forest.js` (32 trees, node/answer structure of the original `.dlg` files); Johann's journal in `aw-notes.js`; item and hotspot text fixes in `aw-texts.js`; level scripts in `aw-scripts.js`.
- The simulation (`aw-core`, `aw-rules`, `aw-items`, `aw-actor`, `aw-walk`, `aw-combat`, `aw-ai`, `aw-script`, `aw-dialog`, `aw-world`) has no DOM and runs in Node for tests; rendering (`aw-gl`), audio and UI talk to it through the world object.
- Rendering: WebGL, one background texture plus a height texture per level. Sprites are depth-tested per pixel against the background: a background pixel with height `v` hides a sprite pixel when `y + v · zscale · 12/255` is below the sprite's feet. The hero behind scenery shows through as a dithered silhouette (original ZTrans option).

## Formats (original)

- `.bgz` `SURFBZv01`: type 1 = 256-colour palette + index plane + height plane; type 3 = RGB565 plane + height plane. Header float = `zscale`.
- `.map`: `u32 w, u32 h`, one byte per 8 × 8 px cell: 0 blocked, 1-9 ground type (footsteps), 100+ obstacle height.
- `.sp8` + `animdata.pck`: palette, then 8 direction blocks (`ANMv01`) of frames `w, h, ox, oy` with zlib-compressed index + depth planes in the pack. Parts `head/torso/legs/weapon` are drawn at `pivot − (ox, oy)`; the pivot is the feet point plus the `.inf` offset (about −42 px).
- `.spx` `SPRv02` with `SURFv01` frames: `r5g6b5` (opaque or additive FX) and `r5g6b5a8` interleaved per pixel.
- Levels are Lua tables (`.cLevel`, `.cHuman`, `.cArea` with polygon point −2 as the stand-here anchor, `.scr` scripts); dialogues are `DlgAddExp`/`DlgAddAnsw` with visibility conditions, answer limits and alternative links A/B.

## Testing

`node tests/anotherwar.test.js`: dialogue integrity (every link, script function, command and journal note resolves), rules against the original templates, a scripted playthrough of the whole of Act I for each class through the simulation API (cell escape, Johann, the truck, the bocce balls, the Resistance papers, Pierre's map, departure), death and continue, save and load, desktop and Steam integration, no comments in sources, no dashes in rewritten texts. Browser check: `node tools/anotherwar-shots.cjs <out dir> <steps.js>` drives headless Edge over CDP (steps: `eval`, `shot`, `sshot` stage shot, `sclick`/`smove`/`sdrag` in stage coordinates, `key`, `text`, `sleep`; helpers `awShots.run(sec)`, `awShots.wait(cond, sec)`, `awShots.info()`).
