# Sam & Max: Abe Lincoln Must Die!

Episode 104 of the Freelance Police, told as if it had been released in 2000 with the look and interface of Sam & Max Hit the Road. It runs on the Culture Shock engine (`js/apps/sammax/`) and adds its own rooms, characters and art in `js/apps/sammax104/`. Everything is drawn in code at 320×200 with a 256-colour palette. The dialogue is original writing in Russian. The plot follows the beats and the puzzle chain of Telltale's episode 104 and extends them: a fourth debate topic, a president's head that becomes closet evidence, answering-machine and TV gags, a bug that calls with recorded voices, a calendar and a budget book you operate by hand, a targeting computer with live beacon cameras, and a chase after a six-metre statue.

- Distribution: sold in the in-system Steam client (`steam: true` in `js/game-manager.js`, $26.49). The game is not preinstalled.
- After installation: desktop icon **Sam & Max 104**, Start menu → **Sam & Max: Abe Lincoln Must Die!**, `C:\Games\SamMax104\SAMMAX4.EXE`, Run: `sammax104`, `sammax4`, `sam & max 104`, `abe lincoln must die`, `сэм и макс 104`, `эйб линкольн должен умереть`.
- Standalone page: `sammax104.html` (`window.smx4` is the UI, `smx4.g` the game).
- Test: `npm run test:sammax104` (about 39 350 checks in about 2.5 seconds). Episodes 101 to 103 keep their own tests.
- Browser tour: `node tools/sammax-shots.cjs <out dir> tools/sammax104-tour.cjs` plays the whole episode in headless Edge with real mouse clicks in the dialogue bar, the calendar, the budget book, the targeting computer and the chase, saves 94 screenshots (14 of them inside the war song), and then lets every new music theme run in real time while it counts drawn frames.

## Controls

The same as Culture Shock: left click walks or applies the cursor, right click cycles walk → look → use → talk, Sam's box holds the inventory, `.` skips a line, Esc skips a cutscene or opens the menu, F5 saves. Sam and Max are both clickable, so items can be used on them.

Three screens take over the picture: the calendar on the easel, the budget book on the president's desk and the targeting computer in the War Room. Click a day, a line or a target; the button in the corner or Esc closes the screen. In the targeting computer the arrow keys also pick a target. In the chase the arrow keys change lanes, the tools sit on the right, and the beacon has its own button above them (key `6`).

## Design

**Premise.** The President has banned pudding, ordered hugs every Thursday and wants every gun in the country on a list. The Commissioner sends Sam and Max to Washington to get him out of office. Behind the desk sits a puppet, behind the puppet stands Chuckles from the Toy Mafia, and when the puppet breaks, Chuckles switches on the Lincoln Memorial and calls an election.

**Theme.** Borrowed words. Nobody in this episode says his own lines. The President signs what he is handed, Lincoln reads whatever card stands on top, Agent Superball obeys whoever is on the service line, Bosco speaks three Russian words in Latin letters, and the Washington Monument is a missile in whitewash. Sam and Max win by putting their own words into other mouths: a prank call, a false translation, a swapped cue card, a phone call cut together from a recorded speech, a ribbon and a date on a calendar.

**Tone and point of view.** Dry and absurd. Sam narrates every look and every refusal in the first person, but he never announces his own action: the animation shows it, and his line reacts to what came of it. Max comments, and gives hints only when Sam asks him. The darkest joke is that the heroes start a war to open a door, so the war is three former child stars arguing over Mount Rushmore, and the only casualty on screen is a statue. The penguins are unharmed.

**Pillars.**

