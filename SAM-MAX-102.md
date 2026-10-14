# Sam & Max: Situation: Comedy

Episode 102 of the Freelance Police, told as if it had been released in 2000 with the look and interface of Sam & Max Hit the Road. It runs on the Culture Shock engine (`js/apps/sammax/`) and adds its own rooms, characters and art in `js/apps/sammax102/`. Everything is drawn in code at 320×200 with a 256-colour palette. The dialogue is original writing in Russian. The plot follows the beats and the puzzle chain of Telltale's episode 102 and extends them with new scenes, retakes, alternative lines and fail-forward branches.

- Distribution: sold in the in-system Steam client (`steam: true` in `js/game-manager.js`, $23.99). The game is not preinstalled.
- After installation: desktop icon **Sam & Max 102**, Start menu → **Sam & Max: Situation: Comedy**, `C:\Games\SamMax102\SAMMAX2.EXE`, Run: `sammax102`, `sammax2`, `sam & max 102`, `situation comedy`, `сэм и макс 102`, `ситуация комедия`.
- Standalone page: `sammax102.html` (`window.smx2` is the UI, `smx2.g` the game).
- Test: `npm run test:sammax102` (about 19 800 checks in about 1.5 seconds). Episode 101 keeps its own test, `npm run test:sammax`.

## Controls

The same as Culture Shock: left click walks or applies the cursor, right click cycles walk → look → use → talk, Sam's box holds the inventory, `.` skips a line, Esc skips a cutscene or opens the menu, F5 saves. Sam himself is clickable in this episode, so items such as the shaving cream or the voice modulator are used on him. In the rat chase the left and right arrow keys (or A and D) change lanes and the tools sit on the right.

## Design

**Premise.** Talk-show queen Myra Stump has kept her studio audience for three days and keeps giving them toasters. Only stars may sit on her couch, so Sam and Max have one afternoon at WARP Studios to get a TV role, a record deal and a scandal.

**Theme.** Fame as a hostage situation. Everybody at WARP is stuck in a role: Philo, a classically trained chicken, plays a petty landlord; the Director runs every show alone; the Soda Poppers judge each other; the audience cannot leave its gifts behind. Sam and Max win by faking every proof of fame.

**Pillars.**

1. Every show is a machine with rules the player learns by watching and asking (takes and the laugh track, blind cooking, impossible questions, biased judges, talk-show manners).
2. The three proofs can be collected in any order and converge at Myra's door.
3. Nothing is lost for good. A spoiled take gets a new take, a lost quiz pays fifty cents, a failed song drops Sam into the acid tank and lets him climb out.
4. Continuity with Culture Shock: Sam still carries the tear gas launcher, the cured Soda Poppers work at WARP, Jimmy has a gang now, Sybil has another job.
5. Max's hints stay explicit.

## Cast

| Character | Role | Voice |
| --- | --- | --- |
| Sam | Freelance Police, typecast as a rabid dog | Long, dry, bookish sentences |
| Max | Partner who wants to be famous by dinner | Short manic bursts |
| Myra Stump | Hypnotised talk-show host | "Мои дорогие", "сладенький", compulsive gifts, commands like «СИДЕТЬ!» |
| The Director | Produces every WARP show alone and is always already in the next room | Clipped production jargon |
| Philo Pennyworth | Chicken actor who plays landlord Mr. Featherly | Theatrical, self-pitying; in character he is petty and nasal |
| Bessy | The sitcom cow | «Му» |
| Hugh Bliss | Quiz host who changes colour and reads minds | Soft, serene, vague |
| Lord Reginald Rumplebottom | Bosco in a bowler hat and a glued moustache | Faux-English courtesy that slides back into paranoia |
| Sybil | Now publisher of «Вестник инопланетных треугольников» | Bills, careers, deadlines |
| Jimmy Two-Teeth | Leader of the rat gang «Бритые хвосты» | Haggles, calls Sam «начальник» |
| Specs, Whizzer, Peepers | Judges and the reigning champion of «Позорный идол» | Specs is an art snob, Whizzer needs the toilet and has a birthday, Peepers speaks in fragments |
| Mr. Bear | Blue plush bear with spiral eyes on Myra's desk | Silent |

