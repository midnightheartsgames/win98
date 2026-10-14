# Скрепыш (Clippit)

The Office 97 assistant who lives on the desktop of this Win 98. He is not an app with a window: he sits in the bottom right corner, reacts to what the player does in the whole system, talks through his yellow balloon and has a story that runs across many sessions. This file is the design bible for the character and the map of every place in the project where he is wired in.

- Code: `js/apps/clippy.js` (body, balloon, animations, app and site reactions), `clippy-talk.js` (dialogue nodes and the story), `clippy-options.js` (settings, the Office Assistant dialog, registry and msconfig), `clippy-help.js` («Что вы хотите сделать?»), `clippy-tips.js` (light bulb tips), `clippy-letters.js` (letters, Outlook mail, the diary), `clippy-actors.js` (the other assistants, the Actors folder, Rocky's visit), `clippy-system.js` (Task Manager, ICQ, Steam, Recycle Bin, shutdown, calendar), `clippy-wardrobe.js` and `clippy-site.js` (www.clippy98.com).
- Styles: `css/apps/clippy.css`, `css/apps/clippy-site.css`.
- Tests: `node tests/clippy.test.js`, `node tests/clippy-talk.test.js`, `node tests/clippy-site.test.js` (all in `npm test`).

## Character

**Who he is.** A steel paperclip, 0.9 mm wire, three bends, two big eyes and heavy brows. Born with Office 97 on 19 November 1996 in Redmond. Chosen from 250 sketches. His job is to notice what the user is doing and offer help, and he is famous for doing it at the wrong moment.

**Voice.** Short sentences. Always the polite plural «вы», so his lines never need the user's gender. Office and system metaphors: drivers, registry, autostart, tray. The tic «Похоже, вы...». When a topic hurts, he changes the subject to «Ctrl+S». He corrects himself in threes («То есть... То есть...»). He never explains the theme out loud; he acts it out.

**Want and need.** He wants to help, which to him means being clicked and being useful. He needs to learn that being near is already help, and that a good assistant knows when to stay quiet.

| Field | Value |
|---|---|
| Arc | change-positive |
| Lie | «Я нужен, только пока подсказываю. Если меня не зовут, меня нет.» |
| Truth | «Быть рядом — уже помощь. Хороший помощник знает, когда промолчать.» |
| Ghost wound | Magazines called him «самая назойливая скрепка в истории». Nine of ten testers hid him in the first five minutes. |
| Fear | Being replaced by Rocky, being «снят с задачи», the empty check box «Показывать помощника». |
| Joy | Being thanked, the user pressing Ctrl+S without a hint, hats, quizzes, music. |

**Quirks.** Knocks on the monitor glass from the inside. Falls asleep when the mouse is still and denies it («я проверял драйверы с закрытыми глазами»). Owes Hoverbot a propeller. Plays network chess with the Genius. Envies Power Pup's cape.

### Cast

The other assistants are «actors»: in Office 97 they live in `C:\Program Files\Microslop Office\Office\Actors` as `.ACT` files.

| Actor | File | Version | Relation to Скрепыш |
|---|---|---|---|
| The Genius | GENIUS.ACT | 97, 2000 | Chess partner by network. Answers everything with «всё относительно». |
| Power Pup | POWERPUP.ACT | 97 | Rival with a cape. Replaced by Rocky in Office 2000; envy turns into sympathy. |
| Hoverbot | HOVER.ACT | 97 | Lent the propeller. Hears everything in the server room; source of the leaks. Replaced by F1. |
| Scribble | SCRIBBLE.ACT | 97 | Paper cat that sleeps on the keyboard with Caps Lock on. Replaced by Links. |
| The Dot | DOT.ACT | 97, 2000 | Bouncing ball. Hats roll off it. |
| Mother Nature | MNATURE.ACT | 97 | Reminds people to switch the monitor off. Becomes Mother Earth. |
| Will | WILL.ACT | 97 | Shakespeare. «Сохранить или не сохранить — вот в чём вопрос.» Leaves after 97. |
| Office Logo | LOGO.ACT | 97, 2000 | Coloured shapes. Nobody knows what it thinks. |
| Merlin | — | Agent, 2000 | Gave Скрепыш the wizard hat. |
| Rocky | ROCKY.ACS | 2000 | The new dog. Feared as a replacement, turns out just as scared. |

Outside the Office family: Neko, the desktop cat (Скрепыш takes it for Scribble), Dima the webmaster (his guest book), Bill Gates (a distant boss who sends mail), and the user, whom he calls «мой любимый пользователь» once affinity is high.

## World

The setting is one home computer in 1998 and the fake internet around it. Every place in the system means something to him:

| Place | What it is for him |
|---|---|
| Bottom right corner of the desktop | Home. He comes back here after the player drags him away. |
| The tray | Retreat and exile. «Буду в трее» is how he says goodbye. |
| `C:\Program Files\Microslop Office\Office\Actors` | The dormitory of all assistants, and the place where he keeps his diary. |
| `HKEY_CURRENT_USER\Software\Microslop\Office\8.0\Common\Assistant` | His settings, which he calls his soul. Edits made in Regedit take effect after a restart. |
| Autostart (msconfig) | «Там хранится всё самое важное.» |
| Task Manager | Where programs are «сняты с задачи». He is `clippy.exe` there. |
| Outlook Express | Corporate mail from Redmond: memos about Office 2000 and Office XP. |
| ICQ | His private line, UIN 199898. |
| www.clippy98.com | The fan club and wardrobe. |
| www.microslop.com | Head office. |

**Factions.** Microslop Corp. with the Office team, the Assistants Department (memos) and the Office usability group, which is the antagonist as an institution. The Actors, who share one folder. The fan club.

**Timeline.** 19.11.1996 Office 97 is finished (his birthday). 25.06.1998 Win 98. 1998 is now. 1999 Office 2000 brings Rocky, F1, Links, Merlin, Mother Earth; Скрепыш stays the default. 2001 Office XP: the assistant is off by default.

## Theme

- **Premise.** Help turns into care when the helper learns to respect the user's quiet.
- **Counter-premise.** An assistant is worth something only while he is useful; what is not needed is switched off.
- **Antagonist.** The Office usability group. It never appears on screen, only in memos with numbers, and its numbers are right: users did hide him. It wins the policy (Office XP turns him off by default). Скрепыш wins the relationship.
- **Dramatised through mechanics, not speeches.** The check box «Показывать помощника» in the Office Assistant dialog, the ClippyOffice line in msconfig and «Снять задачу» in Task Manager are three ways to make him leave: kind, administrative and cold. The light bulb is restraint as a mechanic: he holds his tip until the player asks for it. In chapter 8 he chooses that restraint himself.

### Motifs

| Motif | Planted | Varied | Paid off |
|---|---|---|---|
| Ctrl+S, saving | Tips, his deflection under stress | «Сохраню этот момент», the registry value, the diary as his saved moments | The letter ends «И сохраняйтесь». Every save plays the floppy animation; after chapter 5 every fifth save gets a quiet thank-you. |
| The letter | «Похоже, вы пишете письмо?» | Corporate memos in Outlook, the friend's résumé, the letter to Power Pup | He writes his own letter instead of helping with someone else's. |
| Tray and check box | Hiding to the tray | «Галочка будет пустой» (chapter 4), msconfig autostart | Chapter 9: the player holds the real check box. |
| Glass | He knocks from inside the monitor | «Кто стучит по стеклу изнутри?» | Killed from Task Manager he does not knock any more; he just disappears. |

## Interaction design

**Target feelings (MDA):** fellowship first, then discovery (finding his reactions everywhere), expression (wardrobe) and narrative. Never chore: every interruption either carries something useful or can be turned off.

**Player verbs.** Click (talk), drag (he swings and snaps to a window title), right click (menu), ask (type a question), choose lines, dress, play (quiz, riddles, rock-paper-scissors), write letters with him, hide, disable, kill.

**His verbs.** React, hold a tip under the light bulb, guard (boss key), help (open things, fill in letters, answer questions), remember (affinity, diary), write (letters, mail), message (ICQ).

**Loops.**
- Seconds: eyes follow the cursor, he blinks, does small idle animations, swings while dragged, answers every poke.
- Minutes: reactions to programs, games and sites; the light bulb collects tips; mini games; wardrobe downloads; the boss key.
- Sessions: affinity tiers, story chapters, the wardrobe collection, the crown, the diary, holidays.

**Affinity** (−10…20) is the only currency. Faucets: kind answers, quiz and rock-paper-scissors wins, saving files. Sinks: poking him seven times, hiding him, killing him in Task Manager, cold answers. Tiers: cold below −2, neutral, warm from 5, friend from 12.

**Chattiness.** Quiet, normal or complete chaos, plus separate switches in the Office Assistant dialog: program comments, site comments, letter help, sounds, F1, moving out of the way, tip of the day, and how tips appear (light bulb or balloon). All settings persist and are mirrored into the registry.

## Story

Chapters open in the hub («Поговорить») once the talk count and affinity are high enough. From chapter 6 on each chapter also needs a new session, so the second act spreads over several days. When a chapter is ready, a small envelope appears on his tray icon: the «письмо в трее» he keeps telling the player to ignore.

| # | Chapter | Opens | What happens |
|---|---|---|---|
| 1 | Рассылка | 2 talks | A memo about Rocky. He pretends it is nothing. The memo arrives in Outlook. |
| 2 | Резюме | 4 talks, affinity 2 | He asks for help with a résumé «for a friend». |
| 3 | Выбор | 6 talks, affinity 4 | «Кого бы вы выбрали: меня или собаку?» The answer is written to the registry. Hoverbot forwards the Office XP draft. |
| 4 | Признание | 8 talks, affinity 6 | Office XP will switch assistants off. The player may promise not to. |
| 5 | Письмо | 10 talks, affinity 6 | He writes his own letter to the player (`Письмо от Скрепыша.txt`). |
| 6 | Состав | 12 talks, affinity 6, new session | The final Office 2000 list: he stays, Rocky replaces Power Pup. Envy turns into sympathy; he writes to Power Pup. |
| 7 | Гость | 14 talks, affinity 6, new session | Rocky visits the desktop. He is scared too. Скрепыш gives him his first tip. |
| 8 | Тише | 16 talks, affinity 6, new session | He counts his own comments and offers to stay quiet and use the light bulb. |
| 9 | Office XP | 18 talks, affinity 4, new session | The usability report arrives. The player keeps or clears the check box. Either ending is kind. |

Side scenes: first meeting and tour, greetings by time of day and absence, poke escalation and sulking, hide negotiation, return after a kill (three variants), return after autostart was disabled, registry tampering, holidays (his birthday 19.11, Win 98 day 25.06, programmer's day, New Year, 1 April), colleagues gossip, rock-paper-scissors, riddles, the quiz.

## Integration map

| Where | What he does | Hook |
|---|---|---|
| Desktop and tray | Lives in the corner, flies into the tray icon and back, envelope and bulb badges on the tray icon | `clippy.js`, tray icon from `taskbar.js` |
| F1 on the desktop | Opens «Что вы хотите сделать?» | `main.js` |
| Any window | Reactions to 60+ programs and games, boss key for every game window, moves out of the way of input fields | `winManager.createWindow` wrapper |
| Notepad, WordPad | «Похоже, вы пишете письмо» when the text starts like a letter, the Letter Wizard, joy on save, a gasp on «Нет» to saving | `notepad.js`, `wordpad.js` |
| Outlook Express | He forwards the Redmond memos to the inbox; a new message gets the Letter Wizard | `appOutlook.schedule`, compose window `.oc-body` |
| ICQ | Contact «Скрепыш», UIN 199898, status mirrors his state, answers questions with his help index | `icq.js` |
| Task Manager | `clippy.exe` in Processes; ending it kills him | `task-manager.js` |
| msconfig | ClippyOffice in Startup is his real autostart switch | `sys-tools.js` |
| Regedit | His settings under `...\Office\8.0\Common\Assistant`, the value `Любимый_помощник` | `clippy-options.js` |
| MS-DOS prompt | `clippy`, `clippy /?`, `clippy /hide`, `clippy вопрос` | `sys-tools.js` |
| Run | `clippy` launches him | `dialogs.js` |
| Explorer | `.ACT` files open the colleague's card, outfit `.ACS` files put the outfit on | `explorer.js`, `desktop.js` |
| Recycle Bin | Notices when his letter or diary is deleted, animation when the bin is emptied | `filesystem.js` |
| Shutdown | Warns about unsaved documents and says goodbye | `shutdown.js` |
| Steam | Congratulates on purchases and offers to start a freshly installed game | `gameManager.addListener` |
| Internet Explorer | Reactions to every site, the fan club and wardrobe | `ie.js` |
| hsr.hoyoverse.com | One line per page kind per session (re-renders of the same address stay silent), state-aware help with the download (Moscow mirror tip, starts it), a note when the installer lands in Downloads (`onHsrDownloaded`), Pom-Pom in the setup wizard (`hsrs_setup`), lines for nine characters, signs the guestbook once as «Скрепыш, Редмонд». «Я сам разберусь» silences him on the site for the session. | `hsrSiteReaction` in `clippy.js`, `hsr-site.js` |
| Neko | Takes the cat for Scribble | `clippy-system.js` |
| Minesweeper, Solitaire | Win and loss reactions | `clippy.js` |
| BSOD, screensaver | Halo and prayer; hides behind the screensaver | `bsod.js`, `screensaver.js` |

## Storage

| Key | Content |
|---|---|
| `win98_clippy_talk` | Story state: affinity, visits, talks, chapter, flags, counters, delivered mail, diary entries |
| `win98_clippy_options` | Office Assistant settings |
| `win98_clippy_tips` | Seen and muted tips, the day of the last tip of the day |
| `win98_clippy_wardrobe` | Owned and worn outfits |
| `win98_clippy_glasses` | The sunglasses from Minesweeper and the quiz |
| `win98_clippy_quiz_best`, `win98_clippy_quiz_aced` | Best quiz round (of 5) and the crown flag. A saved `win98_clippy_quiz_highscore` of 3 from the old three-question quiz counts as aced. |

## Help index

«Что вы хотите сделать?» (F1, the menu, the hub, `clippy вопрос` in MS-DOS) searches 60 hand-written answers in `clippy-help.js` plus every Steam game from `gameManager.catalog` and every IE favourite. An answer is `{ id, q, keys, a, go, label }`; `go` is a function or a string `cmd:<Run command>`, `url:<address>` or `help:<Help topic id>`. `cmd:` goes through `appDialogs.executeRunCommand`, so every Run command works as an answer. Keys are word stems; multi-word keys also match as phrases. Common words (как, где, хочу...) are ignored. The ICQ contact answers with the same index.

## Tips

`clippy-tips.js` watches real behaviour: six or more open windows, three minimised windows within a minute, 400 characters typed since the last save, the first game of the session, eight visited sites, an hour at the computer, a full Recycle Bin, the small hours. Each tip has a cooldown in minutes and can be muted from its balloon. In light bulb mode the tip waits next to him (and on the tray icon); in balloon mode or in chaos it opens at once; in quiet mode only the bulb lights up. The tip of the day goes under the bulb once a day, never on the very first start.

## Verification

- `npm run test:clippy` runs the module tests (`tests/clippy.test.js`: options and registry, help search, tips, letters, mail, Actors folder, Task Manager, ICQ, DOS, holidays, Steam, Recycle Bin, shutdown, chapters 6–9, boss key, quiz round, moving out of the way), the dialogue tests and the fan site tests.
- In the browser: `MP_PAGE=index.html MP_READY='!!(window.winManager && window.appClippy && window.clippyOptions)' node tools/maxpayne-shots.cjs <out dir> <steps.cjs>` drives headless Edge. Steps are `['eval', js]`, `['sleep', ms]`, `['shot', name]`. The desktop needs about 15 s to boot. A fresh profile starts with the first-meeting scene.