1. Every gate opens when somebody repeats words Sam planted. The player never forces a door.
2. The election has a visible score. The poll board on the lawn is the quest tracker: four blunders and one scandal, in any order.
3. Nothing is lost for good. Cue cards rotate, a wrong card only earns applause, Hugh comes back, Sybil repeats her question, the beacon returns on a rubber band, a kicked car only pushes the chase back, and the hundred million can be moved to another line.
4. Continuity with the first three cases. The office closet keeps the evidence: Leonard, who now wears Brady Culture's wig, the fried Mr. Bear, Leonard's cap gun and Max's boxing glove from the first case. The glove is the tool that ends the first act, and the puppet's head joins the shelf. Chuckles arrives with the plan B he announced at the end of 103, and Congress has received the plush bears. Hugh Bliss has moved from the quiz to the street. Jimmy is on vacation in the White House pond. The Soda Poppers govern three Dakotas.
5. Max's hints stay explicit and follow the furthest open step, but only when the player asks for them. Outside the asked-for option «Макс, есть идеи, что делать дальше?» neither Sam nor Max names the next step: the clue sits in the world, in a slip of another character or in the way an attempt fails.

## Structure

**Shape.** A linear opening in the office, then a hub on the DeSoto map (office, street, Bosco, Sybil, the White House lawn). The story has three acts with a gate at the end of each.

- Act one is linear: Superball at the door, the Oval Office, the interpreter scene, the punch.
- Act two fans out. Five things move the poll (four cue cards and the scandal) and can be done in any order; they fold back at the count.
- Act three fans out again into two chains that can be done in any order, the war and the holiday, and folds back at the War Room door. The beacon, the chase and the launch are linear.

There are no endings to choose from. Conversations can be played in any order and dialogue choices are local: they change what is said, never what is possible. The one choice that leaves a trace is the title Max gives Superball, and the game reads it back once, when Superball announces his holiday. Nothing presents it as a moral decision.

**Verbs and rewards.** The player looks, uses and talks, and carries a revolver as an item. The theme sits in the talk and use verbs: most solutions swap the text that somebody else will read or obey. The revolver is refused on every person and every sign («Стрелять в президента? Я не настолько люблю Джоди Фостер.»). The game rewards planted words with access and with numbers on the poll board, so the fiction and the rules point the same way. Failing never needs an excuse in the story: a harmless card gets applause, a wrong phrase makes Sybil ask again, a holiday Superball does not keep gets a one-line refusal, a missile aimed at Bosco is shot down and proves him right.

**Story in the world.** The TV set in the office follows the plot: the President, then the campaign ads, then President Max. The answering machine holds two presidential messages. The posters by the garage change to «Эйб. 1861» and «Макс». Sybil's sign stays «Даты на заказ» through two professions. The middle screen of the War Room says «Маяк: нет» until the beacon is on Lincoln. The bug records one private sentence from everybody it is used on, and those sentences hold the hints: the puppet's jaw sticks, Whizzer will drink anything without bubbles.

## Cast

| Character | Role | Voice |
| --- | --- | --- |
| Sam | Freelance Police, interpreter, debate host, the president's staff | Long, dry, bookish sentences |
| Max | Partner, candidate, President | Short manic bursts, decrees |
| The Commissioner | Voice on the phone | Terse, tired, his wife cries over the pudding |
| Агент Суперболл | Secret Service agent at the door, later at the War Room | Deadpan procedure: «Ответ отрицательный.» |
| Чаклз | Head of the Secret Service, codename «Папа-Медведь» | Quiet, polite, short threats |
| Президент | A puppet with spiral eyes | Cheerful empty slogans |
| Авраам Линкольн | The Lincoln Memorial, candidate | Solemn oratory read from cards |
| Уиззер, Спекс, Пиперс | Governors of West, South and North Dakota | Whizzer breathless and always about to run out; Specs tidy and vain; Peepers in clipped fragments |
| В. И. Босковорский | Bosco as a simple Russian shopkeeper | «Da», «Nyet», «товарищ», the usual paranoia |
| Sybil Pandemik | Dating service, then carbon dating | Brisk, professional, lonely |
| Hugh Bliss | Prismatology on a crate in the street | Soft, serene, vague |
| Jimmy Two-Teeth | On vacation in the pond, lobbying for cheese | Haggles, calls Sam «начальник» |
| Сержант Жучок | Bosco's bug from case 103, now a voice recorder | Army reports: «Есть, сэр!» |
| Leonard, Mr. Bear | Evidence in the closet | «Мм-мм!» and silence |

### Character sheets

Each sheet lists what the game shows: the look as drawn, what the character says they want, what they want underneath, where they steer when cornered, and how the episode leaves them. The quoted lines are in the game.

