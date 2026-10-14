# Sam & Max: Reality 2.0

Episode 105 of the Freelance Police, told as if it had been released in 2000 with the look and interface of Sam & Max Hit the Road. It runs on the Culture Shock engine (`js/apps/sammax/`) and adds its own rooms, characters and art in `js/apps/sammax105/`. Everything is drawn in code at 320×200 with a 256-colour palette. The dialogue is original writing in Russian. The plot follows the beats and the puzzle chain of Telltale's episode 105 and adds its own staging: a goggles button that switches between two versions of the same street, a control room where a bug breaks the rules of the world, a turn-based battle screen, a firewall that reads licence plates, a bank with turning arrows and a text adventure for the finale.

- Distribution: sold in the in-system Steam client (`steam: true` in `js/game-manager.js`, $28.49). The game is not preinstalled.
- After installation: desktop icon **Sam & Max 105**, Start menu → **Sam & Max: Reality 2.0**, `C:\Games\SamMax105\SAMMAX5.EXE`, Run: `sammax105`, `sammax5`, `sam & max 105`, `reality 2.0`, `сэм и макс 105`, `реальность 2.0`.
- Standalone page: `sammax105.html` (`window.smx5` is the UI, `smx5.g` the game).
- Test: `npm run test:sammax105` (about 68 700 checks in about 2 seconds). Episodes 101 to 104 keep their own tests.
- Browser tour: `node tools/sammax-shots.cjs <out dir> tools/sammax105-tour.cjs` plays the whole episode in headless Edge with real mouse clicks on the title, the dialogue icons, the goggles button, the bank and the text adventure, and saves 74 screenshots.
- Steam screenshots: `node tools/steam-shots.cjs sammax105` (recipe in `tools/steam-shots-recipes.cjs`).

## Controls

The same as Culture Shock: left click walks or applies the cursor, right click cycles walk → look → use → talk, Sam's box holds the inventory, `.` skips a line, Esc skips a cutscene or opens the menu, F5 saves. Sam and Max are both clickable, so items can be used on them.

New in this episode:

- **Goggles button.** Once the goggles work, a button sits in the lower right corner of every room. One click puts the goggles on or takes them off, and Sam stays on the same spot in the other world. The goggles are also an item in the real world and can be used on anything. There is no button on the billboard roof, which has no real counterpart.
- **Battles.** A battle is a conversation on its own screen. The first icon is «Атаковать предметом» or «Защититься предметом», then the inventory appears as icons. «Бежать» always works.
- **Bank.** Click an account to «сварить отчёт»: its money moves along its arrow and the arrow then turns clockwise to the next neighbour. Buttons: ask Max, put everything back, leave. Esc closes the password prompt or leaves.
- **Reality 1.5.** A text adventure played with the mouse or the number keys: pick a verb, then an object, then a second object for «Применить». Esc returns to the verbs.

## Design

**Premise.** Computers all over the country have gone haywire and the people who put on the free goggles will not take them off. The strongest surge comes from Sam and Max's own street, so the two Freelance Police go into Reality 2.0 themselves, learn who keeps its rules, and post Bosco's head cold to the Internet.

**Theme.** A corrected copy of the world against the shabby original. Everyone on the street has a better self in there: Sybil is a level forty paladin, Bosco is an elf nobody robs, Jimmy is a rich rat. Sam and Max are the only ones the program could not improve, so they are the only ones who want to leave.

**Tone and point of view.** Dry and absurd. Sam narrates every look and every refusal in the first person, but he never announces his own action: the animation shows it, and his line reacts to what came of it. Max comments, and gives hints only when Sam asks him. The Internet is a polite hostess who never raises her voice. Nobody is hurt; the worst on screen is a frying pan on Sam's hat.

**Pillars.**