## Scene cards and puzzle chain

1. **Office.** Title card, Myra's broadcast on TV, the Commissioner's call (`caseOpen`). The TV then shows four segments that hint at the finale: the three proofs, the bear, a soprano breaking Myra's glass and Myra fainting at a confession about a cow (`tvSeg`, `tvDone`). The VCR plays the sitcom tape once Sam has it.
2. **Bosco's.** Bosco is Lord Rumplebottom. He sells a chemical voice modulator (helium balloon, inhaler, crazy straw) for a million and gives away shaving cream. Taking the cream starts the raid of the «Бритые хвосты»: the rats grab it and leave in their hot rod (`creamStolen`).
3. **Rat chase.** A DeSoto map destination. The rats dodge open manholes on their own. Shooting the side of the hot rod pushes it one lane away and stuns it for a moment, so a well-timed shot drops it into a manhole. The rats throw trash cans; a hit lets them pull away, and they must be close to be shot (`chaseWon`, cream returned).
4. **WARP lobby.** The Director casts «Ковбои из центра»: a rabid dog (shaving cream on Sam, `v: 'foam'`) and a crying rabbit (tear gas launcher on Max, `act: 'cry'`). `auditionOn`, `audRabid`, `audCry`, `hired`. The velvet rope opens the corridor; only the sitcom door works until the episode is shot.
5. **«Ковбои из центра».** «Мотор!» starts a take (`take`, noSave). Featherly enters and notices an undisguised cow after about 45 seconds. A disguise (lampshade, plate or shaving cream) leads to a choice of identity. All six identities work (the Director comments when all six are tried), but only «наш повар» lets Sam serve the cow pie on a plate. Featherly eats, pulls the chef's tail, the cow moos and Sam must translate it as «Му-гу-гай-пань». Max then says the sponsor line about Serious toothpaste (Max used on Featherly, or the Max dialogue). Any wrong step makes the Director shout «Стоп!» and resets the set for a new take. The wrap gives the tape (`vtape`) and staff status (`staff`).
6. **«Готовим не глядя».** Sam hosts blindfolded (`v: 'blind'`): a dish, three ingredients by touch, the oven. Only the cake gives an item; other dishes go to Max.
7. **«Позорный идол».** Peepers sings a song made of questions and leaves the lyrics on the stand. Specs votes for high notes, Whizzer always votes for his brother, has a forgotten birthday and cannot eat tomatoes. A losing contestant drops through the trapdoor into the acid shark tank and climbs back out.
8. **«Кто никогда не станет миллионером».** Hugh asks an impossible question. Losing pays a fifty-cent consolation prize and puts his cards into the podium slot. Swapping them for Peepers' lyrics turns the million-dollar question into «Я синий?», answered by Hugh's current colour. The prize is a million in food stamps. Hugh can turn red, green, blue or normal and pose for the Director's polaroid (`photoColor`).
9. **Sybil.** Her tabloid needs an alien love triangle. A photo with a green Hugh prints the first issue (`paperOut`) into the newspaper box outside Bosco's, where the coin buys it.
10. **Back at Bosco's.** Food stamps buy the modulator. The cake plus the ketchup cart makes the «red frosting» cake.
11. **Idol again.** The ketchup cake is Whizzer's birthday cake; he runs off for time out number two (`whizzerGone`). The modulator on Sam and the microphone give a high first line; Specs votes yes and Sam gets the recording contract.
12. **Myra's door.** The hatch opens to Myra, who takes the tape, the contract and the paper as proof (`proofTape`, `proofContract`, `proofPaper`).
13. **«Майра!».** Sam and Max are stuck on the couch (`frozen`, noSave). Reaching for the bear earns «СИДЕТЬ!». Mentioning the Idol win brings out the band's banjo; the modulator plus the banjo breaks the glass and water spreads to the microphone cable (`wet`). Sam then says someone else was in the scandal photo. Hugh, the Director and Featherly move the microphone the wrong way; Bessy the cow makes Myra faint onto the wet desk. The short circuit fries the bear, the audience leaves with its toasters and Myra wakes up. The office epilogue with the Commissioner and a rerun of the sitcom leads to the credits.

