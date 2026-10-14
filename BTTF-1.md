# Back to the Future: The Game. Episode 1 «Самое время»

A clone of the first episode of Telltale's Back to the Future: The Game (2010), told as if it had been released in 2000 for Win 98. It is a point-and-click adventure at 640×480 in 256 colours, drawn entirely in code: a smart action cursor, a pocket bar, a dialogue panel with the speaker's portrait, subtitles and no voice. The plot, the places and the puzzle chain follow the original; every line is rewritten in Russian under the rules of `game-human-style.md`. It runs on the shared Sam & Max core (`js/apps/sammax/`), generalised for a second game, and keeps its own code in `js/apps/bttf/`.

- Distribution: sold in the in-system Steam client (`steam: true` in `js/game-manager.js`, id `bttf`, $24.79, genre «Квест»). The game is not preinstalled.
- After installation: desktop icon **Back to the Future**, Start menu → **Back to the Future: The Game**, `C:\Games\BTTF\BTTF.EXE` and `README.TXT`, Run: `bttf`, `bttf.exe`, `back to the future`, `назад в будущее`, `самое время`. Task manager shows `bttf.exe`.
- Window: `js/apps/bttf-app.js` (`appBTTF`, 676×548). Standalone page: `bttf.html` (`window.btui` is the UI, `btui.g` the game).
- Test: `npm run test:bttf` (about 50 000 checks in under 3 seconds: three playthroughs, one with mistakes and save/load reloads after every step, a fuzz of every action, hotspot and item at seven checkpoints, the fuel judge, the wagon order, text style and font coverage, zero comments, shell needles). The eight Sam & Max suites stay green.
- Browser tour: `node tools/sammax-shots.cjs <out dir> tools/bttf-tour.cjs` plays the whole episode in headless Edge with real mouse clicks (title, hotspots, pocket slots, dialogue rows, keypad keys, fuel stations), saves through the F5 menu, reaches the credits, checks every music theme in real time, reloads the page and loads the save (36 screenshots).
- Music render: `node tools/bttf-music.cjs` renders the themes through `OfflineAudioContext` in headless Edge.
- Steam screenshots: `node tools/steam-shots.cjs bttf` (recipe in `tools/steam-shots-recipes.cjs`).
- In the system: Clippy greets the game window with two hints and a link to the Interpedia article `bttf` (`http://www.interpedia.org/wiki/bttf`, culture portal), which covers the film trilogy as of December 1999 and announces the game for 2000. The Interpedia year rule allows 2015, the future of the second film.

## Controls

| Input | Action |
| --- | --- |
| Left click | Walk; over a hotspot, do its main action (the cursor shape shows it: hand, mouth, eye, exit arrow) |
| Double click | Run; on an exit, leave at once |
| Right click | Look; with an item in hand, put it back |
| Tab, I, wheel, bottom edge | Pocket bar; the buttons «Думай, Макфлай!» and «Меню» sit at its right end |
| 1–9 | Dialogue option; 1–4 are the stations in the fuel game |
| Space, `.`, click | Skip a line |
| Esc | Skip a cutscene, close a window, drop the held item or open the menu |
| F1 | «Думай, Макфлай!»: goals and hints |
| F5 / F9 | Save / load |
| P | Pause |

The window scales the 640×480 picture in whole steps and shrinks it when the window is smaller. Settings: text speed, music, sounds, control tips in the prologue, the hint button, flashes (full or soft).

Special screens:

- **Time circuits.** A close-up of the three displays with a keypad. The player types the destination date (month, day, year, optional time) by mouse or keyboard; Enter sets it. Marty refuses every wrong date with a line and no penalty.
- **Fuel.** Emmett quarrels with his father while the fuel cooks. The word he leans on is coloured and capitalised in his line and names the station to hit: bellows, valve, bacteria or wheel. From the third round the judge also stresses words; those are decoys. A mistake puts the fire out for two seconds and the round goes on. Twelve hits finish the fuel.
- **The wagon.** Three sides of the moving prison wagon (back, right, left) over a scrolling road, with the driver's window on the left side. No timers.
- **Cutscenes.** Letterboxed shots with coloured subtitles; a click jumps to the next line or shot, Esc skips the whole scene.

