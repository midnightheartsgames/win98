# Sam & Max: Ice Station Santa

Episode 201 of the Freelance Police and the first case of the second season, told as if it had been released in 2000 with the look and interface of Sam & Max Hit the Road. It runs on the Culture Shock engine (`js/apps/sammax/`) and adds its own rooms, characters and art in `js/apps/sammax201/`. Everything is drawn in code at 320×200 with a 256-colour palette. The dialogue is original writing in Russian. The plot follows the beats and the puzzle chain of Telltale's episode 201 and adds its own staging: a giant robot seen through the office window, a gift computer that reads Santa's wish list, a rigged quiz played on its own board, a boxing ring in the robot's chest, a demon song sung line by line from the record, three Christmases behind three portals, and a final battle fought with toys.

- Distribution: sold in the in-system Steam client (`steam: true` in `js/game-manager.js`, $30.49). The game is not preinstalled.
- After installation: desktop icon **Sam & Max 201**, Start menu → **Sam & Max: Ice Station Santa**, `C:\Games\SamMax201\SAMMAX21.EXE`, Run: `sammax201`, `sammax21`, `sam & max 201`, `ice station santa`, `сэм и макс 201`, `полярная станция санта`.
- Standalone page: `sammax201.html` (`window.smx21` is the UI, `smx21.g` the game).
- Test: `npm run test:sammax201` (about 86 000 checks in about 5 seconds: three playthroughs, one with mistakes and save/load reloads, every portal order, fuzz over every hotspot and item in five story states, a finale fuzz, the quiz judge, the ring and the race, style regexes, zero comments, shell needles). Episodes 101 to 106 keep their own tests.
- Browser tour: `node tools/sammax-shots.cjs <out dir> tools/sammax201-tour.cjs` plays the whole episode in headless Edge with real clicks on the title, the dialogue icons and the boards of the quiz, the ring and the race (73 screenshots, then a real-time check of the fifteen music themes).
- Steam screenshots: `node tools/steam-shots.cjs sammax201` (recipe in `tools/steam-shots-recipes.cjs`).

## Controls

The same as Culture Shock: left click walks or applies the cursor, right click cycles walk → look → use → talk, Sam's box holds the inventory, `.` skips a line, Esc skips a cutscene or opens the menu, F5 saves. Sam and Max are both clickable, so items can be used on them.

New in this episode:

- **The DeSoto.** Using the car opens a two-icon conversation: the North Pole or the street. The flight is a short close-up over the snow.
- **The quiz board.** Stinky's quiz has its own screen. Sybil and the Bug answer at once; Sam picks a letter to whisper to Lincoln and a letter for himself, then presses «Отвечаем!». Buttons: ask Max, answer, leave.
- **The ring.** Boxing Betty fights on her own screen. «Удар» and «Блок» are the only moves. Three bouts, the last one against Jimmy. A lost bout starts again at once.
- **The race.** The C.O.P.S. projector turns the garage into a parking lot full of dolls. The car drives itself and turns towards the mouse pointer (arrow keys also steer). Twenty dolls in sixty seconds.
- **The song.** The record sings two lines of every verse and stops; the dialogue icons are the endings Sam can sing. A wrong ending scratches the record, and the song can be started again at once.
- **The finale.** Possessed Santa blocks the workshop. The camera stays on one screen with the cannon, the trampoline, the crate, Santa and the Flounder Pounder; the exits, the record player, the red computer and the stairs are out of reach. The game cannot be saved during the fight; the autosave from outside returns to the start of it.

## Design

**Premise.** A giant robot arrives on the street a week before Christmas as a present for Sam and Max, with orders to destroy them and their office. The label on its foot says it came from Santa's workshop. At the North Pole Santa sits behind his door and shoots at anything that comes near, and the two Freelance Police decide that Santa is possessed.