1. Two worlds in one place. Every real room has a twin with the same floor plan, and one click moves between them. Items change with the world: the revolver is a ray gun, the bug is a software bug, the binoculars are a magnifier, the hanky is a computer cold. Coins, swords, slime, the jack-in-the-box and the paint exist only inside.
2. The rules of the world are settings that can be broken. Four programs keep them. The bug in Curt's tube removes depth, in Bob's tube height, in Bluster's tube gravity. Chippy's button turns the pop-ups and the music off. Each broken rule opens one place and closes others: a flat dog slides under a door and cannot drive, a small dog fits a rat hole and cannot climb a step.
3. Genre parodies with their own small rules: coins that hang in the air, a battle where armour +1 ignores everything at +1 and below, a firewall that compares the paint of a car with its plate, a bank puzzle, a text adventure in which anything written in capitals can be picked up.
4. Nothing is lost for good. The slime respawns, the bank has a reset button, a lost battle costs a bump on the head, the firewall only sends the car back, Jimmy reloads the cannon as often as it is touched.
5. Continuity with the four earlier cases. The closet keeps Leonard in Brady's wig, Mr. Bear, the cap gun, the boxing glove and the head of the puppet President; in Reality 2.0 the same shelf is a folder of files. Max is still President and Mr. Bear is his vice-president. Sergeant Bug serves his third case. Hugh Bliss has left his book stand, and his face turns up inside as the Internet Wizard.
6. Max's hints stay explicit and follow the current state, including which world Sam is in, but only when the player asks for them. Outside the asked-for option «Макс, есть идеи, что делать дальше?» neither Sam nor Max names the next step: the clue sits in the world, in a slip of another character or in the way an attempt fails.

## Structure

**Shape.** A linear opening (office, Sybil, Jimmy's cannon, the club at Lefty's, the chip), then a hub of five paired rooms plus the roof. Inside the hub two chains can be done in either order and fold back before the last battle: the coin chain (five coins → wooden sword → slime → +2 sword) and the payment chain (knock Bosco out of the game → read the password → paint the car → bank → the cold). The finale is linear: Auntie Biotic, the mailbox, Reality 1.5, the epilogue. There is one ending. Conversations can be played in any order and every branch is local; the global state is the set of flags in the scene cards. No dialogue choice is presented as a moral decision.

**Verbs and rewards.** The player looks, uses and talks. The theme sits in the goggles button and the bug: the solution to almost every obstacle is to leave the better world for a moment or to make it worse. The game rewards breaking Reality 2.0 (coins, a sword, a path) and gives nothing for enjoying it, which is the same thing the story says. The real revolver and the ray gun are refused on every person. Failing needs no excuse in the fiction: a battle lost inside a game is a lost game, and the world respawns what was beaten.

**Story in the world.** The street tells the case before anyone speaks: no passers-by, a box of free goggles at the office door, recruiting posters pasted over with «2.0. Лучше», Hugh's empty stand. The five TV segments each plant one later scene: the crisis, the goggles, the bank, Auntie Biotic. The answering machine carries Max's presidency from the previous case. Inside, the billboard replaces Sybil's sign, the dead end becomes the control room, and the closet is an archive. The lids of the paint cans carry the letters R, O, Y, G, B, I, V, which is all the episode says about the owner of the locked account.

## Cast

