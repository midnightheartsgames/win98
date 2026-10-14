# Sam & Max: The Mole, the Mob and the Meatball

Episode 103 of the Freelance Police, told as if it had been released in 2000 with the look and interface of Sam & Max Hit the Road. It runs on the Culture Shock engine (`js/apps/sammax/`) and adds its own rooms, characters and art in `js/apps/sammax103/`. Everything is drawn in code at 320×200 with a 256-colour palette. The dialogue is original writing in Russian. The plot follows the beats and the puzzle chain of Telltale's episode 103 and extends them with new scenes: a card game in the office, five TV segments, a whack-a-rat machine, a working anti-delivery system, a bug that records anybody, and a longer factory finale.

- Distribution: sold in the in-system Steam client (`steam: true` in `js/game-manager.js`, $25.49). The game is not preinstalled.
- After installation: desktop icon **Sam & Max 103**, Start menu → **Sam & Max: The Mole, the Mob and the Meatball**, `C:\Games\SamMax103\SAMMAX3.EXE`, Run: `sammax103`, `sammax3`, `sam & max 103`, `mole mob meatball`, `сэм и макс 103`, `крот мафия и фрикаделька`.
- Standalone page: `sammax103.html` (`window.smx3` is the UI, `smx3.g` the game).
- Test: `npm run test:sammax103` (about 19 800 checks in about 1 second). Episodes 101 and 102 keep their own tests, `npm run test:sammax` and `npm run test:sammax102`.
- Browser tour: `node tools/sammax-shots.cjs <out dir> tools/sammax103-tour.cjs` plays the whole episode in headless Edge, with real mouse clicks in the rat machine and the chase, and saves 49 screenshots. The runner also works for the other two episodes: pass a steps file and the page name.

## Controls

The same as Culture Shock: left click walks or applies the cursor, right click cycles walk → look → use → talk, Sam's box holds the inventory, `.` skips a line, Esc skips a cutscene or opens the menu, F5 saves. Sam and Max are both clickable, so items can be used on them. At the poker table the choices are dialogue icons: bet, fold, ask Max. In the whack-a-rat machine a click shoots the hole under the crosshair. In the mob chase the gun is already selected, the arrow keys change lanes, the other tools sit on the right and the rear-view mirror at the top shows the limousine.

## Design

**Premise.** The Commissioner sent a mole into the Toy Mafia a month ago and has heard nothing for three weeks. The mob runs Ted E. Bear's Mafia-Free Playland and Casino. The mole answers the code phrase «Ковёр подходит к шторам?» with «Ну, знаете ли!» and a slap, so Sam and Max have to ask it of everybody and then join the family to reach the back room.

**Theme.** A cover that fits too well. Everyone here wears one: the mobsters wear bear heads, Bosco wears a beret, Sybil sells herself as a professional witness, Leonard calls a mirror his talent, and the mole has played the Don for so long that he stays the Don. Sam and Max win by faking better than the mob: a fake murder, a fake delivery, a fake death and a toy bear that lies with someone else's voice.

**Tone and point of view.** Dry and absurd. Sam narrates every look and every refusal in the first person, but he never announces his own action: the animation shows it, and his line reacts to what came of it. Max comments, and gives hints only when Sam asks him. Nobody dies; the worst that happens on screen is ketchup.

**Pillars.**

1. The casino is a set of rules the player learns by losing: Indian poker and Leonard's glance, a rat machine that counts only singing rats, a slot machine that praises and never pays, a door that opens to a whispered password.
2. The three assignments from Chuckles (Bosco, Sybil, the sandwich) can be done in any order and converge at the induction.
3. Nothing is lost for good. Lovey hands out a token whenever Sam has none, a lost poker hand teaches the tell, a box thrown out by the anti-delivery system comes back with Max, Sybil empties the ketchup mug and puts it down again, the limousine rams the DeSoto and only pushes the chase on.
4. Continuity with the first two cases. The office closet keeps the evidence: Brady Culture's wig from 101 and the fried Mr. Bear from 102, and Leonard joins them by the end. Sam still wears Bosco's colander under his hat and Max has spent a week in a staring contest with Mr. Bear, which is why the Don's hypnosis fails. Jimmy is a fence now that «Бритые хвосты» have split up, Sybil and Bosco changed jobs and disguises again, and the bear from Myra's studio carries the stamp of Ted E. Bear's factory.
5. Max's hints stay explicit, but only when the player asks for them (in the factory this is a talk with Max). Outside the asked-for option «Макс, есть идеи, что делать дальше?» neither Sam nor Max names the next step: the clue sits in the world, in a slip of another character or in the way an attempt fails.