**Theme.** Every Christmas they are asked to save is one they ruined themselves. The robot was a gift from the workshop. The horsemen they collect are taken from people who needed them. The demon gets out because they sang for it. The spirits will only help once Sam and Max repair three Christmases, and in each one the damage turns out to be their own doing: Jimmy lost his ring to them, the roaches came back to Stinky's because they took the figure that kept them away, and their future selves have waited twenty years for a sleigh that only they can send.

**Tone and point of view.** Dry and absurd. Sam narrates every look and every refusal in the first person, but he never announces his own action: the animation shows it, and his line reacts to what came of it. Max comments, issues decrees as President, and gives hints only when Sam asks him. Santa is a grumpy old man with a gun who turns out to be right. Nobody is hurt on screen; the demon ends as a plate of холодец and Santa as a parcel.

**Pillars.**

1. Presents are the plot. The robot, the horsemen, the footbath, the stopwatch, the snow globe and the parcel to Hell are all gifts. The gift computer in the workshop reads Santa's wish list, and every useful present is somebody's written wish.
2. Each Christmas is broken by Sam and Max and repaired by Sam and Max. The player sees the earlier action and its result: the trivia prize that kept the roaches out, the boxing title that kept Jimmy off the ledge, the sleigh nobody sent.
3. The street was rearranged by the robot. Sybil's office stands where it never stood, a diner appeared between it and Bosco's, Lefty's became the garage of the C.O.P.S., and the robot itself lies across the pavement with a ring in its chest.
4. One loop through time. The glove Jimmy wins his title with is the glove he gives Sam twenty years later; the dog in the hat who gave it to him is Sam. Nobody explains it, and Max asks only once.
5. Nothing is lost for good. The quiz, the ring and the race start over on a click; the song can be sung again; the toy plane in the finale keeps circling until the ball lands.
6. The closet holds every case. Leonard in Brady's wig, Mr. Bear in the goggles of Reality 2.0, the head of the puppet President, the cap gun, Max's glove and the jar with Hugh Bliss. The robot's wind-up key joins them in the epilogue.
7. Max's hints stay explicit and follow the current state, but only when the player asks for them («Макс, есть идеи, что делать дальше?» and the «Спросить Макса» buttons of the boards). Outside the hint neither Sam nor Max names the next step: the clue sits in the world (the wish list, the gift log, the crate, the high-score table), in a slip of another character, or in the way an attempt fails.

## Structure

**Shape.** Foldback. A linear opening (office, robot, window, key) leads to the North Pole, where three things open the workshop: the toys under the tree, the crying intern and Santa's room behind the topiary. The parchment and the gift log turn the street into a hub with four horsemen, free in any order: the quiz at Stinky's, the race at the garage, the ring in the robot and the parcel at Bosco's. They fold into one bottleneck, the ritual by the pole. Behind it the spirits open three portals, again in any order: the future needs coal, the present needs a snowball, the past needs a maze, a television and a trip to the ledge. All three fold into the snow globe, the globe into the demon, the demon into the finale. Conversations can be played in any order and every branch is local; the global state is the set of flags in the scene cards. No dialogue choice is presented as a moral decision.

**Verbs and rewards.** The player looks, uses and talks, and in this episode mostly gives: presents through the dispenser, a doll to the ring, a wife to a husband, a glove to a boxer. The game rewards each gift with a horseman or a spirit, and the four figures around the pole are the progress display of the middle act. The revolver is refused on every person and accepted on a switch and a cannon. Failing needs no excuse in the fiction: a quiz has another round, a doll gets up, a record plays again.

**Story in the world.** The street tells the opening before anyone speaks: the robot's wreck across the pavement, Sybil's sign over the wrong door with «Закрыто. Королева на свидании», a new diner with a glass mermaid, and Lefty's repainted as a garage. The gift log of the workshop lists who received each horseman and the robot. The slimy crate carries a postmark from Lower Manitoba and an invoice naming its contents. The high-score table of the red computer is full of the same three initials. The stocking machine prints its list of the naughty, and Stinky is on it.

## Cast