| Character | Role | Voice |
| --- | --- | --- |
| Sam | Freelance Police | Long, dry sentences, reports his own actions |
| Max | Partner and President of the United States | Short manic bursts, decrees, wars on weekdays |
| The Commissioner | Voice on the phone | Terse, tired, his wife's toaster wants a password |
| Агент Суперболл | Secretary to President Max since case 104, a voice on the answering machine | Flat reports: «Рекомендую не отвечать лично» |
| Интернет | Hostess of Reality 2.0, the Director's face on a circuit board | Customer-service calm, never angry, «у меня есть графики» |
| Курт 286 | Portable computer, keeps depth | Says punctuation aloud: «точка», «запятая», «дефис» |
| Боб Белл | Telephone, keeps height | Phone menu: «нажмите один», «оставайтесь на линии» |
| Бластер-Бахвал | Arcade cabinet, keeps gravity | SHORT SHOUTS |
| Чиппи | Pong console, pop-ups and music | «Пип.» Curt refuses to translate most of it |
| Sybil Pandemik | Beta tester, then nobody | Earnest, quotes her mother, counts what she finished |
| Bosco / Эльбоскодрил | Shopkeeper as a half-elf | «Путник», mock archaic, the usual paranoia |
| Jimmy Two-Teeth | Arms dealer with one cannon | Haggles, «начальник», threatens lawsuits |
| Тётушка Биотик | Antivirus with Myra Stump's face | «Голубчики», «милые», threats in a kind voice |
| Интернет-волшебник | Help file with Hugh Bliss's face | Cheerful, sells, denies being Hugh |
| Грозная синяя слизь | Level 1 enemy | «Буль.» |
| Сержант Жучок | Bosco's listening device, a software bug inside | Army reports: «Есть, сэр!» |
| Leonard, Mr. Bear, the puppet head | Evidence in the closet | «Мм!», turning eyes, a stuck jaw |

### Character sheets

Each sheet lists what the game shows: the look as drawn, what the character says they want, what they want underneath, where they steer when cornered, and how the episode leaves them. The quoted lines are in the game.

**Интернет** (antagonist, the arc goes up: she gets back what was taken).

- Look: the head of the TV director from case 102 in headphones, set into a green circuit board with pins; glowing eyes. Sick: green eyes, a red nose. She floats over the scene when she speaks and fills the screens of the control room and of the office TV.
- Says she wants her guests to be happy. «Здесь лучше. У меня есть графики.» Underneath she follows the first rule somebody wrote into her: never name the owner of the account that pays for everything.
- Stronger than the heroes in everything except one point: she opens every letter.
- When pushed she stays polite and points at the exit: «Вы можете уйти в любую минуту. Значок в углу.»
- Ends with her respect for all living things returned, lets everyone go, names Roy G. Biv and sneezes into a reboot.

**К.О.П.С., Клуб Охраны Пожилых Систем** (the builders; they do not change).

- Look: a luggable computer on a crate, a phone on a stool, an arcade cabinet, a wood-panelled console on a folding table. Inside Reality 2.0 each floats in a glass tube of his own colour.
- Say they want to be useful again. «Нас списали. Поставили новые модели. Потом списали новые модели.» They do not see what the Internet does with their world and hand out goggles gladly.
- Speak as a group: Curt reasons, Bob explains, Bluster celebrates, Chippy beeps. Each can be bugged for one private sentence.
- End where they started; the club anthem is sung on request.

**Bosco, Эльбоскодрил Неуловимый** (the arc is a fall and a sale).

- Look: the usual shopkeeper with stuck-on ears, a bow and the goggles; inside a tall green-clad elf with ears to the ceiling. After Sam's sword: a grey bot with a sign behind the counter and an angry Bosco without goggles outside.
- Says he wants forty levels and a cloak. Underneath: three days without a robbery. «Гипноз? На мне? Я сам их надел, путник!» The boxing glove does nothing to him because nobody hypnotized him.
- Sells his own head cold for a billion and keeps his money in the Internet, where even he can hardly find it. The password is tattooed where he cannot read it.
- Cornered, he looks behind himself.
- Ends richer by a billion and poorer by forty-two levels.

**Sybil Pandemik** (freed in the first act, stays out).

- Look: purple dress, goggles, flailing arms; later red rings around the eyes. Inside: an idle avatar with wings and a crown, and an audio diary that still plays.
- Wanted a job she could finish. «Мама говорила, что я ничего не довожу до конца. Я довела до сорокового.»
- Names the club, gives up her burnt goggles and refuses to go near them again.

**Тётушка Биотик** (gatekeeper of the mailbox).

- Look: Myra Stump's face and pink hair, armour with «+1», a cast-iron frying pan.
- Wants clean mail. Strikes first, feels nothing at +1 and below, cannot close a pop-up.
- Ends defeated by a shield of casino advertising and a +2 sword.

**Интернет-волшебник** (help file).