**Чаклз** (antagonist; he does not change, his tools do).

- Look: no bear head this time. A pale face, grey hair cut flat, big ears, dark glasses, a brown suit. On the lawn he sits on Lincoln's shoulder, half size.
- Says he stands next to the President and hands him the pen. Underneath he runs the country through a doll and is on his second plan: the bug hears «Ещё три эфира, и страна согласится на всё. Кукла держится хорошо. Лучше прежнего.»
- Cornered about the casino he denies it without effort: «Головы меняются, господин переводчик. Костюм остаётся.»
- His one weakness is a rule he states himself: «Исключение одно. Если посторонний лезет в Военную комнату, я вывожу его сам.» He also watches the voters and never the cue cards.
- Asked who hired him he answers with the next step: «План Б.» He ends in the rubble with «План Б закрыт.» while his earpiece reports a lost contact. He knows Superball, who calls him «Папа-Медведь».

**Агент Суперболл** (threshold guardian, twice).

- Look: very tall and thin, black suit, dark glasses, an earpiece with a wire, hair standing at attention. After the ribbon, a red rosette on the lapel.
- Says nothing about wanting anything. Underneath he wants a rule for every situation: «Указания, полученные по служебной линии, я выполняю.»
- He cannot be ordered away, even by a president: «Приказ принят. Приказ начальника службы старше. Начальник велел стоять.» He can be given a regulation that outranks the order, which is a holiday.
- The name is a codename from his years as a bouncer: «Мяч тоже отскакивает.»
- Ends on the first day off of his life: «Отдыхать не обучен. Инструкцию изучу по дороге.»

**Президент** (a mask).

- Look: a wooden head with a hinged jaw, rosy cheeks, spiral eyes, a navy suit. Without the head: a spring and two wires.
- Says he loves laws: «Страна без законов как пудинг без миски. Растекается.» He wants nothing; he repeats. The bug hears the mechanism: «Челюсть заедает. Чаклз, масло.»
- Takes any translation at face value: «Поэтому вы. Он говорит, вы переводите, я подписываю.»
- Ends as a head on the closet shelf, next to Mr. Bear.

**Авраам Линкольн** (the second mask, six metres of it).

- Look: cream marble, a stovepipe hat, a tricolour sash; eyes that light up when he loses.
- Says what stands on the card. Asked whether he reads his answers: «Я и читаю.» The one answer without a card is about his wife, and that is the answer the scandal breaks.
- Accepts the challenge like a gentleman («Кролик против Линкольна. В духе демократии отвечаю: ну давай.») and loses like a machine: «Народ сделал выбор. Народ ошибся.»
- Ends as rubble on Route 95 with a beacon between the shoulder blades.

**Уиззер, Спекс, Пиперс** (tools in act one, the fuse in act three).

- Look: the Soda Poppers from case 101 with a blue sash and a gold star over the striped shirt.
- Whizzer has given up soda («Я выбрал почки. Они у меня с рождения!») and breaks in one scene. He will drink anything handed to him.
- Specs wants a fifth face on Mount Rushmore, his own; Peepers wants the ticket booth. They are polite about it: «Воевать с братьями? Мы подаём друг на друга в суд. Вежливо.»
- The truth serum makes Whizzer repeat what each brother says about the other. They leave to lead three armies.

**В. И. Босковорский** (Bosco; the paranoid who is right).

- Look: Bosco in a fur hat with a red star and a glued black moustache. One half of the moustache holds better.
- Says he is a distant and very Russian relative. Underneath he believes the government has a missile pointed at the shop: «В русского стрелять побоятся. Выйдет международный скандал.»
- Sells truth serum for a hundred million and takes a state subsidy with horror.
- The War Room proves him right: the first beacon is in his shop. After the interception: «Двадцать лет мне твердили: «Боско, ты параноик». Кто теперь параноик? Все, кроме меня!»

**Sybil Pandemik** (friend, used badly).

