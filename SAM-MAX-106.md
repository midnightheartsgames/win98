# Sam & Max: Bright Side of the Moon

Episode 106 of the Freelance Police and the end of the season, told as if it had been released in 2000 with the look and interface of Sam & Max Hit the Road. It runs on the Culture Shock engine (`js/apps/sammax/`) and adds its own rooms, characters and art in `js/apps/sammax106/`. Everything is drawn in code at 320×200 with a 256-colour palette. The dialogue is original writing in Russian. The plot follows the beats and the puzzle chain of Telltale's episode 106 and adds its own staging: a DeSoto that flies between the street and the Moon, a split-screen phone call, a game of noughts and crosses that has to be lost, an Earth that changes once the beam is on, and a finale built from four stage tricks that repeat until the player breaks the loop.

- Distribution: sold in the in-system Steam client (`steam: true` in `js/game-manager.js`, $29.49). The game is not preinstalled.
- After installation: desktop icon **Sam & Max 106**, Start menu → **Sam & Max: Bright Side of the Moon**, `C:\Games\SamMax106\SAMMAX6.EXE`, Run: `sammax106`, `sammax6`, `sam & max 106`, `bright side of the moon`, `сэм и макс 106`, `светлая сторона луны`.
- Standalone page: `sammax106.html` (`window.smx6` is the UI, `smx6.g` the game).
- Test: `npm run test:sammax106` (about 86 000 checks in about 4 seconds). Episodes 101 to 105 keep their own tests.
- Browser tour: `node tools/sammax-shots.cjs <out dir> tools/sammax106-tour.cjs` plays the whole episode in headless Edge with real mouse clicks on the title, the dialogue icons and the cells of Tic Tac Doom, and saves 86 screenshots.
- Steam screenshots: `node tools/steam-shots.cjs sammax106` (recipe in `tools/steam-shots-recipes.cjs`).

## Controls

The same as Culture Shock: left click walks or applies the cursor, right click cycles walk → look → use → talk, Sam's box holds the inventory, `.` skips a line, Esc skips a cutscene or opens the menu, F5 saves. Sam and Max are both clickable, so items can be used on them.

New in this episode:

- **The DeSoto.** Using the car opens a two-icon conversation: the Moon or the street. There is no road to drive; the flight is a short close-up.
- **Tic Tac Doom.** A board of nine cells on its own screen. A click places a cross, the machine answers with a nought. Buttons: ask Max, new game, leave. Esc leaves. The talisman is the prize for losing.
- **The phone call.** A conversation over a split screen. Each icon is a line Sam whispers to Lincoln. A wrong line ends the call, and the call can be made again at once.
- **The finale.** While Sam sits in one of Hugh's tricks he cannot walk and sees only that trick, Hugh, Max and his own inventory. The game cannot be saved during the fight; the autosave from the vestibule returns to the door.

## Design

**Premise.** A rainbow hangs over the city at night and it comes from the Moon. Sam reads the name Roy G. Biv as the colours of that rainbow, and the two Freelance Police fly to the Sea of Tranquility, where Hugh Bliss keeps a retreat, three talismans and a machine that can make a whole planet feel fine.

**Theme.** Bliss with the grey taken out against a partner with everything left in. Hugh removes what he calls dirt: anger, greed, sloth. What is left of Max smiles, thanks people and is of no use to anyone, himself included. The player spends the second half of the game carrying the dirt back.

**Tone and point of view.** Dry and absurd. Sam narrates every look and every refusal in the first person, but he never announces his own action: the animation shows it, and his line reacts to what came of it. Max comments, and gives hints only when Sam asks him. Hugh never raises his voice; he tells people to breathe. After the split Max speaks slowly and kindly, which is the unsettling part. Nobody is hurt; the worst on screen is a colony of bacteria brought to the boil.

**Pillars.**