## Engine and module layout

Episode 102 shares the engine with Culture Shock. A game is created with an episode descriptor, `new SamMax.Game({ ep })`; Culture Shock passes nothing and uses the `SamMax` namespace itself. `SamMax.EP102` holds its own `ROOMS`, `ITEMS`, `TALK`, `LAYERS`, `ACTOR_HOT`, `GENERIC`, `DEST`, `TITLE`, `CREDITS`, `SAVE_KEY`, `SET_KEY`, music ids and `newGame`/`startNewGame`/`afterLoad`. `SamMax.UI` takes the same descriptor as `opts.ep`, so saves and settings stay separate (`sammax102_saves`).

| File (`js/apps/sammax102/`) | Owns |
| --- | --- |
| `sc-story.js` | Episode descriptor, items, generic answers, Sam and Max hotspots, Max's hints, new game |
| `sc-sprites.js` | Lord Rumplebottom, bald rats, the hot rod, the Director, Philo, Bessy, Hugh, Myra, the bear, portraits |
| `sc-icons.js` | Item and dialogue icons, polaroid variants by Hugh's colour |
| `sc-bg.js`, `sc-bg2.js` | WARP corridor (560 px), sitcom, cooking, idol, quiz and Myra sets with their layers |
| `sc-closeups.js` | TV segments of «Майра!», the tabloid front page, title card, title screen, credits |
| `sc-room-*.js` | Rooms with hotspots, conversations and cutscenes |
| `sc-drive.js` | Map destinations and the rat chase (`RatChase extends SamMax.Drive`) |

Shared engine changes made for this episode: registries come from `g.ep`; `g.itemIcon()` resolves item icons (an icon may be a function of the game); `room.noSave` may be a function; map destinations carry `room`, `pos` and an optional `start`, and `Drive.render` is split into `renderRoad`, `objects` and tools so subclasses can add objects; Sam has `v: 'foam'` and `v: 'blind'`, Max has `act: 'cry'`, the Poppers have `act: 'sing'`, costumes may define `anim(o)` for animation frames; the palette has three more ramps (`pale`, `orchid`, `pistachio`) for Myra; new music styles (`country`, `quiz`), themes and sound effects. A line replaced by a newer line of the same speaker, or cleared by a room change, now counts as finished, so scripts waiting on it no longer hang.

## Authoring notes

- Every set room places the Director in `setup`; she is always there before Sam.
- Sitcom props go back to the set when a take is cut, wrapped or when Sam leaves the set.
- The Myra room has no walk points: every hotspot and actor uses `walk: null`, and `g.f.frozen` blocks walking.
- Speech colours of new characters are added to `SamMax.COLORS`; the helium voice uses `EP102.squeak()`.
- Myra looks like the original: pale skin, a pink-lavender beehive whose tip curls to one side, pink ball earrings, a pink bead necklace with a heart, a green turtleneck and black trousers. `myraHead` draws her at any scale and switches to single-pixel eyes below 0.6; `myraBust` adds the collar and shoulders for the poster and the office TV; her 24×20 dialogue icon is drawn separately (`myraBadge`), because the beehive does not fit the icon at head scale.
- TV programmes (`CLOSEUPS.tv2`) are drawn into an off-screen buffer and copied inside the screen rectangle, so a close-up may extend past the screen edge; the «МАЙРА!» logo is a separate `logo()` call, drawn after the actors wherever they could reach it.
- Text follows `game-human-style.md`: no em dashes in game text, no «не X, а Y» or «X, а не Y» (the test checks both), distinct voices, no joke repeated across rooms. Words must fit a speech line and use only characters of the pixel font.