- Look: a heart brooch on the purple dress; after the scandal the heart is gone.
- Says she matches couples by fifteen points. Underneath she wants somebody solid for herself: «Мне нужен мужчина постарше. Высокий, солидный, с историей. С хорошей должностью.»
- Falls for a campaign flyer: «Шесть метров мрамора и ни одной вредной привычки. Мама говорила: ищи мужчину твёрдого.»
- After the steps of the White House she keeps the sign and changes the trade: «Мужчины приходят и уходят, а период полураспада постоянен.» The episode repays her with a hundred million and a vacation.

**Hugh Bliss** (a smile on a crate).

- Look: white suit, rainbow sash, a stack of «Эметика» under a rainbow cloth.
- Says he brings people colour: «Внутри каждый человек радуга. Снаружи он обычно бежевый. Я помогаю вывернуться.»
- The bug hears a plan without consent: «Скоро она будет у всех. Их даже не придётся спрашивать.» He refuses the truth serum at once.
- His vanishing trick leaves the sign «Бесплатная доставка на дом!» unguarded for nine seconds.

**Jimmy Two-Teeth** (cameo).

- On an inner tube in the pond with a cocktail. «Ну, заодно хлопочу. Субсидии на сыр. У нас в стенах тоже избиратели, начальник.» A periscope watches him from the water, and the War Room watches through the periscope.

**Sam and Max** (steadfast; Max gets what he asked for).

- Max hears about the gun list and goes quiet for four seconds: «Он хочет переписать пистолеты, Сэм.» Then: «Заводи Де Сото.» He ends as President and appoints Mr. Bear vice-president.
- Sam does the talking for everybody: he translates, hosts the debate and dictates a statue's love life. His verdict closes act two: «Макс. Эйб Линкольн должен умереть.»

## Scene cards and puzzle chain

Each card gives the state at the start, what changes, the state at the end and the flags.

1. **Office: the broadcast.**
   - Start: the bug orders pizza in Sam's voice; the TV turns itself on.
   - Change: three new laws, a call from the Commissioner, Max feeds Leonard and leaves the closet open.
   - End: the case is open. Planted: the bug speaks in other voices, the glove lies on the shelf, the TV and the answering machine carry the President.
   - Flags: `caseOpen`, `closetOpen`, `gloveTaken`, `tvSeg`, `tvDone`, `knowHypno`, `machineHeard`.
2. **Lawn: the door.**
   - Start: Superball blocks the White House.
   - First try: ask. «Ответ отрицательный.» He explains that he leaves the door only for the service phone and obeys what it says (`knowDuty`). The number is on the booth (`knowNumber`).
   - Second try: call the booth from the office. The prank calls get deadpan answers; «Оставайтесь на линии. Ваш звонок очень важен для нас.» keeps him in the booth for good (`superHold`).
   - End: the door is free.
3. **Oval Office: the interpreter.**
   - Start: a President with spiral eyes takes Sam and Max for interpreters; Chuckles stands by (`presMet`). The glove is refused while he watches.
   - Change: touching the War Room door gets the heroes carried out by Chuckles in person (`knowEscort`), and Governor Whizzer arrives (`whizzerIn`).
   - First translation: honest, a revolt, love, baseball. None of it matters. «Он говорит, что умирает от жажды» opens the globe (`globeOpen`, `whizzerSoda`).
   - Second translation: the honest one sends Whizzer to the toilet and back to the globe, a loop. «Он спрашивает, как пройти в Военную комнату» makes Chuckles escort him out (`chucklesOut`).
   - End: the President is alone with two men and a boxing glove.
4. **The punch.**
   - Change: Max hits the President, the head comes off, the President is a puppet (`puppetDown`). Chuckles returns, presses a remote, the Lincoln Memorial stands up, and an emergency election is called. The Commissioner needs a rival with a pulse (`election`). Superball takes the War Room door.
   - End: the head lies on the carpet and can be taken (`headTaken`). Put into the closet it becomes the evidence of case 104 (`headInCloset`); otherwise the epilogue puts it there.
5. **Debate.** See The campaign.
6. **Scandal.** See The campaign.
7. **The count.**
   - Start: Lincoln under forty, Max at thirty-nine.
   - Change: Max wins by the narrowest margin; the candidate «Никто» comes second. Lincoln's eyes light up and he walks north with Chuckles on his hat (`elected`, `rampage`).
   - End: «Макс. Эйб Линкольн должен умереть.» The map gets a third pin, the chase, which is useless without a beacon.