- Look: Hugh Bliss's head under a blue wizard hat over a glowing pedestal at the end of the street.
- Explains the settings, performs one trick and gives the rainbow paint kit. «Все мои любимые цвета, по порядку.»

## Scene cards and puzzle chain

Flags are in `g.f`. `vr` tells which world Sam is in; `bugOn` names the tube the bug sits in.

| Scene | Start state | Change | End state |
| --- | --- | --- | --- |
| Office, intro | Max stamps pardons, TV off | TV turns itself on, the Commissioner calls | `caseOpen` |
| Office, closet | Closed | Opened; glove optional | `closetOpen`, `gloveTaken` |
| Sybil | Flails in goggles | Glove fails at arm's length | `sybilSeen`, `gloveTried` |
| Bosco, Jimmy | Cannon for a million | Touch the cannon, he fires and reloads; grab him while he loads | item `ratcannon`, `cannonTaken` |
| Sybil | Still flailing | Rat cannon knocks the goggles off; she names the club | `sybilFree`, `knowCops` |
| Lefty's | Four old computers | Ask about the crisis, ask to try their reality | `copsNet`, `copsMet`, item `chip` |
| Sybil | Burnt goggles on the couch | Chip into goggles, first entry | `gogglesFixed`, `vr`, goggles button |
| Control room | Four tubes | Bug in Curt's tube | `bugOn = 'curt'`, Sam and Max flat |
| Sybil 2.0 | Closet locked, light under the door | Slide under | `coinCloset` |
| Control room | | Bug moved to Bob | `bugOn = 'bob'`, small |
| Street 2.0 → office | Step too high | Goggles off, walk in, goggles on; into Jimmy's hole | `holeSeen`, `coinHole` |
| Control room | | Bug moved to Bluster; Chippy's button | `bugOn = 'bluster'`, `popOff` |
| Street 2.0 | Coins in the air, box guarded by pop-ups | Jump; take the box | `coinAir`, `jackTaken` |
| Street 2.0, wizard | | «Покажите фокус» | `paintGot`, item `paint` |
| Bosco 2.0 | Elf behind the counter | Five coins for the sword | `elfMet`, `swordBought` |
| Bosco 2.0 | Slime machine | Spawn, fight with the wooden sword | `slimeGot`, item `slime` |
| Roof | +2 sword stuck in the billboard | Slime on the sword | `roofSeen`, `slimeOnSword`, `sword2Got` |
| Bosco 2.0 | | Any sword on the elf | `boscoOut`, bot behind the counter |
| Bosco | Bosco without goggles | «Боско, сзади!», binoculars on the back of his head | `binocTaken`, `passKnown` |
| Street 2.0 | Unpainted DeSoto, plate «СКФ» | Firewall rejects it; paint nose, middle, tail | `fwSeen`, `car = 'скф'` |
| Bank | Bosco's account locked | Password БОСКО, six moves | `bankUnlocked`, `paid` |
| Bosco | | He sneezes into a hanky | `coldGot`, item `hanky` |
| Control room | | Chippy's button again | pop-ups on |
| Street 2.0 | Auntie guards the mailbox | Defend with the box, attack with the +2 sword | `auntieGone` |
| Street 2.0 | | Hanky into the mailbox | `infected`, Reality 1.5 |
| Reality 1.5 | Respect on the ground | Hole, Bosco's store, the lake, the Presence | `netFreed` |
| Epilogue | Street, then office | The Internet names Roy G. Biv; the goggles go onto Mr. Bear | `epilogue`, `exhibit`, credits |

Optional knowledge flags steer only the hints and the dialogue: `knowCold`, `knowBank`, `knowTattoo`, `knowSite`, `knowChip`, `knowArmor`, `knowRules`, `knowPatron`, `knowBiv`, `jimmyMet`, `controlSeen`.