| Character | Role | Voice |
| --- | --- | --- |
| Сэм | Freelance Police | Long, dry, bookish sentences; never announces his own action |
| Макс | Partner and President | Short manic bursts and decrees |
| Маймтрон 9000 | Giant robot, a present | Speaks in lines from soppy pop songs, in capitals; thinks about love |
| Мистер Лопатка | Goldfish in the water cooler | Silent; bubbles and a stare |
| Флинт Пейпер | Detective next door, heard through a hole | Hard-boiled: «приятель», «пушистики» |
| Джимми Два Зуба | Rat, promoter of the ring | «Начальник», haggling; afraid of heights |
| Стинки | Owner of the diner | Name-drops famous people she has met, mixes up Sam's and Max's names, takes calls between orders |
| Сибил | Between careers, on a date | Dry about her jobs and her date |
| Голова Линкольна | Sybil's date, on a cart | Marble oratory, «сэр», «сударыня»; repeats whatever Sam whispers |
| Сержант Жучок | The Bug, hiding from his family | Army reports: «Сэр!», «салаги» |
| Боско | Owner of the store | Paranoid, prices, inventions |
| Курт 286, Боб Белл, Бластер-Бахвал, Чиппи | The club, now a tuning garage | Punctuation aloud; phone menu; SHOUTS; «Пип» |
| Санта | Shoots through his door | Grumpy, short, swears by reindeer |
| Красный эльф | Supervisor | Deadlines, plans, reports |
| Зелёный эльф | Intern | Chipper, too happy to cry, wants to be a dentist when scared |
| Спекс, Уиззер, Пиперс | The Soda Poppers, waiting for presents | Smug ex-child stars; Specs counts, Whizzer needs the toilet, Peepers whines |
| Шаркающее Корпоративное Присутствие | The demon | Office jargon and «Бла-а-аргх» |
| Духи Рождества | Past, Present, Future | Past is a hippie, Present is Santa's impatient echo, Future only nods |
| Мэри Два Зуба | Jimmy's wife, twenty years ago | «Джеймс!», nagging and loving |
| Молодой Джимми | Boxer twenty years ago | Cocky, boxes in a thimble |
| Тимми | Their baby | Every second word bleeped |
| Будущие Сэм и Макс | Stuck on a rock twenty years ahead | Older, grumpier, still themselves |
| Педро | A young mariachi | Appears whenever somebody says «день рождения» |
| Leonard, Mr. Bear, the puppet head, the jar | Evidence in the closet | «Мм!», turning eyes, a stuck jaw, bubbles |

### Character sheets

Each sheet lists what the game shows: the look as drawn, what the character says they want, what they want underneath, where they steer when cornered, and how the episode leaves them.

**Санта** (red herring turned victim; the arc is a reversal).

- Look: red coat with white trim, a beard to the belt, a submachine gun, small round glasses. Possessed: green eyes, a grin and a slime drip in the beard.
- Says he wants everyone out of his workshop: «Ещё шаг, и Рождество отменяется. Для тебя лично.» Underneath he is guarding the workshop against his own elf: «Три недели я стрелял в эту дверь, чтобы он не вошёл.»
- Cornered, he shoots at the door.
- Ends in a crate addressed to Satan, possessed, after eating the demon he trapped.

**Шаркающее Корпоративное Присутствие** (antagonist; a misdelivered parcel).

- Look: a wobbling blue blob with yellow eyes and a tie.
- Says he wants to optimise misery: «Квартальный план по страданиям горит.» Underneath he wants to be somewhere warm: the crate was meant for Satan.
- Ends as холодец on a plate, then inside Santa, then in the post.

**Джимми Два Зуба** (the arc goes up; the loop lives in him).

- Look: the grey rat of the earlier cases; in the past a younger rat in boxing shorts with a thimble on one paw.
- Says he wants money from the ring. Underneath he never got over the night Mary left: «Двадцать лет назад, в сочельник, Мэри ушла. Сегодня ушёл ринг.»
- Afraid of heights, so the ledge is the worst place he could choose.
- Ends with Mary; his younger self ends with a title belt and money for Timmy.