8. **President Max.**
   - Start: Max stands on the chair, three governors dispute Mount Rushmore, Superball reminds everybody that the War Room opens at DEFCON 1 (`knowWar`).
   - End: two open questions, a war and a guard. See President Max.
9. **War Room.**
   - Start: the door opens (`war` and `superGone`).
   - Change: the periscope shows Jimmy in the pond, the manual has three points, the hotline is on hold. The targeting computer lists four beacons; the first one looks at Bosco's counter from behind a stack of cans (`knowBeacon`). Antarctica and Krypton can be fired at, the Kremlin beacon is dead, a missile sent to Bosco is shot down by his dish (`boscoShot`). Every launch replaces the Washington Monument (`knowSilo`).
   - End: the missile needs a beacon on Lincoln.
10. **The beacon.** Behind the sign «Скидка» under the camera in Bosco's shop (`beaconTaken`). While it is in Sam's pocket the first target reads «рядом» and the computer refuses to fire.
11. **Chase.** `LincolnChase extends SamMax.Drive`.
    - Start: Lincoln far ahead on Route 95, kicking cars back along the road.
    - Change: a car that hits the DeSoto throws it back. Inside throwing range Lincoln stops kicking. A click on Lincoln with the beacon selected makes Max throw it; from afar or past the target the beacon comes back.
    - End: the beacon sits between the shoulder blades (`beaconOn`) and the DeSoto returns to the lawn. Without the beacon the gun, the megaphone and the horn get one line each and the house icon leaves.
12. **Launch.** The first target now reads «шоссе 95». Max presses the button, the monument lifts off, Lincoln is rubble (`lincolnDown`), Chuckles closes plan B and his earpiece reports an error.
13. **Office: epilogue.** The head goes on the shelf, Max appoints Mr. Bear vice-president, the Commissioner offers his resignation and Max declines it. President Max addresses the nation on TV.

## The campaign

Lincoln reads the card on top of the stand (`g.f.cards`, index 0). Using the stand moves the top card to the back; using a sign on the stand puts it on top. Every blunder costs Lincoln ten points and gives Max eight or nine; the scandal costs ten more and gives Max nothing. `E.poll` returns the three numbers. Max wins only with four blunders and the scandal, 39 to 30, with 31 for «Никто».

| Question | Card that hurts | Where the card comes from | Flag |
| --- | --- | --- | --- |
| Church and school | «Два зла добра не сделают.» | Already in the stack, second from the top | `hitSchool` |
| Toxic waste | «Бесплатная доставка на дом!» | Hugh Bliss's sign; he lets go of it only while he is invisible (`deliveryTaken`) | `hitWaste` |
| Taxes | «Отдай всё, что есть!» | The army poster by the garage (`posterTaken`) | `hitTax` |
| The hungry | «Не кормить!» | The sign by the pond (`nofeedTaken`) | `hitPoor` |

Any other pair gets its own line from Sam and leaves the numbers alone. The starting card, «Я рад, что мне дали ещё одну жизнь для моей страны.», is applauded on every topic.

The scandal has four steps in any order of preparation: the family-values question (`knowFamily`), the flyer given to Sybil as an application (`sybilSmitten`, `sybilNumber`), the bug on Lincoln to record his statement (`bugRec` is `lincoln`), and the bug on the office phone. Sybil asks four questions and the player answers with recorded sentences: who is calling, is this a date, where, when. A wrong sentence makes her ask again. After the fourth answer the game cuts to the lawn, Sybil arrives during the speech, and Lincoln denies everything (`sybilCalled`, `scandal`).

## President Max