## Structure

**Shape.** A linear opening in the office, then a hub (office, street, Bosco, Sybil and the casino on the DeSoto map) with two gates in a row: ten million tokens and the password. Behind the second gate the story fans out into three assignments that can be done in any order and folds back at the induction. The chase and the factory are linear again. There are no endings to choose from. Conversations can be played in any order and every dialogue branch is local; the only global state is the set of flags listed in the scene cards. Dialogue choices change what is said, never what is possible, and the game does not present any of them as a moral decision.

**Verbs and rewards.** The player looks, uses and talks, and carries a revolver as an item. The theme sits in the use verb: every solution is a fake staged with props (an ace on a brass nose, a magnet on a camera, ketchup in a coffee mug, caps instead of bullets, a bear with a swapped voice box). The real revolver breaks a mug and drops billboards and is refused on every person, including Max when the Don orders it. The mob rewards the fakes with rank, so the fiction and the rules point the same way. Failing never needs an excuse in the story: a lost hand costs a free token, the arcade wants another token, the limousine rams and falls back, and in the factory the Don only repeats his order.

**Story in the world.** The sign «Без мафии!» hangs over a room full of mobsters. The five TV segments each plant one puzzle line: the jingle, the trial, the sandwich, Leonard's streak. The monitor wall shows that the mob watches the whole cast, including an unknown living room whose carpet matches the drapes. The bug records one private sentence from anyone it is used on. The closet turns into a museum of closed cases.

## Cast

| Character | Role | Voice |
| --- | --- | --- |
| Sam | Freelance Police, undercover as a future mobster | Long, dry, bookish sentences |
| Max | Partner who wants a mob nickname and a ring | Short manic bursts, always about food or explosions |
| The Commissioner | Voice on the phone | Terse orders, budget worries |
| Лапочка (Lovey) | Yellow bear head, greeter, hands out tokens | Cheerful denial that slips and corrects itself: «То есть...» |
| Обнимашка (Cuddly) | Green bear head, the dealer, later the lookout at Bosco's | One word: «Сдаю?» |
| Мишка-охранник | Blue bear head at the back-room door | Flat short sentences, likes to watch things burn |
| Чаклз (Chuckles) | Pink bear head, runs the family for the Don | Quiet, short, polite threats, «семья» in every other line |
| Дон Тед И. Бэр / Гарри Кротман | The Commissioner's mole, now the Don | Pompous, calls them «мальчики», later «пёс» and «кролик» |
| Leonard Steakcharmer | Card sharp and mama's boy | «Приятель», «Мама говорит...» |
| Жан-Франсуа Банд-а-Пар | Bosco as a French anarchist | «Мсье», «мон ами», «Нон!», three French words and the usual paranoia |
| Sybil Pandemik | Professional witness against the Toy Mafia | Twelve mugs of coffee, breathless, counts the days until Friday |
| Jimmy Two-Teeth | Fence in the rat hole | Haggles, calls Sam «начальник» |
| Сержант Жучок | Bosco's organic listening device, a cockroach | Army reports: «Есть, сэр!» |
| Mr. Bear | Evidence from case 102, lives in the closet | Silent, the eyes still turn |

### Character sheets

Each sheet lists what the game shows: the look as drawn, what the character says they want, what they want underneath, where they steer when cornered, and how the episode leaves them. The quoted lines are in the game.

**Гарри Кротман, Дон Тед И. Бэр** (antagonist, the arc goes down: the cover wins).