**Стинки** (gatekeeper and liar who is never caught).

- Look: tall, teal hair, a tiara, a mermaid apron, a receiver at her ear when somebody calls.
- Says she wants the diner to be famous. Underneath she does not want to give away the prize: the rules of her quiz make sure nobody wins it.
- Cornered, she names a famous person she has met.
- Ends with a footbath, a clean diner and no prize.

**Зелёный эльф** (comic relief who flees).

- Look: a small elf in green with a bell on his cap and a watering can.
- Says he loves his job. Underneath he cannot do it: his job is to cry on the trees, and he is too happy.
- Ends in tears, then on the way to dental school, then back for the delivery.

**Сержант Жучок** (ally with a family problem).

- Look: the roach of the earlier cases with a party hat in the present portal.
- Says he wants peace. Underneath he cannot give orders to his mother.
- Ends shouting his family out of the diner in formation, after one yellow snowball.

**Духи Рождества** (gatekeepers with a condition).

- Look: three pale Santas, one with flowers in his beard, one with a pocket watch, one hooded.
- They want the demon sealed, but only after Sam and Max repair what they broke: «Вы ничего не портили. Пока.»

**Сибил**, **Линкольн**, **Боско**, **Флинт**, **К.О.П.С.**, **Сода-Попперы** keep the voices of their earlier appearances. Sybil and Lincoln are on a date at Stinky's. Bosco is back in his own clothes and has a parcel that ticks. The club has turned Lefty's into a tuning garage with a projector.

## Scene cards and puzzle chain