| | The war | The holiday |
| --- | --- | --- |
| Obstacle | The War Room is locked in peacetime and the governors are too polite to fight | Superball keeps the order of a chief who rode away on a statue |
| Steps | Bosco sells truth serum for a hundred million (`knowSerum`) → the budget book funds one historic site at a time → Sybil dates her tiki at two thousand years (`tikiDated`) → the fund goes to Sybil, who leaves on vacation (`sybilFunded`, `sybilGone`) → her carbon dater (`daterTaken`) dates Bosco's weenies to the Cretaceous (`weeniesDated`) → the fund goes to Bosco (`boscoFunded`) → he hands over the serum (`serumGot`) → Whizzer drinks it | The ribbon of an honorary secretary lies on the desk (`ribbonTaken`) → Superball accepts it and Max picks a title (`superSec`, `secTitle`) → the note «Сегодня» on the calendar moves to 26 April (`today`) → «Сегодня праздник. Возьмите выходной.» |
| When it goes wrong | Specs and Peepers refuse the bottle; money for the Alamo or the Statue of Liberty gets a comment and can be moved; the dater on the tiki reads ten years | Every other date has its own refusal; Secretary's Day without the ribbon is answered with «Я агент»; the governors refuse the ribbon |
| Result | Three declarations of war, DEFCON 1, the war song of the Secret Service (`war`, see The war song) | Superball leaves until midnight (`superGone`) |

## The war song

The war song is the musical number of the Secret Service after the three Dakotas declare war. It follows the staging and the music of the song in Telltale's episode 104 shot by shot, drawn with the episode's sprites and played by the engine's synthesizer. It lasts 162 seconds (81 bars at 120 bpm), and Esc skips it.

**Music.** `THEMES.warsong` in `sm-audio.js` is a linear song (`song: WAR_SONG`), not a loop. It was transcribed from the original recording: tempo and bar grid from the drum onsets, the vocal melody from a pitch track of the separated voice, chords from chroma and the bass line. The result was checked against the original by chroma per half bar (mean cosine 0.93) and by the loudness of every bar (correlation 0.83). The song keeps the original's tonal plan: an E7 intro, a verse in A major sung freely over strings, a chorus built on a rising riff from E♯ to C♯, a dance break that walks a circle of fifths through G minor and B♭, a second chorus that turns towards C, a bridge and a finale in C major.