- Look: a big brown bear head, a purple suit with a rose; underneath a grey mole with a long pink nose and buck teeth. An exoskeleton makes the suit wide.
- Says he wants a family built on trust. Underneath he refuses to be a forty-dollar agent again. He believes he is right and argues it: «Кем я был в полиции? Кротом. Кем я стал здесь? Доном. Сравните сами.»
- Stronger than the heroes in everything except one point: he trusts his own product. He squeezes every bear, so a bear with the wrong voice can tell him anything.
- Under stress he gives orders («Пёс! Пристрели кролика!») and phones Chuckles.
- Ends in the pipe of the reject vacuum. Knows the Commissioner, is watched by Chuckles.

**Чаклз** (the power behind the Don, does not change).

- Look: pink bear head, a small hat, a black pinstripe suit.
- Says he serves the family. Underneath he waits for the Don to fail: the bug hears «Дону Теду нравится быть доном. Пусть нравится. Недолго.»
- Never raises his voice and never explains: «Ковры здесь выбирает Дон. Шторы тоже. Я выбираю, кто выходит отсюда целым.»
- Refuses to call hypnosis by its name: «Это называется маркетинг.»
- Ends free, with plan B and a hint at Washington. He is the link to the next case.

**Leonard Steakcharmer** (obstacle, then thief, then exhibit).

- Look: bald, a thick handlebar moustache, a maroon turtleneck; a playing card on his forehead at the table.
- Says he has talent. Underneath he needs his mother's approval: «Мама говорит, у меня талант.»
- Cornered, he talks about his mother; the one topic he cannot stand is a joke about her, and that is the lever of the interrogation.
- Goes from champion to a man tied with an extension cord to a resident of the closet in Brady's wig. Tried to sell the sandwich to Jimmy.