**Bank.** Nine accounts in a 3×3 grid. Casino and Lobbyists hold $500 million each; Roy G. Biv's account at the top swallows whatever reaches it. The shortest solution is six clicks and starts with an empty account, because a click turns the arrow even when there is nothing to send: Бабуля, Казино, Бабуля, Лоббисты, Казна, Бабуля. «Спросить Макса» runs a breadth-first search from the current position and names the next account.

**Reality 1.5.** Take the respect (it falls into a hole), go east, take Bosco's store, go west and north-west, use the store on the lake, go back and down, use the store on the Presence, take the respect, go up, use it on the Internet.

## The two worlds

| Real | Reality 2.0 | What differs |
| --- | --- | --- |
| `office` | `office2` | Closet is an archive of five files, the hole holds a coin, the TV is the hostess |
| `street` | `street2` | Billboard over Sybil's, coins, pop-ups and the box at the control room door, a tree on Hugh's spot, mailbox with Auntie, the wizard at the dead end, DeSoto 2.0 |
| `bosco` | `bosco2` | Elf or bot, slime machine and respawn pad, potions, sword rack |
| `sybil` | `sybil2` | Audio diary, idle avatar, clock, closet with a coin |
| `leftys` | `control` | Tubes, settings screen, tape reels |
| | `roof2` | The billboard with the +2 sword; no real twin |

`E.setWorld` stashes the items of the other world (`E.VITEMS`, `E.RITEMS`) in `g.f.vstash` and `g.f.rstash`. `E.toggle` keeps Sam's position and enters the twin room with `from: 'goggles'`.

## Subtext of the key conversations

- **The club.** They answer a charge of hypnosis with a correction of the term. They are proud of Sybil's forty levels and never ask how she is.
- **Sybil after the cannon.** She thanks Sam with «Наверное». What she lost matters more to her than what she was saved from, and she says so once and changes the subject to rent.
- **Bosco in the goggles.** He sells in both worlds at once and treats the real one as the boring one. The glove line is the only place where the episode says outright that nobody forced him.
- **The Internet.** Every answer is an offer of help. The refusal to name her patron is the one sentence in which she describes herself as something that was written.
- **Auntie Biotic.** She explains her own weakness while boasting about her armour and again when she sees the box.
- **The epilogue.** Bosco asks only whether the billion is real. Sybil goes to repaint her sign. Nobody thanks anyone.

## Engine and module layout

The episode uses the shared engine through a descriptor, `SamMax.EP105`: its own `ROOMS`, `ITEMS`, `TALK`, `LAYERS`, `ACTOR_HOT`, `GENERIC`, `TITLE`, `CREDITS`, `SAVE_KEY` (`sammax105_saves`), `SET_KEY`, music ids and `newGame`/`startNewGame`/`afterLoad`. No file of the shared engine was changed for it.

| File (`js/apps/sammax105/`) | Owns |
| --- | --- |
| `rt-story.js` | Descriptor, music themes, paints and plate, world pairs, `E.net`, `E.body`, `E.applyBody`, `E.setWorld`, `E.toggle`, bug tapes, items, generic answers, Sam and Max hotspots, Max's hints, new game |
| `rt-sprites.js` | Visor, Sybil, Bosco with ears, Jimmy in a helmet, the four club members and their tubes, portraits |
| `rt-sprites2.js` | The Internet, the wizard, Auntie Biotic, the elf and the bot, Sybil's avatar, the slime, the flat and the low-gravity bodies of Sam and Max, pop-up and coin art |
| `rt-icons.js` | Item and dialogue icons, portraits; sword, cannon, goggles and jack-in-the-box art shared with the backgrounds |
| `rt-bg.js` | Street with Lefty's (760 px), Lefty's interior, layers of the real rooms |
| `rt-bg2.js` | Palette swap for Reality 2.0, street 2.0, control room, roof, the net car, layers of the virtual rooms |
| `rt-closeups.js` | Title card, TV segments, battle screen, firewall, net drive, crash, title screen, credits |
| `rt-games.js` | Battle logic, the bank (mode `bank`), Reality 1.5 (mode `text15`) |
| `rt-room-office.js` | Office and office 2.0, intro, the Commissioner, TV, answering machine, closet, `startNewGame` |
| `rt-room-street.js` | Street, street 2.0, roof; wizard and Auntie conversations |
| `rt-room-bosco.js` | Both stores; elf, bot, Bosco and Jimmy conversations; cannon, binoculars, slime |
| `rt-room-sybil.js` | Both offices; the cannon shot, the chip, the first entry |
| `rt-room-leftys.js` | Lefty's and the control room; the club and the Internet conversations; bug in the tubes |
| `rt-net.js` | Goggles button, status line, world install for every room, paint dialogue, drive to the bank, mailing the cold, finale |