Flags are in `g.f`. Per-visit state (the robot's thought, the plane in the finale, the boards) lives in `g.vt`.

| Scene | Start state | Change | End state |
| --- | --- | --- | --- |
| Office, intro | Mr. Lopatka glares from the cooler | The robot's laser takes the cooler; the robot announces itself | `introDone` |
| Office, hole | A hole in the left wall | Talk to Flint through it | `flintMet` |
| Street, robot | Robot over the office | Ask it why fools fall in love | `robotThinks` (`g.vt`) |
| Office, window | Robot's eye watches the window | Take the wind-up key while it thinks | `keyGot`, `robotDown` |
| Street | Wreck on the pavement | Read the label on the foot | `labelRead` |
| Street, car | | The North Pole | `poleSeen` |
| Workshop | Toys under the tree | Take Betty, the maze, the gift tags | `bettyGot`, `mazeGot`, `tagsGot` |
| Workshop, intern | Too happy to cry | Tell him Santa does not exist | `elfCried`, item `can` |
| Pole | Tiny topiary under the window | Water it with tears | `topiary` |
| Santa's room | Santa shoots at the workshop door | Read the parchment, take the record | `ritualRead`, `recordGot` |
| Workshop, computer | | Read the gift log and the wish list | `logRead`, `wishRead` |
| Inventory | Betty does not move | Wind her with the robot's key | `bettyWound` |
| Street, ring | Jimmy's ring in the wreck | Betty wins three bouts | `warGot`, Jimmy on the ledge |
| Diner, quiz | Stinky's prize on the counter | Win three questions | `pestGot` |
| Garage, race | Death on the workbench | Twenty dolls in sixty seconds | `deathGot` |
| Bosco | A parcel that ticks | X-ray it; send him the stopwatch | `xray`, `giftBosco`, `famineGot` |
| Diner | Stinky complains about her feet | Send her the footbath; take the sock | `knowFeet`, `giftStinky`, `sockGot` |
| Workshop, pole | | Four horsemen around the pole | `pestSet`, `deathSet`, `warSet`, `famineSet` |
| Workshop, record | | Sing the song to the end | `demonOut`, `spirits`, item `globe` |
| Santa's room | The stocking machine | Stinky's sock comes back full of coal | `coalGot` |
| Pole, sleigh | Cold boiler | Coal in the boiler; the sleigh flies into the future | `futureDone` |
| Present portal | Roaches all over the diner | Look; take a yellow snowball; throw it at the Bug | `presentSeen`, `snowGot`, `presentDone` |
| Past portal | Mary and Jimmy argue | The maze on the hole, the television on; Mary is caught | `pastSeen`, `mazeSet`, `maryGot` |
| Office, ledge | Jimmy on the ledge | Give him Mary; he gives the glove | `jimmyHappy`, item `glove` |
| Past portal | Young Jimmy with a thimble | Give him the glove | `pastDone` |
| Pole | Demon by the portals | The globe on the demon; Santa eats the холодец | `jelly`, `santaEvil` |
| Workshop, finale | Santa blocks the door | Plane over the trampoline, cannon, plane over the Flounder Pounder | `santaDown` |
| Workshop | Santa in the crate | Read the label; ship him | `shipped`, ending, credits |
| Epilogue | Office | The key joins the closet | `epilogue`, `exhibit` |

Optional flags steer only the hints and the dialogue: `flintMet`, `giftAbe`, `giftSybil`, `poppersMet`, `machineDone`.

**The quiz.** Three questions, each with four answers. Sybil always gives the right answer and the Bug always says Г. Lincoln repeats the letter Sam whispers. Stinky declares correct the letter nobody named, so nobody can win. When all four letters are taken she has to pick one of them, and she picks the answer that mentions herself. Sam wins a question by covering all four letters and taking the answer about Stinky. One wrong question ends the round; the board can be opened again at once.

**The ring.** The opponent cycles through a guard, a wind-up and a taunt with raised arms. A punch lands only during the taunt or after a blocked wind-up; a wind-up that is not blocked hits Betty. Three hits win a bout, three hits lose it. «Спросить Макса» names the move that works in the current state.

**The race.** Thirty dolls run around the lot and flee from the car. The car always drives forward and turns towards the pointer. Twenty hits in sixty seconds win the horseman of Death; the club asks for a rematch otherwise.

**The song.** Four verses. The right endings are clued in the workshop: the slime on the crate (студень), its postmark (Нижняя Манитоба), the high-score table (Мимосапёр) and the invoice (Шаркающее Корпоративное Присутствие).

**The finale.** The plane circles eight stations on the ceiling and pauses at each; the switch on the wall next to the pole stops or starts it. With the plane stopped over the trampoline the cannon shot lands in its bomb bay. Stopped over the Flounder Pounder, the plane drops the ball, the hammer swings and Santa lands in the crate. The plane moves only while nothing else is running, so a shot fired at the right moment always counts.

## Subtext of the key conversations

- **The robot.** It answers every question with a song line. The one question every song asks and none answers stops it.
- **Flint.** He describes the man who delivered the robot as a postman with a beard and a sack and does not draw the conclusion.
- **Santa.** He shouts at the door, never at Sam. The player learns that he was aiming at the elf only after the song.
- **The intern.** He says he has never cried and asks Sam to try anything. Sam picks the cruellest true sentence he knows.
- **Stinky.** Every boast is an answer to her own quiz.
- **The spirits.** They accuse Sam of things he has not done yet. Future agrees with a nod.
- **Jimmy on the ledge.** He talks about the night Mary left and about the dog in the hat who gave him a glove. Sam does not say who that dog was.
- **The future selves.** They are annoyed, not grateful: they remember being rescued and have been waiting for it for twenty years.

## Engine and module layout

The episode uses the shared engine through a descriptor, `SamMax.EP201`: its own `ROOMS`, `ITEMS`, `TALK`, `LAYERS`, `ACTOR_HOT`, `GENERIC`, `TITLE`, `CREDITS`, `SAVE_KEY` (`sammax201_saves`), `SET_KEY`, music ids and `newGame`/`startNewGame`/`afterLoad`. No file of the shared engine was changed for it.

| File (`js/apps/sammax201/`) | Owns |
| --- | --- |
| `is-story.js` | Descriptor, music themes, the trip conversation and `E.fly`, items, generic answers, Sam and Max hotspots, Max's hints, new game, `E.install` |
| `is-sprites.js` | Santa, the elves, the demon, the spirits, Stinky, Mary, young Jimmy, Timmy, the future pair, Pedro, the roach family, Boxing Betty, rat boxers, portraits |
| `is-props.js` | Robot, wreck, key, horsemen, maze, can, record, sock, snowball, globe, gifts, crate, sleigh, topiary, tree, dispenser, pole, plane, cannon, trampoline, Flounder Pounder |
| `is-icons.js` | Item and dialogue icons, portrait icons |
| `is-bg.js` | Rearranged street (880 px), diner, garage, layers of the office, the street, Bosco's |
| `is-bg2.js` | North Pole, workshop, Santa's room, the office twenty years ago and their layers |
| `is-closeups.js` | Title card, flight, robot shots, the song, the future, the delivery, title screen, credits |
| `is-games.js` | Quiz (mode `quiz21`), ring (mode `box21`), race (mode `race21`), their solvers |
| `is-room-office.js` | Office, intro, robot through the window, Flint, the closet, Jimmy on the ledge, epilogue, `startNewGame` |
| `is-room-street.js` | Street, the robot, the wreck and the ring |
| `is-room-stinky.js` | Diner, the quiz, the footbath, the present portal |
| `is-room-bosco.js` | Bosco's store and the parcels |
| `is-room-garage.js` | Garage of the C.O.P.S. and the race |
| `is-room-pole.js` | North Pole, sleigh, topiary, portals, demon, the future |
| `is-room-workshop.js` | Workshop, elves, gift computer, ritual, song, finale |
| `is-room-santa.js` | Santa's room |
| `is-room-past.js` | The office twenty years ago |

Shared art loaded before the episode: `sammax102/sc-sprites.js`, `sammax103/mm-sprites.js` (Leonard, Mr. Bear, the roach), `sammax104/al-sprites.js` (Lincoln's head, the puppet head), `sammax105/rt-sprites.js` (the club), `sammax106/bm-sprites.js` and `bm-props.js` (Lincoln on his cart, the goggles, stars). Music themes are added from `is-story.js` with `Object.assign(S.THEMES, …)` and use only styles the shared player knows. Icons, costumes, backgrounds and close-ups carry the suffix `21` so that they cannot collide with the other episodes on the desktop page.

## Authoring notes

- The engine does not save `costume`, `scale` or `z`. `E.install()` wraps `setup` of every room to call `E.dress`, which places the actors whose position follows from flags. `E.afterLoad` calls it too.
- Outside the hint option nobody names the next step and Sam does not announce his actions (see the authoring notes of `SAM-MAX-103.md`).
- Text follows `game-human-style.md`: no em dashes in game text, no «не X, а Y» or «X, а не Y», no «Это не X. Это Y» (the test checks all three), distinct voices, no invented history for characters of earlier cases. Words must fit a speech line and use only characters of the pixel font. The project names Microslop and Win apply here too.
- The clone is set in 2000: the C.O.P.S. call their game «дополненная реальность» and show it with a projector; the Soda Poppers count nineteen years without presents, since the last episode of their show.
- Depth: the standing robot and the wreck are layers with base 199, so they cover anybody on the pavement. Sam talks to the robot from its right side, and Jimmy in the ring gets `z = 30` so that he is drawn in front of the wreck.
- The finale uses a walk polygon function (`FIN_WALK`) and locks the camera at x 140. Hotspots that would need a walk outside that polygon are hidden with `when: g => !E.finale(g)`, and the pole sends Sam into the finale at (170, 172).
- The tour helper `T.idle` runs while `g.busy`, so a step that starts the ending must use `perform` and `T.until`, otherwise it plays straight to the credits.
- Text edits went through a pairs file applied by a small script that demands exactly one match and rejects the style regexes before writing; a scan of all strings for the regexes, repeated sentences and three-word repeats ran after every pass.
- The catalog price must differ from every other Steam game. The store page needs `genre`, three to five `tags`, two `shots` captions and the two screenshots in `content/steam/`.