**Лапочка, Обнимашка, Мишка-охранник** (the family's staff).

- Lovey: yellow head, grey suit. Denies the mafia before anyone asks and gives tokens away. The bug hears that he would like to be Chuckles.
- Cuddly: green head, lilac suit. One word with a question mark. At Bosco's it comes without one, and that counts as the delivery being accepted.
- The guard: blue head, grey suit, arms crossed. Cannot be bribed («Взятки берёт Чаклз. Я беру пароли.») and cannot be outrun («Тогда я очень быстро стою.»).

**Жан-Франсуа Банд-а-Пар** (Bosco; ally under pressure).

- Look: Bosco in a black beret with a thin glued moustache and the badge «Боско» still on his shirt.
- Says he is an anarchist who trades only out of protest. Underneath he is afraid the Toy Mafia will make him sell its bears and wants to be Bosco again (the bug hears it).
- Cornered, he goes to slogans and to the price: «Жетоны мафии? Какая ирония. Анархист берёт. Из протеста.»
- Ends with a bear on his café table, staring back at it.

**Sybil Pandemik** (friend in danger).

- Look: huge eyes, a «Свидетель года» mug in both hands; after the staged murder, a dress covered in ketchup.
- Says she has everything planned. Underneath she is terrified of not reaching Friday: «Я выпила двенадцать кружек кофе, потому что мне страшно! И мне страшно, потому что я выпила двенадцать кружек!»
- She trusts only Sam and Max, which is exactly when they arrive with an order to remove her. Max's answer is «Ой.»
- Ends officially dead for the mob and alive for the trial.

**Jimmy Two-Teeth** (keeper of the ace).

- Look: a pencil behind the ear and a jeweller's loupe on his neck.
- Says his business is honest: «Покупаю краденое, продаю краденое. Налоги плачу краденым.» Wants anything shiny and a bigger hole.
- Ends by offering to buy the card sharp from the closet.

**Сержант Жучок** (tool with a personality).

- A cockroach who reports like a soldier; Bosco sells him as a veteran of three tours: «Есть засада, сэр! Как во Вьетнаме, только с канноли!»
- Refuses to eavesdrop on his own side and shouts at Max when Max wants to eat him.

**Sam and Max** (steadfast; the episode tests them instead of changing them).

- Sam is asked twice to hurt a friend for the cover. He stages it both times and refuses the real thing: «Настоящим? Нет. Даже ради спектакля. Особенно ради спектакля.»
- Max wants a ring, a nickname and the sandwich. He gets the sandwich.

## Scene cards and puzzle chain

Each card gives the state at the start, what changes, the state at the end and the flags. Failed attempts are listed where the scene is built on them.

1. **Office: the call.**
   - Start: Sam keeps losing at cards to Max and does not know why.
   - Change: Max reads Sam's hand in the dark TV screen, the cards fly, the ace of spades slides into Jimmy's hole, and the Commissioner gives the case and the code phrase.
   - End: the case is open and three things are planted: a mirror behind the player, the ace at Jimmy's, the closet with the wig and Mr. Bear. Open question: who is the mole?
   - Flags: `aceInHole`, `cardsOnFloor`, `caseOpen`, `knowCode`, `closetOpen`; five TV segments (`tvSeg`, `tvDone`).
2. **Playland.**
   - Start: two outsiders at a door that says there is no mafia.
   - Change: Lovey hands over a token; the rat machine (`WhackRats`, mode `arcade`) pays a fridge magnet for twenty singing rats in forty-five seconds. Orange rats sing, yellow ones are silent and do not count. Max finds one more token in the ball pit.
   - End: Sam has a way to pay for every game and a magnet with no use yet.
   - Flags: `casinoSeen`, `whackWon`.
3. **Indian poker.**
   - Start: Leonard owns ten million tokens and offers a game for one.
   - First try: play honestly. Leonard bets only when his card is higher and the token is gone, but Sam sees him look past the table before every bet (`pokerLost`, `knowTell`).
   - Second try: look where he looks. The brass nose of Ted E. Bear's bust reflects the table (`noseSeen`), so the fix needs a card that lies, and the ace is in a rat hole.
   - Third try: a token buys the ace from Jimmy (`aceGot`), Max's gum holds it on the nose (`aceOnNose`), and Leonard bets everything on a four.
   - End: ten million tokens (`pokerWon`) and an enemy who promises to win it back «чем-нибудь».
4. **The password.**
   - Start: the back room is behind a guard who wants a password (`guardMet`).
   - First try: guess. Six wrong passwords have their own answers.
   - Second try: win at the slot machine. It shouts «Ты в огне!» and pays nothing, but Chuckles comes out to see the winner and whispers the password on his way back, too quietly (`chucklesWhisper`).
   - Third try: buy ears. Bosco's listening device costs exactly ten million (`knowBug`, `bugBought`). Used on the guard, the bug hides under the buffet (`bugPlaced`); the next game brings Chuckles out again and the bug repeats «Оставь пистолет, возьми канноли» (`passwordKnown`).
   - End: the door opens. The bug keeps working as a toy: it records one line from anyone else (`bugRec`, `BUG_TAPES`).
5. **Back room: the job interview.**
   - Start: Sam and Max are inside and nobody has slapped them yet.
   - Change: Chuckles takes them on trial (`joined`) with two assignments and a gift box; Lovey bursts in with the third: the sandwich is gone and the slot machine has lost its handle (`meatStolen`). Leonard leaves the casino, Cuddly goes to watch Bosco's.
   - End: three assignments, two of them against friends. The monitor wall (`sawCam`) shows how the mob will check: a webcam at Sybil's.
6. **Lean on Bosco.** See Assignments.
7. **Whack Sybil.** See Assignments.
8. **Find the sandwich.** See Assignments.
9. **Induction.**
   - Start: three assignments done, the family gathers, the sandwich lies on the desk.
   - Change: the Don takes off the bear head and is a mole. Sam says the code phrase, gets the answer and the slap, and the mole declines to be rescued.
   - End: the mole is found and lost in the same minute. Max grabs the sandwich and the family gives chase (`inducted`, `maxSandwich`).
10. **Mob chase.** `MobChase extends SamMax.Drive`.
    - Start: a pink limousine in the mirror, bulletproof tyres, tommy guns.
    - Change: billboards span the road. A shot drops a billboard; it lands on the limousine only if the board is right above the DeSoto and the limousine is close. A board shot too early falls in front of the DeSoto and brings the mob closer. The first hit takes the roof off, the second ends the chase.
    - End: the family is in a ditch and the Don is alone in the factory (`chaseWon`).
11. **Factory.** `fac` goes `hypno` → `free` → `panic` → `boom`; the room cannot be saved.
    - Start: the Don has a gun and a hypno bear; the colander and a week of staring contests keep Sam and Max awake, and they play along.
    - First turn: «Пристрели кролика!» The revolver is refused, the cap gun on Max gives a death scene (`maxDead`) and the Don turns to the phone.
    - Second turn: the screwdriver from the bench opens the spare slot machine (`boxOut`); its voice box goes into the hopper (`boxIn`); the robot builds it into a bear, which falls off the belt as a reject (`bearReady`).
    - Third turn: the Don squeezes the bear, believes «Ты в огне!» and runs to the extinguisher he bolted down himself, under the reject vacuum. The lever (`leverDown`) does the rest and the gauge climbs (`pressure`).
    - End: the factory takes the casino with it. Chuckles moves to plan B on a dark street.
12. **Office: epilogue.** The Commissioner asks for the sandwich, which Max has eaten. The closet now holds a wig, a bear and a card sharp, and Jimmy offers to buy the last one.

## Assignments

Chuckles lists what is left on request («Напомните, что нам поручено»), Max's hint follows the furthest open step, and `trialDone` comments after each one. With all three done the back room starts the induction.

| | Lean on Bosco | Whack Sybil | Find the sandwich |
| --- | --- | --- | --- |
| Order | «Поставьте у него мишку. Мишка должен остаться в лавке.» | «Суд не должен её дождаться.» | «Найдите сэндвич до того, как Дон узнает.» |
| Obstacle | ADS-2: a camera sees every delivery, a spring under the café table throws it into the street; Bosco refuses the box while he looks | She never lets go of the mug; the mob watches through a webcam on a cactus | Leonard has it, and a gun |
| Steps | Tell Bosco the mafia is outside (`boscoWatching`, not saved) → magnet on the camera, the system throws out its own camera (`cameraOut`) → box on the table (`boscoDone`) | Take the mug when she puts it down (`mugOnDesk`, `mugTaken`) → ketchup from Bosco's sauce cart → put it back (`mugBack`) → shoot it (`sybilFaked`) → Max eats the webcam (`webcamEaten`, `sybilDone`) | Go to the fence in the office (`leonardHere`) → Max spots the cap gun (`leonardCaught`) → jokes about his mother, four matching pairs out of six (`knowMama`, `leonardTalked`) → handle back on the slot machine (`armBack`) → play (`meatDone`) |
| When it goes wrong | With the camera working the box flies out and Max fetches it; Bosco at the counter just says no | Shooting an empty mug is refused; if Sam waits, Sybil tastes the ketchup and the mug is empty again; leaving before the webcam is gone is stopped by Max | A wrong ending gets a jeer from Leonard and the next try; the real gun is never the answer |
| Who confirms | Cuddly walks in: «Сдаю.» | The mob saw it on the monitor | Chuckles takes the sandwich at the slot machine |

## Subtext of the key conversations

- **The Commissioner's call.** He says the matter is delicate. He wants his mole found and gives as little as he can: no name, and a description («Невысокий. В костюме. Хорошо роет.») that fits half the casino. It pays off when Chuckles uses the same words about the Don.
- **Chuckles' interview.** He says the family is always looking for talent. He is measuring two strangers who learned the password by eavesdropping, and approves of it.
- **Sybil.** She asks for company and coffee. Sam and Max want her mug and cannot say why; «вы с Максом единственные, кому я сейчас доверяю» lands on two men with an order to kill her.
- **The hold-up.** Leonard says he is dangerous. He wants his ten million back and is holding a toy; every answer he gives leads to his mother.
- **The induction.** The Don says the family stands on trust and shows his face. Sam thinks the case is solved; the mole answers the code phrase correctly and stays where the pay is better. Chuckles says one word: «Интересно.»

## Engine and module layout

The episode uses the shared engine through a descriptor, `SamMax.EP103`, the same way as episode 102: its own `ROOMS`, `ITEMS`, `TALK`, `LAYERS`, `ACTOR_HOT`, `GENERIC`, `DEST`, `TITLE`, `CREDITS`, `SAVE_KEY` (`sammax103_saves`), `SET_KEY`, music ids and `newGame`/`startNewGame`/`afterLoad`.

| File (`js/apps/sammax103/`) | Owns |
| --- | --- |
| `mm-story.js` | Episode descriptor, code phrase and password, items, generic answers, Sam and Max hotspots, Max's hints, new game |
| `mm-sprites.js` | Bear masks and the `mobster` costume, the Don (`ted`, masked and unmasked), Leonard, Jean-François (`banda`), Sybil the witness, the roach, the hypno bear, the limousine, playing cards, portraits |
| `mm-icons.js` | Item and dialogue icons, portraits of the new cast |
| `mm-bg.js`, `mm-bg2.js` | Playland and casino (480 px each), back room, factory (480 px) with their layers |
| `mm-closeups.js` | Title card, TV segments, the poker table, the slot machine, the monitor wall, the explosion, title screen, credits |
| `mm-games.js` | Whack-a-rat, token payment, the bug tapes, the count of finished assignments |
| `mm-room-*.js` | Rooms with hotspots, conversations and cutscenes |
| `mm-drive.js` | Map destinations and the mob chase |

Shared engine changes made for this episode: Max has `act: 'dead'`; `g.fx.tint = [r, g, b, alpha]` tints the whole frame (the night street in the epilogue); new music styles (`tango`, `tarantella`, `industrial`), eight themes and nineteen sound effects; pressing the inventory key refreshes the hover label. All three episodes now fade in on their title card, which used to stay black. A sound error no longer stops the picture: `UI.sound()` catches it and reports it once, and the music scheduler moves to the next step before it plays the current one.

## Authoring notes

- State that must not survive a save lives in `g.vt` (spring and flight timers, Bosco at the window, the ketchup countdown). `newGame` creates it empty, so a loaded game starts these from scratch.
- The closet has two hotspots: `closet` (a polygon, while closed) and `closetin` (the door frame, while open). The wig, Mr. Bear and Leonard are smaller hotspots inside; the engine picks the smallest hotspot under the cursor.
- Every suspect answers the code phrase (`id: 'code'` in each conversation) and Sam or Max crosses the suspect off in a different way each time.
- In the factory every hotspot walk point goes through `w(x, y)`, which returns `null` while Sam is frozen by the fake hypnosis.
- Chase lines are drawn at `y: 96`, below the rear-view mirror. Captions over dark scenes use an explicit position at the bottom of the screen.
- In `Audio.playStep` the helper `o(type, note, ...)` takes a MIDI note, not a frequency. The test plays every theme for two full progressions and every effect on a fake AudioContext that rejects values the browser would reject.
- A cutscene that sets `g.hideUI` must clear it on every exit path; a scene staged by hand after `g.killTasks()` has to clear it too.
- The catalog price must differ from every other Steam game; the Steam test rejects equal prices. The store page also needs `genre`, `tags`, two `shots` captions and the two screenshots in `content/steam/`.
- Lines outside the hint option do not instruct. A line with «надо», «нужен», «сначала» or «осталось» that points at the solution is replaced by a reaction which leaves the clue in view: an observation, a wrong idea from Max, a complaint or a slip from another character. Sam does not say «беру», «кладу», «навожу», «нажимаю»; he speaks to somebody or comments on the result. A scan of all string literals for first-person verbs at the start of a sentence and for these marker words, with the hint functions left out, finds most slips.
- Text follows `game-human-style.md`: no em dashes in game text, no «не X, а Y» or «X, а не Y» (the test checks both), distinct voices, no joke repeated across rooms. Words must fit a speech line and use only characters of the pixel font.