Shared art loaded before the episode: `sammax102/sc-sprites.js` (the Director, Hugh and Myra heads), `sammax103/mm-sprites.js` and `mm-icons.js` (Mr. Bear, Leonard, the roach), `sammax104/al-sprites.js` (the puppet head). Music themes are added from `rt-story.js` with `Object.assign(S.THEMES, …)` and use only styles the shared player knows. Icons, costumes and close-ups carry the suffix `5` so that they cannot collide with the other episodes on the desktop page.

## Authoring notes

- The goggles button is one hotspot object (`E.HUD`) pushed to the end of every room's list by `E.install()`. Its polygon is a getter that follows the camera, it has `over: true` and `walkUse: true`, and it is drawn in `drawFront`. The engine picks the smallest hotspot under the cursor, so nothing smaller than the button may lie in the lower right corner of a room; the test clicks the button in every room at both ends of the camera.
- `E.install()` also wraps `setup` and `update` of every room: it hides the floating head of the Internet when she stops talking and calls `E.applyBody`. The engine does not save `costume` or `scale`, so the body comes from `g.f.bugOn` after every load.
- Rooms with `netScreen: [x, y]` show the Internet on a screen. `E.net` then speaks from that point and does not place the floating actor.
- State that must not survive a save lives in `g.vt`: Jimmy's reload window, Bosco's turned back, the spawned slime, the battle, the diary timer. Bosco does not turn back while an action is running, so a click made in time always counts.
- The four club members are one set of actors. `leftys.setup` places them with `v: ''`, `control.setup` with `v: 'vr'` and `act: 'sunk'` for the bugged one.
- Both worlds share `closetOpen`. The real closet has `closet` and `closetin`; inside are the smaller hotspots of the evidence. The virtual closet has five `file*` hotspots, kept small so that the door stays clickable.
- A battle is the conversation `battle5` over the close-up `battle5`. `g.vt.battle` holds the foe and whose turn it is. Every exit goes through `endBattle`, which clears the close-up.
- `Bank` and `Text15` are objects in `g.drive` with their own `pointer`, `click`, `key`, `update` and `render`. Lines spoken there need an explicit position. Neither can be saved. `Text15.use` checks that the first object is in the text inventory.
- The firewall cutscene waits on scene time with `g.until`, so Esc skips it cleanly.
- A cutscene that sets `g.hideUI` must clear it on every exit path. The fuzz part of the test checks that no action leaves the interface hidden, a close-up open, Sam invisible or Max detached.
- The clone is set in 2000: the diary is a «сетевой дневник», money is wired, nobody has a phone in a pocket.
- The catalog price must differ from every other Steam game; the Steam test rejects equal prices. The store page also needs `genre`, three to five `tags`, two `shots` captions and the two screenshots in `content/steam/`.
- Outside the hint option nobody names the next step and Sam does not announce his actions. The rule and the scan that finds slips are described in the authoring notes of `SAM-MAX-103.md`.
- Text follows `game-human-style.md`: no em dashes in game text, no «не X, а Y» or «X, а не Y», no «Это не X. Это Y» (the test checks all three), distinct voices, no joke repeated across rooms. Words must fit a speech line and use only characters of the pixel font. The project names Microslop and Win apply here too.
- The tour pumps frames by hand, which does not advance the audio clock. Its last steps let each theme run on the page's own `requestAnimationFrame` and check `soundFailed`.