1. Every power of Prismatology is used for something crude. Gastrokinesis returns a swallowed display case and a swallowed deed. Lead vision is for peeping through one door. Spoon bending drops a bowling ball, launches a rat and clotheslines a rabbit. The magician's talisman is a way out of the magician's own tricks.
2. The world changes once and everything in it is read again. After the beam the Earth rooms get a tint, a new music theme and new conversations: Bosco and Sybil greet Sam as Hugh Bliss. The same people now say yes to deals they refused an hour earlier, and that is how the third vice is solved.
3. Max in pieces. The husk follows Sam with three coloured dots over his head, one for each missing part. The red one shoots, the green one eats, the blue one lies down. Each returned part gives one dot back and one sentence of the old Max.
4. The whole season is on the Moon. Superball guards the door, Harry Moleman sells souvenirs, Lincoln's head sighs next to a payphone, the old computers run an arcade game, Philo rehearses a hat trick, Sergeant Bug sits on a cushion, and Jimmy meditates on a parking meter back on Earth.
5. Nothing is lost for good. The security frame puts the case back on its stand, the engine fires again whenever the key is turned, a lost call can be dialled again, the machine resets its board, and Hugh's four tricks start over as often as needed.
6. One ending, and the closet is full. The office closet opens on five cases: Leonard in Brady's wig, Mr. Bear in the goggles of Reality 2.0, the head of the puppet President, the cap gun and the boxing glove. The sixth exhibit arrives in the epilogue.
7. Max's hints stay explicit and follow the current state, but only when the player asks for them. In pieces he still gives them, in the husk's voice. Inside the crystal he answers the same question; what he shouts on his own are jokes. Outside the asked-for option «Макс, есть идеи, что делать дальше?» neither Sam nor Max names the next step: the clue sits in the world, in a slip of another character or in the way an attempt fails.

## Structure