## Design

**Premise.** Doc has been missing for six months, the bank is selling his garage, and George runs the sale. That evening the DeLorean comes back on its own, frosted over, with Einstein at the wheel and a tape labelled «МАРТИ!!!». A newspaper of 14 June 1931 in Edna Strickland's archive says that a mob dragged «Карл Саган» out of the jail the night before and killed him. Marty drives to 13 June 1931, where the only help is seventeen-year-old Emmett Brown, whose father the judge has forbidden him science.

**Theme.** The future stays open because Marty does not take the printed page as a verdict and acts himself. The counter-argument has three carriers: the newspaper, which rewrites its headline after the failed jailbreak («ФУРГОН ПЕРЕХВАЧЕН. ПОДОЗРЕВАЕМЫЙ УБИТ!») and still kills Doc; Kid Tannen, who believes the town belongs to whoever it fears; and Judge Brown, heard only from upstairs, who has decided his son will be a lawyer. The ending confirms the premise with a price: Doc is free, and Marty's hand begins to fade. The summons he served on his own grandfather is the cause, though nobody says so in this episode.

**Arcs.**

- Marty is a flat arc: he holds the truth from the start and is tested by people who have given up on Doc, by the paper, by a Doc who can only joke behind bars, and by his lie to Emmett, which he may confess before he gets the drill.
- Young Emmett changes. He hides science from his father («Я юрист. Наука меня совершенно не интересует!»), recognises a colleague in the man who knows the Hamiltonian, lets the temperance society into his father's house, and during the fuel game quits his clerk's job. He forgives Marty's lie and gives him the drill anyway.
- Kid Tannen loses on the theme: his own recorded shout brings Artie out of hiding, fear working against the man who spreads it.

**Echoes.** Edna is the face of the newspaper: in 1931 she writes the news, in 1986 she keeps every issue of the «Хилл-Вэлли телеграф» and lets nobody near them. «Это закон. Проверьте» in 1931 and «Это факт. Проверьте» in 1986. Emmett mutters «Думай, Эмметт, думай!»; the hint window is called «Думай, Макфлай!». Fathers are shown, never discussed: George steps back when Marty asks him to, Artie waits for his boss's permission to leave his flat, the judge shouts down the stairs, Kid pushes Artie around as Biff once pushed George.

**Pillars.**

1. The newspaper is the scoreboard of history. Every important change shows on paper: the date, the headline, the text of the article.
2. One town in two times. House No. 10 on the square stands over a billiard hall and a bakery in 1931 and over the Star Base Zero arcade and the A1 liquor store in 1986; the video shop stands where the bar burned; the courthouse clock runs in 1931.
3. Hints only on request. Outside the «Думай, Макфлай!» window nobody names the next step and Marty does not announce his actions. The clue sits in the world: the paper, a sign, a slip of the tongue, the way an attempt fails.
4. No deaths and no dead ends. A failure ends in a joke and can be repeated at once; the order is free wherever it is free in the original.
5. Recognisable faces. Every character is drawn from the original's references: skin, hair, eyes, clothes, accessories.

**Aesthetics.** Narrative first, then discovery (one town in two eras), then the fantasy of being Marty in the world of the films. The challenge is light: no deaths and no timers apart from the fuel game.

## Structure