Each part has `bars` and voices written as tokens `NOTE:length` in sixteenths. `r` is a rest, `|` separates bars, and every bar sums to 16. The voices are `lead` (the sung line), `horn` (brass or strings), `bass` and `chords` (symbols from the engine's chord table, also in sixteenths). `pad` sustains the chords, `comp` is a one-bar pattern of chord stabs, `drum` holds one-bar patterns for `k`, `s`, `h`, `c` and `r` (kick, snare, hat, crash, roll), `crash` hits the first step of the part, `voice` picks the timbre of the lead (`croon` for Superball alone, `group` for the agents), and `vol` scales the accompaniment. `songOf(th)` flattens a song into arrays by step and derives `prog`, one chord per bar, so code that expects a progression keeps working. The player schedules sixteenths and stops at the end of the song; `Audio.position()` reports the time since step 0.

**Lyrics.** The words are original Russian writing. They follow the beats of the original number without translating it. The verse notices the klaxon and the red lamp over the steel door and draws one conclusion. The chorus asks what you get out of a war and answers with a medal and a coin, a budget and a factory plan, and Mount Rushmore cut into three, the dispute that started this war. The bridge is about ratings and horses in midstream, and the finale ends with Superball's catchphrase turned around: «Ответ положительный! Война!». `E.WAR_LYRICS` keeps start, end, singer and text. The close-up draws the current line at the bottom of the screen in Superball's or the agents' colour, and `E.warSong` writes every line to the game log.

**Picture.** `E.WAR_SHOTS` lists 50 shots by start time; the times are the cuts of the original. The Oval Office part uses its own sets: the desk and the red chair, the War Room sign and steel door, a bookcase, Washington's portrait, a striped couch, a fireplace with a cymbal monkey, the seal seen from above, the globe and the bronze eagle. The dance break moves to a black stage with giant letters «ВОЙНА», Peepers as Uncle Sam on a poster, a globe dome, a pool seen from the side and from above, the army poster «Отдай всё, что есть!», a star and a waving flag. Superball and his doubles are `S.sprite('superball')` with new poses (`sing`, `chest`, `up`, `wave`, `thumb`, `shout`, `kick`, `squat`, `lie`). Close-ups draw the head with the mouth option `wide` for the long «Война!», and every mouth opens with the notes of the lead. Lights are palette tricks: a red lookup table for the alarm (dithered for the flashes) and spotlights that restore the frame inside a mask after darkening it.

**Clock.** `E.warSong(g)` opens the close-up and the music and advances `cu.clock` by game time. The UI copies `audio.position()` into `g.musicPos` every frame. When that clock moves and is less than 0.6 s behind the scene, the scene jumps to it. The picture follows the music in real play, while a tour that pumps frames faster than real time, or a game without sound, plays the scene on game time.

## Subtext of the key conversations

- **The Commissioner's call.** He says the President has gone too far. He wants deniability («Если вас поймают, я вас не знаю.») and asks them to do without everything they usually do.
- **Superball at the door.** He says no to everything and, asked the right question, explains exactly what would move him. He is not hiding it. Nobody asked before.
- **Chuckles in the Oval Office.** He says he has been in the service since Monday. Sam knows the voice. Neither presses: Chuckles has the room, and Sam has just heard the one rule that gets him out of it.
- **The interpreter.** Whizzer speaks, Sam says what Sam needs, and the President answers Sam. Whizzer asks twice what was said and nobody tells him.
- **The debate.** Sam asks as a host and already knows the answer, because he put it on the stand. Chuckles hisses «Эйб. Читай что написано.» and gets the truth: «Я и читаю.»
- **Sybil and the flyer.** She asks whether he is free. Sam answers with a date of death. Both hear what they want.
- **The bug call.** Four true sentences from a speech, arranged into one lie. Sybil supplies the rest herself.
- **The governors.** They say they are brothers. Each has a sentence about the other two that he will never say aloud, and the bug has already heard it.
- **Superball at the War Room.** Max gives an order and learns that a president ranks below a standing order. A ribbon and a calendar outrank both.

## Engine and module layout

The episode uses the shared engine through a descriptor, `SamMax.EP104`, the same way as episodes 102 and 103: its own `ROOMS`, `ITEMS`, `TALK`, `LAYERS`, `ACTOR_HOT`, `GENERIC`, `DEST`, `TITLE`, `CREDITS`, `SAVE_KEY` (`sammax104_saves`), `SET_KEY`, music ids and `newGame`/`startNewGame`/`afterLoad`.

It reuses art from the earlier episodes instead of copying it. The page and the test load four shared art modules after the engine and before the `al-*` files: `sammax102/sc-sprites.js` and `sc-icons.js` (Hugh Bliss), `sammax103/mm-sprites.js` and `mm-icons.js` (Leonard, the roach, Mr. Bear, the keyhole icon).

| File (`js/apps/sammax104/`) | Owns |
| --- | --- |
| `al-story.js` | Episode descriptor, the phone number, cue cards, holidays, Lincoln's statement, the poll formula, bug tapes, items, generic answers, Sam and Max hotspots, Max's hints, new game |
| `al-sprites.js` | Costumes `superball` (with the poses of the war song), `agentc` (Chuckles), `puppet`, `lincoln`, `boscov`, `sybil4`; heads and portraits in `S.art104` |
| `al-icons.js` | Item and dialogue icons, portraits of the new cast |
| `al-bg.js`, `al-bg2.js` | The lawn (640 px), the Oval Office (480 px), the War Room, and the layers of every room including the closet shelf |
| `al-closeups.js` | Title card, TV programmes, the memorial, launch, impact (Antarctica, Krypton, Bosco, Lincoln), the periscope, title screen, credits |
| `al-warsong.js` | The war song: lyrics, 50 shots on a timeline, their sets, the clock that follows the music, `E.warSong(g)` |
| `al-panels.js` | Calendar, budget book and targeting computer (mode `panel`) |
| `al-room-*.js` | Rooms with hotspots, conversations and cutscenes: office, street, Bosco, Sybil, lawn, Oval Office, War Room |
| `al-drive.js` | Map destinations and the Lincoln chase |

Shared changes made for this episode:

- `sm-ui.js`: Esc is offered to `g.drive.key` in every mode other than `room`, so a panel or an arcade can close itself. After every audio update the UI stores `audio.position()` in `g.musicPos` (null without sound).
- `sm-font.js`: the glyph `→` for the hover label «предмет → цель».
- `sm-sprites.js`: Max has `act: 'punch'` with a red glove. `sm-sprites2.js`: the Soda Poppers have the variant `v: 'gov'`.
- `sm-audio.js`: the music style `march`, nine themes (`title4`, `lawn`, `oval`, `campaign`, `bosco4`, `warroom`, `warsong`, `abechase`, `credits4`) and fourteen effects (`dial`, `busy`, `beep`, `scan`, `boo`, `klaxon`, `missile`, `stomp`, `laser`, `burp`, `fizz`, `fanfare`, `stamp`, `rip`). Later `warsong` became the linear song described in The war song (`songOf`, `Audio.playSong`, `Audio.position`), and the scheduler now skips steps it fell more than 0.25 s behind on instead of playing them in one burst.
- `sammax103/mm-sprites.js` exports `mrBear` in `S.art103`; the 103 office uses it from there.
- `tools/sammax-shots.cjs` recognises `window.smx4`. The `samMaxEpisode` recipe in `tools/steam-shots-recipes.cjs` takes optional flags per shot.

Episode 105 loads `al-sprites.js` as shared art and draws the head on its closet shelf with `S.art104.presHead(P, x, y, { v: 'dead' })`. Keep that signature.

## Authoring notes

- A panel is an object in `g.drive` with `g.mode = 'panel'`. The base class `Panel` handles pointer, click, Esc and closing; a subclass gives `hit(x, y)`, `pick(value)`, `render(f, g)` and, if closing has a consequence, `after()`. The consequences live in the room files as generators (`E.onCalendar`, `E.onBudget`, `E.onFire`). A panel cannot be saved.
- Lines spoken while a panel is open need an explicit position; the targeting computer uses one spot under the camera view.
- The engine saves an actor's place, pose and `follow`, but not `scale` or `z`. Chuckles on Lincoln's shoulder and Max on the president's chair get both in the room's `setup`, which also runs after a load. The Oval Office clears Max's `follow` while he is President and restores it in `leave`.
- The Oval Office is 480 px wide and the camera follows Sam. A cutscene at the far door sets `g.camLock` and must set it back to `null`.
- Card ids are item ids (`poster`, `delivery`, `nofeed`), so a sign placed on the stand is the same string in `g.f.cards`.
- The bug call ends its dialogue before it calls `E.scandal`, which moves the game from the office to the lawn with `setRoom` in the middle of an option.
- The calendar is April with the first on a Monday, so the hug law makes 4, 11, 18 and 25 Thursdays.
- In the chase Lincoln kicks cars only while he is farther away than `CLOSE`; the throw works inside `NEAR`. Both are constants at the top of `al-drive.js`.
- The clone is set in 2000, so the text avoids exact ages and years that would only be right in 2006: Lincoln is faithful «больше полутора веков».
- Dialogue icons in the bug call differ per sentence; seven identical icons were unreadable.
- A war song shot that blits a set with an offset needs a set wide enough to cover the frame. The test renders every shot three times and checks that every pixel is painted.
- The war song takes 162 seconds of game time, about 4 900 frames at 30 fps. Test drivers and tours that wait for it need a larger frame budget.
- A cutscene that sets `g.hideUI` must clear it on every exit path. The fuzz part of the test checks that no action leaves the interface hidden or a close-up open.
- Outside the hint option nobody names the next step and Sam does not announce his actions. The rule and the scan that finds slips are described in the authoring notes of `SAM-MAX-103.md`.
- Text follows `game-human-style.md`: no em dashes in game text, no «не X, а Y» or «X, а не Y» (the test checks both), distinct voices, no joke repeated across rooms. Words must fit a speech line and use only characters of the pixel font. The project names Microslop and Win apply here too.
- The tour pumps frames by hand, which does not advance the audio clock. Its last steps therefore let each new theme run for a second and a half on the page's own `requestAnimationFrame` and check `soundFailed`.