**Shape.** Foldback. A linear opening (office, the Commissioner, the flight) leads to a hub on the Moon with three talismans. Two of them are free in order (Lincoln's call, Tic Tac Doom), the third needs the first (the case comes back out of Max by gastrokinesis) and an errand to Earth (the microwave, the coat hanger). All three fold into one door. Behind the door is the bottleneck of the episode: the beam and the split. After it three chains can be done in any order and fold back into a whole Max: the hand on the coaster, the stomach in Bosco's store, the tail by the tower. The finale is a loop of four tricks with a single exit. Conversations can be played in any order and every branch is local; the global state is the set of flags in the scene cards. No dialogue choice is presented as a moral decision.

**Verbs and rewards.** The player looks, uses and talks, and in this episode mostly uses talismans. The theme sits in what the talismans are good for: nothing Hugh meant them for. The game rewards the player for giving Max his vices back; the dot counter over the husk is the only progress display the second act has. The glove of case 101 still cures hypnosis with one punch, and the beam undoes the cure in half a minute, which tells the player to go for the beam. The revolver is refused on every person and accepted on one button. Failing needs no excuse in the fiction: a magician repeats a trick that did not land.

**Story in the world.** The street tells the case before anyone speaks: Lefty's is boarded up with a note «Клуб на Луне», Hugh's stand says «На Луне», a postcard from Superball sticks out of the mailbox. The answering machine carries three loose ends from earlier cases. The gift shop sells the villain's plan as a five-dollar poster and shows an empty dome where the prototype of Brady Culture's hypno goggles used to lie. Bosco keeps a shelf of five inventions, each one a week late for one of the five earlier cases. Sybil's office displays the three things that win the phone call: a plaque, a fox on a cactus and a hockey stick.

## Cast

| Character | Role | Voice |
| --- | --- | --- |
| Sam | Freelance Police | Long, dry sentences, reports his own actions |
| Max | Partner, President, then a husk, then himself | Short manic bursts and decrees; as a husk slow and kind: «Сэм, друг мой» |
| The Commissioner | Voice on the phone | Terse, tired, his deputy has been smiling for three hours |
| Хью Блисс | Founder of Prismatology, Roy G. Biv, a colony of bacteria | Serene short sentences about colours and breathing; colder without the suit |
| Агент Суперболл | Doorman of the Blister | Regulations: «Ответ отрицательный», «Принято», «Служу» |
| Гарри Кротман | Gift shop | Self-important, then self-pitying; «мальчики» |
| Голова Линкольна | Owner of the gastrokinesis talisman | Marble oratory, «сэр», «сударыня» |
| Королева Сибил | Queen of Canada | The royal «мы», dry about her own career |
| Мамаша Боско | Bosco in a grey wig | Falsetto «сынок», the usual paranoia underneath |
| Курт 286, Боб Белл, Бластер-Бахвал, Чиппи | The club, now an arcade act | Punctuation aloud; phone menu; SHOUTS; «Пип» |
| Фило Пенниуорт | Actor turned magician | Theatrical: «юноша», «мальчик мой» |
| Джимми Два Зуба | Orange level on a parking meter | «Начальник», lawsuits |
| Сержант Жучок | On leave, on a cushion | Army reports: «Сэр!» |
| Красный, зелёный и синий Макс | The hand, the stomach, the tail | «ПИФ-ПАФ!», «ЕДА!», «Уйди. Или останься» |
| Leonard, Mr. Bear, the puppet head | Evidence in the closet | «Мм!», turning eyes, a stuck jaw |

### Character sheets

Each sheet lists what the game shows: the look as drawn, what the character says they want, what they want underneath, where they steer when cornered, and how the episode leaves them. The quoted lines are in the game.

**Хью Блисс** (antagonist; the arc is an unmasking).

- Look: the white suit, red hair and rainbow sash of the earlier cases, first on the office TV, then inside a crystal on a console with seven keys. Without the suit: a green shimmer in the shape of Hugh with two lit eyes.
- Says he wants bliss for everyone: «Внутри человек цветной, снаружи серый. Серое я уберу. Останется улыбка.» Underneath he is hungry. The colony feeds on bliss and used to beg for it one person at a time: «Теперь у нас шесть миллиардов кормушек.»
- Stronger than the heroes in everything except heat. He says so himself when the lander burns him.
- Cornered, he tells people to breathe and offers the next trick.
- Ends boiled in his own «Очистительная ванна аннигиляции», then drunk by Max, then in a jar on the closet floor.

**Макс** (steadfast; the episode takes him apart to show what he is made of).

- Look: the usual rabbit until the split. The husk has closed eyes, a small halo and one dot for every missing part. The red part carries a revolver, the green one is wider than it is tall, the blue one lies flat.
- Wants what he always wants, loudly. The husk wants nothing: «Я больше не хочу никого кусать. Даже его. Это и есть счастье, Сэм? Оно какое-то пустое.»
- The husk still helps. Every hint starts with «Сэм, друг мой» and is as exact as before.
- Ends whole, drinks the villain, turns the world into himself for an hour and punches it back.

**Голова Линкольна** (ally with a price; the arc goes up).

- Look: the cream marble head of the statue from case 104 on a cart, with the talisman on a chain.
- Says he is looking for peace. Underneath he wants Sybil to forgive the sentence on his card: «Сударыня, я вижу вас впервые.»
- Cannot dial and has no card, so Sam becomes both.
- Ends with a match on Thursday: «Я стою в воротах. Больше я ничего не умею, и её это устраивает.»

**Королева Сибил** (ally, then a customer).

- Look: crown, red mantle, a hockey stick for a sceptre. Under the beam: folded hands, closed eyes, a halo.
- Says the job is better than dating. Underneath she still waits for the call and will not make it: «Королевы первыми не звонят.»
- Refuses to buy a country from its own President. Under the beam she buys it with everything in the sacks, because Hugh Bliss wants all countries to be one colour.

**Мамаша Боско** (the paranoid who was right again).

- Look: Bosco in a grey wig with a bun, gold glasses and an apron. Under the beam: a halo over the wig.
- Says she is Bosco's mother. Underneath Bosco hides from the rainbow: «А маму никто не тронет.»
- Sells the Earthquake Maker for a hundred trillion and keeps the price when he thinks he is Hugh. The currency stops mattering.

**Гарри Кротман** (gatekeeper who does not know it).

- Look: the mole of case 103 in a teal waistcoat and a bow tie with a badge «Почти красный».
- Wants the red level. Got a till: «Хью сказал, что у меня талант. К торговле.»
- Guards one talisman behind unbreakable glass and explains exactly what breaks it.

**Агент Суперболл**, **К.О.П.С.**, **Фило**, **Джимми**, **Сержант Жучок** keep the voices of their earlier cases. Superball took unpaid leave to guard a door. The club built a machine that has lost four hundred games. Philo needs an animal for his hat. Jimmy wants to sit high enough to be collected, and he is.

## Scene cards and puzzle chain

Flags are in `g.f`. `E.blissed(g)` is `beam && !boiled`, `E.husk(g)` is `maxSplit && !maxWhole`.

| Scene | Start state | Change | End state |
| --- | --- | --- | --- |
| Office, intro | Seven paint lids on the desk | Sam reads Roy G. Biv as a rainbow, the Commissioner calls | `caseOpen` |
| Office | Closet closed, hanger on the TV | Closet opened; hanger and glove taken | `closetOpen`, `hangerTaken`, `gloveTaken` |
| Street | DeSoto at the kerb | Use the car, choose the Moon | `moonSeen` |
| Moon, Superball | Door closed to yellow horns | Spectrum analysis | `uniGot`, item `uni` |
| Gift shop | Talisman in an unbreakable case | Take the case; the frame returns it; give it to Max | `caseTaken`, `caseInMax` |
| Bosco | Microwave for hot dogs | Unicorn in the microwave | `uniRed` |
| Moon, Superball | | Show the red horn | `blisterOpen` |
| Blister, Lincoln | Head on a cart | Ask why he sighs | `abeMet`, `knowLove` |
| Blister, payphone | | Relax, fox, hockey | `gastroGot`, item `gastro` |
| Blister, the club | Machine with no wins | Lose to it | `copsMet`, `leadGot`, item `lead` |
| Moon | Case inside Max | Gastrokinesis on Max | `caseBack` |
| Moon, lander | Locked door, nozzle | Case under the nozzle; hanger in the lock; Max starts the engine | `caseUnder`, `landerOpen`, `keyGot`, `caseBroken` |
| Moon | Talisman in the shards | Pick it up | `spoonGot`, item `spoon` |
| Vestibule | Lead door | Lead vision, then bend the bracket | `vestSeen`, `doorSeen`, `doorOpen` |
| Sanctum | Hugh in the crystal | The beam, the split | `beam`, `maxSplit` |
| Blister | Red Max on the coaster | Bend the spork; shoot the button while he sits in the car | `sporkBent`, `redDone` |
| Street | Jimmy on the bent meter | Spoon bending on the meter | `jimmyFlown` |
| Blister, Philo | Jimmy in the hat | Ask for the hat | `hatGot`, item `hat` |
| Bosco | Green Max eats the shelves | Hat on green Max, twice | `greenFed`, `greenDone` |
| Bosco | Earthquake Maker under glass | Ask the price | `knowQuake` |
| Office, closet | Leonard ate the deed | Gastrokinesis on Leonard | `deedGot`, item `deed` |
| Sybil | Blissful queen | Sell her the United States | `cadGot`, item `cad` |
| Bosco | Blissful Bosco | Pay in Canadian dollars | `remoteGot`, item `remote` |
| Moon | Blue Max by the tower | Press the button next to him; take the tail | `satDown`, `blueDone` |
| Any | Third part returned | | `maxWhole` |
| Sanctum | Hugh in the crystal | Max pulls him out; the four tricks | `g.vt.fight` |
| Sanctum | Hugh in the tank, lander under it | Key into the lander | `boiled` |
| Epilogue | Office | The jar joins the closet | `epilogue`, `exhibit`, credits |

Optional knowledge flags steer only the hints and the dialogue: `knowCase`, `knowDoom`, `tvDone`, `machineDone`. The order of the case and the hanger is free: the engine fires once when Max finds the button and again whenever the key is used.

**The unicorn.** Ten characters have an opinion about it: Max, Superball, Harry, Sybil, Jimmy, Bosco, Lincoln, the club, Philo and Hugh. The tenth opinion earns a fanfare and one line.

**Tic Tac Doom.** The machine fills the first free cell in reading order and skips a cell that would give it three in a row for as long as it has another cell. It wins only when every free cell wins. The shortest way to lose is the four corners. `E.doomSolve` searches the rest of the game from the current board; «Спросить Макса» names the next cell or asks for a new game. A win of the player and a draw reset the board.

**The finale.** `g.vt.fight` holds `trap` (1 to 4), `bound` (Sam sits in the trick), `hughIn` (Hugh does), `lander` (`''`, `'up'`, `'down'`) and `cycle`.

| Trick | Bound | After the swap |
| --- | --- | --- |
| 1. Радужное колесо смерти | Bend the left spoon for the magician's talisman (first time only), use it on Hugh | Hugh rides the wheel; Sam is free |
| 2. Отдели своё блаженство | Use the talisman | Hugh stands in the cabinet; Sam takes the saw |
| 3. Билет в небытие | The lunar lander appears on a wooden support; use the talisman | The engine burns Hugh, he returns through the water and goes straight to trick 4 |
| 4. Очистительная ванна аннигиляции | Use the talisman | Hugh sits in the tank until Sam steps away or asks him out; then the loop starts again |

In any free moment with the lander hanging, the saw on the wooden support drops the lander on its side with the nozzle under the tank. Trick 3 is then cancelled. With Hugh in the tank the key of the lander ends the episode. Talking to Hugh asks for the next trick, so the loop never waits on a timer.

## The Earth before and after the beam

| | Before | After (`E.blissed`) |
| --- | --- | --- |
| Look | Night rainbow in the window | Pink tint on the four Earth rooms, theme `bliss6` |
| Office TV | Three programmes and a rerun | Hugh on every channel; snow once the hanger is gone |
| Bosco | «Мамаша», conversation `bosco` | «Здравствуйте. Я Хью Блисс», conversation `boscoB`, takes Canadian money |
| Sybil | The Queen, conversation `sybil` | The same greeting, conversation `sybilB`, buys the country |
| The glove | Refused on friends | Wakes Bosco or Sybil for half a minute |
| Leonard | «Мм!» | Says the greeting through the tape |

The Moon keeps its colours. The Prismatologists were not hypnotised; they came on their own.

## Subtext of the key conversations

- **The Commissioner.** He reports falling crime as the frightening part and ends with advice nobody will be able to follow: do not let them tell you your colour.
- **Superball.** He denies having said that the horn reacts to warmth. It is the only hint he gives, and he gives it by denying it.
- **Harry.** He explains the one weakness of his display case while boasting about it, and names himself last in every queue.
- **Lincoln and Sybil.** Sam dictated the date in case 104 and dictates the apology now. Lincoln's own sentence comes after the beam: «Народ, которому хорошо по приказу, уже не народ, сэр. Это я сказал сам, без карточки.»
- **Hugh in the crystal.** He answers «why the Earth» with arithmetic and lets slip that the bliss comes back up the beam. «Пью, если угодно. Хотя пить я не пью.»
- **The husk.** He thanks Hugh. Sam cuts the scene short.
- **The epilogue.** The Commissioner orders a rest. Max asks what they do tomorrow. Sam answers with the first image of the season: they wait for the phone.

## Engine and module layout

The episode uses the shared engine through a descriptor, `SamMax.EP106`: its own `ROOMS`, `ITEMS`, `TALK`, `LAYERS`, `ACTOR_HOT`, `GENERIC`, `TITLE`, `CREDITS`, `SAVE_KEY` (`sammax106_saves`), `SET_KEY`, music ids and `newGame`/`startNewGame`/`afterLoad`. No file of the shared engine was changed for it.

| File (`js/apps/sammax106/`) | Owns |
| --- | --- |
| `bm-story.js` | Descriptor, music themes, `E.blissed`, `E.husk`, `E.dress`, the trip conversation and `E.fly`, items, generic answers, Sam and Max hotspots, Max's hints, the unicorn counter, `E.partBack`, new game, `E.install` |
| `bm-sprites.js` | The husk and the three vices, Momma Bosco, Queen Sybil, Lincoln's head, Harry, Superball with a sash, Jimmy in a robe, Hugh and his germ form, portraits |
| `bm-props.js` | Unicorn, lunar lander, satellite, talismans, display case, spork, coaster car, wheel, tank, crystal, Earth, microwave, remote, meter, hat, rainbow, beam |
| `bm-icons.js` | Item and dialogue icons, portrait icons |
| `bm-bg.js` | Street with Lefty's (760 px), layers of the office, the street, Bosco's and Sybil's |
| `bm-bg2.js` | Moon, gift shop, Blister, vestibule, sanctum and their layers; the magician's cabinet |
| `bm-closeups.js` | Title card, flight, TV programmes, the split-screen call, the beam, the world vignettes, title screen, credits |
| `bm-games.js` | Tic Tac Doom (mode `doom`), its machine and solver |
| `bm-room-office.js` | Office, intro, the Commissioner, TV, answering machine, closet, Leonard and the deed, the epilogue, `startNewGame` |
| `bm-room-street.js` | Street, Jimmy and the meter |
| `bm-room-bosco.js` | The store, both conversations, the microwave, the Earthquake Maker, green Max and the hat trick |
| `bm-room-sybil.js` | The chancery, both conversations, the sale of the country |
| `bm-room-moon.js` | Moon and gift shop; Superball, Harry, the case, the lander, blue Max and the satellite |
| `bm-room-blister.js` | Blister and vestibule; Lincoln, the call, the club, Philo, the coaster and red Max, the lead door |
| `bm-room-sanctum.js` | Sanctum; the confrontation, the four tricks, the boiling, the finale |

Shared art loaded before the episode: `sammax102/sc-sprites.js` (Hugh, Philo), `sammax103/mm-sprites.js` (the mole head, Leonard, the roach, Mr. Bear), `sammax104/al-sprites.js` (Superball, Lincoln's head, the puppet head), `sammax105/rt-sprites.js` (the four club members). Music themes are added from `bm-story.js` with `Object.assign(S.THEMES, …)` and use only styles the shared player knows. Icons, costumes, backgrounds and close-ups carry the suffix `6` so that they cannot collide with the other episodes on the desktop page. Speech colours added to `S.COLORS` repeat the values of the earlier episodes.

## Authoring notes

- The engine does not save `costume`, `scale` or `z`. `E.install()` wraps `setup` of every room to call `E.dress`, which derives Max's costume and dots, the halo of Bosco and Sybil and the tint of the Earth rooms from the flags. `E.afterLoad` calls it too.
- State that must not survive a save lives in `g.vt`: the fight, red Max's seat, the microwave and alarm timers, the call stage, the coaster car. Every room recreates what it needs in `setup`.
- Red Max changes seats only while nothing is running, so a shot fired at the right moment always counts. The button has `noWalkItem`, so the revolver works from where Sam stands.
- The fight starts through `begin` from `enter`. If a room is entered without `enter` (a test, a future loader), Hugh stays in the crystal and talking to him starts it.
- While Sam is bound, `g.f.frozen` stops click-walking and every hotspot of the sanctum returns no walk point. Other hotspots are hidden, so no line can describe something Sam cannot reach. The fuzz part of the test checks that a bound dog always holds the magician's talisman.
- Sam on the wheel uses the engine's `upside` pose; the room's `update` flips it and moves the anchor. The cabinet is drawn straight onto the frame with a hole for the face, the tank as a back and a dithered front.
- Tic Tac Doom is an object in `g.drive` with its own `pointer`, `click`, `key`, `update` and `render`. Lines spoken there need an explicit position. It cannot be saved and tolerates being closed from outside.
- Close-ups with a conversation on top (the call) must clear themselves on every exit, including «Повесить трубку».
- `E.maxHint` asks the room first (`room.maxHint`), then the story. After the split the hint prefers the vice of the room Sam stands in.
- The closet interior holds six small hotspots. The open closet is a slightly larger rectangle than the door so that it keeps more than half of its own area.
- The clone is set in 2000: money is a paper bill, the Moon has a payphone, nobody has a phone in a pocket.
- The catalog price must differ from every other Steam game; the Steam test rejects equal prices. The store page also needs `genre`, three to five `tags`, two `shots` captions and the two screenshots in `content/steam/`.
- Outside the hint option nobody names the next step and Sam does not announce his actions. The rule and the scan that finds slips are described in the authoring notes of `SAM-MAX-103.md`.
- Text follows `game-human-style.md`: no em dashes in game text, no «не X, а Y» or «X, а не Y», no «Это не X. Это Y» (the test checks all three), distinct voices, no invented history for characters of earlier cases. Words must fit a speech line and use only characters of the pixel font. The project names Microslop and Win apply here too.
- The tour pumps frames by hand, which does not advance the audio clock. Its last steps let each theme run on the page's own `requestAnimationFrame` and check `soundFailed`.