**Shape.** A linear prologue and first act (the dream at Twin Pines, the yard sale, the shoe, Edna's papers, the date) lead to 1931. On the square Doc in his cell sends Marty to his younger self; Emmett agrees to finish the drill and opens two independent goals, the alcohol and the subpoena, free in either order. Both fold into the fuel game at the Brown mansion, the fuel into the failed jailbreak, and that into the chase after the prison wagon. Conversations can be played in any order; the global state is the set of flags in the scene cards.

**Verbs.** Look, act (take, press, open, talk, leave), use an item on a place, a person or the dog (Einstein sniffs things too), pick a line including an invented name, type a date, record a voice and play it back. The recorder works four times in the episode, each time differently: Doc's tape, Emmett's muttering carried to the cell, Kid's shout carried to Artie's window, and the tape against the pipe in the soup kitchen.

**Loops.** Moment to moment: hover, read the label, click, get an answer; every place can be looked at and every wrong item has a reaction. Session: a chapter with one to three goals in the hint window, closed by a reward cutscene and a date card. Episode: history changes on screen; the headline rewrites itself and the hand shows the cost.

**Chapters.**

| No. | Chapter | Card | Places |
| --- | --- | --- | --- |
| 0 | Prologue | 26 октября 1985, 1:20 ночи | Twin Pines Mall (dream) |
| 1 | The sale | 14 мая 1986 | Bedroom (cutscene), Doc's lab, back room |
| 2 | The shoe | 14 мая 1986, 18:04 | Yard, DeLorean, street by Edna's house, Edna's flat |
| 3 | 88 mph | 14 мая 1986, 19:27 | Yard, DeLorean, highway and billboard (cutscenes) |
| 4 | Карл Саган | 13 июня 1931, 4:00 | Courthouse square, soup kitchen, cell window |
| 5 | Soup and summons | 13 июня 1931, day | Square, soup kitchen, Artie's street, bandstand roof |
| 6 | Fuel | 13 июня 1931, evening | Emmett's workshop in the Brown mansion |
| 7 | The escape | 13 июня 1931, night | Square at night, the prison wagon |

## Places

| id | Place | Era | Width | Notes |
| --- | --- | --- | --- | --- |
| `mall` | Twin Pines Mall | 1985, dream | 960 | Doc in the white radiation suit, the DeLorean, Doc's van with the orange toolbox, Marty's camcorder; storm variant with the sign flickering to «Одинокая сосна» |
| `lab` | Doc's lab | 1986 | 1120 | Clocks, the sale table and George, the CRM-114 speaker and amp, the jukebox with «Back in Time», the TV with «Космос», Biff in the mind-reading helmet |
| `labback` | Back room | 1986 | 640 | The 1955 square model with the courthouse roof |
| `yard` | Yard by the garage | 1986, day and evening | 800 | DeLorean, Einstein, «Мистер Фьюжн», George in chapter 3 |
| `car` | DeLorean interior | — | 640 | Recorder, shoe, circuits switch, keypad, flux capacitor |
| `street86` | Edge of the square by No. 10 | 1986 | 960 | Star Base Zero, A1 liquor, «Э. СТРИКЛЕНД» buzzer, Edna's bay window with the megaphone |
| `edna86` | Edna's flat | 1986 | 800 | Binoculars, radiator valve, the papers on the sofa, photos, cat-show trophies, typewriter, tin with «1984» |
| `square` | Courthouse square | 1931, day and night | 1600 | The panorama of buildings in the original's order, the park with the bandstand in front, Kid's shoeshine chair, the cell window |
| `kitchen` | Sisters of Mercy soup kitchen | 1931 | 800 | Counter as a layer (Cue Ball stands behind it), red pipe, lift, barrel rack, charity table, phone |
| `arthur` | Street at No. 10 | 1931 | 640 | Same facade as `street86` over the billiard hall and the bakery; Artie's bay window, the door buzzer |
| `bandstand` | Bandstand roof | 1931 | 640 | Shingle cone from above, Kid and Matches below |
| `brownlab` | Emmett's workshop | 1931, evening | 640 | Fuel machine, bellows, gas bladder, bacteria tank, generator wheel, the drill |
| `wagonb`, `wagonr`, `wagonl` | The prison wagon | 1931, night | 640 each | Body layer over a scrolling road; back doors with Doc's window, the tool box and antenna on the right, the spare wheel and the driver's window on the left |

## Cast

| Character | Role | Voice |
| --- | --- | --- |
| Марти | Hero | Short, teenage, eighties slang; never announces his own action |
| Док | Mentor in a cell | «Великий Скотт!», exact numbers, slips into lectures |
| Эйнштейн | Doc's dog, tracker | Barks and whines |
| Джордж | Father, runs the sale | Soft and steady |
| Бифф | Bully at the sale | Coarse, mangles words: «потоковый катетер», «Чак Дурья Башка» |
| Эдна, 1986 | Keeper of the papers | Shouts through a megaphone, calls everyone a hooligan; «Это факт. Проверьте» |
| Эдна, 1931 | Reporter, founder of the temperance society | Pushy and proper; «Это закон. Проверьте»; afraid of dogs |
| Эмметт | Judge's clerk, secret inventor | Nervous, fast, mutters formulas; «Эврика!», «Во имя Томаса Алвы Эдисона!» |
| Кид Таннен | Gangster, owner of the burned bar | Bravado and threats, mixes up clever words; Matches corrects him |
| Арти | Marty's grandfather, Kid's bookkeeper, witness | Timid |
| Биток | Cook and Kid's man in the soup kitchen | Proud of his soup |
| Спичка | Kid's driver and shoeshine man | Sly, short sentences |
| Офицер Паркер | Policeman | Arrival cutscene only, no lines |
| Лоррейн, судья Браун, Хэмптон | Mother, Emmett's father, the butler | Off screen only |

### Character sheets

Each sheet lists the look as drawn, what the character says they want, what they want underneath, and how the episode leaves them.

**Док** (mentor in trouble).

- Look: wild white hair. In the dream: white radiation suit with a trefoil patch and a green collar, a remote with a long antenna. In 1931: wide straw hat with a dark band, mustard tweed jacket, red waistcoat, blue patterned tie, wedding ring.
- Says he wants out of the cell. Underneath he refuses the easy way out: leaving 1931 would leave the town believing the lie about «Карл Саган».
- Ends free on the road out of town, as Marty's hand starts to fade.

**Эмметт** (change-positive arc).

- Look: very tall and thin, long neck, big ears, freckles, light grey eyes, chestnut hair in a high quiff; teal argyle sweater vest, white shirt, green bow tie, beige pinstripe trousers. At night in the workshop, an apron.
- Says he is a lawyer and science does not interest him. Underneath he wants nothing else, and only the man who answers his Ivanov problem is allowed to see it.
- Cornered, he walks his loop between the courthouse and the law office.
- Ends having quit his clerk's job, with the drill gone to a friend of a man he will never see again.

**Кид Таннен** (antagonist).

- Look: stocky, square jaw, slick black hair, a thin moustache; purple-blue double-breasted pinstripe suit with gold buttons, white shirt, red tie, dark purple fedora, a revolver.
- Says he wants the arsonist of his bar to pay. Underneath he wants Artie silent and the town afraid.
- Ends in a manure truck, continuing the Tannen family tradition.

**Эдна, 1931** (ally who is also the press).

- Look: black hair with a victory roll and a chin-length bob, green eyes, arched brows, red lips, pearl earrings; periwinkle jacket with a high navy collar, navy scarf with a gold pin, grey knitted waistcoat, ankle-length navy skirt; notebook and pencil, a pale pink bicycle with a wicker basket.
- Says she wants the law obeyed. Underneath she admires «Карл Саган», the stranger who did what the law could not.
- Ends delivering «soup» to her own temperance meeting at the Browns'.

**Эдна, 1986** (gatekeeper).

- Look: white hair in a bun, blue eyes, purple drop earrings, salmon cardigan with a white pattern, green patterned skirt, megaphone with a red handle.
- Says she wants the street kept clean of hooligans. Underneath she guards her own past in the papers.
- Ends throwing Marty out, one issue short.

**Арти** (the cost of the summons).

- Look: thin, slick dark brown hair, green eyes; brown plaid waistcoat, cream shirt, green diamond tie, cream fedora with a red band and bow.
- Says he will not come down until his boss allows it. Underneath he wants to be told what to do, and the voice on the tape does exactly that.
- Ends on his way to court, hat on his head.

**Бифф**, **Джордж**, **Биток**, **Спичка**: Biff wears the green «ADODS» track suit, a red turtleneck and Doc's helmet with two beer cans; George has grey hair, a beige jacket and an open red shirt; Cue Ball is bald with heavy cheeks, a newsboy cap, a tan jacket and a white half apron, since he cooks the soup here; Matches is tall and thin in a grey herringbone three-piece with a sage hat and a matchstick.

## Scene cards and puzzle chain

Flags are in `g.f`; per-visit state (timers, the fuel game) lives in `g.vt` or in the mode object.

| Scene | Start state | Change | End state |
| --- | --- | --- | --- |
| Mall, camcorder | Doc's experiment in the camcorder frame | The DeLorean with Einstein vanishes | `introDone` |
| Mall, Doc | 1:21, the car has not come back | Any lines; two film quotes in a row give Doc's déjà vu line | `dejaMarty` |
| Mall, van | Doc asks for his notebook | The orange toolbox | `notebookToDoc`, nightmare, bedroom, chapter 1 |
| Lab | George runs the sale | Look at the 1955 model in the back room; Biff takes the courthouse and sees the notebook | `modelSeen`, `biffHasCourt` |
| Lab, box | George brings a box | The yellow guitar | item `guitar`, `boxOut` |
| Lab, amp | Biff in the chair by the speaker | Guitar into the amp: Biff tries, George protects Marty | `biffTried` |
| Lab, George | | «Я сам за себя постою, пап» | `georgeBack` |
| Lab, dials | | Overdrive at maximum (free order with the two above) | `ampMax` |
| Lab, amp | | The guitar again: Biff grabs it, strums and flies | `biffBlasted` |
| Lab, court | The courthouse on the floor | Take the notebook | item `notebook`, `notebookGot` |
| Yard | 18:04, a flash | The DeLorean in frost, Einstein at the wheel | `carSeen` |
| Car | Black recorder, «МАРТИ!!!» | Doc's tape; LAST TIME DEPARTED shows eights | item `recorder`, `tapeHeard` |
| Car | A woman's shoe | Take it, give it to Einstein | item `shoe`, `trail`, skate cutscene |
| Street 1986 | Edna shouts from the window | Talk to the window, buzz with the shoe | `ednaIn` |
| Edna's flat | Edna in her chair | The shoe beside its old pair; the fire and the bar on the square | `knowFire`, `knowPlace` |
| Edna's flat | Binoculars | Video Valley, «ПЕРЕСТРОЕНО В ФЕВРАЛЕ 1932» | `year1931` |
| Edna's flat | Edna guards the papers | The radiator valve hisses like her kettle; the papers while she is out | item `paper`, `dateKnown`, back in the yard |
| Yard, prep | Jeans | 1930s clothes from the sale table; George asks about the costume | `dressed` |
| Yard | «Мистер Фьюжн» empty | Biff's can | `fusion` |
| Car | Circuits off | Switch, then type JUN 13 1931 | `circuitsOn`, `arrived`, highway and arrival cutscenes |
| Square | Young Edna with her paper | Interview; pick a name: Майкл Корлеоне, Гарри Каллахан or Сонни Крокетт | `alias` |
| Square, cell window | Doc behind bars | The rocket drill, the Browns' number, the «new» DeLorean | item `number`, `docMet`, `docCar` |
| Kitchen | First visit | Kid humiliates Artie and takes his hat | `kidSeen`, `kidHasHat` |
| Kitchen, phone | | The number: Hampton says the young master is at the court | `butler` |
| Square, courthouse | | Emmett runs out: «Я юрист» | `emmettMet` |
| Square, Emmett | Emmett mutters on his loop | Record him | `mutter` |
| Square, cell window | | Play the tape: the Hamiltonian | `hamilton` |
| Square, Emmett | | «H это оператор Гамильтона!», the patent office lie, «Он нужен сегодня!» | `patent`, `emmettHelps`, item `subpoena` |
| Square, Edna | Edna with her bicycle | Soup for the orphans, the temperance society needs a room | `ednaSociety`, `ednaSoup` |
| Kitchen | Matches rolls barrels | Stand out of Cue Ball's sight; he signals on the pipe and the lift takes the barrels | `barrels`, `signal` |
| Kitchen, door | Kitchen door blocked | Emmett wedges the tables | `wedge` |
| Kitchen, Cue Ball | | Ask for soup and advise a spice; he goes to the stove | `g.vt.cooking` |
| Kitchen, pipe | | Hit the pipe while he cooks: the barrels roll onto the charity table, Edna takes one | `hooch`, `ednaHooch` |
| Square, Edna | | The soup is for the temperance society; Emmett gives in | `hoochSent` |
| Square, Kid | Matches shines Kid's shoes | Distract Kid, grab Artie's hat | item `hat`, `hatTaken` |
| Square, park | | The hat to Einstein: he leads to No. 10 | `arthurFound` |
| Artie's street | Buzzer | Artie refuses to come down | `arthurRefused` |
| Square, Kid | | The chase and the climb onto the bandstand | `kidMet` |
| Bandstand | Kid shouts up | Record him; Einstein distracts the gangsters | `kidTaped` |
| Artie's street | | Play Kid's voice at the window; serve the summons | `arthurOut`, `served`, `hatBack` |
| Workshop | Both goals done | Fuel game; the confession | `fuel`, `fuelClean`, item `drill`, `patent` dialogue |
| Square, night | The drill at the cell wall | It fails, the cell is empty, the paper rewrites itself; Edna saw the wagon leave | `night`, `jailFailed`, `paperV` 2 |
| Square, night | The broken drill | The rocket on Edna's bike | `rocketBike`, wagon |
| Wagon, right | Tool box, antenna | Crowbar, antenna | items `iron`, `antenna` |
| Wagon, left | Spare wheel, driver's window | Crowbar on the hubcap; the antenna does not reach the keys yet | item `hubcap` |
| Wagon, back | Doc at the window | «Мне нужно, чтобы ты его отвлёк!» | `distract` |
| Wagon, left | Keys slide closer | Antenna on the keys | item `keys`, `keysGot` |
| Wagon, back | Locked doors | Keys, then the hubcap into Kid's gun, then the gun on Doc's chains | `doorsOpen`, `gunDown`, `docFree` |
| Wagon, back | | «Газу!»: the manure truck, the billboard, the fading hand, «Продолжение следует» | `ending`, credits |

The 64 cards of the plan are covered; optional content: the film quotes in the prologue, Marshal Strickland's photo and the other photos in Edna's flat, the law office of «Гейл, Земекис и Файн», Doc's story of the «new» DeLorean, Jules and Verne, a clean fuel run, Edna's shouts from the window, and seven old headlines in her archive (they cycle on look, `headI`).

**Adaptations.**

| No. | Original | Here | Why |
| --- | --- | --- | --- |
| A1 | Direct control, running | Smart cursor; double click runs and leaves at once | Interface of the era |
| A2 | 3D cameras | Fixed screens and scrolling panoramas | 2D art |
| A3 | Emmett walks and has to be caught | He walks a loop; a click on him stops him; he mutters at two points of the loop | No chasing a moving target |
| A4 | Marty hits the pipe with the recorder by himself | The player hits the pipe | The action is visible |
| A5 | The date is entered automatically | The player types it: the paper is dated 14 June, the killing happened «прошлой ночью» | The paper is the key to the trip |
| A6 | Fuel game in the 3D scene | Its own screen | Large stations, readable signals |
| A7 | Wagon with fixed points | Three sides and the driver's window, no timers | Same order of actions |
| A8 | Bandstand roof in 3D | A view of the roof | A place where Kid shouts into the recorder |
| A9 | Cue Ball's signal fired unreliably | Fires when Marty is out of his sight and the barrels are in place | No softlocks |
| A10 | Clothes and «Мистер Фьюжн» in a cutscene | Two actions in the yard | Preparation in the player's hands; the sources do not say where the clothes came from |

**Goals and hints.** Fourteen goals with up to four hints each, in Marty's voice, from «where to look» to the exact action: «Принести Доку блокнот», «Найти в лаборатории опасные вещи», «Вернуть у Биффа блокнот», «Найти Дока», «Узнать, когда Док», «Отправиться за Доком», «Найти Дока в 1931 году», «Позвонить Браунам», «Найти юного Эмметта», «Уговорить Эмметта помочь», «Спирт для бура», «Повестка для Арти», «Приготовить топливо», «Спасти Дока».

**Fuel game.** Four stations: bellows (fire), the valve on the gas bladder (pressure), the bacteria tank (food) and the generator wheel (current). Signal words: гореть, огонь, жар for the bellows; давить, пар, выпустить for the valve; грызть, есть, еда for the food; крутить, молния, ток for the wheel. The readiness bar marks 25, 50 and 75 %; each round is faster. From round three the judge stresses words too, and hitting his station is a mistake.

**Threads for later episodes.** The save keeps what later episodes would need: the summons (Artie will be killed for testifying and George will start fading from the photo), Edna's shoe and her admiration for «Карл Саган» (she set the bar on fire), Doc's notebook, the guitar and George's photo stay in the pockets; the crowbar is lost on the road.

## Subtext of the key conversations

- **Doc at the cell window.** He jokes about the bars and the brick that hit him, and every way out he mentions points at his younger self: the drill patent, the family phone number, the problem that tormented him all summer.
- **Emmett at the courthouse.** He denies science in every answer and gives himself away in the same breath: he knows exactly how far sound carries to the courtroom.
- **Young Edna's interview.** She accepts every answer and writes it down. The question itself, praise for a stranger who did «what the law could not», is the only hint of what she did herself.
- **Kid at the shoeshine chair.** He is generous with what he took from Artie, the hat is now his peanut bowl, and he loses it to the oldest trick there is.
- **The quarrel in the workshop.** Emmett's signal words are the things he has never said to his father. When the bar fills, he says the last one.
- **The confession.** Marty can keep the lie or own up; the drill comes either way, so the confession buys nothing. Emmett answers it with a loan and advice about the throttle, and never says he forgives.
- **The finale.** Marty gives the last command himself; Doc answers «Полный вперёд!», and the conversation ends on a hand that is no longer quite there.

## Engine and module layout

The Sam & Max core was generalised in stage 1 so that both games share it: per-game palette (`S.makePalette`, `S.usePalette`, `S.PAL0`), screen size, player and buddy per instance, the renderer's size, palette, font and wrap width per instance, `S.fontFrom`, and the registries `S.SFX` and `S.STYLES`. Sam & Max defaults are unchanged; render hashes of every room and title of all Sam & Max episodes match the baseline before and after the change. Back to the Future subclasses `S.Game` and `S.Renderer` and has its own UI class.

| File (`js/apps/bttf/`) | Owns |
| --- | --- |
| `bt-palette.js` | The 256-colour palette: skin, fabrics of 1986 and 1931, brick, wood, chrome, night, fire, neon, display LEDs |
| `bt-font.js` | 14 px pixel font (Cyrillic, Latin, digits, guillemets) |
| `bt-grey.js` | Flat greybox helpers used by the early stages and the tests |
| `bt-bg86.js` | Backgrounds of 1985–1986 (mall, lab, back room, yard, DeLorean inside and out, street, Edna's flat, binocular view) and the shared painters `dfill`, `light`, `part`, `clock`, `pine`, `bricks`, `sash`, `neon`, `signText` |
| `bt-bg31.js` | Backgrounds of 1931 (Artie's street, square day and night, soup kitchen, bandstand roof, workshop, drill, the wagon and the road) |
| `bt-rig.js` | Jointed figure: three views, eight-phase walk, poses (`reach`, `guitar`, `sit`, `hold`, `horn`, `hips`), ear scale `earK`, pinstripes `pin`, per-look skin |
| `bt-sprites86.js`, `bt-sprites31.js` | Characters of 1985–1986 and 1931 on the rig, Einstein |
| `bt-portraits.js` | Hand-built 100×112 busts with three mouth shapes, blinking and expressions; variants `doc85`/`doc31` by chapter, `artieHat`, `marty31` |
| `bt-icons.js` | Item icons and cursors |
| `bt-game.js` | `BTTF.Game` (smart cursor, pockets, dialogue panel, wrong-item lines) and `BTTF.Renderer` |
| `bt-games.js` | Modes run through `B.games.play`: date cards, documents (newspaper in three versions, notebook, photo), time circuits, fuel |
| `bt-closeups.js` | Cutscene engine `B.cine` and every cutscene, the title and credits art |
| `bt-story.js` | Descriptor `BTTF.EP1`: actors, colours, items, generic and wrong-item lines, goals and hints, chapters and the recap, alias, newspaper versions, `dress`, new game |
| `bt-audio.js` | Sound effects (`bt_*`) and the score player (`B.score`, 14 patches, drum patterns, chords with sus4 and sus2) |
| `bt-music.js` | Themes: main titles and credits, «Back in Time» for the jukebox, and eleven original themes for the places |
| `bt-room-mall.js` | Prologue, nightmare, waking up |
| `bt-room-lab.js` | Lab and back room |
| `bt-room-yard.js` | Yard, car, tape, shoe, «Мистер Фьюжн», date entry, departure |
| `bt-room-edna.js` | Street 1986 and Edna's flat |
| `bt-room-square.js` | Square day and night, the interview, Doc at the window, Emmett's loop, Kid, the chase, the jailbreak |
| `bt-room-town.js` | Soup kitchen, Artie's street, bandstand roof |
| `bt-room-night.js` | Workshop, confession, the wagon, the finale |
| `bt-ui.js` | Title, pause menu, save and load with thumbnails, settings, hint window, recap, credits, scaling, input |

Saves: `bttf_saves` holds the autosave and slots 1–10 (`{name, chapter, when, gameTime, thumb, state}`; thumbnails are palette indices with run-length compression) and `bttf_settings` the settings. Saving is allowed only in plain room state; the autosave is written on every room change and before the fuel game and the wagon.

Performance: a room frame takes about 1 ms in Edge and a cutscene frame 1–5 ms; a background is painted once (about 50–60 ms) and cached.

## Authoring notes

- Ids are prefixed: costumes `bt_`, sounds `bt_*` mapped by `B.sfxId` in `bt-ui.js`. `S.SFX` is shared and checked before the built-in Sam & Max sounds, so an unprefixed BTTF sound replaces the Sam & Max one on the desktop page.
- `S.chord` of the shared player has no sus4; BTTF uses its own `chordOf`.
- `P.part` needs a ramp; a single palette index such as `C.black` draws nothing (use `C.raven`).
- The engine does not save costumes; `EP.dress` sets clothes and props from flags (Emmett's apron in chapter 6, Artie's hat, Marty's 1931 clothes, Doc by chapter) and runs after every room change and load.
- Sprites that must stand behind furniture are drawn under a layer: the kitchen counter, the wagon body.
- Cutscene frames must not use the shared `rectFill` for full-frame fills; it is slow once other code has deoptimised it. `Cine.render` clears with `f.px.fill`, and moving poles round their x.
- A dialogue option is spoken by Marty automatically, so the answer must not repeat it (the finale answers «Газу!» with «Полный вперёд!»).
- The dialogue panel shows six options; a conversation must never offer more at once.
- Text follows `game-human-style.md`: no em dashes in game text, no «не X, а Y», «X, а не Y» or «Это не X. Это Y» (the test checks all three); every string fits a speech line and uses only characters of the pixel font. Use ’ inside strings, since the test's string scan stops at escaped quotes. The project names Microslop and Win apply.
- Outside the hint window nobody names the next step and Marty does not announce his actions.
- Edits to many strings went through a pairs file applied by a script that demands exactly one match and rejects the style patterns; a replace anchored on a shared snippet hits the first room in the file, so anchor on the room id.
- Music was transcribed from the user's reference recordings (`content/music/`): stems by demucs `htdemucs_ft`, melody by torchcrepe, chords by chroma; the main theme is in A major at 141 bpm, «Back in Time» at 120 bpm. QA compares chroma per beat with the reference.
- Research: fandom pages answer HTTP 402 to direct fetches, but `api.php?action=parse&prop=wikitext` works; GameFAQs answers 403 (the T_Hayes walkthrough is mirrored on Adventure Gamers); presentperfectgaming.com has subtitled screenshots with exact lines, clothes and signs.
- Tour: the helper `T` in `tools/bttf-tour.cjs` finds a clickable point by sampling `g.pick` over the screen, walks towards targets that are off screen, opens the pockets by moving to the bottom edge, and drops a held item with a right click before walking (a left click on the ground with an item in hand only drops it).
